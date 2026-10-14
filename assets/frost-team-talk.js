(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.FROST_MEMBERS_CONFIG||{};
const configured=Boolean(window.supabase)&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl||'')&&/^(sb_publishable_|eyJ)/.test(cfg.supabaseAnonKey||'');
const client=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let me=null,role=null,roster=[],rooms=[],selectedRoom=null;
let roomChannel=null,listChannel=null,pollTimer=null;
const roleLabels={owner:'👑 Owner',coowner:'❄️ Co-Owner',manager:'📋 Managerin',supporter:'🧊 Team-Supporter'};
const node=(tag,cls,content)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(content!==undefined)n.textContent=String(content);
 return n;
};
const notify=(id,text,error=false)=>{
 const el=$(id);el.textContent=text;
 el.className='tt-feedback'+(error?' error':'');
};
const isUUID=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||'').trim());
const onlyFirstName=value=>/^[\p{L}][\p{L}'’-]{1,39}$/u.test(String(value||'').trim());
const asDate=d=>{try{return new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(d));}catch{return '—';}};
const rosterName=id=>{const person=roster.find(r=>r.user_id===id);return person?.display_name||'Team-Mitglied';};
const meetingUrl=room=>{
 if(!/^[a-f0-9]{48}$/.test(room?.meeting_key||''))throw Error('Meetingkennung fehlt');
 return 'https://meet.jit.si/FrostSkatersTeam'+room.meeting_key;
};
function requireMember(){if(!me||!role)throw Error('Nicht für Team freigeschaltet');}
function stopRoomSubscription(){
 if(roomChannel&&client)client.removeChannel(roomChannel);
 roomChannel=null;
}
function stopLive(){
 stopRoomSubscription();
 if(listChannel&&client)client.removeChannel(listChannel);
 listChannel=null;
 if(pollTimer!==null)clearInterval(pollTimer);
 pollTimer=null;
}
function logoutUI(){
 stopLive();me=null;role=null;roster=[];rooms=[];selectedRoom=null;
 $('ttPrivate').hidden=true;$('ttConversation').hidden=true;$('ttOwner').hidden=true;$('ttLogin').hidden=false;
 $('ttMessages').replaceChildren();$('ttRoster').replaceChildren();$('ttRooms').replaceChildren();
 $('ttRoomCount').textContent='0';$('ttActiveCount').textContent='0';$('ttTeamCount').textContent='0';
}
async function loginReady(){
 if(!client)throw Error('Die Teamdatenbank ist nicht erreichbar');
 const {data:userData,error:userError}=await client.auth.getUser();
 if(userError||!userData?.user)throw Error('Bitte melde dich erneut an');
 const {data:newRole,error:roleError}=await client.rpc('frost_team_my_role');
 if(roleError)throw roleError;
 if(!['owner','coowner','manager','supporter'].includes(newRole)){
  await client.auth.signOut();
  throw Error('Dein Konto wurde noch nicht vom Owner für die Team Lounge freigeschaltet');
 }
 me=userData.user;role=newRole;
 $('ttLogin').hidden=true;$('ttPrivate').hidden=false;
 $('ttOwner').hidden=role!=='owner';
 $('ttWho').textContent=(roleLabels[role]||role)+' · '+(me.email||'Teamkonto');
 await loadAll();
 startLive();
}
$('ttLoginForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client){notify('ttLoginFeedback','Die Verbindung zur Datenbank fehlt.',true);return;}
 const button=$('ttLoginButton');button.disabled=true;
 notify('ttLoginFeedback','Prüfe deinen Team-Zugang …');
 try{
  const {error}=await client.auth.signInWithPassword({email:$('ttEmail').value.trim(),password:$('ttPassword').value});
  $('ttPassword').value='';
  if(error)throw error;
  await loginReady();
  notify('ttLoginFeedback','');
 }catch(e){
  console.warn('Team login failed',e);
  notify('ttLoginFeedback',e.message==='Dein Konto wurde noch nicht vom Owner für die Team Lounge freigeschaltet'?e.message:'Login nicht möglich. Bitte Zugangsdaten, E-Mail-Bestätigung und Team-Freigabe prüfen.',true);
 }finally{button.disabled=false;}
});
$('ttSignupForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client){notify('ttSignupFeedback','Die Registrierung ist derzeit nicht erreichbar.',true);return;}
 const pass=$('ttSignupPassword').value;
 if(pass.length<12||pass!==$('ttSignupPassword2').value){
  notify('ttSignupFeedback','Die Passwörter müssen übereinstimmen und mindestens 12 Zeichen haben.',true);return;
 }
 const button=$('ttSignupButton');button.disabled=true;
 try{
  const {data,error}=await client.auth.signUp({
   email:$('ttSignupEmail').value.trim(),password:pass,
   options:{emailRedirectTo:new URL('team-talk.html',location.href).href}
  });
  if(error)throw error;
  $('ttSignupPassword').value='';$('ttSignupPassword2').value='';
  if(data.session)await client.auth.signOut();
  notify('ttSignupFeedback','Konto angefragt. Bestätige die E-Mail, falls du eine Bestätigungsnachricht bekommst. Deine Benutzer-ID für den Owner:\n'+(data.user?.id||'Bitte nach dem Login erfragen')+'\nTeile nur die ID, niemals das Passwort.');
 }catch(error){
  console.warn('Team signup failed',error);
  notify('ttSignupFeedback','Registrierung nicht möglich. Bitte kontrolliere deine Angaben oder probiere es später.',true);
 }finally{button.disabled=false;}
});
$('ttLogout').addEventListener('click',async()=>{
 if(client)try{await client.auth.signOut();}catch{}
 logoutUI();
 notify('ttLoginFeedback','Du bist abgemeldet.');
});
async function loadAll(){
 requireMember();
 const jobs=[loadRooms(),loadRoster()];
 if(role==='owner')jobs.push(loadOwnerStaff());
 const results=await Promise.allSettled(jobs);
 const failures=results.filter(r=>r.status==='rejected');
 if(failures.length)console.warn('Team lounge refresh failed',failures);
 notify('ttDashboardFeedback',failures.length?'Einige Inhalte konnten nicht geladen werden. Bitte aktualisieren.':'',Boolean(failures.length));
}
$('ttRefresh').addEventListener('click',loadAll);
function startLive(){
 stopLive();
 if(!client||!me)return;
 listChannel=client.channel('frost-team-room-updates').on('postgres_changes',
  {event:'*',schema:'public',table:'frost_team_rooms'},()=>{if(me)loadRooms().catch(console.warn);}
 ).subscribe();
 let intervalCount=0;
 pollTimer=setInterval(async()=>{
  if(!me||document.hidden)return;
  intervalCount++;
  if(intervalCount%3===0){
   try{
    const {data:currentRole,error}=await client.rpc('frost_team_my_role');
    if(!error&&currentRole!==role){
     await client.auth.signOut();logoutUI();
     notify('ttLoginFeedback','Dein Team-Zugang wurde geändert oder entfernt. Bitte melde dich erneut an.',true);
     return;
    }
   }catch(e){console.warn('Team role refresh',e);}
  }
  if(!me)return;
  loadRooms().catch(console.warn);
  if(selectedRoom)loadMessages().catch(console.warn);
 },20000);
}
async function loadRoster(){
 requireMember();
 const {data,error}=await client.rpc('frost_team_roster');
 if(error)throw error;roster=Array.isArray(data)?data:[];
 $('ttTeamCount').textContent=String(roster.length);
 const target=$('ttRoster');target.replaceChildren();
 if(!roster.length){target.append(node('p','tt-hint','Noch keine weiteren Teammitglieder.'));return;}
 const priority={owner:0,coowner:1,manager:2,supporter:3};
 const people=[...roster].sort((a,b)=>(priority[a.role]??9)-(priority[b.role]??9)||a.display_name.localeCompare(b.display_name,'de'));
 for(const person of people){
  const item=node('div','tt-roster-item'),avatar=node('div','tt-avatar',(person.display_name||'T').slice(0,1).toUpperCase());
  const label=node('div');label.append(node('strong','',person.display_name),node('small','',roleLabels[person.role]||person.role));
  item.append(avatar,label);target.append(item);
 }
 if(selectedRoom)renderMessages();
}
async function loadRooms(){
 requireMember();
 const {data,error}=await client.from('frost_team_rooms')
  .select('id,topic,agenda,meeting_key,created_by,created_at,active')
  .order('created_at',{ascending:false}).limit(100);
 if(error)throw error;
 rooms=data||[];
 $('ttRoomCount').textContent=String(rooms.length);
 $('ttActiveCount').textContent=String(rooms.filter(x=>x.active).length);
 renderRooms();
 if(selectedRoom){
  const fresh=rooms.find(x=>x.id===selectedRoom.id);
  if(!fresh){stopRoomSubscription();selectedRoom=null;$('ttConversation').hidden=true;}
  else{selectedRoom=fresh;syncSelectedRoom();}
 }
}
function action(text,run,variant='tt-outline'){
 const b=node('button','tt-button '+variant,text);b.type='button';b.addEventListener('click',run);return b;
}
function renderRooms(){
 const target=$('ttRooms');target.replaceChildren();
 if(!rooms.length){target.append(node('p','tt-hint','Noch keine Räume vorhanden. Legt euren ersten Raum oben an!'));return;}
 for(const room of rooms){
  const card=node('article','tt-room-card');
  card.append(node('span','tt-chip'+(room.active?'':' archived'),room.active?'● Offen':'✓ Archiviert'),node('h3','',room.topic));
  if(room.agenda)card.append(node('p','',room.agenda));
  card.append(node('div','tt-room-meta','Erstellt '+asDate(room.created_at)+' · '+rosterName(room.created_by)));
  const actions=node('div','tt-room-actions');
  actions.append(action('💬 Chat öffnen',()=>selectRoom(room),'tt-primary'));
  if(room.active)actions.append(action('🎙️ Meeting starten',()=>launchMeeting(room),'tt-outline'));
  card.append(actions);target.append(card);
 }
}
$('ttNewRoomForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!me)return;
 const topic=$('ttTopic').value.trim(),agenda=$('ttAgenda').value.trim();
 if(topic.length<3||topic.length>100||agenda.length>500){
  notify('ttCreateFeedback','Bitte gib einen kurzen Titel mit 3 bis 100 Zeichen ein.',true);return;
 }
 const button=$('ttNewRoomButton');button.disabled=true;
 try{
  const {data,error}=await client.from('frost_team_rooms')
   .insert({topic,agenda,created_by:me.id}).select('id,topic,agenda,meeting_key,created_by,created_at,active').single();
  if(error)throw error;
  $('ttNewRoomForm').reset();notify('ttCreateFeedback','Neuer Teamraum wurde angelegt!');
  await loadRooms();await selectRoom(data);
 }catch(err){console.warn('Create room failed',err);notify('ttCreateFeedback','Raum konnte nicht angelegt werden. Bitte versuche es später.',true);}
 finally{button.disabled=false;}
});
function syncSelectedRoom(){
 if(!selectedRoom)return;
 $('ttOpenTopic').textContent=selectedRoom.topic;
 $('ttOpenAgenda').textContent=selectedRoom.agenda||'';
 $('ttArchiveRoom').hidden=!(selectedRoom.active&&(role==='owner'||selectedRoom.created_by===me?.id));
 $('ttDeleteRoom').hidden=role!=='owner';
 $('ttVideoButton').disabled=!selectedRoom.active;
 $('ttCopyMeet').disabled=!selectedRoom.active;
 $('ttMessage').disabled=!selectedRoom.active;
 $('ttSend').disabled=!selectedRoom.active;
 $('ttMessage').placeholder=selectedRoom.active?'Nachricht ans Team schreiben …':'Dieser Raum ist archiviert. Der Chat bleibt lesbar.';
}
async function selectRoom(room){
 if(!me)return;
 stopRoomSubscription();
 selectedRoom=room;$('ttConversation').hidden=false;
 syncSelectedRoom();
 notify('ttMeetingNotice',room.active?'Für den Audio-/Video-Anruf öffnet sich Jitsi in einem neuen Tab.':'Dieser Raum ist archiviert.');
 $('ttMessages').replaceChildren(node('p','tt-hint','Lade euren privaten Chat …'));
 $('ttConversation').scrollIntoView({behavior:'smooth',block:'start'});
 await loadMessages();
 if(!me||!selectedRoom||!client)return;
 roomChannel=client.channel('frost-team-chat-'+room.id)
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'frost_team_messages',filter:'room_id=eq.'+room.id},
    ()=>{if(me&&selectedRoom?.id===room.id)loadMessages().catch(console.warn);})
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'frost_team_messages',filter:'room_id=eq.'+room.id},
    ()=>{if(me&&selectedRoom?.id===room.id)loadMessages().catch(console.warn);})
  .subscribe();
}
function renderMessages(){
 const target=$('ttMessages');
 const sticky=target.scrollHeight-target.scrollTop-target.clientHeight<90;
 target.replaceChildren();
 if(!Array.isArray(lastMessages)||!lastMessages.length){
  target.append(node('p','tt-hint','Hier beginnt eure Unterhaltung. Schreib die erste Nachricht!'));
  return;
 }
 for(const message of lastMessages){
  const mine=message.sender_id===me?.id;
  const bubble=node('article','tt-bubble'+(mine?' me':''));
  const bar=node('div','tt-bubble-head');
  bar.append(node('strong','',mine?'Du':rosterName(message.sender_id)),node('small','',asDate(message.created_at)));
  if(mine||role==='owner'){
   bar.append(action('Entfernen',async()=>{
    if(!window.confirm('Diese Nachricht aus dem Teamchat löschen?'))return;
    const {error}=await client.from('frost_team_messages').delete().eq('id',message.id);
    if(error){notify('ttMessageFeedback','Nachricht konnte nicht gelöscht werden.',true);return;}
    await loadMessages();
   },'tt-muted'));
  }
  bubble.append(bar,node('p','',message.body));target.append(bubble);
 }
 if(sticky)target.scrollTop=target.scrollHeight;
}
let lastMessages=[];
async function loadMessages(){
 if(!selectedRoom||!me||!client)return;
 const activeId=selectedRoom.id;
 const {data,error}=await client.from('frost_team_messages')
  .select('id,room_id,sender_id,body,created_at').eq('room_id',activeId).order('created_at',{ascending:false}).limit(150);
 if(error)throw error;
 if(!selectedRoom||selectedRoom.id!==activeId)return;
 lastMessages=(data||[]).reverse();renderMessages();
}
$('ttCloseRoomView').addEventListener('click',()=>{
 stopRoomSubscription();selectedRoom=null;lastMessages=[];
 $('ttConversation').hidden=true;$('ttRoomsArea').scrollIntoView({behavior:'smooth'});
});
$('ttMessageForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!me||!selectedRoom?.active)return;
 const body=$('ttMessage').value.trim();
 if(body.length<1||body.length>1000){notify('ttMessageFeedback','Nachrichten dürfen maximal 1.000 Zeichen lang sein.',true);return;}
 const button=$('ttSend');button.disabled=true;
 try{
  const {error}=await client.from('frost_team_messages').insert({room_id:selectedRoom.id,sender_id:me.id,body});
  if(error)throw error;
  $('ttMessage').value='';notify('ttMessageFeedback','');
  await loadMessages();
 }catch(error){console.warn('Message send',error);notify('ttMessageFeedback','Nachricht konnte nicht verschickt werden.',true);}
 finally{button.disabled=false;}
});
function launchMeeting(room){
 if(!me||!room.active)return;
 try{
  const url=meetingUrl(room);
  const tab=window.open(url,'_blank','noopener,noreferrer');
  if(!tab)notify('ttMeetingNotice','Bitte Pop-ups erlauben oder den Meeting-Link über „Kopieren“ öffnen.',true);
  else notify('ttMeetingNotice','Jitsi wurde geöffnet. Die Person, die das Meeting startet, muss sich dort ggf. anmelden. Bitte im Jitsi-Meeting die Lobby einschalten.');
 }catch(e){notify('ttMeetingNotice','Der Meeting-Link ist gerade ungültig.',true);}
}
$('ttVideoButton').addEventListener('click',()=>{if(selectedRoom)launchMeeting(selectedRoom);});
$('ttCopyMeet').addEventListener('click',async()=>{
 if(!selectedRoom?.active)return;
 const url=meetingUrl(selectedRoom);
 try{await navigator.clipboard.writeText(url);notify('ttMeetingNotice','Meeting-Link kopiert! Bitte nur an das Team schicken und in Jitsi die Lobby aktivieren.');}
 catch{notify('ttMeetingNotice','Hier ist der Meeting-Link:\n'+url);}
});
$('ttArchiveRoom').addEventListener('click',async()=>{
 if(!selectedRoom||!selectedRoom.active)return;
 if(!window.confirm('Teamraum archivieren? Das schließt nicht automatisch einen bereits laufenden Jitsi-Anruf.'))return;
 const id=selectedRoom.id;
 const {error}=await client.from('frost_team_rooms').update({active:false}).eq('id',id);
 if(error){notify('ttMeetingNotice','Raum konnte nicht archiviert werden.',true);return;}
 await loadRooms();notify('ttMeetingNotice','Teamraum archiviert. Externe Jitsi-Anrufe bitte zusätzlich selbst beenden.');
});
$('ttDeleteRoom').addEventListener('click',async()=>{
 if(role!=='owner'||!selectedRoom)return;
 if(!window.confirm('Diesen Raum UND alle zugehörigen Chatnachrichten endgültig löschen?'))return;
 const {error}=await client.from('frost_team_rooms').delete().eq('id',selectedRoom.id);
 if(error){notify('ttMeetingNotice','Löschen fehlgeschlagen.',true);return;}
 stopRoomSubscription();selectedRoom=null;$('ttConversation').hidden=true;
 await loadRooms();notify('ttDashboardFeedback','Raum und Chatnachrichten gelöscht.');
});
async function loadOwnerStaff(){
 if(role!=='owner')return;
 const {data,error}=await client.from('frost_hub_staff')
  .select('user_id,role,display_name,added_at').order('added_at',{ascending:false}).limit(120);
 if(error)throw error;
 const list=$('ttStaffList');list.replaceChildren();
 if(!data?.length){list.append(node('p','tt-hint','Du hast noch keine Co-Owner, Managerinnen oder Supporter freigeschaltet.'));return;}
 for(const staff of data){
  const item=node('article','tt-staff-entry'),copy=node('div');
  copy.append(node('strong','',(staff.display_name||'Teammitglied')+' · '+(roleLabels[staff.role]||staff.role)),
    node('small','',staff.user_id));
  item.append(copy,action('Zugang entziehen',async()=>{
   if(!window.confirm('Team-Zugang für '+staff.display_name+' entziehen?'))return;
   const {error}=await client.from('frost_hub_staff').delete().eq('user_id',staff.user_id);
   if(error){notify('ttStaffFeedback','Der Zugang konnte nicht entfernt werden.',true);return;}
   notify('ttStaffFeedback','Team-Zugang entfernt.');
   await Promise.all([loadOwnerStaff(),loadRoster()]);
  },'tt-danger'));
  list.append(item);
 }
}
$('ttStaffForm').addEventListener('submit',async e=>{
 e.preventDefault();if(role!=='owner'||!me)return;
 const user_id=$('ttStaffId').value.trim(),display_name=$('ttStaffName').value.trim(),assignedRole=$('ttStaffRole').value;
 if(!isUUID(user_id)||user_id===me.id||!onlyFirstName(display_name)||!['coowner','manager','supporter'].includes(assignedRole)){
  notify('ttStaffFeedback','Bitte gültige Benutzer-ID, Rolle und nur einen Vornamen eintragen.',true);return;
 }
 const button=$('ttStaffSave');button.disabled=true;
 try{
  const {error}=await client.from('frost_hub_staff')
   .upsert({user_id,display_name,role:assignedRole},{onConflict:'user_id'});
  if(error)throw error;
  $('ttStaffForm').reset();notify('ttStaffFeedback','Teamzugang freigeschaltet! Die Person kann sich jetzt mit ihrem eigenen Passwort anmelden.');
  await Promise.all([loadOwnerStaff(),loadRoster()]);
 }catch(e){console.warn('Staff update failed',e);notify('ttStaffFeedback','Freischaltung fehlgeschlagen. Ist die Benutzer-ID korrekt und der Account registriert?',true);}
 finally{button.disabled=false;}
});
if(!configured)notify('ttLoginFeedback','Die Verbindung zum Frost Skaters Login ist aktuell nicht eingerichtet.',true);
else client.auth.getSession().then(async ({data})=>{
 if(data?.session)try{await loginReady();}catch(e){console.warn('Stored session rejected',e);logoutUI();}
}).catch(()=>{});
})();
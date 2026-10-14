(() => {
'use strict';
const $ = id => document.getElementById(id);
const cfg=window.FROST_MEMBERS_CONFIG||{};
const ready=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl||'') && /^(eyJ|sb_publishable_)/.test(cfg.supabaseAnonKey||'') && Boolean(window.supabase);
const client=ready?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
 auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}
}):null;
const feedback=(id,message,error=false)=>{
  const n=$(id);n.textContent=message;n.className='member-alert'+(error?' error':'');
};
const codeLink=code=>new URL('mitglieder.html?code='+encodeURIComponent(code),location.href).href;
let rows=[];
let signedIn=false;
const savedAccountKey='frost-skaters-owner-email';
function saveOwnerEmail(email){
  const clean=String(email||'').trim();
  if(!clean)return;
  try{localStorage.setItem(savedAccountKey,clean);}catch{}
  showSavedAccount(clean);
}
function showSavedAccount(email){
  const remembered=Boolean(email);
  const emailField=$('ownerEmail'),block=$('ownerEmailBlock');
  $('ownerAccountRemembered').hidden=!remembered;
  block.hidden=remembered;
  emailField.required=!remembered;
  if(remembered)emailField.value=email;
}
let rememberedEmail='';
try{rememberedEmail=localStorage.getItem(savedAccountKey)||'';}catch{}
showSavedAccount(rememberedEmail);
$('changeOwnerEmail').addEventListener('click',()=>{
  try{localStorage.removeItem(savedAccountKey);}catch{}
  $('ownerEmail').value='';
  showSavedAccount('');
  $('ownerEmail').focus();
});

let previewMember=null;
const create=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
function renderLoungeTiles(data){
 const target=$('loungeMemberTiles');target.replaceChildren();
 if(!data.length){target.append(create('div','lounge-empty','Noch keine Einträge. Neue Mitglieder kannst du oben selbst hinzufügen.'));return;}
 const ordered=[...data].sort((a,b)=>{
  const level={approved:0,passive:1,pending:2,rejected:3,revoked:4};
  return (level[a.status]??5)-(level[b.status]??5) || a.display_name.localeCompare(b.display_name,'de');
 });
 for(const r of ordered){
   const card=create('article','lounge-member '+r.status);
   const pill=create('span','member-status-pill '+r.status,safeStatus(r.status));
   card.append(pill,create('h3','',r.display_name),create('p','',r.role+' · '+(r.member_no||'Noch ohne Mitgliedsnummer')),create('p','', 'Seit '+dateFormat(r.created_at)));
   const actions=create('div','member-row-actions');
   if(['approved','passive'].includes(r.status)){
      actions.append(button('🎨 Karte ansehen',()=>openLoungePreview(r)));
      actions.append(button('🔗 Link',()=>copyLink(r.request_code)));
   }else if(r.status==='pending'){
      actions.append(button('✅ Annehmen',()=>updateStatus(r,'approved',true)));
      actions.append(button('⏸ Passiv',()=>updateStatus(r,'passive',true)));
   }
   actions.append(button('🗣 Gespräch',()=>editConversation(r)));
   card.append(actions);
   target.append(card);
 }
}
function openLoungePreview(r){
 if(!signedIn||!['approved','passive'].includes(r.status))return;
 previewMember=r;
 $('loungePreviewName').textContent=r.display_name;
 $('loungePreviewRole').textContent=r.role;
 $('loungePreviewNumber').textContent=r.member_no||memberNumber(r.request_code);
 $('loungePreviewStatus').textContent=r.status==='approved'?'● AKTIV':'● PASSIV';
 $('loungePreviewStatus').style.color=r.status==='approved'?'#83f9cd':'#f6cf8a';
 $('loungePreviewCard').classList.toggle('is-passive',r.status==='passive');
 const qr=$('loungePreviewQr');qr.replaceChildren();
 if(window.QRCode){
   new window.QRCode(qr,{text:codeLink(r.request_code),width:150,height:150,colorDark:'#080c17',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M});
 }else qr.textContent='QR-Code zurzeit nicht verfügbar';
 $('loungePreviewOpen').href=codeLink(r.request_code);
 $('loungePreviewFeedback').textContent='';
 $('loungePreviewDialog').showModal();
}
$('loungePreviewClose').addEventListener('click',()=>$('loungePreviewDialog').close());
$('loungePreviewCopy').addEventListener('click',async()=>{
 if(!previewMember)return;
 try{await navigator.clipboard.writeText(codeLink(previewMember.request_code));feedback('loungePreviewFeedback','Link kopiert. Gib ihn nur dem richtigen Mitglied.');}
 catch{feedback('loungePreviewFeedback','Privater Link: '+codeLink(previewMember.request_code));}
});
async function loadOwnerMailFeed(){
 const target=$('loungeMailFeed');if(!signedIn)return;
 try{
   const {data,error}=await client.from('frost_owner_mail_log').select('member_id,kind,request_id,created_at').order('created_at',{ascending:false}).limit(15);
   if(error)throw error;target.replaceChildren();
   if(!data?.length){target.append(create('p','member-hint','Noch keine automatischen Benachrichtigungen aufgezeichnet.'));return;}
   for(const log of data){
     const person=rows.find(r=>r.id===log.member_id);
     const entry=create('div','lounge-mail-entry');
     const text=create('div');
     text.append(create('strong','',log.kind==='application'?'📥 Neuen Antrag gemeldet':'🪪 Karten-Link an GMX gesendet / beauftragt'));
     text.append(create('small','',(person?person.display_name:'Mitglied nicht mehr vorhanden')+' · '+dateFormat(log.created_at)));
     entry.append(text,create('small','',log.request_id?'An Versanddienst übergeben':'Noch nicht übergeben'));
     target.append(entry);
   }
 }catch(e){console.warn('Mail feed',e);target.replaceChildren(create('p','member-hint','Die Mail-Übersicht konnte gerade nicht geladen werden.')); }
}
const dateFormat=d=>d?new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(new Date(d)):'—';
const safeStatus=s=>({pending:'Offen',approved:'Aktiv',rejected:'Abgelehnt',revoked:'Gesperrt',passive:'Passiv'}[s]||s);
const memberNumber=id=>'FS-'+id.slice(0,8).toUpperCase();
const button=(label,action,css='secondary')=>{
  const b=document.createElement('button');b.type='button';b.className='member-btn '+css;b.textContent=label;
  b.addEventListener('click',action);return b;
};
function render(){
  $('statAll').textContent=rows.length;
  $('statPending').textContent=rows.filter(r=>r.status==='pending').length;
  $('statApproved').textContent=rows.filter(r=>r.status==='approved').length;
  $('statOther').textContent=rows.filter(r=>['rejected','revoked','passive'].includes(r.status)).length;
  const filter=$('filterStatus').value,search=$('filterName').value.trim().toLocaleLowerCase('de');
  const data=rows.filter(r=>(filter==='all'||r.status===filter)&&r.display_name.toLocaleLowerCase('de').includes(search));
  $('memberRows').replaceChildren();
  renderLoungeTiles(data);
  if(!data.length){
    const td=document.createElement('td');td.colSpan=6;td.textContent='Keine Einträge in dieser Auswahl.';
    const tr=document.createElement('tr');tr.append(td);$('memberRows').append(tr);return;
  }
  data.forEach(r=>{
    const tr=document.createElement('tr');
    [r.display_name,null,r.role,r.member_no||'—',dateFormat(r.created_at)].forEach((value,i)=>{
      const td=document.createElement('td');
      if(i===1){const s=document.createElement('span');s.className='member-status-pill '+r.status;s.textContent=safeStatus(r.status);td.append(s);}
      else td.textContent=value;
      tr.append(td);
    });
    const td=document.createElement('td'),actions=document.createElement('div');actions.className='member-row-actions';
    if(r.status==='pending'){
      actions.append(button('✅ Annehmen',()=>updateStatus(r,'approved',true)));
      actions.append(button('⏸ Passivkarte',()=>updateStatus(r,'passive',true)));
      actions.append(button('❌ Ablehnen',()=>updateStatus(r,'rejected',false),'danger'));
    }else if(r.status==='approved'){
      actions.append(button('🎨 Karte ansehen',()=>openLoungePreview(r)));
      actions.append(button('🔗 Karten-Link',()=>copyLink(r.request_code)));
      actions.append(button('⏸ Passiv stellen',()=>updateStatus(r,'passive',false)));
      actions.append(button('🔒 Sperren',()=>updateStatus(r,'revoked',false),'danger'));
    }else if(r.status==='passive'){
      actions.append(button('🎨 Karte ansehen',()=>openLoungePreview(r)));
      actions.append(button('🔗 Karten-Link',()=>copyLink(r.request_code)));
      actions.append(button('▶ Aktivieren',()=>updateStatus(r,'approved',true)));
      actions.append(button('🔒 Sperren',()=>updateStatus(r,'revoked',false),'danger'));
    }else {
      actions.append(button('✅ Freigeben',()=>updateStatus(r,'approved',true)));
      actions.append(button('⏸ Passivkarte',()=>updateStatus(r,'passive',true)));
    }
    actions.append(button('🗣 Gespräch',()=>editConversation(r)));
    actions.append(button('🗑 Löschen',()=>deleteMember(r),'danger'));
    td.append(actions);tr.append(td);$('memberRows').append(tr);
  });
}
async function reload(){
  if(!signedIn||!client)return;
  feedback('tableFeedback','Mitglieder werden geladen …');
  try{
    const {data,error}=await client.from('frost_member_requests')
      .select('id,request_code,display_name,status,role,member_no,created_at,processed_at,talk_at,talk_note')
      .order('created_at',{ascending:false}).limit(1000);
    if(error)throw error;
    rows=data||[];
    const currentPending=new Set(rows.filter(r=>r.status==='pending').map(r=>r.id));
    if(initializedPending){
      const fresh=rows.filter(r=>r.status==='pending'&&!lastPendingIds.has(r.id));
      if(fresh.length){
        feedback('incomingFeedback',fresh.length===1?'📥 Neuer Mitgliedsantrag eingegangen!':'📥 '+fresh.length+' neue Mitgliedsanträge eingegangen!');
        if(document.visibilityState==='visible'&&'Notification' in window&&Notification.permission==='granted'){
          try{new Notification('Frost Skaters',{body:fresh.length===1?'Neuer Mitgliedsantrag eingegangen':fresh.length+' neue Mitgliedsanträge'});}catch{}
        }
      }
    }
    initializedPending=true;lastPendingIds=currentPending;
    render();
    void loadOwnerMailFeed();
    $('tableFeedback').textContent=rows.length>=1000?'Hinweis: Es werden nur die neuesten 1000 Einträge angezeigt.':'';
  }catch(e){feedback('tableFeedback','Die Übersicht konnte nicht geladen werden.',true);console.error(e);}
}
async function updateStatus(r,status,approve){
  const action={approved:'aktivieren',passive:'passiv stellen',rejected:'ablehnen',revoked:'sperren'}[status]||'ändern';
  if(!window.confirm('Möchtest du die Karte von '+r.display_name+' wirklich '+action+'?'))return;
  const changes={status,processed_at:new Date().toISOString()};
  if(approve||status==='passive')changes.member_no=r.member_no||memberNumber(r.request_code);
  try{
    const {data,error}=await client.from('frost_member_requests').update(changes).eq('id',r.id).eq('status',r.status).select('id,request_code');
    if(error)throw error;
    if(!data?.length){feedback('tableFeedback','Dieser Antrag hat sich zwischenzeitlich geändert. Bitte aktualisieren.',true);await reload();return;}
    if(approve)feedback('tableFeedback','Mitglied angenommen! Jetzt den persönlichen Karten-Link senden:\n'+codeLink(r.request_code));
    else feedback('tableFeedback','Status geändert: '+safeStatus(status));
    await reload();
    // reload clears the feedback, so restore the confirmation.
    if(approve||status==='passive')feedback('tableFeedback','Kartenstatus gespeichert! Privater Karten-Link:\n'+codeLink(r.request_code));
    else feedback('tableFeedback','Status gespeichert: '+safeStatus(status));
  }catch(e){feedback('tableFeedback','Änderung fehlgeschlagen. Versuche es später erneut.',true);console.error(e);}
}
let selectedTalkId=null;
function editConversation(r){
  if(!signedIn)return;
  selectedTalkId=r.id;
  $('talkForName').textContent='Gespräch mit '+r.display_name;
  const t=r.talk_at?new Date(r.talk_at):null;
  if(t&&!Number.isNaN(t.valueOf())){
    const local=new Date(t.getTime()-t.getTimezoneOffset()*60000);
    $('talkAt').value=local.toISOString().slice(0,16);
  }else $('talkAt').value='';
  $('talkNote').value=r.talk_note||'';
  $('talkFeedback').textContent='';
  $('talkDialog').showModal();
}
$('talkCancelButton').addEventListener('click',()=>{$('talkDialog').close();selectedTalkId=null;});
$('talkForm').addEventListener('submit',async event=>{
  event.preventDefault();
  if(!signedIn||!selectedTalkId)return;
  const note=$('talkNote').value.trim();
  const input=$('talkAt').value;
  let talk_at=null;
  if(input){
    const parsed=new Date(input);
    if(Number.isNaN(parsed.valueOf())){feedback('talkFeedback','Bitte eine gültige Zeit angeben.',true);return;}
    talk_at=parsed.toISOString();
  }
  const btn=$('talkSaveButton');btn.disabled=true;
  try{
    const {error}=await client.from('frost_member_requests').update({talk_at,talk_note:note||null}).eq('id',selectedTalkId);
    if(error)throw error;
    $('talkDialog').close();selectedTalkId=null;
    await reload();
    feedback('tableFeedback','Privater Gesprächstermin gespeichert.');
  }catch(e){feedback('talkFeedback','Gespräch konnte nicht gespeichert werden.',true);console.error(e);}
  finally{btn.disabled=false;}
});
async function deleteMember(r){
  if(!signedIn||!window.confirm('Antrag, Mitgliedskarte und Gesprächsnotiz für '+r.display_name+' endgültig löschen?'))return;
  try{
    const {error}=await client.from('frost_member_requests').delete().eq('id',r.id);
    if(error)throw error;
    await reload();feedback('tableFeedback','Datensatz gelöscht.');
  }catch(e){feedback('tableFeedback','Löschen fehlgeschlagen.',true);console.error(e);}
}
async function copyLink(code){
  const link=codeLink(code);
  try{await navigator.clipboard.writeText(link);feedback('tableFeedback','Karten-Link kopiert! Du kannst ihn jetzt dem Mitglied schicken.');}
  catch{feedback('tableFeedback','Hier der Karten-Link zum Kopieren:\n'+link);}
}
$('filterStatus').addEventListener('change',render);
$('filterName').addEventListener('input',render);
$('reloadMembers').addEventListener('click',reload);

// New applications arrive instantly while the Owner dashboard is open.
// Realtime is accompanied by periodic refresh in case a mobile connection drops.
let requestsChannel=null;
let refreshInterval=null;
let lastPendingIds=new Set();
let initializedPending=false;
function startRequestUpdates(){
  if(!client||requestsChannel)return;
  requestsChannel=client.channel('frost-owner-requests').on(
    'postgres_changes',
    {event:'INSERT',schema:'public',table:'frost_member_requests'},
    ()=>{if(signedIn)reload();}
  ).subscribe();
  refreshInterval=setInterval(()=>{if(signedIn&&!document.hidden)reload();},20000);
}
function stopRequestUpdates(){
  if(refreshInterval!==null){clearInterval(refreshInterval);refreshInterval=null;}
  if(requestsChannel){client.removeChannel(requestsChannel);requestsChannel=null;}
  initializedPending=false;lastPendingIds=new Set();
}

$('adminLogin').addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){feedback('loginFeedback','Das Mitgliedersystem ist noch nicht mit der Datenbank verbunden. Bitte zuerst Supabase einrichten.',true);return;}
  const btn=$('loginButton');btn.disabled=true;btn.textContent='Prüfe Zugang …';
  try{
    const {data:loginData,error}=await client.auth.signInWithPassword({email:$('ownerEmail').value.trim(),password:$('ownerPassword').value});
    $('ownerPassword').value='';
    if(error)throw error;
    saveOwnerEmail(loginData?.user?.email||$('ownerEmail').value);
    const {data:roles,error:checkErr}=await client.from('frost_admins').select('user_id').limit(1);
    if(checkErr||!roles?.length){
      await client.auth.signOut();
      feedback('loginFeedback','Dein Login hat funktioniert! Der Account ist aber noch nicht als Owner freigeschaltet.\\n\\nKopiere diese Benutzer-ID und teile sie zur Freischaltung mit dem Website-Verwalter (niemals dein Passwort):\\n'+(loginData?.user?.id||'Nicht verfügbar'));
      return;
    }
    signedIn=true;$('signInPanel').hidden=true;$('dashboard').hidden=false;await reload();startRequestUpdates();
  }catch(e){feedback('loginFeedback','Login nicht möglich. Bitte kontrolliere die E-Mail und das Passwort. Wenn du gerade auf localhost:3000 gelandet bist, kann die Bestätigung trotzdem erfolgreich gewesen sein — probiere deinen Login hier erneut.',true);console.error(e);}
  finally{btn.disabled=false;btn.textContent='Einloggen';}
});
$('signOut').addEventListener('click',async()=>{
  if(client)await client.auth.signOut();
  stopRequestUpdates();signedIn=false;rows=[];previewMember=null;
  $('loungePreviewDialog').close?.();
  $('dashboard').hidden=true;$('signInPanel').hidden=false;
  $('memberRows').replaceChildren();$('loungeMemberTiles').replaceChildren();$('loungeMailFeed').replaceChildren();
});
$('addMember').addEventListener('submit',async event=>{
  event.preventDefault();
  if(!signedIn)return;
  const display_name=$('manualName').value.trim().replace(/\s+/g,' ');
  if(!/^[\p{L}][\p{L}'’-]{1,39}$/u.test(display_name)){feedback('manualFeedback','Nur einen Vornamen mit 2 bis 40 Zeichen eingeben.',true);return;}
  const request_code=crypto.randomUUID();
  const role=$('manualRole').value;
  const status=$('manualStatus').value;
  const btn=$('manualButton');btn.disabled=true;
  try{
    const {error}=await client.from('frost_member_requests').insert({
      request_code,display_name,role,status,
      member_no:memberNumber(request_code),processed_at:new Date().toISOString()
    });
    if(error)throw error;
    $('manualName').value='';$('manualRole').value='MEMBER';$('manualStatus').value='approved';
    await reload();
    feedback('manualFeedback','Karte '+(status==='passive'?'passiv':'aktiv')+' erstellt! Privater Link:\n'+codeLink(request_code));
  }catch(e){feedback('manualFeedback','Karte konnte nicht erstellt werden. Prüfe die Admin-Berechtigung und Datenbankkonfiguration.',true);console.error(e);}
  finally{btn.disabled=false;}
});
const signupForm=$('adminSignup');
signupForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){feedback('signupFeedback','Das System ist gerade nicht erreichbar. Versuche es bitte später.',true);return;}
  const email=$('signupEmail').value.trim();
  const password=$('signupPassword').value;
  const repeat=$('signupPasswordRepeat').value;
  if(password.length<12){feedback('signupFeedback','Bitte ein Passwort mit mindestens 12 Zeichen auswählen.',true);return;}
  if(password!==repeat){feedback('signupFeedback','Die beiden Passwörter stimmen nicht überein.',true);return;}
  const btn=$('signupButton');
  btn.disabled=true;btn.textContent='Zugang wird beantragt …';
  try{
    const {data,error}=await client.auth.signUp({
      email,password,
      options:{ emailRedirectTo:new URL('mitglieder-admin.html',location.href).href }
    });
    $('signupPassword').value='';$('signupPasswordRepeat').value='';
    if(error)throw error;
    saveOwnerEmail(email);
    if(data?.session)await client.auth.signOut();
    feedback('signupFeedback','Anfrage gesendet! Schau in deinem E-Mail-Postfach (auch Spam) nach und bestätige deine Adresse. Danach muss dein Account einmalig als Owner freigeschaltet werden. Öffne anschließend hier den Login.');
    $('ownerEmail').value=email;
  }catch(e){feedback('signupFeedback','Registrierung momentan nicht möglich: '+(e?.message||'Unbekannter Fehler')+'. Prüfe die E-Mail-Adresse und versuche es später erneut.',true);}
  finally{btn.disabled=false;btn.textContent='Owner-Zugang beantragen';}
});
if(!ready)feedback('loginFeedback','Die Website muss noch mit Supabase verbunden werden. In assets/frost-members-config.js sind die öffentlichen Projektangaben einzutragen. Bis dahin werden keine Anträge gesammelt.',true);
})();

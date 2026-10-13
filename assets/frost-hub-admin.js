(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.FROST_MEMBERS_CONFIG||{};
const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl||'')&&/^(sb_publishable_|eyJ)/.test(cfg.supabaseAnonKey||'')&&Boolean(window.supabase);
const client=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}}):null;
let owner=false,staff=false,user=null,items=[],submissions=[],work=[],badges=[],people=[],settings={},membersHistory=[];
let hubInboxChannel=null;
let lastSubIds=new Set();
let inboxInitialized=false;
let newSubmissionCount=0;
const supportsAlerts=('Notification' in window)&&window.isSecureContext;
function stopInbox(){
 if(hubInboxChannel&&client)client.removeChannel(hubInboxChannel);
 hubInboxChannel=null;inboxInitialized=false;lastSubIds=new Set();newSubmissionCount=0;
 $('hubNewSubmissionCount').textContent='Keine neuen Meldungen';
 $('hubIncomingMessage').textContent='';
}
function startInbox(){
 if(!owner||!client||hubInboxChannel)return;
 hubInboxChannel=client.channel('frost-private-owner-inbox').on(
  'postgres_changes',{event:'INSERT',schema:'public',table:'frost_hub_submissions'},
  ()=>{if(owner)loadSubmissions().catch(console.error);}
 ).subscribe();
}
$('hubNotificationsEnable').addEventListener('click',async()=>{
 if(!supportsAlerts){notice('hubIncomingMessage','Auf diesem Gerät werden Browser-Benachrichtigungen nicht unterstützt. Neue Eingänge erscheinen bei geöffnetem Dashboard.',true);return;}
 let choice='denied';
 try{choice=await Notification.requestPermission();}catch{choice='denied';}
 notice('hubIncomingMessage',choice==='granted'?'Benachrichtigungen bei geöffnetem Dashboard sind aktiviert.':'Benachrichtigungen sind nicht freigegeben.');
});

const ownerBlocks=()=>document.querySelectorAll('[data-owner-only]');
const make=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=String(txt);return node;};
const notice=(id,message,error=false)=>{const n=$(id);if(!n)return;n.textContent=message;n.className='fh-status'+(error?' error':'');};
const isUuid=v=>/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test((v||'').trim());
const firstName=v=>/^[\p{L}][\p{L}'’-]{1,39}$/u.test(v||'');
const shortDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(+d)?'—':new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short'}).format(d);};
const kindNames={news:'Neuigkeit',event:'Event',poll:'Umfrage',gallery:'Galerie',challenge:'Challenge',history:'Geschichte',task:'Aufgabe',checklist:'Checkliste',loan:'Verleih',idea:'Idee',feedback:'Feedback'};
const statusNames={pending:'Offen',approved:'Bestätigt',declined:'Abgelehnt',attended:'Anwesend'};
function assertLogged(){if(!staff||!user)throw Error('Nicht angemeldet');}
function nodeBtn(label,callback,css='alt'){const b=make('button','fh-btn '+css,label);b.type='button';b.addEventListener('click',callback);return b;}
async function confirmOperation(title,call){
 if(!window.confirm(title))return false;
 try{await call();notice('hubDashboardFeedback','Änderung gespeichert.');return true;}
 catch(e){console.error(e);notice('hubDashboardFeedback','Änderung fehlgeschlagen. Überprüfe die Berechtigung.',true);return false;}
}
async function ownerOrStaffLogin(loginData){
 const {data:own,error:oe}=await client.rpc('frost_hub_is_owner');
 const {data:access,error:se}=await client.rpc('frost_hub_is_staff');
 if(oe||se||!access){await client.auth.signOut();throw Error('Keine Freigabe als Owner oder Teammitglied');}
 user=loginData.user;owner=Boolean(own);staff=Boolean(access);
 $('hubRoleText').textContent=owner?'👑 Owner · Vollzugriff':'⛸️ Team-Zugang · nur Community & Aufgaben';
 $('hubLoginPanel').hidden=true;$('hubDashboard').hidden=false;
 ownerBlocks().forEach(n=>n.hidden=!owner);
 await reloadAll();if(owner)startInbox();
}
$('hubLoginForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!client){notice('hubLoginFeedback','Verbindung zur Datenbank fehlt.',true);return;}
 const btn=$('hubLoginButton');btn.disabled=true;
 try{
  const {data,error}=await client.auth.signInWithPassword({email:$('hubEmail').value.trim(),password:$('hubPassword').value});
  $('hubPassword').value='';if(error)throw error;
  await ownerOrStaffLogin(data);
  notice('hubLoginFeedback','');
 }catch(error){console.error(error);notice('hubLoginFeedback','Login nicht möglich oder Account nicht freigeschaltet. Lass deinen Zugang vom Owner prüfen.',true);}
 finally{btn.disabled=false;}
});
$('hubSignupForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client){notice('hubSignupFeedback','Keine Datenbankverbindung.',true);return;}
 const password=$('hubSignupPass').value;
 if(password.length<12||password!==$('hubSignupRepeat').value){notice('hubSignupFeedback','Passwörter stimmen nicht überein oder sind zu kurz.',true);return;}
 const btn=$('hubSignupButton');btn.disabled=true;
 try{
  const email=$('hubSignupEmail').value.trim();
  const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:new URL('hub-admin.html',location.href).href}});
  if(error)throw error;
  $('hubSignupPass').value='';$('hubSignupRepeat').value='';
  if(data?.session)await client.auth.signOut();
  notice('hubSignupFeedback','Konto angefragt. Bitte E-Mail bestätigen. Deine Benutzer-ID für den Owner:\n'+(data?.user?.id||'Nach Anmeldung nachfragen')+'\nSende nur diese ID an den Owner, niemals dein Passwort.');
 }catch(error){console.error(error);notice('hubSignupFeedback','Anmeldung fehlgeschlagen. Bitte später versuchen.',true);}
 finally{btn.disabled=false;}
});
$('hubLogout').addEventListener('click',async()=>{stopInbox();if(client)await client.auth.signOut();owner=false;staff=false;user=null;items=[];submissions=[];work=[];$('hubDashboard').hidden=true;$('hubLoginPanel').hidden=false;});
$('hubRefresh').addEventListener('click',reloadAll);
async function reloadAll(){
 if(!staff)return;
 notice('hubDashboardFeedback','Lade aktuelle Daten …');
 const jobs=[loadItems(),loadWork(),loadSettings()];
 if(owner)jobs.push(loadSubmissions(),loadBadges(),loadHistory(),loadStaff());
 const results=await Promise.allSettled(jobs);
 const failures=results.filter(r=>r.status==='rejected');
 if(failures.length)console.error('Some owner modules could not load',failures);
 notice('hubDashboardFeedback',failures.length?'Einige Bereiche konnten nicht geladen werden. Bitte prüfen.':'Daten aktualisiert.',!!failures.length);
 renderMetrics();
}
function renderMetrics(){
 const counts=[['Beiträge',items.length],['Öffentlich',items.filter(x=>x.visible).length],['Events',items.filter(x=>x.kind==='event').length],['Team-Aufgaben',work.length]];
 if(owner)counts.push(['Offene Anfragen',submissions.filter(x=>x.state==='pending').length]);
 $('hubMetrics').replaceChildren(...counts.map(([label,value])=>{const box=make('div','fh-panel');box.append(make('strong','fh-metric',value),make('span','fh-mini',label));return box;}));
}
function updateEditorFields(){
 const k=$('itemKind').value;
 $('eventEditorFields').hidden=k!=='event';
 $('pollEditorFields').hidden=k!=='poll';
 $('galleryEditorFields').hidden=k!=='gallery';
}
$('itemKind').addEventListener('change',updateEditorFields);
function clearItemForm(){
 $('hubItemForm').reset();$('editItemId').value='';$('itemKind').disabled=false;updateEditorFields();$('hubItemSave').textContent='Beitrag speichern';notice('hubItemStatus','');
}
$('hubItemReset').addEventListener('click',clearItemForm);
function editItem(it){
 $('editItemId').value=it.id;$('itemKind').value=it.kind;$('itemKind').disabled=true;
 $('itemTitle').value=it.title;$('itemBody').value=it.body||'';
 $('itemPlace').value=it.place||'';
 if(it.event_at){const d=new Date(it.event_at);$('itemEventAt').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}else $('itemEventAt').value='';
 $('itemOptions').value=(it.options||[]).join('\n');
 $('itemMediaSrc').value=it.media_src||'';
 $('imageConsent').checked=false;
 $('itemVisible').checked=it.visible;updateEditorFields();
 $('hubItemSave').textContent='Änderungen speichern';
 notice('hubItemStatus','Du bearbeitest den Eintrag „'+it.title+'“.');
 $('editor').scrollIntoView({behavior:'smooth'});
}
async function loadItems(){
 assertLogged();
 const {data,error}=await client.from('frost_hub_items').select('id,kind,title,body,event_at,place,media_src,options,visible,created_at,created_by').order('created_at',{ascending:false}).limit(400);
 if(error)throw error;items=data||[];renderItems();
}
function renderItems(){
 const filter=$('hubItemFilter').value;const arr=items.filter(x=>filter==='all'||x.kind===filter);
 $('hubItemsList').replaceChildren();
 if(!arr.length){$('hubItemsList').append(make('p','fh-hint','Noch keine Einträge. Erstelle deinen ersten Beitrag.'));return;}
 for(const it of arr){
  const card=make('article','fh-panel');
  card.append(make('span','fh-chip',kindNames[it.kind]+' · '+(it.visible?'Öffentlich':'Entwurf')),
     make('h3','',it.title),make('p','',it.body||'(keine Beschreibung)'),make('p','fh-hint',shortDate(it.created_at)));
  if(it.event_at)card.append(make('p','fh-hint','📅 '+shortDate(it.event_at)));
  if(it.kind==='poll')card.append(make('p','fh-hint','Antworten: '+(it.options||[]).join(' | ')));
  const actions=make('div','fh-controls');
  actions.append(nodeBtn('✏️ Bearbeiten',()=>editItem(it)));
  actions.append(nodeBtn(it.visible?'⏸ Verbergen':'✅ Veröffentlichen',async()=>{
   if(it.kind==='gallery'&&!it.media_src){notice('hubDashboardFeedback','Galerie-Beiträge brauchen ein hochgeladenes Bild.',true);return;}
   const ok=await confirmOperation('Sichtbarkeit von „'+it.title+'“ ändern?',async()=>{
    const {error}=await client.from('frost_hub_items').update({visible:!it.visible,updated_at:new Date().toISOString()}).eq('id',it.id);if(error)throw error;
   });if(ok)await loadItems();
  }));
  actions.append(nodeBtn('🗑 Löschen',async()=>{
   const ok=await confirmOperation('Beitrag „'+it.title+'“ und zugehörige Umfrage/Anmeldungen endgültig löschen?',async()=>{
    const {error}=await client.from('frost_hub_items').delete().eq('id',it.id);if(error)throw error;
   });if(ok)await loadItems();
  },'warn'));
  card.append(actions);$('hubItemsList').append(card);
 }
}
$('hubItemFilter').addEventListener('change',renderItems);
$('hubItemForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!staff)return;
 const id=$('editItemId').value,kind=$('itemKind').value,title=$('itemTitle').value.trim(),body=$('itemBody').value.trim();
 let options=[];
 if(kind==='poll'){
  options=$('itemOptions').value.split('\n').map(x=>x.trim()).filter(Boolean);
  if(options.length<2||options.length>4||options.some(x=>x.length>60)||new Set(options.map(x=>x.toLocaleLowerCase('de'))).size!==options.length){notice('hubItemStatus','Umfrage: 2–4 unterschiedliche Antworten mit höchstens 60 Zeichen.',true);return;}
 }
 if(id){
  const old=items.find(it=>it.id===id);
  if(!old){notice('hubItemStatus','Eintrag nicht mehr vorhanden.',true);return;}
  if(old.kind==='poll'&&JSON.stringify(old.options||[])!==JSON.stringify(options)){notice('hubItemStatus','Antwortmöglichkeiten bestehender Umfragen dürfen nicht geändert werden. Erstelle eine neue Umfrage.',true);return;}
 }
 let event_at=null;
 if(kind==='event'&&$('itemEventAt').value){
  const d=new Date($('itemEventAt').value);
  if(Number.isNaN(+d)){notice('hubItemStatus','Ungültiges Datum.',true);return;}
  event_at=d.toISOString();
 }
 const media_src=kind==='gallery' ? $('itemMediaSrc').value.trim():null;
 if(kind==='gallery'){
  if(!/^assets\/[A-Za-z0-9/_-]+\.(jpg|jpeg|png|webp)$/.test(media_src||'')){notice('hubItemStatus','Bitte einen gültigen relativen Bildpfad aus assets/ angeben.',true);return;}
  if(!$('imageConsent').checked){notice('hubItemStatus','Du musst die Bild-Freigaben vor dem Speichern prüfen.',true);return;}
 }
 const payload={kind,title,body,event_at,place:kind==='event'?$('itemPlace').value.trim()||null:null,media_src,options,visible:$('itemVisible').checked,updated_at:new Date().toISOString()};
 if(title.length<3||title.length>110||body.length>1100){notice('hubItemStatus','Ungültige Titel- oder Beschreibungslänge.',true);return;}
 const btn=$('hubItemSave');btn.disabled=true;
 try{
  const query=id?client.from('frost_hub_items').update(payload).eq('id',id):client.from('frost_hub_items').insert({...payload,created_by:user.id});
  const {error}=await query;
  if(error)throw error;clearItemForm();await loadItems();renderMetrics();notice('hubItemStatus','Beitrag gespeichert. Veröffentlichung: '+(payload.visible?'Öffentlich':'Entwurf'));
 }catch(error){console.error(error);notice('hubItemStatus','Speichern fehlgeschlagen. Prüfe die Eingaben oder Berechtigung.',true);}
 finally{btn.disabled=false;}
});
async function loadWork(){
 const {data,error}=await client.from('frost_hub_work').select('id,kind,title,person_first_name,done,created_at').order('created_at',{ascending:false}).limit(500);
 if(error)throw error;work=data||[];renderWork();
}
function renderWork(){
 const container=$('hubWorkList');container.replaceChildren();
 const groups={task:'Aufgaben',checklist:'Checklisten',loan:'Ausrüstungsverleih'};
 for(const [kind,title] of Object.entries(groups)){
  container.append(make('h3','',title));
  const selected=work.filter(x=>x.kind===kind);
  if(!selected.length){container.append(make('p','fh-hint','Noch keine Einträge.'));continue;}
  for(const item of selected){
   const row=make('div','fh-boxed');row.style.margin='8px 0';row.append(make('strong','',item.done?'✅ '+item.title:'⬜ '+item.title));
   if(item.person_first_name)row.append(make('p','fh-hint','Zuständig: '+item.person_first_name));
   const controls=make('div','fh-controls');
   controls.append(nodeBtn(item.done?'↩ Offen':'✅ Erledigt',async()=>{
    const {error}=await client.from('frost_hub_work').update({done:!item.done}).eq('id',item.id);
    if(error)notice('hubWorkStatus','Änderung nicht gespeichert.',true);else await loadWork();
   }));
   controls.append(nodeBtn('🗑 Löschen',async()=>{
    const ok=await confirmOperation('Eintrag löschen?',async()=>{const {error}=await client.from('frost_hub_work').delete().eq('id',item.id);if(error)throw error;});
    if(ok)await loadWork();
   },'warn'));
   row.append(controls);container.append(row);
  }
 }
}
$('hubWorkForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!staff)return;
 const title=$('workTitle').value.trim(),name=$('workPerson').value.trim();
 if(title.length<2||title.length>130||(name&&!firstName(name))){notice('hubWorkStatus','Bitte eine kurze Aufgabe und ggf. nur einen Vornamen angeben.',true);return;}
 const btn=$('hubWorkSave');btn.disabled=true;
 try{
  const {error}=await client.from('frost_hub_work').insert({title,kind:$('workKind').value,person_first_name:name||null});
  if(error)throw error;$('hubWorkForm').reset();await loadWork();renderMetrics();notice('hubWorkStatus','Eintrag angelegt.');
 }catch(e){console.error(e);notice('hubWorkStatus','Eintrag konnte nicht gespeichert werden.',true);}
 finally{btn.disabled=false;}
});
async function loadSubmissions(){
 if(!owner)return;
 const {data,error}=await client.from('frost_hub_submissions').select('id,kind,item_id,first_name,message,state,created_at').order('created_at',{ascending:false}).limit(500);
 if(error)throw error;
 submissions=data||[];
 const currentIds=new Set(submissions.map(x=>x.id));
 if(inboxInitialized){
  const newEntries=submissions.filter(x=>!lastSubIds.has(x.id)&&x.state==='pending');
  if(newEntries.length){
   newSubmissionCount+=newEntries.length;
   $('hubNewSubmissionCount').textContent=newSubmissionCount+' neue Anfragen';
   const lastKind=newEntries[0].kind;
   notice('hubIncomingMessage','📥 '+newEntries.length+' neue Anfrage(n) eingegangen: '+(kindNames[lastKind]||lastKind)+'.');
   if(supportsAlerts&&Notification.permission==='granted'&&document.visibilityState==='visible'){
    try{new Notification('Frost Skaters: neue Anfrage',{body:newEntries.length+' neue Anfrage(n) im Owner-Dashboard. Keine Namen werden in der Mitteilung gezeigt.'});}catch{}
   }
  }
 }
 inboxInitialized=true;lastSubIds=currentIds;
 renderSubmissions();
}
function renderSubmissions(){

 const kind=$('hubSubFilter').value,state=$('hubSubState').value;
 const set=submissions.filter(x=>(kind==='all'||x.kind===kind)&&(state==='all'||x.state===state));
 const target=$('hubSubmissionsList');target.replaceChildren();
 if(!set.length){target.append(make('p','fh-hint','Keine Einträge zu diesem Filter.'));return;}
 for(const entry of set){
  const card=make('article','fh-panel');
  const associated=items.find(i=>i.id===entry.item_id);
  card.append(make('span','fh-chip',(kindNames[entry.kind]||entry.kind)+' · '+(statusNames[entry.state]||entry.state)),
              make('h3','',associated?.title||(entry.kind==='idea'?'Community-Idee':entry.kind==='feedback'?'Feedback':'Nicht mehr vorhandenes Event')));
  if(entry.first_name)card.append(make('p','fh-hint','Vorname: '+entry.first_name));
  if(entry.message)card.append(make('p','',entry.message));
  card.append(make('p','fh-hint','Eingegangen: '+shortDate(entry.created_at)));
  const actions=make('div','fh-controls');
  for(const [status,label] of [['approved','✅ Bestätigen'],['declined','❌ Ablehnen'],['attended','🧊 Anwesend']]){
   if(status==='attended'&&entry.kind!=='event')continue;
   if(status===entry.state)continue;
   actions.append(nodeBtn(label,async()=>{
    const ok=await confirmOperation('Status auf „'+(statusNames[status]||status)+'“ ändern?',async()=>{const {error}=await client.from('frost_hub_submissions').update({state:status}).eq('id',entry.id);if(error)throw error;});
    if(ok)await loadSubmissions();
   }));
  }
  if(entry.kind==='event'&&entry.state==='attended'){
   actions.append(nodeBtn('📜 Teilnahmeurkunde',()=>printCertificate(entry,associated)));
  }
  actions.append(nodeBtn('🗑 Löschen',async()=>{
   const ok=await confirmOperation('Diesen Eintrag mit Vorname und Nachricht endgültig löschen?',async()=>{const {error}=await client.from('frost_hub_submissions').delete().eq('id',entry.id);if(error)throw error;});
   if(ok)await loadSubmissions();
  },'warn'));
  card.append(actions);target.append(card);
 }
}
function printCertificate(entry,item){
 if(!owner||entry.state!=='attended')return;
 const win=window.open('','_blank','width=780,height=550');
 if(!win){notice('hubDashboardFeedback','Pop-up blockiert. Erlaube für den Druck ein neues Fenster.',true);return;}
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 win.document.open();
 win.document.write('<!doctype html><html lang="de"><meta charset="utf-8"><title>Frost Skaters Teilnahmebestätigung</title><style>body{font-family:Arial;text-align:center;padding:65px;color:#102138}h1{font-size:35px}p{font-size:20px;line-height:1.7}.small{font-size:13px;color:#657182}</style><h1>❄️ FROST SKATERS</h1><h2>Teilnahmebestätigung</h2><p>Hiermit bestätigen wir die Teilnahme von<br><strong>'+esc(entry.first_name)+'</strong><br>am gemeinsamen Event<br><strong>'+esc(item?.title||'Frost Skaters Event')+'</strong>.</p><p class="small">Erstellt durch die Frost Skaters Leitung · Keine amtliche Urkunde</p></html>');
 win.document.close();
 win.focus();win.print();
}
document.querySelector('a[href="#hubSubmissions"]')?.addEventListener('click',()=>{
  newSubmissionCount=0;$('hubNewSubmissionCount').textContent='Keine ungelesenen Meldungen';
});
$('hubSubFilter').addEventListener('change',renderSubmissions);
$('hubSubState').addEventListener('change',renderSubmissions);
async function loadBadges(){
 if(!owner)return;
 const {data,error}=await client.from('frost_hub_badges').select('id,member_code,badge,awarded_at').order('awarded_at',{ascending:false}).limit(500);
 if(error)throw error;badges=data||[];renderBadges();
}
function renderBadges(){
 const target=$('hubBadgeList');target.replaceChildren();
 if(!badges.length){target.append(make('p','fh-hint','Noch keine Abzeichen vergeben.'));return;}
 badges.forEach(b=>{
  const card=make('article','fh-panel');
  card.append(make('h3','',b.badge),make('p','fh-hint','Karten-Code endet auf …'+b.member_code.slice(-8)),make('p','fh-hint',shortDate(b.awarded_at)));
  card.append(nodeBtn('🗑 Entfernen',async()=>{
   const ok=await confirmOperation('Abzeichen entfernen?',async()=>{const {error}=await client.from('frost_hub_badges').delete().eq('id',b.id);if(error)throw error;});if(ok)await loadBadges();
  },'warn'));
  target.append(card);
 });
}
$('hubBadgeForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!owner)return;
 const code=$('badgeMemberCode').value.trim();
 if(!isUuid(code)){notice('badgeFeedback','Bitte gültigen Karten-Code eingeben.',true);return;}
 const btn=$('badgeSave');btn.disabled=true;
 try{
  const {error}=await client.from('frost_hub_badges').insert({member_code:code,badge:$('badgeKind').value});
  if(error)throw error;
  $('hubBadgeForm').reset();await loadBadges();notice('badgeFeedback','Abzeichen vergeben. Das Mitglied sieht es auf der eigenen digitalen Karte.');
 }catch(e){console.error(e);notice('badgeFeedback','Nicht möglich. Karte ungültig oder Abzeichen schon vorhanden?',true);}
 finally{btn.disabled=false;}
});
async function loadHistory(){
 if(!owner)return;
 const {data,error}=await client.from('frost_hub_member_history').select('member_id,action,changed_at').order('changed_at',{ascending:false}).limit(100);
 if(error)throw error;membersHistory=data||[];
 const target=$('hubHistoryList');target.replaceChildren();
 if(!membersHistory.length){target.append(make('p','fh-hint','Noch keine neuen Änderungen aufgezeichnet.'));return;}
 for(const row of membersHistory){
  const line=make('div','fh-boxed');line.style.margin='9px 0';
  line.append(make('strong','',row.action),make('p','fh-hint',shortDate(row.changed_at)+' · ID …'+row.member_id.slice(-8)));target.append(line);
 }
}
async function loadSettings(){
 const {data,error}=await client.from('frost_hub_settings').select('key,value');
 if(error)throw error;settings=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
 if(owner){
  $('settingsSeason').value=settings.next_season||'';
  $('settingsWelcome').value=settings.welcome_text||'';
  $('settingsRules').value=settings.community_rules||'';
 }
}
$('hubSettingsForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!owner)return;
 const fields=[['next_season',$('settingsSeason').value],['welcome_text',$('settingsWelcome').value.trim()],['community_rules',$('settingsRules').value.trim()]];
 const btn=$('hubSettingsSave');btn.disabled=true;
 try{
  for(const [key,value] of fields){
   const {error}=await client.from('frost_hub_settings').update({value,updated_at:new Date().toISOString()}).eq('key',key);
   if(error)throw error;
  }
  notice('hubSettingsStatus','Einstellungen gespeichert und öffentlich sichtbar.');await loadSettings();
 }catch(e){console.error(e);notice('hubSettingsStatus','Speichern nicht möglich.',true);}
 finally{btn.disabled=false;}
});
async function loadStaff(){
 if(!owner)return;
 const {data,error}=await client.from('frost_hub_staff').select('user_id,role,added_at').order('added_at',{ascending:false}).limit(100);
 if(error)throw error;people=data||[];
 const target=$('hubStaffList');target.replaceChildren();
 if(!people.length){target.append(make('p','fh-hint','Noch keine weiteren Team-Accounts freigeschaltet.'));return;}
 people.forEach(p=>{
  const n=make('article','fh-panel');n.append(make('span','fh-chip',p.role==='coowner'?'Co-Owner':'Manager'),make('p','fh-hint','Benutzer-ID: '+p.user_id));
  n.append(nodeBtn('🔒 Zugang entziehen',async()=>{
   const ok=await confirmOperation('Team-Berechtigung wirklich entfernen?',async()=>{const {error}=await client.from('frost_hub_staff').delete().eq('user_id',p.user_id);if(error)throw error;});if(ok)await loadStaff();
  },'warn'));target.append(n);
 });
}
$('hubStaffForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!owner)return;
 const id=$('staffUserId').value.trim();
 if(!isUuid(id)||id===user.id){notice('staffFeedback','Bitte eine gültige andere Supabase-Benutzer-ID verwenden.',true);return;}
 const btn=$('staffSave');btn.disabled=true;
 try{
  const {error}=await client.from('frost_hub_staff').upsert({user_id:id,role:$('staffRole').value},{onConflict:'user_id'});
  if(error)throw error;await loadStaff();$('hubStaffForm').reset();notice('staffFeedback','Teammitglied freigeschaltet. Der Account kann sich nun mit eigenem Passwort anmelden.');
 }catch(e){console.error(e);notice('staffFeedback','Freischaltung nicht möglich. Hat sich die Person vorher registriert?',true);}
 finally{btn.disabled=false;}
});
$('costForm').addEventListener('submit',e=>{
 e.preventDefault();const n=Number($('costPeople').value),entry=Number($('costEntry').value),travel=Number($('costTravel').value),other=Number($('costExtra').value);
 if(!Number.isInteger(n)||n<1||n>100||[entry,travel,other].some(x=>!Number.isFinite(x)||x<0))return;
 const total=n*entry+travel+other,per=total/n;
 const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);
 $('costResult').textContent=euro(per)+' / Person';
 $('costResult').nextElementSibling.textContent='Gesamt: '+euro(total)+' für '+n+' Personen. Dies ist eine Schätzung, keine Reservierung oder Buchung.';
});
if(!configured)notice('hubLoginFeedback','Die Verbindung zum Frost Skaters Mitgliedersystem fehlt. Bitte Konfiguration prüfen.',true);
})();
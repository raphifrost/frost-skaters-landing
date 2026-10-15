/* Frost Skaters Owner Toolkit / Version 1.1
 * Runs only after the existing Owner login has succeeded.
 * Reuses that session's Supabase client: NEVER creates a new client or stores credentials.
 * All privilege checks are server-side RLS (staff) and RLS (owner activity).
 * System Monitor tests only endpoints that can actually be checked from the browser.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const ownerOnly=$('dashboard'),staffForm=$('ownerStaffForm');
if(!ownerOnly||!staffForm)return;
const roleNames=Object.freeze({owner:'Owner',coowner:'Co-Owner',manager:'Managerin / Manager',supporter:'Supporter'});
const validRole=role=>['coowner','manager','supporter'].includes(role);
const uuidOK=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const allowedName=name=>/^[\p{L}][\p{L}'’ -]{1,39}$/u.test(name)&&name.length<=40;
const statusNames=Object.freeze({pending:'Offen',approved:'Aktiv',passive:'Passiv',rejected:'Abgelehnt',revoked:'Gesperrt'});
const displayRole=value=>roleNames[value]||value||'–';
const displayStatus=value=>statusNames[value]||value||'–';
const textNode=(tag,cls,content)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
const note=(id,msg,err=false)=>{
 const n=$(id);if(!n)return;
 n.textContent=msg;n.classList.toggle('is-error',Boolean(err));
};
const clear=(id,message)=>{
 const root=$(id);if(!root)return;
 root.replaceChildren(textNode('p','member-hint',message||''));
};
const datetime=d=>{
 const parsed=new Date(d);
 if(Number.isNaN(parsed.valueOf()))return 'Datum unbekannt';
 return new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short'}).format(parsed);
};

let client=null,ownerId=null,staffRows=[],generation=0,monitorTimer=null,monitorBusy=false;
let activeStaffEdit=null;
function running(token){return Boolean(client&&ownerId&&token===generation&&!ownerOnly.hidden);}
function editReset(){
 activeStaffEdit=null;
 staffForm.reset();
 $('ownerStaffId').readOnly=false;
 $('ownerStaffCancel').hidden=true;
 $('ownerRoleFormTitle').textContent='Teamzugang freischalten';
 $('ownerStaffSave').textContent='Teamzugang speichern ↗';
}
function renderStaff(){
 const host=$('ownerStaffList');host.replaceChildren();
 $('ownerStaffCount').textContent=String(staffRows.length);
 if(!staffRows.length){
  host.append(textNode('p','owner-tools-empty','Noch keine Teamkonten freigeschaltet. Sobald ein Teamkonto registriert ist, kannst du hier seine Benutzer-ID eintragen.'));
  return;
 }
 for(const member of staffRows){
  const card=textNode('article','owner-staff-card');
  const main=textNode('div','owner-staff-card-main');
  main.append(textNode('span','owner-staff-role',displayRole(member.role)));
  main.append(textNode('h4','',member.display_name||'Teamkonto'));
  main.append(textNode('small','owner-staff-id','ID: '+member.user_id));
  const acts=textNode('div','owner-staff-card-actions');
  const edit=textNode('button','member-btn secondary','Bearbeiten');
  edit.type='button';
  edit.addEventListener('click',()=>{
    if(!client||ownerOnly.hidden)return;
    activeStaffEdit=member.user_id;
    $('ownerStaffId').value=member.user_id;
    $('ownerStaffId').readOnly=true;
    $('ownerStaffName').value=member.display_name;
    $('ownerStaffRole').value=member.role;
    $('ownerRoleFormTitle').textContent='Teamrolle bearbeiten';
    $('ownerStaffSave').textContent='Änderungen speichern ↗';
    $('ownerStaffCancel').hidden=false;
    note('ownerStaffFeedback','Du bearbeitest jetzt '+member.display_name+'. Bestätige die Änderungen mit „Änderungen speichern“.');
    $('ownerStaffName').focus({preventScroll:true});
    $('ownerStaffForm').scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  });
  const remove=textNode('button','member-btn danger','Zugang entziehen');
  remove.type='button';
  remove.addEventListener('click',()=>removeStaff(member));
  acts.append(edit,remove);
  card.append(main,acts);
  host.append(card);
 }
}
async function loadStaff(){
 if(!client||!ownerId)return;
 const token=generation;
 try{
  const {data,error}=await client.from('frost_hub_staff').select('user_id,role,display_name,added_at')
   .order('added_at',{ascending:false}).limit(120);
  if(!running(token))return;
  if(error)throw error;
  staffRows=Array.isArray(data)?data:[];
  renderStaff();
 }catch(err){
  if(!running(token))return;
  console.warn('Owner staff list unavailable',err);
  clear('ownerStaffList','Teamkonten konnten nicht geladen werden. Bitte später erneut versuchen.');
  $('ownerStaffCount').textContent='!';
 }
}
async function removeStaff(member){
 if(!client||!ownerId||ownerOnly.hidden)return;
 if(!window.confirm('Teamzugang für '+member.display_name+' ('+displayRole(member.role)+') wirklich entziehen? Die Person verliert ihre Teamrechte.'))return;
 const token=generation;
 try{
  const {data,error}=await client.from('frost_hub_staff')
   .delete().eq('user_id',member.user_id).select('user_id');
  if(!running(token))return;
  if(error)throw error;
  if(!data?.length){note('ownerStaffFeedback','Das Konto wurde möglicherweise bereits geändert. Bitte erneut laden.',true);await loadStaff();return;}
  if(activeStaffEdit===member.user_id)editReset();
  note('ownerStaffFeedback','Teamzugang entzogen. Die Änderung gilt ab der nächsten Berechtigungsprüfung.');
  await Promise.all([loadStaff(),loadActivity()]);
 }catch(err){
  if(!running(token))return;
  console.warn('Owner team access removal failed',err);
  note('ownerStaffFeedback','Zugang konnte nicht entzogen werden. Bitte deine Owner-Rechte und die Verbindung prüfen.',true);
 }
}
staffForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!client||!ownerId||ownerOnly.hidden)return;
 const user_id=$('ownerStaffId').value.trim().toLowerCase();
 const display_name=$('ownerStaffName').value.trim().replace(/\s+/g,' ');
 const role=$('ownerStaffRole').value;
 if(!uuidOK(user_id)||user_id===ownerId||!validRole(role)||!allowedName(display_name)){
  note('ownerStaffFeedback','Bitte gültige Benutzer-ID, Vorname/Teamname (2–40 Zeichen) und zulässige Rolle wählen. Owner darf sich nicht selbst freischalten.',true);
  return;
 }
 if(activeStaffEdit&&activeStaffEdit!==user_id){
  note('ownerStaffFeedback','Die Benutzer-ID eines bestehenden Teamkontos darf nicht geändert werden.',true);return;
 }
 const previous=staffRows.find(row=>row.user_id===user_id);
 const action=previous
  ?'Teamrolle von '+previous.display_name+' aktualisieren: '+displayRole(previous.role)+' → '+displayRole(role)+'?'
  :'Neuem Teamkonto '+display_name+' die Rolle '+displayRole(role)+' geben?';
 if(!window.confirm(action))return;
 const button=$('ownerStaffSave');button.disabled=true;
 const token=generation;
 try{
  const {error}=await client.from('frost_hub_staff')
   .upsert({user_id,display_name,role},{onConflict:'user_id'});
  if(!running(token))return;
  if(error)throw error;
  editReset();
  note('ownerStaffFeedback','✅ Teamrolle sicher gespeichert. Änderungen sind im Aktivitätsprotokoll nachlesbar.');
  await Promise.all([loadStaff(),loadActivity()]);
 }catch(err){
  if(!running(token))return;
  console.warn('Team role save failed',err);
  note('ownerStaffFeedback','Teamzugang konnte nicht gespeichert werden. Ist die Benutzer-ID registriert und dein Konto als Owner freigeschaltet?',true);
 }finally{button.disabled=false;}
});
$('ownerStaffCancel').addEventListener('click',()=>{
 editReset();note('ownerStaffFeedback','Bearbeitung abgebrochen.');
});
$('ownerStaffReload').addEventListener('click',()=>{if(client)void loadStaff();});

function eventCopy(event, memberNames,staffNames){
 const whoMember=event.member_id?(memberNames.get(event.member_id)||'Mitgliedskarte'):'Gelöschte oder nicht mehr zugeordnete Karte';
 const whoStaff=event.staff_user_id?(staffNames.get(event.staff_user_id)||'Teamkonto'):'Ehemaliges Teamkonto';
 switch(event.kind){
  case 'application_received':return {title:'Neuer Mitgliedsantrag',detail:whoMember+' · Antrag eingegangen',icon:'↓',style:''};
  case 'card_created':return {title:'Neue Mitgliedskarte angelegt',detail:whoMember+' · Status: '+displayStatus(event.to_value),icon:'＋',style:''};
  case 'card_status_changed':return {title:'Mitgliedskarten-Status geändert',detail:whoMember+' · '+displayStatus(event.from_value)+' → '+displayStatus(event.to_value),icon:'⇄',style:event.to_value==='revoked'?'warning':''};
  case 'card_role_changed':return {title:'Kartenrolle geändert',detail:whoMember+' · '+(event.from_value||'–')+' → '+(event.to_value||'–'),icon:'♛',style:''};
  case 'card_deleted':return {title:'Mitgliedskarte gelöscht',detail:'Datensatz entfernt · früherer Status: '+displayStatus(event.from_value),icon:'×',style:'warning'};
  case 'staff_added':return {title:'Teamzugang freigeschaltet',detail:whoStaff+' · '+displayRole(event.to_value),icon:'♛',style:'staff'};
  case 'staff_role_changed':return {title:'Teamrolle geändert',detail:whoStaff+' · '+displayRole(event.from_value)+' → '+displayRole(event.to_value),icon:'⇄',style:'staff'};
  case 'staff_name_changed':return {title:'Anzeigename eines Teamkontos geändert',detail:whoStaff,icon:'✎',style:'staff'};
  case 'staff_removed':return {title:'Teamzugang entzogen',detail:'Ehemalige Rolle: '+displayRole(event.from_value),icon:'×',style:'warning'};
  default:return {title:'Interne Änderung',detail:'',icon:'•',style:''};
 }
}
function appendActivity(host,item){
 const row=textNode('article','owner-activity-row');
 row.append(textNode('span','owner-activity-icon'+(item.style?' '+item.style:''),item.icon));
 const content=textNode('div','owner-activity-copy');
 content.append(textNode('strong','',item.title));
 if(item.detail)content.append(textNode('span','',item.detail));
 row.append(content,textNode('time','owner-activity-date',datetime(item.when)));
 host.append(row);
}
async function loadActivity(){
 if(!client||!ownerId)return;
 const token=generation;
 try{
  const [audit,history,members]=await Promise.all([
   client.from('frost_owner_activity')
    .select('id,kind,member_id,staff_user_id,actor_id,from_value,to_value,occurred_at')
    .order('occurred_at',{ascending:false}).limit(75),
   client.from('frost_hub_member_history')
    .select('member_id,action,changed_at').order('changed_at',{ascending:false}).limit(40),
   client.from('frost_member_requests').select('id,display_name').order('created_at',{ascending:false}).limit(1000)
  ]);
  if(!running(token))return;
  if(audit.error)throw audit.error;
  if(history.error)throw history.error;
  if(members.error)throw members.error;
  const memberNames=new Map((members.data||[]).map(m=>[m.id,m.display_name]));
  const staffNames=new Map(staffRows.map(m=>[m.user_id,m.display_name]));
  const host=$('ownerActivityList');host.replaceChildren();
  if(!audit.data?.length)host.append(textNode('p','owner-tools-empty','Noch keine neuen Aktivitäten seit der Aktivierung des Owner-Protokolls.'));
  else for(const log of audit.data){
    const item=eventCopy(log,memberNames,staffNames);
    appendActivity(host,{...item,when:log.occurred_at});
  }
  const oldHost=$('ownerLegacyHistoryList');oldHost.replaceChildren();
  if(!history.data?.length)oldHost.append(textNode('p','owner-tools-empty','Keine älteren Einträge im bisherigen Kartenprotokoll vorhanden.'));
  else for(const old of history.data){
   const name=memberNames.get(old.member_id)||'Mitgliedskarte';
   appendActivity(oldHost,{title:'Frühere Kartenänderung',detail:name+' · '+String(old.action||'Status geändert').slice(0,160),icon:'◷',style:'',when:old.changed_at});
  }
 }catch(err){
  if(!running(token))return;
  console.warn('Owner activity timeline unavailable',err);
  clear('ownerActivityList','Aktivitätsprotokoll konnte nicht geladen werden. Bitte die Datenbankverbindung prüfen.');
  clear('ownerLegacyHistoryList','Bisherige Historie aktuell nicht verfügbar.');
 }
}
$('ownerActivityReload').addEventListener('click',()=>{if(client)void loadActivity();});

function healthSet(name,state,detail){
 const target=$(name==='web'?'ownerHealthWeb':'ownerHealthDb');
 const desc=$(name==='web'?'ownerHealthWebDetail':'ownerHealthDbDetail');
 target.classList.toggle('is-ok',state==='ok');
 target.classList.toggle('is-error',state==='error');
 target.classList.toggle('is-loading',state==='loading');
 // The colored dot remains in the element and is only updated after real results.
 target.replaceChildren(textNode('span','owner-health-dot'),document.createTextNode(state==='ok'?' Erreichbar':state==='loading'?' Wird geprüft …':state==='error'?' Nicht erreichbar':' Nicht geprüft'));
 desc.textContent=detail;
}
async function webReachable(){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 try{
  const res=await fetch(new URL('index.html',location.href),{
   method:'HEAD',cache:'no-store',credentials:'same-origin',signal:controller.signal
  });
  return{ok:res.ok,status:res.status};
 }finally{clearTimeout(timeout);}
}
async function databaseReachable(activeClient){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 try{
  const result=await activeClient.from('frost_admins').select('user_id')
   .limit(1).abortSignal(controller.signal);
  return{ok:!result.error&&Array.isArray(result.data)&&result.data.length===1,unauthorized:!result.error&&Array.isArray(result.data)&&result.data.length===0,reason:result.error?'Datenbank/Abfrage antwortet nicht korrekt':'Owner-Abfrage erfolgreich'};
 }finally{clearTimeout(timeout);}
}
async function refreshHealth(){
 if(!client||!ownerId||ownerOnly.hidden||monitorBusy)return;
 const token=generation, activeClient=client;
 monitorBusy=true;
 const button=$('ownerHealthRefresh');button.disabled=true;
 $('ownerHealthChecked').textContent='Prüfe Website und Datenbank …';
 healthSet('web','loading','Prüfe öffentliche Startseite.');
 healthSet('db','loading','Prüfe deine Owner-Verbindung.');
 try{
  const [site,db]=await Promise.allSettled([webReachable(),databaseReachable(activeClient)]);
  if(!running(token))return;
  if(site.status==='fulfilled'&&site.value.ok)healthSet('web','ok','GitHub Pages antwortet mit HTTP '+site.value.status+'.');
  else healthSet('web','error',site.status==='fulfilled'?'HTTP '+site.value.status+' beim Abruf':'Website-Abruf vom Gerät fehlgeschlagen.');
  if(db.status==='fulfilled'&&db.value.ok)healthSet('db','ok','Supabase antwortet auf die geschützte Owner-Abfrage.');
  else healthSet('db','error','Owner-Datenbankabfrage von diesem Gerät fehlgeschlagen.');
  $('ownerHealthChecked').textContent='Zuletzt geprüft: '+new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'medium'}).format(new Date());
  // A confirmed empty Owner policy result is an account revoke, not a network outage.
  if(db.status==='fulfilled'&&db.value.unauthorized){
    $('ownerHealthChecked').textContent='Owner-Zugang nicht mehr freigegeben. Sitzung wird beendet.';
    $('signOut')?.click();
  }
 }finally{
  monitorBusy=false;
  if(running(token))button.disabled=false;
 }
}
$('ownerHealthRefresh').addEventListener('click',()=>{if(client)void refreshHealth();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&client&&!ownerOnly.hidden)void refreshHealth();});

function close(){
 generation++;
 if(monitorTimer!==null){clearInterval(monitorTimer);monitorTimer=null;}
 monitorBusy=false;client=null;ownerId=null;staffRows=[];
 editReset();
 $('ownerStaffCount').textContent='–';
 note('ownerStaffFeedback','');
 clear('ownerStaffList','Teamkonten werden nach dem Owner-Login geladen.');
 clear('ownerActivityList','Aktivitäten werden nach dem Owner-Login geladen.');
 clear('ownerLegacyHistoryList','Bisherige Historie wird nach dem Owner-Login geladen.');
 healthSet('web','idle','Erreichbarkeit wird nach dem Owner-Login geprüft.');
 healthSet('db','idle','Owner-Berechtigung wird nach dem Login geprüft.');
 $('ownerHealthChecked').textContent='Noch kein Check durchgeführt.';
 $('ownerHealthRefresh').disabled=false;
 // Close protected panels to avoid showing stale records after sign-out.
 for(const id of ['ownerRoles','ownerActivity','ownerSystem'])$(id).open=false;
}
async function open(authClient){
 close();
 if(!authClient||ownerOnly.hidden)return;
 const token=generation, activeClient=authClient;
 try{
  const [identity,ownerCheck]=await Promise.all([
   authClient.auth.getUser(),
   authClient.from('frost_admins').select('user_id').limit(1)
  ]);
  if(token!==generation||ownerOnly.hidden)return;
  if(identity.error||!identity.data?.user||ownerCheck.error||!ownerCheck.data?.some(r=>r.user_id===identity.data.user.id)){
   console.warn('Owner toolkit: authenticated Owner check failed');
   $('signOut')?.click();
   return;
  }
  ownerId=identity.data.user.id;
  client=activeClient;
  await Promise.allSettled([loadStaff(),loadActivity(),refreshHealth()]);
  if(!running(token))return;
  monitorTimer=setInterval(()=>{if(client&&!document.hidden&&!ownerOnly.hidden)void refreshHealth();},60000);
 }catch(err){
  if(token===generation){console.warn('Owner toolkit initialization failed',err);note('ownerStaffFeedback','Die Owner-Tools können gerade nicht geladen werden.',true);}
 }
}
window.FrostOwnerTools=Object.freeze({open,close});
})();

/* Frost Skaters private team calendar. Dates are stored as local calendar dates
   and optional wall-clock times (Germany), so daylight-saving offsets do not move events.
   Supabase RLS is the source of truth for read/write permissions. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.FROST_MEMBERS_CONFIG||{};
const ready=Boolean(window.supabase)
 && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl||'')
 && /^(eyJ|sb_publishable_)/.test(cfg.supabaseAnonKey||'');
const client=ready?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
}):null;

const roles={owner:'👑 Owner',coowner:'❄️ Co-Owner',manager:'📋 Managerin',supporter:'🧊 Team-Supporter'};
const kinds={outing:'⛸️ Ausflug',meeting:'👑 Teamtreffen',training:'❄️ Training',other:'📌 Sonstiges'};
const states={planning:'In Planung',confirmed:'Bestätigt',cancelled:'Abgesagt'};
const categories=Object.keys(kinds);
const statuses=Object.keys(states);
const formatDayNumber=new Intl.DateTimeFormat('de-DE',{day:'numeric'});
const monthFormatter=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'});
const fullFormatter=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const shortMonthFormatter=new Intl.DateTimeFormat('de-DE',{month:'short'});
const localDate=(year,month,day)=>new Date(year,month,day,12,0,0);
const isoDate=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const parseISO=stamp=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(stamp||''))return null;
 const [y,m,d]=stamp.split('-').map(Number);
 const date=localDate(y,m-1,d);
 return isoDate(date)===stamp?date:null;
};
const todayISO=()=>isoDate(new Date());
const strTime=time=>time?String(time).slice(0,5)+' Uhr':'Uhrzeit offen';
const h=(tag,className,content)=>{
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(content!==undefined)el.textContent=String(content);
 return el;
};
const feedback=(id,message,error=false)=>{
 const el=$(id);el.textContent=message||'';
 el.className='tt-feedback'+(error?' error':'');
};
const button=(text,callback,style='tt-outline')=>{
 const b=h('button','tt-button '+style,text);
 b.type='button';b.addEventListener('click',callback);
 return b;
};
const formatDate=value=>{
 const date=parseISO(value);
 return date?fullFormatter.format(date):value;
};
const compare=(a,b)=>a.event_date.localeCompare(b.event_date)
 ||String(a.start_time||'').localeCompare(String(b.start_time||''))
 ||a.title.localeCompare(b.title,'de');

let user=null,role=null,events=[],selectedDate=todayISO(),viewDate=localDate(new Date().getFullYear(),new Date().getMonth(),1);
let editingId=null,liveChannel=null,pollTimer=null,sessionEpoch=0;
const mayEdit=()=>Boolean(user&&['owner','coowner','manager'].includes(role));
const authed=()=>Boolean(user&&roles[role]);

function stopLive(){
 if(liveChannel&&client)client.removeChannel(liveChannel);
 liveChannel=null;
 if(pollTimer!==null)clearInterval(pollTimer);
 pollTimer=null;
}
function clearPrivate(){
 sessionEpoch++;
 stopLive();user=null;role=null;events=[];editingId=null;
 $('tcPrivate').hidden=true;
 $('tcLogin').hidden=false;
 $('tcNewOnDay').hidden=true;
 $('tcGrid').replaceChildren();
 $('tcDayEntries').replaceChildren();
 $('tcUpcoming').replaceChildren();
 if($('tcDialog').open)$('tcDialog').close();
}
async function authorize(){
 if(!client)throw Error('Die Verbindung zur Datenbank ist nicht verfügbar.');
 const marker=++sessionEpoch;
 const {data:identity,error:authErr}=await client.auth.getUser();
 if(authErr||!identity?.user)throw Error('Bitte melde dich mit deinem Teamkonto an.');
 const {data:teamRole,error:roleErr}=await client.rpc('frost_team_my_role');
 if(roleErr)throw roleErr;
 if(marker!==sessionEpoch)return;
 if(!roles[teamRole]){
   await client.auth.signOut();
   throw Error('Dieses Konto wurde noch nicht vom Owner für die Team Lounge freigeschaltet.');
 }
 user=identity.user;role=teamRole;
 $('tcLogin').hidden=true;
 $('tcPrivate').hidden=false;
 $('tcRoleLabel').textContent=roles[role]+' · '+(user.email||'Teammitglied');
 $('tcNewOnDay').hidden=!mayEdit();
 await refreshEvents();
 startLive();
}
$('tcLoginForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client){feedback('tcLoginFeedback','Die Teamdatenbank ist nicht erreichbar.',true);return;}
 const btn=$('tcLoginButton');btn.disabled=true;
 feedback('tcLoginFeedback','Prüfe deinen Zugang …');
 try{
   const {error}=await client.auth.signInWithPassword({email:$('tcEmail').value.trim(),password:$('tcPassword').value});
   $('tcPassword').value='';
   if(error)throw error;
   await authorize();
   feedback('tcLoginFeedback','');
 }catch(err){
   console.warn('Calendar login failed',err);
   if(!authed())clearPrivate();
   const message=err.message?.includes('noch nicht vom Owner')
      ?err.message:'Login nicht möglich. Bitte E-Mail, Passwort und Team-Freigabe prüfen.';
   feedback('tcLoginFeedback',message,true);
 }finally{btn.disabled=false;}
});
$('tcLogout').addEventListener('click',async()=>{
 clearPrivate();
 try{await client?.auth.signOut();}catch(e){console.warn('Logout',e);}
 feedback('tcLoginFeedback','Du bist abgemeldet.');
});
$('tcReload').addEventListener('click',()=>refreshEvents().catch(e=>{
 console.warn('Calendar refresh failed',e);
 feedback('tcFeedback','Die Termine konnten gerade nicht aktualisiert werden.',true);
}));

async function refreshEvents(){
 if(!authed())return;
 const marker=sessionEpoch;
 const {data,error}=await client.from('frost_team_calendar')
   .select('id,title,kind,event_date,start_time,place,notes,state,created_by,created_at,updated_at')
   .order('event_date',{ascending:true})
   .order('start_time',{ascending:true,nullsFirst:true})
   .limit(1000);
 if(error)throw error;
 if(marker!==sessionEpoch||!authed())return;
 events=(data||[]).sort(compare);
 render();
 feedback('tcFeedback',events.length>=1000?'Es werden maximal 1.000 Termine geladen. Für ältere Einträge bitte einen Owner fragen.':'');
}
function startLive(){
 stopLive();
 if(!client||!authed())return;
 liveChannel=client.channel('frost-team-calendar-changes')
  .on('postgres_changes',{event:'*',schema:'public',table:'frost_team_calendar'},()=>{
    if(authed())refreshEvents().catch(console.warn);
  }).subscribe();
 let cycle=0;
 pollTimer=setInterval(async()=>{
  if(!authed()||document.hidden)return;
  cycle++;
  if(cycle%3===0){
   try{
    const {data:newRole,error}=await client.rpc('frost_team_my_role');
    if(!error&&newRole!==role){
      clearPrivate();
      await client.auth.signOut();
      feedback('tcLoginFeedback','Deine Team-Berechtigung hat sich geändert. Bitte melde dich neu an.',true);
      return;
    }
   }catch(e){console.warn('Calendar role check failed',e);}
  }
  if(authed())refreshEvents().catch(console.warn);
 },20000);
}
function visibleEvents(){
 const filter=$('tcFilter').value;
 return filter==='all'?events:events.filter(event=>event.kind===filter);
}
function currentSelectedEvents(){
 return visibleEvents().filter(event=>event.event_date===selectedDate).sort(compare);
}
function selectDay(stamp){
 const date=parseISO(stamp);
 if(!date)return;
 selectedDate=stamp;
 viewDate=localDate(date.getFullYear(),date.getMonth(),1);
 render();
}
function shiftMonth(delta){
 const next=localDate(viewDate.getFullYear(),viewDate.getMonth()+delta,1);
 viewDate=next;
 selectedDate=isoDate(next);
 render();
}
$('tcPrev').addEventListener('click',()=>shiftMonth(-1));
$('tcNext').addEventListener('click',()=>shiftMonth(1));
$('tcToday').addEventListener('click',()=>{
 const now=new Date();
 viewDate=localDate(now.getFullYear(),now.getMonth(),1);
 selectedDate=todayISO();render();
});
$('tcFilter').addEventListener('change',render);

function render(){
 if(!authed())return;
 renderMonth();
 renderSelected();
 renderUpcoming();
 renderNext();
}
function renderMonth(){
 const year=viewDate.getFullYear(),month=viewDate.getMonth();
 $('tcMonthLabel').textContent=monthFormatter.format(viewDate);
 const grid=$('tcGrid');grid.replaceChildren();
 const first=localDate(year,month,1);
 const offset=(first.getDay()+6)%7;  // Monday first.
 const numberOfDays=localDate(year,month+1,0).getDate();
 const list=visibleEvents();
 const map=new Map();
 for(const event of list){
  const dayEvents=map.get(event.event_date)||[];
  dayEvents.push(event);map.set(event.event_date,dayEvents);
 }
 for(let i=0;i<offset;i++)grid.append(h('div','tc-blank'));
 for(let day=1;day<=numberOfDays;day++){
   const date=localDate(year,month,day);
   const stamp=isoDate(date);
   const dayEvents=map.get(stamp)||[];
   const cell=h('button','tc-day');
   cell.type='button';
   cell.classList.toggle('is-selected',stamp===selectedDate);
   cell.classList.toggle('is-today',stamp===todayISO());
   cell.classList.toggle('is-weekend',[0,6].includes(date.getDay()));
   cell.setAttribute('aria-label',formatDate(stamp)+(dayEvents.length?', '+dayEvents.length+' Termine':''));
   cell.setAttribute('aria-pressed',String(stamp===selectedDate));
   cell.append(h('span','tc-day-number',formatDayNumber.format(date)));
   if(dayEvents.length){
     const dots=h('span','tc-event-dots');
     for(const event of dayEvents.slice(0,4))dots.append(h('i',event.kind));
     cell.append(dots,h('span','tc-day-count',dayEvents.length===1?'1 Termin':dayEvents.length+' Termine'));
   }
   cell.addEventListener('click',()=>selectDay(stamp));
   grid.append(cell);
 }
 const minimumCells=Math.ceil((offset+numberOfDays)/7)*7;
 for(let i=offset+numberOfDays;i<minimumCells;i++)grid.append(h('div','tc-blank'));
}
function renderCard(event){
 const card=h('article','tc-event-card '+event.kind);
 const head=h('header');
 head.append(
    h('span','tc-kind-badge',kinds[event.kind]||event.kind),
    h('span','tc-state-badge '+event.state,states[event.state]||event.state)
 );
 card.append(head,h('h3','',event.title));
 card.append(h('p','', '🕓 '+strTime(event.start_time)));
 if(event.place)card.append(h('p','', '📍 '+event.place));
 if(event.notes)card.append(h('p','',event.notes));
 if(mayEdit()){
    const actions=h('div','tc-event-actions');
    actions.append(button('✏️ Bearbeiten',()=>openEditor(event),'tt-outline'));
    actions.append(button('🗑️ Löschen',()=>deleteEntry(event),'tt-danger'));
    card.append(actions);
 }
 return card;
}
function renderSelected(){
 $('tcSelectedLabel').textContent=formatDate(selectedDate);
 const list=$('tcDayEntries');list.replaceChildren();
 const items=currentSelectedEvents();
 if(items.length){
   items.forEach(event=>list.append(renderCard(event)));
 }else{
   list.append(h('div','tc-empty','Hier steht noch nichts im Kalender.'+(mayEdit()?' Über „Neuer Termin“ kannst du etwas planen.':'')));
 }
 $('tcNewOnDay').hidden=!mayEdit();
}
function renderUpcoming(){
 const list=$('tcUpcoming');list.replaceChildren();
 const future=visibleEvents().filter(e=>e.event_date>=todayISO()&&e.state!=='cancelled').slice(0,8);
 if(!future.length){list.append(h('div','tc-empty','Noch keine kommenden Termine eingetragen.'));return;}
 for(const event of future){
  const date=parseISO(event.event_date);
  if(!date)continue;
  const item=h('button','tc-upcoming-item');
  item.type='button';
  const d=h('span','tc-upcoming-date');
  d.append(h('strong','',date.getDate()),h('small','',shortMonthFormatter.format(date).replace('.','').toUpperCase()));
  const body=h('span','tc-upcoming-body');
  body.append(h('strong','',event.title),h('small','',strTime(event.start_time)+' · '+(states[event.state]||event.state)));
  item.append(d,body);
  item.setAttribute('aria-label',event.title+', '+formatDate(event.event_date));
  item.addEventListener('click',()=>{
    selectDay(event.event_date);
    $('tcDayEntries').scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  list.append(item);
 }
}
function renderNext(){
 const next=events.filter(e=>e.event_date>=todayISO()&&e.state!=='cancelled').sort(compare)[0];
 if(!next){
  $('tcNextDescription').textContent='Noch kein kommender Termin eingetragen. Bald plant ihr hier eure nächsten gemeinsamen Aktionen.';
  return;
 }
 $('tcNextDescription').textContent=next.title+' · '+formatDate(next.event_date)+' · '+strTime(next.start_time)
   +(next.place?' · '+next.place:'')+' · '+(states[next.state]||next.state);
}

function openEditor(event=null){
 if(!mayEdit())return;
 editingId=event?.id||null;
 $('tcDialogHeading').textContent=event?'Termin bearbeiten':'Neuen Termin eintragen';
 $('tcEventForm').reset();
 $('tcTitle').value=event?.title||'';
 $('tcKind').value=event?.kind||'meeting';
 $('tcState').value=event?.state||'planning';
 $('tcDate').value=event?.event_date||selectedDate;
 $('tcTime').value=event?.start_time?.slice(0,5)||'';
 $('tcPlace').value=event?.place||'';
 $('tcNotes').value=event?.notes||'';
 feedback('tcDialogFeedback','');
 $('tcDialog').showModal();
 $('tcTitle').focus();
}
$('tcNewOnDay').addEventListener('click',()=>openEditor());
const closeEditor=()=>{editingId=null;if($('tcDialog').open)$('tcDialog').close();};
$('tcCancel').addEventListener('click',closeEditor);
$('tcDialogClose').addEventListener('click',closeEditor);
$('tcDialog').addEventListener('close',()=>{editingId=null;});
$('tcEventForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!mayEdit()){feedback('tcDialogFeedback','Du darfst keine Termine bearbeiten.',true);return;}
 const title=$('tcTitle').value.trim().replace(/\s+/g,' ');
 const kind=$('tcKind').value,state=$('tcState').value;
 const date=$('tcDate').value,time=$('tcTime').value;
 const place=$('tcPlace').value.trim(),notes=$('tcNotes').value.trim();
 if(title.length<3||title.length>100||!categories.includes(kind)||!statuses.includes(state)
   ||!parseISO(date)||place.length>100||notes.length>500|| (time&&!/^\d{2}:\d{2}$/.test(time))){
   feedback('tcDialogFeedback','Bitte Titel, Datum und weitere Angaben kontrollieren.',true);return;
 }
 const btn=$('tcSave');btn.disabled=true;
 try{
   const payload={title,kind,state,event_date:date,start_time:time||null,place,notes};
   const existing=editingId;
   let response;
   if(existing){
     response=await client.from('frost_team_calendar').update(payload).eq('id',existing).select('id');
   }else{
     response=await client.from('frost_team_calendar').insert({...payload,created_by:user.id}).select('id');
   }
   if(response.error)throw response.error;
   if(!response.data?.length)throw new Error('Der Datensatz wurde nicht geändert');
   closeEditor();
   selectedDate=date;
   const parsed=parseISO(date);
   viewDate=localDate(parsed.getFullYear(),parsed.getMonth(),1);
   await refreshEvents();
   feedback('tcFeedback',existing?'Termin wurde aktualisiert.':'Termin ist im Team-Kalender gespeichert.');
   $('tcDayEntries').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(err){
   console.warn('Calendar save failed',err);
   feedback('tcDialogFeedback','Der Termin konnte nicht gespeichert werden. Bitte Team-Rechte und Verbindung prüfen.',true);
 }finally{btn.disabled=false;}
});
async function deleteEntry(event){
 if(!mayEdit()||!window.confirm('Termin „'+event.title+'“ wirklich für das ganze Team löschen?'))return;
 try{
   const {data,error}=await client.from('frost_team_calendar').delete().eq('id',event.id).select('id');
   if(error)throw error;
   if(!data?.length)throw new Error('Deletion not permitted');
   await refreshEvents();
   feedback('tcFeedback','Termin wurde gelöscht.');
 }catch(err){
   console.warn('Calendar delete failed',err);
   feedback('tcFeedback','Löschen fehlgeschlagen. Bitte noch einmal versuchen.',true);
 }
}

if(!ready)feedback('tcLoginFeedback','Die Supabase-Verbindung ist momentan nicht verfügbar.',true);
else client.auth.getSession().then(async({data})=>{
 if(!data?.session)return;
 try{await authorize();}
 catch(e){console.warn('Calendar session not authorized',e);clearPrivate();}
}).catch(e=>{console.warn('Calendar auth unavailable',e);});
})();
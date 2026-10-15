/* FROSTVERSE · 1.1 interactive worlds.
 * Fully browser-local: no analytics, third-party SDK, geolocation, private member data or microphone.
 * Persistent items: preferred color season and voluntary local time capsule ONLY.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const status=(id,message)=>{const e=$(id);if(e)e.textContent=message;};
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const localDate=(d=new Date())=>[
 String(d.getFullYear()).padStart(4,'0'),
 String(d.getMonth()+1).padStart(2,'0'),
 String(d.getDate()).padStart(2,'0')
].join('-');
const addDays=(days)=>{const d=new Date();d.setDate(d.getDate()+days);return localDate(d);};
const safeStore={
 get:key=>{try{return localStorage.getItem(key)}catch{return null}},
 set:(key,val)=>{try{localStorage.setItem(key,val);return true}catch{return false}},
 remove:key=>{try{localStorage.removeItem(key)}catch{return false}}
};

// 42 / Season Transformation: deterministic month, no location permission.
const seasonKey='frostverse.season.v1';
const seasons={winter:{name:'❄ Ice Winter',icon:'❄'},spring:{name:'✿ Aurora Spring',icon:'✿'},summer:{name:'☀ Summer Neon',icon:'☀'},autumn:{name:'✦ Autumn Frost',icon:'✦'}};
const seasonForMonth=m=>m===12||m<=2?'winter':m<=5?'spring':m<=8?'summer':'autumn';
function renderSeason(){
 const value=$('fvSeasonPick').value;
 const seasonal=value==='auto'?seasonForMonth(new Date().getMonth()+1):value;
 const name=seasons[seasonal]||seasons.winter;
 document.body.dataset.season=seasonal;
 $('fvSeasonIcon').textContent=name.icon;
 status('fvSeasonStatus',value==='auto'?'Automatisch aktiv: '+name.name+'.':'Dein Design: '+name.name+'.');
}
const cached=safeStore.get(seasonKey);
if(['auto',...Object.keys(seasons)].includes(cached))$('fvSeasonPick').value=cached;
$('fvSeasonPick').addEventListener('change',()=>{
 safeStore.set(seasonKey,$('fvSeasonPick').value);
 renderSeason();chime(370,.08);
});
renderSeason();

// 35 / Audio Experience: originally generated Web Audio notes after explicit user gesture.
let audioOn=false,audioContext=null;
function chime(frequency=490,duration=.11){
 if(!audioOn)return;
 const Ctx=window.AudioContext||window.webkitAudioContext;
 if(!Ctx)return;
 try{
  if(!audioContext)audioContext=new Ctx();
  if(audioContext.state==='suspended')void audioContext.resume();
  const start=audioContext.currentTime;
  const osc=audioContext.createOscillator();
  const gain=audioContext.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(frequency,start);
  osc.frequency.exponentialRampToValueAtTime(frequency*1.32,start+duration);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(.036,start+.015);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration+.07);
  osc.connect(gain);gain.connect(audioContext.destination);
  osc.start(start);osc.stop(start+duration+.08);
 }catch(err){console.warn('Frostverse Audio not available',err);}
}
$('fvSound').addEventListener('click',()=>{
 audioOn=!audioOn;
 $('fvSound').setAttribute('aria-pressed',String(audioOn));
 $('fvSound').textContent=audioOn?'♫ Sound ausschalten':'♫ Sound einschalten';
 if(audioOn)chime(620,.24);
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&audioContext?.state==='running')void audioContext.suspend();
});
document.querySelectorAll('.fv-portal,.fv-skate-presets button,.fv-tv-buttons button').forEach(el=>el.addEventListener('click',()=>chime(380,.08)));

// 36 / Frost Effect Engine: opt-in particles, reduced-motion respected.
const snow=$('fvSnow');
const snowButton=$('fvEffects');
let snowEnabled=false;
const flakes=Array.from({length:18},(_,i)=>({
 x:((i*53+17)%100)+'%',
 size:(9+(i*7)%12)+'px',
 seconds:(9+(i*3)%13)+'s',
 delay:-((i*2)%15)+'s',
 opacity:(.25+(i%5)*.12).toFixed(2)
}));
function renderSnow(){
 snow.replaceChildren();
 const canSnow=snowEnabled&&!reduceMotion?.matches;
 snow.hidden=!canSnow;
 if(canSnow){
  for(const item of flakes){
   const flake=document.createElement('span');
   flake.className='fv-snowflake';flake.textContent='❄';
   flake.style.setProperty('--left',item.x);flake.style.setProperty('--size',item.size);
   flake.style.setProperty('--duration',item.seconds);
   flake.style.setProperty('--delay',item.delay);
   flake.style.setProperty('--opacity',item.opacity);
   snow.append(flake);
  }
 }
 snowButton.setAttribute('aria-pressed',String(canSnow));
 snowButton.textContent=canSnow?'❄ Schneeeffekte ausschalten':reduceMotion?.matches?'❄ Effekte wegen Bewegungseinstellung aus':'❄ Schneeeffekte einschalten';
 snowButton.disabled=Boolean(reduceMotion?.matches);
}
snowButton.addEventListener('click',()=>{
 snowEnabled=!snowEnabled;renderSnow();chime(520,.07);
});
reduceMotion?.addEventListener?.('change',renderSnow);
renderSnow();

// 32 / Event Launch: date-only, never claims a confirmed meeting time.
const dateOfEvent=new Date(2027,0,3,0,0,0,0);
function updateCountdown(){
 const ms=dateOfEvent.getTime()-Date.now();
 if(ms<=0){
  $('fvDays').textContent='00';$('fvHours').textContent='00';$('fvMinutes').textContent='00';
  status('fvTimerNote','Das angegebene Kalenderdatum ist vorbei. Neue Termine bitte auf der Eventseite prüfen.');
  return;
 }
 const minutes=Math.floor(ms/60000);
 $('fvDays').textContent=String(Math.floor(minutes/1440)).padStart(2,'0');
 $('fvHours').textContent=String(Math.floor(minutes%1440/60)).padStart(2,'0');
 $('fvMinutes').textContent=String(minutes%60).padStart(2,'0');
 status('fvTimerNote','Bis 03.01.2027, 00:00 Uhr · Datumscountdown, keine Treffzeit');
}
updateCountdown();setInterval(()=>{if(!document.hidden)updateCountdown();},60000);

// 38 / Expedition Map: city-level links only and no geolocation.
const mapPlaces={
 reutlingen:{title:'Reutlingen',body:'Hier gibt es Eislaufangebote. Aktuelle Termine, Preise und Zugänglichkeit bitte beim Anbieter prüfen.',search:'Eishalle Reutlingen'},
 heilbronn:{title:'Heilbronn',body:'Als Ausflugsziel für den 3. Januar 2027 auf der Eventseite genannt. Details zur Eishalle bitte beim Betreiber prüfen.',search:'Eishalle Heilbronn'},
 stuttgart:{title:'Stuttgart',body:'Eine weitere Region für mögliche Eislaufausflüge – noch kein bestätigter Frost-Skaters-Termin.',search:'Eislaufhalle Stuttgart'},
 tuebingen:{title:'Tübingen & Umgebung',body:'Saisonale Angebote in der Region. Nicht jeder Ort hat eine dauerhaft offene Eishalle.',search:'Eislaufen Tübingen'}
};
for(const button of document.querySelectorAll('.fv-map-pin')){
 button.addEventListener('click',()=>{
  const info=mapPlaces[button.dataset.map];
  if(!info)return;
  document.querySelectorAll('.fv-map-pin').forEach(b=>b.classList.toggle('is-active',b===button));
  status('fvMapPlace',info.title);status('fvMapDescription',info.body);
  $('fvMapSearch').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(info.search);
  $('fvMapSearch').textContent='Eishallen in '+info.title+' suchen ↗';
  chime(430,.08);
 });
}

// 40 / Frost TV: hand-curated public news slides; no fabricated videos/live streams.
const headlines=[
 {tag:'WEBSITE UPDATE · 15.10.2026',title:'Frost Skaters 1.1',body:'Neuer Look, neue Features und eine eigene Website-Updates-Seite.'},
 {tag:'GEPLANTES EVENT · 03.01.2027',title:'Nächster Stopp: Heilbronn.',body:'Geplanter gemeinsamer Eislauf-Ausflug am 3. Januar. Treffzeit und Ort werden noch bestätigt.'},
 {tag:'COMMUNITY FEATURE',title:'Deine Frost Member Card.',body:'Digitale Mitgliedskarten mit privatem Code, QR-Ansicht und persönlicher Owner-Freigabe.'}
];
let tvIdx=0,tvTimer=null;
function updateTv(){
 const h=headlines[tvIdx];
 status('fvTvTag',h.tag);status('fvTvHeading',h.title);status('fvTvBody',h.body);
 status('fvTvCounter',String(tvIdx+1).padStart(2,'0')+' / '+String(headlines.length).padStart(2,'0'));
}
const slide=(direction)=>{tvIdx=(tvIdx+direction+headlines.length)%headlines.length;updateTv();};
$('fvTvNext').addEventListener('click',()=>slide(1));
$('fvTvPrev').addEventListener('click',()=>slide(-1));
function pauseTv(){
 if(tvTimer!==null){clearInterval(tvTimer);tvTimer=null;}
 $('fvTvPlay').setAttribute('aria-pressed','false');
 $('fvTvPlay').textContent='▶ Automatisch';
 $('fvTvSlide').setAttribute('aria-live','polite');
}
$('fvTvPlay').addEventListener('click',()=>{
 if(tvTimer!==null){pauseTv();return;}
 $('fvTvPlay').setAttribute('aria-pressed','true');
 $('fvTvPlay').textContent='⏸ Pausieren';
 $('fvTvSlide').setAttribute('aria-live','off');
 tvTimer=setInterval(()=>{if(!document.hidden)slide(1);},6500);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseTv();});
updateTv();

// 41 / Skate Customizer: stylized vector preview, no personal info.
const fields=['fvBootColor','fvPanelColor','fvCuffColor'];
const svgIDs=['fvSkateBoot','fvSkatePanel','fvSkateCuff'];
const presets={
 glacier:['#84ebef','#f3a5ee','#2c2959'],
 royal:['#9888ef','#88fff2','#141b38'],
 flame:['#ff9d90','#f89bdf','#281938']
};
const isHex=s=>/^#[0-9a-f]{6}$/i.test(s);
function refreshSkate(){
 fields.forEach((id,i)=>{
  const color=$(id).value;
  if(isHex(color))$(svgIDs[i]).setAttribute('fill',color);
 });
}
fields.forEach(id=>$(id).addEventListener('input',refreshSkate));
for(const button of document.querySelectorAll('[data-preset]')){
 button.addEventListener('click',()=>{
  const palette=presets[button.dataset.preset];if(!palette)return;
  palette.forEach((color,i)=>$(fields[i]).value=color);
  refreshSkate();
  status('fvSkateStatus','Farbdesign „'+button.dataset.preset+'“ gewählt. Du kannst die Farben einzeln ändern.');
 });
}
refreshSkate();
$('fvSkateExport').addEventListener('click',async()=>{
 const btn=$('fvSkateExport');btn.disabled=true;
 let imageURL=null;
 try{
  const copy=$('fvSkateSvg').cloneNode(true);
  copy.setAttribute('width','1360');copy.setAttribute('height','920');
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
  const xml=new XMLSerializer().serializeToString(copy);
  imageURL=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('SVG konnte nicht geladen werden'));image.src=imageURL;});
  const canvas=document.createElement('canvas');
  canvas.width=1360;canvas.height=920;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Canvas nicht verfügbar');
  ctx.fillStyle='#0d1830';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const fileURL=canvas.toDataURL('image/png');
  const a=document.createElement('a');
  a.href=fileURL;a.download='frost-skates-design.png';
  document.body.append(a);a.click();a.remove();
  status('fvSkateStatus','✅ Dein Skate-Design wurde als PNG vorbereitet. Falls nichts passiert, prüfe die Download-Erlaubnis des Browsers.');
  chime(680,.19);
 }catch(err){
  console.warn('Skate customizer export',err);
  status('fvSkateStatus','Das Bild konnte hier nicht gespeichert werden. Du kannst einen Screenshot von der Vorschau machen.');
 }finally{
  if(imageURL)URL.revokeObjectURL(imageURL);
  btn.disabled=false;
 }
});

// 39 / Time Capsule: explicitly opt-in local device storage, not secret encryption.
const capsuleKey='frostverse.capsule.v1';
const datePicker=$('fvCapsuleDate');
datePicker.min=addDays(1);
datePicker.max=addDays(366*4);
datePicker.value=addDays(60);
function readCapsule(){
 const raw=safeStore.get(capsuleKey);
 if(!raw)return null;
 try{
  const data=JSON.parse(raw);
  if(!data||typeof data.text!=='string'||typeof data.date!=='string'
    ||data.text.length<1||data.text.length>220||!/^\d{4}-\d{2}-\d{2}$/.test(data.date))return null;
  return data;
 }catch{return null;}
}
function renderCapsule(){
 const data=readCapsule();
 if(!data){
  status('fvCapsuleState','Noch keine Kapsel.');
  status('fvCapsuleMessage','Speichere eine kleine Nachricht und wähle den Tag, ab dem sie dir wieder angezeigt werden soll.');
  return;
 }
 if(localDate()>=data.date){
  status('fvCapsuleState','Kapsel geöffnet. ✦');
  status('fvCapsuleMessage',data.text+'\n\nDu kannst diese Nachricht jetzt löschen oder eine neue Kapsel speichern.');
 }else{
  status('fvCapsuleState','Bis '+new Intl.DateTimeFormat('de-DE',{dateStyle:'long'}).format(new Date(data.date+'T12:00:00'))+' verschlossen.');
  status('fvCapsuleMessage','Deine Nachricht bleibt hier auf diesem Gerät gespeichert. Sie ist keine verschlüsselte Nachricht. Du kannst sie jederzeit löschen.');
 }
}
$('fvCapsuleForm').addEventListener('submit',event=>{
 event.preventDefault();
 const text=$('fvCapsuleText').value.trim();
 const date=datePicker.value;
 if(!text||text.length>220||date<datePicker.min||date>datePicker.max){
  status('fvCapsuleMessage','Bitte eine kurze Nachricht und ein zukünftiges Datum auswählen.');
  return;
 }
 if(!safeStore.set(capsuleKey,JSON.stringify({text,date}))){
  status('fvCapsuleMessage','Dieser Browser erlaubt keine lokale Speicherung. Die Kapsel kann hier nicht gespeichert werden.');
  return;
 }
 $('fvCapsuleText').value='';
 renderCapsule();chime(540,.14);
});
$('fvCapsuleDelete').addEventListener('click',()=>{
 if(readCapsule()&&!window.confirm('Deine lokal gespeicherte Frost-Kapsel löschen?'))return;
 safeStore.remove(capsuleKey);
 renderCapsule();
});
renderCapsule();

// Reading progress presentation
const progress=$('fvScrollProgress');
let frame=null;
function progressUpdate(){
 frame=null;
 const max=document.documentElement.scrollHeight-innerHeight;
 progress.style.width=(max>0?Math.min(100,Math.max(0,scrollY/max*100)):0).toFixed(2)+'%';
}
document.addEventListener('scroll',()=>{if(frame===null)frame=requestAnimationFrame(progressUpdate);},{passive:true});
window.addEventListener('resize',progressUpdate,{passive:true});
progressUpdate();
})();
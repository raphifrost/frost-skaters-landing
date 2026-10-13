(()=>{
'use strict';
const $=id=>document.getElementById(id);
const c=window.FROST_MEMBERS_CONFIG||{};
const ready=Boolean(window.supabase)&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(c.supabaseUrl||'')&&/^(sb_publishable_|eyJ)/.test(c.supabaseAnonKey||'');
const client=ready?window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey,{auth:{persistSession:false,detectSessionInUrl:false,autoRefreshToken:false}}):null;
const years=[],currentYear=new Date().getFullYear();
for(let year=currentYear+1;year>=2025;year--)years.push(year);
const el=(name,cls,txt)=>{const n=document.createElement(name);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
let items=[];
const select=$('recapYear');
for(const year of years){const option=el('option','',year);option.value=String(year);select.append(option);}
select.value=String(currentYear);
function yearOf(it){
 const value=it.kind==='event'&&it.event_at?it.event_at:it.created_at;
 const d=new Date(value);return Number.isNaN(+d)?0:d.getFullYear();
}
function render(){
 const year=Number(select.value);
 $('recapNumber').textContent=String(year);
 $('recapIntro').textContent=year===2025?'❄️ 2025: In diesem Jahr begann die Geschichte von Frost Skaters.':'❄️ Hier sind die veröffentlichten Highlights aus '+year+'.';
 const data=items.filter(x=>yearOf(x)===year);
 const labels=[['event','Veröffentlichte Events'],['news','Neuigkeiten'],['challenge','Challenges'],['gallery','Galerie-Beiträge'],['history','Geschichten']];
 $('recapStats').replaceChildren(...labels.map(([kind,label])=>{
  const card=el('article','fh-panel');card.append(el('strong','fh-metric',data.filter(i=>i.kind===kind).length),el('span','fh-mini',label));return card;
 }));
 const target=$('recapEntries');target.replaceChildren();
 if(!data.length)target.append(el('p','fh-hint','Für dieses Jahr sind noch keine Highlights veröffentlicht.'));
 for(const it of data.sort((a,b)=>new Date(b.event_at||b.created_at)-new Date(a.event_at||a.created_at))){
  const card=el('article','fh-panel recap-record');
  card.append(el('span','fh-chip',it.kind==='event'?'Event':it.kind==='gallery'?'Galerie':it.kind==='news'?'Neuigkeit':it.kind==='challenge'?'Challenge':'Crew-Moment'));
  card.append(el('h3','',it.title));
  if(it.body)card.append(el('p','',it.body));
  target.append(card);
 }
 $('recapOutput').classList.remove('recap-animate');void $('recapOutput').offsetWidth;$('recapOutput').classList.add('recap-animate');
}
select.addEventListener('change',render);
$('recapPrint').addEventListener('click',()=>window.print());
async function load(){
 if(!client){$('recapEntries').textContent='Die Datenbank ist gerade nicht erreichbar.';render();return;}
 try{
  const {data,error}=await client.from('frost_hub_items').select('kind,title,body,event_at,created_at').eq('visible',true).order('created_at',{ascending:false}).limit(500);
  if(error)throw error;items=data||[];
 }catch(error){console.error(error);$('recapIntro').textContent='Aktuelle Inhalte konnten nicht geladen werden.';}
 render();
}
load();
})();
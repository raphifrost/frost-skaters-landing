/* Frost Command / accessible local navigation · No backend or free-text logging.
 * Owner commands are shown only while the original authenticated dashboard is visible.
 */
(()=>{
'use strict';
const ownerDashboard=document.getElementById('dashboard');
const isOwnerPage=Boolean(ownerDashboard);
const allowed=[
 {title:'Frostverse',description:'Die interaktive Frost-Welt öffnen',symbol:'✦',url:'frostverse.html',tags:'start portal welt'},
 {title:'Events',description:'Aktuelle Ausflugsinformationen',symbol:'◷',url:'events.html',tags:'ausflug heilbronn'},
 {title:'Mitgliedskarten',description:'Karte beantragen oder ansehen',symbol:'▦',url:'mitglieder.html',tags:'frost id pro qr'},
 {title:'Crew / Leitung',description:'Die öffentliche Leitung kennenlernen',symbol:'♛',url:'leitung.html',tags:'team'},
 {title:'Eishallen',description:'Eishallen-Finder & Stadtregionen',symbol:'⌖',url:'eishallen.html',tags:'karte map reutlingen'},
 {title:'Frost TV',description:'Frost-News als Broadcast-Slides',symbol:'▣',url:'frostverse.html#tv',tags:'video news'},
 {title:'Skate Customizer',description:'Deine virtuellen Skates gestalten',symbol:'⛸',url:'frostverse.html#studio',tags:'schuhe design'},
 {title:'Time Capsule',description:'Lokale Nachricht an die Zukunft',symbol:'◇',url:'frostverse.html#capsule',tags:'erinnerung'},
 {title:'Website-Updates',description:'Versionsverlauf & neue Features',symbol:'↗',url:'website-updates.html',tags:'changelog'},
 {title:'Team Lounge / Login',description:'Zum geschützten Team-Anmeldebereich',symbol:'🔒',url:'team-talk.html',tags:'chat'},
 {title:'Frost Skaters Startseite',description:'Zurück zur offiziellen Website',symbol:'❄',url:'index.html',tags:'home'}
];
const ownerPublic=[{title:'Owner-Login',description:'Zum sicheren Anmeldeformular',symbol:'♛',url:'#signInPanel',tags:'anmelden'}];
const privateCommands=[
 {title:'Owner God Mode',description:'Deine private Kommandozentrale',symbol:'♛',url:'#ownerGodMode',tags:'god mode control'},
 {title:'Mitglieder verwalten',description:'Private Karten- und Mitgliederübersicht',symbol:'♟',url:'#loungeRoster',tags:'member'},
 {title:'Anträge prüfen',description:'Neue Bewerbungen bearbeiten',symbol:'▤',url:'#loungeRequests',tags:'pending'},
 {title:'Mitglied erstellen',description:'Neue Karte anlegen',symbol:'＋',url:'#loungeNew',tags:'add'},
 {title:'Team-Rechte',description:'Teamkonten und Rollen bearbeiten',symbol:'🛡',url:'#ownerRoles',tags:'manager support coowner'},
 {title:'Aktivitätsprotokoll',description:'Karten- und Teamänderungen ansehen',symbol:'◷',url:'#ownerActivity',tags:'log history'},
 {title:'System-Monitor',description:'Website und Supabase prüfen',symbol:'◉',url:'#ownerSystem',tags:'health'},
 {title:'GMX-Meldungen',description:'Private Benachrichtigungsübersicht',symbol:'✉',url:'#loungeMail',tags:'mail'},
 {title:'Team-Kalender',description:'Interne Termine im Loginbereich',symbol:'▦',url:'team-kalender.html',tags:'planning'}
];
function ownerUnlocked(){return Boolean(ownerDashboard&&!ownerDashboard.hidden);}
const fallbackInput=document.createElement('input');
const layer=document.createElement('div');layer.className='frost-command-layer';layer.hidden=true;
layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','Frost Command Schnellsuche');
const root=document.createElement('div');root.className='frost-command-shell';
const bar=document.createElement('div');bar.className='frost-command-bar';
const symbol=document.createElement('span');symbol.textContent='⌕';symbol.className='frost-command-search-icon';symbol.setAttribute('aria-hidden','true');
const input=document.createElement('input');input.className='frost-command-input';input.type='search';input.placeholder='Suche nach Seiten oder Befehlen …';input.setAttribute('aria-label','Seiten und Befehle suchen');input.setAttribute('autocomplete','off');input.setAttribute('spellcheck','false');input.maxLength=70;
const closeButton=document.createElement('button');closeButton.className='frost-command-close';closeButton.type='button';closeButton.textContent='ESC';closeButton.setAttribute('aria-label','Frost Command schließen');
bar.append(symbol,input,closeButton);
const heading=document.createElement('div');heading.className='frost-command-heading';heading.textContent='QUICK NAVIGATION / FROST COMMAND';
const items=document.createElement('div');items.className='frost-command-items';items.id='frostCommandItems';items.setAttribute('role','listbox');items.setAttribute('aria-label','Navigationsergebnisse');
input.setAttribute('aria-controls',items.id);
const footer=document.createElement('div');footer.className='frost-command-footer';
const help=document.createElement('span');help.textContent='↑↓ auswählen · Enter öffnen · Esc schließen';
const state=document.createElement('b');state.textContent='LOCAL SEARCH · KEIN TRACKING';
footer.append(help,state);
root.append(bar,heading,items,footer);layer.append(root);
document.body.append(layer);
let trigger=null,choices=[],selected=0;
const simplify=v=>String(v||'').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss');
function choicesForCurrentPage(){
 if(!isOwnerPage)return allowed;
 return [...(ownerUnlocked()?privateCommands:ownerPublic),...allowed];
}
function go(url){
 if(url.startsWith('#')){
  if(isOwnerPage&&url!=='#signInPanel'&&!ownerUnlocked()){close();return;}
  const el=document.getElementById(url.slice(1));if(!el){close();return;}
  // Open a protected tools card only after a verified Owner login.
  if(el.tagName==='DETAILS')el.open=true;
  close();
  el.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  return;
 }
 close();
 window.location.assign(new URL(url,location.href).href);
}
function render(){
 const term=simplify(input.value.trim());
 choices=choicesForCurrentPage().filter(o=>simplify(o.title+' '+o.description+' '+o.tags).includes(term)).slice(0,18);
 selected=Math.min(selected,Math.max(0,choices.length-1));
 items.replaceChildren();
 if(!choices.length){
  const empty=document.createElement('p');empty.className='frost-command-empty';empty.textContent='Keine passenden Seiten gefunden. Versuche einen anderen Begriff.';
  items.append(empty);return;
 }
 choices.forEach((command,i)=>{
  const button=document.createElement('button');button.className='frost-command-item'+(selected===i?' is-selected':'');button.type='button';button.setAttribute('role','option');button.setAttribute('aria-selected',String(i===selected));
  const ico=document.createElement('span');ico.className='frost-command-item-symbol';ico.textContent=command.symbol;ico.setAttribute('aria-hidden','true');
  const body=document.createElement('span');body.className='frost-command-item-name';
  const title=document.createElement('strong');title.textContent=command.title;
  const desc=document.createElement('small');desc.textContent=command.description;body.append(title,desc);
  const arrow=document.createElement('span');arrow.className='frost-command-item-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
  button.append(ico,body,arrow);button.addEventListener('click',()=>go(command.url));
  button.addEventListener('mouseenter',()=>{selected=i;items.querySelectorAll('.frost-command-item').forEach((x,k)=>{x.classList.toggle('is-selected',i===k);x.setAttribute('aria-selected',String(i===k));});});
  items.append(button);
 });
}
function open(){
 if(!layer.hidden)return;
 trigger=document.activeElement;
 input.value='';selected=0;layer.hidden=false;
 document.body.style.setProperty('--frost-command-open','1');
 render();input.focus();
}
function close(){
 if(layer.hidden)return;
 layer.hidden=true;input.value='';
 document.body.style.removeProperty('--frost-command-open');
 if(trigger?.isConnected&&typeof trigger.focus==='function')trigger.focus({preventScroll:true});
}
input.addEventListener('input',()=>{selected=0;render();});
closeButton.addEventListener('click',close);
layer.addEventListener('click',event=>{if(event.target===layer)close();});
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-frost-command-open]');
 if(button){event.preventDefault();open();}
});
document.addEventListener('keydown',event=>{
 const focusIsInput=event.target?.matches?.('input,textarea,select,[contenteditable="true"]');
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
  event.preventDefault();if(layer.hidden)open();else close();return;
 }
 if(layer.hidden&&event.key==='/'&&!focusIsInput){event.preventDefault();open();return;}
 if(layer.hidden)return;
 if(event.key==='Escape'){event.preventDefault();close();}
 else if(event.key==='ArrowDown'){event.preventDefault();selected=(selected+1)%Math.max(1,choices.length);render();}
 else if(event.key==='ArrowUp'){event.preventDefault();selected=(selected-1+Math.max(1,choices.length))%Math.max(1,choices.length);render();}
 else if(event.key==='Enter'&&choices[selected]){event.preventDefault();go(choices[selected].url);}
 else if(event.key==='Tab'){
  // Keep focus in the modal command palette.
  const focusable=[input,...items.querySelectorAll('button'),closeButton];
  const ix=focusable.indexOf(document.activeElement);
  const next=event.shiftKey?(ix-1+focusable.length)%focusable.length:(ix+1)%focusable.length;
  event.preventDefault();focusable[next].focus();
 }
});
if(ownerDashboard){
 const observer=new MutationObserver(()=>{if(!layer.hidden)render();});
 observer.observe(ownerDashboard,{attributes:true,attributeFilter:['hidden']});
}
})();
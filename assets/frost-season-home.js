/* Frost Skaters 1.1 shared seasonal experience.
 * Reads only the optional local Frostverse theme preference or calendar month.
 * No location, network request, cookies, tracking or personal information.
 */
(()=>{
 'use strict';
 const body=document.body;
 if(!body.classList.contains('frost-v11-home'))return;
 const looks={
  winter:{label:'❄ ICE WINTER',icon:'❄'},
  spring:{label:'✿ AURORA SPRING',icon:'✿'},
  summer:{label:'☀ SUMMER NEON',icon:'☀'},
  autumn:{label:'✦ AUTUMN FROST',icon:'✦'}
 };
 let requested='auto';
 try{requested=localStorage.getItem('frostverse.season.v1')||'auto';}catch{}
 const month=new Date().getMonth()+1;
 const automatic=month===12||month<=2?'winter':month<=5?'spring':month<=8?'summer':'autumn';
 const resolved=Object.hasOwn(looks,requested)?requested:automatic;
 body.setAttribute('data-frost-season',resolved);
 const label=document.getElementById('homeSeasonLabel');
 if(label){
  label.textContent='FROST SEASON / '+looks[resolved].label;
  label.title=requested==='auto'?'Automatischer Jahreszeiten-Look':'Dein in Frostverse gespeicherter Lieblingslook';
 }
})();
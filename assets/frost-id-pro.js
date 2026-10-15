/* Verified Frost ID Pro / presentation-only.
 * Works only when frost_find_member has unlocked #approvedSection.
 * No new card-code access, requests, storage, or verification shortcuts.
 */
(()=>{
 'use strict';
 const section=document.getElementById('approvedSection');
 const card=document.getElementById('memberCard');
 const toggle=document.getElementById('frostIdTilt')||document.getElementById('frostId3dToggle');
 if(!section||!card||!toggle)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let active=false;
 function reset(){
  card.classList.remove('is-tilting');
  card.style.setProperty('--frost-tilt-x','0deg');
  card.style.setProperty('--frost-tilt-y','0deg');
  card.style.setProperty('--frost-shine-x','50%');
  card.style.setProperty('--frost-shine-y','45%');
 }
 function off(){
  active=false;toggle.setAttribute('aria-pressed','false');
  toggle.textContent='✦ 3D-Effekt einschalten';reset();
 }
 function verify(){
  if(section.hidden||reduced.matches)off();
  toggle.disabled=Boolean(reduced.matches);
  if(reduced.matches)toggle.textContent='✦ Animationen auf diesem Gerät reduziert';
  else if(!active)toggle.textContent='✦ 3D-Effekt einschalten';
 }
 toggle.addEventListener('click',()=>{
  if(section.hidden||reduced.matches)return;
  active=!active;
  toggle.setAttribute('aria-pressed',String(active));
  toggle.textContent=active?'✦ 3D-Effekt ausschalten':'✦ 3D-Effekt einschalten';
  if(!active)reset();
 });
 card.addEventListener('pointermove',event=>{
  if(!active||section.hidden||reduced.matches||event.pointerType==='touch')return;
  const rect=card.getBoundingClientRect();
  const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
  const y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
  card.style.setProperty('--frost-tilt-x',((.5-y)*8).toFixed(2)+'deg');
  card.style.setProperty('--frost-tilt-y',((x-.5)*10).toFixed(2)+'deg');
  card.style.setProperty('--frost-shine-x',(x*100).toFixed(0)+'%');
  card.style.setProperty('--frost-shine-y',(y*100).toFixed(0)+'%');
  card.classList.add('is-tilting');
 });
 card.addEventListener('pointerleave',reset);
 reduced.addEventListener?.('change',verify);
 new MutationObserver(verify).observe(section,{attributes:true,attributeFilter:['hidden']});
 verify();
})();

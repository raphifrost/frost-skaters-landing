/* Owner God Mode · read-only mirror of already authenticated dashboard counters.
 * This does not create new authorization scopes, sessions or database requests.
 */
(()=>{
'use strict';
const dashboard=document.getElementById('dashboard');
const root=document.getElementById('ownerGodMode');
if(!dashboard||!root)return;
const $=id=>document.getElementById(id);
const pairs=[['statPending','godPending'],['statApproved','godActive']];
const refresh=()=>{
 if(dashboard.hidden){
  for(const [,target] of pairs)$(target).textContent='–';
  $('godHealth').textContent='–';
  $('godUpdated').textContent='Nur nach Owner-Login verfügbar.';
  return;
 }
 for(const [source,target] of pairs){
  const n=$(source).textContent.trim();
  $(target).textContent=/^\d+$/.test(n)?n:'–';
 }
 const web=$('ownerHealthWeb')?.classList.contains('is-ok');
 const db=$('ownerHealthDb')?.classList.contains('is-ok');
 $('godHealth').textContent=web&&db?'OK':'PRÜFEN';
 $('godUpdated').textContent='Werte aus deiner privaten Mitgliederübersicht';
};
const observer=new MutationObserver(refresh);
observer.observe(dashboard,{attributes:true,attributeFilter:['hidden']});
for(const [source] of pairs)observer.observe($(source),{childList:true,characterData:true,subtree:true});
for(const id of ['ownerHealthWeb','ownerHealthDb']){
 const node=$(id);if(node)observer.observe(node,{attributes:true,attributeFilter:['class']});
}
root.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
 if(dashboard.hidden){event.preventDefault();return;}
 const target=document.getElementById(link.getAttribute('href').slice(1));
 if(target?.tagName==='DETAILS')target.open=true;
}));
refresh();
})();
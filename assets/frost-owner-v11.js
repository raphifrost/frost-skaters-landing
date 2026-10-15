/* Frost Skaters Owner Control Center 1.1 — display-only enhancement.
 * The Owner membership script alone handles authentication and all data access.
 * This script reads only existing on-screen counts after the dashboard opens.
 * No requests, storage, tracking or new permissions.
 */
(()=>{
  'use strict';
  const dashboard=document.getElementById('dashboard');
  const date=document.getElementById('ownerLocalDate');
  const greeting=document.getElementById('ownerWelcomeMessage');
  const sync=document.getElementById('ownerSyncStatus');
  const stats=document.getElementById('loungeOverview');
  const pending=document.getElementById('statPending');
  const requestsLink=document.querySelector('.owner-workspace-requests');
  if(!dashboard||!date||!greeting||!sync||!stats||!pending)return;

  function dateText(){
    try{
      return new Intl.DateTimeFormat('de-DE',{dateStyle:'full'}).format(new Date());
    }catch{return 'Heute';}
  }
  function greetingText(){
    const hour=new Date().getHours();
    if(hour<11)return 'Guten Morgen, Owner. Deine Crew wartet auf dich.';
    if(hour<17)return 'Schön, dass du da bist, Owner. Alles an einem Ort.';
    return 'Guten Abend, Owner. Deine Crew, dein Überblick.';
  }
  function updatePresentation(){
    if(dashboard.hidden){
      sync.textContent='Anmeldung erforderlich';
      if(requestsLink)requestsLink.removeAttribute('aria-label');
      return;
    }
    date.textContent=dateText();
    greeting.textContent=greetingText();

    const n=Number(pending.textContent.trim());
    const count=Number.isFinite(n)&&n>=0?n:null;
    const time=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date());
    const detail=count===null
      ?'Übersicht aktualisiert'
      :count===0
        ?'Keine offenen Anträge'
        :count===1
          ?'1 Antrag wartet auf Prüfung'
          :count+' Anträge warten auf Prüfung';
    sync.textContent=detail+' · '+time+' Uhr';
    if(requestsLink&&count!==null){
      requestsLink.setAttribute('aria-label','Anträge prüfen – '+detail);
    }
  }
  const observer=new MutationObserver(updatePresentation);
  observer.observe(dashboard,{attributes:true,attributeFilter:['hidden']});
  observer.observe(pending,{subtree:true,characterData:true,childList:true});
  updatePresentation();

  const nav=document.querySelector('.owner-command-nav');
  if(nav){
    nav.addEventListener('click',event=>{
      const link=event.target.closest('a[href^="#"]');
      if(!link)return;
      const target=document.getElementById(link.getAttribute('href').slice(1));
      if(!target||dashboard.hidden)return;
      // Native anchor navigation is kept so back/forward and accessibility work.
      nav.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));
      link.setAttribute('aria-current','location');
    });
  }
})();
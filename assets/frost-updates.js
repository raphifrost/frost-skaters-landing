/* Frost Skaters / 1.1 Website Updates
 * Client-only presentation. No analytics, external requests or personal data.
 */
(()=>{
  'use strict';
  const features=[...document.querySelectorAll('[data-fu-kind]')];
  const filters=[...document.querySelectorAll('[data-fu-filter]')];
  const status=document.getElementById('fuFilterStatus');

  for(const button of filters){
    button.addEventListener('click',()=>{
      const filter=button.dataset.fuFilter;
      if(!['all','new','existing'].includes(filter))return;
      for(const candidate of filters){
        const selected=candidate===button;
        candidate.classList.toggle('is-active',selected);
        candidate.setAttribute('aria-pressed',String(selected));
      }
      let visible=0;
      for(const feature of features){
        const show=filter==='all'||feature.dataset.fuKind===filter;
        feature.hidden=!show;
        if(show)visible++;
      }
      if(status){
        status.textContent=filter==='all'
          ?'Alle Updates werden angezeigt.'
          :visible+' '+(visible===1?'Eintrag':'Einträge')+' werden angezeigt.';
      }
    });
  }
  const progress=document.getElementById('fuScrollProgress');
  let frame=null;
  function updateProgress(){
    frame=null;
    if(!progress)return;
    const max=document.documentElement.scrollHeight-window.innerHeight;
    const percent=max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0;
    progress.style.width=percent.toFixed(2)+'%';
  }
  function scheduleProgress(){
    if(frame===null)frame=window.requestAnimationFrame(updateProgress);
  }
  if(progress){
    document.addEventListener('scroll',scheduleProgress,{passive:true});
    window.addEventListener('resize',scheduleProgress,{passive:true});
    scheduleProgress();
  }

  const copy=document.getElementById('fuCopyLink');
  const copyStatus=document.getElementById('fuCopyStatus');
  if(copy&&copyStatus){
    copy.addEventListener('click',async()=>{
      const url='https://raphifrost.github.io/frost-skaters-landing/';
      try{
        if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');
        await navigator.clipboard.writeText(url);
        copyStatus.textContent='✅ Website-Link kopiert!';
      }catch{
        copyStatus.replaceChildren();
        const a=document.createElement('a');
        a.href=url;
        a.textContent='Website öffnen / Link kopieren';
        a.style.color='#a9fbfa';
        a.style.textDecoration='underline';
        copyStatus.append('Kopieren ist hier nicht möglich. ',a);
      }
    });
  }
})();
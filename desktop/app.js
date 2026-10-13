(async () => {
  'use strict';
  const storage = window.LeonStorage;
  const memory = window.LeonMemory;
  const $ = id => document.getElementById(id);
  const uid = prefix => memory.makeId(prefix);
  const today = new Date().toISOString();
  const defaultApps = [
    {id:'discord',name:'Discord',url:'https://discord.com/app',description:'Freunde, Server & Nachrichten',color:'#818cf8',symbol:'DC',group:'social'},
    {id:'roblox',name:'Roblox',url:'https://www.roblox.com/home',description:'Deine Spiele & deine Welt',color:'#f5f5f5',symbol:'R',group:'games'},
    {id:'fortnite',name:'Fortnite',url:'com.epicgames.launcher://apps/Fortnite?action=launch&silent=true',description:'Mit dem Epic Games Launcher starten',color:'#c4b5fd',symbol:'FN',group:'games',mobileUrl:'https://www.fortnite.com/mobile'},
    {id:'cs2',name:'Counter-Strike 2',url:'steam://rungameid/730',description:'Über Steam starten',color:'#fbbf24',symbol:'CS',group:'games',mobileUrl:'https://store.steampowered.com/app/730/CounterStrike_2/'},
    {id:'leon',name:'Leon · ChatGPT',url:'https://chatgpt.com/',description:'Mit deiner KI sprechen',color:'#67e8f9',symbol:'L',group:'ki'},
    {id:'sdui',name:'SDUI',url:'https://sdui.app/',description:'Schule, Arbeit & Nachrichten',color:'#fda4af',symbol:'S',group:'arbeit'},
    {id:'frost',name:'Frost Skaters',url:'https://raphifrost.github.io/frost-skaters-landing/',description:'Eure Website & euer Projekt',color:'#a5f3fc',symbol:'FS',group:'arbeit'},
    {id:'snapchat',name:'Snapchat',url:'https://web.snapchat.com/',mobileUrl:'https://www.snapchat.com/',description:'Snaps, Freunde & dein Alltag',color:'#ffed00',symbol:'SN',group:'social'},
    {id:'tiktok',name:'TikTok',url:'https://www.tiktok.com/',description:'Videos, Trends & deine For You',color:'#25f4ee',symbol:'TK',group:'social'},
    {id:'instagram',name:'Instagram',url:'https://www.instagram.com/',description:'Stories, Reels & Nachrichten',color:'#f472b6',symbol:'IG',group:'social'},
    {id:'youtube',name:'YouTube',url:'https://www.youtube.com/',description:'Videos & deine Lieblingskanäle',color:'#ff615a',symbol:'YT',group:'social'},
    {id:'spotify',name:'Spotify',url:'https://open.spotify.com/',description:'Dein Soundtrack für alles',color:'#7bf1a8',symbol:'SP',group:'social'},
    {id:'whatsapp',name:'WhatsApp',url:'https://web.whatsapp.com/',mobileUrl:'https://www.whatsapp.com/',description:'Chats mit deinen Leuten',color:'#86efac',symbol:'WA',group:'social'}
  ];
  const appIcons = {
    discord:'<path fill="currentColor" d="M7 5 4 6C2 9 1 12 2 16l4 2 1-2-2-1c4 2 10 2 14 0l-2 1 1 2 4-2c1-4 0-7-2-10l-3-1-1 2a16 16 0 0 0-8 0Z"/><circle cx="8" cy="12" r="1.5" fill="#5865f2"/><circle cx="16" cy="12" r="1.5" fill="#5865f2"/>',
    roblox:'<path fill="currentColor" fill-rule="evenodd" d="M7 1 23 7 17 23 1 17ZM10 8l-2 6 6 2 2-6Z"/>',
    snapchat:'<path d="M12 3c-4 0-4 4-4 7L5 9v2c2 1 2 2 1 3l-3 2 3 1 1 2 3-1 2 2 2-2 3 1 1-2 3-1-3-2c-1-1-1-2 1-3V9l-3 1c0-3 0-7-4-7Z" fill="white" stroke="#151515" stroke-width="1.2" stroke-linejoin="round"/>',
    tiktok:'<path d="M14 4v11a4 4 0 1 1-4-4" fill="none" stroke="#25f4ee" stroke-width="3" transform="translate(-1,1)"/><path d="M14 4v11a4 4 0 1 1-4-4m4-7c0 4 3 5 5 5" fill="none" stroke="#fe2c55" stroke-width="3" transform="translate(1,0)"/><path d="M14 4v11a4 4 0 1 1-4-4m4-7c0 4 3 5 5 5" fill="none" stroke="white" stroke-width="2.5"/>',
    instagram:'<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1" fill="currentColor"/>',
    youtube:'<path d="m10 7 7 5-7 5Z" fill="currentColor"/>',
    spotify:'<path d="M5 9c4-2 10-2 15 1M6 13c4-2 9-1 13 1M7 17c3-1 7-1 10 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    whatsapp:'<path d="M5 18 3 22l5-2a9 9 0 1 0-3-2Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 7c-2 3 3 8 7 9l2-2-3-2-1 1-3-3 1-1-2-3Z" fill="currentColor"/>',
    leon:'<path d="M7 5v13h11" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/><path d="m17 3 1.5 3.5L22 8l-3.5 1.5L17 13l-1.5-3.5L12 8l3.5-1.5Z" fill="currentColor"/>',
    cs2:'<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'
  };
  const seedMemories = [];
  let persistent = true;
  let activeView = 'overview';
  let appFilter = 'alle';
  const isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.userAgentData?.mobile === true);
  const appTarget = app => isPhone && app.mobileUrl ? app.mobileUrl : app.url;
  let editingAppId = null;
  let readingId = null;
  let toastTimer;
  const freshState = () => ({version:1,presetVersion:2,profileName:'',apps:defaultApps.map(app=>({...app})),tasks:[],memories:seedMemories.map(item=>({...item,tags:[...item.tags]}))});
  const safeUrl = value => {
    const url = new URL(String(value).trim());
    const allowed = ['https:','http:','steam:','discord:','com.epicgames.launcher:'];
    if (!allowed.includes(url.protocol)) throw new Error('Bitte nutze einen Weblink oder einen Steam-, Discord- oder Epic-App-Link.');
    if (url.username || url.password) throw new Error('Links mit eingebauten Zugangsdaten sind nicht erlaubt.');
    if (['http:','https:'].includes(url.protocol) && !url.hostname) throw new Error('Bitte gib einen vollständigen Weblink ein.');
    return url.href;
  };
  const normalizeApp = app => {
    if (!app || typeof app !== 'object' || typeof app.name !== 'string' || !app.name.trim()) throw new Error('Ein App-Eintrag braucht einen Namen.');
    return {id:typeof app.id==='string'&&app.id.length<200?app.id:uid('app'),name:app.name.trim().slice(0,80),url:safeUrl(app.url),description:typeof app.description==='string'?app.description.slice(0,160):'Dein eigener Schnellzugriff',color:/^#[0-9a-f]{6}$/i.test(app.color||'')?app.color:'#67e8f9',symbol:typeof app.symbol==='string'?app.symbol.slice(0,3):app.name.trim().slice(0,2).toUpperCase(),group:['social','games','arbeit','ki'].includes(app.group)?app.group:'eigene',mobileUrl:app.mobileUrl?safeUrl(app.mobileUrl):undefined};
  };
  const normalizeTask = task => {
    if (!task || typeof task.text !== 'string' || !task.text.trim()) throw new Error('Ungültige Aufgabe im Backup.');
    return {id:typeof task.id==='string'?task.id:uid('task'),text:task.text.trim().slice(0,500),done:task.done===true,createdAt:typeof task.createdAt==='string'?task.createdAt:today};
  };
  let state = freshState();
  let loadNotice = '';
  try {
    const saved = await storage.load();
    if (saved) {
      if (!saved || saved.version!==1 || !Array.isArray(saved.memories) || !Array.isArray(saved.apps) || !Array.isArray(saved.tasks)) throw new Error('Ungültiges gespeichertes Format.');
      state={version:1,presetVersion:2,profileName:typeof saved.profileName==='string'?saved.profileName.slice(0,50):'',apps:saved.apps.map(normalizeApp),tasks:saved.tasks.map(normalizeTask),memories:saved.memories.map(memory.validateRecord)};
      if((saved.presetVersion||1)<2){
        defaultApps.filter(app=>['snapchat','tiktok','instagram','youtube','spotify','whatsapp'].includes(app.id)).forEach(app=>{if(!state.apps.some(current=>current.id===app.id))state.apps.push({...app});});
      }
    }
  } catch (error) {
    if (error.name==='SecurityError') {persistent=false;loadNotice='Dieser Browser erlaubt hier keine dauerhafte Speicherung. Nutze den Backup-Download, bevor du die Seite schließt.';}
    else {loadNotice='Gespeicherte Daten konnten nicht geladen werden. Die alte Speicherung wurde nicht überschrieben.'; persistent=false;}
  }
  const node = (tag, className, text) => {
    const element=document.createElement(tag);
    if(className) element.className=className;
    if(text!==undefined) element.textContent=text;
    return element;
  };
  const button = (className, label, action) => {
    const element=node('button',className,label);element.type='button';
    if(action) element.addEventListener('click',action);
    return element;
  };
  const toast = (message, error=false, undo=null) => {
    const element=$('toast'); if(!element) return;
    clearTimeout(toastTimer); element.replaceChildren(node('span','',message)); element.hidden=false;
    element.classList.toggle('is-error',error);
    if(undo){const action=button('toast-undo','Rückgängig',()=>{undo();element.hidden=true;});element.append(action);}
    toastTimer=setTimeout(()=>{element.hidden=true;},undo?15000:6500);
  };
  const save = async () => {
    if (!persistent) return false;
    try {await storage.save(state);return true;}
    catch {persistent=false;renderStorage();toast('Der Browser konnte nicht speichern. Lade ein Backup herunter, damit deine Änderungen erhalten bleiben.',true);return false;}
  };
  const renderStorage = () => {
    if($('storage-state')) $('storage-state').textContent=persistent?'Lokal gespeichert · nur in diesem Browser':'Nur für diese Sitzung · bitte Backup herunterladen';
  };
  const dateLabel = value => {
    const date=new Date(value);return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'short',year:'numeric'}).format(date);
  };
  const setView = view => {
    if(!['overview','memory','work','settings'].includes(view)) view='overview';
    activeView=view;
    window.scrollTo({top:0,behavior:'instant'});
    document.querySelectorAll('.view').forEach(panel=>{panel.hidden=panel.dataset.view!==view;});
    document.querySelectorAll('[data-app-filter]').forEach(control=>control.addEventListener('click',()=>{
    appFilter=control.dataset.appFilter;
    document.querySelectorAll('[data-app-filter]').forEach(item=>{const active=item===control;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));});
    renderApps();
  }));
  document.querySelectorAll('.nav-button').forEach(nav=>{const active=nav.dataset.view===view;nav.classList.toggle('is-active',active);if(active)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');});
    const labels={overview:'Übersicht',memory:'Gedächtnis',work:'Arbeit',settings:'Einstellungen'};
    if($('view-label')) $('view-label').textContent=labels[view];
    history.replaceState(null,'','#'+view);
    if(view==='memory') renderMemories();
    if(view==='work') renderTasks();
  };
  const renderApps = () => {
    const grid=$('app-grid');grid.replaceChildren();
    state.apps.filter(app=>appFilter==='alle'||app.group===appFilter).forEach(app=>{
      const card=node('article','app-card');card.style.setProperty('--app-accent',app.color);
      const link=node('a','app-launch');link.href=appTarget(app);
      if(/^https?:/i.test(appTarget(app))){link.target='_blank';link.rel='noopener noreferrer';}
      const icon=node('span','app-icon',app.symbol);
      icon.dataset.app=app.id;
      if(appIcons[app.id])icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+appIcons[app.id]+'</svg>';
      icon.setAttribute('aria-hidden','true');
      link.append(icon);
      const text=node('div','app-copy');text.append(node('h3','app-name',app.name),node('p','app-description',isPhone&&app.id==='cs2'?'PC-Game · Steam-Seite öffnen':isPhone&&app.id==='fortnite'?'Fortnite auf deinem Handy':app.description));
      const arrow=node('span','app-arrow');
      arrow.setAttribute('aria-hidden','true');
      arrow.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>';
      link.append(text,arrow);
      const edit=button('app-card-action','•••',()=>openApp(app.id));
      edit.setAttribute('aria-label',app.name+' bearbeiten');edit.title='Schnellzugriff bearbeiten';
      card.append(link,edit);grid.append(card);
    });
    if(!state.apps.length)grid.append(node('p','empty-note','Füge deinen ersten Schnellzugriff hinzu.'));
    if($('app-count'))$('app-count').textContent=String(state.apps.length);
  };
  const memoryCard = item => {
    const card=button('memory-card memory-item','',()=>readMemory(item.id));
    card.append(node('span','memory-title',item.title));
    const excerpt=item.content.trim().replace(/\s+/g,' ');
    card.append(node('span','memory-excerpt',excerpt.length>150?excerpt.slice(0,147)+'…':excerpt||'Dieser Chat enthält keine Textnachrichten.'));
    const meta=node('span','memory-meta',item.source+' · '+dateLabel(item.updatedAt));
    card.append(meta);
    if(item.tags.length){const tags=node('span','memory-tags');item.tags.slice(0,4).forEach(tag=>tags.append(node('span','tag',tag)));card.append(tags);}
    return card;
  };
  const renderMemories = () => {
    const query=$('memory-search')?.value||'';
    const list=$('memory-list');list.replaceChildren();
    const found=memory.search(state.memories,query);
    found.forEach(item=>list.append(memoryCard(item)));
    if(!found.length)list.append(node('p','empty-note',query?'Keine passenden Erinnerungen gefunden.':'Dein Gedächtnis ist bereit. Schreibe eine Notiz oder importiere deine Chats.'));
    if($('memory-empty'))$('memory-empty').hidden=found.length>0;
    const recent=$('recent-memories');recent.replaceChildren();
    memory.search(state.memories,'').slice(0,3).forEach(item=>recent.append(memoryCard(item)));
    if(!state.memories.length)recent.append(node('p','empty-note','Hier erscheinen deine letzten Notizen und Chats.'));
    if($('memory-count'))$('memory-count').textContent=String(state.memories.length);
  };
  const renderTasks = () => {
    [$('task-list'),$('work-task-list')].filter(Boolean).forEach(list=>{
      list.replaceChildren();
      [...state.tasks].sort((a,b)=>Number(a.done)-Number(b.done)).forEach(task=>{
        const row=node('li','task-item'+(task.done?' is-complete completed':''));
        const label=node('label','task-label');const checkbox=node('input','task-checkbox');
        checkbox.type='checkbox';checkbox.checked=task.done;
        checkbox.addEventListener('change',()=>{task.done=checkbox.checked;save();renderTasks();});
        label.append(checkbox,node('span','task-text',task.text));
        const remove=button('task-delete','×',()=>{state.tasks=state.tasks.filter(item=>item.id!==task.id);save();renderTasks();});
        remove.setAttribute('aria-label','Aufgabe löschen: '+task.text);
        row.append(label,remove);list.append(row);
      });
      if(!state.tasks.length)list.append(node('li','empty-note','Alles frei. Was möchtest du heute erledigen?'));
    });
    const unfinished=state.tasks.filter(task=>!task.done).length;
    if($('task-count'))$('task-count').textContent=String(unfinished);
  };
  const renderProfile = () => {
    $('profile-name').value=state.profileName;
    if($('greeting'))$('greeting').textContent=state.profileName?'Hey '+state.profileName+'.':'Dein Tag. Dein Space.';
    if($('display-name'))$('display-name').textContent=state.profileName||'Dein Space';
    document.querySelectorAll('.profile-avatar,.topbar-avatar').forEach(avatar=>avatar.textContent=state.profileName?state.profileName[0].toUpperCase():'L');
  };
  const render = () => {renderApps();renderMemories();renderTasks();renderProfile();renderStorage();};
  const showDialog = id => {
    const dialog=$(id);
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
  };
  const closeDialog = id => {const dialog=$(id);if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');};
  const openApp = id => {
    editingAppId=id||null;const app=state.apps.find(item=>item.id===id);
    $('app-form').reset();$('app-name').value=app?.name||'';$('app-url').value=app?.url||'';
    if($('app-color'))$('app-color').value=app?.color||'#67e8f9';
    if($('app-dialog-title'))$('app-dialog-title').textContent=app?'Schnellzugriff bearbeiten':'Schnellzugriff hinzufügen';
    let remove=$('app-remove');
    if(!remove){remove=button('button danger','Schnellzugriff entfernen',()=>{state.apps=state.apps.filter(item=>item.id!==editingAppId);save();renderApps();closeDialog('app-dialog');toast('Schnellzugriff entfernt.');});remove.id='app-remove';$('app-form').append(remove);}
    remove.hidden=!app;showDialog('app-dialog');
  };
  const openMemory = () => {$('memory-form').reset();showDialog('memory-dialog');};
  const readMemory = id => {
    const item=state.memories.find(record=>record.id===id);if(!item)return;
    readingId=id;$('reader-title').textContent=item.title;$('reader-meta').textContent=item.source+' · '+dateLabel(item.updatedAt);
    $('reader-content').textContent=item.content||'Dieser Chat enthält keine Textnachrichten.';
    showDialog('reader-dialog');
  };
  const exportData = () => {
    const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=node('a');link.href=url;link.download='mein-desktop-backup-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Dein Backup enthält Notizen, Chats, Aufgaben und Schnellzugriffe.');
  };
  const importData = async file => {
    if(!file)return;
    try {
      const imported=await storage.readImportFile(file);
      const text=imported.text;const incoming=memory.parseImport(text,imported.fileName);
      const next={...state,memories:[...state.memories],apps:[...state.apps],tasks:[...state.tasks]};
      const fingerprints=new Set(next.memories.map(item=>item.title+'\u0000'+item.content));
      const ids=new Set(next.memories.map(item=>item.id));let added=0;
      incoming.forEach(item=>{
        const fingerprint=item.title+'\u0000'+item.content;
        if(fingerprints.has(fingerprint))return;
        const record={...item,tags:[...item.tags]};if(ids.has(record.id))record.id=uid('memory');
        next.memories.push(record);fingerprints.add(fingerprint);ids.add(record.id);added++;
      });
      let restored=false;
      if(/\.json$/i.test(imported.fileName)){
        const backup=JSON.parse(text.replace(/^\uFEFF/,''));
        if(backup&&!Array.isArray(backup)&&backup.version===1&&Array.isArray(backup.apps)&&Array.isArray(backup.tasks)){
          const apps=backup.apps.map(normalizeApp);const tasks=backup.tasks.map(normalizeTask);
          apps.forEach(app=>{if(!next.apps.some(current=>current.url===app.url)){if(next.apps.some(current=>current.id===app.id))app.id=uid('app');next.apps.push(app);}});
          tasks.forEach(task=>{if(!next.tasks.some(current=>current.id===task.id))next.tasks.push(task);});
          if(!next.profileName&&typeof backup.profileName==='string')next.profileName=backup.profileName.slice(0,50);
          restored=true;
        }
      }
      state=next;save();render();setView('memory');
      toast(added+' neue '+(added===1?'Erinnerung':'Erinnerungen')+' importiert.'+(restored?' Aufgaben und Schnellzugriffe ergänzt.':''));
    } catch(error){toast(error.message||'Die Datei konnte nicht importiert werden.',true);}
    finally{$('import-file').value='';}
  };
  document.querySelectorAll('.nav-button').forEach(nav=>nav.addEventListener('click',()=>setView(nav.dataset.view)));
  document.querySelectorAll('[data-close]').forEach(control=>control.addEventListener('click',()=>closeDialog(control.dataset.close)));
  document.querySelectorAll('[data-action]').forEach(control=>control.addEventListener('click',()=>{
    const actions={'add-app':()=>openApp(),'add-memory':openMemory,'open-memory':()=>setView('memory'),import:()=>$('import-file').click(),export:exportData};
    actions[control.dataset.action]?.();
  }));
  $('app-form').addEventListener('submit',event=>{
    event.preventDefault();
    try {
      const current=state.apps.find(app=>app.id===editingAppId);
      const app=normalizeApp({id:editingAppId||uid('app'),name:$('app-name').value,url:$('app-url').value,color:$('app-color')?.value||'#67e8f9',description:current?.description,symbol:current?.symbol,group:current?.group,mobileUrl:current?.mobileUrl});
      if(editingAppId)state.apps=state.apps.map(item=>item.id===editingAppId?app:item);else state.apps.push(app);
      save();renderApps();closeDialog('app-dialog');toast('Schnellzugriff gespeichert.');
    } catch(error){toast(error.message,true);}
  });
  $('memory-form').addEventListener('submit',event=>{
    event.preventDefault();
    try {
      const item=memory.validateRecord({id:uid('memory'),title:$('memory-title').value,content:$('memory-content').value,tags:$('memory-tags')?.value||'',source:'Notiz',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      state.memories.unshift(item);save();renderMemories();closeDialog('memory-dialog');toast('In deinem Gedächtnis gespeichert.');
    } catch(error){toast(error.message,true);}
  });
  $('reader-delete').addEventListener('click',()=>{
    const index=state.memories.findIndex(item=>item.id===readingId);
    const record=state.memories[index];
    state.memories=state.memories.filter(item=>item.id!==readingId);save();renderMemories();closeDialog('reader-dialog');
    if(record)toast('Erinnerung gelöscht.',false,()=>{
      if(!state.memories.some(item=>item.id===record.id))state.memories.splice(Math.min(index,state.memories.length),0,record);
      save();renderMemories();
    });
  });
  $('profile-form').addEventListener('submit',event=>{event.preventDefault();state.profileName=$('profile-name').value.trim().slice(0,50);save();renderProfile();toast('Dein Name ist gespeichert.');});
  [$('task-form'),$('work-task-form')].filter(Boolean).forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault();const input=$(form.id==='task-form'?'task-input':'work-task-input');const text=input.value.trim();if(!text)return;
    state.tasks.push({id:uid('task'),text:text.slice(0,500),done:false,createdAt:new Date().toISOString()});save();input.value='';renderTasks();
  }));
  $('memory-search').addEventListener('input',renderMemories);
  $('import-file').addEventListener('change',event=>importData(event.target.files[0]));
  const searchInput=$('global-search');
  const searchResults=node('div','search-results');searchResults.id='search-results';searchResults.hidden=true;searchResults.setAttribute('aria-label','Suchergebnisse');
  searchInput.parentElement.append(searchResults);searchInput.setAttribute('aria-controls','search-results');searchInput.setAttribute('aria-expanded','false');
  const hideSearch=()=>{searchResults.hidden=true;searchInput.setAttribute('aria-expanded','false');};
  searchInput.addEventListener('input',()=>{
    const query=searchInput.value.trim();searchResults.replaceChildren();
    if(!query){hideSearch();return;}
    const appResults=state.apps.filter(app=>(app.name+' '+app.description).toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de'))).slice(0,4);
    const notes=memory.search(state.memories,query).slice(0,4);
    appResults.forEach(app=>{const link=node('a','search-result');link.href=appTarget(app);if(/^https?:/.test(appTarget(app))){link.target='_blank';link.rel='noopener noreferrer';}link.append(node('span','search-result-type','App'),node('span','',app.name));searchResults.append(link);});
    notes.forEach(item=>{const result=button('search-result','',()=>{hideSearch();setView('memory');readMemory(item.id);});result.append(node('span','search-result-type','Gedächtnis'),node('span','',item.title));searchResults.append(result);});
    if(!appResults.length&&!notes.length)searchResults.append(node('p','empty-note','Noch nichts dazu gespeichert.'));
    searchResults.hidden=false;searchInput.setAttribute('aria-expanded','true');
  });
  document.addEventListener('click',event=>{if(!searchInput.parentElement.contains(event.target))hideSearch();});
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchInput.focus();searchInput.select();}
    if(event.key==='Escape')hideSearch();
  });
  window.addEventListener('hashchange',()=>{if(location.hash.slice(1)!==activeView)setView(location.hash.slice(1));});
  const tick = () => {
    const date=new Date();
    if($('clock-time'))$('clock-time').textContent=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(date);
    if($('clock-date'))$('clock-date').textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long'}).format(date);
  };
  let installPrompt;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
  document.querySelectorAll('[data-install]').forEach(control=>control.addEventListener('click',async()=>{
    if(installPrompt){await installPrompt.prompt();installPrompt=null;}else showDialog('install-dialog');
  }));
  if(location.protocol==='https:'||location.hostname==='127.0.0.1'||location.hostname==='localhost'){
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  render();setView(location.hash.slice(1)||'overview');tick();setInterval(tick,30000);
  if(loadNotice)toast(loadNotice,true);
})();

(()=>{
'use strict';
const $=id=>document.getElementById(id);
const EN=document.documentElement.lang==='en';
const tr=(de,en)=>EN?en:de;
const cfg=window.FROST_MEMBERS_CONFIG||{};
const ready=window.supabase&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl||'')&&/^(sb_publishable_|eyJ)/.test(cfg.supabaseAnonKey||'');
const client=ready?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,detectSessionInUrl:false,autoRefreshToken:false}}):null;
const label=EN?{news:'📢 News',event:'📅 Trip',poll:'🗳️ Poll',challenge:'🏅 Challenge',gallery:'📸 Gallery',history:'📖 History'}:{news:'📢 Neuigkeit',event:'📅 Ausflug',poll:'🗳️ Abstimmung',challenge:'🏅 Challenge',gallery:'📸 Galerie',history:'📖 Geschichte'};
const containers={news:'newsItems',event:'eventItems',poll:'pollItems',challenge:'challengeItems',gallery:'galleryItems',history:'historyItems'};
const localVoter='frost-hub-voter-token-v1';
const firstName=/^[\p{L}][\p{L}'’-]{1,39}$/u;
const el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n;};
const append=(p,...children)=>{p.append(...children);return p;};
const notice=(node,message,bad=false)=>{node.textContent=message;node.className='fh-status'+(bad?' error':'');};
const friendlyDate=s=>{if(!s)return '';const d=new Date(s);return Number.isNaN(+d)?'':new Intl.DateTimeFormat(EN?'en-GB':'de-DE',{dateStyle:'medium',timeStyle:'short'}).format(d);};
const empty=(node,msg)=>{node.replaceChildren(el('p','fh-hint',msg));};
async function submitPublic(data,button,statusNode,success){
  if(!client){notice(statusNode,tr('Die Verbindung zur Datenbank fehlt.','The database connection is unavailable.'),true);return false;}
  button.disabled=true;
  try{
    const {error}=await client.from('frost_hub_submissions').insert(data);
    if(error)throw error;
    notice(statusNode,success);return true;
  }catch(e){console.error('Hub submit',e);notice(statusNode,tr('Konnte nicht gesendet werden. Bitte später erneut versuchen.','Could not send. Please try again later.'),true);return false;}
  finally{button.disabled=false;}
}
function buildJoin(item,type){
  const form=el('form');
  const field=el('label','fh-field',tr('Dein Vorname (keine Nachnamen)','Your first name (no surname)'));
  const name=el('input','fh-input');name.type='text';name.maxLength=40;name.minLength=2;name.required=true;name.autocomplete='given-name';name.placeholder=tr('z. B. Max','e.g. Max');field.append(name);
  const agree=el('label','fh-field');agree.style.fontWeight='400';agree.style.flexDirection='row';agree.style.alignItems='start';agree.style.display='flex';
  const check=el('input');check.type='checkbox';check.required=true;
  append(agree,check,el('span','', tr('Ich möchte mich unverbindlich vormerken lassen und habe die Datenschutzhinweise gelesen.','I want to request a place and have read the privacy notice.')));
  const link=el('a','', tr('Datenschutzhinweise','Privacy notice'));link.href='datenschutz.html';link.style.display='block';
  const send=el('button','fh-btn',type==='event'?tr('Teilnahme anfragen','Request a place'):tr('Ich mache mit','Join this challenge'));send.type='submit';
  const status=el('p','fh-status');status.setAttribute('role','status');
  append(form,field,agree,link,send,status);
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    const value=name.value.trim();
    if(!firstName.test(value)){notice(status,tr('Nur einen Vornamen mit 2–40 Zeichen eingeben.','Please enter only your first name (2–40 characters).'),true);return;}
    if(!check.checked){notice(status,tr('Bitte zunächst die Datenschutzhinweise lesen.','Please read the privacy notice first.'),true);return;}
    const ok=await submitPublic({kind:type,item_id:item.id,first_name:value,message:''},send,status,tr(tr('Deine Anfrage ist eingegangen. Die Leitung prüft sie persönlich.','Request received. The team will review it personally.'),'Request received! The team will review it personally.'));
    if(ok){form.reset();}
  });
  return form;
}
async function displayPollResults(item,target){
  if(!client)return;
  const {data,error}=await client.rpc('frost_hub_poll_results',{p_poll:item.id});
  if(error){target.textContent=tr('Ergebnisse derzeit nicht verfügbar','Results currently unavailable');return;}
  const list=Array.isArray(data)?data:[];
  const total=list.reduce((sum,x)=>sum+Number(x.total||0),0);
  target.replaceChildren();
  for(let i=0;i<item.options.length;i++){
    const record=list.find(x=>x.option_index===i);
    const n=Number(record?.total||0),pct=total?Math.round(n/total*100):0;
    const row=el('div','fh-result');
    append(row,el('label','',item.options[i]+' ('+n+')'),el('span','fh-mini',pct+' %'));
    const track=el('div','fh-bar');const fill=el('span');fill.style.width=pct+'%';track.append(fill);track.style.gridColumn='1 / -1';append(row,track);target.append(row);
  }
  target.append(el('p','fh-hint',total+tr(' Stimmen insgesamt',' total votes')));
}
function buildPoll(item){
  const box=el('div');
  const form=el('form'),choices=el('div','fh-poll-options'),results=el('div','fh-poll-results');
  const radioName='poll-'+item.id;
  item.options.forEach((option,index)=>{
    const label=el('label');const radio=el('input');radio.type='radio';radio.name=radioName;radio.value=String(index);radio.required=true;
    append(label,radio,el('span','',option));choices.append(label);
  });
  const send=el('button','fh-btn',tr('Abstimmen','Vote'));send.type='submit';
  const status=el('p','fh-status');status.setAttribute('role','status');
  append(form,choices,send,status);append(box,form,results);
  let voter='';
  try{voter=localStorage.getItem(localVoter)||'';if(!/^[a-f0-9-]{36}$/i.test(voter)){voter=crypto.randomUUID();localStorage.setItem(localVoter,voter);}}catch{voter=crypto.randomUUID();}
  let voted=false;try{voted=localStorage.getItem('fh-voted-'+item.id)==='yes';}catch{}
  if(voted){send.disabled=true;notice(status,tr('Du hast auf diesem Gerät bereits abgestimmt.','This browser has already voted.'));}
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    const selected=choices.querySelector('input:checked');if(!selected)return;
    send.disabled=true;
    try{
      const {data,error}=await client.rpc('frost_hub_cast_vote',{p_poll:item.id,p_token:voter,p_choice:Number(selected.value)});
      if(error)throw error;
      if(data){notice(status,tr('Danke! Deine Stimme wurde gezählt.','Thanks! Your vote has been counted.'));try{localStorage.setItem('fh-voted-'+item.id,'yes');}catch{}}
      else{notice(status,tr('Diese Stimme konnte nicht gespeichert werden.','Could not save your vote.'),true);send.disabled=false;}
      await displayPollResults(item,results);
    }catch(e){console.error('Vote',e);notice(status,tr('Abstimmung zurzeit nicht möglich.','Voting is currently unavailable.'),true);send.disabled=false;}
  });
  displayPollResults(item,results);
  return box;
}
function buildItem(item){
  const card=el('article','fh-panel');
  append(card,el('div','fh-meta',label[item.kind]||'Frost Skaters'),el('h3','',item.title));
  if(item.kind==='gallery'&&/^assets\/[A-Za-z0-9/_-]+\.(jpg|jpeg|png|webp)$/.test(item.media_src||'')){
    const img=el('img','fh-photo');img.src=item.media_src;img.alt=item.title;img.loading='lazy';card.append(img);
  }
  if(item.event_at)card.append(el('p','fh-chip',friendlyDate(item.event_at)));
  if(item.place)card.append(el('p','fh-hint',tr('📍 ','📍 ')+item.place));
  if(item.body)card.append(el('p','',item.body));
  if(item.kind==='poll'&&Array.isArray(item.options))card.append(buildPoll(item));
  if(item.kind==='event'||item.kind==='challenge'){
    const details=el('details'),summary=el('summary','fh-btn alt',item.kind==='event'?tr('📝 Teilnahme anfragen','📝 Request a place'):tr('🙌 Challenge mitmachen','🙌 Join the challenge'));
    summary.style.cursor='pointer';details.append(summary,buildJoin(item,item.kind));card.append(details);
  }
  return card;
}
async function loadItems(){
  if(!client)return;
  const {data,error}=await client.from('frost_hub_items').select('id,kind,title,body,event_at,place,media_src,options,created_at').eq('visible',true).order('created_at',{ascending:false}).limit(150);
  if(error)throw error;
  for(const [kind,id] of Object.entries(containers)){
    const node=$(id);const matches=(data||[]).filter(x=>x.kind===kind);
    if(kind==='history'){node.replaceChildren(...matches.map(buildItem));continue;}
    if(!matches.length){
      if(kind==='challenge')continue;
      empty(node,kind==='event'?tr('Noch keine neuen Events veröffentlicht.','No new events have been published yet.'):tr('Noch keine Beiträge veröffentlicht.','No posts published yet.'));
    }else node.replaceChildren(...matches.map(buildItem));
  }
}
async function loadSettings(){
  const {data,error}=await client.from('frost_hub_settings').select('key,value');
  if(error)throw error;
  const settings=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
  $('welcomeText').textContent=settings.welcome_text||'';
  $('communityRules').textContent=settings.community_rules||'Die Leitung veröffentlicht die Regeln bald.';
  const target=$('seasonCountdown'),day=settings.next_season;
  if(!day){target.textContent=tr('Die Leitung hat noch keinen nächsten Saisontermin festgelegt.','The next season start has not been announced yet.');return;}
  const date=new Date(day+'T00:00:00');
  if(Number.isNaN(+date)){target.textContent=tr('Termin wird bekanntgegeben.','The date will be announced.');return;}
  const delta=Math.ceil((date-new Date())/86400000);
  target.textContent=delta>0?tr('Noch ','Only ')+delta+tr(' Tage bis zur nächsten Saison (',' days until next season (')+new Intl.DateTimeFormat(EN?'en-GB':'de-DE',{dateStyle:'long'}).format(date)+')':delta===0?tr('Heute ist Saisonstart! ❄️','The season starts today! ❄️'):'Der letzte Saisonstart war am '+new Intl.DateTimeFormat('de-DE',{dateStyle:'long'}).format(date)+'.';
}
async function loadStats(){
  const {data,error}=await client.rpc('frost_hub_season_stats');
  if(error)throw error;
  const stats=data?.[0]||{};
  const labels=[['events',tr('Events','Events')],['challenges',tr('Challenges','Challenges')],['gallery',tr('Fotos','Photos')],['news',tr('Neuigkeiten','News')]];
  $('statsItems').replaceChildren(...labels.map(([key,title])=>{const n=el('article','fh-panel');n.append(el('span','fh-metric',Number(stats[key]||0)),el('span','fh-mini',title));return n;}));
}
$('ideaForm').addEventListener('submit',async ev=>{
  ev.preventDefault();const message=$('ideaMessage').value.trim();
  if(message.length<5||message.length>400){notice($('ideaStatus'),tr('Bitte 5 bis 400 Zeichen eingeben.','Please enter between 5 and 400 characters.'),true);return;}
  const send=$('ideaSend');
  const ok=await submitPublic({kind:$('ideaKind').value,message,first_name:null,item_id:null},send,$('ideaStatus'),tr('Vielen Dank! Deine Nachricht wurde an die Leitung gesendet.','Thank you! Your message has been sent to the team.'));
  if(ok)$('ideaForm').reset();
});
async function init(){
  if(!client){$('hubConnection').textContent=tr('Die Community-Datenbank ist gerade nicht erreichbar. Die Infos auf dieser Seite kannst du trotzdem lesen.','The community database is currently unavailable. You can still read the information on this page.');return;}
  const results=await Promise.allSettled([loadItems(),loadSettings(),loadStats()]);
  const failed=results.filter(x=>x.status==='rejected');
  $('hubConnection').textContent=failed.length?tr('Einige Live-Inhalte konnten nicht geladen werden. Bitte später erneut versuchen.','Some live content could not be loaded. Please try again later.'):tr('❄️ Willkommen bei Frost Skaters – die Community-Inhalte sind aktuell.','❄️ Welcome to Frost Skaters — community content is up to date.');
  if(failed.length)console.error('Hub load failed',failed);
}
init();
})();
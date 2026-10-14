(() => {
'use strict';
const $ = id => document.getElementById(id);
const cfg = window.FROST_MEMBERS_CONFIG || {};
const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl || '') && /^(eyJ|sb_publishable_)/.test(cfg.supabaseAnonKey || '') && Boolean(window.supabase);
const client = ready ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
  auth: {persistSession:false, autoRefreshToken:false, detectSessionInUrl:false}
}) : null;
let activeCardLink = '';
const show = (id, message, error=false) => {
  const node = $(id);
  node.textContent = message;
  node.className = 'member-alert'+(error?' error':'');
};
const cleanCode = raw => {
  let code=(raw||'').trim();
  if(code.includes('?')) {try {code=new URL(code).searchParams.get('code')||code;}catch{}}
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code)?code:null;
};
const cardLink = code => new URL('mitglieder.html?code='+encodeURIComponent(code),location.href).href;
const localKey = 'frost-member-card-code';
const apply = $('applyForm');
apply.addEventListener('submit',async event=>{
  event.preventDefault();
  const display_name = $('displayName').value.trim();
  if(!/^[\p{L}][\p{L}'’-]{1,39}$/u.test(display_name)){show('applyFeedback','Bitte nur deinen Vornamen eingeben (2–40 Zeichen, ohne Leerzeichen).',true);return;}
  if(!$('privacyConsent').checked){show('applyFeedback','Bitte lies zuerst die Datenschutzhinweise.',true);return;}
  if(!client){show('applyFeedback','Anträge sind noch nicht freigeschaltet. Raphi richtet das System gerade ein.',true);return;}
  const button = $('applyButton');
  button.disabled=true;button.textContent='Wird gesendet …';
  const request_code=crypto.randomUUID();
  try{
    const {error}=await client.from('frost_member_requests').insert({display_name,request_code});
    if(error)throw error;
    // GMX notification is queued securely by the database trigger (one message per request).
    try{localStorage.setItem(localKey,request_code);}catch{}
    $('lookupCode').value=request_code;
    const link=cardLink(request_code);
    show('applyFeedback','Antrag erfolgreich verschickt! Raphi muss dich erst annehmen.\n\nDein persönlicher Karten-Link:\n'+link+'\n\nSpeichere den Link sicher. Du kannst darüber später nachschauen, ob deine Karte freigeschaltet wurde.');
    $('displayName').value='';$('privacyConsent').checked=false;
  }catch(e){show('applyFeedback','Der Antrag konnte nicht gesendet werden. Bitte versuche es später erneut.',true);console.error('Antrag fehlgeschlagen',e);}
  finally{button.disabled=false;button.textContent='Antrag an Raphi schicken';}
});
async function checkCode(code,showErrors=true){
  if(!client){if(showErrors)show('lookupFeedback','Das Mitgliedersystem wird gerade eingerichtet.',true);return;}
  if(!code){if(showErrors)show('lookupFeedback','Bitte einen gültigen Karten-Code oder vollständigen Karten-Link eingeben.',true);return;}
  $('approvedSection').hidden=true;
  try{
    const {data,error}=await client.rpc('frost_find_member',{p_code:code});
    if(error)throw error;
    if(!data?.length){show('lookupFeedback','Noch keine freigegebene Karte gefunden. Dein Antrag ist möglicherweise noch in Prüfung, abgelehnt oder gesperrt.');return;}
    const member=data[0];
    $('cardName').textContent=member.display_name;
    const roleNames={MEMBER:'MEMBER',MODERATOR:'MODERATOR','CO-OWNER':'CO-OWNER',OWNER:'OWNER'};
    $('cardRole').textContent=roleNames[member.role]||'MEMBER';
    $('cardNumber').textContent=member.member_no||'';
    const passive=member.status==='passive';
    $('cardStatus').textContent=passive?'● PASSIV':'● AKTIV';
    $('cardStatus').style.color=passive?'#facc7a':'#66efb7';
    $('memberCard').classList.toggle('is-passive',passive);
    const badgeTarget=$('cardBadges');
    badgeTarget.textContent='Abzeichen werden geladen …';
    try {
      const {data:earned,error:badgeError}=await client.rpc('frost_hub_member_badges',{p_code:code});
      if(badgeError)throw badgeError;
      badgeTarget.replaceChildren();
      const names={ 'SEIT 2025':'❄️ Seit 2025', 'ERSTER AUSFLUG':'🚌 Erster Ausflug',TEAMHELFER:'🤝 Teamhelfer',SLALOM:'⛸️ Slalom',RUECKWAERTS:'↩️ Rückwärtsfahren','FROST CREW':'👑 Frost Crew'};
      if(!earned?.length)badgeTarget.textContent='Noch keine Abzeichen';
      else (earned||[]).forEach(entry=>{
        const badge=document.createElement('span');
        badge.className='member-badge';
        badge.textContent=names[entry.badge]||entry.badge;
        badgeTarget.append(badge);
      });
    }catch(error){console.warn('Abzeichen nicht geladen',error);badgeTarget.textContent='Abzeichen momentan nicht verfügbar';}

    activeCardLink=cardLink(code);
    $('cardQr').replaceChildren();
    if(window.QRCode){new window.QRCode($('cardQr'),{text:activeCardLink,width:150,height:150,colorDark:'#050505',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M});}
    else{$('cardQr').textContent='QR-Code derzeit nicht verfügbar. Nutze den Karten-Link.';}
    $('approvedSection').hidden=false;
    $('lookupFeedback').textContent='';
    try{localStorage.setItem(localKey,code);}catch{}
    $('approvedSection').scrollIntoView({behavior:'smooth'});
  }catch(e){show('lookupFeedback','Die Karte konnte gerade nicht abgerufen werden. Versuche es bitte später.',true);console.error('Kartenabfrage fehlgeschlagen',e);}
}
$('lookupForm').addEventListener('submit',event=>{event.preventDefault();checkCode(cleanCode($('lookupCode').value));});
$('printCard').addEventListener('click',()=>window.print());
$('copyCardLink').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(activeCardLink);show('cardFeedback','Karten-Link kopiert!');}
  catch{show('cardFeedback','Kopieren ging nicht. Hier dein Link:\n'+activeCardLink);}
});
let requestedCode = cleanCode(new URLSearchParams(location.search).get('code'));
if(!requestedCode){try{requestedCode=cleanCode(localStorage.getItem(localKey));}catch{}}
if(requestedCode){$('lookupCode').value=requestedCode;checkCode(requestedCode,false);}
})();

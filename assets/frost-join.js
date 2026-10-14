(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.FROST_MEMBERS_CONFIG||{};
const ready=Boolean(window.supabase)&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl||'')&&/^(sb_publishable_|eyJ)/.test(cfg.supabaseAnonKey||'');
const client=ready?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
const message=$('joinMessage');
const whatsapp=$('joinWhatsapp');
const notice=(id,text,error=false)=>{const node=$(id);node.textContent=text;node.className='fh-status'+(error?' error':'');};
const personalLink=code=>new URL('mitglieder.html?code='+encodeURIComponent(code),location.href).href;
let savedLink='';
function updateWhatsapp(){
 whatsapp.href='https://wa.me/4915234646842?text='+encodeURIComponent(message.value);
}
message.addEventListener('input',updateWhatsapp);updateWhatsapp();
$('joinCopyMessage').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(message.value);notice('joinWhatsappStatus','✅ Text kopiert – füge ihn jetzt in WhatsApp ein.');}
 catch{message.focus();message.select();notice('joinWhatsappStatus','Markiere und kopiere den Text über das Menü deines Geräts.');}
});
$('joinCopyLink').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(savedLink);notice('joinFeedback','🔗 Dein persönlicher Link wurde kopiert.');}
 catch{notice('joinFeedback','Dein persönlicher Link: '+savedLink);}
});
$('joinForm').addEventListener('submit',async ev=>{
 ev.preventDefault();
 const firstName=$('joinFirstName').value.trim();
 if(!/^[\p{L}][\p{L}'’-]{1,39}$/u.test(firstName)){
  notice('joinFeedback','Bitte gib nur deinen Vornamen ein (2–40 Buchstaben, ohne Leerzeichen).',true);return;
 }
 if(!$('joinConsent').checked){
  notice('joinFeedback','Bitte lies und bestätige zuerst die Datenschutzhinweise.',true);return;
 }
 if(!client){notice('joinFeedback','Die Anmeldung ist gerade nicht erreichbar. Bitte versuche es später.',true);return;}
 const button=$('joinSubmit');button.disabled=true;button.textContent='Wird gesendet …';
 const requestCode=crypto.randomUUID();
 try{
  const {error}=await client.from('frost_member_requests').insert({display_name:firstName,request_code:requestCode});
  if(error)throw error;
  // GMX notification is queued by the database, even when the Owner Lounge is closed.
  savedLink=personalLink(requestCode);
  try{localStorage.setItem('frost-member-card-code',requestCode);}catch{}
  $('joinCardLink').href=savedLink;
  $('joinCardLink').textContent=savedLink;
  $('joinSaved').hidden=false;
  notice('joinFeedback','✅ Antrag verschickt! Deine Anmeldung muss noch von der Leitung bestätigt werden.');
  $('joinFirstName').value='';$('joinConsent').checked=false;
  $('joinSaved').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(e){console.error('Frost join failed',e);notice('joinFeedback','Die Anmeldung konnte nicht gesendet werden. Bitte später erneut versuchen.',true);}
 finally{button.disabled=false;button.textContent='Anfrage abschicken';}
});
})();
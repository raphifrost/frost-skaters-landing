(() => {
'use strict';
const $ = id => document.getElementById(id);
const cfg=window.FROST_MEMBERS_CONFIG||{};
const ready=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl||'') && /^(eyJ|sb_publishable_)/.test(cfg.supabaseAnonKey||'') && Boolean(window.supabase);
const client=ready?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
 auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
}):null;
const feedback=(id,message,error=false)=>{
  const n=$(id);n.textContent=message;n.className='member-alert'+(error?' error':'');
};
const codeLink=code=>new URL('mitglieder.html?code='+encodeURIComponent(code),location.href).href;
let rows=[];
let signedIn=false;
const dateFormat=d=>d?new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(new Date(d)):'—';
const safeStatus=s=>({pending:'Offen',approved:'Aktiv',rejected:'Abgelehnt',revoked:'Gesperrt'}[s]||s);
const memberNumber=id=>'FS-'+id.slice(0,8).toUpperCase();
const button=(label,action,css='secondary')=>{
  const b=document.createElement('button');b.type='button';b.className='member-btn '+css;b.textContent=label;
  b.addEventListener('click',action);return b;
};
function render(){
  $('statAll').textContent=rows.length;
  $('statPending').textContent=rows.filter(r=>r.status==='pending').length;
  $('statApproved').textContent=rows.filter(r=>r.status==='approved').length;
  $('statOther').textContent=rows.filter(r=>['rejected','revoked'].includes(r.status)).length;
  const filter=$('filterStatus').value,search=$('filterName').value.trim().toLocaleLowerCase('de');
  const data=rows.filter(r=>(filter==='all'||r.status===filter)&&r.display_name.toLocaleLowerCase('de').includes(search));
  $('memberRows').replaceChildren();
  if(!data.length){
    const td=document.createElement('td');td.colSpan=6;td.textContent='Keine Einträge in dieser Auswahl.';
    const tr=document.createElement('tr');tr.append(td);$('memberRows').append(tr);return;
  }
  data.forEach(r=>{
    const tr=document.createElement('tr');
    [r.display_name,null,r.role,r.member_no||'—',dateFormat(r.created_at)].forEach((value,i)=>{
      const td=document.createElement('td');
      if(i===1){const s=document.createElement('span');s.className='member-status-pill '+r.status;s.textContent=safeStatus(r.status);td.append(s);}
      else td.textContent=value;
      tr.append(td);
    });
    const td=document.createElement('td'),actions=document.createElement('div');actions.className='member-row-actions';
    if(r.status==='pending'){
      actions.append(button('✅ Annehmen',()=>updateStatus(r,'approved',true)));
      actions.append(button('❌ Ablehnen',()=>updateStatus(r,'rejected',false),'danger'));
    }else if(r.status==='approved'){
      actions.append(button('🔗 Link kopieren',()=>copyLink(r.request_code)));
      actions.append(button('🔒 Sperren',()=>updateStatus(r,'revoked',false),'danger'));
    }else {
      actions.append(button('✅ Freigeben',()=>updateStatus(r,'approved',true)));
    }
    td.append(actions);tr.append(td);$('memberRows').append(tr);
  });
}
async function reload(){
  if(!signedIn||!client)return;
  feedback('tableFeedback','Mitglieder werden geladen …');
  try{
    const {data,error}=await client.from('frost_member_requests')
      .select('id,request_code,display_name,status,role,member_no,created_at,processed_at')
      .order('created_at',{ascending:false}).limit(1000);
    if(error)throw error;
    rows=data||[];
    render();
    $('tableFeedback').textContent=rows.length>=1000?'Hinweis: Es werden nur die neuesten 1000 Einträge angezeigt.':'';
  }catch(e){feedback('tableFeedback','Die Übersicht konnte nicht geladen werden.',true);console.error(e);}
}
async function updateStatus(r,status,approve){
  if(!window.confirm('Möchtest du '+r.display_name+' wirklich '+(status==='approved'?'freigeben':status==='rejected'?'ablehnen':'sperren')+'?'))return;
  const changes={status,processed_at:new Date().toISOString()};
  if(approve)changes.member_no=r.member_no||memberNumber(r.request_code);
  try{
    const {data,error}=await client.from('frost_member_requests').update(changes).eq('id',r.id).eq('status',r.status).select('id,request_code');
    if(error)throw error;
    if(!data?.length){feedback('tableFeedback','Dieser Antrag hat sich zwischenzeitlich geändert. Bitte aktualisieren.',true);await reload();return;}
    if(approve)feedback('tableFeedback','Mitglied angenommen! Jetzt den persönlichen Karten-Link senden:\n'+codeLink(r.request_code));
    else feedback('tableFeedback','Status geändert: '+safeStatus(status));
    await reload();
    // reload clears the feedback, so restore the confirmation.
    if(approve)feedback('tableFeedback','Mitglied freigegeben! Karten-Link:\n'+codeLink(r.request_code));
    else feedback('tableFeedback','Status gespeichert: '+safeStatus(status));
  }catch(e){feedback('tableFeedback','Änderung fehlgeschlagen. Versuche es später erneut.',true);console.error(e);}
}
async function copyLink(code){
  const link=codeLink(code);
  try{await navigator.clipboard.writeText(link);feedback('tableFeedback','Karten-Link kopiert! Du kannst ihn jetzt dem Mitglied schicken.');}
  catch{feedback('tableFeedback','Hier der Karten-Link zum Kopieren:\n'+link);}
}
$('filterStatus').addEventListener('change',render);
$('filterName').addEventListener('input',render);
$('reloadMembers').addEventListener('click',reload);
$('adminLogin').addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){feedback('loginFeedback','Das Mitgliedersystem ist noch nicht mit der Datenbank verbunden. Bitte zuerst Supabase einrichten.',true);return;}
  const btn=$('loginButton');btn.disabled=true;btn.textContent='Prüfe Zugang …';
  try{
    const {data:loginData,error}=await client.auth.signInWithPassword({email:$('ownerEmail').value.trim(),password:$('ownerPassword').value});
    $('ownerPassword').value='';
    if(error)throw error;
    const {data:roles,error:checkErr}=await client.from('frost_admins').select('user_id').limit(1);
    if(checkErr||!roles?.length){
      await client.auth.signOut();
      feedback('loginFeedback','Dein Login hat funktioniert! Der Account ist aber noch nicht als Owner freigeschaltet.\\n\\nKopiere diese Benutzer-ID und teile sie zur Freischaltung mit dem Website-Verwalter (niemals dein Passwort):\\n'+(loginData?.user?.id||'Nicht verfügbar'));
      return;
    }
    signedIn=true;$('signInPanel').hidden=true;$('dashboard').hidden=false;await reload();
  }catch(e){feedback('loginFeedback','Login nicht möglich. Bitte kontrolliere die E-Mail und das Passwort. Wenn du gerade auf localhost:3000 gelandet bist, kann die Bestätigung trotzdem erfolgreich gewesen sein — probiere deinen Login hier erneut.',true);console.error(e);}
  finally{btn.disabled=false;btn.textContent='Einloggen';}
});
$('signOut').addEventListener('click',async()=>{
  if(client)await client.auth.signOut();
  signedIn=false;rows=[];$('dashboard').hidden=true;$('signInPanel').hidden=false;$('memberRows').replaceChildren();
});
$('addMember').addEventListener('submit',async event=>{
  event.preventDefault();
  if(!signedIn)return;
  const display_name=$('manualName').value.trim().replace(/\s+/g,' ');
  if(display_name.length<2||display_name.length>40){feedback('manualFeedback','Name muss 2 bis 40 Zeichen lang sein.',true);return;}
  const request_code=crypto.randomUUID();
  const role=$('manualRole').value;
  const btn=$('manualButton');btn.disabled=true;
  try{
    const {error}=await client.from('frost_member_requests').insert({
      request_code,display_name,role,status:'approved',
      member_no:memberNumber(request_code),processed_at:new Date().toISOString()
    });
    if(error)throw error;
    $('manualName').value='';$('manualRole').value='MEMBER';
    await reload();
    feedback('manualFeedback','Mitglied eingetragen und Karte aktiviert! Schicke diesen Link direkt an die Person:\n'+codeLink(request_code));
  }catch(e){feedback('manualFeedback','Karte konnte nicht erstellt werden. Prüfe die Admin-Berechtigung und Datenbankkonfiguration.',true);console.error(e);}
  finally{btn.disabled=false;}
});
const signupForm=$('adminSignup');
signupForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){feedback('signupFeedback','Das System ist gerade nicht erreichbar. Versuche es bitte später.',true);return;}
  const email=$('signupEmail').value.trim();
  const password=$('signupPassword').value;
  const repeat=$('signupPasswordRepeat').value;
  if(password.length<12){feedback('signupFeedback','Bitte ein Passwort mit mindestens 12 Zeichen auswählen.',true);return;}
  if(password!==repeat){feedback('signupFeedback','Die beiden Passwörter stimmen nicht überein.',true);return;}
  const btn=$('signupButton');
  btn.disabled=true;btn.textContent='Zugang wird beantragt …';
  try{
    const {data,error}=await client.auth.signUp({
      email,password,
      options:{ emailRedirectTo:new URL('mitglieder-admin.html',location.href).href }
    });
    $('signupPassword').value='';$('signupPasswordRepeat').value='';
    if(error)throw error;
    if(data?.session)await client.auth.signOut();
    feedback('signupFeedback','Anfrage gesendet! Schau in deinem E-Mail-Postfach (auch Spam) nach und bestätige deine Adresse. Danach muss dein Account einmalig als Owner freigeschaltet werden. Öffne anschließend hier den Login.');
    $('ownerEmail').value=email;
  }catch(e){feedback('signupFeedback','Registrierung momentan nicht möglich: '+(e?.message||'Unbekannter Fehler')+'. Prüfe die E-Mail-Adresse und versuche es später erneut.',true);}
  finally{btn.disabled=false;btn.textContent='Owner-Zugang beantragen';}
});
if(!ready)feedback('loginFeedback','Die Website muss noch mit Supabase verbunden werden. In assets/frost-members-config.js sind die öffentlichen Projektangaben einzutragen. Bis dahin werden keine Anträge gesammelt.',true);
})();

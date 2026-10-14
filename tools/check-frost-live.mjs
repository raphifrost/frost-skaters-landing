#!/usr/bin/env node
/**
 * Frost Skaters 3.0 non-destructive live smoke checks.
 * Only public / anonymous requests. Never registers users or writes personal data.
 */
import fs from 'node:fs';
import vm from 'node:vm';

const origin='https://raphifrost.github.io/frost-skaters-landing/';
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('assets/frost-members-config.js','utf8'),sandbox);
const cfg=sandbox.window.FROST_MEMBERS_CONFIG;
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg?.supabaseUrl||''))throw Error('Invalid public Supabase URL');
if(!/^(sb_publishable_|eyJ)/.test(cfg?.supabaseAnonKey||''))throw Error('Invalid public Supabase key');
const results=[];

async function request(url,options={},attempts=3){
 let lastErr;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const response=await fetch(url,{...options,signal:AbortSignal.timeout(14000)});
   if(response.status===429||response.status>=500){
    if(attempt<attempts-1){await new Promise(r=>setTimeout(r,3000));continue;}
   }
   return response;
  }catch(err){
   lastErr=err;
   if(attempt<attempts-1)await new Promise(r=>setTimeout(r,3000));
  }
 }
 throw lastErr||Error('Request failed: '+url);
}
function check(test,ok,explanation=''){
 if(!ok)throw Error('FAILED '+test+(explanation?': '+explanation:''));
 results.push('✅ '+test);
}
for(const page of ['index.html','anmelden.html','qr-karten.html','community.html','community-en.html','hub-admin.html','mitglieder-admin.html','mitglieder.html','datenschutz.html','eishallen.html','jahresrueckblick.html','team-talk.html']){
 const response=await request(origin+page);
 const body=await response.text();
 check('GitHub Pages '+page,response.status===200,'HTTP '+response.status);
 check('HTML returned '+page,/<html\b/i.test(body)&&body.includes('Frost'),'Unexpected content');
}
for(const asset of ['assets/frost-team-talk.js','assets/frost-team-talk.css','team-talk.webmanifest','assets/frost-card-premium.css','assets/frost-owner-lounge.css','assets/frost-members-admin.js','assets/frost-join.js','assets/frost-join.css','assets/frost-qr-karten.js','assets/frost-qr-karten.css','assets/frost-hub-admin.js','assets/frost-hub-public.js','assets/frost-members.js','assets/frost-hub.css','assets/frost-skaters-logo.jpg']){
 const response=await request(origin+asset);
 check('Static asset '+asset,response.ok,'HTTP '+response.status);
}
const headers={'apikey':cfg.supabaseAnonKey,'Accept':'application/json','Origin':new URL(origin).origin};
async function api(path,method='GET',body=null){
 const opts={method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})};
 const res=await request(cfg.supabaseUrl+path,opts);
 let payload;
 try{payload=await res.json();}catch{payload=null;}
 return {status:res.status,ok:res.ok,payload};
}
const publicPosts=await api('/rest/v1/frost_hub_items?select=id,kind,title,visible&limit=10');
check('Supabase public items accessible',publicPosts.ok,'HTTP '+publicPosts.status);
check('Anonymous results contain no drafts',Array.isArray(publicPosts.payload)&&publicPosts.payload.every(x=>x.visible===true));
const settings=await api('/rest/v1/frost_hub_settings?select=key,value&limit=10');
check('Public community settings accessible',settings.ok&&Array.isArray(settings.payload),'HTTP '+settings.status);
const stats=await api('/rest/v1/rpc/frost_hub_season_stats','POST',{});
check('Public stats RPC accessible',stats.ok,'HTTP '+stats.status);
const noCode='00000000-0000-4000-8000-000000000000';
const receipt=await api('/rest/v1/rpc/frost_hub_request_status','POST',{p_code:noCode});
check('Private lookup returns nothing for unknown request',receipt.ok&&Array.isArray(receipt.payload)&&receipt.payload.length===0,'HTTP '+receipt.status);
const owner=await api('/rest/v1/rpc/frost_hub_is_owner','POST',{});
check('Anonymous owner privilege check is denied',!owner.ok,'HTTP '+owner.status);
const history=await api('/rest/v1/frost_hub_member_history?select=*&limit=1');
check('Anonymous member history read is denied',!history.ok,'HTTP '+history.status);
const teamRoom=await api('/rest/v1/frost_team_rooms?select=*&limit=1');
check('Anonymous visitors cannot read team rooms',!teamRoom.ok,'HTTP '+teamRoom.status);
const teamChat=await api('/rest/v1/frost_team_messages?select=*&limit=1');
check('Anonymous visitors cannot read team messages',!teamChat.ok,'HTTP '+teamChat.status);
const roster=await api('/rest/v1/rpc/frost_team_roster','POST',{});
check('Anonymous visitors cannot list team participants',!roster.ok,'HTTP '+roster.status);
const teamRole=await api('/rest/v1/rpc/frost_team_my_role','POST',{});
check('Anonymous visitors cannot query internal team roles',!teamRole.ok,'HTTP '+teamRole.status);
console.log('Frost Skaters live smoke tests: '+results.length+' checks passed.');
for(const line of results)console.log(line);

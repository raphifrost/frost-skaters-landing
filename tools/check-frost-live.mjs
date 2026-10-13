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
for(const page of ['index.html','community.html','community-en.html','hub-admin.html','mitglieder.html','datenschutz.html','eishallen.html','jahresrueckblick.html']){
 const response=await request(origin+page);
 const body=await response.text();
 check('GitHub Pages '+page,response.status===200,'HTTP '+response.status);
 check('HTML returned '+page,/<html\b/i.test(body)&&body.includes('Frost'),'Unexpected content');
}
for(const asset of ['assets/frost-hub-admin.js','assets/frost-hub-public.js','assets/frost-members.js','assets/frost-hub.css','assets/frost-skaters-logo.jpg']){
 const response=await request(origin+asset);
 check('Static asset '+asset,response.ok,'HTTP '+response.status);
}
const headers={'apikey':cfg.supabaseAnonKey,'Accept':'application/json','Origin':origin};
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
console.log('Frost Skaters live smoke tests: '+results.length+' checks passed.');
for(const line of results)console.log(line);

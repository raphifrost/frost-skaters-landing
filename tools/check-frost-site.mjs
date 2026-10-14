#!/usr/bin/env node
/**
 * Frost Skaters checks: dependency-free and safe to run in GitHub Actions.
 * Does NOT touch Supabase data, secrets, identities, or external APIs.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const errors=[];
let verifiedLinks=0,verifiedScripts=0,verifiedPageIds=0;
const pages=fs.readdirSync(root).filter(name=>name.endsWith('.html')&&fs.statSync(path.join(root,name)).isFile());
const jsFiles=fs.readdirSync(path.join(root,'assets'))
 .filter(name=>name.endsWith('.js')).map(name=>path.join('assets',name));

function fail(message){errors.push(message);}
function textFile(relative){return fs.readFileSync(path.join(root,relative),'utf8');}
function exists(relative){return fs.existsSync(path.join(root,relative));}
function getIds(html){return [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]);}

for(const file of jsFiles){
 try{new vm.Script(textFile(file),{filename:file});verifiedScripts++;}
 catch(error){fail(file+': '+error.message);}
}
for(const file of pages){
 const html=textFile(file),ids=getIds(html),set=new Set(ids);
 if(ids.length!==set.size){
  const repeated=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  fail(file+': duplicate ID(s) '+repeated.join(', '));
 }
 for(const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)){
  const raw=match[1].trim();
  if(!raw||raw.startsWith('#')||/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)||raw.includes('{'))continue;
  const target=raw.split(/[?#]/,1)[0];
  if(!target||!/\.(?:html|css|js|svg|png|jpg|jpeg|webp|webmanifest|json|xml)$/i.test(target))continue;
  if(target.includes('..')){fail(file+': disallowed relative parent link: '+raw);continue;}
  if(!exists(target))fail(file+': link target missing: '+raw);
  else verifiedLinks++;
 }
 for(const match of html.matchAll(/<script\b([^>]+)\bsrc=["'](assets\/[^"']+\.js)(?:\?[^"']*)?["'][^>]*><\/script>/g)){
  const asset=match[2];
  if(!exists(asset))continue;
  if(!/frost-(?:hub|members|recap|team-talk|team-calendar|intro)/.test(asset))continue;
  const code=textFile(asset);
  for(const ref of new Set([...code.matchAll(/\$\(['"]([A-Za-z][A-Za-z0-9_-]*)['"]\)/g)].map(x=>x[1]))){
    verifiedPageIds++;
    if(!set.has(ref))fail(file+': '+asset+' references missing element #'+ref);
  }
 }
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  if(/\bsrc\s*=/.test(match[1])||/type=["']application\//.test(match[1]))continue;
  if(!match[2].trim())continue;
  try{new vm.Script(match[2],{filename:file+' inline-script'});verifiedScripts++;}
  catch(error){fail(file+': inline script syntax: '+error.message);}
 }
 if(/href=["']shop\.html["']/.test(html))fail(file+': deleted clothing shop is still linked');
}
if(exists('shop.html'))fail('Deleted clothing shop page still present.');
const publicConfig=textFile('assets/frost-members-config.js');
if(/sb_secret_|sk_live_|sk_test_|SUPABASE_SERVICE_ROLE_KEY\s*[:=]/.test(publicConfig))
 fail('Detected a potentially secret credential in public configuration.');
const mustExist=[
 'community.html','community-en.html','hub-admin.html','eishallen.html','jahresrueckblick.html',
 'mitglieder.html','mitglieder-admin.html','datenschutz.html','index.html',
 'assets/frost-hub-public.js','assets/frost-hub-admin.js','assets/frost-members.js',
 'assets/frost-members-admin.js','assets/frost-recap.js','hub.webmanifest',
 'team-talk.html','team-talk.webmanifest','assets/frost-team-talk.js','assets/frost-team-talk.css',
 'assets/frost-intro.js','assets/frost-intro.css',
 'team-kalender.html','assets/frost-team-calendar.js','assets/frost-team-calendar.css'
];
for(const file of mustExist)if(!exists(file))fail('Required project file missing: '+file);
console.log('Frost Skaters: '+pages.length+' HTML pages, '+verifiedLinks+' local links, '+verifiedScripts+' JS syntax checks and '+verifiedPageIds+' page-element checks.');
if(errors.length){for(const e of errors)console.error('❌ '+e);process.exitCode=1;}
else console.log('✅ All static website checks passed. Browser/Supabase end-to-end behavior must still be verified separately.');

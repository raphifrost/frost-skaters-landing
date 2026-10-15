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
 'team-kalender.html','assets/frost-team-calendar.js','assets/frost-team-calendar.css',
 'assets/frost-intro.js','assets/frost-intro.css',
 'assets/frost-faq.js','assets/frost-faq.css','tools/check-frost-faq.mjs',
 'website-updates.html','assets/frost-updates.css','assets/frost-updates.js','assets/frost-v11-home.css','CHANGELOG.md'
];
for(const file of mustExist)if(!exists(file))fail('Required project file missing: '+file);
// Make sure the protected calendar has its own login and is linked only from staff pages.
const calendar=textFile('team-kalender.html');
for(const id of ['tcLogin','tcPrivate','tcLoginForm','tcGrid','tcDayEntries','tcUpcoming','tcEventForm','tcDialog'])
 if(!getIds(calendar).includes(id))fail('team-kalender.html missing calendar element #'+id);
if(!calendar.includes('assets/frost-team-calendar.js')||!calendar.includes('assets/frost-team-calendar.css'))
 fail('Team calendar JS/CSS not linked');
if(!textFile('team-talk.html').includes('href="team-kalender.html"'))
 fail('Missing private calendar entry from Team Lounge');
for(const page of ['index.html','community.html','mitglieder.html','anmelden.html'])
 if(/href=["']team-kalender\.html["']/.test(textFile(page)))
  fail('Private Team-Kalender should not appear in public menu on '+page);
const publicFaqPages=[
 'index.html','anmelden.html','mitglieder.html','events.html','training.html','leitung.html',
 'community.html','eishallen.html','jahresrueckblick.html','datenschutz.html','qr-karten.html'
];
for (const page of publicFaqPages) {
 const html=textFile(page);
 if (!html.includes('assets/frost-faq.js') || !html.includes('assets/frost-faq.css'))
  fail(page+': Frost FAQ helper JS/CSS not correctly linked');
}
for(const page of ['hub-admin.html','mitglieder-admin.html','team-talk.html','team-kalender.html']){
 if(textFile(page).includes('assets/frost-faq.js'))
  fail(page+': visitor FAQ must not interrupt private workflows');
}
if(!textFile('assets/frost-faq.js').includes('Fragen?'))
 fail('Frost FAQ launcher is missing');
// Public 1.1 release experience and honest version changelog.
const v11home=textFile('index.html');
const releases=textFile('website-updates.html');
const notes=textFile('CHANGELOG.md');
if(!v11home.includes('frost-v11-home')||!v11home.includes('assets/frost-v11-home.css'))
 fail('Version 1.1 home design is missing');
if(!v11home.includes('id="version11"')||!v11home.includes('href="website-updates.html"'))
 fail('Version 1.1 release teaser or link is missing from homepage');
for(const token of ['Version 1.1','1.0','website-updates.html']){
 if(!notes.includes(token))fail('CHANGELOG.md missing '+token);
}
for(const id of ['fuTitle','fuNewTitle','fuHistoryTitle','fuFeatures','fuCopyLink','fuCopyStatus','fuScrollProgress']){
 if(!getIds(releases).includes(id))fail('Website Updates missing element #'+id);
}
if(!releases.includes('Version 1.1')||!releases.includes('1.0')||!releases.includes('15. OKTOBER 2026'))
 fail('Release page is missing the correct version history');
if(!releases.includes('assets/frost-updates.css')||!releases.includes('assets/frost-updates.js'))
 fail('Release visual/interactive assets are not linked');
if(!releases.includes('data-fu-filter="all"')||!releases.includes('data-fu-filter="new"')||!releases.includes('data-fu-filter="existing"'))
 fail('Release filters are missing options');
if(!releases.includes('data-fu-kind="new"')||!releases.includes('data-fu-kind="existing"'))
 fail('Release feature types are not identified');
if(/href=["'](?:team-talk|team-kalender|mitglieder-admin|hub-admin)\.html/.test(releases))
 fail('Release page must not link directly to private team/member management');
for(const page of ['index.html','events.html','training.html','leitung.html','mitglieder.html','anmelden.html','community.html','datenschutz.html']){
 if(!textFile(page).includes('href="website-updates.html"'))
  fail(page+': no navigation to Website Updates');
}
console.log('Frost Skaters: '+pages.length+' HTML pages, '+verifiedLinks+' local links, '+verifiedScripts+' JS syntax checks and '+verifiedPageIds+' page-element checks.');
if(errors.length){for(const e of errors)console.error('❌ '+e);process.exitCode=1;}
else console.log('✅ All static website checks passed. Browser/Supabase end-to-end behavior must still be verified separately.');

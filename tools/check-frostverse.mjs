#!/usr/bin/env node
/* Cross-page privacy and interaction contract for 15 Frost Skaters 1.1 upgrades.
 * This is static integration testing, not a substitute for authenticated browser QA.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=path=>fs.readFileSync(path,'utf8');
const home=read('index.html');
const portal=read('frostverse.html');
const world=read('assets/frostverse.js');
const command=read('assets/frost-command.js');
const owner=read('mitglieder-admin.html');
const god=read('assets/frost-god-mode.js');
const member=read('mitglieder.html');
const memberCode=read('assets/frost-members.js');
const member3d=read('assets/frost-id-pro.js');
const team=read('team-talk.html');
const teamCode=read('assets/frost-team-talk.js');
const privacy=read('datenschutz.html');
let checks=0;
function check(ok,message){assert.ok(ok,message);checks++;}
for(const path of ['assets/frostverse.js','assets/frost-command.js','assets/frost-id-pro.js','assets/frost-god-mode.js','assets/frost-team-talk.js']){
 check(Boolean(new vm.Script(read(path),{filename:path})),path+' parses');
}
const sections=['worlds','event','crew','hall','map','tv','studio','capsule','season'];
for(const id of sections)check(portal.includes('id="'+id+'"'),'Frostverse section '+id);
const domIDs=['fvSound','fvEffects','fvSnow','fvTimer','fvDays','fvHours','fvMinutes','fvTimerNote','fvMapPlace','fvMapDescription','fvMapSearch',
 'fvTvTag','fvTvHeading','fvTvBody','fvTvCounter','fvTvSlide','fvTvPrev','fvTvNext','fvTvPlay',
 'fvSkateSvg','fvSkateBoot','fvSkatePanel','fvSkateCuff','fvBootColor','fvPanelColor','fvCuffColor','fvSkateExport','fvSkateStatus',
 'fvCapsuleForm','fvCapsuleText','fvCapsuleDate','fvCapsuleState','fvCapsuleMessage','fvCapsuleDelete',
 'fvSeasonPick','fvSeasonIcon','fvSeasonStatus','fvScrollProgress'];
for(const id of domIDs)check(portal.includes('id="'+id+'"'),id+' present in Frostverse');
check(portal.includes('assets/frostverse.css')&&portal.includes('assets/frostverse.js'),'Frostverse JS+CSS linked');
check(portal.includes('assets/frost-command.js')&&portal.includes('assets/frost-command.css'),'Command UI linked in Frostverse');
check(home.includes('href="frostverse.html"')&&home.includes('frostverse-teaser.css'),'Home links portal & loads visuals');
check(home.includes('assets/frost-command.js'),'Home loads command search');
check(!world.includes('navigator.geolocation')&&!world.includes('getUserMedia'),'World does not request location or camera/mic');
check(!world.includes('client.from(')&&!world.includes('supabase.from(')&&!world.includes('createClient('),'World cannot read Supabase tables');
check(!world.includes('fetch('),'World does not send user-entered data to servers');
check(world.includes('AudioContext')&&world.includes('fvSound'),'Opt-in Web Audio implemented');
check(world.includes('prefers-reduced-motion')&&world.includes('fvEffects'),'Animations honor reduced motion');
check(world.includes('frostverse.capsule.v1')&&world.includes('localStorage'),'Capsule is locally stored');
check(world.includes('frostverse.season.v1'),'Chosen seasonal theme saved locally');
check(world.includes('XMLSerializer')&&world.includes('image/png'),'Skate PNG export supported');
check(world.includes('2027')&&portal.includes('3. Januar 2027'),'Countdown does not invent date');
check(!portal.includes('href="mitglieder-admin.html"'),'Public world has no direct Owner link');
check(!portal.includes('href="team-kalender.html"'),'Public world has no private calendar link');
check(command.includes("ownerUnlocked()")&&command.includes("ownerDashboard.hidden"),'Command list checks Owner dashboard visibility');
check(command.includes('privateCommands'),'Command private actions defined separately');
check(!command.includes('createClient(')&&!command.includes('localStorage'),'Command has no independent auth/session');
check(owner.includes('<section id="dashboard" hidden>'),'Owner remains login gated');
const privateMarkup=owner.split('<section id="dashboard" hidden>')[1]||'';
check(privateMarkup.includes('id="ownerGodMode"'),'God Mode contained inside gated Owner dashboard');
for(const id of ['godPending','godActive','godHealth','godUpdated'])check(owner.includes('id="'+id+'"'),'Owner God '+id);
check(owner.includes('assets/frost-god-mode.js')&&owner.includes('assets/frost-god-mode.css'),'Owner God assets linked');
check(god.includes("dashboard.hidden")&&!god.includes("createClient("),'God mode mirrors existing verified Owner counts');
check(member.includes('id="approvedSection" hidden'),'Member card hidden before verification');
check(member.includes('id="memberCard"')&&member.includes('frost-id-pro.css')&&member.includes('frost-id-pro.js'),'Frost ID Pro uses existing verified card');
check(member.includes('id="frostIdTilt"')||member.includes('id="frostId3dToggle"'),'Frost ID Pro toggle exists');
check(memberCode.includes("client.rpc('frost_find_member'"),'Private code verification preserved');
check(!member3d.includes('fetch(')&&!member3d.includes('createClient('),'ID animation never requests private data');
check(team.includes('<section id="ttPrivate" hidden>'),'Inner Circle remains gated');
const gated=team.split('<section id="ttPrivate" hidden>')[1]||'';
check(gated.includes('id="ttPortalGate"'),'Secret team hub nested within private Team Lounge');
check(teamCode.includes("client.rpc('frost_team_my_role')"),'Team role still checked via server RPC');
check(teamCode.includes("ttPortalOwner").valueOf(),'Team Owner-only button handled');
check(privacy.includes('Frost Time Capsule')&&privacy.includes('localStorage'),'Privacy text covers local capsule');
check(privacy.includes('Frost ID Pro')&&privacy.includes('Frost-Command'),'Privacy notice includes ID Pro and command search');
console.log('✅ Frostverse: '+checks+' privacy/functional integration contract checks passed. Authenticated browser QA remains separate.');

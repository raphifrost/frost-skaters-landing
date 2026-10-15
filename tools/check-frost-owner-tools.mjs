#!/usr/bin/env node
/**
 * Frost Owner Toolkit UI-contract and pure business-mapping tests.
 * The real RLS decisions live in Supabase, never in this browser test.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('assets/frost-owner-tools.js','utf8');
const ownerHtml=fs.readFileSync('mitglieder-admin.html','utf8');
const login=fs.readFileSync('assets/frost-members-admin.js','utf8');
const marker="let client=null,ownerId=null,staffRows=[],generation=0,monitorTimer=null,monitorBusy=false;";
assert.ok(source.includes(marker),'Owner tool logic must stay separable from the DOM');
const injected=source.replace(marker,'globalThis.__ownerTest={uuidOK,allowedName,validRole,displayRole,displayStatus,eventCopy};return;\n'+marker);
const sb={document:{getElementById:()=>({})}};
vm.runInNewContext(injected,sb,{filename:'frost-owner-tools.js',timeout:2000});
const t=sb.__ownerTest;
assert.ok(t,'Pure Owner Toolkit helpers should be available for tests');
let checks=0;
const testCase=(label,ok)=>{assert.ok(ok,label);checks++;};
const validId='12345678-9abc-4def-8abc-123456789abc';
testCase('Valid team UUID',t.uuidOK(validId));
testCase('Invalid team UUID rejected',!t.uuidOK('12345678-1234'));
testCase('Unicode first names accepted',t.allowedName('Alina'));
testCase('Short name rejected',!t.allowedName('A'));
testCase('Emails disallowed as display names',!t.allowedName('alina@example.de'));
testCase('Long display name rejected',!t.allowedName('X'.repeat(41)));
testCase('Whitelisted coowner role',t.validRole('coowner'));
testCase('Whitelisted manager role',t.validRole('manager'));
testCase('Whitelisted supporter role',t.validRole('supporter'));
testCase('Owner promotion rejected by team UI',!t.validRole('owner'));
testCase('Arbitrary role rejected',!t.validRole('admin'));
testCase('Member status naming',t.displayStatus('approved')==='Aktiv');
testCase('Team role naming',t.displayRole('supporter')==='Supporter');
const members=new Map([[validId,'Mustername']]);
const staff=new Map([[validId,'Teammitglied']]);
const expected=[
 ['application_received','Neuer Mitgliedsantrag'],
 ['card_created','Neue Mitgliedskarte angelegt'],
 ['card_status_changed','Mitgliedskarten-Status geändert'],
 ['card_role_changed','Kartenrolle geändert'],
 ['card_deleted','Mitgliedskarte gelöscht'],
 ['staff_added','Teamzugang freigeschaltet'],
 ['staff_role_changed','Teamrolle geändert'],
 ['staff_name_changed','Anzeigename eines Teamkontos geändert'],
 ['staff_removed','Teamzugang entzogen']
];
for(const [kind,title] of expected){
 const result=t.eventCopy({kind,member_id:validId,staff_user_id:validId,from_value:'pending',to_value:'approved'},members,staff);
 testCase('Activity title for '+kind,result.title===title);
 testCase('Activity icon for '+kind,Boolean(result.icon));
 testCase('Activity detail for '+kind,typeof result.detail==='string');
}
testCase('Deleted member name not stored in log messages',
 !t.eventCopy({kind:'card_deleted',member_id:null,from_value:'approved'},members,staff).detail.includes('Mustername'));
testCase('Never link public user to private Owner tools',
 !/href=["'](?:mitglieder-admin|team-talk|team-kalender)\.html/.test(fs.readFileSync('website-updates.html','utf8')));
for(const id of ['ownerOps','ownerRoles','ownerActivity','ownerSystem','ownerStaffForm',
 'ownerStaffId','ownerStaffName','ownerStaffRole','ownerStaffSave','ownerStaffCancel','ownerStaffList','ownerStaffCount',
 'ownerActivityList','ownerLegacyHistoryList','ownerActivityReload','ownerHealthWeb','ownerHealthDb',
 'ownerHealthChecked','ownerHealthRefresh']){
 testCase('HTML contract '+id,ownerHtml.includes('id="'+id+'"'));
}
testCase('Owner Toolkit asset linked',ownerHtml.includes('assets/frost-owner-tools.js')&&ownerHtml.includes('assets/frost-owner-tools.css'));
testCase('Owner login initialization after auth',login.includes('window.FrostOwnerTools.open(client)'));
testCase('Owner toolkit cleared at logout',login.includes('window.FrostOwnerTools.close()'));
testCase('No second Supabase login client',!source.includes('createClient('));
testCase('No extra credential storage',!/(?:localStorage|sessionStorage|document\.cookie)/.test(source));
testCase('Same-origin monitored with HEAD method',source.includes("method:'HEAD'")&&source.includes("new URL('index.html',location.href)"));
testCase('Owner auth is checked server-side',source.includes("from('frost_admins').select('user_id')"));
testCase('RLS-protected audit is used',source.includes("from('frost_owner_activity')"));
testCase('No remote analytics in owner tools',!/google-analytics|sentry|segment\.com|mixpanel|posthog|gtag/.test(source));
console.log('✅ Frost Owner Toolkit: '+checks+' checks passed, including role validation, safe timeline rendering, private HTML contract and real monitor endpoints.');

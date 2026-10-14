#!/usr/bin/env node
/**
 * Dependency-free functional tests for the public Frost FAQ answer selector.
 * No browser, network, Supabase, personal data or secrets are involved.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('assets/frost-faq.js','utf8');
const guard="  if (!document.body || document.getElementById('fsfaq-root')) return;";
const hook="  const el=(tag,cls,text)=>{";
assert.ok(source.includes(guard),'FAQ DOM initialization guard must exist');
assert.ok(source.includes(hook),'FAQ answer selector should remain separate from the DOM');
const tested=source
  .replace(guard,'')
  .replace(hook,'  globalThis.__faqTests = {FAQ, QUICK, answerFor, normalize}; return;\n'+hook);
const sandbox={document:{body:{},getElementById:()=>null}};
vm.runInNewContext(tested,sandbox,{timeout:2000,filename:'frost-faq.js'});
const {FAQ,QUICK,answerFor,normalize}=sandbox.__faqTests||{};
assert.equal(typeof answerFor,'function');
assert.equal(normalize('Schlittschuhe ÄÖÜ ß'),'schlittschuhe aou ss');
let total=0;
const questions=[
 ['Wie kann ich bei Frost Skaters mitmachen?','join'],
 ['Wie melde ich mich an?','join'],
 ['Wie beantrage ich eine Mitgliedskarte?','getCard'],
 ['Wo finde ich meine Karte?','findCard'],
 ['Wo finde ich meinen Karten-Code?','findCard'],
 ['Wann bekomme ich meine Mitgliedskarte?','waiting'],
 ['Wie lange dauert das Kennenlernen?','firstMeet'],
 ['Wann ist der nächste Ausflug?','event'],
 ['Wann fahren wir nach Heilbronn?','event'],
 ['Um wie viel Uhr ist die Abfahrt?','eventTime'],
 ['Wie viel kostet der Eintritt?','eventPrice'],
 ['Was kostet die Mitgliedschaft?','memberPrice'],
 ['Brauche ich Schlittschuhe?','equipment'],
 ['Wann ist das Training?','training'],
 ['Wer ist die Leitung von Frost Skaters?','team'],
 ['Brauche ich die Erlaubnis meiner Eltern?','parents'],
 ['Was passiert mit meinen Daten?','privacy'],
 ['Wo kann ich die Leitung über WhatsApp erreichen?','contact'],
 ['Gibt es Neuigkeiten?','news'],
 ['Hallo!','welcome'],
 ['Was kostet die Ausleihe?','eventPrice'],
 ['Unbekanntes Zufallsthema 56789','unknown']
];
for(const [question,expected] of questions){
 const got=answerFor(question);
 assert.equal(got,expected,JSON.stringify(question)+' should use '+expected);
 assert.ok(FAQ[got]?.text,'FAQ category must have answer '+got);
 total++;
}
for(const [label,question] of QUICK){
 assert.ok(label&&question,'Quick question must be useful');
 assert.notEqual(answerFor(question),'unknown','Quick question must resolve: '+question);
 total++;
}
for(const [key,entry] of Object.entries(FAQ)){
 assert.ok(typeof entry.text==='string'&&entry.text.length>20, 'FAQ answer missing: '+key);
 assert.ok(Array.isArray(entry.links),'FAQ answer links missing: '+key);
 for(const [label,url] of entry.links){
   assert.ok(label.length>3,'Link should be labeled');
   assert.match(url,/^[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/i,'Only known local public HTML links allowed');
   assert.ok(fs.existsSync(url.split('#')[0]),'FAQ answer target missing: '+url);
   assert.ok(!/(?:hub-admin|mitglieder-admin|team-talk|team-kalender)\.html/.test(url),
     'FAQ should not direct public visitors to private admin tools');
 }
}
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.supabase|createClient\s*\(|openai\.com/i.test(source),
 'The FAQ helper should not send or persist free-text messages or call an external AI provider');
console.log('✅ Frost FAQ: '+total+' recognition checks passed; '+Object.keys(FAQ).length+' answers and their public links validated.');

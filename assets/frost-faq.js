/* Frost Skaters FAQ-Helfer
 * Free, deterministic, browser-local answers for public visitor questions.
 * No API token, login, analytics, form submission, cookies or persistence.
 * All answer destinations are authored, fixed relative public pages.
 */
(()=>{
  'use strict';
  if (!document.body || document.getElementById('fsfaq-root')) return;

  const FAQ = Object.freeze({
    welcome: {
      text: 'Hey! ❄️ Ich bin der Frost FAQ-Helfer. Ich beantworte häufige Fragen zu Frost Skaters – automatisch, nicht als Live-Chat. Was möchtest du wissen?',
      links: []
    },
    join: {
      text: 'Mitmachen geht über unsere Anmeldeseite: Du gibst deinen Vornamen ein und schickst deine Anfrage ab. Danach prüft die Leitung deine Aufnahme. Du kannst stattdessen auch über WhatsApp ein Kennenlernen anfragen.',
      links: [['Zur Anmeldung', 'anmelden.html'], ['Per WhatsApp anfragen', 'anmelden.html#whatsapp']]
    },
    getCard: {
      text: 'Du kannst deine Frost Skaters Community-Karte mit deinem Vornamen beantragen. Die Leitung prüft den Antrag persönlich. Erst nach Freigabe ist die Karte aktiv. Sie ist kein amtlicher Ausweis.',
      links: [['Mitgliedskarte beantragen', 'mitglieder.html#applySection']]
    },
    findCard: {
      text: 'Öffne „Meine Karte ansehen“ und gib deinen privaten Karten-Code ein oder nutze deinen persönlichen Link. Damit kannst du den Kartenstatus prüfen. Gib den Code oder Link nicht öffentlich weiter.',
      links: [['Meine Karte ansehen', 'mitglieder.html#findSection']]
    },
    waiting: {
      text: 'Neue Mitgliedsanträge werden von der Leitung geprüft. Das ist keine automatische Sofort-Freigabe. Den aktuellen Stand deiner Karte findest du über deinen privaten Karten-Link oder Code.',
      links: [['Kartenstatus prüfen', 'mitglieder.html#findSection']]
    },
    firstMeet: {
      text: 'Das kurze Kennenlernen dauert laut unserer Anmeldeseite höchstens 10 Minuten. Du kannst dabei Fragen stellen und die Gruppe kennenlernen.',
      links: [['Kennenlernen anfragen', 'anmelden.html#whatsapp']]
    },
    event: {
      text: 'Auf unserer Eventseite steht aktuell der Ausflug nach Heilbronn am 3. Januar 2027. Uhrzeit und Treffpunkt sind dort noch nicht bestätigt. Bitte prüfe vor der Fahrt die neuesten Infos bei der Leitung.',
      links: [['Event ansehen', 'events.html'], ['Nachfragen', 'anmelden.html#whatsapp']]
    },
    eventTime: {
      text: 'Für den Heilbronn-Ausflug sind Uhrzeit und Treffpunkt auf der Eventseite noch offen. Verlass dich deshalb bitte nicht auf ältere Nachrichten – die Leitung kann dir die bestätigten Daten sagen.',
      links: [['Aktuelle Eventseite', 'events.html'], ['Team fragen', 'anmelden.html#whatsapp']]
    },
    eventPrice: {
      text: 'Auf unserer Eventseite ist noch kein verbindlicher Preis veröffentlicht. Kosten für Eintritt, Leihschlittschuhe und Fahrt sollten vor dem Ausflug mit der Leitung geklärt werden.',
      links: [['Eventseite', 'events.html'], ['Kosten nachfragen', 'anmelden.html#whatsapp']]
    },
    equipment: {
      text: 'Für gemeinsame Eishallen-Ausflüge brauchst du geeignete Schlittschuhe – eigene oder, falls vor Ort verfügbar, geliehene. Frag für ein bestimmtes Event nach den genauen Regeln und was du mitnehmen sollst.',
      links: [['Zum Event', 'events.html'], ['Infos anfragen', 'anmelden.html#whatsapp']]
    },
    training: {
      text: 'Die Trainingsseite wird gerade vorbereitet. Dort gibt es noch keinen bestätigten Trainingsplan. Sobald die Leitung Infos veröffentlicht, findest du sie auf der Website.',
      links: [['Trainingsseite ansehen', 'training.html']]
    },
    team: {
      text: 'Frost Skaters ist eine Eislauf-Community mit Zusammenhalt und gemeinsamen Aktivitäten. Infos zur Leitung stehen auf unserer Teamseite. Interne Team-Werkzeuge sind nur für freigegebene Teamkonten zugänglich.',
      links: [['Über die Leitung', 'leitung.html'], ['Über Frost Skaters', 'index.html#entdecken']]
    },
    pictures: {
      text: 'Fotos mit erkennbaren Personen sollen nur mit den nötigen Einwilligungen veröffentlicht werden. Wenn du Fragen zu einem Foto oder deinem Datenschutz hast, melde dich bitte bei der Leitung.',
      links: [['Datenschutz lesen', 'datenschutz.html']]
    },
    parents: {
      text: 'Wenn du minderjährig bist, klär Ausflüge, Fahrt und nötige Einwilligungen vorher mit deinen Eltern bzw. Sorgeberechtigten. Die Leitung kann erklären, was für den jeweiligen Termin organisiert wird.',
      links: [['Event-Infos', 'events.html'], ['Kontakt aufnehmen', 'anmelden.html#whatsapp']]
    },
    privacy: {
      text: 'Der FAQ-Helfer verarbeitet Fragen nur hier im Browser, ohne sie zu speichern oder an einen Chat-Server zu senden. Gib trotzdem bitte keine Passwörter, Adressen oder privaten Karten-Codes ein. Infos zu unseren anderen Website-Diensten stehen im Datenschutz.',
      links: [['Datenschutzhinweise', 'datenschutz.html']]
    },
    contact: {
      text: 'Du kannst der Frost Skaters Leitung über die Anmeldeseite eine WhatsApp-Nachricht schicken. Der Nachrichtentext lässt sich dort vorher bearbeiten. WhatsApp öffnet sich erst, wenn du selbst darauf klickst.',
      links: [['Kontakt über WhatsApp', 'anmelden.html#whatsapp'], ['Zur Anmeldung', 'anmelden.html']]
    },
    news: {
      text: 'Aktuelle Ankündigungen und Community-Beiträge findest du unter „Aktuelles“. Verbindliche Details zu Ausflügen sollten immer noch einmal mit der Leitung bestätigt werden.',
      links: [['Aktuelles ansehen', 'community.html'], ['Events ansehen', 'events.html']]
    },
    unknown: {
      text: 'Dazu habe ich gerade keine sichere Antwort. Ich bin ein einfacher FAQ-Helfer und kann keine persönlichen Anträge, Live-Daten oder Nachrichten einsehen. Schau auf den Infoseiten nach oder frag direkt die Leitung.',
      links: [['Alle wichtigen Infos', 'index.html#fragen'], ['Leitung kontaktieren', 'anmelden.html#whatsapp']]
    }
  });

  const QUICK = [
    ['🙋 Mitmachen', 'Wie kann ich mitmachen?'],
    ['🪪 Mitgliedskarte', 'Wie bekomme ich eine Mitgliedskarte?'],
    ['⛸️ Nächstes Event', 'Wann ist der nächste Ausflug?'],
    ['❄️ Training', 'Wann ist Training?'],
    ['💬 Kontakt', 'Wie erreiche ich die Leitung?']
  ];
  const normalize = input => String(input || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  // This intentionally matches only common questions. Unknown questions are NOT guessed.
  function answerFor(question) {
    const q = normalize(question);
    if (!q) return 'welcome';
    if (/\b(hallo|hi|hey|moin|servus|guten tag)\b/.test(q) && q.split(' ').length < 5) return 'welcome';
    if (/(datenschutz|daten|gespeichert|passwort|privat|sicherheit|personlich)/.test(q)) return 'privacy';
    if (/(foto|bilder|bildrecht|galerie|aufnahme)/.test(q)) return 'pictures';
    if (/(eltern|minderjahr|erlaubnis|einwilligung|alter|jugendlich)/.test(q)) return 'parents';
    if (/(kosten|preis|eintritt|bezahlen|geld|ticketpreis|fahrkarte|leihgebuhr)/.test(q)) return 'eventPrice';
    if (/(schlittschuh|ausrustung|mitnehmen|ausleihen|leihen|packliste)/.test(q)) return 'equipment';
    if (/(treffpunkt|uhrzeit|abfahrt|bahnhof|zugfahrt|ankunft)/.test(q)) return 'eventTime';
    if (/(trainier|training|trainingsplan|ubung)/.test(q)) return 'training';
    if (/(k(e|a)nn?enlernen|gesprach|10 minuten|termin machen)/.test(q)) return 'firstMeet';
    if (/(kartenstatus|karten code|kartenlink|karten link|karte finden|karte ansehen|karte prufen|status meiner|status der karte|mein qr code)/.test(q)) return 'findCard';
    if (/(freischalt|genehmig|antrag dauert|antrag gepruft|wann bekomme ich die karte|warte auf)/.test(q)) return 'waiting';
    if (/(mitgliedskarte|mitgliedsnummer|community karte|member card|karte beantragen|karte bekommen|mitglieds ausweis|mitgliedsausweis)/.test(q)) return 'getCard';
    if (/(ausflug|event|heilbronn|eishalle|n[aä]chst(e|er|es) treff|wo geht es hin|wann fahren)/.test(q)) return 'event';
    if (/(kontakt|whatsapp|anschreiben|schreiben|nachricht|erreich|telefon|nummer)/.test(q)) return 'contact';
    if (/(beitrage|news|neuigkeit|ankuendig|aktuelles|community post)/.test(q)) return 'news';
    if (/(anmeld|beitret|mitglied werden|mitmachen|aufnehm|registrier|dabei sein|teilnehmen|join)/.test(q)) return 'join';
    if (/(chef|owner|co owner|manager|supporter|leitung|team lounge|wer seid ihr|wer ist|was ist frost|frost skaters)/.test(q)) return 'team';
    return 'unknown';
  }

  const el=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if (cls) node.className=cls;
    if (text!==undefined) node.textContent=String(text);
    return node;
  };
  const root=el('div','fsfaq-root');
  root.id='fsfaq-root';
  const launch=el('button','fsfaq-launch');
  launch.type='button';
  launch.id='fsfaq-launch';
  launch.setAttribute('aria-haspopup','dialog');
  launch.setAttribute('aria-controls','fsfaq-panel');
  launch.setAttribute('aria-expanded','false');
  launch.append(el('span','fsfaq-launch-icon','❄️'),el('span','fsfaq-launch-text','Fragen?'));
  const panel=el('section','fsfaq-panel');
  panel.id='fsfaq-panel';
  panel.hidden=true;
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','false');
  panel.setAttribute('aria-labelledby','fsfaq-title');
  panel.setAttribute('aria-describedby','fsfaq-subtitle');
  const head=el('div','fsfaq-head');
  const branding=el('div','fsfaq-brand');
  const emblem=el('img','fsfaq-emblem');
  emblem.src='assets/frost-skaters-logo.jpg';
  emblem.alt='';
  emblem.width=48;
  emblem.height=48;
  const titles=el('div','fsfaq-head-titles');
  const title=el('h2','fsfaq-title','Frost FAQ');
  title.id='fsfaq-title';
  const subtitle=el('p','fsfaq-subtitle','❄️ Automatischer Fragenhelfer');
  subtitle.id='fsfaq-subtitle';
  titles.append(title,subtitle);
  branding.append(emblem,titles);
  const close=el('button','fsfaq-close','✕');
  close.type='button';
  close.setAttribute('aria-label','FAQ schließen');
  head.append(branding,close);
  const messages=el('div','fsfaq-messages');
  messages.setAttribute('role','log');
  messages.setAttribute('aria-label','Fragen und Antworten');
  messages.setAttribute('aria-live','polite');
  messages.setAttribute('aria-relevant','additions');
  const quickTitle=el('p','fsfaq-quick-title','Häufige Fragen:');
  const quick=el('div','fsfaq-quick');
  for(const [label,question] of QUICK){
    const b=el('button','fsfaq-chip',label);
    b.type='button';
    b.addEventListener('click',()=>sendQuestion(question));
    quick.append(b);
  }
  const form=el('form','fsfaq-form');
  const input=el('input','fsfaq-input');
  input.id='fsfaq-input';
  input.type='text';
  input.maxLength=180;
  input.autocomplete='off';
  input.spellcheck=false;
  input.setAttribute('aria-label','Frage an Frost FAQ');
  input.placeholder='Stell deine Frage …';
  input.required=true;
  const submit=el('button','fsfaq-submit','➤');
  submit.type='submit';
  submit.setAttribute('aria-label','Frage stellen');
  form.append(input,submit);
  const foot=el('p','fsfaq-foot','Keine Live-KI · Keine Speicherung · Bitte keine privaten Daten eingeben.');
  panel.append(head,messages,quickTitle,quick,form,foot);
  root.append(launch,panel);
  document.body.append(root);

  function addMessage(kind, text, links) {
    const outer=el('div','fsfaq-message fsfaq-message--'+kind);
    const bubble=el('div','fsfaq-bubble',text);
    outer.append(bubble);
    if (Array.isArray(links) && links.length) {
      const actions=el('div','fsfaq-links');
      for(const [label,href] of links){
        const a=el('a','fsfaq-link',label+' →');
        a.href=href;
        actions.append(a);
      }
      outer.append(actions);
    }
    messages.append(outer);
    // Restrict the in-memory transcript to a small window.
    while(messages.children.length>16)messages.firstElementChild.remove();
    messages.scrollTop=messages.scrollHeight;
  }
  function bot(key) {
    const answer=FAQ[key]||FAQ.unknown;
    addMessage('bot',answer.text,answer.links);
  }
  function sendQuestion(text) {
    const question=String(text||'').trim().slice(0,180);
    if (!question) return;
    addMessage('user',question);
    bot(answerFor(question));
    input.value='';
  }
  let greeted=false;
  function setOpen(open){
    panel.hidden=!open;
    launch.setAttribute('aria-expanded',String(open));
    root.classList.toggle('fsfaq-is-open',open);
    if(open){
      if(!greeted){bot('welcome');greeted=true;}
      input.focus({preventScroll:true});
    }else{
      launch.focus({preventScroll:true});
    }
  }
  launch.addEventListener('click',()=>setOpen(panel.hidden));
  close.addEventListener('click',()=>setOpen(false));
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if (!input.value.trim()) return;
    sendQuestion(input.value);
    input.focus({preventScroll:true});
  });
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden){
      event.preventDefault();
      setOpen(false);
    }
  });
  // FAQ only reads page data already displayed to this visitor; no Supabase calls.
})();
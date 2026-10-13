(() => {
  'use strict';
  const form = document.getElementById('accessForm');
  const password = document.getElementById('leadershipPassword');
  const reveal = document.getElementById('passwordToggle');
  const submit = document.getElementById('unlockPlan');
  const status = document.getElementById('accessStatus');
  const access = document.getElementById('accessPanel');
  const protectedPanel = document.getElementById('protectedPanel');
  const content = document.getElementById('organisationContent');
  const lockButton = document.getElementById('lockPlan');
  const encoder = new TextEncoder();
  const context = encoder.encode('frost-skaters-organisation:v1');
  let attempt = 0;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const bytes = (value, size) => {
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Invalid encrypted data');
    const result = Uint8Array.from(atob(value), char => char.charCodeAt(0));
    if (size && result.length !== size) throw new Error('Invalid encrypted data');
    return result;
  };
  const lock = (focus = false) => {
    attempt++;
    protectedPanel.hidden = true;
    content.replaceChildren();
    access.hidden = false;
    password.value = '';
    password.type = 'password';
    reveal.setAttribute('aria-pressed', 'false');
    reveal.setAttribute('aria-label', 'Passwort anzeigen');
    submit.disabled = !globalThis.crypto?.subtle;
    form.removeAttribute('aria-busy');
    status.textContent = '';
    if (focus) password.focus();
  };

  const render = plan => {
    if (typeof plan?.title !== 'string' || plan.title.length > 150 ||
        typeof plan.intro !== 'string' || plan.intro.length > 2000 ||
        !Array.isArray(plan.sections) || plan.sections.length !== 6 ||
        !plan.sections.every(section => ['tag', 'title', 'description', 'nextStep'].every(key =>
          typeof section[key] === 'string' && section[key].length > 0 && section[key].length <= 2000))) {
      throw new Error('Invalid private plan');
    }
    const fragment = document.createDocumentFragment();
    const heading = element('div', 'organisation-title');
    const crown = document.getElementById('crownTemplate').content.cloneNode(true);
    heading.append(crown, element('h1', '', plan.title));
    fragment.append(heading, element('p', 'intro-copy organisation-intro', plan.intro));
    const grid = element('div', 'organisation-grid');
    for (const section of plan.sections) {
      const card = element('article', 'organisation-card');
      const next = element('div', 'organisation-next');
      next.append(element('strong', '', 'Nächster Schritt · Vorschlag'), element('p', '', section.nextStep));
      card.append(element('p', 'section-eyebrow', section.tag), element('h2', '', section.title), element('p', '', section.description), next);
      grid.append(card);
    }
    fragment.append(grid);
    content.replaceChildren(fragment);
  };

  reveal.addEventListener('click', () => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    reveal.setAttribute('aria-pressed', String(visible));
    reveal.setAttribute('aria-label', visible ? 'Passwort verbergen' : 'Passwort anzeigen');
  });
  lockButton.addEventListener('click', () => lock(true));
  window.addEventListener('pagehide', () => lock());
  window.addEventListener('pageshow', event => { if (event.persisted) lock(); });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !password.value) return;
    const currentAttempt = ++attempt;
    const secret = encoder.encode(password.value);
    password.value = '';
    password.type = 'password';
    reveal.setAttribute('aria-pressed', 'false');
    reveal.setAttribute('aria-label', 'Passwort anzeigen');
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Zugang wird geprüft …';
    let plaintext;
    try {
      const response = await fetch('assets/organisation.enc.json?v=2', { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('Load failed');
      const envelope = await response.json();
      if (envelope.version !== 1 || envelope.iterations !== 600000) throw new Error('Invalid encrypted data');
      const salt = bytes(envelope.salt, 16);
      const iv = bytes(envelope.iv, 12);
      const ciphertext = bytes(envelope.ciphertext);
      if (ciphertext.length < 17 || ciphertext.length > 200000) throw new Error('Invalid encrypted data');
      const material = await crypto.subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveKey']);
      secret.fill(0);
      const key = await crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations:600000, hash:'SHA-256' }, material, { name:'AES-GCM', length:256 }, false, ['decrypt']);
      plaintext = new Uint8Array(await crypto.subtle.decrypt({ name:'AES-GCM', iv, additionalData:context, tagLength:128 }, key, ciphertext));
      if (currentAttempt !== attempt) return;
      render(JSON.parse(new TextDecoder('utf-8', { fatal:true }).decode(plaintext)));
      status.textContent = '';
      access.hidden = true;
      protectedPanel.hidden = false;
      content.querySelector('h1').setAttribute('tabindex', '-1');
      content.querySelector('h1').focus();
    } catch {
      if (currentAttempt !== attempt) return;
      content.replaceChildren();
      protectedPanel.hidden = true;
      access.hidden = false;
      status.textContent = 'Der Plan konnte nicht geöffnet werden. Prüfe dein Passwort und deine Verbindung und versuche es erneut.';
      password.focus();
    } finally {
      secret.fill(0);
      plaintext?.fill(0);
      if (currentAttempt === attempt) {
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    }
  });

  if (!globalThis.crypto?.subtle) {
    status.textContent = 'Für den geschützten Zugang öffne diese Seite bitte über HTTPS in einem aktuellen Browser.';
  } else {
    password.disabled = false;
    reveal.disabled = false;
    submit.disabled = false;
  }
})();

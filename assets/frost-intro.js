/* Frost Skaters intro: intentionally works without media downloads or credentials.
   Visual intro runs once per tab session. Sound requires an explicit user gesture,
   since mobile browsers (especially iOS Safari) block automatic audio playback. */
(() => {
  'use strict';
  const intro = document.getElementById('frostWelcomeIntro');
  const skip = document.getElementById('frostIntroSkip');
  const sound = document.getElementById('frostIntroSound');
  if (!intro || !skip || !sound) return;

  const params = new URLSearchParams(location.search);
  const force = params.get('intro') === '1';
  const disabled = params.get('intro') === '0';
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visited = false;
  try { visited = sessionStorage.getItem('frost-welcome-seen-v1') === 'yes'; }
  catch { visited = false; }
  // Deep links must go immediately to their target, and reduced-motion users
  // shouldn't have to dismiss a nonessential splash screen.
  if (disabled || (!force && (visited || !!location.hash || reducedMotion))) return;
  try { sessionStorage.setItem('frost-welcome-seen-v1', 'yes'); } catch {}

  const header = document.querySelector('body > header');
  const main = document.querySelector('body > main');
  if (header) header.inert = true;
  if (main) main.inert = true;
  intro.hidden = false;
  const originalFocus = document.activeElement;
  let done = false;
  const initialEnd = Date.now() + 3900;
  let exitTimer = setTimeout(close, 3900);

  function close() {
    if (done) return;
    done = true;
    clearTimeout(exitTimer);
    intro.classList.add('is-leaving');
    if (header) header.inert = false;
    if (main) main.inert = false;
    setTimeout(() => {
      intro.hidden = true;
      intro.classList.remove('is-leaving');
      if (document.activeElement === skip || document.activeElement === sound) {
        const target = originalFocus && originalFocus !== document.body ? originalFocus : document.querySelector('.site-brand');
        if (target && typeof target.focus === 'function') target.focus({preventScroll: true});
      }
    }, 470);
  }

  skip.addEventListener('click', close);
  intro.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    // Keep tab navigation inside the short-lived dialog.
    if (event.key === 'Tab') {
      const first = sound, last = skip;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  let soundPlayed = false;
  sound.addEventListener('click', async () => {
    if (done || soundPlayed) return;
    soundPlayed = true;
    sound.disabled = true;
    sound.textContent = '❄️ Eis klingt!';
    clearTimeout(exitTimer);
    exitTimer = setTimeout(close, Math.max(1500, initialEnd - Date.now()));
    try { await playIceChime(); }
    catch (err) {
      console.debug('Intro audio unavailable:', err);
      sound.textContent = '🔇 Ton nicht verfügbar';
    }
  });

  async function playIceChime() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio unavailable');
    // Create audio context only in the user-initiated click handler.
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') await ctx.resume();
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.value = 0.13;
    master.connect(ctx.destination);

    // Low-volume filtered ice-crack and cold wind swoosh.
    const seconds = 1.12;
    const frameCount = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      const f = i / frameCount;
      const crack = f < 0.075 ? 1.1 : Math.exp(-10 * f);
      const swoosh = Math.sin(Math.PI * f) ** 2;
      samples[i] = (Math.random() * 2 - 1) * Math.min(1, crack + 0.55 * swoosh);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const iceFilter = ctx.createBiquadFilter();
    iceFilter.type = 'highpass';
    iceFilter.frequency.setValueAtTime(1500, now);
    iceFilter.frequency.exponentialRampToValueAtTime(370, now + 0.58);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.39, now + 0.035);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.03);
    source.connect(iceFilter);
    iceFilter.connect(noiseGain);
    noiseGain.connect(master);
    source.start(now);
    source.stop(now + seconds);

    // Icy crystalline shimmer: short pitches with soft fading echoes.
    const tones = [
      {start: 0.03, hz: 1320, duration: 0.44, level: 0.25},
      {start: 0.20, hz: 1760, duration: 0.53, level: 0.22},
      {start: 0.37, hz: 2260, duration: 0.63, level: 0.14},
      {start: 0.53, hz: 2700, duration: 0.35, level: 0.1}
    ];
    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.hz, now + tone.start);
      osc.frequency.exponentialRampToValueAtTime(tone.hz * 0.87, now + tone.start + tone.duration);
      vol.gain.setValueAtTime(0.0001, now + tone.start);
      vol.gain.exponentialRampToValueAtTime(tone.level, now + tone.start + 0.018);
      vol.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.duration);
      osc.connect(vol);
      vol.connect(master);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.duration + 0.02);
    }
    // Clean up quietly after the effect finishes.
    setTimeout(() => { ctx.close().catch(() => {}); }, 1900);
  }
})();

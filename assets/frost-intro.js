/* Frost Skaters welcome animation, with a short, original Web Audio ice stinger.
   No audio plays until someone deliberately taps "Mit Sound starten".
   Main site links and deep links remain available and visitors can skip the intro. */
(() => {
  'use strict';
  const intro = document.getElementById('frostWelcomeIntro');
  const start = document.getElementById('frostIntroSound');
  const skip = document.getElementById('frostIntroSkip');
  const replay = document.getElementById('frostReplayIntro');
  if (!intro || !start || !skip) return;

  const key = 'frost-welcome-seen-v2';
  const params = new URLSearchParams(location.search);
  const force = params.get('intro') === '1';
  const disabled = params.get('intro') === '0';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const header = document.querySelector('body > header');
  const main = document.querySelector('body > main');
  let isShowing = false;
  let isPlaying = false;
  let exitTimer = null;
  let fadeTimer = null;
  let originalFocus = null;
  let previousOverflow = '';
  let activeAudio = null;

  function remember() {
    try { sessionStorage.setItem(key, 'yes'); } catch {}
  }

  function show() {
    if (isShowing) return;
    if (fadeTimer !== null) { clearTimeout(fadeTimer); fadeTimer = null; }
    isShowing = true;
    isPlaying = false;
    originalFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    intro.classList.remove('is-leaving', 'is-playing');
    intro.hidden = false;
    if (header) header.inert = true;
    if (main) main.inert = true;
    document.body.style.overflow = 'hidden';
    start.disabled = false;
    start.textContent = '▶ Intro mit Sound starten';
    start.focus({preventScroll: true});
  }

  function stopAudio() {
    if (!activeAudio) return;
    const {ctx, master} = activeAudio;
    activeAudio = null;
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.025);
      setTimeout(() => { ctx.close().catch(() => {}); }, 180);
    } catch {
      ctx.close().catch(() => {});
    }
  }

  function close() {
    if (!isShowing) return;
    remember();
    isShowing = false;
    isPlaying = false;
    if (exitTimer !== null) { clearTimeout(exitTimer); exitTimer = null; }
    stopAudio();
    intro.classList.add('is-leaving');
    if (header) header.inert = false;
    if (main) main.inert = false;
    document.body.style.overflow = previousOverflow;
    fadeTimer = setTimeout(() => {
      intro.hidden = true;
      intro.classList.remove('is-leaving', 'is-playing');
      fadeTimer = null;
      const target = originalFocus && originalFocus !== document.body
        ? originalFocus : document.querySelector('.site-brand');
      if (target?.focus) target.focus({preventScroll: true});
    }, reducedMotion ? 0 : 440);
  }

  skip.addEventListener('click', close);
  replay?.addEventListener('click', show);
  intro.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    // Accessible focus loop inside the short introductory dialog.
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault(); skip.focus();
      } else if (!event.shiftKey && document.activeElement === skip) {
        event.preventDefault(); start.focus();
      }
    }
  });

  start.addEventListener('click', () => {
    if (!isShowing || isPlaying) return;
    isPlaying = true;
    remember();
    intro.classList.add('is-playing');
    start.disabled = true;
    start.textContent = '🔊 Frost Skaters Intro läuft …';
    // A browser permits sound after this intentional gesture, not during page load.
    try { playIceIntro().catch(() => { start.textContent = '🔇 Ton nicht verfügbar'; }); }
    catch { start.textContent = '🔇 Ton nicht verfügbar'; }
    exitTimer = setTimeout(close, reducedMotion ? 2700 : 3550);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isShowing && isPlaying) close();
  });

  async function playIceIntro() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio not supported');
    const ctx = new Ctor();
    activeAudio = {ctx, master: null};
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      if (!isShowing) { await ctx.close(); return; }
      const t = ctx.currentTime + 0.015;
      const master = ctx.createGain();
      master.gain.value = 0.13; // Comfortable volume, not a loud autoplay surprise.
      master.connect(ctx.destination);
      activeAudio = {ctx, master};

      // A frosty wind swoosh with a brief ice-crack attack.
      const duration = 1.35;
      const size = Math.floor(ctx.sampleRate * duration);
      const noise = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < size; i++) {
        const progress = i / size;
        const attack = Math.exp(-37 * progress);
        const wind = Math.sin(Math.PI * progress) ** 2;
        data[i] = (Math.random() * 2 - 1) * Math.min(1, attack + 0.44 * wind);
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const windGain = ctx.createGain();
      source.buffer = noise;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1450, t);
      filter.frequency.exponentialRampToValueAtTime(350, t + 0.9);
      windGain.gain.setValueAtTime(0.001, t);
      windGain.gain.linearRampToValueAtTime(0.36, t + 0.035);
      windGain.gain.exponentialRampToValueAtTime(0.001, t + 1.28);
      source.connect(filter);
      filter.connect(windGain);
      windGain.connect(master);
      source.start(t);
      source.stop(t + duration);

      function tone(hz, begin, length, level, wave='sine', drop=0.94) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(hz, t + begin);
        oscillator.frequency.exponentialRampToValueAtTime(hz * drop, t + begin + length);
        gain.gain.setValueAtTime(0.0001, t + begin);
        gain.gain.exponentialRampToValueAtTime(level, t + begin + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + begin + length);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(t + begin);
        oscillator.stop(t + begin + length + 0.025);
      }

      // Original, short electronic logo signature: soft bass + icy bell sequence.
      tone(108, 0.075, 0.49, 0.52, 'sine', 0.48);
      tone(89, 0.58, 0.39, 0.33, 'sine', 0.55);
      [
        [880, 0.08, 0.61, 0.23],
        [1175, 0.32, 0.65, 0.20],
        [1568, 0.65, 0.83, 0.17],
        [2093, 1.03, 0.96, 0.12],
        [1760, 1.51, 0.67, 0.10]
      ].forEach(([hz, begin, length, level]) => tone(hz, begin, length, level));
      tone(293.66, 1.23, 1.18, 0.065, 'triangle', 1.015);
      tone(440, 1.23, 1.25, 0.045, 'sine', 1.01);

      setTimeout(() => {
        if (activeAudio?.ctx === ctx) activeAudio = null;
        ctx.close().catch(() => {});
      }, 3150);
    } catch (error) {
      if (activeAudio?.ctx === ctx) activeAudio = null;
      ctx.close().catch(() => {});
      throw error;
    }
  }

  let visited = false;
  try { visited = sessionStorage.getItem(key) === 'yes'; } catch {}
  // Do not interrupt deep-linked pages, accessibility preferences or returning visitors.
  if (!disabled && (force || (!visited && !location.hash && !reducedMotion))) show();
})();
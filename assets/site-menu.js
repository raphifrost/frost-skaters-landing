(() => {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('siteMenu');
  if (!toggle || !menu) return;
  const nav = toggle.closest('.site-nav');
  const setOpen = open => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  };
  toggle.addEventListener('click', () => setOpen(menu.hidden));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('click', event => { if (!nav.contains(event.target)) setOpen(false); });
  document.addEventListener('focusin', event => { if (!nav.contains(event.target) && !menu.hidden) setOpen(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { setOpen(false); toggle.focus(); }
  });
})();

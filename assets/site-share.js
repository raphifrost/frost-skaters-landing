(() => {
  const button = document.getElementById('shareSite');
  const status = document.getElementById('shareStatus');
  const fallback = document.getElementById('shareFallback');
  const input = document.getElementById('shareLink');
  if (!button || !status || !fallback || !input) return;
  const url = document.querySelector('link[rel="canonical"]')?.href || 'https://raphifrost.github.io/frost-skaters-landing/';
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    fallback.hidden = true;
    status.textContent = '';
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({title:'Frost Skaters',text:'Komm zu Frost Skaters – zusammen skaten und kennenlernen.',url});
          status.textContent = 'Du hast das Teilen-Menü verwendet.';
          return;
        } catch (error) {
          if (error?.name === 'AbortError') {status.textContent = 'Teilen abgebrochen.';return;}
        }
      }
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        status.textContent = 'Link kopiert! Du kannst ihn jetzt weitergeben oder im Browser öffnen.';
      } catch {
        input.value = url;
        fallback.hidden = false;
        input.focus();
        input.select();
        status.textContent = 'Kopiere den markierten Link über das Menü deines Geräts.';
      }
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
})();

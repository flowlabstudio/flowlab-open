/* Pantalla de carga al abrir la app: breve y en el idioma elegido. */
(function () {
  var loader = document.getElementById('appLoader');
  if (!loader) return;
  var en = false;
  try { en = localStorage.getItem('flowlab_lang') === 'en'; } catch (e) { }
  var msgEl = document.getElementById('loaderMsg'), sub = loader.querySelector('.ld-sub');
  if (en) {
    loader.setAttribute('aria-label', 'Loading FlowLab Studio');
    msgEl.textContent = 'Loading the audio engine…';
    if (sub) sub.textContent = 'Use headphones to avoid echo in your recording';
  }
  var MIN_MS = 900, start = Date.now(), done = false;
  function hide() {
    if (done) return;
    done = true;
    msgEl.textContent = en ? 'Ready' : 'Listo';
    setTimeout(function () { loader.classList.add('is-done'); loader.setAttribute('aria-hidden', 'true'); }, Math.max(0, MIN_MS - (Date.now() - start)));
  }
  if (document.readyState === 'complete') hide(); else window.addEventListener('load', hide);
  setTimeout(hide, 4000);
})();

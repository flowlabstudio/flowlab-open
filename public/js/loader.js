(function () {
  var loader = document.getElementById('appLoader');
  if (!loader) return;

  var msgEl = document.getElementById('loaderMsg');
  var msgs = ['Cargando motor de audio…', 'Preparando cabina…', 'Conectando beats…', 'Listo'];
  var MIN_MS = 2600;
  var start = Date.now();
  var i = 0;
  var modeTimer = 0;
  var initialHidden = false;

  var cycle = setInterval(function () {
    if (i < msgs.length - 1) {
      i++;
      msgEl.textContent = msgs[i];
    }
  }, 700);

  function hide() {
    if (initialHidden) return;
    initialHidden = true;
    clearInterval(cycle);
    msgEl.textContent = msgs[msgs.length - 1];
    var wait = Math.max(0, MIN_MS - (Date.now() - start));
    setTimeout(function () {
      loader.classList.add('is-done');
      loader.setAttribute('aria-hidden', 'true');
    }, wait);
  }

  window.FlowLabLoader = {
    showMode: function (name, duration) {
      clearTimeout(modeTimer);
      msgEl.textContent = 'Entrando a ' + name + '…';
      loader.classList.add('mode-transition');
      loader.classList.remove('is-done');
      loader.setAttribute('aria-hidden', 'false');
      modeTimer = setTimeout(function () {
        loader.classList.add('is-done');
        loader.setAttribute('aria-hidden', 'true');
      }, duration || 650);
    }
  };

  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide);

  setTimeout(hide, 8000);
})();

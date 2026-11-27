'use strict';
/* =====================================================================
   FlowLab Studio · pwa.js
   1) Registra el service worker (sw.js) solo en https o localhost.
   2) Muestra el botón discreto "Instalar app" cuando el navegador permite
      instalar (Chrome, Edge, Opera GX). Si ya está instalada, no aparece.
   ===================================================================== */
(function () {
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure) {
    // Aviso de versión nueva: el service worker nuevo toma el control solo (skipWaiting + claim), pero la página abierta sigue con los
    // archivos viejos hasta recargar. Si ya había un worker controlando al abrir, un cambio de controlador significa "hay versión nueva".
    let habiaControl = !!navigator.serviceWorker.controller;      // el primer cambio de controlador de una página nueva es la instalación; los siguientes son versiones nuevas
    let avisado = false;
    const barra = () => document.getElementById('updateBar');
    const ocupado = () => {
      try { if (window.Studio && Studio.ocupado && Studio.ocupado()) return 'Estás grabando o escuchando algo: termina y vuelve a pulsar "Actualizar".'; } catch (e) { }
      try { if (window.School && School.running && School.running()) return 'Hay un juego en marcha: termínalo y vuelve a pulsar "Actualizar".'; } catch (e) { }
      try { if (window.Beats && Beats.reproduciendo && Beats.reproduciendo()) return 'Tu beat está sonando: páralo y vuelve a pulsar "Actualizar".'; } catch (e) { }
      return '';
    };
    function avisarVersionNueva() {
      if (avisado) return; avisado = true;
      const b = barra(); if (!b) return;
      b.classList.remove('hidden');
      const msg = b.querySelector('.ub-msg'), go = b.querySelector('[data-update-go]'), no = b.querySelector('[data-update-later]');
      go.addEventListener('click', () => {
        const razon = ocupado();
        if (razon) { msg.textContent = razon; return; }          // nunca se recarga con una grabación o un sonido en curso
        go.disabled = true; location.reload();
      });
      no.addEventListener('click', () => b.classList.add('hidden'));
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (habiaControl) avisarVersionNueva(); else habiaControl = true; });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        window.__swReg = reg;
        // Con la pestaña abierta mucho tiempo, se pregunta por una versión nueva al volver a ella y cada 30 minutos
        const mirar = () => { try { reg.update(); } catch (e) { } };
        document.addEventListener('visibilitychange', () => { if (!document.hidden) mirar(); });
        setInterval(mirar, 30 * 60 * 1000);
      }).catch(err => console.warn('No se pudo activar el modo sin internet:', err && err.message));
    });
  }

  const btn = document.getElementById('installApp');
  if (!btn) return;
  let deferred = null;
  const installed = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();               // guardamos el aviso para mostrarlo con nuestro botón
    if (installed()) return;
    deferred = e;
    btn.classList.remove('hidden');
  });
  btn.addEventListener('click', async () => {
    if (!deferred) return;
    btn.disabled = true;
    try { deferred.prompt(); await deferred.userChoice; } catch (err) { /* el usuario cerró el aviso */ }
    deferred = null; btn.disabled = false; btn.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => { deferred = null; btn.classList.add('hidden'); });
})();

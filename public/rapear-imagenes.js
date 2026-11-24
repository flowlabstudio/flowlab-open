/* FlowLab · Rapear con imágenes: aparece una imagen (hecha con Google Flow), tú la describes rapeando
   sobre el beat. Sin servidor; las imágenes salen sin repetirse hasta agotar el banco. */
(function () {
  'use strict';
  const EN = () => /^en/i.test(document.documentElement.lang || '');
  const N = 12, SEG = 20;
  const TX = {
    es: { btn: '🖼 Rapear con imágenes', title: 'Rapear con imágenes', intro: 'Mira la imagen y rapea lo que ves, lo que sientes o la historia que cuenta. Puedes usar tu beat de la Cabina.', next: 'Otra imagen ▶', time: 'Te quedan ', sec: ' s', alt: 'Imagen para rapear' },
    en: { btn: '🖼 Rap with images', title: 'Rap with images', intro: 'Look at the picture and rap what you see, what you feel, or the story it tells. You can use your beat from the Cabina.', next: 'Next image ▶', time: 'Time left: ', sec: ' s', alt: 'Image to rap about' }
  };
  const T = () => TX[EN() ? 'en' : 'es'];
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  let dlg, img, clock, timer = 0, left = 0, lastFocus;

  function bag() {
    let used = []; try { used = JSON.parse(localStorage.getItem('flowlab_rapimg') || '[]'); } catch (e) { }
    let free = []; for (let i = 1; i <= N; i++) if (used.indexOf(i) < 0) free.push(i);
    if (!free.length) { used = []; for (let i = 1; i <= N; i++) free.push(i); }
    const n = free[Math.floor(Math.random() * free.length)]; used.push(n);
    try { localStorage.setItem('flowlab_rapimg', JSON.stringify(used)); } catch (e) { }
    return n;
  }
  function show() {
    img.src = 'assets/img/rap/rap-' + bag() + '.webp'; img.alt = T().alt;
    clearInterval(timer); left = SEG; const tick = () => { clock.textContent = T().time + left + T().sec; };
    tick(); timer = setInterval(() => { left = Math.max(0, left - 1); tick(); if (!left) clearInterval(timer); }, 1000);
  }
  function close() { clearInterval(timer); dlg.classList.add('hidden'); document.body.classList.remove('glos-abierto'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function open() {
    const t = T();
    if (!dlg) {
      dlg = el('div', 'bia-dlg hidden'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', t.title);
      const card = el('div', 'bia-card ri-card');
      const head = el('div', 'bia-head'); head.append(el('strong', null, t.title)); const x = el('button', 'btn btn-ghost btn-small', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.addEventListener('click', close); head.append(x);
      img = el('img', 'ri-img'); clock = el('p', 'bia-clock');
      const nx = el('button', 'btn btn-neon', t.next); nx.type = 'button'; nx.addEventListener('click', show);
      const row = el('div', 'bia-actions'); row.append(nx);
      card.append(head, el('p', 'bia-intro', t.intro), img, clock, row); dlg.append(card);
      dlg.addEventListener('click', e => { if (e.target === dlg) close(); }); document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.classList.contains('hidden')) close(); });
      document.body.append(dlg);
    }
    lastFocus = document.activeElement; dlg.classList.remove('hidden'); document.body.classList.add('glos-abierto'); show();
  }
  function init() {
    if (!N) return;
    const ref = document.getElementById('btnBatallaIA'); if (!ref) { setTimeout(init, 600); return; }
    if (document.getElementById('btnRapImg')) return;
    const b = el('button', 'btn btn-neon eia-battle', T().btn); b.type = 'button'; b.id = 'btnRapImg'; b.addEventListener('click', open);
    ref.parentNode.insertBefore(b, ref.nextSibling);
    window.addEventListener('flowlab:lang', () => { b.textContent = T().btn; if (dlg) { dlg.remove(); dlg = null; } });
  }
  window.RapearImagenes = { abrir: open };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300)); else setTimeout(init, 300);
})();

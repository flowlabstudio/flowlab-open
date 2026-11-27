/* FlowLab · botón "Tu opinión". Sin servidor y sin recoger datos: la persona escribe su comentario
   y lo envía ella misma por correo (se abre su app de correo) o lo copia para pegarlo en el Discord. */
(function () {
  'use strict';
  const MAIL = '';
  const EN = () => /^en/i.test(document.documentElement.lang || '');
  const TX = {
    es: { btn: 'Tu opinión', title: 'Cuéntanos qué tal', sub: 'Bueno o malo: todo ayuda a mejorar FlowLab. No pedimos tus datos.', good: 'Me gusta', ok: 'Más o menos', bad: 'No me gusta', ph: 'Escribe qué te gustó, qué falló o qué te gustaría que tenga…', mail: 'Enviar por correo', copy: 'Copiar mensaje', copied: 'Copiado ✓', close: 'Cerrar', subj: 'Opinión sobre FlowLab Studio', note: 'Se abre tu app de correo con el mensaje listo; tú decides si lo envías.', noteCopy: 'Copia el mensaje y pégalo donde quieras compartirlo. Desde esta página no se envía nada.' },
    en: { btn: 'Feedback', title: 'Tell us what you think', sub: 'Good or bad: it all helps FlowLab improve. We do not ask for your data.', good: 'I like it', ok: 'So-so', bad: "I don't like it", ph: 'What did you like, what broke, what would you add…', mail: 'Send by email', copy: 'Copy message', copied: 'Copied ✓', close: 'Close', subj: 'Feedback about FlowLab Studio', note: 'Your mail app opens with the message ready; you decide whether to send it.', noteCopy: 'Copy the message and paste it wherever you want to share it. Nothing is sent from this page.' }
  };
  const T = () => TX[EN() ? 'en' : 'es'];
  let dlg, ta, rating = '', last = null;
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const msg = () => (rating ? '[' + rating + '] ' : '') + ta.value.trim();

  function build() {
    const t = T();
    dlg = el('div', 'bia-dlg hidden'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', t.title);
    const card = el('div', 'bia-card');
    const head = el('div', 'bia-head'); head.append(el('strong', null, t.title));
    const x = el('button', 'btn btn-ghost btn-small', '✕'); x.type = 'button'; x.setAttribute('aria-label', t.close); x.addEventListener('click', close); head.append(x);
    const faces = el('div', 'fb-faces');
    [['😍', t.good], ['😐', t.ok], ['😕', t.bad]].forEach(([e, l]) => {
      const b = el('button', 'fb-face', e + ' ' + l); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { rating = l; faces.querySelectorAll('button').forEach(o => o.setAttribute('aria-pressed', String(o === b))); });
      faces.append(b);
    });
    ta = el('textarea', 'fb-text'); ta.rows = 5; ta.maxLength = 1200; ta.placeholder = t.ph; ta.setAttribute('aria-label', t.ph);
    const row = el('div', 'bia-actions');
    const cp = el('button', 'btn btn-ghost', t.copy); cp.type = 'button';
    cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(msg()); cp.textContent = T().copied; setTimeout(() => { cp.textContent = T().copy; }, 1800); } catch (e) { ta.select(); } });
    const ml = el('a', 'btn btn-neon', t.mail); ml.id = 'fbMail';
    ml.addEventListener('click', () => { ml.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(T().subj) + '&body=' + encodeURIComponent(msg()); });
    ml.href = 'mailto:' + MAIL; if (MAIL) row.append(cp, ml); else row.append(cp);
    card.append(head, el('p', 'bia-intro', t.sub), faces, ta, row, el('p', 'bia-intro', MAIL ? t.note : t.noteCopy)); dlg.append(card);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.classList.contains('hidden')) close(); });
    document.body.append(dlg);
  }
  function open() { if (!dlg) build(); last = document.activeElement; dlg.classList.remove('hidden'); document.body.classList.add('glos-abierto'); ta.focus(); }
  function close() { dlg.classList.add('hidden'); document.body.classList.remove('glos-abierto'); if (last && last.focus) last.focus(); }

  function init() {
    const strip = document.querySelector('.status-strip');
    const b = el('button', 'glos-btn', '💬 ' + T().btn); b.type = 'button'; b.id = 'btnFeedback'; b.addEventListener('click', open);
    if (strip) strip.insertBefore(b, document.getElementById('btnGlosario') || null); else document.body.append(b);
    window.addEventListener('flowlab:lang', () => { b.textContent = '💬 ' + T().btn; if (dlg) { dlg.remove(); dlg = null; } });
  }
  window.FeedbackFlowLab = { abrir: open };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

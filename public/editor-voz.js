/* FlowLab · Editor de voz (estudio básico para la toma activa).
   Onda con ZOOM (rueda del mouse), desplazamiento, selección arrastrando, recortar, cortar, silenciar,
   fundidos, ganancia, normalizar, invertir y deshacer. Todo ocurre en el navegador; "Aplicar" reemplaza
   la toma en la mezcla. La pista de YouTube no se puede editar (el navegador no da acceso a su audio). */
(function () {
  'use strict';
  const EN = () => /^en/i.test(document.documentElement.lang || '');
  const TX = {
    es: { open: '✂ Editar mi voz', title: 'Editor de voz', none: 'Primero graba una toma.', play: '▶ Escuchar', stop: '■ Parar', all: 'Todo', crop: 'Recortar a selección', cut: 'Cortar selección', mute: 'Silenciar', fin: 'Fundido de entrada', fout: 'Fundido de salida', rev: 'Invertir', norm: 'Normalizar', undo: 'Deshacer', apply: 'Aplicar a la mezcla', cancel: 'Cancelar', gain: 'Volumen', zin: '＋', zout: '－', fit: 'Ver todo', help: 'Rueda = zoom · Shift+rueda o ◀ ▶ = mover · arrastra = seleccionar · doble clic = quitar selección', sel: 'Selección', len: 'Duración' },
    en: { open: '✂ Edit my voice', title: 'Voice editor', none: 'Record a take first.', play: '▶ Play', stop: '■ Stop', all: 'All', crop: 'Crop to selection', cut: 'Cut selection', mute: 'Silence', fin: 'Fade in', fout: 'Fade out', rev: 'Reverse', norm: 'Normalize', undo: 'Undo', apply: 'Apply to mix', cancel: 'Cancel', gain: 'Volume', zin: '＋', zout: '－', fit: 'Fit', help: 'Wheel = zoom · Shift+wheel or ◀ ▶ = pan · drag = select · double click = clear selection', sel: 'Selection', len: 'Length' }
  };
  const T = () => TX[EN() ? 'en' : 'es'];
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const fmt = s => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + (s % 60).toFixed(2).padStart(5, '0'); };

  let dlg, cv, g, take, buf, undo, view, selA, selB, headShift, src, playT0, playOff, raf, info, btns = {}, gainSel, lastFocus;

  function cloneBuf(b, from, to) {
    const len = Math.max(1, to - from), nb = new AudioBuffer({ length: len, numberOfChannels: b.numberOfChannels, sampleRate: b.sampleRate });
    for (let c = 0; c < b.numberOfChannels; c++) nb.copyToChannel(b.getChannelData(c).subarray(from, to), c);
    return nb;
  }
  const sr = () => buf.sampleRate;
  const selS = () => { if (selA == null || selB == null || Math.abs(selB - selA) < 0.005) return null; const a = Math.min(selA, selB), b = Math.max(selA, selB); return [Math.floor(a * sr()), Math.min(buf.length, Math.ceil(b * sr()))]; };
  const rangeOrAll = () => selS() || [0, buf.length];

  function push() { undo.push({ buf, headShift }); if (undo.length > 15) undo.shift(); }
  function setBuf(nb, shiftAdd) { push(); buf = nb; headShift += shiftAdd || 0; selA = selB = null; clampView(); draw(); }
  function clampView() { const d = buf.duration; view.len = Math.min(Math.max(view.len, 0.05), d); view.start = Math.min(Math.max(0, view.start), Math.max(0, d - view.len)); }

  function draw() {
    const W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
    g.fillStyle = '#0B0B0F'; g.fillRect(0, 0, W, H);
    const d0 = buf.getChannelData(0), per = view.len * sr() / W, s0 = view.start * sr();
    // regla
    g.fillStyle = '#9A9AB0'; g.font = '12px ui-monospace,monospace'; g.textBaseline = 'top';
    const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60], stepT = steps.find(s => s / view.len * W >= 80) || 60;
    for (let t = Math.ceil(view.start / stepT) * stepT; t < view.start + view.len; t += stepT) { const x = (t - view.start) / view.len * W; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, 0, 1, H); g.fillStyle = '#9A9AB0'; g.fillText(fmt(t), x + 3, 2); }
    // selección
    const sl = selS(); if (sl) { const x0 = (sl[0] / sr() - view.start) / view.len * W, x1 = (sl[1] / sr() - view.start) / view.len * W; g.fillStyle = 'rgba(222,252,7,.18)'; g.fillRect(x0, 0, x1 - x0, H); g.fillStyle = '#DEFC07'; g.fillRect(x0, 0, 2, H); g.fillRect(x1 - 2, 0, 2, H); }
    // onda
    const mid = H / 2 + 8, half = H / 2 - 22; g.fillStyle = '#05ECFB';
    for (let x = 0; x < W; x++) {
      const a = Math.floor(s0 + x * per), b = Math.max(a + 1, Math.floor(s0 + (x + 1) * per)); let mn = 0, mx = 0;
      const step = Math.max(1, Math.floor((b - a) / 24));
      for (let i = a; i < b && i < d0.length; i += step) { const v = d0[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
      g.fillRect(x, mid - mx * half, 1, Math.max(1, (mx - mn) * half));
    }
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, mid, W, 1);
    // aguja de reproducción
    if (src) { const t = playOff + (cvCtx().currentTime - playT0), x = (t - view.start) / view.len * W; g.fillStyle = '#F20479'; g.fillRect(x, 0, 2, H); }
    info.textContent = T().len + ' ' + fmt(buf.duration) + (sl ? ' · ' + T().sel + ' ' + fmt((sl[1] - sl[0]) / sr()) : '') + ' · zoom ×' + (buf.duration / view.len).toFixed(1);
  }
  const cvCtx = () => (typeof Studio !== 'undefined' && Studio.ctx) ? Studio.ctx() : new (window.AudioContext || window.webkitAudioContext)();

  function stop() { cancelAnimationFrame(raf); if (src) { try { src.stop(); } catch (e) { } src = null; } btns.play.textContent = T().play; draw(); }
  function play() {
    if (src) { stop(); return; }
    const c = cvCtx(); if (c.state === 'suspended') c.resume();
    const sl = selS(), from = sl ? sl[0] / sr() : view.start, dur = sl ? (sl[1] - sl[0]) / sr() : buf.duration - from;
    src = c.createBufferSource(); src.buffer = buf; src.connect(c.destination); playT0 = c.currentTime; playOff = from;
    src.onended = () => { if (src) { src = null; btns.play.textContent = T().play; draw(); } }; src.start(0, from, dur); btns.play.textContent = T().stop;
    const tick = () => { if (!src) return; draw(); raf = requestAnimationFrame(tick); }; tick();
  }

  // ---- operaciones ----
  const ops = {
    crop() { const s = selS(); if (!s) return; setBuf(cloneBuf(buf, s[0], s[1]), s[0] / sr()); view.start = 0; view.len = buf.duration; },
    cut() {
      const s = selS(); if (!s) return; const keepA = buf.length - (s[1] - s[0]); if (keepA < 1) return;
      const nb = new AudioBuffer({ length: keepA, numberOfChannels: buf.numberOfChannels, sampleRate: sr() });
      for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c), o = nb.getChannelData(c); o.set(d.subarray(0, s[0]), 0); o.set(d.subarray(s[1]), s[0]); }
      setBuf(nb, s[0] === 0 ? s[1] / sr() : 0); view.start = 0; view.len = buf.duration;
    },
    mute() { const [a, b] = rangeOrAll(); const nb = cloneBuf(buf, 0, buf.length); for (let c = 0; c < nb.numberOfChannels; c++) nb.getChannelData(c).fill(0, a, b); setBuf(nb); },
    fin() { const [a, b] = rangeOrAll(); const nb = cloneBuf(buf, 0, buf.length), n = b - a; for (let c = 0; c < nb.numberOfChannels; c++) { const d = nb.getChannelData(c); for (let i = 0; i < n; i++) d[a + i] *= i / n; } setBuf(nb); },
    fout() { const [a, b] = rangeOrAll(); const nb = cloneBuf(buf, 0, buf.length), n = b - a; for (let c = 0; c < nb.numberOfChannels; c++) { const d = nb.getChannelData(c); for (let i = 0; i < n; i++) d[a + i] *= 1 - i / n; } setBuf(nb); },
    rev() { const [a, b] = rangeOrAll(); const nb = cloneBuf(buf, 0, buf.length); for (let c = 0; c < nb.numberOfChannels; c++) nb.getChannelData(c).subarray(a, b).reverse(); setBuf(nb); },
    norm() { const [a, b] = rangeOrAll(); let m = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = a; i < b; i++) m = Math.max(m, Math.abs(d[i])); } if (m < 0.001) return; const k = 0.95 / m, nb = cloneBuf(buf, 0, buf.length); for (let c = 0; c < nb.numberOfChannels; c++) { const d = nb.getChannelData(c); for (let i = a; i < b; i++) d[i] = Math.max(-1, Math.min(1, d[i] * k)); } setBuf(nb); },
    gain() { const db = +gainSel.value; if (!db) return; const [a, b] = rangeOrAll(), k = Math.pow(10, db / 20), nb = cloneBuf(buf, 0, buf.length); for (let c = 0; c < nb.numberOfChannels; c++) { const d = nb.getChannelData(c); for (let i = a; i < b; i++) d[i] = Math.max(-1, Math.min(1, d[i] * k)); } setBuf(nb); gainSel.value = 0; },
    undo() { const u = undo.pop(); if (!u) return; buf = u.buf; headShift = u.headShift; selA = selB = null; clampView(); draw(); }
  };

  function apply() {
    stop();
    take.buffer = buf; take.duration = buf.duration; take.peaks = computePeaks(buf, 1200); take.beatStart = take.beatStart + headShift;
    if (typeof renderTakes === 'function') renderTakes(); if (typeof tlInvalidate === 'function') tlInvalidate();
    close();
  }
  function close() { stop(); dlg.classList.add('hidden'); document.body.classList.remove('glos-abierto'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  function build() {
    const t = T();
    dlg = el('div', 'bia-dlg hidden'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', t.title);
    const card = el('div', 'bia-card ev-card');
    const head = el('div', 'bia-head'); head.append(el('strong', null, t.title)); const x = el('button', 'btn btn-ghost btn-small', '✕'); x.type = 'button'; x.setAttribute('aria-label', t.cancel); x.addEventListener('click', close); head.append(x);
    cv = el('canvas', 'ev-canvas'); cv.width = 1000; cv.height = 240; g = cv.getContext('2d'); cv.setAttribute('aria-label', t.title);
    info = el('p', 'bia-intro ev-info');
    const row = (items) => { const r = el('div', 'ev-row'); items.forEach(i => r.append(i)); return r; };
    const mk = (k, label, fn) => { const b = el('button', 'btn btn-ghost btn-small', label); b.type = 'button'; b.addEventListener('click', fn); btns[k] = b; return b; };
    gainSel = el('select', 'ev-gain'); gainSel.setAttribute('aria-label', t.gain); [-12, -6, -3, 3, 6, 12].forEach(v => { const o = el('option', null, (v > 0 ? '+' : '') + v + ' dB'); o.value = v; gainSel.append(o); }); gainSel.value = 3; gainSel.selectedIndex = 3;
    const gb = mk('gain', t.gain, ops.gain);
    card.append(head, cv, info,
      row([mk('play', t.play, play), mk('zin', t.zin, () => zoom(0.5, 0.5)), mk('zout', t.zout, () => zoom(2, 0.5)), mk('fit', t.fit, () => { view.start = 0; view.len = buf.duration; draw(); }), mk('l', '◀', () => pan(-0.25)), mk('r', '▶', () => pan(0.25))]),
      row([mk('crop', t.crop, ops.crop), mk('cut', t.cut, ops.cut), mk('mute', t.mute, ops.mute), mk('fin', t.fin, ops.fin), mk('fout', t.fout, ops.fout), mk('rev', t.rev, ops.rev), mk('norm', t.norm, ops.norm), gainSel, gb, mk('undo', t.undo, ops.undo)]),
      el('p', 'bia-intro', t.help));
    const fin = el('div', 'bia-actions'); const ca = el('button', 'btn btn-ghost', t.cancel); ca.type = 'button'; ca.addEventListener('click', close); const ap = el('button', 'btn btn-neon', t.apply); ap.type = 'button'; ap.addEventListener('click', apply); fin.append(ca, ap); card.append(fin);
    dlg.append(card); document.body.append(dlg);
    // interacciones
    const tAt = e => { const r = cv.getBoundingClientRect(); return view.start + (e.clientX - r.left) / r.width * view.len; };
    let drag = false;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); drag = true; selA = selB = tAt(e); draw(); });
    cv.addEventListener('pointermove', e => { if (!drag) return; selB = Math.max(0, Math.min(buf.duration, tAt(e))); draw(); });
    cv.addEventListener('pointerup', () => { drag = false; if (selA != null && selB != null && Math.abs(selB - selA) < 0.005) selA = selB = null; draw(); });
    cv.addEventListener('dblclick', () => { selA = selB = null; draw(); });
    cv.addEventListener('wheel', e => { e.preventDefault(); if (e.shiftKey) { pan(e.deltaY > 0 ? 0.2 : -0.2); return; } const r = cv.getBoundingClientRect(); zoom(e.deltaY > 0 ? 1.25 : 0.8, (e.clientX - r.left) / r.width); }, { passive: false });
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    document.addEventListener('keydown', e => { if (dlg.classList.contains('hidden')) return; if (e.key === 'Escape') close(); else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); play(); } });
  }
  function zoom(k, focus) { const f = view.start + view.len * focus; view.len = Math.min(buf.duration, Math.max(0.05, view.len * k)); view.start = f - view.len * focus; clampView(); draw(); }
  function pan(k) { view.start += view.len * k; clampView(); draw(); }

  function open() {
    const tk = (typeof activeTake === 'function') ? activeTake() : null;
    if (!tk) { alert(T().none); return; }
    if (!dlg) build(); take = tk; buf = tk.buffer; undo = []; headShift = 0; selA = selB = null; view = { start: 0, len: buf.duration };
    lastFocus = document.activeElement; dlg.classList.remove('hidden'); document.body.classList.add('glos-abierto'); draw();
  }
  function init() {
    const ref = document.getElementById('mixExportVoice'); if (!ref) return;
    const b = el('button', 'btn btn-ghost', T().open); b.type = 'button'; b.id = 'mixEditVoice'; b.addEventListener('click', open);
    ref.parentNode.insertBefore(b, ref);
    window.addEventListener('flowlab:lang', () => { b.textContent = T().open; if (dlg) { dlg.remove(); dlg = null; } });
  }
  window.EditorVoz = { abrir: open };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* FlowLab · Modo Graffiti. Cada persona pinta sobre su propia copia de la web.
   - Se guarda solo en su navegador (localStorage); nunca se envía a ningún servidor.
   - Mientras pinta, la web queda congelada (nada se puede pulsar); al salir todo vuelve a funcionar.
   - También cambia entre tema oscuro y claro. */
(function () {
  'use strict';
  const KEY = 'flowlab_graffiti_v1', KT = 'flowlab_tema';
  const EN = () => /^en/i.test(document.documentElement.lang || '');
  const TX = {
    es: { btn: 'Grafitea', tools: 'Herramientas de graffiti', pencil: 'Lápiz', brush: 'Pincel', spray: 'Spray', eraser: 'Borrador', color: 'Color', size: 'Grosor', grad: 'Degradado', undo: 'Deshacer', clear: 'Borrar todo', save: 'Guardar', exit: 'Salir', light: 'Tema claro/oscuro', saved: 'Guardado en tu navegador', hint: 'Dibuja donde quieras. La web está congelada hasta que salgas.' },
    en: { btn: 'Graffiti', tools: 'Graffiti tools', pencil: 'Pencil', brush: 'Brush', spray: 'Spray', eraser: 'Eraser', color: 'Color', size: 'Size', grad: 'Gradient', undo: 'Undo', clear: 'Clear all', save: 'Save', exit: 'Exit', light: 'Light/dark theme', saved: 'Saved in your browser', hint: 'Draw anywhere. The site is frozen until you exit.' }
  };
  const T = () => TX[EN() ? 'en' : 'es'];
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };

  let cv, ctx, bar, btn, active = false, tool = 'spray', color = '#DEFC07', size = 14, grad = false, hue = 0;
  let drawing = false, last = null, spraying = 0, undo = [], statusEl;

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function docH() { return Math.min(8000, Math.max(document.documentElement.scrollHeight, window.innerHeight)); }
  function docW() { return document.documentElement.clientWidth; }

  function fit() {
    const w = docW(), h = docH();
    if (cv.width === w && cv.height === h) return;
    const keep = document.createElement('canvas'); keep.width = cv.width; keep.height = cv.height;
    if (cv.width && cv.height) keep.getContext('2d').drawImage(cv, 0, 0);
    cv.width = w; cv.height = h; ctx = cv.getContext('2d');
    if (keep.width) ctx.drawImage(keep, 0, 0);
  }
  function loadSaved() {
    const d = lsGet(KEY, ''); if (!d) return;
    const im = new Image(); im.onload = () => { fit(); ctx.drawImage(im, 0, 0); }; im.src = d;
  }
  function save(msg) {
    const ok = lsSet(KEY, cv.toDataURL('image/webp', 0.7));
    if (msg && statusEl) { statusEl.textContent = ok ? T().saved : 'No hay espacio para guardar'; setTimeout(() => { statusEl.textContent = T().hint; }, 2200); }
  }
  async function snap() { try { undo.push(await createImageBitmap(cv)); if (undo.length > 8) undo.shift().close(); } catch (e) { } }

  function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function strokeColor() { if (!grad) return color; hue = (hue + 4) % 360; return 'hsl(' + hue + ',95%,58%)'; }
  function drawTo(p) {
    const c = ctx; c.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (tool === 'eraser') { c.lineWidth = size * 1.6; c.strokeStyle = '#000'; c.shadowBlur = 0; }
    else if (tool === 'pencil') { c.lineWidth = Math.max(1, size / 6); c.strokeStyle = strokeColor(); c.shadowBlur = 0; }
    else if (tool === 'brush') { c.lineWidth = size; c.strokeStyle = strokeColor(); c.shadowColor = c.strokeStyle; c.shadowBlur = size / 2; }
    if (tool !== 'spray') { c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(p.x, p.y); c.stroke(); c.shadowBlur = 0; }
    last = p;
  }
  function sprayAt(p) {
    const c = ctx; c.globalCompositeOperation = 'source-over'; c.fillStyle = strokeColor();
    const r = size * 1.4, n = Math.round(10 + size * 1.2);
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, d = Math.random() * Math.random() * r; c.fillRect(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 1.6, 1.6); }
  }
  function down(e) {
    if (!active || e.button > 0) return; e.preventDefault(); cv.setPointerCapture(e.pointerId);
    snap(); drawing = true; last = pos(e);
    if (tool === 'spray') { sprayAt(last); clearInterval(spraying); spraying = setInterval(() => { if (drawing && last) sprayAt(last); }, 30); }
    else { drawTo({ x: last.x + 0.01, y: last.y }); }
  }
  function move(e) {
    if (!drawing) return; const p = pos(e);
    if (tool === 'spray') { last = p; sprayAt(p); } else drawTo(p);
  }
  function up() { if (!drawing) return; drawing = false; clearInterval(spraying); last = null; save(false); }

  function setActive(on) {
    active = on; fit();
    document.body.classList.toggle('graf-on', on);
    cv.style.pointerEvents = on ? 'auto' : 'none';
    bar.hidden = !on;
    ['.app', '.topbar'].forEach(s => { const n = document.querySelector(s); if (n) n.inert = on; });
    const b = document.getElementById('biaBubble'); if (b) b.style.display = on ? 'none' : '';
    if (btn) btn.setAttribute('aria-pressed', String(on));
    if (!on) save(false);
    if (on) { statusEl.textContent = T().hint; const f = bar.querySelector('[data-tool=' + tool + ']'); if (f) f.focus(); }
  }
  function applyTheme(t) { document.documentElement.dataset.tema = t === 'claro' ? 'claro' : 'oscuro'; }

  function makeBar() {
    const t = T();
    bar = el('div', 'graf-bar'); bar.hidden = true; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', t.tools);
    const mk = (cls, label, txt, fn) => { const b = el('button', 'graf-b ' + cls, txt); b.type = 'button'; b.title = label; b.setAttribute('aria-label', label); b.addEventListener('click', fn); return b; };
    [['pencil', t.pencil, '✏️'], ['brush', t.brush, '🖌️'], ['spray', t.spray, '🎨'], ['eraser', t.eraser, '🧽']].forEach(([id, l, ic]) => {
      const b = mk('graf-tool', l, ic + ' ' + l, () => { tool = id; bar.querySelectorAll('.graf-tool').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
      b.dataset.tool = id; b.setAttribute('aria-pressed', String(id === tool)); bar.append(b);
    });
    const col = el('input'); col.type = 'color'; col.value = color; col.title = t.color; col.setAttribute('aria-label', t.color); col.addEventListener('input', () => { color = col.value; if (tool === 'eraser') tool = 'brush'; });
    const sz = el('input'); sz.type = 'range'; sz.min = 2; sz.max = 70; sz.value = size; sz.title = t.size; sz.setAttribute('aria-label', t.size); sz.addEventListener('input', () => { size = +sz.value; });
    const gl = el('label', 'graf-chk'); const gc = el('input'); gc.type = 'checkbox'; gc.addEventListener('change', () => { grad = gc.checked; }); gl.append(gc, ' ' + t.grad);
    bar.append(col, sz, gl);
    bar.append(mk('', t.undo, '↶ ' + t.undo, async () => { const b = undo.pop(); if (b) { ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(b, 0, 0); save(false); } }));
    bar.append(mk('', t.clear, '🗑 ' + t.clear, async () => { await snap(); ctx.clearRect(0, 0, cv.width, cv.height); try { localStorage.removeItem(KEY); } catch (e) { } }));
    bar.append(mk('', t.save, '💾 ' + t.save, () => save(true)));
    bar.append(mk('', t.light, '◐', () => { const n = document.documentElement.dataset.tema === 'claro' ? 'oscuro' : 'claro'; applyTheme(n); lsSet(KT, n); }));
    bar.append(mk('graf-exit', t.exit, '✕ ' + t.exit, () => setActive(false)));
    statusEl = el('span', 'graf-status', t.hint); statusEl.setAttribute('role', 'status'); bar.append(statusEl);
    document.body.append(bar);
  }

  function init() {
    cv = el('canvas', 'graf-canvas'); cv.setAttribute('aria-hidden', 'true'); document.body.append(cv); ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    makeBar(); fit(); loadSaved(); applyTheme(lsGet(KT, 'oscuro'));
    const strip = document.querySelector('.status-strip');
    btn = el('button', 'glos-btn graf-open', '🎨 ' + T().btn); btn.type = 'button'; btn.id = 'btnGraffiti'; btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => setActive(!active));
    if (strip) { const ref = document.getElementById('btnCoach'); strip.insertBefore(btn, ref || strip.firstChild); } else document.body.append(btn);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && active) setActive(false); });
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 200); });
    window.addEventListener('flowlab:lang', () => { btn.textContent = '🎨 ' + T().btn; });
    window.addEventListener('hashchange', () => setTimeout(fit, 300));
  }
  window.Graffiti = { on: () => setActive(true), off: () => setActive(false) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

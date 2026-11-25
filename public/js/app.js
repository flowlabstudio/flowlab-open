'use strict';
/* =====================================================================
   FlowLab Studio · app.js
   01 Beat (YouTube + MP3/WAV local) · Gym de freestyle
   02 Editor continuo + sílabas + rimas fonéticas + temas + dictado
   03 Cabina vocal (AudioWorklet autotune) · presets · historial de tomas
   04 Línea de tiempo 2 pistas · mezcla · exportación WAV
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const store = {
  get(k, d) { try { const v = localStorage.getItem('flowlab_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('flowlab_' + k, JSON.stringify(v)); } catch (e) { } }
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// Colores de los canvas: se leen de las variables de styles.css para que el estilo viva en un solo lugar
const cssVar = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n) || '').trim() || d;
const PAL = { bg: cssVar('--bg', '#0D0D0D'), s2: cssVar('--surface-2', '#1C1C1C'), muted: cssVar('--muted', '#A3A3A3'), lime: cssVar('--lime', '#DEFC07'), cyan: cssVar('--cyan', '#05ECFB'), red: cssVar('--red', '#E01A17'), orange: cssVar('--orange', '#FE5E00') };
const rgba = (hex, a) => { const v = parseInt(hex.replace('#', ''), 16); return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')'; };
const fmtClock = s => { s = Math.max(0, Math.floor(+s || 0)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
// Redondea primero a décimas: evita lecturas imposibles como "0:60.0"
const fmtTime = s => { const t = Math.round(Math.max(0, +s || 0) * 10), m = Math.floor(t / 600); return m + ':' + ((t - m * 600) / 10).toFixed(1).padStart(4, '0'); };
const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()); };
function downloadBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function tickClock() { $('#clock').textContent = new Date().toLocaleTimeString('es-ES', { hour12: false }); }
setInterval(tickClock, 1000); tickClock();
if (location.protocol === 'file:') $('#serverWarn').classList.remove('hidden');

/* =====================================================================
   AUDIO CONTEXT COMPARTIDO
   ===================================================================== */
let actx = null, playBus = null, pbAnalyser = null;
function ctx() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    playBus = actx.createGain();
    pbAnalyser = actx.createAnalyser(); pbAnalyser.fftSize = 2048;
    playBus.connect(pbAnalyser); pbAnalyser.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
/* iPhone: el audio de Web Audio se calla con el interruptor de silencio, salvo que la página pida la categoría
   "playback" (reproducción). Safari 16.4+ lo permite con navigator.audioSession. Para grabar se usa "play-and-record". */
function audioSession(tipo) { try { if (navigator.audioSession && navigator.audioSession.type !== tipo) navigator.audioSession.type = tipo; } catch (e) { /* navegador sin esta función: lo cubre el plan B de cabina.js */ } }
audioSession('playback');
const IR_CACHE = {};
function getIR(sr) {
  if (IR_CACHE[sr]) return IR_CACHE[sr];
  const len = Math.floor(sr * 2.2), buf = new AudioBuffer({ length: len, numberOfChannels: 2, sampleRate: sr });
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
  }
  return (IR_CACHE[sr] = buf);
}
function computePeaks(buffer, P = 1600) {
  const peaks = new Float32Array(P), chs = Math.min(2, buffer.numberOfChannels), len = buffer.length;
  const data = []; for (let c = 0; c < chs; c++) data.push(buffer.getChannelData(c));
  const per = len / P, stride = Math.max(1, Math.floor(per / 64));
  for (let p = 0; p < P; p++) {
    const a = Math.floor(p * per), b = Math.min(len, Math.floor((p + 1) * per));
    let m = 0;
    for (let i = a; i < b; i += stride) for (let c = 0; c < chs; c++) { const v = Math.abs(data[c][i]); if (v > m) m = v; }
    peaks[p] = m;
  }
  return peaks;
}
function encodeWav(buf) {
  const numCh = Math.min(2, buf.numberOfChannels), sr = buf.sampleRate, len = buf.length;
  const bytes = 44 + len * numCh * 2, ab = new ArrayBuffer(bytes), v = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, bytes - 8, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * numCh * 2, true); v.setUint16(32, numCh * 2, true);
  v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, bytes - 44, true);
  const chans = []; for (let c = 0; c < numCh; c++) chans.push(buf.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < numCh; c++) {
    const s = Math.max(-1, Math.min(1, chans[c][i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2;
  }
  return new Blob([ab], { type: 'audio/wav' });
}

/* =====================================================================
   01 · BASE: YOUTUBE (IFrame API) + MP3/WAV LOCAL
   ===================================================================== */
let baseMode = 'none';            // 'none' | 'local' | 'yt'
let baseBuffer = null, basePeaks = null, baseName = '';
let baseLoop = false;             // la base se repite en bucle (casilla "Repetir" o beat armado en Beats)
let baseOrig = null, baseFromBeat = false;   // archivo original (sin editar) y si vino del creador de beats
const baseEdit = { trimS: 0, trimE: 0, shiftMs: 0 };   // ediciones simples: recorte (s) y desplazamiento (ms)
let beatTrack = null;             // pista "Mi beat" (el patrón del modo Beats); la registra beats.js
let ytPlayer = null, ytReady = false, ytPlaying = false, ytApi = null, ytNoSync = false;

function ytId(u) {
  u = (u || '').trim(); if (!u) return null;
  const m = u.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function loadYtApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApi) return ytApi;
  ytApi = new Promise((res, rej) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) try { prev(); } catch (e) { } res(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api'; s.async = true; s.onerror = () => rej(new Error('yt api'));
    document.head.appendChild(s);
    setTimeout(() => rej(new Error('timeout')), 9000);
  });
  ytApi.catch(() => { ytApi = null; });
  return ytApi;
}
function onYtState(e) {
  const S = window.YT.PlayerState;
  ytPlaying = e.data === S.PLAYING;
  if (e.data === S.PLAYING && pb && pb.kind === 'mix' && pb.pendingVoice) {
    pb.pendingVoice = false;
    const c = ctx(), cur = ytPlayer.getCurrentTime() || 0;
    pb.t0 = c.currentTime; pb.offset = cur;
    scheduleVoice(activeTake(), c.currentTime, cur);
    scheduleBeat(c.currentTime, cur);
  }
  if ((e.data === S.PAUSED || e.data === S.ENDED) && pb && pb.kind === 'mix') stopAllPlayback();
  tlInvalidate();
}
async function loadBeat() {
  const v = $('#ytInput').value.trim(), id = ytId(v);
  if (!id) { alert('No se pudo extraer el ID del video. Usa un link de YouTube válido.'); return; }
  store.set('yt', v);
  stopAllPlayback();
  try {
    await loadYtApi();
    if (ytPlayer && ytReady && !ytNoSync) { ytPlayer.loadVideoById(id); }
    else {
      // Destruye el reproductor previo para no dejar iframes huérfanos escuchando eventos
      if (ytPlayer && ytPlayer.destroy) { try { ytPlayer.destroy(); } catch (e) { } }
      ytPlayer = null; ytPlaying = false;
      $('#ytWrap').innerHTML = '<div id="ytPlayer"></div>';
      ytNoSync = false; ytReady = false;
      ytPlayer = new YT.Player('ytPlayer', {
        videoId: id,
        playerVars: { rel: 0, playsinline: 1, autoplay: 1 },
        events: { onReady: () => { ytReady = true; tlInvalidate(); }, onStateChange: onYtState }
      });
    }
  } catch (err) {
    // Sin API (offline o bloqueada): iframe simple, sin sincronía
    ytPlayer = null; ytReady = false; ytNoSync = true;
    $('#ytWrap').innerHTML = '<iframe title="Beat de YouTube" src="https://www.youtube.com/embed/' + id +
      '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  }
  setBaseMode('yt');
}
$('#ytLoad').addEventListener('click', loadBeat);
$('#ytInput').addEventListener('keydown', e => { if (e.key === 'Enter') loadBeat(); });
{ const sv = store.get('yt', ''); if (sv) $('#ytInput').value = sv; }

function setBaseMode(m) {
  baseMode = m;
  if (typeof updateYtExport === 'function') updateYtExport();
  if (m === 'local' && ytPlayer && ytReady) { try { ytPlayer.pauseVideo(); } catch (e) { } }
  const lbl = m === 'local' ? (baseFromBeat ? 'Beat propio · ' : 'MP3/WAV · ') + baseName : m === 'yt' ? 'YouTube' + (ytNoSync ? ' (sin sincronía)' : '') : 'ninguna';
  $('#baseLabel').innerHTML = 'Base activa: <b></b>'; $('#baseLabel b').textContent = lbl;
  $('#tlBaseSrc').textContent = m === 'local' ? baseName : m === 'yt' ? 'YouTube' : '—';
  tl.playhead = 0;
  tlInvalidate(); updateEditUI(); updateYtNote();
  window.dispatchEvent(new CustomEvent('flowlab:base', { detail: { mode: m === 'local' && baseFromBeat ? 'beat' : m, name: baseName } }));
}
const MAX_BASE_MB = 120, MAX_BASE_MIN = 15;
let baseLoading = false;
async function loadLocalBase(file) {
  if (!file || baseLoading) return;
  const okType = /\.(mp3|wav)$/i.test(file.name) || /audio\/(mpeg|mp3|wav|x-wav|wave)/.test(file.type);
  if (!okType) { alert('Formato no soportado. Sube un archivo .MP3 o .WAV.'); return; }
  if (file.size > MAX_BASE_MB * 1024 * 1024) { alert('La base pesa más de ' + MAX_BASE_MB + ' MB. Usa un MP3 más liviano.'); return; }
  if (recording) { alert('Detén la grabación antes de cambiar la base.'); return; }
  baseLoading = true;
  $('#baseLabel').innerHTML = 'Base activa: <b>decodificando…</b>';
  try {
    const ab = await file.arrayBuffer();
    const buf = await ctx().decodeAudioData(ab);
    if (buf.duration > MAX_BASE_MIN * 60) throw new Error('larga');
    stopAllPlayback();
    baseBuffer = buf; baseName = file.name.slice(0, 80); basePeaks = computePeaks(buf, 2400); baseLoop = false;
    baseOrig = buf; baseFromBeat = false; resetEdit();
    setBaseMode('local');
  } catch (e) {
    alert(e.message === 'larga' ? 'La base dura más de ' + MAX_BASE_MIN + ' minutos.' : 'No se pudo leer el audio. Prueba con otro MP3/WAV.');
    setBaseMode(baseMode);
  } finally { baseLoading = false; }
}
{
  const dz = $('#dropZone');
  $('#baseFile').addEventListener('change', e => { loadLocalBase(e.target.files[0]); e.target.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; loadLocalBase(f); });
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#baseFile').click(); } });
}

/* =====================================================================
   02 · EDITOR CONTINUO + SÍLABAS
   ===================================================================== */
const mainTextarea = $('#mainTextarea'), lineGutter = $('#lineGutter'), gutterInner = $('#gutterInner');
const USER_PLAN = 'open', THEME_LIMIT = Infinity;   // edición abierta: sin límite de temas
let activeTheme = null, saveTimer = null;

function vowelType(ch) {
  if (!ch) return null;
  if ('aeoáéóíú'.includes(ch)) return 'S';   // fuertes (í/ú con tilde rompen diptongo)
  if ('iuü'.includes(ch)) return 'W';
  return null;
}
function countRun(t) {
  let n = 0, i = 0;
  while (i < t.length) {
    const c = t[i], n1 = t[i + 1], n2 = t[i + 2];
    if (c === 'W') { if (n1 === 'S' || n1 === 'W') { n++; i += 2; if (t[i] === 'W') i++; continue; } n++; i++; continue; }
    if (n1 === 'W' && n2 === 'S') { n++; i++; continue; }
    if (n1 === 'W') { n++; i += 2; continue; }
    n++; i++;
  }
  return n;
}
function wordSyllables(raw) {
  const w = raw.toLowerCase(); let total = 0, cur = [];
  const flush = () => { if (cur.length) { total += countRun(cur); cur = []; } };
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (c === 'h') continue;
    if (c === 'u') { const p = w[i - 1], n = w[i + 1]; if (p === 'q' || (p === 'g' && (n === 'e' || n === 'i'))) continue; }
    if (c === 'y' && i === w.length - 1 && i > 0 && vowelType(w[i - 1])) { cur.push('W'); continue; }
    const t = vowelType(c);
    if (t) cur.push(t); else flush();
  }
  flush();
  return total;
}
// Caché: el gutter y las estadísticas cuentan las mismas líneas en cada tecla
const syllCache = new Map();
function lineSyllables(text) {
  let v = syllCache.get(text);
  if (v === undefined) { v = lineSyllablesRaw(text); if (syllCache.size > 4000) syllCache.clear(); syllCache.set(text, v); }
  return v;
}
function lineSyllablesRaw(text) {
  const words = text.toLowerCase().replace(/[¡!¿?.,;:"'()\[\]«»\-—]/g, ' ').split(/\s+/).filter(Boolean);
  let total = 0, prevEndsVowel = false;
  for (const wd0 of words) {
    const wd = wd0.replace(/^h+/, '');
    let s = wordSyllables(wd);
    if (s === 0 && /\d/.test(wd0)) s = 1;
    total += s;
    const endsV = vowelType(wd0[wd0.length - 1]) !== null;
    const startsV = wd.length > 0 && (vowelType(wd[0]) !== null || wd === 'y');
    if (prevEndsVowel && startsV && s > 0) total -= 1; /* sinalefa */
    prevEndsVowel = endsV;
  }
  return Math.max(0, total);
}

function cursorLine() {
  const pos = mainTextarea.selectionStart, text = mainTextarea.value;
  let n = 0; for (let i = 0; i < pos; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}
function updateGutter() {
  const lines = mainTextarea.value.split('\n'), act = cursorLine();
  let html = '';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    html += '<div class="gutter-line' + (i === act ? ' active' : '') + '"><span class="ln">' + (i + 1) +
      '</span><span class="sc">' + (l.trim() ? lineSyllables(l) : '—') + '</span></div>';
  }
  gutterInner.innerHTML = html;
  syncScroll();
}
function highlightActiveLine() {
  const act = cursorLine();
  const g = gutterInner.children;
  for (let i = 0; i < g.length; i++) g[i].classList.toggle('active', i === act);
}
function syncScroll() { lineGutter.scrollTop = mainTextarea.scrollTop; }
function updateStats() {
  const lines = mainTextarea.value.split('\n').filter(l => l.trim());
  const tot = lines.reduce((a, v) => a + lineSyllables(v), 0);
  $('#lineCount').textContent = lines.length;
  $('#totalSyll').textContent = tot;
  $('#avgSyll').textContent = lines.length ? (tot / lines.length).toFixed(1) : '0.0';
}

/* ---- Temas (localStorage) ---- */
function getThemes() {
  const t = store.get('themes', []);
  // Filtra entradas corruptas (null, sin nombre) para que un dato dañado no tumbe el editor
  return (Array.isArray(t) ? t : []).filter(th => th && typeof th.name === 'string' && th.name.trim()).map(th => ({ name: th.name, text: typeof th.text === 'string' ? th.text : (Array.isArray(th.lines) ? th.lines.join('\n') : '') }));
}
function saveThemes(l) { store.set('themes', l); }
function themeLimitReached() { return USER_PLAN === 'free' && getThemes().length >= THEME_LIMIT; }
function persistNow() {
  clearTimeout(saveTimer); saveTimer = null;
  const text = mainTextarea.value;
  if (activeTheme) {
    const l = getThemes(), th = l.find(t => t.name === activeTheme);
    if (th) { th.text = text; saveThemes(l); }
  } else store.set('lyricsText', text);
  $('#saveState').textContent = '✓ guardado';
}
function scheduleSave() {
  $('#saveState').textContent = '… guardando';
  clearTimeout(saveTimer); saveTimer = setTimeout(persistNow, 350);
}
window.addEventListener('beforeunload', () => { if (saveTimer) persistNow(); });
function renderThemes() {
  const themes = getThemes(), sel = $('#themeSelect');
  sel.innerHTML = '<option value="">— Borrador libre —</option>';
  themes.forEach(th => { const o = document.createElement('option'); o.value = th.name; o.textContent = th.name; sel.appendChild(o); });
  if (!themes.some(t => t.name === activeTheme)) activeTheme = null;
  sel.value = activeTheme || '';
  $('#themeLimitMsg').classList.toggle('hidden', !themeLimitReached());
  $('#btnRenameTheme').disabled = !activeTheme;
  $('#btnDeleteTheme').disabled = !activeTheme;
}
function loadTextIntoEditor(text) { mainTextarea.value = text || ''; mainTextarea.scrollTop = 0; refreshAll(false); }
$('#themeSelect').addEventListener('change', e => {
  persistNow();
  activeTheme = e.target.value || null;
  store.set('activeTheme', activeTheme);
  const th = activeTheme ? getThemes().find(t => t.name === activeTheme) : null;
  loadTextIntoEditor(th ? th.text : store.get('lyricsText', ''));
  renderThemes();
});
$('#btnNewTheme').addEventListener('click', () => {
  persistNow();
  if (themeLimitReached()) {
    $('#themeLimitMsg').classList.remove('hidden');
    alert('Límite de temas alcanzado.');
    return;
  }
  let name = prompt('Nombre del nuevo tema:'); if (name === null) return; name = name.trim().slice(0, 40);
  if (!name) { alert('Escribe un nombre para el tema.'); return; }
  if (getThemes().some(t => t.name.toLowerCase() === name.toLowerCase())) { alert('Ya existe un tema con ese nombre.'); return; }
  const l = getThemes(); l.push({ name, text: '' }); saveThemes(l);
  activeTheme = name; store.set('activeTheme', name);
  loadTextIntoEditor(''); renderThemes(); mainTextarea.focus();
});
$('#btnRenameTheme').addEventListener('click', () => {
  if (!activeTheme) return; const old = activeTheme;
  let name = prompt('Renombrar tema «' + old + '»:', old); if (name === null) return; name = name.trim().slice(0, 40);
  if (!name) { alert('El nombre no puede estar vacío.'); return; }
  const l = getThemes(), th = l.find(t => t.name === old); if (!th) return;
  if (l.some(t => t.name.toLowerCase() === name.toLowerCase() && t.name !== old)) { alert('Ya existe un tema con ese nombre.'); return; }
  th.name = name; th.text = mainTextarea.value; saveThemes(l);
  activeTheme = name; store.set('activeTheme', name); renderThemes();
});
$('#btnDeleteTheme').addEventListener('click', () => {
  if (!activeTheme) return; const old = activeTheme;
  if (!confirm('¿Borrar el tema «' + old + '»? Se perderá su letra.')) return;
  saveThemes(getThemes().filter(t => t.name !== old));
  activeTheme = null; store.set('activeTheme', null);
  loadTextIntoEditor(store.get('lyricsText', '')); renderThemes();
});

/* ---- Eventos del editor ---- */
let rhymeTimer = null;
function refreshAll(save = true) {
  updateGutter(); updateStats();
  clearTimeout(rhymeTimer); rhymeTimer = setTimeout(updateRhymes, 120);
  if (save) scheduleSave();
}
function onCaret() { highlightActiveLine(); clearTimeout(rhymeTimer); rhymeTimer = setTimeout(updateRhymes, 80); }
mainTextarea.addEventListener('input', () => refreshAll());
mainTextarea.addEventListener('scroll', syncScroll);
mainTextarea.addEventListener('click', onCaret);
mainTextarea.addEventListener('keyup', e => { if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key.startsWith('Page')) onCaret(); });
document.addEventListener('selectionchange', () => { if (document.activeElement === mainTextarea) highlightActiveLine(); });

$('#clearLyrics').addEventListener('click', () => {
  if (!mainTextarea.value || confirm('¿Limpiar todo el bloc de notas?')) { mainTextarea.value = ''; refreshAll(); mainTextarea.focus(); }
});
$('#copyLyrics').addEventListener('click', () => {
  const text = mainTextarea.value; if (!text) return;
  const done = () => { $('#copyLyrics').textContent = '✓ Copiado'; setTimeout(() => { $('#copyLyrics').textContent = '📋 Copiar'; }, 1800); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => { });
  else { mainTextarea.select(); document.execCommand('copy'); mainTextarea.setSelectionRange(0, 0); done(); }
});
$('#btnDownloadLyric').addEventListener('click', () => {
  const rows = mainTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
  if (!rows.length) { alert('El bloc está vacío.'); return; }
  const beat = baseMode === 'local' ? baseName : ($('#ytInput').value.trim() || 'sin beat');
  let out = 'FlowLab Studio · ' + (activeTheme || 'Letra') + '\nFecha: ' + new Date().toLocaleString('es-ES') +
    '\nBPM: ' + store.get('bpm', 90) + '\nBeat: ' + beat + '\n----------------------------------------\n\n';
  rows.forEach((line, i) => { out += (i + 1) + '. ' + line + '   (' + lineSyllables(line) + ' síl.)\n'; });
  out += '\n----------------------------------------\nLíneas: ' + rows.length + '\n';
  downloadBlob(new Blob([out], { type: 'text/plain;charset=utf-8' }), 'flowlab_letra_' + stamp() + '.txt');
});

/* =====================================================================
   02b · MOTOR DE RIMAS FONÉTICAS (sílaba tónica + seseo + b/v + ll/y)
   ===================================================================== */
const RHYME_WORDS = (
  'corazón pasión canción ilusión emoción razón misión visión prisión traición nación presión sensación revolución solución decisión ocasión rincón balcón montón perdón millón salón jabón cajón tiburón campeón león avión camión bastón ladrón patrón colchón telón cartón botón condición intención atención tentación conexión dirección generación oración función ' +
  'amar cantar soñar volar brillar luchar ganar llorar mirar bailar rimar rapear flotar olvidar pensar caminar gritar saltar llegar buscar lograr mar hogar altar lugar azar bar pilar collar estelar solar popular escapar respirar ' +
  'ser ver poder saber querer crecer correr volver perder nacer vencer comer beber tener hacer placer mujer ayer deber amanecer atardecer renacer taller ' +
  'vivir sentir decir subir salir morir seguir existir resistir escribir sufrir partir reír venir elixir porvenir sobrevivir ' +
  'verdad libertad ciudad realidad eternidad soledad humildad lealtad amistad maldad bondad oscuridad claridad sociedad ansiedad velocidad felicidad identidad habilidad voluntad edad mitad navidad tempestad vanidad ' +
  'amor dolor calor color sabor valor temor rencor honor terror error señor motor flor mejor peor rumor sudor clamor favor interior exterior tambor productor escritor ganador soñador luchador traidor ' +
  'dinero sincero guerrero primero entero sendero lucero cero acero verdadero extranjero compañero callejero rapero viajero quiero espero muero frontera bandera carrera quimera primavera espera madera escalera cualquiera afuera sincera guerrera ' +
  'pasado pecado lado soldado cuidado olvidado malvado dorado callado cansado enamorado guardado mirada nada jugada llegada entrada madrugada espada almohada cascada fachada temporada emboscada ' +
  'vida herida salida perdida querida medida caída partida comida bebida despedida sentido olvido latido ruido vestido perdido querido bandido prohibido elegido sonido partido nido marido gemido oído ' +
  'viento momento lamento talento cuento sentimiento pensamiento movimiento aliento cemento intento lento tormento invento juramento gente mente frente fuente puente diente serpiente presente valiente caliente corriente suficiente diferente cuenta tormenta menta venta lenta ' +
  'locura ternura amargura altura cultura tortura aventura dulzura basura figura hermosura cintura armadura criatura escritura censura segura pura oscura dura cura madura ' +
  'noche coche derroche reproche broche alma calma palma karma fama llama cama drama rama trama dama flama programa panorama ' +
  'poesía alegría melodía energía fantasía día mía cobardía valentía sinfonía armonía compañía policía osadía rebeldía agonía garantía ' +
  'rutina esquina cocina gasolina adrenalina cortina colina mina fina divina ruina neblina vitrina disciplina camino destino vino divino latino fino molino vecino sino padrino peregrino campesino clandestino ' +
  'belleza cabeza tristeza grandeza riqueza pobreza certeza pereza firmeza nobleza pureza fortaleza naturaleza cerveza destreza ' +
  'fuego juego luego ruego ciego llego entrego niego despego riego apego hombre nombre cumbre costumbre lumbre incertidumbre muchedumbre pesadumbre ' +
  'voz feroz veloz atroz precoz arroz luz cruz avestruz sol gol control farol alcohol español caracol rol girasol crisol ' +
  'final igual brutal mortal real total ideal normal señal cristal metal rival criminal animal ritual natural central portal global sal mal capital ' +
  'infierno invierno eterno moderno cuaderno gobierno tierno interno externo cielo suelo vuelo hielo duelo consuelo anhelo pelo velo modelo abuelo pañuelo desvelo caramelo ' +
  'sueño dueño pequeño empeño diseño ceño risueño año daño extraño engaño baño peldaño tamaño rebaño antaño ' +
  'gota nota rota derrota flota bota pelota mascota piloto foto roto moto devoto voto remoto terremoto ' +
  'viaje coraje mensaje paisaje salvaje lenguaje traje equipaje homenaje garaje personaje oleaje ' +
  'gigante diamante elegante brillante constante amante distante adelante instante cantante importante llanto canto santo manto tanto encanto quebranto espanto ' +
  'risa prisa brisa camisa sonrisa misa precisa hermoso peligroso poderoso famoso glorioso orgulloso nervioso misterioso precioso rosa cosa hermosa diosa mariposa preciosa prosa esposa ' +
  'imposible increíble invisible posible terrible horrible sensible invencible flexible visible irresistible vista pista artista conquista lista revista entrevista turista optimista realista ' +
  'abrazo pedazo flechazo trazo lazo plazo paso vaso caso ocaso acaso payaso atraso escaso nueve llueve mueve breve nieve leve prueba cueva nueva lleva eleva renueva ' +
  'ola sola bola cola consola solo polo grito mito infinito bonito maldito delito rito apetito bendito escrito distrito ' +
  'barrio calendario diario contrario salario rosario escenario millonario ordinario voluntario necesario comentario horario calle valle detalle sombra alfombra asombra nombra ' +
  'pena cadena escena arena condena sirena vena buena plena serena morena cena ajena veneno bueno trueno lleno freno terreno sereno pleno moreno ajeno ' +
  'luna cuna fortuna laguna ninguna alguna duna uno ninguno alguno ayuno oportuno desayuno futuro muro duro oscuro puro seguro apuro maduro conjuro ' +
  'jamás atrás demás compás quizás detrás más paz capaz disfraz después revés vez pez estrés inglés interés tres mes juez niñez vejez rapidez timidez ' +
  'aquí así allí feliz raíz nariz cicatriz matiz actriz aprendiz desliz maíz tú bambú menú Perú tabú hoy soy voy estoy doy convoy rey ley muy'
).split(/\s+/);

const STRONG = 'aeoáéóíú';
const isVow = c => 'aeiouáéíóúü'.includes(c);
function isMuteU(w, j) { return w[j] === 'u' && j > 0 && (w[j - 1] === 'q' || (w[j - 1] === 'g' && (w[j + 1] === 'e' || w[j + 1] === 'i'))); }
function vowelAt(w, j) {
  if (isMuteU(w, j)) return false;
  if (w[j] === 'y') return j === w.length - 1 && j > 0 && isVow(w[j - 1]);
  return isVow(w[j]);
}
function nuclei(w) {
  const res = []; let i = 0;
  while (i < w.length) {
    if (!vowelAt(w, i)) { i++; continue; }
    const run = []; let j = i;
    while (j < w.length && vowelAt(w, j)) run.push(j++);
    let cur = [run[0]];
    for (let k = 1; k < run.length; k++) {
      if (STRONG.includes(w[run[k - 1]]) && STRONG.includes(w[run[k]])) { res.push(cur); cur = [run[k]]; }
      else cur.push(run[k]);
    }
    res.push(cur); i = j;
  }
  return res;
}
function stressInfo(w) {
  const nu = nuclei(w); if (!nu.length) return null;
  let k = -1;
  for (let a = 0; a < nu.length && k < 0; a++) for (const p of nu[a]) if ('áéíóú'.includes(w[p])) { k = a; break; }
  if (k < 0) k = nu.length === 1 ? 0 : (/[aeiouns]$/.test(w) ? nu.length - 2 : nu.length - 1);
  const nuc = nu[k];
  let pos = nuc.find(p => STRONG.includes(w[p])); if (pos === undefined) pos = nuc[nuc.length - 1];
  return { nu, k, pos };
}
const stripAcc = s => s.replace(/ñ/g, '#').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/#/g, 'ñ');
function phon(s) {
  return stripAcc(s).replace(/ch/g, 'C').replace(/h/g, '').replace(/qu(?=[ei])/g, 'k').replace(/gu(?=[ei])/g, 'G')
    .replace(/g(?=[ei])/g, 'j').replace(/G/g, 'g').replace(/c(?=[ei])/g, 's').replace(/z/g, 's').replace(/[cq]/g, 'k')
    .replace(/v/g, 'b').replace(/ll/g, 'y').replace(/y$/, 'i').replace(/x/g, 'ks').replace(/w/g, 'u');
}
function rhymeKeys(word, forceLast) {
  const w = word.toLowerCase(), si = stressInfo(w);
  if (!si) return null;
  if (forceLast && si.k !== si.nu.length - 1) { // tónica en la última sílaba (palabras escritas sin tilde)
    si.k = si.nu.length - 1; const nuc = si.nu[si.k];
    si.pos = nuc.find(p => STRONG.includes(w[p])); if (si.pos === undefined) si.pos = nuc[nuc.length - 1];
  }
  const ending = w.slice(si.pos);
  let ason = stripAcc(w[si.pos] === 'y' ? 'i' : w[si.pos]);
  for (let a = si.k + 1; a < si.nu.length; a++) {
    const nuc = si.nu[a]; let p = nuc.find(q => STRONG.includes(w[q])); if (p === undefined) p = nuc[nuc.length - 1];
    ason += stripAcc(w[p] === 'y' ? 'i' : w[p]);
  }
  return { cons: phon(ending), ason, ending };
}
const RIDX = { cons: {}, ason: {} };
const RHYME_SET = new Set();
RHYME_WORDS.forEach(w => {
  const k = rhymeKeys(w); if (!k) return;
  RHYME_SET.add(stripAcc(w.toLowerCase()));
  (RIDX.cons[k.cons] = RIDX.cons[k.cons] || []).push(w);
  (RIDX.ason[k.ason] = RIDX.ason[k.ason] || []).push(w);
});
const dmCache = {};
let rhymeReq = 0;
function lastWordOfLine(line) {
  const m = line.match(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*$/);
  return m ? m[1] : '';
}
function updateRhymes() {
  const ln = cursorLine(), line = mainTextarea.value.split('\n')[ln] || '';
  const w = lastWordOfLine(line);
  $('#activeLineNum').textContent = line.trim() ? ln + 1 : '—';
  if (!w) {
    $('#lastWord').textContent = '—'; $('#lastEnding').textContent = '—';
    $('#rhymeChips').innerHTML = '<span class="hint">Escribe para ver rimas…</span>'; return;
  }
  const keys = rhymeKeys(w);
  if (!keys) { $('#rhymeChips').innerHTML = '<span class="hint">Palabra sin vocales.</span>'; return; }
  const mode = $('input[name=rhymeMode]:checked').value;
  $('#lastWord').textContent = '«' + w + '»';
  $('#lastEnding').textContent = mode === 'cons' ? '-' + keys.ending : keys.ason.split('').join('-');
  const self = stripAcc(w.toLowerCase());
  let out;
  if (mode === 'cons') out = (RIDX.cons[keys.cons] || []).filter(x => stripAcc(x.toLowerCase()) !== self);
  else {
    const cons = new Set(RIDX.cons[keys.cons] || []);
    const all = (RIDX.ason[keys.ason] || []).filter(x => stripAcc(x.toLowerCase()) !== self);
    out = all.filter(x => !cons.has(x)).concat(all.filter(x => cons.has(x)));
  }
  // Sin tilde y pocas rimas: prueba también como palabra aguda (corazon → corazón)
  if (out.length < 4 && !/[áéíóú]/i.test(w)) {
    const k2 = rhymeKeys(w, true);
    if (k2 && k2.cons !== keys.cons) {
      const extra = (mode === 'cons' ? RIDX.cons[k2.cons] : RIDX.ason[k2.ason]) || [];
      const seen = new Set(out);
      extra.forEach(x => { if (!seen.has(x) && stripAcc(x.toLowerCase()) !== self) out.push(x); });
      if (extra.length) $('#lastEnding').textContent = mode === 'cons' ? '-' + k2.ending : k2.ason.split('').join('-');
    }
  }
  out = out.slice(0, 24);
  renderRhymeChips(out, mode);
  // Respaldo online opcional (Datamuse) solo para rima consonante con pocas coincidencias
  if (mode === 'cons' && out.length < 6 && navigator.onLine) {
    const tail = stripAcc(w.toLowerCase()).slice(-3);
    if (!/^[a-zñ]{2,3}$/.test(tail)) return;
    const req = ++rhymeReq, got = new Set(out.map(x => stripAcc(x.toLowerCase())).concat([self]));
    const apply = words => {
      if (req !== rhymeReq) return;
      const extra = words.filter(x => { const kx = rhymeKeys(x); return kx && kx.cons === keys.cons && !got.has(stripAcc(x.toLowerCase())); }).slice(0, 24 - out.length);
      if (extra.length) renderRhymeChips(out.concat(extra), mode);
    };
    if (dmCache[tail]) { apply(dmCache[tail]); return; }
    // Tiempo límite de 3 s: si la red está lenta no se queda colgado esperando
    const ac = window.AbortController ? new AbortController() : null;
    const to = setTimeout(() => ac && ac.abort(), 3000);
    fetch('https://api.datamuse.com/words?sp=*' + encodeURIComponent(tail) + '&v=es&max=60', ac ? { signal: ac.signal } : undefined)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { dmCache[tail] = (Array.isArray(d) ? d : []).map(x => x && x.word).filter(x => typeof x === 'string' && /^[a-záéíóúüñ]{2,20}$/i.test(x)); apply(dmCache[tail]); })
      .catch(() => { dmCache[tail] = []; })
      .finally(() => clearTimeout(to));
  }
}
function renderRhymeChips(out, mode) {
  const box = $('#rhymeChips'); box.innerHTML = '';
  if (!out.length) { box.innerHTML = '<span class="hint">Sin rimas en el diccionario para esta terminación.</span>'; return; }
  out.forEach(r => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip' + (mode === 'ason' ? ' ass' : '');
    b.textContent = r; b.title = 'Insertar «' + r + '» al final de la línea activa';
    b.addEventListener('mousedown', e => e.preventDefault()); // conserva el cursor
    b.addEventListener('click', () => insertAtLineEnd(r));
    box.appendChild(b);
  });
}
function insertAtLineEnd(word) {
  const text = mainTextarea.value, ln = cursorLine(), lines = text.split('\n');
  let start = 0; for (let i = 0; i < ln; i++) start += lines[i].length + 1;
  const cur = lines[ln] || '', trimmed = cur.replace(/\s+$/, '');
  const ins = (trimmed ? ' ' : '') + word;
  lines[ln] = trimmed + ins;
  mainTextarea.value = lines.join('\n');
  const pos = start + lines[ln].length;
  mainTextarea.focus(); mainTextarea.setSelectionRange(pos, pos);
  refreshAll();
}
$$('input[name=rhymeMode]').forEach(r => r.addEventListener('change', updateRhymes));

/* ---- Dictado voz→texto (independiente de la grabación musical) ---- */
let recog = null, dictating = false;
function sttStatus(msg, cls) {
  const el = $('#sttStatus'); el.className = 'mic-status stt' + (cls ? ' ' + cls : '');
  el.innerHTML = 'Dictado voz→texto: <b></b>'; el.querySelector('b').textContent = msg;
}
function appendLyricLine(text) {
  const v = mainTextarea.value;
  mainTextarea.value = v + (v && !v.endsWith('\n') ? '\n' : '') + text;
  const end = mainTextarea.value.length;
  mainTextarea.setSelectionRange(end, end);
  mainTextarea.scrollTop = mainTextarea.scrollHeight;
  refreshAll();
}
let dictRestarts = 0, dictLastStart = 0;
function stopDictation() { if (dictating) { dictating = false; try { recog.stop(); } catch (e) { } } }
$('#btnDictate').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { sttStatus('no soportado (usa Chrome, Edge u Opera GX)', 'err'); return; }
  if (dictating) { stopDictation(); return; }
  if (window.School && School.isListening()) School.stopVoice(); // solo un reconocimiento a la vez
  if (!recog) {
    recog = new SR(); recog.lang = 'es-PE'; recog.continuous = true; recog.interimResults = true;
    recog.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i], t = r[0].transcript.trim();
        if (r.isFinal) { if (t) appendLyricLine(t); } else interim += t + ' ';
      }
      sttStatus(interim.trim() ? '“' + interim.trim() + '”' : 'escuchando…', 'live');
    };
    recog.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      // Sin permiso o sin micrófono: se apaga en vez de reintentar en bucle infinito
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) dictating = false;
      sttStatus(e.error === 'not-allowed' ? 'permiso de micrófono denegado' : 'error: ' + e.error, 'err');
    };
    recog.onend = () => {
      // Reinicio automático, con freno si se corta 5 veces seguidas en menos de 1 s (red caída)
      const quick = performance.now() - dictLastStart < 1000;
      dictRestarts = quick ? dictRestarts + 1 : 0;
      if (dictating && dictRestarts < 5) { try { dictLastStart = performance.now(); recog.start(); return; } catch (e) { } }
      const wasErr = dictating; dictating = false;
      if (wasErr) sttStatus('se detuvo (revisa tu conexión)', 'err'); else if (!$('#sttStatus').classList.contains('err')) sttStatus('inactivo');
      $('#btnDictate').textContent = '🗣 Dictar letra'; $('#btnDictate').classList.remove('on');
    };
  }
  try { dictLastStart = performance.now(); dictRestarts = 0; recog.start(); dictating = true; sttStatus('escuchando…', 'live'); $('#btnDictate').textContent = '■ Parar dictado'; $('#btnDictate').classList.add('on'); }
  catch (e) { sttStatus('no se pudo iniciar', 'err'); }
});

/* ---- Inicialización del editor ---- */
activeTheme = store.get('activeTheme', null);
renderThemes();
{
  const th = activeTheme ? getThemes().find(t => t.name === activeTheme) : null;
  mainTextarea.value = th ? th.text : store.get('lyricsText', '');
  refreshAll(false);
}

/* =====================================================================
   01b · PUENTE PARA LA ESCUELA DE FREESTYLE (freestyle-school.js)
   La escuela vive en su propio archivo; aquí solo le prestamos el reloj de
   audio, el metrónomo, la base y el motor de rimas (como un enchufe común).
   ===================================================================== */
const Studio = {
  ctx,
  now: () => ctx().currentTime,
  click(time, accent) {
    try {
      const c = ctx(), o = c.createOscillator(), g = c.createGain(), t = Math.max(time, c.currentTime);
      o.type = 'square'; o.frequency.value = accent ? 1500 : 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.08);
    } catch (e) { }
  },
  baseMode: () => baseMode,
  baseBuffer: () => (baseMode === 'local' ? baseBuffer : null),
  ytReady: () => baseMode === 'yt' && !!ytPlayer && ytReady,
  /* Arranca la base desde el inicio en el instante "at" (reloj de audio). */
  startBase(at) {
    stopAllPlayback();
    const c = ctx();
    if (baseMode === 'local' && baseBuffer) {
      const src = c.createBufferSource(); src.buffer = baseBuffer; src.loop = true;
      const g = c.createGain(); g.gain.value = gBase();
      src.connect(g); g.connect(playBus); src.start(at, 0);
      pb = { kind: 'base', sources: [src], t0: at, offset: 0, baseGain: g };
      return 'local';
    }
    if (baseMode === 'yt' && ytPlayer && ytReady) { try { ytPlayer.seekTo(0, true); ytPlayer.playVideo(); return 'yt'; } catch (e) { } }
    return null;
  },
  stopBase() {
    if (pb && pb.kind === 'base') stopAllPlayback();
    if (baseMode === 'yt' && ytPlayer && ytReady && ytPlaying) { try { ytPlayer.pauseVideo(); } catch (e) { } }
  },
  rhymeKeys, stripAcc,
  rhymeWords: RHYME_WORDS.slice(),
  /* Parte 3: carga un beat armado en el modo Beats como Pista 1 (base), con bucle */
  setBeatBase(buf, name) {
    if (recording || !buf || !buf.length) return false;
    stopAllPlayback();
    baseBuffer = buf; baseName = String(name || 'Mi beat').slice(0, 80); basePeaks = computePeaks(buf, 2400); baseLoop = true;
    baseOrig = buf; baseFromBeat = true; resetEdit();
    setBaseMode('local');
    return true;
  },
  baseIsBeat: () => baseMode === 'local' && baseFromBeat,
  registerBeatTrack(t) { beatTrack = t; tlInvalidate(); },
  tlRefresh: () => tlInvalidate(),
  setBeatLane(on) { setBeatLane(on); },
  encodeWav, downloadBlob, stamp,
  stopDictation: () => stopDictation(),
  stopAll() { stopAllPlayback(); if (ytPlayer && ytReady && ytPlaying) { try { ytPlayer.pauseVideo(); } catch (e) { } } },
  isRecording: () => recording,
  ocupado: () => !!(recording || recStarting || recStopping || pb),   // grabando o sonando algo: no se recarga la página
  esIOS: () => esIOSapp,
  /* iPhone: el reconocimiento de voz de la Escuela y el micrófono de la cabina se pelean por el mismo micrófono.
     Esto cierra el de la cabina (si no está grabando); "Grabar" lo vuelve a abrir solo. */
  soltarMic() {
    if (recording || recStarting || recStopping) return false;
    if (!micStream) return true;
    try { micStream.getTracks().forEach(t => t.stop()); } catch (e) { }
    try { if (chain && chain.micSrc) chain.micSrc.disconnect(); } catch (e) { }
    if (chain) chain.micSrc = null;
    micStream = null; micLog('micrófono soltado para el reconocimiento de voz de la Escuela');
    micStatus('', 'en pausa · se vuelve a abrir al grabar');
    return true;
  },
  audioSession,
  ctxState: () => (actx ? actx.state : 'none')
};
window.Studio = Studio;

/* =====================================================================
   03 · CABINA VOCAL
   Mic → HPF 85 → EQ (warm/presence/air) → AudioWorklet (gate·YIN·PSOLA)
       → chorus → compresor → limitador → [monitoreo + reverb] / [grabador PCM]
   ===================================================================== */
const SCALES = {
  'A min': { root: 45, ints: [0, 2, 3, 5, 7, 8, 10] }, 'C maj': { root: 48, ints: [0, 2, 4, 5, 7, 9, 11] },
  'C min': { root: 48, ints: [0, 2, 3, 5, 7, 8, 10] }, 'D min': { root: 50, ints: [0, 2, 3, 5, 7, 8, 10] },
  'E min': { root: 52, ints: [0, 2, 3, 5, 7, 8, 10] }, 'F maj': { root: 53, ints: [0, 2, 4, 5, 7, 9, 11] },
  'G maj': { root: 55, ints: [0, 2, 4, 5, 7, 9, 11] }, 'G min': { root: 55, ints: [0, 2, 3, 5, 7, 8, 10] }
};
const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const EQS = {
  neutral: { warm: 0, presence: 2.5, air: 0 }, bright: { warm: -1, presence: 3, air: 4 },
  warm: { warm: 3, presence: 1.5, air: -1.5 }, presence: { warm: 0, presence: 5, air: 2 }
};
const PRESETS = {
  trap: { tune: true, retune: 95, shift: 0, eq: 'bright', rev: 18, chorus: 0 },
  calitune: { tune: true, retune: 65, shift: 0, eq: 'warm', rev: 28, chorus: 0 },
  evolver: { tune: true, retune: 85, shift: 0, eq: 'presence', rev: 32, chorus: 0 },
  bonny: { tune: true, retune: 60, shift: 2, eq: 'neutral', rev: 22, chorus: 0 },
  disco: { tune: true, retune: 80, shift: 0, eq: 'bright', rev: 30, chorus: 0.35 },
  raw: { tune: false, retune: 0, shift: 0, eq: 'neutral', rev: 0, chorus: 0 }
};
let chain = null, chainBuilding = null, micStream = null, workletOK = false;
let fxState = { eq: 'neutral', chorus: 0, preset: null };

function micStatus(cls, msg) {
  const el = $('#micStatus'); el.className = 'mic-status' + (cls ? ' ' + cls : '');
  el.innerHTML = 'Micrófono: <b></b>'; el.querySelector('b').textContent = msg;
}
function buildChain() {
  if (chain) return Promise.resolve(chain);
  if (chainBuilding) return chainBuilding;
  chainBuilding = (async () => {
    const c = ctx();
    try {
      if (!c.audioWorklet) throw new Error('sin AudioWorklet');
      await c.audioWorklet.addModule('/js/autotune-worklet.js');
      workletOK = true;
    } catch (e) {
      workletOK = false;
      console.warn('AudioWorklet no disponible:', e);
      $('#serverWarn').classList.remove('hidden');
    }
    const n = {};
    const mono = node => { node.channelCount = 1; node.channelCountMode = 'explicit'; node.channelInterpretation = 'speakers'; return node; };
    n.micGain = c.createGain();
    n.hp = mono(c.createBiquadFilter()); n.hp.type = 'highpass'; n.hp.frequency.value = 85; n.hp.Q.value = 0.707;
    n.warm = c.createBiquadFilter(); n.warm.type = 'lowshelf'; n.warm.frequency.value = 220;
    n.presence = c.createBiquadFilter(); n.presence.type = 'peaking'; n.presence.frequency.value = 3500; n.presence.Q.value = 1.1;
    n.air = c.createBiquadFilter(); n.air.type = 'highshelf'; n.air.frequency.value = 9000;
    if (workletOK) {
      n.tune = new AudioWorkletNode(c, 'autotune-processor', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit' });
      n.tune.port.onmessage = e => showPitch(e.data && e.data.f);
    } else n.tune = c.createGain();
    // Chorus ligero (Very Disco)
    n.chIn = c.createGain(); n.chDry = c.createGain();
    n.chDelay = c.createDelay(0.05); n.chDelay.delayTime.value = 0.018;
    n.chLfo = c.createOscillator(); n.chLfo.frequency.value = 0.9;
    n.chDepth = c.createGain(); n.chDepth.gain.value = 0.0025;
    n.chWet = c.createGain(); n.chWet.gain.value = 0;
    n.chLfo.connect(n.chDepth); n.chDepth.connect(n.chDelay.delayTime); n.chLfo.start();
    n.comp = c.createDynamicsCompressor();
    n.limit = c.createDynamicsCompressor();
    n.limit.threshold.value = -1; n.limit.knee.value = 0; n.limit.ratio.value = 20; n.limit.attack.value = 0.002; n.limit.release.value = 0.08;
    n.out = c.createGain();
    n.micGain.connect(n.hp); n.hp.connect(n.warm); n.warm.connect(n.presence); n.presence.connect(n.air); n.air.connect(n.tune);
    n.tune.connect(n.chIn); n.chIn.connect(n.chDry); n.chIn.connect(n.chDelay); n.chDelay.connect(n.chWet);
    n.chDry.connect(n.comp); n.chWet.connect(n.comp); n.comp.connect(n.limit); n.limit.connect(n.out);
    // Monitoreo (con reverb solo de escucha; la grabación queda seca)
    n.liveAnalyser = c.createAnalyser(); n.liveAnalyser.fftSize = 2048;
    n.monGain = c.createGain(); n.monGain.gain.value = 0;
    n.revSend = c.createGain(); n.conv = c.createConvolver(); n.conv.buffer = getIR(c.sampleRate);
    n.out.connect(n.liveAnalyser); n.out.connect(n.monGain);
    n.out.connect(n.revSend); n.revSend.connect(n.conv); n.conv.connect(n.monGain);
    n.monGain.connect(c.destination);
    // Grabador PCM exacto al frame (o MediaRecorder de respaldo)
    if (workletOK) {
      n.rec = new AudioWorkletNode(c, 'pcm-recorder', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit' });
      n.recSink = c.createGain(); n.recSink.gain.value = 0;
      n.out.connect(n.rec); n.rec.connect(n.recSink); n.recSink.connect(c.destination);
      n.rec.port.onmessage = onRecMsg;
    } else {
      n.mediaDest = c.createMediaStreamDestination(); n.out.connect(n.mediaDest);
    }
    if (workletOK) {   // contador de fotogramas del micrófono (para el diagnóstico)
      try {
        n.meter = new AudioWorkletNode(c, 'mic-meter', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit' });
        n.meterSink = c.createGain(); n.meterSink.gain.value = 0; n.meter.connect(n.meterSink); n.meterSink.connect(c.destination);
        n.meter.port.onmessage = e => { const m = e.data || {}; if (m.stat) { micStat.push(Object.assign({ recv: performance.now() }, m.stat)); if (micStat.length > 8) micStat.shift(); } };
      } catch (e) { n.meter = null; }
    }
    chain = n;
    applyParams();
    return n;
  })();
  return chainBuilding;
}
/* =====================================================================
   MICRÓFONO (Mejoras 5 · A) — pensado para el iPhone, donde el permiso se concede pero a veces "no entra sonido"
   Orden: 1) pedir el micrófono dentro del toque del usuario · 2) recién ahí armar la cadena de audio ·
          3) reanudar el audio (en iPhone queda "suspended"/"interrupted") y vigilarlo · 4) medir de verdad si entra señal
   ===================================================================== */
let micMode = 'avanzado', micAnalyser = null, micStat = [], lastRecStat = null, shadow = null, recWatch = 0, micTesting = false, micLast = null;
const micLogBuf = [];
const esIOSapp = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function micLog(m) { micLogBuf.push((performance.now() / 1000).toFixed(1) + ' s · ' + m); if (micLogBuf.length > 40) micLogBuf.shift(); }
const MIC_AVANZADO = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } };
async function pedirMic(simple) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new TypeError('este navegador no tiene getUserMedia');
  if (simple) { micMode = 'simple'; return navigator.mediaDevices.getUserMedia({ audio: true }); }
  try { micMode = 'avanzado'; return await navigator.mediaDevices.getUserMedia(MIC_AVANZADO); }
  catch (err) {
    // Si el permiso se negó o no hay micrófono, no tiene caso insistir; si fueron las opciones avanzadas, se reintenta con las simples
    if (err && /NotAllowed|Security|PermissionDenied|NotFound/.test(err.name)) throw err;
    micLog('opciones avanzadas fallaron (' + (err && err.name) + '): reintento con { audio: true }');
    micMode = 'simple'; return navigator.mediaDevices.getUserMedia({ audio: true });
  }
}
function vigilarAudio() {
  if (actx.__vigilado) return; actx.__vigilado = true;
  actx.addEventListener('statechange', () => {
    micLog('AudioContext → ' + actx.state);
    if (actx.state === 'suspended' || actx.state === 'interrupted') actx.resume().catch(() => { });   // si el sistema lo duerme, se despierta otra vez
  });
}
async function reanudarAudio() {
  try { await actx.resume(); micLog('reanudar audio → ' + actx.state); }   // se pide siempre: si ya corría, no hace nada
  catch (e) { micLog('no se pudo reanudar: ' + (e && e.name)); }
}
function conectarMic(stream) {
  try { if (chain.micSrc) chain.micSrc.disconnect(); } catch (e) { }
  chain.micSrc = actx.createMediaStreamSource(stream);
  chain.micSrc.connect(chain.micGain);
  micAnalyser = actx.createAnalyser(); micAnalyser.fftSize = 2048;       // medidor de nivel (prueba del micrófono)
  chain.micSrc.connect(micAnalyser);
  if (chain.meter) chain.micSrc.connect(chain.meter);                     // cuenta los fotogramas que de verdad llegan
  stream.getAudioTracks().forEach(tr => {
    tr.addEventListener('mute', () => micLog('la pista del micrófono se silenció (muted=true)'));
    tr.addEventListener('unmute', () => micLog('la pista del micrófono volvió a sonar'));
    // Si desconectan el micrófono (o el sistema lo libera), se detiene todo de forma ordenada
    tr.addEventListener('ended', () => {
      micLog('la pista del micrófono terminó (ended)');
      if (recording) stopRecording();
      try { chain.micSrc.disconnect(); } catch (e) { }
      chain.micSrc = null; micStream = null;
      micStatus('err', 'micrófono desconectado · pulsa Grabar para reconectar');
      applyParams();
    });
  });
}
async function ensureMic() {
  if (micStream && micStream.getAudioTracks().some(t => t.readyState === 'live')) return true;
  micStream = null;
  ctx();                                   // dentro del toque del usuario: crea y reanuda el audio
  let stream;
  try { stream = await pedirMic(false); }  // 1) PRIMERO el permiso del micrófono
  catch (err) {
    micLog('micrófono NO concedido: ' + (err && err.name));
    micStatus('err', 'permiso denegado o no disponible (' + (err && err.name || 'error') + ')');
    micProblem(err);
    return false;
  }
  micLog('micrófono concedido (opciones ' + micMode + ')');
  micStream = stream;
  try { await buildChain(); } catch (e) { micLog('la cadena de audio falló: ' + (e && e.message)); }   // 2) DESPUÉS se arma la cadena
  vigilarAudio(); await reanudarAudio();   // 3) y se reanuda el audio (iPhone lo deja dormido al abrir el micrófono)
  conectarMic(stream);
  micStatus('', 'activo' + (workletOK ? ' · Auto-Tune listo' : ' · modo voz limpia (sin AudioWorklet)'));
  micProblem(null);
  applyParams();
  return true;
}
/* Reintento con opciones simples: cierra el micrófono y lo vuelve a pedir con { audio: true } */
async function reabrirMicSimple() {
  micLog('reintento: se cierra el micrófono y se pide con { audio: true }');
  try { if (micStream) micStream.getTracks().forEach(t => t.stop()); } catch (e) { }
  micStream = null;
  let stream;
  try { stream = await pedirMic(true); } catch (err) { micLog('el reintento falló: ' + (err && err.name)); micProblem(err); return false; }
  micStream = stream; await buildChain(); await reanudarAudio(); conectarMic(stream);
  micStatus('', 'activo · opciones simples');
  return true;
}
const dB = v => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : '−∞') + ' dBFS';
function ultimoSegundo() {
  const t = performance.now(), v = micStat.filter(s => t - s.recv < 1100);
  return { llegaron: v.reduce((a, s) => a + (s.calls || 0), 0), conSenal: v.reduce((a, s) => a + (s.live || 0), 0), hay: !!chain && !!chain.meter };
}
/* Escucha el micrófono unos segundos con un AnalyserNode y mueve el medidor */
function medirMic(ms) {
  return new Promise(res => {
    const buf = new Float32Array(2048), t0 = performance.now(), lv = $('#micLevel'), box = $('#micMeterBox'); let peak = 0, rmsMax = 0, nivel = 0;
    const tick = () => {
      if (!micAnalyser) { res({ peak: 0, rms: 0 }); return; }
      micAnalyser.getFloatTimeDomainData(buf);
      let p = 0, s = 0; for (let i = 0; i < buf.length; i++) { const a = Math.abs(buf[i]); if (a > p) p = a; s += buf[i] * buf[i]; }
      const rms = Math.sqrt(s / buf.length); if (p > peak) peak = p; if (rms > rmsMax) rmsMax = rms;
      const pct = Math.min(100, Math.max(0, (20 * Math.log10(Math.max(p, 1e-5)) + 60) / 60 * 100));   // −60 dBFS = 0 %, 0 dBFS = 100 %
      nivel = Math.max(pct, nivel - 4);   // la barra sube de golpe y baja despacio, para que se vea aunque el sonido sea corto
      lv.style.width = nivel.toFixed(0) + '%'; box.setAttribute('aria-valuenow', nivel.toFixed(0));
      if (performance.now() - t0 < ms) requestAnimationFrame(tick); else { lv.style.width = '0%'; res({ peak, rms: rmsMax }); }
    };
    tick();
  });
}
function textoDiagnostico() {
  const L = [], tr = micStream && micStream.getAudioTracks()[0], uno = ultimoSegundo(), ctxo = actx;
  L.push('FlowLab · diagnóstico del micrófono · ' + new Date().toLocaleString('es-ES'));
  L.push('Equipo: ' + navigator.userAgent);
  L.push('Pantalla táctil: ' + (matchMedia('(pointer:coarse)').matches ? 'sí' : 'no') + ' · iOS detectado: ' + (esIOSapp ? 'sí' : 'no'));
  L.push('AudioContext: ' + (ctxo ? ctxo.state + ' · ' + ctxo.sampleRate + ' Hz · baseLatency ' + (+ctxo.baseLatency || 0).toFixed(3) + ' s · outputLatency ' + (+ctxo.outputLatency || 0).toFixed(3) + ' s' : 'no creado todavía'));
  L.push('audioSession.type: ' + (navigator.audioSession ? navigator.audioSession.type : 'no existe en este navegador'));
  L.push('AudioWorklet cargó: ' + (chain ? (workletOK ? 'sí' : 'NO (modo voz limpia)') : 'la cadena aún no se armó'));
  L.push('Opciones del micrófono: ' + micMode);
  if (tr) {
    L.push('Pista: ' + (tr.label || '(sin nombre)') + ' · readyState=' + tr.readyState + ' · muted=' + tr.muted + ' · enabled=' + tr.enabled);
    let st = {}; try { st = tr.getSettings(); } catch (e) { }
    L.push('Ajustes: ' + JSON.stringify(st));
  } else L.push('Pista: el micrófono no está abierto');
  L.push('Fotogramas de audio en el último segundo: ' + (uno.hay ? uno.llegaron + ' (con señal: ' + uno.conSenal + ')' : 'sin contador (no hay worklet)'));
  if (micLast) L.push('Última prueba: pico ' + dB(micLast.peak) + ' · rms ' + dB(micLast.rms) + ' · resultado: ' + micLast.res);
  L.push('Modo de grabación: ' + (workletOK ? 'normal (worklet)' : 'MediaRecorder') + (shadow ? ' · respaldo activo' : ''));
  L.push('Base: ' + baseMode + ' · Grabando: ' + recording);
  L.push('Sucesos recientes:'); micLogBuf.slice(-14).forEach(x => L.push('  ' + x));
  return L.join('\n');
}
function mostrarDiag() { $('#micDiag').textContent = textoDiagnostico(); }
async function probarMic() {
  if (micTesting || recording) { if (recording) $('#micTestMsg').textContent = 'Detén la grabación antes de probar el micrófono.'; return; }
  micTesting = true;
  const msg = $('#micTestMsg'), btn = $('#btnMicTest'); btn.disabled = true; msg.className = 'mic-test-msg';
  const decir = (t, mal) => { msg.textContent = t; msg.classList.toggle('bad', !!mal); };
  try {
    audioSession('play-and-record');
    micLog('prueba del micrófono');
    decir('Pidiendo el micrófono… si el teléfono pregunta, toca "Permitir".');
    if (!(await ensureMic())) { micLast = { peak: 0, rms: 0, res: 'no se pudo abrir el micrófono' }; decir('⚠️ No se pudo abrir el micrófono. Mira el aviso naranja de arriba: dice cómo permitirlo.', true); return; }
    decir('🎙 Habla ahora: di "hola, hola, probando" durante 4 segundos…');
    let r = await medirMic(4000);
    if (r.peak < 0.005) {   // sin señal: segundo intento con opciones simples
      decir('No entró sonido. Probando otra vez con opciones más simples… habla 4 segundos más.');
      if (await reabrirMicSimple()) r = await medirMic(4000);
    }
    const ok = r.peak >= 0.005;
    micLast = { peak: r.peak, rms: r.rms, res: ok ? 'se oye la voz' : 'abierto pero sin señal' };
    micLog('prueba: pico ' + dB(r.peak) + ' → ' + micLast.res);
    if (ok) decir('✅ Se oye tu voz (pico ' + dB(r.peak) + '). Ya puedes grabar.');
    else decir('⚠️ El micrófono está abierto pero no entra sonido. Causas probables: (1) otra app lo está usando (una llamada, un video, otra pestaña); (2) el permiso del sitio está en "Preguntar" o "Denegado" (Ajustes → Safari → Micrófono); (3) el modo silencio o el volumen; (4) el navegador integrado de otra app: abre la web en Safari o Chrome. Toca "Copiar diagnóstico" y pégamelo en el chat.', true);
  } catch (e) {
    console.error(e); micLog('la prueba falló: ' + (e && e.message)); decir('⚠️ La prueba falló: ' + (e && e.message), true);
  } finally {
    if (!recording) audioSession('playback');
    btn.disabled = false; micTesting = false; mostrarDiag();
    if (esIOSapp && baseMode === 'yt') micAviso('En iPhone el audio de YouTube y el micrófono pueden pelear. Para grabar desde el celular conviene una base hecha en Beats o un MP3/WAV.');
  }
}
async function copiarDiagnostico() {
  const t = textoDiagnostico(); $('#micDiag').textContent = t; const msg = $('#micTestMsg');
  try { await navigator.clipboard.writeText(t); msg.textContent = '📋 Diagnóstico copiado. Pégalo en el chat con Claude.'; msg.classList.remove('bad'); return; } catch (e) { /* sin portapapeles: se usa el método viejo */ }
  try {
    const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length); const ok = document.execCommand('copy'); ta.remove();
    if (ok) { msg.textContent = '📋 Diagnóstico copiado. Pégalo en el chat con Claude.'; msg.classList.remove('bad'); return; }
  } catch (e) { }
  $('#micDiagBox').open = true;
  msg.textContent = 'No pude copiarlo solo. Mantén pulsado el texto de abajo, elige "Seleccionar todo" y "Copiar".'; msg.classList.add('bad');
}
{ const b = $('#btnMicTest'); if (b) b.addEventListener('click', probarMic); const c = $('#btnMicCopy'); if (c) c.addEventListener('click', copiarDiagnostico); }

/* ---- Plan B al grabar: MediaRecorder directo sobre el micrófono (en iPhone, audio/mp4) ---- */
function startShadow() {
  if (shadow || !micStream || !window.MediaRecorder) return false;
  const lista = esIOSapp ? ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']; let mime = '';
  lista.forEach(m => { if (!mime && MediaRecorder.isTypeSupported(m)) mime = m; });
  try {
    const mr = new MediaRecorder(micStream, mime ? { mimeType: mime } : undefined), sh = { mr, chunks: [], t0: actx.currentTime, mime };
    mr.ondataavailable = e => { if (e.data && e.data.size) sh.chunks.push(e.data); };
    mr.start(250); shadow = sh; micLog('respaldo MediaRecorder iniciado (' + (mr.mimeType || mime || '?') + ')'); return true;
  } catch (e) { micLog('el respaldo no pudo iniciar: ' + (e && e.message)); return false; }
}
function senalDe(chunks) { let m = 0; for (const c of chunks) for (let i = 0; i < c.length; i += 3) { const a = Math.abs(c[i]); if (a > m) m = a; } return m; }
function descartarShadow() { if (!shadow) return; const s = shadow; shadow = null; try { s.mr.ondataavailable = null; s.mr.stop(); } catch (e) { } }
async function cerrarShadow() {
  if (!shadow) return null; const s = shadow; shadow = null;
  await new Promise(res => { s.mr.onstop = res; try { s.mr.stop(); } catch (e) { res(); } setTimeout(res, 2500); });
  if (!s.chunks.length) return null;
  const dec = await actx.decodeAudioData(await new Blob(s.chunks, { type: s.mr.mimeType || s.mime || 'audio/webm' }).arrayBuffer());
  const pad = Math.round(Math.max(0, s.t0 - (recInfo ? recInfo.at : s.t0)) * dec.sampleRate), out = new AudioBuffer({ length: pad + dec.length, numberOfChannels: 1, sampleRate: dec.sampleRate });
  const d = out.getChannelData(0), n = dec.numberOfChannels;   // a mono, con el silencio de lo que tardó en arrancar
  for (let c = 0; c < n; c++) { const x = dec.getChannelData(c); for (let i = 0; i < x.length; i++) d[pad + i] += x[i] / n; }
  return out;
}
/* A 1 segundo de grabar: si el grabador normal no recibe fotogramas o solo ceros, se enciende el respaldo */
function vigilarGrabacion() {
  if (!recording || shadow) return;
  const s = lastRecStat, viejo = !s || performance.now() - s.recv > 800;
  if (viejo || !s.frames || s.peak < 1e-6) {
    micLog('el grabador normal no recibe sonido (' + (viejo ? 'sin fotogramas' : 'solo ceros') + '): se enciende el respaldo');
    reanudarAudio();
    if (startShadow()) micStatus('rec', '● grabando · modo de respaldo activo');
  }
}
/* Avisos amables (naranja) bajo el estado del micrófono */
function micAviso(texto) { const box = $('#micNotice'); if (!box) return; $('#micNoticeText').textContent = texto; box.classList.remove('hidden'); }

/* Aviso amable cuando el micrófono no se puede usar: dice qué pasó y cómo arreglarlo, en palabras simples */
function micProblem(err) {
  const box = $('#micNotice'); if (!box) return;
  if (!err) { box.classList.add('hidden'); return; }
  const n = (err && err.name) || '';
  let msg;
  if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') {
    msg = 'Todavía no podemos escucharte: el micrófono está bloqueado. Toca el candado 🔒 junto a la dirección (en el celular: menú ⋮ → Configuración del sitio), elige Micrófono → Permitir y vuelve a tocar REC. Mientras tanto, los beats y la Escuela funcionan sin micrófono.';
  } else if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError') {
    msg = 'No encontramos ningún micrófono. Conecta unos audífonos con micrófono (o revisa el del teléfono) y vuelve a tocar REC.';
  } else if (n === 'NotReadableError' || n === 'AbortError' || n === 'TrackStartError') {
    msg = 'Otra app está usando el micrófono (una llamada o un video). Ciérrala y vuelve a tocar REC.';
  } else {
    msg = 'Este navegador no deja usar el micrófono aquí. Abre FlowLab desde su dirección https:// en Chrome o Safari actualizado y vuelve a tocar REC.';
  }
  $('#micNoticeText').textContent = msg;
  box.classList.remove('hidden');
}
{ const x = $('#micNoticeClose'); if (x) x.addEventListener('click', () => $('#micNotice').classList.add('hidden')); }
function tuneLatency() {
  if (!workletOK || !actx) return 0;
  return ($('#tuneOn').checked || +$('#sShift').value !== 0) ? Math.round(actx.sampleRate * 0.03) / actx.sampleRate : 0;
}
/* Lo que tarda la voz en llegar desde el micrófono al grabador. Chrome lo informa en getSettings().latency;
   Safari y otros no, así que se usa 30 ms (valor típico de un micrófono de escritorio, medido con el micrófono simulado).
   Con el deslizador "Sincronizar voz" se corrige el resto a oído. */
function micInLatency() {
  let l = 0;
  try { const tr = micStream && micStream.getAudioTracks()[0]; l = tr ? +tr.getSettings().latency : 0; } catch (e) { }
  return (l > 0.002 && l < 0.4) ? l : 0.03;
}
function revLevel() { return +$('#sRev').value / 100; }

function applyParams() {
  const tuneOn = $('#tuneOn').checked, rs = +$('#sTune').value, sh = +$('#sShift').value;
  $('#tuneOnLbl').textContent = tuneOn ? 'ON' : 'OFF';
  $('#valTune').textContent = rs + '%';
  $('#valShift').textContent = (sh > 0 ? '+' : '') + sh + ' st';
  $('#valMicGain').textContent = $('#sMicGain').value + '%';
  $('#valRev').textContent = $('#sRev').value + '%';
  $('#valCmp').textContent = $('#sCmp').value + '%';
  $('#valMon').textContent = $('#sMon').value + '%';
  // Guardado diferido: mientras arrastras un slider no se escribe 60 veces por segundo
  clearTimeout(applyParams.saveT);
  applyParams.saveT = setTimeout(() => store.set('vocal', {
    tune: tuneOn, retune: rs, shift: sh, scale: $('#scaleSel').value, mic: +$('#sMicGain').value,
    rev: +$('#sRev').value, cmp: +$('#sCmp').value, mon: +$('#sMon').value, eq: fxState.eq, chorus: fxState.chorus, preset: fxState.preset
  }), 300);
  if (!chain) return;
  const t = actx.currentTime;
  if (workletOK) chain.tune.port.postMessage({ autotune: tuneOn, retune: rs / 100, shift: sh, scale: SCALES[$('#scaleSel').value] || SCALES['A min'], gateDb: -52 });
  chain.micGain.gain.setTargetAtTime(+$('#sMicGain').value / 100, t, 0.02);
  const cp = +$('#sCmp').value / 100;
  chain.comp.threshold.value = -6 - cp * 30; chain.comp.ratio.value = 1 + cp * 7;
  chain.comp.knee.value = 8 + cp * 16; chain.comp.attack.value = 0.004; chain.comp.release.value = 0.18;
  const eq = EQS[fxState.eq] || EQS.neutral;
  chain.warm.gain.setTargetAtTime(eq.warm, t, 0.03);
  chain.presence.gain.setTargetAtTime(eq.presence, t, 0.03);
  chain.air.gain.setTargetAtTime(eq.air, t, 0.03);
  chain.chWet.gain.setTargetAtTime(fxState.chorus, t, 0.03);
  chain.chDry.gain.setTargetAtTime(1 - fxState.chorus * 0.4, t, 0.03);
  chain.revSend.gain.setTargetAtTime(revLevel() * 0.7, t, 0.03);
  const mon = $('#liveMonitor').checked && micStream ? +$('#sMon').value / 100 : 0;
  chain.monGain.gain.setTargetAtTime(mon, t, 0.02);
}
['sTune', 'sShift', 'sMicGain', 'sRev', 'sCmp', 'sMon'].forEach(id => $('#' + id).addEventListener('input', applyParams));
$('#sRev').addEventListener('input', () => { if (pb && pb.voiceFx && pb.voiceFx.rev) pb.voiceFx.rev.gain.value = revLevel() * 0.7; });
$('#scaleSel').addEventListener('change', applyParams);
$('#tuneOn').addEventListener('change', applyParams);
if (matchMedia('(pointer:coarse)').matches) $('#liveMonitor').checked = false;   // en el celular "Escucharme en vivo" empieza apagado (si no, el parlante se acopla con el micrófono)
$('#liveMonitor').addEventListener('change', async e => {
  if (e.target.checked) { stopAllPlayback(); if (!micStream) await ensureMic(); }
  applyParams();
});
function turnOffMonitor() { if ($('#liveMonitor').checked) { $('#liveMonitor').checked = false; applyParams(); } }

function applyPreset(key) {
  const p = PRESETS[key]; if (!p) return;
  $('#tuneOn').checked = p.tune; $('#sTune').value = p.retune; $('#sShift').value = p.shift; $('#sRev').value = p.rev;
  fxState.eq = p.eq; fxState.chorus = p.chorus; fxState.preset = key;
  $$('.preset-card').forEach(c => c.classList.toggle('active', c.dataset.preset === key));
  applyParams();
}
$('#presetCards').addEventListener('click', e => { const card = e.target.closest('.preset-card'); if (card) applyPreset(card.dataset.preset); });
$('#resetKnobs').addEventListener('click', () => {
  $('#tuneOn').checked = false; $('#sTune').value = 50; $('#sShift').value = 0; $('#sMicGain').value = 100;
  $('#sRev').value = 20; $('#sCmp').value = 55; $('#sMon').value = 80;
  fxState = { eq: 'neutral', chorus: 0, preset: null };
  $$('.preset-card').forEach(c => c.classList.remove('active'));
  applyParams();
});
(function initVocal() {
  const v = store.get('vocal', null);
  if (v) {
    $('#tuneOn').checked = !!v.tune; $('#sTune').value = v.retune ?? 50; $('#sShift').value = v.shift ?? 0;
    if (SCALES[v.scale]) $('#scaleSel').value = v.scale;
    $('#sMicGain').value = v.mic ?? 100; $('#sRev').value = v.rev ?? 20; $('#sCmp').value = v.cmp ?? 55; $('#sMon').value = v.mon ?? 80;
    fxState = { eq: EQS[v.eq] ? v.eq : 'neutral', chorus: +v.chorus || 0, preset: v.preset || null };
    $$('.preset-card').forEach(c => c.classList.toggle('active', c.dataset.preset === fxState.preset));
  }
  applyParams();
})();

/* ---- Lectura de tono (desde el worklet) ---- */
function showPitch(f) {
  if (!f || f <= 0) { $('#noteName').textContent = '—'; $('#noteFreq').textContent = '—'; $('#noteScale').textContent = '—'; return; }
  const midi = Math.round(69 + 12 * Math.log2(f / 440));
  const sc = SCALES[$('#scaleSel').value] || SCALES['A min'];
  const pc = ((midi % 12) + 12) % 12, rootPc = sc.root % 12;
  const deg = sc.ints.findIndex(iv => (rootPc + iv) % 12 === pc);
  $('#noteName').textContent = NOTAS[pc] + (Math.floor(midi / 12) - 1);
  $('#noteFreq').textContent = f.toFixed(1) + ' Hz';
  $('#noteScale').textContent = deg >= 0 ? ROMAN[deg] : 'fuera de escala';
}

/* =====================================================================
   03b · GRABACIÓN + HISTORIAL DE TOMAS
   ===================================================================== */
let recording = false, recInfo = null, recChunks = [], recResolve = null, mediaRec = null, recTimer = null;
let takes = [], takeCounter = 0, activeTakeId = null;
let pb = null; // reproducción en curso: {kind:'take'|'mix'|'rec', sources, t0, offset, ...}

function onRecMsg(e) {
  const m = e.data || {};
  if (m.chunk) recChunks.push(m.chunk);
  if (m.stat) lastRecStat = Object.assign({ recv: performance.now() }, m.stat);   // fotogramas y pico que recibe el grabador
  if (m.done && recResolve) { const r = recResolve; recResolve = null; r(); }
}
function chunksToBuffer(chunks, sr) {
  const len = chunks.reduce((a, c) => a + c.length, 0);
  if (!len) return null;
  const buf = new AudioBuffer({ length: len, numberOfChannels: 1, sampleRate: sr });
  const d = buf.getChannelData(0); let o = 0;
  chunks.forEach(c => { d.set(c, o); o += c.length; });
  return buf;
}
const MAX_TAKES = 40;
let recStarting = false;
async function startRecording() {
  // recStarting evita que un doble clic arranque dos grabaciones a la vez
  if (recording || recStarting) return;
  if (takes.length >= MAX_TAKES) { micStatus('err', 'historial lleno (' + MAX_TAKES + ' tomas): borra algunas para seguir'); return; }
  recStarting = true;
  try { await startRecordingInner(); } finally { recStarting = false; }
}
async function startRecordingInner() {
  stopAllPlayback();
  audioSession('play-and-record');
  if (!(await ensureMic())) { audioSession('playback'); return; }
  if (esIOSapp && baseMode === 'yt') micAviso('En iPhone el audio de YouTube y el micrófono pueden pelear. Para grabar desde el celular conviene una base hecha en Beats o un MP3/WAV.');
  await reanudarAudio();
  let ytWait = 0;
  if (baseMode === 'yt') ytWait = await arrancarYoutube();
  const c = ctx(), at = c.currentTime + 0.08;
  let beatStart = 0;
  if (baseMode === 'local' && baseBuffer) {
    beatStart = tl.playhead >= baseBuffer.duration ? 0 : tl.playhead;
    const src = c.createBufferSource(); src.buffer = baseBuffer; src.loop = baseLoop;
    const g = c.createGain(); g.gain.value = gBase();
    src.connect(g); g.connect(playBus); src.start(at, beatStart);
    pb = { kind: 'rec', sources: [src], t0: at, offset: beatStart, baseGain: g };
  } else if (baseMode === 'yt' && ytReady && ytPlayer) {
    try { beatStart = ytPlayer.getCurrentTime() || 0; } catch (e) { beatStart = 0; }
  }
  recInfo = {
    at, beatStart, wall: new Date(), ytWait,
    comp: tuneLatency() + (c.outputLatency || c.baseLatency || 0) + micInLatency()
  };
  recChunks = []; lastRecStat = null; descartarShadow();
  if (workletOK) {
    chain.rec.port.postMessage({ cmd: 'start', at });
    if (esIOSapp) startShadow();                                  // en iPhone el respaldo corre SIEMPRE en paralelo
    clearTimeout(recWatch); recWatch = setTimeout(vigilarGrabacion, 1000);   // y a 1 s se revisa si el grabador recibe sonido
  }
  else {
    let mime = '';
    ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].forEach(m => { if (!mime && window.MediaRecorder && MediaRecorder.isTypeSupported(m)) mime = m; });
    try {
      mediaRec = new MediaRecorder(chain.mediaDest.stream, mime ? { mimeType: mime } : undefined);
      mediaRec.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
      mediaRec.start(250);
    } catch (e) {
      mediaRec = null;
      if (pb && pb.kind === 'rec') stopAllPlayback();
      micStatus('err', 'este navegador no permite grabar (usa Chrome, Edge u Opera GX)');
      return;
    }
  }
  recording = true;
  setRecBtn(true); $('#btnStop').disabled = false;
  const t0 = performance.now();
  const tickRec = () => {
    const seg = (performance.now() - t0) / 1000;
    micStatus('rec', '● grabando ' + fmtTime(seg) + (beatStart ? ' · beat desde ' + fmtTime(beatStart) : ''));
    const rc = $('#recClock'), rp = $('#recPillTime');
    if (rc) rc.textContent = fmtClock(seg);
    if (rp) rp.textContent = fmtClock(seg);
  };
  tickRec(); recTimer = setInterval(tickRec, 200);
  window.dispatchEvent(new CustomEvent('flowlab:rec', { detail: { on: true, n: takeCounter + 1 } }));
}
/* El botón REC alterna: si no graba, empieza; si graba, detiene. Mientras "procesa toma" queda apagado
   para que un toque de más no arranque otra grabación encima. */
function setRecBtn(live) {
  const b = $('#btnRecord'), s = b.querySelector('span');
  b.classList.toggle('live', live); b.setAttribute('aria-pressed', live ? 'true' : 'false');
  b.disabled = false;
  if (s) s.textContent = live ? 'DETENER' : 'REC';
  const t = live ? '■ Detener la toma (Alt+R)' : '● Grabar (Alt+R)';
  b.title = t; b.setAttribute('aria-label', live ? 'Detener la grabación (Alt+R)' : 'Grabar (Alt+R)');
}
/* Con base de YouTube, REC pone en marcha el video y espera a que de verdad suene (YouTube tarda un poco),
   así el beat y la grabación arrancan juntos. Devuelve cuántos segundos esperó. */
async function arrancarYoutube() {
  if (ytNoSync || !ytPlayer) {
    micAviso('Este video de YouTube no se puede controlar desde aquí: dale play tú y graba igual (la voz puede quedar un poco desfasada).');
    return 0;
  }
  if (!ytReady) { micAviso('El reproductor de YouTube todavía no está listo: grabo igual, pero sin el video. Espera un momento y vuelve a intentarlo si quieres el beat.'); return 0; }
  const t0 = performance.now();
  try {
    if (!ytPlaying) {
      const cur = ytPlayer.getCurrentTime() || 0;
      ytPlayer.seekTo(cur, true); ytPlayer.setVolume(Math.round(tl.baseVol * 100)); gBase() === 0 ? ytPlayer.mute() : ytPlayer.unMute();
      ytPlayer.playVideo();
      micStatus('', 'iniciando el video de YouTube…');
      while (!ytPlaying && performance.now() - t0 < 3000) await new Promise(r => setTimeout(r, 30));
      if (!ytPlaying) micAviso('El video de YouTube tardó en arrancar (o el navegador no lo dejó sonar solo). Grabo igual: si no oyes el beat, dale play al video.');
    }
  } catch (e) { micAviso('No pude iniciar el video de YouTube: grabo igual, dale play tú si quieres el beat.'); }
  return (performance.now() - t0) / 1000;
}
let recStopping = false;
async function stopRecording() {
  if (!recording || recStopping) return;
  recStopping = true;
  recording = false;
  clearTimeout(recWatch);
  audioSession('playback');
  clearInterval(recTimer);
  { const rc = $('#recClock'); if (rc) rc.textContent = fmtClock(0); }
  window.dispatchEvent(new CustomEvent('flowlab:rec', { detail: { on: false } }));
  $('#btnStop').disabled = true; setRecBtn(false); $('#btnRecord').disabled = true;
  micStatus('', 'procesando toma…');
  if (baseMode === 'yt' && ytPlayer && ytReady) { try { ytPlayer.pauseVideo(); } catch (e) { } }
  if (pb && pb.kind === 'rec') stopAllPlayback();
  let buffer = null, respaldo = false, mudo = false;
  try {
    if (workletOK) {
      await new Promise(res => { recResolve = res; chain.rec.port.postMessage({ cmd: 'stop' }); setTimeout(res, 1500); });
      buffer = chunksToBuffer(recChunks, actx.sampleRate);
      const vivo = !!buffer && senalDe(recChunks) > 1e-6;
      if (vivo) descartarShadow();                                      // el grabador normal oyó la voz: el respaldo sobra
      else if (shadow) {                                                // solo ceros: se usa la copia de MediaRecorder
        const b2 = await cerrarShadow();
        if (b2 && b2.duration >= 0.2 && senalDe([b2.getChannelData(0)]) > 1e-6) { buffer = b2; respaldo = true; micLog('se usó la grabación de respaldo'); }
        else mudo = true;
      } else mudo = true;
    } else if (mediaRec) {
      await new Promise(res => { mediaRec.onstop = res; try { mediaRec.stop(); } catch (e) { res(); } setTimeout(res, 2500); });
      const blob = new Blob(recChunks, { type: mediaRec.mimeType || 'audio/webm' });
      buffer = await actx.decodeAudioData(await blob.arrayBuffer());
    }
  } catch (e) { console.error(e); }
  $('#btnRecord').disabled = false; recStopping = false;
  if (!buffer || buffer.duration < 0.2) { micStatus('err', 'toma demasiado corta, inténtalo otra vez'); return; }
  addTake(buffer, recInfo);
  if (respaldo) {
    micStatus('', 'toma guardada · Se grabó con el modo de respaldo');
    micAviso('Se grabó con el modo de respaldo: tu voz sí entró, pero sin Auto-Tune ni efectos en la grabación. Toca "🎙 Probar micrófono" y "Copiar diagnóstico" si quieres que lo revisemos.');
  } else if (mudo) {
    micStatus('err', 'toma guardada, pero salió en silencio');
    micAviso('La toma salió en silencio: el micrófono se abrió pero no entró sonido. Toca "🎙 Probar micrófono" (te dice la causa) y luego "Copiar diagnóstico" para pegármelo en el chat.');
  } else micStatus('', 'toma guardada · micrófono activo');
}
$('#btnRecord').addEventListener('click', () => { recording ? stopRecording() : startRecording(); });
$('#btnRecord').setAttribute('aria-pressed', 'false');
$('#btnStop').addEventListener('click', stopRecording);

function addTake(buffer, info) {
  const id = ++takeCounter;
  const take = {
    id, name: 'Grabación #' + id, time: info.wall.toLocaleTimeString('es-ES', { hour12: false }),
    duration: buffer.duration, beatStart: info.beatStart, comp: info.comp,
    delayMs: 250, delayMix: 0, syncMs: 0, pauseAt: 0, buffer, peaks: computePeaks(buffer, 1200)
  };
  takes.push(take);
  activeTakeId = id;
  tl.playhead = Math.max(0, info.beatStart);
  renderTakes(); syncSyncSlider(); tlInvalidate();
}
const takeById = id => takes.find(t => t.id === id);
const activeTake = () => takeById(activeTakeId) || null;
const voicePos = t => t.beatStart - t.comp + t.syncMs / 1000;

function renderTakes() {
  const box = $('#takesList');
  $('#btnPlayLast').disabled = !takes.length;
  if (!takes.length) { box.innerHTML = '<p class="take-empty">Sin tomas grabadas. ¡Pulsa "● Grabar" para empezar!</p>'; return; }
  box.innerHTML = takes.slice().reverse().map(t => `
    <div class="take-card${t.id === activeTakeId ? ' active' : ''}" data-id="${t.id}">
      <div class="take-head">
        <span class="take-name">${t.name}${t.id === activeTakeId ? ' <em>· en mezcla</em>' : ''}</span>
        <span class="take-meta">${t.time} · ${fmtTime(t.duration)} · beat @${fmtTime(t.beatStart)}</span>
      </div>
      <div class="take-actions">
        <button class="btn btn-neon btn-small" data-act="play">▶ Play</button>
        <button class="btn btn-ghost btn-small" data-act="select" title="Usar esta toma en la línea de tiempo">◎ Activa</button>
        <button class="btn btn-gold btn-small" data-act="wav">↓ WAV</button>
        <button class="btn btn-danger btn-small" data-act="del" title="Borrar toma">🗑</button>
      </div>
      <div class="take-delay">
        <label>Tiempo Delay (ms) <button type="button" class="help-q" data-help="delayMs" aria-label="Ayuda: tiempo de delay">?</button><span class="val" data-v="delayMs">${t.delayMs} ms</span></label>
        <input type="range" data-k="delayMs" min="0" max="500" step="5" value="${t.delayMs}">
        <label>Mezcla Delay (%) <button type="button" class="help-q" data-help="delayMix" aria-label="Ayuda: mezcla de delay">?</button><span class="val" data-v="delayMix">${Math.round(t.delayMix * 100)}%</span></label>
        <input type="range" data-k="delayMix" min="0" max="50" step="1" value="${Math.round(t.delayMix * 100)}">
      </div>
      <div class="take-progress"><div class="bar"></div></div>
    </div>`).join('');
  refreshTakeState();
}
function refreshTakeState() {
  $$('#takesList .take-card').forEach(card => {
    const id = +card.dataset.id, on = pb && pb.kind === 'take' && pb.takeId === id;
    card.classList.toggle('playing', !!on);
    const b = card.querySelector('[data-act=play]'); if (b) b.textContent = on ? '⏸ Pausa' : '▶ Play';
    if (!on) { const t = takeById(id), bar = card.querySelector('.bar'); if (bar && t) bar.style.width = (t.pauseAt / t.duration * 100) + '%'; }
  });
}
$('#takesList').addEventListener('click', async e => {
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  const id = +btn.closest('.take-card').dataset.id, t = takeById(id); if (!t) return;
  const act = btn.dataset.act;
  if (act === 'play') playTake(t);
  if (act === 'select') { activeTakeId = id; renderTakes(); syncSyncSlider(); tl.playhead = Math.max(0, t.beatStart); tlInvalidate(); }
  if (act === 'wav') {
    btn.disabled = true; btn.textContent = '…';
    try { const buf = await renderTakeOffline(t); downloadBlob(encodeWav(buf), 'flowlab_' + t.name.replace(/\W+/g, '_') + '_' + stamp() + '.wav'); }
    catch (err) { alert('No se pudo exportar la toma.'); }
    btn.disabled = false; btn.textContent = '↓ WAV';
  }
  if (act === 'del') {
    if (!confirm('¿Borrar «' + t.name + '»?')) return;
    if (pb && (pb.takeId === id || pb.kind === 'mix')) stopAllPlayback();
    takes = takes.filter(x => x.id !== id);
    if (activeTakeId === id) activeTakeId = takes.length ? takes[takes.length - 1].id : null;
    renderTakes(); syncSyncSlider(); tlInvalidate();
  }
});
$('#takesList').addEventListener('input', e => {
  const k = e.target.dataset.k; if (!k) return;
  const card = e.target.closest('.take-card'), t = takeById(+card.dataset.id); if (!t) return;
  const v = +e.target.value;
  if (k === 'delayMs') { t.delayMs = v; card.querySelector('[data-v=delayMs]').textContent = v + ' ms'; }
  else { t.delayMix = v / 100; card.querySelector('[data-v=delayMix]').textContent = v + '%'; }
  if (pb && pb.voiceFx && pb.voiceTakeId === t.id) {
    const now = actx.currentTime;
    pb.voiceFx.delay.delayTime.setTargetAtTime(Math.max(0.003, t.delayMs / 1000), now, 0.03);
    pb.voiceFx.wet.gain.setTargetAtTime(t.delayMix, now, 0.03);
  }
});
$('#btnPlayLast').addEventListener('click', () => { if (takes.length) playTake(takes[takes.length - 1]); });
$('#btnClearAll').addEventListener('click', () => {
  if (!takes.length) return;
  if (!confirm('¿Borrar TODO el historial de grabaciones?')) return;
  stopAllPlayback(); takes = []; activeTakeId = null;
  renderTakes(); syncSyncSlider(); tlInvalidate();
});

/* ---- FX de reproducción por toma: delay (con feedback) + reverb, nunca quemados en la toma ---- */
function buildVoiceFx(c, take, rev, dest) {
  const input = c.createGain(), dry = c.createGain();
  const delay = c.createDelay(1); delay.delayTime.value = Math.max(0.003, take.delayMs / 1000);
  const fb = c.createGain(); fb.gain.value = 0.32;
  const tone = c.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5200;
  const wet = c.createGain(); wet.gain.value = take.delayMix;
  input.connect(dry); dry.connect(dest);
  input.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(wet); wet.connect(dest);
  const conv = c.createConvolver(); conv.buffer = getIR(c.sampleRate);
  const revG = c.createGain(); revG.gain.value = rev * 0.7;
  input.connect(revG); wet.connect(revG); revG.connect(conv); conv.connect(dest);
  return { input, delay, wet, rev: revG };
}
async function renderTakeOffline(t) {
  const sr = t.buffer.sampleRate, tail = (t.delayMix > 0 || revLevel() > 0) ? 2.5 : 0.05;
  const oc = new OfflineAudioContext(2, Math.ceil((t.duration + tail) * sr), sr);
  const src = oc.createBufferSource(); src.buffer = t.buffer;
  const fx = buildVoiceFx(oc, t, revLevel(), oc.destination);
  src.connect(fx.input); src.start(0);
  return oc.startRendering();
}

/* ---- Reproducción ---- */
function stopAllPlayback() {
  if (!pb) return;
  const old = pb; pb = null;
  old.sources.forEach(s => { s.onended = null; try { s.stop(); } catch (e) { } });
  if (old.kind === 'mix' && old.yt && ytPlayer && ytReady) { try { ytPlayer.pauseVideo(); } catch (e) { } }
  if (old.kind === 'take') { const t = takeById(old.takeId); if (t && !old.keepPause) t.pauseAt = 0; }
  $('#mixPlay').classList.remove('on');
  refreshTakeState(); tlInvalidate();
}
function pbPos() {
  if (!pb) return 0;
  if (pb.kind === 'mix' && pb.yt && ytPlayer && ytReady && !pb.pendingVoice) { try { return ytPlayer.getCurrentTime() || 0; } catch (e) { } }
  return pb.offset + Math.max(0, actx.currentTime - pb.t0);
}
function playTake(t) {
  if (pb && pb.kind === 'take' && pb.takeId === t.id) { // pausa
    t.pauseAt = pbPos(); pb.keepPause = true; stopAllPlayback(); return;
  }
  stopAllPlayback(); turnOffMonitor();
  const c = ctx(), off = t.pauseAt > 0 && t.pauseAt < t.duration - 0.05 ? t.pauseAt : 0;
  const src = c.createBufferSource(); src.buffer = t.buffer;
  const fx = buildVoiceFx(c, t, revLevel(), playBus);
  src.connect(fx.input);
  const t0 = c.currentTime + 0.02; src.start(t0, off);
  pb = { kind: 'take', takeId: t.id, voiceTakeId: t.id, sources: [src], t0, offset: off, voiceFx: fx };
  src.onended = () => { if (pb && pb.sources[0] === src) { t.pauseAt = 0; pb = null; refreshTakeState(); } };
  refreshTakeState();
}

/* =====================================================================
   04 · LÍNEA DE TIEMPO · MEZCLA (canvas ligero, 2 pistas)
   ===================================================================== */
const tl = { playhead: 0, dur: 10, baseVol: 0.85, voiceVol: 0.9, baseMute: false, voiceMute: false, pps: 10, beatVol: 0.8, beatMute: false, solo: null, beatOn: false };
// Volumen real de cada pista: considera M (silenciar) y S (solo)
const audible = k => !tl.solo || tl.solo === k;
const gBase = () => (tl.baseMute || !audible('base')) ? 0 : tl.baseVol;
const gVoice = () => (tl.voiceMute || !audible('voice')) ? 0 : tl.voiceVol;
const gBeat = () => (tl.beatMute || !audible('beat')) ? 0 : tl.beatVol;
const tlCanvas = $('#tlCanvas'), tlc = tlCanvas.getContext('2d');
const tlStatic = document.createElement('canvas'), tsc = tlStatic.getContext('2d');
const TL = { ruler: 24, l1: 28, lb: 94, l2: 94, lh: 62, H: 160 };
function layoutTL() { if (tl.beatOn) { TL.lb = 94; TL.l2 = 160; TL.H = 226; } else { TL.l2 = 94; TL.H = 160; } tlCanvas.style.height = TL.H + 'px'; }
let tlDirty = true, tlLastHead = -1, tlW = 0, dpr = 1;

function baseDuration() {
  if (baseMode === 'local' && baseBuffer) return baseBuffer.duration;
  if (baseMode === 'yt' && ytPlayer && ytReady) { try { return ytPlayer.getDuration() || 0; } catch (e) { } }
  return 0;
}
function tlInvalidate() { tlDirty = true; }
function tlResize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  tlW = Math.max(200, tlCanvas.clientWidth);
  tlCanvas.width = tlStatic.width = Math.round(tlW * dpr);
  tlCanvas.height = tlStatic.height = Math.round(TL.H * dpr);
  tlDirty = true;
}
new ResizeObserver(tlResize).observe(tlCanvas);
tlResize();
function drawPeaks(g, peaks, x0, x1, yMid, half, color) {
  const w = x1 - x0; if (w < 1) return;
  g.fillStyle = color;
  const P = peaks.length, from = Math.max(0, Math.floor(x0)), to = Math.min(tlW, Math.ceil(x1));
  for (let x = from; x < to; x++) {
    const a = Math.floor((x - x0) / w * P), b = Math.max(a + 1, Math.floor((x + 1 - x0) / w * P));
    let m = 0; for (let i = a; i < b && i < P; i++) if (peaks[i] > m) m = peaks[i];
    const h = Math.max(1, Math.min(1, m * 1.15) * half);
    g.fillRect(x, yMid - h, 1, h * 2);
  }
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function tlDrawStatic() {
  const g = tsc, take = activeTake();
  const bd = baseDuration(), vEnd = take ? voicePos(take) + take.duration : 0;
  tl.dur = Math.max(10, bd, vEnd) + 1;
  tl.pps = tlW / tl.dur;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, tlW, TL.H);
  g.fillStyle = PAL.bg; g.fillRect(0, 0, tlW, TL.H);
  // Regla
  g.fillStyle = PAL.s2; g.fillRect(0, 0, tlW, TL.ruler);
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120];
  const step = steps.find(s => s * tl.pps >= 70) || 120;
  g.font = '10px Consolas, monospace'; g.textBaseline = 'middle';
  for (let s = 0; s <= tl.dur; s += step) {
    const x = Math.round(s * tl.pps) + 0.5;
    g.fillStyle = rgba(PAL.muted, .4); g.fillRect(x, TL.ruler - 8, 1, 8);
    g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x, TL.ruler, 1, TL.H - TL.ruler);
    g.fillStyle = PAL.muted; g.fillText(fmtTime(s).replace(/\.0$/, ''), x + 3, 9);
    for (let k = 1; k < 4; k++) { const xm = Math.round((s + step * k / 4) * tl.pps) + 0.5; g.fillStyle = rgba(PAL.muted, .22); g.fillRect(xm, TL.ruler - 4, 1, 4); }
  }
  // Carriles
  (tl.beatOn ? [TL.l1, TL.lb, TL.l2] : [TL.l1, TL.l2]).forEach(y => { g.fillStyle = '#131313'; roundRect(g, 0, y, tlW, TL.lh, 8); g.fill(); });
  // Pista 1 · base
  g.globalAlpha = gBase() === 0 ? 0.3 : 1;
  if (baseMode === 'local' && basePeaks) {
    const x1 = bd * tl.pps;
    g.fillStyle = rgba(PAL.lime, .08); roundRect(g, 0, TL.l1 + 2, x1, TL.lh - 4, 6); g.fill();
    drawPeaks(g, basePeaks, 0, x1, TL.l1 + TL.lh / 2, TL.lh / 2 - 6, PAL.lime);
    if (baseLoop && bd > 0.5) { // beat propio: se repite en bucle hasta el final de la línea de tiempo
      g.globalAlpha *= 0.45;
      for (let k = 1; k * bd < tl.dur - 1 && k < 60; k++) {
        const a = k * bd * tl.pps, b = Math.min(tlW, (k + 1) * bd * tl.pps);
        g.fillStyle = rgba(PAL.lime, .05); roundRect(g, a, TL.l1 + 2, b - a, TL.lh - 4, 6); g.fill();
        drawPeaks(g, basePeaks, a, b, TL.l1 + TL.lh / 2, TL.lh / 2 - 6, PAL.lime);
      }
    }
  } else if (baseMode === 'yt') {
    const x1 = (bd || tl.dur - 1) * tl.pps;
    const grad = g.createLinearGradient(0, 0, x1, 0); grad.addColorStop(0, rgba(PAL.red, .6)); grad.addColorStop(1, rgba(PAL.red, .2));
    g.fillStyle = grad; roundRect(g, 0, TL.l1 + 14, Math.max(4, x1), TL.lh - 28, 6); g.fill();
    g.fillStyle = '#ffd5d9'; g.font = 'bold 11px Inter, Segoe UI, sans-serif';
    g.fillText(ytNoSync ? '▶ YouTube · sin sincronía (abre con el servidor local)' : (bd ? '▶ YouTube · ' + fmtTime(bd) + ' · sincronizado' : '▶ YouTube · cargando…'), 10, TL.l1 + TL.lh / 2);
  } else {
    g.fillStyle = '#8D8D8D'; g.font = 'italic 11px Inter, Segoe UI, sans-serif';
    g.fillText('Sin base · sube un MP3/WAV o carga un link de YouTube', 10, TL.l1 + TL.lh / 2);
  }
  // Pestañas de recorte de la base (se arrastran con el dedo o el mouse)
  if (baseMode === 'local' && basePeaks) {
    const x1 = bd * tl.pps; g.globalAlpha = 0.95; g.fillStyle = PAL.lime;
    roundRect(g, 0, TL.l1 + 10, 6, TL.lh - 20, 3); g.fill();
    roundRect(g, Math.max(0, x1 - 6), TL.l1 + 10, 6, TL.lh - 20, 3); g.fill();
  }
  // Mi beat (solo en el modo Beats): el patrón del secuenciador, repetido en bucle
  if (tl.beatOn) {
    g.globalAlpha = gBeat() === 0 ? 0.3 : 1;
    const bp = beatTrack && beatTrack.has() ? beatTrack.peaks() : null, bdur = bp ? beatTrack.duration() : 0;
    if (bp && bdur > 0.2) {
      for (let k = 0; k * bdur < tl.dur - 1 && k < 400; k++) {
        const a = k * bdur * tl.pps, b2 = Math.min(tlW, (k + 1) * bdur * tl.pps);
        g.fillStyle = rgba(PAL.orange, k ? .05 : .09); roundRect(g, a, TL.lb + 2, b2 - a, TL.lh - 4, 6); g.fill();
        drawPeaks(g, bp, a, b2, TL.lb + TL.lh / 2, TL.lh / 2 - 6, PAL.orange);
      }
    } else {
      g.fillStyle = '#8D8D8D'; g.font = 'italic 11px Inter, Segoe UI, sans-serif';
      g.fillText('Sin patrón · enciende pasos en el secuenciador de arriba', 10, TL.lb + TL.lh / 2);
    }
  }
  // Pista de la voz
  g.globalAlpha = gVoice() === 0 ? 0.3 : 1;
  if (take) {
    const x0 = voicePos(take) * tl.pps, x1 = x0 + take.duration * tl.pps;
    g.fillStyle = rgba(PAL.cyan, .12); roundRect(g, Math.max(0, x0), TL.l2 + 2, Math.max(3, x1 - Math.max(0, x0)), TL.lh - 4, 6); g.fill();
    g.strokeStyle = rgba(PAL.cyan, .55); g.lineWidth = 1; g.stroke();
    drawPeaks(g, take.peaks, x0, x1, TL.l2 + TL.lh / 2, TL.lh / 2 - 8, PAL.cyan);
    g.fillStyle = PAL.cyan; g.font = 'bold 10px Inter, Segoe UI, sans-serif'; g.textBaseline = 'top';
    g.fillText(take.name, Math.max(4, x0 + 4), TL.l2 + 5); g.textBaseline = 'middle';
  } else {
    g.fillStyle = '#8D8D8D'; g.font = 'italic 11px Inter, Segoe UI, sans-serif';
    g.fillText('Sin voz · graba una toma o elige una del historial', 10, TL.l2 + TL.lh / 2);
  }
  g.globalAlpha = 1;
  $('#tlDur').textContent = fmtTime(tl.dur - 1);
  $('#tlVoiceSrc').textContent = take ? take.name : '—';
  tlDirty = false;
}
function tlDraw() {
  if (!tlW || !tlCanvas.width) return;
  if (tlDirty) { tlDrawStatic(); tlLastHead = -1; }
  if (tl.playhead === tlLastHead) return;
  tlLastHead = tl.playhead;
  tlc.setTransform(1, 0, 0, 1, 0, 0);
  tlc.drawImage(tlStatic, 0, 0);
  tlc.setTransform(dpr, 0, 0, dpr, 0, 0);
  const x = Math.round(tl.playhead * tl.pps) + 0.5;
  tlc.fillStyle = PAL.red; tlc.shadowColor = PAL.red; tlc.shadowBlur = 6;
  tlc.fillRect(x - 0.5, 0, 2, TL.H);
  tlc.beginPath(); tlc.moveTo(x - 6, 0); tlc.lineTo(x + 7, 0); tlc.lineTo(x + 0.5, 9); tlc.closePath(); tlc.fill();
  tlc.shadowBlur = 0;
  if (trimDrag) { const gx = Math.round(trimDrag.cur) + 0.5; tlc.fillStyle = PAL.lime; tlc.fillRect(gx - 1, TL.l1, 2, TL.lh); }
  $('#tlTime').textContent = fmtTime(tl.playhead);
}
// Aguja clicable / arrastrable
let trimDrag = null;   // recorte en curso: {side:'L'|'R', x0, cur, s0, e0}
{
  let dragging = false, wasMix = false;
  const timeAt = e => { const r = tlCanvas.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width * tl.dur, 0, tl.dur - 1); };
  const xy = e => { const r = tlCanvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (tlW / r.width), y: (e.clientY - r.top) * (TL.H / r.height) }; };
  // ¿el dedo está sobre una pestaña de recorte de la base?
  const asa = e => {
    if (!(baseMode === 'local' && baseBuffer)) return null;
    const q = xy(e); if (q.y < TL.l1 || q.y > TL.l1 + TL.lh) return null;
    const x1 = baseDuration() * tl.pps, tol = e.pointerType === 'touch' ? 18 : 10;
    if (q.x <= tol) return 'L';
    if (Math.abs(q.x - x1) <= tol) return 'R';
    return null;
  };
  tlCanvas.addEventListener('pointerdown', e => {
    const side = asa(e);
    if (side) {
      stopAllPlayback();
      trimDrag = { side, x0: xy(e).x, cur: xy(e).x, s0: baseEdit.trimS, e0: baseEdit.trimE > 0 ? baseEdit.trimE : baseOrig.duration };
      tlCanvas.setPointerCapture(e.pointerId); tlLastHead = -1; return;
    }
    dragging = true; tlCanvas.setPointerCapture(e.pointerId);
    wasMix = !!(pb && pb.kind === 'mix'); if (wasMix) stopAllPlayback();
    tl.playhead = timeAt(e);
  });
  tlCanvas.addEventListener('pointermove', e => {
    if (trimDrag) { trimDrag.cur = xy(e).x; tlLastHead = -1; return; }
    if (dragging) tl.playhead = timeAt(e);
    else tlCanvas.style.cursor = asa(e) ? 'ew-resize' : '';
  });
  const end = e => {
    if (trimDrag) {
      const td = trimDrag; trimDrag = null; const dt = (td.cur - td.x0) / tl.pps;
      if (Math.abs(dt) > 0.02) {
        if (td.side === 'L') baseEdit.trimS = clamp(td.s0 + dt, 0, td.e0 - 0.3);
        else baseEdit.trimE = clamp(td.e0 + dt, td.s0 + 0.3, baseOrig.duration);
        rebuildBase();
      }
      tlLastHead = -1; return;
    }
    if (!dragging) return; dragging = false;
    tl.playhead = timeAt(e);
    if (wasMix) startMix();
    else if (baseMode === 'yt' && ytPlayer && ytReady && !recording) { try { ytPlayer.seekTo(tl.playhead, true); } catch (err) { } }
  };
  tlCanvas.addEventListener('pointerup', end);
  tlCanvas.addEventListener('pointercancel', end);
}

/* ---- Mezcla en tiempo real ---- */
function scheduleVoice(take, t0, from) {
  if (!take || !pb) return;
  const c = ctx(), pos = voicePos(take);
  if (from - pos >= take.duration) return;
  const vg = c.createGain(); vg.gain.value = gVoice(); vg.connect(playBus);
  const src = c.createBufferSource(); src.buffer = take.buffer;
  const fx = buildVoiceFx(c, take, revLevel(), vg);
  src.connect(fx.input);
  if (pos >= from) src.start(t0 + (pos - from)); else src.start(t0, from - pos);
  pb.sources.push(src); pb.voiceFx = fx; pb.voiceGain = vg; pb.voiceTakeId = take.id;
}
/* Mi beat (patrón del modo Beats) dentro de la mezcla: se repite en bucle desde el punto donde está la aguja */
function scheduleBeat(t0, from) {
  if (!tl.beatOn || !beatTrack || !pb || !beatTrack.has()) return;
  const buf = beatTrack.buffer(); if (!buf) return;
  const c = ctx(), g = c.createGain(); g.gain.value = gBeat(); g.connect(playBus);
  const src = c.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(g);
  src.start(t0, from % buf.duration);
  pb.sources.push(src); pb.beatGain = g;
}
// Un solo Play: primero se pone al día el patrón (por si lo cambiaste) y luego suena todo junto
async function startMix() {
  if (tl.beatOn && beatTrack && beatTrack.ensure) { try { await beatTrack.ensure(); } catch (e) { } }
  playMix();
}
function playMix() {
  window.dispatchEvent(new CustomEvent('flowlab:mixplay'));
  stopAllPlayback(); turnOffMonitor();
  const c = ctx(), take = activeTake();
  let from = tl.playhead >= tl.dur - 1.05 ? 0 : tl.playhead;
  if (baseMode === 'yt' && ytPlayer && ytReady) {
    pb = { kind: 'mix', yt: true, pendingVoice: true, sources: [], t0: c.currentTime, offset: from };
    try { ytPlayer.setVolume(Math.round(tl.baseVol * 100)); gBase() === 0 ? ytPlayer.mute() : ytPlayer.unMute(); ytPlayer.seekTo(from, true); ytPlayer.playVideo(); } catch (e) { }
  } else {
    if (baseMode === 'yt' && ytNoSync) showNotice('YouTube sin sincronía: abre el estudio con INICIAR-ESTUDIO.bat o sube la base en MP3. Se reproduce solo la voz.');
    const t0 = c.currentTime + 0.05;
    pb = { kind: 'mix', sources: [], t0, offset: from };
    if (baseMode === 'local' && baseBuffer && (baseLoop || from < baseBuffer.duration)) {
      const src = c.createBufferSource(); src.buffer = baseBuffer; src.loop = baseLoop;
      const g = c.createGain(); g.gain.value = gBase();
      src.connect(g); g.connect(playBus); src.start(t0, baseLoop ? from % baseBuffer.duration : from);
      pb.sources.push(src); pb.baseGain = g;
    }
    scheduleBeat(t0, from);
    scheduleVoice(take, t0, from);
    if (!pb.sources.length) { pb = null; showNotice('No hay nada que reproducir desde esta posición: carga una base o graba una toma.'); return; }
  }
  $('#mixPlay').classList.add('on');
}
$('#mixPlay').addEventListener('click', () => { if (pb && pb.kind === 'mix') stopAllPlayback(); else startMix(); });
$('#mixStop').addEventListener('click', () => { stopAllPlayback(); });

function showNotice(msg) {
  const n = $('#tlNotice'); n.textContent = msg; n.classList.remove('hidden');
  clearTimeout(showNotice.t); showNotice.t = setTimeout(() => n.classList.add('hidden'), 7000);
}
function updateVolumes() {
  tl.baseVol = +$('#baseVol').value / 100; tl.voiceVol = +$('#voiceVol').value / 100; tl.beatVol = +$('#beatVol').value / 100;
  $('#baseMute').classList.toggle('on', tl.baseMute); $('#voiceMute').classList.toggle('on', tl.voiceMute); $('#beatMute').classList.toggle('on', tl.beatMute);
  [['base', '#baseSolo'], ['voice', '#voiceSolo'], ['beat', '#beatSolo']].forEach(([k, sel]) => { const b = $(sel); b.classList.toggle('on', tl.solo === k); b.setAttribute('aria-pressed', String(tl.solo === k)); });
  if (pb) {
    const t = actx.currentTime;
    if (pb.beatGain) pb.beatGain.gain.setTargetAtTime(gBeat(), t, 0.02);
    if (pb.baseGain) pb.baseGain.gain.setTargetAtTime(gBase(), t, 0.02);
    if (pb.voiceGain) pb.voiceGain.gain.setTargetAtTime(gVoice(), t, 0.02);
  }
  if (baseMode === 'yt' && ytPlayer && ytReady) { try { ytPlayer.setVolume(Math.round(tl.baseVol * 100)); gBase() === 0 ? ytPlayer.mute() : ytPlayer.unMute(); } catch (e) { } }
  tlInvalidate();
}
$('#baseVol').addEventListener('input', updateVolumes);
$('#voiceVol').addEventListener('input', updateVolumes);
$('#baseMute').addEventListener('click', () => { tl.baseMute = !tl.baseMute; updateVolumes(); });
$('#voiceMute').addEventListener('click', () => { tl.voiceMute = !tl.voiceMute; updateVolumes(); });
$('#beatVol').addEventListener('input', updateVolumes);
$('#beatMute').addEventListener('click', () => { tl.beatMute = !tl.beatMute; updateVolumes(); });
[['base', '#baseSolo'], ['voice', '#voiceSolo'], ['beat', '#beatSolo']].forEach(([k, sel]) => $(sel).addEventListener('click', () => { tl.solo = tl.solo === k ? null : k; updateVolumes(); }));

/* ---- Mi beat en la línea de tiempo (solo en el modo Beats) ---- */
function setBeatLane(on) {
  on = !!on; if (tl.beatOn === on) return;
  tl.beatOn = on; if (!on && tl.solo === 'beat') tl.solo = null;
  $('#tlHeadBeat').classList.toggle('hidden', !on);
  $('#mixPlay').textContent = on ? '▶ Reproducir Mezcla (Base + Beat + Voz)' : '▶ Reproducir Mezcla (Base + Voz)';
  $('#tlNum').textContent = on ? '04' : '01';
  layoutTL(); tlResize(); updateVolumes(); updateYtNote();
}
function updateYtNote() { const n = $('#tlYtNote'); if (n) n.classList.toggle('hidden', !(tl.beatOn && baseMode === 'yt')); }

/* ---- Editar mi archivo (la base): recorte, desplazamiento y bucle ----
   Se hace sobre una copia ("baseBuffer"); el archivo original queda intacto en baseOrig, así que todo lo demás
   (grabar, mezclar, exportar, Escuela) usa la versión editada sin enterarse. */
function resetEdit() { baseEdit.trimS = 0; baseEdit.trimE = 0; baseEdit.shiftMs = 0; }
function rebuildBase() {
  if (!baseOrig) return;
  stopAllPlayback();
  const sr = baseOrig.sampleRate, n0 = baseOrig.length, nch = baseOrig.numberOfChannels;
  const a = Math.round(baseEdit.trimS * sr), b = baseEdit.trimE > 0 ? Math.min(n0, Math.round(baseEdit.trimE * sr)) : n0;
  const len = Math.max(1, b - a), sh = Math.round(baseEdit.shiftMs / 1000 * sr);
  if (a === 0 && b === n0 && sh === 0) baseBuffer = baseOrig;
  else {
    // con bucle el desplazamiento "gira" el audio (el ritmo se corre y sigue repitiéndose); sin bucle agrega o quita silencio al inicio
    const outLen = baseLoop ? len : Math.max(1, len + sh);
    const out = new AudioBuffer({ length: outLen, numberOfChannels: nch, sampleRate: sr });
    for (let c = 0; c < nch; c++) {
      const src = baseOrig.getChannelData(c).subarray(a, a + len), dst = out.getChannelData(c);
      if (baseLoop) { const k = ((sh % len) + len) % len; dst.set(src.subarray(len - k), 0); dst.set(src.subarray(0, len - k), k); }
      else if (sh >= 0) dst.set(src, sh);
      else dst.set(src.subarray(-sh));
    }
    baseBuffer = out;
  }
  basePeaks = computePeaks(baseBuffer, 2400);
  tl.playhead = 0; tlInvalidate(); updateEditUI();
}
function updateEditUI() {
  const box = $('#tlEdit'); if (!box) return;
  const on = baseMode === 'local' && !!baseOrig; box.classList.toggle('hidden', !on); if (!on) return;
  $('#trimS').value = baseEdit.trimS.toFixed(1); $('#trimE').value = (baseEdit.trimE > 0 ? baseEdit.trimE : baseOrig.duration).toFixed(1);
  $('#trimE').max = baseOrig.duration.toFixed(1); $('#trimS').max = baseOrig.duration.toFixed(1);
  $('#baseShift').value = baseEdit.shiftMs; $('#valBaseShift').textContent = (baseEdit.shiftMs > 0 ? '+' : '') + baseEdit.shiftMs + ' ms';
  $('#baseLoopChk').checked = baseLoop;
}
$('#trimS').addEventListener('change', () => { const end = baseEdit.trimE > 0 ? baseEdit.trimE : baseOrig.duration; baseEdit.trimS = clamp(+$('#trimS').value || 0, 0, end - 0.3); rebuildBase(); });
$('#trimE').addEventListener('change', () => { const v = +$('#trimE').value || baseOrig.duration; baseEdit.trimE = clamp(v, baseEdit.trimS + 0.3, baseOrig.duration); if (baseEdit.trimE >= baseOrig.duration - 0.01) baseEdit.trimE = 0; rebuildBase(); });
$('#baseShift').addEventListener('input', e => { const v = +e.target.value; $('#valBaseShift').textContent = (v > 0 ? '+' : '') + v + ' ms'; });
$('#baseShift').addEventListener('change', e => { baseEdit.shiftMs = +e.target.value; rebuildBase(); });
$('#baseLoopChk').addEventListener('change', e => { baseLoop = e.target.checked; rebuildBase(); });
$('#baseReset').addEventListener('click', () => { resetEdit(); baseLoop = baseFromBeat; rebuildBase(); });

function syncSyncSlider() {
  const t = activeTake(), s = $('#syncMs');
  s.disabled = !t; s.value = t ? t.syncMs : 0;
  $('#valSync').textContent = (t && t.syncMs > 0 ? '+' : '') + (t ? t.syncMs : 0) + ' ms';
}
$('#syncMs').addEventListener('input', e => {
  const t = activeTake(); if (!t) return;
  t.syncMs = +e.target.value;
  $('#valSync').textContent = (t.syncMs > 0 ? '+' : '') + t.syncMs + ' ms';
  tlInvalidate();
});
$('#syncMs').addEventListener('change', () => { if (pb && pb.kind === 'mix') { tl.playhead = pbPos(); playMix(); } });
syncSyncSlider();

/* ---- Exportar mezcla final (OfflineAudioContext) ---- */
$('#mixExport').addEventListener('click', () => exportarMezcla(false));
$('#mixExportVoice').addEventListener('click', () => exportarMezcla(true));
async function exportarMezcla(soloVoz) {
  const beatActive = !soloVoz && tl.beatOn && beatTrack && beatTrack.has(), baseOK = !soloVoz && baseMode === 'local' && !!baseBuffer;
  if (soloVoz && !activeTake()) { showNotice('Primero graba una toma: aquí se exporta tu voz sola, con sus efectos.'); return; }
  if (!soloVoz && !baseOK && !(beatActive && baseMode !== 'yt')) {
    showNotice(baseMode === 'yt'
      ? '🎧 Para exportar la mezcla completa sube tu base en MP3/WAV: el audio de YouTube no se puede descargar desde el navegador. Tu voz sola sí: botón ↓ WAV en el historial.' + (tl.beatOn ? ' Tu patrón de beats también se descarga solo desde la sección "Tu pista".' : '')
      : 'Primero sube una base MP3/WAV' + (tl.beatOn ? ' o enciende algunos pasos de tu patrón' : '') + ' para exportar la mezcla.');
    return;
  }
  const take = activeTake(), btn = $(soloVoz ? '#mixExportVoice' : '#mixExport'), btnTxt = btn.textContent;
  if ($('#mixExport').disabled || $('#mixExportVoice').disabled) return; // evita dos exportaciones a la vez (doble clic)
  btn.disabled = true; btn.textContent = '⏳ Mezclando…';
  try {
    if (beatActive && beatTrack.ensure) await beatTrack.ensure();      // el patrón al día
    const sr = 44100, tail = take && (take.delayMix > 0 || revLevel() > 0) ? 2.5 : 0.1;
    let end = Math.max(baseOK ? baseBuffer.duration : 0, take ? voicePos(take) + take.duration + tail : 0);
    const beatBuf = beatActive ? beatTrack.buffer() : null;
    if (beatBuf && end < 0.5) end = Math.ceil(8 * beatTrack.barSeconds() / beatBuf.duration) * beatBuf.duration;   // solo patrón: 8 compases
    const oc = new OfflineAudioContext(2, Math.ceil(end * sr), sr);
    if (baseOK) {
      const bs = oc.createBufferSource(); bs.buffer = baseBuffer; bs.loop = baseLoop;
      const bg = oc.createGain(); bg.gain.value = gBase();
      bs.connect(bg); bg.connect(oc.destination); bs.start(0);
    }
    if (beatBuf) {
      const ts = oc.createBufferSource(); ts.buffer = beatBuf; ts.loop = true;
      const tg = oc.createGain(); tg.gain.value = gBeat(); ts.connect(tg); tg.connect(oc.destination); ts.start(0);
    }
    if (take && gVoice() > 0) {
      const vg = oc.createGain(); vg.gain.value = gVoice(); vg.connect(oc.destination);
      const vs = oc.createBufferSource(); vs.buffer = take.buffer;
      const fx = buildVoiceFx(oc, take, revLevel(), vg); vs.connect(fx.input);
      const pos = voicePos(take);
      if (pos >= 0) vs.start(pos); else vs.start(0, -pos);
    }
    const out = await oc.startRendering();
    if (window.Beats && Beats.limitar) Beats.limitar(out, 0.95, 0.005);        // el mismo limitador del creador de beats: nada pasa de −0,45 dBFS (0,95)
    else {
      let peak = 0;
      for (let c = 0; c < out.numberOfChannels; c++) { const d = out.getChannelData(c); for (let i = 0; i < d.length; i += 4) { const a = Math.abs(d[i]); if (a > peak) peak = a; } }
      if (peak > 0.98) { const k = 0.98 / peak; for (let c = 0; c < out.numberOfChannels; c++) { const d = out.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; } }
    }
    downloadBlob(encodeWav(out), (soloVoz ? 'flowlab_voz_' : 'flowlab_mezcla_') + stamp() + '.wav');
    showNotice(soloVoz ? '✓ Tu voz sola se exportó (' + fmtTime(out.duration) + ').' : '✓ Mezcla exportada (' + fmtTime(out.duration) + ').');
  } catch (e) {
    console.error(e); showNotice('No se pudo exportar la mezcla: ' + e.message);
  }
  btn.disabled = false; btn.textContent = btnTxt;
}
function updateYtExport() {
  const yt = baseMode === 'yt', n = $('#tlYtExportNote'), v = $('#mixExportVoice');
  if (n) n.classList.toggle('hidden', !yt);
  if (v) v.classList.toggle('hidden', !yt);
}

/* =====================================================================
   VISUALIZADOR + BUCLE DE UI (un solo requestAnimationFrame)
   ===================================================================== */
const viz = $('#viz'), vctx = viz.getContext('2d');
let vizData = null;
function drawViz() {
  const W = viz.width, H = viz.height;
  const an = pb ? pbAnalyser : (chain && micStream ? chain.liveAnalyser : null);
  vctx.clearRect(0, 0, W, H);
  vctx.fillStyle = rgba(PAL.cyan, .16); vctx.fillRect(0, H / 2, W, 1);
  if (!an) return;
  if (!vizData || vizData.length !== an.fftSize) vizData = new Uint8Array(an.fftSize);
  an.getByteTimeDomainData(vizData);
  const col = pb ? PAL.lime : PAL.cyan;
  vctx.lineWidth = 2; vctx.strokeStyle = col; vctx.shadowColor = col; vctx.shadowBlur = 8;
  vctx.beginPath();
  const step = vizData.length / W;
  for (let x = 0; x < W; x++) { const y = H / 2 + (vizData[Math.floor(x * step)] / 128 - 1) * H * 0.45; x ? vctx.lineTo(x, y) : vctx.moveTo(x, y); }
  vctx.stroke(); vctx.shadowBlur = 0;
}
let uiErrLogged = false;
function uiLoop() {
  requestAnimationFrame(uiLoop);
  // Un error de dibujo no debe congelar la app ni llenar la consola 60 veces por segundo
  try { uiFrame(); } catch (e) { if (!uiErrLogged) { uiErrLogged = true; console.error('uiLoop:', e); } }
}
function uiFrame() {
  if (document.hidden) return; // pestaña oculta: no gastar batería dibujando
  drawViz();
  if (pb) {
    const pos = pbPos();
    if (pb.kind === 'take') {
      const t = takeById(pb.takeId), card = document.querySelector('.take-card[data-id="' + pb.takeId + '"] .bar');
      if (t && card) card.style.width = Math.min(100, pos / t.duration * 100) + '%';
    } else {
      tl.playhead = Math.min(pos, tl.dur - 1);
      if (pb && pb.kind === 'mix' && !pb.pendingVoice && pos >= tl.dur - 1) { stopAllPlayback(); tl.playhead = 0; }
    }
  } else if (baseMode === 'yt' && ytPlaying && ytPlayer) {
    try { tl.playhead = Math.min(ytPlayer.getCurrentTime() || 0, tl.dur - 1); } catch (e) { }
  }
  tlDraw();
}
requestAnimationFrame(uiLoop);

/* =====================================================================
   ATAJOS (Alt+R grabar/detener · Alt+B beat al inicio · Alt+M mezcla)
   ===================================================================== */
window.addEventListener('keydown', e => {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  if (!['r', 'b', 'm'].includes(k)) return;
  e.preventDefault();
  if (k === 'r') recording ? stopRecording() : startRecording();
  if (k === 'b') {
    const mixOn = pb && pb.kind === 'mix';
    tl.playhead = 0;
    if (mixOn) playMix();
    else if (baseMode === 'yt' && ytPlayer && ytReady) { try { ytPlayer.seekTo(0, true); ytPlayer.playVideo(); } catch (err) { } }
  }
  if (k === 'm') { if (pb && pb.kind === 'mix') stopAllPlayback(); else startMix(); }
});

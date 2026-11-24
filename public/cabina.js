'use strict';
/* =====================================================================
   FlowLab Studio · cabina.js
   La "carcasa" de la nueva interfaz (Mejoras 3 · Parte 1). No cambia el audio ni la Escuela:
   solo organiza lo que ya existe.
     1) Modos:  Cabina · Beats · Escuela  (pestañas de la cabecera, con teclado y enlace #modo)
     2) Base:   las 3 formas juntas (YouTube · MP3/WAV · Armar beat rápido) y su estado
     3) Estímulo: pestaña "Modo entrenamiento" con la palabra grande (usa el diccionario y las rimas de siempre)
     4) Aviso REC en la cabecera cuando grabas y estás en otro modo
   Depende de: freestyle-data.js, app.js (window.Studio) y freestyle-school.js (window.School).
   ===================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const S = window.Studio, D = window.FREESTYLE_DATA;
  const lsGet = (k, d) => { try { const v = localStorage.getItem('flowlab_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem('flowlab_' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: no pasa nada */ } };
  const pad2 = n => String(n).padStart(2, '0');

  /* ---------------- 1) Modos ---------------- */
  const MODOS = {
    cabina: { nombre: 'MODO CABINA', tag: 'Escribe, graba y mezcla.' },
    beats: { nombre: 'MODO BEATS', tag: 'Arma tu propio ritmo.' },
    escuela: { nombre: 'MODO ESCUELA', tag: 'Entrena tu flow, de básico a batalla.' }
  };
  const PERSISTIR = ['cabina', 'beats', 'escuela'];
  const tr = (k, es) => (window.I18n ? I18n.t(k, es) : es);   // inglés si el visitante lo eligió (i18n.js)
  function textoModo(m) { if (!MODOS[m]) return; $('#modeName').textContent = tr('mode.' + m + '.n', MODOS[m].nombre); $('#modeTag').textContent = tr('mode.' + m + '.t', MODOS[m].tag); }
  let modo = null, grabando = false;

  // presets.js (los 25 ritmos) pesa algo: se pide solo la primera vez que entras al modo Beats
  let presetsPedidos = false;
  function cargarPresets() {
    if (presetsPedidos || window.BeatPresets) return; presetsPedidos = true;
    const sc = document.createElement('script'); sc.src = 'presets.js';
    sc.onerror = () => { presetsPedidos = false; const c = $('#btCards'); if (c) c.textContent = 'No se pudieron cargar los ritmos listos (¿sin internet?). Puedes seguir armando tu beat desde cero.'; };
    document.head.appendChild(sc);
  }
  /* ---- Introducción de cada modo: recuadro corto con 3 pasos, "Entendido" lo oculta y se acuerda; el ℹ️ de la cabecera lo vuelve a mostrar ---- */
  const INTRO = {
    cabina: { t: 'Aquí grabas tu voz sobre una base.', pasos: ['Elige una base: un link de YouTube, tu MP3/WAV o un beat de FlowLab.', 'Pulsa REC y rapea. Pulsa otra vez para detener.', 'Escucha tu toma, ajusta la afinación y descárgala.'] },
    beats: { t: 'Aquí armas tu propio ritmo, sin instalar nada.', pasos: ['Elige un género y toca un ritmo.', 'Cámbialo a tu gusto: enciende pasos, añade instrumentos y cambia el kit.', 'Úsalo en la Cabina o descárgalo.'] },
    escuela: { t: 'Aquí practicas freestyle con juegos cortos: te dan una vocal, palabras o un tema, y tú rimas al ritmo de un beat. Ganas puntos y subes de rango.', pasos: ['Elige un juego. Empieza por Univocal en fácil.', 'Pulsa Empezar y rima al ritmo del beat.', 'Al terminar ves tus puntos, tu XP y tu rango.'] }
  };
  const introCajas = {};
  function introCaja(m) {
    if (introCajas[m]) return introCajas[m];
    const pane = $('#mode-' + m), d = INTRO[m]; if (!pane || !d) return null;
    const box = document.createElement('div'); box.className = 'mode-intro hidden'; box.setAttribute('role', 'note'); box.dataset.intro = m;
    const p = document.createElement('p'); p.className = 'mi-title'; p.textContent = tr('intro.' + m + '.t', d.t);
    const ol = document.createElement('ol'); d.pasos.forEach((x, i) => { const li = document.createElement('li'); li.textContent = tr('intro.' + m + '.' + (i + 1), x); ol.append(li); });
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-neon btn-small'; b.textContent = tr('intro.ok', 'Entendido');
    b.addEventListener('click', () => { box.classList.add('hidden'); lsSet('intro_' + m, true); const i = $('#modeInfo'); if (i) i.setAttribute('aria-expanded', 'false'); });
    box.append(p, ol, b);
    const banner = pane.querySelector('.audio-banner'); pane.insertBefore(box, banner ? banner.nextSibling : pane.firstChild);
    return (introCajas[m] = box);
  }
  window.addEventListener('flowlab:lang', () => {   // cambia el idioma: se rehace el texto del modo y de las introducciones (conservando si estaban abiertas)
    if (modo) textoModo(modo);
    Object.keys(introCajas).forEach(m => { const v = !introCajas[m].classList.contains('hidden'); introCajas[m].remove(); delete introCajas[m]; const nb = introCaja(m); if (nb) nb.classList.toggle('hidden', !v); });
  });
  function mostrarIntro(m) {   // al entrar: se ve solo si nunca la cerraste
    const box = introCaja(m); if (!box) return;
    box.classList.toggle('hidden', !!lsGet('intro_' + m, false));
    const i = $('#modeInfo'); if (i) i.setAttribute('aria-expanded', String(!box.classList.contains('hidden')));
  }
  { const i = $('#modeInfo'); if (i) i.addEventListener('click', () => {
    const box = introCaja(modo); if (!box) return;
    const ver = box.classList.contains('hidden'); box.classList.toggle('hidden', !ver); i.setAttribute('aria-expanded', String(ver));
    if (ver) { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); lsSet('intro_' + modo, false); }
  }); }
  // Devuelve una promesa: se cumple cuando los ritmos ya están (los usa la Cabina y la Escuela, solo cuando hacen falta)
  function presetsListos() {
    return new Promise(res => {
      if (window.BeatPresets) return res(true);
      const f = () => { window.removeEventListener('flowlab:presets', f); res(true); };
      window.addEventListener('flowlab:presets', f); cargarPresets();
      setTimeout(() => { window.removeEventListener('flowlab:presets', f); res(!!window.BeatPresets); }, 8000);
    });
  }
  function irA(m, opciones) {
    const o = opciones || {};
    if (!MODOS[m]) m = 'cabina';
    if (m === modo) return;
    const antes = modo; modo = m;
    $$('.mode-pane').forEach(p => p.classList.toggle('hidden', p.dataset.mode !== m));
    $$('.mode-tab').forEach(b => {
      const on = b.dataset.modeTab === m;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
    });
    const base = $('#panel-beat');
    if (base) base.classList.toggle('hidden', !(base.dataset.showIn || '').split(' ').includes(m));
    document.querySelectorAll('.hero-strip').forEach(h => h.classList.toggle('hidden', !(h.dataset.showIn || '').split(' ').includes(m)));
    // La línea de tiempo es UNA sola: en Beats se muestra en su ranura (con la pista "Mi beat"); en Cabina vuelve a la suya
    const tlp = $('#panel-timeline'), ranura = $(m === 'beats' ? '#slotTlBeats' : '#slotTlCabina');
    if (tlp && ranura && tlp.parentElement !== ranura) ranura.appendChild(tlp);
    if (S && S.setBeatLane) S.setBeatLane(m === 'beats');
    if (m === 'beats') cargarPresets();
    textoModo(m);
    mostrarIntro(m);
    // Al salir de un modo no queda nada corriendo "a ciegas"
    if (antes === 'escuela' && window.School && School.stop) School.stop();
    if (m === 'beats' && antes && S && S.stopAll) S.stopAll();
    actualizarPildora();
    if (PERSISTIR.includes(m)) lsSet('mode', m);
    try { history.replaceState(null, '', location.pathname + location.search + '#' + m); } catch (e) { /* file:// u otro: se ignora */ }
    if (antes && !o.sinScroll) window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('flowlab:mode', { detail: { mode: m, prev: antes } }));
  }
  function modoInicial() {
    const h = (location.hash || '').slice(1);
    if (MODOS[h]) return h;
    const g = lsGet('mode', 'cabina');
    return MODOS[g] ? g : 'cabina';
  }
  // Pestañas: clic y flechas del teclado (patrón estándar de pestañas accesibles)
  function pestanas(selector, alActivar) {
    const lista = $$(selector); if (!lista.length) return;
    lista.forEach(b => b.addEventListener('click', () => alActivar(b)));
    lista.forEach(b => b.addEventListener('keydown', e => {
      const i = lista.indexOf(b); let j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % lista.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + lista.length) % lista.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = lista.length - 1;
      if (j >= 0) { e.preventDefault(); alActivar(lista[j]); lista[j].focus(); }
    }));
  }
  pestanas('.mode-tab', b => irA(b.dataset.modeTab));
  document.addEventListener('click', e => { const b = e.target.closest('[data-mode-go]'); if (b) irA(b.dataset.modeGo); });
  window.addEventListener('hashchange', () => { const h = (location.hash || '').slice(1); if (MODOS[h]) irA(h, { sinScroll: true }); });

  /* ---------------- 2) Base: las tres formas ---------------- */
  const marco = $('#ytWrap');
  const parecidoAYouTube = v => /(youtu\.be\/|youtube\.com\/)/i.test(v || '');
  // El video debe estar a la vista ANTES de crear el reproductor (si no, YouTube lo crea sin tamaño)
  const abrirMarco = () => { if (marco && parecidoAYouTube($('#ytInput').value)) marco.classList.remove('off'); };
  $('#ytLoad').addEventListener('click', abrirMarco);
  $('#ytInput').addEventListener('keydown', e => { if (e.key === 'Enter') abrirMarco(); });
  $('#beatQuick').addEventListener('click', () => {
    const alSelector = () => { const t = $('#btGenresTitle'); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); };   // te deja el selector de géneros a la vista
    if (modo !== 'beats') { irA('beats', { sinScroll: true }); setTimeout(alSelector, 60); return; }
    alSelector();
  });
  /* ---- Beat de FlowLab ("de la casa"): elegir uno de los 25 ritmos y cargarlo como Pista 1, en bucle ----
     Así la voz y el beat sí se pueden grabar y exportar juntos (el audio de YouTube no se puede mezclar). */
  const houseBtn = $('#houseToggle'), housePanel = $('#housePanel'), houseCards = $('#houseCards'), houseChips = $('#houseGenres');
  let casaGenero = lsGet('casa_genero', 'trap'), casaActual = '', casaOcupada = false;
  const casaMsg = (t, mal) => { const m = $('#houseMsg'); m.textContent = t; m.classList.toggle('bad', !!mal); };
  function dibujaCasa() {
    const BP = window.BeatPresets; if (!BP) return;
    if (!BP.GENEROS.some(g => g.id === casaGenero)) casaGenero = 'trap';
    houseChips.textContent = '';
    BP.GENEROS.forEach(g => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'bt-gchip'; b.textContent = g.n; b.dataset.genero = g.id; b.setAttribute('aria-pressed', String(g.id === casaGenero));
      b.addEventListener('click', () => { casaGenero = g.id; lsSet('casa_genero', g.id); dibujaCasa(); });
      houseChips.append(b);
    });
    $('#houseTag').textContent = (BP.GENEROS.find(g => g.id === casaGenero) || {}).tag || '';
    houseCards.textContent = '';
    BP.pro.filter(x => x.g === casaGenero).forEach(it => {
      const c = document.createElement('button'); c.type = 'button'; c.className = 'bt-card' + (it.id === casaActual ? ' cur' : ''); c.dataset.id = it.id;
      c.setAttribute('aria-label', 'Usar el beat ' + it.n + ' como base, ' + it.bpm + ' BPM');
      const b = document.createElement('b'); b.textContent = it.n; const s = document.createElement('small'); s.textContent = it.bpm + ' BPM' + (it.steps === 32 ? ' · 2 compases' : '');
      c.append(b, s); c.addEventListener('click', () => usarCasa(it)); houseCards.append(c);
    });
  }
  async function usarCasa(it) {
    if (casaOcupada) return;
    if (S && S.isRecording && S.isRecording()) { casaMsg('Detén la grabación antes de cambiar la base.', true); return; }
    if (!window.Beats || !Beats.renderPreset) { casaMsg('El creador de beats todavía no está listo. Prueba otra vez en un momento.', true); return; }
    casaOcupada = true; casaMsg('⏳ Preparando "' + it.n + '"…');
    try {
      const r = await Beats.renderPreset(it.id, 4);
      if (r && S.setBeatBase(r.buf, r.nombre)) {
        casaActual = it.id; houseCards.querySelectorAll('.bt-card').forEach(c => c.classList.toggle('cur', c.dataset.id === it.id));
        casaMsg('✓ "' + r.nombre + '" quedó como Pista 1, en bucle. Ya puedes grabar encima y exportar tu voz con el beat.');
      } else casaMsg('No se pudo cargar ese beat como base.', true);
    } catch (e) { console.error(e); casaMsg('No se pudo crear el beat: ' + (e && e.message), true); }
    casaOcupada = false;
  }
  houseBtn.addEventListener('click', async () => {
    const abrir = housePanel.classList.contains('hidden');
    housePanel.classList.toggle('hidden', !abrir); houseBtn.setAttribute('aria-expanded', String(abrir));
    if (!abrir) return;
    if (!window.BeatPresets) {
      const ok = await presetsListos();
      if (!ok) { houseCards.textContent = 'No se pudieron cargar los ritmos (¿sin internet?). Puedes subir tu MP3/WAV o armar uno en Beats.'; return; }
    }
    dibujaCasa();
  });
  window.addEventListener('flowlab:presets', () => { if (!housePanel.classList.contains('hidden')) dibujaCasa(); });
  window.addEventListener('flowlab:base', e => {
    const m = (e.detail || {}).mode;
    $('#bc-yt').classList.toggle('on', m === 'yt');
    $('#bc-file').classList.toggle('on', m === 'local');
    $('#beatQuick').classList.toggle('on', m === 'beat');
    if (marco) marco.classList.toggle('off', m !== 'yt'); // con MP3/WAV o beat propio, el marco del video sobra
  });

  /* ---------------- 3) Aviso REC en la cabecera ---------------- */
  function actualizarPildora() { const p = $('#recPill'); if (p) p.classList.toggle('hidden', !(grabando && modo !== 'cabina')); }
  window.addEventListener('flowlab:rec', e => {
    const d = e.detail || {}; grabando = !!d.on;
    $('#recCaption').textContent = grabando ? 'GRABANDO TOMA ' + d.n : 'GRABAR TOMA';
    actualizarPildora();
  });
  $('#recPill').addEventListener('click', () => {
    irA('cabina', { sinScroll: true });
    const v = $('#panel-vocal'); if (v) v.scrollIntoView({ block: 'center' });
  });

  /* ---------------- 4) Estímulo: bloc de notas ↔ modo entrenamiento ---------------- */
  let n = 0, primera = true;
  const bolsa = lista => { let pool = []; return () => { if (!pool.length) pool = lista.slice().sort(() => Math.random() - 0.5); return pool.pop(); }; };
  const FUENTES = D ? {
    palabras: { sig: bolsa(Object.values(D.WORDS).flatMap(nv => Object.values(nv).flat()).filter(w => /^[a-záéíóúüñ]{4,14}$/i.test(w))), pista: 'Sin pensarlo tanto. Conviértelo en una barra.', lema: 'DEJA QUE LA PALABRA TE LLEVE' },
    temas: { sig: bolsa(D.TOPICS), pista: 'Un tema, cuatro barras. No te salgas de él.', lema: 'UN TEMA, CUATRO BARRAS' },
    pies: { sig: bolsa(D.PIES), pista: 'Termina tus 4 barras con esta frase.', lema: 'CIERRA CON ESTA FRASE' },
    contrastes: { sig: bolsa(D.CONTRASTS.map(c => c[0].toUpperCase() + ' ⚡ ' + c[1].toUpperCase())), pista: 'Dos ideas opuestas: conéctalas en tus barras.', lema: 'CONECTA LAS DOS IDEAS' }
  } : null;

  function rimasDe(w) {
    if (!S || !S.rhymeKeys || !S.rhymeWords) return [];
    const k = S.rhymeKeys(w), k2 = S.rhymeKeys(w, true); if (!k) return [];
    const yo = S.stripAcc(w.toLowerCase());
    const buscar = tipo => S.rhymeWords.filter(x => {
      if (S.stripAcc(x.toLowerCase()) === yo) return false;
      const y = S.rhymeKeys(x); return y && (y[tipo] === k[tipo] || (k2 && y[tipo] === k2[tipo]));
    });
    const cons = buscar('cons');
    const lista = cons.length >= 2 ? cons : cons.concat(buscar('ason'));
    return lista.sort(() => Math.random() - 0.5).slice(0, 3);
  }
  function nuevoEstimulo() {
    if (!FUENTES) return;
    const tipo = FUENTES[$('#stimType').value] ? $('#stimType').value : 'palabras', fuente = FUENTES[tipo];
    const item = fuente.sig(); n++;
    const w = $('#stimWord'); w.textContent = item;
    w.className = 'stim-word ' + (item.length <= 9 ? 'xl' : item.length <= 14 ? 'lg' : 'md');
    $('#stimN').textContent = pad2(n);
    $('.stim-label span').textContent = '/ ' + fuente.lema;
    $('#stimHint').textContent = fuente.pista;
    const rimas = tipo === 'palabras' ? rimasDe(item) : [];
    $('#stimPairs').textContent = rimas.length ? rimas.join(' / ') : '—';
    $('.stim-pairs').classList.toggle('hidden', tipo !== 'palabras');
  }
  function irAEstimulo(tab) {
    const entrena = tab === 'entrenamiento';
    $$('.est-tab').forEach(b => { const on = b.dataset.estimuloTab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    $('#est-notas').classList.toggle('hidden', entrena);
    $('#est-entrenamiento').classList.toggle('hidden', !entrena);
    $('#stimTypeWrap').classList.toggle('hidden', !entrena);
    if (entrena && primera) { primera = false; nuevoEstimulo(); }
  }
  pestanas('.est-tab', b => irAEstimulo(b.dataset.estimuloTab));
  $('#stimNext').addEventListener('click', nuevoEstimulo);
  $('#stimType').value = lsGet('stimType', 'palabras') in (FUENTES || {}) ? lsGet('stimType', 'palabras') : 'palabras';
  $('#stimType').addEventListener('change', () => { lsSet('stimType', $('#stimType').value); nuevoEstimulo(); });

  /* ---------------- 5) Audio: el primer toque lo despierta (los navegadores del celular lo exigen) ----------------
     iPhone: además del toque, el sonido debe usar la categoría "reproducción" (si no, el interruptor de silencio lo calla):
       plan A  navigator.audioSession.type = 'playback' (Safari 16.4+; app.js lo pone al inicio y al grabar lo cambia)
       plan B  (iOS más viejo) un <audio> silencioso en bucle, con un archivo propio (assets/silencio.mp3) */
  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let silencio = null;
  function planB() {
    if (!esIOS || navigator.audioSession) return;
    try {
      if (!silencio) { silencio = new Audio('assets/silencio.mp3'); silencio.loop = true; silencio.setAttribute('playsinline', ''); silencio.preload = 'auto'; }
      if (silencio.paused && !(S.isRecording && S.isRecording())) { const p = silencio.play(); if (p && p.catch) p.catch(() => { }); }
    } catch (e) { /* sin <audio>: no pasa nada */ }
  }
  // ¿El sonido está de verdad listo? contexto "running" y, en iPhone, la categoría de reproducción activa
  function audioFunciona() {
    if (!S.ctxState || S.ctxState() !== 'running') return false;
    if (!esIOS) return true;
    if (navigator.audioSession) return navigator.audioSession.type === 'playback' || navigator.audioSession.type === 'auto' || (S.isRecording && S.isRecording());
    return !!(silencio && !silencio.paused);
  }
  let forzarAviso = false;
  function avisoSonido() {
    if (audioFunciona()) forzarAviso = false;
    const mostrar = !audioFunciona() || forzarAviso;
    $$('[data-audio-banner]').forEach(b => b.classList.toggle('on', mostrar));
  }
  setInterval(avisoSonido, 800); avisoSonido();
  window.Cabina_audio = { funciona: audioFunciona, aviso: avisoSonido, forzar: v => { forzarAviso = !!v; avisoSonido(); }, esIOS: () => esIOS };

  // Cada toque/tecla: crea el audio, lo reanuda y reproduce un silencio de 1 muestra (así lo exige iOS), y repone la
  // categoría de reproducción. Si el sistema lo duerme otra vez, el siguiente toque lo despierta.
  const GESTOS = ['touchend', 'pointerup', 'click', 'keydown'];
  function despertar() {                     // se llama en CADA gesto del usuario
    try {
      if (S.audioSession && !(S.isRecording && S.isRecording())) S.audioSession('playback');
      planB();
      const ya = S.ctxState && S.ctxState() === 'running';
      const c = S.ctx();
      if (!ya) { const s1 = c.createBufferSource(); s1.buffer = c.createBuffer(1, 1, 22050); s1.connect(c.destination); s1.start(0); }
      const listo = () => avisoSonido();
      listo(); if (!ya && c.resume) c.resume().then(listo, () => { });
    } catch (e) { /* sin audio en este navegador: la app avisa donde haga falta */ }
  }
  GESTOS.forEach(g => document.addEventListener(g, despertar, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') { if (silencio) silencio.pause(); return; }   // pestaña oculta: el silencio también se detiene
    planB(); avisoSonido();
    try { const c = S.ctx(); if (c.state !== 'running') GESTOS.forEach(g => { document.removeEventListener(g, despertar, true); document.addEventListener(g, despertar, { capture: true, passive: true }); }); } catch (e) { }
  });

  /* ---------------- Arranque ---------------- */
  irA(modoInicial(), { sinScroll: true });
  // "Más opciones": cada sección plegable recuerda si la dejaste abierta o cerrada (si el almacenamiento falla, queda cerrada)
  $$('details.more[id]').forEach(d => {
    if (lsGet('more_' + d.id, false)) d.open = true;
    d.addEventListener('toggle', () => lsSet('more_' + d.id, d.open));
  });
  window.Cabina = { irA, modo: () => modo, estimulo: irAEstimulo, presets: presetsListos };
})();

'use strict';
/* =====================================================================
   FlowLab Studio · freestyle-school.js
   ESCUELA DE FREESTYLE: 10 minijuegos en 5 niveles (de básico a batalla),
   reloj de audio preciso, BPM manual / TAP / detectado de la base,
   verificación opcional por voz, XP, rangos, racha, reto del día e historial.
   Depende de: freestyle-data.js (contenido) y app.js (window.Studio).
   ===================================================================== */
(function () {
  const D = window.FREESTYLE_DATA, S = window.Studio;
  if (!D || !S) { console.error('Escuela: faltan freestyle-data.js o app.js'); return; }
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, a, b, d = 0) => { v = +v; return Number.isFinite(v) ? clamp(v, a, b) : d; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => S.stripAcc(String(s).toLowerCase());
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const pad = n => String(n).padStart(2, '0');
  const dayStr = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad(s % 60); };
  const lsGet = (k, d) => { try { const v = localStorage.getItem('flowlab_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem('flowlab_' + k, JSON.stringify(v)); } catch (e) { } };

  /* ---------------- Juegos (de básico a batalla) ---------------- */
  const GAMES = [
    { id: 'univocal', icon: '🅰️', name: 'Univocal', level: 1, type: 'beat', check: 'family',
      desc: 'Una palabra por barra con la misma vocal: las 4 del bloque riman entre sí y luego cambia la familia (con 🎲 también la vocal).',
      tip: 'Termina cada barra con la palabra que brilla (fama → nada → casa → plata). Así entrenas la rima asonante sin pensar.' },
    { id: 'relampago', icon: '⚡', name: 'Rima Relámpago', level: 1, type: 'typing', check: 'typing',
      desc: 'Contra el reloj: escribe (o di) todas las rimas que puedas.',
      tip: 'Consonante (+2) cuando suena igual desde la vocal fuerte: corazón → canción. Asonante (+1) cuando solo coinciden las vocales: corazón → amor.' },
    { id: 'cadena', icon: '🔗', name: 'Cadena 4x4', level: 2, type: 'beat', check: 'family',
      desc: 'Una palabra por barra: las 4 riman igual (consonante) y después cambia a otra terminación.',
      tip: 'Así se arma un 4x4 de canción: barra 1, 2, 3 y 4 terminan rimando (pasado, lado, soldado, cuidado). Mira las casillas para planear el remate.' },
    { id: 'bomba', icon: '💣', name: 'Palabra Bomba', level: 2, type: 'beat', check: 'word',
      desc: 'Sale una palabra: métela en tu barra antes de que cambie.',
      tip: 'No la sueltes al azar: usa la palabra como remate de la barra. Pro: conecta la palabra nueva con la anterior.' },
    { id: 'objetos', icon: '🖼️', name: 'Objetos', level: 3, type: 'beat', check: 'word',
      desc: 'Aparece un objeto: descríbelo con metáforas.',
      tip: 'Piensa en qué se parece: "soy como el reloj, nunca me detengo". Las comparaciones dan barras memorables.' },
    { id: 'tematicas', icon: '🎯', name: 'Temáticas', level: 3, type: 'beat', check: 'flow',
      desc: 'Un tema: rapea sin salirte de él.',
      tip: 'Estructura: presenta el tema, da un ejemplo personal y remata con una conclusión fuerte en la 4ª barra.' },
    { id: 'terminaciones', icon: '🔚', name: 'Terminaciones', level: 4, type: 'beat', check: 'ending',
      desc: 'Cierra tus barras con palabras que terminen igual.',
      tip: 'Prepara el remate antes: piensa la palabra final primero y construye la barra hacia ella.' },
    { id: 'pie', icon: '🦶', name: 'Pie Forzado', level: 4, type: 'beat', check: 'phrase',
      desc: 'Termina tus 4 barras con la frase exacta.',
      tip: 'Clásico de batallas: las 3 primeras barras deben llevar con sentido a la frase final, que debe rimar con ellas.' },
    { id: 'contrastes', icon: '⚖️', name: 'Contrastes', level: 4, type: 'beat', check: 'both',
      desc: 'Dos ideas opuestas: conéctalas en tus barras.',
      tip: 'Usa la oposición como juego: "fui hielo cuando todos eran fuego". Las antítesis suenan a punchline.' },
    { id: 'personajes', icon: '🎭', name: 'Personajes', level: 4, type: 'beat', check: 'flow',
      desc: 'Rapea en primera persona siendo el personaje.',
      tip: 'Cambia la voz y el punto de vista. Inventa detalles concretos del personaje: dónde vive, qué odia, qué sueña.' },
    { id: 'fms', icon: '🏆', name: 'Modo Batalla', level: 5, type: 'battle', check: 'mixed',
      desc: 'Rondas seguidas: Easy → Hard → Temática → Personajes → Minuto de sangre.',
      tip: 'Simula una competencia real. Administra el aire: respira al final de cada 4 barras y no regales tiempos vacíos.' },
    // ---- Formatos nuevos (Mejoras 7 · G) ----
    { id: 'minutolibre', icon: '⏱️', name: 'Minuto libre', level: 1, type: 'beat', check: 'flow', fixedSec: 60,
      desc: 'Un minuto seguido sobre el beat, sin tema, sin personaje y sin palabras obligadas: tú decides qué decir.',
      tip: 'No te detengas: si te quedas sin ideas, repite el último remate o describe lo que ves a tu alrededor.' },
    { id: 'minutosangre', icon: '🩸', name: 'Minuto de sangre', level: 3, type: 'beat', check: 'word', fixedSec: 60, fixedEvery: 1,
      desc: 'Un minuto a toda velocidad: una palabra nueva en cada compás y tú la metes en tu barra sin parar.',
      tip: 'Es práctica de velocidad: no busques la barra perfecta, busca no soltar el ritmo. Aquí no hay ataques: solo palabras.' },
    { id: 'desahogo', icon: '🫶', name: 'Desahógate', level: 1, type: 'beat', check: 'free', free: true,
      desc: 'Freestyle para sacar lo que sientes: eliges una emoción y el juego te da palabras e ideas de esa emoción. Más tiempo, sin puntaje y sin guardar nada.',
      tip: 'No hay buena ni mala barra. Respira, mira la palabra y di lo primero que sientes. Cuando quieras, pulsa Terminar.',
      nota: 'Si lo que sientes pesa demasiado, no tienes que cargarlo solo: la Línea 113 del Minsa (opción 5, salud mental) atiende gratis las 24 horas en todo el Perú.' },
    { id: 'mibarrio', icon: '🏘️', name: 'Mi barrio', level: 2, type: 'beat', check: 'word', pack: 'mibarrio',
      desc: 'Palabras e ideas de tu barrio: la esquina, la bodega, el paradero… Cuenta tu lugar con tus propias barras.',
      tip: 'Usa detalles que solo tú conoces: un olor, un sonido, un nombre de calle.' },
    { id: 'mihistoria', icon: '📖', name: 'Mi historia', level: 2, type: 'beat', check: 'word', pack: 'mihistoria',
      desc: 'Palabras e ideas para contar tu camino: de dónde vienes, qué aprendiste y hacia dónde vas.',
      tip: 'Una barra por recuerdo: empieza, nudo y remate.' },
    { id: 'superacion', icon: '🏔️', name: 'Superación', level: 2, type: 'beat', check: 'word', pack: 'superacion',
      desc: 'Palabras e ideas de esfuerzo y cambio: metas, caídas, constancia y victorias.',
      tip: 'Cuenta algo concreto que lograste: los detalles hacen creíble la barra.' },
    { id: 'amordesamor', icon: '💔', name: 'Amor y desamor', level: 2, type: 'beat', check: 'word', pack: 'amordesamor',
      desc: 'Palabras e ideas sobre querer y despedirse: promesas, distancia, recuerdos y cómo se sana.',
      tip: 'Habla desde lo que sentiste, sin señalar a nadie: suena más fuerte y más real.' }
  ];
  // Ayuda de cada juego (el "?"): cómo se juega, cómo se puntúa y un ejemplo
  const PUNTOS_BASE = 'Puntaje = consignas × aciertos × 4 × dificultad (y sube con el BPM). XP = mitad del puntaje + 8 por minuto. Verificada por voz = XP completo; si te calificas tú, el 40 %.';
  const AYUDA = {
    univocal: { how: 'Cada barra te da una palabra con la vocal elegida; la dices al final de tu barra. Las 4 palabras de un bloque riman entre sí y luego cambia la familia.', score: PUNTOS_BASE, ex: 'Vocal A: casa → fama → plata → nada.' },
    relampago: { how: 'Te dan una palabra. Escribe (o di) todas las rimas que puedas antes de que acabe el tiempo; Enter después de cada una. "Otra" cambia la palabra.', score: 'Rima consonante +2, asonante +1. Las comprueba el propio juego, así que siempre da el XP completo.', ex: 'Palabra "canción": corazón (+2), amor (+1).' },
    cadena: { how: 'Una palabra por barra: las 4 de cada bloque riman igual (consonante) y después cambia la terminación.', score: PUNTOS_BASE, ex: 'pasado → lado → soldado → cuidado.' },
    bomba: { how: 'Sale una palabra: métela en tu barra antes de que cambie. Cuanto más difícil, más rápido cambia.', score: PUNTOS_BASE, ex: 'Palabra "ventana": "Miro por la ventana y veo mi destino".' },
    objetos: { how: 'Aparece un objeto con su imagen: descríbelo con metáforas o comparaciones.', score: PUNTOS_BASE, ex: '⌚ reloj: "soy como el reloj, nunca me detengo".' },
    tematicas: { how: 'Te dan un tema y rapeas sin salirte de él. El tema cambia cada varios compases.', score: 'Con voz, el juego cuenta cuántas palabras dices (flow continuo); sin voz te calificas tú (XP al 40 %).', ex: 'Tema "la ciudad de noche": presenta, da un ejemplo, desarrolla y remata.' },
    terminaciones: { how: 'Te dan una terminación: cierra tus barras con palabras que terminen igual.', score: PUNTOS_BASE, ex: 'Terminación -ón: canción, razón, corazón.' },
    pie: { how: 'Sale una frase: tus 4 barras deben terminar con esa frase exacta.', score: 'Con voz, cuenta cuántas palabras de la frase dijiste.', ex: 'Frase "y no me van a parar": las 3 primeras barras llevan a ella.' },
    contrastes: { how: 'Dos ideas opuestas: conéctalas en tus barras.', score: 'Con voz, cuenta si dijiste las dos ideas.', ex: 'HIELO ⚡ FUEGO: "fui hielo cuando todos eran fuego".' },
    personajes: { how: 'Te dicen quién eres y rapeas en primera persona, con detalles del personaje.', score: 'Con voz, cuenta cuántas palabras dices (flow continuo).', ex: 'Eres "un taxista de Lima": cuenta tu día al volante.' },
    fms: { how: 'Cinco rondas seguidas, de menos a más presión: Easy, Hard, Temática, Personajes y Minuto de sangre. Cada ronda dura 16 compases.', score: PUNTOS_BASE + ' Cuenta todas las rondas juntas.', ex: 'En EASY sale una palabra cada 4 compases; en MINUTO DE SANGRE, cada compás.' },
    minutolibre: { how: 'Dura 60 segundos sobre el beat. No hay palabra, tema ni personaje: rapeas lo que quieras sin parar.', score: 'Con voz, cuenta cuántas palabras dices (flow continuo); sin voz te calificas tú (XP al 40 %). Es el "minuto libre" de las batallas, pero para practicar solo.', ex: 'Hablas de tu semana, de tu calle o de lo que se te ocurra, 60 segundos seguidos.' },
    minutosangre: { how: 'Dura 60 segundos. Sale una palabra nueva en cada compás y la metes en tu barra sin soltar el ritmo.', score: PUNTOS_BASE, ex: 'Palabras: lluvia → mesa → cohete → río… una por compás.' },
    desahogo: { how: 'Eliges una emoción (rabia, tristeza, alegría, nostalgia, amor, miedo o esperanza). Salen palabras e ideas de esa emoción cada 8 compases; rapea lo que sientas. Termina cuando quieras.', score: 'No hay puntaje ni XP, no se guarda nada y el micrófono no verifica. Es solo para ti.', ex: 'Emoción "esperanza": palabra "semilla", idea "¿qué semilla estás plantando hoy?".' },
    mibarrio: { how: 'Salen palabras e ideas de tu barrio. Úsalas para contar tu lugar con tus propias barras.', score: PUNTOS_BASE, ex: 'Palabra "esquina": "en la esquina de mi casa aprendí a esperar".' },
    mihistoria: { how: 'Salen palabras e ideas para contar tu camino: origen, errores, lecciones y destino.', score: PUNTOS_BASE, ex: 'Palabra "mudanza": cuenta cómo cambió tu vida cuando te mudaste.' },
    superacion: { how: 'Salen palabras e ideas de esfuerzo y cambio. Cuenta algo concreto que lograste o quieres lograr.', score: PUNTOS_BASE, ex: 'Palabra "constancia": "paso a paso, sin prisa y sin pausa".' },
    amordesamor: { how: 'Salen palabras e ideas sobre querer y despedirse. Habla desde lo que sentiste, sin señalar a nadie.', score: PUNTOS_BASE, ex: 'Palabra "distancia": "aunque estés lejos, te canto desde aquí".' }
  };
  const FASES = [
    ['EASY', 'Palabra Bomba tranquila: una palabra nueva cada 4 compases. Sirve para calentar.', 'ventana → "Miro por la ventana y veo mi destino".'],
    ['HARD', 'Palabra Bomba más rápida: una palabra nueva cada 2 compases.', 'Dos palabras seguidas en solo 8 golpes.'],
    ['TEMÁTICA', 'Un tema para 16 compases: rapeas sin salirte de él.', 'Tema "mi ciudad": presenta, ejemplo, desarrolla, remata.'],
    ['PERSONAJES', 'Un personaje para 16 compases: rapeas en primera persona siendo él.', '"Un pirata": cuentas qué buscas en el mar.'],
    ['MINUTO DE SANGRE', 'Palabra Bomba a toda velocidad: una palabra nueva en cada compás.', 'lluvia → mesa → cohete, una por compás.']
  ];
  window.__ayudaEscuela = key => {
    let m;
    if ((m = /^game_(\w+)$/.exec(key)) && AYUDA[m[1]]) { const g = GAME[m[1]], a = AYUDA[m[1]]; return [g.name, 'Qué es: ' + g.desc + ' Cómo se juega: ' + a.how + ' Cómo se puntúa: ' + a.score, a.ex]; }
    if ((m = /^fase_(\d)$/.exec(key)) && FASES[+m[1]]) { const f = FASES[+m[1]]; return ['Ronda ' + (+m[1] + 1) + ' · ' + f[0], f[1] + ' Se puntúa como el resto del Modo Batalla.', f[2]]; }
    return null;
  };
  const GAME = Object.fromEntries(GAMES.map(g => [g.id, g]));
  const DIFFS = ['facil', 'medio', 'dificil'];
  const DIFF_LABEL = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
  const DIFF_MULT = { facil: 1, medio: 1.5, dificil: 2 };
  const LEVEL_XP = { 1: 0, 2: 60, 3: 200, 4: 450, 5: 900 };
  const RANKS = [[0, 'Novato'], [100, 'Aprendiz'], [300, 'MC de Barrio'], [700, 'Retador'], [1500, 'Freestyler'], [3000, 'Veterano de Plaza'], [6000, 'Leyenda']];
  // Compases por consigna según juego y dificultad [fácil, medio, difícil]
  const EVERY = { univocal: [2, 1, 1], cadena: [2, 1, 1], bomba: [4, 2, 1], objetos: [4, 4, 2], tematicas: [16, 8, 8], terminaciones: [4, 4, 2], pie: [4, 4, 4], contrastes: [4, 4, 2], personajes: [16, 8, 8] };
  const BATTLE = [
    { name: 'EASY', game: 'bomba', every: 4 }, { name: 'HARD', game: 'bomba', every: 2 },
    { name: 'TEMÁTICA', game: 'tematicas', every: 16 }, { name: 'PERSONAJES', game: 'personajes', every: 16 },
    { name: 'MINUTO DE SANGRE', game: 'bomba', every: 1 }
  ];
  const BATTLE_BARS = 16;

  /* ---------------- Progreso guardado (validado al leer) ---------------- */
  function sanitize(d) {
    const o = { xp: 0, history: [], bests: {}, bestsS: {}, streak: { last: '', count: 0, best: 0 }, mission: '', unlockAll: false, cfg: {} };
    if (!d || typeof d !== 'object') return o;
    o.xp = num(d.xp, 0, 1e7);
    if (Array.isArray(d.history)) o.history = d.history.filter(h => h && typeof h === 'object').slice(0, 300).map(h => ({
      t: String(h.t || '').slice(0, 25), g: GAME[h.g] ? h.g : 'bomba', d: DIFFS.includes(h.d) ? h.d : 'medio',
      bpm: num(h.bpm, 40, 240, 90), dur: num(h.dur, 0, 36000), pr: num(h.pr, 0, 9999), acc: num(h.acc, 0, 1),
      sc: num(h.sc, 0, 1e6), xp: num(h.xp, 0, 1e6), v: !!h.v, w: num(h.w, 0, 1e6),
      // verificada = la comprobó la voz (o el propio juego, en Rima Relámpago); las anteriores a esta versión con voz cuentan como verificadas
      ver: h.ver === undefined ? (!!h.v || (GAME[h.g] && GAME[h.g].type === 'typing')) : !!h.ver
    }));
    // dos listas de récords separadas: bests = rondas verificadas · bestsS = rondas de autoevaluación
    if (d.bests && typeof d.bests === 'object') GAMES.forEach(g => { if (d.bests[g.id] != null) o.bests[g.id] = num(d.bests[g.id], 0, 1e6); });
    if (d.bestsS && typeof d.bestsS === 'object') GAMES.forEach(g => { if (d.bestsS[g.id] != null) o.bestsS[g.id] = num(d.bestsS[g.id], 0, 1e6); });
    if (d.streak && typeof d.streak === 'object') o.streak = { last: /^\d{4}-\d{2}-\d{2}$/.test(d.streak.last) ? d.streak.last : '', count: num(d.streak.count, 0, 1e5), best: num(d.streak.best, 0, 1e5) };
    o.mission = /^\d{4}-\d{2}-\d{2}$/.test(d.mission) ? d.mission : '';
    o.unlockAll = !!d.unlockAll;
    if (d.cfg && typeof d.cfg === 'object') o.cfg = {
      game: GAME[d.cfg.game] ? d.cfg.game : 'univocal', diff: DIFFS.includes(d.cfg.diff) ? d.cfg.diff : 'facil',
      every: ['auto', '1', '2', '4', '8'].includes(d.cfg.every) ? d.cfg.every : 'auto',
      dur: ['60', '120', '180', '300', '0'].includes(d.cfg.dur) ? d.cfg.dur : '120',
      vowel: 'aeiou*'.includes(d.cfg.vowel) && d.cfg.vowel ? d.cfg.vowel : 'a'
    };
    return o;
  }
  let data = sanitize(lsGet('school', null));
  const save = () => lsSet('school', data);

  const rankOf = xp => { let r = RANKS[0], next = null; for (let i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; } } return { name: r[1], from: r[0], next }; };
  const isUnlocked = g => data.unlockAll || data.xp >= LEVEL_XP[g.level];

  /* ---------------- Bolsas sin repetición ---------------- */
  function bag(list) { let pool = []; return () => { if (!pool.length) pool = list.slice().sort(() => Math.random() - 0.5); return pool.pop(); }; }
  const flat = lvl => Object.entries(D.WORDS[lvl]).flatMap(([cat, ws]) => ws.map(w => ({ w, cat })));
  const extra = (S.rhymeWords || []).map(w => ({ w, cat: 'rimable' }));
  const WORD_BAGS = { facil: bag(flat('facil')), medio: bag(flat('facil').concat(flat('medio'), extra)), dificil: bag(flat('medio').concat(flat('dificil'))) };
  const CAT_LABEL = { objetos: 'objeto', naturaleza: 'naturaleza', animales: 'animal', comida: 'comida', cuerpo: 'cuerpo', ciudad: 'ciudad', acciones: 'acción', emociones: 'emoción', profesiones: 'profesión', deportes: 'deporte', musica: 'música', tecnologia: 'tecnología', peru: 'Perú', viajes: 'viaje', abstractos: 'concepto', cultas: 'palabra culta', ciencia: 'ciencia', sociedad: 'sociedad', filosofia: 'filosofía', rimable: 'palabra' };
  const B = {
    topic: bag(D.TOPICS), pie: bag(D.PIES), contrast: bag(D.CONTRASTS), ending: bag(D.ENDINGS),
    object: bag(D.OBJECTS), character: bag(D.CHARACTERS),
    relampago: bag(D.ENDINGS.flatMap(e => e[1].split(/,\s*/)))
  };

  /* ---- Familias de rima (Univocal y Cadena 4x4): palabras agrupadas por cómo suenan al final ---- */
  const FAM = { ason: {}, cons: {} };
  {
    const seen = new Set();
    const all = Object.values(D.WORDS).flatMap(l => Object.values(l).flat()).concat(Object.values(D.VOWELS).flat(), S.rhymeWords || []);
    all.forEach(w => {
      if (!/^[a-záéíóúüñ]{3,}$/.test(w)) return; // fuera nombres propios y palabras muy cortas
      const n = norm(w); if (seen.has(n)) return; seen.add(n);
      const k = S.rhymeKeys(w); if (!k) return;
      (FAM.ason[k.ason] = FAM.ason[k.ason] || []).push(w);
      (FAM.cons[k.cons] = FAM.cons[k.cons] || []).push(w);
    });
  }
  function famFor(mode, diff, vowel, avoid) {
    const maxLen = diff === 'facil' ? 7 : diff === 'medio' ? 9 : 99;
    const ok = (key, ws) => ws.length >= 4 && (!vowel || key[0] === vowel) && key !== avoid;
    let list = Object.entries(FAM[mode]).map(([key, ws]) => [key, ws.filter(w => w.length <= maxLen)]).filter(([key, ws]) => ok(key, ws));
    if (!list.length) list = Object.entries(FAM[mode]).filter(([key, ws]) => ok(key, ws));
    return list.length ? pick(list) : null;
  }
  const endingOf = w => { const k = S.rhymeKeys(w); return k ? k.ending : ''; };
  // Estructura del 4x4 que se muestra en las casillas de barras, según el juego
  const SLOT_LABELS = {
    tematicas: ['presenta', 'ejemplo', 'desarrolla', 'remata'],
    personajes: ['quién soy', 'dónde estoy', 'qué siento', 'remate'],
    pie: ['prepara', 'prepara', 'prepara', '¡FRASE!']
  };

  /* ---------------- Generador de consignas ---------------- */
  const emociones = D.EMOCIONES || {}, temasP = D.TEMAS_PROPIOS || {};
  let emocion = Object.keys(emociones).includes(lsGet('school_emocion', '')) ? lsGet('school_emocion', '') : 'esperanza';
  const bolsaPalabras = {}, bolsaIdeas = {};
  function packPrompt(pack, key) {                     // una palabra y una idea del paquete, sin repetir hasta agotar la lista
    const id = key + '_w', ii = key + '_i';
    bolsaPalabras[id] = bolsaPalabras[id] || bag(pack.palabras); bolsaIdeas[ii] = bolsaIdeas[ii] || bag(pack.ideas);
    const word = bolsaPalabras[id]();
    return { main: word, sub: pack.icon + ' ' + bolsaIdeas[ii](), check: { type: 'word', word } };
  }
  function makePrompt(gid, diff, vowelCfg, s) {
    switch (gid) {
      case 'minutolibre': return { main: 'LIBRE', cls: 'xl', sub: 'Un minuto sin tema: di lo que quieras y no pares', slotLabels: ['abre', 'sube', 'aprieta', 'cierra'], check: { type: 'flow' } };
      case 'minutosangre': return makePrompt('bomba', diff, vowelCfg, s);
      case 'desahogo': { const pk = emociones[emocion] || emociones.esperanza; const p = packPrompt(pk, 'emo_' + emocion); p.check = { type: 'flow' }; return p; }
      case 'mibarrio': case 'mihistoria': case 'superacion': case 'amordesamor': return packPrompt(temasP[gid], 'tema_' + gid);
      case 'univocal': case 'cadena': {
        const st = s ? (s.fam || (s.fam = { i: 0, words: [], key: '', v: '' })) : { i: 0, words: [] };
        if (st.i % 4 === 0 || !st.words.length) {
          // Bloque nuevo de 4 barras: nueva familia (y nueva vocal si eligió el dado)
          const mode = gid === 'univocal' ? 'ason' : 'cons';
          if (gid === 'univocal') st.v = vowelCfg === '*' ? pick('aeiou'.split('').filter(x => x !== st.v)) : vowelCfg;
          const f = famFor(mode, diff, gid === 'univocal' ? st.v : null, st.key);
          if (!f) return makePrompt('bomba', diff, vowelCfg, s);
          st.key = f[0]; st.mode = mode; st.i = 0;
          st.words = f[1].slice().sort(() => Math.random() - 0.5).slice(0, 4);
        }
        const pos = st.i++, word = st.words[pos];
        const tag = gid === 'univocal' ? 'vocal ' + st.v.toUpperCase() : 'termina en -' + endingOf(st.words[0]);
        return { main: word, sub: tag + ' · barra ' + (pos + 1) + ' de 4', slots: st.words.slice(), slotPos: pos, check: { type: 'family', mode: st.mode, key: st.key } };
      }
      case 'bomba': {
        const it = WORD_BAGS[diff]();
        return { main: it.w, sub: CAT_LABEL[it.cat] || '', check: { type: 'word', word: it.w } };
      }
      case 'objetos': {
        const [emo, word] = B.object();
        return { main: emo, cls: 'emoji', sub: word, check: { type: 'word', word } };
      }
      case 'tematicas': return { main: B.topic(), cls: 'long', sub: 'no te salgas del tema', slotLabels: SLOT_LABELS.tematicas, check: { type: 'flow' } };
      case 'personajes': return { main: 'Eres ' + B.character(), cls: 'long', sub: 'rapea en primera persona', slotLabels: SLOT_LABELS.personajes, check: { type: 'flow' } };
      case 'terminaciones': {
        const [end, ex] = B.ending();
        const k = S.rhymeKeys(ex.split(/,\s*/)[0]);
        return { main: end.toUpperCase(), sub: diff === 'dificil' ? 'sin ayudas 😈' : 'ej: ' + ex, slotLabels: [end, end, end, end], check: { type: 'ending', key: k ? k.cons : '' } };
      }
      case 'pie': {
        const line = B.pie();
        return { main: '“' + line + '”', cls: 'long', sub: 'cierra tus 4 barras con esta frase', slotLabels: SLOT_LABELS.pie, check: { type: 'phrase', phrase: line } };
      }
      case 'contrastes': {
        const [a, b] = B.contrast();
        return { main: a.toUpperCase() + ' ⚡ ' + b.toUpperCase(), cls: 'mid', sub: 'conecta las dos ideas', slotLabels: [a, 'conecta', b, 'remata'], check: { type: 'both', a, b } };
      }
    }
    return { main: '—', sub: '', check: { type: 'flow' } };
  }

  /* ---------------- Verificación por voz (beta) ---------------- */
  const tokens = text => String(text).toLowerCase().replace(/[^a-záéíóúüñ\s]/g, ' ').split(/\s+/).filter(Boolean);
  const Voice = {
    rec: null, on: false, finals: [], interim: '', restarts: 0, lastStart: 0, total: 0,
    supported: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    failed: '',
    start(onWords, onFail) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return false;
      S.stopDictation(); // el navegador solo permite un reconocimiento a la vez
      // iPhone: el micrófono abierto por la cabina y el reconocimiento de voz se pelean por el mismo micrófono → se suelta el de la cabina (se vuelve a abrir solo al grabar)
      if (S.esIOS && S.esIOS() && S.soltarMic) S.soltarMic();
      this.onWords = onWords; this.onFail = onFail || null; this.failed = ''; this.finals = []; this.interim = ''; this.total = 0; this.restarts = 0;
      if (!this.rec) {
        this.rec = new SR(); this.rec.lang = 'es-PE'; this.rec.continuous = true; this.rec.interimResults = true;
        this.rec.onresult = e => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) { const w = tokens(r[0].transcript); if (w.length) { this.finals.push({ t: performance.now(), w }); this.total += w.length; if (this.onWords) this.onWords(w); } }
            else interim += r[0].transcript + ' ';
          }
          this.interim = interim;
        };
        this.rec.onerror = e => {
          if (['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'].includes(e.error)) {
            this.on = false; this.failed = e.error;
            toast(e.error === 'network' ? '🎙 El servicio de voz del navegador no responde (¿sin internet?). Se usará la autoevaluación.' : '🎙 No pude usar el micrófono para verificar por voz. Se usará la autoevaluación.', 'bad');
            if (this.onFail) this.onFail(e.error);
          }
        };
        this.rec.onend = () => {
          const quick = performance.now() - this.lastStart < 1000;
          this.restarts = quick ? this.restarts + 1 : 0;
          if (this.on && this.restarts < 5) { try { this.lastStart = performance.now(); this.rec.start(); } catch (err) { } }
          else this.on = false;
        };
      }
      this.on = true;
      try { this.lastStart = performance.now(); this.rec.start(); } catch (e) { }
      return true;
    },
    stop() { this.on = false; try { if (this.rec) this.rec.stop(); } catch (e) { } },
    wordsBetween(a, b) { return this.finals.filter(f => f.t >= a && f.t <= b).flatMap(f => f.w); }
  };
  window.School = {
    isListening: () => Voice.on, stopVoice: () => Voice.stop(),
    running: () => !!sess && !sess.ended,
    stop: () => { if (sess && !sess.ended) stopSession(); },   // al salir del modo Escuela no queda un juego corriendo sin verse
    ayuda: key => window.__ayudaEscuela(key),
    beat: () => (gb ? { id: gb.item.id, bpm: gb.bpm, nombre: beatName(gb.item, gb.bpm), vol: gb.gain.gain.value } : null),
    timing: () => (sess ? { t0: sess.t0, beat: sess.beat, bpm: sess.bpm, beatOn: !!sess.beatOn } : null)
  };

  function keysFor(w) { return S.rhymeKeys(w) || null; }
  /* Revisa una consigna contra las palabras que dijo el usuario. Devuelve la nota (0 a 1, la de siempre) y el detalle
     palabra por palabra: v = 1 la dijo, 0.5 la dijo con una pequeña variación (mismo comienzo), 0 no la dijo.
     "kind: 'w'" son palabras concretas (para "Dijiste X de Y palabras"); las demás consignas se cuentan aparte. */
  function checkDetail(p, words) {
    const nw = words.map(norm), c = p.check;
    const has = target => { const t = norm(target); const stem = t.slice(0, Math.max(3, t.length - 2)); return nw.includes(t) ? 1 : (nw.some(x => x.startsWith(stem)) ? 0.5 : 0); };
    const it = (w, v, kind) => ({ w: String(w).slice(0, 60), v, kind: kind || 'c' });
    switch (c.type) {
      case 'word': {
        const items = String(c.word).split(' ').filter(Boolean).map(t => it(t, has(t), 'w'));
        return { score: items.reduce((a, i) => Math.min(a, i.v), 1), items };
      }
      case 'both': {
        const items = [it(c.a, has(c.a), 'w'), it(c.b, has(c.b), 'w')];
        return { score: (items[0].v + items[1].v) / 2, items };
      }
      case 'family': {
        const n = words.filter(w => { const k = S.rhymeKeys(w), k2 = S.rhymeKeys(w, true); return (k && k[c.mode] === c.key) || (k2 && k2[c.mode] === c.key); }).length;
        const v = n >= 1 ? 1 : 0; return { score: v, items: [it('rima con ' + (p.main || ''), v)] };
      }
      case 'vowel': {
        const ks = words.filter(w => w.length > 2).map(keysFor).filter(Boolean);
        let v = 0; if (ks.length >= 3) { const r = ks.filter(k => k.ason[0] === c.v).length / ks.length; v = r >= 0.35 ? 1 : r >= 0.2 ? 0.5 : 0; }
        return { score: v, items: [it('palabras con la vocal ' + String(c.v).toUpperCase(), v)] };
      }
      case 'ending': {
        const n = words.filter(w => { const k = keysFor(w), k2 = S.rhymeKeys(w, true); return (k && k.cons === c.key) || (k2 && k2.cons === c.key); }).length;
        const v = n >= 2 ? 1 : n === 1 ? 0.6 : 0; return { score: v, items: [it('terminar con ' + (p.main || ''), v)] };
      }
      case 'phrase': {
        const raw = tokens(c.phrase).filter(x => norm(x).length > 2), pw = raw.map(norm);
        const hits = pw.map(x => nw.includes(x) ? 1 : 0), r = pw.length ? hits.reduce((a, b) => a + b, 0) / pw.length : 0;
        return { score: r >= 0.6 ? 1 : r >= 0.3 ? 0.5 : 0, items: raw.map((t, i) => it(t, hits[i], 'w')) };
      }
      case 'flow': default: {
        const need = Math.max(6, (p.bars || 4) * 4), v = clamp(words.length / need, 0, 1);
        return { score: v, items: [it('flow continuo (' + Math.min(words.length, need) + ' de ' + need + ' palabras)', v)] };
      }
    }
  }

  /* ---------------- DOM ---------------- */
  const el = {
    grid: $('#gameGrid'), info: $('#gameInfo'), bpm: $('#bpmInput'), tap: $('#tapBtn'), detect: $('#bpmDetect'),
    diff: $('#diffSel'), every: $('#everySel'), dur: $('#durSel'), vowelPicker: $('#vowelPicker'),
    metro: $('#metronome'), withBase: $('#withBase'), voice: $('#voiceCheck'), showNext: $('#showNext'),
    start: $('#gymStart'), stop: $('#gymStop'), full: $('#stageFull'), stage: $('#gymStage'),
    main: $('#gymMain'), sub: $('#gymSub'), next: $('#gymNext'), sGame: $('#stageGame'), sTimer: $('#stageTimer'),
    barFill: $('#stageBarFill'), feedback: $('#gymFeedback'), rl: $('#relampago'), rlInput: $('#rlInput'), rlFound: $('#rlFound'), rlSkip: $('#rlSkip'),
    rate: $('#ratePanel'), slots: $('#barSlots'), result: $('#sessionResult'), dots: $$('#beatDots span'),
    bar: $('#barCount'), beat: $('#beatCount'), bpmLbl: $('#gymBpmLabel'), prompts: $('#promptCount'), vMeter: $('#voiceMeter'),
    mission: $('#mission'),
    gbeat: $('#gameBeat'), gbvol: $('#gameBeatVol'), beatNow: $('#beatNow'), beatNext: $('#beatNext')
  };
  let selected = data.cfg.game || 'univocal';
  if (!isUnlocked(GAME[selected])) selected = 'univocal';

  function setMain(text, cls) {
    el.main.className = 'gym-main' + (cls ? ' ' + cls : '');
    el.main.textContent = text;
    el.main.classList.remove('flash'); void el.main.offsetWidth; el.main.classList.add('flash');
  }
  // Casillas del 4x4: en qué barra vas y, en Univocal/Cadena, las 4 palabras del bloque
  function renderSlots(p, barPos) {
    if (!p) { el.slots.innerHTML = ''; return; }
    const fam = !!p.slots, pos = fam ? p.slotPos : barPos;
    const labels = fam ? p.slots : (p.slotLabels || ['', '', '', '']);
    el.slots.innerHTML = labels.map((t, k) => {
      const hide = fam && k > pos && !el.showNext.checked;
      return '<span class="slot' + (k === pos ? ' on' : k < pos ? ' done' : '') + '"><i>' + (k + 1) + '</i>' + esc(hide ? '?' : t) + '</span>';
    }).join('');
  }
  let toastT = null;
  function toast(msg, kind) {
    el.feedback.textContent = msg; el.feedback.className = 'gym-feedback show' + (kind ? ' ' + kind : '');
    clearTimeout(toastT); toastT = setTimeout(() => { el.feedback.className = 'gym-feedback'; }, 1400);
  }
  function saveCfg() {
    data.cfg = { game: selected, diff: el.diff.value, every: el.every.value, dur: el.dur.value, vowel: currentVowel };
    save();
  }

  /* ---------------- Render de cabecera, juegos y progreso ---------------- */
  function renderHeader() {
    const r = rankOf(data.xp);
    $('#rankName').textContent = r.name;
    $('#rankXp').textContent = Math.round(data.xp) + ' XP';
    $('#streakNow').textContent = data.streak.count;
    const pct = r.next ? (data.xp - r.from) / (r.next[0] - r.from) * 100 : 100;
    $('#xpFill').style.width = clamp(pct, 0, 100) + '%';
    $('#xpMeta').textContent = r.next ? Math.round(data.xp) + ' / ' + r.next[0] + ' XP para ' + r.next[1] : '¡Rango máximo alcanzado!';
  }
  function renderGrid() {
    el.grid.innerHTML = GAMES.map(g => {
      const lock = !isUnlocked(g);
      return '<button type="button" class="game-card' + (g.id === selected ? ' on' : '') + (lock ? ' locked' : '') + '" data-g="' + g.id + '"' + (lock ? ' aria-disabled="true"' : '') + '>' +
        '<span class="gc-icon">' + g.icon + '</span><span class="gc-name">' + esc(g.name) + '</span>' +
        '<span class="gc-meta">Nv ' + g.level + (data.bests[g.id] ? ' · 🏅 ' + Math.round(data.bests[g.id]) : '') + '</span>' +
        (lock ? '<span class="gc-lock">🔒 ' + LEVEL_XP[g.level] + ' XP</span>' : '') + '</button>';
    }).join('');
    const g = GAME[selected];
    el.info.innerHTML = '<span class="what">¿Qué es esto?</span> <b>' + g.icon + ' ' + esc(g.name) + '</b>' +
      '<button type="button" class="help-q" data-help="game_' + g.id + '" aria-label="Ayuda: ' + esc(g.name) + '">?</button> — ' + esc(g.desc) + '<br><span class="tip">💡 ' + esc(g.tip) + '</span>' +
      (g.nota ? '<br><span class="nota-apoyo">💬 ' + esc(g.nota) + '</span>' : '') +
      (g.id === 'fms' ? '<div class="phases">' + FASES.map((f, i) => '<span class="phase">' + (i + 1) + '. ' + esc(f[0]) + '<button type="button" class="help-q" data-help="fase_' + i + '" aria-label="Ayuda: ronda ' + esc(f[0]) + '">?</button></span>').join('') + '</div>' : '');
    el.vowelPicker.classList.toggle('hidden', selected !== 'univocal');
    // Univocal y Cadena cambian palabra cada barra: "Cambio cada" sigue disponible para ir más lento
    el.every.disabled = g.type !== 'beat' || !!g.fixedEvery || !!g.fixedSec;
    el.dur.disabled = g.type === 'battle' || !!g.fixedSec || !!g.free;
    const ep = $('#emotionPicker'); if (ep) ep.classList.toggle('hidden', selected !== 'desahogo');
  }
  function missionOfToday() {
    const day = dayStr(); let h = 7;
    for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const avail = GAMES.filter(g => isUnlocked(g) && !g.free);
    const g = avail[h % avail.length];
    const maxD = data.xp < 300 ? 0 : data.xp < 1500 ? 1 : 2;
    return { g, diff: DIFFS[(h >>> 4) % (maxD + 1)], done: data.mission === day };
  }
  function renderMission() {
    const m = missionOfToday();
    el.mission.innerHTML = '<span class="m-label">🎯 Reto del día</span> <b>' + m.g.icon + ' ' + esc(m.g.name) + '</b> · ' + DIFF_LABEL[m.diff] +
      (m.done ? ' <span class="m-done">✓ completado</span>' : ' <span class="m-xp">+50 XP</span> <button type="button" class="btn btn-gold btn-small" id="missionGo">Preparar</button>');
    const go = $('#missionGo');
    if (go) go.addEventListener('click', () => { selected = m.g.id; el.diff.value = m.diff; saveCfg(); renderGrid(); el.start.focus(); });
  }
  function renderProgress() {
    const h = data.history, mins = h.reduce((a, x) => a + x.dur, 0) / 60, words = h.reduce((a, x) => a + x.w, 0);
    const r = rankOf(data.xp);
    const stats = [['Rango', r.name], ['XP total', Math.round(data.xp)], ['Sesiones', h.length], ['Minutos', Math.round(mins)],
      ['Racha', data.streak.count + ' días'], ['Mejor racha', data.streak.best + ' días'], ['Palabras (voz)', words],
      ['Precisión media', h.length ? Math.round(h.reduce((a, x) => a + x.acc, 0) / h.length * 100) + '%' : '—']];
    $('#statGrid').innerHTML = stats.map(s => '<div class="stat-box"><span>' + esc(s[0]) + '</span><b>' + esc(s[1]) + '</b></div>').join('');
    // Últimos 14 días
    const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(dayStr(d)); }
    const per = days.map(d => h.filter(x => x.t.slice(0, 10) === d).reduce((a, x) => a + x.dur, 0) / 60);
    const max = Math.max(5, ...per);
    $('#dayBars').innerHTML = per.map((m, i) => '<div class="day-bar" title="' + days[i] + ': ' + m.toFixed(1) + ' min"><i style="height:' + (m / max * 100).toFixed(1) + '%"></i><span>' + days[i].slice(8) + '</span></div>').join('');
    $('#bests').innerHTML = GAMES.map(g => '<div class="best-row"><span>' + g.icon + ' ' + esc(g.name) + '</span><b title="Récord de rondas verificadas">' + (data.bests[g.id] ? '✓ ' + Math.round(data.bests[g.id]) : '—') + '</b><em class="best-s" title="Récord de rondas de autoevaluación (sin verificar)">' + (data.bestsS[g.id] ? 'sin verificar ' + Math.round(data.bestsS[g.id]) : '') + '</em></div>').join('');
    $('#historyList').innerHTML = h.length ? h.slice(0, 30).map(x =>
      '<div class="hist-row"><span class="h-date">' + esc(x.t.replace('T', ' ').slice(0, 16)) + '</span><span>' + GAME[x.g].icon + ' ' + esc(GAME[x.g].name) + '</span>' +
      '<span>' + DIFF_LABEL[x.d] + ' · ' + x.bpm + ' BPM · ' + fmt(x.dur) + '</span><span>' + Math.round(x.acc * 100) + '%' + (x.v ? ' 🎙' : '') + (x.ver ? '' : ' · sin verificar') + '</span><b>+' + Math.round(x.xp) + ' XP</b></div>').join('')
      : '<p class="hint">Aún no hay sesiones. ¡Juega tu primera ronda!</p>';
    $('#unlockAll').checked = data.unlockAll;
  }
  function renderAll() { renderHeader(); renderGrid(); renderMission(); renderProgress(); renderStartHere(); }

  /* ---------------- Para quien llega por primera vez (Mejoras 7 · F) ---------------- */
  // "Empieza aquí": solo se ve mientras no hayas jugado ninguna ronda (o hasta que digas que ya sabes)
  function renderStartHere() {
    const sh = $('#startHere'); if (!sh) return;
    sh.classList.toggle('hidden', data.history.length > 0 || !!lsGet('school_hide_start', false));
  }
  $('#startHereGo').addEventListener('click', () => {
    if (sess) return;
    selected = 'univocal'; el.diff.value = 'facil'; el.dur.value = '60'; el.every.value = 'auto'; saveCfg(); renderGrid();
    el.start.classList.add('pulse'); setTimeout(() => el.start.classList.remove('pulse'), 3500);
    el.start.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.start.focus({ preventScroll: true });
    toast('Listo: Univocal · fácil · 1 minuto. Pulsa Empezar.', 'good');
  });
  {  // Desahógate: botones de emoción
    const box = $('#emotionBtns'), pintaEmo = () => box.querySelectorAll('.emo-btn').forEach(b => b.classList.toggle('active', b.dataset.e === emocion));
    Object.entries(emociones).forEach(([k, e]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'emo-btn'; b.dataset.e = k; b.textContent = e.icon + ' ' + e.n; b.addEventListener('click', () => { emocion = k; lsSet('school_emocion', k); pintaEmo(); }); box.append(b); });
    pintaEmo();
  }
  $('#startHereHide').addEventListener('click', () => { lsSet('school_hide_start', true); renderStartHere(); });
  // "Elige tu beat": tres caminos. Sin base cargada, el juego arranca solo con un beat de FlowLab.
  const bpNow = $('#beatPickNow'), bpOpts = $$('#beatPick .bp-opt');
  let eleg = ['flowlab', 'yt', 'mp3'].includes(lsGet('school_elige', 'flowlab')) ? lsGet('school_elige', 'flowlab') : 'flowlab';
  function pintaEleccion() {
    const m = S.baseMode(), hayBase = m !== 'none';
    bpOpts.forEach(b => { const on = b.dataset.bp === eleg; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    el.withBase.checked = eleg !== 'flowlab';
    let t;
    if (eleg === 'flowlab') t = el.gbeat.value === 'none' ? 'Sin beat: suena solo el metrónomo (cámbialo en "Más opciones").' : 'Juegas sobre un beat de FlowLab que cambia en cada partida. No tienes que hacer nada más.';
    else if (!hayBase) t = eleg === 'yt' ? 'Pega tu link de YouTube en la base de arriba y pulsa Cargar. Mientras tanto suena un beat de FlowLab.' : 'Elige tu archivo MP3/WAV. Mientras tanto suena un beat de FlowLab.';
    else t = m === 'yt' ? 'Juegas con tu video de YouTube: arranca solo al pulsar Empezar.' : 'Juegas con tu base' + (S.baseIsBeat && S.baseIsBeat() ? ' (el beat que armaste)' : ' MP3/WAV') + ': arranca sola al pulsar Empezar.';
    bpNow.textContent = t;
  }
  bpOpts.forEach(b => b.addEventListener('click', () => {
    if (sess) { toast('Termina la partida para cambiar de beat.', 'bad'); return; }
    eleg = b.dataset.bp; lsSet('school_elige', eleg);
    if (eleg === 'flowlab' && el.gbeat.value === 'none') { el.gbeat.value = 'random'; lsSet('school_beat', 'random'); gbNext = null; beatLabel(); }
    pintaEleccion();
    if (eleg === 'yt') { const i = $('#ytInput'); if (i) { i.scrollIntoView({ block: 'center', behavior: 'smooth' }); i.focus({ preventScroll: true }); } }
    if (eleg === 'mp3') { const f = $('#baseFile'); if (f) f.click(); }
  }));
  // si marcas "Arrancar con la base" a mano, la tarjeta lo refleja; si cargas una base estando en la Escuela, se usa
  el.withBase.addEventListener('change', () => { eleg = el.withBase.checked ? (S.baseMode() === 'yt' ? 'yt' : 'mp3') : 'flowlab'; lsSet('school_elige', eleg); pintaEleccion(); });
  window.addEventListener('flowlab:base', e => {
    const m = (e.detail || {}).mode;
    if (window.Cabina && Cabina.modo && Cabina.modo() === 'escuela' && (m === 'yt' || m === 'local' || m === 'beat') && !sess) { eleg = m === 'yt' ? 'yt' : 'mp3'; lsSet('school_elige', eleg); }
    pintaEleccion();
  });
  pintaEleccion();

  /* ---------------- Configuración ---------------- */
  let currentVowel = data.cfg.vowel || 'a';
  el.diff.value = data.cfg.diff || 'facil'; el.every.value = data.cfg.every || 'auto'; el.dur.value = data.cfg.dur || '120';
  el.bpm.value = num(lsGet('bpm', 90), 60, 200, 90);
  el.bpmLbl.textContent = el.bpm.value + ' BPM';
  $$('#vowelPicker .vowel-btn').forEach(b => b.classList.toggle('active', b.dataset.v === currentVowel));
  $('#vowelPicker').addEventListener('click', e => {
    const b = e.target.closest('.vowel-btn'); if (!b) return;
    currentVowel = b.dataset.v; $$('#vowelPicker .vowel-btn').forEach(x => x.classList.toggle('active', x === b)); saveCfg();
  });
  el.grid.addEventListener('click', e => {
    const c = e.target.closest('.game-card'); if (!c || sess) return;
    const g = GAME[c.dataset.g];
    if (!isUnlocked(g)) { toast('🔒 Gana ' + LEVEL_XP[g.level] + ' XP para desbloquear ' + g.name, 'bad'); return; }
    selected = g.id; saveCfg(); renderGrid();
  });
  [el.diff, el.every, el.dur].forEach(x => x.addEventListener('change', saveCfg));
  function setBpm(v) {
    v = Math.round(num(v, 60, 200, 90)); el.bpm.value = v; el.bpmLbl.textContent = v + ' BPM'; lsSet('bpm', v);
    if (sess) retime(v);
  }
  el.bpm.addEventListener('change', () => setBpm(el.bpm.value));
  $('#bpmHalf').addEventListener('click', () => { const v = +el.bpm.value / 2; if (v >= 60) setBpm(v); else toast('Mínimo 60 BPM', 'bad'); });
  $('#bpmDouble').addEventListener('click', () => { const v = +el.bpm.value * 2; if (v <= 200) setBpm(v); else toast('Máximo 200 BPM', 'bad'); });
  // TAP tempo: golpea al ritmo de la base (YouTube o la que suene); además fija la "fase" del compás
  // Ventana móvil: se guardan los últimos 9 golpes (8 intervalos) y el BPM sale de la mediana, así sigue afinándose mientras toques.
  // El botón muestra el BPM en vivo (no un contador que se frena), una marca ✓ cuando está estable, y avisa al reiniciarse por pausa.
  const taps = [], TAP_AYUDA = 'Toca al ritmo del beat. Con 4 toques ya calcula el BPM; sigue tocando para afinarlo. Si paras 2 segundos, empieza de nuevo.';
  const tapHelp = $('#tapHelp'); let tapIdle = 0, tapTotal = 0;
  const decirTap = t => { if (tapHelp) tapHelp.textContent = t; };
  decirTap(TAP_AYUDA);
  el.tap.addEventListener('click', () => {
    const t = S.now();
    if (taps.length && t - taps[taps.length - 1] > 2) { taps.length = 0; tapTotal = 0; }
    taps.push(t); tapTotal++; if (taps.length > 9) taps.shift();
    let bpm = 0, estable = false;
    if (taps.length >= 3) {
      const iv = []; for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
      const med = iv.slice().sort((a, b) => a - b)[Math.floor(iv.length / 2)];
      bpm = Math.round(60 / med); setBpm(60 / med);
      estable = iv.length >= 4 && iv.slice(-4).every(x => Math.abs(x - med) / med < 0.03);   // los últimos 4 intervalos varían menos de 3 %
    }
    el.tap.classList.remove('hit'); void el.tap.offsetWidth; el.tap.classList.add('hit');
    el.tap.textContent = bpm ? 'TAP · ' + bpm + ' BPM' + (estable ? ' ✓' : '') : 'TAP · ' + tapTotal;
    el.tap.classList.toggle('ok', estable);
    decirTap(bpm ? (estable ? '✓ Estable en ' + bpm + ' BPM. Ya puedes parar de tocar.' : 'Midiendo… ' + bpm + ' BPM. Sigue tocando para afinarlo.') : 'Sigue tocando… (' + tapTotal + ')');
    clearTimeout(tapIdle);
    tapIdle = setTimeout(() => {            // 2 s sin tocar: el siguiente toque empieza de nuevo
      el.tap.textContent = 'TAP'; el.tap.classList.remove('ok');
      decirTap(bpm ? 'Listo: ' + bpm + ' BPM. Vuelve a tocar para medir otra vez.' : TAP_AYUDA);
    }, 2000);
  });
  // Detectar BPM de la base MP3/WAV (envolvente de energía + autocorrelación)
  el.detect.addEventListener('click', () => {
    const buf = S.baseBuffer();
    if (!buf) { toast('Sube una base MP3/WAV para detectar su BPM (con YouTube usa TAP)', 'bad'); return; }
    el.detect.textContent = '…';
    setTimeout(() => {
      const bpm = detectBPM(buf);
      el.detect.textContent = '🔍 Base';
      if (bpm) { setBpm(bpm); toast('BPM detectado: ' + bpm, 'good'); } else toast('No pude detectar el BPM, usa TAP', 'bad');
    }, 30);
  });
  function detectBPM(buf) {
    const sr = buf.sampleRate, hop = 512, fps = sr / hop;
    const a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
    const start = Math.floor(Math.min(buf.length * 0.1, sr * 15)), end = Math.min(buf.length, start + sr * 90);
    const n = Math.floor((end - start) / hop); if (n < fps * 6) return 0;
    const env = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      let e = 0; const o = start + k * hop;
      for (let i = 0; i < hop; i++) { const v = b ? (a[o + i] + b[o + i]) * 0.5 : a[o + i]; e += v * v; }
      env[k] = Math.sqrt(e / hop);
    }
    const on = new Float32Array(n);
    for (let k = 1; k < n; k++) on[k] = Math.max(0, env[k] - env[k - 1]);
    let mean = 0; for (let k = 0; k < n; k++) mean += on[k]; mean /= n;
    for (let k = 0; k < n; k++) on[k] = Math.max(0, on[k] - mean);
    const ac = lag => { const L = Math.floor(lag), f = lag - L; let s = 0; for (let k = 0; k + L + 1 < n; k++) s += on[k] * (on[k + L] * (1 - f) + on[k + L + 1] * f); return s; };
    let best = 0, bestBpm = 0;
    for (let bpm = 60; bpm <= 180; bpm += 0.5) {
      const lag = 60 * fps / bpm;
      const s = ac(lag) + 0.5 * ac(lag * 2) + 0.25 * ac(lag / 2);
      if (s > best) { best = s; bestBpm = bpm; }
    }
    if (!bestBpm) return 0;
    while (bestBpm < 70) bestBpm *= 2;
    while (bestBpm > 165) bestBpm /= 2;
    return Math.round(bestBpm);
  }

  /* ---------------- Sesión (reloj de audio con planificador) ---------------- */
  let sess = null, schedTimer = null;
  const COUNT_IN = 4;
  function everyFor(gid, diff) {
    if (GAME[gid] && GAME[gid].fixedEvery) return GAME[gid].fixedEvery;
    if (GAME[gid] && GAME[gid].free) return +(el.every.value === 'auto' ? 8 : el.every.value);
    const v = el.every.value;
    if (v !== 'auto') return +v;
    const e = EVERY[gid]; return e ? e[DIFFS.indexOf(diff)] : 4;
  }
  /* ---------------- Beat del juego (Mejoras 6 · C) ----------------
     Cada partida suena sobre uno de los 25 ritmos de presets.js, dibujado con el motor de Beats al BPM del juego
     (es sintético: cambiar el tempo no le quita calidad). Arranca en el mismo instante que el reloj del juego y
     dura en bucle de 4 compases, así los compases del juego caen justo sobre los del beat. */
  const GENERO_N = { trap: 'Trap', reggaeton: 'Reggaetón', rap: 'Rap', hiphop: 'Hip hop', drill: 'Drill' };
  const BEAT_MODES = ['random', 'trap', 'reggaeton', 'rap', 'hiphop', 'drill', 'none'];
  const BEAT_BARS = 4, DUCK = 0.3;
  let gb = null, gbToken = 0, gbNext = null, gbDuck = false, starting = false;
  let gbLast = String(lsGet('school_lastbeat', '')).slice(0, 40);
  { const m = lsGet('school_beat', 'random'); el.gbeat.value = BEAT_MODES.includes(m) ? m : 'random'; }
  el.gbvol.value = num(lsGet('school_beatvol', 80), 0, 100, 80);
  const beatVol = () => num(el.gbvol.value, 0, 100, 80) / 100 * (gbDuck ? DUCK : 1);
  const beatName = (it, bpm) => it.n + ' · ' + (GENERO_N[it.g] || it.g) + ' · ' + it.bpm + ' BPM' + (bpm && bpm !== it.bpm ? ' (suena a ' + bpm + ')' : '');
  function beatLabel() {
    const m = el.gbeat.value;
    el.beatNow.textContent = m === 'none' ? 'Sin beat: suena solo el metrónomo.'
      : gb ? 'Beat: ' + beatName(gb.item, gb.bpm)
      : gbNext ? 'Beat: ' + beatName(gbNext, 0) + ' (se ajusta al BPM del juego)'
      : 'Beat: se elige al empezar (' + (m === 'random' ? 'aleatorio' : GENERO_N[m]) + ')';
    el.beatNext.disabled = m === 'none';
  }
  function elegirBeat(bpm, evitar) {
    const BP = window.BeatPresets; if (!BP) return null;
    const m = el.gbeat.value;
    let lista = BP.items.filter(x => m === 'random' || x.g === m);
    const sin = lista.filter(x => !evitar.includes(x.id)); if (sin.length) lista = sin;         // distinto del anterior
    const dist = x => Math.abs(Math.log(bpm / x.bpm));
    const cerca = lista.filter(x => dist(x) <= Math.log(1.2));                                  // el BPM encaja (±20 %)
    const pool = cerca.length ? cerca : lista.slice().sort((a, b) => dist(a) - dist(b)).slice(0, 4);
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }
  function beatSuena(r, when) {
    const c = S.ctx(), src = c.createBufferSource(); src.buffer = r.buf; src.loop = true;
    const g = c.createGain(); g.gain.value = beatVol(); src.connect(g); g.connect(c.destination); src.start(when);
    return { src, gain: g, item: r.item, bpm: r.bpm };
  }
  function beatPara() {
    const b = gb; gb = null; gbToken++; if (!b) return;
    try { const c = S.ctx(); b.gain.gain.cancelScheduledValues(c.currentTime); b.gain.gain.setTargetAtTime(0, c.currentTime, 0.02); b.src.stop(c.currentTime + 0.2); } catch (e) { }
  }
  // Cambia de beat (o de tempo) con el juego andando: entra justo al empezar un compás
  async function beatCambia(item, bpm) {
    const s = sess; if (!s || !s.beatOn) return; const my = ++gbToken;
    let r = null; try { r = await Beats.renderPreset(item.id, BEAT_BARS, bpm); } catch (e) { console.error(e); }
    if (!r || my !== gbToken || sess !== s || s.ended) return;
    const c = S.ctx(), bar = 4 * s.beat, k = Math.max(0, Math.ceil((c.currentTime + 0.05 - s.t0) / bar)), when = s.t0 + k * bar, old = gb;
    gb = beatSuena(r, when);
    if (old) { try { old.src.stop(when); } catch (e) { } }
    beatLabel();
  }
  // Baja el beat mientras el micrófono escucha (el reconocimiento de voz oye mejor sin música encima)
  function beatDuck(on) { gbDuck = !!on; if (gb) { try { gb.gain.gain.setTargetAtTime(beatVol(), S.now(), 0.08); } catch (e) { } } }
  { const vn = $('#voiceNote'); const mostrar = () => vn.classList.toggle('hidden', !el.voice.checked); el.voice.addEventListener('change', mostrar); mostrar(); }
  el.gbeat.addEventListener('change', () => { lsSet('school_beat', el.gbeat.value); gbNext = null; beatLabel(); });
  el.gbvol.addEventListener('input', () => { lsSet('school_beatvol', +el.gbvol.value); if (gb) { try { gb.gain.gain.setTargetAtTime(beatVol(), S.now(), 0.03); } catch (e) { } } });
  el.beatNext.addEventListener('click', async () => {
    const m = el.gbeat.value; if (m === 'none') return;
    if (sess && sess.beatOn) {
      const it = elegirBeat(sess.bpm, [gb && gb.item.id, gbLast]); if (!it) return;
      gbLast = it.id; lsSet('school_lastbeat', gbLast); await beatCambia(it, sess.bpm); return;
    }
    if (sess) { toast('Esta partida va con tu base: el beat del juego no se usa.', ''); return; }
    el.beatNext.disabled = true;
    const ok = window.BeatPresets ? true : await (window.Cabina && Cabina.presets ? Cabina.presets() : false);
    beatLabel();
    if (!ok) { toast('No pude cargar los ritmos (¿sin internet?). Sigues con el metrónomo.', 'bad'); return; }
    gbNext = elegirBeat(Math.round(num(el.bpm.value, 60, 200, 90)), [gbNext && gbNext.id, gbLast]); beatLabel();
  });
  beatLabel();

  async function startSession() {
    if (sess || starting) return;
    const g = GAME[selected]; if (!g || !isUnlocked(g)) return;
    // Beat del juego: se dibuja ANTES de arrancar el reloj (así el primer compás ya suena con él)
    let br = null;
    const usaBase = el.withBase.checked && S.baseMode() !== 'none';
    if (el.gbeat.value !== 'none' && !usaBase) {
      starting = true; el.start.disabled = true; el.beatNow.textContent = 'Preparando el beat…';
      try {
        const bpmJ = Math.round(num(el.bpm.value, 60, 200, 90));
        const ok = window.BeatPresets ? true : await (window.Cabina && Cabina.presets ? Cabina.presets() : false);
        if (ok && window.Beats && Beats.renderPreset) {
          const it = gbNext && (el.gbeat.value === 'random' || gbNext.g === el.gbeat.value) ? gbNext : elegirBeat(bpmJ, [gbLast]);
          if (it) br = await Beats.renderPreset(it.id, BEAT_BARS, bpmJ);
        }
      } catch (e) { console.error(e); }
      starting = false; el.start.disabled = false;
      if (!br) toast('No pude preparar el beat: sigues con el metrónomo de siempre.', 'bad');
      if (sess) return;
    }
    const c = S.ctx(), diff = el.diff.value, bpm = br ? br.bpm : Math.round(num(el.bpm.value, 60, 200, 90));
    setBpm(bpm);
    const beat = 60 / bpm;
    let t0 = c.currentTime + 0.15;
    // Si acabas de marcar TAP sobre la base, el compás arranca alineado a tus golpes
    if (taps.length >= 3 && c.currentTime - taps[taps.length - 1] < 4) {
      const last = taps[taps.length - 1]; t0 = last + Math.ceil((t0 - last) / beat) * beat;
    }
    sess = {
      g, diff, bpm, beat, t0, firstBeat: t0 + COUNT_IN * beat, nextIdx: -COUNT_IN, nextTime: t0, queue: [],
      prompts: 0, results: [], detail: [], pending: [], cur: null, upcoming: null,
      every: g.id === 'minutolibre' ? Math.ceil(g.fixedSec / (4 * beat)) : everyFor(g.id, diff),   // el minuto libre es UNA sola consigna que dura todo el minuto
      durSec: g.type === 'battle' || g.free ? 0 : (g.fixedSec || +el.dur.value), stage: -1, base: null,
      voice: el.voice.checked && !g.free, words: 0, ended: false, rl: null
    };
    if (br) {                                    // el beat arranca con el primer tiempo del conteo y los compases del juego quedan sobre los suyos
      sess.beatOn = true; gb = beatSuena(br, t0); gbNext = null; gbLast = br.item.id; lsSet('school_lastbeat', gbLast); beatLabel();
    }
    if (sess.voice) {
      const s0 = sess;
      if (!Voice.supported()) { s0.voice = false; s0.voiceWhy = 'tu navegador no tiene reconocimiento de voz'; toast('Tu navegador no soporta verificación por voz: al final te pregunto cómo te fue (XP al 40 %).', 'bad'); }
      else if (S.isRecording()) { s0.voice = false; s0.voiceWhy = 'la cabina está grabando'; toast('No se puede verificar por voz mientras grabas en la cabina: al final te pregunto cómo te fue (XP al 40 %).', 'bad'); }
      else {
        Voice.start(w => onVoiceWords(w), why => { s0.voiceFail = why; });
        if (s0.beatOn) beatDuck(true);                // el beat baja solo mientras el micrófono escucha
        toast('🎧 Con audífonos el micrófono entiende mucho mejor' + (s0.beatOn ? ' (el beat baja solo mientras te escucha)' : ''), '');
      }
    }
    if (el.withBase.checked && !S.isRecording()) {
      sess.base = S.startBase(sess.firstBeat);
      if (!sess.base) toast('No hay base cargada: sube un MP3 o carga un link de YouTube', 'bad');
    }
    el.result.classList.add('hidden'); el.rate.classList.add('hidden');
    el.rl.classList.toggle('hidden', g.type !== 'typing');
    el.sGame.textContent = g.icon + ' ' + g.name + ' · ' + DIFF_LABEL[diff];
    renderSlots(null); el.next.textContent = ''; el.prompts.textContent = '0'; el.vMeter.textContent = sess.voice ? '· 🎙 0 palabras' : '';
    setLocked(true);
    schedTimer = setInterval(tick, 25);
    tick();
  }
  function setLocked(on) {
    el.start.disabled = on; el.stop.disabled = !on;
    [el.diff, el.dur, el.every, el.detect, el.voice, el.withBase, el.gbeat].forEach(x => { x.disabled = on; });
    if (!on) renderGrid();
    el.grid.classList.toggle('busy', on);
  }
  function retime(bpm) {
    // Cambio de BPM en vivo: se re-ancla el reloj desde el próximo tiempo
    const s = sess; if (!s) return;
    s.t0 = s.nextTime - (s.nextIdx + COUNT_IN) * (60 / bpm);
    s.beat = 60 / bpm; s.bpm = bpm;
    if (s.beatOn && gb) beatCambia(gb.item, bpm);          // el beat se vuelve a dibujar al nuevo tempo y entra en el próximo compás
  }
  function tick() {
    const s = sess; if (!s) return;
    const now = S.now();
    while (s.nextTime < now + 0.12) {
      if (el.metro.checked && !s.beatOn) S.click(s.nextTime, ((s.nextIdx % 4) + 4) % 4 === 0);
      s.queue.push({ t: s.nextTime, i: s.nextIdx });
      s.nextIdx++; s.nextTime = s.t0 + (s.nextIdx + COUNT_IN) * s.beat;
    }
    while (s.queue.length && s.queue[0].t <= now + 0.012) { onBeat(s.queue.shift().i); if (!sess) return; }
    const el2 = Math.max(0, now - s.firstBeat);
    if (s.rl) {
      const left = Math.max(0, s.rl.end - now);
      el.sTimer.textContent = fmt(left);
      el.barFill.style.width = (100 - left / s.rl.secs * 100) + '%';
      if (left <= 0) { finish(); return; }
    } else {
      el.sTimer.textContent = s.durSec ? fmt(Math.max(0, s.durSec - el2)) : fmt(el2);
      el.barFill.style.width = s.durSec ? clamp(el2 / s.durSec * 100, 0, 100) + '%' : (s.g.type === 'battle' ? clamp(el2 / (BATTLE.length * BATTLE_BARS * 4 * s.beat) * 100, 0, 100) + '%' : '0%');
    }
    if (s.voice) evalPending(false);
  }
  function onBeat(i) {
    const s = sess;
    const inBar = ((i % 4) + 4) % 4;
    el.dots.forEach((d, k) => d.classList.toggle('on', k === inBar));
    if (i < 0) { setMain(String(-i), 'count'); el.sub.textContent = i === -COUNT_IN ? 'prepárate…' : ''; return; }
    const bar = Math.floor(i / 4);
    el.bar.textContent = bar + 1; el.beat.textContent = inBar + 1;
    if (s.g.type === 'typing') { if (i === 0) startRelampago(); return; }
    if (inBar !== 0) return;
    // Duración cumplida → se cierra al empezar un compás (nunca a la mitad)
    if (s.durSec && i * s.beat >= s.durSec) { finish(); return; }
    let gid = s.g.id, every = s.every;
    if (s.g.type === 'battle') {
      const st = Math.floor(bar / BATTLE_BARS);
      if (st >= BATTLE.length) { finish(); return; }
      gid = BATTLE[st].game; every = BATTLE[st].every;
      if (st !== s.stage) { s.stage = st; s.upcoming = null; toast('RONDA ' + (st + 1) + ': ' + BATTLE[st].name, 'stage'); el.sGame.textContent = '🏆 Ronda ' + (st + 1) + '/' + BATTLE.length + ' · ' + BATTLE[st].name; }
    }
    const barInStage = s.g.type === 'battle' ? bar % BATTLE_BARS : bar;
    if (barInStage % every === 0) newPrompt(gid, every);
    renderSlots(s.cur, barInStage % 4);
    // Vista previa de la siguiente consigna en el último compás
    const nextIsChange = (barInStage + 1) % every === 0 && !(s.g.type === 'battle' && (barInStage + 1) % BATTLE_BARS === 0);
    if (el.showNext.checked && nextIsChange && every > 1) {
      s.upcoming = makePrompt(gid, s.diff, currentVowel, s);
      el.next.textContent = 'siguiente: ' + (s.upcoming.cls === 'emoji' ? s.upcoming.main + ' ' + s.upcoming.sub : s.upcoming.main);
    } else if (!nextIsChange) el.next.textContent = '';
  }
  function newPrompt(gid, every) {
    const s = sess;
    if (s.cur && s.voice) s.pending.push({ p: s.cur, from: s.cur.at, until: performance.now() });
    const p = s.upcoming || makePrompt(gid, s.diff, currentVowel, s);
    s.upcoming = null; p.at = performance.now(); p.bars = every;
    s.cur = p; s.prompts++;
    setMain(p.main, p.cls); el.sub.textContent = p.sub; el.next.textContent = '';
    el.prompts.textContent = s.prompts;
  }
  function onVoiceWords(w) {
    const s = sess; if (!s) return;
    s.words += w.length;
    el.vMeter.textContent = '· 🎙 ' + s.words + ' palabras';
    if (s.rl) w.forEach(x => addRhyme(x, true));
  }
  function evalPending(all) {
    const s = sess, now = performance.now();
    while (s.pending.length && (all || now > s.pending[0].until + 1500)) {
      const it = s.pending.shift();
      const words = Voice.wordsBetween(it.from, it.until + 1500).concat(all ? tokens(Voice.interim) : []);
      const dt = checkDetail(it.p, words), r = dt.score;
      s.results.push(r); s.detail.push(dt.items);
      if (!all) toast(r >= 1 ? '✓ ¡La metiste!' : r > 0 ? '≈ casi' : '✗ se te pasó', r >= 1 ? 'good' : r > 0 ? '' : 'bad');
    }
  }

  /* ---- Rima Relámpago ---- */
  function startRelampago() {
    const s = sess, secs = { facil: 75, medio: 60, dificil: 45 }[s.diff];
    s.rl = { secs, end: S.now() + secs, found: [], points: 0, target: '', keys: null, targets: 0 };
    nextTarget();
    el.rlInput.value = ''; el.rlInput.disabled = false; el.rlInput.focus();
  }
  function nextTarget() {
    const rl = sess.rl;
    let t = B.relampago(), k = S.rhymeKeys(t);
    rl.target = t; rl.keys = k; rl.targets++;
    setMain(t, ''); el.sub.textContent = 'consonante +2 · asonante +1';
    sess.prompts = rl.targets; el.prompts.textContent = rl.targets;
  }
  function addRhyme(raw, fromVoice) {
    const s = sess; if (!s || !s.rl) return;
    const rl = s.rl, lower = String(raw).toLowerCase().trim(), w = norm(lower);
    if (!/^[a-zñ]{2,20}$/.test(w)) { if (!fromVoice) toast('Solo una palabra, sin números', 'bad'); return; }
    if (w === norm(rl.target) || rl.found.some(f => f.w === w)) { if (!fromVoice) toast('Repetida', 'bad'); return; }
    const k = S.rhymeKeys(lower), k2 = S.rhymeKeys(lower, true);
    let pts = 0, type = '';
    if ((k && k.cons === rl.keys.cons) || (k2 && k2.cons === rl.keys.cons)) { pts = 2; type = 'cons'; }
    else if ((k && k.ason === rl.keys.ason) || (k2 && k2.ason === rl.keys.ason)) { pts = 1; type = 'ason'; }
    if (!pts) { if (!fromVoice) toast('✗ no rima con ' + rl.target, 'bad'); return; }
    rl.found.push({ w, type, show: lower }); rl.points += pts;
    const chip = document.createElement('span'); chip.className = 'chip' + (type === 'ason' ? ' ass' : '');
    chip.textContent = lower + ' +' + pts; el.rlFound.prepend(chip);
    toast(type === 'cons' ? '✓ consonante +2' : '✓ asonante +1', 'good');
  }
  el.rlInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); addRhyme(el.rlInput.value, false); el.rlInput.value = '';
  });
  el.rlSkip.addEventListener('click', () => { if (sess && sess.rl) { nextTarget(); el.rlInput.focus(); } });

  /* ---------------- Final de sesión, puntaje y registro ---------------- */
  function finish() {
    const s = sess; if (!s || s.ended) return;
    s.ended = true;
    clearInterval(schedTimer); schedTimer = null;
    beatPara();
    if (s.base) S.stopBase();
    if (s.voice) { evalPending(true); Voice.stop(); }
    el.dots.forEach(d => d.classList.remove('on'));
    el.rlInput.disabled = true; el.next.textContent = ''; renderSlots(null);
    const played = Math.max(0, S.now() - s.firstBeat);
    s.played = played;
    if (s.g.free) {                                   // Desahógate: sin puntaje, sin XP, sin historial, nada se guarda
      setMain('GRACIAS POR SACARLO', 'mid'); el.sub.textContent = 'Sin puntaje: esto es solo para ti. No se guardó nada.';
      el.result.classList.add('hidden'); endSession(); return;
    }
    if (played < 15) { setMain('MUY CORTO', ''); el.sub.textContent = 'juega al menos 15 segundos para sumar XP'; endSession(); return; }
    if (s.g.type === 'typing') { record(s.rl.found.length ? 1 : 0, true); return; }       // Rima Relámpago: las rimas las comprueba el propio juego
    // ¿Se pudo verificar por voz de verdad? Si el micrófono falló o no oyó ni una palabra, no se castiga: cae a la autoevaluación (con XP al 40 %)
    const oyo = s.voice && s.results.length && Voice.total > 0 && !s.voiceFail;
    if (oyo) { record(s.results.reduce((a, b) => a + b, 0) / s.results.length, true); return; }
    let why = s.voiceWhy || '';
    if (s.voice && !why) why = s.voiceFail ? 'el micrófono no estuvo disponible para el reconocimiento de voz' : 'no te escuché (0 palabras)';
    setMain('¿CÓMO TE FUE?', 'mid');
    el.sub.textContent = (why ? 'No se pudo verificar por voz: ' + why + '. ' : '') + '¿Cuántas consignas cumpliste? Sin verificar da el 40 % del XP.';
    el.rate.classList.remove('hidden');
  }
  el.rate.addEventListener('click', e => { const b = e.target.closest('[data-acc]'); if (b && sess) { el.rate.classList.add('hidden'); record(+b.dataset.acc, false); } });
  // XP honesta: una ronda verificada (por voz, o Rima Relámpago) da el XP completo; una de autoevaluación da el 40 % y se marca "sin verificar"
  const XP_SIN_VERIFICAR = 0.4;
  function resumenVoz(s) {
    const pal = s.detail.flat().filter(i => i.kind === 'w'), otras = s.detail.flat().filter(i => i.kind !== 'w');
    const dichas = pal.filter(i => i.v >= 0.5).length, cumplidas = otras.filter(i => i.v >= 0.5).length;
    let h = '';
    if (pal.length) h += '<div class="vr-head"><b>Dijiste ' + dichas + ' de ' + pal.length + ' palabras</b></div>';
    if (otras.length) h += '<div class="vr-head"><b>Cumpliste ' + cumplidas + ' de ' + otras.length + ' consignas de rima o flow</b></div>';
    const lista = pal.concat(otras).slice(0, 80);
    if (lista.length) h += '<div class="vr-list">' + lista.map(i => '<span class="vr-' + (i.v >= 1 ? 'ok' : i.v > 0 ? 'mid' : 'no') + '">' + (i.v >= 1 ? '✓ ' : i.v > 0 ? '≈ ' : '✗ ') + esc(i.w) + '</span>').join('') + '</div>';
    return h ? '<div class="voice-result">' + h + '</div>' : '';
  }
  function record(acc, ver) {
    const s = sess, mins = s.played / 60, mult = DIFF_MULT[s.diff], speed = clamp(s.bpm / 90, 0.8, 1.6);
    let score;
    if (s.g.type === 'typing') score = Math.round(s.rl.points * 5 * mult);
    else score = Math.round(s.prompts * acc * 4 * mult * speed);
    // XP equilibrado: la mitad del puntaje + 8 por minuto real de práctica (premia la constancia)
    let xp = Math.round(score * 0.5) + Math.round(mins * 8);
    const today = dayStr(), m = missionOfToday();
    let bonus = 0;
    // El reto del día solo se completa con una ronda verificada (si no, cualquiera lo marcaría diciendo "todas")
    if (ver && !m.done && m.g.id === s.g.id && m.diff === s.diff) { bonus = 50; data.mission = today; }
    xp += bonus;
    if (!ver) xp = Math.round(xp * XP_SIN_VERIFICAR);
    const lista = ver ? data.bests : data.bestsS;        // dos rankings separados: verificadas y autoevaluación
    const before = rankOf(data.xp).name, prevBest = lista[s.g.id] || 0;
    data.xp += xp;
    if (score > prevBest) lista[s.g.id] = score;
    // Racha de días seguidos
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (data.streak.last !== today) { data.streak.count = data.streak.last === dayStr(y) ? data.streak.count + 1 : 1; data.streak.last = today; }
    data.streak.best = Math.max(data.streak.best, data.streak.count);
    const d = new Date();
    data.history.unshift({ t: today + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()), g: s.g.id, d: s.diff, bpm: s.bpm, dur: Math.round(s.played), pr: s.prompts, acc, sc: score, xp, v: !!s.voice, w: s.words, ver: !!ver });
    data.history = data.history.slice(0, 300);
    save();
    const after = rankOf(data.xp).name;
    setMain('+' + xp + ' XP', 'mid');
    el.sub.textContent = s.g.type === 'typing' ? s.rl.found.length + ' rimas válidas' : Math.round(acc * 100) + '% de consignas cumplidas';
    el.result.innerHTML = '<b>Puntaje ' + score + '</b> · ' + (s.g.type === 'typing' ? s.rl.found.length + ' rimas en ' + s.rl.targets + ' palabra(s)' : s.prompts + ' consignas') + ' · ' + fmt(s.played) +
      (score > prevBest ? ' · 🏅 ¡Nuevo récord' + (ver ? '' : ' de autoevaluación') + '!' : '') + (bonus ? ' · 🎯 Reto del día +50' : '') +
      (ver ? ' · <span class="ver-tag ok">✓ verificada</span>' : ' · <span class="ver-tag no">sin verificar · XP al 40 %</span>') +
      (!ver && !m.done && m.g.id === s.g.id && m.diff === s.diff ? '<div class="hint">El reto del día solo se completa con una ronda verificada por voz.</div>' : '') +
      (s.voice && s.detail.length ? resumenVoz(s) : '') +
      (after !== before ? '<div class="rank-up">⬆ ¡Subiste a ' + esc(after) + '!</div>' : '') +
      newlyUnlocked(data.xp - xp, data.xp);
    el.result.classList.remove('hidden');
    endSession();
    renderAll();
  }
  function newlyUnlocked(a, b) {
    if (data.unlockAll) return '';
    const n = GAMES.filter(g => LEVEL_XP[g.level] > a && LEVEL_XP[g.level] <= b);
    return n.length ? '<div class="rank-up">🔓 Desbloqueaste: ' + n.map(g => esc(g.name)).join(', ') + '</div>' : '';
  }
  function endSession() { sess = null; beatPara(); gbDuck = false; setLocked(false); beatLabel(); }
  function stopSession() {
    if (!sess) return;
    if (sess.ended) { el.rate.classList.add('hidden'); setMain('SESIÓN CANCELADA', 'mid'); el.sub.textContent = 'no se registró'; endSession(); return; }
    finish();
  }
  el.start.addEventListener('click', startSession);
  el.stop.addEventListener('click', stopSession);
  el.full.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    else if (el.stage.requestFullscreen) el.stage.requestFullscreen().catch(() => toast('Pantalla completa no disponible', 'bad'));
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sess && !document.fullscreenElement) stopSession();
  });

  /* ---------------- Pestañas y gestión del progreso ---------------- */
  $$('.school-tabs .tab').forEach(t => t.addEventListener('click', () => {
    $$('.school-tabs .tab').forEach(x => x.classList.toggle('on', x === t));
    $$('#school .tab-pane').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== t.dataset.tab));
    if (t.dataset.tab === 'progress') renderProgress();
  }));
  $('#exportProg').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'FlowLab', v: 1, school: data }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'flowlab_progreso_' + dayStr() + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  $('#importProg').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert('Archivo demasiado grande.'); return; }
    try {
      const j = JSON.parse(await f.text());
      if (!j || j.app !== 'FlowLab' || !j.school) throw new Error('formato');
      if (!confirm('¿Reemplazar tu progreso actual con el del archivo?')) return;
      data = sanitize(j.school); save(); renderAll();
    } catch (err) { alert('Ese archivo no es un progreso válido de FlowLab.'); }
  });
  $('#unlockAll').addEventListener('change', e => { data.unlockAll = e.target.checked; save(); renderAll(); });
  $('#resetProg').addEventListener('click', () => {
    if (!confirm('¿Borrar TODO tu progreso de la Escuela (XP, historial, récords)? No se puede deshacer.')) return;
    data = sanitize(null); save(); selected = 'univocal'; renderAll();
  });

  renderAll();
})();

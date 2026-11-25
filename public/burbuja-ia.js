/* FlowLab · burbuja de IA flotante + Batalla 1 vs 1 contra la IA (sin servidor).
   La burbuja abre el Coach (ai-coach.js) y la Batalla. La Batalla usa un banco de frases
   propio: nunca llama a la nube, funciona sin internet y las rondas no se repiten. */
(function () {
  'use strict';
  const EN = () => /^en/i.test(document.documentElement.lang || '');
  const T = {
    es: {
      bubble: 'Ayuda con IA', menuTitle: '¿Qué quieres?', coach: '🤖 Coach: mejorar mi letra', battle: '⚔️ Batalla 1 vs 1 con la IA',
      tip: 'Idea: ', close: 'Cerrar', next: 'Listo, siguiente ronda ▶', other: '↻ Otra frase', start: 'Empezar batalla',
      round: 'Ronda', of: 'de', word: 'Palabra obligada', answer: 'Responde rapeando (en voz alta o escribiendo). Tienes ', sec: ' s.',
      intro: 'La IA no tiene voz: te lanza una frase. Tú le contestas con tu flow y usando la palabra obligada.',
      end: '¡Batalla terminada! Respiraste, rimaste y no te rendiste. ¿Otra?', again: 'Otra batalla', name: 'IA'
    },
    en: {
      bubble: 'AI help', menuTitle: 'What do you need?', coach: '🤖 Coach: improve my lyrics', battle: '⚔️ 1 vs 1 battle with the AI',
      tip: 'Idea: ', close: 'Close', next: 'Done, next round ▶', other: '↻ Another line', start: 'Start battle',
      round: 'Round', of: 'of', word: 'Required word', answer: 'Reply by rapping (out loud or typing). You have ', sec: ' s.',
      intro: 'The AI has no voice: it throws you a line. You answer with your flow and use the required word.',
      end: 'Battle over! You breathed, rhymed and kept going. Another one?', again: 'Another battle', name: 'AI'
    }
  };
  const L = () => T[EN() ? 'en' : 'es'];

  const FRASES = {
    es: [
      'Dices que traes fuego, pero se te apagó en el primer verso.', 'Mi flow va en moto y el tuyo todavía busca el paradero.',
      'Yo rimo de corrido, tú rimas cuando te acuerdas.', 'Tu estilo es tan suave que parece canción de cuna.',
      'Llegas con cara de campeón y con letra de principiante.', 'Mi barra pega duro, la tuya hace cosquillas.',
      'Vienes a la batalla y te sudan hasta las rimas.', 'Si el micro hablara, te pediría que lo sueltes.',
      'Tu flow no tiene ritmo, tiene prisa de irse.', 'Yo improviso con calma, tú improvisas con miedo.',
      'Tienes más pausas que una tienda de barrio cerrando.', 'Mi rima es de oro, la tuya viene en oferta.',
      'Hablas de calle pero te perdiste en tu propia cuadra.', 'Tu punchline llegó tarde, como el bus a la esquina.',
      'Yo traigo ideas, tú traes excusas bien rimadas.', 'En esta pista mando yo y tú vas de pasajero.',
      'Tu verso suena a ensayo que no ensayaste.', 'Soy el beat y el flow; tú eres el eco que se quedó atrás.',
      'Rapeas bonito, pero sin ganas de ganar.', 'Mi lengua es veloz, la tuya va en modo ahorro de batería.',
      'Dices “yo soy el mejor” y ni tú te lo crees.', 'Te doy tres tiempos de ventaja y aun así me alcanzo.',
      'Tu rima cojea, la mía baila; mira la diferencia.', 'Aquí no vale copiar: invéntate algo o te quedas callado.'
    ],
    en: [
      'You say you bring fire, but it died in your first verse.', 'My flow rides a motorbike; yours is still looking for the bus stop.',
      'I rhyme non-stop, you rhyme when you remember.', 'Your style is so soft it sounds like a lullaby.',
      'You came with a champion face and a beginner pen.', 'My bars hit hard, yours tickle.',
      'You walk into the battle and even your rhymes sweat.', 'If the mic could talk, it would beg you to let go.',
      'Your flow has no rhythm, it just wants to leave.', 'I improvise calm, you improvise scared.',
      'You pause more than a corner shop at closing time.', 'My rhyme is gold, yours is on clearance.',
      'You talk street but got lost on your own block.', 'Your punchline arrived late, like the bus.',
      'I bring ideas, you bring well-rhymed excuses.', 'On this track I drive and you ride along.',
      'Your verse sounds like a rehearsal you never did.', 'I am the beat and the flow; you are the echo left behind.',
      'You rap pretty, but with no will to win.', 'My tongue is fast, yours is in battery-saver mode.',
      'You say "I am the best" and even you do not buy it.', 'I give you a three-beat head start and still catch you.',
      'Your rhyme limps, mine dances; see the difference.', 'No copying here: invent something or stay quiet.'
    ]
  };
  const PALABRAS = {
    es: ['barrio', 'sueño', 'luna', 'reloj', 'espejo', 'camino', 'fuego', 'bus', 'mercado', 'cielo', 'ritmo', 'cadena', 'sombra', 'ciudad', 'mochila', 'lluvia',
      'micrófono', 'corazón', 'esquina', 'tormenta', 'cerro', 'playa', 'moto', 'cuaderno', 'gallo', 'dinero', 'paciencia', 'puerta', 'tren', 'trampa', 'estrella', 'ventana',
      'cebiche', 'pelota', 'maestro', 'pista', 'cometa', 'raíz', 'volcán', 'secreto'],
    en: ['block', 'dream', 'moon', 'clock', 'mirror', 'road', 'fire', 'bus', 'market', 'sky', 'rhythm', 'chain', 'shadow', 'city', 'backpack', 'rain',
      'microphone', 'heart', 'corner', 'storm', 'hill', 'beach', 'bike', 'notebook', 'rooster', 'money', 'patience', 'door', 'train', 'trap', 'star', 'window',
      'sandwich', 'ball', 'teacher', 'track', 'kite', 'root', 'volcano', 'secret']
  };
  const RONDAS = 6, SEG = 25;

  /* Bolsa mezclada: no repite hasta agotar el banco; guarda lo usado para no repetir entre batallas. */
  function bolsa(lista, clave) {
    let usados = [];
    try { usados = JSON.parse(localStorage.getItem(clave) || '[]'); } catch (e) { }
    let libres = lista.map((_, i) => i).filter(i => usados.indexOf(i) < 0);
    if (!libres.length) { usados = []; libres = lista.map((_, i) => i); }
    const i = libres[Math.floor(Math.random() * libres.length)];
    usados.push(i);
    try { localStorage.setItem(clave, JSON.stringify(usados)); } catch (e) { }
    return lista[i];
  }
  const nuevaFrase = () => { const l = EN() ? 'en' : 'es'; return { f: bolsa(FRASES[l], 'flowlab_bia_f_' + l), p: bolsa(PALABRAS[l], 'flowlab_bia_p_' + l) }; };

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  let bubble, menu, dlg, ronda = 0, cur = null, timer = 0, resto = 0, lastFocus = null;

  function pararReloj() { clearInterval(timer); timer = 0; }
  function cerrarBatalla() {
    pararReloj(); if (!dlg) return;
    dlg.classList.add('hidden'); document.body.classList.remove('glos-abierto');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function pintarRonda() {
    const t = L(), body = dlg.querySelector('.bia-body'); body.textContent = '';
    if (ronda > RONDAS) {
      body.append(el('p', 'bia-end', t.end));
      const b = el('button', 'btn btn-neon', t.again); b.type = 'button'; b.addEventListener('click', () => { ronda = 0; siguiente(); });
      body.append(b); return;
    }
    cur = cur || nuevaFrase();
    body.append(el('div', 'bia-round', t.round + ' ' + ronda + ' ' + t.of + ' ' + RONDAS));
    body.append(el('div', 'bia-who', '🤖 ' + t.name));
    body.append(el('p', 'bia-line', '“' + cur.f + '”'));
    const w = el('p', 'bia-word'); w.append(t.word + ': ', el('b', null, cur.p)); body.append(w);
    const c = el('p', 'bia-clock'); body.append(c);
    const pintaReloj = () => { c.textContent = t.answer + resto + t.sec; };
    pararReloj(); resto = SEG; pintaReloj();
    timer = setInterval(() => { resto = Math.max(0, resto - 1); pintaReloj(); if (!resto) pararReloj(); }, 1000);
    const fila = el('div', 'bia-actions');
    const o = el('button', 'btn btn-ghost', t.other); o.type = 'button'; o.addEventListener('click', () => { cur = nuevaFrase(); pintarRonda(); });
    const n = el('button', 'btn btn-neon', t.next); n.type = 'button'; n.addEventListener('click', siguiente);
    fila.append(o, n); body.append(fila);
  }
  function siguiente() { ronda++; cur = null; pintarRonda(); }
  function abrirBatalla() {
    const t = L();
    if (!dlg) {
      dlg = el('div', 'bia-dlg hidden'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', t.battle);
      const card = el('div', 'bia-card');
      const head = el('div', 'bia-head'); head.append(el('strong', null, t.battle));
      const x = el('button', 'btn btn-ghost btn-small', '✕'); x.type = 'button'; x.setAttribute('aria-label', t.close); x.addEventListener('click', cerrarBatalla);
      head.append(x); card.append(head, el('p', 'bia-intro', t.intro), el('div', 'bia-body')); dlg.append(card);
      dlg.addEventListener('click', e => { if (e.target === dlg) cerrarBatalla(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.classList.contains('hidden')) cerrarBatalla(); });
      document.body.append(dlg);
    } else {
      dlg.querySelector('.bia-head strong').textContent = t.battle; dlg.querySelector('.bia-intro').textContent = t.intro;
    }
    lastFocus = document.activeElement; ronda = 1; cur = null;
    dlg.classList.remove('hidden'); document.body.classList.add('glos-abierto'); pintarRonda();
    const f = dlg.querySelector('.bia-actions .btn-neon'); if (f) f.focus();
  }

  function cerrarMenu() { if (menu) { menu.classList.add('hidden'); bubble.setAttribute('aria-expanded', 'false'); } }
  function textos() {
    const t = L(); bubble.setAttribute('aria-label', t.bubble); bubble.title = t.bubble;
    menu.querySelector('.bia-menu-title').textContent = t.menuTitle;
    menu.querySelector('[data-a=coach]').textContent = t.coach; menu.querySelector('[data-a=battle]').textContent = t.battle;
  }
  function init() {
    bubble = el('button', 'bia-bubble', '🤖'); bubble.type = 'button'; bubble.id = 'biaBubble';
    bubble.setAttribute('aria-haspopup', 'true'); bubble.setAttribute('aria-expanded', 'false');
    menu = el('div', 'bia-menu hidden'); menu.append(el('div', 'bia-menu-title'));
    const b1 = el('button', 'btn btn-ghost'); b1.type = 'button'; b1.dataset.a = 'coach';
    const b2 = el('button', 'btn btn-ghost'); b2.type = 'button'; b2.dataset.a = 'battle';
    menu.append(b1, b2); document.body.append(menu, bubble); textos();
    bubble.addEventListener('click', () => { const ab = menu.classList.toggle('hidden'); bubble.setAttribute('aria-expanded', String(!ab)); });
    b1.addEventListener('click', () => { cerrarMenu(); if (window.Coach) window.Coach.abrir('letra'); });
    b2.addEventListener('click', () => { cerrarMenu(); abrirBatalla(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenu(); });
    window.addEventListener('flowlab:lang', () => { textos(); if (dlg && !dlg.classList.contains('hidden')) { cur = null; abrirBatalla(); } });
  }
  window.BatallaIA = { abrir: abrirBatalla, _FRASES: FRASES, _PALABRAS: PALABRAS };
  // La burbuja flotante se retiró (Jesús prefiere la IA dentro de cada juego): ver escuela-ia.js. Aquí queda solo la Batalla.
})();

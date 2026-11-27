/* FlowLab · Batalla 1 vs 1 contra la IA.
   El rival abre con una frase, tú respondes con tu barra y la palabra obligada, y la IA te contesta
   dos barras y un consejo (Coach.rival en ai-coach.js: Firebase AI Logic híbrido, primero en tu
   dispositivo y si no en la nube). Su respuesta es la frase de la ronda siguiente. Si no hay IA
   (sin internet y sin modelo local), la batalla sigue con un banco de frases propio y lo dice. */
(function () {
  'use strict';
  const EN = () => /^en/i.test(document.documentElement.lang || '');
  const T = {
    es: {
      battle: '⚔️ Batalla 1 vs 1 con la IA', close: 'Cerrar',
      intro: 'El rival te lanza una frase. Contesta con tu barra usando la palabra obligada y la IA te responde, en tu dispositivo si se puede.',
      round: 'Ronda', of: 'de', word: 'Palabra obligada', rival: 'Rival', bank: 'frase de arranque (sin IA)', name: 'IA',
      answer: 'Rapéala en voz alta y escríbela. Tienes ', sec: ' s.', ph: 'Tu barra…', label: 'Tu barra',
      send: 'Que responda la IA ▶', other: '↻ Otra frase', skip: 'Saltar sin IA', next: 'Siguiente ronda ▶', finish: 'Terminar ▶',
      short: 'Escribe tu barra (al menos 3 palabras).', thinking: 'El rival está pensando…',
      used: '✓ Usaste la palabra obligada.', missed: '✗ Te faltó la palabra obligada.', reply: 'La IA contesta', tip: 'Consejo: ',
      noai: 'Puedes seguir con una frase del banco.',
      say: '🎙 Decirla en voz', stop: '⏹ Parar', heard: 'Te escucho…', micbad: 'No pude usar el micrófono. Escribe tu barra.',
      end: '¡Batalla terminada! Respiraste, rimaste y no te rendiste. ¿Otra?', again: 'Otra batalla'
    },
    en: {
      battle: '⚔️ 1 vs 1 battle with the AI', close: 'Close',
      intro: 'Your rival throws a line. Answer with your bar using the required word and the AI replies, on your device when possible.',
      round: 'Round', of: 'of', word: 'Required word', rival: 'Rival', bank: 'opening line (no AI)', name: 'AI',
      answer: 'Rap it out loud and type it. You have ', sec: ' s.', ph: 'Your bar…', label: 'Your bar',
      send: 'Let the AI answer ▶', other: '↻ Another line', skip: 'Skip without AI', next: 'Next round ▶', finish: 'Finish ▶',
      short: 'Type your bar (at least 3 words).', thinking: 'Your rival is thinking…',
      used: '✓ You used the required word.', missed: '✗ You missed the required word.', reply: 'The AI answers', tip: 'Tip: ',
      noai: 'You can keep going with a line from the bank.',
      say: '🎙 Say it out loud', stop: '⏹ Stop', heard: 'Listening…', micbad: 'I could not use the microphone. Type your bar.',
      end: 'Battle over! You breathed, rhymed and kept going. Another one?', again: 'Another battle'
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
  const RONDAS = 6, SEG = 40;

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
  const idioma = () => (EN() ? 'en' : 'es');
  const nuevaPalabra = () => bolsa(PALABRAS[idioma()], 'flowlab_bia_p_' + idioma());
  const nuevaFrase = () => ({ f: bolsa(FRASES[idioma()], 'flowlab_bia_f_' + idioma()), p: nuevaPalabra(), donde: '' });   // donde vacío = del banco

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function boton(cls, txt, fn) { const b = el('button', 'btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b; }
  const llana = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  let dlg, ronda = 0, cur = null, timer = 0, resto = 0, lastFocus = null, turno = 0;

  function pararReloj() { clearInterval(timer); timer = 0; }
  /* Dictado de la barra (reconocimiento de voz del navegador; solo si la persona pulsa el botón) */
  const Voz = window.SpeechRecognition || window.webkitSpeechRecognition;
  let oyendo = null;
  function callar() { const r = oyendo; oyendo = null; if (r) { try { r.abort(); } catch (e) { } } }
  function botonVoz(ta, estado) {
    const t = L();
    const b = boton('btn-ghost bia-mic', t.say, () => {
      if (oyendo) { try { oyendo.stop(); } catch (e) { callar(); } return; }
      const r = new Voz(), previo = ta.value.trim();
      r.lang = EN() ? 'en-US' : 'es-PE'; r.interimResults = true; r.continuous = true;
      r.onresult = ev => { let dicho = ''; for (let i = 0; i < ev.results.length; i++) dicho += ev.results[i][0].transcript; ta.value = (previo + ' ' + dicho.trim()).trim().slice(0, 200); };
      r.onerror = ev => { if (ev && ev.error !== 'aborted' && ev.error !== 'no-speech') estado.textContent = t.micbad; };
      r.onend = () => { if (oyendo === r) oyendo = null; b.textContent = t.say; b.setAttribute('aria-pressed', 'false'); if (estado.textContent === t.heard) estado.textContent = ''; };
      try { r.start(); oyendo = r; b.textContent = t.stop; b.setAttribute('aria-pressed', 'true'); estado.textContent = t.heard; } catch (e) { estado.textContent = t.micbad; }
    });
    b.setAttribute('aria-pressed', 'false'); return b;
  }
  function cerrarBatalla() {
    callar(); pararReloj(); turno++; if (!dlg) return;
    dlg.classList.add('hidden'); document.body.classList.remove('glos-abierto');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  // Pasa a la ronda siguiente: con la respuesta de la IA como frase, o con una del banco
  function siguiente(deIA) {
    ronda++; cur = deIA ? { f: deIA.barras.join('\n'), p: nuevaPalabra(), donde: deIA.donde } : null; pintarRonda();
    const i = dlg.querySelector('.bia-input'); if (i) i.focus();
  }
  function pintarRonda() {
    const t = L(), body = dlg.querySelector('.bia-body'); body.textContent = ''; callar(); pararReloj(); turno++;
    if (ronda > RONDAS) {
      body.append(el('p', 'bia-end', t.end), boton('btn-neon', t.again, () => { ronda = 0; siguiente(); }));
      return;
    }
    cur = cur || nuevaFrase();
    body.append(el('div', 'bia-round', t.round + ' ' + ronda + ' ' + t.of + ' ' + RONDAS));
    body.append(el('div', 'bia-who', cur.donde ? '🤖 ' + t.name + ' · ' + cur.donde : '🥊 ' + t.rival + ' · ' + t.bank));
    body.append(el('p', 'bia-line', '“' + cur.f + '”'));
    const w = el('p', 'bia-word'); w.append(t.word + ': ', el('b', null, cur.p)); body.append(w);
    const c = el('p', 'bia-clock'); body.append(c);
    const pintaReloj = () => { c.textContent = t.answer + resto + t.sec; };
    resto = SEG; pintaReloj();
    timer = setInterval(() => { resto = Math.max(0, resto - 1); pintaReloj(); if (!resto) pararReloj(); }, 1000);
    const ta = el('textarea', 'bia-input'); ta.rows = 2; ta.maxLength = 200; ta.placeholder = t.ph; ta.setAttribute('aria-label', t.label); ta.spellcheck = false;
    const estado = el('p', 'bia-status'); estado.setAttribute('role', 'status'); estado.setAttribute('aria-live', 'polite');
    const res = el('div', 'bia-res');
    const fila = el('div', 'bia-actions');
    const enviar = boton('btn-neon bia-send', t.send, () => pedir(ta, estado, res, fila));
    if (!cur.donde) fila.append(boton('btn-ghost', t.other, () => { cur = nuevaFrase(); pintarRonda(); }));
    if (Voz) fila.append(botonVoz(ta, estado));
    fila.append(boton('btn-ghost bia-skip', t.skip, () => siguiente()), enviar);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); enviar.click(); } });
    body.append(ta, estado, res, fila);
  }
  async function pedir(ta, estado, res, fila) {
    const t = L(), barra = ta.value.trim();
    callar();
    if (barra.split(/\s+/).filter(Boolean).length < 3) { estado.textContent = t.short; ta.focus(); return; }
    if (!window.Coach || !window.Coach.rival) { estado.textContent = t.noai; return; }
    pararReloj(); const mio = ++turno, botones = [...fila.querySelectorAll('button')];
    botones.forEach(b => { b.disabled = true; }); estado.textContent = t.thinking; res.textContent = '';
    const r = await window.Coach.rival({ barra, anterior: cur.f, palabra: cur.p });
    if (mio !== turno) return;                                   // cerraron o cambiaron de ronda mientras tanto
    botones.forEach(b => { b.disabled = false; }); estado.textContent = '';
    if (r.aviso) {                                               // aviso de privacidad antes del primer envío
      const av = el('div', 'bia-aviso'); av.append(el('p', null, r.aviso), boton('btn-gold', r.boton, () => { window.Coach.aceptar(); pedir(ta, estado, res, fila); }));
      res.append(av); return;
    }
    if (r.crisis) { res.append(el('p', 'coach-crisis', r.crisis)); return; }
    if (r.error) { estado.textContent = r.error + (r.espera ? '' : ' ' + t.noai); return; }
    ta.readOnly = true;
    res.append(el('p', 'bia-check', llana(barra).includes(llana(cur.p)) ? t.used : t.missed));
    const caja = el('div', 'bia-reply'); caja.append(el('div', 'bia-who', '🤖 ' + t.reply), el('p', 'bia-line', r.barras.join('\n')));
    const donde = el('p', 'bia-badge', r.donde); donde.dataset.fuente = r.fuente; caja.append(donde);
    if (r.consejo) caja.append(el('p', 'bia-tip', t.tip + r.consejo));
    res.append(caja); fila.textContent = '';
    const sigue = boton('btn-neon bia-next', ronda >= RONDAS ? t.finish : t.next, () => siguiente(r));
    fila.append(sigue); sigue.focus();
  }
  function abrirBatalla() {
    const t = L();
    if (!dlg) {
      dlg = el('div', 'bia-dlg hidden'); dlg.id = 'batalla'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', t.battle);
      const card = el('div', 'bia-card');
      const head = el('div', 'bia-head'); head.append(el('strong', null, t.battle));
      const x = boton('btn-ghost btn-small bia-x', '✕', cerrarBatalla); x.setAttribute('aria-label', t.close);
      head.append(x); card.append(head, el('p', 'bia-intro', t.intro), el('div', 'bia-body')); dlg.append(card);
      dlg.addEventListener('click', e => { if (e.target === dlg) cerrarBatalla(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.classList.contains('hidden')) cerrarBatalla(); });
      document.body.append(dlg);
    } else {
      dlg.setAttribute('aria-label', t.battle); dlg.querySelector('.bia-head strong').textContent = t.battle; dlg.querySelector('.bia-intro').textContent = t.intro;
      dlg.querySelector('.bia-x').setAttribute('aria-label', t.close);
    }
    lastFocus = document.activeElement; ronda = 1; cur = null;
    dlg.classList.remove('hidden'); document.body.classList.add('glos-abierto'); pintarRonda();
    const i = dlg.querySelector('.bia-input'); if (i) i.focus();
  }

  window.addEventListener('flowlab:lang', () => { if (dlg && !dlg.classList.contains('hidden')) abrirBatalla(); });
  window.BatallaIA = { abrir: abrirBatalla, _FRASES: FRASES, _PALABRAS: PALABRAS };
})();

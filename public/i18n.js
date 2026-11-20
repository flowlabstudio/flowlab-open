'use strict';
/* =====================================================================
   FlowLab Studio · i18n.js  (Mejoras 8 · C)
   Selector de idioma ES / EN. El español es el idioma base y vive en el HTML;
   este archivo solo guarda las traducciones al inglés y las aplica. Lo que no
   tenga traducción se queda en español, sin romper nada.
     · Cada fila de LISTA = { s: selector CSS, k: tipo, en: texto en inglés }.
       Tipos: 'tx' (todo el texto), 'tn' (solo el primer texto suelto, respeta íconos y "?"),
              'ln' (el último texto suelto), 'attr:nombre' (title, aria-label, placeholder…).
     · El texto original en español se guarda para poder volver (WeakMap).
     · Para textos que arma JavaScript: I18n.t(clave, español) y escuchar el evento 'flowlab:lang'.
     · Se actualiza <html lang> y los aria-label. La elección se recuerda (con try/catch).
   Para traducir algo nuevo: añade una fila a LISTA (o una clave a JS / AYUDAS).
   ===================================================================== */
(function () {
  const K = 'flowlab_lang', K_NO = 'flowlab_lang_no';
  const LISTA = [
    // ---- Cabecera y modos ----
    { s: '.brand-text p', k: 'tx', en: 'Urban lyrics & vocal studio' },
    { s: '.modes', k: 'attr:aria-label', en: 'FlowLab modes' },
    { s: '#tab-cabina', k: 'ln', en: 'Booth' }, { s: '#tab-beats', k: 'ln', en: 'Beats' }, { s: '#tab-escuela', k: 'ln', en: 'School' },
    { s: '#modeInfo', k: 'attr:aria-label', en: 'See how this mode works' }, { s: '#modeInfo', k: 'attr:title', en: 'How does this mode work?' },
    { s: '#btnGlosario', k: 'tx', en: '📖 Glossary' }, { s: '#btnGlosario', k: 'attr:title', en: 'Glossary and help: what each word means' },
    { s: '#btnCoach', k: 'tx', en: '🤖 AI Coach' }, { s: '#btnCoach', k: 'attr:title', en: 'Freestyle coach with AI: improve your lyrics or get ideas to vent' },
    { s: '#installApp', k: 'tx', en: '⬇ Install app' },
    // ---- Cabina ----
    { s: '#panel-beat .step-title', k: 'tn', en: 'Choose the base' },
    { s: '#panel-beat .step-title small', k: 'tx', en: 'a YouTube link, your MP3/WAV or a FlowLab beat' },
    { s: '#bc-yt .bc-head b', k: 'tx', en: 'Paste a YouTube link' }, { s: '#ytInput', k: 'attr:placeholder', en: 'Paste a YouTube link…' },
    { s: '#bc-file .dz-title', k: 'tx', en: 'Upload my MP3 / WAV' }, { s: '#beatQuick .bc-head b', k: 'tx', en: 'Quick beat builder' },
    { s: '#panel-lyrics .lyrics-head .eyebrow', k: 'tn', en: 'Lyrics · writing editor and syllable counter' },
    { s: '#mainTextarea', k: 'attr:placeholder', en: 'Write your lyrics here… Enter for a new line, paste whole lyrics, edit freely.' },
    { s: '#btnDictate', k: 'tx', en: '🗣 Dictate lyrics' }, { s: '#copyLyrics', k: 'tx', en: '📋 Copy' }, { s: '#clearLyrics', k: 'tx', en: '🗑 Clear' },
    { s: '#btnCoachLetra', k: 'tx', en: '🤖 Improve with AI' }, { s: '#btnCoachLetra', k: 'attr:title', en: 'The Coach (AI) reviews your lyrics: internal rhymes, syllables and ideas' },
    { s: '#panel-vocal .panel-head .eyebrow', k: 'tn', en: 'Record · voice input' },
    { s: '#btnRecord', k: 'attr:aria-label', en: 'Record (Alt+R)' },
    { s: '.eyebrow.magenta', k: 'tn', en: 'Voice effects' }, { s: '.eyebrow.orange', k: 'tn', en: 'Your takes · recording history' },
    { s: '#moreFx > summary', k: 'tn', en: 'More options · fine voice settings' },
    { s: '#moreVoz > summary', k: 'tn', en: 'More options · test sound and microphone, clear history' },
    // ---- Beats ----
    { s: '.beats-title', k: 'tn', en: 'Build. Try. Refine.' },
    { s: '#btGenresTitle', k: 'tn', en: 'Pick a rhythm and make it yours' }, { s: '#btPadsTitle', k: 'tn', en: '1 · Play the pads' },
    { s: '#btSeqTitle', k: 'tn', en: '2 · Build your pattern' }, { s: '#btTrackTitle', k: 'tn', en: '3 · Your track · use or download your beat' },
    { s: '#moreFxBeats > summary', k: 'tn', en: 'More options · Add flavor (vinyl, filter, saturation)' },
    { s: '#moreMine > summary', k: 'tn', en: 'More options · Saved beats' },
    { s: '#moreBeatsKit > summary', k: 'tn', en: 'More options · listen to the kit, test sound, phone mode' },
    { s: '#moreChips > summary', k: 'tn', en: 'More options · add layers with one tap' },
    // ---- Escuela ----
    { s: '#school .school-head h3', k: 'tn', en: 'Freestyle School' },
    { s: '#startHere .sh-title', k: 'tx', en: '👋 Start here' },
    { s: '#startHereGo', k: 'tx', en: 'Set up Univocal · easy' }, { s: '#startHereHide', k: 'tx', en: 'I already know how to play' },
    { s: '#beatPickT', k: 'tx', en: 'Choose your beat' },
    { s: '.bp-opt[data-bp=flowlab]', k: 'tn', en: '🎲 FlowLab beat ' }, { s: '.bp-opt[data-bp=flowlab] small', k: 'tx', en: 'random · ready to play' },
    { s: '.bp-opt[data-bp=yt]', k: 'tn', en: '▶ My YouTube link ' }, { s: '.bp-opt[data-bp=yt] small', k: 'tx', en: 'paste it in the base above' },
    { s: '.bp-opt[data-bp=mp3]', k: 'tn', en: '📁 My MP3 / WAV ' }, { s: '.bp-opt[data-bp=mp3] small', k: 'tx', en: 'stays on your device' },
    { s: '#moreEscuela > summary', k: 'tn', en: 'More options · duration, prompt change, beat volume, metronome' }
  ];

  // Textos que arma JavaScript (clave → inglés). Quien los usa pasa el español: I18n.t('clave', 'español')
  const JS = {
    'mode.cabina.n': 'BOOTH MODE', 'mode.cabina.t': 'Write, record and mix.',
    'mode.beats.n': 'BEATS MODE', 'mode.beats.t': 'Build your own rhythm.',
    'mode.escuela.n': 'SCHOOL MODE', 'mode.escuela.t': 'Train your flow, from basic to battle.',
    'intro.ok': 'Got it',
    'intro.cabina.t': 'Here you record your voice over a beat.',
    'intro.cabina.1': 'Pick a base: a YouTube link, your MP3/WAV or a FlowLab beat.', 'intro.cabina.2': 'Press REC and rap. Press again to stop.', 'intro.cabina.3': 'Listen to your take, tune it and download it.',
    'intro.beats.t': 'Here you build your own rhythm, with nothing to install.',
    'intro.beats.1': 'Pick a genre and tap a rhythm.', 'intro.beats.2': 'Make it yours: turn steps on, add instruments and change the kit.', 'intro.beats.3': 'Use it in the Booth or download it.',
    'intro.escuela.t': 'Here you practice freestyle with short games: they give you a vowel, words or a topic, and you rhyme to a beat. You earn points and rank up.',
    'intro.escuela.1': 'Pick a game. Start with Univocal on easy.', 'intro.escuela.2': 'Press Start and rhyme to the beat.', 'intro.escuela.3': 'At the end you see your points, XP and rank.',
    'suggest.t': 'This app is also available in English.', 'suggest.yes': 'Switch to English', 'suggest.no': 'No thanks'
  };

  // Ayudas "?" principales (clave = título en español → [título, texto, ejemplo])
  const AYUDAS = {
    'Modos': ['Modes', 'FlowLab has three modes (the tabs above): Booth to write, record and mix; Beats to build your own rhythm with pads and a sequencer; and School to train freestyle with games.', 'Write in the Booth, make a beat in Beats, train in School.'],
    'Pegar link de YouTube': ['Paste a YouTube link', 'Paste the link of a YouTube beat and press Load. It is great for practicing. YouTube is only played, so to export your mix use an MP3/WAV.', 'Paste the link of a trap beat and press Load.'],
    'Subir mi MP3 / WAV': ['Upload my MP3 / WAV', 'Pick or drag an MP3/WAV file. It stays in your browser; it is not uploaded anywhere.', 'Drag your beat.mp3 onto the box.'],
    'Armar beat rápido': ['Quick beat builder', 'Takes you to Beats mode to make your own rhythm with pads, without searching for a beat.', 'Tap a trap rhythm and use it in the Booth.'],
    'Base activa': ['Active base', 'The base is the background music (the "beat") you record over and practice with. Here you see which one is loaded.', 'Base: my-beat.mp3.'],
    'Ritmos listos': ['Ready rhythms', 'Pick a genre and tap a rhythm: its pattern, tempo, kit, swing and effects load at once.', 'Trap → "Midnight" at 140 BPM.'],
    'Pads': ['Pads', 'Each pad is an instrument. Play them with the mouse, your finger or the keys Q W E R / A S D F.', 'Press Q for the kick.'],
    'Tempo': ['Tempo', 'The speed of the beat in beats per minute (BPM). Boom bap ≈ 85-95, trap ≈ 130-160.', '90 BPM feels relaxed; 140 feels fast.'],
    'Secuenciador': ['Sequencer', 'Each row is an instrument and each square is one step of the bar. Tap to turn it on or off.', 'Turn on steps 1 and 9 of the kick row.'],
    'Entrada de voz': ['Voice input', 'Here you record your voice with the effects. Press REC (or Alt+R) to start and press again to stop.', 'Press REC, rap 16 bars, press DETENER.'],
    'Escucharme en vivo': ['Hear myself live', 'You hear yourself in your headphones while you sing, already with the effects. Use headphones to avoid feedback.', 'Plug in headphones, then turn it on.'],
    'Escuela de Freestyle': ['Freestyle School', 'Games to train freestyle from basic to battle. You earn XP and rank up.', 'Start with Univocal on easy.'],
    'Dificultad': ['Difficulty', 'Easy: simple words and slow changes. Hard: abstract words and fast changes.', 'Easy for your first day.'],
    'BPM': ['BPM', 'Beats per minute: how fast the base is (boom bap ≈ 85-95, trap ≈ 130-160).', 'Tap the TAP button to the beat.'],
    'Bloc de notas': ['Notepad', 'Write your lyrics. On the left you see the line number and the syllables of each line.', 'One line per bar.'],
    'Modo entrenamiento': ['Training mode', 'Shows you a random word, topic or phrase so you can improvise on it.', 'The word is "rain": rhyme with it.']
  };

  const guardado = new WeakMap();   // elemento → { tipo: original }
  const nodos = el => [...el.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim());
  function poner(el, k, valor) {
    const g = guardado.get(el) || {}; guardado.set(el, g);
    if (k === 'tx') { if (!('tx' in g)) g.tx = el.textContent; el.textContent = valor === null ? g.tx : valor; return; }
    if (k === 'tn' || k === 'ln') {
      const ns = nodos(el); const n = k === 'tn' ? ns[0] : ns[ns.length - 1]; if (!n) return;
      if (!(k in g)) g[k] = n.nodeValue;
      if (valor === null) { n.nodeValue = g[k]; return; }
      const o = g[k], ini = (o.match(/^\s*/) || [''])[0], fin = (o.match(/\s*$/) || [''])[0]; n.nodeValue = ini + valor.trim() + fin; return;
    }
    if (k.startsWith('attr:')) {
      const a = k.slice(5); if (!(k in g)) g[k] = el.getAttribute(a);
      const v = valor === null ? g[k] : valor; if (v == null) el.removeAttribute(a); else el.setAttribute(a, v);
    }
  }
  let actual = 'es';
  function aplica(l) {
    LISTA.forEach(f => document.querySelectorAll(f.s).forEach(el => poner(el, f.k, l === 'en' ? f.en : null)));
    document.documentElement.lang = l === 'en' ? 'en' : 'es-PE';
    const sel = document.getElementById('langSel'); if (sel) { sel.value = l; sel.setAttribute('aria-label', l === 'en' ? 'Language' : 'Idioma'); }
  }
  function guarda(l) { try { localStorage.setItem(K, l); } catch (e) { } }
  function set(l, opciones) {
    l = l === 'en' ? 'en' : 'es';
    const cambio = l !== actual; actual = l; aplica(l);
    if (!(opciones && opciones.noGuardar)) guarda(l);
    const s = document.getElementById('langSuggest'); if (s) s.remove();
    if (cambio) window.dispatchEvent(new CustomEvent('flowlab:lang', { detail: { lang: l } }));
  }
  const t = (clave, es) => (actual === 'en' && JS[clave] !== undefined ? JS[clave] : es);
  const ayuda = titulo => (actual === 'en' && AYUDAS[titulo]) ? AYUDAS[titulo] : null;

  function sugerir() {   // si el navegador está en inglés y nunca elegiste: se sugiere, sin forzar
    let elegido = null, no = null; try { elegido = localStorage.getItem(K); no = localStorage.getItem(K_NO); } catch (e) { }
    if (elegido || no) return;
    if (!/^en\b/i.test(navigator.language || '')) return;
    const b = document.createElement('div'); b.id = 'langSuggest'; b.className = 'lang-suggest'; b.setAttribute('role', 'note');
    const p = document.createElement('span'); p.textContent = JS['suggest.t'];
    const si = document.createElement('button'); si.type = 'button'; si.className = 'btn btn-neon btn-small'; si.id = 'langSuggestYes'; si.textContent = JS['suggest.yes'];
    const no2 = document.createElement('button'); no2.type = 'button'; no2.className = 'btn btn-ghost btn-small'; no2.id = 'langSuggestNo'; no2.textContent = JS['suggest.no'];
    si.addEventListener('click', () => set('en'));
    no2.addEventListener('click', () => { try { localStorage.setItem(K_NO, '1'); } catch (e) { } b.remove(); });
    b.append(p, si, no2); document.body.insertBefore(b, document.body.firstChild);
  }

  function iniciar() {
    const sel = document.getElementById('langSel'); if (sel) sel.addEventListener('change', () => set(sel.value));
    let l = null; try { l = localStorage.getItem(K); } catch (e) { }
    if (l === 'en') set('en', { noGuardar: true }); else { actual = 'es'; if (sel) sel.value = 'es'; sugerir(); }
  }
  window.I18n = { lang: () => actual, set, t, ayuda, aplica: () => aplica(actual) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

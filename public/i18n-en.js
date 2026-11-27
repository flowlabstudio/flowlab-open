/* =====================================================================
   FlowLab Studio · i18n-en.js
   Diccionario ES → EN para los textos visibles que i18n.js no cubre por selector.
   Con el idioma en inglés traduce nodos de texto y atributos (placeholder, title, aria-label),
   también los que arma JavaScript después (MutationObserver). Al volver a español los restaura.
   No toca lo que escribe la persona ni las palabras de los juegos (el freestyle es en español).
   ===================================================================== */
(function () {
  'use strict';
  const D = {
    'Cargando sonidos…': 'Loading sounds…',
    "Escribe, graba y mezcla": "Write, record and mix",
    "Arma tu ritmo": "Build your rhythm",
    "Entrena tu freestyle": "Train your freestyle",
    "Una pieza completa, organizada por tiempo y secciones.": "A full piece, organised by time and sections.",
    "Guitarra": "Guitar",
    "Cuerdas": "Strings",
    "Metales": "Brass",
    "Flauta": "Flute",
    "Percusión": "Percussion",
    "Mitad de tempo": "Half time",
    "te deja elegir la nota de cada paso. En cada pista puedes escoger cualquiera de los 68 samples o usar el sonido automático del kit.": "lets you pick the note of each step. On each track you can choose any of the 68 samples or use the automatic kit sound.",
    "Clásico de los 90: bombo seco y con pegada, caja crujiente con cuerpo y chasquido.": "90s classic: dry punchy kick, crisp snare with body and snap.",
    "808 largo y profundo con deslizamiento, clap seco y corto, hi-hats muy cortos y brillantes.": "Long deep sliding 808, short dry clap, very short bright hi-hats.",
    "Oscuro y frío: 808 deslizante, caja seca y dura, hi-hats rápidos y filosos.": "Dark and cold: sliding 808, dry hard snare, fast sharp hi-hats.",
    "Reggaetón: bombo seco y corto, rim agudo \"de plástico\" y hi-hats limpios.": "Reggaeton: short dry kick, high \"plastic\" rim and clean hi-hats.",
    "Suave, redondo y cálido: todo apagadito, con caja blanda y un bajo de seda.": "Soft, round and warm: muted, with a soft snare and silky bass.",
    "Ir al inicio de FlowLab Studio": "Go to the FlowLab Studio start",
    "Descargar letra en .TXT": "Download lyrics as .TXT",
    "Acciones de la toma": "Take actions",
    "Más acciones de la cabina": "More booth actions",
    "Volumen de mi beat": "My beat volume",
    "Instrumentos que puedes añadir": "Instruments you can add",
    "Quitar esta fila": "Remove this row",
    "Forma de onda de tu beat": "Waveform of your beat",
    "Quitar esta capa": "Remove this layer",
    "Capas que puedes añadir": "Layers you can add",
    "Herramientas de graffiti": "Graffiti tools",
    "Usa el reconocimiento de voz del navegador para comprobar si metiste las palabras": "Uses browser speech recognition to check whether you used the words",
    // Cabecera y portadas
    'SESIÓN ·': 'SESSION ·',
    'Rapea. Graba. Mejora.': 'Rap. Record. Improve.',
    'Tu estudio de freestyle con Coach de IA que piensa en tu dispositivo.': 'Your freestyle studio with an AI Coach that thinks on your device.',
    'Arma tu beat': 'Build your beat',
    'Pads, secuenciador y bases de varios géneros.': 'Pads, sequencer and tracks in several genres.',
    'Entrena tu flow': 'Train your flow',
    'De cero a máximo: retos rápidos con rimas, palabras y batallas.': 'From zero to pro: quick challenges with rhymes, words and battles.',
    // Cabina · base
    'Cargar': 'Load',
    'Toca o arrástralo aquí · se queda en tu equipo, sin servidor': 'Tap or drag it here · it stays on your device, no server',
    'Crea tu propio ritmo con pads en el modo Beats': 'Make your own rhythm with pads in Beats mode',
    'Con un beat de FlowLab sí puedes grabar y exportar tu voz con el beat en un solo archivo.': 'With a FlowLab beat you can record and export your voice with the beat in a single file.',
    'YouTube: watch?v=, youtu.be, /shorts/, /embed/… · Para exportar la mezcla final usa una base MP3/WAV.': 'YouTube: watch?v=, youtu.be, /shorts/, /embed/… · To export the final mix use an MP3/WAV track.',
    'Toca para activar el sonido.': 'Tap to turn the sound on.',
    'Si no oyes nada: quita el': 'If you hear nothing: turn off',
    'modo silencio': 'silent mode',
    'del celular (interruptor al costado) y sube el volumen.': 'on your phone (side switch) and raise the volume.',
    '⚠️ Abriste el estudio como archivo local (file://). El Auto-Tune (AudioWorklet) y la sincronía con YouTube necesitan un servidor local: haz doble clic en': '⚠️ You opened the studio as a local file (file://). Auto-Tune (AudioWorklet) and YouTube sync need a local server: double-click',
    '. Mientras tanto la grabación funciona en modo voz limpia.': '. Meanwhile, recording works in clean voice mode.',
    // Cabina · bloc y entrenamiento
    '↗ Modo entrenamiento': '↗ Training mode',
    'Tipo de estímulo': 'Prompt type',
    'Líneas:': 'Lines:',
    'Sílabas totales:': 'Total syllables:',
    'Prom. sílabas/línea:': 'Avg. syllables/line:',
    'Dictado voz→texto:': 'Voice-to-text dictation:',
    '+ Nuevo Tema': '+ New song',
    '✕ Borrar': '✕ Delete',
    '⚠️ Límite de temas alcanzado.': '⚠️ Song limit reached.',
    'Motor de Rimas Fonéticas': 'Phonetic rhyme engine (Spanish)',
    'Línea:': 'Line:',
    'Palabra:': 'Word:',
    'Terminación:': 'Ending:',
    'Escribe para ver rimas…': 'Type to see rhymes…',
    'Rima según la línea donde está el cursor. Clic en una rima para insertarla.': 'Rhymes follow the line where your cursor is. Click a rhyme to insert it.',
    'ESTÍMULO': 'PROMPT',
    '/ DEJA QUE LA PALABRA TE LLEVE': '/ LET THE WORD TAKE YOU',
    'Sin pensarlo tanto. Conviértelo en una barra.': "Don't overthink it. Turn it into a bar.",
    '↻ Nueva palabra': '↻ New word',
    'inactivo': 'inactive',
    'escuchando…': 'listening…',
    'micrófono abierto, habla…': 'mic open, speak…',
    'te escucho…': 'I hear you…',
    'no se pudo iniciar': 'could not start',
    'se detuvo (revisa tu conexión)': 'stopped (check your connection)',
    'no soportado (usa Chrome, Edge u Opera GX)': 'not supported (use Chrome, Edge or Opera GX)',
    'no se captó texto (¿micrófono correcto? ¿navegador Chrome?)': 'no text captured (right microphone? Chrome browser?)',
    // Cabina · voz y mezcla
    'Micrófono predeterminado': 'Default microphone',
    'Micrófono:': 'Microphone:',
    '▶ Escuchar última': '▶ Play last take',
    '🗑 Borrar historial': '🗑 Clear history',
    '🎙 Probar micrófono': '🎙 Test microphone',
    '📋 Copiar diagnóstico': '📋 Copy diagnostics',
    'Datos de diagnóstico': 'Diagnostic data',
    'Pulsa "Probar micrófono" para ver los datos.': 'Press "Test microphone" to see the data.',
    'Pulsa REC para grabar y otra vez para detener (Alt+R). Si hay base MP3/WAV cargada, arranca sola desde la aguja al grabar. Usa audífonos para evitar acople.': 'Press REC to record and again to stop (Alt+R). If an MP3/WAV track is loaded, it starts from the playhead when you record. Use headphones to avoid feedback.',
    'Retune 65% · cálido': 'Retune 65% · warm',
    'Voz Cruda': 'Raw voice',
    'Sin Auto-Tune · limpia': 'No Auto-Tune · clean',
    'Afinación automática': 'Automatic tuning',
    'Velocidad de Afinación (Retune Speed)': 'Retune Speed',
    '0% = natural · 100% = Trap Tune robótico': '0% = natural · 100% = robotic Trap Tune',
    'La Menor (A minor)': 'A minor',
    'Volumen del micrófono (ganancia)': 'Microphone volume (gain)',
    'Voz pareja (compresión)': 'Even voice (compression)',
    'Lo que te oyes (volumen de monitoreo)': 'What you hear (monitor volume)',
    'Sin tomas grabadas. ¡Pulsa "● Grabar" para empezar!': 'No takes yet. Press "● Record" to start!',
    '▶ Reproducir Mezcla (Base + Voz)': '▶ Play mix (Track + Voice)',
    '▶ Reproducir Mezcla (Base + Beat + Voz)': '▶ Play mix (Track + Beat + Voice)',
    '↓ Exportar solo mi voz': '↓ Export only my voice',
    'El audio de YouTube no se puede incluir en el archivo.': 'YouTube audio cannot be included in the file.',
    'Para exportar tu voz con beat, usa un beat de FlowLab (tarjeta 03) o sube tu MP3/WAV.': 'To export your voice with a beat, use a FlowLab beat (card 03) or upload your MP3/WAV.',
    'Sobre YouTube:': 'About YouTube:',
    'el navegador no deja mezclar ni exportar el audio de un video de YouTube. Aquí solo se escucha en conjunto con tu beat y tu voz, con sincronía aproximada. Para mezclar y exportar, sube un MP3/WAV propio (tarjeta 02).': 'the browser does not allow mixing or exporting the audio of a YouTube video. Here it only plays along with your beat and voice, with approximate sync. To mix and export, upload your own MP3/WAV (card 02).',
    'patrón · bucle': 'pattern · loop',
    'PISTA 2 · VOZ': 'TRACK 2 · VOICE',
    'Sincronizar Voz (ms)': 'Voice sync (ms)',
    'Editar mi archivo (la base)': 'Edit my file (the track)',
    'También puedes recortar arrastrando los bordes (las pestañas) de la onda de la base. El volumen, M (silenciar) y S (solo) están en la pista.': 'You can also trim by dragging the edges (tabs) of the track waveform. Volume, M (mute) and S (solo) are on the track.',
    'Clic en la regla o en las pistas para mover la aguja. La toma activa se coloca en el segundo exacto del beat donde empezó.': 'Click the ruler or the tracks to move the playhead. The active take is placed at the exact second of the beat where it started.',
    'activo · opciones simples': 'active · simple options',
    'en pausa · se vuelve a abrir al grabar': 'paused · it reopens when you record',
    'iniciando el video de YouTube…': 'starting the YouTube video…',
    'procesando toma…': 'processing take…',
    'toma guardada · micrófono activo': 'take saved · microphone active',
    'toma demasiado corta, inténtalo otra vez': 'take too short, try again',
    'toma guardada, pero salió en silencio': 'take saved, but it came out silent',
    'micrófono desconectado · pulsa Grabar para reconectar': 'microphone disconnected · press Record to reconnect',
    'este navegador no permite grabar (usa Chrome, Edge u Opera GX)': 'this browser cannot record (use Chrome, Edge or Opera GX)',
    // Beats
    'Reggaetón': 'Reggaeton',
    'Patrón': 'Pattern',
    'Swing (ritmo balanceado)': 'Swing (laid-back groove)',
    '🎲 Sorpréndeme': '🎲 Surprise me',
    '🎲 Sorpréndeme · 2:30': '🎲 Surprise me · 2:30',
    'Genera una composición distinta con instrumentos, samples y efectos': 'Generate a different arrangement with instruments, samples and effects',
    'Secciones de la composición': 'Arrangement sections',
    'Seleccionar fragmento de la composición': 'Select an arrangement segment',
    'Fragmento para editar': 'Segment to edit',
    '＋ Añadir 10 s': '＋ Add 10 sec',
    'Intro': 'Intro', 'Build-up': 'Build-up', 'Drop': 'Drop', 'Variación': 'Variation',
    'Respiro': 'Breakdown', 'Drop final': 'Final drop', 'Cierre': 'Outro', 'Nueva variación': 'New variation',
    '¡Composición nueva! Melodías, percusión, samples y efectos variables. Vinilo apagado.': 'New arrangement! Melodies, percussion, samples and varied effects. Vinyl is off.',
    '💾 Guardar': '💾 Save',
    'Guardar': 'Save',
    '← Volver a la Cabina': '← Back to the Booth',
    'Lo-fi polvoriento: filtro, saturación suave y un leve "tape" que desafina.': 'Dusty lo-fi: filter, soft saturation and a slight detuning "tape".',
    'Modo celular': 'Phone mode',
    'Con el mouse, con el dedo o con el teclado:': 'With the mouse, your finger or the keyboard:',
    '. Al aire, sin miedo.': '. Go ahead, no fear.',
    'Mueve los deslizadores y escucha cómo cambia.': 'Move the sliders and hear it change.',
    'Efectos · vinilo, filtro, saturación y reverb': 'Effects · vinyl, filter, saturation and reverb',
    'Reverb': 'Reverb',
    'Saturación': 'Saturation',
    '+ Añadir instrumento': '+ Add instrument',
    'Toca un paso para encenderlo o apagarlo. Mantén pulsado (o clic derecho) para cambiar la fuerza del golpe. En bajo y sample,': 'Tap a step to turn it on or off. Hold (or right-click) to change how hard it hits. On bass and sample,',
    'Toca un paso para encenderlo o apagarlo. Mantén pulsado (o clic derecho) para cambiar la fuerza del golpe. En bajo y sample, te deja elegir la nota de cada paso. En cada pista puedes escoger cualquiera de los 68 samples o usar el sonido automático del kit.': 'Tap a step to turn it on or off. Hold (or right-click) to change its velocity. On bass and sample, pick a note for each step. Each track can use any of the 68 samples or the kit sound.',
    'te deja elegir la nota de cada paso.': 'lets you pick the note of each step.',
    '↔ Desliza el patrón para ver todos los pasos': '↔ Swipe the pattern to see every step',
    'Así se ve tu beat en el tiempo. Cada capa es un instrumento: quítala con ✕, silénciala con M o añade otra con los botones "+". El beat se actualiza al instante.': 'This is your beat over time. Each layer is an instrument: remove it with ✕, mute it with M or add another with the "+" buttons. The beat updates instantly.',
    'Largo del beat': 'Beat length',
    '🎤 Usar en la cabina': '🎤 Use in the Booth',
    'Aún no guardaste ninguno. Arma un patrón y pulsa': "You haven't saved any yet. Build a pattern and press",
    ': se queda en este navegador.': ': it stays in this browser.',
    'No necesitas teoría, necesitas ganas.': "You don't need theory, you need drive.",
    'Empieza con bombo y caja. Lo demás llega solo.': 'Start with kick and snare. The rest will come.',
    'Mi primer beat': 'My first beat',
    'Patrón limpio. Hoja en blanco.': 'Pattern cleared. Blank page.',
    '¡Sorpresa! Cambia lo que quieras, o pulsa otra vez.': 'Surprise! Change anything, or press again.',
    'Borrado.': 'Deleted.', 'Duplicado.': 'Duplicated.',
    'Deja al menos un instrumento en el patrón.': 'Keep at least one instrument in the pattern.',
    'No se pudo cargar ese sample. Se conserva la fuente anterior.': 'That sample could not be loaded. The previous source is kept.',
    'Fuente de': 'Source for',
    'Bombo': 'Kick', 'Caja': 'Snare', 'Bajo': 'Bass', 'Palmas': 'Claps', 'Textura': 'Texture', 'Platillo': 'Cymbal',
    // Escuela
    'Pulsa': 'Press', 'Preparar': 'Prepare', ': deja listo': ': it sets up', 'Univocal · fácil': 'Univocal · easy', 'por 1 minuto.': 'for 1 minute.',
    '▶ Empezar': '▶ Start', ': suena un beat y el juego te da una vocal.': ': a beat plays and the game gives you a vowel.',
    'Rima una palabra por barra. Al final ves tus puntos y tu rango.': 'Rhyme one word per bar. At the end you see your points and rank.',
    'Juegas sobre un beat de FlowLab que cambia en cada partida. No tienes que hacer nada más.': 'You play over a FlowLab beat that changes every game. Nothing else to do.',
    '⚔️ Batalla 1 vs 1 con la IA': '⚔️ 1 vs 1 battle against the AI',
    '🎯 Reto del día': '🎯 Daily challenge',
    '¿Qué es esto?': 'What is this?',
    'Velocidad del beat (BPM)': 'Beat speed (BPM)',
    'Toca al ritmo del beat. Con 4 toques ya calcula el BPM; sigue tocando para afinarlo. Si paras 2 segundos, empieza de nuevo.': 'Tap to the beat. After 4 taps it calculates the BPM; keep tapping to refine it. If you stop for 2 seconds, it starts over.',
    'Fácil': 'Easy', 'Difícil': 'Hard', '· Fácil': '· Easy',
    'Beat del juego': 'Game beat',
    'Sin beat (solo metrónomo)': 'No beat (metronome only)',
    '¿Qué sientes hoy?': 'How do you feel today?',
    '😄 Alegría': '😄 Joy', '😠 Rabia': '😠 Anger', '😢 Tristeza': '😢 Sadness', '❤️ Amor': '❤️ Love', '😨 Miedo': '😨 Fear', '🌱 Esperanza': '🌱 Hope', '📼 Nostalgia': '📼 Nostalgia',
    '🤖 Desahógate con IA': '🤖 Vent with AI',
    '🎙 Verificar con mi voz (beta)': '🎙 Verify with my voice (beta)',
    'Usa audífonos:': 'Use headphones:',
    'el reconocimiento de voz entiende mucho mejor si no oye el beat. Con beat de fondo, su volumen baja solo mientras te escucha. Una ronda verificada por voz da el XP completo; la de autoevaluación da el 40 % y queda "sin verificar".': 'speech recognition works much better if it cannot hear the beat. The beat volume lowers while it listens. A voice-verified round gives full XP; a self-scored one gives 40% and stays "unverified".',
    'Cambio cada': 'Change every', '1 compás': '1 bar', 'Duración': 'Duration', 'Volumen del beat': 'Beat volume',
    'Metrónomo': 'Metronome', 'Arrancar con la base': 'Start with my track',
    'ELIGE UN JUEGO': 'PICK A GAME', 'y pulsa Empezar': 'and press Start',
    'La mitad': 'Half time', 'Compás': 'Bar',
    'Beat: se elige al empezar (aleatorio)': 'Beat: chosen when you start (random)',
    'Preparando el beat…': 'Preparing the beat…',
    'Funciona con cualquier base: elige el BPM, usa TAP sobre la de YouTube o 🔍 para detectarlo de tu MP3. Esc = terminar.': 'Works with any track: set the BPM, use TAP on a YouTube one or 🔍 to detect it from your MP3. Esc = finish.',
    'juega al menos 15 segundos para sumar XP': 'play at least 15 seconds to earn XP',
    'Sin puntaje: esto es solo para ti. No se guardó nada.': 'No score: this is just for you. Nothing was saved.',
    'consonante +2 · asonante +1': 'perfect rhyme +2 · vowel rhyme +1',
    '0 días': '0 days', 'Palabras (voz)': 'Words (voice)', 'Precisión media': 'Average accuracy',
    'Últimos 14 días (minutos)': 'Last 14 days (minutes)',
    'Aún no hay sesiones. ¡Juega tu primera ronda!': 'No sessions yet. Play your first round!',
    'Desbloquear todo': 'Unlock everything',
    'Novato': 'Rookie', 'Aprendiz': 'Apprentice', 'MC de Barrio': 'Neighborhood MC', 'Retador': 'Challenger', 'Veterano de Plaza': 'Plaza Veteran', 'Leyenda': 'Legend',
    // Juegos
    'Rima Relámpago': 'Lightning Rhyme', 'Cadena 4x4': '4x4 Chain', 'Palabra Bomba': 'Word Bomb', 'Objetos': 'Objects', 'Temáticas': 'Topics', 'Terminaciones': 'Endings',
    'Pie Forzado': 'Forced Ending', 'Contrastes': 'Contrasts', 'Personajes': 'Characters', 'Modo Batalla': 'Battle Mode', 'Minuto libre': 'Free minute',
    'Minuto de sangre': 'Blood minute', 'Desahógate': 'Let it out', 'Mi barrio': 'My neighborhood', 'Mi historia': 'My story', 'Superación': 'Overcoming', 'Amor y desamor': 'Love & heartbreak',
    'Una palabra por barra con la misma vocal: las 4 del bloque riman entre sí y luego cambia la familia (con 🎲 también la vocal).': 'One word per bar with the same vowel: the 4 in a block rhyme with each other, then the family changes (with 🎲 the vowel too).',
    'Termina cada barra con la palabra que brilla (fama → nada → casa → plata). Así entrenas la rima asonante sin pensar.': 'End each bar with the glowing word (fama → nada → casa → plata). That trains vowel rhyme without thinking.',
    'Contra el reloj: escribe (o di) todas las rimas que puedas.': 'Against the clock: type (or say) as many rhymes as you can.',
    'Consonante (+2) cuando suena igual desde la vocal fuerte: corazón → canción. Asonante (+1) cuando solo coinciden las vocales: corazón → amor.': 'Perfect rhyme (+2) when it sounds the same from the stressed vowel: corazón → canción. Vowel rhyme (+1) when only the vowels match: corazón → amor.',
    'Una palabra por barra: las 4 riman igual (consonante) y después cambia a otra terminación.': 'One word per bar: all 4 share a perfect rhyme, then the ending changes.',
    'Así se arma un 4x4 de canción: barra 1, 2, 3 y 4 terminan rimando (pasado, lado, soldado, cuidado). Mira las casillas para planear el remate.': 'This is how a song 4x4 is built: bars 1 to 4 end in rhyme (pasado, lado, soldado, cuidado). Watch the boxes to plan your punchline.',
    'Sale una palabra: métela en tu barra antes de que cambie.': 'A word appears: fit it into your bar before it changes.',
    'No la sueltes al azar: usa la palabra como remate de la barra. Pro: conecta la palabra nueva con la anterior.': "Don't just drop it: use the word to close the bar. Pro: connect the new word with the previous one.",
    'Aparece un objeto: descríbelo con metáforas.': 'An object appears: describe it with metaphors.',
    'Piensa en qué se parece: "soy como el reloj, nunca me detengo". Las comparaciones dan barras memorables.': 'Think about what it resembles: "soy como el reloj, nunca me detengo". Comparisons make memorable bars.',
    'Un tema: rapea sin salirte de él.': 'One topic: rap without leaving it.',
    'Estructura: presenta el tema, da un ejemplo personal y remata con una conclusión fuerte en la 4ª barra.': 'Structure: introduce the topic, give a personal example and close with a strong 4th bar.',
    'Cierra tus barras con palabras que terminen igual.': 'Close your bars with words that end the same way.',
    'Prepara el remate antes: piensa la palabra final primero y construye la barra hacia ella.': 'Prepare the punchline first: pick the final word and build the bar toward it.',
    'Termina tus 4 barras con la frase exacta.': 'End your 4 bars with the exact phrase.',
    'Clásico de batallas: las 3 primeras barras deben llevar con sentido a la frase final, que debe rimar con ellas.': 'A battle classic: the first 3 bars must lead naturally to the final phrase, and rhyme with it.',
    'Dos ideas opuestas: conéctalas en tus barras.': 'Two opposite ideas: connect them in your bars.',
    'Usa la oposición como juego: "fui hielo cuando todos eran fuego". Las antítesis suenan a punchline.': 'Play with opposites: "fui hielo cuando todos eran fuego". Contrasts sound like punchlines.',
    'Rapea en primera persona siendo el personaje.': 'Rap in first person as the character.',
    'Cambia la voz y el punto de vista. Inventa detalles concretos del personaje: dónde vive, qué odia, qué sueña.': 'Change your voice and point of view. Invent details: where they live, what they hate, what they dream of.',
    'Rondas seguidas: Easy → Hard → Temática → Personajes → Minuto de sangre.': 'Back-to-back rounds: Easy → Hard → Topic → Characters → Blood minute.',
    'Simula una competencia real. Administra el aire: respira al final de cada 4 barras y no regales tiempos vacíos.': "It simulates a real competition. Manage your breath: breathe after every 4 bars and don't waste empty beats.",
    'Un minuto seguido sobre el beat, sin tema, sin personaje y sin palabras obligadas: tú decides qué decir.': 'One non-stop minute over the beat, no topic, no character, no required words: you decide what to say.',
    'No te detengas: si te quedas sin ideas, repite el último remate o describe lo que ves a tu alrededor.': "Don't stop: if you run out of ideas, repeat your last punchline or describe what you see.",
    'Un minuto a toda velocidad: una palabra nueva en cada compás y tú la metes en tu barra sin parar.': 'One minute at full speed: a new word every bar and you fit it in without stopping.',
    'Es práctica de velocidad: no busques la barra perfecta, busca no soltar el ritmo. Aquí no hay ataques: solo palabras.': "Speed practice: don't chase the perfect bar, just keep the rhythm. No attacks here: only words.",
    'Freestyle para sacar lo que sientes: eliges una emoción y el juego te da palabras e ideas de esa emoción. Más tiempo, sin puntaje y sin guardar nada.': 'Freestyle to let out what you feel: pick an emotion and the game gives you words and ideas. More time, no score, nothing saved.',
    'No hay buena ni mala barra. Respira, mira la palabra y di lo primero que sientes. Cuando quieras, pulsa Terminar.': 'There are no good or bad bars. Breathe, look at the word and say what you feel first. Press Finish whenever you want.',
    'Si lo que sientes pesa demasiado, no tienes que cargarlo solo: la Línea 113 del Minsa (opción 5, salud mental) atiende gratis las 24 horas en todo el Perú.': "If what you feel is too heavy, you don't have to carry it alone: in Peru, Minsa's Line 113 (option 5, mental health) is free, 24 hours a day.",
    'Palabras e ideas de tu barrio: la esquina, la bodega, el paradero… Cuenta tu lugar con tus propias barras.': 'Words and ideas from your neighborhood: the corner, the shop, the bus stop… Tell your place in your own bars.',
    'Usa detalles que solo tú conoces: un olor, un sonido, un nombre de calle.': 'Use details only you know: a smell, a sound, a street name.',
    'Palabras e ideas para contar tu camino: de dónde vienes, qué aprendiste y hacia dónde vas.': "Words and ideas to tell your path: where you come from, what you learned and where you're going.",
    'Una barra por recuerdo: empieza, nudo y remate.': 'One bar per memory: start, middle and punchline.',
    'Palabras e ideas de esfuerzo y cambio: metas, caídas, constancia y victorias.': 'Words and ideas about effort and change: goals, falls, persistence and wins.',
    'Cuenta algo concreto que lograste: los detalles hacen creíble la barra.': 'Tell something concrete you achieved: details make the bar believable.',
    'Palabras e ideas sobre querer y despedirse: promesas, distancia, recuerdos y cómo se sana.': 'Words and ideas about loving and saying goodbye: promises, distance, memories and healing.',
    'Habla desde lo que sentiste, sin señalar a nadie: suena más fuerte y más real.': "Speak from what you felt, without pointing at anyone: it sounds stronger and more real.",
    // Barra de versión nueva y graffiti
    'Hay una versión nueva de FlowLab.': 'A new FlowLab version is available.', 'Después': 'Later',
    '✏️ Lápiz': '✏️ Pencil', 'Lápiz': 'Pencil', '🗑 Borrar todo': '🗑 Clear all', 'Borrar todo': 'Clear all',
    'Dibuja donde quieras. La web está congelada hasta que salgas.': 'Draw anywhere. The page is frozen until you exit.',
    // Ayudas emergentes (title / aria-label / placeholder)
    'Estás grabando: toca para volver a la Cabina': 'You are recording: tap to go back to the Booth',
    'Dictar letra por voz (independiente de la grabación)': 'Dictate lyrics by voice (separate from recording)',
    'Limpiar todo el bloc': 'Clear the whole notepad', 'Nuevo tema': 'New song', 'Borrar tema actual': 'Delete current song',
    'Silenciar la base': 'Mute the track', 'Solo la base': 'Track only', 'Escuchar solo la base': 'Listen to the track only', 'Volumen de la base': 'Track volume',
    'Escuchar solo mi beat': 'Listen to my beat only', 'Solo mi beat': 'My beat only', 'Silenciar la voz': 'Mute the voice', 'Solo la voz': 'Voice only',
    'Escuchar solo la voz': 'Listen to the voice only', 'Volumen de la voz': 'Voice volume', 'Volumen voz': 'Voice volume',
    'Nivel del micrófono': 'Microphone level', 'Reproducir el beat': 'Play the beat', 'Transporte del beat': 'Beat transport',
    'Para parlantes de celular, que casi no reproducen graves': 'For phone speakers, which barely play bass',
    'Solo (escuchar solo esta fila)': 'Solo (listen to this row only)', 'Elegir la nota de cada paso': 'Pick the note of each step',
    'Golpea al ritmo de la base (mínimo 3 veces)': 'Tap to the rhythm of the track (at least 3 times)',
    'Detectar el BPM de tu base MP3/WAV': 'Detect the BPM of your MP3/WAV track',
    'El Coach (IA) te da 5 palabras, 3 imágenes y un arranque de verso': 'The AI Coach gives you 5 words, 3 images and a verse opener',
    'Cambia de vocal en cada consigna': 'Changes the vowel on every prompt',
    '🎤 Di tus rimas en voz alta (o escríbelas + Enter)…': '🎤 Say your rhymes out loud (or type them + Enter)…',
    'Récord de rondas verificadas': 'Best verified rounds', 'Récord de rondas de autoevaluación (sin verificar)': 'Best self-scored rounds (unverified)',
    'Elegir una base de FlowLab para el juego': 'Pick a FlowLab track for the game', 'Volumen del beat del juego': 'Game beat volume',
    'Pista para este reto': 'Hint for this challenge', 'Barras del 4x4': '4x4 bars', 'Enlaces del pie': 'Footer links',
    'Bloc de notas y modo entrenamiento': 'Notepad and training mode', 'Base: el beat de fondo': 'Base: the backing beat',
    // Segunda pasada
    'Saltar al contenido': 'Skip to content', 'Privacidad': 'Privacy',
    '🎵 Elegir un beat de FlowLab': '🎵 Choose a FlowLab beat', 'Beat de FlowLab · se carga como Pista 1, en bucle': 'FlowLab beat · loads as Track 1, looped',
    'Oscuro, con 808': 'Dark, with 808s', 'Dembow para perrear y fluir': 'Dembow grooves', 'Boom bap con swing': 'Swinging boom bap', 'Lo-fi y relajado': 'Laid-back lo-fi', 'Frío y rápido': 'Cold and fast',
    'Base activa:': 'Active track:', 'ninguna': 'none', 'Bloc de notas': 'Notepad', '✓ guardado': '✓ saved', 'Bloc de Notas · Editor Continuo': 'Notepad · continuous editor',
    'Mis Temas': 'My songs', '✎ Renombrar': '✎ Rename', 'Consonante': 'Perfect rhyme', 'Asonante': 'Vowel rhyme',
    'Escucharme en vivo': 'Hear myself live', '(Monitoreo)': '(Monitoring)', 'Nota:': 'Note:', 'Frec:': 'Freq:', 'Grado:': 'Degree:', 'GRABAR TOMA': 'RECORD TAKE', 'esperando…': 'waiting…',
    '🔊 Probar sonido': '🔊 Test sound', 'Presets de Estudio': 'Studio presets', 'Retune 95% · brillante': 'Retune 95% · bright', 'Retune 85% · presencia': 'Retune 85% · presence',
    'Cadena de procesamiento': 'Processing chain', '(Auto-Tune)': '(Auto-Tune)', 'Cambio de tono (Pitch shift, semitonos)': 'Pitch shift (semitones)', 'Escala': 'Scale',
    'Eco de sala (reverb)': 'Room echo (reverb)', '↺ Resetear Perillas': '↺ Reset knobs', '⌨ Atajos:': '⌨ Shortcuts:', 'Grabar/Detener': 'Record/Stop', 'Beat al inicio': 'Beat to start', 'Reproducir mezcla': 'Play mix',
    '■ Parar': '■ Stop', '↓ Exportar Mezcla Final (.WAV)': '↓ Export final mix (.WAV)', 'PISTA 1 · BASE': 'TRACK 1 · BEAT',
    'Velocidad (BPM)': 'Speed (BPM)', 'Kit de sonidos': 'Sound kit', 'Pasos (16 o 32)': 'Steps (16 or 32)', '🧹 Limpiar': '🧹 Clear', '▶ Escuchar kit': '▶ Listen to kit', '(realza graves)': '(boosts bass)',
    'Vinilo': 'Vinyl', 'Filtro': 'Filter', '+ Platillo': '+ Cymbal', '⬇ Descargar mi beat (.WAV)': '⬇ Download my beat (.WAV)', 'MI BEAT': 'MY BEAT',
    '🎮 Juegos': '🎮 Games', '📈 Mi progreso': '📈 My progress', 'Dificultad': 'Difficulty', 'Medio': 'Medium', 'Vocal forzada': 'Forced vowel', 'Ver siguiente': 'Show next', '■ Terminar': '■ Finish',
    'MUY CORTO': 'TOO SHORT', '· Tiempo': '· Time', '· Consignas': '· Prompts', '· Medio': '· Medium', '· Difícil': '· Hard', '🔀 Otro beat': '🔀 Another beat',
    'Rango': 'Rank', 'XP total': 'Total XP', 'Sesiones': 'Sessions', 'Minutos': 'Minutes', 'Racha': 'Streak', 'Mejor racha': 'Best streak', 'Mejores puntajes': 'Best scores',
    'Historial': 'History', '⬇ Exportar': '⬇ Export', '⬆ Importar': '⬆ Import', 'Reiniciar': 'Reset'
  };
  const ayudas = s => window.AyudasEN && AyudasEN.titulos[s] && AyudasEN.titulos[s][0];   // títulos de las burbujas "?"
  const de = s => D[s] !== undefined ? D[s] : (ayudas(s) || s);
  const trozos = s => s.split(' · ').map(de).join(' · ');
  const P = [
    [/^Beat nuevo: (.+) · (\d+) BPM\. Pulsa Sorpréndeme otra vez para uno distinto\.$/, (m, k, b) => 'New beat: ' + k + ' · ' + b + ' BPM. Press Surprise me again for a different one.'],
    [/^(.+) · (.+) · (\d+) secciones · (\d+) BPM$/, (m, k, ins, n, b) => k + ' · ' + ins.split(', ').map(de).join(', ') + ' · ' + n + ' sections · ' + b + ' BPM'],
    [/^((?:Kit · )?(?:Trap|Bounce|Soul . Vintage) · .+)$/, (m, a) => trozos(a)],
    [/^(Silenciar capa|Quitar capa|Silenciar|Quitar|Sample de|Volumen de|Elegir notas de) (.+)$/, (m, v, a) => ({ 'Silenciar capa': 'Mute layer', 'Quitar capa': 'Remove layer', 'Silenciar': 'Mute', 'Quitar': 'Remove', 'Sample de': 'Sample for', 'Volumen de': 'Volume of', 'Elegir notas de': 'Pick notes for' }[v]) + ' ' + de(a)],
    [/^(.+), tecla (\w)$/, (m, a, k) => de(a) + ', key ' + k],
    [/^(\d+) compases$/, (m, n) => n + ' bars'],
    [/^Solo (.+)$/, (m, a) => 'Solo ' + de(a)],
    [/^(Bass|Strings|Rhodes|Sample|Piano|Guitar|Marimba|Brass|Flute) step (\d+): (.+), note La$/, (m, i, n, r) => i + ' step ' + n + ': ' + r + ', note A'],
   // textos con partes variables
    [/^(.+) · (Fácil|Medio|Difícil)$/, (m, a, n) => a + ' · ' + de(n)],
    [/^([^\p{L}\p{N}]+) (\p{L}.*)$/u, (m, i, a) => i + ' ' + de(a)],   // ícono o raya delante: "🏆 Modo Batalla", "— descripción"
    [/^Ayuda: ronda (.+)$/, (m, a) => 'Help: round ' + de(a)],
    [/^Ayuda: (.+)$/, (m, a) => 'Help: ' + de(a)],
    [/^Reggaetón · (.+)$/, (m, a) => 'Reggaeton · ' + a],
    [/^Beat: (.+) · Reggaetón · (\d+) BPM \(suena a (\d+)\)$/, (m, n, b, s) => 'Beat: ' + n + ' · Reggaeton · ' + b + ' BPM (playing at ' + s + ')'],
    [/^Beat: (.+) \(suena a (\d+)\)$/, (m, n, s) => 'Beat: ' + n + ' (playing at ' + s + ')'],
    [/^(\d+) \/ (\d+) XP para (.+)$/, (m, a, b, r) => a + ' / ' + b + ' XP to ' + de(r)],
    [/^Nv (\d+)(.*)$/, (m, n, r) => 'Lv ' + n + r],
    [/^(\d+) días?$/, (m, n) => n + (n === '1' ? ' day' : ' days')],
    [/^Composición · (.+)$/, (m, duration) => 'Arrangement · ' + duration],
    [/^Pieza completa · (\d+) secciones · (\d+) BPM$/, (m, sections, bpm) => 'Full piece · ' + sections + ' sections · ' + bpm + ' BPM'],
    [/^Editando (.+) · (.+)–(.+) · los cambios afectan solo este fragmento\.$/, (m, section, start, end) => 'Editing ' + de(section) + ' · ' + start + '–' + end + ' · changes affect this segment only.'],
    [/^Editar (.+), (.+) a (.+)$/, (m, section, start, end) => 'Edit ' + de(section) + ', ' + start + ' to ' + end],
    [/^Añadidos (.+) de una variación nueva\.$/, (m, duration) => 'Added ' + duration + ' of a new variation.'],
    [/^● grabando(.*)$/, (m, r) => '● recording' + r.replace('modo de respaldo activo', 'backup mode on')],
    [/^Solo (Bombo|Caja|Hi-hat open|Hi-hat|Bajo|Sample|Palmas|Textura)$/, (m, a) => 'Solo ' + de(a)],
    [/^Añadir capa (.+)$/, (m, a) => 'Add layer ' + de(a)],
    [/^(.+) paso (\d+): (.+)$/, (m, i, n, r) => de(i) + ' step ' + n + ': ' + r.replace('encendido', 'on').replace('apagado', 'off').replace('golpe fuerte', 'hard hit').replace('golpe media', 'medium hit').replace('golpe medio', 'medium hit').replace('golpe suave', 'soft hit').replace('nota La', 'note A').replace('nota ', 'note ')]
  ];
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const NO = 'textarea,script,style,[contenteditable="true"],#stimWord,#langSel';
  const norm = s => s.replace(/\s+/g, ' ').trim();
  function tr(s) {
    const k = norm(s); if (!k) return null;
    if (D[k] !== undefined) return D[k] === k ? null : D[k];
    for (const [r, f] of P) if (r.test(k)) { const v = k.replace(r, f); return v === k ? null : v; }
    return null;
  }

  const hechos = new Map(), attrs = new Map();   // para volver al español
  let activo = false, obs = null;
  function texto(n) {
    const p = n.parentElement; if (!p || p.closest(NO)) return;
    const raw = n.nodeValue, v = tr(raw); if (v === null) return;
    const en = raw.match(/^\s*/)[0] + v + raw.match(/\s*$/)[0];
    hechos.set(n, { es: raw, en }); n.nodeValue = en;
  }
  function atributos(e) {
    ATTRS.forEach(a => {
      const raw = e.getAttribute(a); if (!raw) return;
      const v = tr(raw); if (v === null) return;
      const g = attrs.get(e) || {}; g[a] = { es: raw, en: v }; attrs.set(e, g); e.setAttribute(a, v);
    });
  }
  function recorre(raiz) {
    if (raiz.nodeType === 3) { texto(raiz); return; }
    if (raiz.nodeType !== 1) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), lista = []; let n; while ((n = w.nextNode())) lista.push(n);
    lista.forEach(texto);
    atributos(raiz); raiz.querySelectorAll('[placeholder],[title],[aria-label]').forEach(atributos);
  }
  function enciende() {
    if (activo) return; activo = true;
    recorre(document.body);
    obs = new MutationObserver(ms => ms.forEach(m => {
      if (m.type === 'childList') m.addedNodes.forEach(recorre);
      else if (m.type === 'characterData') texto(m.target);
      else atributos(m.target);
    }));
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function apaga() {
    if (!activo) return; activo = false; if (obs) obs.disconnect(); obs = null;
    hechos.forEach((v, n) => { if (n.nodeValue === v.en) n.nodeValue = v.es; }); hechos.clear();
    attrs.forEach((g, e) => Object.entries(g).forEach(([a, v]) => { if (e.getAttribute(a) === v.en) e.setAttribute(a, v.es); })); attrs.clear();
  }
  const mira = () => (/^en/i.test(document.documentElement.lang || '') ? enciende() : apaga());
  new MutationObserver(mira).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  // se espera a que carguen los demás diccionarios
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mira); else setTimeout(mira, 0);
})();

'use strict';
/* =====================================================================
   FlowLab Studio · help.js
   Botones "?" de ayuda: un círculo pequeño junto a cada opción que, al
   tocarlo, muestra una explicación corta en palabras simples.
   Para añadir una ayuda nueva: agrega una fila [selector CSS, título, texto].
   ===================================================================== */
(function () {
  const HELP = [
    // ---- Cabecera y modos ----
    ['#modeName', 'Modos', 'FlowLab tiene tres modos (las pestañas de arriba): Cabina para escribir, grabar y mezclar; Beats para armar tu propio ritmo con pads y secuenciador; y Escuela para entrenar freestyle con juegos.'],
    // ---- Base: las tres formas de poner el beat ----
    ['#bc-yt .bc-head b', 'Pegar link de YouTube', 'Pega el link de un beat de YouTube y pulsa Cargar. Sirve para ensayar. Para exportar tu canción completa necesitas una base MP3/WAV.'],
    ['#bc-file .dz-title', 'Subir mi MP3 / WAV', 'Elige o arrastra un archivo MP3/WAV. Se queda en tu navegador, no se sube a internet. Con una base propia puedes exportar tu canción completa.'],
    ['#beatQuick .bc-head b', 'Armar beat rápido', 'Te lleva al modo Beats para crear tu propio ritmo con pads, sin buscar música en ningún lado.'],
    ['#panel-beat .base-info .hint', 'Base activa', 'La base es la música de fondo (el "beat") sobre la que grabas y entrenas. Arriba ves cuál está lista ahora: YouTube, tu archivo o, pronto, un beat hecho aquí.'],
    // ---- Beats ----
    ['#btGenresTitle', 'Bases completas', 'Elige un género, escucha una base y pulsa "Rapear con esta": queda en la Cabina para grabar tu voz encima. Abajo puedes armar tu propio patrón con los pads; "Sorpréndeme" inventa uno.'],
    ['#btPadsTitle', 'Pads', 'Cada pad es un instrumento. Tócalos con el mouse, con el dedo o con las teclas Q W E R / A S D F para probar sonidos y sentir el ritmo.'],
    ['#btTempoLbl', 'Tempo', 'La velocidad del beat en golpes por minuto (BPM). Boom bap ≈ 85-95, trap ≈ 130-160. Usa − y + o escribe el número (60 a 180).'],
    ['label[for=btSwing]', 'Swing', 'Hace que los pasos pares lleguen un poquito tarde, como un baterista humano. 0% = recto como una máquina; 50% o más = balanceo marcado.'],
    ['label[for=btKit]', 'Kit de sonidos', 'Cambia la personalidad de todos los instrumentos: Dusty drums (lo-fi polvoriento), Boom bap (seco y crujiente), Trap (808 largo), Drill (808 oscuro), Dembow (reggaetón) o Lo-fi/Soul (suave y cálido). Debajo se lee cómo suena y "Escuchar kit" toca una demo de 2 compases sin tocar tu patrón.'],
    ['label.bt-cel .sw-label', 'Modo celular', 'El parlante de un celular casi no reproduce graves (por debajo de unos 200 Hz). Este modo añade armónicos del bombo y del bajo que sí se oyen, para que "pegue" más. Solo cambia lo que oyes en vivo: al descargar o exportar, el beat sale sin ese realce. En el celular viene encendido.'],
    ['#btLenLbl', 'Pasos', '16 pasos = 1 compás dividido en dieciseisavos. 32 pasos = 2 compases, para variar el patrón a la mitad. Al pasar a 32, el segundo compás copia el primero.'],
    ['#btFxTitle', 'Dale sabor', 'Vinilo: ruido de disco viejo. Filtro: cierra los agudos (más % = más apagado). Saturación: suciedad y fuerza. Todo se oye en vivo.'],
    ['#btSeqTitle', 'Secuenciador', 'Cada fila es un instrumento y cada cuadro es un tiempo del compás. Toca para encender o apagar. Mantén pulsado o clic derecho para cambiar la fuerza. M = silenciar, S = solo, ✕ = quitar la fila.'],
    ['#btTrackTitle', 'Tu pista', 'Tu beat visto en el tiempo: arriba la onda, debajo una capa por instrumento. Quita o silencia capas, o añade otra con los botones +. Usar en la cabina lo deja como base (en bucle) para grabar encima; Descargar crea un archivo WAV sin cortes.'],
    ['label[for=btBars]', 'Largo del beat', 'Cuántos compases dura el beat al usarlo en la cabina o descargarlo. 8 compases es lo normal para una estrofa; el beat se repite en bucle sin saltos.'],
    ['#btMineTitle', 'Mis beats', 'Tus beats guardados en este navegador (no se suben a internet). Puedes cargarlos, duplicarlos, renombrarlos o borrarlos.'],
    // ---- Escuela ----
    ['#school .school-head h3', 'Escuela de Freestyle', 'Juegos para entrenar freestyle de básico a batalla. Ganas XP (puntos de experiencia), subes de rango y desbloqueas juegos nuevos.'],
    ['#beatPickT', 'Elige tu beat', 'La música sobre la que juegas: un beat de FlowLab (cambia en cada partida), el link de YouTube o tu MP3/WAV que subiste arriba. Practicar sobre un beat te enseña a rapear en el tiempo.'],
    ['#school details > summary', 'Más opciones', 'Ajustes extra: cuánto dura la ronda, cada cuántos compases cambia la consigna, el volumen del beat y el metrónomo. Si dudas, déjalo en Auto.'],
    ['#school .beat-pick', 'Base', 'Elige una base concreta de FlowLab para tu partida, o déjala en Aleatoria para que cambie cada vez. La base se ajusta a tu BPM.'],
    ['#school .rank-chip', 'Rango, XP y racha', 'Tu rango actual, tus puntos de experiencia y 🔥 tu racha: cuántos días seguidos llevas practicando.'],
    ['#mission', 'Reto del día', 'Cada día toca un juego y una dificultad distintos. Si lo completas ganas +50 XP extra. "Preparar" lo deja listo para jugar.'],
    ['#school label[for=bpmInput]', 'BPM', 'Golpes por minuto: qué tan rápida es la base (boom bap ≈ 85-95, trap ≈ 140). TAP: toca al ritmo de la música 3 veces o más. ½ y ×2: mitad o doble. 🔍 Base: lo calcula solo de tu MP3.'],
    ['#school label[for=diffSel]', 'Dificultad', 'Fácil: palabras simples y cambios lentos. Difícil: palabras abstractas y cambios rápidos. Más difícil = más XP.'],
    ['#school label[for=everySel]', 'Cambio cada', 'Cada cuántos compases cambia la consigna. 1 compás = 4 golpes = 1 barra. "Auto" usa lo recomendado para cada juego.'],
    ['#school label[for=durSel]', 'Duración', 'Cuánto dura la ronda. "Libre" sigue hasta que pulses Terminar.'],
    ['#school label[for=gameBeat]', 'Beat del juego', 'La partida suena sobre un ritmo de FlowLab que se ajusta a tu BPM. "Aleatorio" cambia de ritmo en cada partida; también puedes elegir un género o dejar solo el metrónomo.'],
    ['#vowelPicker > .lbl', 'Vocal forzada', 'La vocal de tus rimas. Cada barra te da una palabra con esa vocal y las 4 del bloque riman entre sí. 🎲 cambia la vocal en cada bloque.'],
    ['#school .cfg-checks label:nth-child(1)', 'Metrónomo', 'Un "tic" en cada golpe para no perder el ritmo. El primero de cada compás suena más agudo.'],
    ['#school .cfg-checks label:nth-child(2)', 'Arrancar con la base', 'Al pulsar Empezar, la base suena desde el inicio junto con el juego.'],
    ['#school .cfg-checks label:nth-child(3)', 'Ver siguiente', 'Te muestra lo que viene antes de que llegue, para ir preparando la rima. En Univocal y Cadena deja ver las 4 palabras del bloque.'],
    ['#school .cfg-voice label', 'Verificar con mi voz', 'El navegador escucha lo que rapeas y revisa si cumpliste cada consigna. Mejor con audífonos. Está en prueba (beta).'],
    ['#school .gym-meta', 'Compás y tiempo', 'Un compás tiene 4 tiempos (golpes) y equivale a una barra de tu letra. Un "4x4" son 4 barras que riman: las casillas de arriba te dicen en cuál vas.'],
    ['#school [data-pane=progress] .sub-h:nth-of-type(1)', 'Minutos por día', 'Cuántos minutos practicaste cada uno de los últimos 14 días. La constancia es lo que más te hace mejorar.'],
    ['#school .progress-actions .chk', 'Desbloquear todo', 'Abre todos los juegos sin esperar a ganar XP. Ideal si ya rapeas y quieres ir directo a lo difícil.'],
    // ---- Cabina: bloc de notas y entrenamiento ----
    ['#panel-lyrics .lyrics-head .stats', 'Sílabas', 'Una sílaba es cada golpe de voz de una palabra: ca-mi-no = 3. Si tus barras tienen sílabas parecidas, suenan parejas (eso es la métrica).'],
    ['#panel-lyrics .themes-block h3', 'Mis temas', 'Guarda cada canción por separado.'],
    ['#panel-lyrics .block:has(.editor-wrap) > h3', 'Bloc de notas', 'Escribe tu letra. A la izquierda ves el número de línea y sus sílabas. Se guarda solo. "Dictar letra": hablas y el texto aparece aquí (no afecta la grabación).'],
    ['#panel-lyrics .rhyme-type label:nth-child(1)', 'Rima consonante', 'Suenan igual desde la vocal fuerte hasta el final: corazón / canción (-ón). Es la rima más "perfecta".'],
    ['#panel-lyrics .rhyme-type label:nth-child(2)', 'Rima asonante', 'Solo coinciden las vocales desde la vocal fuerte: corazón / amor (o). Da más libertad para elegir palabras.'],
    ['#panel-lyrics .rhyme-info', 'Terminación', 'El sonido final de la última palabra de tu línea: con eso se buscan las rimas. Clic en una rima para ponerla al final de la línea.'],
    ['#stim .stim-label', 'Modo entrenamiento', 'Te muestra una palabra, un tema o una frase al azar para que improvises: míralo, no lo pienses tanto y conviértelo en una barra. "Nueva palabra" cambia el estímulo y el menú de arriba elige el tipo.'],
    ['#stim .stim-pairs', 'Rimas del estímulo', 'Palabras que riman con el estímulo, para ayudarte a cerrar la barra.'],
    // ---- Cabina: entrada de voz ----
    ['#panel-vocal .panel-head .eyebrow', 'Entrada de voz', 'Aquí grabas tu voz con los efectos. Pulsa REC (o Alt+R) para empezar y Detener para terminar. Cada toma se guarda aparte en el historial; nunca se borra la anterior.'],
    ['#panel-vocal .mic-name', 'Micrófono', 'FlowLab usa el micrófono predeterminado de tu equipo. Para usar otro, elígelo como predeterminado en la configuración de sonido de tu sistema.'],
    ['#panel-vocal .panel-head .sw-label', 'Escucharme en vivo', 'Te escuchas en los audífonos mientras cantas, ya con efectos. Usa audífonos: con parlantes se produce un pitido (acople).'],
    ['#panel-vocal .pitch-read', 'Nota, frecuencia y grado', 'Nota: la que estás cantando. Frec: sus vibraciones por segundo (Hz). Grado: qué lugar ocupa esa nota dentro de la escala elegida.'],
    ['#panel-vocal .rec-time', 'Cronómetro', 'Cuánto tiempo llevas grabando en esta toma.'],
    // ---- Cabina: efectos de voz ----
    ['#panel-fx .block:first-of-type > h3', 'Presets', 'Combinaciones listas de efectos inspiradas en estilos conocidos. Un clic y se ajustan todas las perillas.'],
    ['#panel-fx .chain', 'Cadena de procesamiento', 'El camino de tu voz: quita graves molestos, da brillo, afina, añade chorus, empareja el volumen y evita que se sature.'],
    ['#panel-fx label:has(#tuneOn) .sw-label', 'Auto-Tune', 'Lleva tu voz a la nota correcta más cercana de la escala. Apagado = tu voz natural.'],
    ['#panel-fx label:has(#valTune)', 'Velocidad de afinación', 'Qué tan rápido corrige: bajo = natural, alto = efecto robótico típico del trap.'],
    ['#panel-fx label:has(#valShift)', 'Pitch shift', 'Sube o baja tu voz en semitonos. +12 = una octava más aguda; −12 = una octava más grave.'],
    ['#panel-fx label:has(+ #scaleSel)', 'Escala', 'Las notas permitidas para el Auto-Tune. Debe coincidir con la tonalidad de la base para sonar bien.'],
    ['#panel-fx label:has(#valMicGain)', 'Ganancia', 'Volumen de entrada del micrófono. Si la onda del visualizador toca los bordes, bájalo.'],
    ['#panel-fx label:has(#valRev)', 'Reverb', 'Eco de sala que da profundidad. Poco = voz cercana; mucho = voz lejana, como en un salón grande.'],
    ['#panel-fx label:has(#valCmp)', 'Compresión', 'Empareja el volumen: sube lo suave y controla los gritos. La voz queda más pareja, "de radio".'],
    ['#panel-fx label:has(#valMon)', 'Volumen de monitoreo', 'Con cuánto volumen te escuchas en vivo. No cambia la grabación.'],
    ['#panel-takes .panel-head .eyebrow', 'Historial', 'Tus grabaciones. Cada una tiene su propio delay (eco), que no se graba: solo se aplica al escuchar o exportar.'],
    // ---- Cabina: línea de tiempo ----
    ['#panel-timeline .panel-head .eyebrow', 'Línea de tiempo', 'Une la base y tu voz como en un programa de música. Clic en la regla o en las pistas para mover la aguja roja.'],
    ['#panel-timeline .tl-head:nth-of-type(2) .tl-name', 'Pista de la base', 'Volumen de la base. M = silenciarla (mute). S = solo: escuchas únicamente esta pista.'],
    ['#panel-timeline .tl-head:nth-of-type(3) .tl-name', 'Mi beat', 'El patrón que armaste en el secuenciador, repetido en bucle. Se toma tal como está al pulsar Reproducir. M = silenciar, S = solo.'],
    ['#panel-timeline .tl-head:nth-of-type(4) .tl-name', 'Pista de la voz', 'Volumen de tu toma activa. M = silenciarla (mute). S = solo.'],
    ['#tlEditTitle', 'Editar mi archivo', 'Cambios sencillos sobre tu MP3/WAV (el original no se toca): Desplazar lo mueve hasta 300 ms para cuadrarlo, Inicio y Fin recortan, Repetir lo pone en bucle. También puedes arrastrar las pestañas de los bordes de la onda.'],
    ['#panel-timeline .tl-sync .lbl', 'Sincronizar voz', 'Si tu voz suena adelantada o atrasada respecto a la base, muévela aquí en milisegundos (1000 ms = 1 segundo).'],
    ['#panel-timeline .tl-time', 'Mezcla y exportar', 'Reproducir: escuchas base + voz juntas. Exportar: crea un archivo WAV con tu canción completa (necesita base MP3/WAV).']
  ];
  // Ayudas para elementos creados dinámicamente (tarjetas de tomas), usadas con data-help="clave"
  const KEYED = {
    delayMs: ['Tiempo de delay', 'Cada cuánto se repite el eco, en milisegundos. 250 ms es un eco clásico de rap.'],
    delayMix: ['Mezcla de delay', 'Qué tan fuerte suena el eco. 0% = sin eco.'],
    takeActive: ['Toma activa', 'Coloca esta grabación en la pista de voz de la línea de tiempo.']
  };

  // Un ejemplo corto para cada ayuda (qué es + para qué sirve está en el texto; aquí va el "por ejemplo"). Se muestra en una línea aparte.
  const EJEMPLO = {
    'Modos': 'Graba tu voz en Cabina, arma el beat en Beats y practica rimas en Escuela.',
    'Pegar link de YouTube': 'Pega youtu.be/… de un beat de boom bap y pulsa Cargar.',
    'Subir mi MP3 / WAV': 'Un beat que compraste, como "trap_140.mp3".',
    'Armar beat rápido': 'No tienes beat: pulsa aquí, elige Trap y úsalo en la Cabina.',
    'Base activa': '"Base activa: Beat propio · Medianoche · Trap · 140 BPM".',
    'Bases completas': 'Trap → "Sombra Nocturna" → "Rapear con esta".',
    'Pads': 'Toca la tecla Q para oír el primer instrumento y W para el segundo.',
    'Tempo': '90 para un boom bap tranquilo, 140 para un trap.',
    'Swing': '0% suena a máquina; 58% suena a boom bap de los 90.',
    'Kit de sonidos': 'Cambia de Trap a Lo-fi y escucha cómo el mismo patrón suena distinto.',
    'Modo celular': 'Si oyes el beat "flaco" por el parlante del celular, enciéndelo.',
    'Pasos': 'Con 16 haces un patrón de un compás; con 32, uno de dos compases.',
    'Dale sabor': 'Sube Vinilo a 30% para un toque de disco viejo.',
    'Secuenciador': 'Enciende los cuadros 1, 5, 9 y 13 de la fila del bombo: bombo en cada tiempo.',
    'Tu pista': 'Pulsa "Usar en la cabina" y graba tu voz encima en bucle.',
    'Largo del beat': '8 compases a 90 BPM duran unos 21 segundos.',
    'Mis beats': 'Guarda "Medianoche v2" y vuelve a cargarlo mañana.',
    'Escuela de Freestyle': 'Empieza por Univocal en fácil durante 2 minutos.',
    'Rango, XP y racha': 'Practicar 3 días seguidos = racha de 3 🔥.',
    'Reto del día': 'Hoy toca "Palabra Bomba · Fácil": +50 XP si lo completas con tu voz.',
    'BPM': 'Si un beat suena a 95 BPM, escribe 95 o toca TAP 4 veces al ritmo.',
    'Dificultad': 'Fácil: "casa, plata". Difícil: palabras más raras y cambios más rápidos.',
    'Cambio cada': '"2 compases" = una palabra nueva cada 8 golpes.',
    'Duración': '"2 min" = una ronda corta para calentar.',
    'Beat del juego': '"Aleatorio": una partida suena a dembow y la siguiente a drill.',
    'Vocal forzada': 'Con la A: casa, fama, plata, nada.',
    'Metrónomo': 'Sin beat del juego, suena "tic, tic, tic" cada golpe.',
    'Arrancar con la base': 'Cargas tu MP3 y pulsas Empezar: la base y el juego arrancan juntos.',
    'Ver siguiente': 'Abajo ves "siguiente: ventana" antes de que cambie la palabra.',
    'Verificar con mi voz': 'Dices "casa" y el juego marca ✓ la palabra casa.',
    'Compás y tiempo': 'Compás 3, tiempo 2 = vas por la tercera barra, segundo golpe.',
    'Minutos por día': 'Barras altas = días que practicaste mucho.',
    'Desbloquear todo': 'Actívalo para probar Modo Batalla desde el primer día.',
    'Sílabas': '"ca-mi-no" tiene 3; "ca-mi-nan-do" tiene 4.',
    'Mis temas': 'Un tema para "Mi barrio" y otro para "Amor".',
    'Bloc de notas': 'Escribe una barra y mira a la izquierda cuántas sílabas tiene.',
    'Rima consonante': 'corazón / canción (-ón).',
    'Rima asonante': 'corazón / amor (o).',
    'Terminación': 'La línea termina en "canción": se buscan palabras en -ón.',
    'Modo entrenamiento': 'Sale "espejo": haz una barra que termine en esa palabra.',
    'Rimas del estímulo': 'Para "casa": plata, nada, fama.',
    'Entrada de voz': 'Pulsa REC, rapea 16 compases y pulsa otra vez.',
    'Micrófono': 'Si usas un micrófono USB, ponlo como predeterminado en Windows.',
    'Escucharme en vivo': 'Con audífonos puestos, te oyes con eco mientras rapeas.',
    'Nota, frecuencia y grado': 'Cantas La: Nota A4, Frec 440 Hz, Grado I (en La menor).',
    'Cronómetro': '00:25 = llevas 25 segundos de toma.',
    'Presets': '"Trap Tune" para un efecto robótico fuerte.',
    'Cadena de procesamiento': 'Tu voz pasa por filtro, afinación, chorus, compresor y limitador, en ese orden.',
    'Auto-Tune': 'Enciéndelo y elige la escala de tu beat.',
    'Velocidad de afinación': '10% natural; 95% robótico tipo trap.',
    'Pitch shift': '+2 sube la voz dos semitonos (un tono entero).',
    'Escala': 'Si tu beat está en La menor, elige "La Menor (A minor)".',
    'Ganancia': 'Si la onda toca los bordes, baja de 100% a 80%.',
    'Reverb': '20% para voz cercana; 60% para un salón grande.',
    'Compresión': '55% deja la voz pareja sin aplastarla.',
    'Volumen de monitoreo': 'Si te oyes muy fuerte en los audífonos, bájalo; la grabación no cambia.',
    'Historial': 'Cada toma tiene su eco; la toma 3 puede tener más eco que la 2.',
    'Línea de tiempo': 'Haz clic en el segundo 10 para ensayar desde ahí.',
    'Pista de la base': 'Pon M en la base para oír solo tu voz.',
    'Mi beat': 'Tu patrón sale en una pista aparte para bajarlo o silenciarlo.',
    'Pista de la voz': 'Sube el volumen si tu voz queda tapada por el beat.',
    'Editar mi archivo': 'Recorta los primeros 4 segundos de silencio de tu MP3.',
    'Sincronizar voz': 'Si tu voz va tarde, muévela −40 ms.',
    'Mezcla y exportar': 'Pulsa Exportar y recibes "flowlab_mezcla_….wav".'
  };
  const pop = document.createElement('div');
  pop.id = 'helpPop'; pop.className = 'help-pop'; pop.setAttribute('role', 'tooltip'); pop.hidden = true;
  document.body.appendChild(pop);
  let openBtn = null;

  function makeBtn(title) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'help-q'; b.textContent = '?';
    b.setAttribute('aria-label', 'Ayuda: ' + title);
    return b;
  }
  function inject() {
    HELP.forEach(([sel, title], i) => {
      let nodes; try { nodes = document.querySelectorAll(sel); } catch (e) { return; } // :has() no soportado → se omite
      nodes.forEach(n => {
        if (n.querySelector(':scope > .help-q')) return;
        const b = makeBtn(title); b.dataset.helpIdx = i; n.appendChild(b);
      });
    });
  }
  function show(btn) {
    if (openBtn === btn && !pop.hidden) { hide(); return; }
    let t, d, extra = null, ejExtra = '';
    if (btn.dataset.helpIdx != null) [, t, d] = HELP[+btn.dataset.helpIdx];
    else if (KEYED[btn.dataset.help]) [t, d] = KEYED[btn.dataset.help];
    else if (window.School && School.ayuda && (extra = School.ayuda(btn.dataset.help))) [t, d, ejExtra] = extra;   // ayudas de los juegos y de las rondas de batalla
    else return;
    pop.innerHTML = '<b></b><span></span><em></em>';
    let ej = EJEMPLO[t] || ejExtra, pre = 'Ejemplo: ';
    const E = window.AyudasEN && AyudasEN.activo() ? AyudasEN : null;   // inglés: por clave (juegos, rondas, tomas) o por título
    const en = (E && (E.claves[btn.dataset.help] || E.titulos[t])) || (window.I18n && I18n.ayuda(t));
    if (en) { t = en[0]; d = en[1]; ej = en[2]; pre = 'Example: '; }
    pop.children[0].textContent = t; pop.children[1].textContent = d;
    pop.children[2].textContent = ej ? pre + ej : ''; pop.children[2].hidden = !ej;
    // En pantalla completa el globo debe vivir dentro del elemento a pantalla completa
    (document.fullscreenElement || document.body).appendChild(pop);
    pop.hidden = false;
    const r = btn.getBoundingClientRect(), w = Math.min(270, window.innerWidth - 16);
    pop.style.width = w + 'px';
    const fs = !!document.fullscreenElement;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    let top = r.bottom + 8;
    pop.style.position = fs ? 'fixed' : 'absolute';
    if (top + pop.offsetHeight > window.innerHeight - 8) top = r.top - pop.offsetHeight - 8;
    pop.style.left = (left + (fs ? 0 : window.scrollX)) + 'px';
    pop.style.top = (Math.max(8, top) + (fs ? 0 : window.scrollY)) + 'px';
    openBtn = btn;
  }
  function hide() { pop.hidden = true; openBtn = null; }

  // Fase de captura: el clic en "?" no activa la casilla, la tarjeta o el botón que lo contiene
  document.addEventListener('click', e => {
    const b = e.target.closest('.help-q');
    if (b) { e.preventDefault(); e.stopPropagation(); show(b); return; }
    if (!e.target.closest('#helpPop')) hide();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { hide(); e.stopPropagation(); } }, true);
  window.addEventListener('resize', hide);

  inject();
  // Al cambiar de idioma se reescriben algunos textos y se llevan su "?": se vuelven a poner
  window.addEventListener('flowlab:lang', () => { hide(); setTimeout(inject, 0); });
  // Algunas zonas se redibujan (reto del día, progreso): se vuelven a poner sus "?" si faltan
  let t = null;
  const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(inject, 80); });
  ['#mission', '#school [data-pane=progress]'].forEach(sel => { const n = document.querySelector(sel); if (n) mo.observe(n, { childList: true }); });
  // vacias(): ayudas cuyo elemento ya no existe en la página (el chequeo automático exige que no haya ninguna)
  const vacias = () => HELP.filter(([sel]) => { try { return !document.querySelector(sel); } catch (e) { return false; } }).map(r => r[1]);
  window.Help = { refresh: inject, vacias };
})();

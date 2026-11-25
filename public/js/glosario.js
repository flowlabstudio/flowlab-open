'use strict';
/* =====================================================================
   FlowLab Studio · glosario.js  (Mejoras 7 · E)
   "Glosario / Ayuda": un panel con buscador que explica en palabras simples
   los términos de la app, cada uno con un ejemplo. Se abre desde la cabecera
   (botón #btnGlosario). Todo el texto se pone con textContent.
   Para añadir un término: nueva fila [término, también se busca como, explicación, ejemplo].
   ===================================================================== */
(function () {
  const TERMINOS = [
    ['Base', 'beat instrumental música de fondo', 'La música de fondo sobre la que grabas o practicas. Puede ser un link de YouTube, tu MP3/WAV o un beat hecho en FlowLab.', 'Pegas el link de un beat de boom bap y rapeas encima.'],
    ['Beat', 'ritmo instrumental', 'El ritmo y la música sin voz. En FlowLab lo armas con pads y un secuenciador, o eliges uno de los 25 ritmos listos.', 'El beat "Medianoche" es un trap a 140 BPM.'],
    ['BPM', 'tempo velocidad golpes por minuto', 'Golpes por minuto: la velocidad del beat. Más BPM = más rápido.', 'Boom bap ≈ 90 BPM, trap ≈ 140 BPM.'],
    ['TAP', 'tap tempo calcular bpm tocar', 'Un botón que calcula el BPM mientras tocas al ritmo de la música. Con 4 toques ya da un número; sigue tocando para afinarlo.', 'Escuchas un beat, tocas TAP 6 veces y el botón muestra "TAP · 94 BPM ✓".'],
    ['Compás', 'compases', 'Un grupo de 4 tiempos (golpes). En el freestyle, un compás suele ser una barra de tu letra.', '8 compases son 32 golpes: una estrofa corta.'],
    ['Tiempo', 'golpe pulso', 'Cada golpe del compás (1, 2, 3, 4).', 'En un compás cuentas: uno, dos, tres, cuatro.'],
    ['Barra', 'verso línea rima', 'Una línea de tu letra que cabe en un compás.', 'Cuatro barras seguidas que riman forman un 4x4.'],
    ['4x4', 'cuatro por cuatro', 'Un bloque de 4 barras de 4 tiempos. En Univocal y Cadena 4x4, las 4 palabras del bloque riman entre sí.', 'casa, plata, nada, fama (una palabra por barra).'],
    ['Swing', 'balanceo groove', 'Hace que los pasos pares lleguen un poquito tarde, como un baterista humano. 0% = recto como una máquina.', 'Boom bap clásico: swing entre 54% y 62%.'],
    ['Kit', 'kit de sonidos batería', 'Un juego de sonidos de batería y bajo (bombo, caja, hi-hat, bajo) que cambia la personalidad del beat.', 'El kit Trap tiene un 808 largo; el Lo-fi suena suave y cálido.'],
    ['Pad', 'pads', 'Un botón que suena al tocarlo, como en una máquina de ritmos.', 'Toca Q, W, E, R / A, S, D, F para tocar los 8 pads.'],
    ['Secuenciador', 'patrón pasos', 'La cuadrícula donde enciendes pasos para que el beat se repita solo.', 'Enciendes los cuadros 1, 5, 9 y 13 del bombo.'],
    ['Paso', 'pasos step', 'Cada cuadrito del secuenciador. 16 pasos = 1 compás; 32 pasos = 2 compases.', 'El paso 1 es el primer golpe del compás.'],
    ['Bucle', 'loop repetir', 'Una parte que se repite una y otra vez sin cortes.', '"Usar en la cabina" deja tu beat en bucle para grabar encima.'],
    ['Pista', 'track capa', 'Cada fila de la línea de tiempo: la base, tu beat o tu voz. También cada instrumento es una capa.', 'Silencias la pista de la base (M) para oír solo tu voz.'],
    ['Línea de tiempo', 'timeline mezcla', 'Donde ves la base, tu beat y tu voz una debajo de otra, con una aguja roja que marca el momento.', 'Haces clic en el segundo 10 para ensayar desde ahí.'],
    ['Mute / Solo', 'm s silenciar', 'M silencia una pista; S deja sonar solo esa pista.', 'Pones S en la voz para oírte sin el beat.'],
    ['WAV', 'archivo audio descargar', 'Un archivo de audio sin compresión, de alta calidad. FlowLab exporta tus mezclas y beats en WAV.', '"flowlab_mezcla_2026-11-19.wav".'],
    ['MP3', 'archivo audio', 'Un archivo de audio comprimido, más liviano. Sirve como base para grabar.', 'Subes "mi_beat.mp3" como base.'],
    ['Auto-Tune', 'retune afinación autotune', 'Un efecto que lleva tu voz a la nota correcta más cercana de una escala. Muy alto suena robótico (trap).', 'Velocidad 95% = voz robótica; 10% = casi natural.'],
    ['Retune (velocidad de afinación)', 'retune speed', 'Qué tan rápido corrige el Auto-Tune. Bajo = natural, alto = efecto robótico.', '0% natural · 100% robótico.'],
    ['Semitono', 'semitonos pitch shift tono', 'La distancia más pequeña entre dos notas del piano. 12 semitonos = una octava.', '+2 semitonos sube tu voz un tono entero.'],
    ['Escala', 'tonalidad nota la menor', 'El conjunto de notas "permitidas" para que algo suene bien junto. Debe coincidir con la de la base.', 'Si el beat está en La menor, eliges "La Menor (A minor)".'],
    ['Delay', 'eco', 'Un eco: tu voz se repite unos milisegundos después.', '250 ms es un eco clásico de rap.'],
    ['Reverb', 'reverberación sala eco de sala', 'El eco suave de una sala que da profundidad a la voz.', '20% = voz cercana; 60% = como en un salón grande.'],
    ['Compresión', 'compresor voz pareja', 'Empareja el volumen: sube lo suave y controla los gritos.', 'Tu voz queda "de radio", sin altibajos.'],
    ['Ganancia', 'volumen del micrófono entrada', 'Qué tan fuerte entra tu voz por el micrófono.', 'Si la onda toca los bordes, bájala.'],
    ['Monitoreo', 'escucharme en vivo', 'Oírte a ti mismo en los audífonos mientras grabas.', 'Con audífonos puestos oyes tu voz con efectos en tiempo real.'],
    ['Acople', 'pitido feedback', 'Ese pitido fuerte que aparece cuando el micrófono oye los parlantes.', 'Por eso se usan audífonos al grabar.'],
    ['Latencia', 'retraso desfase', 'El retraso entre que haces un sonido y lo oyes o se graba. Puede hacer que tu voz quede un poquito corrida del beat.', 'Si tu voz va tarde, usa "Sincronizar voz" con −40 ms.'],
    ['Sincronizar voz', 'desfase ms', 'Mueve tu toma unos milisegundos adelante o atrás para cuadrarla con la base.', '−40 ms adelanta tu voz.'],
    ['Milisegundo (ms)', 'ms', 'Una milésima de segundo. 1000 ms = 1 segundo.', '300 ms es un poquito menos de medio segundo.'],
    ['Hz (hercio)', 'hz frecuencia', 'Vibraciones por segundo: mide qué tan agudo o grave es un sonido.', 'La nota La suena a 440 Hz.'],
    ['Sílaba', 'silabas métrica', 'Cada golpe de voz de una palabra. Si tus barras tienen sílabas parecidas, suenan parejas.', 'ca-mi-no = 3 sílabas.'],
    ['Rima consonante', 'rima perfecta', 'Las palabras suenan igual desde la vocal fuerte hasta el final.', 'corazón / canción.'],
    ['Rima asonante', 'rima de vocales', 'Solo coinciden las vocales desde la vocal fuerte. Da más libertad.', 'corazón / amor (o).'],
    ['Univocal', 'vocal forzada', 'Un juego donde todas las palabras de tus rimas llevan la misma vocal fuerte.', 'Con la A: casa, fama, plata, nada.'],
    ['Estímulo', 'modo entrenamiento palabra al azar', 'Una palabra, un tema o una frase al azar que te dan para improvisar.', 'Sale "ventana": haces una barra que termine en esa palabra.'],
    ['Freestyle', 'improvisar rap', 'Rapear improvisando, sin letra escrita.', 'Una ronda de Palabra Bomba es freestyle con consignas.'],
    ['Pie forzado', 'frase obligada', 'Una frase que debes usar para cerrar tus barras.', '"…y no me van a parar".'],
    ['XP', 'experiencia puntos rango', 'Puntos de experiencia que ganas jugando. Con ellos subes de rango y desbloqueas juegos.', 'Una ronda verificada por voz da el XP completo; la de autoevaluación da el 40 %.'],
    ['Verificada / sin verificar', 'autoevaluación', 'Una ronda "verificada" la comprobó tu voz (o el propio juego); "sin verificar" la calificaste tú.', 'Dices las palabras y el juego marca ✓ cada una.'],
    ['Boom bap', 'rap clásico', 'Estilo de rap de los 90: bombo y caja marcados, ritmo con swing.', 'Alrededor de 90 BPM.'],
    ['Trap', '808 hi-hat rolls', 'Estilo con bajo 808 largo, hi-hats rápidos y ritmo a mitad de tiempo.', '140 BPM.'],
    ['Drill', 'drill uk', 'Estilo oscuro con 808 deslizante y hi-hats densos.', '140–145 BPM.'],
    ['Dembow', 'reggaetón', 'El ritmo del reggaetón: patrón 3+3+2 con bombo en cada negra.', '92 BPM.'],
    ['808', 'bajo 808', 'Un bajo sintético grave y largo, típico del trap y el drill.', 'La nota larga que hace temblar el parlante.'],
    ['Sample', 'muestra', 'Un fragmento de sonido o melodía que se repite dentro del beat.', 'La fila "Sample" toca notas de la escala.'],
    ['Limitador', 'volumen máximo clip', 'Evita que el sonido se pase del volumen máximo y se distorsione.', 'Tu beat exportado nunca pasa de 0,95.']
  ];
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const orden = TERMINOS.slice().sort((a, b) => a[0].localeCompare(b[0], 'es'));
  const indice = orden.map(t => norm(t.join(' ')));

  const btn = document.getElementById('btnGlosario');
  if (!btn) return;
  let dlg = null, lastFocus = null;
  function construir() {
    dlg = document.createElement('div'); dlg.id = 'glosario'; dlg.className = 'glos hidden'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'glosTitulo');
    const caja = document.createElement('div'); caja.className = 'glos-box';
    const cab = document.createElement('div'); cab.className = 'glos-head';
    const h = document.createElement('h2'); h.id = 'glosTitulo'; h.textContent = 'Glosario / Ayuda';
    const x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-ghost btn-small glos-close'; x.id = 'glosCerrar'; x.textContent = 'Cerrar ✕'; x.setAttribute('aria-label', 'Cerrar el glosario');
    cab.append(h, x);
    const buscar = document.createElement('input'); buscar.type = 'search'; buscar.id = 'glosBuscar'; buscar.placeholder = 'Busca una palabra: BPM, swing, delay…'; buscar.autocomplete = 'off'; buscar.setAttribute('aria-label', 'Buscar en el glosario'); buscar.maxLength = 40;
    const cuenta = document.createElement('p'); cuenta.className = 'glos-count'; cuenta.id = 'glosCuenta'; cuenta.setAttribute('role', 'status'); cuenta.setAttribute('aria-live', 'polite');
    const lista = document.createElement('dl'); lista.className = 'glos-list'; lista.id = 'glosLista';
    orden.forEach((t, i) => {
      const dt = document.createElement('dt'); dt.textContent = t[0];
      const dd = document.createElement('dd'); const p1 = document.createElement('span'); p1.textContent = t[2]; const p2 = document.createElement('em'); p2.textContent = 'Ejemplo: ' + t[3]; dd.append(p1, p2);
      dt.dataset.i = i; dd.dataset.i = i; lista.append(dt, dd);
    });
    const vacio = document.createElement('p'); vacio.className = 'glos-vacio hidden'; vacio.id = 'glosVacio'; vacio.textContent = 'No encontré esa palabra. Prueba con otra, por ejemplo "ritmo" o "voz".';
    caja.append(cab, buscar, cuenta, lista, vacio); dlg.append(caja); document.body.appendChild(dlg);
    const filtrar = () => {
      const q = norm(buscar.value.trim()); let n = 0;
      lista.querySelectorAll('dt,dd').forEach(e => { const ok = !q || indice[+e.dataset.i].includes(q); e.classList.toggle('hidden', !ok); if (ok && e.tagName === 'DT') n++; });
      vacio.classList.toggle('hidden', n > 0); cuenta.textContent = n + (n === 1 ? ' término' : ' términos');
    };
    buscar.addEventListener('input', filtrar); filtrar();
    x.addEventListener('click', cerrar);
    dlg.addEventListener('click', e => { if (e.target === dlg) cerrar(); });
    dlg.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
      if (e.key !== 'Tab') return;                                   // el foco se queda dentro del panel
      const f = [buscar, x, ...lista.querySelectorAll('a,button')].filter(Boolean);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
  }
  function abrir() {
    if (!dlg) construir();
    lastFocus = document.activeElement; dlg.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('glos-abierto');
    const b = document.getElementById('glosBuscar'); b.value = ''; b.dispatchEvent(new Event('input')); b.focus();
  }
  function cerrar() {
    if (!dlg) return; dlg.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('glos-abierto');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener('click', () => { if (dlg && !dlg.classList.contains('hidden')) cerrar(); else abrir(); });
  window.Glosario = { abrir, cerrar, terminos: () => orden.map(t => t[0]) };
})();

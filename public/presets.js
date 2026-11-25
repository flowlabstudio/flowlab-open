'use strict';
/* =====================================================================
   FlowLab Studio · presets.js
   Géneros y bases completas (MP3, hechas con Google Flow Music) para Beats, Cabina y Escuela.
   Se carga SOLO cuando hace falta (cabina.js lo pide), para no hacer más pesada la carga inicial.
   ===================================================================== */
(function () {
  const GENEROS = [
    { id: 'trap', n: 'Trap', tag: 'Oscuro, con 808', en: 'Dark, with 808s' },
    { id: 'reggaeton', n: 'Reggaetón', tag: 'Dembow para perrear y fluir', en: 'Dembow grooves' },
    { id: 'rap', n: 'Rap', tag: 'Boom bap con swing', en: 'Swinging boom bap' },
    { id: 'hiphop', n: 'Hip hop', tag: 'Lo-fi y relajado', en: 'Laid-back lo-fi' },
    { id: 'drill', n: 'Drill', tag: 'Frío y rápido', en: 'Cold and fast' }
  ];

  // Bases completas (audio hecho con Google Flow Music)
  const PRO = [
    { id: 'pro-cold-steel-keys', g: 'drill', n: 'Cold Steel Keys', bpm: 143, audio: 'assets/bases/cold-steel-keys.mp3', tag: 'Drill frío' },
    { id: 'pro-dembow-heat', g: 'reggaeton', n: 'Dembow Heat', bpm: 104, audio: 'assets/bases/dembow-heat.mp3', tag: 'Dembow' },
    { id: 'pro-dusty-keys', g: 'rap', n: 'Dusty Keys & Swung Grooves', bpm: 92, audio: 'assets/bases/dusty-keys.mp3', tag: 'Boom bap' },
    { id: 'pro-fiesta-dembow', g: 'reggaeton', n: 'Fiesta Dembow', bpm: 105, audio: 'assets/bases/fiesta-dembow.mp3', tag: 'Fiesta' },
    { id: 'pro-guitarra-verano', g: 'reggaeton', n: 'Guitarra de Verano', bpm: 92, audio: 'assets/bases/guitarra-verano.mp3', tag: 'Con guitarra' },
    { id: 'pro-midnight-rhodes', g: 'hiphop', n: 'Midnight Rhodes', bpm: 80, audio: 'assets/bases/midnight-rhodes.mp3', tag: 'Lo-fi' },
    { id: 'pro-noche-sensual', g: 'reggaeton', n: 'Noche Sensual', bpm: 78, audio: 'assets/bases/noche-sensual.mp3', tag: 'Lento' },
    { id: 'pro-midnight-slideway', g: 'trap', n: 'Midnight Slideway', bpm: 98, audio: 'assets/bases/midnight-slideway.mp3', tag: 'Trap con 808' },
    { id: 'pro-sombra-nocturna', g: 'trap', n: 'Sombra Nocturna', bpm: 89, audio: 'assets/bases/sombra-nocturna.mp3', tag: 'Trap oscuro' },
    { id: 'pro-velocidad-maxima', g: 'reggaeton', n: 'Velocidad Máxima', bpm: 95, audio: 'assets/bases/velocidad-maxima.mp3', tag: 'Doble tempo' }
  ];

  window.BeatPresets = { GENEROS, pro: PRO };
  window.dispatchEvent(new CustomEvent('flowlab:presets'));
})();

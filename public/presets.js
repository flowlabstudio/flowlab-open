'use strict';
/* =====================================================================
   FlowLab Studio · presets.js
   25 ritmos predeterminados (5 por género) para el modo Beats (Mejoras 5 · Parte C).
   Se carga SOLO cuando entras al modo Beats (cabina.js lo pide la primera vez), para no hacer más pesada la carga inicial.
   Cada ritmo: nombre, BPM, kit, swing, patrón (16 o 32 pasos), notas del bajo/sample y ajuste de "Dale sabor".
   De dónde salen los patrones y los BPM: ver PRESETS.md (fuentes y dudas honestas).
   Lectura de los pasos: en 16 pasos, el 0 es el tiempo 1, el 4 el tiempo 2, el 8 el tiempo 3 y el 12 el tiempo 4.
   Un paso se escribe como número (golpe fuerte) o como {paso: fuerza} con fuerza 1 suave · 2 media · 3 fuerte.
   Las notas son del 0 al 7 de la escala menor pentatónica (La, Do, Re, Mi, Sol, La, Do, Re).
   ===================================================================== */
(function () {
  const INST_ORDER = ['bombo', 'caja', 'hat', 'hatopen', 'bajo', 'sample', 'palmas', 'textura', 'crash', 'ride', 'clap', 'rim', 'cowbell'];
  const BASE8 = INST_ORDER.slice(0, 8);
  const bar2 = (a, b) => a.concat(b.map(x => x + 16));                 // dos compases: el segundo se escribe con los mismos números 0-15
  const m2 = (a, b) => Object.assign({}, a, Object.fromEntries(Object.entries(b).map(([k, v]) => [+k + 16, v])));
  const H8 = { 0: 3, 2: 2, 4: 3, 6: 2, 8: 3, 10: 2, 12: 3, 14: 2 };    // corcheas con acento en cada tiempo
  const H16 = lv => Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i, lv[i % lv.length]]));
  const T332 = [0, 3, 6, 8, 11, 14];                                    // el "3+3+2" (tresillo): 3 pasos, 3 pasos y 2 pasos

  const GENEROS = [
    { id: 'trap', n: 'Trap', tag: '130–150 BPM · mitad de tiempo · 808 largo' },
    { id: 'reggaeton', n: 'Reggaetón', tag: '88–100 BPM · dembow' },
    { id: 'rap', n: 'Rap', tag: '85–95 BPM · boom bap con swing' },
    { id: 'hiphop', n: 'Hip hop', tag: '80–100 BPM · de old school a lo-fi' },
    { id: 'drill', n: 'Drill', tag: '140–145 BPM · 808 deslizante' }
  ];

  const R = [
    /* ---------------- TRAP: clap/caja en el tiempo 3 (paso 8), hi-hats con rolls, 808 largo ---------------- */
    { id: 'trap-medianoche', g: 'trap', n: 'Medianoche', bpm: 140, kit: 'trap', swing: 0, steps: 32, fx: { vinilo: 0, filtro: 0, sat: 15 },
      p: {
        bombo: bar2([0, 3, 10], [0, 3, 10, 14]), caja: [8, 24],
        hat: m2({ 0: 3, 2: 2, 4: 3, 6: 2, 8: 3, 10: 2, 12: 2, 13: 1, 15: 1 }, { 0: 3, 2: 2, 4: 3, 6: 2, 8: 3, 10: 2, 12: 1, 13: 2, 14: 2, 15: 3 }),
        hatopen: [14], bajo: { 0: 0, 3: 2, 10: 3, 16: 0, 19: 2, 26: 4, 30: 3 }
      } },
    { id: 'trap-atlanta', g: 'trap', n: 'Atlanta Bounce', bpm: 148, kit: 'trap', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 25 },
      p: { bombo: [0, 6, 7, 10, 14], caja: [8], hat: H16([3, 1, 2, 1]), crash: { 0: 2 }, bajo: { 0: 0, 6: 0, 7: 2, 10: 3, 14: 0 } } },
    { id: 'trap-dark', g: 'trap', n: 'Dark Room', bpm: 130, kit: 'trap', swing: 0, steps: 16, fx: { vinilo: 20, filtro: 25, sat: 20 },
      p: { bombo: [0, 10], caja: [8], hat: { 0: 2, 2: 1, 4: 2, 6: 1, 8: 2, 10: 1, 12: 2, 14: 1 }, textura: [15], sample: { 0: 0, 8: 4 }, bajo: { 0: 0, 10: 1 } } },
    { id: 'trap-rage', g: 'trap', n: 'Rage Mode', bpm: 150, kit: 'trap', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 40 },
      p: { bombo: [0, 2, 3, 10, 11], caja: [8], hat: H16([3, 1, 2, 1]), rim: [4, 12], crash: { 0: 3 }, bajo: { 0: 0, 2: 0, 3: 3, 10: 2, 11: 5 } } },
    { id: 'trap-latino', g: 'trap', n: 'Trap Latino', bpm: 134, kit: 'trap', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 18 },
      p: { bombo: [0, 7, 10], caja: [8], rim: [3, 11, 14], palmas: { 8: 2 }, hat: { 0: 3, 2: 2, 4: 3, 6: 2, 8: 3, 10: 2, 12: 3, 13: 1, 14: 2, 15: 1 }, bajo: { 0: 0, 7: 2, 10: 0 } } },

    /* ---------------- REGGAETÓN: dembow = bombo en cada negra + caja/rim en el 3+3+2 (pasos 3, 6, 11, 14) ---------------- */
    { id: 'reg-clasico', g: 'reggaeton', n: 'Dembow Clásico', bpm: 92, kit: 'dembow', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 12 },
      p: { bombo: [0, 4, 8, 12], caja: [3, 6, 11, 14], hat: H8, bajo: { 0: 0, 6: 0, 8: 2, 14: 3 } } },
    { id: 'reg-perreo', g: 'reggaeton', n: 'Perreo Intenso', bpm: 96, kit: 'dembow', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 20 },
      p: { bombo: [0, 4, 8, 12], caja: [3, 6, 11, 14], palmas: { 4: 2, 12: 2 }, hat: H16([3, 1, 2, 1]), hatopen: [7, 15], bajo: { 0: 0, 3: 0, 6: 2, 8: 0, 11: 3, 14: 2 } } },
    { id: 'reg-romantico', g: 'reggaeton', n: 'Reggaetón Romántico', bpm: 88, kit: 'dembow', swing: 0, steps: 16, fx: { vinilo: 10, filtro: 15, sat: 8 },
      p: { bombo: { 0: 2, 4: 2, 8: 2, 12: 2 }, caja: { 3: 2, 6: 2, 11: 2, 14: 2 }, hat: H16([1]), sample: { 0: 0, 8: 3 }, bajo: { 0: 0, 6: 0, 8: 3, 14: 0 } } },
    { id: 'reg-dominicano', g: 'reggaeton', n: 'Dembow Dominicano', bpm: 100, kit: 'dembow', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 15 },
      p: { bombo: [0, 4, 8, 12], caja: { 3: 3, 6: 3, 11: 3, 14: 3, 15: 1 }, cowbell: { 0: 2, 6: 2, 8: 2, 14: 2 }, palmas: { 2: 1, 10: 1 }, hat: H16([3, 2]), bajo: { 0: 0, 8: 0, 11: 2 } } },
    { id: 'reg-neoperreo', g: 'reggaeton', n: 'Neoperreo Sensual', bpm: 94, kit: 'dembow', swing: 12, steps: 16, fx: { vinilo: 0, filtro: 20, sat: 14 },
      p: { bombo: { 0: 3, 4: 2, 8: 3, 12: 2 }, caja: [3, 6, 11, 14], clap: { 12: 2 }, hat: { 0: 3, 2: 2, 4: 3, 6: 2, 7: 1, 8: 3, 10: 2, 12: 3, 14: 2, 15: 1 }, textura: [15], sample: { 2: 4, 10: 2 }, bajo: { 0: 0, 3: 0, 6: 5, 8: 0, 11: 3, 14: 2 } } },

    /* ---------------- RAP (boom bap): bombo en 1 y en el "y" del 2 (paso 6), caja en 2 y 4 (pasos 4 y 12), swing alto ---------------- */
    { id: 'rap-clasico', g: 'rap', n: 'Boom Bap Clásico', bpm: 90, kit: 'boombap', swing: 58, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 30 },
      p: { bombo: [0, 6, 10], caja: [4, 12], hat: H8, bajo: { 0: 0, 6: 2, 10: 0 } } },
    { id: 'rap-golden', g: 'rap', n: 'Golden Age', bpm: 88, kit: 'boombap', swing: 60, steps: 16, fx: { vinilo: 10, filtro: 0, sat: 35 },
      p: { bombo: [0, 7, 10], caja: [4, 12], palmas: { 12: 1 }, hat: H8, hatopen: [14], sample: { 0: 3, 8: 5 }, bajo: { 0: 0, 7: 3 } } },
    { id: 'rap-madrugada', g: 'rap', n: 'Madrugada', bpm: 85, kit: 'boombap', swing: 62, steps: 16, fx: { vinilo: 25, filtro: 10, sat: 30 },
      p: { bombo: { 0: 3, 5: 1, 10: 3, 13: 2 }, caja: [4, 12], hat: { 0: 2, 2: 1, 4: 2, 6: 1, 8: 2, 10: 1, 12: 2, 14: 1 }, ride: { 2: 1, 6: 1, 10: 1, 14: 1 }, textura: [15], bajo: { 0: 0, 10: 2 } } },
    { id: 'rap-cypher', g: 'rap', n: 'Cypher', bpm: 94, kit: 'boombap', swing: 54, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 30 },
      p: { bombo: { 0: 3, 6: 3, 8: 2, 11: 3 }, caja: { 4: 3, 12: 3, 15: 1 }, hat: H16([3, 1, 2, 1]), bajo: { 0: 0, 6: 3, 8: 0, 11: 5 } } },
    { id: 'rap-barrio', g: 'rap', n: 'Batalla de Barrio', bpm: 92, kit: 'boombap', swing: 56, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 40 },
      p: { bombo: [0, 2, 6, 10], caja: [4, 12], rim: { 7: 2, 15: 2 }, hat: H8, crash: { 0: 2 }, bajo: { 0: 0, 2: 0, 6: 2, 10: 3 } } },

    /* ---------------- HIP HOP: de old school a lo-fi, cada uno con su kit y su swing ---------------- */
    { id: 'hh-oldschool', g: 'hiphop', n: 'Old School Funk', bpm: 100, kit: 'boombap', swing: 12, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 25 },
      p: { bombo: [0, 3, 8, 10], caja: [4, 12], palmas: { 4: 1, 12: 1 }, hat: H8, bajo: { 0: 0, 3: 2, 8: 0, 10: 3 } } },
    { id: 'hh-gfunk', g: 'hiphop', n: 'West Coast G-Funk', bpm: 94, kit: 'boombap', swing: 18, steps: 16, fx: { vinilo: 0, filtro: 0, sat: 20 },
      p: { bombo: [0, 10], caja: [4, 12], palmas: { 4: 3, 12: 3 }, hat: { 2: 2, 6: 2, 10: 2, 14: 2 }, bajo: { 0: 0, 3: 2, 6: 3, 10: 0, 12: 4 }, sample: { 0: 5, 8: 3 } } },
    { id: 'hh-lofi', g: 'hiphop', n: 'Lo-fi Study', bpm: 80, kit: 'lofi', swing: 30, steps: 16, fx: { vinilo: 30, filtro: 35, sat: 18 },
      p: { bombo: [0, 9], caja: [4, 12], hat: { 0: 2, 2: 1, 4: 1, 6: 1, 8: 2, 10: 1, 12: 1, 14: 1 }, sample: { 0: 0, 6: 2, 12: 3 }, bajo: { 0: 0, 9: 1 }, textura: [15] } },
    { id: 'hh-moderno', g: 'hiphop', n: 'Hip Hop Moderno', bpm: 96, kit: 'dusty', swing: 8, steps: 32, fx: { vinilo: 15, filtro: 12, sat: 28 },
      p: {
        bombo: bar2([0, 7, 10], [0, 7, 10, 14]), caja: [4, 12, 20, 28], hat: m2(H16([3, 1, 2, 1]), H16([3, 2, 1, 2])),
        bajo: { 0: 0, 7: 2, 10: 3, 16: 0, 23: 1, 26: 4 }, sample: { 0: 0, 16: 2 }
      } },
    { id: 'hh-soul', g: 'hiphop', n: 'Soul Chop', bpm: 88, kit: 'lofi', swing: 40, steps: 16, fx: { vinilo: 20, filtro: 25, sat: 15 },
      p: { bombo: [0, 5, 10], caja: [4, 12], ride: { 2: 1, 6: 1, 10: 1, 14: 1 }, hat: { 0: 1, 8: 1 }, sample: { 0: 0, 3: 2, 6: 3, 8: 4, 11: 2 }, bajo: { 0: 0, 5: 2, 10: 3 } } },

    /* ---------------- DRILL: caja en el tiempo 3, hi-hats en 3+3+2, 808 deslizante; en 32 pasos la caja pasa al tiempo 4 en el 2.º compás ---------------- */
    { id: 'drill-uk', g: 'drill', n: 'Drill UK', bpm: 140, kit: 'drill', swing: 0, steps: 32, fx: { vinilo: 0, filtro: 12, sat: 20 },
      p: { bombo: bar2([0, 7, 10], [0, 7, 10]), caja: [8, 28], hat: bar2(T332.concat([15]), T332), bajo: { 0: 0, 7: 2, 10: 3, 16: 0, 23: 1, 26: 2 } } },
    { id: 'drill-brooklyn', g: 'drill', n: 'Brooklyn Drill', bpm: 143, kit: 'drill', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 8, sat: 25 },
      p: { bombo: [0, 6, 11], caja: [8], hat: { 0: 3, 2: 2, 3: 2, 6: 3, 8: 2, 10: 2, 11: 3, 14: 3, 15: 1 }, hatopen: [12], crash: { 0: 2 }, bajo: { 0: 0, 6: 2, 11: 0 } } },
    { id: 'drill-chicago', g: 'drill', n: 'Chicago Dark', bpm: 142, kit: 'drill', swing: 0, steps: 16, fx: { vinilo: 5, filtro: 25, sat: 22 },
      p: { bombo: [0, 3, 10, 13], caja: [8], hat: { 0: 3, 3: 2, 6: 2, 8: 3, 9: 1, 11: 2, 14: 2, 15: 1 }, textura: [14], sample: { 0: 0, 8: 2 }, bajo: { 0: 0, 3: 0, 10: 4, 13: 3 } } },
    { id: 'drill-londres', g: 'drill', n: 'Londres Gris', bpm: 144, kit: 'drill', swing: 0, steps: 32, fx: { vinilo: 0, filtro: 18, sat: 20 },
      p: {
        bombo: bar2([0, 2, 10], [0, 2, 10]), caja: [8, 28], rim: [3, 11, 19, 27],
        hat: m2({ 0: 2, 2: 2, 3: 1, 6: 3, 8: 2, 10: 2, 11: 1, 14: 3 }, { 0: 2, 2: 2, 3: 1, 6: 3, 8: 2, 10: 2, 11: 1, 12: 1, 13: 2, 14: 3, 15: 3 }),
        bajo: { 0: 0, 2: 0, 10: 3, 16: 0, 18: 2, 26: 3 }
      } },
    { id: 'drill-latino', g: 'drill', n: 'Drill Latino', bpm: 140, kit: 'drill', swing: 0, steps: 16, fx: { vinilo: 0, filtro: 10, sat: 20 },
      p: { bombo: [0, 6, 10], caja: [8], palmas: { 8: 2 }, hat: T332, cowbell: { 0: 2, 6: 2 }, sample: { 0: 0, 6: 3 }, bajo: { 0: 0, 6: 0, 10: 2 } } }
  ];

  // Convierte un ritmo en el "estado" que entiende el creador de beats (todas las filas base + las extra que use).
  // En "bajo" y "sample", {paso: nota} quiere decir: golpe fuerte en ese paso tocando esa nota (0-7).
  function aEstado(item) {
    const usados = INST_ORDER.filter(i => BASE8.includes(i) || item.p[i]);
    const rows = usados.map(inst => {
      const cells = new Array(32).fill(0), notes = new Array(32).fill(0), pat = item.p[inst], melodica = inst === 'bajo' || inst === 'sample';
      if (pat) {
        const par = Array.isArray(pat) ? pat.map(i => [i, 3]) : Object.entries(pat).map(([i, v]) => [+i, v]);
        par.forEach(([i, v]) => {
          if (i < 0 || i >= 32) return;
          if (melodica) { cells[i] = 3; notes[i] = v >= 0 && v <= 7 && !Array.isArray(pat) ? v : 0; }
          else cells[i] = v;
        });
      }
      return { inst, vol: inst === 'crash' || inst === 'ride' ? 0.7 : 0.9, mute: false, solo: false, cells, notes };
    });
    return { id: null, name: item.n, bpm: item.bpm, swing: item.swing, kit: item.kit, steps: item.steps, fx: Object.assign({}, item.fx), rows };
  }

  // Bases profesionales (audio hecho con Google Flow Music). Cabina y Escuela usan SOLO estas; los ritmos sintéticos (items) quedan para el secuenciador de Beats.
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

  window.BeatPresets = { GENEROS, items: R, pro: PRO, aEstado, T332 };
  window.dispatchEvent(new CustomEvent('flowlab:presets'));
})();

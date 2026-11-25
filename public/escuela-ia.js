/* FlowLab · IA dentro de la Escuela.
   1) Insignia "IA" en la esquina de la pantalla de juego (también en pantalla completa): da una pista
      al momento y SIN internet (rimas del motor de rimas + consejo del reto). "Más ideas con IA" abre el Coach.
   2) Botón "Batalla 1 vs 1 con la IA" en la Escuela (usa burbuja-ia.js). */
(function () {
  'use strict';
  const EN = () => /^en/i.test(document.documentElement.lang || '');
  const $ = s => document.querySelector(s);
  const TIPS = [
    ['UNIVOCAL', 'Termina cada barra con la palabra que brilla o una de su misma vocal: las 4 del bloque riman entre sí.', 'End every bar with the glowing word or one with the same vowel.'],
    ['CADENA', 'Engancha: la última palabra de tu barra es la primera de la siguiente idea.', 'Chain it: the last word of your bar starts the next idea.'],
    ['BOMBA', 'Mete la palabra bomba en medio de la barra y remata con una rima fuerte.', 'Drop the bomb word mid-bar and finish with a strong rhyme.'],
    ['SANGRE', 'Una palabra por compás: no te trabes, aunque la barra sea simple.', 'One word per bar: do not freeze, even if the line is simple.'],
    ['OBJETOS', 'Describe el objeto con una imagen: cómo se ve, para qué sirve y qué te hace sentir.', 'Describe the object with an image: how it looks, what it does, how it feels.'],
    ['TEM', 'Presenta el tema en la primera barra, da un ejemplo, desarrolla y remata fuerte.', 'Present the topic, give an example, develop it and punch the ending.'],
    ['TERMINACIONES', 'Busca palabras que acaben igual y alárgalas con la voz para que la rima se oiga.', 'Find words with the same ending and stretch them so the rhyme lands.'],
    ['PIE', 'Prepara tres barras que lleven a la frase forzada y suéltala en la cuarta.', 'Build three bars that lead to the forced phrase and land it on the fourth.'],
    ['CONTRASTES', 'Opuestos: una barra por cada lado y une los dos con un giro en la última.', 'Opposites: one bar for each side, then twist them together in the last one.'],
    ['PERSONAJES', 'Habla en primera persona: quién eres, dónde estás, qué sientes, remate.', 'First person: who you are, where you are, what you feel, punchline.'],
    ['BATALLA', 'Respira al final de cada 4 barras y no regales tiempos vacíos.', 'Breathe after every 4 bars and do not give away empty beats.'],
    ['MINUTO', 'No pares: si no te sale el disparador, di lo que veas o sientas y vuelve a él.', 'Keep going: if the trigger does not click, say what you see or feel and come back.'],
    ['DESAH', 'Sin presión: di lo primero que sientas con la palabra que sale. No hay buena ni mala barra.', 'No pressure: say the first thing you feel with the word shown.'],
    ['BARRIO', 'Cuenta un detalle concreto: un olor, un sonido, una esquina.', 'Use a concrete detail: a smell, a sound, a corner.'],
    ['HISTORIA', 'Empieza por un momento exacto: dónde estabas y qué pasó después.', 'Start from an exact moment: where you were and what happened next.'],
    ['SUPERACI', 'Cuenta la caída y la subida: una barra para el golpe y otra para cómo te levantaste.', 'Tell the fall and the climb: one bar for the hit, one for getting up.'],
    ['AMOR', 'Habla con honestidad y con una imagen: lo que extrañas, no solo "te quiero".', 'Be honest and visual: what you miss, not just "I love you".'],
    ['REL', 'Rimas rápidas: di todas las que puedas, aunque sean asonantes (solo las vocales).', 'Fast rhymes: say as many as you can, even assonant ones.']
  ];
  const tipFor = g => { const k = (g || '').toUpperCase(); const t = TIPS.find(x => k.indexOf(x[0]) >= 0); return t ? (EN() ? t[2] : t[1]) : (EN() ? 'Keep the flow going and breathe on the downbeat.' : 'Mantén el flow y respira en el primer tiempo.'); };

  function rhymesOf(word) {
    try {
      if (typeof Studio === 'undefined' || !Studio.rhymeKeys) return [];
      const w = (word || '').trim().toLowerCase(); if (!w || /\s/.test(w)) return [];
      const k = Studio.rhymeKeys(w); if (!k) return [];
      const pool = (Studio.rhymeWords || []).slice(); const out = [];
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const self = Studio.stripAcc ? Studio.stripAcc(w) : w;
      for (const x of pool) {
        const kx = Studio.rhymeKeys(x); if (!kx) continue;
        const sx = Studio.stripAcc ? Studio.stripAcc(String(x).toLowerCase()) : String(x).toLowerCase();
        if (sx !== self && kx.cons === k.cons) out.push(x);
        if (out.length >= 4) break;
      }
      if (out.length < 3) for (const x of pool) { const kx = Studio.rhymeKeys(x); if (kx && kx.aso === k.aso && out.indexOf(x) < 0 && String(x).toLowerCase() !== w) out.push(x); if (out.length >= 4) break; }
      return out;
    } catch (e) { return []; }
  }

  let panel, btn;
  function showHint() {
    const stage = $('#gymStage'); if (!stage) return;
    const game = ($('#stageGame') || {}).textContent || '', main = ($('#gymMain') || {}).textContent || '';
    if (!panel) { panel = document.createElement('div'); panel.className = 'eia-panel'; panel.setAttribute('role', 'status'); stage.append(panel); }
    panel.textContent = '';
    const h = document.createElement('b'); h.textContent = 'IA · ' + (EN() ? 'hint' : 'pista'); panel.append(h);
    const rs = rhymesOf(main);
    if (rs.length) { const r = document.createElement('div'); r.className = 'eia-rhymes'; rs.forEach(x => { const s = document.createElement('span'); s.textContent = x; r.append(s); }); panel.append(r); }
    const p = document.createElement('p'); p.textContent = tipFor(game); panel.append(p);
    const more = document.createElement('button'); more.type = 'button'; more.className = 'eia-more'; more.textContent = EN() ? 'More ideas with AI' : 'Más ideas con IA';
    more.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); if (window.Coach) window.Coach.abrir('letra'); });
    panel.append(more);
    panel.classList.remove('hidden'); clearTimeout(panel._t); panel._t = setTimeout(() => panel.classList.add('hidden'), 9000);
  }
  function init() {
    const top = $('#gymStage .stage-top');
    if (top && !$('#btnEscuelaIA')) {
      btn = document.createElement('button'); btn.type = 'button'; btn.id = 'btnEscuelaIA'; btn.className = 'eia-btn'; btn.textContent = 'IA';
      btn.setAttribute('aria-label', EN() ? 'AI hint for this challenge' : 'Pista de IA para este reto'); btn.addEventListener('click', showHint); top.append(btn);
    }
    const mission = $('#school .mission, #school #missionBox') || $('#school .school-body') || $('#school');
    if (mission && !$('#btnBatallaIA')) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'btnBatallaIA'; b.className = 'btn btn-neon eia-battle';
      b.textContent = '⚔️ ' + (EN() ? '1 vs 1 battle with the AI' : 'Batalla 1 vs 1 con la IA');
      b.addEventListener('click', () => { if (window.BatallaIA) window.BatallaIA.abrir(); });
      const heading = $('#school .panel-head') || $('#school h2');
      (heading && heading.parentNode ? heading.parentNode : mission).insertBefore(b, heading ? heading.nextSibling : mission.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

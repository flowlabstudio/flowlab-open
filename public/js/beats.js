'use strict';
/* =====================================================================
   FlowLab Studio · beats.js
   Creador de beats (Mejoras 3 · Parte 2). Todo se sintetiza con Web Audio: no hay archivos de sonido.
     1) Motor de sonido: 13 instrumentos y 6 kits (Dusty drums, Boom bap, Trap, Drill, Dembow, Lo-fi/Soul) + "Dale sabor"
     2) Reloj: planificador con adelanto sobre el reloj de AudioContext (el intervalo solo "mira hacia
        adelante"; cada golpe se agenda en su instante exacto de audio, nunca "cuando llegue el timer")
     3) Pads (mouse, dedo, teclado) · secuenciador de 16/32 pasos con intensidad y notas
     4) Mis beats (localStorage, todo validado antes de usarse)
   Depende de app.js (window.Studio.ctx) y cabina.js (eventos flowlab:mode). Lo que se guarda: flowlab_beats.
   ===================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const S = window.Studio;
  if (!S || !$('#btSeq')) return;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d) => (Number.isFinite(+v) && v !== null && v !== '' ? +v : d);
  const lsGet = (k, d) => { try { const v = localStorage.getItem('flowlab_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem('flowlab_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  /* ---------------- Datos: instrumentos, kits, notas ---------------- */
  const INST = {
    bombo: { n: 'Bombo', key: 'Q', c: '#E01A17', sub: 'Kick', type: 'kick' },
    caja: { n: 'Caja', key: 'W', c: '#FE5E00', sub: 'Snare', type: 'snare' },
    hat: { n: 'Hi-hat', key: 'E', c: '#DEFC07', sub: 'Closed', type: 'hat' },
    hatopen: { n: 'Hi-hat open', key: 'R', c: '#4ADE38', sub: 'Open', type: 'hatopen' },
    bajo: { n: 'Bajo', key: 'A', c: '#05ECFB', sub: 'Sub', type: 'bass', melodic: true },
    sample: { n: 'Sample', key: 'S', c: '#F20479', sub: 'Chop', type: 'sample', melodic: true },
    palmas: { n: 'Palmas', key: 'D', c: '#C9C9C9', sub: 'Clap', type: 'palmas' },
    textura: { n: 'Textura', key: 'F', c: '#9B6BFF', sub: 'Vinyl', type: 'texture' },
    crash: { n: 'Platillo', key: '', c: '#FFC247', sub: 'Crash', type: 'crash' },
    ride: { n: 'Ride', key: '', c: '#6FE3C1', sub: 'Ride', type: 'ride' },
    clap: { n: 'Clap', key: '', c: '#FF7AD1', sub: 'Snap', type: 'clap' },
    rim: { n: 'Rim', key: '', c: '#9AA6FF', sub: 'Rim', type: 'rim' },
    cowbell: { n: 'Cowbell', key: '', c: '#F5E663', sub: 'Bell', type: 'cowbell' }
  };
  const PAD_IDS = ['bombo', 'caja', 'hat', 'hatopen', 'bajo', 'sample', 'palmas', 'textura'];
  const EXTRA_IDS = ['crash', 'ride', 'clap', 'rim', 'cowbell'];
  const KEYMAP = {}; PAD_IDS.forEach(id => { KEYMAP[INST[id].key.toLowerCase()] = id; });
  const NOTES = [0, 3, 5, 7, 10, 12, 15, 17]; // escala menor pentatónica (suena bien sin teoría)
  const NOTE_NAMES = ['La', 'Do', 'Re', 'Mi', 'Sol', 'La', 'Do', 'Re'];
  const VEL = [0, 0.45, 0.75, 1];
  const INT_NAME = ['', 'suave', 'media', 'fuerte'];
  const MAXSTEPS = 32;

  /* Cada kit es una "personalidad" completa: cómo suena el bombo, la caja (centro de frecuencia, cuerpo, estilo), los hi-hats,
     el bajo (808 o bajo normal), el filtro general y los efectos con los que arranca. Todo se sintetiza, no hay archivos. */
  const KITS = {
    dusty: {
      n: 'Dusty drums', desc: 'Lo-fi polvoriento: filtro, saturación suave, ruido de vinilo y un leve "tape" que desafina.',
      k0: 120, k1: 52, kp: 0.08, kd: 0.32, kclick: 0.1, kclickF: 1200,
      sty: 'snare', sF: 2600, sQ: 0.7, sn: 0.9, sd: 0.2, sbF: 190, sbody: 0.55, sbd: 0.13, scrack: 0.15,
      hhp: 5200, hd: 0.06, hl: 0.34, od: 0.26, crashD: 1.1, pF: 1000, pd: 0.2,
      tone: 4800, b808: false, bw: 'triangle', bdec: 0.55, bc0: 700, bc1: 160, sampLP: 1200, wob: 1,
      fx: { vinilo: 45, filtro: 18, sat: 25 }
    },
    boombap: {
      n: 'Boom bap', desc: 'Clásico de los 90: bombo seco y con pegada, caja crujiente con cuerpo y chasquido.',
      k0: 195, k1: 58, kp: 0.045, kd: 0.2, kclick: 0.6, kclickF: 2400,
      sty: 'snare', sF: 2100, sQ: 0.9, sn: 0.95, sd: 0.17, sbF: 210, sbody: 0.7, sbd: 0.11, scrack: 0.2,
      hhp: 7000, hd: 0.05, hl: 0.4, od: 0.3, crashD: 1.4, pF: 1300, pd: 0.16,
      tone: 15000, b808: false, bw: 'sawtooth', bdec: 0.28, bc0: 1300, bc1: 220, sampLP: 2400, wob: 0,
      fx: { vinilo: 0, filtro: 0, sat: 30 }
    },
    trap: {
      n: 'Trap', desc: '808 largo y profundo con deslizamiento, clap seco y corto, hi-hats muy cortos y brillantes.',
      k0: 140, k1: 40, kp: 0.12, kd: 1.1, kclick: 0.18, kclickF: 900,
      sty: 'clap', sF: 1600, sQ: 1.2, sn: 1.0, sd: 0.1, sbF: 200, sbody: 0.12, sbd: 0.05, scrack: 0.1,
      hhp: 12500, hd: 0.016, hl: 0.4, od: 0.18, crashD: 1.5, pF: 1500, pd: 0.1,
      tone: 18000, b808: true, glide: true, bgl: 1.25, bdec: 1.0, sampLP: 3600, wob: 0,
      fx: { vinilo: 0, filtro: 0, sat: 15 }
    },
    drill: {
      n: 'Drill', desc: 'Oscuro y frío: 808 deslizante, caja seca y dura, hi-hats rápidos y filosos.',
      k0: 100, k1: 36, kp: 0.1, kd: 0.6, kclick: 0.4, kclickF: 1800,
      sty: 'snare', sF: 2200, sQ: 0.8, sn: 1.0, sd: 0.085, sbF: 240, sbody: 0.45, sbd: 0.05, scrack: 0.22,
      hhp: 8800, hband: 0.9, hd: 0.022, hl: 0.5, od: 0.14, crashD: 1.2, pF: 1500, pd: 0.09,
      tone: 18000, b808: true, glide: true, bgl: 1.9, bdec: 0.5, sampLP: 2800, wob: 0,
      fx: { vinilo: 0, filtro: 12, sat: 20 }
    },
    dembow: {
      n: 'Dembow', desc: 'Reggaetón: bombo seco y corto, rim agudo "de plástico" y hi-hats limpios.',
      k0: 155, k1: 62, kp: 0.04, kd: 0.15, kclick: 0.45, kclickF: 2000,
      sty: 'plastic', sF: 4300, sQ: 2.2, sn: 1.0, sd: 0.032, sbF: 310, sbody: 0.5, sbd: 0.04, scrack: 0.25,
      hhp: 8200, hd: 0.035, hl: 0.36, od: 0.2, crashD: 1.2, pF: 1700, pd: 0.1,
      tone: 18000, b808: false, bw: 'triangle', bdec: 0.2, bc0: 900, bc1: 300, sampLP: 3200, wob: 0,
      fx: { vinilo: 0, filtro: 0, sat: 12 }
    },
    lofi: {
      n: 'Lo-fi / Soul', desc: 'Suave, redondo y cálido: todo apagadito, con caja blanda y un bajo de seda.',
      k0: 92, k1: 48, kp: 0.1, kd: 0.45, kclick: 0.04, kclickF: 700,
      sty: 'snare', sF: 2000, sQ: 0.6, sn: 0.8, sd: 0.26, sbF: 175, sbody: 0.6, sbd: 0.17, scrack: 0.05,
      hhp: 4200, hd: 0.075, hl: 0.4, od: 0.3, crashD: 1.0, pF: 900, pd: 0.24,
      tone: 3600, b808: false, bw: 'sine', bdec: 0.7, bc0: 450, bc1: 140, sampLP: 950, wob: 1.4,
      fx: { vinilo: 30, filtro: 35, sat: 18 }
    }
  };
  const KIT_IDS = Object.keys(KITS);
  // Patrón corto de 2 compases con el que suena "▶ Escuchar kit" (no toca el patrón del usuario)
  const KIT_DEMO = {
    dusty: { bpm: 78, swing: 24, p: { bombo: [0, 7, 10], caja: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bajo: [0, 10], sample: [0, 8] } },
    boombap: { bpm: 92, swing: 56, p: { bombo: [0, 6, 10], caja: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bajo: [0, 6], palmas: [12] } },
    trap: { bpm: 140, swing: 0, p: { bombo: [0, 7, 11], caja: [8], hat: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15], bajo: [0, 7], hatopen: [14] } },
    drill: { bpm: 142, swing: 0, p: { bombo: [0, 6, 9], caja: [8], hat: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], bajo: [0, 9] } },
    dembow: { bpm: 96, swing: 0, p: { bombo: [0, 4, 8, 12], caja: [3, 6, 11, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14], bajo: [0, 6, 8] } },
    lofi: { bpm: 74, swing: 30, p: { bombo: [0, 9], caja: [4, 12], hat: [0, 4, 8, 12], bajo: [0, 9], sample: [0, 6, 12] } }
  };

  /* ---------------- Motor de sonido (sirve para audio en vivo y, más adelante, para renderizar) ---------------- */
  const noiseCache = new WeakMap();
  function noiseBuf(c) {
    let b = noiseCache.get(c); if (b) return b;
    b = c.createBuffer(1, Math.floor(c.sampleRate * 2), c.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(c, b); return b;
  }
  function vinylBuf(c) {
    const len = Math.floor(c.sampleRate * 4), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.06;   // siseo suave
    for (let k = 0; k < 26; k++) {                                        // chasquidos (pops)
      const at = Math.floor(Math.random() * (len - 400)), amp = 0.25 + Math.random() * 0.6, w = 20 + Math.floor(Math.random() * 120);
      for (let j = 0; j < w; j++) d[at + j] += (Math.random() * 2 - 1) * amp * Math.pow(1 - j / w, 2);
    }
    return b;
  }
  function satCurve(amount) {
    const k = amount / 100 * 45, n = 1024, cv = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / (n - 1) - 1; cv[i] = k === 0 ? x : ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x)); }
    return cv;
  }
  // Realce de graves: toma los graves (<130 Hz), los "ensucia" con una curva asimétrica (nacen el 2.º y 3.er armónico, 200-500 Hz)
  // y suma solo esos armónicos. Un parlante de celular no reproduce 50 Hz, pero sí 150-400 Hz: el oído "completa" el grave.
  function harmCurve() {
    const n = 1024, cv = new Float32Array(n), off = Math.tanh(0.35);
    for (let i = 0; i < n; i++) { const x = i * 2 / (n - 1) - 1; cv[i] = Math.tanh(3.2 * x + 0.35) - off; }
    return cv;
  }
  const filterHz = pct => 20000 * Math.pow(500 / 20000, clamp(pct, 0, 100) / 100); // 0 % = abierto · 100 % = muy cerrado

  function makeEngine(c, dest) {
    const input = c.createGain();
    const sat = c.createWaveShaper(); sat.oversample = '2x'; sat.curve = satCurve(0);
    const satMakeup = c.createGain();
    const tone = c.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 18000;
    const user = c.createBiquadFilter(); user.type = 'lowpass'; user.frequency.value = 20000; user.Q.value = 0.9;
    const master = c.createGain(); master.gain.value = 0.85;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.14;
    input.connect(sat); sat.connect(satMakeup); satMakeup.connect(tone); tone.connect(user); user.connect(master); master.connect(comp); comp.connect(dest);
    const vinylGain = c.createGain(); vinylGain.gain.value = 0;
    const vinylHP = c.createBiquadFilter(); vinylHP.type = 'highpass'; vinylHP.frequency.value = 700;
    vinylGain.connect(master); vinylHP.connect(vinylGain);
    const hLP = c.createBiquadFilter(); hLP.type = 'lowpass'; hLP.frequency.value = 130; hLP.Q.value = 0.7;
    const hSh = c.createWaveShaper(); hSh.curve = harmCurve(); hSh.oversample = '2x';
    const hHP = c.createBiquadFilter(); hHP.type = 'highpass'; hHP.frequency.value = 170; hHP.Q.value = 0.7;
    const hGain = c.createGain(); hGain.gain.value = 0;
    input.connect(hLP); hLP.connect(hSh); hSh.connect(hHP); hHP.connect(hGain); hGain.connect(master);
    let vinylSrc = null;
    const rows = {}, OFFLINE = typeof OfflineAudioContext !== 'undefined' && c instanceof OfflineAudioContext;

    const E = {
      input, master, c,
      setKit(kitId) { const f = (KITS[kitId] || KITS.dusty).tone; if (OFFLINE) tone.frequency.value = f; else tone.frequency.setTargetAtTime(f, c.currentTime, 0.03); },
      setFx(fx) {
        const t = c.currentTime, v = clamp(fx.vinilo, 0, 100) / 100 * 0.5, hz = filterHz(fx.filtro), mk = 1 - clamp(fx.sat, 0, 100) / 100 * 0.35;
        sat.curve = satCurve(clamp(fx.sat, 0, 100));
        if (OFFLINE) { vinylGain.gain.value = v; user.frequency.value = hz; satMakeup.gain.value = mk; return; }  // al renderizar no hay "deslizamiento": ya nace con su sonido final
        vinylGain.gain.setTargetAtTime(v, t, 0.05);
        user.frequency.setTargetAtTime(hz, t, 0.03);
        satMakeup.gain.setTargetAtTime(mk, t, 0.03);
      },
      setBoost(on) { const v = on ? 1.7 : 0; if (OFFLINE) hGain.gain.value = v; else hGain.gain.setTargetAtTime(v, c.currentTime, 0.03); },
      startVinyl() { if (vinylSrc) return; vinylSrc = c.createBufferSource(); vinylSrc.buffer = vinylBuf(c); vinylSrc.loop = true; vinylSrc.connect(vinylHP); vinylSrc.start(); },
      stopVinyl() { if (!vinylSrc) return; try { vinylSrc.stop(); } catch (e) { } vinylSrc = null; },
      rowOut(key) { return rows[key] || (rows[key] = (() => { const g = c.createGain(); g.connect(input); return g; })()); },
      forgetRow(key) { const g = rows[key]; if (g) { try { g.disconnect(); } catch (e) { } delete rows[key]; } },
      trigger(inst, t, vel, note, kitId, out) { voice(c, INST[inst].type, t, vel, note, KITS[kitId] || KITS.dusty, out || input); }
    };
    return E;
  }

  // ---- Un envolvente simple: sube rápido y baja en exponencial ----
  function env(c, g, t, peak, dec, atk) {
    atk = atk || 0.002;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
  }
  function noiseHit(c, t, out, o) {
    const src = c.createBufferSource(); src.buffer = noiseBuf(c);
    const f = c.createBiquadFilter(); f.type = o.type || 'highpass'; f.frequency.value = o.f; if (o.q) f.Q.value = o.q;
    const g = c.createGain(); env(c, g, t, o.peak, o.dec, o.atk);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t, Math.random() * 1.2); src.stop(t + (o.atk || 0.002) + o.dec + 0.05);
  }
  function toneHit(c, t, out, o) {
    const osc = c.createOscillator(); osc.type = o.wave || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.fp || 0.05));
    const g = c.createGain(); env(c, g, t, o.peak, o.dec, o.atk);
    osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + (o.atk || 0.002) + o.dec + 0.05);
    return osc;
  }
  const noteHz = (base, idx) => base * Math.pow(2, NOTES[clamp(idx | 0, 0, NOTES.length - 1)] / 12);

  function voice(c, type, t, vel, note, K, out) {
    t = Math.max(t, c.currentTime); vel = clamp(vel, 0.05, 1);
    switch (type) {
      case 'kick':
        toneHit(c, t, out, { f0: K.k0, f1: K.k1, fp: K.kp, dec: K.kd, peak: 1.0 * vel });
        if (K.kclick > 0) noiseHit(c, t, out, { f: K.kclickF, peak: K.kclick * vel * 0.6, dec: 0.012 });
        break;
      case 'snare': {
        // Caja = ruido filtrado (2-5 kHz) + cuerpo tonal (180-250 Hz) + chasquido. Cada kit cambia el centro, el cuerpo y el estilo.
        if (K.sty === 'clap') {          // trap: clap seco y corto (tres golpecitos y una cola breve)
          [0, 0.009, 0.019].forEach(d => noiseHit(c, t + d, out, { type: 'bandpass', f: K.sF, q: K.sQ, peak: K.sn * vel, dec: 0.018 }));
          noiseHit(c, t + 0.019, out, { type: 'bandpass', f: K.sF * 0.8, q: K.sQ, peak: K.sn * 0.8 * vel, dec: K.sd });
          toneHit(c, t, out, { wave: 'triangle', f0: K.sbF * 1.2, f1: K.sbF, fp: 0.04, dec: K.sbd, peak: K.sbody * vel });
        } else if (K.sty === 'plastic') { // dembow: rim agudo "de plástico"
          toneHit(c, t, out, { wave: 'triangle', f0: K.sbF * 1.15, f1: K.sbF, fp: 0.02, dec: K.sbd, peak: K.sbody * vel });
          noiseHit(c, t, out, { type: 'bandpass', f: K.sF, q: K.sQ, peak: K.sn * vel, dec: K.sd });
          noiseHit(c, t, out, { f: 6500, peak: K.scrack * vel * 0.5, dec: 0.008 });
        } else {
          noiseHit(c, t, out, { type: 'bandpass', f: K.sF, q: K.sQ, peak: K.sn * vel, dec: K.sd });
          toneHit(c, t, out, { wave: 'triangle', f0: K.sbF * 1.3, f1: K.sbF, fp: 0.05, dec: K.sbd, peak: K.sbody * vel });
          if (K.scrack) noiseHit(c, t, out, { f: 6000, peak: K.scrack * vel * 0.5, dec: 0.012 });
        }
        break;
      }
      case 'hat': noiseHit(c, t, out, K.hband ? { type: 'bandpass', f: K.hhp, q: K.hband, peak: K.hl * vel, dec: K.hd } : { f: K.hhp, peak: K.hl * vel, dec: K.hd }); break;
      case 'hatopen': noiseHit(c, t, out, { f: K.hhp * 0.9, peak: K.hl * 0.95 * vel, dec: K.od, atk: 0.004 }); break;
      case 'palmas':
        [0, 0.011, 0.024].forEach(d => noiseHit(c, t + d, out, { type: 'bandpass', f: K.pF, q: 0.9, peak: 0.7 * vel, dec: 0.02 }));
        noiseHit(c, t + 0.024, out, { type: 'bandpass', f: K.pF * 0.9, q: 0.8, peak: 0.55 * vel, dec: K.pd });
        break;
      case 'clap': noiseHit(c, t, out, { type: 'bandpass', f: 1900, q: 1.2, peak: 0.8 * vel, dec: 0.07 }); break;
      case 'rim':
        toneHit(c, t, out, { wave: 'square', f0: 1750, dec: 0.025, peak: 0.28 * vel });
        noiseHit(c, t, out, { type: 'bandpass', f: 3000, q: 1.5, peak: 0.5 * vel, dec: 0.02 });
        break;
      case 'cowbell':
        [560, 845].forEach(f => toneHit(c, t, out, { wave: 'square', f0: f, dec: 0.26, peak: 0.16 * vel }));
        break;
      case 'crash':
        noiseHit(c, t, out, { f: 4800, peak: 0.55 * vel, dec: K.crashD, atk: 0.003 });
        noiseHit(c, t, out, { type: 'bandpass', f: 7800, q: 0.6, peak: 0.3 * vel, dec: K.crashD * 0.7 });
        break;
      case 'ride':
        noiseHit(c, t, out, { f: 8500, peak: 0.28 * vel, dec: 0.55 });
        [5200, 7400].forEach(f => toneHit(c, t, out, { f0: f, dec: 0.5, peak: 0.07 * vel }));
        break;
      case 'texture': {
        const src = c.createBufferSource(); src.buffer = noiseBuf(c);
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.2;
        f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.38);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.45 * vel, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        src.connect(f); f.connect(g); g.connect(out); src.start(t, Math.random()); src.stop(t + 0.5);
        break;
      }
      case 'bass': {
        const f = noteHz(55, note);
        if (K.b808) {   // 808: onda seno larga con deslizamiento + un armónico para que se oiga en parlantes chicos
          const dec = K.bdec || 0.75;
          const osc = toneHit(c, t, out, { f0: K.glide ? f * (K.bgl || 1.6) : f, f1: f, fp: K.glide ? 0.16 : 0.012, dec, peak: 0.9 * vel, atk: 0.004 });
          toneHit(c, t, out, { f0: f * 2, dec: dec * 0.5, peak: 0.18 * vel, atk: 0.004 });
          return osc;
        }
        const osc = c.createOscillator(); osc.type = K.bw || 'sawtooth'; osc.frequency.setValueAtTime(f, t);
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(K.bc0 || 900, t); lp.frequency.exponentialRampToValueAtTime(K.bc1 || 180, t + 0.3);
        const dec = K.bdec || 0.42, g = c.createGain(); env(c, g, t, 0.75 * vel, dec, 0.006);
        const sub = c.createOscillator(); sub.type = 'sine'; sub.frequency.setValueAtTime(f, t);
        const g2 = c.createGain(); env(c, g2, t, 0.55 * vel, dec + 0.03, 0.006);
        if (K.wob) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 3.2; lg.gain.value = 7 * K.wob; l.connect(lg); lg.connect(osc.detune); lg.connect(sub.detune); l.start(t); l.stop(t + dec + 0.1); }   // "tape": el bajo se desafina un poquito
        osc.connect(lp); lp.connect(g); g.connect(out); sub.connect(g2); g2.connect(out);
        osc.start(t); osc.stop(t + dec + 0.08); sub.start(t); sub.stop(t + dec + 0.08);
        break;
      }
      case 'sample': {
        const root = noteHz(220, note), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = K.sampLP; lp.Q.value = 0.7;
        const g = c.createGain(); env(c, g, t, 0.3 * vel, 0.55, 0.012); lp.connect(g); g.connect(out);
        [1, Math.pow(2, 3 / 12), Math.pow(2, 7 / 12)].forEach((r, i) => {
          const o = c.createOscillator(); o.type = i === 1 ? 'sine' : 'triangle'; o.frequency.value = root * r; o.detune.value = (i - 1) * 6;
          if (K.wob) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 4.5 + i; lg.gain.value = 9 * K.wob; l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + 0.7); }
          o.connect(lp); o.start(t); o.stop(t + 0.7);
        });
        break;
      }
    }
  }

  /* ---------------- Estado del beat ---------------- */
  const newRow = id => ({ inst: id, vol: 0.9, mute: false, solo: false, cells: new Array(MAXSTEPS).fill(0), notes: new Array(MAXSTEPS).fill(0) });
  function defaultState() {
    const st = { id: null, name: 'Mi primer beat', bpm: 95, swing: 0, kit: 'dusty', steps: 16, fx: Object.assign({}, KITS.dusty.fx), rows: PAD_IDS.map(newRow) };
    const set = (id, arr, v) => arr.forEach(i => { st.rows.find(r => r.inst === id).cells[i] = v || 3; });
    set('bombo', [0, 6, 8, 11]); set('caja', [4, 12]); set('hat', [0, 2, 4, 6, 8, 10, 12, 14], 2);
    set('bajo', [0, 8]); set('palmas', [12], 1);
    return st;
  }
  let st = defaultState();
  let playing = false, step = 0, nextTime = 0, timer = null, queue = [], raf = 0, E = null;
  let demo = null, demoCount = 0;                       // "▶ Escuchar kit": una demo de 2 compases que NO toca el patrón del usuario
  const cur = () => demo || st;
  let modoCel = lsGet('beats_cel', null); if (modoCel === null) modoCel = matchMedia('(pointer:coarse)').matches;   // celulares: realce de graves encendido
  const LOOKAHEAD = 0.14, TICK = 25;

  function engine() {
    const c = S.ctx();
    if (E && E.c === c) return E;
    E = makeEngine(c, c.destination);
    E.setKit(st.kit); E.setFx(st.fx); E.setBoost(modoCel);
    return E;
  }
  const anySolo = () => cur().rows.some(r => r.solo);
  const rowGain = r => (r.mute || (anySolo() && !r.solo)) ? 0 : r.vol;
  function syncRowGains() {
    if (!E) return;
    st.rows.forEach(r => E.rowOut(r.inst).gain.setTargetAtTime(rowGain(r), E.c.currentTime, 0.015));
  }
  const stepDur = () => 60 / cur().bpm / 4;

  function scheduleStep(i, t) {
    const s0 = cur(), e = engine(), sw = (i % 2 === 1) ? s0.swing / 100 * stepDur() * 0.5 : 0, at = t + sw;
    s0.rows.forEach(r => {
      const lv = r.cells[i]; if (!lv) return;
      const out = e.rowOut(r.inst); out.gain.value = rowGain(r);
      if (rowGain(r) > 0) e.trigger(r.inst, at, VEL[lv], r.notes[i], s0.kit, out);
    });
    queue.push({ i, time: at });
  }
  function pump() {
    const c = engine().c;
    while (nextTime < c.currentTime + LOOKAHEAD) {
      if (demo && demoCount >= demo.total) {            // la demo ya agendó sus 2 compases: se deja sonar la cola y se detiene
        if (!demo.ending) { const d = demo; d.ending = true; setTimeout(() => { if (demo === d) stop(); }, Math.max(100, (nextTime - c.currentTime + 1.2) * 1000)); }
        return;
      }
      scheduleStep(step, nextTime);
      nextTime += stepDur(); step = (step + 1) % cur().steps;
      if (demo) demoCount++;
    }
  }
  function play() {
    if (playing) return;
    demo = null;
    S.stopAll();                      // la base de la cabina y la grabación de escucha se detienen: un solo sonido a la vez
    const e = engine(); e.setFx(st.fx); e.setKit(st.kit); e.startVinyl();
    playing = true; step = 0; nextTime = e.c.currentTime + 0.06; queue = [];
    pump(); timer = setInterval(pump, TICK);
    raf = requestAnimationFrame(draw);
    ui.play();
  }
  function stop() {
    if (!playing) return;
    playing = false; clearInterval(timer); timer = null; cancelAnimationFrame(raf);
    if (E) E.stopVinyl();
    if (demo) { demo = null; if (E) { E.setFx(st.fx); E.setKit(st.kit); syncRowGains(); } }   // termina la demo: vuelve el sonido del usuario
    queue = []; ui.cursor(-1); ui.play(); ui.demo(false);
  }
  function demoKit(kitId) {
    const k = KITS[kitId], d = KIT_DEMO[kitId]; if (!k || !d) return;
    if (playing) { const era = demo && demo.kitId === kitId; stop(); if (era) return; }
    S.stopAll();
    const rows = Object.keys(d.p).map(id => { const r = newRow(id); d.p[id].forEach(i => { r.cells[i] = id === 'hat' ? 2 : 3; r.notes[i] = 0; }); return r; });
    demo = { kitId, kit: kitId, bpm: d.bpm, swing: d.swing, steps: 16, total: 32, fx: k.fx, rows, ending: false }; demoCount = 0;
    const e = engine(); e.setFx(k.fx); e.setKit(kitId); e.startVinyl();
    playing = true; step = 0; nextTime = e.c.currentTime + 0.06; queue = [];
    pump(); timer = setInterval(pump, TICK);
    raf = requestAnimationFrame(draw);
    ui.play(); ui.demo(kitId);
  }
  function draw() {
    if (!playing) return;
    const now = E.c.currentTime - (E.c.outputLatency || E.c.baseLatency || 0);
    let cur = -1;
    while (queue.length && queue[0].time <= now) cur = queue.shift().i;
    if (cur >= 0 && !demo) ui.cursor(cur);
    raf = requestAnimationFrame(draw);
  }

  /* ---------------- Pads ---------------- */
  function hitPad(id, el) {
    const e = engine();
    const out = e.rowOut('pad:' + id); out.gain.value = 1;
    const row = st.rows.find(r => r.inst === id);
    e.trigger(id, e.c.currentTime + 0.001, 1, row ? firstNote(row) : 0, st.kit, out);
    if (el) { el.classList.add('hit'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('hit'), 130); }
  }
  const firstNote = r => { const i = r.cells.findIndex(v => v); return i >= 0 ? r.notes[i] : 0; };

  /* ---------------- Interfaz ---------------- */
  const ui = { demo: () => { } };
  const padsEl = $('#btPads'), seqEl = $('#btSeq'), statusEl = $('#btStatus');
  const noteMode = {};            // fila → true si los clics eligen nota
  let sayT = null;
  function say(msg) { statusEl.textContent = msg; clearTimeout(sayT); sayT = setTimeout(() => { statusEl.textContent = ''; }, 3500); }
  const mk = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

  const audioListo = () => { try { return S.ctx().state === 'running'; } catch (e) { return false; } };
  function buildPads() {
    padsEl.textContent = '';
    PAD_IDS.forEach(id => {
      const d = INST[id], b = mk('button', 'bt-pad'); b.type = 'button'; b.dataset.pad = id; b.style.setProperty('--c', d.c);
      b.setAttribute('aria-label', d.n + ', tecla ' + d.key);
      const top = mk('span', 'bt-pad-top'); top.append(mk('i', 'bt-pad-key', d.key), mk('i', 'bt-pad-n', String(PAD_IDS.indexOf(id) + 1).padStart(2, '0')));
      b.append(top, mk('b', 'bt-pad-name', d.n), mk('small', 'bt-pad-sub', d.sub));
      let espera = false;
      b.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); if (audioListo()) hitPad(id, b); else espera = true; });
      const sonar = () => { if (espera) { espera = false; hitPad(id, b); } };
      b.addEventListener('pointerup', () => { if (espera) setTimeout(sonar, 350); });                   // primer toque: el audio despierta con el gesto...
      b.addEventListener('click', sonar);                                                              // ...y el pad suena justo después (no se pierde)
      b.addEventListener('pointercancel', () => { espera = false; });
      b.addEventListener('contextmenu', e => e.preventDefault());
      b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) hitPad(id, b); } });
      padsEl.append(b);
    });
  }

  function cellLabel(r, i) {
    const d = INST[r.inst], lv = r.cells[i];
    return d.n + ' paso ' + (i + 1) + ': ' + (lv ? 'encendido, golpe ' + INT_NAME[lv] + (d.melodic ? ', nota ' + NOTE_NAMES[r.notes[i]] : '') : 'apagado');
  }
  function paintCell(btn, r, i) {
    const lv = r.cells[i];
    btn.classList.toggle('on', !!lv); btn.style.setProperty('--lv', lv ? [0, 0.4, 0.7, 1][lv] : 0);
    btn.setAttribute('aria-pressed', String(!!lv)); btn.setAttribute('aria-label', cellLabel(r, i));
    if (INST[r.inst].melodic) btn.dataset.note = lv ? NOTE_NAMES[r.notes[i]] : '';
  }
  function cycleCell(r, i, btn, dir, fromLong) {
    if (noteMode[r.inst] && INST[r.inst].melodic) {
      if (!r.cells[i]) r.cells[i] = 3;
      r.notes[i] = (r.notes[i] + (dir < 0 ? NOTES.length - 1 : 1)) % NOTES.length;
    } else if (fromLong) {
      r.cells[i] = r.cells[i] ? (r.cells[i] === 1 ? 3 : r.cells[i] - 1) : 1;
    } else {
      r.cells[i] = r.cells[i] ? 0 : 3;
    }
    paintCell(btn, r, i);
    if (r.cells[i] && !playing) previewCell(r, i);
    dirty();
  }
  function previewCell(r, i) {
    const e = engine(), out = e.rowOut('pad:' + r.inst); out.gain.value = rowGain(r) || 0.9;
    e.trigger(r.inst, e.c.currentTime + 0.001, VEL[r.cells[i]], r.notes[i], st.kit, out);
  }

  function buildSeq() {
    seqEl.textContent = '';
    seqEl.style.setProperty('--steps', st.steps);
    // fila de números de paso
    const head = mk('div', 'bt-row bt-row-head'); head.append(mk('div', 'bt-lab'));
    const nums = mk('div', 'bt-cells');
    for (let i = 0; i < st.steps; i++) { const n = mk('span', 'bt-num' + (i % 4 === 0 ? ' beat' : ''), String(i + 1).padStart(2, '0')); n.dataset.i = i; nums.append(n); }
    head.append(nums); seqEl.append(head);

    st.rows.forEach(r => {
      const d = INST[r.inst], row = mk('div', 'bt-row'); row.dataset.inst = r.inst; row.style.setProperty('--c', d.c);
      const lab = mk('div', 'bt-lab');
      const name = mk('span', 'bt-lab-name'); name.append(mk('i', 'bt-dot'), mk('b', null, d.n), mk('em', null, d.key));
      const tools = mk('span', 'bt-lab-tools');
      const bM = mk('button', 'bt-mini' + (r.mute ? ' on' : ''), 'M'); bM.type = 'button'; bM.title = 'Silenciar'; bM.setAttribute('aria-label', 'Silenciar ' + d.n); bM.setAttribute('aria-pressed', String(r.mute));
      bM.addEventListener('click', () => { r.mute = !r.mute; bM.classList.toggle('on', r.mute); bM.setAttribute('aria-pressed', String(r.mute)); refreshRowStates(); syncRowGains(); dirty(); });
      const bS = mk('button', 'bt-mini solo' + (r.solo ? ' on' : ''), 'S'); bS.type = 'button'; bS.title = 'Solo (escuchar solo esta fila)'; bS.setAttribute('aria-label', 'Solo ' + d.n); bS.setAttribute('aria-pressed', String(r.solo));
      bS.addEventListener('click', () => { r.solo = !r.solo; bS.classList.toggle('on', r.solo); bS.setAttribute('aria-pressed', String(r.solo)); refreshRowStates(); syncRowGains(); dirty(); });
      tools.append(bM, bS);
      if (d.melodic) {
        const bN = mk('button', 'bt-mini note' + (noteMode[r.inst] ? ' on' : ''), '♪'); bN.type = 'button'; bN.title = 'Elegir la nota de cada paso'; bN.setAttribute('aria-label', 'Elegir notas de ' + d.n); bN.setAttribute('aria-pressed', String(!!noteMode[r.inst]));
        bN.addEventListener('click', () => { noteMode[r.inst] = !noteMode[r.inst]; bN.classList.toggle('on', !!noteMode[r.inst]); bN.setAttribute('aria-pressed', String(!!noteMode[r.inst])); row.classList.toggle('notes', !!noteMode[r.inst]); say(noteMode[r.inst] ? d.n + ': toca un paso para cambiar su nota (clic derecho = bajar).' : d.n + ': vuelven los clics normales.'); });
        tools.append(bN);
      }
      const bD = mk('button', 'bt-mini del', '✕'); bD.type = 'button'; bD.title = 'Quitar esta fila'; bD.setAttribute('aria-label', 'Quitar ' + d.n);
      bD.addEventListener('click', () => removeRow(r.inst));
      tools.append(bD);
      const vol = document.createElement('input'); vol.type = 'range'; vol.min = 0; vol.max = 100; vol.value = Math.round(r.vol * 100); vol.className = 'bt-vol'; vol.setAttribute('aria-label', 'Volumen de ' + d.n);
      vol.addEventListener('input', () => { r.vol = vol.value / 100; syncRowGains(); dirty(); });
      lab.append(name, tools, vol);

      const cells = mk('div', 'bt-cells');
      for (let i = 0; i < st.steps; i++) {
        const b = mk('button', 'bt-cell' + (i % 4 === 0 ? ' beat' : '')); b.type = 'button'; b.dataset.i = i;
        paintCell(b, r, i);
        let lp = null, fired = false, lpAt = 0;
        b.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; fired = false; clearTimeout(lp); lp = setTimeout(() => { fired = true; lpAt = Date.now(); cycleCell(r, i, b, 1, true); }, 480); });
        const cancel = () => clearTimeout(lp);
        b.addEventListener('pointerup', cancel); b.addEventListener('pointerleave', cancel); b.addEventListener('pointercancel', cancel);
        b.addEventListener('click', () => { if (fired) { fired = false; return; } cycleCell(r, i, b, 1, false); });
        b.addEventListener('contextmenu', e => { e.preventDefault(); clearTimeout(lp); if (Date.now() - lpAt < 900) return; fired = true; setTimeout(() => { fired = false; }, 60); cycleCell(r, i, b, noteMode[r.inst] ? -1 : 1, true); });
        cells.append(b);
      }
      row.classList.toggle('notes', !!noteMode[r.inst]);
      row.append(lab, cells); seqEl.append(row);
    });
    refreshRowStates();
    buildAddMenu();
    buildTrack();
  }
  function refreshRowStates() {
    const solo = anySolo();
    seqEl.querySelectorAll('.bt-row[data-inst]').forEach(row => {
      const r = st.rows.find(x => x.inst === row.dataset.inst); if (!r) return;
      row.classList.toggle('off', r.mute || (solo && !r.solo));
    });
    paintLaneState();
  }
  function repaintAll() {
    st.rows.forEach(r => {
      const row = seqEl.querySelector('.bt-row[data-inst="' + r.inst + '"]'); if (!row) return;
      row.querySelectorAll('.bt-cell').forEach(b => paintCell(b, r, +b.dataset.i));
    });
  }
  ui.cursor = i => {
    seqEl.querySelectorAll('.cur').forEach(n => n.classList.remove('cur'));
    ui.head(i);
    if (i < 0) return;
    if (playing) seguir(i);
    seqEl.querySelectorAll('[data-i="' + i + '"]').forEach(n => n.classList.add('cur'));
  };
  ui.play = () => {
    ['#btPlay', '#btFab'].forEach(sel => {
      const b = $(sel); b.classList.toggle('on', playing); b.setAttribute('aria-pressed', String(playing));
      b.setAttribute('aria-label', playing ? 'Detener el beat' : 'Reproducir el beat');
    });
  };
  // En pantallas angostas el patrón no cabe: mientras suena, el desplazamiento sigue al cursor (si tú no lo estás moviendo)
  const scroller = $('#btSeqScroll'); let manoHasta = 0;
  ['touchstart', 'wheel', 'pointerdown'].forEach(ev => scroller.addEventListener(ev, () => { manoHasta = Date.now() + 3000; }, { passive: true }));
  function seguir(i) {
    if (Date.now() < manoHasta || scroller.scrollWidth <= scroller.clientWidth + 2) return;
    const cell = seqEl.querySelector('.bt-row[data-inst] .bt-cell[data-i="' + i + '"]'); if (!cell) return;
    const lab = seqEl.querySelector('.bt-lab'), labW = lab ? lab.offsetWidth : 0, x = cell.offsetLeft, v0 = scroller.scrollLeft + labW, v1 = scroller.scrollLeft + scroller.clientWidth - cell.offsetWidth;
    if (x < v0 || x > v1) scroller.scrollTo({ left: Math.max(0, x - labW - 8), behavior: i === 0 ? 'auto' : 'smooth' });
  }

  function removeRow(id) {
    const r = st.rows.find(x => x.inst === id); if (!r) return;
    if (st.rows.length <= 1) { say('Deja al menos un instrumento en el patrón.'); return; }
    st.rows = st.rows.filter(x => x !== r); delete noteMode[id]; stash[id] = r;
    if (E) E.forgetRow(id);
    buildSeq(); syncRowGains(); dirty(); say(INST[id].n + ' quitado. Lo recuperas en "+ Añadir instrumento".');
  }
  function addRow(id) {
    if (!INST[id] || st.rows.some(r => r.inst === id)) return;
    st.rows.push(seedRow(id)); buildSeq(); dirty(); say(INST[id].n + ' añadido al final del patrón.');
  }
  function buildAddMenu() {
    const menu = $('#btAddMenu'); menu.textContent = '';
    const libres = PAD_IDS.concat(EXTRA_IDS).filter(id => !st.rows.some(r => r.inst === id));
    libres.forEach(id => {
      const b = mk('button', 'bt-add-item'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.style.setProperty('--c', INST[id].c);
      b.append(mk('i', 'bt-dot'), mk('span', null, INST[id].n), mk('em', null, INST[id].sub));
      b.addEventListener('click', () => { closeAdd(); addRow(id); });
      menu.append(b);
    });
    if (!libres.length) menu.append(mk('p', 'hint', 'Ya tienes todos los instrumentos en el patrón.'));
  }
  function closeAdd() { $('#btAddMenu').classList.add('hidden'); $('#btAddInst').setAttribute('aria-expanded', 'false'); }
  $('#btAddInst').addEventListener('click', () => {
    const m = $('#btAddMenu'), open = m.classList.contains('hidden');
    m.classList.toggle('hidden', !open); $('#btAddInst').setAttribute('aria-expanded', String(open));
    if (open) { const f = m.querySelector('button'); if (f) f.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.bt-add-wrap')) closeAdd(); });
  $('#btAddMenu').addEventListener('keydown', e => { if (e.key === 'Escape') { closeAdd(); $('#btAddInst').focus(); } });

  /* ---------------- Controles: tempo, swing, kit, pasos, efectos ---------------- */
  const kitSel = $('#btKit');
  KIT_IDS.forEach(id => { const o = document.createElement('option'); o.value = id; o.textContent = KITS[id].n; kitSel.append(o); });
  function setTempo(v, silencioso) {
    st.bpm = clamp(Math.round(num(v, st.bpm)), 60, 180); $('#btTempo').value = st.bpm; if (!silencioso) dirty();
  }
  // − y +: un toque cambia 1; mantener pulsado repite (cada vez más rápido), con dedo, mouse o lápiz. El teclado (Enter/Espacio) sigue con "click".
  function mantener(btn, paso) {
    let t = 0, n = 0, usado = false;
    const parar = () => { clearTimeout(t); t = 0; };
    const dar = () => { setTempo(st.bpm + paso); n++; t = setTimeout(dar, n > 12 ? 40 : n > 5 ? 80 : 160); };
    btn.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); usado = true; n = 0; parar(); setTempo(st.bpm + paso); t = setTimeout(dar, 420); });
    ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach(ev => btn.addEventListener(ev, parar));
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('click', e => { if (usado) { usado = false; return; } if (e.detail === 0) setTempo(st.bpm + paso); });   // detail 0 = teclado
  }
  mantener($('#btTempoDown'), -1); mantener($('#btTempoUp'), 1);
  $('#btTempo').addEventListener('change', e => setTempo(e.target.value));
  $('#btTempo').addEventListener('keydown', e => { if (e.key === 'Enter') setTempo(e.target.value); });
  function setSwing(v) { st.swing = clamp(Math.round(num(v, 0)), 0, 70); $('#btSwing').value = st.swing; $('#btSwingVal').textContent = st.swing + '%'; }
  $('#btSwing').addEventListener('input', e => { setSwing(e.target.value); dirty(); });
  function setKit(id, aplicarFx) {
    st.kit = KITS[id] && (esPro() || !KITS[id].pro) ? id : 'dusty'; kitSel.value = st.kit; $('#btKitDesc').textContent = KITS[st.kit].desc;
    if (aplicarFx) setFx(KITS[st.kit].fx);
    if (E) E.setKit(st.kit);
  }
  kitSel.addEventListener('change', () => { setKit(kitSel.value, true); dirty(); say('Kit "' + KITS[st.kit].n + '" listo. Los efectos se ajustaron al estilo del kit.'); });
  function setLen(n) {
    n = n === 32 ? 32 : 16;
    if (n === 32 && st.steps === 16) {   // al pasar a 32, la segunda mitad copia la primera si está vacía (ya suena de una vez)
      st.rows.forEach(r => { if (!r.cells.slice(16).some(v => v)) for (let i = 0; i < 16; i++) { r.cells[16 + i] = r.cells[i]; r.notes[16 + i] = r.notes[i]; } });
    }
    st.steps = n; if (step >= n) step = 0;
    $('#btLen16').classList.toggle('on', n === 16); $('#btLen32').classList.toggle('on', n === 32);
    $('#btLen16').setAttribute('aria-pressed', String(n === 16)); $('#btLen32').setAttribute('aria-pressed', String(n === 32));
    buildSeq();
  }
  ui.demo = kitId => { const b = $('#btKitListen'); b.classList.toggle('on', !!kitId); b.textContent = kitId ? '■ Parar el kit' : '▶ Escuchar kit'; };
  $('#btKitListen').addEventListener('click', () => demoKit(st.kit));
  // Modo celular: realce de graves (solo en vivo; al exportar o renderizar nunca se aplica)
  $('#btCel').checked = modoCel;
  $('#btCel').addEventListener('change', e => { modoCel = e.target.checked; lsSet('beats_cel', modoCel); if (E) E.setBoost(modoCel); say(modoCel ? 'Modo celular: se realzan los graves para que se oigan en parlantes chicos. La exportación sale sin realce.' : 'Modo celular apagado.'); });
  document.querySelectorAll('[data-len]').forEach(b => b.addEventListener('click', () => { setLen(+b.dataset.len); dirty(); }));

  const FXS = [['vinilo', '#btFxVinyl', '#btFxVinylVal'], ['filtro', '#btFxFilter', '#btFxFilterVal'], ['sat', '#btFxSat', '#btFxSatVal']];
  function setFx(fx) {
    FXS.forEach(([k, sel, val]) => { st.fx[k] = clamp(Math.round(num(fx[k], 0)), 0, 100); $(sel).value = st.fx[k]; $(val).textContent = st.fx[k] + '%'; });
    if (E) E.setFx(st.fx);
  }
  FXS.forEach(([k, sel]) => $(sel).addEventListener('input', e => { setFx(Object.assign({}, st.fx, { [k]: e.target.value })); dirty(); }));

  $('#btName').addEventListener('input', e => { st.name = e.target.value.slice(0, 40); dirty(); });
  $('#btPlay').addEventListener('click', () => { if (playing) stop(); else play(); });
  $('#btFab').addEventListener('click', () => { if (playing) stop(); else play(); });
  $('#btClear').addEventListener('click', () => {
    st.rows.forEach(r => { r.cells.fill(0); r.notes.fill(0); });
    repaintAll(); dirty(); say('Patrón limpio. Hoja en blanco.');
  });

  /* Sorpréndeme: un patrón al azar con sentido (golpes fuertes donde suenan bien) */
  const chance = p => Math.random() < p;
  function randomize() {
    const n = st.steps, inten = () => [2, 3, 3][Math.floor(Math.random() * 3)];
    st.rows.forEach(r => {
      r.cells.fill(0); r.notes.fill(0);
      for (let i = 0; i < n; i++) {
        const b = i % 16, beat = b % 4 === 0, off = b % 4 === 2, any = !beat && !off;
        let on = false;
        switch (r.inst) {
          case 'bombo': on = b === 0 || (b === 8 && chance(0.85)) || (beat && chance(0.18)) || (any && chance(0.12)) || (b === 10 && chance(0.35)); break;
          case 'caja': on = b === 4 || b === 12 || (any && chance(0.05)); break;
          case 'hat': on = off || beat ? chance(0.92) : chance(0.35); break;
          case 'hatopen': on = (b === 14 || b === 6) && chance(0.45); break;
          case 'bajo': on = (b === 0 || b === 8 || b === 11 || b === 14) && chance(0.7); break;
          case 'sample': on = (b === 0 || b === 6 || b === 10) && chance(0.6); break;
          case 'palmas': on = b === 12 && chance(0.6); break;
          case 'textura': on = b === 15 && chance(0.4); break;
          case 'crash': on = b === 0 && i === 0 && chance(0.7); break;
          case 'ride': on = off && chance(0.6); break;
          case 'clap': on = (b === 4 || b === 12) && chance(0.4); break;
          case 'rim': on = (b === 7 || b === 13) && chance(0.4); break;
          case 'cowbell': on = beat && chance(0.3); break;
        }
        if (on) { r.cells[i] = inten(); if (INST[r.inst].melodic) r.notes[i] = [0, 0, 2, 3, 4][Math.floor(Math.random() * 5)]; }
      }
    });
    repaintAll(); dirty(); say('¡Sorpresa! Cambia lo que quieras, o pulsa otra vez.');
  }
  $('#btRandom').addEventListener('click', () => sorprende());

  /* ---------------- Mis beats ---------------- */
  const KEY = 'beats', MAX_BEATS = 40;
  let savedDirty = false;
  function dirty() { savedDirty = true; paintTicks(); paintLaneState(); scheduleWave(); }

  function serialize(s) {
    return { id: s.id, name: s.name, bpm: s.bpm, swing: s.swing, kit: s.kit, steps: s.steps, fx: Object.assign({}, s.fx), ts: Date.now(),
      rows: s.rows.map(r => ({ inst: r.inst, vol: +r.vol.toFixed(2), mute: !!r.mute, solo: !!r.solo, cells: r.cells.slice(), notes: r.notes.slice() })) };
  }
  // Todo lo que viene del almacenamiento se limpia: solo instrumentos conocidos y números dentro de rango
  function sanitize(o) {
    if (!o || typeof o !== 'object') return null;
    const rows = [], seen = {};
    (Array.isArray(o.rows) ? o.rows : []).slice(0, 16).forEach(x => {
      if (!x || !INST[x.inst] || seen[x.inst]) return; seen[x.inst] = 1;
      const r = newRow(x.inst);
      r.vol = clamp(num(x.vol, 0.9), 0, 1); r.mute = x.mute === true; r.solo = x.solo === true;
      for (let i = 0; i < MAXSTEPS; i++) {
        r.cells[i] = clamp(Math.round(num(x.cells && x.cells[i], 0)), 0, 3);
        r.notes[i] = clamp(Math.round(num(x.notes && x.notes[i], 0)), 0, NOTES.length - 1);
      }
      rows.push(r);
    });
    if (!rows.length) return null;
    const kit = KITS[o.kit] ? o.kit : 'dusty', f = o.fx && typeof o.fx === 'object' ? o.fx : {};
    return { id: typeof o.id === 'string' ? o.id.slice(0, 40) : null, name: String(o.name == null ? 'Beat' : o.name).slice(0, 40) || 'Beat',
      bpm: clamp(Math.round(num(o.bpm, 95)), 60, 180), swing: clamp(Math.round(num(o.swing, 0)), 0, 70), kit, steps: o.steps === 32 ? 32 : 16,
      fx: { vinilo: clamp(Math.round(num(f.vinilo, 0)), 0, 100), filtro: clamp(Math.round(num(f.filtro, 0)), 0, 100), sat: clamp(Math.round(num(f.sat, 0)), 0, 100) },
      rows, ts: num(o.ts, 0) };
  }
  const readAll = () => { const a = lsGet(KEY, []); return (Array.isArray(a) ? a : []).map(sanitize).filter(Boolean).slice(0, MAX_BEATS).map((b, i) => { if (!b.id) b.id = 'r' + i + '-' + (b.ts || 0); return b; }); };
  const writeAll = list => lsSet(KEY, list.map(b => { const s = serialize(b); s.id = b.id; s.ts = b.ts || Date.now(); return s; }));
  const newId = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function loadState(s) {
    stop();
    st = s;
    Object.keys(noteMode).forEach(k => delete noteMode[k]);
    $('#btName').value = st.name; setTempo(st.bpm, true); setSwing(st.swing); setKit(st.kit, false); setFx(st.fx);
    setLen(st.steps);
    if (E) syncRowGains();
    savedDirty = false; scheduleWave();
  }
  function save() {
    const list = readAll(), copy = sanitize(serialize(st));
    if (!st.id) {
      if (list.length >= MAX_BEATS) { say('Llegaste al límite de ' + MAX_BEATS + ' beats guardados. Borra alguno para guardar otro.'); return; }
      st.id = newId();
    }
    copy.id = st.id; copy.ts = Date.now();
    const i = list.findIndex(b => b.id === st.id);
    if (i >= 0) list[i] = copy; else list.unshift(copy);
    if (!writeAll(list)) { say('No se pudo guardar: el navegador no deja usar su almacenamiento.'); return; }
    savedDirty = false; renderMine(); say('Guardado "' + st.name + '" en Mis beats.');
  }
  $('#btSave').addEventListener('click', save);

  let renaming = '', confirmDel = '';
  function renderMine() {
    const list = readAll(), ul = $('#btMine'); ul.textContent = '';
    $('#btMineEmpty').classList.toggle('hidden', list.length > 0);
    list.forEach(b => {
      const li = mk('li', 'bt-mine-item' + (b.id === st.id ? ' cur' : '')); li.dataset.id = b.id;
      const info = mk('div', 'bt-mine-info');
      if (renaming === b.id) {
        const inp = mk('input'); inp.type = 'text'; inp.maxLength = 40; inp.value = b.name; inp.setAttribute('aria-label', 'Nuevo nombre del beat');
        const ok = () => { const all = readAll(), x = all.find(z => z.id === b.id); if (x) { x.name = inp.value.trim().slice(0, 40) || x.name; writeAll(all); if (st.id === b.id) { st.name = x.name; $('#btName').value = st.name; } } renaming = ''; renderMine(); };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') { renaming = ''; renderMine(); } });
        info.append(inp); setTimeout(() => { inp.focus(); inp.select(); }, 0);
        const bOk = mk('button', 'btn btn-small', 'Listo'); bOk.type = 'button'; bOk.addEventListener('click', ok);
        li.append(info, bOk); ul.append(li); return;
      }
      info.append(mk('b', null, b.name), mk('small', null, b.bpm + ' BPM · ' + KITS[b.kit].n + ' · ' + b.steps + ' pasos · ' + b.rows.length + ' instrumentos'));
      const acts = mk('div', 'bt-mine-acts');
      const act = (txt, fn, cls) => { const x = mk('button', 'btn btn-ghost btn-small' + (cls ? ' ' + cls : ''), txt); x.type = 'button'; x.addEventListener('click', fn); acts.append(x); return x; };
      act('Cargar', () => { loadState(sanitize(b)); renderMine(); say('Cargado "' + b.name + '".'); });
      act('Duplicar', () => {
        const all = readAll(); if (all.length >= MAX_BEATS) { say('Llegaste al límite de ' + MAX_BEATS + ' beats.'); return; }
        const c = sanitize(b); c.id = newId(); c.name = (b.name + ' (copia)').slice(0, 40); c.ts = Date.now(); all.unshift(c); writeAll(all); renderMine(); say('Duplicado.');
      });
      act('Renombrar', () => { renaming = b.id; renderMine(); });
      act(confirmDel === b.id ? '¿Seguro? Borrar' : 'Borrar', () => {
        if (confirmDel !== b.id) { confirmDel = b.id; renderMine(); setTimeout(() => { if (confirmDel === b.id) { confirmDel = ''; renderMine(); } }, 4000); return; }
        confirmDel = ''; writeAll(readAll().filter(z => z.id !== b.id)); if (st.id === b.id) st.id = null; renderMine(); say('Borrado.');
      }, 'btn-danger');
      li.append(info, acts); ul.append(li);
    });
  }

  /* ---------------- Parte 3 · Tu pista: onda, capas, "Usar en la cabina" y descargar .WAV ---------------- */
  const CEIL = 0.95;                  // techo del limitador: −0,45 dBFS (nada pasa de aquí)
  const MAX_WAV_MB = 60, MAKEUP = 1.7;
  const esPro = () => true;           // por ahora todo es gratis; aquí se decidirá qué es Pro (kits y exportación) cuando haya cobro

  // Limitador de pico con "mirada hacia adelante" (5 ms): baja el volumen un poco antes de cada pico, sin cortar la onda
  function limitar(buf, ceil, lookSec) {
    const n = buf.length, nch = buf.numberOfChannels, W = Math.max(2, Math.round(lookSec * buf.sampleRate)), ch = [];
    for (let c = 0; c < nch; c++) ch.push(buf.getChannelData(c));
    const need = new Float32Array(n);
    for (let i = 0; i < n; i++) { let m = 0; for (let c = 0; c < nch; c++) { const a = Math.abs(ch[c][i]); if (a > m) m = a; } need[i] = m > ceil ? ceil / m : 1; }
    // mw[j] = mínimo de need[j .. j+W-1] (mínimo móvil hacia adelante, con una cola doble)
    const mw = new Float32Array(n), dq = new Int32Array(n); let h = 0, t = 0;
    for (let j = n - 1; j >= 0; j--) {
      while (t > h && need[dq[t - 1]] >= need[j]) t--;
      dq[t++] = j;
      while (dq[h] > j + W - 1) h++;
      mw[j] = need[dq[h]];
    }
    // gain[i] = promedio de mw[i-W+1 .. i]  →  siempre ≤ need[i], y la bajada es suave (sin chasquidos)
    let acc = W * mw[0], maxCut = 1;
    for (let i = 0; i < n; i++) {
      if (i > 0) acc += mw[i] - mw[Math.max(i - W, 0)];
      const g = acc / W; if (g < maxCut) maxCut = g;
      for (let c = 0; c < nch; c++) { const v = ch[c][i] * g; ch[c][i] = v > ceil ? ceil : v < -ceil ? -ceil : v; }
    }
    return maxCut;
  }

  // Dibuja el beat completo con el motor de sonido en un contexto "offline" y lo devuelve en bucle perfecto
  async function renderBeat(s, bars) {
    const sr = 44100, sd = 60 / s.bpm / 4, total = bars * 16, loopN = Math.round(total * sd * sr), tailN = Math.round(2.2 * sr);
    const oc = new OfflineAudioContext(2, loopN + tailN, sr), e = makeEngine(oc, oc.destination);
    e.setKit(s.kit); e.setFx(s.fx); e.startVinyl();
    const solo = s.rows.some(r => r.solo), gainOf = r => (r.mute || (solo && !r.solo)) ? 0 : r.vol;
    s.rows.forEach(r => { e.rowOut(r.inst).gain.value = gainOf(r); });
    for (let i = 0; i < total; i++) {
      const idx = i % s.steps, at = i * sd + (idx % 2 === 1 ? s.swing / 100 * sd * 0.5 : 0);
      s.rows.forEach(r => { const lv = r.cells[idx]; if (lv && gainOf(r) > 0) e.trigger(r.inst, at, VEL[lv], r.notes[idx], s.kit, e.rowOut(r.inst)); });
    }
    const raw = await oc.startRendering();
    const out = new AudioBuffer({ length: loopN, numberOfChannels: 2, sampleRate: sr });
    for (let c = 0; c < 2; c++) {
      const src = raw.getChannelData(c), dst = out.getChannelData(c);
      dst.set(src.subarray(0, loopN));
      for (let i = 0; i < tailN && i < loopN; i++) dst[i] += src[loopN + i];   // la cola del último golpe se enlaza con el inicio: el bucle no "salta"
    }
    for (let c = 0; c < 2; c++) { const d = out.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= MAKEUP; }   // sube el nivel (+4,6 dB) y el limitador recorta solo los picos
    limitar(out, CEIL, 0.005);
    return out;
  }
  function medir(buf) {
    let pk = 0, sum = 0, clip = 0, n = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; if (a >= 0.999) clip++; sum += d[i] * d[i]; n++; } }
    return { peak: pk, rms: Math.sqrt(sum / Math.max(1, n)), clip };
  }
  const nombreSeguro = () => (st.name || 'beat').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'beat';
  const hayGolpes = () => st.rows.some(r => !r.mute && r.cells.slice(0, st.steps).some(v => v));

  // --- Onda del beat y capas
  const waveEl = $('#btWave'), lanesEl = $('#btLanes'), chipsEl = $('#btChips'), trackEl = $('#btTrack');
  const stash = {};                   // filas quitadas: si las vuelves a añadir, recuperan su patrón
  let wavePeaks = null, waveTimer = 0, waveTok = 0, waveStale = true;
  const SEED = { bombo: [0, 8], caja: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatopen: [14], bajo: [0, 8], sample: [0], palmas: [12], textura: [15], crash: [0], ride: [2, 6, 10, 14], clap: [4, 12], rim: [7, 13], cowbell: [0, 8] };
  function seedRow(id) {
    if (stash[id]) { const r = stash[id]; delete stash[id]; return r; }
    const r = newRow(id); (SEED[id] || []).forEach(i => { r.cells[i] = 3; r.cells[16 + i] = 3; }); r.vol = id === 'crash' || id === 'ride' ? 0.7 : 0.9; return r;
  }
  function paintWave() {
    if (!wavePeaks) return;
    const w = Math.max(200, waveEl.clientWidth), h = 84, dpr = Math.min(2, window.devicePixelRatio || 1);
    waveEl.width = Math.round(w * dpr); waveEl.height = Math.round(h * dpr);
    const g = waveEl.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.fillStyle = '#151515'; g.fillRect(0, 0, w, h);
    for (let i = 0; i <= st.steps; i++) { g.fillStyle = i % 16 === 0 ? 'rgba(255,255,255,.28)' : i % 4 === 0 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.04)'; g.fillRect(Math.round(i / st.steps * (w - 1)), 0, 1, h); }
    g.fillStyle = '#DEFC07';
    for (let x = 0; x < w; x++) {
      const a = Math.floor(x / w * wavePeaks.length), b = Math.max(a + 1, Math.floor((x + 1) / w * wavePeaks.length)); let m = 0;
      for (let k = a; k < b && k < wavePeaks.length; k++) if (wavePeaks[k] > m) m = wavePeaks[k];
      const hh = Math.max(1, m * (h / 2 - 4)); g.fillRect(x, h / 2 - hh, 1, hh * 2);
    }
  }
  let loopBuf = null, loopBars = 1, wavePromise = null;       // el patrón de 1 o 2 compases ya dibujado: es la pista "Mi beat" de la línea de tiempo
  function drawWave() { wavePromise = drawWaveInner(); return wavePromise; }
  async function drawWaveInner() {
    const tok = ++waveTok;
    try {
      const buf = await renderBeat(st, st.steps / 16); if (tok !== waveTok) return;
      loopBuf = buf; loopBars = st.steps / 16;
      const d = buf.getChannelData(0), P = 900, per = d.length / P; wavePeaks = new Float32Array(P);
      for (let p = 0; p < P; p++) { let m = 0; const a = Math.floor(p * per), b = Math.floor((p + 1) * per), step = Math.max(1, (b - a) >> 6); for (let i = a; i < b; i += step) { const v = Math.abs(d[i]); if (v > m) m = v; } wavePeaks[p] = m; }
      waveStale = false; paintWave(); if (S.tlRefresh) S.tlRefresh();
    } catch (e) { /* sin audio offline: la pista queda sin onda, el beat sigue funcionando */ }
  }
  function scheduleWave() {
    waveStale = true; clearTimeout(waveTimer);
    if (!window.Cabina || Cabina.modo() !== 'beats') return;
    waveTimer = setTimeout(drawWave, 260);
  }
  // Se lo presto a la línea de tiempo (app.js): ella pide el patrón al día con ensure() justo antes de reproducir o exportar
  S.registerBeatTrack({
    has: () => hayGolpes(),
    buffer: () => loopBuf,
    peaks: () => wavePeaks,
    duration: () => (loopBuf ? loopBuf.duration : 0),
    barSeconds: () => 16 * stepDur(),
    ensure: async () => { if (!hayGolpes()) return; clearTimeout(waveTimer); if (waveStale || !loopBuf) await drawWave(); else if (wavePromise) await wavePromise; }
  });
  window.addEventListener('flowlab:mixplay', () => { if (playing) stop(); });   // un solo sonido a la vez: la mezcla manda
  function buildTrack() {
    lanesEl.textContent = ''; chipsEl.textContent = '';
    st.rows.forEach(r => {
      const d = INST[r.inst], lane = mk('div', 'bt-lane'); lane.dataset.inst = r.inst; lane.style.setProperty('--c', d.c);
      const lab = mk('div', 'bt-lane-lab'); lab.append(mk('i', 'bt-dot'), mk('b', null, d.n));
      const bM = mk('button', 'bt-mini', 'M'); bM.type = 'button'; bM.title = 'Silenciar esta capa'; bM.setAttribute('aria-label', 'Silenciar capa ' + d.n);
      bM.addEventListener('click', () => {
        r.mute = !r.mute;
        const sb = seqEl.querySelector('.bt-row[data-inst="' + r.inst + '"] .bt-mini'); if (sb) { sb.classList.toggle('on', r.mute); sb.setAttribute('aria-pressed', String(r.mute)); }
        refreshRowStates(); syncRowGains(); dirty();
      });
      const bX = mk('button', 'bt-mini del', '✕'); bX.type = 'button'; bX.title = 'Quitar esta capa'; bX.setAttribute('aria-label', 'Quitar capa ' + d.n);
      bX.addEventListener('click', () => removeRow(r.inst));
      lab.append(bM, bX);
      lane.append(lab, mk('div', 'bt-ticks'));
      lanesEl.append(lane);
    });
    PAD_IDS.concat(EXTRA_IDS).filter(id => !st.rows.some(r => r.inst === id)).forEach(id => {
      const b = mk('button', 'bt-chip', '+ ' + INST[id].n); b.type = 'button'; b.style.setProperty('--c', INST[id].c);
      b.setAttribute('aria-label', 'Añadir capa ' + INST[id].n);
      b.addEventListener('click', () => addRow(id)); chipsEl.append(b);
    });
    chipsEl.classList.toggle('hidden', !chipsEl.children.length);
    paintTicks(); paintLaneState();
  }
  function paintTicks() {
    st.rows.forEach(r => {
      const lane = lanesEl.querySelector('.bt-lane[data-inst="' + r.inst + '"] .bt-ticks'); if (!lane) return;
      lane.textContent = '';
      for (let i = 0; i < st.steps; i++) {
        const lv = r.cells[i]; if (!lv) continue;
        const t = mk('i'); t.style.left = (i / st.steps * 100) + '%'; t.style.width = (100 / st.steps) + '%'; t.style.opacity = [0, 0.4, 0.7, 1][lv]; lane.append(t);
      }
    });
  }
  function paintLaneState() {
    const solo = anySolo();
    st.rows.forEach(r => {
      const lane = lanesEl.querySelector('.bt-lane[data-inst="' + r.inst + '"]'); if (!lane) return;
      lane.classList.toggle('off', r.mute || (solo && !r.solo));
      const m = lane.querySelector('.bt-mini'); m.classList.toggle('on', r.mute); m.setAttribute('aria-pressed', String(r.mute));
    });
  }
  ui.head = i => { trackEl.style.setProperty('--pos', i < 0 ? 0 : (i / st.steps).toFixed(4)); trackEl.classList.toggle('run', i >= 0); };
  new ResizeObserver(() => paintWave()).observe(waveEl);
  window.addEventListener('flowlab:mode', e => { if ((e.detail || {}).mode === 'beats' && waveStale) scheduleWave(); });

  // --- Usar en la cabina y descargar
  const outMsg = $('#btExportMsg'); let busy = false;
  function sayOut(m, bad) { outMsg.textContent = m; outMsg.classList.toggle('bad', !!bad); }
  const barsSel = () => clamp(num($('#btBars').value, 8), 1, 16);
  async function prepararRender(btn, txt) {
    if (busy) return null;
    if (!hayGolpes()) { sayOut('Tu patrón está vacío o silenciado: enciende algunos pasos primero.', true); return null; }
    busy = true; btn.disabled = true; btn.dataset.txt = btn.textContent; btn.textContent = '⏳ ' + txt; sayOut('');
    try {
      const buf = await renderBeat(st, barsSel()), m = medir(buf);
      if (m.peak < 0.005) { sayOut('El beat salió en silencio (revisa volúmenes, mute y solo).', true); return null; }
      if (m.peak > CEIL + 0.002 || m.clip) { sayOut('El volumen pasó del máximo (error interno). Baja el volumen de las filas e inténtalo de nuevo.', true); return null; }
      return { buf, m };
    } catch (e) { console.error(e); sayOut('No se pudo crear el beat: ' + e.message, true); return null; }
  }
  function liberar(btn) { busy = false; btn.disabled = false; btn.textContent = btn.dataset.txt || btn.textContent; }
  $('#btUse').addEventListener('click', async () => {
    const btn = $('#btUse');
    if (S.isRecording && S.isRecording()) { sayOut('Detén la grabación antes de cambiar la base.', true); return; }
    stop();
    const r = await prepararRender(btn, 'Creando…');
    if (r) {
      const name = (st.name || 'Mi beat') + ' · ' + st.bpm + ' BPM · ' + barsSel() + ' compases';
      if (S.setBeatBase(r.buf, name)) { sayOut('✓ Beat cargado como base (en bucle).'); if (window.Cabina) Cabina.irA('cabina'); }
      else sayOut('No se pudo cargar el beat como base.', true);
    }
    liberar(btn);
  });
  $('#btWav').addEventListener('click', async () => {
    const btn = $('#btWav');
    if (!esPro()) { sayOut('No se pudo preparar la descarga.', true); return; }
    const r = await prepararRender(btn, 'Creando WAV…');
    if (r) {
      try {
        const blob = S.encodeWav(r.buf), esperado = 44 + r.buf.length * 2 * 2;
        if (blob.size !== esperado) throw new Error('el archivo salió con un tamaño raro');
        if (blob.size > MAX_WAV_MB * 1024 * 1024) throw new Error('pesa más de ' + MAX_WAV_MB + ' MB: usa menos compases');
        // Comprobación final: se vuelve a leer el archivo y debe durar lo mismo y sonar
        const back = await S.ctx().decodeAudioData(await blob.arrayBuffer());
        const mb = medir(back);
        if (Math.abs(back.duration - r.buf.duration) > 0.02 || mb.peak < 0.005) throw new Error('el archivo no pasó la comprobación de sonido');
        S.downloadBlob(blob, 'flowlab_beat_' + nombreSeguro() + '_' + st.bpm + 'bpm_' + S.stamp() + '.wav');
        sayOut('✓ Descargado: ' + (blob.size / 1048576).toFixed(1) + ' MB · ' + r.buf.duration.toFixed(1) + ' s · pico ' + (20 * Math.log10(mb.peak)).toFixed(1) + ' dBFS (sin cortes).');
      } catch (e) { console.error(e); sayOut('No se descargó: ' + e.message, true); }
    }
    liberar(btn);
  });

  /* ---------------- Ritmos por género (Mejoras 5 · C) ---------------- */
  let genero = lsGet('beats_genero', 'trap'), presetPend = '', presetPendT = 0, presetActual = '';
  const genChips = $('#btGenres'), cardsEl = $('#btCards');
  const LIBRE = { id: 'libre', n: 'Libre 🎲', tag: 'Sin género: "Sorpréndeme" inventa un patrón al azar.' };
  function dibujaGeneros() {
    const BP = window.BeatPresets; if (!BP) return;
    const lista = BP.GENEROS.concat([LIBRE]); if (!lista.some(g => g.id === genero)) genero = 'trap';
    genChips.textContent = '';
    lista.forEach(g => {
      const b = mk('button', 'bt-gchip', g.n); b.type = 'button'; b.dataset.genero = g.id; b.setAttribute('aria-pressed', String(g.id === genero));
      b.addEventListener('click', () => { genero = g.id; lsSet('beats_genero', genero); dibujaGeneros(); });
      genChips.append(b);
    });
    $('#btGenreTag').textContent = (lista.find(g => g.id === genero) || {}).tag || '';
    cardsEl.textContent = '';
    if (genero === 'libre') { cardsEl.append(mk('p', 'hint', 'Modo libre: arma tu patrón desde cero o pulsa "Sorpréndeme" para que se invente uno.')); return; }
    BP.items.filter(x => x.g === genero).forEach(it => {
      const c = mk('button', 'bt-card' + (it.id === presetActual ? ' cur' : '')); c.type = 'button'; c.dataset.id = it.id;
      c.setAttribute('aria-label', 'Cargar el ritmo ' + it.n + ', ' + it.bpm + ' BPM');
      c.append(mk('b', null, it.n), mk('small', null, it.bpm + ' BPM · ' + KITS[it.kit].n + (it.steps === 32 ? ' · 2 compases' : '')));
      c.addEventListener('click', () => cargarPreset(it, false));
      cardsEl.append(c);
    });
  }
  // Un toque carga el ritmo (patrón, tempo, kit, swing y efectos); si tenías cambios sin guardar, pide un segundo toque
  function cargarPreset(it, forzar) {
    const BP = window.BeatPresets; if (!BP) return;
    if (!forzar && savedDirty && presetPend !== it.id) {
      presetPend = it.id; clearTimeout(presetPendT); presetPendT = setTimeout(() => { presetPend = ''; }, 5000);
      say('Tienes cambios sin guardar. Toca otra vez "' + it.n + '" para cargarlo igual, o pulsa Guardar primero.'); return;
    }
    presetPend = '';
    const x = sanitize(BP.aEstado(it)); if (!x) return;
    const sonaba = playing && !demo;
    loadState(x); presetActual = it.id;
    cardsEl.querySelectorAll('.bt-card').forEach(c => c.classList.toggle('cur', c.dataset.id === it.id));
    if (sonaba) play();
    say('Cargado "' + it.n + '" · ' + it.bpm + ' BPM. Cámbialo a tu gusto: todo se puede editar.');
  }
  // Dibuja un ritmo de la casa SIN tocar tu patrón ni la pantalla de Beats (lo usan la Cabina y la Escuela).
  // bpm opcional: el beat es sintético, así que su tempo se cambia sin perder calidad. bars se redondea a un múltiplo del patrón.
  // ---- Bases profesionales (MP3): se decodifican una vez y, si hace falta, se aceleran/frenan al BPM pedido ----
  const proCache = {};
  async function decodePro(url) {
    if (proCache[url]) return proCache[url];
    proCache[url] = (async () => {
      const ab = await (await fetch(url)).arrayBuffer();
      const oc = new OfflineAudioContext(2, 44100, 44100);
      return oc.decodeAudioData(ab);
    })();
    try { return await proCache[url]; } catch (e) { delete proCache[url]; throw e; }
  }
  async function renderPro(it, bpm) {
    const BP = window.BeatPresets, src = await decodePro(it.audio), tgt = bpm ? clamp(Math.round(bpm), 40, 240) : it.bpm, ratio = tgt / it.bpm;
    let buf = src;
    if (Math.abs(ratio - 1) > 0.01) {
      const len = Math.ceil(src.length / ratio), oc = new OfflineAudioContext(src.numberOfChannels, len, src.sampleRate), s = oc.createBufferSource();
      s.buffer = src; s.playbackRate.value = ratio; s.connect(oc.destination); s.start(); buf = await oc.startRendering();
    }
    return { buf, item: it, bpm: tgt, bars: Math.round(buf.duration / (4 * 60 / tgt)), kit: '', nombre: it.n + ' · ' + BP.GENEROS.find(g => g.id === it.g).n + ' · ' + tgt + ' BPM' };
  }
  async function renderPreset(id, bars, bpm) {
    const BP = window.BeatPresets, pro = BP && BP.pro && BP.pro.find(x => x.id === id); if (pro) return renderPro(pro, bpm);
    const it = BP && BP.items.find(x => x.id === id); if (!it) return null;
    const x = sanitize(BP.aEstado(it)); if (!x) return null;
    if (bpm) x.bpm = clamp(Math.round(bpm), 40, 240);
    const per = x.steps / 16, n = Math.max(per, Math.ceil((bars || per) / per) * per);
    const buf = await renderBeat(x, n);
    return { buf, item: it, bpm: x.bpm, bars: n, kit: x.kit, nombre: it.n + ' · ' + BP.GENEROS.find(g => g.id === it.g).n + ' · ' + x.bpm + ' BPM' };
  }
  // Sorpréndeme: un ritmo al azar del género elegido (o, en "Libre", el patrón al azar de siempre)
  function sorprende() {
    const BP = window.BeatPresets;
    if (BP && genero !== 'libre') {
      const lista = BP.items.filter(x => x.g === genero && x.id !== presetActual), it = lista[Math.floor(Math.random() * lista.length)];
      if (it) { cargarPreset(it, true); return; }
    }
    randomize();
  }
  window.addEventListener('flowlab:presets', dibujaGeneros);
  if (window.BeatPresets) dibujaGeneros();

  /* ---------------- Teclado y modos ---------------- */
  document.addEventListener('keydown', e => {
    if (!window.Cabina || Cabina.modo() !== 'beats') return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    const id = KEYMAP[(e.key || '').toLowerCase()];
    if (id) { e.preventDefault(); hitPad(id, padsEl.querySelector('[data-pad="' + id + '"]')); return; }
    if (e.code === 'Space' && tag !== 'BUTTON') { e.preventDefault(); if (playing) stop(); else play(); }
  });
  window.addEventListener('flowlab:mode', e => { if ((e.detail || {}).mode !== 'beats') stop(); });
  window.addEventListener('pagehide', stop);
  // Los navegadores móviles exigen un toque para sonar: el primer toque en el modo despierta el audio
  document.addEventListener('pointerdown', () => { if (window.Cabina && Cabina.modo() === 'beats') { try { S.ctx(); } catch (e) { } } }, { passive: true });

  /* ---------------- Probar sonido (Mejoras 4 · A) ---------------- */
  function probarSonido() {
    const A = window.Cabina_audio, msgs = document.querySelectorAll('[data-snd-status]');
    const decir = (t, mal) => msgs.forEach(m => { m.textContent = t; m.classList.toggle('bad', !!mal); });
    try {
      if (S.audioSession) S.audioSession('playback');
      const e = engine(), out = e.rowOut('pad:test'); out.gain.value = 1;
      e.trigger('bombo', e.c.currentTime + 0.01, 1, 0, st.kit, out);
    } catch (err) { decir('Este navegador no pudo abrir el audio. Prueba con Chrome o Safari actualizado.', true); if (A) A.forzar(true); return; }
    decir('🔊 Sonó un bombo. ¿Lo oíste?');
    setTimeout(() => {
      const corre = S.ctxState() === 'running';
      if (!corre) { decir('El audio sigue dormido. Toca otra vez "Probar sonido". Si no oyes nada: quita el modo silencio del celular (interruptor al costado) y sube el volumen.', true); if (A) A.forzar(true); }
      else {
        if (A) A.forzar(false);
        decir('El audio está activo. Si lo oíste, todo bien. Si no: quita el modo silencio del celular (interruptor al costado), sube el volumen y vuelve a probar.');
      }
    }, 350);
  }
  document.querySelectorAll('[data-probar-sonido]').forEach(b => b.addEventListener('click', probarSonido));

  /* ---------------- Arranque ---------------- */
  buildPads();
  setKit(st.kit, false); setFx(st.fx); setSwing(st.swing); setTempo(st.bpm, true);
  buildSeq(); renderMine();
  ui.play(); ui.head(-1); scheduleWave();
  // Para las siguientes partes (pista del beat, "Usar en la cabina", descargar .WAV)
  window.Beats = {
    INST, KITS, NOTES, VEL, makeEngine, voice,
    estado: () => serialize(st), cargar: s => { const x = sanitize(s); if (x) { loadState(x); renderMine(); } return !!x; },
    reproduciendo: () => playing, play, stop, aleatorio: randomize,
    esPro, renderBeat, renderPreset, limitar, medir, demoKit, cargarPreset: id => { const it = window.BeatPresets && BeatPresets.items.find(x => x.id === id); if (it) cargarPreset(it, true); return !!it; }, KIT_DEMO, boost: () => modoCel, pasoDuracion: () => stepDur()
  };
})();

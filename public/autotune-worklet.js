/* FlowLab Studio · autotune-worklet.js
   Procesadores AudioWorklet:
   - 'autotune-processor': Noise Gate suave → detector YIN (mediana 3 frames) → TD-PSOLA 100% WET.
   - 'pcm-recorder': captura PCM exacta al frame (para alinear la toma con el beat).
*/
'use strict';

const MIN_F = 70;     // Hz · voz masculina grave
const MAX_F = 1000;   // Hz · voz aguda
const RING = 16384;   // buffers circulares (potencia de 2)
const MASK = RING - 1;

class AutotuneProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    const sr = sampleRate;
    this.sr = sr;
    this.inBuf = new Float32Array(RING);
    this.outBuf = new Float32Array(RING);
    this.wBuf = new Float32Array(RING);
    this.t = 0;                               // contador absoluto de muestras
    this.L = Math.round(sr * 0.03);           // latencia del PSOLA (30 ms)
    this.maxT = Math.floor(this.L / 2) - 2;   // periodo máximo admitido
    this.minT = Math.floor(sr / MAX_F);
    this.unvT = Math.round(sr * 0.008);       // granos de 8 ms en zonas sin tono
    this.T = this.unvT;
    this.voiced = false;
    this.ratio = 1;
    this.nextSyn = 0;
    this.anaMark = 0;
    this.wasActive = false;

    // Detector YIN (sobre señal diezmada x2)
    this.hop = 512;
    this.sinceDet = 0;
    this.dsLen = 1024;
    this.ds = new Float32Array(this.dsLen);
    this.yinW = 512;
    this.srd = sr / 2;
    this.tauMax = Math.min(Math.ceil(this.srd / MIN_F), this.dsLen - this.yinW - 1);
    this.tauMin = Math.max(2, Math.floor(this.srd / MAX_F));
    this.d = new Float32Array(this.tauMax + 2);
    this.hist = [0, 0, 0];
    this.holdMidi = 0;
    this.curCorr = 0;
    this.reportEvery = 8;
    this.reportCount = 0;
    this.lastF = 0;

    // Parámetros
    this.autotune = false;
    this.retune = 0.5;
    this.shift = 0;
    this.root = 45;
    this.pcs = new Array(12).fill(false);
    [0, 2, 3, 5, 7, 8, 10].forEach(i => { this.pcs[(45 + i) % 12] = true; });
    this.gateOpen = Math.pow(10, -52 / 20);
    this.gateGain = 1;
    this.gateTarget = 1;
    this.gAtk = 1 - Math.exp(-1 / (0.002 * sr));
    this.gRel = 1 - Math.exp(-1 / (0.15 * sr));

    this.port.onmessage = e => this.setParams(e.data || {});
  }

  setParams(p) {
    if ('autotune' in p) this.autotune = !!p.autotune;
    if ('retune' in p) this.retune = Math.min(1, Math.max(0, +p.retune));
    if ('shift' in p) this.shift = Math.min(12, Math.max(-12, +p.shift));
    if ('gateDb' in p) this.gateOpen = Math.pow(10, (+p.gateDb) / 20);
    // Valida la escala antes de usarla: un dato raro no debe romper el hilo de audio
    if (p.scale && Number.isFinite(p.scale.root) && Array.isArray(p.scale.ints)) {
      this.root = p.scale.root;
      this.pcs = new Array(12).fill(false);
      p.scale.ints.forEach(i => { this.pcs[(p.scale.root + i) % 12] = true; });
    }
  }

  get active() { return this.autotune || this.shift !== 0; }

  nearestScaleMidi(m) {
    const base = Math.round(m);
    for (let off = 0; off <= 6; off++) {
      const cands = off === 0 ? [base] : [base - off, base + off];
      let best = null, bd = 99;
      for (const c of cands) {
        if (this.pcs[((c % 12) + 12) % 12]) {
          const dd = Math.abs(c - m);
          if (dd < bd) { bd = dd; best = c; }
        }
      }
      if (best !== null) return best;
    }
    return base;
  }

  /* YIN sobre las últimas 2048 muestras (diezmadas a 1024) */
  detect() {
    const ds = this.ds, n = this.dsLen, start = this.t - n * 2;
    let e = 0;
    for (let j = 0; j < n; j++) {
      const a = this.inBuf[(start + 2 * j) & MASK], b = this.inBuf[(start + 2 * j + 1) & MASK];
      const v = 0.5 * (a + b);
      ds[j] = v; e += v * v;
    }
    if (Math.sqrt(e / n) < 0.006) return 0;
    const W = this.yinW, d = this.d, tMax = this.tauMax;
    d[0] = 1;
    let run = 0, found = -1;
    for (let tau = 1; tau <= tMax; tau++) {
      let s = 0;
      for (let j = 0; j < W; j++) { const x = ds[j] - ds[j + tau]; s += x * x; }
      run += s;
      d[tau] = run > 0 ? s * tau / run : 1;
    }
    for (let tau = this.tauMin; tau <= tMax; tau++) {
      if (d[tau] < 0.15) {
        while (tau + 1 <= tMax && d[tau + 1] < d[tau]) tau++;
        found = tau; break;
      }
    }
    if (found < 0) return 0;
    let tau = found;
    if (tau > 1 && tau < tMax) {
      const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a + c - 2 * b;
      if (Math.abs(den) > 1e-9) tau += 0.5 * (a - c) / den;
    }
    return this.srd / tau;
  }

  analyse() {
    const f = this.detect();
    let midi = f > 0 ? 69 + 12 * Math.log2(f / 440) : 0;
    this.hist.shift(); this.hist.push(midi);
    // Filtro de mediana de 3 frames: elimina saltos de octava de un solo frame
    if (midi > 0 && this.hist[0] > 0 && this.hist[1] > 0) {
      const s = this.hist.slice().sort((x, y) => x - y);
      midi = s[1];
    } else if (midi === 0 && this.holdMidi > 0 && this.hist[1] > 0) {
      midi = this.holdMidi; // sostiene 1 frame para no "tartamudear"
    }
    if (midi > 0 && this.hist[2] === 0 && this.hist[1] === 0) this.holdMidi = 0;
    else this.holdMidi = midi;

    const hopSec = this.hop / this.sr;
    if (midi > 0) {
      const fm = 440 * Math.pow(2, (midi - 69) / 12);
      const T = Math.round(this.sr / fm);
      if (T <= this.maxT && T >= this.minT) {
        this.voiced = true; this.T = T;
        let corrTarget = 0;
        if (this.autotune) corrTarget = this.nearestScaleMidi(midi) - midi;
        const tau = 0.002 + 0.3 * Math.pow(1 - this.retune, 2.5);
        const a = 1 - Math.exp(-hopSec / tau);
        this.curCorr += (corrTarget - this.curCorr) * a;
        if (!this.autotune) this.curCorr = 0;
        this.ratio = Math.min(2, Math.max(0.5, Math.pow(2, (this.curCorr + this.shift) / 12)));
      } else { this.voiced = false; this.T = this.unvT; }
      this.lastF = fm;
    } else {
      this.voiced = false; this.T = this.unvT; this.lastF = 0;
    }
    if (++this.reportCount >= this.reportEvery) {
      this.reportCount = 0;
      this.port.postMessage({ f: this.lastF, corr: this.curCorr });
    }
  }

  placeGrains(tEnd, readPos) {
    const L = this.L;
    while (this.nextSyn < tEnd + this.T) {
      const T = this.T, H = T;
      const ratio = this.voiced ? this.ratio : 1;
      const s = Math.round(this.nextSyn);
      const target = s - L;
      if (this.anaMark > target || target - this.anaMark > 4 * T) this.anaMark = target;
      while (this.anaMark + T <= target) this.anaMark += T;
      const a = this.anaMark;
      const kStart = Math.max(-H, readPos - s);
      const inv = Math.PI / H;
      for (let k = kStart; k < H; k++) {
        const w = 0.5 + 0.5 * Math.cos(k * inv);
        const o = (s + k) & MASK;
        this.outBuf[o] += this.inBuf[(a + k) & MASK] * w;
        this.wBuf[o] += w;
      }
      this.nextSyn += Math.max(1, T / ratio);
    }
  }

  process(inputs, outputs) {
    const out = outputs[0][0];
    const inp = inputs[0] && inputs[0][0];
    const n = out.length;
    const active = this.active;

    if (active && !this.wasActive) {
      this.outBuf.fill(0); this.wBuf.fill(0);
      this.nextSyn = this.t; this.anaMark = this.t - this.L;
    }
    this.wasActive = active;

    // 1) Noise gate suave (por bloque, suavizado por muestra) + escritura en anillo
    let e = 0;
    if (inp) for (let i = 0; i < n; i++) e += inp[i] * inp[i];
    const rms = Math.sqrt(e / n);
    if (rms > this.gateOpen) this.gateTarget = 1;
    else if (rms < this.gateOpen * 0.5) this.gateTarget = 0.03; // -30 dB, sin cortar en seco
    const tStart = this.t;
    for (let i = 0; i < n; i++) {
      const c = this.gateTarget > this.gateGain ? this.gAtk : this.gRel;
      this.gateGain += (this.gateTarget - this.gateGain) * c;
      const x = (inp ? inp[i] : 0) * this.gateGain;
      this.inBuf[(tStart + i) & MASK] = x;
    }
    this.t += n;

    // 2) Detección de tono cada hop
    this.sinceDet += n;
    if (this.sinceDet >= this.hop) { this.sinceDet = 0; this.analyse(); }

    // 3) Salida: bypass limpio o PSOLA 100% WET (nunca se mezcla la voz cruda)
    if (!active) {
      for (let i = 0; i < n; i++) out[i] = this.inBuf[(tStart + i) & MASK];
      return true;
    }
    this.placeGrains(this.t, tStart);
    for (let i = 0; i < n; i++) {
      const idx = (tStart + i) & MASK;
      const w = this.wBuf[idx];
      out[i] = this.outBuf[idx] / (w > 0.35 ? w : 0.35);
      this.outBuf[idx] = 0; this.wBuf[idx] = 0;
    }
    return true;
  }
}

class PcmRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.rec = false;
    this.stopReq = false;
    this.startFrame = 0;
    this.buf = new Float32Array(16384);
    this.pos = 0;
    this.fr = 0; this.pk = 0; this.lastStat = 0;   // estadística para el plan B: fotogramas con entrada y pico
    this.port.onmessage = e => {
      const m = e.data || {};
      if (m.cmd === 'start') { this.startFrame = Math.round((m.at || 0) * sampleRate); this.pos = 0; this.rec = true; this.stopReq = false; this.fr = 0; this.pk = 0; this.lastStat = currentFrame; }
      if (m.cmd === 'stop') this.stopReq = true;
    };
  }
  flush() {
    if (!this.pos) return;
    const chunk = this.buf.slice(0, this.pos);
    this.port.postMessage({ chunk }, [chunk.buffer]);
    this.pos = 0;
  }
  process(inputs) {
    const inp = inputs[0] && inputs[0][0];
    if (this.rec) {
      const n = 128;
      if (inp && currentFrame >= this.startFrame) { this.fr++; for (let i = 0; i < n; i++) { const a = inp[i] < 0 ? -inp[i] : inp[i]; if (a > this.pk) this.pk = a; } }
      if (currentFrame - this.lastStat >= sampleRate * 0.25) { this.lastStat = currentFrame; this.port.postMessage({ stat: { frames: this.fr, peak: this.pk } }); }
      for (let i = 0; i < n; i++) {
        if (currentFrame + i < this.startFrame) continue;
        this.buf[this.pos++] = inp ? inp[i] : 0;
        if (this.pos === this.buf.length) this.flush();
      }
      if (this.stopReq) {
        this.flush();
        this.rec = false; this.stopReq = false;
        this.port.postMessage({ done: true });
      }
    } else if (this.stopReq) {
      this.stopReq = false;
      this.port.postMessage({ done: true });
    }
    return true;
  }
}

/* Contador de fotogramas del micrófono (diagnóstico): cada 0,25 s dice cuántos bloques llegaron, cuántos traían señal y el pico */
class MicMeter extends AudioWorkletProcessor {
  constructor() { super(); this.calls = 0; this.live = 0; this.peak = 0; this.last = 0; }
  process(inputs) {
    const inp = inputs[0] && inputs[0][0];
    if (inp) {
      this.calls++; let p = 0;
      for (let i = 0; i < inp.length; i++) { const a = inp[i] < 0 ? -inp[i] : inp[i]; if (a > p) p = a; }
      if (p > 1e-6) this.live++;
      if (p > this.peak) this.peak = p;
    }
    if (currentFrame - this.last >= sampleRate * 0.25) {
      this.last = currentFrame;
      this.port.postMessage({ stat: { calls: this.calls, live: this.live, peak: this.peak } });
      this.calls = 0; this.live = 0; this.peak = 0;
    }
    return true;
  }
}

registerProcessor('autotune-processor', AutotuneProcessor);
registerProcessor('mic-meter', MicMeter);
registerProcessor('pcm-recorder', PcmRecorder);

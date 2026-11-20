/* =====================================================================
   FlowLab Studio · ai-coach.js  (Mejoras 8 · A y B)  — módulo ES
   "Coach de freestyle" con Firebase AI Logic en modo HÍBRIDO:
     · primero intenta correr EN TU DISPOSITIVO (Gemini Nano de Chrome de escritorio)
     · si no hay modelo local, cae a la NUBE (Gemini Developer API, plan gratis).
   Reglas de este archivo:
     · El SDK de Firebase NO se carga con la página: se pide recién cuando el usuario
       pulsa "Generar" dentro del Coach (import() dinámico desde gstatic).
     · Una petición a la vez, tope de entrada y de salida, pausa entre peticiones.
     · Todo texto del usuario o de la IA se muestra con textContent (nunca como HTML).
     · El audio NUNCA se envía. Solo el texto que el usuario decide mandar.
   SDK usado: Firebase JS SDK 13.4.0 (el modo híbrido pide 12.5.0 o más).
   ===================================================================== */

const SDK_VERSION = '13.4.0';
const SDK_BASE = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/';

// Configuración web de Firebase: es pública por diseño (NO es un secreto). Lo que protege el proyecto es App Check.
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAYYm_rWESFe71c5jai-uJkrX1Oi3QMnUE',
  authDomain: 'flowlab-studio-bce29.firebaseapp.com',
  projectId: 'flowlab-studio-bce29',
  storageBucket: 'flowlab-studio-bce29.firebasestorage.app',
  messagingSenderId: '381541924129',
  appId: '1:381541924129:web:de477a491eef14747cd260'
};
// Clave de sitio de reCAPTCHA Enterprise (tipo web, por puntaje). Se crea en la consola de Google Cloud y se pega aquí.
// Es pública. Mientras esté vacía, el Coach solo funciona en localhost (con token de depuración).
const RECAPTCHA_KEY = '';

// Modelo de la nube (el que la documentación de Firebase da por defecto desde el SDK 13). Hay que indicarlo porque al pasar inCloudParams se pierde el valor por defecto.
const CLOUD_MODEL = 'gemini-3.5-flash-lite';

const LIM = { entrada: 1200, lineaMax: 120, lineasMin: 4, lineasMax: 16, salida: 800, pausaMs: 5000, esperaMs: 60000 };
const K_OK = 'flowlab_coach_ok';

/* ---------- textos (ES / EN) ---------- */
const T = {
  es: {
    btn: '🤖 Coach IA', btnTit: 'Coach de freestyle con IA: mejora tu letra o desahógate con ideas',
    titulo: 'Coach de freestyle (IA)', cerrar: 'Cerrar ✕', cerrarAria: 'Cerrar el Coach',
    aviso: 'Tu texto se procesa en tu dispositivo si es posible; si no, se envía a Google para generar la respuesta. El audio nunca se envía.',
    avisoBtn: 'Entendido',
    tabLetra: 'Mejorar mi letra', tabDesa: 'Desahógate con IA',
    letraAyuda: 'Pega o escribe de 4 a 16 líneas. El Coach te dice rimas internas posibles, líneas con sílabas muy desparejas, 3 ideas para seguir y, si quieres, una versión mejorada.',
    letraPh: 'Escribe tu letra aquí (una línea por barra)…', letraGo: 'Mejorar mi letra',
    desaAyuda: 'Elige una emoción y el Coach te sugiere 5 palabras, 3 imágenes y un arranque de verso. No se guarda nada.',
    desaGo: 'Dame ideas',
    emocion: '¿Qué sientes hoy?',
    pocas: 'Escribe al menos 4 líneas (máximo 16) para que el Coach tenga de dónde trabajar.',
    muchas: 'Son demasiadas líneas: déjalo en 16 como máximo.',
    elige: 'Elige primero una emoción.',
    espera: n => 'Espera ' + n + ' s antes de pedir otra respuesta.',
    ocupado: 'Ya hay una respuesta en camino. Espera un momento.',
    pensando: 'Pensando… la primera vez en tu dispositivo el modelo puede tardar en descargarse; mientras tanto se usa la nube.',
    donde_ON_DEVICE: '🟢 Respondió en tu dispositivo', donde_IN_CLOUD: '☁️ Respondió en la nube (Google)', donde_X: 'Respondió',
    rimas: 'Rimas internas posibles', desp: 'Líneas con sílabas muy desparejas', ideas: '3 ideas para continuar',
    mejorada: 'Versión mejorada (opcional)', copiar: 'Copiar', copiado: '¡Copiado!',
    nadaRimas: 'No encontré rimas internas claras.', nadaDesp: 'Tus líneas están bastante parejas. 👌',
    linea: n => 'Línea ' + n + ': ',
    palabras: '5 palabras', imagenes: '3 imágenes', arranque: 'Un arranque de verso',
    sinIA: 'No pude usar el Coach ahora. Tu app sigue funcionando igual.',
    errRed: 'No hay internet y tu navegador no tiene el modelo local. Conéctate o usa Chrome de escritorio con Gemini Nano.',
    errApp: 'La protección de la app (App Check) aún no está lista en esta web, así que el Coach no puede responder todavía.',
    errCarga: 'No se pudo cargar el servicio de IA (¿sin internet?). Prueba de nuevo.',
    errLimite: 'Se alcanzó el límite gratuito de uso por ahora. Inténtalo más tarde.',
    errFormato: 'La IA respondió algo que no pude ordenar. Pulsa otra vez.',
    errTiempo: 'La respuesta tardó demasiado. Inténtalo otra vez.',
    crisis: 'Gracias por confiar esto a tu letra. Lo que cuentas importa más que cualquier verso, y no tienes que cargarlo solo: habla hoy con alguien de confianza. En Perú puedes llamar gratis a la Línea 113, opción 5 (salud mental), las 24 horas. Por cuidado, no envié este texto a ninguna IA.'
  },
  en: {
    btn: '🤖 AI Coach', btnTit: 'Freestyle coach with AI: improve your lyrics or get ideas to vent',
    titulo: 'Freestyle Coach (AI)', cerrar: 'Close ✕', cerrarAria: 'Close the Coach',
    aviso: 'Your text is processed on your device if possible; otherwise it is sent to Google to generate the answer. Audio is never sent.',
    avisoBtn: 'Got it',
    tabLetra: 'Improve my lyrics', tabDesa: 'Vent with AI',
    letraAyuda: 'Paste or write 4 to 16 lines. The Coach finds possible internal rhymes, lines with very uneven syllables, 3 ideas to continue and, if you want, an improved version.',
    letraPh: 'Write your lyrics here (one line per bar)…', letraGo: 'Improve my lyrics',
    desaAyuda: 'Pick an emotion and the Coach suggests 5 words, 3 images and a verse opener. Nothing is saved.',
    desaGo: 'Give me ideas',
    emocion: 'How do you feel today?',
    pocas: 'Write at least 4 lines (16 max) so the Coach has something to work with.',
    muchas: 'That is too many lines: keep it to 16 at most.',
    elige: 'Pick an emotion first.',
    espera: n => 'Wait ' + n + ' s before asking again.',
    ocupado: 'An answer is already on its way. Wait a moment.',
    pensando: 'Thinking… the first time, the on-device model may take a while to download; the cloud is used meanwhile.',
    donde_ON_DEVICE: '🟢 Answered on your device', donde_IN_CLOUD: '☁️ Answered in the cloud (Google)', donde_X: 'Answered',
    rimas: 'Possible internal rhymes', desp: 'Lines with very uneven syllables', ideas: '3 ideas to continue',
    mejorada: 'Improved version (optional)', copiar: 'Copy', copiado: 'Copied!',
    nadaRimas: 'I did not find clear internal rhymes.', nadaDesp: 'Your lines are quite even. 👌',
    linea: n => 'Line ' + n + ': ',
    palabras: '5 words', imagenes: '3 images', arranque: 'A verse opener',
    sinIA: 'I could not use the Coach right now. The rest of the app works as usual.',
    errRed: 'No internet, and your browser has no local model. Connect, or use desktop Chrome with Gemini Nano.',
    errApp: 'App protection (App Check) is not ready on this site yet, so the Coach cannot answer for now.',
    errCarga: 'Could not load the AI service (offline?). Try again.',
    errLimite: 'The free usage limit was reached for now. Try again later.',
    errFormato: 'The AI answered something I could not sort out. Press again.',
    errTiempo: 'The answer took too long. Try again.',
    crisis: 'Thank you for trusting this to your lyrics. What you share matters more than any verse, and you do not have to carry it alone: talk to someone you trust today. In Peru you can call Línea 113, option 5 (mental health), free, 24 hours. To be careful, I did not send this text to any AI.'
  }
};
const EMO_EN = { rabia: 'Anger', tristeza: 'Sadness', alegria: 'Joy', nostalgia: 'Nostalgia', amor: 'Love', miedo: 'Fear', esperanza: 'Hope' };

const lang = () => {
  try { if (window.I18n && typeof window.I18n.lang === 'function') return window.I18n.lang() === 'en' ? 'en' : 'es'; } catch (e) { }
  return String(document.documentElement.lang || 'es').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'es';
};
const t = k => (T[lang()][k] !== undefined ? T[lang()][k] : T.es[k]);

/* ---------- reglas de contenido (prompt del sistema) ---------- */
function sistema(l) {
  return 'You are FlowLab Coach, a friendly freestyle rap writing coach. ' +
    'You only give structure, words and ideas. Never write insults, hate, harassment or discrimination, and nothing sexual or violent against people. ' +
    'Do not diagnose anyone. If the text seems to show a serious personal crisis, answer with warmth and invite the person to talk with someone they trust; never write phone numbers. ' +
    'Keep every answer short. Reply ONLY with JSON that matches the requested schema. Write all the text values in ' + (l === 'en' ? 'English' : 'Spanish') + '.';
}

/* ---------- detección de crisis (se resuelve SIN enviar nada a la IA) ---------- */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const CRISIS = /suicid|quitarme la vida|quiero morir|quiero morirme|matarme|acabar con mi vida|terminar con mi vida|no quiero vivir|hacerme dano|cortarme las venas|kill myself|end my life|want to die|self[- ]?harm|hurt myself/;
const esCrisis = txt => CRISIS.test(norm(txt));

/* ---------- esquemas de respuesta ---------- */
const S_LETRA = {
  type: 'object',
  properties: {
    rimasInternas: { type: 'array', items: { type: 'string' } },
    lineasDesparejas: { type: 'array', items: { type: 'object', properties: { linea: { type: 'integer' }, motivo: { type: 'string' } }, required: ['linea', 'motivo'] } },
    ideas: { type: 'array', items: { type: 'string' } },
    versionMejorada: { type: 'string' }
  },
  required: ['rimasInternas', 'lineasDesparejas', 'ideas', 'versionMejorada']
};
const S_DESA = {
  type: 'object',
  properties: {
    palabras: { type: 'array', items: { type: 'string' } },
    imagenes: { type: 'array', items: { type: 'string' } },
    arranque: { type: 'string' }
  },
  required: ['palabras', 'imagenes', 'arranque']
};
// El mismo esquema para la nube, con los ayudantes de Firebase
function esquemaNube(Schema, cual) {
  const str = () => Schema.string(), arr = it => Schema.array({ items: it });
  if (cual === 'letra') {
    return Schema.object({
      properties: {
        rimasInternas: arr(str()),
        lineasDesparejas: arr(Schema.object({ properties: { linea: Schema.integer(), motivo: str() } })),
        ideas: arr(str()), versionMejorada: str()
      }
    });
  }
  return Schema.object({ properties: { palabras: arr(str()), imagenes: arr(str()), arranque: str() } });
}

/* ---------- carga perezosa del SDK + App Check ---------- */
let sdkPromesa = null;
const esLocal = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

function cargarSDK() {
  if (sdkPromesa) return sdkPromesa;
  sdkPromesa = (async () => {
    const [app, ai, ac] = await Promise.all([
      import(SDK_BASE + 'firebase-app.js'),
      import(SDK_BASE + 'firebase-ai.js'),
      import(SDK_BASE + 'firebase-app-check.js')
    ]);
    const fb = app.initializeApp(FIREBASE_CONFIG);
    if (esLocal()) {
      // Token de depuración: solo en localhost. Se imprime en la consola del navegador ("AppCheck debug token")
      // y hay que registrarlo en Firebase → App Check → Apps → Administrar tokens de depuración.
      let guardado = null; try { guardado = localStorage.getItem('flowlab_appcheck_debug'); } catch (e) { }
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = guardado || true;
      ac.initializeAppCheck(fb, { provider: new ac.ReCaptchaEnterpriseProvider(RECAPTCHA_KEY || 'debug-local'), isTokenAutoRefreshEnabled: true });
    } else if (RECAPTCHA_KEY) {
      ac.initializeAppCheck(fb, { provider: new ac.ReCaptchaEnterpriseProvider(RECAPTCHA_KEY), isTokenAutoRefreshEnabled: true });
    } else {
      const e = new Error('APPCHECK_SIN_CLAVE'); e.codigoCoach = 'app'; throw e;
    }
    const servicio = ai.getAI(fb, { backend: new ai.GoogleAIBackend() });
    return { ai, servicio };
  })().catch(e => { sdkPromesa = null; throw e; });
  return sdkPromesa;
}

function conTiempo(p, ms) {
  let id; const corte = new Promise((_, rej) => { id = setTimeout(() => { const e = new Error('TIEMPO'); e.codigoCoach = 'tiempo'; rej(e); }, ms); });
  return Promise.race([p, corte]).finally(() => clearTimeout(id));
}

async function pedirIA(cual, prompt, onEstado) {
  const l = lang();
  const { ai, servicio } = await cargarSDK();
  const jsonSchema = cual === 'letra' ? S_LETRA : S_DESA;
  const sys = sistema(l);
  const modelo = ai.getGenerativeModel(servicio, {
    mode: ai.InferenceMode.PREFER_ON_DEVICE,
    onDeviceParams: {
      createOptions: {
        expectedInputs: [{ type: 'text', languages: [l] }],
        expectedOutputs: [{ type: 'text', languages: [l] }],
        initialPrompts: [{ role: 'system', content: [{ type: 'text', value: sys }] }]
      },
      promptOptions: { responseConstraint: jsonSchema }
    },
    inCloudParams: {
      model: CLOUD_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: esquemaNube(ai.Schema, cual),
        maxOutputTokens: LIM.salida, temperature: 0.8
      },
      systemInstruction: sys
    }
  });
  // Empieza a preparar el modelo local (si Chrome lo permite). No se espera: si aún no está, se usa la nube.
  try {
    if (typeof modelo.initializeDeviceModel === 'function') {
      const r = modelo.initializeDeviceModel(v => { try { onEstado && onEstado(v); } catch (e) { } });
      if (r && typeof r.catch === 'function') r.catch(() => { });
    }
  } catch (e) { }
  const res = await conTiempo(modelo.generateContent(prompt), LIM.esperaMs);
  const texto = res.response.text();
  return { texto, fuente: res.response.inferenceSource || '' };
}

/* ---------- limpieza de lo que devuelve la IA ---------- */
const lista = (x, n, max) => Array.isArray(x) ? x.map(v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max)).filter(Boolean).slice(0, n) : [];
function leerJSON(texto) {
  let o = null;
  try { o = JSON.parse(texto); } catch (e) {
    const a = String(texto).indexOf('{'), b = String(texto).lastIndexOf('}');
    if (a >= 0 && b > a) { try { o = JSON.parse(String(texto).slice(a, b + 1)); } catch (e2) { } }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) { const e = new Error('FORMATO'); e.codigoCoach = 'formato'; throw e; }
  return o;
}
function limpiaLetra(o) {
  return {
    rimas: lista(o.rimasInternas, 8, 120),
    desp: (Array.isArray(o.lineasDesparejas) ? o.lineasDesparejas : []).slice(0, 8).map(x => ({ linea: Math.max(1, Math.min(99, parseInt(x && x.linea, 10) || 0)), motivo: String((x && x.motivo) || '').replace(/\s+/g, ' ').trim().slice(0, 160) })).filter(x => x.linea && x.motivo),
    ideas: lista(o.ideas, 3, 180),
    mejorada: String(o.versionMejorada || '').replace(/\r/g, '').trim().slice(0, 1600)
  };
}
function limpiaDesa(o) {
  return { palabras: lista(o.palabras, 5, 40), imagenes: lista(o.imagenes, 3, 140), arranque: String(o.arranque || '').replace(/\s+/g, ' ').trim().slice(0, 240) };
}
function mensajeError(e) {
  const c = e && e.codigoCoach, m = String((e && (e.message || e.code)) || '') + ' ' + String((e && e.code) || '');
  if (c === 'app') return t('errApp');
  if (c === 'tiempo') return t('errTiempo');
  if (c === 'formato') return t('errFormato');
  if (/app[- ]?check|40[13]|permission|unauthenticated|API_KEY|api-not-enabled/i.test(m)) return t('errApp');
  if (/429|quota|rate limit|RESOURCE_EXHAUSTED/i.test(m)) return t('errLimite');
  if (navigator.onLine === false) return t('errRed');
  if (/import|fetch|network|load|module|Failed to/i.test(m)) return t('errCarga');
  return t('sinIA');
}

/* ---------- interfaz ---------- */
let dlg = null, lastFocus = null, ocupado = false, ultimoFin = 0, emocion = '', pestana = 'letra';
const q = (s, r) => (r || document).querySelector(s);
function aceptado() { try { return localStorage.getItem(K_OK) === '1'; } catch (e) { return !!window.__coachOk; } }
function aceptar() { window.__coachOk = true; try { localStorage.setItem(K_OK, '1'); } catch (e) { } }
function el(tag, cls, txt) { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

function textoDelBloc() {
  const ta = document.getElementById('mainTextarea'); if (!ta) return '';
  const ls = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
  return ls.slice(-LIM.lineasMax).join('\n').slice(-LIM.entrada);
}

function construir() {
  if (dlg) dlg.remove();
  dlg = el('div', 'glos coach hidden'); dlg.id = 'coach';
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'coachTitulo');
  const caja = el('div', 'glos-box coach-box');
  const cab = el('div', 'glos-head');
  const h = el('h2', null, t('titulo')); h.id = 'coachTitulo';
  const x = el('button', 'btn btn-ghost btn-small glos-close', t('cerrar')); x.type = 'button'; x.id = 'coachCerrar'; x.setAttribute('aria-label', t('cerrarAria'));
  cab.append(h, x);
  const cuerpo = el('div', 'coach-body');

  // Aviso de privacidad (antes del primer uso)
  const av = el('div', 'coach-aviso'); av.id = 'coachAviso';
  av.append(el('p', null, t('aviso')));
  const ok = el('button', 'btn btn-gold', t('avisoBtn')); ok.type = 'button'; ok.id = 'coachEntendido'; av.append(ok);

  // Pestañas
  const tabs = el('div', 'coach-tabs'); tabs.setAttribute('role', 'tablist');
  const tL = el('button', 'coach-tab', t('tabLetra')); tL.type = 'button'; tL.id = 'coachTabLetra'; tL.setAttribute('role', 'tab');
  const tD = el('button', 'coach-tab', t('tabDesa')); tD.type = 'button'; tD.id = 'coachTabDesa'; tD.setAttribute('role', 'tab');
  tabs.append(tL, tD);

  // Panel letra
  const pL = el('div', 'coach-panel'); pL.id = 'coachPanelLetra'; pL.setAttribute('role', 'tabpanel');
  pL.append(el('p', 'coach-help', t('letraAyuda')));
  const ta = el('textarea', 'coach-text'); ta.id = 'coachTexto'; ta.rows = 7; ta.maxLength = LIM.entrada; ta.placeholder = t('letraPh'); ta.setAttribute('aria-label', t('tabLetra')); ta.spellcheck = false;
  ta.value = textoDelBloc();
  const goL = el('button', 'btn btn-gold', t('letraGo')); goL.type = 'button'; goL.id = 'coachGoLetra';
  pL.append(ta, goL);

  // Panel desahógate
  const pD = el('div', 'coach-panel'); pD.id = 'coachPanelDesa'; pD.setAttribute('role', 'tabpanel');
  pD.append(el('p', 'coach-help', t('desaAyuda')));
  const lbl = el('span', 'lbl', t('emocion')); pD.append(lbl);
  const eb = el('div', 'vowels coach-emos'); eb.id = 'coachEmos'; eb.setAttribute('role', 'group'); eb.setAttribute('aria-label', t('emocion'));
  const EM = (window.FREESTYLE_DATA && window.FREESTYLE_DATA.EMOCIONES) || {};
  Object.keys(EM).forEach(k => {
    const b = el('button', 'emo-btn' + (k === emocion ? ' active' : ''), (EM[k].icon || '') + ' ' + (lang() === 'en' ? (EMO_EN[k] || EM[k].n) : EM[k].n)); b.type = 'button'; b.dataset.e = k; b.setAttribute('aria-pressed', k === emocion ? 'true' : 'false');
    b.addEventListener('click', () => { emocion = k; eb.querySelectorAll('.emo-btn').forEach(n => { const on = n.dataset.e === k; n.classList.toggle('active', on); n.setAttribute('aria-pressed', on ? 'true' : 'false'); }); });
    eb.append(b);
  });
  const goD = el('button', 'btn btn-gold', t('desaGo')); goD.type = 'button'; goD.id = 'coachGoDesa';
  pD.append(eb, goD);

  const estado = el('p', 'coach-estado'); estado.id = 'coachEstado'; estado.setAttribute('role', 'status'); estado.setAttribute('aria-live', 'polite');
  const donde = el('p', 'coach-donde hidden'); donde.id = 'coachDonde';
  const res = el('div', 'coach-result'); res.id = 'coachResultado';

  cuerpo.append(tabs, pL, pD, estado, donde, res);
  caja.append(cab, av, cuerpo); dlg.append(caja); document.body.appendChild(dlg);

  const mostrar = p => {
    pestana = p;
    tL.setAttribute('aria-selected', p === 'letra'); tD.setAttribute('aria-selected', p === 'desa');
    tL.classList.toggle('on', p === 'letra'); tD.classList.toggle('on', p === 'desa');
    pL.classList.toggle('hidden', p !== 'letra'); pD.classList.toggle('hidden', p !== 'desa');
    res.textContent = ''; estado.textContent = ''; donde.classList.add('hidden');
  };
  tL.addEventListener('click', () => mostrar('letra')); tD.addEventListener('click', () => mostrar('desa'));
  const refrescaAviso = () => { const si = aceptado(); av.classList.toggle('hidden', si); cuerpo.classList.toggle('hidden', !si); };
  ok.addEventListener('click', () => { aceptar(); refrescaAviso(); (pestana === 'letra' ? ta : tL).focus(); });
  refrescaAviso(); mostrar(pestana);

  x.addEventListener('click', cerrar);
  dlg.addEventListener('click', e => { if (e.target === dlg) cerrar(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
    if (e.key !== 'Tab') return;
    const f = [...dlg.querySelectorAll('button,textarea')].filter(n => n.offsetParent !== null && !n.disabled);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  goL.addEventListener('click', () => correr('letra'));
  goD.addEventListener('click', () => correr('desa'));
}

function seccion(padre, titulo) { const s = el('section', 'coach-sec'); s.append(el('h3', null, titulo)); padre.append(s); return s; }
function ul(items) { const u = el('ul', 'coach-list'); items.forEach(i => u.append(el('li', null, i))); return u; }

function pintar(cual, d, fuente) {
  const res = q('#coachResultado'), donde = q('#coachDonde'); res.textContent = '';
  const clave = 'donde_' + fuente; donde.textContent = T[lang()][clave] || t('donde_X'); donde.dataset.fuente = fuente; donde.classList.remove('hidden');
  if (cual === 'letra') {
    const a = seccion(res, t('rimas')); a.append(d.rimas.length ? ul(d.rimas) : el('p', 'coach-vacio', t('nadaRimas')));
    const b = seccion(res, t('desp')); b.append(d.desp.length ? ul(d.desp.map(x => t('linea')(x.linea) + x.motivo)) : el('p', 'coach-vacio', t('nadaDesp')));
    const c = seccion(res, t('ideas')); c.append(ul(d.ideas));
    if (d.mejorada) {
      const det = el('details', 'coach-sec'); det.id = 'coachMejorada'; det.append(el('summary', null, t('mejorada')));
      det.append(el('pre', 'coach-pre', d.mejorada));
      const cp = el('button', 'btn btn-ghost btn-small', t('copiar')); cp.type = 'button';
      cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(d.mejorada); cp.textContent = t('copiado'); setTimeout(() => { cp.textContent = t('copiar'); }, 1500); } catch (e) { } });
      det.append(cp); res.append(det);
    }
  } else {
    const a = seccion(res, t('palabras')); const chips = el('div', 'coach-chips'); d.palabras.forEach(p => chips.append(el('span', 'coach-chip', p))); a.append(chips);
    const b = seccion(res, t('imagenes')); b.append(ul(d.imagenes));
    const c = seccion(res, t('arranque')); c.append(el('blockquote', 'coach-quote', d.arranque));
  }
}

async function correr(cual) {
  const estado = q('#coachEstado'), res = q('#coachResultado'), donde = q('#coachDonde');
  if (ocupado) { estado.textContent = t('ocupado'); return; }
  const falta = Math.ceil((LIM.pausaMs - (Date.now() - ultimoFin)) / 1000);
  if (ultimoFin && falta > 0) { estado.textContent = t('espera')(falta); return; }
  res.textContent = ''; donde.classList.add('hidden');
  let prompt;
  if (cual === 'letra') {
    const crudo = q('#coachTexto').value;
    const lineas = crudo.split('\n').map(s => s.trim()).filter(Boolean);
    if (lineas.length < LIM.lineasMin) { estado.textContent = t('pocas'); return; }
    if (lineas.length > LIM.lineasMax) { estado.textContent = t('muchas'); return; }
    if (esCrisis(crudo)) { estado.textContent = ''; res.append(el('p', 'coach-crisis', t('crisis'))); return; }   // nada sale del dispositivo
    const num = lineas.map((s, i) => (i + 1) + '. ' + s.slice(0, LIM.lineaMax)).join('\n').slice(0, LIM.entrada);
    prompt = 'Rap lyrics, one numbered line per bar:\n' + num + '\n\nGive: (1) up to 5 possible internal rhymes found or suggested, (2) the lines whose syllable count is very different from the others, with the line number and a short reason, ' +
      '(3) exactly 3 ideas to continue, (4) an optional improved version of the lyrics (same meaning, better flow). Reply in ' + (lang() === 'en' ? 'English' : 'Spanish') + ' (keep the original language of the lyrics inside rhymes and the improved version).';
  } else {
    if (!emocion) { estado.textContent = t('elige'); return; }
    const EM = (window.FREESTYLE_DATA && window.FREESTYLE_DATA.EMOCIONES) || {};
    const nombre = lang() === 'en' ? (EMO_EN[emocion] || emocion) : ((EM[emocion] && EM[emocion].n) || emocion);
    prompt = 'The person wants to vent through freestyle rap and feels: ' + nombre + '.\nGive exactly 5 words, 3 images (short vivid scenes) and one opening line for a verse. Reply in ' + (lang() === 'en' ? 'English' : 'Spanish') + '.';
  }
  ocupado = true; dlg.querySelectorAll('#coachGoLetra,#coachGoDesa').forEach(b => { b.disabled = true; });
  estado.textContent = t('pensando');
  try {
    const { texto, fuente } = await pedirIA(cual, prompt, null);
    const o = leerJSON(texto);
    pintar(cual, cual === 'letra' ? limpiaLetra(o) : limpiaDesa(o), fuente);
    estado.textContent = '';
  } catch (e) {
    estado.textContent = mensajeError(e);
    try { console.warn('[Coach]', e && (e.codigoCoach || e.code), e && e.message); } catch (x) { }
  } finally {
    ocupado = false; ultimoFin = Date.now();
    if (dlg) dlg.querySelectorAll('#coachGoLetra,#coachGoDesa').forEach(b => { b.disabled = false; });
  }
}

function abrir(cual, opciones) {
  const o = opciones || {};
  if (o.emocion) emocion = o.emocion;
  if (cual === 'letra' || cual === 'desa') pestana = cual;
  construir();
  lastFocus = document.activeElement; dlg.classList.remove('hidden');
  document.body.classList.add('glos-abierto');
  const b = q('#btnCoach'); if (b) b.setAttribute('aria-expanded', 'true');
  const foco = aceptado() ? (pestana === 'letra' ? q('#coachTexto') : q('#coachTabDesa')) : q('#coachEntendido');
  if (foco) foco.focus();
}
function cerrar() {
  if (!dlg) return;
  dlg.classList.add('hidden'); document.body.classList.remove('glos-abierto');
  const b = q('#btnCoach'); if (b) b.setAttribute('aria-expanded', 'false');
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function enganchar() {
  const top = document.getElementById('btnCoach');
  if (top) { top.addEventListener('click', () => { if (dlg && !dlg.classList.contains('hidden')) cerrar(); else abrir('letra'); }); }
  const l = document.getElementById('btnCoachLetra'); if (l) l.addEventListener('click', () => abrir('letra'));
  const d = document.getElementById('btnCoachDesa'); if (d) d.addEventListener('click', () => {
    let e = ''; try { e = JSON.parse(localStorage.getItem('flowlab_school_emocion') || '""') || ''; } catch (x) { }
    abrir('desa', { emocion: e });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar); else enganchar();

window.Coach = { abrir, cerrar, version: SDK_VERSION, esCrisis, _limites: LIM };

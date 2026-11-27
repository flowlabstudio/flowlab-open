'use strict';
/* =====================================================================
   FlowLab Studio · sw.js (service worker)
   Guarda en el teléfono/PC SOLO los archivos propios del estudio para que
   abra rápido y funcione sin internet. NUNCA toca lo externo (YouTube,
   Datamuse…): esas peticiones pasan directo, como si el worker no existiera.

   Estrategia: "red primero". Si hay internet siempre trae la versión nueva;
   si no hay (o tarda más de 6 s), usa la copia guardada.
   Al publicar una versión nueva, sube el número de VERSION.
   ===================================================================== */
const VERSION = 'flowlab-v60';
const SAMPLE_PACK_FILES = [
  'assets/sounds/packs/01-hard-trap/808s/808-bass-dist.wav',
  'assets/sounds/packs/01-hard-trap/808s/808-bass-sub.wav',
  'assets/sounds/packs/01-hard-trap/808s/808-dist-long.wav',
  'assets/sounds/packs/01-hard-trap/claps/cl.wav',
  'assets/sounds/packs/01-hard-trap/claps/clap-01.wav',
  'assets/sounds/packs/01-hard-trap/fx/cy5075.wav',
  'assets/sounds/packs/01-hard-trap/fx/fx-cymbal.wav',
  'assets/sounds/packs/01-hard-trap/hi-hats/ch.wav',
  'assets/sounds/packs/01-hard-trap/hi-hats/hi-hat-closed-01.wav',
  'assets/sounds/packs/01-hard-trap/kicks/hard-kick-01.wav',
  'assets/sounds/packs/01-hard-trap/kicks/hard-kick-02.wav',
  'assets/sounds/packs/01-hard-trap/kicks/hard-kick-03.wav',
  'assets/sounds/packs/01-hard-trap/open-hats/open-hat-01.wav',
  'assets/sounds/packs/01-hard-trap/percs/perc-cowbell.wav',
  'assets/sounds/packs/01-hard-trap/percs/perc-low-tom.wav',
  'assets/sounds/packs/01-hard-trap/percs/perc-rimshot.wav',
  'assets/sounds/packs/01-hard-trap/snares/hard-snare-01.wav',
  'assets/sounds/packs/01-hard-trap/snares/hard-snare-02.wav',
  'assets/sounds/packs/01-hard-trap/snares/hard-snare-03.wav',
  'assets/sounds/packs/02-bounce/808s/808-bass-long.wav',
  'assets/sounds/packs/02-bounce/808s/808-bass-punch.wav',
  'assets/sounds/packs/02-bounce/808s/808-round-long.wav',
  'assets/sounds/packs/02-bounce/claps/clap-01.wav',
  'assets/sounds/packs/02-bounce/claps/cp.wav',
  'assets/sounds/packs/02-bounce/fx/fx-cymbal.wav',
  'assets/sounds/packs/02-bounce/hi-hats/hi-hat-closed-01.wav',
  'assets/sounds/packs/02-bounce/kicks/bounce-kick-01.wav',
  'assets/sounds/packs/02-bounce/kicks/bounce-kick-02.wav',
  'assets/sounds/packs/02-bounce/kicks/bounce-kick-03.wav',
  'assets/sounds/packs/02-bounce/open-hats/open-hat-01.wav',
  'assets/sounds/packs/02-bounce/percs/lt25.wav',
  'assets/sounds/packs/02-bounce/percs/perc-high-tom.wav',
  'assets/sounds/packs/02-bounce/percs/perc-low-tom.wav',
  'assets/sounds/packs/02-bounce/snares/bounce-snare-01.wav',
  'assets/sounds/packs/02-bounce/snares/bounce-snare-02.wav',
  'assets/sounds/packs/02-bounce/snares/bounce-snare-03.wav',
  'assets/sounds/packs/03-soulful-vintage/808s/808-bass-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/808s/808-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/claps/cl-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/claps/vintage-clap-01.wav',
  'assets/sounds/packs/03-soulful-vintage/fx/cy0000-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/fx/fx-cymbal.wav',
  'assets/sounds/packs/03-soulful-vintage/hi-hats/ch-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/hi-hats/hi-hat-closed-01.wav',
  'assets/sounds/packs/03-soulful-vintage/kicks/vintage-kick-01.wav',
  'assets/sounds/packs/03-soulful-vintage/kicks/vintage-kick-02.wav',
  'assets/sounds/packs/03-soulful-vintage/kicks/vintage-kick-03.wav',
  'assets/sounds/packs/03-soulful-vintage/open-hats/oh00-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/open-hats/open-hat-01.wav',
  'assets/sounds/packs/03-soulful-vintage/percs/ht00-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/percs/lt00-lofi.wav',
  'assets/sounds/packs/03-soulful-vintage/percs/perc-high-tom.wav',
  'assets/sounds/packs/03-soulful-vintage/percs/perc-low-tom.wav',
  'assets/sounds/packs/03-soulful-vintage/percs/perc-maraca.wav',
  'assets/sounds/packs/03-soulful-vintage/snares/vintage-snare-01.wav',
  'assets/sounds/packs/03-soulful-vintage/snares/vintage-snare-02.wav',
  'assets/sounds/packs/03-soulful-vintage/snares/vintage-snare-03.wav'
];
const INSTRUMENT_SAMPLE_FILES = [
  'assets/sounds/instruments/piano-c4.mp3',
  'assets/sounds/instruments/rhodes-c4.mp3',
  'assets/sounds/instruments/guitar-c4.mp3',
  'assets/sounds/instruments/strings-c4.mp3',
  'assets/sounds/instruments/brass-c4.mp3',
  'assets/sounds/instruments/marimba-c4.mp3',
  'assets/sounds/instruments/flute-c4.mp3'
];
const CORE = [
  'assets/noise.svg',
  './', 'styles.css', 'legal.css',
  'loader.js', 'app.js', 'autotune-worklet.js', 'freestyle-data.js', 'freestyle-school.js', 'cabina.js', 'beats.js', 'presets.js', 'help.js', 'glosario.js', 'ai-coach.js', 'i18n.js', 'pwa.js',
  'burbuja-ia.js', 'graffiti.js', 'feedback.js', 'inicio.js', 'escuela-ia.js', 'editor-voz.js', 'rapear-imagenes.js', 'i18n-en.js', 'i18n-ayudas.js', 'tema-elite.css',
  'assets/img/hero.webp', 'assets/img/hero-2.webp', 'assets/img/genre-trap.webp', 'assets/img/genre-boombap.webp', 'assets/img/genre-reggaeton.webp',
  'assets/img/rap/rap-1.webp', 'assets/img/rap/rap-2.webp', 'assets/img/rap/rap-3.webp', 'assets/img/rap/rap-4.webp',
  'assets/img/rap/rap-5.webp', 'assets/img/rap/rap-6.webp', 'assets/img/rap/rap-7.webp', 'assets/img/rap/rap-8.webp',
  'assets/img/rap/rap-9.webp', 'assets/img/rap/rap-10.webp', 'assets/img/rap/rap-11.webp', 'assets/img/rap/rap-12.webp',
  'assets/bases/cold-steel-keys.mp3', 'assets/bases/dembow-heat.mp3', 'assets/bases/dusty-keys.mp3', 'assets/bases/fiesta-dembow.mp3',
  'assets/bases/guitarra-verano.mp3', 'assets/bases/midnight-rhodes.mp3', 'assets/bases/midnight-slideway.mp3', 'assets/bases/noche-sensual.mp3',
  'assets/bases/sombra-nocturna.mp3', 'assets/bases/velocidad-maxima.mp3',
  'assets/sounds/kick.wav', 'assets/sounds/snare.wav', 'assets/sounds/hihat.wav', 'assets/sounds/808.wav',
  ...SAMPLE_PACK_FILES,
  ...INSTRUMENT_SAMPLE_FILES,
  'assets/fonts/inter-latin-wght.woff2', 'assets/fonts/barlow-condensed-700-latin.woff2', 'assets/fonts/barlow-condensed-800-latin.woff2',
  'assets/fonts/barlow-condensed-900-latin.woff2', 'assets/fonts/permanent-marker-latin.woff2',
  'manifest.json', 'favicon.ico', 'apple-touch-icon.png', 'privacidad.html', '404.html',
  'assets/logo.svg', 'assets/og-image.png', 'assets/loader-flowlab.webp', 'assets/silencio.mp3', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png'
];
const SLOW_MS = 6000;

// Un hosting puede responder con una redirección (/privacidad.html -> /privacidad). El navegador no acepta
// esas copias al abrir una página sin internet, así que se guardan "limpias" (sin la marca de redirección).
function limpia(res) {
  return res.redirected ? new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers }) : res;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Uno por uno: si un archivo falla, los demás igual se guardan
    await Promise.allSettled(CORE.map(async u => {
      const res = await fetch(u);
      if (res.ok) await cache.put(u, limpia(res));
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('flowlab-') && n !== VERSION).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  const saved = await cache.match(req, { ignoreSearch: true });
  try {
    const net = fetch(req);
    // Con copia guardada, si la red tarda demasiado se usa la copia (conexión mala)
    const res = saved
      ? await Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error('lento')), SLOW_MS))])
      : await net;
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (e) {
    if (saved) return saved;
    if (req.mode === 'navigate') {
      const u = new URL(req.url);
      // Sin internet: /privacidad (o /privacidad.html) -> la copia guardada; si no existe, el inicio
      const page = await cache.match(u.pathname.replace(/\/$/, '') + (u.pathname.endsWith('.html') ? '' : '.html'));
      const home = page || await cache.match('./');
      if (home) return home;
    }
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // YouTube, Datamuse y todo lo externo: no se toca
  if (req.headers.has('range')) return;            // audio/video por partes: lo maneja el navegador
  event.respondWith(networkFirst(req));
});

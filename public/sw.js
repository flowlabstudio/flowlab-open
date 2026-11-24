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
const VERSION = 'flowlab-v45';
const CORE = [
  './', 'styles.css',
  'app.js', 'autotune-worklet.js', 'freestyle-data.js', 'freestyle-school.js', 'cabina.js', 'beats.js', 'presets.js', 'help.js', 'glosario.js', 'ai-coach.js', 'burbuja-ia.js', 'graffiti.js', 'feedback.js', 'escuela-ia.js', 'editor-voz.js', 'rapear-imagenes.js', 'tema-elite.css', 'assets/img/hero.webp', 'assets/img/hero-2.webp', 'assets/img/genre-trap.webp', 'assets/img/genre-boombap.webp', 'assets/img/genre-reggaeton.webp', 'i18n.js', 'pwa.js',
  'assets/fonts/inter-latin-wght.woff2',
  'manifest.json', 'favicon.ico', 'apple-touch-icon.png', 'legal.css', 'privacidad.html', '404.html',
  'assets/logo.svg', 'assets/silencio.mp3', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png'
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

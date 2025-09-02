/* CassinoSegnala – Service Worker con cache dinamica + fallback offline */
const VERSION = 'v7';
const CACHE_NAME = `cassinosignal-cache-${VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))))
  );
  self.clients.claim();
});

// Pagine: network-first → cache → offline.html
// Asset/GET: stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => { const clone = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, clone)); return res; })
        .catch(async () => (await caches.match(req)) || caches.match('./offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => { const clone = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, clone)); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});

const CACHE = 'cassinosignal-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './service-worker.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Cache-first solo per la nostra origin
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request))
    );
  } else {
    // CDN/network default
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
  }
});

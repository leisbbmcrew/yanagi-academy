// Yanagi Academy — service worker minimo per il funzionamento offline
// e per rendere l'app installabile (richiesto da PWA Builder / Android).

const CACHE = 'yanagi-academy-v1';
const SHELL = ['./', './index.html', './data.json', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Rete prima (per avere sempre schede aggiornate), con la cache come riserva
// se il telefono è offline o la rete non risponde.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});

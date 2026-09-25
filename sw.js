// Yanagi Academy — service worker
// Ogni pagina HTML e data.json vengono sempre presi dalla rete, per non
// mostrare mai una versione vecchia (vale per index.html, editor.html e
// qualunque altra pagina del sito). Solo le icone restano in cache, per far
// funzionare l'installazione dell'app anche offline.

const CACHE = 'yanagi-academy-v3';
const STATIC = ['./manifest.json', './icon-192.png', './icon-512.png',
  './icon-maskable-192.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function isContent(url) {
  // Qualunque pagina HTML (index.html, editor.html, future pagine) o dato
  // JSON deve sempre arrivare fresca dalla rete, mai da una copia salvata.
  return url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json');
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (isContent(url)) {
    // Sempre dalla rete, mai dalla cache: qui vive il contenuto che aggiorni.
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request)));
    return;
  }

  // Icone e manifest: veloci dalla cache, aggiornati in background.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetching = fetch(e.request).then((res) => {
        caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetching;
    })
  );
});

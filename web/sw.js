const CACHE = 'ledger-v4';
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/css/style.css',
  '/js/config.js',
  '/js/data.js',
  '/js/explainers.js',
  '/js/charts.js',
  '/js/views.js',
  '/js/app.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never intercept API or SSE
  if (e.request.url.includes('/api/')) return;
  if (e.request.method !== 'GET') return;

  // Network-first for HTML (always fresh)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
    )
  );
});

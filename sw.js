const CACHE_NAME = 'sub68-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/db.js',
  '/js/sync.js',
  '/js/charts.js',
  '/js/config.js',
  '/js/data/athlete.js',
  '/js/data/plan-data.js',
  '/js/tabs/dashboard.js',
  '/js/tabs/log.js',
  '/js/tabs/plan.js',
  '/js/tabs/analyse.js',
  '/js/tabs/coach.js',
  '/js/tabs/settings.js',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('cdn.jsdelivr.net') || e.request.url.includes('fonts.googleapis')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  if (e.request.url.includes('supabase.co') || e.request.url.includes('anthropic.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

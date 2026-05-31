// Cronos — Service Worker v2
const CACHE_NAME = 'cronos-v2';
const STATIC_ASSETS = [
  '/S140.I.A/',
  '/S140.I.A/index.html',
  '/S140.I.A/manifest.json',
  '/S140.I.A/icon-192.png',
  '/S140.I.A/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
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

// Network first — sempre busca a versão mais recente
self.addEventListener('fetch', e => {
  if (e.request.url.includes('firestore') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic') ||
      e.request.url.includes('jw.org') ||
      e.request.url.includes('workers.dev')) {
    return;
  }

  // Para HTML: sempre busca da rede (nunca cache)
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Cronos', {
      body: data.body || '',
      icon: '/S140.I.A/icon-192.png',
      badge: '/S140.I.A/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/S140.I.A/'));
});

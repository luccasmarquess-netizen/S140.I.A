// Cronos — Service Worker
// Gerencia cache offline e notificações push

const CACHE_NAME = 'cronos-v1';
const STATIC_ASSETS = [
  '/S140.I.A/',
  '/S140.I.A/index.html',
  '/S140.I.A/manifest.json',
  '/S140.I.A/icon-192.png',
  '/S140.I.A/icon-512.png',
];

// Instala e faz cache dos assets estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: network first, fallback para cache
self.addEventListener('fetch', e => {
  // Ignora requisições do Firebase e APIs externas
  if (e.request.url.includes('firestore') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic') ||
      e.request.url.includes('jw.org') ||
      e.request.url.includes('workers.dev')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza cache com resposta nova
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Notificações push (para uso futuro com FCM)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Cronos', {
      body: data.body || '',
      icon: '/S140.I.A/icon-192.png',
      badge: '/S140.I.A/icon-192.png',
      data: data,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/S140.I.A/'));
});

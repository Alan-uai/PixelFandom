const CACHE_NAME = 'pixelfandom-v1';
const STATIC_CACHE = 'pixelfandom-static-v1';
const WIKI_CACHE = 'pixelfandom-wiki-v1';

const STATIC_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ]).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== WIKI_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  if (path.startsWith('/api/')) return;

  const isStatic = STATIC_EXTENSIONS.some((ext) => path.endsWith(ext));
  if (isStatic || path === '/manifest.json') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached || new Response('Offline', { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  if (path.startsWith('/w/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(WIKI_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached || new Response('Offline', { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match('/').then((cached) => cached || new Response('Offline', { status: 503 }));
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'PixelFandom', options)
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification('PixelFandom', { body: event.data.text() })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

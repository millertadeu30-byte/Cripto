// Self-destructing Service Worker to resolve caching/blank screen issues on Vercel
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch directly from network. Do not cache or intercept requests anymore!
  event.respondWith(fetch(event.request));
});


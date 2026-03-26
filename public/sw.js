const CACHE_NAME = 'vocab-app-v1';
// Hier nur die absolut kritischen Dateien, damit das UI lädt
const ASSETS = [
  '/',
  '/css/main.css',
  '/js/api.js',
  '/icons/icon-192.png',
  '/manifest.json'
];

// Installieren und Grundgerüst cachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Anfragen abfangen
self.addEventListener('fetch', event => {
  // Wir cachen nur GET-Anfragen (keine API-Posts oder Vokabel-Uploads!)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Neue Version im Hintergrund in den Cache legen
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
          // Wenn Netzwerk komplett weg ist, passiert nichts, 
          // die cachedResponse wird unten zurückgegeben
      });

      // Gib die Cache-Version sofort zurück (schnell), 
      // während das Netzwerk im Hintergrund updatet
      return cachedResponse || fetchPromise;
    })
  );
});


// service-worker.js

self.addEventListener('install', (event) => {
  // Sofort aktiv werden (optional)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Kontrolle über alle Clients übernehmen (optional)
  event.waitUntil(self.clients.claim());
});

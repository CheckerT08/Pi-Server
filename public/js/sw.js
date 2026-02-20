// public/sw.js
self.addEventListener('install', e => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', e => {}); // leere fetch-Handler reicht
// Cadence — Service Worker
// Bump CACHE_VERSION on every push to ensure users get the latest version.

const CACHE_VERSION = 'cadence-v2';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap',
];

// Install: cache all core files, then immediately activate
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting()) // take control immediately
  );
});

// Activate: remove ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // take control of all open pages
  );
});

// Fetch: network-first for the HTML file so updates are always picked up.
// Cache-first for everything else (fonts, icons, etc.).
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const isHTML = event.request.destination === 'document' ||
                 event.request.url.endsWith('.html') ||
                 event.request.url.endsWith('/');

  if (isHTML) {
    // Network-first: always try to get the latest HTML
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // fall back to cache if offline
    );
  } else {
    // Cache-first for assets
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        });
      })
    );
  }
});

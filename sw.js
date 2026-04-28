// Cadence — Service Worker
// Caches the app for fully offline use.
// Bump CACHE_VERSION whenever you push a significant update.

const CACHE_VERSION = 'cadence-v1';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap',
];

// Install: cache all core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Don't intercept non-GET or chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Serve from cache, refresh in background
        const networkFetch = fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_VERSION).then(cache => {
                cache.put(event.request, response.clone());
              });
            }
            return response;
          })
          .catch(() => {});
        return cached;
      }
      // Not in cache — fetch from network
      return fetch(event.request).catch(() => {
        // If offline and no cache, return nothing gracefully
      });
    })
  );
});

// Service Worker for Basketball Team Manager PWA
// Update this version number when deploying new versions
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `basketball-manager-${CACHE_VERSION}`;
const BASE_PATH = '/Basketball-Team-Manager';

// Files to cache for offline use
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/logo.jpeg`,
  `${BASE_PATH}/team-logo.svg`,
  `${BASE_PATH}/manifest.json`,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Cache addAll failed:', err);
      });
    }).then(() => {
      console.log('[SW] Skip waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('basketball-manager-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        // For navigation requests, also check network in background
        if (request.mode === 'navigate') {
          event.waitUntil(
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                return caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            }).catch(() => {
              // Network error, but we have cache
            })
          );
        }
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Cache the fetched resource
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('[SW] Fetch failed:', error);
        // Return offline page if available
        if (request.mode === 'navigate') {
          return caches.match(`${BASE_PATH}/index.html`);
        }
        throw error;
      });
    })
  );
});

// Message event - for update notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

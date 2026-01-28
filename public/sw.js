/**
 * CinePet Studio Service Worker
 * Enables offline support and PWA installation
 */

const CACHE_NAME = 'cinepet-studio-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&family=Bebas+Neue&display=swap'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache core assets, but don't fail if some can't be cached
      await Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('Failed to cache:', url, err))
        )
      );
      // Activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
      // Take control of all pages immediately
      self.clients.claim();
    })()
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Handle API calls (Gemini, Google APIs) - network only, no caching
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('stripe.com')
  ) {
    return; // Let the browser handle these normally
  }

  // Handle font requests - cache first
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // If offline and no cache, return empty response for fonts
          return new Response('', { status: 503 });
        }
      })()
    );
    return;
  }

  // Handle CDN resources (Tailwind, esm.sh) - stale-while-revalidate
  if (
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('esm.sh') ||
    url.hostname.includes('cdn-icons-png.flaticon.com')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        // Fetch in background to update cache
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Return cached version immediately if available
        return cachedResponse || fetchPromise;
      })()
    );
    return;
  }

  // Handle app navigation and static assets - network first, cache fallback
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, return cached index.html
        if (request.mode === 'navigate') {
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
        }

        // Return offline response
        return new Response('Offline - Please check your connection', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Background sync for cloud uploads (when online again)
self.addEventListener('sync', (event) => {
  if (event.tag === 'cloud-sync') {
    event.waitUntil(
      // Notify clients to retry cloud sync
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_READY' });
        });
      })
    );
  }
});

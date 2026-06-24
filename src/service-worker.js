import { build, files, version } from '$service-worker';

const CACHE_NAME = `kjv-reader-cache-${version}`;

// Core assets to pre-cache immediately on install
const ASSETS_TO_CACHE = build.concat(files).concat(['/']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => {
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      // Delete old caches
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.headers.has('range')) return;

  const url = new URL(event.request.url);

  // Don't try to cache external APIs or developer server requests
  const isHttp = url.protocol.startsWith('http');
  const isDevServerRequest = url.hostname === 'localhost' && url.port !== '';
  const isSelf = url.host === self.location.host;

  if (!isHttp || isDevServerRequest || !isSelf) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. For static assets (build files, favicon, etc.), use Cache-First strategy
      const isStaticAsset = build.includes(url.pathname) || files.includes(url.pathname);
      if (isStaticAsset) {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;
      }

      // 2. For routing pages (navigation) and other assets, use Network-First falling back to Cache
      try {
        const response = await fetch(event.request);
        if (response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        // Fallback to cache for offline navigation
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        // If offline and request is page navigation, return cached root (SPA fallback)
        if (event.request.mode === 'navigate') {
          const rootResponse = await cache.match('/');
          if (rootResponse) return rootResponse;
        }

        throw err;
      }
    })
  );
});

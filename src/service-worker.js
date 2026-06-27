import { build, files, version } from '$service-worker';

const CACHE_NAME = `kjv-reader-cache-${version}`;

// Core assets to pre-cache immediately on install
const ASSETS_TO_CACHE = build.concat(files).concat(['/']);

// Helper to clean cached response headers to prevent NS_ERROR_CORRUPTED_CONTENT in Firefox
// by removing the content-encoding compression headers on cache writes.
async function cleanResponse(response) {
  if (!response) return response;
  
  if (response.headers.has('content-encoding')) {
    const cleanHeaders = new Headers(response.headers);
    cleanHeaders.delete('content-encoding');
    
    try {
      // Resolve body as blob to avoid stream locking exceptions
      const blob = await response.blob();
      return new Response(blob, {
        status: response.status,
        statusText: response.statusText,
        headers: cleanHeaders
      });
    } catch (err) {
      console.warn('Failed to decompress cached body stream, falling back to original:', err);
      return response;
    }
  }
  
  return response;
}

// Background clean and cache helper
async function cleanAndCache(cache, request, response) {
  try {
    const cleaned = await cleanResponse(response);
    await cache.put(request, cleaned);
  } catch (err) {
    console.warn('Failed to cache resource asynchronously:', request.url, err);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // Safe pre-caching: cache assets individually to prevent the entire process 
        // from failing if a single resource fails to load (e.g. static server returning 404 for some files).
        const promises = ASSETS_TO_CACHE.map(async (asset) => {
          try {
            const response = await fetch(asset);
            if (response.status === 200) {
              const cleaned = await cleanResponse(response);
              await cache.put(asset, cleaned);
            }
          } catch (err) {
            console.warn(`[ServiceWorker] Skipping pre-cache for asset: ${asset}`, err);
          }
        });
        await Promise.all(promises);
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
      const path = url.pathname;
      const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path;

      // 1. For static assets (build files, favicon, etc.), use Cache-First strategy
      const isStaticAsset = 
        build.includes(path) || 
        build.includes(pathWithoutSlash) || 
        files.includes(path) || 
        files.includes(pathWithoutSlash);

      if (isStaticAsset) {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse; // Returned directly, already cleaned!
      }

      // 2. For routing pages (navigation) and other assets, use Network-First falling back to Cache
      try {
        const response = await fetch(event.request);
        if (response.status === 200) {
          // Perform clean caching in the background
          cleanAndCache(cache, event.request, response.clone());
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

        // Return standard browser network error response instead of throwing raw error, to avoid console crash logs
        return Response.error();
      }
    })
  );
});

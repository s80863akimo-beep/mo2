const CACHE_NAME = 'momohair-shell-v68-visual-crm-panel';
const APP_VERSION = '2026.07.10-visual-crm-panel';
const APP_SHELL = [
  '/',
  `/assets/tailwind.css?v=${APP_VERSION}`,
  `/assets/momo-core.js?v=${APP_VERSION}`,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/momo-logo-mark.png'
];

async function isValidAppShellResponse(response) {
  if (!response || !response.ok) return false;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return false;
  try {
    const text = await response.clone().text();
    return text.includes('<div id="app"') && text.includes('APP_VERSION');
  } catch (error) {
    return false;
  }
}

async function fetchAndUpdateAppShell(request) {
  const response = await fetch(request, { cache: 'reload' });
  if (await isValidAppShellResponse(response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/', response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    await Promise.all(APP_SHELL.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' });
      if (response.ok) await cache.put(url, response);
    }));
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname === '/health') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((cached) => {
        const networkUpdate = fetchAndUpdateAppShell(request).catch(() => null);
        event.waitUntil(networkUpdate);
        return cached || networkUpdate;
      })
    );
    return;
  }

  if (url.pathname === '/assets/tailwind.css') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkUpdate = fetch(request, { cache: 'reload' }).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          }
          return response;
        }).catch(() => null);
        event.waitUntil(networkUpdate);
        return cached || networkUpdate;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});

const CACHE_NAME = 'momohair-shell-v34-console-cleanup';
const APP_SHELL = [
  '/',
  '/assets/tailwind.css',
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
    return text.includes('<div id="app"') && text.includes('摸摸頭營運總部');
  } catch (error) {
    return false;
  }
}

async function fetchAndUpdateAppShell(request) {
  const response = await fetch(request);
  if (await isValidAppShellResponse(response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/', response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
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

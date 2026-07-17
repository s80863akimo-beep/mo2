const APP_VERSION = '2026.07.17-data-correction-1';
// Cache identity is derived from the release identity so a failed install can
// never partially overwrite the currently active app shell.
const CACHE_NAME = `momohair-shell-${APP_VERSION}`;
const APP_SHELL = [
  '/',
  `/assets/tailwind.css?v=${APP_VERSION}`,
  `/assets/vue.global.prod.js?v=${APP_VERSION}`,
  `/assets/momo-ui.css?v=${APP_VERSION}`,
  `/assets/momo-core.js?v=${APP_VERSION}`,
  `/assets/momo-app.js?v=${APP_VERSION}`,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/momo-logo-mark.png'
];
const APP_SHELL_PATHS = new Set(APP_SHELL.map((url) => new URL(url, self.location.origin).pathname));

async function isValidAppShellResponse(response) {
  if (!response || !response.ok) return false;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return false;
  try {
    const text = await response.clone().text();
    return text.includes('<div id="app"') && text.includes('/assets/momo-app.js?v=');
  } catch (error) {
    return false;
  }
}

async function isValidShellAssetResponse(url, response) {
  if (!response || !response.ok) return false;
  const pathname = new URL(url, self.location.origin).pathname;
  if (pathname === '/') return isValidAppShellResponse(response);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (pathname.endsWith('.js')) return contentType.includes('javascript');
  if (pathname.endsWith('.css')) return contentType.includes('text/css');
  if (pathname.endsWith('.webmanifest')) return contentType.includes('json') || contentType.includes('manifest');
  if (/\.(?:png|jpg|jpeg|webp|svg)$/.test(pathname)) return contentType.startsWith('image/');
  return true;
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
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    await Promise.all(APP_SHELL.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' });
      if (!await isValidShellAssetResponse(url, response)) {
        throw new Error(`Invalid app shell response: ${url}`);
      }
      await cache.put(url, response);
    }));
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
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

  if (APP_SHELL_PATHS.has(url.pathname) && url.pathname !== '/') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const previousVersion = await caches.match(url.pathname, { ignoreSearch: true });
        try {
          const response = await fetch(request, { cache: 'reload' });
          if (!await isValidShellAssetResponse(request.url, response.clone())) {
            throw new Error(`Invalid shell asset response: ${url.pathname}`);
          }
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
          return response;
        } catch (error) {
          return previousVersion || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }))
  );
});

// Service Worker para cache e offline support
const CACHE_NAME = 'agro-data-navigator-v1';
const STATIC_CACHE_NAME = 'agro-data-navigator-static-v1';

// Assets para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Ativar imediatamente
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Controlar todas as páginas imediatamente
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http(s) schemes (e.g., chrome-extension) because Cache API does not support them
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Estratégia: Cache First para assets estáticos
  if (request.method === 'GET') {
    // Cache assets estáticos (JS, CSS, imagens)
    if (
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.woff2')
    ) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            // Não cachear se não for sucesso
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          });
        })
      );
      return;
    }

    // Estratégia: Network First para API calls
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Cache apenas respostas de sucesso
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback para cache se network falhar
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Retornar resposta offline genérica
              return new Response(
                JSON.stringify({ error: 'Offline', message: 'Você está offline' }),
                {
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            });
          })
      );
      return;
    }

    // Estratégia: Network First para páginas HTML
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
  }
});

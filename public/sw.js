// Service Worker para PWA - Cache First Strategy
const CACHE_NAME = 'labelguard-v1.2.0';
const STATIC_CACHE_NAME = 'labelguard-static-v1.2.0';
const DYNAMIC_CACHE_NAME = 'labelguard-dynamic-v1.2.0';

// Recursos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/src/assets/colormaq-logo.svg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache recursos estáticos
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pré-cache da aplicação
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Pre-caching app shell...');
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css'
        ].filter(url => !STATIC_ASSETS.includes(url)));
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições - Cache First Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estratégia Cache First para recursos estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset) || 
      request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          console.log('[SW] Serving from cache:', request.url);
          return response;
        }
        
        console.log('[SW] Fetching and caching:', request.url);
        return fetch(request).then(fetchResponse => {
          // Só cache recursos válidos
          if (fetchResponse && fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return fetchResponse;
        }).catch(() => {
          // Fallback para recursos offline
          if (request.destination === 'document') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Estratégia Network First para API e conteúdo dinâmico
  event.respondWith(
    fetch(request).then(response => {
      // Cache respostas válidas dinamicamente
      if (response && response.status === 200 && request.method === 'GET') {
        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    }).catch(() => {
      // Fallback para cache em caso de falha de rede
      return caches.match(request).then(response => {
        if (response) {
          console.log('[SW] Serving from cache (offline):', request.url);
          return response;
        }
        
        // Fallback final
        if (request.destination === 'document') {
          return caches.match('/');
        }
        
        return new Response('Offline', { 
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Sync de fundo para dados offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-validation') {
    event.waitUntil(syncValidationData());
  }
});

// Função para sincronizar dados de validação
async function syncValidationData() {
  try {
    console.log('[SW] Syncing validation data...');
    // Aqui você pode implementar a sincronização com servidor
    // Por enquanto, apenas log
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Notificação push (futura implementação)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: 'Nova validação disponível',
    icon: '/icons/icon-96x96.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('LabelGuard', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
// sw.js - Service Worker para PWA Visa
const CACHE_NAME = 'visa-pwa-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Archivos que se cachean al instalar
const urlsToCache = [
  '/',
  '/index.html',
  '/cliente/',
  '/cliente/index.html',
  '/offline.html',
  // Tailwind CSS desde CDN
  'https://cdn.tailwindcss.com',
  // Firebase desde CDN  
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js',
  // Iconos y assets
  '/favicon.ico'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Archivos cacheados correctamente');
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error al cachear archivos:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado');
      // Tomar control inmediato de todas las páginas
      return self.clients.claim();
    })
  );
});

// Interceptar requests (estrategia de cache)
self.addEventListener('fetch', (event) => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requests de Firebase Auth/Firestore en tiempo real
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('firestore') ||
      event.request.url.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolverlo
        if (response) {
          console.log('📦 Desde cache:', event.request.url);
          return response;
        }

        // Si no está en cache, fetch de la red
        return fetch(event.request)
          .then((response) => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar respuesta para cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla la red, mostrar página offline
            console.log('🔴 Sin conexión, mostrando offline');
            return caches.match(OFFLINE_URL);
          });
      })
  );
});

// Manejar actualizaciones del Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Saltando espera para nueva versión');
    self.skipWaiting();
  }
});

// Push notifications (opcional - para futuras notificaciones)
self.addEventListener('push', (event) => {
  console.log('📨 Push notification recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore', 
        title: 'Ver detalles',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close', 
        title: 'Cerrar',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('PWA Visa', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Click en notificación');
  
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Solo cerrar notificación
    console.log('Notificación cerrada');
  }
});

// Background Sync (opcional - para sincronizar cuando hay conexión)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'video-upload') {
    event.waitUntil(
      // Aquí puedes agregar lógica para sincronizar videos pendientes
      syncPendingVideos()
    );
  }
});

async function syncPendingVideos() {
  // Lógica para sincronizar videos cuando hay conexión
  console.log('🎥 Sincronizando videos pendientes...');
  
  try {
    // Aquí implementarías la lógica de sincronización
    // Por ejemplo, obtener videos del IndexedDB y subirlos
    
    console.log('✅ Videos sincronizados');
  } catch (error) {
    console.error('❌ Error sincronizando videos:', error);
  }
}

// Logging para debug
console.log('📱 Service Worker cargado para PWA Visa');
console.log('🏷️ Versión cache:', CACHE_NAME);
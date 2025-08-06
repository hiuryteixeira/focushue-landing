// Service Worker para FocusHue PWA
// Versão 1.0.0

const CACHE_NAME = 'focushue-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Arquivos essenciais para cache
const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/home.html',
  '/login.html',
  '/cadastro.html',
  '/agenda.html',
  '/tarefas.html',
  '/config.html',
  '/estatisticas.html',
  '/notificacoes.html',
  '/paleta.html',
  '/offline.html',
  '/manifest.json'
];

// Recursos externos essenciais
const EXTERNAL_RESOURCES = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto');
        
        // Cache arquivos essenciais
        const cachePromises = [
          cache.addAll(ESSENTIAL_FILES.map(url => new Request(url, { cache: 'reload' }))),
          cache.addAll(EXTERNAL_RESOURCES.map(url => new Request(url, { mode: 'cors' })))
        ];
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[SW] Todos os arquivos foram cacheados');
        // Força a ativação imediata
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erro durante a instalação:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        // Toma controle de todas as páginas imediatamente
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições (estratégia Cache First para recursos estáticos)
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignora requisições para APIs externas (Firebase, etc.) exceto recursos específicos
  if (url.origin !== location.origin && !EXTERNAL_RESOURCES.includes(request.url)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Se encontrou no cache, retorna
        if (response) {
          console.log('[SW] Servindo do cache:', request.url);
          return response;
        }
        
        // Se não encontrou no cache, busca na rede
        return fetch(request)
          .then(response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona a resposta para cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
                console.log('[SW] Adicionado ao cache:', request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.log('[SW] Erro na rede para:', request.url, error);
            
            // Se é uma navegação (página HTML), retorna página offline
            if (request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            // Para outros recursos, tenta encontrar algo similar no cache
            return caches.match('/index.html');
          });
      })
  );
});

// Gerenciamento de notificações push
self.addEventListener('push', event => {
  console.log('[SW] Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do FocusHue',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir FocusHue',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FocusHue', options)
  );
});

// Clique em notificações
self.addEventListener('notificationclick', event => {
  console.log('[SW] Clique na notificação:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Abre ou foca na janela do FocusHue
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Sincronização em background
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui você pode implementar sincronização de dados
      // Por exemplo, enviar dados pendentes para o Firebase
      syncPendingData()
    );
  }
});

// Função para sincronizar dados pendentes
async function syncPendingData() {
  try {
    // Implementar lógica de sincronização
    console.log('[SW] Sincronizando dados pendentes...');
    
    // Exemplo: buscar dados do IndexedDB e enviar para Firebase
    // const pendingData = await getPendingDataFromIndexedDB();
    // await sendDataToFirebase(pendingData);
    
    console.log('[SW] Sincronização concluída');
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

// Atualização do Service Worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Limpeza periódica do cache
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCache());
  }
});

async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove entradas antigas do cache (mais de 7 dias)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response.headers.get('date');
      
      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        if (responseDate < oneWeekAgo) {
          await cache.delete(request);
          console.log('[SW] Removido do cache (expirado):', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Erro na limpeza do cache:', error);
  }
}

// Log de informações do Service Worker
console.log('[SW] Service Worker do FocusHue carregado');
console.log('[SW] Versão do cache:', CACHE_NAME);
console.log('[SW] Arquivos essenciais:', ESSENTIAL_FILES.length);
console.log('[SW] Recursos externos:', EXTERNAL_RESOURCES.length);


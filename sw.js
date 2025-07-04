// FocusHue Service Worker
const CACHE_NAME = 'focushue-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard_v1.html',
  '/agenda.html',
  '/tarefas.html',
  '/estatisticas.html',
  '/config.html',
  '/notificacoes.html',
  '/login.html',
  '/cadastro.html',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Pré-cache de arquivos essenciais
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando arquivos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Erro durante instalação:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Ativação concluída');
      return self.clients.claim();
    })
  );
});

// Estratégia de cache: Cache First, falling back to Network
self.addEventListener('fetch', (event) => {
  // Ignora requisições para o Firebase e outras APIs externas
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('identitytoolkit.googleapis.com') ||
      event.request.url.includes('fcm.googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          console.log('[Service Worker] Servindo do cache:', event.request.url);
          return response;
        }
        
        // Não encontrado no cache - busca na rede
        console.log('[Service Worker] Buscando na rede:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Verifica se a resposta é válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clona a resposta para poder armazená-la no cache
            const responseToCache = networkResponse.clone();
            
            // Adiciona ao cache para uso futuro
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('[Service Worker] Cacheando novo recurso:', event.request.url);
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Erro de fetch:', error);
            
            // Se for uma página HTML, retorna a página offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            return new Response('Recurso não disponível offline', {
              status: 503,
              statusText: 'Serviço indisponível'
            });
          });
      })
  );
});

// Gerenciamento de notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notificação push recebida:', event);
  
  if (!event.data) {
    console.log('[Service Worker] Notificação push sem dados');
    return;
  }
  
  const notificationData = event.data.json();
  const options = {
    body: notificationData.body || 'Notificação do FocusHue',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: notificationData.url || '/'
    },
    actions: notificationData.actions || [
      {
        action: 'confirmar',
        title: 'Confirmar',
        icon: '/icons/check-24x24.png'
      },
      {
        action: 'adiar',
        title: 'Adiar',
        icon: '/icons/snooze-24x24.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'FocusHue',
      options
    )
  );
});

// Gerenciamento de cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Clique em notificação:', event);
  
  event.notification.close();
  
  // Gerencia ações específicas
  if (event.action === 'confirmar') {
    console.log('[Service Worker] Ação "Confirmar" selecionada');
    // Lógica para confirmar (implementar conforme necessário)
  } else if (event.action === 'adiar') {
    console.log('[Service Worker] Ação "Adiar" selecionada');
    // Lógica para adiar (implementar conforme necessário)
  }
  
  // Abre a URL associada à notificação
  const urlToOpen = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // Verifica se já há uma janela aberta para reutilizar
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não houver janela aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Evento de sincronização:', event);
  
  if (event.tag === 'sync-agenda') {
    event.waitUntil(sincronizarAgenda());
  } else if (event.tag === 'sync-tarefas') {
    event.waitUntil(sincronizarTarefas());
  }
});

// Função para sincronizar agenda quando online
async function sincronizarAgenda() {
  try {
    const pendingAgendaData = await localforage.getItem('pendingAgendaChanges');
    
    if (!pendingAgendaData || pendingAgendaData.length === 0) {
      console.log('[Service Worker] Nenhuma alteração pendente na agenda');
      return;
    }
    
    console.log('[Service Worker] Sincronizando alterações da agenda:', pendingAgendaData);
    
    // Aqui seria implementada a lógica para enviar os dados ao servidor
    // Usando fetch para API ou Firebase SDK
    
    // Após sincronização bem-sucedida, limpa os dados pendentes
    await localforage.removeItem('pendingAgendaChanges');
    console.log('[Service Worker] Sincronização da agenda concluída');
  } catch (error) {
    console.error('[Service Worker] Erro ao sincronizar agenda:', error);
    throw error; // Permite que o evento de sincronização seja repetido posteriormente
  }
}

// Função para sincronizar tarefas quando online
async function sincronizarTarefas() {
  try {
    const pendingTasksData = await localforage.getItem('pendingTaskChanges');
    
    if (!pendingTasksData || pendingTasksData.length === 0) {
      console.log('[Service Worker] Nenhuma alteração pendente nas tarefas');
      return;
    }
    
    console.log('[Service Worker] Sincronizando alterações das tarefas:', pendingTasksData);
    
    // Aqui seria implementada a lógica para enviar os dados ao servidor
    // Usando fetch para API ou Firebase SDK
    
    // Após sincronização bem-sucedida, limpa os dados pendentes
    await localforage.removeItem('pendingTaskChanges');
    console.log('[Service Worker] Sincronização das tarefas concluída');
  } catch (error) {
    console.error('[Service Worker] Erro ao sincronizar tarefas:', error);
    throw error; // Permite que o evento de sincronização seja repetido posteriormente
  }
}

// Mensagens do cliente para o Service Worker
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem recebida do cliente:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

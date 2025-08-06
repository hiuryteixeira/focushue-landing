// Script reutilizável para integração PWA em todas as páginas do FocusHue
// Versão 1.0.0

// Função para adicionar meta tags PWA ao head
function addPWAMetaTags() {
    const head = document.head;
    
    // Verifica se já foram adicionadas
    if (document.querySelector('link[rel="manifest"]')) {
        return;
    }
    
    // Meta tags PWA
    const metaTags = [
        { name: 'theme-color', content: '#81C784' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'FocusHue' },
        { name: 'msapplication-TileColor', content: '#81C784' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
    ];
    
    metaTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        head.appendChild(meta);
    });
    
    // Links PWA
    const links = [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/icon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/icon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/icon-192x192.png' }
    ];
    
    links.forEach(linkData => {
        const link = document.createElement('link');
        Object.keys(linkData).forEach(key => {
            link.setAttribute(key, linkData[key]);
        });
        head.appendChild(link);
    });
}

// Função para registrar Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('Service Worker registrado com sucesso:', registration.scope);
                    
                    // Verifica por atualizações
                    registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Nova versão disponível
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(function(error) {
                    console.log('Falha ao registrar Service Worker:', error);
                });
        });
    }
}

// Função para mostrar notificação de atualização
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--foco);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 15px;
            font-family: 'Inter', sans-serif;
        ">
            <span>🔄 Nova versão disponível!</span>
            <button onclick="updateApp()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Atualizar</button>
            <button onclick="dismissUpdate()" style="
                background: none;
                border: none;
                color: white;
                padding: 8px;
                cursor: pointer;
                font-size: 1.2rem;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
}

// Função para atualizar o app
function updateApp() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(function(registration) {
            if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        });
    }
}

// Função para dispensar notificação de atualização
function dismissUpdate() {
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.remove();
    }
}

// Função para configurar prompt de instalação
function setupInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', function(e) {
        console.log('Evento beforeinstallprompt disparado');
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostra botão de instalação personalizado
        showInstallButton(deferredPrompt);
    });
    
    // Detecta quando o app foi instalado
    window.addEventListener('appinstalled', function(e) {
        console.log('FocusHue PWA foi instalado');
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.remove();
        }
        
        // Mostra mensagem de sucesso
        showInstallSuccessMessage();
    });
}

// Função para mostrar botão de instalação
function showInstallButton(deferredPrompt) {
    // Remove botão existente se houver
    const existingButton = document.getElementById('install-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.innerHTML = '📱 Instalar App';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--foco);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        transition: all 0.3s ease;
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
    `;
    
    installButton.addEventListener('click', function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuário aceitou instalar o PWA');
                } else {
                    console.log('Usuário recusou instalar o PWA');
                }
                deferredPrompt = null;
                installButton.remove();
            });
        }
    });
    
    installButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });
    
    installButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    document.body.appendChild(installButton);
}

// Função para mostrar mensagem de sucesso da instalação
function showInstallSuccessMessage() {
    const successMessage = document.createElement('div');
    successMessage.innerHTML = '✅ FocusHue instalado com sucesso!';
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--foco);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        font-family: 'Inter', sans-serif;
    `;
    
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 3000);
}

// Função para verificar se está rodando como PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Função para configurar comportamento específico do PWA
function setupPWABehavior() {
    if (isPWA()) {
        console.log('Rodando como PWA');
        
        // Adiciona classe CSS para estilos específicos do PWA
        document.body.classList.add('pwa-mode');
        
        // Previne zoom em inputs (iOS)
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            });
            
            input.addEventListener('blur', function() {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                }
            });
        });
    }
}

// Função para configurar notificações push (se suportado)
function setupPushNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        // Verifica permissão atual
        if (Notification.permission === 'default') {
            // Pode solicitar permissão mais tarde quando o usuário interagir
            console.log('Permissão de notificação não solicitada ainda');
        } else if (Notification.permission === 'granted') {
            console.log('Permissão de notificação concedida');
            // Configurar push notifications aqui
        } else {
            console.log('Permissão de notificação negada');
        }
    }
}

// Função principal de inicialização PWA
function initPWA() {
    // Adiciona meta tags PWA
    addPWAMetaTags();
    
    // Registra Service Worker
    registerServiceWorker();
    
    // Configura prompt de instalação
    setupInstallPrompt();
    
    // Configura comportamento específico do PWA
    setupPWABehavior();
    
    // Configura notificações push
    setupPushNotifications();
    
    console.log('PWA inicializado para FocusHue');
}

// Torna as funções globais para uso em outras páginas
window.updateApp = updateApp;
window.dismissUpdate = dismissUpdate;
window.initPWA = initPWA;
window.isPWA = isPWA;

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWA);
} else {
    initPWA();
}


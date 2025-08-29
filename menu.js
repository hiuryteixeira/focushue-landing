const menuContent = `
<header>
  <button class="menu-toggle" onclick="toggleMenu()" aria-label="Abrir menu">☰</button>
  <span id="headerTitle">FocusHue</span>
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="Alternar tema">🌙</button>
</header>
<nav id="menu">
  <a href="index.html">🏠 Início</a>
  <a href="agenda.html">📅 Agenda</a>
  <a href="tarefas.html">✅ Tarefas</a>
  <a href="config.html">⚙️ Configurações</a>
  <a href="estatisticas.html">📊 Estatísticas</a>
  <a href="notificacoes.html">🔔 Notificações</a>
  <a href="#" onclick="logout()">🚪 Sair</a>
</nav>
<style>
/* Estilos para o header e menu de navegação */
header {
  background: linear-gradient(to right, var(--foco, #81C784), var(--estudo, #6BAED6));
  padding: 20px;
  color: white;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 600;
  position: relative;
  z-index: 1001; /* Garante que o header fique acima de outros elementos */
}

.menu-toggle, .theme-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.4rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  transition: opacity 0.3s;
}

.menu-toggle { left: 20px; }
.theme-toggle { right: 20px; }

.menu-toggle:hover, .theme-toggle:hover {
  opacity: 0.8;
}

nav#menu {
  display: none;
  flex-direction: column;
  background: rgba(255,255,255,0.98);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  position: fixed; /* Mudar para fixed para cobrir a tela */
  top: 0;
  left: 0;
  width: 250px; /* Largura do menu */
  height: 100%;
  padding-top: 60px; /* Espaço para o header */
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease-out;
}

nav#menu.open {
    display: flex;
    transform: translateX(0);
}

body.dark nav#menu {
  background: rgba(40,40,40,0.98);
}

nav#menu a {
  padding: 15px 20px;
  text-decoration: none;
  color: #333;
  font-weight: 500;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
}

body.dark nav#menu a {
  color: #eee;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

nav#menu a:hover {
  background: var(--foco, #81C784);
  color: white;
}

/* Overlay para fechar o menu */
.menu-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s ease-out;
}

.menu-overlay.visible {
    display: block;
    opacity: 1;
}
</style>
`;

// Insere o menu no corpo do documento
const menuContainer = document.createElement('div');
menuContainer.innerHTML = menuContent;
document.body.prepend(menuContainer);

// Adiciona o overlay
const overlay = document.createElement('div');
overlay.className = 'menu-overlay';
document.body.appendChild(overlay);

// Funções globais de UI que estavam em home.html
function toggleMenu() {
    const menu = document.getElementById("menu");
    const overlay = document.querySelector(".menu-overlay");
    const isOpen = menu.classList.toggle("open");

    if (isOpen) {
        overlay.classList.add("visible");
        // Adiciona listener para fechar com clique no overlay
        overlay.onclick = () => toggleMenu();
    } else {
        overlay.classList.remove("visible");
        overlay.onclick = null;
    }
}

async function salvarTemaNoFirestore(tema) {
    const user = firebase.auth().currentUser;
    if (user && db) {
        try {
            const configRef = db.collection("users").doc(user.uid).collection("config").doc("preferencias");
            await configRef.set({ tema: tema }, { merge: true });
            console.log("Tema salvo no Firestore.");
        } catch (error) {
            console.error("Erro ao salvar tema no Firestore:", error);
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    const newTheme = isDark ? "dark" : "light";

    localStorage.setItem("theme", newTheme);
    salvarTemaNoFirestore(newTheme);

    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️" : "🌙";
    }

    // Para compatibilidade com a página de login
    const loginBox = document.getElementById("loginBox");
    if(loginBox) {
        if(isDark) loginBox.classList.add("dark");
        else loginBox.classList.remove("dark");
    }
}

function aplicarTema(tema) {
    const isDark = tema === 'dark';
    const themeToggle = document.querySelector(".theme-toggle");

    if (isDark) {
        document.body.classList.add("dark");
        if (themeToggle) themeToggle.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        if (themeToggle) themeToggle.textContent = "🌙";
    }

    // Para compatibilidade com a página de login
    const loginBox = document.getElementById("loginBox");
    if (loginBox) {
        if (isDark) loginBox.classList.add("dark");
        else loginBox.classList.remove("dark");
    }
}

async function carregarTema() {
    // Tenta carregar o tema do localStorage primeiro para uma renderização rápida
    const temaLocal = localStorage.getItem("theme") || 'light';
    aplicarTema(temaLocal);

    // Ouve o estado de autenticação para carregar do Firestore
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && db) {
            try {
                const configRef = db.collection("users").doc(user.uid).collection("config").doc("preferencias");
                const doc = await configRef.get();
                if (doc.exists && doc.data().tema) {
                    const temaFirestore = doc.data().tema;
                    console.log("Tema carregado do Firestore:", temaFirestore);
                    if (temaFirestore !== temaLocal) {
                        aplicarTema(temaFirestore);
                        localStorage.setItem("theme", temaFirestore);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar tema do Firestore:", error);
            }
        }
    });
}

function carregarCoresSalvas() {
    ["--estudo", "--foco", "--descanso", "--alerta"].forEach(variable => {
      const corSalva = localStorage.getItem(variable);
      if (corSalva) {
        document.documentElement.style.setProperty(variable, corSalva);
      }
    });
}

// Carrega o tema na inicialização do script
carregarTema();
// Carrega as cores na inicialização do script
carregarCoresSalvas();

// Logout function - precisa do Firebase Auth
function logout() {
    if (firebase && firebase.auth) {
        firebase.auth().signOut().then(() => {
            console.log("Logout realizado com sucesso");
            window.location.href = "index.html";
        }).catch((error) => {
            console.error("Erro no logout:", error);
        });
    } else {
        console.error("Firebase auth não disponível. Não foi possível fazer logout.");
        alert("Erro ao tentar sair. Verifique o console.");
    }
}

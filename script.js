document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const osContainer = document.getElementById('os-container');
    const desktop = document.getElementById('desktop');
    const taskbarApps = document.getElementById('taskbar-apps');
    const clockElement = document.getElementById('clock');
    const themeToggleButton = document.getElementById('theme-toggle');
    const bootScreen = document.getElementById('boot-screen');
    const contactForm = document.getElementById('contact-form');

    // --- ESTADO DO SISTEMA ---
    let openWindows = {}; // Rastreia janelas abertas { appId: windowElement }
    let highestZIndex = 100; // Z-index inicial para as janelas
    let isMobile = window.innerWidth <= 768; // Verifica o modo inicial

    // --- MAPA DE APLICATIVOS ---
    const appConfig = {
        'about': { title: 'Sobre Mim', icon: 'https://api.iconify.design/ph:user-circle-bold.svg?color=white' },
        'projects': { title: 'Projetos', icon: 'https://api.iconify.design/ph:code-bold.svg?color=white' },
        'skills': { title: 'Habilidades', icon: 'https://api.iconify.design/ph:rocket-launch-bold.svg?color=white' },
        'contact': { title: 'Contato', icon: 'https://api.iconify.design/ph:envelope-simple-bold.svg?color=white' }
    };
    
    // --- INICIALIZAÇÃO ---
    function init() {
        // Simulação de boot
        setTimeout(() => {
            bootScreen.classList.add('hidden');
        }, 2000); // Duração da tela de boot

        updateClock();
        setInterval(updateClock, 1000);

        setupEventListeners();
        checkAndApplyMode();
    }

    // --- FUNÇÕES DE LÓGICA ---

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}`;
    }
    
    function setupEventListeners() {
        // Ícones do Desktop
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', () => openApp(icon.dataset.appId));
            // Suporte a toque para mobile
            icon.addEventListener('click', (e) => {
                 if (isMobile) {
                    openApp(icon.dataset.appId);
                 }
            });
        });

        // Alternar tema
        themeToggleButton.addEventListener('click', toggleTheme);

        // Responsividade
        window.addEventListener('resize', checkAndApplyMode);
        
        // Formulário de Contato
        if (contactForm) {
            contactForm.addEventListener('submit', handleFormSubmit);
        }
    }
    
    function checkAndApplyMode() {
        const currentlyMobile = window.innerWidth <= 768;
        if (currentlyMobile !== isMobile) {
            isMobile = currentlyMobile;
            document.body.classList.toggle('mobile-mode', isMobile);
            
            // Reorganizar janelas ao mudar de modo
            Object.values(openWindows).forEach(win => {
                if (isMobile) {
                    win.style.transform = 'translateX(100%)';
                    win.classList.remove('maximized', 'minimized');
                } else {
                    win.style.transform = '';
                    win.style.top = '10%';
                    win.style.left = '10%';
                }
            });
            // Fechar apps ativos em mobile ao voltar para desktop
            if (!isMobile) {
                 const activeWindow = document.querySelector('.window.active');
                 if (activeWindow) activeWindow.classList.remove('active');
            }
        }
    }
    
    function openApp(appId) {
        if (openWindows[appId]) {
            focusWindow(openWindows[appId]);
            return;
        }

        const appData = appConfig[appId];
        if (!appData) return;

        const windowEl = createWindow(appId, appData.title);
        
        openWindows[appId] = windowEl;
        osContainer.appendChild(windowEl);
        createTaskbarIcon(appId, appData.title, appData.icon);
        
        focusWindow(windowEl);

        // Animação de abertura
        setTimeout(() => {
            if (isMobile) {
                windowEl.classList.add('active');
            } else {
                windowEl.style.transform = 'scale(1)';
                windowEl.style.opacity = '1';
            }
        }, 10);
    }

    function createWindow(appId, title) {
        const template = document.getElementById(`app-template-${appId}`);
        if (!template) return null;

        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.dataset.appId = appId;
        
        if (isMobile) {
            windowEl.style.transform = 'translateX(100%)';
        } else {
            windowEl.style.transform = 'scale(0.8)';
            windowEl.style.opacity = '0';
            windowEl.style.top = `${Math.random() * 20 + 10}%`;
            windowEl.style.left = `${Math.random() * 20 + 15}%`;
        }

        windowEl.innerHTML = `
            <div class="window-header">
                <span class="window-title">${title}</span>
                <div class="window-controls">
                    <button class="window-control-btn btn-minimize"></button>
                    <button class="window-control-btn btn-maximize"></button>
                    <button class="window-control-btn btn-close"></button>
                </div>
            </div>
            <div class="window-content"></div>
        `;
        
        const content = template.content.cloneNode(true);
        windowEl.querySelector('.window-content').appendChild(content);

        addWindowInteractions(windowEl);
        return windowEl;
    }
    
    function addWindowInteractions(windowEl) {
        const header = windowEl.querySelector('.window-header');
        const closeBtn = windowEl.querySelector('.btn-close');
        const minBtn = windowEl.querySelector('.btn-minimize');
        const maxBtn = windowEl.querySelector('.btn-maximize');
        const appId = windowEl.dataset.appId;

        // Arrastar
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        header.addEventListener('mousedown', (e) => {
            if (isMobile || e.target.classList.contains('window-control-btn')) return;
            isDragging = true;
            offset.x = e.clientX - windowEl.offsetLeft;
            offset.y = e.clientY - windowEl.offsetTop;
            focusWindow(windowEl);
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            windowEl.style.left = `${e.clientX - offset.x}px`;
            windowEl.style.top = `${e.clientY - offset.y}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });

        // Controles da Janela
        closeBtn.addEventListener('click', () => closeApp(appId));
        minBtn.addEventListener('click', () => minimizeWindow(windowEl));
        maxBtn.addEventListener('click', () => maximizeWindow(windowEl));

        // Focar ao clicar
        windowEl.addEventListener('mousedown', () => focusWindow(windowEl), true);
    }
    
    function closeApp(appId) {
        const windowEl = openWindows[appId];
        if (!windowEl) return;
        
        const taskbarIcon = document.querySelector(`.taskbar-app-icon[data-app-id="${appId}"]`);
        
        if (isMobile) {
            windowEl.classList.remove('active');
            setTimeout(() => {
                windowEl.remove();
                if(taskbarIcon) taskbarIcon.remove();
            }, 300);
        } else {
            windowEl.style.transform = 'scale(0.8)';
            windowEl.style.opacity = '0';
            setTimeout(() => {
                windowEl.remove();
                if(taskbarIcon) taskbarIcon.remove();
            }, 200);
        }

        delete openWindows[appId];
    }
    
    function minimizeWindow(windowEl) {
        windowEl.classList.add('minimized');
        const taskbarIcon = document.querySelector(`.taskbar-app-icon[data-app-id="${windowEl.dataset.appId}"]`);
        if (taskbarIcon) taskbarIcon.classList.remove('active');
    }

    function maximizeWindow(windowEl) {
        windowEl.classList.toggle('maximized');
    }

    function focusWindow(windowEl) {
        if (windowEl.classList.contains('minimized')) {
            windowEl.classList.remove('minimized');
        }
        
        if (isMobile) {
             // Esconde outras janelas ativas
            document.querySelectorAll('.window.active').forEach(w => w.classList.remove('active'));
            windowEl.classList.add('active');
        } else {
            windowEl.style.zIndex = ++highestZIndex;
        }

        // Atualiza estado da taskbar
        document.querySelectorAll('.taskbar-app-icon').forEach(icon => icon.classList.remove('active'));
        const taskbarIcon = document.querySelector(`.taskbar-app-icon[data-app-id="${windowEl.dataset.appId}"]`);
        if (taskbarIcon) taskbarIcon.classList.add('active');
    }
    
    function createTaskbarIcon(appId, title, iconUrl) {
        const iconEl = document.createElement('div');
        iconEl.className = 'taskbar-app-icon';
        iconEl.dataset.appId = appId;
        iconEl.innerHTML = `<img src="${iconUrl}" alt="${title}">`;
        
        iconEl.addEventListener('click', () => {
            const windowEl = openWindows[appId];
            if (windowEl) {
                focusWindow(windowEl);
            }
        });

        taskbarApps.appendChild(iconEl);
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Trocar ícone do botão
        const iconImg = themeToggleButton.querySelector('img');
        if (newTheme === 'light') {
             iconImg.src = 'https://api.iconify.design/ph:moon-bold.svg?color=black';
        } else {
             iconImg.src = 'https://api.iconify.design/ph:sun-bold.svg?color=white';
        }
    }
    
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if(savedTheme === 'light') toggleTheme(); // Atualiza o ícone se o tema salvo for light

    async function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const status = document.getElementById('form-status');
        const data = new FormData(form);

        status.textContent = 'Enviando...';
        status.style.color = 'var(--accent-color)';
        
        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                status.textContent = "Mensagem enviada com sucesso!";
                status.style.color = '#27c93f';
                form.reset();
            } else {
                const responseData = await response.json();
                status.textContent = responseData.message || "Ocorreu um erro ao enviar.";
                status.style.color = '#ff5f56';
            }
        } catch (error) {
            status.textContent = "Ocorreu um erro de conexão.";
            status.style.color = '#ff5f56';
        }
    }
    
    // Iniciar o sistema
    init();
});
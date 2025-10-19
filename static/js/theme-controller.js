/**
 * Controlador de Modo Oscuro
 * Maneja el cambio entre tema claro y oscuro
 */

class ThemeController {
    constructor() {
        this.themes = {
            light: 'light',
            dark: 'dark'
        };
        this.storageKey = 'simulador-theme-preference';
        this.init();
    }

    init() {
        // Detectar preferencia guardada o del sistema
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const initialTheme = savedTheme || (systemPrefersDark ? this.themes.dark : this.themes.light);
        
        this.setTheme(initialTheme, false); // false = sin animación inicial
        this.createToggleButton();
        this.bindEvents();
    }

    createToggleButton() {
        // Crear el botón flotante
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Alternar modo oscuro');
        button.innerHTML = `
            <span class="theme-icon sun-icon">☀️</span>
            <span class="theme-icon moon-icon">🌙</span>
        `;
        
        // Agregar al body
        document.body.appendChild(button);
    }

    bindEvents() {
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.addEventListener('click', () => this.toggleTheme());
        }

        // Escuchar cambios en preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? this.themes.dark : this.themes.light);
            }
        });
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.themes.light;
    }

    setTheme(theme, animate = true) {
        const root = document.documentElement;
        const button = document.getElementById('theme-toggle');
        
        // Aplicar clase de transición solo si se solicita
        if (animate) {
            root.classList.add('theme-transition');
            setTimeout(() => root.classList.remove('theme-transition'), 300);
        }
        
        // Cambiar tema
        root.setAttribute('data-theme', theme);
        
        // Actualizar botón
        if (button) {
            button.classList.toggle('dark-mode', theme === this.themes.dark);
        }
        
        // Guardar preferencia
        localStorage.setItem(this.storageKey, theme);
        
        // Emit evento personalizado para otros componentes
        window.dispatchEvent(new CustomEvent('theme-changed', { 
            detail: { theme } 
        }));
    }

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === this.themes.light ? this.themes.dark : this.themes.light;
        this.setTheme(newTheme);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.themeController = new ThemeController();
});

// Exportar para uso global
window.ThemeController = ThemeController;
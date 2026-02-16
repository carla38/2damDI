/**
 * ROUTER.JS
 * Navegación simple basada en Hash (#)
 */

App.Router = {
    init: function () {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Ejecutar al inicio
    },

    handleRoute: function () {
        const hash = window.location.hash.slice(1) || 'dashboard'; // Default

        // Guardias de navegación (Auth Guard)
        if (!App.session && hash !== '') {
            // Si no hay sesión, forzar auth
            App.UI.showScreen('auth-landing');
            App.UI.toggleNavbar(false);
            return;
        }

        if (App.session && hash === '') {
            // Si hay sesión y estamos en root, ir a dashboard
            window.location.hash = 'dashboard';
            return;
        }

        if (!App.session) {
            // Caso sin login
            App.UI.showScreen('auth-landing');
            App.UI.toggleNavbar(false);
            return;
        }

        // Navegación normal autenticada
        App.UI.toggleNavbar(true); // Mostrar sidebar
        App.UI.showScreen(hash);
    }
};

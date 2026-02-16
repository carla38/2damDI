/**
 * GLOBALS.JS
 * Define el espacio de nombres principal de la aplicación.
 * ------------------------------------------------------------------
 * Para evitar "contaminar" el ámbito global, todas las funciones
 * se agruparán dentro del objeto `App`.
 */

const App = {
    // Referencia al cliente de Supabase
    supabase: null,

    // Estado de la sesión del usuario
    session: null,
    user: null, // alias para session.user

    // Datos en memoria (caché simple)
    state: {
        transactions: [],
        categories: [],
        currentFilter: 'all',
        isLoading: false
    },

    // Módulos (se rellenarán en otros archivos)
    Auth: {},
    DB: {},
    UI: {},
    Utils: {},
    Storage: {},
    I18n: {}
};

// Utils: Helpers generales
App.Utils.formatCurrency = (amount) => {
    return new Intl.NumberFormat(App.I18n.currentLang || 'es', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

App.Utils.formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(App.I18n.currentLang || 'es', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Aplica tema (claro/oscuro) y color de acento desde localStorage.
 * Se llama al inicio de la app.
 */
App.Utils.applyTheme = function () {
    const theme = localStorage.getItem('theme') || 'light';
    const accent = localStorage.getItem('accentColor') || 'blue';
    document.body.setAttribute('data-theme', theme);
    if (accent && accent !== 'blue') {
        document.body.setAttribute('data-accent', accent);
    } else {
        document.body.removeAttribute('data-accent');
    }
};

/**
 * Tipos de archivo permitidos para subida.
 */
App.Utils.ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
];

/**
 * Valida que un archivo sea de tipo permitido.
 * @param {File} file
 * @returns {boolean}
 */
App.Utils.validateFileType = function (file) {
    return App.Utils.ALLOWED_FILE_TYPES.includes(file.type);
};

/**
 * Detecta el tipo de archivo a partir de su ruta/URL para decidir cómo mostrarlo.
 * @param {string} path
 * @returns {'image'|'pdf'|'audio'|'unknown'}
 */
App.Utils.getFileType = function (path) {
    if (!path) return 'unknown';
    const lower = path.toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|webp)$/)) return 'image';
    if (lower.match(/\.pdf$/)) return 'pdf';
    if (lower.match(/\.(mp3|wav|ogg|mpeg)$/)) return 'audio';
    return 'unknown';
};

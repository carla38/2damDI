/**
 * SUPABASE-CLIENT.JS
 * Inicialización del cliente Supabase
 */

(function () {
    // Verificar que la librería de Supabase se haya cargado
    if (typeof supabase === 'undefined') {
        console.error('CRITICAL: Supabase JS library not loaded.');
        alert('Error crítico: No se puede conectar con la base de datos (Librería no cargada). Revisa tu conexión a internet.');
        return;
    }

    // Inicializar cliente
    // Se usa la variable global 'supabase' que expone el script de CDN
    // createClient es el método factory.
    try {
        App.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log('Supabase Client Initialized');
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        alert('Error: Configuración de Supabase inválida. Revisa js/config.js');
    }
})();

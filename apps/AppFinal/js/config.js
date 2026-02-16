/**
 * CONFIGURACIÓN DE LA APLICACIÓN
 * ------------------------------------------------------------------
 * Este archivo contiene las claves de conexión con Supabase.
 * 
 * INSTRUCCIONES PARA EL USUARIO:
 * 1. Crea un proyecto en https://supabase.com
 * 2. Ve a Project Settings > API
 * 3. Copia la "Project URL" y pégala abajo.
 * 4. Copia la "anon" / "public" key y pégala abajo.
 * ------------------------------------------------------------------
 */

const CONFIG = {
    // REEMPLAZAR AQUÍ CON TUS PROPIAS CLAVES DE SUPABASE
    SUPABASE_URL: "https://qujwnfxfadnlgtufgtce.supabase.co", 
    SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1anduZnhmYWRubGd0dWZndGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ5MTQsImV4cCI6MjA4NTQ1MDkxNH0.sIqzDPiYdkV7Q8LbnL2LTbOhKiMxV-nrjoRHZ5Ct7yg",
    
    // Configuración de la aplicación
    APP_NAME: "Finanzas Personales",
    VERSION: "1.0.0",
    DEFAULT_LANG: "es"
};

// Evitar modificaciones accidentales
Object.freeze(CONFIG);

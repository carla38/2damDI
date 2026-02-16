/**
 * AUTH.JS
 * Gestión de usuarios y sesiones.
 */

App.Auth = {
    // Iniciar sesión
    login: async function (email, password) {
        const { data, error } = await App.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        this.setSession(data.session);
        return data.user;
    },

    // Registrarse
    register: async function (email, password) {
        // Obtenemos la URL base actual para que el link de confirmación apunte aquí
        // Elimina el hash si lo hay
        const redirectTo = window.location.origin + window.location.pathname;

        const { data, error } = await App.supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo
            }
        });

        if (error) throw error;

        // CHECK: Detectar si el usuario ya existe (truco de identidades vacías en Supabase)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            throw new Error("Este correo ya está registrado. Inicia sesión o recupera tu contraseña.");
        }

        // Si el registro es exitoso check session
        return data.user;
    },

    // Manejar redirección de Auth (Email links, OAuth)
    handleAuthRedirect: async function () {
        // Supabase detecta automáticamente tokens en el URL hash
        const { data, error } = await App.supabase.auth.getSession();

        if (error) {
            console.error('Auth Redirect Error:', error);
            // FIX: En lugar de error rojo, mostramos mensaje de estado neutral/positivo
            // Esto cubre casos donde el link expiró porque ya se usó (cuenta validada)
            App.UI.showLoginMessage('Cuenta verificada o enlace expirado. Por favor inicia sesión.', 'success');
            return false;
        }

        if (data.session) {
            this.setSession(data.session);
            return true; // Sesión establecida
        }

        return false;
    },

    // Cerrar sesión
    logout: async function () {
        const { error } = await App.supabase.auth.signOut();
        if (error) console.error('Error signing out:', error);

        this.clearSession();
        window.location.hash = ''; // Ir a login/inicio
        window.location.reload(); // Recargar para limpiar estado en memoria
    },

    // Obtener sesión actual
    getSession: async function () {
        const { data, error } = await App.supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }

        if (data.session) {
            this.setSession(data.session);
        }
        return data.session;
    },

    // Guardar sesión en estado global
    setSession: function (session) {
        App.session = session;
        App.user = session ? session.user : null;
        console.log('User logged in:', App.user ? App.user.email : 'No user');
    },

    // Limpiar sesión
    clearSession: function () {
        App.session = null;
        App.user = null;
    }
};

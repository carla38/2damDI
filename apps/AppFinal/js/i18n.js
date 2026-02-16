/**
 * I18N.JS
 * Sistema de internacionalización simple.
 * Soporta data-i18n (textContent) y data-i18n-placeholder (placeholder attr).
 */

App.I18n = {
    currentLang: 'es', // Por defecto

    // Diccionario de textos
    translations: {
        es: {
            // --- Navegación ---
            "nav.dashboard": "Dashboard",
            "nav.transactions": "Transacciones",
            "nav.categories": "Categorías",
            "nav.stats": "Estadísticas",
            "nav.profile": "Perfil",

            // --- Auth ---
            "auth.title": "Bienvenido",
            "auth.welcome": "Bienvenido",
            "auth.subtitle": "Gestiona tus finanzas con estilo",
            "auth.email": "Email",
            "auth.password": "Contraseña",
            "auth.login_action": "Iniciar Sesión",
            "auth.login_title": "Iniciar Sesión",
            "auth.login_desc": "Ingresa a tu cuenta",
            "auth.register_action": "Registrarse",
            "auth.register_title": "Crear Cuenta",
            "auth.register_desc": "Únete y controla tus gastos",
            "auth.no_account": "¿No tienes cuenta?",
            "auth.has_account": "¿Ya tienes cuenta?",
            "auth.register_link": "Regístrate",
            "auth.login_link": "Inicia sesión",
            "auth.logout": "Cerrar Sesión",
            "auth.success_title": "¡Casi listo!",
            "auth.success_desc": "Hemos enviado un enlace de confirmación a tu correo electrónico.",
            "auth.success_hint": "Revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.",
            "auth.success_btn": "Ir a Iniciar Sesión",
            "auth.confirmed_title": "¡Cuenta Verificada!",
            "auth.confirmed_desc": "Tu email ha sido confirmado exitosamente.",
            "auth.confirmed_btn": "Iniciar Sesión Ahora",

            // --- Dashboard ---
            "dashboard.title": "Resumen",
            "dashboard.balance": "Balance Total",
            "dashboard.income": "Ingresos",
            "dashboard.expense": "Gastos",
            "dashboard.recent": "Recientes",

            // --- Comunes ---
            "common.add": "Añadir",
            "common.view_all": "Ver todo",
            "common.type": "Tipo",
            "common.amount": "Cantidad (€)",
            "common.description": "Descripción",
            "common.date": "Fecha",
            "common.category": "Categoría",
            "common.file": "Adjuntar Archivo",
            "common.save": "Guardar",
            "common.cancel": "Cancelar",
            "common.income": "Ingreso",
            "common.expense": "Gasto",
            "common.back": "Volver",
            "common.new": "Nueva",
            "common.delete": "Eliminar",
            "common.update": "Actualizar",
            "common.create": "Crear",
            "common.name": "Nombre",
            "common.search": "Buscar...",
            "common.deleting": "Eliminando...",
            "common.saving": "Guardando...",
            "common.updating": "Actualizando...",
            "common.loading": "Cargando...",
            "common.processing": "Procesando...",
            "common.none": "Ninguna",

            // --- Filtros ---
            "filter.all": "Todos",
            "filter.all_time": "Todo el tiempo",
            "filter.all_categories": "Todas categorías",
            "filter.all_types": "Todos",

            // --- Categorías ---
            "categories.income": "Ingresos",
            "categories.expense": "Gastos",
            "categories.none_income": "Sin categorías de ingreso.",
            "categories.none_expense": "Sin categorías de gasto.",
            "categories.empty": "No hay categorías.",

            // --- Transacciones ---
            "transaction.new_title": "Nueva Transacción",
            "transaction.edit_title": "Editar Transacción",
            "transaction.empty": "No hay transacciones",

            // --- Categoría Modal ---
            "category.new_title": "Nueva Categoría",

            // --- Eliminar ---
            "delete.title": "Eliminar",
            "delete.confirm_msg": "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.",

            // --- Estadísticas ---
            "stats.chart_bar": "Barras",
            "stats.chart_doughnut": "Circular",
            "stats.chart_line": "Línea",
            "stats.section_categories": "Distribución por Categoría",
            "stats.section_balance": "Balance por Período",
            "stats.section_timeline": "Evolución Temporal",
            "stats.section_top": "Top 5 Transacciones",
            "stats.filter_expenses": "Gastos",
            "stats.filter_income": "Ingresos",
            "stats.filter_both": "Ambos",
            "stats.period_weekly": "Semanal",
            "stats.period_monthly": "Mensual",
            "stats.period_annual": "Anual",
            "stats.expenses_by_cat": "Gastos por Categoría",
            "stats.monthly_balance": "Balance Mensual",
            "stats.expenses_label": "Gastos (€)",
            "stats.income_label": "Ingresos",
            "stats.expense_label": "Gastos",
            "stats.income_vs_expense": "Ingresos vs Gastos",
            "stats.no_data": "Sin datos para mostrar",

            // --- Ajustes ---
            "settings.language": "Idioma",
            "settings.danger_zone": "Zona peligrosa",
            "settings.delete_data": "Borrar datos",
            "settings.delete_data_title": "Borrar datos",
            "settings.delete_data_warning": "Se eliminarán permanentemente todas tus transacciones, categorías y archivos. Esta acción es irreversible.",
            "settings.delete_item_transactions": "Todas tus transacciones",
            "settings.delete_item_categories": "Todas tus categorías",
            "settings.delete_item_files": "Todos tus archivos adjuntos",
            "settings.delete_data_irreversible": "Tu cuenta NO será eliminada. Solo tus datos.",
            "settings.delete_data_success": "Todos tus datos han sido eliminados correctamente.",
            "settings.delete_data_progress": "Eliminando datos...",
            "settings.delete_progress_files": "Eliminando archivos...",
            "settings.delete_progress_records": "Eliminando registros...",

            // --- Perfil ---
            "profile.version_text": "Versión 1.1.0",

            // --- Comunes adicionales ---
            "common.accept": "Aceptar",

            // --- Mensajes ---
            "msg.login_success": "Sesión iniciada con éxito",
            "msg.register_success": "Registro exitoso. ¡Bienvenido!",
            "msg.error_generic": "Ha ocurrido un error",
            "msg.fill_fields": "Por favor rellena todos los campos",
            "msg.delete_error": "Error al eliminar"
        },
        en: {
            // --- Navigation ---
            "nav.dashboard": "Dashboard",
            "nav.transactions": "Transactions",
            "nav.categories": "Categories",
            "nav.stats": "Statistics",
            "nav.profile": "Profile",

            // --- Auth ---
            "auth.title": "Welcome",
            "auth.welcome": "Welcome",
            "auth.subtitle": "Manage your finances with style",
            "auth.email": "Email",
            "auth.password": "Password",
            "auth.login_action": "Login",
            "auth.login_title": "Login",
            "auth.login_desc": "Sign in to your account",
            "auth.register_action": "Sign Up",
            "auth.register_title": "Create Account",
            "auth.register_desc": "Join and track your expenses",
            "auth.no_account": "Don't have an account?",
            "auth.has_account": "Already have an account?",
            "auth.register_link": "Sign Up",
            "auth.login_link": "Login",
            "auth.logout": "Logout",
            "auth.success_title": "Almost there!",
            "auth.success_desc": "We've sent a confirmation link to your email.",
            "auth.success_hint": "Check your inbox (and spam) and click the link to activate your account.",
            "auth.success_btn": "Go to Login",
            "auth.confirmed_title": "Account Verified!",
            "auth.confirmed_desc": "Your email has been successfully verified.",
            "auth.confirmed_btn": "Login Now",

            // --- Dashboard ---
            "dashboard.title": "Overview",
            "dashboard.balance": "Total Balance",
            "dashboard.income": "Income",
            "dashboard.expense": "Expenses",
            "dashboard.recent": "Recent",

            // --- Common ---
            "common.add": "Add",
            "common.view_all": "View all",
            "common.type": "Type",
            "common.amount": "Amount (€)",
            "common.description": "Description",
            "common.date": "Date",
            "common.category": "Category",
            "common.file": "Attach File",
            "common.save": "Save",
            "common.cancel": "Cancel",
            "common.income": "Income",
            "common.expense": "Expense",
            "common.back": "Back",
            "common.new": "New",
            "common.delete": "Delete",
            "common.update": "Update",
            "common.create": "Create",
            "common.name": "Name",
            "common.search": "Search...",
            "common.deleting": "Deleting...",
            "common.saving": "Saving...",
            "common.updating": "Updating...",
            "common.loading": "Loading...",
            "common.processing": "Processing...",
            "common.none": "None",

            // --- Filters ---
            "filter.all": "All",
            "filter.all_time": "All time",
            "filter.all_categories": "All categories",
            "filter.all_types": "All",

            // --- Categories ---
            "categories.income": "Income",
            "categories.expense": "Expenses",
            "categories.none_income": "No income categories.",
            "categories.none_expense": "No expense categories.",
            "categories.empty": "No categories.",

            // --- Transactions ---
            "transaction.new_title": "New Transaction",
            "transaction.edit_title": "Edit Transaction",
            "transaction.empty": "No transactions",

            // --- Category Modal ---
            "category.new_title": "New Category",

            // --- Delete ---
            "delete.title": "Delete",
            "delete.confirm_msg": "Are you sure you want to delete this item? This action cannot be undone.",

            // --- Statistics ---
            "stats.chart_bar": "Bar",
            "stats.chart_doughnut": "Doughnut",
            "stats.chart_line": "Line",
            "stats.section_categories": "Category Breakdown",
            "stats.section_balance": "Balance by Period",
            "stats.section_timeline": "Timeline Evolution",
            "stats.section_top": "Top 5 Transactions",
            "stats.filter_expenses": "Expenses",
            "stats.filter_income": "Income",
            "stats.filter_both": "Both",
            "stats.period_weekly": "Weekly",
            "stats.period_monthly": "Monthly",
            "stats.period_annual": "Annual",
            "stats.expenses_by_cat": "Expenses by Category",
            "stats.monthly_balance": "Monthly Balance",
            "stats.expenses_label": "Expenses (€)",
            "stats.income_label": "Income",
            "stats.expense_label": "Expenses",
            "stats.income_vs_expense": "Income vs Expenses",
            "stats.no_data": "No data to display",

            // --- Settings ---
            "settings.language": "Language",
            "settings.danger_zone": "Danger zone",
            "settings.delete_data": "Delete data",
            "settings.delete_data_title": "Delete data",
            "settings.delete_data_warning": "All your transactions, categories and files will be permanently deleted. This action is irreversible.",
            "settings.delete_item_transactions": "All your transactions",
            "settings.delete_item_categories": "All your categories",
            "settings.delete_item_files": "All your attached files",
            "settings.delete_data_irreversible": "Your account will NOT be deleted. Only your data.",
            "settings.delete_data_success": "All your data has been successfully deleted.",
            "settings.delete_data_progress": "Deleting data...",
            "settings.delete_progress_files": "Deleting files...",
            "settings.delete_progress_records": "Deleting records...",

            // --- Profile ---
            "profile.version_text": "Version 1.1.0",

            // --- Common additional ---
            "common.accept": "Accept",

            // --- Messages ---
            "msg.login_success": "Login successful",
            "msg.register_success": "Registration successful. Welcome!",
            "msg.error_generic": "An error occurred",
            "msg.fill_fields": "Please fill all fields",
            "msg.delete_error": "Error deleting"
        }
    },

    // Iniciador
    init: function () {
        // Cargar idioma guardado o usar defecto
        const savedLang = localStorage.getItem('app_lang');
        // Validar que el idioma existe, si no, usar default
        const lang = (savedLang && this.translations[savedLang]) ? savedLang : 'es';
        this.setLanguage(lang);
    },

    // Cambiar idioma
    setLanguage: function (lang) {
        if (!this.translations[lang]) return;

        this.currentLang = lang;
        localStorage.setItem('app_lang', lang);

        // Actualizar selector si existe
        const selector = document.getElementById('language-selector');
        if (selector) selector.value = lang;

        // Actualizar UI
        this.updateDOM();
    },

    // Traducir una clave
    t: function (key) {
        const langData = this.translations[this.currentLang];
        // Intentar idioma actual -> fallback a español -> devolver clave
        return langData[key] || this.translations['es'][key] || key;
    },

    // Buscar elementos con data-i18n y data-i18n-placeholder y actualizarlos
    updateDOM: function () {
        // Traducir textContent
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (text !== key) {
                el.textContent = text;
            }
        });

        // Traducir placeholder
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const text = this.t(key);
            if (text !== key) {
                el.setAttribute('placeholder', text);
            }
        });
    }
};

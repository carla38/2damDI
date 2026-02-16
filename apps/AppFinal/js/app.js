/**
 * APP.JS
 * Punto de entrada y lógica de control.
 */

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {

    // 0. Aplicar tema guardado inmediatamente
    App.Utils.applyTheme();

    // 1. Inicializar I18n
    App.I18n.init();

    // 2. Verificar Sesión y Redirecciones
    // IMPORTANTE: Capturar hash inicial antes de que Supabase lo consuma
    const initialHash = window.location.hash;

    // Configurar Inputs de Fecha (No futuro)
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.setAttribute('max', today);
    });

    // Configurar Inputs de Cantidad (No 'e')
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
            }
        });
    });

    // Auth.handleAuthRedirect consume el hash si existen tokens
    const isRedirect = await App.Auth.handleAuthRedirect();

    // LOGICA DE REDIRECCIÓN POST-CONFIRMACIÓN
    if (isRedirect) {
        console.log("Sesión establecida por Redirect/Link");
        if (initialHash && initialHash.includes('type=signup')) {
            document.getElementById('loading-screen').classList.add('hidden');
            App.UI.showScreen('auth-confirmed');
            return;
        }
    } else if (initialHash && (initialHash.includes('type=signup') || initialHash.includes('access_token') || initialHash.includes('error='))) {
        document.getElementById('loading-screen').classList.add('hidden');
        App.UI.showScreen('login');
        return;
    }

    const session = await App.Auth.getSession();

    // 3. Cargar datos iniciales si hay sesión
    if (session) {
        // Cargar Categorías y Transacciones (archivos se obtienen via join en getTransactions)
        await Promise.all([
            App.DB.getCategories(),
            App.DB.getTransactions()
        ]);

        // Los archivos ya están mapeados dentro de getTransactions() via join
        console.log('[Init] Transacciones cargadas:', (App.state.transactions || []).length,
            '| Con archivo:', (App.state.transactions || []).filter(t => t.file_url).length);

        // Renderizar inicial
        App.UI.renderCategoriesList();
    }

    // Ocultar pantalla de carga
    document.getElementById('loading-screen').classList.add('hidden');

    // 4. Inicializar Router (Si no hemos detenido la ejecución arriba)
    if (!initialHash.includes('type=signup')) {
        App.Router.init();
    }


    // --- EVENT LISTENERS ---

    // LOGIN & REGISTER (Existing Logic preserved)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');

            try {
                btn.disabled = true;
                btn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> ${App.I18n.t('common.loading')}`;
                await App.Auth.login(email, password);
                window.location.hash = 'dashboard';
                window.location.reload();
            } catch (err) {
                console.error(err);
                App.UI.showLoginMessage(err.message || 'Error iniciando sesión', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<span data-i18n="auth.login_action">${App.I18n.t('auth.login_action')}</span>`;
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const btn = document.getElementById('register-btn');

            try {
                btn.disabled = true;
                btn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> ${App.I18n.t('common.processing')}`;
                await App.Auth.register(email, password);
                App.UI.showScreen('auth-success');
            } catch (err) {
                console.error(err);
                App.UI.showRegisterMessage(err.message || 'Error en registro', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<span data-i18n="auth.register_action">${App.I18n.t('auth.register_action')}</span>`;
            }
        });
    }

    // LOGOUT
    // Logout: sidebar button + profile button (mobile)
    document.querySelectorAll('#logout-btn, #logout-btn-profile').forEach(btn => {
        btn.addEventListener('click', () => App.Auth.logout());
    });

    // NAVIGATION (Sidebar)
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', () => {
            const target = li.getAttribute('data-target');
            window.location.hash = target;
        });
    });

    // NAVIGATION (Bottom Nav - Mobile)
    document.querySelectorAll('.bottom-nav-links li').forEach(li => {
        li.addEventListener('click', () => {
            const target = li.getAttribute('data-target');
            window.location.hash = target;
        });
    });

    // MOBILE MENU (hamburger toggle - now secondary to bottom nav)
    const menuBtn = document.getElementById('mobile-menu-toggle');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            const nav = document.getElementById('main-nav');
            if (nav.classList.contains('hidden')) {
                nav.classList.remove('hidden');
                nav.style.position = 'absolute';
                nav.style.top = '60px';
                nav.style.height = 'calc(100% - 60px)';
                nav.style.width = '100%';
                nav.style.background = 'var(--bg-card)';
                nav.style.zIndex = '1000';
            } else {
                nav.classList.add('hidden');
            }
        });
    }

    // MODALS CLOSE
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => App.UI.closeModals());
    });

    // --- TRANSACTION LOGIC ---

    // Type Change -> Reset Form & Update Categories
    const typeRadios = document.querySelectorAll('input[name="type"]');
    typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {

			// Reset categoría siempre
			const categorySelect = document.getElementById('t-category');
			categorySelect.value = '';
			categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';

			// Recargar categorías correctas
			App.UI.updateCategorySelect('t-category', e.target.value);

		});
	});


    // Initial Category Load for Transaction Form
    // Initial Category Load for Transaction Form
	if (document.getElementById('t-category')) {

		const expenseRadio = document.querySelector('input[name="type"][value="expense"]');
		const incomeRadio = document.querySelector('input[name="type"][value="income"]');

		// Forzar que el tipo por defecto sea expense
		if (expenseRadio) expenseRadio.checked = true;
		if (incomeRadio) incomeRadio.checked = false;

		// Limpiar selector de categoría
		const categorySelect = document.getElementById('t-category');
		categorySelect.value = '';

		// Cargar categorías correctas
		App.UI.updateCategorySelect('t-category', 'expense');
	}


    // ADD TRANSACTION FORM
    const tForm = document.getElementById('transaction-form');
    if (tForm) {
        tForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = tForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = App.I18n.t('common.saving');

            try {
                const type = document.querySelector('input[name="type"]:checked').value;
                const amount = document.getElementById('t-amount').value;
                const description = document.getElementById('t-description').value;
                const date = document.getElementById('t-date').value;
                const category = document.getElementById('t-category').value;
                const fileInput = document.getElementById('t-file');
                const fileErrorEl = document.getElementById('t-file-error');
                fileErrorEl.classList.add('hidden');

                // Validar archivo si existe
                const file = fileInput && fileInput.files[0];
                if (file && !App.Utils.validateFileType(file)) {
                    fileErrorEl.textContent = 'Tipo de archivo no permitido. Usa JPG, PNG, WebP, PDF, MP3, WAV u OGG.';
                    fileErrorEl.classList.remove('hidden');
                    return;
                }

                // 1. Crear Transacción y esperar ID real
                const transactionData = { type, amount: parseFloat(amount), description, date, category };
                const result = await App.DB.addTransaction(transactionData);

                if (result.error) {
                    console.error(result.error);
                    throw new Error(result.error.message || 'Error creating transaction');
                }

                const newTransaction = result.data;
                console.log("Created transaction id:", newTransaction.id);

                // 2. Subir archivo a Supabase Storage (si existe)
                if (file) {
                    console.log('[Upload] Subiendo archivo:', file.name, 'tipo:', file.type);
                    const uploadResult = await App.Storage.uploadFile(file, App.user.id);

                    if (uploadResult.path) {
                        // 3. Insertar en "files" usando el ID REAL de la transacción
                        console.log("Linking file to transaction:", newTransaction.id);
                        const fileRes = await App.DB.addFile(newTransaction.id, uploadResult.path);

                        if (fileRes.error) {
                            console.error('[Upload] ✗ Error registrando archivo en DB:', fileRes.error);
                        } else {
                            console.log('[Upload] ✓ Registro en DB OK, id:', fileRes.data?.id);
                        }

                        // Actualizar estado local para que se refleje de inmediato en la UI
                        const t = App.state.transactions.find(tr => String(tr.id) === String(newTransaction.id));
                        if (t) t.file_url = uploadResult.path;

                    } else {
                        console.error('[Upload] ✗ Error subiendo archivo:', uploadResult.error);
                        // No lanzamos error general para no bloquear la creación de la transacción,
                        // pero notificamos en consola.
                    }
                }

                // 3. Actualizar UI
                App.UI.closeModals();
                tForm.reset();

                const activeId = document.querySelector('.view.active')?.id;
                if (activeId === 'view-dashboard') App.UI.loadAndRenderDashboard();
                if (activeId === 'view-transactions') App.UI.loadAndRenderTransactionsList();

            } catch (err) {
                console.error(err);
                alert(err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    // EDIT TRANSACTION FORM
    const eForm = document.getElementById('edit-transaction-form');
    if (eForm) {
        eForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = eForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = App.I18n.t('common.updating');

            try {
                const id = document.getElementById('e-id').value;
                const amount = document.getElementById('e-amount').value;
                const description = document.getElementById('e-description').value;
                const date = document.getElementById('e-date').value;
                const category = document.getElementById('e-category').value;
                const fileInput = document.getElementById('e-file');
                const fileErrorEl = document.getElementById('e-file-error');
                fileErrorEl.classList.add('hidden');

                // Validar archivo nuevo si existe
                const file = fileInput && fileInput.files[0];
                if (file && !App.Utils.validateFileType(file)) {
                    fileErrorEl.textContent = 'Tipo de archivo no permitido. Usa JPG, PNG, WebP, PDF, MP3, WAV u OGG.';
                    fileErrorEl.classList.remove('hidden');
                    return;
                }

                // 1. Actualizar Datos Básicos
                const updates = {
                    amount: parseFloat(amount),
                    description,
                    date,
                    category
                };
                const res = await App.DB.updateTransaction(id, updates);
                if (res.error) throw new Error(res.error.message);

                // 2. Manejar archivo (reemplazar o nuevo)
                // 2. Manejar archivo (reemplazar o nuevo)
                if (file) {
                    // Eliminar archivo anterior si existe
                    const t = App.state.transactions.find(tr => String(tr.id) === String(id));
                    if (t && t.file_url) {
                        await App.Storage.deleteFile(t.file_url);
                        await App.DB.deleteFileByTransactionId(id);
                    }

                    // Subir nuevo
                    console.log('[Edit] Subiendo nuevo archivo:', file.name);
                    const uploadResult = await App.Storage.uploadFile(file, App.user.id);

                    if (uploadResult.path) {
                        console.log("Linking file to transaction:", id);
                        const fileRes = await App.DB.addFile(id, uploadResult.path);

                        if (fileRes.error) {
                            console.error('[Edit] ✗ Error registrando archivo en DB:', fileRes.error);
                        } else {
                            console.log('[Edit] ✓ Registro en DB OK');
                        }

                        if (t) t.file_url = uploadResult.path;
                    } else {
                        console.error('[Edit] ✗ Error subiendo archivo:', uploadResult.error);
                    }
                }

                // 3. Finalizar
                App.UI.closeModals();
                eForm.reset(); // Reset form just in case

                const activeId = document.querySelector('.view.active')?.id;
                if (activeId === 'view-dashboard') App.UI.loadAndRenderDashboard();
                if (activeId === 'view-transactions') App.UI.loadAndRenderTransactionsList();

            } catch (err) {
                console.error(err);
                alert(err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = App.I18n.t('common.update');
            }
        });
    }

    // DELETE CONFIRMATION
    const deleteBtn = document.getElementById('confirm-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!App.state.transactionToDelete) return;

            const btn = deleteBtn;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const transId = App.state.transactionToDelete;

                // Eliminar archivo asociado si existe
                const t = App.state.transactions.find(tr => String(tr.id) === String(transId));
                if (t && t.file_url) {
                    await App.Storage.deleteFile(t.file_url);
                    await App.DB.deleteFileByTransactionId(transId);
                }

                const res = await App.DB.deleteTransaction(transId);
                if (res.error) throw new Error(res.error.message);

                App.UI.closeModals();
                // Refresh views logic
                const activeId = document.querySelector('.view.active')?.id;
                if (activeId === 'view-dashboard') App.UI.loadAndRenderDashboard();
                if (activeId === 'view-transactions') App.UI.loadAndRenderTransactionsList();
            } catch (err) {
                alert(App.I18n.t('msg.delete_error') + ': ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
                App.state.transactionToDelete = null;
            }
        });
    }


    // --- CATEGORIES LOGIC ---

    // Switch Type in New Category Form
    // (Optional: visual changes or presets)

    // Add Category Form
    const cForm = document.getElementById('category-form');
    if (cForm) {
        cForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = cForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            try {
                const type = document.querySelector('input[name="c-type"]:checked').value;
                const name = document.getElementById('c-name').value;

                const res = await App.DB.addCategory({ name, type });
                if (res.error) throw new Error(res.error.message);

                App.UI.closeModals();
                cForm.reset();
                App.UI.renderCategoriesList(); // Refresh list

                // Refresh dropdowns if open
                const currentType = document.querySelector('input[name="type"]:checked')?.value || 'expense';
                App.UI.updateCategorySelect('t-category', currentType);

            } catch (err) {
                alert(err.message);
            } finally {
                btn.disabled = false;
            }
        });
    }


    // --- SEARCH & FILTERS ---
    const searchInput = document.getElementById('search-transactions');
    const filterMonth = document.getElementById('filter-month');
    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');

    const updateFilters = () => {
        App.state.filters = {
            search: searchInput ? searchInput.value.toLowerCase() : '',
            month: filterMonth ? filterMonth.value : 'all',
            type: filterType ? filterType.value : 'all',
            category: filterCategory ? filterCategory.value : 'all'
        };
        App.UI.loadAndRenderTransactionsList();
    };

    if (searchInput) searchInput.addEventListener('input', updateFilters);
    if (filterMonth) filterMonth.addEventListener('change', updateFilters);
    if (filterType) filterType.addEventListener('change', updateFilters);
    if (filterCategory) filterCategory.addEventListener('change', updateFilters);

    // Idioma
    const langSelect = document.getElementById('language-selector');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            App.I18n.setLanguage(e.target.value);
            const activeId = document.querySelector('.view.active')?.id;
            if (activeId === 'view-dashboard') App.UI.loadAndRenderDashboard();
            if (activeId === 'view-transactions') {
                App.UI.populateFilterOptions();
                App.UI.loadAndRenderTransactionsList();
            }
            if (activeId === 'view-categories') App.UI.renderCategoriesList();
            if (activeId === 'view-stats') App.UI.renderStats();
        });
    }

    // --- PERSONALIZACIÓN DE TEMA ---

    // Selector de tema (claro/oscuro) — Botones con iconos
    const themePalette = document.getElementById('theme-palette');
    if (themePalette) {
        // Marcar tema activo al cargar
        const savedTheme = localStorage.getItem('theme') || 'light';
        themePalette.querySelectorAll('.theme-swatch').forEach(sw => {
            sw.classList.toggle('active', sw.dataset.theme === savedTheme);
        });

        themePalette.addEventListener('click', (e) => {
            const swatch = e.target.closest('.theme-swatch');
            if (!swatch) return;
            const theme = swatch.dataset.theme;
            localStorage.setItem('theme', theme);
            // Actualizar visual
            themePalette.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            App.Utils.applyTheme();
        });
    }

    // Selector de color de acento
    const colorPalette = document.getElementById('color-palette');
    if (colorPalette) {
        // Marcar color activo al cargar
        const savedColor = localStorage.getItem('accentColor') || 'blue';
        colorPalette.querySelectorAll('.color-swatch').forEach(sw => {
            sw.classList.toggle('active', sw.dataset.color === savedColor);
        });

        colorPalette.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (!swatch) return;
            const color = swatch.dataset.color;
            localStorage.setItem('accentColor', color);
            // Actualizar visual
            colorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            App.Utils.applyTheme();
        });
    }

    // --- BORRAR DATOS (sin eliminar cuenta) ---

    const btnDeleteDataConfirm = document.getElementById('btn-delete-data-confirm');
    if (btnDeleteDataConfirm) {
        btnDeleteDataConfirm.addEventListener('click', async () => {
            const progressText = document.getElementById('delete-data-progress-text');

            // Mostrar loading
            document.getElementById('delete-data-confirm').classList.add('hidden');
            document.getElementById('delete-data-loading').classList.remove('hidden');

            try {
                // 1. Eliminar archivos del Storage
                progressText.textContent = App.I18n.t('settings.delete_progress_files');
                await App.Storage.deleteAllUserFiles(App.user.id);

                // 2. Eliminar datos de la DB (files, transactions, categories)
                progressText.textContent = App.I18n.t('settings.delete_progress_records');
                await App.DB.deleteAllUserData();

                // 3. Limpiar estado local
                App.state.transactions = [];
                App.state.categories = [];

                // 4. Mostrar éxito en el modal
                document.getElementById('delete-data-loading').classList.add('hidden');
                document.getElementById('delete-data-success').classList.remove('hidden');

                // 5. Refrescar la UI de fondo
                App.UI.loadAndRenderDashboard();
                App.UI.renderCategoriesList();

            } catch (err) {
                console.error('Error deleting data:', err);
                progressText.textContent = 'Error: ' + (err.message || App.I18n.t('msg.error_generic'));
                // Volver al paso de confirmación tras un error
                setTimeout(() => {
                    document.getElementById('delete-data-loading').classList.add('hidden');
                    document.getElementById('delete-data-confirm').classList.remove('hidden');
                }, 3000);
            }
        });
    }
});

/**
 * UI.JS
 * Manipulación del DOM y renderizado de vistas.
 */

App.UI = {
    // --- VISTAS ---

    showScreen: function (screenId) {
        // Ocultar todas
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        // Mostrar la deseada
        const target = document.getElementById(`view-${screenId}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');

            // Actualizar menú activo (sidebar)
            document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
            const navItem = document.querySelector(`.nav-links li[data-target="${screenId}"]`);
            if (navItem) navItem.classList.add('active');

            // Actualizar menú activo (bottom nav mobile)
            document.querySelectorAll('.bottom-nav-links li').forEach(li => li.classList.remove('active'));
            const bottomNavItem = document.querySelector(`.bottom-nav-links li[data-target="${screenId}"]`);
            if (bottomNavItem) bottomNavItem.classList.add('active');

            // Logica específica de carga
            if (screenId === 'dashboard') {
                this.loadAndRenderDashboard();
            }
            if (screenId === 'transactions') {
                this.loadAndRenderTransactionsList();
                this.populateFilterOptions();
            }
            if (screenId === 'categories') {
                this.renderCategoriesList();
            }
            if (screenId === 'stats') {
                this.renderStats();
            }
            if (screenId === 'profile' && App.user) {
                document.getElementById('user-email-display').textContent = App.user.email;
            }
        }
    },

    // --- RENDERIZADO ---

    // Ordenar y filtrar transacciones
    getFilteredTransactions: function () {
        let list = [...(App.state.transactions || [])];
        const filters = App.state.filters || { search: '', month: 'all', type: 'all', category: 'all' };

        // 1. Search Text
        if (filters.search) {
            const term = filters.search.toLowerCase();
            list = list.filter(t => t.description.toLowerCase().includes(term));
        }

        // 2. Type
        if (filters.type !== 'all') {
            list = list.filter(t => t.type === filters.type);
        }

        // 3. Category
        if (filters.category !== 'all') {
            list = list.filter(t => t.category === filters.category);
        }

        // 4. Month
        if (filters.month !== 'all') {
            list = list.filter(t => t.date.startsWith(filters.month)); // Format YYYY-MM
        }

        // Fallback to legacy App.state.currentFilter if filters obj undefined (compatibility)
        if (!App.state.filters && App.state.currentFilter && App.state.currentFilter !== 'all') {
            list = list.filter(t => t.type === App.state.currentFilter);
        }

        return list;
    },

    populateFilterOptions: function () {
        // Populate Month Filter
        const monthSelect = document.getElementById('filter-month');
        if (monthSelect && App.state.transactions) {
            const months = new Set();
            App.state.transactions.forEach(t => {
                const m = t.date.substring(0, 7); // YYYY-MM
                months.add(m);
            });

            // Keep "all" option
            const currentVal = monthSelect.value;
            monthSelect.innerHTML = `<option value="all">${App.I18n.t('filter.all_time')}</option>`;

            Array.from(months).sort().reverse().forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                // Format: "Month YYYY"
                const dateObj = new Date(m + '-01');
                opt.textContent = dateObj.toLocaleDateString(App.I18n.currentLang || 'es', { month: 'long', year: 'numeric' });
                monthSelect.appendChild(opt);
            });
            monthSelect.value = currentVal;
        }

        // Populate Category Filter
        const catSelect = document.getElementById('filter-category');
        if (catSelect && App.state.categories) {
            const currentVal = catSelect.value;
            catSelect.innerHTML = `<option value="all">${App.I18n.t('filter.all_categories')}</option>`;

            App.state.categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                catSelect.appendChild(opt);
            });
            catSelect.value = currentVal;
        }
    },

    loadAndRenderDashboard: function () {
        // Dashboard: Show only last 10, no filters
        const all = [...(App.state.transactions || [])];
        // Sort just in case (though DB returns sorted)
        // Sort by date desc, then by id desc (newest first on same date)
        all.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

        const recent = all.slice(0, 10);

        // Update Stats global
        this.updateDashboardCards(all);

        // Render Dashboard List (Independent of filters)
        const dashboardListEl = document.getElementById('dashboard-list');
        if (dashboardListEl) {
            dashboardListEl.innerHTML = this.renderListHTML(recent, 'dashboard');
        }
    },

    loadAndRenderTransactionsList: function () {
        // Transactions List: Apply filters
        const filtered = this.getFilteredTransactions();

        const fullListEl = document.getElementById('transactions-list-full');
        if (fullListEl) {
            fullListEl.innerHTML = this.renderListHTML(filtered, 'transactions');
        }
    },

    renderListHTML: function (transactions, viewId = 'list') {
        if (!transactions || transactions.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="ph ph-receipt" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>${App.I18n.t('transaction.empty')}</p>
                </div>
            `;
        }

        return transactions.map(t => {
            const isExpense = t.type === 'expense';
            const iconClass = isExpense ? 'ph-arrow-up-right' : 'ph-arrow-down-left';
            const iconBg = isExpense ? 'expense' : 'income';
            const amountClass = isExpense ? 'expense' : 'income';

            // Clip icon si tiene archivo
            const clipIcon = t.file_url
                ? `<i class="ph ph-paperclip t-clip" title="Archivo adjunto"></i>`
                : '';
            const hasFileClass = t.file_url ? 'has-file' : '';

            // Unique ID for preview container based on viewId to avoid conflicts
            const previewId = `preview-${viewId}-${t.id}`;

            return `
                <div class="transaction-wrapper" style="margin-bottom: 0.5rem;">
                    <div class="transaction-item ${hasFileClass}" ${t.file_url ? `onclick="App.UI.toggleFilePreview('${viewId}', '${t.id}', this)"` : ''}>
                        <div style="display:flex; align-items:center;">
                            <div class="t-icon ${iconBg}">
                                <i class="ph ${iconClass}"></i>
                            </div>
                            <div class="t-info">
                                <span class="t-title">${t.description}${clipIcon}</span>
                                <span class="t-meta">${App.Utils.formatDate(t.date)} • ${t.category || 'General'}</span>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap: 0.5rem;">
                            <span class="t-amount ${amountClass}">
                                ${isExpense ? '-' : '+'} ${App.Utils.formatCurrency(t.amount)}
                            </span>

                            <button class="btn-text" onclick="event.stopPropagation(); App.UI.openEditModal('${t.id}')" title="Editar">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button class="btn-text" onclick="event.stopPropagation(); App.UI.deleteTransactionConfirm('${t.id}')" title="Borrar">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div id="${previewId}" class="file-preview hidden"></div>
                </div>
            `;
        }).join('');
    },



    updateDashboardCards: function (list) {
        const income = list
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = list
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const total = income - expense;

        document.getElementById('total-balance').textContent = App.Utils.formatCurrency(total);
        document.getElementById('total-income').textContent = App.Utils.formatCurrency(income);
        document.getElementById('total-expense').textContent = App.Utils.formatCurrency(expense);
    },

    // --- CATEGORIES ---

    renderCategoriesList: function () {
        const incomeContainer = document.getElementById('categories-list-income');
        const expenseContainer = document.getElementById('categories-list-expense');

        if (!incomeContainer || !expenseContainer) return;

        // Clear
        incomeContainer.innerHTML = '';
        expenseContainer.innerHTML = '';

        const categories = App.state.categories || [];

        // Helper to create card HTML
        const createCard = (c) => `
            <div class="category-card">
                <div>
                     <span class="badge ${c.type}">
                        ${c.type === 'income' ? App.I18n.t('common.income') : App.I18n.t('common.expense')}
                    </span>
                    <h4>${c.name}</h4>
                </div>
                <button class="btn-icon-delete" onclick="App.UI.deleteCategory('${c.id}')" title="${App.I18n.t('common.delete')}">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;

        if (categories.length === 0) {
            incomeContainer.innerHTML = `<p style="color:var(--text-muted);">${App.I18n.t('categories.empty')}</p>`;
            expenseContainer.innerHTML = `<p style="color:var(--text-muted);">${App.I18n.t('categories.empty')}</p>`;
            return;
        }

        let hasIncome = false;
        let hasExpense = false;

        categories.forEach(c => {
            if (c.type === 'income') {
                incomeContainer.insertAdjacentHTML('beforeend', createCard(c));
                hasIncome = true;
            } else {
                expenseContainer.insertAdjacentHTML('beforeend', createCard(c));
                hasExpense = true;
            }
        });

        if (!hasIncome) incomeContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">${App.I18n.t('categories.none_income')}</p>`;
        if (!hasExpense) expenseContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">${App.I18n.t('categories.none_expense')}</p>`;

        // Restore current filter
        const currentFilter = document.querySelector('.filters-bar .active')?.id?.replace('cat-btn-', '') || 'all';
        this.filterCategories(currentFilter);
    },

    filterCategories: function (type) {
        // Update Buttons
        document.querySelectorAll('#view-categories .filters-bar .btn-filter').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`cat-btn-${type}`);
        if (activeBtn) activeBtn.classList.add('active');

        const colIncome = document.getElementById('cat-col-income');
        const colExpense = document.getElementById('cat-col-expense');

        if (type === 'all') {
            colIncome.classList.remove('hidden');
            colExpense.classList.remove('hidden');
        } else if (type === 'income') {
            colIncome.classList.remove('hidden');
            colExpense.classList.add('hidden');
        } else if (type === 'expense') {
            colIncome.classList.add('hidden');
            colExpense.classList.remove('hidden');
        }
    },

    updateCategorySelect: function (selectId, type) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '';

        // Added "Ninguna" as default option
        const defaultOpt = document.createElement('option');
        defaultOpt.value = 'Ninguna';
        defaultOpt.textContent = App.I18n.t('common.none');
        select.appendChild(defaultOpt);

        // Filter categories by type (STRICT)
        let filtered = (App.state.categories || []).filter(c => c.type === type);

        filtered.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    },

    deleteCategory: async function (id) {
        this.openDeleteModal('category', id);
    },

    // --- STATS ---

    // Internal state for stats controls
    _statsState: {
        categoryFilter: 'expense',  // 'expense' | 'income' | 'both'
        categoryChartType: 'bar',   // 'bar' | 'doughnut'
        balancePeriod: 'monthly',   // 'weekly' | 'monthly' | 'annual'
        timelinePeriod: 'monthly'   // 'weekly' | 'monthly' | 'annual' (independent)
    },

    // --- Control Functions (called from HTML onclick) ---

    setCategoryFilter: function (filter) {
        this._statsState.categoryFilter = filter;
        // Update button state
        document.querySelectorAll('[data-cat-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-cat-filter') === filter);
        });
        this.renderCategoryChart();
    },

    setCategoryChartType: function (type) {
        this._statsState.categoryChartType = type;
        // Update button state
        document.querySelectorAll('[data-chart-type]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-chart-type') === type);
        });
        this.renderCategoryChart();
    },

    setBalancePeriod: function (period) {
        this._statsState.balancePeriod = period;
        // Update ONLY balance period buttons (scoped by data-period attribute)
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-period') === period);
        });
        this.renderBalanceChart();
        // NO llama a renderTimelineChart — independiente
    },

    setTimelinePeriod: function (period) {
        this._statsState.timelinePeriod = period;
        // Update ONLY timeline period buttons (scoped by data-timeline-period attribute)
        document.querySelectorAll('[data-timeline-period]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-timeline-period') === period);
        });
        this.renderTimelineChart();
        // NO llama a renderBalanceChart — independiente
    },

    // --- Helper: format YYYY-MM key from a Date (local timezone) ---
    _localYearMonth: function (d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return y + '-' + m;
    },

    // --- Main Orchestrator ---
    renderStats: function () {
        // Initialize chart storage if needed
        if (!App.state.charts) App.state.charts = {};

        this.renderCategoryChart();
        this.renderBalanceChart();
        this.renderTimelineChart();
        this.renderTopTransactions();
    },

    // --- Sub-Renderer 1: Category Breakdown ---
    renderCategoryChart: function () {
        const list = App.state.transactions || [];
        const filter = this._statsState.categoryFilter;
        const chartType = this._statsState.categoryChartType;

        // Aggregate data by category
        const catTotals = {};
        list.forEach(t => {
            if (filter === 'expense' && t.type !== 'expense') return;
            if (filter === 'income' && t.type !== 'income') return;
            // 'both' => include all
            const cat = t.category || 'Ninguna';
            catTotals[cat] = (catTotals[cat] || 0) + Number(t.amount);
        });

        // Destroy previous chart
        if (App.state.charts.categories) {
            App.state.charts.categories.destroy();
            App.state.charts.categories = null;
        }

        const ctx = document.getElementById('chart-categories');
        if (!ctx) return;

        const labels = Object.keys(catTotals);
        const data = Object.values(catTotals);

        if (labels.length === 0) {
            // Show no-data message via an empty chart with a plugin
            App.state.charts.categories = new Chart(ctx, {
                type: 'bar',
                data: { labels: [], datasets: [] },
                options: { responsive: true, maintainAspectRatio: false },
                plugins: [{
                    id: 'noData',
                    afterDraw: function (chart) {
                        const { ctx: c, width, height } = chart;
                        c.save();
                        c.textAlign = 'center';
                        c.textBaseline = 'middle';
                        c.font = '14px Inter, sans-serif';
                        c.fillStyle = '#6b7280';
                        c.fillText(App.I18n.t('stats.no_data'), width / 2, height / 2);
                        c.restore();
                    }
                }]
            });
            return;
        }

        // Color palette
        const colors = [
            '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444',
            '#06b6d4', '#8b5cf6', '#f97316', '#84cc16', '#d946ef'
        ];

        // Determine label
        let datasetLabel = App.I18n.t('stats.expenses_label');
        if (filter === 'income') datasetLabel = App.I18n.t('stats.income_label');
        if (filter === 'both') datasetLabel = App.I18n.t('stats.income_vs_expense');

        App.state.charts.categories = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: chartType === 'doughnut' ? 2 : 1,
                    borderColor: chartType === 'doughnut' ? '#ffffff' : undefined,
                    borderRadius: chartType === 'bar' ? 4 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: chartType === 'doughnut',
                        position: 'bottom',
                        labels: { padding: 12, font: { size: 12 } }
                    }
                },
                scales: chartType === 'bar' ? {
                    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                    x: { ticks: { font: { size: 11 } } }
                } : {}
            }
        });
    },

    // --- Sub-Renderer 2: Balance by Period ---
    renderBalanceChart: function () {
        const list = App.state.transactions || [];
        const period = this._statsState.balancePeriod;
        const lang = App.I18n.currentLang || 'es';

        // Destroy previous chart
        if (App.state.charts.balance) {
            App.state.charts.balance.destroy();
            App.state.charts.balance = null;
        }

        const ctx = document.getElementById('chart-balance');
        if (!ctx) return;

        // Build period buckets
        const buckets = {};
        const today = new Date();

        if (period === 'weekly') {
            // Last 8 weeks
            for (let i = 7; i >= 0; i--) {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));
                const key = weekStart.toISOString().slice(0, 10);
                const label = weekStart.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
                buckets[key] = { income: 0, expense: 0, label: label };
            }
            // Assign transactions to their week bucket
            list.forEach(t => {
                const d = new Date(t.date);
                const dayOfWeek = d.getDay();
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - dayOfWeek);
                const key = weekStart.toISOString().slice(0, 10);
                if (buckets[key]) {
                    if (t.type === 'income') buckets[key].income += Number(t.amount);
                    if (t.type === 'expense') buckets[key].expense += Number(t.amount);
                }
            });
        } else if (period === 'monthly') {
            // Last 6 months — use local timezone for key generation
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = this._localYearMonth(d); // YYYY-MM local
                const label = d.toLocaleDateString(lang, { month: 'short' }) + ' ' + d.getFullYear().toString().slice(2);
                buckets[key] = { income: 0, expense: 0, label: label };
            }
            list.forEach(t => {
                const key = t.date.slice(0, 7); // Transaction dates are YYYY-MM-DD strings
                if (buckets[key]) {
                    if (t.type === 'income') buckets[key].income += Number(t.amount);
                    if (t.type === 'expense') buckets[key].expense += Number(t.amount);
                }
            });
        } else if (period === 'annual') {
            // Last 4 years
            for (let i = 3; i >= 0; i--) {
                const year = today.getFullYear() - i;
                const key = String(year);
                buckets[key] = { income: 0, expense: 0, label: key };
            }
            list.forEach(t => {
                const key = t.date.slice(0, 4);
                if (buckets[key]) {
                    if (t.type === 'income') buckets[key].income += Number(t.amount);
                    if (t.type === 'expense') buckets[key].expense += Number(t.amount);
                }
            });
        }

        const labels = Object.values(buckets).map(b => b.label);
        const incomeData = Object.values(buckets).map(b => b.income);
        const expenseData = Object.values(buckets).map(b => b.expense);

        App.state.charts.balance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: App.I18n.t('stats.income_label'),
                        data: incomeData,
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    },
                    {
                        label: App.I18n.t('stats.expense_label'),
                        data: expenseData,
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                    x: { ticks: { font: { size: 11 } } }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 12, font: { size: 12 } }
                    }
                }
            }
        });
    },

    // --- Sub-Renderer 3: Timeline Evolution (Line Chart) ---
    renderTimelineChart: function () {
        const list = App.state.transactions || [];
        const period = this._statsState.timelinePeriod; // Independent state
        const lang = App.I18n.currentLang || 'es';

        // Destroy previous chart
        if (App.state.charts.timeline) {
            App.state.charts.timeline.destroy();
            App.state.charts.timeline = null;
        }

        const ctx = document.getElementById('chart-timeline');
        if (!ctx) return;

        // Build period buckets (same logic, independent period)
        const buckets = {};
        const today = new Date();

        if (period === 'weekly') {
            for (let i = 7; i >= 0; i--) {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));
                const key = weekStart.toISOString().slice(0, 10);
                const label = weekStart.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
                buckets[key] = { income: 0, expense: 0, label: label };
            }
            list.forEach(t => {
                const d = new Date(t.date);
                const dayOfWeek = d.getDay();
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - dayOfWeek);
                const key = weekStart.toISOString().slice(0, 10);
                if (buckets[key]) {
                    if (t.type === 'income') buckets[key].income += Number(t.amount);
                    if (t.type === 'expense') buckets[key].expense += Number(t.amount);
                }
            });
        } else if (period === 'monthly') {
            // Last 6 months — use local timezone for key generation
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = this._localYearMonth(d); // YYYY-MM local
                const label = d.toLocaleDateString(lang, { month: 'short' }) + ' ' + d.getFullYear().toString().slice(2);
                buckets[key] = { income: 0, expense: 0, label: label };
            }
            list.forEach(t => {
                const key = t.date.slice(0, 7); // Transaction dates are YYYY-MM-DD strings
                if (buckets[key]) {
                    if (t.type === 'income') buckets[key].income += Number(t.amount);
                    if (t.type === 'expense') buckets[key].expense += Number(t.amount);
                }
            });
        } else if (period === 'annual') {
            for (let i = 3; i >= 0; i--) {
                const year = today.getFullYear() - i;
                const key = String(year);
                buckets[key] = { income: 0, expense: 0, label: key };
            }
            list.forEach(t => {
                const key = t.date.slice(0, 4);
                if (buckets[key]) {
                    if (t.type === 'income') buckets[key].income += Number(t.amount);
                    if (t.type === 'expense') buckets[key].expense += Number(t.amount);
                }
            });
        }

        const labels = Object.values(buckets).map(b => b.label);
        const incomeData = Object.values(buckets).map(b => b.income);
        const expenseData = Object.values(buckets).map(b => b.expense);

        App.state.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: App.I18n.t('stats.income_label'),
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2.5
                    },
                    {
                        label: App.I18n.t('stats.expense_label'),
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                    x: { ticks: { font: { size: 11 } } }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 12, font: { size: 12 } }
                    }
                }
            }
        });
    },

    // --- Sub-Renderer 4: Top 5 Transactions ---
    renderTopTransactions: function () {
        const list = App.state.transactions || [];
        const container = document.getElementById('top-transactions-list');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `
                <div class="stats-no-data">
                    <i class="ph ph-receipt"></i>
                    <p>${App.I18n.t('stats.no_data')}</p>
                </div>`;
            return;
        }

        // Sort by amount descending, take top 5
        const sorted = [...list].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);

        container.innerHTML = sorted.map((t, i) => {
            const isExpense = t.type === 'expense';
            return `
                <div class="top-transaction-item">
                    <div style="display:flex; align-items:center; min-width:0; flex:1;">
                        <div class="top-transaction-rank">${i + 1}</div>
                        <div class="top-transaction-info">
                            <span class="top-desc">${t.description}</span>
                            <span class="top-meta">${App.Utils.formatDate(t.date)} • ${t.category || 'General'}</span>
                        </div>
                    </div>
                    <span class="top-transaction-amount ${isExpense ? 'expense' : 'income'}">
                        ${isExpense ? '-' : '+'} ${App.Utils.formatCurrency(t.amount)}
                    </span>
                </div>`;
        }).join('');
    },



    // --- MODALS & ACTIONS ---

    showModal: function (modalId) {
        document.getElementById('modal-container').classList.remove('hidden');
        document.getElementById(modalId).classList.remove('hidden');

        if (modalId === 'modal-transaction') {
            document.getElementById('t-date').value = new Date().toISOString().split('T')[0];

            // [FIX] Reset type to Expense and refresh categories
            const expenseRadio = document.getElementById('type-expense');
            if (expenseRadio) expenseRadio.checked = true;
            this.updateCategorySelect('t-category', 'expense');

            // Limpiar input de archivo
            const fileInput = document.getElementById('t-file');
            if (fileInput) fileInput.value = '';
            const fileError = document.getElementById('t-file-error');
            if (fileError) fileError.classList.add('hidden');
        }
    },

    closeModals: function () {
        document.getElementById('modal-container').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    },

    openEditModal: function (id) {
        const t = App.state.transactions.find(tx => tx.id === id);
        if (!t) return;

        document.getElementById('e-id').value = t.id;
        document.getElementById('e-type-display').value = t.type === 'income' ? App.I18n.t('common.income') : App.I18n.t('common.expense');
        document.getElementById('e-amount').value = t.amount;
        document.getElementById('e-description').value = t.description;
        document.getElementById('e-date').value = t.date;

        // Populate category dropdown
        this.updateCategorySelect('e-category', t.type);
        document.getElementById('e-category').value = t.category || 'General';

        // Mostrar archivo actual si existe
        const currentFileEl = document.getElementById('e-current-file');
        const fileInput = document.getElementById('e-file');
        const fileError = document.getElementById('e-file-error');
        if (fileInput) fileInput.value = '';
        if (fileError) fileError.classList.add('hidden');

        if (currentFileEl) {
            if (t.file_url) {
                const fileName = t.file_url.split('/').pop();
                currentFileEl.innerHTML = `
                    <div class="current-file">
                        <span><i class="ph ph-file"></i> ${fileName}</span>
                        <button type="button" class="btn-remove-file" onclick="App.UI.removeFileFromEdit('${t.id}')" title="Eliminar archivo">❌</button>
                    </div>
                `;
            } else {
                currentFileEl.innerHTML = '';
            }
        }

        this.showModal('modal-edit-transaction');
    },

    /**
     * Elimina archivo de una transacción desde el modal de edición.
     */
    removeFileFromEdit: async function (transactionId) {
        const t = App.state.transactions.find(tr => String(tr.id) === String(transactionId));
        if (!t || !t.file_url) return;

        try {
            // Eliminar del Storage y DB
            await App.Storage.deleteFile(t.file_url);
            await App.DB.deleteFileByTransactionId(transactionId);

            // Actualizar estado local
            delete t.file_url;

            // Actualizar UI del modal
            const currentFileEl = document.getElementById('e-current-file');
            if (currentFileEl) currentFileEl.innerHTML = '';

            // Actualizar lista si está visible
            const activeId = document.querySelector('.view.active')?.id;
            if (activeId === 'view-transactions') this.loadAndRenderTransactionsList();
            if (activeId === 'view-dashboard') this.loadAndRenderDashboard();
        } catch (err) {
            console.error('Error removing file:', err);
        }
    },

    /**
     * Muestra/oculta la previsualización del archivo adjunto de una transacción.
     */
    toggleFilePreview: async function (viewId, transactionId, element) {
        // [FIX] Use unique ID based on viewId
        const previewEl = document.getElementById(`preview-${viewId}-${transactionId}`);
        if (!previewEl) return;

        // Toggle: si ya está visible, ocultar
        if (!previewEl.classList.contains('hidden')) {
            previewEl.classList.add('hidden');
            previewEl.innerHTML = '';
            return;
        }

        // Mostrar loading
        previewEl.classList.remove('hidden');
        previewEl.innerHTML = '<div class="preview-loading"><i class="ph ph-spinner ph-spin"></i> Cargando...</div>';

        const t = App.state.transactions.find(tr => String(tr.id) === String(transactionId));
        if (!t || !t.file_url) {
            console.warn('[Preview] Transacción sin file_url:', transactionId, t);
            previewEl.innerHTML = '<div class="preview-loading">Sin archivo</div>';
            return;
        }

        console.log('[Preview] file_url almacenado:', t.file_url);

        // Obtener URL firmada (con fallback a URL pública)
        const { signedUrl, error } = await App.Storage.createSignedUrl(t.file_url);
        if (error || !signedUrl) {
            console.error('[Preview] No se pudo obtener URL para:', t.file_url, error);
            previewEl.innerHTML = '<div class="preview-loading">Error al cargar archivo. Verifica que el archivo existe en el bucket.</div>';
            return;
        }

        // Renderizar según tipo
        const fileType = App.Utils.getFileType(t.file_url);
        console.log('[Preview] Tipo detectado:', fileType, '| URL:', signedUrl.substring(0, 80) + '...');

        switch (fileType) {
            case 'image':
                previewEl.innerHTML = `<img src="${signedUrl}" alt="Archivo adjunto" onclick="App.UI.openLightbox(this.src)" onerror="this.parentElement.innerHTML='<div class=preview-loading>Error al mostrar imagen</div>'">`;
                break;
            case 'pdf':
                previewEl.innerHTML = `
                    <iframe src="${signedUrl}" title="PDF"></iframe>
                    <a href="${signedUrl}" target="_blank" class="btn-secondary" style="display:inline-block; margin-top:0.5rem;"><i class="ph ph-arrow-square-out"></i> Abrir PDF en nueva pestaña</a>
                `;
                break;
            case 'audio':
                previewEl.innerHTML = `<audio controls src="${signedUrl}"></audio>`;
                break;
            default:
                previewEl.innerHTML = `<a href="${signedUrl}" target="_blank" class="btn-secondary" style="display:inline-block; margin-top:0.5rem;"><i class="ph ph-download"></i> Descargar archivo</a>`;
        }
    },

    /**
 * Abre el modal de confirmación de borrado de datos.
 */
    showDeleteDataModal: function () {
        // Resetear pasos
        document.getElementById('delete-data-confirm').classList.remove('hidden');
        document.getElementById('delete-data-loading').classList.add('hidden');
        document.getElementById('delete-data-success').classList.add('hidden');

        this.showModal('modal-delete-data');
    },
    deleteTransactionConfirm: function (id) {
        this.openDeleteModal('transaction', id);
    },

    openDeleteModal: function (type, id) {
        App.state.itemToDelete = id;
        App.state.deleteType = type;

        const btn = document.getElementById('confirm-delete-btn');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async () => {
            const originalText = newBtn.textContent;
            newBtn.disabled = true;
            newBtn.textContent = App.I18n.t('common.deleting');

            try {
                if (type === 'transaction') {
                    // [FIX] Eliminar archivo adjunto del Storage y de la tabla files antes de borrar la transacción
                    const t = App.state.transactions.find(tr => String(tr.id) === String(id));
                    if (t && t.file_url) {
                        console.log('[Delete] Eliminando archivo adjunto:', t.file_url);
                        await App.Storage.deleteFile(t.file_url);
                        await App.DB.deleteFileByTransactionId(id);
                    }
                    await App.DB.deleteTransaction(id);
                    // [FIX] Update ALL views to ensure immediate removal per user request
                    this.loadAndRenderTransactionsList();
                    this.loadAndRenderDashboard();
                    this.renderStats();
                } else {
                    await App.DB.deleteCategory(id);
                    this.renderCategoriesList();
                }
                this.closeModals();
            } catch (e) {
                alert('Error: ' + e.message);
            } finally {
                newBtn.disabled = false;
                newBtn.textContent = originalText;
            }
        });

        this.showModal('modal-delete');
    },


    // --- AUTH MENSAJES ---
    showLoginMessage: function (msg, type = 'info') {
        const el = document.getElementById('login-message');
        if (el) {
            el.textContent = msg;
            el.className = `message ${type}`;
            el.classList.remove('hidden');
        }
    },

    showRegisterMessage: function (msg, type = 'info') {
        const el = document.getElementById('register-message');
        if (el) {
            el.textContent = msg;
            el.className = `message ${type}`;
            el.classList.remove('hidden');
        }
    },

    toggleNavbar: function (show) {
        const nav = document.getElementById('main-nav');
        const bottomNav = document.getElementById('bottom-nav');
        if (show) {
            nav.classList.remove('hidden');
            if (bottomNav) bottomNav.classList.remove('hidden');
        } else {
            nav.classList.add('hidden');
            if (bottomNav) bottomNav.classList.add('hidden');
        }
    },

    // --- IMAGE LIGHTBOX ---

    /**
     * Abre el visor de imagen ampliada (lightbox).
     * @param {string} src - URL de la imagen a mostrar
     */
    openLightbox: function (src) {
        if (!src) return;
        const overlay = document.getElementById('image-lightbox');
        const img = document.getElementById('lightbox-img');
        if (!overlay || !img) return;

        img.src = src;
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    },

    /**
     * Cierra el visor de imagen ampliada.
     * @param {Event} event - Evento de click
     * @param {boolean} [forceClose=false] - Si true, cierra sin importar el target
     */
    closeLightbox: function (event, forceClose) {
        const overlay = document.getElementById('image-lightbox');
        if (!overlay) return;

        // Si se hizo click en la imagen misma, no cerrar (solo si no es forceClose)
        if (!forceClose && event && event.target.id === 'lightbox-img') return;

        overlay.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scroll
    }
};

// ESC key listener para cerrar lightbox
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox && !lightbox.classList.contains('hidden')) {
            App.UI.closeLightbox(null, true);
        }
    }
});

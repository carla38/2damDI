const API_URL = 'http://localhost:8000';
const POLLING_INTERVAL = 3000; // 3 seconds

// Auth Credentials (Simulation)
const CREDENTIALS = {
    user: 'admin',
    pass: 'admin123'
};

const vmGrid = document.getElementById('vm-grid');
const connectionStatus = document.getElementById('connection-status');
const template = document.getElementById('vm-card-template');

// State to track processing VMs to prevent double clicks
const processingVMs = new Set();
let pollInterval = null;

function isLoggedIn() {
    return localStorage.getItem('auth_session') === 'true';
}

async function fetchVMs() {
    if (!isLoggedIn()) return;
    try {
        const response = await fetch(`${API_URL}/vms`);
        if (!response.ok) throw new Error('Network response was not ok');
        const vms = await response.json();

        updateSystemStatus(true);
        renderVMs(vms);
    } catch (error) {
        console.error('Error fetching VMs:', error);
        updateSystemStatus(false);
        if (vmGrid.innerHTML.includes('Cargando')) {
            vmGrid.innerHTML = '<div class="loading" style="color: var(--danger-color)">Error conectando al servidor backend.<br>Asegúrate de que backend/main.py esté ejecutándose.</div>';
        }
    }
}

function updateSystemStatus(isOnline) {
    if (isOnline) {
        connectionStatus.textContent = 'Backend: Conectado';
        connectionStatus.classList.remove('disconnected');
        connectionStatus.classList.add('connected');
    } else {
        connectionStatus.textContent = 'Backend: Desconectado';
        connectionStatus.classList.remove('connected');
        connectionStatus.classList.add('disconnected');
    }
}

function renderVMs(vms) {
    if (vmGrid.innerHTML.includes('Cargando') || vmGrid.innerHTML.includes('Error')) {
        vmGrid.innerHTML = '';
    }

    const currentCardIds = Array.from(vmGrid.children).map(c => c.dataset.vmName);
    const newVmNames = vms.map(v => v.name);

    // Remove old cards
    currentCardIds.forEach(id => {
        if (!newVmNames.includes(id)) {
            const el = document.querySelector(`.vm-card[data-vm-name="${id}"]`);
            if (el) el.remove();
        }
    });

    // Add or Update cards
    vms.forEach(vm => {
        let card = document.querySelector(`.vm-card[data-vm-name="${vm.name}"]`);

        if (!card) {
            // Create new
            const clone = template.content.cloneNode(true);
            card = clone.querySelector('.vm-card');
            card.dataset.vmName = vm.name;
            card.querySelector('.vm-name').textContent = vm.name;

            // Attach Events
            card.querySelector('.btn-start').addEventListener('click', () => controlVM(vm.name, 'start'));
            card.querySelector('.btn-stop').addEventListener('click', () => controlVM(vm.name, 'stop'));

            vmGrid.appendChild(card);
        }

        // Update Content
        updateCard(card, vm);
    });
}

async function updateCard(card, vm) {
    const rawState = vm.state.toLowerCase();

    // Map raw VBox states to CSS classes
    let stateClass = 'status-unknown';
    let displayState = vm.state;

    if (rawState === 'running') stateClass = 'status-running';
    else if (rawState === 'powered off' || rawState === 'aborted') stateClass = 'status-powered_off';
    else if (rawState === 'saved' || rawState === 'paused') stateClass = 'status-saved';

    // Update Header Status Style and Badge
    card.classList.remove('status-running', 'status-powered_off', 'status-saved');
    card.classList.add(stateClass);

    // Update State Badge
    const stateBadge = card.querySelector('.vm-state-badge');
    stateBadge.textContent = displayState;
    stateBadge.className = `vm-state-badge ${stateClass}`;

    // Update Header Indicator (if kept)
    card.querySelector('.vm-header').className = `vm-header ${stateClass}`;

    // Buttons Logic
    const btnStart = card.querySelector('.btn-start');
    const btnStop = card.querySelector('.btn-stop');

    // Disable buttons if processing
    if (processingVMs.has(vm.name)) {
        btnStart.disabled = true;
        btnStop.disabled = true;
        stateBadge.textContent = 'Procesando...';
    } else {
        btnStart.disabled = (rawState === 'running');
        btnStop.disabled = (rawState !== 'running');
    }

    // --- FETCH DETAILS (Config, Storage, Net) ---
    // Only fetch if empty or we suspect change (simplest: check if OS is filled)
    const osVal = card.querySelector('.val-os').textContent;
    if (osVal === '--' || osVal === 'Cargando...') {
        try {
            const detailsRes = await fetch(`${API_URL}/vms/${vm.name}/details`);
            if (detailsRes.ok) {
                const details = await detailsRes.json();

                // Populate Config
                card.querySelector('.val-os').textContent = details.os_type;
                card.querySelector('.val-cpus').textContent = details.cpus;
                card.querySelector('.val-mem').textContent = details.memory_mb + ' MB';
                card.querySelector('.val-vram').textContent = details.vram_mb + ' MB';
                card.querySelector('.val-firmware').textContent = details.firmware;
                card.querySelector('.val-chipset').textContent = details.chipset;
                card.querySelector('.val-accel').textContent = details.acceleration;

                // Populate Storage
                const diskList = card.querySelector('.val-disks');
                diskList.innerHTML = '';
                if (details.disks.length === 0) {
                    diskList.innerHTML = '<li>Sin discos</li>';
                } else {
                    details.disks.forEach(d => {
                        const li = document.createElement('li');
                        li.textContent = `[${d.type}] ${d.path}`;
                        diskList.appendChild(li);
                    });
                }

                // Populate Network
                const netList = card.querySelector('.val-network');
                netList.innerHTML = '';
                if (details.networks.length === 0) {
                    netList.innerHTML = '<li>Sin red</li>';
                } else {
                    details.networks.forEach(n => {
                        const li = document.createElement('li');
                        li.textContent = `Int ${n.id}: ${n.type}`;
                        netList.appendChild(li);
                    });
                }
            }
        } catch (e) {
            console.error("Error fetching details", e);
        }
    }
}

async function controlVM(name, action) {
    if (processingVMs.has(name)) return;

    processingVMs.add(name);

    // Force immediate UI update to disable buttons
    const card = document.querySelector(`.vm-card[data-vm-name="${name}"]`);
    if (card) {
        card.querySelector('.btn-start').disabled = true;
        card.querySelector('.btn-stop').disabled = true;
        const badge = card.querySelector('.vm-state-badge');
        badge.textContent = action === 'start' ? 'Booteando...' : 'Apagando...';
        badge.className = 'vm-state-badge status-unknown';
        // Add spinner style if desired, or just text
    }

    // Safety timeout: If backend takes > 30s, we unlock on frontend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s max

    try {
        const res = await fetch(`${API_URL}/vms/${name}/${action}`, {
            method: 'POST',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
            // If error, force remove processing so user can try again
            processingVMs.delete(name);
        } else {
            // Success: Wait a tick then refresh
            // Backend already waited for "Running", so next fetch should be good
            setTimeout(() => {
                processingVMs.delete(name);
                fetchVMs();
            }, 500);
        }
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            alert(`La operación demoró demasiado. El servidor puede estar ocupado. La VM podría estar iniciándose en segundo plano.`);
        } else {
            alert(`Error de conexión: ${e.message}`);
        }
        // Always unlock on error
        processingVMs.delete(name);
        if (card) {
            // Revert badge visually until next poll
            card.querySelector('.vm-state-badge').textContent = 'Error/Timeout';
        }
    }
}

// Start Polling
// --- AUTHENTICATION LOGIC ---

function login(user, pass) {
    const errorMsg = document.getElementById('login-error');
    if (user === CREDENTIALS.user && pass === CREDENTIALS.pass) {
        localStorage.setItem('auth_session', 'true');
        errorMsg.classList.add('hidden');
        updateView();
    } else {
        errorMsg.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('auth_session');
    // Clear grid to prevent stale data flashing
    vmGrid.innerHTML = '<div class="loading">Cargando servidores...</div>';
    updateView();
}

function updateView() {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');

    if (isLoggedIn()) {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');

        // Start Polling
        fetchVMs();
        if (!pollInterval) {
            pollInterval = setInterval(fetchVMs, POLLING_INTERVAL);
        }
    } else {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');

        // Stop Polling
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }
}

// Event Listeners
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    login(user, pass);
});

document.getElementById('btn-logout').addEventListener('click', () => {
    logout();
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateView();
});

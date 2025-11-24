/** =========================
 *  MESSAGE HELPERS
 *  =========================
 */

/**
 * Shows an admin error/status message.
 * @param {string} message
 */
const setAdminMessage = (message) => {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) errorDiv.textContent = message || '';
};


/* =========================
 *  TEXT INJECTION (ADMIN UI)
 * =========================
 */

/**
 * Injects localized UI text for the admin page from UI_TEXT.admin.
 */
function initAdminPageText() {
    if (!window.UI_TEXT || !UI_TEXT.admin) return;
    const t = UI_TEXT.admin;

    const map = {
        // Header
        'admin-title': t.title,
        'admin-header-title': t.title,
        'logoutButton': t.logoutButton,

        // Endpoint stats
        'endpoint-stats-title': t.endpointStatsTitle,
        'endpoint-stats-subtitle': t.endpointStatsSubtitle,
        'endpoint-method-header': t.endpointMethod,
        'endpoint-path-header': t.endpointPath,
        'endpoint-requests-header': t.endpointRequests,
        'endpoint-loading': t.endpointLoading,

        // User stats
        'user-stats-title': t.userStatsTitle,
        'user-stats-subtitle': t.userStatsSubtitle,
        'user-email-header': t.userEmail,
        'user-total-requests-header': t.userTotalRequests,
        'user-stats-loading': t.userStatsLoading,

        // All users
        'all-users-title': t.allUsersTitle,
        'all-users-subtitle': t.allUsersSubtitle,
        'all-users-email-header': t.allUsersEmail,
        'all-users-request-count-header': t.allUsersRequestCount,
        'all-users-loading': t.allUsersLoading,
    };

    Object.keys(map).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = map[id];
    });

    // Set <title>
    if (document.title !== t.title) {
        document.title = t.title;
    }
}


/* =========================
 *  DATA LOADERS
 * =========================
 */

/**
 * Loads API endpoint metrics into the #endpoint-stats-table.
 */
const loadEndpointStats = async () => {
    const tableBody = document.querySelector('#endpoint-stats-table tbody');
    if (!tableBody) return;

    try {
        const response = await fetch(`${baseUrl}/admin/metrics`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) throw new Error(`Failed to load endpoint stats (status ${response.status}).`);

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3">No endpoint stats available.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        data.forEach((item) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.method || ''}</td>
                <td>${item.endpoint || ''}</td>
                <td>${item.requests != null ? item.requests : '0'}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading endpoint stats:', err);
        tableBody.innerHTML = `<tr><td colspan="3">Error loading endpoint stats.</td></tr>`;
        setAdminMessage(err.message);
    }
};


/**
 * Loads per-user API consumption into #user-stats-table.
 */
const loadUserStats = async () => {
    const tableBody = document.querySelector('#user-stats-table tbody');
    if (!tableBody) return;

    try {
        const response = await fetch(`${baseUrl}/admin/user-metrics`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) throw new Error(`Failed to load user API stats (status ${response.status}).`);

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="2">No user API stats available.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        data.forEach((user) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email || ''}</td>
                <td>${user.requests != null ? user.requests : '0'}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading user API stats:', err);
        tableBody.innerHTML = `<tr><td colspan="2">Error loading user API stats.</td></tr>`;
        setAdminMessage(err.message);
    }
};


/**
 * Loads full users list into #users-table.
 */
const loadUsers = async () => {
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) return;

    try {
        const response = await fetch(`${baseUrl}/admin/users`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) throw new Error(`Failed to load users (status ${response.status}).`);

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="2">No users found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        data.forEach((user) => {
            const row = document.createElement('tr');

            const emailCell = document.createElement('td');
            emailCell.textContent = user.email || '';
            if (user.isadministrator) {
                emailCell.classList.add('admin-email');
                emailCell.title = 'Administrator';
            }

            const requestCell = document.createElement('td');
            requestCell.textContent = user.requestcount != null ? user.requestcount : '0';

            row.appendChild(emailCell);
            row.appendChild(requestCell);

            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading users:', err);
        tableBody.innerHTML = `<tr><td colspan="2">Error loading users.</td></tr>`;
        setAdminMessage(err.message);
    }
};


/* =========================
 *  ADMIN ACTIONS
 * =========================
 */

/**
 * Hooks logout button click → logout → redirect.
 */
const setupLogoutButton = () => {
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
        try {
            await fetch(`${baseUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } finally {
            window.location.href = 'login.html';
        }
    });
};


/* =========================
 *  INITIALIZATION
 * =========================
 */

/**
 * Main initializer for the admin page:
 * - Enforces authentication
 * - Injects UI text
 * - Sets up logout
 * - Loads tables
 * - Sets auto-refresh
 */
const initAdminPage = async () => {
    // Enforce login
    if (typeof checkAuthAndRedirect === 'function') {
        try {
            await checkAuthAndRedirect();
        } catch (err) {
            setAdminMessage('Authentication failed. Please log in again.');
            return;
        }
    }

    initAdminPageText();
    setupLogoutButton();

    const refreshAll = async () => {
        await Promise.allSettled([
            loadEndpointStats(),
            loadUserStats(),
            loadUsers(),
        ]);
    };

    await refreshAll();

    setInterval(refreshAll, 10000);
};


// Run initializer
document.addEventListener('DOMContentLoaded', () => {
    initAdminPage().catch((err) => {
        console.error('Failed to init admin page:', err);
        setAdminMessage('Failed to initialize admin dashboard.');
    });
});
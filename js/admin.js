// js/admin.js

// Helper to set a status or error message on the page
const setAdminMessage = (message) => {
  const errorDiv = document.getElementById('error-message');
  if (!errorDiv) return;
  errorDiv.textContent = message || '';
};

// ---------- Data loaders ----------

// Load endpoint metrics: GET {{baseUrl}}/admin/metrics
const loadEndpointStats = async () => {
  const tableBody = document.querySelector('#endpoint-stats-table tbody');
  if (!tableBody) return;

  try {
    const response = await fetch(`${baseUrl}/admin/metrics`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to load endpoint stats (status ${response.status}).`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3">No endpoint stats available.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';
    data.forEach((item) => {
      const row = document.createElement('tr');

      const methodCell = document.createElement('td');
      methodCell.textContent = item.method || '';

      const endpointCell = document.createElement('td');
      endpointCell.textContent = item.endpoint || '';

      const requestsCell = document.createElement('td');
      requestsCell.textContent = item.requests != null ? item.requests : '0';

      row.appendChild(methodCell);
      row.appendChild(endpointCell);
      row.appendChild(requestsCell);

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading endpoint stats:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="3">Error loading endpoint stats.</td>
      </tr>
    `;
    setAdminMessage(err.message || 'Error loading endpoint stats.');
  }
};

// Load per-user API consumption: GET {{baseUrl}}/admin/user-metrics
const loadUserStats = async () => {
  const tableBody = document.querySelector('#user-stats-table tbody');
  if (!tableBody) return;

  try {
    const response = await fetch(`${baseUrl}/admin/user-metrics`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to load user API stats (status ${response.status}).`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="2">No user API stats available.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';
    data.forEach((user) => {
      const row = document.createElement('tr');

      const emailCell = document.createElement('td');
      emailCell.textContent = user.email || '';

      const requestsCell = document.createElement('td');
      requestsCell.textContent =
        user.requests != null ? user.requests : '0';

      row.appendChild(emailCell);
      row.appendChild(requestsCell);

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading user API stats:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="2">Error loading user API stats.</td>
      </tr>
    `;
    setAdminMessage(err.message || 'Error loading user API stats.');
  }
};

// Load all users list: GET {{baseUrl}}/admin/users
const loadUsers = async () => {
  const tableBody = document.querySelector('#users-table tbody');
  if (!tableBody) return;

  try {
    const response = await fetch(`${baseUrl}/admin/users`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to load users (status ${response.status}).`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="2">No users found.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';
    data.forEach((user) => {
      const row = document.createElement('tr');

      const emailCell = document.createElement('td');
      emailCell.textContent = user.email || '';
      if (user.isadministrator) {
        emailCell.classList.add('admin-email'); // underline via CSS
        emailCell.title = 'Administrator';
      }

      const requestCountCell = document.createElement('td');
      requestCountCell.textContent =
        user.requestcount != null ? user.requestcount : '0';

      row.appendChild(emailCell);
      row.appendChild(requestCountCell);

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading users:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="2">Error loading users.</td>
      </tr>
    `;
    setAdminMessage(err.message || 'Error loading users.');
  }
};

// ---------- Auth & init ----------

const setupLogoutButton = () => {
  const logoutButton = document.getElementById('logoutButton');
  if (!logoutButton) return;

  logoutButton.addEventListener('click', async () => {
    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      window.location.href = 'login.html';
    }
  });
};

const initAdminPage = async () => {
  // Ensure user is authenticated (and ideally admin)
  if (typeof checkAuthAndRedirect === 'function') {
    try {
      await checkAuthAndRedirect();
    } catch (err) {
      console.error('Auth check failed:', err);
      setAdminMessage('Authentication failed. Please log in again.');
      return;
    }
  }

  setupLogoutButton();

  // Function to load all three tables
  const refreshAll = async () => {
    await Promise.allSettled([
      loadEndpointStats(),
      loadUserStats(),
      loadUsers(),
    ]);
  };

  // Initial load
  await refreshAll();

  // Live refresh every 10 seconds
  setInterval(() => {
    refreshAll();
  }, 10000);
};

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initAdminPage().catch((err) => {
    console.error('Failed to init admin page:', err);
    setAdminMessage('Failed to initialize admin dashboard.');
  });
});
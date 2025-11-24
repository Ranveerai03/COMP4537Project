const baseUrl = 'https://assignments.isaaclauzon.com:8443/v1';


async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const errorDiv = document.getElementById('error-message');
    const registerContainer = document.getElementById('register-container');
    const successBlock = document.getElementById('register-success');
    const apiKeyBox = document.getElementById('apikey-box');
    const copyButton = document.getElementById('copy-apikey');
    const goToLoginButton = document.getElementById('go-to-login');

    if (errorDiv) errorDiv.textContent = '';

    try {
        const response = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log('Register Response:', response);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Register failed response text:', errorText);
            throw new Error(errorText || MESSAGES.registrationFailed);
        }

        const data = await response.json();
        console.log('Register success data:', data);

        // Show success UI
        registerContainer.style.display = 'none';
        successBlock.style.display = 'block';

        // Show API key
        if (data.apiKey) {
            apiKeyBox.textContent = data.apiKey;
        } else {
            apiKeyBox.textContent = "No API key returned.";
        }

        // Copy button functionality
        copyButton.onclick = () => {
            navigator.clipboard.writeText(apiKeyBox.textContent)
                .then(() => {
                    copyButton.textContent = "Copied!";
                    setTimeout(() => copyButton.textContent = "Copy", 1500);
                });
        };

        // Go to login after success
        goToLoginButton.onclick = () => {
            window.location.href = 'login.html';
        };

    } catch (error) {
        console.error('handleRegister Error:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message;
        }
    }
}


async function handleLogin(event) {
    event.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');

    try {
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include' 
        });

        console.log('Login Response:', response);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Login failed response text:', errorText);
            throw new Error(errorText || MESSAGES.loginFailed);
        }

        checkAuthAndRedirect();

    } catch (error) {
        console.error('handleLogin Error:', error);
        errorDiv.textContent = error.message;
    }
}


async function checkAuthAndRedirect() {
    if (window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('/register.html')) {
        return; 
    }

    try {
        const response = await fetch(`${baseUrl}/auth/me`, {
            credentials: 'include' 
        });

        console.log('Auth/me Response:', response);

        if (!response.ok) {
            window.location.href = 'login.html';
            throw new Error('Not authenticated');
        }

        const userData = await response.json();
        console.log('Auth/me User Data:', userData);

        // 👉 start background refresh now that we know we are authenticated
        startTokenRefreshLoop();

        if (userData.isadministrator) {
            if (!window.location.pathname.endsWith('/admin.html')) {
                window.location.href = 'admin.html'; 
            }
        } else {
            if (!window.location.pathname.endsWith('/index.html')) {
                window.location.href = 'index.html'; 
            }
        }

    } catch (error) {
        console.error('Auth check failed:', error.message);
        window.location.href = 'login.html';
    }
}


async function logout() {
    try {
        await fetch(`${baseUrl}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        console.error('Logout failed (ignored):', e);
    }

    // 👉 stop background refresh so we’re not pinging for a logged-out user
    stopTokenRefreshLoop();

    window.location.href = 'login.html';
}


document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('/index.html')) {
        checkAuthAndRedirect();
    }
    
    const logoutBtn = document.getElementById('logoutButton');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

async function fetchUsers() {
    const errorDiv = document.getElementById('error-message');
    const resultBox = document.getElementById('user-list-result');
    errorDiv.textContent = '';
    resultBox.textContent = 'Fetching...';

    try {
        const response = await fetch(`${baseUrl}/admin/users`, {
            credentials: 'include' 
        });

        console.log('Fetch Users Response:', response);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch users.');
        }

        const users = await response.json();
        
        resultBox.textContent = JSON.stringify(users, null, 2);

    } catch (error) {
        console.error('fetchUsers Error:', error);
        errorDiv.textContent = error.message;
        resultBox.textContent = 'Could not fetch users.';
    }
}

// ---- Refresh token helpers ----

/**
 * Holds the interval ID for the background refresh loop.
 * @type {number | null}
 */
let refreshIntervalId = null;

/**
 * Calls the backend refresh endpoint to get a new access token using the refresh token cookie.
 * Assumes the server sets new cookies when this endpoint is hit.
 * Adjust the method/path if your backend uses something else.
 *
 * @returns {Promise<void>}
 */
async function refreshAccessToken() {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',          // change to 'GET' if your backend expects GET
        credentials: 'include',  // send cookies
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Refresh token failed:', res.status, text);
        throw new Error('Failed to refresh session.');
    }
}

/**
 * Starts a periodic background token refresh loop.
 * Only starts once; calling multiple times is safe.
 * You can tweak the interval (e.g. 10–15 minutes) depending on your access token TTL.
 */
function startTokenRefreshLoop() {
    // Don't start on login/register pages
    const path = window.location.pathname;
    if (path.endsWith('/login.html') || path.endsWith('/register.html')) {
        return;
    }

    if (refreshIntervalId !== null) {
        return; // already running
    }

    const TEN_MINUTES = 10 * 60 * 1000;

    refreshIntervalId = window.setInterval(() => {
        refreshAccessToken().catch((err) => {
            // If refresh fails, we just log; the next authenticated call
            // will likely trigger a redirect to login via your existing logic.
            console.warn('Background token refresh failed:', err);
        });
    }, TEN_MINUTES);
}

/**
 * Stops the background refresh loop (e.g. on logout).
 */
function stopTokenRefreshLoop() {
    if (refreshIntervalId !== null) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
}
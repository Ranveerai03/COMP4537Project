/** =========================
 *  CONFIGURATION
 *  =========================
 */

/** Base URL for the backend API. */
const baseUrl = 'https://assignments.isaaclauzon.com:8443/v1';

/** =========================
 *  AUTH HANDLERS (LOGIN / REGISTER / LOGOUT)
 *  =========================
 */

/**
 * Handles user registration form submission.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>}
 */
async function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    /** @type {HTMLElement | null} */
    const errorDiv = document.getElementById('error-message');
    /** @type {HTMLElement | null} */
    const registerContainer = document.getElementById('register-container');
    /** @type {HTMLElement | null} */
    const successBlock = document.getElementById('register-success');
    /** @type {HTMLElement | null} */
    const apiKeyBox = document.getElementById('apikey-box');
    /** @type {HTMLButtonElement | null} */
    const copyButton = document.getElementById('copy-apikey');
    /** @type {HTMLButtonElement | null} */
    const goToLoginButton = document.getElementById('go-to-login');

    if (errorDiv) {
        errorDiv.textContent = '';
    }

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

        if (data.apiKey) {
            localStorage.setItem('apiKey', data.apiKey);
        }

        if (registerContainer) registerContainer.style.display = 'none';
        if (successBlock) successBlock.style.display = 'block';

        if (apiKeyBox) {
            apiKeyBox.textContent = data.apiKey || 'No API key returned.';
        }

        if (copyButton && apiKeyBox) {
            copyButton.onclick = () => {
                navigator.clipboard.writeText(apiKeyBox.textContent || '')
                    .then(() => {
                        copyButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyButton.textContent = 'Copy';
                        }, 1500);
                    });
            };
        }

        if (goToLoginButton) {
            goToLoginButton.onclick = () => {
                window.location.href = 'login.html';
            };
        }

    } catch (error) {
        console.error('handleRegister Error:', error);
        if (errorDiv) {
            errorDiv.textContent = /** @type {Error} */(error).message;
        }
    }
}

/**
 * Handles user login form submission.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>}
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    /** @type {HTMLElement | null} */
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

        await checkAuthAndRedirect({ allowOnAuthPage: true });

    } catch (error) {
        console.error('handleLogin Error:', error);
        if (errorDiv) {
            errorDiv.textContent = /** @type {Error} */(error).message;
        }
    }
}

/**
 * Logs the current user out and redirects to the login page.
 *
 * @returns {Promise<void>}
 */
async function logout() {
    try {
        await fetch(`${baseUrl}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        console.error('Logout failed (ignored):', e);
    }

    stopTokenRefreshLoop();
    window.location.href = 'login.html';
}

/** =========================
 *  AUTH STATE / REDIRECT
 *  =========================
 */

/**
 * Checks whether the user is authenticated and redirects to the
 * appropriate page (admin or index) based on their role.
 *
 * @param {{ allowOnAuthPage?: boolean }} [options]
 * @param {boolean} [options.allowOnAuthPage=false] - If true, runs even on login/register pages.
 * @returns {Promise<void>}
 */
async function checkAuthAndRedirect(options = {}) {
    const { allowOnAuthPage = false } = options;
    const path = window.location.pathname;

    if (!allowOnAuthPage && (path.endsWith('/login.html') || path.endsWith('/register.html'))) {
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

        startTokenRefreshLoop();

        if (userData.isadministrator) {
            if (!path.endsWith('/admin.html')) {
                window.location.href = 'admin.html';
            }
        } else {
            if (!path.endsWith('/index.html')) {
                window.location.href = 'index.html';
            }
        }

    } catch (error) {
        console.error('Auth check failed:', /** @type {Error} */(error).message);
        window.location.href = 'login.html';
    }
}

/** =========================
 *  ADMIN HELPERS
 *  =========================
 */

/**
 * Fetches the list of users for admin display and renders it
 * into the #user-list-result element.
 *
 * @returns {Promise<void>}
 */
async function fetchUsers() {
    /** @type {HTMLElement | null} */
    const errorDiv = document.getElementById('error-message');
    /** @type {HTMLElement | null} */
    const resultBox = document.getElementById('user-list-result');

    if (errorDiv) errorDiv.textContent = '';
    if (resultBox) resultBox.textContent = 'Fetching...';

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

        if (resultBox) {
            resultBox.textContent = JSON.stringify(users, null, 2);
        }

    } catch (error) {
        console.error('fetchUsers Error:', error);
        if (errorDiv) errorDiv.textContent = /** @type {Error} */(error).message;
        if (resultBox) resultBox.textContent = 'Could not fetch users.';
    }
}

/** =========================
 *  REFRESH TOKEN SUPPORT
 *  =========================
 */

/**
 * Interval ID for the background token refresh loop.
 * @type {number | null}
 */
let refreshIntervalId = null;

/**
 * Calls the backend refresh endpoint to obtain a new access token
 * using the refresh token cookie.
 *
 * @returns {Promise<void>}
 */
async function refreshAccessToken() {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Refresh token failed:', res.status, text);
        throw new Error('Failed to refresh session.');
    }
}

/**
 * Starts a periodic background token refresh loop.
 * Does nothing if already running or on auth pages.
 */
function startTokenRefreshLoop() {
    const path = window.location.pathname;
    if (path.endsWith('/login.html') || path.endsWith('/register.html')) {
        return;
    }

    if (refreshIntervalId !== null) {
        return;
    }

    const TEN_MINUTES = 10 * 60 * 1000;

    refreshIntervalId = window.setInterval(() => {
        refreshAccessToken().catch((err) => {
            console.warn('Background token refresh failed:', err);
        });
    }, TEN_MINUTES);
}

/**
 * Stops the background refresh loop.
 */
function stopTokenRefreshLoop() {
    if (refreshIntervalId !== null) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
}

/** =========================
 *  DOM TEXT INJECTION
 *  =========================
 */

/**
 * Injects localized UI text into the login page from UI_TEXT.login.
 */
function initLoginPageText() {
    if (!window.UI_TEXT || !UI_TEXT.login) return;
    const t = UI_TEXT.login;

    const titleEl = document.getElementById('login-title');
    const emailLabelEl = document.getElementById('login-email-label');
    const passwordLabelEl = document.getElementById('login-password-label');
    const buttonEl = document.getElementById('login-button-text');
    const noAccountEl = document.getElementById('login-no-account-text');
    const registerLinkEl = document.getElementById('login-register-link-text');

    if (titleEl) titleEl.textContent = t.title;
    if (emailLabelEl) emailLabelEl.textContent = t.emailLabel;
    if (passwordLabelEl) passwordLabelEl.textContent = t.passwordLabel;
    if (buttonEl) buttonEl.textContent = t.button;
    if (noAccountEl) noAccountEl.textContent = t.noAccountText;
    if (registerLinkEl) registerLinkEl.textContent = t.registerLink;
}

/**
 * Injects localized UI text into the register page from UI_TEXT.register.
 */
function initRegisterPageText() {
    if (!window.UI_TEXT || !UI_TEXT.register) return;
    const t = UI_TEXT.register;

    const titleEl = document.getElementById('register-title');
    const emailLabelEl = document.getElementById('register-email-label');
    const passwordLabelEl = document.getElementById('register-password-label');
    const buttonEl = document.getElementById('register-button-text');
    const haveAccountEl = document.getElementById('register-have-account-text');
    const loginLinkEl = document.getElementById('register-login-link-text');
    const successMsgEl = document.getElementById('register-success-message');
    const apiWarningEl = document.getElementById('register-api-warning-text');
    const copyBtn = document.getElementById('copy-apikey');
    const goToLoginBtn = document.getElementById('go-to-login');

    if (titleEl) titleEl.textContent = t.title;
    if (emailLabelEl) emailLabelEl.textContent = t.emailLabel;
    if (passwordLabelEl) passwordLabelEl.textContent = t.passwordLabel;
    if (buttonEl) buttonEl.textContent = t.button;
    if (haveAccountEl) haveAccountEl.textContent = t.haveAccount;
    if (loginLinkEl) loginLinkEl.textContent = t.loginLink;
    if (successMsgEl) successMsgEl.textContent = t.success;
    if (apiWarningEl) apiWarningEl.textContent = t.apiWarning;
    if (copyBtn) copyBtn.textContent = t.copyButton;
    if (goToLoginBtn) goToLoginBtn.textContent = t.goToLogin;
}

/**
 * Global initializer:
 *  - Injects UI text for login/register pages
 *  - Wires up form handlers
 *  - Enforces auth on the index page
 *  - Wires up logout button
 */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith('/login.html')) {
        initLoginPageText();
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    } else if (path.endsWith('/register.html')) {
        initRegisterPageText();
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
    } else if (path.endsWith('/index.html')) {
        checkAuthAndRedirect();
    }

    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
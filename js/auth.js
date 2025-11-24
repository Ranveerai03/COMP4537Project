const baseUrl = 'https://assignments.isaaclauzon.com:8443/v1';


async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');

    errorDiv.textContent = '';
    successDiv.textContent = '';

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

        successDiv.textContent = MESSAGES.registrationSuccess;
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('handleRegister Error:', error);
        errorDiv.textContent = error.message;
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
            throw new Error('Not authenticated');
        }

        const userData = await response.json();
        console.log('Auth/me User Data:', userData);

        if (userData.isadministrator) {
            if (!window.location.pathname.endsWith('/admin.html')) {
                window.location.href = 'admin.html'; 
            }
        } else {

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
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout failed, but logging out client-side anyway', error);
    }
    
    localStorage.removeItem('apiKey');
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
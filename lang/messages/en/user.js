window.MESSAGES = {
    loginFailed: 'Login failed. Please check your credentials.',
    registrationFailed: 'Registration failed.',
    registrationSuccess: 'Registration successful!',
};

window.UI_TEXT = {
    login: {
        title: 'Login',
        emailLabel: 'Email:',
        passwordLabel: 'Password:',
        button: 'Login',
        noAccountText: "Don't have an account?",
        registerLink: 'Register here',
    },
    register: {
        title: 'Register',
        emailLabel: 'Email:',
        passwordLabel: 'Password:',
        button: 'Register',
        haveAccount: 'Already have an account?',
        loginLink: 'Login here',
        success: 'Registered successfully!',
        apiWarning: 'Please store your API key safely. You will not be shown this again.',
        copyButton: 'Copy',
        goToLogin: 'Go to Login',
    },
    index: {
        headerTitle: 'Chat Bot',
        logoutButton: 'Logout',
        chatTab: 'Chat',
        savedPromptsTab: 'Saved Prompts',
        apiKeyLabel: 'API Key',
        apiKeyPlaceholder: 'Enter your API key to use the chatbot',
        chatPlaceholder: 'Chatbot responses will appear here...',
        chatInputPlaceholder: 'Ask the chatbot something...',
        sendButton: 'Send',
        savedPromptsHeader: 'Saved Prompts',
        refreshButton: 'Refresh',
        promptsEmpty: 'No saved prompts yet.',
    },
    admin: {
        title: "Admin Dashboard",
        logoutButton: "Logout",

        endpointStatsTitle: "API Endpoint Stats",
        endpointStatsSubtitle: "Number of requests served by each API endpoint.",
        endpointMethod: "Method",
        endpointPath: "Endpoint",
        endpointRequests: "Requests",
        endpointLoading: "Loading endpoint stats...",

        userStatsTitle: "User API Consumption",
        userStatsSubtitle: "Total API usage per user (all endpoints combined).",
        userEmail: "Email",
        userTotalRequests: "Total Requests",
        userStatsLoading: "Loading user API stats...",

        allUsersTitle: "All Users",
        allUsersSubtitle: "List of all registered users and their request counts. Admins are underlined.",
        allUsersEmail: "Email",
        allUsersRequestCount: "LLM Request Count",
        allUsersLoading: `Click "Refresh Users" to load user list.`,
    }
};
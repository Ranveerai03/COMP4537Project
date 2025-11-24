/** =========================
 *  CONFIGURATION
 *  =========================
 */

/**
 * Base URL for the LLM chat service.
 * The endpoint used is: `${LLM_BASE_URL}/api/ask`
 */
const LLM_BASE_URL = 'https://assignments.isaaclauzon.com:8443/v1';

/**
 * Full chat endpoint for asking the LLM.
 */
const CHAT_ENDPOINT = `${LLM_BASE_URL}/api/ask`;

/** =========================
 *  ERROR HANDLING HELPERS
 *  =========================
 */

/**
 * Returns the DOM element used to display error messages on the chat page.
 * @returns {HTMLElement | null} The error message div, or null if not found.
 */
const getErrorDiv = () => document.getElementById('error-message');

/**
 * Displays an error message in the error box.
 * Clears the message if msg is falsy.
 * @param {string} msg - The error message to display.
 */
const showError = (msg) => {
  const errorDiv = getErrorDiv();
  if (errorDiv) {
    errorDiv.textContent = msg || '';
  }
};

/** =========================
 *  CHAT MESSAGE RENDERING
 *  =========================
 */

/**
 * Appends a new chat message bubble to the chat window.
 * Also removes the initial placeholder message if present.
 *
 * @param {string} text - The message text to display.
 * @param {'user' | 'bot' | 'warning'} type - The type of message, used for styling.
 * @returns {HTMLDivElement | null} The created message element, or null if chat window not found.
 */
const appendMessage = (text, type) => {
  const chatWindow = document.getElementById('chat-window');
  if (!chatWindow) return null;

  const placeholder = document.getElementById('chat-response');
  if (placeholder) {
    placeholder.remove();
  }

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', type);
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);

  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msgDiv;
};

/** =========================
 *  API KEY HANDLING
 *  =========================
 */

/**
 * Prefills the API key input field with the value stored in localStorage (if any).
 * This allows the user to register once, then automatically reuse their key.
 */
const initApiKeyField = () => {
  const apiKeyInput = document.getElementById('apikey-input');
  if (!apiKeyInput) return;

  const storedKey = localStorage.getItem('apiKey');
  if (storedKey) {
    apiKeyInput.value = storedKey;
  }
};

/** =========================
 *  CHAT SEND LOGIC
 *  =========================
 */

/**
 * Sends the current chat message to the LLM API and displays the response.
 * - Validates that an API key and message are present
 * - Adds a "user" message bubble
 * - Shows a temporary "Thinking..." bot bubble, then replaces it with the answer
 * - If a warning is returned, shows it as a red warning bubble
 *
 * @returns {Promise<void>} A Promise that resolves when the request is complete.
 */
const sendChat = async () => {
  showError('');

  const apiKeyInput = document.getElementById('apikey-input');
  const input = document.getElementById('chat-input');
  const chatWindow = document.getElementById('chat-window');

  if (!apiKeyInput || !input || !chatWindow) return;

  const apiKey = apiKeyInput.value.trim();
  const message = input.value.trim();

  // Require API key before sending
  if (!apiKey) {
    showError('Please enter your API key before sending a message.');
    apiKeyInput.focus();
    return;
  }

  // Require message
  if (!message) {
    showError('Please enter a message.');
    input.focus();
    return;
  }

  // Show user message immediately
  const userBubble = appendMessage(message, 'user');
  input.value = '';

  // Attach "Save prompt" control under the user bubble (if helper is available)
  if (userBubble && typeof createSavePromptControl === 'function') {
    createSavePromptControl(userBubble, message);
  }

  // Create a temporary "Thinking..." bot message
  const thinkingBubble = document.createElement('div');
  thinkingBubble.classList.add('message', 'bot');
  thinkingBubble.textContent = 'Thinking...';
  chatWindow.appendChild(thinkingBubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const payload = {
      prompt: message,
      max_tokens: 50, // adjust if needed
    };

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat error response text:', errorText);
      throw new Error(`API error! Status: ${response.status}`);
    }

    // Parse JSON response from server
    const data = await response.json();
    console.log('Chatbot success data:', data);

    // Main response bubble (replace "Thinking...")
    const mainText =
      data.response ||
      data.answer ||
      data.reply ||
      data.message ||
      JSON.stringify(data);

    thinkingBubble.textContent = mainText;

    // Optional warning bubble (red)
    if (data.warning) {
      appendMessage(data.warning, 'warning');
    }
  } catch (err) {
    console.error('sendChat error:', err);
    thinkingBubble.textContent = `Error: ${err.message}`;
    showError(err.message || 'An error occurred while sending your message.');
  }
};

/** =========================
 *  CHAT PAGE INITIALIZATION
 *  =========================
 */

/**
 * Initializes the chat page:
 * - Prefills the API key from localStorage
 * - Wires up the Send button
 * - Allows Enter (without Shift) to send the message
 */
const initChatPage = () => {
  initApiKeyField();

  const sendButton = document.getElementById('chat-submit');
  const input = document.getElementById('chat-input');

  if (sendButton) {
    sendButton.addEventListener('click', () => {
      void sendChat();
    });
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendChat();
      }
    });
  }
};

/**
 * Initialize chat page once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initChatPage();
});

/** =========================
 *  DOM TEXT INJECTION
 *  =========================
 */

/**
 * Injects localized UI text into the index/chat page from UI_TEXT.index.
 */
function initIndexPageText() {
    if (!window.UI_TEXT || !UI_TEXT.index) return;
    const t = UI_TEXT.index;

    /** @type {Record<string, string>} */
    const map = {
        'index-header-title': t.headerTitle,
        'logoutButton': t.logoutButton,
        'tab-chat-btn': t.chatTab,
        'tab-prompts-btn': t.savedPromptsTab,
        'apikey-label': t.apiKeyLabel,
        'chat-response': t.chatPlaceholder,
        'chat-submit': t.sendButton,
        'prompts-header-title': t.savedPromptsHeader,
        'refresh-prompts': t.refreshButton,
        'prompts-empty': t.promptsEmpty,
    };

    Object.keys(map).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = map[id];
    });

    // Placeholders need to be set via attributes/properties
    const apiKeyInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('apikey-input')
    );
    const chatInput = /** @type {HTMLTextAreaElement | null} */ (
        document.getElementById('chat-input')
    );

    if (apiKeyInput) {
        apiKeyInput.placeholder = t.apiKeyPlaceholder;
    }
    if (chatInput) {
        chatInput.placeholder = t.chatInputPlaceholder;
    }
}

/**
 * Global initializer for all pages:
 *  - Injects UI text for login / register / index
 *  - Wires up auth form handlers
 *  - Enforces auth on index
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
        initIndexPageText();
        checkAuthAndRedirect();
    }

    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
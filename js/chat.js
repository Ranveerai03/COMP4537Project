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
 *  ERROR & UI HELPERS
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
 *  USAGE / PROFILE DATA
 *  =========================
 */

/**
 * Loads the current user's API usage count from /auth/me
 * and displays it in the #usage-count element on the chat page.
 *
 * Expects /auth/me to return a JSON object with a `requestcount` field.
 *
 * @returns {Promise<void>}
 */
const loadUserUsage = async () => {
  const usageCountEl = document.getElementById('usage-count');
  if (!usageCountEl) return;

  // Prefer global baseUrl from auth.js if available, otherwise fall back to LLM_BASE_URL
  const apiBase =
    typeof baseUrl === 'string' && baseUrl.length > 0 ? baseUrl : LLM_BASE_URL;

  try {
    const res = await fetch(`${apiBase}/auth/me`, {
      credentials: 'include',
    });

    if (!res.ok) {
      usageCountEl.textContent = 'Unavailable';
      return;
    }

    const data = await res.json();
    usageCountEl.textContent =
      data.requestcount != null ? String(data.requestcount) : '0';
  } catch (err) {
    console.error('Failed to load usage:', err);
    usageCountEl.textContent = 'Unavailable';
  }
};

/** =========================
 *  CHAT SEND / LLM CALL
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

    // Main response bubble
    const mainText =
      data.response ||
      data.answer ||
      data.reply ||
      data.message ||
      JSON.stringify(data);

    thinkingBubble.textContent = mainText;

    if (data.warning) {
      appendMessage(data.warning, 'warning');
    }

    await loadUserUsage();

  } catch (err) {
    console.error('sendChat error:', err);
    thinkingBubble.textContent = `Error: ${err.message}`;
    showError(err.message || 'An error occurred while sending your message.');
  }
};

/** =========================
 *  CHAT PAGE INIT
 *  =========================
 */

/**
 * Initializes the chat page:
 * - Prefills the API key from localStorage
 * - Loads and displays the user API usage
 * - Wires up the Send button
 * - Allows Enter (without Shift) to send the message
 */
const initChatPage = () => {
  initApiKeyField();
  void loadUserUsage();

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

// Basic chat behavior init
document.addEventListener('DOMContentLoaded', () => {
  initChatPage();
});

/** =========================
 *  TEXT INJECTION (i18n)
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
    logoutButton: t.logoutButton,
    'tab-chat-btn': t.chatTab,
    'tab-prompts-btn': t.savedPromptsTab,
    'apikey-label': t.apiKeyLabel,
    'chat-response': t.chatPlaceholder,
    'chat-submit': t.sendButton,
    'prompts-header-title': t.savedPromptsHeader,
    'refresh-prompts': t.refreshButton,
    'prompts-empty': t.promptsEmpty,
    'usage-label': t.usageLabel,
  };

  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = map[id];
  });

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

/** =========================
 *  ROUTE-BASED INIT / AUTH
 *  =========================
 */

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.endsWith('/index.html')) {
    initIndexPageText();
    if (typeof checkAuthAndRedirect === 'function') {
      checkAuthAndRedirect();
    }
  }

  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn && typeof logout === 'function') {
    logoutBtn.addEventListener('click', logout);
  }
});
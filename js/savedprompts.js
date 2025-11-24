// js/savedprompts.js

/**
 * Holds the current authenticated user's ID, fetched from /auth/me.
 * @type {number | string | null}
 */
let currentUserId = null;

/**
 * Fetches the current user from /auth/me if not already loaded.
 * @returns {Promise<number|string>} The user ID.
 */
const getCurrentUserId = async () => {
  if (currentUserId != null) {
    return currentUserId;
  }

  const response = await fetch(`${baseUrl}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to load current user.');
  }

  const userData = await response.json();
  // Assuming the backend returns an "id" field for the user:
  currentUserId = userData.id;
  return currentUserId;
};

/**
 * Creates a "Save prompt" button directly under a given user message bubble.
 * When clicked, it sends a POST to /prompts/{userId}.
 *
 * @param {HTMLElement} messageElement - The user message bubble element.
 * @param {string} promptText - The text of the user's prompt to save.
 */
const createSavePromptControl = (messageElement, promptText) => {
  if (!messageElement || !promptText) return;

  if (messageElement.dataset.hasSaveControl === 'true') {
    return; // avoid duplicates
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Save prompt';
  btn.classList.add('save-prompt-button');

  btn.addEventListener('click', async () => {
    try {
      const userId = await getCurrentUserId();
      const defaultTitle = promptText.length > 40 ? promptText.slice(0, 40) + '…' : promptText;
      const title = window.prompt('Enter a title for this prompt:', defaultTitle || 'New Prompt');
      if (!title) {
        return; // user cancelled
      }
      await savePromptToServer(userId, title, promptText);
      alert('Prompt saved.');
      // If prompts tab is visible, refresh it
      await loadAndRenderPrompts();
    } catch (err) {
      console.error('Failed to save prompt:', err);
      alert(`Failed to save prompt: ${err.message}`);
    }
  });

  messageElement.insertAdjacentElement('afterend', btn);
  messageElement.dataset.hasSaveControl = 'true';
};

/**
 * Sends a POST request to save a new prompt.
 *
 * @param {number|string} userId - The user ID.
 * @param {string} title - The prompt title.
 * @param {string} promptText - The prompt text.
 * @returns {Promise<void>}
 */
const savePromptToServer = async (userId, title, promptText) => {
  const response = await fetch(`${baseUrl}/prompts/${userId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      prompt: promptText,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Save prompt error:', errorText);
    throw new Error('Failed to save prompt.');
  }
};

/**
 * Loads all prompts via GET /prompts.
 * @returns {Promise<Array>} The list of prompts.
 */
const fetchPrompts = async () => {
  const response = await fetch(`${baseUrl}/prompts`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Fetch prompts error:', errorText);
    throw new Error('Failed to load prompts.');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

/**
 * Helper to get a prompt's ID as an integer, supporting both "id" and "promptId" fields.
 * @param {any} prompt
 * @returns {number|null}
 */
const getPromptId = (prompt) => {
  if (!prompt) return null;

  const raw =
    prompt.id ??
    prompt.promptId ??
    prompt.promptid ??
    prompt.PromptId ?? // just in case your backend uses this casing
    null;

  if (raw == null) return null;

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return null;

  return parsed;
};

/**
 * Renders the list of prompts into the #prompts-list container.
 *
 * @param {Array} prompts - The list of prompt objects.
 */
const renderPrompts = (prompts) => {
  const listEl = document.getElementById('prompts-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (!prompts.length) {
    const empty = document.createElement('p');
    empty.classList.add('prompts-empty');
    empty.textContent = 'No saved prompts yet.';
    listEl.appendChild(empty);
    return;
  }

  prompts.forEach((prompt) => {
    const id = getPromptId(prompt);
    const card = document.createElement('div');
    card.classList.add('prompt-card');
    card.dataset.promptId = id;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.classList.add('prompt-title-input');
    titleInput.value = prompt.title ?? '';
    titleInput.disabled = true;

    const textInput = document.createElement('textarea');
    textInput.classList.add('prompt-text-input');
    textInput.value = prompt.prompt ?? '';
    textInput.disabled = true;

const actions = document.createElement('div');
actions.classList.add('prompt-actions');

const editBtn = document.createElement('button');
editBtn.type = 'button';
editBtn.textContent = 'Edit';
editBtn.classList.add('prompt-edit');

/** Initially hidden, only shown while editing */
const saveBtn = document.createElement('button');
saveBtn.type = 'button';
saveBtn.textContent = 'Save';
saveBtn.classList.add('prompt-save');
saveBtn.style.display = 'none';

/** Initially hidden, only shown while editing */
const cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.textContent = 'Cancel';
cancelBtn.classList.add('prompt-cancel');
cancelBtn.style.display = 'none';

const deleteBtn = document.createElement('button');
deleteBtn.type = 'button';
deleteBtn.textContent = 'Delete';
deleteBtn.classList.add('prompt-delete');

actions.appendChild(editBtn);
actions.appendChild(saveBtn);
actions.appendChild(cancelBtn);
actions.appendChild(deleteBtn);

card.appendChild(titleInput);
card.appendChild(textInput);
card.appendChild(actions);

// Store original values for Cancel
card.dataset.originalTitle = titleInput.value;
card.dataset.originalPrompt = textInput.value;

    card.appendChild(titleInput);
    card.appendChild(textInput);
    card.appendChild(actions);

    listEl.appendChild(card);
  });
};

/**
 * Loads prompts from the server and renders them.
 */
const loadAndRenderPrompts = async () => {
  const errorEl = document.getElementById('prompts-error');
  if (errorEl) errorEl.textContent = '';

  try {
    const prompts = await fetchPrompts();
    renderPrompts(prompts);
  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = err.message || 'Failed to load prompts.';
    }
  }
};

/**
 * Sends an updated prompt via PUT /prompts/{userId}/{promptId}.
 *
 * @param {number|string} userId
 * @param {number|string} promptId
 * @param {string} title
 * @param {string} promptText
 * @returns {Promise<void>}
 */
const updatePromptOnServer = async (userId, promptId, title, promptText) => {
  const response = await fetch(`${baseUrl}/prompts/${userId}/${promptId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      prompt: promptText,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update prompt error:', errorText);
    throw new Error('Failed to update prompt.');
  }
};

/**
 * Deletes a prompt via DELETE /prompts/{userId}/{promptId}.
 *
 * @param {number|string} userId
 * @param {number|string} promptId
 * @returns {Promise<void>}
 */
const deletePromptOnServer = async (userId, promptId) => {
  const response = await fetch(`${baseUrl}/prompts/${userId}/${promptId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete prompt error:', errorText);
    throw new Error('Failed to delete prompt.');
  }
};

/**
 * Initializes tab switching between Chat and Saved Prompts.
 * Also wires up refresh and prompt card actions.
 */
const initSavedPromptsTab = () => {
  const chatTabBtn = document.getElementById('tab-chat-btn');
  const promptsTabBtn = document.getElementById('tab-prompts-btn');
  const chatPanel = document.getElementById('tab-chat');
  const promptsPanel = document.getElementById('tab-prompts');
  const refreshBtn = document.getElementById('refresh-prompts');
  const promptsList = document.getElementById('prompts-list');

  if (!chatTabBtn || !promptsTabBtn || !chatPanel || !promptsPanel) {
    return;
  }

  /**
   * Switches visible tab.
   * @param {'chat'|'prompts'} tabName
   */
  const switchTab = (tabName) => {
    const isChat = tabName === 'chat';

    chatTabBtn.classList.toggle('active', isChat);
    promptsTabBtn.classList.toggle('active', !isChat);

    chatPanel.classList.toggle('active', isChat);
    promptsPanel.classList.toggle('active', !isChat);

    if (!isChat) {
      // When switching to prompts tab, load prompts
      void loadAndRenderPrompts();
    }
  };

  chatTabBtn.addEventListener('click', () => switchTab('chat'));
  promptsTabBtn.addEventListener('click', () => switchTab('prompts'));

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      void loadAndRenderPrompts();
    });
  }

  // Delegate actions on prompt cards (edit / save / delete)
  if (promptsList) {
    promptsList.addEventListener('click', async (e) => {
  const target = /** @type {HTMLElement} */ (e.target);
  const card = target.closest('.prompt-card');
  if (!card) return;

  const promptId = card.dataset.promptId;
  if (!promptId) return;

  const titleInput = card.querySelector('.prompt-title-input');
  const textInput = card.querySelector('.prompt-text-input');
  const editBtn = card.querySelector('.prompt-edit');
  const saveBtn = card.querySelector('.prompt-save');
  const cancelBtn = card.querySelector('.prompt-cancel');

  if (!titleInput || !textInput || !editBtn || !saveBtn || !cancelBtn) return;

  // EDIT
  if (target.classList.contains('prompt-edit')) {
    // Enable editing
    titleInput.disabled = false;
    textInput.disabled = false;

    // Show Save + Cancel, hide Edit
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    editBtn.style.display = 'none';

    // Store current values in case user cancels
    card.dataset.originalTitle = titleInput.value;
    card.dataset.originalPrompt = textInput.value;

    titleInput.focus();
    return;
  }

  // SAVE
  if (target.classList.contains('prompt-save')) {
    try {
      const userId = await getCurrentUserId();
      await updatePromptOnServer(
        userId,
        promptId,
        titleInput.value.trim(),
        textInput.value.trim()
      );

      // Disable editing again
      titleInput.disabled = true;
      textInput.disabled = true;

      // Update "original" values to the new ones
      card.dataset.originalTitle = titleInput.value;
      card.dataset.originalPrompt = textInput.value;

      // Hide Save/Cancel, show Edit
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      editBtn.style.display = 'inline-block';

      alert('Prompt updated.');
    } catch (err) {
      console.error(err);
      alert(`Failed to update prompt: ${err.message}`);
    }
    return;
  }

  // CANCEL
  if (target.classList.contains('prompt-cancel')) {
    // Revert fields to original values
    titleInput.value = card.dataset.originalTitle || '';
    textInput.value = card.dataset.originalPrompt || '';

    titleInput.disabled = true;
    textInput.disabled = true;

    // Hide Save/Cancel, show Edit
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    editBtn.style.display = 'inline-block';

    return;
  }

  // DELETE
  if (target.classList.contains('prompt-delete')) {
    const confirmed = window.confirm('Delete this prompt?');
    if (!confirmed) return;

    try {
      const userId = await getCurrentUserId();
      await deletePromptOnServer(userId, promptId);
      card.remove();

      if (!promptsList.children.length) {
        const empty = document.createElement('p');
        empty.classList.add('prompts-empty');
        empty.textContent = 'No saved prompts yet.';
        promptsList.appendChild(empty);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to delete prompt: ${err.message}`);
    }
  }
});
  }
};

// Initialize Saved Prompts tab when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSavedPromptsTab();
});
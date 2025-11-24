// js/landing.js

const baseUrl = 'https://assignments.isaaclauzon.com:8443/v1';

(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('ask-form');
  const input = document.getElementById('prompt');
  const logout = document.getElementById('logout');

  (async () => {
    try { await fetch(`${baseUrl}/auth/me`, { credentials: 'include' }).then(r => { if(!r.ok) throw 0; }); }
    catch { location.href = '/'; }
  })();

  logout.onclick = async () => {
    await fetch(`${baseUrl}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>{});
    location.href = '/';
  };

  const CHAT_BASE = 'https://ai.ranveerrai.ca/generate';
  const CHAT_TOKEN = '3a7f8c9e2b1d4a6f5e8c9a2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2';

  function addLine(who, text) {
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = `${who === 'user' ? 'You' : 'Bot'}: ${text}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) return;
    addLine('user', prompt);
    input.value = '';

    try {
      const url = `${CHAT_BASE}?prompt=${encodeURIComponent(prompt)}&max_tokens=50`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CHAT_TOKEN}` },
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const txt = await res.text();
      addLine('bot', txt);
    } catch (err) {
      addLine('bot', `Error: ${err.message}`);
    }
  });
})();

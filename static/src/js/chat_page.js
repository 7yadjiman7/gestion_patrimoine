(function () {
  const ODOO_WS_URL = `ws://${window.location.host}/websocket`;
  let socket;
  let conversations = [];
  let activeConversation = null;
  const subscribed = new Set();

  async function fetchJson(url, opts = {}) {
    const resp = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    return resp.json();
  }

  async function loadConversations() {
    conversations = await fetchJson('/api/chat/conversations');
    const container = document.getElementById('gp-conversation-items');
    container.innerHTML = '';
    conversations.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'conv-item' + (activeConversation && activeConversation.id === c.id ? ' active' : '');
      div.textContent = c.name;
      div.onclick = () => selectConversation(c);
      container.appendChild(div);
    });
  }

  async function selectConversation(conv) {
    activeConversation = conv;
    await loadMessages();
    loadConversations();
  }

  async function loadMessages() {
    if (!activeConversation) return;
    const res = await fetchJson(`/api/chat/conversations/${activeConversation.id}/messages`);
    const list = document.getElementById('gp-message-list');
    list.innerHTML = '';
    const msgs = res.data || [];
    msgs.forEach((m) => {
      const wrap = document.createElement('div');
      wrap.className = 'msg';
      const author = document.createElement('span');
      author.className = 'msg-author';
      author.textContent = m.author_name;
      const content = document.createElement('span');
      content.textContent = m.content;
      wrap.appendChild(author);
      wrap.appendChild(document.createElement('br'));
      wrap.appendChild(content);
      list.appendChild(wrap);
    });
    list.scrollTop = list.scrollHeight;
  }

  async function sendCurrent() {
    const input = document.getElementById('gp-message-input');
    const text = input.value.trim();
    if (!text || !activeConversation) return;
    await fetchJson(`/api/chat/conversations/${activeConversation.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: text }),
    });
    input.value = '';
    await loadMessages();
  }

  function connectWebSocket() {
    if (socket) return;
    socket = new WebSocket(ODOO_WS_URL);
    socket.onopen = () => {
      conversations.forEach((c) => subscribe(`chat_channel_${c.id}`));
    };
    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'new_message' && data.payload) {
          const msg = data.payload;
          if (activeConversation && msg.conversation_id === activeConversation.id) {
            loadMessages();
          }
        }
      } catch (e) {
        console.error('ws message', e);
      }
    };
  }

  function subscribe(channel) {
    if (!socket || socket.readyState !== WebSocket.OPEN || subscribed.has(channel)) return;
    socket.send(JSON.stringify({ event_name: 'subscribe', channels: [channel], last: 0 }));
    subscribed.add(channel);
  }

  async function showEmployeeList() {
    const list = document.getElementById('gp-employee-list');
    const ul = document.getElementById('gp-employee-items');
    ul.innerHTML = '';
    list.style.display = 'flex';
    const employees = await fetchJson('/api/patrimoine/employees');
    employees.forEach((emp) => {
      if (!emp.user_id) return;
      const li = document.createElement('li');
      li.textContent = emp.name;
      li.onclick = () => createConversation(emp.id);
      ul.appendChild(li);
    });
  }

  async function createConversation(empId) {
    await fetchJson('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ participants: [empId] }),
    });
    document.getElementById('gp-employee-list').style.display = 'none';
    await loadConversations();
  }

  function initEvents() {
    document.getElementById('gp-send-button').addEventListener('click', sendCurrent);
    document.getElementById('gp-message-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendCurrent();
      }
    });
    document.getElementById('gp-new-conversation').addEventListener('click', showEmployeeList);
    document.getElementById('gp-employee-close').addEventListener('click', () => {
      document.getElementById('gp-employee-list').style.display = 'none';
    });
  }

  async function init() {
    await loadConversations();
    if (conversations.length) {
      selectConversation(conversations[0]);
    }
    connectWebSocket();
    initEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

/* ═══════════════════════════════════════
   ChatForge — Frontend App
   Connects to Vercel serverless API + Supabase
═══════════════════════════════════════ */

const API = {
  servers:      '/api/servers',
  messages:     '/api/messages',
  createServer: '/api/createServer',
};

// ── State ──────────────────────────────
const state = {
  username:       null,
  activeServer:   null,
  servers:        [],
  messages:       [],
  pollInterval:   null,
  modMode:        false,
  lastMsgId:      null,
  searchQuery:    '',
};

// ── DOM refs ───────────────────────────
const $ = id => document.getElementById(id);

const els = {
  app:                $('app'),
  usernameModal:      $('username-modal'),
  usernameInput:      $('username-input'),
  usernameSubmit:     $('username-submit'),

  createModal:        $('create-modal'),
  closeCreate:        $('close-create'),
  openCreate:         $('open-create'),
  splashCreate:       $('splash-create'),
  newName:            $('new-server-name'),
  newIcon:            $('new-server-icon'),
  newDesc:            $('new-server-desc'),
  createSubmit:       $('create-server-submit'),
  createError:        $('create-error'),

  serverIconList:     $('server-icon-list'),
  serverCardsList:    $('server-cards-list'),
  searchInput:        $('search-input'),
  discoveryView:      $('discovery-view'),
  serverChannelsView: $('server-channels-view'),
  channelHeader:      $('discovery-title'),
  activeServerInfo:   $('active-server-info'),
  footerUsername:     $('footer-username'),
  leaveBtn:           $('leave-server-btn'),

  discoverySplash:    $('discovery-splash'),
  chatView:           $('chat-view'),
  chatServerLabel:    $('chat-server-label'),
  messagesList:       $('messages-list'),
  messagesWrap:       $('messages-wrap'),
  msgInput:           $('msg-input'),
  sendBtn:            $('send-btn'),
  modToggle:          $('mod-toggle'),
  onlineCount:        $('online-count'),

  toast:              $('toast'),
};

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════
let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  els.toast.textContent = msg;
  els.toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => {
    els.toast.className = 'toast';
  }, 2800);
}

// ══════════════════════════════════════
// USERNAME FLOW
// ══════════════════════════════════════
function initUsername() {
  const saved = localStorage.getItem('cf_username');
  if (saved) {
    state.username = saved;
    launchApp();
    return;
  }
  els.usernameModal.classList.add('active');
  els.usernameInput.focus();
}

function handleUsernameSubmit() {
  const val = els.usernameInput.value.trim();
  if (!val || val.length < 2) {
    showToast('Username must be at least 2 characters', 'error');
    return;
  }
  if (!/^[\w\-. ]+$/.test(val)) {
    showToast('Letters, numbers, spaces, - and _ only', 'error');
    return;
  }
  state.username = val;
  localStorage.setItem('cf_username', val);
  els.usernameModal.classList.remove('active');
  launchApp();
}

els.usernameSubmit.addEventListener('click', handleUsernameSubmit);
els.usernameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleUsernameSubmit();
});

// ══════════════════════════════════════
// APP LAUNCH
// ══════════════════════════════════════
function launchApp() {
  els.app.classList.remove('hidden');
  els.footerUsername.textContent = state.username;
  loadServers();
}

// ══════════════════════════════════════
// API CALLS
// ══════════════════════════════════════
async function apiFetch(url, opts = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    console.error('API error:', err);
    throw err;
  }
}

// ══════════════════════════════════════
// SERVERS
// ══════════════════════════════════════
async function loadServers() {
  try {
    renderSkeletons();
    const data = await apiFetch(API.servers);
    state.servers = data.servers || [];
    renderServerList();
    renderServerCards(state.searchQuery);
  } catch (err) {
    showToast('Failed to load servers', 'error');
    els.serverCardsList.innerHTML = '<div class="msg-loading">Could not load servers. Is your API configured?</div>';
  }
}

function renderSkeletons() {
  els.serverCardsList.innerHTML = [1,2,3,4].map(() =>
    '<div class="skeleton skeleton-card"></div>'
  ).join('');
}

function renderServerList() {
  els.serverIconList.innerHTML = '';
  state.servers.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'server-icon-btn' + (state.activeServer?.id === s.id ? ' active' : '');
    btn.title = s.name;
    btn.innerHTML = `<span class="server-pip"></span>${s.icon || '💬'}`;
    btn.addEventListener('click', () => enterServer(s));
    els.serverIconList.appendChild(btn);
  });
}

function renderServerCards(query = '') {
  const filtered = query
    ? state.servers.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(query.toLowerCase())
      )
    : state.servers;

  if (filtered.length === 0) {
    els.serverCardsList.innerHTML = '<div class="msg-loading">No servers found.</div>';
    return;
  }

  els.serverCardsList.innerHTML = filtered.map(s => `
    <div class="server-card${state.activeServer?.id === s.id ? ' active' : ''}"
         data-id="${s.id}" role="button" tabindex="0">
      <div class="card-icon">${s.icon || '💬'}</div>
      <div class="card-body">
        <div class="card-name">${escHtml(s.name)}</div>
        <div class="card-desc">${escHtml(s.description || 'No description')}</div>
      </div>
    </div>
  `).join('');

  els.serverCardsList.querySelectorAll('.server-card').forEach(card => {
    const id = card.dataset.id;
    const server = state.servers.find(s => s.id === id);
    card.addEventListener('click', () => enterServer(server));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') enterServer(server); });
  });
}

// ══════════════════════════════════════
// ENTER / LEAVE SERVER
// ══════════════════════════════════════
function enterServer(server) {
  state.activeServer = server;

  // Switch channel panel to server view
  els.discoveryView.classList.add('hidden');
  els.serverChannelsView.classList.remove('hidden');

  // Server info
  els.activeServerInfo.innerHTML = `
    <div class="si-icon">${server.icon || '💬'}</div>
    <div class="si-name">${escHtml(server.name)}</div>
    <div class="si-desc">${escHtml(server.description || '')}</div>
  `;

  // Switch main panel to chat
  els.discoverySplash.classList.add('hidden');
  els.chatView.classList.remove('hidden');
  els.chatServerLabel.textContent = server.name;

  // Update active states
  renderServerList();
  renderServerCards(state.searchQuery);

  // Load messages and start polling
  loadMessages(true);
  startPolling();

  // Remove mod bar if present
  const modBar = document.querySelector('.mod-bar');
  if (modBar) modBar.remove();
  state.modMode = false;
  els.modToggle.classList.remove('active');

  els.msgInput.focus();
}

function leaveServer() {
  state.activeServer = null;
  stopPolling();

  els.serverChannelsView.classList.add('hidden');
  els.discoveryView.classList.remove('hidden');
  els.chatView.classList.add('hidden');
  els.discoverySplash.classList.remove('hidden');

  renderServerList();
  renderServerCards(state.searchQuery);
  loadServers();
}

els.leaveBtn.addEventListener('click', leaveServer);

// ══════════════════════════════════════
// MESSAGES
// ══════════════════════════════════════
async function loadMessages(reset = false) {
  if (!state.activeServer) return;
  try {
    const url = `${API.messages}?server_id=${state.activeServer.id}&limit=60`;
    const data = await apiFetch(url);
    const msgs = data.messages || [];

    if (reset) {
      state.messages = msgs;
      renderMessages(true);
    } else {
      // Only append new messages
      const newMsgs = msgs.filter(m =>
        !state.messages.find(existing => existing.id === m.id)
      );
      if (newMsgs.length > 0) {
        state.messages = [...state.messages, ...newMsgs];
        newMsgs.forEach(m => appendMessage(m));
        scrollToBottom();
      }
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

function renderMessages(scroll = false) {
  const msgs = state.messages;

  let html = `
    <div class="messages-welcome">
      <div class="wl-icon">${state.activeServer?.icon || '💬'}</div>
      <h3>Welcome to #general</h3>
      <p>This is the beginning of the <strong>${escHtml(state.activeServer?.name || '')}</strong> server.</p>
    </div>
  `;

  if (msgs.length === 0) {
    html += '<div class="msg-loading">No messages yet. Say hello! 👋</div>';
  } else {
    msgs.forEach((m, i) => {
      const prev = msgs[i - 1];
      const grouped = prev && prev.username === m.username &&
        (new Date(m.created_at) - new Date(prev.created_at)) < 5 * 60 * 1000;
      html += renderMsg(m, grouped);
    });
  }

  els.messagesList.innerHTML = html;
  bindDeleteButtons();
  if (scroll) scrollToBottom(true);
}

function renderMsg(m, grouped = false) {
  const isYou = m.username === state.username;
  const avatar = (m.username || '?')[0].toUpperCase();
  const time = formatTime(m.created_at);
  const deleteable = isYou || state.modMode;

  return `
    <div class="msg${grouped ? ' grouped' : ''}" data-id="${m.id}">
      <div class="msg-avatar">${avatar}</div>
      <div class="msg-body">
        <div class="msg-meta">
          <span class="msg-author${isYou ? ' is-you' : ''}">${escHtml(m.username)}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="msg-text">${escHtml(m.content)}</div>
      </div>
      ${deleteable ? `
        <div class="msg-actions">
          <button class="msg-del-btn" data-id="${m.id}">🗑 delete</button>
        </div>
      ` : ''}
    </div>
  `;
}

function appendMessage(m) {
  const prev = state.messages[state.messages.length - 2]; // -2 since we already pushed
  const grouped = prev && prev.username === m.username &&
    (new Date(m.created_at) - new Date(prev.created_at)) < 5 * 60 * 1000;

  const div = document.createElement('div');
  div.innerHTML = renderMsg(m, grouped);
  const node = div.firstElementChild;
  // Remove the welcome or "no messages" block if present
  const noMsg = els.messagesList.querySelector('.msg-loading');
  if (noMsg) noMsg.remove();
  els.messagesList.appendChild(node);
  bindDeleteButtons();
}

function bindDeleteButtons() {
  els.messagesList.querySelectorAll('.msg-del-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      await deleteMessage(id);
    });
  });
}

async function deleteMessage(id) {
  try {
    await apiFetch(`${API.messages}?id=${id}`, { method: 'DELETE' });
    state.messages = state.messages.filter(m => m.id !== id);
    const el = els.messagesList.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
    showToast('Message deleted', 'success');
  } catch {
    showToast('Could not delete message', 'error');
  }
}

// ══════════════════════════════════════
// SEND MESSAGE
// ══════════════════════════════════════
async function sendMessage() {
  const content = els.msgInput.value.trim();
  if (!content || !state.activeServer) return;

  els.msgInput.value = '';
  els.sendBtn.disabled = true;

  try {
    const data = await apiFetch(API.messages, {
      method: 'POST',
      body: JSON.stringify({
        server_id: state.activeServer.id,
        username:  state.username,
        content,
      }),
    });

    const msg = data.message;
    if (!state.messages.find(m => m.id === msg.id)) {
      state.messages.push(msg);
      appendMessage(msg);
      scrollToBottom();
    }
  } catch {
    showToast('Failed to send message', 'error');
    els.msgInput.value = content;
  } finally {
    els.sendBtn.disabled = false;
    els.msgInput.focus();
  }
}

els.sendBtn.addEventListener('click', sendMessage);
els.msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ══════════════════════════════════════
// POLLING
// ══════════════════════════════════════
function startPolling() {
  stopPolling();
  state.pollInterval = setInterval(() => loadMessages(false), 3000);
}

function stopPolling() {
  if (state.pollInterval) {
    clearInterval(state.pollInterval);
    state.pollInterval = null;
  }
}

// ══════════════════════════════════════
// CREATE SERVER
// ══════════════════════════════════════
function openCreateModal() {
  els.createError.textContent = '';
  els.newName.value = '';
  els.newIcon.value = '';
  els.newDesc.value = '';
  els.createModal.classList.add('active');
  setTimeout(() => els.newName.focus(), 100);
}

function closeCreateModal() {
  els.createModal.classList.remove('active');
}

async function handleCreateServer() {
  const name = els.newName.value.trim();
  const icon = els.newIcon.value.trim() || '💬';
  const description = els.newDesc.value.trim();

  if (!name || name.length < 2) {
    els.createError.textContent = 'Server name must be at least 2 characters.';
    return;
  }

  els.createSubmit.disabled = true;
  els.createSubmit.textContent = 'Creating…';

  try {
    const data = await apiFetch(API.createServer, {
      method: 'POST',
      body: JSON.stringify({ name, icon, description }),
    });
    showToast(`Server "${name}" created!`, 'success');
    closeCreateModal();
    await loadServers();
    enterServer(data.server);
  } catch (err) {
    els.createError.textContent = err.message || 'Failed to create server.';
  } finally {
    els.createSubmit.disabled = false;
    els.createSubmit.textContent = 'Create Server';
  }
}

els.openCreate.addEventListener('click', openCreateModal);
els.splashCreate.addEventListener('click', openCreateModal);
els.closeCreate.addEventListener('click', closeCreateModal);
els.createSubmit.addEventListener('click', handleCreateServer);
els.createModal.addEventListener('click', e => {
  if (e.target === els.createModal) closeCreateModal();
});
els.newName.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleCreateServer();
});

// ══════════════════════════════════════
// SEARCH
// ══════════════════════════════════════
els.searchInput.addEventListener('input', e => {
  state.searchQuery = e.target.value;
  renderServerCards(state.searchQuery);
});

// ══════════════════════════════════════
// MODERATION
// ══════════════════════════════════════
els.modToggle.addEventListener('click', () => {
  state.modMode = !state.modMode;
  els.modToggle.classList.toggle('active', state.modMode);

  const existing = document.querySelector('.mod-bar');
  if (state.modMode) {
    if (!existing) {
      const bar = document.createElement('div');
      bar.className = 'mod-bar';
      bar.innerHTML = `
        <span>🛡 Moderation mode — you can delete any message</span>
        <button id="del-server-btn">Delete Server</button>
      `;
      els.chatView.insertBefore(bar, els.chatView.querySelector('.chat-input-wrap'));
      document.getElementById('del-server-btn').addEventListener('click', deleteCurrentServer);
    }
  } else {
    if (existing) existing.remove();
  }
  // Re-render to show/hide delete buttons
  renderMessages(false);
});

async function deleteCurrentServer() {
  if (!state.activeServer) return;
  const confirmed = confirm(`Delete server "${state.activeServer.name}"? This cannot be undone.`);
  if (!confirmed) return;

  try {
    await apiFetch(`${API.servers}?id=${state.activeServer.id}`, { method: 'DELETE' });
    showToast('Server deleted', 'success');
    leaveServer();
  } catch {
    showToast('Failed to delete server', 'error');
  }
}

// ══════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════
function scrollToBottom(instant = false) {
  const wrap = els.messagesWrap;
  if (instant) {
    wrap.scrollTop = wrap.scrollHeight;
  } else {
    // Only auto-scroll if near bottom
    const nearBottom = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 200;
    if (nearBottom) wrap.scrollTop = wrap.scrollHeight;
  }
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
initUsername();

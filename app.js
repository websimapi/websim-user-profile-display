// ...existing code...
// This module initializes the Websim room and updates the UI with the current user's username and avatar.

const avatarImg = document.getElementById('avatarImg');
const usernameEl = document.getElementById('username');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/?d=mp&s=256';

// Helper to safely set avatar with fallback
function setAvatar(url) {
  avatarImg.src = url || DEFAULT_AVATAR;
  avatarImg.onerror = () => {
    avatarImg.onerror = null;
    avatarImg.src = DEFAULT_AVATAR;
  };
}

// Update UI from room.peers using current clientId
function updateFromRoom(room) {
  try {
    const clientId = room.clientId;
    const me = room.peers && room.peers[clientId];
    if (me) {
      usernameEl.textContent = me.username || 'Unknown';
      setAvatar(me.avatarUrl || DEFAULT_AVATAR);
      statusEl.textContent = 'Connected';
    } else {
      usernameEl.textContent = 'Guest';
      setAvatar(DEFAULT_AVATAR);
      statusEl.textContent = 'Connected (no peer info)';
    }
  } catch (err) {
    usernameEl.textContent = 'Error';
    statusEl.textContent = 'Could not read user info';
    setAvatar(DEFAULT_AVATAR);
    console.error(err);
  }
}

async function init() {
  statusEl.textContent = 'Connecting...';
  try {
    const room = new WebsimSocket(); // global provided by the environment
    await room.initialize();

    // Initial render
    updateFromRoom(room);

    // Subscribe to peer updates in case avatar/username changes
    const unsubscribePresence = room.subscribePresence(() => {
      updateFromRoom(room);
    });

    // Listen for built-in connect/disconnect events
    room.onmessage = (event) => {
      if (!event || !event.data) return;
      const data = event.data;
      if (data.type === 'connected' || data.type === 'disconnected') {
        updateFromRoom(room);
      }
    };

    // Refresh button to manually re-read peer info
    refreshBtn.onclick = () => updateFromRoom(room);

    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      unsubscribePresence();
    });
  } catch (err) {
    statusEl.textContent = 'Connection failed';
    usernameEl.textContent = '—';
    setAvatar(DEFAULT_AVATAR);
    console.error('Room init error', err);
  }
}

init();
// ...existing code...


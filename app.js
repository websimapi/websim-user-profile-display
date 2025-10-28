// ...existing code...
// This module initializes the Websim room and updates the UI with the current user's username and avatar.

const avatarImg = document.getElementById('avatarImg');
const usernameEl = document.getElementById('username');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');
const profileCard = document.getElementById('profileCard');

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

// Paragraph to copy
const COPY_TEXT = `This page reads the current client's info from the Websim room and updates the UI. Initialize the room with "const room = new WebsimSocket(); await room.initialize();", then read your client via room.peers[room.clientId] to get username and avatarUrl and update the DOM.`;

// Copy handler with brief feedback
function copyUsageToClipboard() {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(COPY_TEXT).then(() => {
    const prev = statusEl.textContent;
    statusEl.textContent = 'Copied usage to clipboard';
    setTimeout(() => { statusEl.textContent = prev; }, 1800);
  }).catch(() => {
    statusEl.textContent = 'Copy failed';
    setTimeout(() => { statusEl.textContent = 'Connected'; }, 1800);
  });
}

async function init() {
  statusEl.textContent = 'Connecting...';
  try {
    const room = new WebsimSocket(); // global provided by the environment
    await room.initialize();

    // Initial render
    updateFromRoom(room);

    // Add interaction: tap/click or Enter key to copy usage paragraph
    profileCard.addEventListener('click', copyUsageToClipboard);
    profileCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyUsageToClipboard();
      }
    });

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
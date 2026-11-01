/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * socket-client.js — Real-Time WebSocket & Socket.io Client Manager
 *
 * Connects to the persistent Node.js worker (Render in production, localhost in development).
 * Provides:
 * 1. Live Active Student Counter synchronization
 * 2. Real-time streaming AI Mentor chat with automatic REST fallback
 * 3. Technical Mock Interview chamber signaling
 */

(function () {
  let socket = null;
  let isConnecting = false;
  let isConnected = false;
  let onlineLearners = 1;
  const eventListeners = new Map();

  function getSocketUrl() {
    if (window.CONFIG && window.CONFIG.SOCKET_URL) {
      return window.CONFIG.SOCKET_URL;
    }
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return isLocal ? 'http://localhost:5000' : 'https://api.disheera.site';
  }

  function getAuthToken() {
    if (window.Auth && typeof window.Auth.getToken === 'function') {
      return window.Auth.getToken();
    }
    return localStorage.getItem('careerpath_token') || localStorage.getItem('token') || null;
  }

  /**
   * Initializes the Socket.io connection lazily or when invoked
   */
  function initSocket() {
    if (socket || isConnecting) return;

    if (typeof window.io === 'undefined') {
      // Dynamically load Socket.io client if not already embedded
      loadSocketIoScript(() => {
        establishConnection();
      });
      return;
    }

    establishConnection();
  }

  function loadSocketIoScript(callback) {
    if (document.getElementById('socketIoScript')) return;
    const script = document.createElement('script');
    script.id = 'socketIoScript';
    script.src = 'https://cdn.jsdelivr.net/npm/socket.io-client@4.8.1/dist/socket.io.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (typeof callback === 'function') callback();
    };
    script.onerror = () => {
      console.debug('[Socket.io Client] CDN script unavailable; operating in pure REST mode.');
    };
    document.head.appendChild(script);
  }

  function establishConnection() {
    if (typeof window.io === 'undefined') return;

    const targetUrl = getSocketUrl();
    const token = getAuthToken();

    try {
      isConnecting = true;
      socket = window.io(targetUrl, {
        transports: ['websocket', 'polling'],
        auth: { token },
        timeout: 8000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        isConnecting = false;
        isConnected = true;
        console.log(`🔌 [Socket.io Client] Connected to real-time engine: ${targetUrl}`);
        trigger('connect', { socketId: socket.id });
      });

      socket.on('disconnect', (reason) => {
        isConnected = false;
        console.debug('[Socket.io Client] Disconnected:', reason);
        trigger('disconnect', { reason });
      });

      socket.on('connect_error', (err) => {
        isConnecting = false;
        isConnected = false;
        console.debug('[Socket.io Client] Real-time engine connecting/idle:', err.message);
        trigger('connect_error', err);
      });

      socket.on('online_stats', (data) => {
        if (data && typeof data.onlineCount === 'number') {
          onlineLearners = data.onlineCount;
          updateLearnerUI(data.onlineCount);
          trigger('online_stats', data);
        }
      });
    } catch (e) {
      isConnecting = false;
      isConnected = false;
      console.debug('[Socket.io Client] Setup notice:', e.message);
    }
  }

  function updateLearnerUI(count) {
    const badges = document.querySelectorAll('.cp-live-learner-badge, #liveLearnerCount');
    badges.forEach((el) => {
      el.textContent = `${count} Active`;
    });
  }

  function on(event, callback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
  }

  function trigger(event, payload) {
    const handlers = eventListeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  /**
   * High-level AI Mentor streaming query with automatic REST fallback
   */
  async function streamMentorMessage({ message, history = [], userContext = {}, onChunk, onDone, onError }) {
    // If socket is connected, attempt WebSocket stream
    if (socket && isConnected) {
      let receivedChunk = false;
      const streamHandler = (data) => {
        receivedChunk = true;
        if (data.done) {
          socket.off('stream_mentor_chunk', streamHandler);
          socket.off('mentor_error', errorHandler);
          if (onDone) onDone(data);
        } else {
          if (onChunk) onChunk(data.chunk);
        }
      };

      const errorHandler = (err) => {
        socket.off('stream_mentor_chunk', streamHandler);
        socket.off('mentor_error', errorHandler);
        // Fallback to REST on error
        fallbackToRest();
      };

      socket.on('stream_mentor_chunk', streamHandler);
      socket.on('mentor_error', errorHandler);

      socket.emit('send_mentor_message', {
        message,
        history,
        userContext,
      });

      // Guard: If no chunk received within 3.5 seconds, fallback to REST
      setTimeout(() => {
        if (!receivedChunk) {
          socket.off('stream_mentor_chunk', streamHandler);
          socket.off('mentor_error', errorHandler);
          fallbackToRest();
        }
      }, 3500);

      return;
    }

    // Direct REST Fallback
    fallbackToRest();

    async function fallbackToRest() {
      try {
        const token = getAuthToken();
        const apiBase = (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:5000/api';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${apiBase}/chat/message`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ message, history }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.reply) {
          if (onDone) onDone({ fullText: data.reply, engineUsed: 'Stateless REST Engine' });
        } else {
          if (onError) onError(new Error(data.message || 'REST query failed'));
        }
      } catch (err) {
        if (onError) onError(err);
      }
    }
  }

  // Initialize early if socket.io is already present or window has loaded
  if (document.readyState === 'complete') {
    initSocket();
  } else {
    window.addEventListener('load', initSocket, { once: true });
  }

  // Expose public API (DisheeraSocket with CareerPathSocket backward compatibility)
  window.DisheeraSocket = window.CareerPathSocket = {
    init: initSocket,
    getSocket: () => socket,
    isConnected: () => isConnected,
    getOnlineCount: () => onlineLearners,
    on,
    streamMentorMessage,
  };
})();

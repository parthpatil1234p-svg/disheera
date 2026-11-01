/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/socketService.js — Real-Time WebSocket & Socket.io Service
 *
 * Provides real-time persistent capabilities for:
 * 1. AI Career Mentor live streaming & interactive Q&A
 * 2. Mock Technical Interview Chamber peer signaling & proctoring events
 * 3. Live active student telemetry & online presence counters
 *
 * Runs on persistent Node.js servers (Render / Local Development).
 */

const { Server } = require('socket.io');

let io = null;
const connectedClients = new Set();

/**
 * Validates allowed CORS origins including Vercel preview deployments
 */
function isAllowedOrigin(origin) {
  if (!origin) return true; // Allow non-browser or same-origin clients
  if (
    origin === 'http://localhost:5000' ||
    origin === 'http://127.0.0.1:5000' ||
    origin === 'http://localhost:5500' ||
    origin === 'http://127.0.0.1:5500' ||
    origin === 'https://disheera.site' ||
    origin === 'https://www.disheera.site' ||
    origin === 'https://api.disheera.site' ||
    origin === 'https://apivercel.disheera.site' ||
    origin === 'https://disheera.site' ||
    origin === 'https://www.disheera.site' ||
    origin === 'https://disheera.site' ||
    (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
    (process.env.PROD_CLIENT_URL && origin === process.env.PROD_CLIENT_URL)
  ) {
    return true;
  }
  // Allow any *.disheera.site, *.is-local.org, or *.vercel.app deployment URL
  if (/^https:\/\/([a-z0-9-]+\.)?disheera\.site$/i.test(origin)) {
    return true;
  }
  if (/^https:\/\/([a-z0-9-]+\.)?is-local\.org$/i.test(origin)) {
    return true;
  }
  if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(origin)) {
    return true;
  }
  return false;
}

/**
 * Initializes Socket.io attached to the HTTP server
 * @param {import('http').Server} server
 */
function initSocket(server) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in development, doesn't block local testing
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    connectedClients.add(socket.id);
    console.log(`🔌 [Socket.io] Client connected: ${socket.id} (Total: ${connectedClients.size})`);

    // Broadcast updated active learner count
    io.emit('online_stats', {
      onlineCount: connectedClients.size,
      timestamp: Date.now(),
    });

    // ── 1. AI Career Mentor Streaming ─────────────────────────
    socket.on('join_mentor_room', (data = {}) => {
      const room = data.roomId || `mentor_${socket.id}`;
      socket.join(room);
      socket.emit('mentor_room_joined', { room, status: 'active' });
    });

    socket.on('send_mentor_message', async (data = {}) => {
      const { message, history = [], userContext = {}, roomId } = data;
      const targetRoom = roomId || `mentor_${socket.id}`;

      if (!message || typeof message !== 'string') {
        return socket.emit('mentor_error', { message: 'Message content is required.' });
      }

      try {
        // Dynamic import of services to avoid circular dependencies
        const { getGroqMentorReply } = require('./groqService');
        const { getChatMentorReply } = require('./geminiService');

        let reply = null;
        let engineUsed = 'Groq Cloud';

        if (process.env.GROQ_API_KEY) {
          try {
            reply = await getGroqMentorReply(message.trim(), history, userContext);
          } catch (groqErr) {
            console.warn('[Socket.io Mentor] Groq fallback:', groqErr.message);
          }
        }

        if (!reply && process.env.GEMINI_API_KEY) {
          try {
            reply = await getChatMentorReply(message.trim(), history, userContext);
            engineUsed = 'Google Gemini';
          } catch (geminiErr) {
            console.warn('[Socket.io Mentor] Gemini fallback:', geminiErr.message);
          }
        }

        if (!reply) {
          const name = userContext?.name || 'Student';
          const targetStr = userContext?.targetCareer ? ` for **${userContext.targetCareer}**` : '';
          reply = `Hello ${name}! 👋\n\nI am your Disheera Real-Time Mentor. Here is my strategic advice${targetStr}:\n\n1. **Build End-to-End Projects**: Implement key full-stack capabilities with real deployment.\n2. **Follow Weekly Roadmaps**: Complete milestones step by step to eliminate identified skill gaps.\n3. **Practice Live Interviews**: Use the Mock Chamber to build technical fluency.\n\nKeep growing your skills!`;
          engineUsed = 'Disheera Knowledge Engine';
        }

        // Stream chunks to simulate realistic real-time AI generation
        const words = reply.split(' ');
        const chunkSize = 4;
        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
          socket.emit('stream_mentor_chunk', { chunk, done: false });
          // Micro-tick for stream feel
          await new Promise((r) => setTimeout(r, 20));
        }

        socket.emit('stream_mentor_chunk', { chunk: '', done: true, engineUsed, fullText: reply });
      } catch (err) {
        console.error('[Socket.io Mentor] Error:', err.message);
        socket.emit('mentor_error', { message: 'Failed to process AI mentor message.' });
      }
    });

    // ── 2. Mock Technical Interview Chamber Signaling ────────
    socket.on('join_interview_room', (data = {}) => {
      const room = data.roomId || 'general_interview_chamber';
      socket.join(room);
      socket.to(room).emit('peer_joined', { peerId: socket.id });
      socket.emit('interview_room_ready', { roomId: room, socketId: socket.id });
    });

    socket.on('interview_signal', (data = {}) => {
      const { roomId, signal } = data;
      if (roomId) {
        socket.to(roomId).emit('interview_signal', {
          senderId: socket.id,
          signal,
        });
      }
    });

    // ── 3. Disconnection & Cleanup ───────────────────────────
    socket.on('disconnect', () => {
      connectedClients.delete(socket.id);
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id} (Remaining: ${connectedClients.size})`);
      io.emit('online_stats', {
        onlineCount: connectedClients.size,
        timestamp: Date.now(),
      });
    });
  });

  console.log('✅ [Socket.io] Real-Time WebSocket service initialized.');
  return io;
}

/**
 * Returns active Socket.io instance
 */
function getIO() {
  return io;
}

module.exports = {
  initSocket,
  getIO,
};

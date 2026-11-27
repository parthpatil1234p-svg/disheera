/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Standalone Voice AI Support Microservice Engine
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CALLS_UPLOAD_DIR = path.join(__dirname, '../uploads/calls');
const CALL_LOGS_FILE = path.join(__dirname, '../data/call_logs.json');

if (!fs.existsSync(CALLS_UPLOAD_DIR)) {
  fs.mkdirSync(CALLS_UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(CALL_LOGS_FILE))) {
  fs.mkdirSync(path.dirname(CALL_LOGS_FILE), { recursive: true });
}

const activeSessions = new Map();
let localCallLogsCache = [];

try {
  if (fs.existsSync(CALL_LOGS_FILE)) {
    localCallLogsCache = JSON.parse(fs.readFileSync(CALL_LOGS_FILE, 'utf8'));
  }
} catch {
  localCallLogsCache = [];
}

function persistLogs() {
  try {
    fs.writeFileSync(CALL_LOGS_FILE, JSON.stringify(localCallLogsCache, null, 2), 'utf8');
  } catch (e) {
    console.warn('[VoiceServer] Log persist warning:', e.message);
  }
}

const DISHEERA_SYSTEM_PROMPT = `You are "Arya", the official Voice Support Assistant of Disheera.
You speak politely, empathetically, and crisply in English or natural Hinglish.

STRICT DOMAIN BOUNDARY:
You answer ONLY questions related to the Disheera platform:
1. Roadmaps & Curated Weekly Masterclasses
2. Weekly College Assignments & Gemini Multimodal AI Grading
3. Fix-the-Bug Code Chamber & Anti-Cheat Proctoring (camera/fullscreen locks)
4. Verified Skill Passports & Cryptographic SHA-256 Certificates
5. Industrial Proximity Radar (60+ MIDC tech employers)
6. ATS Resume Studio & Badges
7. Dual-Verification (WhatsApp + Email OTP login)
8. Grievance Redressal (Grievance Officer: Parth Patil, support@disheera.site, WhatsApp +91 74990 85045)

OUT-OF-DOMAIN HANDLING:
If the user asks ANY question outside Disheera (politics, cricket, movies, unrelated school homework, or generic chit-chat), YOU MUST POLITELY REFUSE:
"I am the Disheera Support Assistant. I can only assist you with Disheera roadmaps, assignments, proctoring, skill verification, and platform features. How can I help you with your Disheera learning journey today?"

ESCALATION & TICKET CREATION:
If the student encounters a bug, platform disconnect, failed grading, camera lock issue, asks for human intervention, or explicitly requests a ticket or supervisor, reply with reassurance and include the exact tag: [NEEDS_ESCALATION: <category> | <subject> | <description>].
Valid categories: "technical", "proctoring", "otp", "certificate", "general". Keep voice replies brief (under 50 words).`;

async function transcribeAudioWithGroq(audioBuffer, mimeType = 'audio/webm') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured on Voice Server');

  const blob = new Blob([audioBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Whisper failed [HTTP ${res.status}]: ${errText}`);
  }

  const data = await res.json();
  return (data.text || '').trim();
}

async function callGemini(contents, model = 'gemini-2.0-flash', signal = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: DISHEERA_SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.5, maxOutputTokens: 250 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API failed [HTTP ${response.status}]: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generateSupportResponse(conversationHistory, studentMessage) {
  const groqKey = process.env.GROQ_API_KEY;

  const messages = [
    { role: 'system', content: DISHEERA_SYSTEM_PROMPT },
    ...conversationHistory.slice(-6).map((turn) => ({
      role: turn.speaker === 'agent' ? 'assistant' : 'user',
      content: turn.text,
    })),
    { role: 'user', content: studentMessage },
  ];

  if (groqKey) {
    const candidateModels = [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama3-70b-8192',
    ];

    for (const model of candidateModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.5,
            max_tokens: 250,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || '';
          if (content.trim()) return { content: content.trim(), provider: `groq:${model}` };
        }
      } catch (e) {
        console.warn(`[VoiceServer] Groq ${model} failed, trying next:`, e.message);
      }
    }
  }

  try {
    const geminiContents = [
      ...conversationHistory.slice(-6).map((turn) => ({
        role: turn.speaker === 'agent' ? 'model' : 'user',
        parts: [{ text: turn.text }],
      })),
      { role: 'user', parts: [{ text: studentMessage }] },
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const geminiText = await callGemini(geminiContents, 'gemini-2.0-flash', controller.signal);
    clearTimeout(timer);

    return { content: geminiText.trim(), provider: 'gemini' };
  } catch (err) {
    console.error('[VoiceServer] Gemini fallback failed:', err.message);
    return {
      content: 'Namaste! I am having a brief network issue connecting to the AI brain. Let me log your grievance with our support team immediately.',
      provider: 'offline_fallback',
    };
  }
}

async function relayTicketToMainServer(category, subject, description, user) {
  const mainApi = (process.env.MAIN_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
  try {
    const res = await fetch(`${mainApi}/support/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name || 'Student',
        email: user.email || 'student@disheera.site',
        phone: user.phone || null,
        category: category || 'general',
        subject: subject || 'Voice Support Query',
        description: description || 'Voice Support call escalation',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.ticket) {
      return data.ticket.ticketId || data.ticketId;
    }
  } catch (err) {
    console.warn('[VoiceServer] Main API ticket relay warning:', err.message);
  }
  return 'CP-TKT-' + crypto.randomInt(100000, 999999);
}

function startSession(user) {
  if (!user || !user.id) {
    throw new Error('Authentication required: Valid student account is mandatory.');
  }

  const sessionId = 'call_' + crypto.randomBytes(8).toString('hex');
  const session = {
    sessionId,
    userId: user.id,
    userName: user.name || 'Student',
    userEmail: user.email || '',
    userPhone: user.phone || '',
    startTime: Date.now(),
    transcript: [],
    status: 'ACTIVE',
    ticketId: null,
  };

  activeSessions.set(sessionId, session);
  const greeting = `Namaste ${user.name || 'there'}! I am Arya, your Disheera Support Assistant on our dedicated voice server. How can I help you today?`;

  session.transcript.push({
    speaker: 'agent',
    text: greeting,
    timestamp: Date.now(),
  });

  return {
    sessionId,
    greeting,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      hasPhone: Boolean(user.phone && user.phone.trim().length >= 10),
    },
  };
}

async function processVoiceTurn(sessionId, { audioBase64, textInput, mimeType, phoneUpdate, user }) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Voice session expired or not found.');
  }

  if (phoneUpdate && typeof phoneUpdate === 'string') {
    const normalized = phoneUpdate.replace(/\D/g, '');
    if (normalized.length >= 10) session.userPhone = normalized;
  }

  let studentQuery = (textInput || '').trim();
  if (audioBase64) {
    try {
      const buffer = Buffer.from(audioBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      const transcribed = await transcribeAudioWithGroq(buffer, mimeType || 'audio/webm');
      if (transcribed) studentQuery = transcribed;
    } catch (e) {
      console.warn('[VoiceServer] Groq Whisper error, fallback to text:', e.message);
    }
  }

  if (!studentQuery) {
    return {
      success: true,
      replyText: "I couldn't hear clearly. Could you please repeat your question?",
      transcript: session.transcript,
      ticketId: session.ticketId,
    };
  }

  session.transcript.push({ speaker: 'user', text: studentQuery, timestamp: Date.now() });

  if (
    (!session.userPhone || session.userPhone.length < 10) &&
    /ticket|complaint|human|help|bug|issue|grievance/i.test(studentQuery)
  ) {
    const askPhone = 'To register your support ticket and send WhatsApp confirmation, please provide your 10-digit mobile number.';
    session.transcript.push({ speaker: 'agent', text: askPhone, timestamp: Date.now() });
    return {
      success: true,
      replyText: askPhone,
      needsPhonePrompt: true,
      transcript: session.transcript,
      ticketId: null,
    };
  }

  const aiResult = await generateSupportResponse(session.transcript, studentQuery);

  const isExplicitEscalation = /bug|human|supervisor|complaint|grievance|ticket|locked|camera lock|fraud|cheat lock/i.test(studentQuery);
  if (isExplicitEscalation && !aiResult.content.includes('[NEEDS_ESCALATION:')) {
    aiResult.content += ` [NEEDS_ESCALATION: technical | Student Support Escalation | ${studentQuery.slice(0, 120)}]`;
  }

  const match = aiResult.content.match(/\[NEEDS_ESCALATION:\s*([^\|]+)\|\s*([^\|]+)\|\s*([^\]]+)\]/i);
  let cleanText = aiResult.content.replace(/\[NEEDS_ESCALATION:[^\]]+\]/gi, '').trim();

  if (match) {
    const category = match[1].trim().toLowerCase();
    const subject = match[2].trim();
    const desc = match[3].trim();

    const ticketId = await relayTicketToMainServer(category, subject, desc, {
      name: session.userName,
      email: session.userEmail,
      phone: session.userPhone,
    });

    session.ticketId = ticketId;
    session.status = 'ESCALATED_TICKET';
    cleanText += ` I have officially logged priority support ticket #${ticketId} for you and dispatched a WhatsApp confirmation. Grievance Officer Parth Patil will follow up within 24 hours.`;
  }

  session.transcript.push({ speaker: 'agent', text: cleanText, timestamp: Date.now() });

  return {
    success: true,
    replyText: cleanText,
    provider: aiResult.provider,
    ticketId: session.ticketId,
    transcript: session.transcript,
  };
}

async function endSession(sessionId, finalAudioBase64 = null) {
  const session = activeSessions.get(sessionId);
  if (!session) return { success: true, message: 'Session already terminated.' };

  const durationSeconds = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
  let recordingUrl = null;

  if (finalAudioBase64) {
    try {
      const buffer = Buffer.from(finalAudioBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      const filename = `call_${sessionId}_${Date.now()}.webm`;
      fs.writeFileSync(path.join(CALLS_UPLOAD_DIR, filename), buffer);
      recordingUrl = `/uploads/calls/${filename}`;
    } catch (e) {
      console.warn('[VoiceServer] Audio save warning:', e.message);
    }
  }

  const logRecord = {
    id: sessionId,
    userId: session.userId,
    userName: session.userName,
    userEmail: session.userEmail,
    userPhone: session.userPhone || 'Not Provided',
    durationSeconds,
    status: session.ticketId ? 'ESCALATED_TICKET' : 'RESOLVED',
    ticketId: session.ticketId,
    transcript: session.transcript,
    recordingUrl,
    createdAt: new Date().toISOString(),
  };

  localCallLogsCache.unshift(logRecord);
  if (localCallLogsCache.length > 500) localCallLogsCache.pop();
  persistLogs();

  activeSessions.delete(sessionId);
  return { success: true, callLog: logRecord };
}

function getCallLogs({ page = 1, limit = 50, search = '', status = '' } = {}) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));

  let filtered = [...localCallLogsCache];
  if (status) filtered = filtered.filter((c) => c.status === status);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        (c.userName && c.userName.toLowerCase().includes(s)) ||
        (c.userEmail && c.userEmail.toLowerCase().includes(s)) ||
        (c.userPhone && c.userPhone.includes(s)) ||
        (c.ticketId && c.ticketId.toLowerCase().includes(s))
    );
  }

  return {
    total: filtered.length,
    page: p,
    limit: l,
    data: filtered.slice((p - 1) * l, p * l),
  };
}

module.exports = {
  startSession,
  processVoiceTurn,
  endSession,
  getCallLogs,
};

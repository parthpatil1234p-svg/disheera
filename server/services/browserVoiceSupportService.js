/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/browserVoiceSupportService.js — Browser Voice AI Support Agent Engine
 * Disheera · Enterprise Backend Service
 *
 * Capabilities:
 * - Dual-Engine conversational AI: Groq LPU (<300ms) with Google Gemini 2.0 Flash fallback
 * - Groq Whisper STT audio transcription pipeline
 * - Strict Disheera domain boundary guardrails (rejects non-platform queries)
 * - Automatic Support Ticket generation & dual WhatsApp relay (+91 74990 85045 and student phone)
 * - Audio recording storage & telemetry persistence for Admin Cockpit
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { prisma } = require('../config/prisma');
const whatsappService = require('./whatsappService');
const { callGemini } = require('./geminiService');

// File paths
const CALLS_UPLOAD_DIR = path.join(__dirname, '../uploads/calls');
const CALL_LOGS_FILE = path.join(__dirname, '../data/call_logs.json');

// Ensure directories and files exist
if (!fs.existsSync(CALLS_UPLOAD_DIR)) {
  fs.mkdirSync(CALLS_UPLOAD_DIR, { recursive: true });
}

// In-Memory active call sessions
const activeSessions = new Map();

// Local cache for call logs (resilient to DB connection spikes)
let localCallLogsCache = [];
try {
  if (fs.existsSync(CALL_LOGS_FILE)) {
    const raw = fs.readFileSync(CALL_LOGS_FILE, 'utf8');
    localCallLogsCache = JSON.parse(raw);
  }
} catch (err) {
  localCallLogsCache = [];
}

function persistLocalCallLogs() {
  try {
    fs.writeFileSync(CALL_LOGS_FILE, JSON.stringify(localCallLogsCache, null, 2), 'utf8');
  } catch (err) {
    console.warn('[VoiceSupportService] Local call logs write warning:', err.message);
  }
}

// Support Tickets Cache Link
let supportTicketsCacheRef = null;
let persistTicketsRef = null;
try {
  const waCtrl = require('../controllers/whatsappController');
  supportTicketsCacheRef = waCtrl.supportTicketsCache;
  persistTicketsRef = waCtrl.persistTickets;
} catch (e) {
  console.warn('[VoiceSupportService] WhatsAppController ticket cache link unavailable:', e.message);
}

// Strict Disheera System Prompt
const DISHEERA_SUPPORT_SYSTEM_PROMPT = `You are "Arya", the official real-time Voice Support Assistant of Disheera (India's leading career-guidance and verified skills platform).
You speak empathetically, politely, crisply, and professionally to students in clean English or natural Hinglish.

STRICT DOMAIN BOUNDARY (CRITICAL RULE):
You answer questions ONLY related to the Disheera platform and its features:
1. Roadmaps & Curated Weekly Masterclasses
2. Weekly College Assignments & Gemini Multimodal AI Grading (marks out of 10)
3. Fix-the-Bug Code Chamber & Anti-Cheat Proctoring (camera/fullscreen locks)
4. Verified Skill Passports & Cryptographic SHA-256 Certificates
5. Industrial Proximity Radar (60+ MIDC & National Tech employers)
6. ATS Resume Studio & Verified Badges
7. Dual-Verification (WhatsApp + Email OTP login)
8. Grievance Redressal (Grievance Officer: Parth Patil, support@disheera.site, WhatsApp +91 74990 85045)

OUT-OF-DOMAIN HANDLING:
If the user asks ANY question outside Disheera (such as general politics, movies, cricket, unrelated school homework like chemistry/history essays, personal advice, or generic chit-chat), YOU MUST POLITELY REFUSE:
"I am the Disheera Support Assistant. I can only assist you with Disheera roadmaps, assignments, proctoring, skill verification, and platform features. How can I help you with your Disheera learning journey today?"

ESCALATION & TICKET CREATION:
If the student encounters a bug, platform disconnect, failed grading, camera lock issue, asks for human intervention, or explicitly requests a ticket or supervisor, reply with reassurance and include the exact tag: [NEEDS_ESCALATION: <category> | <subject> | <description>].
Valid categories: "technical", "proctoring", "otp", "certificate", "general".

CONVERSATIONAL VOICE STYLE:
Keep voice replies brief (2 to 4 sentences maximum, under 60 words) so they sound natural and fast when spoken aloud. Never use long bullet points or markdown tables.`;

/**
 * Transcribes audio buffer/base64 using Groq Whisper API
 */
async function transcribeAudioWithGroq(audioBuffer, mimeType = 'audio/webm') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured for Whisper transcription');
  }

  // Use native Node 18+ FormData and Blob
  const blob = new Blob([audioBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');
  formData.append('temperature', '0.0');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq Whisper failed [HTTP ${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  return (data.text || '').trim();
}

/**
 * Generates conversational response via Groq LPU (Primary) or Gemini (Fallback)
 */
async function generateSupportResponse(conversationHistory, studentMessage) {
  const apiKey = process.env.GROQ_API_KEY;

  const messages = [
    { role: 'system', content: DISHEERA_SUPPORT_SYSTEM_PROMPT },
    ...conversationHistory.slice(-6).map((turn) => ({
      role: turn.speaker === 'agent' ? 'assistant' : 'user',
      content: turn.text,
    })),
    { role: 'user', content: studentMessage },
  ];

  // 1. Try Groq LPU (Sub-second latency)
  if (apiKey) {
    const candidateModels = [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama3-70b-8192',
    ];

    for (const model of candidateModels) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.5,
            max_tokens: 300,
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          const rawContent = groqData.choices?.[0]?.message?.content || '';
          if (rawContent.trim()) {
            return { content: rawContent.trim(), provider: `groq:${model}` };
          }
        }
      } catch (groqErr) {
        console.warn(`[VoiceSupportService] Groq ${model} failed, trying next:`, groqErr.message);
      }
    }
  }

  // 2. Fallback to Google Gemini 2.0 Flash
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

    const geminiText = await callGemini(
      geminiContents,
      'gemini-2.0-flash',
      controller.signal,
      DISHEERA_SUPPORT_SYSTEM_PROMPT
    );
    clearTimeout(timer);

    return { content: (geminiText || '').trim(), provider: 'gemini' };
  } catch (geminiErr) {
    console.error('[VoiceSupportService] Gemini fallback failed:', geminiErr.message);
    return {
      content: "Namaste! I am having a brief network issue connecting to the AI brain. Let me log your grievance with our support team immediately.",
      provider: 'offline_fallback',
    };
  }
}

/**
 * Parses escalation tags from the LLM response and creates official ticket + WhatsApp alerts
 */
async function handleTicketEscalation(rawText, user) {
  const match = rawText.match(/\[NEEDS_ESCALATION:\s*([^\|]+)\|\s*([^\|]+)\|\s*([^\]]+)\]/i);
  let cleanText = rawText.replace(/\[NEEDS_ESCALATION:[^\]]+\]/gi, '').trim();
  let ticketId = null;

  if (match) {
    const category = match[1].trim().toLowerCase() || 'general';
    const subject = match[2].trim() || 'Voice Support Query';
    const description = match[3].trim() || 'Student requested support escalation during voice call.';

    ticketId = 'CP-TKT-' + crypto.randomInt(100000, 999999);
    const categoryLabel = {
      technical: 'Platform Bug & Technical Disconnect',
      proctoring: 'Milestone Test & Anti-Cheat Proctoring',
      otp: 'Login & Dual-OTP Verification',
      certificate: 'Digital Certificate & SHA-256 Ledger',
      general: 'General Career & Academic Inquiry',
    }[category] || 'General Career & Academic Inquiry';

    const ticketRecord = {
      ticketId,
      name: user.name || 'Student',
      email: user.email || 'student@disheera.site',
      phone: user.phone ? whatsappService.formatPhoneNumber(user.phone) : null,
      category,
      categoryLabel,
      subject,
      description,
      status: 'OPEN_ASSIGNED',
      officer: 'Parth Patil',
      createdAt: new Date().toISOString(),
      source: 'voice_ai_browser_agent',
    };

    // Store in ticket cache
    if (supportTicketsCacheRef) {
      supportTicketsCacheRef.set(ticketId, ticketRecord);
      if (persistTicketsRef) persistTicketsRef().catch(() => {});
    }

    console.log(`[VoiceSupport] Ticket Created: #${ticketId} for ${user.name} (${user.phone || 'No Phone'})`);

    // Dispatch WhatsApp confirmation to Student if phone available
    if (ticketRecord.phone) {
      const waStudentMsg = `🎫 *Disheera — Support Ticket Registered via Voice Agent*

Namaste ${user.name}! 👋
Aapki voice support call se ticket register ho gaya hai:

• *Ticket ID:* #${ticketId}
• *Category:* ${categoryLabel}
• *Subject:* ${subject}
• *Assigned Officer:* Parth Patil (Technical & Grievance Lead)
• *Grievance Email:* support@disheera.site
• *Statutory SLA:* 24 Hours (DPDP Act 2023)

Humari team aapse jald hi contact karegi!`;

      whatsappService.sendTextMessage(ticketRecord.phone, waStudentMsg, {
        context: 'VOICE_SUPPORT_TICKET',
        ticketId,
      }).catch((err) => console.warn('[VoiceSupport] Student WhatsApp send warning:', err.message));
    }

    // Dispatch Alert to Disheera Grievance & Technical Lead (+91 74990 85045)
    const adminGrievancePhone = '+917499085045';
    const waAdminMsg = `🚨 *URGENT: Voice Support Escalation Ticket #${ticketId}*

• *Student:* ${user.name} (${user.email})
• *Phone:* ${user.phone || 'Not Provided (Logged in)'}
• *Category:* ${categoryLabel}
• *Issue:* ${description}
• *Time:* ${new Date().toLocaleTimeString('en-IN')}`;

    whatsappService.sendTextMessage(adminGrievancePhone, waAdminMsg, {
      context: 'ADMIN_VOICE_ALERT',
      ticketId,
    }).catch((err) => console.warn('[VoiceSupport] Admin WhatsApp alert warning:', err.message));

    cleanText += ` I have officially logged priority support ticket #${ticketId} for you and dispatched a WhatsApp confirmation. Grievance Officer Parth Patil will follow up within 24 hours.`;
  }

  return { cleanText, ticketId };
}

/**
 * Initializes a new Voice Call Session
 */
function startSession(user) {
  if (!user || !user.id) {
    throw new Error('Authentication required: Valid student account is mandatory for Voice AI Support.');
  }

  const sessionId = 'call_' + crypto.randomBytes(8).toString('hex');
  const session = {
    sessionId,
    userId: user.id,
    userName: user.name || 'Student',
    userEmail: user.email || '',
    userPhone: user.phone || '',
    startTime: Date.now(),
    lastActive: Date.now(),
    transcript: [],
    status: 'ACTIVE',
    ticketId: null,
    audioChunks: [],
  };

  activeSessions.set(sessionId, session);

  const initialGreeting = `Namaste ${user.name || 'there'}! I am Arya, your Disheera Support Assistant. How can I help you with your roadmap, assignments, or platform features today?`;

  session.transcript.push({
    speaker: 'agent',
    text: initialGreeting,
    timestamp: Date.now(),
  });

  return {
    sessionId,
    greeting: initialGreeting,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      hasPhone: Boolean(user.phone && user.phone.trim().length >= 10),
    },
  };
}

/**
 * Processes a student conversation turn (Speech/Text in -> Voice/Text out)
 */
async function processVoiceTurn(sessionId, { audioBase64, textInput, mimeType, phoneUpdate, user }) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Voice session expired or not found. Please start a new call.');
  }

  session.lastActive = Date.now();

  // Handle in-call phone number capture if user didn't have one
  if (phoneUpdate && typeof phoneUpdate === 'string') {
    const normalized = phoneUpdate.replace(/\D/g, '');
    if (normalized.length >= 10) {
      session.userPhone = normalized;
      // Persist to user record in DB if possible
      try {
        if (prisma && prisma.user) {
          await prisma.user.update({
            where: { id: session.userId },
            data: { phone: session.userPhone },
          });
        }
      } catch (dbErr) {
        console.warn('[VoiceSupport] Phone number update warning:', dbErr.message);
      }
    }
  }

  // 1. Resolve student query text
  let studentQuery = (textInput || '').trim();

  if (audioBase64) {
    try {
      const audioBuffer = Buffer.from(audioBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      const transcribed = await transcribeAudioWithGroq(audioBuffer, mimeType || 'audio/webm');
      if (transcribed) {
        studentQuery = transcribed;
      }
    } catch (sttErr) {
      console.warn('[VoiceSupport] Groq Whisper STT failed, using textInput fallback:', sttErr.message);
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

  // Record student turn
  session.transcript.push({
    speaker: 'user',
    text: studentQuery,
    timestamp: Date.now(),
  });

  // Check if missing phone while student asks for ticket
  if (
    (!session.userPhone || session.userPhone.length < 10) &&
    /ticket|complaint|human|help|bug|issue|grievance/i.test(studentQuery)
  ) {
    const askPhoneReply = "To register your official support ticket and send WhatsApp confirmation, please tell me or type your 10-digit mobile number.";
    session.transcript.push({
      speaker: 'agent',
      text: askPhoneReply,
      timestamp: Date.now(),
    });
    return {
      success: true,
      replyText: askPhoneReply,
      needsPhonePrompt: true,
      transcript: session.transcript,
      ticketId: null,
    };
  }

  // 2. Generate AI reply with domain guardrails
  const aiResult = await generateSupportResponse(session.transcript, studentQuery);

  // 3. Process potential ticket escalation
  const isExplicitEscalation = /bug|human|supervisor|complaint|grievance|ticket|locked|camera lock|fraud|cheat lock/i.test(studentQuery);
  if (isExplicitEscalation && !aiResult.content.includes('[NEEDS_ESCALATION:')) {
    aiResult.content += ` [NEEDS_ESCALATION: technical | Student Platform Issue | ${studentQuery.slice(0, 120)}]`;
  }

  const { cleanText, ticketId } = await handleTicketEscalation(aiResult.content, {
    name: session.userName,
    email: session.userEmail,
    phone: session.userPhone,
  });

  if (ticketId) {
    session.ticketId = ticketId;
    session.status = 'ESCALATED_TICKET';
  }

  // Record agent turn
  session.transcript.push({
    speaker: 'agent',
    text: cleanText,
    timestamp: Date.now(),
  });

  return {
    success: true,
    replyText: cleanText,
    provider: aiResult.provider,
    ticketId: session.ticketId,
    transcript: session.transcript,
  };
}

/**
 * Closes the call session, saves recording, and persists CallLog
 */
async function endSession(sessionId, finalAudioBase64 = null) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return { success: true, message: 'Session already terminated or not found.' };
  }

  const durationSeconds = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
  let recordingUrl = null;

  // Save audio recording file if provided
  if (finalAudioBase64) {
    try {
      const audioBuffer = Buffer.from(finalAudioBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      const filename = `call_${sessionId}_${Date.now()}.webm`;
      const filePath = path.join(CALLS_UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, audioBuffer);
      recordingUrl = `/uploads/calls/${filename}`;
    } catch (saveErr) {
      console.warn('[VoiceSupport] Audio recording save warning:', saveErr.message);
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

  // 1. Save to Supabase PostgreSQL via Prisma if available
  try {
    if (prisma && prisma.callLog) {
      await prisma.callLog.create({
        data: {
          id: sessionId,
          userId: session.userId,
          userName: session.userName,
          userEmail: session.userEmail,
          userPhone: session.userPhone || '',
          durationSeconds,
          status: logRecord.status,
          ticketId: session.ticketId,
          transcript: session.transcript,
          recordingUrl,
        },
      });
      console.log(`[VoiceSupport] CallLog #${sessionId} persisted to Supabase database.`);
    }
  } catch (dbErr) {
    console.warn('[VoiceSupport] Supabase CallLog insert fallback to local JSON:', dbErr.message);
  }

  // 2. Always persist to local cache for instant retrieval in Admin Cockpit
  localCallLogsCache.unshift(logRecord);
  if (localCallLogsCache.length > 500) localCallLogsCache.pop();
  persistLocalCallLogs();

  // Clear active memory
  activeSessions.delete(sessionId);

  return {
    success: true,
    message: 'Voice call session concluded successfully.',
    callLog: logRecord,
  };
}

/**
 * Retrieves call logs for Admin Cockpit
 */
async function getCallLogs({ page = 1, limit = 50, search = '', status = '' } = {}) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));

  // Try DB first
  try {
    if (prisma && prisma.callLog) {
      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { userName: { contains: search, mode: 'insensitive' } },
          { userEmail: { contains: search, mode: 'insensitive' } },
          { userPhone: { contains: search, mode: 'insensitive' } },
          { ticketId: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, records] = await Promise.all([
        prisma.callLog.count({ where }),
        prisma.callLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (p - 1) * l,
          take: l,
        }),
      ]);

      if (records && records.length > 0) {
        return {
          total,
          page: p,
          limit: l,
          data: records,
        };
      }
    }
  } catch (dbErr) {
    console.warn('[VoiceSupport] DB query fallback to local call logs cache:', dbErr.message);
  }

  // Fallback to local cache
  let filtered = [...localCallLogsCache];
  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }
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

  const paginated = filtered.slice((p - 1) * l, p * l);
  return {
    total: filtered.length,
    page: p,
    limit: l,
    data: paginated,
  };
}

module.exports = {
  startSession,
  processVoiceTurn,
  endSession,
  getCallLogs,
  transcribeAudioWithGroq,
  generateSupportResponse,
};

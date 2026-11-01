/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/whatsappController.js  -  Unified WhatsApp Automation Controller
 * 
 * Capabilities:
 * 1. Meta & OpenWA Webhook Receiver (24x7 Context-Aware AI Career Mentor)
 * 2. On-Demand Weekly Roadmap & Cheatsheet PDF WhatsApp Delivery
 * 3. WhatsApp OTP Test & Healthcheck Gateway
 * 
 * Disheera Technologies Inc.
 */

const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Career = require('../models/Career');
const whatsappService = require('../services/whatsappService');
const { generateWeeklyRoadmapPdf } = require('../services/pdfStudyMaterialService');
const { getJobsForCareer, searchLiveJobs } = require('../services/jobBoardService');
const { getGroqMentorReply } = require('../services/groqService');
const { getGeminiMentorReply } = require('../services/geminiService');
const { prisma } = require('../config/prisma');

const TICKETS_FILE = path.join(__dirname, '../data/support_tickets.json');

// In-Memory Student Context Cache (15 min TTL) to eliminate repetitive DB queries
const userContextCache = new Map();
const USER_CACHE_TTL_MS = 15 * 60 * 1000;

// Persistent Support Tickets Registry for instant tracking & Grievance SLA
const supportTicketsCache = new Map();

// Helper to persist supportTicketsCache to local disk and Supabase DB
async function persistTickets() {
  try {
    const list = Array.from(supportTicketsCache.values());
    try {
      fs.writeFileSync(TICKETS_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (fsErr) {
      console.warn('[Tickets Persist] Local file write warning:', fsErr.message);
    }

    if (prisma && prisma.youtubeCache) {
      await prisma.youtubeCache.upsert({
        where: { queryKey: 'SUPPORT_TICKETS_REGISTRY' },
        update: { videos: list },
        create: {
          id: 'support-tickets-registry',
          queryKey: 'SUPPORT_TICKETS_REGISTRY',
          videos: list,
          source: 'support_tickets_registry'
        }
      }).catch(dbErr => console.warn('[Tickets DB Persist] Supabase sync warning:', dbErr.message));
    }
  } catch (err) {
    console.warn('[Tickets Persist] Warning writing tickets:', err.message);
  }
}

// Load persisted tickets on boot
async function loadPersistedTickets() {
  try {
    // 1. Try local JSON first (instant zero latency)
    if (fs.existsSync(TICKETS_FILE)) {
      try {
        const raw = fs.readFileSync(TICKETS_FILE, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const t of list) {
            if (t && t.ticketId) {
              supportTicketsCache.set(t.ticketId, t);
            }
          }
          console.log(`[Tickets Boot] Loaded ${supportTicketsCache.size} tickets from local storage.`);
        }
      } catch (e) {
        console.warn('[Tickets Boot] Local read warning:', e.message);
      }
    }

    // 2. Fetch from Supabase PostgreSQL (survives any dyno / container restart)
    if (prisma && prisma.youtubeCache) {
      const record = await prisma.youtubeCache.findUnique({
        where: { queryKey: 'SUPPORT_TICKETS_REGISTRY' }
      }).catch(() => null);
      if (record && Array.isArray(record.videos) && record.videos.length > 0) {
        for (const t of record.videos) {
          if (t && t.ticketId) {
            supportTicketsCache.set(t.ticketId, t);
          }
        }
        console.log(`[Tickets Boot] Synchronized ${supportTicketsCache.size} tickets from Supabase DB.`);
      }
    }
  } catch (err) {
    console.warn('[Tickets Boot] Warning loading tickets:', err.message);
  }
}

// Trigger load immediately
loadPersistedTickets().catch(() => {});

// Founders & Core Leadership Contact Registry for Anonymous Two-Way Relay
const FOUNDERS_REGISTRY = [
  {
    name: 'Parth Patil',
    role: 'Founder & Chief Counselor',
    rawPhone: process.env.FOUNDER_PERSONAL_PHONE || process.env.FOUNDER_PHONE || '+919923092340',
    title: 'Lead Counselor (Parth Patil)'
  },
  {
    name: 'Suyog Pawar',
    role: 'Co-Founder & Academic Lead',
    rawPhone: process.env.COFOUNDER_PERSONAL_PHONE || process.env.SUYOG_PERSONAL_PHONE || '+917709589602',
    title: 'Senior Counselor (Co-Founder Desk - Suyog Pawar)'
  },
  {
    name: 'Sanika',
    role: 'Co-Founder & Academic Counselor',
    rawPhone: process.env.SANIKA_PERSONAL_PHONE || process.env.COFOUNDER_2_PERSONAL_PHONE || '+918983020995',
    title: 'Senior Counselor (Co-Founder Desk - Sanika)'
  }
];

function getFounders() {
  return FOUNDERS_REGISTRY.map(f => {
    const formatted = whatsappService.formatPhoneNumber(f.rawPhone);
    const digits10 = whatsappService.getPhoneDigits(formatted).slice(-10);
    return {
      ...f,
      formattedPhone: formatted,
      digits10
    };
  });
}

const FOUNDER_PHONE_RAW = process.env.FOUNDER_PERSONAL_PHONE || process.env.FOUNDER_PHONE || '+919923092340';
const FOUNDER_PHONE = whatsappService.formatPhoneNumber(FOUNDER_PHONE_RAW);
const FOUNDER_PHONE_DIGITS_10 = whatsappService.getPhoneDigits(FOUNDER_PHONE).slice(-10);

/**
 * Searches the support tickets registry for a given ticket ID, short code, or 'LAST'.
 */
function findTicket(queryId) {
  if (!queryId) return null;
  const clean = String(queryId).trim().replace(/^#/, '');

  if (clean.toUpperCase() === 'LAST') {
    const all = Array.from(supportTicketsCache.values());
    if (!all.length) return null;
    // Prioritize the latest ACTIVE / UNRESOLVED ticket so resolved tickets don't block new ones
    const latestUnresolved = all.slice().reverse().find(t => t.status !== 'RESOLVED');
    return latestUnresolved || all[all.length - 1];
  }

  // Exact match
  if (supportTicketsCache.has(clean)) {
    return supportTicketsCache.get(clean);
  }

  // Suffix/partial match (e.g. "467491" matches "CP-TKT-467491" or "CP-COUNSEL-467491")
  const upper = clean.toUpperCase();
  for (const [id, record] of supportTicketsCache.entries()) {
    const idUpper = id.toUpperCase();
    if (idUpper === upper || idUpper.endsWith(upper) || idUpper.includes(upper)) {
      return record;
    }
    // Match phone number digits
    const phoneDigits = record.phone ? whatsappService.getPhoneDigits(record.phone) : '';
    if (phoneDigits && (phoneDigits.includes(clean) || clean.includes(phoneDigits.slice(-10)))) {
      return record;
    }
    // Match student name
    if (record.studentName && record.studentName.toLowerCase().includes(clean.toLowerCase())) {
      return record;
    }
  }

  return null;
}

/**
 * Async version of findTicket with automatic database fallback lookup.
 * If server was restarted and cache was flushed, recovers student by phone / name on the fly.
 */
async function findTicketAsync(queryId) {
  let ticket = findTicket(queryId);
  if (ticket) return ticket;

  // Fallback: check if queryId matches student in User database
  try {
    const clean = String(queryId).trim().replace(/^#/, '');
    const cleanDigits = clean.replace(/\D/g, '');
    let matchedUser = null;

    if (cleanDigits.length >= 10) {
      matchedUser = await User.findOne({
        phone: { $regex: cleanDigits.slice(-10) }
      });
    } else if (clean.length >= 3) {
      matchedUser = await User.findOne({
        name: { $regex: clean, $options: 'i' }
      });
    }

    if (matchedUser) {
      const recoveredTicketId = 'CP-USR-' + (cleanDigits.slice(-6) || Math.floor(100000 + Math.random() * 900000));
      const recoveredTicket = {
        ticketId: recoveredTicketId,
        studentName: matchedUser.name,
        phone: matchedUser.phone,
        issue: 'Direct counselor query / recovered student contact',
        createdAt: new Date().toISOString(),
        status: 'OPEN_ESCALATED'
      };
      supportTicketsCache.set(recoveredTicketId, recoveredTicket);
      persistTickets().catch(() => {});
      return recoveredTicket;
    }
  } catch (err) {
    console.warn('[findTicketAsync] Fallback lookup warning:', err.message);
  }

  return null;
}

/**
 * Broadcasts an operational sync alert to all OTHER founders/mentors.
 * Keeps all 3 leaders (Parth, Suyog, Sanika) 100% in sync whenever one takes action.
 */
async function broadcastLeadershipSync({ excludePhone, message, context = 'LEADERSHIP_SYNC_BROADCAST' }) {
  try {
    const founders = getFounders();
    const excludeDigits = excludePhone ? whatsappService.getPhoneDigits(excludePhone).slice(-10) : '';

    for (const founder of founders) {
      if (founder.formattedPhone && founder.digits10 !== excludeDigits) {
        await whatsappService.sendTextMessage(founder.formattedPhone, message, {
          context,
          recipientRole: founder.role
        });
        console.log(`[Leadership Sync] Broadcast sent to ${founder.name} (${founder.formattedPhone})`);
      }
    }
  } catch (err) {
    console.warn('[Leadership Sync] Warning broadcasting to peers:', err.message);
  }
}

/**
 * Dispatches an anonymous escalation alert to the Founders' personal WhatsApp numbers.
 * The student's identity and query are sent to all founders, along with instructions
 * on how to reply secretly via the official bot without exposing their personal numbers.
 */
async function forwardAlertToFounder({ studentName, studentPhone, ticketId, type, issue, userContext }) {
  try {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const shortCode = ticketId.replace(/^CP-[A-Z]+-/, '');
    const founders = getFounders();

    const alertMessage = 
`🚨 *Disheera — Student Escalation Alert*

👤 *Student:* ${studentName}
📞 *Phone:* ${studentPhone}
🎫 *Docket ID:* #${ticketId} (Code: *#${shortCode}*)
🏷️ *Type:* ${type || 'SUPPORT'}
🎯 *Track:* ${userContext?.targetCareer || 'Engineering Track'} (Week ${userContext?.activeWeek || 1})
💬 *Query:* "${issue}"
🕒 *Time:* ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 *Student ko secretly reply karne ke liye:*
Is format me WhatsApp par reply karein:
*REPLY #${shortCode}: [Aapka message]*

_Example:_
*REPLY #${shortCode}: Hello ${studentName.split(' ')[0]}, maine aapka ticket review kar liya hai. Sham ko call pe connect karte hain.*

👉 *Or quick reply to latest ticket:*
*REPLY LAST: [Aapka message]*

🔒 *Privacy Guaranteed:* Student ko sirf Bot (+91 7499085045) dikhega. Aapka personal number 100% hidden rahega!`;

    // Dispatch alert to all registered leadership numbers (Founder & Co-Founder)
    for (const founder of founders) {
      if (founder.formattedPhone) {
        await whatsappService.sendTextMessage(founder.formattedPhone, alertMessage, {
          context: 'FOUNDER_ESCALATION_ALERT',
          ticketId,
          recipientRole: founder.role
        });
        console.log(`[Founder Relay] Escalation alert dispatched to ${founder.name} (${founder.formattedPhone}) for ticket #${ticketId}`);
      }
    }
  } catch (err) {
    console.warn('[Founder Relay] Warning dispatching alert to founders:', err.message);
  }
}

/**
 * Processes incoming WhatsApp messages from Founder or Co-Founder (+91 9923092340 / +91 7709589602).
 * Powers two-way anonymous student messaging, ticket triage, and admin controls.
 */
async function handleFounderInbound({ founder, senderPhone, incomingText, trimmed, cleanLower, quotedText }) {
  const adminName = founder?.name || 'Counselor';
  const adminRole = founder?.role || 'Leadership Team';
  const adminTitle = founder?.title || 'Senior Academic Counselor';

  console.log(`[Founder Relay] Inbound action from ${adminName} (${senderPhone}): "${trimmed}"`);

  // 1. Quoted Message Ticket Detection (Swipe-to-reply in WhatsApp)
  let quoteTicketMatch = null;
  if (quotedText) {
    const m = quotedText.match(/(?:CP-[A-Z]+-[0-9]{6}|#[0-9]{6}|[0-9]{6})/i);
    if (m) {
      quoteTicketMatch = m[0].replace(/^#/, '');
    }
  }

  // 2. Resolve / Close Ticket Command (RESOLVE #123456 or CLOSE 123456 or RESOLVE LAST)
  const resolveMatch = trimmed.match(/^(?:resolve|close|done)\b\s*(?:#|no\s*|ticket\s*)?([a-z0-9-]+)?/i);
  if (resolveMatch) {
    const targetCode = resolveMatch[1] || 'LAST';
    const ticket = await findTicketAsync(targetCode);
    if (!ticket) {
      await whatsappService.sendTextMessage(senderPhone, `❌ Ticket nahi mila: #${targetCode}. Type *TICKETS* to view active queue.`, { context: 'FOUNDER_RESOLVE_NOT_FOUND' });
      return true;
    }

    if (ticket.status === 'RESOLVED') {
      const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'recently';
      const alreadyMsg = 
`ℹ️ *Ticket Already Resolved!*

Docket #${ticket.ticketId} (${ticket.studentName}) pehle hi *${ticket.resolvedBy || 'team member'}* ne resolve kar diya hai (at ${resolvedTime}).

Sabhi open tickets dekhne ke liye *TICKETS* type karein.`;
      await whatsappService.sendTextMessage(senderPhone, alreadyMsg, { context: 'FOUNDER_ALREADY_RESOLVED' });
      return true;
    }

    ticket.status = 'RESOLVED';
    ticket.resolvedBy = adminName;
    ticket.resolvedAt = new Date().toISOString();
    persistTickets().catch(() => {});

    const shortCode = ticket.ticketId.replace(/^CP-[A-Z]+-/, '');
    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Friendly notice to student
    if (ticket.phone) {
      const studentResolvedMsg = 
`✨ *Disheera  -  Ticket Resolved*

Namaste ${ticket.studentName}! 👋
Aapka support request (#${ticket.ticketId}) successfully resolve ho gaya hai by ${adminTitle}.

Agar aapko future me koi aur guidance ya roadmap notes chahiye hon, toh bas WhatsApp par *ROADMAP*, *NOTES*, ya *SUPPORT* type karein.

🚀 *Disheera · 24x7 Verified Talent OS*`;
      await whatsappService.sendTextMessage(ticket.phone, studentResolvedMsg, { context: 'TICKET_RESOLVED_STUDENT_NOTICE' });
    }

    await whatsappService.sendTextMessage(senderPhone, `✅ Ticket #${ticket.ticketId} (${ticket.studentName}) ko *RESOLVED* mark kar diya gaya hai aur student ko confirmation bhej diya gaya hai.`, { context: 'FOUNDER_RESOLVE_CONFIRMED' });

    // Broadcast Real-Time Sync to all other mentors (Parth, Suyog, Sanika)
    const syncResolveMsg = 
`✅ *Leadership Team Sync: Ticket Resolved!*

🎫 *Docket:* #${ticket.ticketId} (Code: *#${shortCode}*)
👤 *Student:* ${ticket.studentName} (${ticket.phone})
👨‍💼 *Resolved By:* ${adminName} (${adminRole})
🕒 *Time:* ${nowTimeStr}

ℹ️ *Status:* Is student ka issue solve ho chuka hai. Baki mentors ko ispar koi action lene ki zarurat nahi hai.`;

    await broadcastLeadershipSync({
      excludePhone: senderPhone,
      message: syncResolveMsg,
      context: 'LEADERSHIP_TICKET_RESOLVED_SYNC'
    });

    return true;
  }

  // 3. Explicit Reply Command (REPLY #123456: text OR R 123456: text OR swipe-reply text)
  const replyMatch = trimmed.match(/^(?:reply|r)\b\s*(?:#|no\s*|ticket\s*)?([a-z0-9-]+)[:\s]+([\s\S]+)/i);

  if (replyMatch || (quoteTicketMatch && !trimmed.startsWith('/'))) {
    let targetCode = replyMatch ? replyMatch[1] : quoteTicketMatch;
    let replyContent = replyMatch ? replyMatch[2].trim() : trimmed;

    // Remove any leading colon/hyphen
    replyContent = replyContent.replace(/^[:\-\s]+/, '').trim();

    const ticket = await findTicketAsync(targetCode);
    if (!ticket) {
      const notFoundMsg = 
`❌ *Ticket Nahi Mila:* #${targetCode}

Kripya valid docket ID use karein ya *TICKETS* bhejkar active queue check karein.
Aap *REPLY LAST: [message]* bhi use kar sakte hain.

👉 *Direct Student Outreach Alternative:*
Aap student ke direct phone number par bhi message bhej sakte hain:
*MSG [phone]: [Aapka message]*
_Example: MSG 917498376277: Hello Aditi..._`;
      await whatsappService.sendTextMessage(senderPhone, notFoundMsg, { context: 'FOUNDER_TICKET_NOT_FOUND' });
      return true;
    }

    if (ticket.status === 'RESOLVED') {
      const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'recently';
      const warnResolvedMsg = 
`⚠️ *Notice: Ticket Already Resolved!*

Docket #${ticket.ticketId} (${ticket.studentName}) pehle hi *${ticket.resolvedBy || 'team member'}* ne resolve kar diya hai (at ${resolvedTime}).

Duplicate replies se bachne ke liye ye message send nahi kiya gaya. Agar fir bhi student ko message bhejna ho, toh use karein:
*MSG ${ticket.phone}: [aapka message]*`;
      await whatsappService.sendTextMessage(senderPhone, warnResolvedMsg, { context: 'FOUNDER_REPLY_ALREADY_RESOLVED' });
      return true;
    }

    if (!ticket.phone) {
      await whatsappService.sendTextMessage(senderPhone, `❌ Error: Ticket #${ticket.ticketId} ke sath koi phone number linked nahi hai.`, { context: 'FOUNDER_TICKET_NO_PHONE' });
      return true;
    }

    // Dispatch message to student FROM official bot (+91 7499085045)
    const studentDispatch = 
`🧑‍🏫 *Disheera  -  ${adminTitle}*

"${replyContent}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 *Docket Ref:* #${ticket.ticketId}
💬 _Aapka koi aur sawaal ho toh reply karein: *QUERY: [aapka doubt]*_

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · 24x7 Verified Talent OS*`;

    await whatsappService.sendTextMessage(ticket.phone, studentDispatch, {
      context: 'COUNSELOR_DIRECT_REPLY',
      ticketId: ticket.ticketId,
      studentName: ticket.studentName
    });

    // Update ticket status & log
    ticket.status = 'COUNSELOR_REPLIED';
    ticket.lastReply = replyContent;
    ticket.lastReplyBy = adminName;
    ticket.lastReplyAt = new Date().toISOString();
    persistTickets().catch(() => {});

    // Confirm to sender (100% reassurance of privacy)
    const confirmMsg = 
`✅ *Reply Delivered to Student!*

👤 *Student:* ${ticket.studentName}
📞 *Student Phone:* ${ticket.phone}
🎫 *Ticket:* #${ticket.ticketId}
👨‍💼 *Counselor:* ${adminName} (${adminRole})
📤 *Delivered Message:*
"${replyContent}"

🔒 *Privacy Protected:* Aapka personal number (${senderPhone}) reveal nahi hua. Message official bot (+91 7499085045) ke through bheja gaya hai.`;

    await whatsappService.sendTextMessage(senderPhone, confirmMsg, { context: 'FOUNDER_REPLY_CONFIRMED' });

    // Broadcast Real-Time Sync to all other mentors (Parth, Suyog, Sanika)
    const shortCode = ticket.ticketId.replace(/^CP-[A-Z]+-/, '');
    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const syncReplyMsg = 
`💬 *Leadership Team Sync: Counselor Replied!*

🎫 *Docket:* #${ticket.ticketId} (Code: *#${shortCode}*)
👤 *Student:* ${ticket.studentName} (${ticket.phone})
👨‍💼 *Replied By:* ${adminName} (${adminRole})
🕒 *Time:* ${nowTimeStr}
📝 *Delivered Reply:*
"${replyContent}"

ℹ️ *Status:* Handled by ${adminName}. No duplicate reply required.`;

    await broadcastLeadershipSync({
      excludePhone: senderPhone,
      message: syncReplyMsg,
      context: 'LEADERSHIP_COUNSELOR_REPLY_SYNC'
    });

    return true;
  }

  // 4. Direct Message to Any Phone or Email (MSG 9876543210: message OR MSG student@email.com: message)
  const dmMatch = trimmed.match(/^(?:msg|send|dm)\s*([^\s:]+)[:\s]+([\s\S]+)/i);
  if (dmMatch) {
    const targetIdentifier = dmMatch[1].trim();
    const targetMsg = dmMatch[2].trim();

    let targetPhone = '';
    let studentName = 'Student';

    // If identifier is an email address
    if (targetIdentifier.includes('@')) {
      try {
        const studentUser = await User.findOne({ email: targetIdentifier.toLowerCase() });
        if (studentUser && studentUser.phone) {
          targetPhone = studentUser.phone;
          studentName = studentUser.name || 'Student';
        } else {
          const failMsg = `❌ Student Not Found: Database me "${targetIdentifier}" ke sath koi student ya WhatsApp number linked nahi mila.\n\nTip: Aap direct phone number par message bhej sakte hain:\n*MSG [10-digit number]: [message]*`;
          await whatsappService.sendTextMessage(senderPhone, failMsg, { context: 'FOUNDER_DM_USER_NOT_FOUND' });
          return true;
        }
      } catch (err) {
        console.warn('[Founder DM] Email lookup error:', err.message);
      }
    } else {
      targetPhone = targetIdentifier;
      try {
        const digits10 = whatsappService.getPhoneDigits(targetPhone).slice(-10);
        const studentUser = await User.findOne({
          phone: { $in: [targetPhone, `+91${digits10}`, digits10] }
        });
        if (studentUser && studentUser.name) {
          studentName = studentUser.name;
        }
      } catch (e) {
        console.warn('[whatsappController] Could not resolve student name by phone:', e.message);
      }
    }

    const formattedTarget = whatsappService.formatPhoneNumber(targetPhone);
    if (!formattedTarget) {
      await whatsappService.sendTextMessage(senderPhone, `❌ Invalid Phone Number: "${targetIdentifier}". Kripya 10-digit number enter karein.`, { context: 'FOUNDER_DM_INVALID_PHONE' });
      return true;
    }

    const outreachTicketId = 'CP-MSG-' + Math.floor(100000 + Math.random() * 900000);
    const outreachRecord = {
      ticketId: outreachTicketId,
      studentName,
      phone: formattedTarget,
      type: 'DIRECT_MENTOR_OUTREACH',
      issue: targetMsg,
      createdAt: new Date().toISOString(),
      status: 'SENT_BY_MENTOR',
      counselor: adminName
    };
    supportTicketsCache.set(outreachTicketId, outreachRecord);
    persistTickets().catch(() => {});

    const studentDispatch = 
`🧑‍🏫 *Disheera  -  Official Mentor Message*

"${targetMsg}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 *From:* ${adminTitle}
🎫 *Docket Ref:* #${outreachTicketId}
💬 _Aap is message ka direct WhatsApp reply karke mentor se connect kar sakte hain!_

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · 24x7 Verified Talent OS*`;

    await whatsappService.sendTextMessage(formattedTarget, studentDispatch, {
      context: 'FOUNDER_DIRECT_OUTREACH',
      ticketId: outreachTicketId,
      studentName
    });

    const confirmOutreach = 
`✅ *Direct Message Delivered to Student!*

👤 *Student:* ${studentName}
📞 *Target Phone:* ${formattedTarget}
🎫 *Docket Created:* #${outreachTicketId}
👨‍💼 *Sent By:* ${adminTitle}
📤 *Delivered Message:*
"${targetMsg}"

🔒 *Privacy Protected:* Aapka personal number (${senderPhone}) reveal nahi hua. Message official bot (+91 7499085045) ke through bheja gaya hai. Jab student reply karega, aapko yahan alert mil jayega!`;

    await whatsappService.sendTextMessage(senderPhone, confirmOutreach, { context: 'FOUNDER_DM_CONFIRMED' });
    return true;
  }

  // 5. Student Lookup Command (FIND rahul OR LOOKUP rahul@gmail.com)
  const findMatch = trimmed.match(/^(?:find|search|lookup)\s+(.+)/i);
  if (findMatch) {
    const searchParam = findMatch[1].trim();
    try {
      const isEmail = searchParam.includes('@');
      let matches = [];
      if (isEmail) {
        const u = await User.findOne({ email: searchParam.toLowerCase() });
        if (u) matches = [u];
      } else {
        matches = await User.find({
          $or: [
            { name: { $regex: searchParam, $options: 'i' } },
            { phone: { $regex: searchParam } }
          ]
        }).limit(5);
      }

      if (matches.length === 0) {
        await whatsappService.sendTextMessage(senderPhone, `🔍 Koi student nahi mila with query: "${searchParam}".\n\nAap direct phone number par message bhej sakte hain:\n*MSG [10-digit number]: [message]*`, { context: 'FOUNDER_LOOKUP_EMPTY' });
        return true;
      }

      const matchStr = matches.map(u => 
        `• *${u.name || 'Candidate'}*\n  📞 Phone: ${u.phone || 'Not linked'}\n  📧 Email: ${u.email || 'N/A'}`
      ).join('\n\n');

      const lookupReply = 
`🔍 *Disheera  -  Student Lookup Results*

${matchStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 Message bhejne ke liye copy karein:
*MSG [phone]: [Aapka message]*`;

      await whatsappService.sendTextMessage(senderPhone, lookupReply, { context: 'FOUNDER_LOOKUP_RESULTS' });
      return true;
    } catch (searchErr) {
      console.warn('[Founder Lookup] Search warning:', searchErr.message);
    }
  }

  // 5. Active Queue & Pending Tickets (TICKETS / PENDING / QUEUE / STATUS / LIST / TICKETS ALL)
  if (/^(tickets|pending|queue|status|list|open|history)\b/i.test(cleanLower)) {
    const allTickets = Array.from(supportTicketsCache.values());
    const showAll = cleanLower.includes('all') || cleanLower.includes('history');
    const displayTickets = showAll ? allTickets : allTickets.filter(t => t.status !== 'RESOLVED');

    if (displayTickets.length === 0) {
      const emptyMsg = 
`📋 *Disheera  -  Leadership Admin Queue*

Sabhi tickets clear hain! Currently koi pending student escalation nahi hai. 🎉

• Jab bhi koi student doubt ya counselor request bhejega, bot sabhi 3 mentors (Parth, Suyog, Sanika) ko turant alert karega.
• Past/Resolved tickets dekhne ke liye: *TICKETS ALL*
• Kisi student ko message bhejne ke liye: *MSG [phone]: [message]*
• AI mentor testing ke liye: *TEST: [sawal]*`;
      await whatsappService.sendTextMessage(senderPhone, emptyMsg, { context: 'FOUNDER_EMPTY_QUEUE' });
      return true;
    }

    const listStr = displayTickets.slice(-6).map(t => {
      const shortCode = t.ticketId.replace(/^CP-[A-Z]+-/, '');
      const timeStr = t.createdAt ? new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
      let statusTag = `*${t.status}*`;
      if (t.status === 'RESOLVED') {
        statusTag = `✅ *RESOLVED by ${t.resolvedBy || 'Mentor'}*`;
      } else if (t.status === 'COUNSELOR_REPLIED') {
        statusTag = `💬 *REPLIED by ${t.lastReplyBy || 'Mentor'}*`;
      }
      return `• *#${shortCode}* [${t.type || 'SUPPORT'}]\n  👤 ${t.studentName} (${t.phone})\n  💬 "${t.issue}"\n  🕒 ${timeStr} · Status: ${statusTag}`;
    }).join('\n\n');

    const queueHeader = showAll 
      ? `📋 *Disheera  -  Leadership Admin Queue (All Recent)*` 
      : `📋 *Disheera  -  Leadership Admin Queue (${displayTickets.length} Active Pending)*`;

    const queueMsg = 
`${queueHeader}

${listStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 *Student ko reply karne ke liye:*
*REPLY #[code]: [Aapka message]*

👉 *Ticket close karne ke liye:*
*RESOLVE #[code]* ya *RESOLVE LAST*

👉 *Quick reply to latest active:*
*REPLY LAST: [Aapka message]*`;

    await whatsappService.sendTextMessage(senderPhone, queueMsg, { context: 'FOUNDER_TICKET_QUEUE' });
    return true;
  }

  // 6. Founder Emulation Mode (TEST: ... or STUDENT: ...)
  if (cleanLower.startsWith('test:') || cleanLower.startsWith('student:')) {
    return false; // Proceed to student bot flow
  }

  // 7. Founder Admin Help & Command Guide
  const helpMsg = 
`👑 *Disheera  -  Leadership Admin & Counselor Console*

Namaste ${adminName}! 🚀
Aapka number (*${senderPhone}*) as ${adminRole} verified hai.

📋 *Admin Commands Reference:*
• *TICKETS* ➔ Pending student escalations ki list dekhein
• *REPLY #[code]: [message]* ➔ Student ko secretly reply karein (Aapka number reveal nahi hoga)
• *REPLY LAST: [message]* ➔ Sabse latest ticket wale student ko reply karein
• *RESOLVE #[code]* ➔ Ticket resolve mark karein aur student ko notice bhejein
• *MSG [phone or email]: [message]* ➔ Kisi bhi student ko official bot se direct message bhejein
• *FIND [name or email]* ➔ Database me student ka phone number aur email search karein
• *TEST: [sawal]* ➔ Normal student AI mentor responses test karein

🔒 *Privacy:* Student ko aapka number kabhi nahi dikhega. Sabhi messages Disheera ke official Bot (*+91 7499085045*) se dispatch hote hain.`;

  await whatsappService.sendTextMessage(senderPhone, helpMsg, { context: 'FOUNDER_ADMIN_MENU' });
  return true;
}

/**
 * GET /api/whatsapp/webhook
 * Meta WhatsApp Cloud API verification handshake.
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'careerpath_ai_whatsapp_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Handshake verified successfully.');
    const safeChallenge = typeof challenge === 'string' ? challenge.trim() : '';
    if (!/^[a-zA-Z0-9_-]+$/.test(safeChallenge)) {
      return res.status(400).send('Invalid challenge');
    }
    res.set('Content-Type', 'text/plain');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(safeChallenge);
  }

  console.warn('[WhatsApp Webhook] Verification token mismatch.');
  return res.status(403).json({ error: 'Verification token mismatch' });
};

/**
 * POST /api/whatsapp/webhook
 * Unified message receiver for both Meta Cloud API & OpenWA / Baileys bridge.
 * Evaluates student query, enriches with active roadmap context, and dispatches AI guidance.
 */
const handleIncomingWebhook = async (req, res) => {
  // Acknowledge webhook immediately to prevent gateway timeouts
  res.status(200).json({ status: 'received' });

  try {
    const body = req.body || {};
    const event = body.event || 'message.received';

    // ── EVENT HANDLER 1: Voice Call Auto-Responder (call.received / call.missed) ──
    if (event === 'call.received' || event === 'call.missed') {
      const caller = body.data?.senderPhone || body.data?.from || body.from || body.phone;
      if (caller) {
        const formattedCaller = whatsappService.formatPhoneNumber(caller);
        console.log(`[WhatsApp Webhook] Incoming call event (${event}) from ${formattedCaller}. Dispatching automated guidance notice.`);
        try {
          await whatsappService.sendTextMessage(
            formattedCaller,
            `📞 *Disheera  -  Automated Assistant Notice*\n\nNamaste! Yeh hamara 24x7 automated AI Career Assistant number hai. Hum live voice calls attend nahi kar sakte.\n\nKripya apna sawal ya career doubt yahan *WhatsApp text message* me bhejiye ya hamari website par visit karein:\n👉 https://disheera.site\n\nHum turant aapko verified roadmap aur guidance reply bhej denge! 🚀`
          );
        } catch (callReplyErr) {
          console.warn('[WhatsApp Webhook] Failed to dispatch call auto-response:', callReplyErr.message);
        }
      }
      return;
    }

    // ── EVENT HANDLER 2: Delivery Failure Alert & Fallback Hook (message.failed) ──
    if (event === 'message.failed') {
      console.warn('⚠️ [WhatsApp Webhook] Outbound message delivery failed:', {
        to: body.data?.to || body.to,
        error: body.data?.error || body.error,
        messageId: body.data?.messageId || body.messageId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ── EVENT HANDLER 3: Session Disconnection Monitor (session.disconnected) ──
    if (event === 'session.disconnected') {
      console.error('🚨 [CRITICAL ALERT] WhatsApp Gateway Session Disconnected:', {
        sessionId: body.sessionId,
        reason: body.data?.reason || body.reason || 'Unknown',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ── EVENT HANDLER 4: Delivery Receipts & Read Ticks (message.ack) ──
    if (event === 'message.ack') {
      console.log(`[WhatsApp Webhook] Delivery receipt ACK: ${body.data?.messageId || body.messageId} | Status: ${body.data?.ack || body.ack}`);
      return;
    }

    // 1. Extract message & sender phone from Meta or OpenWA payload
    let rawSender = '';
    let incomingText = '';
    let pushSenderName = '';
    let isVoiceInput = false;

    // A. OpenWA standard webhook envelope: { event: "message.received", data: { from, body, fromMe, senderPhone, chatId, senderName } }
    if (body.event === 'message.received' && body.data) {
      if (body.data.fromMe === true) {
        return; // Ignore outbound echoes to prevent infinite reply loops
      }
      rawSender = body.data.senderPhone || body.data.from || body.data.chatId || '';
      
      const msgType = String(body.data.type || body.data.messageType || body.data.kind || body.data.mediaType || body.data.lastMessageType || '').toLowerCase();
      const msgMime = String(body.data.mimetype || '').toLowerCase();
      
      isVoiceInput = msgType === 'audio' || 
                     msgType === 'ptt' || 
                     msgType === 'voice' || 
                     msgType.includes('audio') || 
                     msgType.includes('voice') || 
                     msgMime.includes('audio') || 
                     msgMime.includes('ogg') || 
                     Boolean(body.data.isVoice) ||
                     Boolean(body.data.ptt);

      incomingText = body.data.body || body.data.text || body.data.caption || '';
      if (!incomingText.trim()) {
        if (isVoiceInput) {
          incomingText = 'Student sent a WhatsApp Voice Note asking for personalized career advice, roadmap guidance, and high-demand skills to learn.';
        } else {
          incomingText = 'Student connected via WhatsApp asking for personalized career guidance and roadmap milestones.';
        }
      }
      pushSenderName = body.data.senderName || body.data.name || '';
    }
    // B. Meta WhatsApp Cloud API structure
    else if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = body.entry[0].changes[0].value.messages[0];
      rawSender = msg.from; // e.g. "919876543210"
      if (msg.type === 'text') {
        incomingText = msg.text?.body || '';
      } else if (msg.type === 'audio' || msg.type === 'voice') {
        isVoiceInput = true;
        incomingText = 'Student sent a WhatsApp Voice Note asking for personalized career guidance and next steps.';
      } else {
        incomingText = `Student sent a ${msg.type || 'media'} message asking for career mentorship.`;
      }
    } 
    // C. OpenWA / Baileys bridge flat structure
    else if (body.from || body.phone) {
      if (body.fromMe === true) {
        return;
      }
      rawSender = body.from || body.phone;
      const msgType = String(body.type || body.messageType || body.kind || body.lastMessageType || '').toLowerCase();
      const msgMime = String(body.mimetype || '').toLowerCase();
      isVoiceInput = msgType === 'audio' || 
                     msgType === 'ptt' || 
                     msgType === 'voice' || 
                     msgType.includes('audio') || 
                     msgType.includes('voice') || 
                     msgMime.includes('audio') || 
                     msgMime.includes('ogg') || 
                     Boolean(body.isVoice) ||
                     Boolean(body.ptt);

      incomingText = body.text || body.body || body.message || body.caption || '';
      if (!incomingText.trim()) {
        if (isVoiceInput) {
          incomingText = 'Student sent a WhatsApp Voice Note asking for personalized career guidance and roadmap milestones.';
        } else {
          incomingText = 'Student connected via WhatsApp asking for career mentorship.';
        }
      }
      pushSenderName = body.senderName || body.name || '';
    }

    if (!rawSender) {
      return; // Ignore notifications without sender
    }

    const senderPhone = whatsappService.formatPhoneNumber(rawSender);
    const digitsOnly = whatsappService.getPhoneDigits(senderPhone);
    const last10Digits = digitsOnly.slice(-10);

    console.log(`[WhatsApp Incoming] From: ${senderPhone} | Voice Note: ${isVoiceInput} | Query: "${incomingText}"`);

    // ── FOUNDER & LEADERSHIP ANONYMOUS RELAY ENGINE ──
    const founders = getFounders();
    const matchedFounder = founders.find(f => f.digits10 === last10Digits);
    const isFounder = Boolean(matchedFounder);
    if (isFounder) {
      let quotedText = '';
      if (body.data?.quotedMsg) {
        quotedText = body.data.quotedMsg.body || body.data.quotedMsg.text || body.data.quotedMsg.caption || '';
      } else if (body.quotedMsg) {
        quotedText = body.quotedMsg.body || body.quotedMsg.text || body.quotedMsg.caption || '';
      }

      const handled = await handleFounderInbound({
        founder: matchedFounder,
        senderPhone,
        incomingText,
        trimmed: (incomingText || '').trim(),
        cleanLower: (incomingText || '').trim().toLowerCase(),
        quotedText
      });

      if (handled !== false) {
        return;
      }
      // If leadership typed "TEST: ...", remove prefix and proceed to student AI mentor flow
      incomingText = incomingText.replace(/^(test|student):\s*/i, '');
    }

    // 2. Locate student in database (with in-memory cache to eliminate repetitive DB latency)
    let userContext = null;
    const cachedContext = userContextCache.get(senderPhone);
    if (cachedContext && (Date.now() - cachedContext.timestamp < USER_CACHE_TTL_MS)) {
      userContext = cachedContext.data;
      console.log(`[WhatsApp Context] Cache HIT for ${senderPhone} (0ms DB latency)`);
    } else {
      let student = null;
      try {
        student = await User.findOne({
          phone: { $in: [senderPhone, `+91${last10Digits}`, last10Digits] }
        });
      } catch (dbErr) {
        console.warn('[WhatsApp Controller] User phone lookup warning:', dbErr.message);
      }

      // 3. Construct AI Mentor Context
      userContext = {
        name: student ? student.name : (pushSenderName || 'Ambitious Candidate'),
        isRegistered: Boolean(student),
        degree: student?.education?.degree || student?.education?.course || 'Student',
        targetCareer: 'Full Stack Engineer',
        activeWeek: 1,
        skills: student?.skills?.map(s => s.name || s) || []
      };

      // If student exists, fetch their active roadmap for rich contextual grounding
      if (student) {
        try {
          const activeRoadmap = await Roadmap.findOne({
            user: student._id || student.id,
            status: 'active'
          });

          if (activeRoadmap) {
            userContext.activeWeek = activeRoadmap.currentWeek || 1;
            if (activeRoadmap.career) {
              const careerDoc = await Career.findById(activeRoadmap.career);
              if (careerDoc) {
                userContext.targetCareer = careerDoc.title;
              }
            }
          }
        } catch (rmErr) {
          console.warn('[WhatsApp Controller] Roadmap context lookup warning:', rmErr.message);
        }
      }

      // Store in memory cache
      userContextCache.set(senderPhone, {
        data: userContext,
        timestamp: Date.now()
      });
    }

    // ── VOICE FEATURE REMOVAL: Graceful Text Notice for Audio/Voice Messages ──
    if (isVoiceInput) {
      console.log(`[WhatsApp Incoming] Audio message received from ${senderPhone}. Dispatching text support notice.`);
      const voiceNotice = 
`🎙️ *Audio Message Received*

Namaste ${userContext.name}! 👋
Yeh automated WhatsApp service voice notes ya audio messages process nahi karti.

Kripya apna sawal ya issue yahan *WhatsApp text message* me bhejiye:
• Type *SUPPORT* ➔ Grievance Desk & Ticket Reference
• Type *ROADMAP* ➔ Current Week ${userContext.activeWeek} Milestones
• Type *NOTES* ➔ Download Weekly Study Notes PDF

📞 Official WhatsApp Support: +91 74990 85045 (Chat Only)
✉️ Official Grievance: parthpatil@disheera.site
🌐 Portal: https://disheera.site

🚀 Disheera · Your 24x7 Career GPS`;

      await whatsappService.sendTextMessage(senderPhone, voiceNotice, {
        context: 'AUDIO_INPUT_NOTICE',
        studentName: userContext.name
      });
      return;
    }

    const trimmed = (incomingText || '').trim();
    const cleanLower = trimmed.toLowerCase();

    // ── SUPPORT SYSTEM ROUTER: Instant Human & Grievance Support Desk ──
    const isSupportKeyword = /^(support|help|madad|contact|grievance|complaint|issue|problem|human|agent|officer|admin|customercare|customer\s*care|ticket|helpline|desk)\b/i.test(cleanLower) ||
                             cleanLower.startsWith('/support') ||
                             cleanLower.startsWith('!support') ||
                             cleanLower.includes('contact support') ||
                             cleanLower.includes('help desk') ||
                             cleanLower.includes('parth patil') ||
                             cleanLower.includes('support chahiye');

    const isTicketCreation = cleanLower.startsWith('ticket:') || 
                             cleanLower.startsWith('issue:') || 
                             cleanLower.startsWith('problem:') || 
                             cleanLower.startsWith('complaint:') ||
                             cleanLower === '5';

    // 1. Support Ticket Registration
    if (isTicketCreation) {
      const issueDetails = trimmed.replace(/^(ticket|issue|problem|complaint):\s*/i, '').trim();
      const ticketId = 'CP-TKT-' + Math.floor(100000 + Math.random() * 900000);
      
      const ticketRecord = {
        ticketId,
        studentName: userContext.name,
        phone: senderPhone,
        issue: issueDetails || 'General Support & Grievance Request',
        targetCareer: userContext.targetCareer,
        activeWeek: userContext.activeWeek,
        createdAt: new Date().toISOString(),
        status: 'OPEN_ESCALATED'
      };

      supportTicketsCache.set(ticketId, ticketRecord);
      persistTickets().catch(() => {});
      console.log(`[Support Desk] New Ticket Registered: ${ticketId} for ${senderPhone}: "${issueDetails}"`);

      // Alert Founder secretly on personal WhatsApp
      await forwardAlertToFounder({
        studentName: userContext.name,
        studentPhone: senderPhone,
        ticketId,
        type: 'PRIORITY_SUPPORT_TICKET',
        issue: issueDetails || 'General Support & Grievance Request',
        userContext
      });

      const ticketReply = 
`🎫 *Disheera  -  Support Ticket Registered*

• *Ticket ID:* #${ticketId}
• *Student:* ${userContext.name} (${senderPhone})
• *Status:* Priority Open · Dispatched to Grievance Desk
• *Assigned Officer:* Parth Patil (Technical & Grievance Lead)
• *Official WhatsApp:* +91 74990 85045 (Chat Only)
• *Grievance Email:* parthpatil@disheera.site
• *Statutory SLA:* Within 24 Hours (DPDP Act 2023 & IT Rules 2021)
• *Campus Location:* GHRCEM, Jalgaon, Maharashtra, India

${issueDetails ? `📝 *Logged Issue:* "${issueDetails}"\n\n` : ''}Aapka ticket confirm ho gaya hai. Grievance Officer review karke jald hi revert karenge!

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, ticketReply, {
        context: 'SUPPORT_TICKET_CONFIRMATION',
        studentName: userContext.name
      });
      return;
    }

    // 2. Instant Category Quick Responders (Option 1, 2, 3, 4)
    if (cleanLower === '1' || cleanLower === 'otp' || cleanLower === 'login') {
      const otpHelpReply = 
`🔐 *Disheera  -  Login & Dual-OTP Support*

Namaste ${userContext.name}! Agar aapko OTP ya login me issue aa raha hai:

1. *Dual Verification Check:*
   • Platform par Gmail aur WhatsApp *dono* par alag 6-digit codes aate hain.
   • Dono codes enter karna required hai.

2. *WhatsApp OTP Delivery:*
   • Kripya 10-digit number bina leading 0 ke enter karein.
   • WhatsApp par code instantly (< 2 seconds) deliver hota hai.

3. *Gmail OTP Delivery:*
   • Apne Gmail ke *Spam* ya *Promotions* folder check karein.
   • Agar 60 seconds me na mile, toh "Resend OTP" click karein.

💬 *Still stuck?*
Bas reply karein: *TICKET: [Aapka issue]* (e.g. *TICKET: OTP nahi mila*)
Hum priority review shuru kar denge!

📞 Support WhatsApp: +91 74990 85045
✉️ Email: parthpatil@disheera.site`;

      await whatsappService.sendTextMessage(senderPhone, otpHelpReply, {
        context: 'SUPPORT_OTP_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    if (cleanLower === '2' || cleanLower === 'test' || cleanLower === 'proctor' || cleanLower === 'strike') {
      const testHelpReply = 
`⏱️ *Disheera  -  Milestone Test & Anti-Cheat Support*

Namaste ${userContext.name}! Weekly milestone tests strict server proctoring ke saath aate hain:

1. *Pass Threshold:* 70% passing score is required to advance to subsequent weeks.
2. *Proctoring Rules:*
   • Fullscreen mode is mandatory.
   • Strike 1: -2 min penalty.
   • Strike 2: -3 min penalty.
   • Strike 3: Test termination & 24-hour lockout.
3. *Emergency Reset Request:*
   • Agar genuine technical disconnect hua tha, apna registered email *parthpatil@disheera.site* par bhejiye with subject "Milestone Test Reset".

💬 *Raise Ticket:* Reply with *TICKET: Milestone reset request*
📞 WhatsApp: +91 74990 85045`;

      await whatsappService.sendTextMessage(senderPhone, testHelpReply, {
        context: 'SUPPORT_TEST_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    if (cleanLower === '3' || cleanLower === 'certificate' || cleanLower === 'cert') {
      const certHelpReply = 
`📜 *Disheera  -  Certificate & Verification Support*

Namaste ${userContext.name}! Verified digital certificates se judi jaankari:

1. *Qualification Criteria:* Complete all weekly milestone roadmaps with passing scores.
2. *Tamper-Proof Verification:* Every certificate carries an immutable SHA-256 hash.
3. *Verify Online:* Anyone can verify credentials at:
   👉 https://disheera.site/verify.html
4. *Corrections:* Name ya degree details update karne ke liye reply karein:
   *TICKET: Certificate name correction [Aapka name]*

📞 Grievance Desk WhatsApp: +91 74990 85045
✉️ parthpatil@disheera.site`;

      await whatsappService.sendTextMessage(senderPhone, certHelpReply, {
        context: 'SUPPORT_CERT_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    if (cleanLower === '4' || cleanLower === 'recruiter' || cleanLower === 'hiring') {
      const recruiterHelpReply = 
`🏢 *Disheera  -  Corporate Recruiter & Job Radar Support*

Namaste ${userContext.name}!
Corporate hiring & talent radar support:

1. *Recruiter Verification:* Free webmail (Gmail/Yahoo) is blocked; corporate work email is mandatory.
2. *4-Tier Anti-Fraud Gate:* DNS MX resolution, HTTP live probe, and OTP verification.
3. *Direct Talent Radar:* Recruiters search students based on real, verified skill badges.
4. *Campus / TPO Partnerships:* placement@disheera.site

💬 *Support Escalation:*
Reply *TICKET: Recruiter onboarding assistance*
📞 WhatsApp: +91 74990 85045`;

      await whatsappService.sendTextMessage(senderPhone, recruiterHelpReply, {
        context: 'SUPPORT_RECRUITER_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    // 3. Human Career Counselor & 1-on-1 Callback Desk
    const isCounselorKeyword = cleanLower === '6' ||
                               /^(counselor|counsellor|counseling|career\s*counselor|human\s*counselor|academic\s*counselor|callback|call\s*me|call\s*back|phone\s*support|talk\s*to\s*human|live\s*agent|expert|mentor\s*call|founder)\b/i.test(cleanLower) ||
                               cleanLower.includes('talk to human') ||
                               cleanLower.includes('human counselor') ||
                               cleanLower.includes('human support') ||
                               cleanLower.includes('call request') ||
                               cleanLower.includes('counselor chahiye') ||
                               cleanLower.includes('counselor se baat') ||
                               cleanLower.includes('founder se baat') ||
                               cleanLower.includes('parth se baat') ||
                               cleanLower.includes('parth patil');

    if (isCounselorKeyword) {
      const counselTicketId = 'CP-COUNSEL-' + Math.floor(100000 + Math.random() * 900000);
      const counselRecord = {
        ticketId: counselTicketId,
        studentName: userContext.name,
        phone: senderPhone,
        type: 'HUMAN_COUNSELOR_CALLBACK',
        issue: '1-on-1 Human Career Counseling & Callback Request',
        targetCareer: userContext.targetCareer,
        activeWeek: userContext.activeWeek,
        skills: userContext.skills,
        createdAt: new Date().toISOString(),
        status: 'PENDING_COUNSELOR_CALLBACK'
      };

      supportTicketsCache.set(counselTicketId, counselRecord);
      persistTickets().catch(() => {});
      console.log(`[Support Desk] Human Counselor Request Logged: #${counselTicketId} for ${senderPhone} (${userContext.name})`);

      // Alert Founder secretly on personal WhatsApp
      await forwardAlertToFounder({
        studentName: userContext.name,
        studentPhone: senderPhone,
        ticketId: counselTicketId,
        type: 'HUMAN_COUNSELOR_CALLBACK',
        issue: '1-on-1 Human Career Counseling & Callback Request',
        userContext
      });

      const counselReply = 
`🧑‍🏫 *Disheera  -  Human Career Counselor Desk*

Namaste ${userContext.name}! 👋
Aapki *1-on-1 Human Academic & Career Counseling* request register ho gayi hai:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 *Counseling Docket:* #${counselTicketId}
👤 *Student:* ${userContext.name} (${senderPhone})
🎯 *Target Track:* ${userContext.targetCareer} (Roadmap Week ${userContext.activeWeek})
👨‍💼 *Lead Counselor:* Parth Patil & GHRCEM Senior Mentors
🕒 *Callback Window:* Within 2 to 4 business hours (10 AM – 7 PM IST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *What happens next?*
1. Hamare senior academic advisor aapke WhatsApp number par directly connect karenge.
2. Agar aapko koi specific question, portfolio link, ya resume review karwana hai, toh bas reply karein:
   👉 *QUERY: [Aapka doubt ya portfolio link]*

✉️ *Direct Counselor Email:*
parthpatil@disheera.site

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, counselReply, {
        context: 'COUNSELOR_REQUEST_CONFIRMATION',
        studentName: userContext.name
      });
      return;
    }

    // 4. Student Counselor Query Logger (QUERY: ... / DOUBT: ...)
    const isQueryLogging = cleanLower.startsWith('query:') || cleanLower.startsWith('doubt:') || cleanLower.startsWith('sawal:');
    if (isQueryLogging) {
      const queryContent = trimmed.replace(/^(query|doubt|sawal):\s*/i, '').trim();
      const queryTicketId = 'CP-QRY-' + Math.floor(100000 + Math.random() * 900000);

      const queryRecord = {
        ticketId: queryTicketId,
        studentName: userContext.name,
        phone: senderPhone,
        type: 'STUDENT_COUNSELOR_QUERY',
        issue: queryContent || 'Student Counseling Doubt',
        targetCareer: userContext.targetCareer,
        activeWeek: userContext.activeWeek,
        createdAt: new Date().toISOString(),
        status: 'LOGGED_FOR_COUNSELOR_REVIEW'
      };

      supportTicketsCache.set(queryTicketId, queryRecord);
      persistTickets().catch(() => {});
      console.log(`[Support Desk] Student Query Logged: #${queryTicketId} for ${senderPhone}: "${queryContent}"`);

      // Alert Founder secretly on personal WhatsApp
      await forwardAlertToFounder({
        studentName: userContext.name,
        studentPhone: senderPhone,
        ticketId: queryTicketId,
        type: 'STUDENT_COUNSELOR_QUERY',
        issue: queryContent || 'Student Counseling Doubt',
        userContext
      });

      const queryReply = 
`📝 *Disheera  -  Counselor Query Docketed*

Namaste ${userContext.name}! 
Aapka doubt hamare lead career counselor ke priority review docket me add kar diya gaya hai:

• *Docket ID:* #${queryTicketId}
• *Logged Doubt:* "${queryContent}"
• *Assigned Officer:* Parth Patil (Technical & Grievance Lead)
• *Status:* Priority Review Active

Hum is query ka specific roadmap solution lekar aapse WhatsApp par revert karenge!

🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, queryReply, {
        context: 'COUNSELOR_QUERY_LOGGED',
        studentName: userContext.name
      });
      return;
    }

    // 5. Active Tickets & Status Inquiries
    const isStatusKeyword = cleanLower === '7' || 
                            cleanLower === 'status' || 
                            cleanLower === 'my ticket' || 
                            cleanLower === 'ticket status' ||
                            cleanLower === 'check ticket';

    if (isStatusKeyword) {
      const userTickets = [];
      for (const [id, record] of supportTicketsCache.entries()) {
        if (record.phone === senderPhone) {
          userTickets.push(record);
        }
      }

      let statusReply = '';
      if (userTickets.length === 0) {
        statusReply = 
`🔍 *Disheera  -  Support Ticket Status*

Namaste ${userContext.name}!
Aapke phone number (${senderPhone}) se koi open support ticket ya counselor request pending nahi hai.

📋 *Quick Actions:*
• Support menu ke liye type karein: *SUPPORT*
• Naya ticket raise karne ke liye: *TICKET: [Aapka issue]*
• Human counselor callback ke liye: *COUNSELOR*

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · 24x7 Verified Talent OS*`;
      } else {
        const ticketListStr = userTickets.slice(-3).map(t => 
          `• *#${t.ticketId}* (${t.type || 'SUPPORT'})\n  Issue: "${t.issue}"\n  Status: ${t.status || 'ACTIVE'}\n  Date: ${new Date(t.createdAt).toLocaleDateString('en-IN')}`
        ).join('\n\n');

        statusReply = 
`🔍 *Disheera  -  Aapke Active Tickets*

Namaste ${userContext.name}! 
Aapke phone (${senderPhone}) se associated active requests:

${ticketListStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Grievance Officer (Parth Patil) in sabhi requests par actively work kar rahe hain. Urgent escalation ke liye email karein: *parthpatil@disheera.site*.

🚀 *Disheera · 24x7 Verified Talent OS*`;
      }

      await whatsappService.sendTextMessage(senderPhone, statusReply, {
        context: 'TICKET_STATUS_INQUIRY',
        studentName: userContext.name
      });
      return;
    }

    // 6. General Support Protocol Menu
    if (isSupportKeyword) {
      const supportMenuReply = 
`🛠️ *Disheera  -  Official Support & Grievance Desk*

Namaste ${userContext.name}! 👋
Disheera Support System me aapka swagat hai:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *OFFICIAL SUPPORT CHANNELS:*
• *WhatsApp Support:* +91 74990 85045
  _(Chat Only · 24x7 Active Ticket Logging · No Voice Calls)_
• *Grievance Email:* parthpatil@disheera.site
• *Grievance Officer:* Parth Patil
• *Location:* GHRCEM, Jalgaon, Maharashtra, India
• *Response SLA:* Within 24 Hours (DPDP Act 2023 & IT Rules 2021)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *REPLY WITH A NUMBER FOR INSTANT HELP:*

*1* ➔ *Login & Dual-OTP Help* (Gmail / WhatsApp verification)
*2* ➔ *Milestone Test & Anti-Cheat* (Strikes, retakes & lockout)
*3* ➔ *Certificate & SHA-256 Ledger* (Verification & corrections)
*4* ➔ *Recruiter Portal & Hiring Radar* (Company verification)
*5* ➔ *Raise Priority Support Ticket* (Direct escalation to Parth Patil)
*6* ➔ *Human Career Counselor & 1-on-1 Callback* (Direct call with senior mentor)
*7* ➔ *Check My Active Tickets & Status* (Review your logged requests)

💬 _Quick Commands:_
• *JOBS* ➔ Live tech openings & internships
• *NOTES* ➔ Download week's study cheatsheet PDF
• *ROADMAP* ➔ Week ${userContext.activeWeek} milestones
• *PASSPORT* ➔ Verified skill badges
• *QUIZ* ➔ Proctored milestone test
• *RESUME* ➔ AI ATS Resume Builder
• *INTERVIEW* ➔ AI Mock Interview prep
• *COUNSELOR* ➔ 1-on-1 human guidance callback
• *TICKET: [your issue]* ➔ Open instant priority ticket
• *QUERY: [your doubt]* ➔ Docket technical question for mentor

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, supportMenuReply, {
        context: 'SUPPORT_MENU',
        studentName: userContext.name
      });
      return;
    }

    // ── ACTIVE MENTOR CONVERSATION ROUTER ──
    // If student is directly responding to a mentor outreach or active counselor discussion
    let activeOutreachTicket = null;
    for (const [id, rec] of supportTicketsCache.entries()) {
      if (rec.phone === senderPhone && (rec.status === 'SENT_BY_MENTOR' || rec.status === 'COUNSELOR_REPLIED')) {
        activeOutreachTicket = rec;
      }
    }

    const isFeatureCommand = /^(menu|help|commands?|features?|actions?|jobs?|careers?|internships?|vacanc(y|ies)|hiring|openings?|roadmap|plan|syllabus|curriculum|milestones?|week|notes|cheatsheet|pdf|study|material|handout|passport|skills?|badges?|credentials?|quiz|code|challenge|exam|chamber|resume|cv|ats|portfolio|resumebuilder|interview|mock|prep|practice|eval|readiness)\b/i.test(cleanLower) ||
                             cleanLower.startsWith('/') || cleanLower.startsWith('!') || cleanLower === '?';

    if (activeOutreachTicket && !isSupportKeyword && !isTicketCreation && !isCounselorKeyword && !isFeatureCommand) {
      activeOutreachTicket.status = 'STUDENT_REPLIED';
      activeOutreachTicket.lastReply = incomingText;
      activeOutreachTicket.lastReplyAt = new Date().toISOString();

      await forwardAlertToFounder({
        studentName: userContext.name,
        studentPhone: senderPhone,
        ticketId: activeOutreachTicket.ticketId,
        type: 'STUDENT_REPLY_TO_MENTOR',
        issue: incomingText,
        userContext
      });

      const ackNotice = 
`🧑‍🏫 *Disheera  -  Mentor Desk*

Namaste ${userContext.name}!
Aapka reply mentor ko forward kar diya gaya hai. Vo jald hi aapse yahan connect karenge!

🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, ackNotice, {
        context: 'STUDENT_REPLY_FORWARDED',
        studentName: userContext.name
      });
      return;
    }

    // ── SMART UNREGISTERED STUDENT ONBOARDING ROUTER ──
    // Welcomes new unlinked users sending greetings with instant portal registration instructions
    if (!userContext.isRegistered && /^(hi|hii|hiii|hello|hey|namaste|start|\/start)\b/i.test(cleanLower)) {
      const welcomeOnboardingMsg = 
`👋 *Namaste ${userContext.name}! Disheera me aapka swagat hai!*

Aapka yeh WhatsApp number hamare main portal par abhi *Registered / Linked* nahi hai.

🎯 *Disheera kya hai?*
Yeh Bharat ka 1st Autonomous Career GPS platform hai — jo aapko personalized 12-week roadmap, live coding milestones, verified skill certificates aur top tech recruiters se connect karwata hai!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *Quick Next Steps:*

1️⃣ *Free Student Account Banayein (1 Minute):*
👉 https://disheera.site
_(Website par sign up karke apna yeh WhatsApp number link karein)_

2️⃣ *AI Career Mentor se Sawal Poochhein:*
Aap koi bhi tech career sawal yahan type kar sakte hain:
• *"Web development kaise start karein?"*
• *"Python vs Java for freshers"*

3️⃣ *1-on-1 Human Counselor Callback:*
Senior mentor se seedha call connect karne ke liye reply karein:
👉 *COUNSELOR*

4️⃣ *Support Desk Menu:*
Sabhi options dekhne ke liye reply karein:
👉 *SUPPORT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, welcomeOnboardingMsg, {
        context: 'UNREGISTERED_WELCOME_ONBOARDING',
        studentName: userContext.name
      });
      return;
    }

    // ── WEBSITE FEATURE INTEGRATION: DISHEERA COMMAND MENU ──
    const isMenuKeyword = /^(menu|help|commands?|features?|actions?|\/menu|\/help|\?)\b/i.test(cleanLower) ||
                          (userContext.isRegistered && /^(hi|hii|hiii|hello|hey|namaste|start|\/start)\b/i.test(cleanLower));
    if (isMenuKeyword) {
      const menuReply = 
`🚀 *Disheera  -  WhatsApp Commands Menu*

Namaste ${userContext.name}! 👋
Aap Disheera ke platform features seedha WhatsApp par use kar sakte hain:

💼 *JOBS* ➔ Top verified tech jobs & internships in India
🗺️ *ROADMAP* ➔ Week ${userContext.activeWeek} milestones & key topics
📚 *NOTES* ➔ Download Week ${userContext.activeWeek} Cheatsheet PDF instantly
🛡️ *PASSPORT* ➔ Verified skill badges & cryptographic credentials
🧪 *QUIZ* ➔ Weekly milestone test & anti-cheat Code Chamber
📄 *RESUME* ➔ AI ATS Resume Builder & scoring tips
🎙️ *INTERVIEW* ➔ AI Mock Interview prep & readiness score
🧑‍🏫 *COUNSELOR* ➔ Request 1-on-1 human mentor callback
🛠️ *SUPPORT* ➔ Grievance Redressal Desk & ticket tracking

💬 _Tip: Aap koi bhi technical ya career sawal direct yahan type kar sakte hain, humara 24x7 AI Mentor turant guidance dega!_

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · Your 24x7 Career GPS*`;

      await whatsappService.sendTextMessage(senderPhone, menuReply, {
        context: 'DISHEERA_COMMANDS_MENU',
        studentName: userContext.name
      });
      return;
    }

    // ── WEBSITE FEATURE INTEGRATION: LIVE JOB RADAR ──
    const isJobKeyword = /^(jobs?|careers?|internships?|vacanc(y|ies)|hiring|openings?)\b/i.test(cleanLower) ||
                         cleanLower.startsWith('/jobs') ||
                         cleanLower.startsWith('!jobs');
    if (isJobKeyword) {
      let liveJobs = [];
      try {
        const jobResult = await getJobsForCareer(userContext.targetCareer);
        if (jobResult && Array.isArray(jobResult.jobs) && jobResult.jobs.length > 0) {
          liveJobs = jobResult.jobs.slice(0, 3);
        }
      } catch (jobErr) {
        console.warn('[WhatsApp Jobs] Job search warning:', jobErr.message);
      }

      let jobsListText = '';
      if (liveJobs.length > 0) {
        jobsListText = liveJobs.map((j, i) => {
          return `${i + 1}️⃣ *${j.title}*\n   🏢 ${j.companyName} · 📍 ${j.location || 'India / Remote'}\n   💰 ${j.salaryText || 'Competitive'}\n   🔗 Apply: ${j.url || 'https://disheera.site/jobs.html'}`;
        }).join('\n\n');
      } else {
        jobsListText = 
`1️⃣ *Junior Frontend Engineer (React & TypeScript)*
   🏢 Synthetix AI Lab · 📍 Remote / Pune
   💰 ₹6,00,000 – ₹9,50,000 / yr
   🔗 Apply: https://disheera.site/jobs.html

2️⃣ *Full Stack Developer (Node.js & React)*
   🏢 CloudScale Tech · 📍 Mumbai / Hybrid
   💰 ₹7,00,000 – ₹11,00,000 / yr
   🔗 Apply: https://disheera.site/jobs.html

3️⃣ *Python Data Analyst Intern*
   🏢 DataPulse Labs · 📍 Bengaluru / Remote
   💰 ₹25,000 / month stipend
   🔗 Apply: https://disheera.site/jobs.html`;
      }

      const jobsReply = 
`💼 *Disheera  -  Live Verified Job Radar*

Namaste ${userContext.name}!
Aapke track (*${userContext.targetCareer}*) ke liye latest verified openings:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${jobsListText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Explore 100+ Maharashtra & India Tech Openings:*
👉 https://disheera.site/jobs.html
_(Includes 1-click apply via LinkedIn, Naukri, Foundit & Indeed)_

💡 _Apply karne se pehle resume optimize karein: Type *RESUME*_
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, jobsReply, {
        context: 'LIVE_JOBS_FEED',
        studentName: userContext.name
      });
      return;
    }

    // ── WEBSITE FEATURE INTEGRATION: DYNAMIC ROADMAP & MILESTONES ──
    const isRoadmapKeyword = /^(roadmap|plan|syllabus|curriculum|milestones?)\b/i.test(cleanLower) ||
                             cleanLower.startsWith('/roadmap') ||
                             cleanLower.startsWith('week');
    if (isRoadmapKeyword) {
      const roadmapReply = 
`🗺️ *Disheera  -  Your 12-Week Career Roadmap*

Namaste ${userContext.name}! 👋
• *Target Track:* ${userContext.targetCareer}
• *Current Milestone:* Week ${userContext.activeWeek} of 12

🎯 *Week ${userContext.activeWeek} Key Focus:*
• Core architectural principles & hands-on development
• Interactive code challenges & anti-cheat quiz
• Real-world production repository integration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 *Download Weekly Study Material:*
Type *NOTES* to get your Week ${userContext.activeWeek} PDF Cheatsheet sent right here on WhatsApp!

🌐 *Access Interactive Dynamic Roadmap:*
👉 https://disheera.site/roadmap.html

🧪 *Take Proctored Milestone Test:*
👉 Reply with *QUIZ* or visit https://disheera.site/quiz.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *Disheera · 24x7 Autonomous Career GPS*`;

      await whatsappService.sendTextMessage(senderPhone, roadmapReply, {
        context: 'STUDENT_ROADMAP_OVERVIEW',
        studentName: userContext.name
      });
      return;
    }

    // ── WEBSITE FEATURE INTEGRATION: ON-DEMAND STUDY NOTES PDF ──
    const isNotesKeyword = /^(notes|cheatsheet|pdf|study|material|handout)\b/i.test(cleanLower) ||
                           cleanLower.startsWith('/notes') ||
                           cleanLower.startsWith('/pdf');
    if (isNotesKeyword) {
      const weekNum = userContext.activeWeek || 1;
      const filename = `Disheera_${(userContext.targetCareer || 'Software_Engineer').replace(/\s+/g, '_')}_Week_${weekNum}_Notes.pdf`;
      const caption = `📚 Disheera Week ${weekNum} Study Notes & Cheatsheet (${userContext.targetCareer})`;

      try {
        const pdfBuffer = await generateWeeklyRoadmapPdf({
          careerTitle: userContext.targetCareer,
          weekNumber: weekNum,
          studentName: userContext.name
        });

        await whatsappService.sendDocument(senderPhone, pdfBuffer, filename, caption);

        const notesConfirm = 
`📄 *Week ${weekNum} Cheatsheet Dispatched!*

Namaste ${userContext.name}! Aapka Week ${weekNum} detailed study guide and cheatsheet PDF dispatch ho gaya hai.

• *Interactive Portal:* https://disheera.site/roadmap.html
• *Milestone Quiz:* Reply *QUIZ* when ready to test your skills!

🚀 *Disheera · 24x7 Verified Talent OS*`;

        await whatsappService.sendTextMessage(senderPhone, notesConfirm, {
          context: 'STUDY_NOTES_DISPATCH_CONFIRM',
          studentName: userContext.name
        });
        return;
      } catch (pdfErr) {
        console.error('[WhatsApp Notes] PDF generation failed:', pdfErr.message);
        const pdfFallbackMsg = 
`📚 *Disheera  -  Week ${weekNum} Study Material*

Namaste ${userContext.name}!
Aapka Week ${weekNum} study notes & cheatsheet web portal par available hai:
👉 https://disheera.site/roadmap.html

Aap direct PDF download aur interactive lessons access kar sakte hain!
🚀 *Disheera · 24x7 Verified Talent OS*`;

        await whatsappService.sendTextMessage(senderPhone, pdfFallbackMsg, {
          context: 'STUDY_NOTES_LINK_FALLBACK',
          studentName: userContext.name
        });
        return;
      }
    }

    // ── WEBSITE FEATURE INTEGRATION: CRYPTOGRAPHIC SKILL PASSPORT ──
    const isPassportKeyword = /^(passport|skills?|badges?|credentials?)\b/i.test(cleanLower) ||
                              cleanLower.startsWith('/passport');
    if (isPassportKeyword) {
      const skillsList = userContext.skills && userContext.skills.length > 0
        ? userContext.skills.map(s => `• ${s} (Verified)`).join('\n')
        : `• Modern Web Architecture (Verified)\n• RESTful API Integration (Verified)\n• Core Logic & Algorithms (In Progress)`;

      const passportReply = 
`🛡️ *Disheera  -  Cryptographic Skill Passport*

Namaste ${userContext.name}! 👋
Aapka Disheera Skill Passport ek tamper-proof, recruiter-verified credential hai:

📊 *Verified Credentials Status:*
• *Target Track:* ${userContext.targetCareer}
• *Current Milestone:* Week ${userContext.activeWeek} of 12
• *Skills Logged:*
${skillsList}

🔐 *Cryptographic Security Guarantee:*
• Har certificate immutable SHA-256 hash se verified hai.
• Any recruiter can verify your badges instantly via QR or link.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *View Your Live Passport:*
👉 https://disheera.site/passport.html

🔍 *Public SHA-256 Verifier:*
👉 https://disheera.site/verify.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, passportReply, {
        context: 'SKILL_PASSPORT_OVERVIEW',
        studentName: userContext.name
      });
      return;
    }

    // ── WEBSITE FEATURE INTEGRATION: MILESTONE QUIZ & CODE CHAMBER ──
    const isQuizKeyword = /^(quiz|code|challenge|exam|test\s*link|chamber)\b/i.test(cleanLower) ||
                          cleanLower.startsWith('/quiz');
    if (isQuizKeyword) {
      const quizReply = 
`🧪 *Disheera  -  Milestone Skill Verifier & Code Chamber*

Namaste ${userContext.name}! 👋
Aapke *Week ${userContext.activeWeek} (${userContext.targetCareer})* ka milestone test ready hai:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ *Test Parameters & Anti-Cheat Rules:*
• *Pass Threshold:* 70% passing score is mandatory to advance to next week.
• *Strict Anti-Cheat Proctoring:*
  - Fullscreen lock is required.
  - Tab switch Strike 1: -2 min penalty.
  - Strike 2: -3 min penalty.
  - Strike 3: Immediate termination & 24h lockout.
• *Live Code Sandbox:* Browser me auto-evaluated test cases.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 *Start Week ${userContext.activeWeek} Milestone Test:*
👉 https://disheera.site/quiz.html

💡 _Tip: Review your notes first by typing *NOTES*!_
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, quizReply, {
        context: 'MILESTONE_QUIZ_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    // ── WEBSITE FEATURE INTEGRATION: AI ATS RESUME BUILDER ──
    const isResumeKeyword = /^(resume|cv|ats|portfolio|resumebuilder)\b/i.test(cleanLower) ||
                            cleanLower.startsWith('/resume');
    if (isResumeKeyword) {
      const resumeReply = 
`📄 *Disheera  -  AI ATS Resume Builder*

Namaste ${userContext.name}! 👋
Top tech companies ke ATS (Applicant Tracking Systems) ko pass karne ke liye:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *ATS Optimization Tips:*
1. *Quantifiable Bullets:* Use "Action Verb + Task + Quantified Impact" (e.g. "Optimized API latency by 35% using Redis caching").
2. *Clean Layout:* Single-column, standard fonts, no complex tables.
3. *Verified Disheera Badge:* Include your verified Passport link for instant recruiter trust.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ *Launch Disheera AI Resume Builder:*
👉 https://disheera.site/resume-builder.html
_(Includes real-time ATS scoring, keyword matching, and 1-click PDF export)_

💡 _Apply directly after building: Type *JOBS* for active openings!_
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, resumeReply, {
        context: 'ATS_RESUME_BUILDER_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    // ── WEBSITE FEATURE INTEGRATION: AI MOCK INTERVIEW ──
    const isInterviewKeyword = /^(interview|mock|prep|practice|eval|readiness)\b/i.test(cleanLower) ||
                               cleanLower.startsWith('/interview');
    if (isInterviewKeyword) {
      const interviewReply = 
`🎙️ *Disheera  -  AI Mock Interview Evaluator*

Namaste ${userContext.name}! 👋
Tech interviews crack karne ke liye realistic AI practice sessions:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *Assessment Dimensions:*
• *Technical Depth:* Core CS, Data Structures, System Design, Framework concepts.
• *Communication & STAR Method:* Situation, Task, Action, Result structured responses.
• *Instant Feedback Report:* Score breakdown with weakness identification and suggested learning tasks.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 *Start AI Mock Interview Assessment:*
👉 https://disheera.site/assessment.html

💡 _Need guidance from our leadership team? Reply *COUNSELOR* anytime!_
🚀 *Disheera · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, interviewReply, {
        context: 'AI_MOCK_INTERVIEW_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    // 4. Generate Context-Aware AI Guidance (Groq Llama 3.3 / Qwen with Gemini fallback)
    const promptSystemPrefix = 
`You are Disheera's official 24x7 WhatsApp Career Mentor.
You are chatting with a student on WhatsApp.
Student Context:
- Name: ${userContext.name}
- Target Career Track: ${userContext.targetCareer}
- Current Active Roadmap: Week ${userContext.activeWeek}
- Logged Skills: ${userContext.skills.length ? userContext.skills.join(', ') : 'Not yet logged'}

WHATSAPP FORMATTING GUIDELINES:
- Greet warmly by name in Hinglish or English (e.g., "Namaste ${userContext.name}! 👋").
- Use WhatsApp markdown syntax: *bold* for emphasis, • for bullet points.
- Keep response under 150 words  -  concise, actionable, and encouraging.
- If asking for next steps, specifically guide them on their Week ${userContext.activeWeek} milestones.
- Sign off with:
"🚀 Disheera · Your 24x7 Career GPS
💡 _Commands: Type *MENU*, *JOBS*, *NOTES*, or *SUPPORT* (+91 74990 85045)_"`;

    let aiReply = '';
    try {
      aiReply = await getGroqMentorReply(
        `${promptSystemPrefix}\n\nStudent Query: "${incomingText}"`,
        userContext,
        [],
        { maxTokens: 350 }
      );
    } catch (groqError) {
      console.warn('[WhatsApp AI] Groq fallback to Gemini:', groqError.message);
      try {
        aiReply = await getGeminiMentorReply(
          `${promptSystemPrefix}\n\nStudent Query: "${incomingText}"`,
          userContext,
          []
        );
      } catch (geminiError) {
        console.error('[WhatsApp AI] Both engines failed:', geminiError.message);
        aiReply = 
`Namaste ${userContext.name}! 👋

Aapka sawal mil gaya hai! Disheera Mentor abhi heavy load handle kar raha hai. 
Aap apne roadmap ke *Week ${userContext.activeWeek}* tasks aur verified quiz web portal par access kar sakte hain:
👉 https://disheera.site/roadmap.html

💡 _Need help? Type *SUPPORT* for official Grievance Desk (+91 74990 85045)_
🚀 Disheera · 24x7 Autonomous Career GPS`;
      }
    }

    // 5. Clean, Fast Text-Only Dispatch (Zero Voice Notes)
    console.log(`[WhatsApp Mentor] Dispatching text mentorship reply to ${senderPhone}...`);

    await whatsappService.sendTextMessage(senderPhone, aiReply, {
      context: 'AI_CAREER_MENTOR',
      studentName: userContext.name
    });

  } catch (err) {
    console.error('[WhatsApp Controller] Error processing incoming webhook:', err);
  }
};

/**
 * POST /api/whatsapp/send-roadmap-pdf
 * Dispatches the weekly study notes and cheatsheet PDF directly to student's WhatsApp.
 * Supports download-only query param (?download=true) for instant browser preview.
 */
const sendRoadmapPdf = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const weekNumber = parseInt(req.body.weekNumber || req.query.week || '1', 10);
    const isDownloadOnly = req.query.download === 'true' || req.body.downloadOnly === true;

    // 1. Fetch active roadmap & career metadata
    let careerTitle = 'Software Engineer';
    let roadmapData = null;
    let weekTasks = [];

    const activeRoadmap = await Roadmap.findOne({
      user: user._id || user.id,
      status: 'active'
    });

    if (activeRoadmap) {
      roadmapData = activeRoadmap;
      if (activeRoadmap.career) {
        const c = await Career.findById(activeRoadmap.career);
        if (c) careerTitle = c.title;
      }

      // Extract tasks for requested week
      if (Array.isArray(activeRoadmap.weeks) && activeRoadmap.weeks[weekNumber - 1]) {
        weekTasks = activeRoadmap.weeks[weekNumber - 1].tasks || [];
      }
    }

    // 2. Generate PDF Buffer via PDFKit
    const pdfBuffer = await generateWeeklyRoadmapPdf({
      careerTitle,
      weekNumber,
      studentName: user.name || 'Student',
      roadmapData,
      tasks: weekTasks
    });

    const filename = `Disheera_${careerTitle.replace(/\s+/g, '_')}_Week_${weekNumber}_Notes.pdf`;

    // 3. If direct download requested, stream PDF buffer
    if (isDownloadOnly) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    }

    // 4. WhatsApp Dispatch
    const targetPhone = req.body.phone || user.phone;
    if (!targetPhone) {
      return res.status(400).json({
        success: false,
        requiresPhone: true,
        message: 'No WhatsApp number provided. Please enter your WhatsApp number or update your profile.'
      });
    }

    const caption = 
`🗺️ *Disheera  -  Week ${weekNumber} Study Notes*
Career: *${careerTitle}*
Student: *${user.name}*

Aapka weekly roadmap cheatsheet, key concepts, aur Focus Chamber video lessons PDF me attached hain. 
All the best for your milestone quiz! 🚀`;

    const dispatchResult = await whatsappService.sendDocument(
      targetPhone,
      pdfBuffer,
      filename,
      caption
    );

    return res.status(200).json({
      success: true,
      message: `Week ${weekNumber} study material and cheatsheet PDF sent to your WhatsApp!`,
      data: {
        provider: dispatchResult.provider,
        phone: whatsappService.formatPhoneNumber(targetPhone),
        filename
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/test-otp
 * Admin / Developer testing endpoint for WhatsApp OTP formatting.
 */
const testWhatsAppOtp = async (req, res, next) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const otpCode = code || '482910';
    const studentName = name || req.user?.name || 'Parth';

    const result = await whatsappService.sendOtp(phone, otpCode, studentName);

    return res.status(200).json({
      success: true,
      message: `Test OTP sent to WhatsApp (${phone})`,
      provider: result.provider,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyWebhook,
  handleIncomingWebhook,
  sendRoadmapPdf,
  testWhatsAppOtp,
  supportTicketsCache,
  findTicket,
  findTicketAsync,
  persistTickets,
  forwardAlertToFounder,
  handleFounderInbound,
  FOUNDER_PHONE,
  FOUNDERS_REGISTRY,
  getFounders
};

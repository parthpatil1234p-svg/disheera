/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/supportController.js · Unified Support & Grievance Redressal Controller
 * 
 * Complies with:
 * - Indian Digital Personal Data Protection (DPDP) Act 2023
 * - Information Technology (Intermediary Guidelines) Rules 2021
 * - Information Technology Act 2000
 * 
 * Official Grievance Officer: Parth Patil
 * Email: support@disheera.site
 * WhatsApp: +91 74990 85045 (Chat Only · No Voice Calls)
 * Location: GHRCEM, Jalgaon, Maharashtra, India
 * 
 * Disheera Technologies Inc.
 */

const crypto = require('crypto');
const whatsappService = require('../services/whatsappService');
const { supportTicketsCache, persistTickets } = require('./whatsappController');

// Category display mapping
const CATEGORY_MAP = {
  otp: 'Login & Dual-OTP Verification',
  proctoring: 'Milestone Test & Anti-Cheat Proctoring',
  certificate: 'Digital Certificate & SHA-256 Ledger',
  recruiter: 'Corporate Recruiter & Talent Radar',
  technical: 'Platform Bug & Technical Disconnect',
  general: 'General Career & Academic Inquiry'
};

/**
 * POST /api/support/ticket
 * Creates a formal support ticket from web portal or API.
 */
const createTicket = async (req, res, next) => {
  try {
    const { name, fullName, email, phone, category = 'general', subject, description } = req.body;
    const studentName = (name || fullName || '').trim();

    if (!studentName) {
      return res.status(400).json({ success: false, message: 'Your name is required.' });
    }

    if (!email || typeof email !== 'string' || email.length > 254 || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a clear description of at least 10 characters.' });
    }

    const ticketId = 'CP-TKT-' + crypto.randomInt(100000, 999999);
    const categoryLabel = CATEGORY_MAP[category] || CATEGORY_MAP.general;
    const cleanSubject = (subject || `${categoryLabel} Request`).trim();

    const ticketRecord = {
      ticketId,
      name: studentName,
      email: email.trim().toLowerCase(),
      phone: phone ? whatsappService.formatPhoneNumber(phone) : null,
      category,
      categoryLabel,
      subject: cleanSubject,
      description: description.trim(),
      status: 'OPEN_ASSIGNED',
      officer: 'Parth Patil',
      createdAt: new Date().toISOString()
    };

    // Store in support tickets cache
    if (supportTicketsCache) {
      supportTicketsCache.set(ticketId, ticketRecord);
      if (persistTickets) persistTickets().catch(() => {});
    }

    console.log(`[Support Desk] Web Ticket Registered: #${ticketId} | Name: ${studentName} | Category: ${categoryLabel}`);

    // If a valid WhatsApp phone was provided, dispatch instant WhatsApp confirmation
    if (ticketRecord.phone) {
      try {
        const waMsg = 
`🎫 *Disheera - Support Ticket Registered*

Namaste ${studentName}! 👋
Aapka support ticket receive ho gaya hai:

• *Ticket ID:* #${ticketId}
• *Category:* ${categoryLabel}
• *Subject:* ${cleanSubject}
• *Status:* Priority Open · Dispatched to Grievance Desk
• *Assigned Officer:* Parth Patil (Technical & Grievance Lead)
• *Official WhatsApp:* +91 74990 85045 (Chat Only)
• *Grievance Email:* support@disheera.site
• *Statutory SLA:* Within 24 Hours (DPDP Act 2023 & IT Rules 2021)
• *Campus Location:* GHRCEM, Jalgaon, Maharashtra, India

Hamari support team aapse jald hi connect karegi!

🌐 *Web Portal:* https://disheera.site
🚀 *Disheera · 24x7 Verified Talent OS*`;

        await whatsappService.sendTextMessage(ticketRecord.phone, waMsg, {
          context: 'SUPPORT_TICKET_WEB',
          studentName: studentName
        });
      } catch (waErr) {
        console.warn('[Support Controller] WhatsApp confirmation warning:', waErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket registered successfully.',
      data: {
        ticketId,
        status: 'OPEN_ASSIGNED',
        category: categoryLabel,
        subject: cleanSubject,
        officer: 'Parth Patil',
        email: 'support@disheera.site',
        whatsapp: '+91 74990 85045',
        sla: '24 Hours (DPDP Act 2023 Statutory SLA)'
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/support/officer
 * Returns official Grievance Redressal Officer contact details.
 */
const getGrievanceDetails = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      platform: 'Disheera Technologies Inc.',
      grievanceOfficer: 'Parth Patil',
      designation: 'Grievance Redressal & Technical Lead',
      email: 'support@disheera.site',
      whatsapp: '+91 74990 85045',
      whatsappPolicy: 'WhatsApp Chat Only · 24x7 Automated Logging · No Voice Calls',
      institution: 'G.H. Raisoni College of Engineering and Management (GHRCEM)',
      location: 'Jalgaon, Maharashtra, India',
      jurisdiction: 'Jalgaon, Maharashtra, India',
      responseSla: 'Within 24 Hours',
      statutoryCompliance: [
        'Digital Personal Data Protection (DPDP) Act 2023',
        'Information Technology Act 2000',
        'Information Technology Rules 2021'
      ]
    }
  });
};

/**
 * GET /api/support/ticket/:ticketId
 * Check ticket status.
 */
const getTicketStatus = (req, res) => {
  const { ticketId } = req.params;
  const cleanId = (ticketId || '').trim().toUpperCase();

  const ticket = supportTicketsCache?.get(cleanId);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: `Support ticket ${cleanId} not found. Please verify the ticket ID.`
    });
  }

  return res.status(200).json({
    success: true,
    data: ticket
  });
};

module.exports = {
  createTicket,
  getGrievanceDetails,
  getTicketStatus
};

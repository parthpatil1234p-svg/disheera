/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/whatsappRoutes.js — WhatsApp Automation Endpoints
 * 
 * Mounted at: /api/whatsapp (in server.js)
 * 
 * Endpoints:
 *   GET   /api/whatsapp/webhook            → Meta Cloud API webhook verification handshake
 *   POST  /api/whatsapp/webhook            → Unified incoming webhook (Meta / OpenWA / Baileys)
 *   POST  /api/whatsapp/send-roadmap-pdf   → Protected: Send weekly study material PDF to WhatsApp (or download)
 *   POST  /api/whatsapp/test-otp           → Testing: Dispatches mock/real WhatsApp OTP
 * 
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  verifyWebhook,
  handleIncomingWebhook,
  sendRoadmapPdf,
  testWhatsAppOtp
} = require('../controllers/whatsappController');

// ── Webhook Endpoints (Public — verified via token/signatures) ──
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingWebhook);

// ── Authenticated User Actions ──
router.post('/send-roadmap-pdf', protect, sendRoadmapPdf);
router.post('/test-otp', testWhatsAppOtp);

module.exports = router;

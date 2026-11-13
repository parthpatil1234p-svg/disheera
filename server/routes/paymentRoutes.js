/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/paymentRoutes.js — Cashfree Payment & Membership Endpoints
 *
 * Mounted at: /api/payments (in server.js)
 *
 * Endpoints:
 *   POST /api/payments/create-order     → Create Cashfree payment order (Protected)
 *   POST /api/payments/verify           → Verify payment & activate Pro subscription (Protected)
 *   GET  /api/payments/subscription     → Get real-time subscription & remaining days (Protected)
 *   POST /api/payments/webhook          → Cashfree webhook handler (Public)
 *
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// ── Authenticated Student Routes ──
router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.get('/subscription', protect, paymentController.getSubscription);

// ── Public Cashfree Webhook Route ──
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;

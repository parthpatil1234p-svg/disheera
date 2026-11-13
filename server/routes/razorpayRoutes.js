/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/razorpayRoutes.js — Razorpay Standard Checkout Routes
 *
 * Endpoints:
 *   POST /create-order      → Create order (min 100 paise)
 *   POST /verify-payment    → Verify payment signature
 *   GET  /config            → Public Key ID
 *
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpayController');

// 1. Create Order
router.post('/create-order', razorpayController.createOrder);

// 2. Verify Payment Signature
router.post('/verify-payment', razorpayController.verifyPayment);

// 3. Public Config (Key ID only)
router.get('/config', razorpayController.getConfig);

module.exports = router;

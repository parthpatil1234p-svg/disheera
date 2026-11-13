/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/couponRoutes.js — Coupon Redemption & Validation Endpoints
 *
 * Endpoints:
 *   POST /api/coupons/redeem  (Protected) → Instant 0% payment Pro activation
 *   POST /api/coupons/verify  (Public)    → Check coupon validity
 *   GET  /api/coupons/list    (Protected) → Admin view of slots remaining
 *
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const couponController = require('../controllers/couponController');

// 1. Redeem coupon (instant activation)
router.post('/redeem', protect, couponController.redeemCoupon);

// 2. Pre-verify coupon code
router.post('/verify', couponController.verifyCoupon);

// 3. Admin list
router.get('/list', protect, couponController.listCouponsAdmin);

module.exports = router;

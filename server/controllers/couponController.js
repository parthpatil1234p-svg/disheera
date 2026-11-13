/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/couponController.js — Coupon Redemption & Verification Controller
 *
 * Endpoints:
 *   POST /api/coupons/redeem       → Validate and redeem coupon (instant 0-payment Pro activation)
 *   POST /api/coupons/verify       → Pre-validate coupon before submission
 *   GET  /api/coupons/admin/list   → Admin list of all pilot and fixed coupons
 *
 * Disheera Technologies Inc.
 */

const couponService = require('../services/couponService');

/**
 * POST /api/coupons/redeem
 */
exports.redeemCoupon = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { code, couponCode } = req.body;
    const finalCode = code || couponCode;

    if (!finalCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const result = await couponService.redeemCoupon({
      userId: user.id,
      couponCode: finalCode,
      userRole: user.role || 'student'
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ [CouponController.redeemCoupon] Error:', err.message);
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Coupon redemption failed'
    });
  }
};

/**
 * POST /api/coupons/verify
 * Checks if a coupon is valid without consuming a use
 */
exports.verifyCoupon = async (req, res) => {
  try {
    const { code, couponCode } = req.body;
    const finalCode = (code || couponCode || '').trim().toUpperCase();

    if (!finalCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupons = couponService.getCoupons();
    const coupon = coupons[finalCode];

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon code not found or invalid' });
    }

    const remainingUses = Math.max(0, coupon.maxUses - (coupon.usedCount || 0));

    if (remainingUses <= 0 && finalCode !== 'DISHEERA-ADMIN-VIP') {
      return res.status(400).json({ success: false, message: 'Coupon has reached maximum usage limit' });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      code: finalCode,
      description: coupon.description,
      discountPercent: coupon.discountPercent,
      validityDays: coupon.validityDays,
      remainingUses: finalCode === 'DISHEERA-ADMIN-VIP' ? 'Unlimited' : remainingUses
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/coupons/admin/list
 * Admin telemetry to see slots used
 */
exports.listCouponsAdmin = async (req, res) => {
  try {
    const coupons = couponService.getCoupons();
    const list = Object.values(coupons).map(c => ({
      code: c.code,
      description: c.description,
      discountPercent: c.discountPercent,
      maxUses: c.maxUses,
      usedCount: c.usedCount || 0,
      remainingUses: c.code === 'DISHEERA-ADMIN-VIP' ? 'Unlimited' : Math.max(0, c.maxUses - (c.usedCount || 0)),
      validityDays: c.validityDays,
      applicableRoles: c.applicableRoles
    }));

    return res.status(200).json({ success: true, count: list.length, coupons: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

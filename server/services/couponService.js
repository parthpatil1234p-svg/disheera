/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/couponService.js — Disheera Zero-Payment Coupon & Promo Engine
 *
 * Provides cryptographic validation and instant Pro activation for:
 *   1. Fixed Admin Master Pass (Unlimited admin bypass)
 *   2. 5 Student Pilot Codes (100% Free Pro Career Accelerator)
 *   3. 3 Recruiter Pilot Codes (100% Free Talent Radar Pro)
 *   4. 1 College Pilot Code (100% Free Campus TPO Cockpit)
 *
 * Disheera Technologies Inc.
 */

const fs = require('fs');
const path = require('path');
const subscriptionManager = require('../utils/subscriptionManager');
const { prisma } = require('../config/prisma');

const COUPONS_DATA_PATH = path.join(__dirname, '../data/coupons_store.json');

// Default coupon registry
const DEFAULT_COUPONS = {
  // ── 1. FIXED ADMIN MASTER PASS (UNLIMITED FOR ADMINS) ──────────
  'DISHEERA-ADMIN-VIP': {
    code: 'DISHEERA-ADMIN-VIP',
    description: 'Fixed Master Admin Pass — 100% Free Pro Access (Unlimited)',
    discountPercent: 100,
    maxUses: 999999,
    usedCount: 0,
    validityDays: 365,
    applicableRoles: ['student', 'recruiter', 'tpo', 'college', 'admin'],
    usedBy: []
  },
  // ── 2. 5 STUDENTS PRO PILOT PASS ──────────────────────────────
  'STU-PILOT-PRO5': {
    code: 'STU-PILOT-PRO5',
    description: 'Student Pilot Program — 100% Free Pro Career Accelerator (5 Slots)',
    discountPercent: 100,
    maxUses: 5,
    usedCount: 0,
    validityDays: 90,
    applicableRoles: ['student'],
    usedBy: []
  },
  // ── 3. 3 RECRUITERS RADAR PRO PASS ────────────────────────────
  'REC-RADAR-VIP3': {
    code: 'REC-RADAR-VIP3',
    description: 'Corporate Recruiter Radar Pro — 100% Free Access + 60 Unlocks (3 Slots)',
    discountPercent: 100,
    maxUses: 3,
    usedCount: 0,
    validityDays: 90,
    applicableRoles: ['recruiter', 'employer'],
    usedBy: []
  },
  // ── 4. 1 COLLEGE CAMPUS OS PASS ───────────────────────────────
  'CAMPUS-OS-FREE1': {
    code: 'CAMPUS-OS-FREE1',
    description: 'Institutional Campus TPO Cockpit — 100% Free College OS (1 Institution)',
    discountPercent: 100,
    maxUses: 1,
    usedCount: 0,
    validityDays: 365,
    applicableRoles: ['tpo', 'college'],
    usedBy: []
  }
};

/**
 * Loads persistent coupon state from disk
 */
function loadCoupons() {
  try {
    if (!fs.existsSync(COUPONS_DATA_PATH)) {
      const dir = path.dirname(COUPONS_DATA_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(COUPONS_DATA_PATH, JSON.stringify(DEFAULT_COUPONS, null, 2), 'utf-8');
      return DEFAULT_COUPONS;
    }
    const raw = fs.readFileSync(COUPONS_DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_COUPONS, ...parsed };
  } catch (err) {
    console.error('⚠️ [CouponService] Error reading coupon store, using defaults:', err.message);
    return DEFAULT_COUPONS;
  }
}

/**
 * Saves persistent coupon state to disk
 */
function saveCoupons(coupons) {
  try {
    const dir = path.dirname(COUPONS_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COUPONS_DATA_PATH, JSON.stringify(coupons, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ [CouponService] Failed to persist coupon store:', err.message);
  }
}

class CouponService {
  /**
   * Retrieves all active coupons with current usage metadata
   */
  getCoupons() {
    return loadCoupons();
  }

  /**
   * Validates and redeems a coupon for a user
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.couponCode
   * @param {string} [params.userRole='student']
   */
  async redeemCoupon({ userId, couponCode, userRole = 'student' }) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!couponCode || typeof couponCode !== 'string') {
      throw new Error('Please enter a valid coupon code');
    }

    const cleanCode = couponCode.trim().toUpperCase();
    const coupons = loadCoupons();
    const coupon = coupons[cleanCode];

    if (!coupon) {
      const err = new Error('Invalid coupon code. Please check and try again.');
      err.statusCode = 404;
      throw err;
    }

    // 1. Role validation
    if (coupon.applicableRoles && coupon.applicableRoles.length > 0) {
      const roleMatches = coupon.applicableRoles.includes(userRole.toLowerCase());
      if (!roleMatches && cleanCode !== 'DISHEERA-ADMIN-VIP') {
        const err = new Error(`This coupon is only valid for ${coupon.applicableRoles.join(' / ')} accounts.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 2. User duplicate check (except admin pass)
    if (cleanCode !== 'DISHEERA-ADMIN-VIP' && coupon.usedBy && coupon.usedBy.includes(userId)) {
      const err = new Error('You have already redeemed this coupon code once.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Max usage limit check
    if (coupon.usedCount >= coupon.maxUses) {
      const err = new Error(`This coupon code has reached its maximum redemption limit (${coupon.maxUses} uses).`);
      err.statusCode = 400;
      throw err;
    }

    // 4. Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const validityDays = coupon.validityDays || 30;

    // 5. Activate Pro for Student
    let activatedData = {};
    if (userRole === 'student' || user.role === 'student' || !user.role) {
      activatedData = await subscriptionManager.activatePro(userId, {
        orderId: `COUPON_${cleanCode}_${Date.now()}`,
        paymentId: `FREE_VOUCHER_${cleanCode}`,
        amount: 0,
        paymentMethod: `COUPON_${cleanCode}`,
        validityDays
      });
    }

    // 6. Activate Pro for Recruiter
    if (userRole === 'recruiter' || user.role === 'recruiter') {
      const now = new Date();
      const expiry = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
      const currentRecruiterProfile = user.recruiterProfile && typeof user.recruiterProfile === 'object'
        ? user.recruiterProfile
        : {};

      const updatedRecruiterProfile = {
        ...currentRecruiterProfile,
        tier: 'PRO',
        isPro: true,
        unlocksRemaining: (currentRecruiterProfile.unlocksRemaining || 0) + 60,
        unlimitedSearch: true,
        verifiedBadge: true,
        activeUntil: expiry.toISOString(),
        activatedVia: cleanCode
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          recruiterProfile: updatedRecruiterProfile
        }
      });
      activatedData = { role: 'recruiter', ...updatedRecruiterProfile };
    }

    // 7. Update usage count and audit trail
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    if (!coupon.usedBy) coupon.usedBy = [];
    if (!coupon.usedBy.includes(userId)) {
      coupon.usedBy.push(userId);
    }
    coupons[cleanCode] = coupon;
    saveCoupons(coupons);

    console.log(`🎉 [CouponService] Successfully redeemed ${cleanCode} for ${user.email} (${userRole})!`);

    return {
      success: true,
      message: `🎉 Coupon '${cleanCode}' successfully applied! 100% Free Pro Access activated for ${validityDays} days.`,
      code: cleanCode,
      discountPercent: coupon.discountPercent,
      validityDays,
      data: activatedData
    };
  }
}

module.exports = new CouponService();

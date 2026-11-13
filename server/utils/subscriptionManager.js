/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * utils/subscriptionManager.js — Real-Time Membership Engine & Expiry Calculator
 *
 * Computes exact days remaining, real-time active status, and feature unlocks
 * on every single request without batch delay.
 *
 * Disheera Technologies Inc.
 */

const { prisma } = require('../config/prisma');

class SubscriptionManager {
  /**
   * Computes real-time subscription details for any user object
   * @param {Object} user - User record from PostgreSQL
   * @returns {Object} Structured subscription details
   */
  getDetails(user) {
    const rawSub = user?.profileStatus?.subscription;

    if (!rawSub || rawSub.tier !== 'PRO' || !rawSub.endDate) {
      return {
        tier: 'FREE',
        status: 'FREE',
        planName: 'Student Starter',
        amount: 0,
        currency: 'INR',
        isActive: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        startDate: null,
        endDate: null,
        orderId: null,
        paymentId: null,
        features: {
          aiVivaExamLimit: 1, // 1 free trial viva
          antiCheatMilestones: 'preview_only',
          atsResumeTemplates: 1,
          recruiterRadarPriority: false,
          cryptographicCertificate: false,
          distractionFreeChamber: false
        }
      };
    }

    const now = new Date();
    const endDate = new Date(rawSub.endDate);
    const startDate = rawSub.startDate ? new Date(rawSub.startDate) : null;
    const diffMs = endDate.getTime() - now.getTime();

    // Compute remaining time
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const hoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
    const isTimeActive = diffMs > 0;
    const isStatusActive = rawSub.status === 'ACTIVE';
    const isActive = isTimeActive && isStatusActive;

    return {
      tier: isActive ? 'PRO' : 'FREE',
      status: isActive ? 'ACTIVE' : 'EXPIRED',
      planName: rawSub.planName || 'Pro Career Accelerator',
      amount: rawSub.amount || 499,
      currency: rawSub.currency || 'INR',
      isActive,
      daysRemaining,
      hoursRemaining,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate.toISOString(),
      orderId: rawSub.orderId || null,
      paymentId: rawSub.paymentId || null,
      paymentMethod: rawSub.paymentMethod || 'UPI/Card',
      notified5Days: Boolean(rawSub.notified5Days),
      notified1Day: Boolean(rawSub.notified1Day),
      features: {
        aiVivaExamLimit: isActive ? 'UNLIMITED' : 1,
        antiCheatMilestones: isActive ? 'FULL_ACCESS' : 'preview_only',
        atsResumeTemplates: isActive ? 4 : 1,
        recruiterRadarPriority: isActive,
        cryptographicCertificate: isActive,
        distractionFreeChamber: isActive
      }
    };
  }

  /**
   * Activates or extends a PRO subscription for a user
   * @param {string} userId
   * @param {Object} paymentData
   * @param {string} paymentData.orderId
   * @param {string} [paymentData.paymentId]
   * @param {number} [paymentData.amount]
   * @param {string} [paymentData.paymentMethod]
   * @param {number} [paymentData.validityDays] - Defaults to 30 days
   */
  async activatePro(userId, { orderId, paymentId, amount = 499, paymentMethod = 'CASHFREE_UPI_CARD', validityDays = 30 }) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const now = new Date();
    // If user already has an active PRO subscription, extend from the current endDate!
    const existingSub = user.profileStatus?.subscription;
    let baseStartDate = now;
    let baseEndDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    if (existingSub && existingSub.tier === 'PRO' && existingSub.endDate) {
      const currentEnd = new Date(existingSub.endDate);
      if (currentEnd > now) {
        // Extend existing subscription
        baseStartDate = existingSub.startDate ? new Date(existingSub.startDate) : now;
        baseEndDate = new Date(currentEnd.getTime() + validityDays * 24 * 60 * 60 * 1000);
      }
    }

    const currentProfileStatus = (user.profileStatus && typeof user.profileStatus === 'object')
      ? user.profileStatus
      : { status: 'learning' };

    const updatedSubscription = {
      tier: 'PRO',
      status: 'ACTIVE',
      planName: 'Pro Career Accelerator',
      amount: Number(amount),
      currency: 'INR',
      orderId,
      paymentId: paymentId || `pay_${Date.now()}`,
      paymentMethod,
      startDate: baseStartDate.toISOString(),
      endDate: baseEndDate.toISOString(),
      activatedAt: now.toISOString(),
      notified5Days: false,
      notified1Day: false
    };

    const updatedProfileStatus = {
      ...currentProfileStatus,
      subscription: updatedSubscription
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileStatus: updatedProfileStatus
      }
    });

    console.log(`✅ [SubscriptionManager] Activated PRO for ${user.email} until ${baseEndDate.toISOString()}`);
    return this.getDetails(updatedUser);
  }
}

module.exports = new SubscriptionManager();

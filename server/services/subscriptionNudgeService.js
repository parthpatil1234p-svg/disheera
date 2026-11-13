/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/subscriptionNudgeService.js — Automated Subscription Expiry & WhatsApp Nudge Engine
 *
 * Scans active subscriptions, computes real-time days remaining, and dispatches
 * 5-day, 1-day, and expiration alerts via WhatsApp and In-App notifications.
 *
 * Disheera Technologies Inc.
 */

const { prisma } = require('../config/prisma');
const whatsappService = require('./whatsappService');
const subscriptionManager = require('../utils/subscriptionManager');

class SubscriptionNudgeService {
  /**
   * Scans all users with PRO subscriptions and sends automated notifications
   */
  async auditAndSendNudges() {
    console.log('🔍 [SubscriptionNudge] Starting subscription audit & notification scan...');

    try {
      // Find all users who have profileStatus with a subscription
      const users = await prisma.user.findMany({
        where: {
          profileStatus: {
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsappNotificationsEnabled: true,
          profileStatus: true
        }
      });

      let auditedCount = 0;
      let nudged5Days = 0;
      let nudged1Day = 0;
      let expiredCount = 0;

      for (const user of users) {
        const rawSub = user.profileStatus?.subscription;
        if (!rawSub || rawSub.tier !== 'PRO' || !rawSub.endDate) continue;

        auditedCount++;
        const subDetails = subscriptionManager.getDetails(user);
        const { daysRemaining, hoursRemaining, isActive } = subDetails;
        const phone = user.phone;
        const studentName = user.name || 'Student';
        let updatedSub = { ...rawSub };
        let hasChanges = false;

        // ── 1. Expired Subscriptions ─────────────────────────────────
        if (daysRemaining <= 0 && rawSub.status === 'ACTIVE') {
          console.log(`⌛ [SubscriptionNudge] Membership expired for ${user.email}`);
          updatedSub.status = 'EXPIRED';
          hasChanges = true;
          expiredCount++;

          if (phone && user.whatsappNotificationsEnabled) {
            const expireMsg = 
`⚠️ *Disheera Pro Membership Expired*

Namaste ${studentName}! Aapka Disheera *Pro Career Accelerator* plan aaj expire ho gaya hai.

🔒 *Features on Hold:*
• Oral AI Viva Defense Engine
• Anti-Cheat Weekly Milestones
• Verified Recruiter Talent Radar Priority

Aapki pehle se complete ki gayi tasks aur earned badges hamesha safe hain. Access dobara chalu karne ke liye abhi renew karein:
👉 *Renew Now:* https://disheera.site/dashboard?action=renew`;

            await whatsappService.sendTextMessage(phone, expireMsg, {
              context: 'SUBSCRIPTION_EXPIRED_ALERT',
              userId: user.id
            }).catch(e => console.error('Failed to send expire WhatsApp:', e.message));
          }
        }

        // ── 2. Urgent 1-Day Reminder (1 <= daysRemaining <= 1) ───────
        else if (daysRemaining <= 1 && daysRemaining > 0 && !rawSub.notified1Day) {
          console.log(`⏰ [SubscriptionNudge] 1-Day urgent alert for ${user.email} (${hoursRemaining} hours left)`);
          updatedSub.notified1Day = true;
          hasChanges = true;
          nudged1Day++;

          if (phone && user.whatsappNotificationsEnabled) {
            const urgentMsg = 
`⏰ *Urgent: Disheera Pro Expiring Tomorrow!*

Namaste ${studentName}! Aapka *Pro Career Accelerator* subscription agle *${hoursRemaining} ghanto* me expire ho raha hai.

Seamless learning aur AI Viva exams continue rakhne ke liye abhi 1-click renew karein:
👉 *Renew Instantly:* https://disheera.site/dashboard?action=renew

Disheera Technologies Inc.`;

            await whatsappService.sendTextMessage(phone, urgentMsg, {
              context: 'SUBSCRIPTION_1DAY_ALERT',
              userId: user.id
            }).catch(e => console.error('Failed to send 1-day WhatsApp:', e.message));
          }
        }

        // ── 3. Friendly 5-Day Reminder (2 <= daysRemaining <= 5) ─────
        else if (daysRemaining <= 5 && daysRemaining > 1 && !rawSub.notified5Days) {
          console.log(`🔔 [SubscriptionNudge] 5-Day reminder for ${user.email} (${daysRemaining} days left)`);
          updatedSub.notified5Days = true;
          hasChanges = true;
          nudged5Days++;

          if (phone && user.whatsappNotificationsEnabled) {
            const reminderMsg = 
`🔔 *Disheera Pro Renewal Reminder*

Namaste ${studentName}! Aapka *Pro Career Accelerator* subscription agle *${daysRemaining} dino* me renew hone wala hai.

Aapki continuous streak aur verified milestones ko barkarar rakhne ke liye aap dashboard se aasani se renew kar sakte hain:
👉 *Check Status:* https://disheera.site/dashboard

Disheera Career Atlas Team`;

            await whatsappService.sendTextMessage(phone, reminderMsg, {
              context: 'SUBSCRIPTION_5DAY_ALERT',
              userId: user.id
            }).catch(e => console.error('Failed to send 5-day WhatsApp:', e.message));
          }
        }

        // Save updated flags to database if modified
        if (hasChanges) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              profileStatus: {
                ...user.profileStatus,
                subscription: updatedSub
              }
            }
          });
        }
      }

      console.log(`✅ [SubscriptionNudge] Audit completed. Checked: ${auditedCount}, 5-Day: ${nudged5Days}, 1-Day: ${nudged1Day}, Expired: ${expiredCount}`);
      return { auditedCount, nudged5Days, nudged1Day, expiredCount };
    } catch (err) {
      console.error('❌ [SubscriptionNudge] Audit error:', err);
      return { error: err.message };
    }
  }
}

module.exports = new SubscriptionNudgeService();

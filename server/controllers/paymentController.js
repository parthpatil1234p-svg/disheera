/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/paymentController.js — Razorpay Payment & Subscription Controller (Live Gateway)
 *
 * Endpoints:
 *   POST /api/payments/create-order     → Create Razorpay order for ₹499 Pro Plan (or custom pack)
 *   POST /api/payments/verify           → Verify Razorpay HMAC-SHA256 signature and activate Pro membership
 *   GET  /api/payments/subscription     → Get real-time subscription status & remaining days
 *   POST /api/payments/webhook          → Razorpay Webhook receiver
 *
 * Disheera Technologies Inc.
 */

const razorpayService = require('../services/razorpayService');
const subscriptionManager = require('../utils/subscriptionManager');
const { prisma } = require('../config/prisma');

/**
 * POST /api/payments/create-order
 * Creates a Razorpay payment order
 */
exports.createOrder = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount = 499, planName = 'Pro Career Accelerator' } = req.body;
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount < 1) {
      return res.status(400).json({ success: false, message: 'Amount must be at least ₹1.00' });
    }

    // Convert INR to Paise for Razorpay
    const amountInPaise = Math.round(numericAmount * 100);

    const orderData = await razorpayService.createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${user.id.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        userEmail: user.email,
        planName
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: process.env.RAZORPAY_KEY_ID || '',
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone
      }
    });
  } catch (err) {
    console.error('❌ [PaymentController] createOrder error:', err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Could not initiate payment order'
    });
  }
};

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and activates Pro membership in Database
 */
exports.verifyPayment = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      orderId,
      paymentId,
      signature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const finalOrderId = razorpay_order_id || orderId;
    const finalPaymentId = razorpay_payment_id || paymentId;
    const finalSignature = razorpay_signature || signature;

    if (!finalOrderId || !finalPaymentId || !finalSignature) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Missing orderId, paymentId, or signature for verification'
      });
    }

    // 1. Verify HMAC-SHA256 signature
    const verification = razorpayService.verifySignature({
      order_id: finalOrderId,
      payment_id: finalPaymentId,
      razorpay_signature: finalSignature
    });

    if (!verification.isValid) {
      console.warn(`⚠️ [PaymentController] Razorpay signature mismatch for user ${user.id}, order ${finalOrderId}`);
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Payment verification failed: cryptographic signature mismatch'
      });
    }

    // 2. Activate PRO Subscription in Database
    const subscription = await subscriptionManager.activatePro(user.id, {
      orderId: finalOrderId,
      paymentId: String(finalPaymentId),
      amount: 499,
      paymentMethod: 'RAZORPAY_STANDARD',
      validityDays: 30
    });

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Payment verified successfully! Pro Career Accelerator activated.',
      data: {
        subscription
      }
    });
  } catch (err) {
    console.error('❌ [PaymentController] verifyPayment error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification failed'
    });
  }
};

/**
 * GET /api/payments/subscription
 * Returns real-time membership status, days remaining, and feature flags
 */
exports.getSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Fetch fresh user from DB
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profileStatus: true, email: true, name: true, phone: true }
    });

    const subscription = subscriptionManager.getDetails(freshUser);

    return res.status(200).json({
      success: true,
      data: {
        subscription
      }
    });
  } catch (err) {
    console.error('❌ [PaymentController] getSubscription error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription details'
    });
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay Server-to-Server Webhook Receiver
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (webhookSecret && signature) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ [PaymentWebhook] Invalid Razorpay webhook signature detected');
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    const payload = req.body;
    console.log(`🔔 [PaymentWebhook] Received Razorpay event: ${payload?.event || 'UNKNOWN'}`);

    if (payload?.event === 'order.paid' || payload?.event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const userId = paymentEntity?.notes?.userId;
      const amount = (paymentEntity?.amount || 49900) / 100;

      if (userId && orderId) {
        await subscriptionManager.activatePro(userId, {
          orderId,
          paymentId: String(paymentId),
          amount,
          paymentMethod: 'RAZORPAY_WEBHOOK',
          validityDays: 30
        });
        console.log(`✅ [PaymentWebhook] Auto-activated Pro for user: ${userId} via Razorpay Webhook`);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    console.error('❌ [PaymentWebhook] Error processing webhook:', err.message);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

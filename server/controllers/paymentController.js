/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/paymentController.js — Cashfree Payment & Subscription Controller
 *
 * Endpoints:
 *   POST /api/payments/create-order     → Create Cashfree payment order for ₹499 Pro Plan
 *   POST /api/payments/verify           → Verify Cashfree payment and activate Pro membership
 *   GET  /api/payments/subscription     → Get real-time subscription status & remaining days
 *   POST /api/payments/webhook          → Webhook for automated server-to-server payment verification
 *
 * Disheera Technologies Inc.
 */

const cashfreeService = require('../services/cashfreeService');
const subscriptionManager = require('../utils/subscriptionManager');
const { prisma } = require('../config/prisma');

/**
 * POST /api/payments/create-order
 * Creates a Cashfree payment order
 */
exports.createOrder = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount = 499, planName = 'Pro Career Accelerator' } = req.body;

    const origin = req.headers.origin || req.headers.referer;
    let clientUrl = 'https://disheera.site';
    if (origin) {
      try {
        const parsed = new URL(origin);
        clientUrl = parsed.origin;
      } catch (_) {}
    }

    const order = await cashfreeService.createOrder({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      amount,
      planName,
      clientUrl
    });

    return res.status(200).json({
      success: true,
      message: 'Cashfree order created successfully',
      data: order
    });
  } catch (err) {
    console.error('❌ [PaymentController] createOrder error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Could not initiate payment order'
    });
  }
};

/**
 * POST /api/payments/verify
 * Verifies that the order was paid on Cashfree and activates Pro membership
 */
exports.verifyPayment = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required for verification' });
    }

    // 1. Fetch live order details from Cashfree API
    const orderData = await cashfreeService.getOrder(orderId);

    if (orderData.order_status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed yet. Current status: ${orderData.order_status}`,
        orderStatus: orderData.order_status
      });
    }

    // 2. Fetch payment details to obtain payment ID and method
    const payments = await cashfreeService.getOrderPayments(orderId);
    const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS') || payments[0] || {};

    const paymentId = successfulPayment.cf_payment_id || `cf_pay_${Date.now()}`;
    const paymentMethod = successfulPayment.payment_group || 'UPI/Card';
    const amount = orderData.order_amount || 499;

    // 3. Activate PRO Subscription in Database
    const subscription = await subscriptionManager.activatePro(user.id, {
      orderId,
      paymentId: String(paymentId),
      amount,
      paymentMethod,
      validityDays: 30
    });

    return res.status(200).json({
      success: true,
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
 * Cashfree Server-to-Server Webhook Receiver
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // Verify signature
    const isValid = cashfreeService.verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ [PaymentWebhook] Invalid Cashfree webhook signature detected');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const payload = req.body;
    console.log(`🔔 [PaymentWebhook] Received Cashfree event: ${payload?.type || 'UNKNOWN'}`);

    // Check for payment success event
    if (payload?.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderData = payload.data?.order;
      const paymentData = payload.data?.payment;
      const customerData = payload.data?.customer_details;

      const orderId = orderData?.order_id;
      const userId = customerData?.customer_id;
      const paymentId = paymentData?.cf_payment_id;
      const amount = orderData?.order_amount || 499;
      const paymentMethod = paymentData?.payment_group || 'UPI/Card';

      if (userId && orderId) {
        await subscriptionManager.activatePro(userId, {
          orderId,
          paymentId: String(paymentId),
          amount,
          paymentMethod,
          validityDays: 30
        });
        console.log(`✅ [PaymentWebhook] Auto-activated Pro for user: ${userId} via Webhook`);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    console.error('❌ [PaymentWebhook] Error processing webhook:', err.message);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

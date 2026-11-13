/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/razorpayService.js — Razorpay Standard Checkout SDK Wrapper
 *
 * Implements order creation and HMAC-SHA256 signature verification
 * following official Razorpay documentation.
 *
 * Disheera Technologies Inc.
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Returns a configured Razorpay client instance using environment variables
 * @returns {Razorpay}
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    const error = new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in environment variables');
    error.statusCode = 500;
    throw error;
  }

  return new Razorpay({
    key_id,
    key_secret
  });
};

/**
 * Creates a new order on Razorpay
 * @param {Object} params
 * @param {number} params.amount - Amount in paise (minimum 100 paise = ₹1.00)
 * @param {string} [params.currency='INR'] - Currency code
 * @param {string} [params.receipt] - Internal receipt identifier
 * @param {Object} [params.notes] - Custom metadata key-value pairs
 * @returns {Promise<Object>} { order_id, amount, currency, receipt }
 */
exports.createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const numericAmount = Number(amount);
  if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
    const error = new Error('Amount must be at least 100 paise (₹1.00)');
    error.statusCode = 400;
    throw error;
  }

  const instance = getRazorpayInstance();
  const options = {
    amount: Math.round(numericAmount),
    currency: (currency || 'INR').toUpperCase(),
    receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    notes: typeof notes === 'object' && notes !== null ? notes : {}
  };

  try {
    const order = await instance.orders.create(options);
    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    };
  } catch (err) {
    console.error('❌ [RazorpayService.createOrder] Razorpay API Error:', err.message || err);
    const error = new Error(err.error?.description || err.message || 'Razorpay order creation failed');
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

/**
 * Verifies Razorpay payment signature using HMAC-SHA256
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 *
 * @param {Object} params
 * @param {string} params.order_id
 * @param {string} params.payment_id
 * @param {string} params.razorpay_signature
 * @returns {Object} { isValid: boolean, reason?: string }
 */
exports.verifySignature = ({ order_id, payment_id, razorpay_signature }) => {
  if (!order_id || !payment_id || !razorpay_signature) {
    return {
      isValid: false,
      reason: 'Missing order_id, payment_id, or razorpay_signature'
    };
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    const error = new Error('RAZORPAY_KEY_SECRET is missing in environment variables');
    error.statusCode = 500;
    throw error;
  }

  const body = `${order_id}|${payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const providedBuffer = Buffer.from(String(razorpay_signature).trim(), 'utf-8');

  // Prevent timing attacks & buffer mismatch exceptions
  if (expectedBuffer.length !== providedBuffer.length) {
    return {
      isValid: false,
      reason: 'Signature length mismatch'
    };
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  return {
    isValid,
    expectedSignature: isValid ? undefined : expectedSignature
  };
};

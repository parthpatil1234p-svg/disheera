/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/razorpayController.js — Razorpay Standard Checkout Controller
 *
 * Endpoints:
 *   POST /api/create-order     → Create Razorpay order (amount >= 100 paise)
 *   POST /api/verify-payment   → Verify HMAC-SHA256 signature
 *   GET  /api/razorpay/config  → Get public RAZORPAY_KEY_ID (safe for frontend)
 *
 * Disheera Technologies Inc.
 */

const razorpayService = require('../services/razorpayService');

/**
 * POST /api/create-order (or /api/razorpay/create-order)
 * Creates an order on Razorpay API
 *
 * Request body:
 *   - amount: number (in paise, min 100 paise)
 *   - currency?: string (default 'INR')
 *   - receipt?: string
 *   - notes?: object
 *
 * Response:
 *   - order_id: string
 *   - amount: number
 *   - currency: string
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Amount (in paise) is required'
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least 100 paise (₹1.00)'
      });
    }

    const orderData = await razorpayService.createOrder({
      amount: numericAmount,
      currency,
      receipt,
      notes
    });

    return res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      order_id: orderData.order_id,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      key_id: process.env.RAZORPAY_KEY_ID || ''
    });
  } catch (err) {
    console.error('❌ [RazorpayController.createOrder] Error:', err.message);
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to create Razorpay order'
    });
  }
};

/**
 * POST /api/verify-payment (or /api/razorpay/verify-payment)
 * Verifies the payment signature returned by Razorpay Checkout modal
 *
 * Request body:
 *   - razorpay_order_id (or order_id)
 *   - razorpay_payment_id (or payment_id)
 *   - razorpay_signature
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id
    } = req.body;

    const finalOrderId = razorpay_order_id || order_id;
    const finalPaymentId = razorpay_payment_id || payment_id;
    const finalSignature = razorpay_signature;

    // Validate missing fields (return 400)
    if (!finalOrderId || !finalPaymentId || !finalSignature) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Missing required parameters: order_id, payment_id, and razorpay_signature are required'
      });
    }

    const result = razorpayService.verifySignature({
      order_id: finalOrderId,
      payment_id: finalPaymentId,
      razorpay_signature: finalSignature
    });

    // Signature mismatch: return 400, do NOT mark as paid
    if (!result.isValid) {
      console.warn(`⚠️ [RazorpayController.verifyPayment] Signature mismatch for order: ${finalOrderId}, payment: ${finalPaymentId}`);
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Payment verification failed: signature mismatch'
      });
    }

    // Success: signatures match
    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Payment signature verified successfully',
      data: {
        order_id: finalOrderId,
        payment_id: finalPaymentId
      }
    });
  } catch (err) {
    console.error('❌ [RazorpayController.verifyPayment] Error:', err.message);
    return res.status(500).json({
      success: false,
      verified: false,
      message: err.message || 'Failed to verify payment signature'
    });
  }
};

/**
 * GET /api/razorpay/config
 * Returns public Key ID only for client-side checkout initiation
 */
exports.getConfig = (req, res) => {
  return res.status(200).json({
    success: true,
    key_id: process.env.RAZORPAY_KEY_ID || ''
  });
};

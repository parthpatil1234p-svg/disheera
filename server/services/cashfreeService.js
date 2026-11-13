/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/cashfreeService.js — Cashfree Payment Gateway Engine (v2023-08-01)
 *
 * Handles order creation, payment verification, and webhook signature validation
 * with Cashfree Payments API.
 *
 * Disheera Technologies Inc.
 */

const crypto = require('crypto');

class CashfreeService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || '';
    this.secretKey = process.env.CASHFREE_SECRET_KEY || '';
    this.env = (process.env.CASHFREE_ENV || 'PRODUCTION').toUpperCase();
    this.apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    this.baseUrl = this.env === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  getHeaders() {
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': this.apiVersion,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Creates a Cashfree order for a student subscription
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.userName
   * @param {string} params.userEmail
   * @param {string} [params.userPhone]
   * @param {number} [params.amount] - Defaults to 499 (INR)
   * @param {string} [params.planName] - Defaults to Pro Career Accelerator
   * @param {string} [params.clientUrl] - Frontend return host
   */
  async createOrder({ userId, userName, userEmail, userPhone, amount = 499, planName = 'Pro Career Accelerator', clientUrl = 'https://disheera.site' }) {
    if (!this.appId || !this.secretKey) {
      throw new Error('Cashfree credentials are not configured in environment.');
    }

    // Clean phone number (must be 10 digits for Indian carriers)
    let cleanPhone = (userPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }
    if (cleanPhone.length < 10) {
      cleanPhone = '9999999999'; // Fallback compliant 10-digit placeholder if missing
    }

    const orderId = `order_dsh_${Date.now()}_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;
    const baseReturnUrl = clientUrl.replace(/\/+$/, '');

    const payload = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50),
        customer_name: (userName || 'Disheera Student').slice(0, 50),
        customer_email: (userEmail || 'student@disheera.site').slice(0, 100),
        customer_phone: cleanPhone
      },
      order_meta: {
        return_url: `${baseReturnUrl}/dashboard?order_id={order_id}&status={order_status}`,
        notify_url: `https://api.disheera.site/api/payments/webhook`
      },
      order_note: `Disheera ${planName} (30 Days Validity)`
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || 'Failed to create Cashfree order';
      console.error('❌ Cashfree Create Order Error:', data);
      throw new Error(errorMsg);
    }

    return {
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
      orderAmount: data.order_amount,
      orderCurrency: data.order_currency,
      environment: this.env
    };
  }

  /**
   * Fetches order status directly from Cashfree
   * @param {string} orderId
   */
  async getOrder(orderId) {
    if (!orderId) throw new Error('Order ID is required');

    const response = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Cashfree Order ${orderId} not found`);
    }

    return data;
  }

  /**
   * Fetches payments associated with an order to retrieve payment ID, method (UPI/CARD), etc.
   * @param {string} orderId
   */
  async getOrderPayments(orderId) {
    const response = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Verifies Cashfree webhook signature
   * @param {string} rawBody
   * @param {string} signature
   * @param {string} timestamp
   */
  verifyWebhookSignature(rawBody, signature, timestamp) {
    try {
      if (!signature || !timestamp || !this.secretKey) return false;
      const payload = `${timestamp}${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('base64');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (err) {
      console.error('❌ Webhook signature verification error:', err);
      return false;
    }
  }
}

module.exports = new CashfreeService();

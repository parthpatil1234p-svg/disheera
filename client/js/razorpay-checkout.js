/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * js/razorpay-checkout.js — Reusable Razorpay Standard Web Checkout Integration
 *
 * Provides a clean, bulletproof interface to:
 *   1. Dynamically load the Razorpay checkout.js bundle if needed
 *   2. Request an order_id from POST /api/create-order
 *   3. Launch the Razorpay modal with standard parameters
 *   4. Verify the HMAC-SHA256 signature on POST /api/verify-payment
 *   5. Handle modal dismissal and failure events gracefully
 *
 * Disheera Technologies Inc.
 */

(function (window) {
  'use strict';

  const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

  /**
   * Dynamically loads the Razorpay checkout.js script
   * @returns {Promise<boolean>}
   */
  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }

      const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay checkout.js script.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Resolves the backend base URL
   */
  function getApiBaseUrl() {
    if (window.CONFIG && window.CONFIG.API_BASE_URL) {
      return window.CONFIG.API_BASE_URL;
    }
    const origin = window.location.origin;
    if (origin.includes('5500') || origin.includes('5173') || origin.includes('3000')) {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }

  /**
   * Initiates Razorpay Standard Checkout
   * @param {Object} config
   * @param {number} config.amount - Amount in Rupees (converted to paise automatically) OR in paise if isPaise: true
   * @param {boolean} [config.isPaise=false] - Whether amount is already in paise
   * @param {string} [config.currency='INR'] - Currency code
   * @param {string} [config.planName='Disheera Subscription'] - Name of the product or plan
   * @param {Object} [config.prefill] - { name, email, contact }
   * @param {Object} [config.theme] - { color: '#2563EB' }
   * @param {Function} [config.onSuccess] - Callback when payment is verified: fn(verifyResult)
   * @param {Function} [config.onError] - Callback on error: fn(error)
   * @param {Function} [config.onDismiss] - Callback when user closes modal: fn()
   */
  async function openRazorpayCheckout(config = {}) {
    const {
      amount = 499,
      isPaise = false,
      currency = 'INR',
      planName = 'Disheera Standard Plan',
      prefill = {},
      theme = { color: '#2563EB' },
      notes = {},
      onSuccess,
      onError,
      onDismiss
    } = config;

    // 1. Calculate amount in paise (min 100 paise = ₹1.00)
    const amountInPaise = isPaise ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

    if (isNaN(amountInPaise) || amountInPaise < 100) {
      const err = new Error('Amount must be at least ₹1.00 (100 paise)');
      if (typeof onError === 'function') onError(err);
      return;
    }

    // 2. Ensure Razorpay checkout.js is loaded
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      const err = new Error('Could not load Razorpay payment gateway. Please check your internet connection.');
      if (typeof onError === 'function') onError(err);
      return;
    }

    const apiBase = getApiBaseUrl();

    // 3. Create order on backend (POST /api/create-order)
    let orderData;
    try {
      const response = await fetch(`${apiBase}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            planName,
            ...notes
          }
        })
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || `Order creation failed with status ${response.status}`);
      }

      orderData = resJson;
    } catch (err) {
      console.error('❌ [RazorpayCheckout] Order creation failed:', err.message);
      if (typeof onError === 'function') onError(err);
      return;
    }

    const { order_id, key_id, amount: verifiedAmount } = orderData;

    // 4. Configure Razorpay modal options
    const options = {
      key: key_id || window.RAZORPAY_KEY_ID || 'rzp_live_Tzl9Yoenjvn6Nn',
      amount: verifiedAmount,
      currency: currency.toUpperCase(),
      name: 'Disheera Technologies Inc.',
      description: planName,
      image: '/client/assets/brand/disheera_icon_256.png',
      order_id: order_id,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || prefill.phone || ''
      },
      notes: {
        planName,
        ...notes
      },
      theme: {
        color: theme.color || '#2563EB'
      },
      modal: {
        backdropclose: false,
        ondismiss: function () {
          console.log('ℹ️ [RazorpayCheckout] Payment modal dismissed by user.');
          if (typeof onDismiss === 'function') onDismiss();
        }
      },
      handler: async function (response) {
        console.log('💳 [RazorpayCheckout] Payment captured, verifying signature...');
        try {
          // 5. Send order_id, payment_id, and signature to backend verification endpoint
          const verifyRes = await fetch(`${apiBase}/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyJson = await verifyRes.json();
          if (!verifyRes.ok || !verifyJson.success || !verifyJson.verified) {
            throw new Error(verifyJson.message || 'Payment signature verification failed.');
          }

          console.log('✅ [RazorpayCheckout] Payment verified successfully!', verifyJson);
          if (typeof onSuccess === 'function') {
            onSuccess({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              verification: verifyJson
            });
          }
        } catch (err) {
          console.error('❌ [RazorpayCheckout] Signature verification failed:', err.message);
          if (typeof onError === 'function') onError(err);
        }
      }
    };

    // 6. Instantiate and open modal
    try {
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (response) {
        console.error('❌ [RazorpayCheckout] Payment failed event:', response.error);
        const err = new Error(response.error.description || 'Payment transaction failed.');
        err.details = response.error;
        if (typeof onError === 'function') onError(err);
      });

      rzpInstance.open();
    } catch (err) {
      console.error('❌ [RazorpayCheckout] Error opening modal:', err.message);
      if (typeof onError === 'function') onError(err);
    }
  }

  // Export to global window object
  window.DisheeraRazorpay = {
    openCheckout: openRazorpayCheckout,
    loadScript: loadRazorpayScript
  };

})(window);

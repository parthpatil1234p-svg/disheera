/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/razorpay_checkout_test.js — Automated Verification for Razorpay Standard Checkout
 *
 * Verifies:
 *   1. Order creation endpoint (amount >= 100 paise)
 *   2. Validation rejection on amount < 100 paise
 *   3. HMAC-SHA256 signature verification on valid signature
 *   4. Signature verification rejection on tampered/invalid signature
 *   5. Validation rejection on missing parameters
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const crypto = require('crypto');
const razorpayService = require('../services/razorpayService');

async function runTests() {
  console.log('🧪 Starting Razorpay Checkout Test Suite...\n');

  // Test 1: Minimum amount rejection (< 100 paise)
  console.log('Test 1: Rejection of amount < 100 paise...');
  try {
    await razorpayService.createOrder({ amount: 50 });
    assert.fail('Should have thrown an error for amount < 100');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    console.log('  ✓ Correctly rejected amount < 100 paise with status 400.');
  }

  // Test 2: Order creation on Razorpay (Test mode with provided credentials)
  console.log('\nTest 2: Order creation via Razorpay API (amount: 50000 paise = ₹500.00)...');
  const order = await razorpayService.createOrder({
    amount: 50000,
    currency: 'INR',
    receipt: 'test_rcpt_001',
    notes: { test: 'true', platform: 'Disheera' }
  });

  assert(order.order_id, 'Expected order_id in response');
  assert.strictEqual(order.amount, 50000);
  assert.strictEqual(order.currency, 'INR');
  console.log(`  ✓ Successfully created Razorpay order: ${order.order_id} (amount: ${order.amount} paise)`);

  // Test 3: HMAC-SHA256 signature verification (Valid signature)
  console.log('\nTest 3: Signature verification with authentic HMAC-SHA256 signature...');
  const testOrderId = order.order_id;
  const testPaymentId = 'pay_test_' + Date.now();
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');

  const validResult = razorpayService.verifySignature({
    order_id: testOrderId,
    payment_id: testPaymentId,
    razorpay_signature: validSignature
  });

  assert.strictEqual(validResult.isValid, true, 'Valid signature should return isValid: true');
  console.log('  ✓ Authentic signature verified successfully.');

  // Test 4: HMAC-SHA256 signature verification (Tampered/Fake signature)
  console.log('\nTest 4: Signature verification rejection on tampered signature...');
  const fakeSignature = 'bad0000000000000000000000000000000000000000000000000000000000bad';

  const invalidResult = razorpayService.verifySignature({
    order_id: testOrderId,
    payment_id: testPaymentId,
    razorpay_signature: fakeSignature
  });

  assert.strictEqual(invalidResult.isValid, false, 'Fake signature should return isValid: false');
  console.log('  ✓ Tampered signature rejected with isValid: false.');

  // Test 5: Rejection on missing fields
  console.log('\nTest 5: Rejection on missing parameters...');
  const missingResult = razorpayService.verifySignature({
    order_id: testOrderId,
    payment_id: '',
    razorpay_signature: validSignature
  });

  assert.strictEqual(missingResult.isValid, false, 'Missing field should fail');
  console.log('  ✓ Missing field correctly handled.');

  console.log('\n🎉 ALL 5 RAZORPAY BACKEND TESTS PASSED CLEANLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/coupon_verification_test.js — Zero-Payment Coupon Engine Test
 */

const couponService = require('../services/couponService');

async function runTests() {
  console.log('🧪 Starting Coupon & Zero-Payment Promo Test Suite...\n');

  // Test 1: Load default coupons
  console.log('Test 1: Check active coupon registry...');
  const coupons = couponService.getCoupons();
  if (coupons['DISHEERA-ADMIN-VIP'] && coupons['STU-PILOT-PRO5'] && coupons['REC-RADAR-VIP3'] && coupons['CAMPUS-OS-FREE1']) {
    console.log('  ✓ All 4 core coupon tiers registered correctly:');
    console.log(`    - Admin Master: ${coupons['DISHEERA-ADMIN-VIP'].code} (Limit: ${coupons['DISHEERA-ADMIN-VIP'].maxUses})`);
    console.log(`    - Student Pilot: ${coupons['STU-PILOT-PRO5'].code} (Limit: ${coupons['STU-PILOT-PRO5'].maxUses})`);
    console.log(`    - Recruiter Pilot: ${coupons['REC-RADAR-VIP3'].code} (Limit: ${coupons['REC-RADAR-VIP3'].maxUses})`);
    console.log(`    - Campus TPO: ${coupons['CAMPUS-OS-FREE1'].code} (Limit: ${coupons['CAMPUS-OS-FREE1'].maxUses})`);
  } else {
    throw new Error('Default coupons not found in registry');
  }

  // Test 2: Invalid coupon rejection
  console.log('\nTest 2: Rejection of invalid coupon...');
  try {
    await couponService.redeemCoupon({
      userId: 'test_user_id',
      couponCode: 'INVALID-CODE-123',
      userRole: 'student'
    });
    throw new Error('Expected invalid coupon to fail, but succeeded');
  } catch (err) {
    if (err.statusCode === 404) {
      console.log('  ✓ Correctly rejected invalid coupon with 404.');
    } else {
      throw err;
    }
  }

  // Test 3: Role mismatch rejection
  console.log('\nTest 3: Role mismatch rejection (recruiter code on student)...');
  try {
    await couponService.redeemCoupon({
      userId: 'test_student_user',
      couponCode: 'REC-RADAR-VIP3',
      userRole: 'student'
    });
    throw new Error('Expected role mismatch to fail, but succeeded');
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes('only valid for')) {
      console.log('  ✓ Correctly rejected role mismatch: ' + err.message);
    } else {
      throw err;
    }
  }

  console.log('\n🎉 ALL COUPON VERIFICATION TESTS PASSED CLEANLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});

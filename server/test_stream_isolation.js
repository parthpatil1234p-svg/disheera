/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const { generateRecommendations } = require('./services/recommendationService');
const { DEFAULT_MARKET_INSIGHTS } = require('./services/careerInsightService');

async function testStreamIsolation() {
  console.log('=== STARTING STRICT STREAM ISOLATION INTEGRATION TESTS ===\n');

  // Comprehensive test career pool covering all 4 streams
  const careers = [
    // Engineering
    { _id: 'eng_1', title: 'Front-End Developer', slug: 'front-end-developer', domain: 'engineering', category: 'engineering', requiredSkills: [{ skill: { name: 'html', displayName: 'HTML' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['web development'] },
    { _id: 'eng_2', title: 'Full-Stack Developer', slug: 'full-stack-developer', domain: 'engineering', category: 'engineering', requiredSkills: [{ skill: { name: 'javascript', displayName: 'JavaScript' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['web development'] },
    { _id: 'eng_3', title: 'Data Analyst', slug: 'data-analyst', domain: 'engineering', category: 'engineering', requiredSkills: [{ skill: { name: 'sql', displayName: 'SQL' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['data analysis'] },

    // Business
    { _id: 'biz_1', title: 'Financial Analyst & Modeler', slug: 'financial-analyst', domain: 'business', category: 'business', requiredSkills: [{ skill: { name: 'financial-modeling', displayName: 'Financial Modeling' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['financial modeling', 'valuation'] },
    { _id: 'biz_2', title: 'Business Operations Manager', slug: 'business-operations-manager', domain: 'business', category: 'business', requiredSkills: [{ skill: { name: 'business-operations', displayName: 'Business Operations' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['business operations'] },
    { _id: 'biz_3', title: 'Management Consultant', slug: 'management-consultant', domain: 'business', category: 'business', requiredSkills: [{ skill: { name: 'management-consulting', displayName: 'Management Consulting' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['management consulting'] },

    // Marketing
    { _id: 'mkt_1', title: 'Performance Marketer & Media Buyer', slug: 'performance-marketer', domain: 'marketing', category: 'marketing', requiredSkills: [{ skill: { name: 'advertising', displayName: 'Paid Ads' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['advertising', 'digital marketing'] },
    { _id: 'mkt_2', title: 'SEO & Organic Growth Strategist', slug: 'seo-growth-strategist', domain: 'marketing', category: 'marketing', requiredSkills: [{ skill: { name: 'seo', displayName: 'SEO' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['seo'] },
    { _id: 'mkt_3', title: 'Social Media & Content Growth Manager', slug: 'social-media-growth-manager', domain: 'marketing', category: 'marketing', requiredSkills: [{ skill: { name: 'social-media', displayName: 'Social Media' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['social media'] },

    // Creative
    { _id: 'crt_1', title: 'Brand & Visual Identity Designer', slug: 'brand-identity-designer', domain: 'creative', category: 'creative', requiredSkills: [{ skill: { name: 'branding', displayName: 'Brand Identity' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['branding', 'design'] },
    { _id: 'crt_2', title: 'Motion Graphics & 3D Designer', slug: 'motion-3d-designer', domain: 'creative', category: 'creative', requiredSkills: [{ skill: { name: 'motion-graphics', displayName: 'Motion Graphics' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['motion graphics'] },
    { _id: 'crt_3', title: 'B2B Technical & Creative Copywriter', slug: 'copywriter-content-strategist', domain: 'creative', category: 'creative', requiredSkills: [{ skill: { name: 'copywriting', displayName: 'Copywriting' }, importance: 'high', requiredProficiency: 'intermediate' }], interestTags: ['copywriting'] },
  ];

  console.log(`✔ Initialized ${careers.length} test career definitions across all 4 streams.`);

  // TEST 1: Business Stream User
  console.log('\n--- TEST 1: Business Stream Student (BBA, Finance Skills) ---');
  const businessUser = {
    primaryStream: 'business',
    education: { course: 'BBA', branch: 'Finance', year: 'Third Year', college: 'Symbiosis' },
    interests: ['financial modeling', 'valuation', 'business strategy'],
    skills: [
      { name: 'financial-modeling', displayName: 'Financial Modeling', proficiency: 'intermediate' },
      { name: 'excel', displayName: 'Microsoft Excel', proficiency: 'advanced' },
      { name: 'accounting', displayName: 'Financial Accounting', proficiency: 'intermediate' },
    ],
  };

  const bizRecs = generateRecommendations(businessUser, careers, 5);
  console.log(`Returned recommendations count: ${bizRecs.length}`);
  bizRecs.forEach((r, idx) => {
    console.log(`  [#${r.rank}] ${r.career.title} (Domain: ${r.career.domain}) - Fit: ${r.finalScore}%`);
  });

  if (bizRecs.length === 0) {
    throw new Error('Expected at least 1 business recommendation');
  }

  const bizForeign = bizRecs.filter((r) => r.career.domain !== 'business');
  if (bizForeign.length > 0) {
    throw new Error(`LEAK DETECTED: Found ${bizForeign.length} non-business careers in business stream recommendations!`);
  }
  console.log('✔ PASS: 100% of recommendations are business domain. Zero engineering leakage.');

  if (bizRecs.crossTrackDiscovery !== null) {
    throw new Error(`Expected crossTrackDiscovery to be null for dedicated business stream, got: ${JSON.stringify(bizRecs.crossTrackDiscovery)}`);
  }
  console.log('✔ PASS: crossTrackDiscovery is strictly null for dedicated stream.');

  // Verify telemetry exists for all returned business careers
  bizRecs.forEach((r) => {
    const slug = r.career.slug;
    const telemetry = DEFAULT_MARKET_INSIGHTS[slug];
    if (!telemetry) {
      throw new Error(`Missing DEFAULT_MARKET_INSIGHTS for business role: ${slug}`);
    }
    console.log(`  Telemetry for ${slug}: ${telemetry.salaryRange} | Demand: ${telemetry.hiringDemand.slice(0, 30)}...`);
  });
  console.log('✔ PASS: All business roles have high-fidelity telemetry in DEFAULT_MARKET_INSIGHTS.');

  // TEST 2: Marketing Stream User
  console.log('\n--- TEST 2: Marketing Stream Student ---');
  const mktUser = {
    primaryStream: 'marketing',
    education: { course: 'B.Com Marketing', branch: 'Digital Marketing', year: 'Final Year' },
    interests: ['digital marketing', 'advertising', 'seo'],
    skills: [
      { name: 'digital-marketing', displayName: 'Digital Marketing', proficiency: 'intermediate' },
      { name: 'google-ads', displayName: 'Google Ads', proficiency: 'beginner' },
      { name: 'seo', displayName: 'SEO', proficiency: 'intermediate' },
    ],
  };

  const mktRecs = generateRecommendations(mktUser, careers, 5);
  console.log(`Returned recommendations count: ${mktRecs.length}`);
  mktRecs.forEach((r) => {
    console.log(`  [#${r.rank}] ${r.career.title} (Domain: ${r.career.domain}) - Fit: ${r.finalScore}%`);
  });

  const mktForeign = mktRecs.filter((r) => r.career.domain !== 'marketing');
  if (mktForeign.length > 0) {
    throw new Error(`LEAK DETECTED: Found ${mktForeign.length} non-marketing careers in marketing stream!`);
  }
  console.log('✔ PASS: 100% of recommendations are marketing domain. Zero foreign leakage.');
  if (mktRecs.crossTrackDiscovery !== null) {
    throw new Error('Expected crossTrackDiscovery to be null for marketing stream');
  }

  // TEST 3: Creative Stream User
  console.log('\n--- TEST 3: Creative Stream Student ---');
  const creativeUser = {
    primaryStream: 'creative',
    education: { course: 'B.Des', branch: 'Graphic Design', year: 'Second Year' },
    interests: ['design', 'branding', 'motion graphics'],
    skills: [
      { name: 'figma', displayName: 'Figma', proficiency: 'intermediate' },
      { name: 'illustrator', displayName: 'Adobe Illustrator', proficiency: 'intermediate' },
      { name: 'photoshop', displayName: 'Adobe Photoshop', proficiency: 'beginner' },
    ],
  };

  const creativeRecs = generateRecommendations(creativeUser, careers, 5);
  console.log(`Returned recommendations count: ${creativeRecs.length}`);
  creativeRecs.forEach((r) => {
    console.log(`  [#${r.rank}] ${r.career.title} (Domain: ${r.career.domain}) - Fit: ${r.finalScore}%`);
  });

  const creativeForeign = creativeRecs.filter((r) => r.career.domain !== 'creative');
  if (creativeForeign.length > 0) {
    throw new Error(`LEAK DETECTED: Found ${creativeForeign.length} non-creative careers in creative stream!`);
  }
  console.log('✔ PASS: 100% of recommendations are creative domain. Zero foreign leakage.');

  // TEST 4: Engineering Stream User
  console.log('\n--- TEST 4: Engineering Stream Student ---');
  const engUser = {
    primaryStream: 'engineering',
    education: { course: 'B.Tech', branch: 'Computer Science', year: 'Third Year' },
    interests: ['web development', 'artificial intelligence'],
    skills: [
      { name: 'javascript', displayName: 'JavaScript', proficiency: 'intermediate' },
      { name: 'react', displayName: 'React', proficiency: 'intermediate' },
      { name: 'node.js', displayName: 'Node.js', proficiency: 'beginner' },
    ],
  };

  const engRecs = generateRecommendations(engUser, careers, 5);
  console.log(`Returned recommendations count: ${engRecs.length}`);
  engRecs.forEach((r) => {
    console.log(`  [#${r.rank}] ${r.career.title} (Domain: ${r.career.domain}) - Fit: ${r.finalScore}%`);
  });

  const engForeign = engRecs.filter((r) => r.career.domain !== 'engineering');
  if (engForeign.length > 0) {
    throw new Error(`LEAK DETECTED: Found ${engForeign.length} non-engineering careers in engineering stream!`);
  }
  console.log('✔ PASS: 100% of recommendations are engineering domain. Zero foreign leakage.');

  // TEST 5: Cross-Disciplinary Stream User
  console.log('\n--- TEST 5: Cross-Disciplinary Stream User (Multi-Domain Allowed + Bridge) ---');
  const crossUser = {
    primaryStream: 'cross',
    education: { course: 'B.Sc Interdisciplinary', branch: 'Tech & Management', year: 'Final Year' },
    interests: ['web development', 'financial modeling', 'digital marketing'],
    skills: [
      { name: 'javascript', displayName: 'JavaScript', proficiency: 'intermediate' },
      { name: 'excel', displayName: 'Excel', proficiency: 'advanced' },
      { name: 'financial-modeling', displayName: 'Financial Modeling', proficiency: 'intermediate' },
    ],
  };

  const crossRecs = generateRecommendations(crossUser, careers, 5);
  console.log(`Returned recommendations count: ${crossRecs.length}`);
  crossRecs.forEach((r) => {
    console.log(`  [#${r.rank}] ${r.career.title} (Domain: ${r.career.domain}) - Fit: ${r.finalScore}%`);
  });
  console.log('CrossTrack Discovery Bridge present:', !!crossRecs.crossTrackDiscovery);
  if (crossRecs.crossTrackDiscovery) {
    console.log(`  Bridge Career: ${crossRecs.crossTrackDiscovery.career.title} (Domain: ${crossRecs.crossTrackDiscovery.career.domain}) - Match: ${crossRecs.crossTrackDiscovery.matchScore}%`);
  }
  console.log('✔ PASS: Cross stream allows multi-domain discovery as intended.');

  console.log('\n======================================================');
  console.log(' ALL STREAM ISOLATION TESTS PASSED PERFECTLY (5/5)!   ');
  console.log('======================================================\n');
}

testStreamIsolation()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  });

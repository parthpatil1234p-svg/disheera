/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const fs = require('fs');
const assert = require('assert');
const { PDFParse } = require('pdf-parse');

const { generateCoverPagePdf } = require('../server/services/assignmentTemplateService');

async function testPdfWithQuestions() {
  console.log('--- [Test A: Generating PDF WITHOUT Questions (1-Page Cover)] ---');
  const buf1 = await generateCoverPagePdf({
    studentName: 'Parth Patil',
    email: 'parthpatil1234p@gmail.com',
    rollNumber: 'BFC05351',
    college: 'Gh Raisoni College of Enginnering & management, Jalgaon',
    department: 'Information Technology',
    careerTitle: 'Front-End Developer',
    weekNumber: 1,
    assignmentTitle: 'Front-End Developer — Semantic Foundations, Component Architecture & State Lifecycles'
  });

  const parser1 = new PDFParse({ data: buf1 });
  const loaded1 = await parser1.load();
  const pages1 = loaded1?.numPages;
  console.log('✓ Pages without questions:', pages1);
  assert.strictEqual(pages1, 1, 'Without questions, PDF must be exactly 1 page');

  console.log('\n--- [Test B: Generating PDF WITH Questions (Multi-Page with Question Paper)] ---');
  const sampleQuestions = [
    {
      qNumber: 1,
      type: 'architecture_derivation',
      marks: 3.5,
      prompt: 'Illustrate the complete reconciliation and render cycle of a composite dashboard application when user authentication changes. Show the component tree, prop drill flow, and reconciliation diffing algorithm steps.',
      expectedKeywords: ['Virtual DOM', 'Reconciliation', 'Diffing', 'Component Tree', 'State Propagation']
    },
    {
      qNumber: 2,
      type: 'code_implementation',
      marks: 3.5,
      prompt: 'Write a self-contained custom hook useDebouncedAsyncSearch(query, delay) in TypeScript/JavaScript. Handle race conditions where earlier pending promises resolve after subsequent queries, abort controllers, and component unmount cleanup.',
      expectedKeywords: ['AbortController', 'race condition', 'useEffect cleanup', 'debounce', 'stale state']
    },
    {
      qNumber: 3,
      type: 'security_and_performance',
      marks: 3.0,
      prompt: 'Derive a comprehensive security defense matrix protecting this frontend architecture against XSS injection, CSRF token theft, and clickjacking attacks. Include HTTP header configurations (CSP, CORS, X-Frame-Options).',
      expectedKeywords: ['Content Security Policy', 'SameSite cookies', 'anti-CSRF tokens', 'sanitization', 'X-Frame-Options']
    }
  ];

  const buf2 = await generateCoverPagePdf({
    studentName: 'Parth Patil',
    email: 'parthpatil1234p@gmail.com',
    rollNumber: 'BFC05351',
    college: 'Gh Raisoni College of Enginnering & management, Jalgaon',
    department: 'Information Technology',
    careerTitle: 'Front-End Developer',
    weekNumber: 1,
    assignmentTitle: 'Front-End Developer — Semantic Foundations, Component Architecture & State Lifecycles',
    description: 'Collegiate practical lab on frontend component lifecycles, unidirectional state flow, and DOM tree reconciliation.',
    questions: sampleQuestions,
    learningOutcomes: [
      'Component hierarchy decomposition',
      'React/Virtual DOM reconciliation mechanics',
      'State lifting and side-effect hygiene'
    ],
    maxMarks: 10
  });

  const parser2 = new PDFParse({ data: buf2 });
  const loaded2 = await parser2.load();
  const pages2 = loaded2?.numPages;
  console.log('✓ Pages with questions:', pages2);
  assert.strictEqual(pages2, 2, `With questions, PDF must be exactly 2 pages (received: ${pages2})`);
  assert(buf2.length > buf1.length + 2000, 'Multi-page PDF with questions must be larger than 1-page cover');

  console.log('\n🎉 ALL PDF WITH QUESTIONS TESTS PASSED PERFECTLY!\n');
}

testPdfWithQuestions().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

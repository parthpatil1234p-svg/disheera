/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * rebrand_to_disheera.js
 * Comprehensive automated rebranding script: DheePath -> Disheera
 */

const fs = require('fs');
const path = require('path');

const dheepathDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(dheepathDir, '..');

// File extensions to process
const validExtensions = new Set([
  '.html', '.js', '.css', '.json', '.txt', '.xml', '.webmanifest', '.svg', '.md', '.prisma', '.yaml', '.yml', '.tsx', '.ts', '.example', ''
]);

// Ignored directory names
const ignoredDirs = new Set([
  'node_modules', '.git', '.gemini', 'audit_screenshots', 'dist', 'build'
]);

// Exact & pattern-based replacement definitions in strict priority order
const replacements = [
  // URL-encoded strings
  { from: /DheePath%20/gi, to: 'Disheera%20' },
  { from: /%20DheePath/gi, to: '%20Disheera' },

  // Underscore-separated strings
  { from: /DheePath_/gi, to: 'Disheera_' },
  { from: /_DheePath/gi, to: '_Disheera' },

  // 1. HTML Two-tone Brand Stylings
  { from: /Dhee\s*<span class="brand-accent">Path<\/span>/g, to: 'Dishe<span class="brand-accent">era</span>' },
  { from: /Dhee\s*<span class="text-primary">Path<\/span>/g, to: 'Dishe<span class="text-primary">era</span>' },
  { from: /Dhee\s*<span class="brand-accent fs-5">Path<\/span>/g, to: 'Dishe<span class="brand-accent fs-5">era</span>' },
  { from: /Dhee\s*<span class="brand-accent fs-4">Path<\/span>/g, to: 'Dishe<span class="brand-accent fs-4">era</span>' },
  { from: /Dhee\s*<span class="text-primary fs-5">Path<\/span>/g, to: 'Dishe<span class="text-primary fs-5">era</span>' },
  { from: /Dhee\s*<span>Path<\/span>/g, to: 'Dishe<span>era</span>' },
  { from: /Dhee&nbsp;<span class="brand-accent">Path<\/span>/g, to: 'Dishe<span class="brand-accent">era</span>' },
  { from: /Dhee\s*<tspan fill="#2563EB">Path<\/tspan>/g, to: 'Dishe<tspan fill="#2563EB">era</tspan>' },
  { from: /alt="DheePath Logo"/g, to: 'alt="Disheera Logo"' },
  { from: /alt="DheePath"/g, to: 'alt="Disheera"' },

  // 2. Legal & Institutional Entities
  { from: /DheePath\s+Technologies\s+Inc\./g, to: 'Disheera Technologies Inc.' },
  { from: /DheePath\s+Technologies/g, to: 'Disheera Technologies' },
  { from: /DheePath\s+Global\s+Talent\s+Protocol/g, to: 'Disheera Global Talent Protocol' },
  { from: /DheePath\s+Global\s+Credential\s+Registry/g, to: 'Disheera Global Credential Registry' },
  { from: /DheePath\s+Global\s+Accreditation\s+Registry/g, to: 'Disheera Global Accreditation Registry' },
  { from: /DheePath\s+Accreditation\s+Board/g, to: 'Disheera Accreditation Board' },
  { from: /DheePath\s+Knowledge\s+Engine/g, to: 'Disheera Knowledge Engine' },
  { from: /DheePath\s+Learning\s+Hub/g, to: 'Disheera Learning Hub' },
  { from: /DheePath\s+Talent\s+Radar/g, to: 'Disheera Talent Radar' },
  { from: /DheePath\s+Verified/g, to: 'Disheera Verified' },
  { from: /DheePath\s+Academy/g, to: 'Disheera Academy' },
  { from: /DheePath\s+Team/g, to: 'Disheera Team' },
  { from: /DheePath\s+Web\s+Platform/g, to: 'Disheera Web Platform' },
  { from: /DheePath\s+Platform/g, to: 'Disheera Platform' },
  { from: /DheePath\s+Mentor/g, to: 'Disheera Mentor' },
  { from: /DheePath\s+Student/g, to: 'Disheera Student' },
  { from: /DheePath\s+Support/g, to: 'Disheera Support' },
  { from: /DheePath\s+Ecosystem/g, to: 'Disheera Ecosystem' },
  { from: /DheePath\s+OS/g, to: 'Disheera OS' },
  { from: /DheePath\s+GPS/g, to: 'Disheera GPS' },
  { from: /DheePath\s+Real-Time\s+Mentor/g, to: 'Disheera Real-Time Mentor' },
  { from: /DheePath\s+Skill\s+Passport/g, to: 'Disheera Skill Passport' },
  { from: /DheePath\s+Deterministic\s+Rubric\s+Evaluator/g, to: 'Disheera Deterministic Rubric Evaluator' },

  // 3. Technical Identifiers, User-Agents, and Variables
  { from: /DheePath-Project-Verifier/g, to: 'Disheera-Project-Verifier' },
  { from: /DheePath-Project-Evaluator/g, to: 'Disheera-Project-Evaluator' },
  { from: /DheePath-Platform/g, to: 'Disheera-Platform' },
  { from: /DheePath-Study-Platform/g, to: 'Disheera-Study-Platform' },
  { from: /DheePath-Verifier/g, to: 'Disheera-Verifier' },
  { from: /DHEEPATH_COMMANDS_MENU/g, to: 'DISHEERA_COMMANDS_MENU' },
  { from: /DheePath_Roadmap_Notes/g, to: 'Disheera_Roadmap_Notes' },
  { from: /DheePath_Week_1_Notes/g, to: 'Disheera_Week_1_Notes' },
  { from: /DheePath_\$\{/g, to: 'Disheera_${' },
  { from: /dheepath-server/g, to: 'disheera-server' },
  { from: /dheepath-api/g, to: 'disheera-api' },
  { from: /dheepath\.vercel\.app/g, to: 'disheera.vercel.app' },
  { from: /dheepath\.site/g, to: 'disheera.site' },
  { from: /admin@dheepath\.site/g, to: 'admin@disheera.site' },
  { from: /campus@dheepath\.is-local\.org/g, to: 'campus@disheera.site' },
  { from: /code-dheepath-2026/g, to: 'code-disheera-2026' },
  { from: /dheepath_skill_passport_qr\.png/g, to: 'disheera_skill_passport_qr.png' },
  { from: /Resume_DheePath\.pdf/g, to: 'Resume_Disheera.pdf' },
  { from: /DheePath_Week_\$\{activeWeek\}_Study_Notes\.pdf/g, to: 'Disheera_Week_${activeWeek}_Study_Notes.pdf' },
  { from: /window\.DheePathChat/g, to: 'window.DisheeraChat' },
  { from: /window\.DheePathSocket/g, to: 'window.DisheeraSocket' },
  { from: /DheePathChat/g, to: 'DisheeraChat' },
  { from: /DheePathSocket/g, to: 'DisheeraSocket' },
  { from: /github\.com\/parthpatil1234p-svg\/dheepath/g, to: 'github.com/parthpatil1234p-svg/disheera' },
  { from: /github\.com\/alex\/dheepath/g, to: 'github.com/alex/disheera' },
  { from: /'dheepath\/avatars'/g, to: "'disheera/avatars'" },
  { from: /'dheepath\/resumes'/g, to: "'disheera/resumes'" },

  // 4. Case-preserving word boundary tokens
  { from: /\bDheePath\b/g, to: 'Disheera' },
  { from: /\bDheepath\b/g, to: 'Disheera' },
  { from: /\bdheepath\b/g, to: 'disheera' },
  { from: /\bDHEEPATH\b/g, to: 'DISHEERA' }
];

let filesModified = 0;
let totalChanges = 0;

function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!validExtensions.has(ext)) return;

  // Do not rewrite this script itself
  if (path.basename(filePath) === 'rebrand_to_disheera.js') return;

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    let fileChanges = 0;

    for (const r of replacements) {
      const match = content.match(r.from);
      if (match) {
        fileChanges += match.length;
        content = content.replace(r.from, r.to);
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
      totalChanges += fileChanges;
      console.log(`[UPDATED] (${fileChanges} replacements) ${path.relative(parentDir, filePath)}`);
    }
  } catch (err) {
    console.error(`[ERROR] Processing ${filePath}:`, err.message);
  }
}

function walkDirectory(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

console.log('====================================================');
console.log('   DISHEERA REBRANDING AUTOMATION SUITE             ');
console.log('====================================================\n');

// 1. Walk dheepath directory
console.log('Processing dheepath/ subproject...');
walkDirectory(dheepathDir);

// 2. Walk parent docs, presentation, and .github
console.log('Processing parent docs, presentation, and .github...');
walkDirectory(path.join(parentDir, 'docs'));
walkDirectory(path.join(parentDir, 'presentation'));
walkDirectory(path.join(parentDir, '.github'));

// 3. Process individual root files in parentDir
const parentRootFiles = [
  'README.md',
  'GEMINI.md',
  'AGENTS.md',
  'PRODUCT.md',
  'SECURITY.md',
  'SESSION_MEMORY.md',
  'package.json',
  'package-lock.json',
  'CareerPath_AI_Job_Alerts_n8n.json',
  'SEVA_INNOVATION_CHALLENGE_SUBMISSION.md',
  'SEVA_INNOVATION_JALGAON_APPLICATION_PACKAGE.md',
  'FullStack_Developer_Pitch_Guide.html',
  'HACK2IGNITE_2026_IDEA_PPT_SUBMISSION.md'
];

for (const f of parentRootFiles) {
  const fp = path.join(parentDir, f);
  if (fs.existsSync(fp)) {
    processFile(fp);
  }
}

console.log('\n====================================================');
console.log(`REBRANDING COMPLETE:`);
console.log(`Files Modified:   ${filesModified}`);
console.log(`Total Changes:    ${totalChanges}`);
console.log('====================================================');

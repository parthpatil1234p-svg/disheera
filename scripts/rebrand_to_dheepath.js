/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * rebrand_to_Disheera.js
 * Comprehensive automated rebranding script: Disheera -> Disheera
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');

// File extensions to process
const validExtensions = new Set([
  '.html', '.js', '.css', '.json', '.txt', '.xml', '.webmanifest', '.svg', '.md', '.prisma', '.yaml', '.yml'
]);

// Ignored directory names
const ignoredDirs = new Set([
  'node_modules', '.git', '.gemini', 'graft', '.claude', '.serena', 'audit_screenshots', 'dist', 'build'
]);

// Exact & pattern-based replacement definitions
// Processed in strict priority order (most specific first)
const replacements = [
  // HTML two-tone brand styling
  { from: /CareerPath\s*<span class="brand-accent">AI<\/span>/g, to: 'Dishe<span class="brand-accent">era</span>' },
  { from: /CareerPath\s*<span class="text-primary">AI<\/span>/g, to: 'Dishe<span class="text-primary">era</span>' },
  { from: /CareerPath\s*<span class="brand-accent fs-5">AI<\/span>/g, to: 'Dishe<span class="brand-accent fs-5">era</span>' },
  { from: /CareerPath\s*<span class="brand-accent fs-4">AI<\/span>/g, to: 'Dishe<span class="brand-accent fs-4">era</span>' },
  { from: /CareerPath\s*<span class="text-primary fs-5">AI<\/span>/g, to: 'Dishe<span class="text-primary fs-5">era</span>' },
  { from: /CareerPath\s*<span>AI<\/span>/g, to: 'Dishe<span>era</span>' },
  { from: /CareerPath&nbsp;<span class="brand-accent">AI<\/span>/g, to: 'Dishe<span class="brand-accent">era</span>' },
  { from: /CareerPath\s*<span class="text-primary">AI<\/span>\s*Technologies/g, to: 'Disheera Technologies' },

  // Legal & Institutional Entities
  { from: /CareerPath\s+AI\s+Technologies\s+Inc\./gi, to: 'Disheera Technologies Inc.' },
  { from: /CareerPath\s+Technologies\s+Inc\./gi, to: 'Disheera Technologies Inc.' },
  { from: /CareerPath\s+AI\s+Global\s+Talent\s+Protocol/gi, to: 'Disheera Global Talent Protocol' },
  { from: /CareerPath\s+Global\s+Talent\s+Protocol/gi, to: 'Disheera Global Talent Protocol' },
  { from: /CareerPath\s+AI\s+Global\s+Credential\s+Registry/gi, to: 'Disheera Global Credential Registry' },
  { from: /CareerPath\s+Global\s+Credential\s+Registry/gi, to: 'Disheera Global Credential Registry' },
  { from: /CareerPath\s+AI\s+Accreditation\s+Board/gi, to: 'Disheera Accreditation Board' },
  { from: /CareerPath\s+Accreditation\s+Board/gi, to: 'Disheera Accreditation Board' },
  { from: /CareerPath\s+AI\s+Knowledge\s+Engine/gi, to: 'Disheera Knowledge Engine' },
  { from: /CareerPath\s+Knowledge\s+Engine/gi, to: 'Disheera Knowledge Engine' },
  { from: /CareerPath\s+AI\s+Learning\s+Hub/gi, to: 'Disheera Learning Hub' },
  { from: /CareerPath\s+Learning\s+Hub/gi, to: 'Disheera Learning Hub' },
  { from: /CareerPath\s+AI\s+Talent\s+Radar/gi, to: 'Disheera Talent Radar' },
  { from: /CareerPath\s+Talent\s+Radar/gi, to: 'Disheera Talent Radar' },
  { from: /CareerPath\s+AI\s+Verified/gi, to: 'Disheera Verified' },
  { from: /CareerPath\s+Verified/gi, to: 'Disheera Verified' },
  { from: /CareerPath\s+Academy/gi, to: 'Disheera Academy' },
  { from: /CareerPath\s+AI\s+Team/gi, to: 'Disheera Team' },
  { from: /CareerPath\s+Team/gi, to: 'Disheera Team' },
  { from: /CareerPath\s+AI\s+Web\s+Platform/gi, to: 'Disheera Web Platform' },
  { from: /CareerPath\s+Web\s+Platform/gi, to: 'Disheera Web Platform' },
  { from: /CareerPath\s+AI\s+Platform/gi, to: 'Disheera Platform' },
  { from: /CareerPath\s+Platform/gi, to: 'Disheera Platform' },
  { from: /CareerPath\s+AI\s+Mentor/gi, to: 'Disheera Mentor' },
  { from: /CareerPath\s+Mentor/gi, to: 'Disheera Mentor' },
  { from: /CareerPath\s+AI\s+Student/gi, to: 'Disheera Student' },
  { from: /CareerPath\s+Student/gi, to: 'Disheera Student' },
  { from: /CareerPath\s+AI\s+Support/gi, to: 'Disheera Support' },
  { from: /CareerPath\s+Support/gi, to: 'Disheera Support' },
  { from: /CareerPath\s+AI\s+Ecosystem/gi, to: 'Disheera Ecosystem' },
  { from: /CareerPath\s+Ecosystem/gi, to: 'Disheera Ecosystem' },
  { from: /CareerPath\s+AI\s+OS/gi, to: 'Disheera OS' },
  { from: /CareerPath\s+OS/gi, to: 'Disheera OS' },
  { from: /CareerPath\s+AI\s+GPS/gi, to: 'Disheera GPS' },
  { from: /CareerPath\s+GPS/gi, to: 'Disheera GPS' },

  // General Brand Names
  { from: /\bCareerPath\s+AI\b/g, to: 'Disheera' },
  { from: /\bCareerpath\s+AI\b/g, to: 'Disheera' },
  { from: /\bcareerpath\s+ai\b/g, to: 'disheera' },
  { from: /\bCAREERPATH\s+AI\b/g, to: 'DISHEERA' },
  { from: /\bCareerPath-AI\b/g, to: 'Disheera' },
  { from: /\bCareerPathAI\b/g, to: 'Disheera' },
  { from: /\bcareerpath-ai\b/g, to: 'disheera' },

  // Brand Prepositions & Predicates
  { from: /\bWelcome to Disheera\b/gi, to: 'Welcome to Disheera' },
  { from: /\bon CareerPath\b/gi, to: 'on Disheera' },
  { from: /\bin CareerPath\b/gi, to: 'in Disheera' },
  { from: /\bwith CareerPath\b/gi, to: 'with Disheera' },
  { from: /\bby CareerPath\b/gi, to: 'by Disheera' },
  { from: /\babout CareerPath\b/gi, to: 'about Disheera' },
  { from: /\busing CareerPath\b/gi, to: 'using Disheera' },
  { from: /\bat CareerPath\b/gi, to: 'at Disheera' },
  { from: /\bto CareerPath\b/gi, to: 'to Disheera' },
  { from: /\bfrom CareerPath\b/gi, to: 'from Disheera' },
  { from: /\bCareerPath account\b/gi, to: 'Disheera account' },
  { from: /\bCareerPath's\b/gi, to: "Disheera's" },
  { from: /\bCareerPath is\b/gi, to: 'Disheera is' },
  { from: /\bCareerPath provides\b/gi, to: 'Disheera provides' },
  { from: /\bCareerPath operates\b/gi, to: 'Disheera operates' },
  { from: /\bCareerPath enforces\b/gi, to: 'Disheera enforces' },
  { from: /\bCareerPath claims\b/gi, to: 'Disheera claims' },
  { from: /\bCareerPath owns\b/gi, to: 'Disheera owns' },
  { from: /\bCareerPath will\b/gi, to: 'Disheera will' },
  { from: /\bCareerPath was\b/gi, to: 'Disheera was' },
  { from: /\bCareerPath eliminated\b/gi, to: 'Disheera eliminated' },
  { from: /\bCareerPath eliminates\b/gi, to: 'Disheera eliminates' },
  { from: /\bCareerPath empowers\b/gi, to: 'Disheera empowers' },
  { from: /\bCareerPath bridges\b/gi, to: 'Disheera bridges' },
  { from: /\bCareerPath delivers\b/gi, to: 'Disheera delivers' },
  { from: /\bCareerPath activates\b/gi, to: 'Disheera activates' },
  { from: /\bCareerPath features\b/gi, to: 'Disheera features' },
  { from: /\bCareerPath uses\b/gi, to: 'Disheera uses' },
  { from: /\bDisheera Supports\b/gi, to: 'Disheera supports' },
  { from: /\bCareerPath accreditation\b/gi, to: 'Disheera accreditation' },
  { from: /\bCareerPath credential\b/gi, to: 'Disheera credential' },
  { from: /\bCareerPath ledger\b/gi, to: 'Disheera ledger' },
  { from: /\bCareerPath certificate\b/gi, to: 'Disheera certificate' },
  { from: /\bCareerPath roadmap\b/gi, to: 'Disheera roadmap' },
  { from: /\bCareerPath diagnostic\b/gi, to: 'Disheera diagnostic' },
  { from: /\bCareerPath assessment\b/gi, to: 'Disheera assessment' },
  { from: /\bCareerPath radar\b/gi, to: 'Disheera radar' },
  { from: /\bCareerPath talent\b/gi, to: 'Disheera talent' },
  { from: /\bCareerPath candidate\b/gi, to: 'Disheera candidate' },
  { from: /\bCareerPath recruiter\b/gi, to: 'Disheera recruiter' },
  { from: /\bDisheera Student\b/gi, to: 'Disheera student' },
  { from: /\bCareerPath portal\b/gi, to: 'Disheera portal' }
];

let filesModified = 0;
let totalChanges = 0;

function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!validExtensions.has(ext)) return;

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
      console.log(`[UPDATED] (${fileChanges} replacements) ${path.relative(rootDir, filePath)}`);
    }
  } catch (err) {
    console.error(`[ERROR] Processing ${filePath}:`, err.message);
  }
}

function walkDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
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

// 1. Process disheera subproject
walkDirectory(rootDir);

// 2. Process specific parent project files
const parentFiles = [
  'CareerPath_AI_Job_Alerts_n8n.json',
  'SEVA_INNOVATION_CHALLENGE_SUBMISSION.md',
  'SEVA_INNOVATION_JALGAON_APPLICATION_PACKAGE.md',
  'docs/VIDEO_RESOURCE_TRANSFORMATION_PLAN.md'
];

for (const rel of parentFiles) {
  const fp = path.join(parentDir, rel);
  if (fs.existsSync(fp)) {
    processFile(fp);
  }
}

console.log('\n====================================================');
console.log(`REBRANDING COMPLETE:`);
console.log(`Files Modified:   ${filesModified}`);
console.log(`Total Changes:    ${totalChanges}`);
console.log('====================================================');

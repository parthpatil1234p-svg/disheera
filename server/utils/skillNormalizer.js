/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * skillNormalizer.js — Centralized Canonical Skill Slug & Key Normalization
 */

const CANONICAL_ALIASES = {
  'nodejs': 'node.js',
  'node': 'node.js',
  'reactjs': 'react',
  'react.js': 'react',
  'express': 'express.js',
  'expressjs': 'express.js',
  'html5': 'html',
  'css3': 'css',
  'js': 'javascript',
  'py': 'python',
  'golang': 'go',
  'ts': 'typescript',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'k8s': 'kubernetes',
  'tailwind': 'tailwind-css',
  'next': 'next.js',
  'nextjs': 'next.js',
  'tf': 'terraform',
  'rest': 'rest-apis',
  'restapi': 'rest-apis',
  'rest-api': 'rest-apis',
  'fast-api': 'fastapi',
  'ui/ux': 'ui/ux-design',
  'uiux': 'ui/ux-design',
};

function normalizeSkillKey(skill) {
  if (!skill) return '';
  const s = String(skill).toLowerCase().trim();
  if (CANONICAL_ALIASES[s]) return CANONICAL_ALIASES[s];

  const cleanStr = s.replace(/[^a-z0-9+#.-]/g, ' ');
  const tokens = cleanStr.split(/\s+/).filter(Boolean);

  if (s.includes('html')) return 'html';
  if (s.includes('tailwind')) return 'tailwind-css';
  if (s.includes('css') || s.includes('responsive')) return 'css';
  if (s.includes('react native') || s.includes('react-native')) return 'react-native';
  if (s.includes('next.js') || s.includes('nextjs')) return 'next.js';
  if (s.includes('react')) return 'react';
  if (s.includes('javascript') || tokens.includes('js')) return 'javascript';
  if (s.includes('typescript') || tokens.includes('ts')) return 'typescript';
  if (s.includes('express')) return 'express.js';
  if (s.includes('node') || s.includes('nodejs')) return 'node.js';
  if (s.includes('mongodb') || s.includes('mongo')) return 'mongodb';
  if (s.includes('postgres')) return 'postgresql';
  if (s.includes('sql') || s.includes('database')) return 'sql';
  if (s.includes('unity') || s.includes('game-dev') || s.includes('game dev') || s.includes('game')) return 'unity';
  if (s.includes('unreal')) return 'unreal';
  if (s.includes('c#') || s.includes('csharp')) return 'csharp';
  if (s.includes('c++') || s.includes('cpp')) return 'cpp';
  if (s.includes('figma')) return 'figma';
  if (s.includes('ui') || s.includes('ux') || s.includes('design') || s.includes('wirefram')) return 'ui-ux';
  if (s.includes('flutter')) return 'flutter';
  if (s.includes('mobile')) return 'mobile';
  if (s.includes('docker') || s.includes('container')) return 'docker';
  if (s.includes('kubernetes') || s.includes('k8s')) return 'kubernetes';
  if (s.includes('devops') || s.includes('ci/cd') || s.includes('pipeline')) return 'devops';
  if (s.includes('aws') || s.includes('cloud')) return 'aws';
  if (s.includes('security') || s.includes('cyber') || s.includes('owasp') || s.includes('hack')) return 'cybersecurity';
  if (s.includes('finance') || s.includes('valuation') || s.includes('accounting') || s.includes('dcf') || s.includes('ebitda')) return 'finance';
  if (s.includes('baidu')) return 'baidu-seo';
  if (s.includes('aeo') || s.includes('llms') || s.includes('answer engine') || s.includes('ai search')) return 'aeo';
  if (s.includes('technical-seo') || s.includes('technical seo')) return 'technical-seo';
  if (s.includes('marketing') || s.includes('ads') || s.includes('meta-ads') || s.includes('google-ads')) return 'marketing';
  if (s.includes('seo')) return 'seo';
  if (s.includes('product') || s.includes('agile') || s.includes('scrum')) return 'product';
  if (s.includes('python') || s.includes('pandas') || s.includes('numpy')) return 'python';
  if (s.includes('data science') || s.includes('machine learning') || tokens.includes('ai') || tokens.includes('ml')) return 'ai-ml';
  if (s.includes('git') || s.includes('github')) return 'git';
  if (s.includes('rest') || s.includes('api')) return 'rest-apis';
  return s.replace(/[^a-z0-9_-]/g, '');
}

module.exports = {
  normalizeSkillKey,
  CANONICAL_ALIASES
};

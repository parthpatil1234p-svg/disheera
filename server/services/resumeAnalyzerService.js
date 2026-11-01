/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/resumeAnalyzerService.js — AI Resume ATS Scoring & Keyword Gap Analyzer
 *
 * Multi-model evaluation (Gemini / Groq + Heuristic Fallback) for Career GPS Step 8.
 * Integrated with Lightcast Open Skills Taxonomy for alias-aware canonical ATS matching.
 * Disheera · Enterprise Backend Service
 */

const { callGemini } = require('./geminiService');
const { callGroq } = require('./groqService');
const Career = require('../models/Career');
const { resolveCanonicalSkill } = require('./skillTaxonomyService');

// Comprehensive technical keywords dictionary for fallback extraction
const KNOWN_TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust',
  'react', 'react.js', 'reactjs', 'vue', 'angular', 'next.js', 'nextjs', 'node.js', 'nodejs', 'express.js', 'django', 'flask',
  'spring boot', 'html5', 'html', 'css3', 'css', 'tailwind css', 'bootstrap', 'sass', 'redux', 'graphql', 'rest api',
  'sql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'mongo', 'redis', 'elasticsearch', 'prisma', 'supabase',
  'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'ci/cd', 'git', 'github', 'linux', 'bash',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
  'data analysis', 'agile', 'scrum', 'unit testing', 'jest', 'cypress', 'system design', 'microservices'
];

/**
 * Analyzes resume content against a target career.
 * @param {string} resumeText - Raw text content of the resume.
 * @param {string} targetCareerSlug - Career slug or title (e.g. 'full-stack-developer').
 * @param {Array} userSkills - User's currently known skills.
 */
async function analyzeResumeText(resumeText, targetCareerSlug = '', userSkills = []) {
  const text = String(resumeText || '').trim();
  if (!text || text.length < 50) {
    throw new Error('Resume text is too short. Please provide at least 50 characters of resume content.');
  }

  // Look up career expectations if available
  let careerDoc = null;
  if (targetCareerSlug && typeof targetCareerSlug === 'string') {
    const escapedSlug = targetCareerSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    careerDoc = await Career.findOne({
      $or: [
        { slug: targetCareerSlug.toLowerCase() },
        { title: new RegExp(`^${escapedSlug}$`, 'i') }
      ]
    }).populate('requiredSkills.skill').lean();
  }

  const careerTitle = careerDoc?.title || targetCareerSlug || 'Software Engineer';
  const expectedSkills = (careerDoc?.requiredSkills || []).map(s => {
    if (typeof s === 'string') return s.toLowerCase();
    if (s?.skill?.name) return String(s.skill.name).toLowerCase();
    if (s?.name) return String(s.name).toLowerCase();
    return '';
  }).filter(Boolean);

  // 1. Attempt AI analysis via Groq / Gemini
  try {
    const prompt = `You are a Senior Technical Recruiter and ATS (Applicant Tracking System) Specialist.
Analyze the following student resume for the target career role: "${careerTitle}".

Expected Key Competencies for this role:
${expectedSkills.length ? expectedSkills.join(', ') : 'JavaScript, React, Node.js, Git, REST APIs, Databases, Testing, System Design'}

Student Resume:
"""
${text.slice(0, 4000)}
"""

Evaluate this resume and return ONLY a valid JSON object with the following schema:
{
  "atsScore": <integer between 40 and 96 based on relevance, metrics, formatting>,
  "summary": "<2-sentence executive summary of applicant's competitiveness for this role>",
  "extractedSkills": ["<skill1>", "<skill2>", ...],
  "matchedKeywords": ["<relevant matched keyword 1>", ...],
  "missingKeywords": ["<critical industry keyword missing 1>", ...],
  "bulletSuggestions": [
    "Rewrite: <Turn a weak bullet into a metric-driven XYZ achievement>",
    "Rewrite: <Turn a weak bullet into a metric-driven XYZ achievement>",
    "Rewrite: <Turn a weak bullet into a metric-driven XYZ achievement>"
  ]
}

DO NOT include markdown code blocks or text outside the JSON. Return pure JSON only.`;

    let rawAiResponse = null;

    // Try Groq first for blazing fast JSON response
    try {
      rawAiResponse = await callGroq([
        { role: 'system', content: 'You are an ATS resume evaluation system. Output valid JSON only.' },
        { role: 'user', content: prompt }
      ]);
    } catch (_) {
      // Fallback to Gemini
      try {
        rawAiResponse = await callGemini([
          { role: 'user', parts: [{ text: prompt }] }
        ]);
      } catch (__) {
        rawAiResponse = null;
      }
    }

    if (rawAiResponse) {
      const cleaned = rawAiResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && typeof parsed.atsScore === 'number') {
        return {
          atsScore: Math.min(100, Math.max(30, Math.round(parsed.atsScore))),
          targetCareer: careerTitle,
          extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills.slice(0, 15) : [],
          matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords.slice(0, 10) : [],
          missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 8) : [],
          bulletSuggestions: Array.isArray(parsed.bulletSuggestions) ? parsed.bulletSuggestions.slice(0, 3) : [],
          summary: parsed.summary || 'Resume analyzed against technical target benchmarks.',
          analyzedAt: new Date()
        };
      }
    }
  } catch (aiErr) {
    console.warn('[resumeAnalyzerService] AI extraction note, falling back to deterministic analyzer:', aiErr.message);
  }

  // 2. Deterministic Heuristic Fallback (Enhanced with Lightcast Canonical Resolution)
  return await fallbackHeuristicAnalysis(text, careerTitle, expectedSkills, userSkills);
}

/**
 * Deterministic rule-based ATS analysis if AI is unavailable
 */
async function fallbackHeuristicAnalysis(text, careerTitle, expectedSkills = [], userSkills = []) {
  const lower = text.toLowerCase();

  // Extract detected keywords
  const detectedSlugs = new Set();
  const detectedDisplayNames = [];

  for (const kw of KNOWN_TECH_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      const canonical = await resolveCanonicalSkill(kw);
      if (canonical) {
        if (!detectedSlugs.has(canonical.name)) {
          detectedSlugs.add(canonical.name);
          detectedDisplayNames.push(canonical.displayName);
        }
      } else if (!detectedSlugs.has(kw)) {
        detectedSlugs.add(kw);
        detectedDisplayNames.push(kw);
      }
    }
  }

  const rawTargetList = expectedSkills.length ? expectedSkills : ['javascript', 'react', 'git', 'node.js', 'sql', 'rest api', 'docker'];
  const matched = [];
  const missing = [];

  for (const target of rawTargetList) {
    const canonicalTarget = await resolveCanonicalSkill(target);
    const targetSlug = canonicalTarget ? canonicalTarget.name : target.toLowerCase();
    const displayName = canonicalTarget ? canonicalTarget.displayName : target;

    if (detectedSlugs.has(targetSlug) || lower.includes(target.toLowerCase())) {
      matched.push(displayName);
    } else {
      missing.push(displayName);
    }
  }

  // Metrics score (detecting numbers and percentages like "30%", "10x", "$50k", "500 users")
  const metricMatches = lower.match(/\b\d+(\.\d+)?(%|x|k|\+)?\b/g) || [];
  const metricDensity = Math.min(25, metricMatches.length * 3);

  // Keyword match ratio
  const matchRatio = rawTargetList.length ? (matched.length / rawTargetList.length) : 0.6;
  const keywordScore = Math.round(matchRatio * 40);

  // Structure check
  let structureScore = 15;
  if (/education|academic/i.test(lower)) structureScore += 5;
  if (/experience|projects|work/i.test(lower)) structureScore += 10;
  if (/skills|technical proficiencies/i.test(lower)) structureScore += 5;

  const totalAtsScore = Math.min(94, Math.max(45, keywordScore + metricDensity + structureScore));

  const bulletSuggestions = [
    `Transform project descriptions using the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]" (e.g. "Increased component render speed by 28% through React memoization").`,
    `Highlight your verified GitHub portfolio artifacts and include live deploy links (Vercel, Render) next to major project titles.`,
    missing.length > 0
      ? `Integrate your learning exposure to missing requirements: explicitly mention work with ${missing.slice(0, 3).join(', ')}.`
      : `Quantify user impact: specify active users, API response times, or database query optimizations.`
  ];

  return {
    atsScore: totalAtsScore,
    targetCareer: careerTitle,
    extractedSkills: detectedDisplayNames.slice(0, 12),
    matchedKeywords: matched.slice(0, 8),
    missingKeywords: missing.slice(0, 6),
    bulletSuggestions,
    summary: `Your resume demonstrates solid foundational technical alignment for ${careerTitle}, scoring in the ${totalAtsScore}% ATS match bracket. Focusing on quantifiable metrics will elevate your callback rates.`,
    analyzedAt: new Date()
  };
}

module.exports = {
  analyzeResumeText
};

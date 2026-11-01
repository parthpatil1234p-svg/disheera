/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/mockInterviewService.js — AI Interactive Technical & Behavioral Mock Interviewer
 *
 * Powers speech/text interviews for Career GPS Step 9.
 * Disheera · Enterprise Backend Service
 */

const { callGemini } = require('./geminiService');
const { callGroq } = require('./groqService');
const Career = require('../models/Career');

// Curated question bank per role for zero-latency, high-reliability interview generation
const ROLE_QUESTION_BANKS = {
  frontend: [
    {
      question: "Explain how the browser's Critical Rendering Path works from receiving HTML to painting pixels, and how you would optimize Largest Contentful Paint (LCP).",
      questionType: "technical_deep_dive",
      rubric: "Look for DOM/CSSOM construction, render tree, layout/reflow, paint, and practical optimizations like preloading, code splitting, or image sizing."
    },
    {
      question: "Walk me through how you manage complex asynchronous state and client-side caching in a React or modern JavaScript application.",
      questionType: "architecture",
      rubric: "Look for explanation of React Query / SWR / Redux Toolkit, handling race conditions, loading/error states, and memoization."
    },
    {
      question: "Describe a real situation where you diagnosed and fixed a front-end performance bottleneck or visual layout regression under tight deadlines.",
      questionType: "behavioral_star",
      rubric: "Look for structured STAR response: Situation, Task, Action taken with DevTools/profiler, and quantifiable Result."
    }
  ],
  backend: [
    {
      question: "How would you design a scalable, idempotent REST API endpoint for processing financial transactions or order checkouts?",
      questionType: "technical_deep_dive",
      rubric: "Look for idempotency keys, database transactions/ACID, locking strategies, race condition prevention, and retry mechanisms."
    },
    {
      question: "Explain the difference between indexing strategies in relational vs document databases, and how an unindexed query impacts query execution plans.",
      questionType: "database_architecture",
      rubric: "Look for B-Tree indices, compound indices, full table/collection scans vs index scans, and memory impact."
    },
    {
      question: "Tell me about a time you encountered a production bug, server memory leak, or rate-limiting incident. How did you diagnose and resolve it?",
      questionType: "behavioral_star",
      rubric: "STAR format demonstrating systematic debugging, logs/telemetry inspection, root cause discovery, and mitigation."
    }
  ],
  fullstack: [
    {
      question: "How do you architect end-to-end authentication and token security across a single-page app and microservice backend (JWT vs HTTP-only cookies, refresh rotation)?",
      questionType: "security_architecture",
      rubric: "Look for XSS/CSRF mitigation, HTTP-only secure cookies, short-lived access tokens, refresh token rotation, and CORS."
    },
    {
      question: "Walk through an end-to-end feature you built: from database schema design and API routes to frontend state and UI responsiveness.",
      questionType: "system_design",
      rubric: "Clear architectural thinking across data modeling, API contracts, frontend component hierarchy, and error boundaries."
    },
    {
      question: "Describe a project where you had to balance building features rapidly against code maintainability, technical debt, and test coverage.",
      questionType: "behavioral_star",
      rubric: "Demonstrates maturity, pragmatic trade-offs, modular design, and prioritization of core user value."
    }
  ]
};

/**
 * Generates 3 interview questions for the candidate based on target role.
 */
async function generateInterviewQuestions(targetRole = 'Full-Stack Developer', userSkills = []) {
  const roleLower = String(targetRole).toLowerCase();
  let roleKey = 'fullstack';
  if (roleLower.includes('front') || roleLower.includes('web') || roleLower.includes('ui')) roleKey = 'frontend';
  else if (roleLower.includes('back') || roleLower.includes('node') || roleLower.includes('python') || roleLower.includes('data')) roleKey = 'backend';

  const defaultBank = ROLE_QUESTION_BANKS[roleKey] || ROLE_QUESTION_BANKS.fullstack;

  // Attempt dynamic AI personalization with fast timeout fallback
  try {
    const skillsList = userSkills.map(s => s.name || s.displayName).join(', ');
    const prompt = `You are a Principal Engineer conducting a live technical job interview for the position of "${targetRole}".
Candidate proven skills: ${skillsList || 'JavaScript, React, Node.js, SQL, Git'}.

Generate exactly 3 interview questions:
1. Technical deep dive on one of their core skills.
2. Architecture / System Design question relevant to ${targetRole}.
3. Behavioral STAR engineering challenge question.

Return ONLY a valid JSON array of 3 objects with schema:
[
  {
    "question": "<The interview question>",
    "questionType": "technical" | "architecture" | "behavioral",
    "rubric": "<Brief key concepts a great candidate must touch on>"
  }
]
No markdown formatting, return pure JSON.`;

    const aiCall = (async () => {
      try {
        return await callGroq([
          { role: 'system', content: 'You are an expert technical interviewer. Output valid JSON only.' },
          { role: 'user', content: prompt }
        ]);
      } catch (_) {
        return await callGemini([{ role: 'user', parts: [{ text: prompt }] }]);
      }
    })();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI interview generation timeout')), 3500)
    );

    const aiRes = await Promise.race([aiCall, timeoutPromise]);

    if (aiRes) {
      const cleaned = String(aiRes).replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.slice(0, 3);
      }
    }
  } catch (err) {
    console.warn('[mockInterviewService] Falling back to vetted question bank:', err.message);
  }

  return defaultBank;
}

/**
 * Evaluates student's answer using AI rubric.
 */
async function evaluateInterviewAnswer(question, answer, questionType = 'technical', targetRole = 'Software Engineer') {
  const ans = String(answer || '').trim();
  if (!ans || ans.length < 15) {
    return {
      technicalScore: 40,
      communicationScore: 45,
      practicalScore: 40,
      overallScore: 42,
      feedback: "Answer is too brief to demonstrate competency. Provide concrete technical details, trade-offs, and examples.",
      modelAnswer: "In a production environment, I would structure this by first defining the system constraints, selecting appropriate patterns, and verifying performance metrics."
    };
  }

  // Attempt AI grading
  try {
    const prompt = `You are evaluating a candidate's answer in a technical job interview for "${targetRole}".

Question:
"${question}"

Candidate's Answer:
"${ans.slice(0, 2000)}"

Evaluate the answer and return ONLY a valid JSON object:
{
  "technicalScore": <integer 40-98>,
  "communicationScore": <integer 40-98>,
  "practicalScore": <integer 40-98>,
  "overallScore": <integer 40-98>,
  "feedback": "<2-3 constructive sentences highlighting what was good and specific missing concepts>",
  "modelAnswer": "<A concise 2-3 sentence ideal answer demonstrating staff-level engineering insight>"
}
No markdown backticks, return pure JSON.`;

    let aiRes = null;
    try {
      aiRes = await callGroq([
        { role: 'system', content: 'You are a Senior Technical Interview Evaluator. Output valid JSON only.' },
        { role: 'user', content: prompt }
      ]);
    } catch (_) {
      aiRes = await callGemini([{ role: 'user', parts: [{ text: prompt }] }]);
    }

    if (aiRes) {
      const cleaned = aiRes.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed.overallScore === 'number') {
        return {
          technicalScore: Math.min(100, Math.max(30, Math.round(parsed.technicalScore || parsed.overallScore))),
          communicationScore: Math.min(100, Math.max(30, Math.round(parsed.communicationScore || parsed.overallScore))),
          practicalScore: Math.min(100, Math.max(30, Math.round(parsed.practicalScore || parsed.overallScore))),
          overallScore: Math.min(100, Math.max(30, Math.round(parsed.overallScore))),
          feedback: parsed.feedback || "Solid response demonstrating core principles.",
          modelAnswer: parsed.modelAnswer || "A complete answer incorporates performance trade-offs, edge case handling, and user impact."
        };
      }
    }
  } catch (err) {
    console.warn('[mockInterviewService] AI grading fallback:', err.message);
  }

  // Heuristic grading fallback
  const wordCount = ans.split(/\s+/).length;
  const hasTechnicalTerms = /api|database|async|component|state|render|performance|scalab|test|cache/i.test(ans);
  const score = Math.min(88, Math.max(50, (wordCount > 35 ? 70 : 55) + (hasTechnicalTerms ? 15 : 0)));

  return {
    technicalScore: score,
    communicationScore: score + 2,
    practicalScore: score - 2,
    overallScore: score,
    feedback: `Good verbal articulation (${wordCount} words). Elaborate further on production trade-offs and quantifiable system outcomes.`,
    modelAnswer: "Focus on articulating the 'Why' behind technology choices, citing metrics, reliability guarantees, and failure modes."
  };
}

module.exports = {
  generateInterviewQuestions,
  evaluateInterviewAnswer
};

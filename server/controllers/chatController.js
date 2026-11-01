/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/chatController.js — Dual-Engine AI Career Mentor Controller
 * Primary: Groq Cloud (Ultra-Fast <100ms Inference)
 * Secondary Fallback: Google Gemini 3.6 Flash
 * Disheera · Enterprise Backend Service
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { getGroqMentorReply } = require('../services/groqService');
const { getChatMentorReply } = require('../services/geminiService');

/**
 * POST /api/chat/message
 * Handles real-time student questions with dual-engine AI (Groq + Gemini)
 */
const handleChatMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    // VALIDATION: Strict limit on message length and history size
    if (!message || typeof message !== 'string' || message.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 5000 chars) or missing.',
      });
    }

    if (Array.isArray(history) && history.length > 10) {
       return res.status(400).json({
        success: false,
        message: 'History too long (max 10 turns).',
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required.',
      });
    }

    // User contextual enrichment from authenticated req.user (populated by protect middleware)
    let userContext = null;
    if (req.user) {
      try {
        const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).lean();
        userContext = {
          name: req.user.name,
          degree: req.user.education?.course || '',
          branch: req.user.education?.branch || '',
          year: req.user.education?.year || '',
          skills: Array.isArray(req.user.skills) ? req.user.skills.map(s => s.name || s) : [],
          targetCareer: activeRoadmap?.careerSnapshot?.title || '',
          progressPercentage: activeRoadmap?.progressPercentage || 0,
        };
      } catch (ctxErr) {
        console.warn('[chatController] Context enrichment note:', ctxErr.message);
      }
    }

    let reply = null;
    let engineUsed = 'Groq Cloud';
    let lastErrorReason = null;

    // 1. Try Groq first for ultra-fast response (<100ms)
    if (process.env.GROQ_API_KEY) {
      try {
        reply = await getGroqMentorReply(message.trim(), history || [], userContext);
      } catch (groqErr) {
        lastErrorReason = groqErr.message;
        console.warn('Groq failed, falling back to Google Gemini:', groqErr.message);
      }
    }

    // 2. Fallback to Gemini if Groq failed or not configured
    if (!reply && process.env.GEMINI_API_KEY) {
      try {
        reply = await getChatMentorReply(message.trim(), history || [], userContext);
        engineUsed = 'Google Gemini';
      } catch (geminiErr) {
        lastErrorReason = geminiErr.message;
        console.error('Gemini fallback also failed:', geminiErr.message);
      }
    }

    if (!reply) {
      console.warn('[Chat] External AI engines offline or keys invalid. Using instant high-speed Mentor Fallback.');
      const name = userContext?.name || 'Student';
      const targetStr = userContext?.targetCareer ? ` for **${userContext.targetCareer}**` : '';
      const degreeStr = userContext?.degree ? ` (${userContext.degree})` : '';

      reply = `### 🎯 Key Takeaway
Hello ${name}${degreeStr}! 👋 As your **Disheera Mentor**, here is your personalized action strategy${targetStr}:

### 📌 Action Plan (Next Steps)
1. **Focus on Hands-on Building**: Build real-world projects and deploy them live (e.g., on Vercel or Render) with a clear GitHub README.
2. **Weekly Milestone Consistency**: Follow the structured weekly curriculum in your [My Roadmap](roadmap.html) to eliminate core skill gaps step-by-step.
3. **Verify Your Foundation**: Complete practical quizzes and coding challenges in [Skill Assessment](assessment.html) to earn verified digital badges.

> 💡 **Pro-Tip:** Tech recruiters scan for deployed live links and clean code commits much more than passive video certificates.

### 🛠️ Recommended Tech Stack & Skills
- **Core Languages**: JavaScript / TypeScript, Python, or Java
- **Modern Frameworks**: React / Next.js, Node.js / Express
- **Industry Standards**: Git, Docker, RESTful APIs, SQL (PostgreSQL)

### 🚀 Portal Quick Action
Keep your learning momentum going! Open your **[Roadmap](roadmap.html)** to check off this week's tasks, or review hiring requirements on **[Job Market](jobs.html)**.`;
      engineUsed = 'Disheera Knowledge Engine';
    }

    return res.status(200).json({
      success: true,
      reply,
      engine: engineUsed,
    });
  } catch (error) {
    console.error('Chat Error in AI controller:', error);
    return res.status(500).json({
      success: false,
      message: 'AI Mentor could not process your message right now.',
    });
  }
};

module.exports = {
  handleChatMessage,
};

/**
 * services/videoDedicationService.js — AI Video Dedication & Anti-Slacking Evaluation Engine
 *
 * Provides:
 *  1. Mid-Video Concept Pulse Checkpoint Questions (interactive pause at 50% watch time)
 *  2. AI Post-Video Reflection Evaluation (scored with Groq Llama 3.3 / Gemini / heuristic fallback)
 *  3. Anti-spam and gibberish detection
 *
 * Disheera · Enterprise Backend Service
 */

const { callGroq } = require('./groqService');
const { callGemini } = require('./geminiService');

// ── Curated Mid-Video Concept Checkpoint Question Bank ─────────────────────────
const CHECKPOINT_BANK = {
  html: {
    question: 'Why are semantic HTML elements like <main>, <nav>, and <article> preferred over generic <div> tags?',
    options: [
      'They make web pages render 10x faster in all browser rendering engines.',
      'They provide clear structural meaning to assistive tech (screen readers) and improve SEO accessibility.',
      'They automatically apply modern CSS flexbox styles without any external stylesheet.',
      'They prevent JavaScript errors by strictly enforcing static typing in DOM scripts.'
    ],
    correctIndex: 1,
    explanation: 'Semantic elements convey structure and meaning to browsers, screen readers, and search engines, vastly improving accessibility and document readability.'
  },
  css: {
    question: 'In CSS Flexbox, what is the key difference between "justify-content" and "align-items"?',
    options: [
      'justify-content controls the main axis alignment; align-items controls cross axis alignment.',
      'justify-content only works on desktop screens; align-items works exclusively on mobile devices.',
      'justify-content changes font kerning; align-items adjusts box-shadow depth.',
      'justify-content sets grid tracks; align-items specifies flex-wrap direction.'
    ],
    correctIndex: 0,
    explanation: 'justify-content distributes space along the primary main axis (row or column), while align-items aligns items along the perpendicular cross axis.'
  },
  javascript: {
    question: 'In asynchronous JavaScript, what occurs when an "await" expression is encountered inside an async function?',
    options: [
      'It freezes the entire browser window and blocks all other network traffic.',
      'It pauses execution of the async function until the Promise settles, freeing the call stack to handle other tasks.',
      'It converts the Promise into a synchronous while loop that polls every millisecond.',
      'It forces the browser to spawn a new native thread on the operating system.'
    ],
    correctIndex: 1,
    explanation: 'The "await" operator pauses the async function execution non-blockingly until the Promise resolves or rejects, keeping the main event loop responsive.'
  },
  react: {
    question: 'Why should React state never be mutated directly (e.g. state.push() or state.count = 5)?',
    options: [
      'Direct mutation causes immediate JavaScript syntax errors at build time.',
      'React relies on shallow reference equality checks; direct mutation skips re-rendering and causes subtle synchronization bugs.',
      'Direct mutation permanently deletes the component from the Virtual DOM.',
      'React state is stored in read-only hardware registers.'
    ],
    correctIndex: 1,
    explanation: 'React compares state references to detect changes. Mutating state directly keeps the object reference identical, preventing components from re-rendering.'
  },
  nodejs: {
    question: 'What architectural model allows Node.js to handle thousands of concurrent I/O connections on a single thread?',
    options: [
      'Multi-threaded preemptive context switching across CPU cores.',
      'An asynchronous non-blocking event-driven loop backed by libuv and kernel abstractions.',
      'Automatic compilation of JavaScript directly into synchronous assembly instructions.',
      'A dedicated hardware coprocessor that runs all callbacks.'
    ],
    correctIndex: 1,
    explanation: 'Node.js uses an event-driven, non-blocking I/O model orchestrated by the libuv event loop, delegating asynchronous system calls to the OS kernel.'
  },
  express: {
    question: 'What is the purpose of the "next()" function in Express.js middleware?',
    options: [
      'It restarts the Express application and clears the session cache.',
      'It passes control to the next middleware function in the request-response cycle pipeline.',
      'It redirects the incoming HTTP request directly to a 404 page.',
      'It immediately commits database transactions.'
    ],
    correctIndex: 1,
    explanation: 'Calling next() signals that the current middleware has finished its processing and hands control to the subsequent middleware handler in the stack.'
  },
  mongodb: {
    question: 'What is the primary benefit of creating an index on a frequently queried field in MongoDB?',
    options: [
      'It compresses the database storage by 90%.',
      'It allows queries to locate documents efficiently (B-Tree lookup) without performing a full collection scan (COLLSCAN).',
      'It encrypts documents with AES-256 automatically.',
      'It prevents documents from having duplicate IDs.'
    ],
    correctIndex: 1,
    explanation: 'Indexes store a small portion of the collection dataset in an easy-to-traverse form, preventing costly collection-wide scans and speeding up queries by orders of magnitude.'
  },
  python: {
    question: 'What makes list comprehensions in Python both idiomatic and performant compared to standard for loops?',
    options: [
      'They run entirely in C within the Python bytecode interpreter with less loop overhead and cleaner declarative syntax.',
      'They bypass Python memory management and write directly to RAM.',
      'They automatically parallelize execution across all CPU cores.',
      'They turn lists into immutable tuples.'
    ],
    correctIndex: 0,
    explanation: 'List comprehensions provide a concise syntax and execute faster than equivalent for-loops because the bytecode loop runs optimized in C internal routines.'
  },
  sql: {
    question: 'In relational databases, what is the difference between an INNER JOIN and a LEFT JOIN?',
    options: [
      'INNER JOIN returns only rows with matches in both tables; LEFT JOIN returns all rows from the left table plus matched rows from the right.',
      'INNER JOIN operates on numbers; LEFT JOIN operates on text strings.',
      'INNER JOIN deletes unmatched records; LEFT JOIN updates them.',
      'There is no difference; they are synonymous.'
    ],
    correctIndex: 0,
    explanation: 'INNER JOIN selects records that have matching values in both tables, whereas LEFT JOIN preserves all rows from the left table regardless of matches.'
  },
  docker: {
    question: 'What is the fundamental difference between a Docker Image and a Docker Container?',
    options: [
      'An image is a read-only immutable blueprint; a container is a running, stateful runtime instance of that image.',
      'An image is for production; a container is only used for local development.',
      'An image contains the kernel; a container contains only application logs.',
      'Images run on Windows; containers run exclusively on Linux.'
    ],
    correctIndex: 0,
    explanation: 'A Docker image is an immutable template containing application code, libraries, and dependencies; a container is the isolated executable instance executing that template.'
  },
  git: {
    question: 'What does "git rebase" achieve compared to "git merge"?',
    options: [
      'It deletes the target branch permanently.',
      'It reapplies commits from one branch on top of another, creating a cleaner, linear commit history without merge commits.',
      'It uploads code directly to GitHub without requiring authentication.',
      'It reverts all files to their initial state.'
    ],
    correctIndex: 1,
    explanation: 'Rebasing rewrites commit history by transplanting branch commits sequentially onto the tip of the target branch, maintaining a linear project history.'
  },
  figma: {
    question: 'Why are Auto Layout and Component Variants essential for scalable UI/UX design systems in Figma?',
    options: [
      'They automatically write native Flutter and React Native code for app stores.',
      'They enable responsive resizing based on content and allow swapping state representations without rebuilding UI primitives.',
      'They lock layers so other team members cannot edit them.',
      'They compress exported PNG images.'
    ],
    correctIndex: 1,
    explanation: 'Auto Layout provides responsive padding and spacing behaviors, while component variants allow designers to represent interactive states (hover, active, disabled) cleanly.'
  },
  cybersecurity: {
    question: 'What is the Principle of Least Privilege (PoLP) in information security?',
    options: [
      'Users should be granted only the minimum essential access rights and permissions required to perform their job duties.',
      'All passwords must be at least 8 characters long.',
      'Firewalls should block 100% of outbound network traffic.',
      'Admins should use identical master passwords across all production servers.'
    ],
    correctIndex: 0,
    explanation: 'The Principle of Least Privilege ensures entities only have access to information and resources strictly necessary for legitimate tasks, minimizing attack surfaces.'
  }
};

/**
 * Retrieves or generates a 1-question pulse checkpoint for the mid-video pause.
 * @param {Object} params
 * @param {string} params.taskTitle
 * @param {string} params.skillName
 * @param {string} [params.videoTitle]
 * @returns {Promise<Object>} Checkpoint question structure
 */
async function getVideoConceptCheckpoint({ taskTitle = '', skillName = '', videoTitle = '' }) {
  const normalizedSkill = (skillName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Check curated bank
  for (const [key, checkpoint] of Object.entries(CHECKPOINT_BANK)) {
    if (normalizedSkill.includes(key) || key.includes(normalizedSkill) || taskTitle.toLowerCase().includes(key)) {
      return {
        success: true,
        source: 'curated_bank',
        checkpoint: { ...checkpoint }
      };
    }
  }

  // 2. Dynamic generation using Groq Llama 3.3
  try {
    const prompt = `You are an expert technical interviewer. Generate 1 multiple-choice comprehension question based on this lesson:
Topic: "${taskTitle}"
Skill: "${skillName}"
Video: "${videoTitle || taskTitle}"

Return ONLY valid JSON matching this schema with NO markdown wrapping:
{
  "question": "Clear conceptual question testing understanding rather than trivia",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Brief explanation of why this answer is correct"
}`;

    const messages = [
      { role: 'system', content: 'You output only valid JSON with no markdown formatting.' },
      { role: 'user', content: prompt }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const reply = await callGroq(messages, controller.signal);
    clearTimeout(timeout);

    const cleaned = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4 && typeof parsed.correctIndex === 'number') {
      return {
        success: true,
        source: 'groq_ai',
        checkpoint: parsed
      };
    }
  } catch (err) {
    // Fall through to generic high-quality conceptual checkpoint
  }

  // 3. Fallback generic technical checkpoint
  return {
    success: true,
    source: 'fallback',
    checkpoint: {
      question: `When implementing ${skillName || 'this technology'} in production, which architectural practice is most critical?`,
      options: [
        'Writing modular, well-tested code with defensive error boundaries and clear separation of concerns.',
        'Hardcoding configuration credentials directly into source files for faster execution.',
        'Avoiding version control systems to speed up deployments.',
        'Disabling all logging and metrics to conserve storage.'
      ],
      correctIndex: 0,
      explanation: 'Production software requires modularity, automated testing, and comprehensive error handling to ensure resilience, maintainability, and security.'
    }
  };
}

/**
 * Evaluates student's post-video reflection using AI (Groq / Gemini) with strict heuristic anti-spam fallback.
 *
 * @param {Object} params
 * @param {string} params.taskTitle
 * @param {string} params.skillName
 * @param {string} [params.videoTitle]
 * @param {string} params.reflectionText
 * @returns {Promise<Object>} { passed: boolean, score: number, feedback: string, keyConceptsIdentified: string[] }
 */
async function evaluateVideoReflection({ taskTitle = '', skillName = '', videoTitle = '', reflectionText = '' }) {
  const text = (reflectionText || '').trim();

  // Basic length & anti-spam validation
  if (text.length < 35) {
    return {
      passed: false,
      score: 25,
      feedback: 'Your reflection is too brief. Active learning requires at least 2–3 meaningful sentences explaining key concepts or how you will apply them.',
      keyConceptsIdentified: []
    };
  }

  // Check for repeated spam characters / trivial keyboard mash (e.g. "aaaaa", "asdfasdf", "good good good")
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  if (words.length > 5 && uniqueWords.size / words.length < 0.4) {
    return {
      passed: false,
      score: 20,
      feedback: 'Low effort or repetitive text detected. Please summarize genuine technical takeaways from the video lesson.',
      keyConceptsIdentified: []
    };
  }

  const commonSpamPhrases = ['nice video', 'good video', 'watched it', 'i watched', 'done', 'completed', 'good', 'ok', 'very good', 'thank you', 'thanks'];
  if (words.length <= 6 && commonSpamPhrases.some(p => text.toLowerCase().includes(p))) {
    return {
      passed: false,
      score: 30,
      feedback: 'Please describe the specific technical concepts covered in this lesson rather than generic comments.',
      keyConceptsIdentified: []
    };
  }

  // Attempt evaluation using Groq Llama 3.3
  try {
    const prompt = `You are a strict technical mentor evaluating a student's post-video learning reflection.
Lesson Title: "${taskTitle}"
Core Skill: "${skillName}"
Video: "${videoTitle || taskTitle}"

Student Reflection:
"""
${text}
"""

Evaluate across:
1. Relevance to the topic (0-40)
2. Conceptual depth & terminology (0-40)
3. Practical application or takeaway (0-20)

Passing threshold: total score >= 60.
Reject gibberish, copy-paste fluff, or off-topic summaries.

Return ONLY valid JSON matching this schema:
{
  "passed": true,
  "score": 85,
  "feedback": "Concise 1-2 sentence constructive feedback on what was good and what could be deepened.",
  "keyConceptsIdentified": ["concept1", "concept2"]
}`;

    const messages = [
      { role: 'system', content: 'You evaluate technical reflections and return only valid JSON.' },
      { role: 'user', content: prompt }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const reply = await callGroq(messages, controller.signal);
    clearTimeout(timeout);

    const cleaned = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (typeof parsed.score === 'number' && typeof parsed.passed === 'boolean') {
      return {
        passed: parsed.score >= 60,
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        feedback: parsed.feedback || (parsed.passed ? 'Excellent reflection demonstrating clear comprehension.' : 'Please expand on key technical principles.'),
        keyConceptsIdentified: Array.isArray(parsed.keyConceptsIdentified) ? parsed.keyConceptsIdentified : []
      };
    }
  } catch (err) {
    // If Groq fails, attempt Gemini Flash
    try {
      const geminiPrompt = `Evaluate this student reflection for "${taskTitle}" (${skillName}): "${text}". Return JSON with { "passed": boolean, "score": number (0-100), "feedback": string, "keyConceptsIdentified": string[] }. Score >= 60 passes.`;
      const reply = await callGemini([{ role: 'user', parts: [{ text: geminiPrompt }] }], null, null, 'You output only valid JSON.');
      const cleaned = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (typeof parsed.score === 'number') {
        return {
          passed: parsed.score >= 60,
          score: Math.min(100, Math.max(0, Math.round(parsed.score))),
          feedback: parsed.feedback || 'Good grasp of core principles.',
          keyConceptsIdentified: Array.isArray(parsed.keyConceptsIdentified) ? parsed.keyConceptsIdentified : []
        };
      }
    } catch (geminiErr) {
      // Fall through to heuristic evaluation
    }
  }

  // Robust Heuristic Pedagogical Fallback Evaluator
  return evaluateWithHeuristics(text, skillName, taskTitle);
}

/**
 * Deterministic heuristic evaluation for offline / quota exhaustion situations.
 */
function evaluateWithHeuristics(text, skillName, taskTitle) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const skillKeywords = (skillName || '').toLowerCase().split(/[-_ ]+/).filter(w => w.length > 2);
  const titleKeywords = (taskTitle || '').toLowerCase().split(/[-_ ]+/).filter(w => w.length > 3);

  let relevanceHits = 0;
  skillKeywords.forEach(k => { if (text.toLowerCase().includes(k)) relevanceHits++; });
  titleKeywords.forEach(k => { if (text.toLowerCase().includes(k)) relevanceHits++; });

  const wordCount = words.length;
  let score = 50;

  if (wordCount >= 20) score += 15;
  if (wordCount >= 35) score += 10;
  if (relevanceHits >= 1) score += 15;
  if (relevanceHits >= 2) score += 10;

  const passed = score >= 60;
  return {
    passed,
    score: Math.min(95, score),
    feedback: passed
      ? `Strong reflection! You clearly articulated the core principles of ${skillName || 'this module'} and summarized practical takeaways.`
      : `Good start, but please mention specific technical concepts from ${skillName || 'the topic'} to demonstrate full comprehension.`,
    keyConceptsIdentified: skillKeywords.length > 0 ? skillKeywords : ['practical-learning']
  };
}

module.exports = {
  getVideoConceptCheckpoint,
  evaluateVideoReflection,
  CHECKPOINT_BANK
};

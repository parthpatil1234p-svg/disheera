/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/aiQuizGeneratorService.js — Multi-Model AI Dynamic Quiz Generator
 * 
 * Supports generating dynamic, adaptive technical questions for ANY skill using:
 * - Groq Cloud API (Ultra-fast Qwen / Llama models < 400ms)
 * - Google Gemini API (gemini-2.0-flash / gemini-1.5-flash)
 * - OpenAI-compatible endpoints / Custom User-provided API keys
 * - Built-in Domain Engine Fallback (guaranteed 100% uptime with zero failure)
 *
 * Disheera · Enterprise Backend Service
 */

const questionCache = new Map(); // key: skill.toLowerCase(), value: { questions, timestamp }
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Clean and parse JSON from LLM responses that may wrap in markdown codeblocks
 */
function cleanAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (_) {}
    }
    return null;
  }
}

/**
 * Generate 5 adaptive questions using Groq Cloud API
 */
async function generateWithGroq(skill, customApiKey = null) {
  const apiKey = customApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const models = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
  ].filter(Boolean);

  const systemPrompt = `You are a principal engineer and technical interview examiner.
Your job is to generate a 5-question adaptive reality-check quiz for the skill: "${skill}".

Format requirements:
- Respond in strictly valid JSON format only (NO markdown code blocks, NO intro, NO commentary).
- Return an object with a "questions" array containing EXACTLY 5 questions:
  1. Difficulty "medium": Core practical usage / common feature.
  2. Difficulty "easy": Syntax / fundamentals / core definition.
  3. Difficulty "medium": Real-world pattern / debugging / gotcha.
  4. Difficulty "hard": Performance optimization / concurrency / internal architecture.
  5. Difficulty "hard": Edge case / production failure scenario / deep mastery.

Each item in "questions" must have:
- "id": string (e.g. "${skill.toLowerCase().replace(/[^a-z0-9]/g, '')}-1", etc.)
- "difficulty": "easy" | "medium" | "hard"
- "topic": string (concise 2-4 word topic, e.g. "Container Networking", "Memory Layout", "Index Scan")
- "question": string (clear, practical, concise question)
- "codeSnippet": string or null (realistic 2-6 lines of code if relevant, or null)
- "options": array of EXACTLY 4 distinct, plausible string answers
- "correctIndex": integer 0, 1, 2, or 3 (indicating which option is correct)
- "explanation": string (punchy 1-2 sentence explanation of why the correct option is right and the key pitfall to avoid)`;

  const userPrompt = `Generate the 5 adaptive technical quiz questions for: ${skill}. Output pure JSON.`;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1800
        })
      });

      clearTimeout(timeout);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[AIQuiz] Groq ${model} status ${response.status}:`, errJson.error?.message || response.statusText);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = cleanAndParseJSON(content);

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
        return sanitizeQuestions(parsed.questions, skill, `Groq (${model})`);
      }
    } catch (err) {
      console.warn(`[AIQuiz] Groq ${model} exception:`, err.message);
    }
  }

  throw new Error('Groq models failed to generate valid quiz questions');
}

/**
 * Generate 5 adaptive questions using Google Gemini API
 */
async function generateWithGemini(skill, customApiKey = null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const models = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ].filter(Boolean);

  const promptText = `You are a technical interview examiner. Generate 5 adaptive quiz questions for the skill: "${skill}".
Output strict JSON matching:
{
  "questions": [
    {
      "id": "${skill.toLowerCase()}-1",
      "difficulty": "medium",
      "topic": "Topic Name",
      "question": "Question text?",
      "codeSnippet": null,
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why A is correct"
    },
    ...
  ]
}
Include: 1 easy, 2 medium, 2 hard questions. 4 options per question. Only JSON.`;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(timeout);
      if (!response.ok) continue;

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = cleanAndParseJSON(content);

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
        return sanitizeQuestions(parsed.questions, skill, `Gemini (${model})`);
      }
    } catch (_) {
      // Try next model
    }
  }

  throw new Error('Gemini models failed to generate valid quiz questions');
}

/**
 * Generate using custom OpenAI-compatible endpoint or user API key
 */
async function generateWithOpenAICompatible(skill, customApiKey, baseURL = 'https://api.openai.com/v1') {
  if (!customApiKey) throw new Error('Custom API key required for OpenAI compatible provider');

  const systemPrompt = `You are an expert technical examiner. Return strictly pure JSON with an array of 5 questions for: "${skill}".
Keys required per question: id, difficulty (easy/medium/hard), topic, question, codeSnippet (or null), options (4 strings), correctIndex (0-3), explanation.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customApiKey}`,
      'Content-Type': 'application/json'
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate 5 technical quiz questions for ${skill}.` }
      ],
      temperature: 0.3,
      max_tokens: 1800
    })
  });

  clearTimeout(timeout);
  if (!response.ok) throw new Error(`Custom API provider error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = cleanAndParseJSON(content);

  const questionsList = parsed?.questions || (Array.isArray(parsed) ? parsed : null);
  if (questionsList && questionsList.length >= 3) {
    return sanitizeQuestions(questionsList, skill, 'OpenAI-Compatible');
  }

  throw new Error('Failed to parse questions from custom API provider');
}

/**
 * High-quality Domain Fallback Engine
 * Generates structured, realistic technical questions if offline or if no API key is available
 */
const skillsData = require('../data/skillsData');

function generateOfflineFallback(skill) {
  const norm = (skill || 'Software Engineering').trim();
  const cap = norm.charAt(0).toUpperCase() + norm.slice(1);
  const slug = norm.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Look up skill metadata from standardized skillsData
  const skillMeta = skillsData.find(
    (s) => (s.name || '').toLowerCase() === norm.toLowerCase() ||
           (s.displayName || '').toLowerCase() === norm.toLowerCase()
  );
  const category = (skillMeta?.category || '').toLowerCase();

  // 1. DevOps & Cloud Domain Questions
  if (category === 'devops' || category === 'cloud' || norm.includes('devops') || norm.includes('cloud') || norm.includes('ci/cd')) {
    return [
      {
        id: `${slug}-do1`,
        difficulty: 'easy',
        topic: `${cap} Core Concepts`,
        question: `In modern ${cap} workflows, what is the primary benefit of treating infrastructure as declarative code (IaC)?`,
        codeSnippet: null,
        options: [
          `It eliminates the need for automated integration tests`,
          `It enables reproducible, version-controlled environments that prevent configuration drift across stages`,
          `It requires manual SSH terminal access for every production change`,
          `It disables operating system security updates permanently`
        ],
        correctIndex: 1,
        explanation: `Declarative configuration allows tracking environments in Git, reproducing identical infrastructure, and preventing configuration drift.`
      },
      {
        id: `${slug}-do2`,
        difficulty: 'medium',
        topic: `${cap} CI/CD Automation`,
        question: `When designing a deployment pipeline involving ${cap}, what role does an automated quality gate play before production rollout?`,
        codeSnippet: null,
        options: [
          `Halts the build if automated unit/integration tests fail or security vulnerabilities exceed policy thresholds`,
          `Uploads credentials to public repositories for developer convenience`,
          `Bypasses code reviews during peak business hours`,
          `Deletes the target production database before deploying updates`
        ],
        correctIndex: 0,
        explanation: `Automated quality gates ensure broken builds, failing test suites, or critical CVE vulnerabilities are blocked before hitting production.`
      },
      {
        id: `${slug}-do3`,
        difficulty: 'medium',
        topic: `${cap} Secret Management`,
        question: `What is the industry standard for managing sensitive API tokens, database passwords, and TLS certificates in ${cap}?`,
        codeSnippet: null,
        options: [
          `Hardcoding secrets directly inside source code and committing them to version control`,
          `Injecting secrets via dedicated secret managers (e.g. Vault, AWS Secrets Manager) or encrypted runtime environment variables with strict RBAC`,
          `Writing secrets to an unencrypted public S3 bucket`,
          `Transmitting credentials via plaintext HTTP query parameters`
        ],
        correctIndex: 1,
        explanation: `Centralized secret vaults with least-privilege RBAC and encryption at rest prevent credential leaks and facilitate automatic rotation.`
      },
      {
        id: `${slug}-do4`,
        difficulty: 'hard',
        topic: `${cap} Zero-Downtime Rollout`,
        question: `How does a Canary or Blue/Green deployment strategy minimize risk when releasing updates in ${cap}?`,
        codeSnippet: null,
        options: [
          `By immediately shutting down 100% of servers before uploading new code`,
          `By routing a small percentage of production traffic to the new revision while monitoring error telemetry before full rollout`,
          `By disabling all network firewall rules during the update window`,
          `By preventing users from submitting payments during business hours`
        ],
        correctIndex: 1,
        explanation: `Canary and blue/green rollouts isolate regressions by serving real traffic to an isolated target group with instant rollback capabilities.`
      },
      {
        id: `${slug}-do5`,
        difficulty: 'hard',
        topic: `${cap} Observability & Reliability`,
        question: `When diagnosing unexpected service degradation in ${cap}, which telemetry telemetry trifecta provides the fastest root-cause isolation?`,
        codeSnippet: null,
        options: [
          `Restarting the underlying host without logging diagnostics`,
          `Distributed Tracing, Structured Metrics (SLIs/SLOs), and Correlated Contextual Logs`,
          `Relying exclusively on user complaints submitted via social media`,
          `Increasing thread count indefinitely without profiling memory pressure`
        ],
        correctIndex: 1,
        explanation: `Correlating traces, metrics, and logs allows tracking the exact distributed hop where latency spikes or exceptions originated.`
      }
    ];
  }

  // 2. Data Science, Machine Learning & Analytics Domain Questions
  if (category === 'ai' || category === 'data' || category === 'data-science' || norm.includes('data') || norm.includes('learning')) {
    return [
      {
        id: `${slug}-ai1`,
        difficulty: 'easy',
        topic: `${cap} Data Hygiene`,
        question: `In projects utilizing ${cap}, why is it crucial to split data into train, validation, and test partitions before modeling?`,
        codeSnippet: null,
        options: [
          `To artificially increase dataset size through repetition`,
          `To evaluate model generalization on unseen data and prevent data leakage`,
          `To force the algorithm to run only on GPU hardware`,
          `To delete outlier records without human oversight`
        ],
        correctIndex: 1,
        explanation: `Strict isolation of train and test sets prevents data leakage and provides an unbiased evaluation of real-world generalization performance.`
      },
      {
        id: `${slug}-ai2`,
        difficulty: 'medium',
        topic: `${cap} Feature Engineering`,
        question: `When working with ${cap} on tabular or numerical datasets, why is feature scaling (e.g. Standard Scaler) often required?`,
        codeSnippet: null,
        options: [
          `It prevents features with large numeric magnitudes from dominating gradient descent updates and distance calculations`,
          `It converts text strings directly into executable bytecode`,
          `It reduces data storage requirements on disk by 90%`,
          `It eliminates all missing values automatically`
        ],
        correctIndex: 0,
        explanation: `Algorithms sensitive to magnitude (gradient descent, KNN, SVM, PCA) require normalized scales so large values don't skew optimization weights.`
      },
      {
        id: `${slug}-ai3`,
        difficulty: 'medium',
        topic: `${cap} Overfitting Mitigation`,
        question: `Which technique effectively combats overfitting during model training in ${cap}?`,
        codeSnippet: null,
        options: [
          `Increasing model parameters until training loss reaches exactly zero`,
          `Applying regularization (L1/L2 penalties, dropout), cross-validation, and early stopping`,
          `Training exclusively on the test partition`,
          `Removing all validation checkpoints`
        ],
        correctIndex: 1,
        explanation: `Regularization penalties constrain weight complexity, preventing the model from memorizing training noise.`
      },
      {
        id: `${slug}-ai4`,
        difficulty: 'hard',
        topic: `${cap} Evaluation Metrics`,
        question: `In an imbalanced classification problem (e.g. 99% negative, 1% positive), why is raw Accuracy a misleading performance metric in ${cap}?`,
        codeSnippet: null,
        options: [
          `Accuracy cannot be calculated on decimal numbers`,
          `A naive model predicting always 'negative' achieves 99% accuracy while detecting zero true positive anomalies; Precision-Recall AUC or F1 is required`,
          `Accuracy only applies to unsupervised clustering`,
          `Accuracy requires running on a distributed Apache Spark cluster`
        ],
        correctIndex: 1,
        explanation: `In severe class imbalances, high accuracy can mask complete failure to identify the minority class. Precision, Recall, and PR-AUC give true visibility.`
      },
      {
        id: `${slug}-ai5`,
        difficulty: 'hard',
        topic: `${cap} Production Drift & MLOps`,
        question: `What is Concept Drift in production systems using ${cap}?`,
        codeSnippet: null,
        options: [
          `A syntax error in model serialization files`,
          `A statistical shift where the statistical relationship between input features and target labels changes over time, degrading model accuracy`,
          `The physical movement of servers between data centers`,
          `An automated memory leak in Python garbage collection`
        ],
        correctIndex: 1,
        explanation: `Concept drift occurs when underlying real-world patterns evolve (e.g. consumer habits during economic shifts), requiring continuous monitoring and retraining.`
      }
    ];
  }

  // 3. Cybersecurity & Security Domain Questions
  if (category === 'security' || norm.includes('security') || norm.includes('cyber') || norm.includes('crypto')) {
    return [
      {
        id: `${slug}-sec1`,
        difficulty: 'easy',
        topic: `${cap} Defense Fundamentals`,
        question: `What does the Principle of Least Privilege dictate in ${cap} architectures?`,
        options: [
          `Granting root access to all team members to speed up debugging`,
          `Users, applications, and processes must only be granted the minimum permissions required to perform their authorized task`,
          `Disabling multi-factor authentication for automated test runners`,
          `Storing passwords in plaintext for faster authentication lookups`
        ],
        correctIndex: 1,
        explanation: `Least privilege minimizes the attack blast radius by restricting access permissions strictly to what is necessary.`
      },
      {
        id: `${slug}-sec2`,
        difficulty: 'medium',
        topic: `${cap} Input Sanitization & OWASP`,
        question: `How does parameterized querying (prepared statements) protect applications utilizing ${cap} against SQL Injection?`,
        options: [
          `It encrypts the entire database table with AES-256`,
          `It treats user input strictly as literal data parameters rather than executable SQL code, preventing attackers from injecting arbitrary syntax`,
          `It blocks all network requests containing the word 'SELECT'`,
          `It forces users to change their passwords every 10 minutes`
        ],
        correctIndex: 1,
        explanation: `Prepared statements pre-compile query structure and bind inputs as raw data parameters, rendering injection payloads harmless.`
      },
      {
        id: `${slug}-sec3`,
        difficulty: 'medium',
        topic: `${cap} Cryptographic Hashing`,
        question: `Why should slow, salted key-derivation functions (e.g. bcrypt, Argon2, PBKDF2) be used for credential storage instead of fast hashes like MD5 or SHA-256?`,
        options: [
          `Fast hashes are patented and require royalty payments`,
          `Fast hashes allow attackers to calculate billions of guesses per second on consumer GPUs; slow hashes impose deliberate computational work and salts prevent rainbow table attacks`,
          `bcrypt only works on Windows operating systems`,
          `SHA-256 cannot hash strings longer than 16 characters`
        ],
        correctIndex: 1,
        explanation: `Adaptive work factors and unique per-user salts make brute-force and rainbow table offline attacks computationally infeasible.`
      },
      {
        id: `${slug}-sec4`,
        difficulty: 'hard',
        topic: `${cap} Zero Trust Architecture`,
        question: `What is the core tenet of a Zero Trust security model in ${cap}?`,
        options: [
          `Trust everything inside the corporate intranet firewall perimeter without verification`,
          `'Never trust, always verify': every request must be authenticated, authorized, and encrypted regardless of origin network location`,
          `Disabling audit logs to protect user privacy`,
          `Relying exclusively on physical security guards at data centers`
        ],
        correctIndex: 1,
        explanation: `Zero Trust assumes threats exist inside and outside the network, requiring continuous micro-segmentation, identity validation, and telemetry.`
      },
      {
        id: `${slug}-sec5`,
        difficulty: 'hard',
        topic: `${cap} Token Security & CSRF`,
        question: `When storing JWT session tokens in browser applications, why is an HttpOnly, Secure, SameSite=Strict cookie preferred over localStorage?`,
        options: [
          `localStorage has an 8-bit memory limit`,
          `HttpOnly cookies cannot be read or exfiltrated by malicious JavaScript during Cross-Site Scripting (XSS) attacks`,
          `Cookies do not support HTTPS encryption`,
          `localStorage automatically deletes tokens after 60 seconds`
        ],
        correctIndex: 1,
        explanation: `HttpOnly flags block client-side JavaScript access ('document.cookie'), shielding session credentials from theft during XSS exploits.`
      }
    ];
  }

  // 4. Testing, QA & Automation Domain Questions
  if (category === 'testing' || norm.includes('test') || norm.includes('cypress') || norm.includes('selenium') || norm.includes('jest')) {
    return [
      {
        id: `${slug}-qa1`,
        difficulty: 'easy',
        topic: `${cap} Test Pyramid`,
        question: `According to standard software testing pyramid principles in ${cap}, what should form the largest foundation of the test suite?`,
        options: [
          `Manual exploratory testing on physical devices`,
          `Fast, deterministic, isolated Unit Tests with high code coverage`,
          `End-to-End browser UI automation runs only`,
          `Load testing on live production clusters`
        ],
        correctIndex: 1,
        explanation: `Unit tests run in milliseconds, provide immediate feedback, and cost the least to maintain compared to slow, brittle E2E tests.`
      },
      {
        id: `${slug}-qa2`,
        difficulty: 'medium',
        topic: `${cap} Flaky Test Elimination`,
        question: `What is the most effective approach for eliminating flaky timing failures in ${cap} test automation?`,
        options: [
          `Adding arbitrary 5-second sleep() pauses between every interaction`,
          `Using explicit conditional waits and polling assertions on DOM state (e.g. waitForSelector, expect().toBeVisible())`,
          `Rerunning the test suite 10 times until it passes by chance`,
          `Disabling tests that fail in CI pipelines`
        ],
        correctIndex: 1,
        explanation: `Hardcoded timeouts fail under high CPU load; explicit event-driven waiters synchronize dynamically with application rendering.`
      },
      {
        id: `${slug}-qa3`,
        difficulty: 'medium',
        topic: `${cap} Mocking & Isolation`,
        question: `In ${cap}, why should third-party external APIs (e.g. payment gateways, email senders) be mocked during automated testing?`,
        options: [
          `To ensure test runs are fast, deterministic, offline-capable, and do not trigger financial charges or rate limits`,
          `Because mock objects execute faster than compiled C++ code`,
          `Third-party APIs cannot receive HTTP requests from test runners`,
          `To disguise application bugs from security scanners`
        ],
        correctIndex: 0,
        explanation: `Mocking isolates the system under test, ensuring tests never fail due to network instability or external API outages.`
      },
      {
        id: `${slug}-qa4`,
        difficulty: 'hard',
        topic: `${cap} Mutation Testing`,
        question: `What is Mutation Testing in ${cap} and why is it superior to line coverage metrics alone?`,
        options: [
          `It mutates the database schema at runtime to test resilience`,
          `It introduces deliberate syntactic mutations (faults) into source code to verify whether the existing test suite successfully catches the defects`,
          `It converts automated test scripts into TypeScript`,
          `It tests compatibility across different mobile screen resolutions`
        ],
        correctIndex: 1,
        explanation: `High line coverage does not prove assertions are meaningful; mutation testing validates that test assertions actually fail when bugs are injected.`
      },
      {
        id: `${slug}-qa5`,
        difficulty: 'hard',
        topic: `${cap} Idempotent Test Data`,
        question: `When executing integration test suites involving ${cap}, what strategy guarantees test isolation and zero side effects?`,
        options: [
          `Running tests against shared production databases without transactions`,
          `Using database transaction rollback sandboxes or disposable container fixtures (e.g. Testcontainers) that tear down after test suites finish`,
          `Deleting all existing user accounts before every test`,
          `Skipping database operations during integration tests`
        ],
        correctIndex: 1,
        explanation: `Transaction rollbacks and isolated ephemeral containers ensure every test starts with an identical, clean state without residual pollution.`
      }
    ];
  }

  // 5. Mobile & Embedded Domain Questions
  if (category === 'mobile' || norm.includes('mobile') || norm.includes('flutter') || norm.includes('react-native') || norm.includes('swift') || norm.includes('kotlin')) {
    return [
      {
        id: `${slug}-mob1`,
        difficulty: 'easy',
        topic: `${cap} UI Thread Integrity`,
        question: `In modern ${cap} applications, what is the consequence of executing heavy computational or synchronous I/O tasks on the Main/UI thread?`,
        options: [
          `Battery life is increased by 50%`,
          `The UI freezes, drops frames (jank), and triggers OS Application Not Responding (ANR) warnings`,
          `Network bandwidth doubles automatically`,
          `Screen brightness dims to conserve memory`
        ],
        correctIndex: 1,
        explanation: `The UI thread must render at 60-120fps; blocking it with heavy calculations causes dropped frames and unresponsive interfaces.`
      },
      {
        id: `${slug}-mob2`,
        difficulty: 'medium',
        topic: `${cap} Lifecycle Management`,
        question: `How should a mobile application utilizing ${cap} handle application backgrounding by the OS?`,
        options: [
          `Continuing high-frequency GPS tracking and audio polling indefinitely`,
          `Pausing animations, releasing unneeded resources, saving active UI draft state, and cancelling active network polling`,
          `Immediately terminating user sessions and clearing login tokens`,
          `Restarting the mobile device`
        ],
        correctIndex: 1,
        explanation: `Releasing active resources on backgrounding conserves battery, prevents OS memory kills, and preserves user draft state.`
      },
      {
        id: `${slug}-mob3`,
        difficulty: 'medium',
        topic: `${cap} Offline-First Architecture`,
        question: `What is considered a best practice for delivering a resilient offline-first experience in ${cap}?`,
        options: [
          `Showing a full-screen error modal whenever mobile signal drops`,
          `Writing writes to local storage (e.g. SQLite, Room, Hive) immediately with optimistic UI updates and syncing via background worker queues upon reconnection`,
          `Disabling user input until 5G connection is re-established`,
          `Caching all database records in raw text files`
        ],
        correctIndex: 1,
        explanation: `Optimistic UI updates backed by local persistent storage and a sync queue keep the app fully responsive regardless of connectivity.`
      },
      {
        id: `${slug}-mob4`,
        difficulty: 'hard',
        topic: `${cap} Memory Leaks & Subscriptions`,
        question: `In ${cap}, what is a common source of memory leaks that causes application crashes over extended user sessions?`,
        options: [
          `Using static integer constants`,
          `Unsubscribing from event streams, broadcast receivers, or observables when views and controllers are destroyed`,
          `Retaining strong references to destroyed Activity or View contexts in background asynchronous callbacks`,
          `Both options 2 and 3`
        ],
        correctIndex: 3,
        explanation: `Retaining dead context references and failing to dispose event streams prevents garbage collection, leading to OutOfMemory errors.`
      },
      {
        id: `${slug}-mob5`,
        difficulty: 'hard',
        topic: `${cap} Binary Size & App Store Review`,
        question: `Which technique effectively reduces the final download bundle size of a production ${cap} mobile app?`,
        options: [
          `Embedding uncompressed 4K video assets directly into app resources`,
          `Enabling ProGuard/R8 code shrinking, resource stripping, asset vectorization, and dynamic feature delivery`,
          `Including debug symbols and source maps inside the release APK/IPA`,
          `Disabling compilation optimizations`
        ],
        correctIndex: 1,
        explanation: `Tree-shaking unused classes and converting raster graphics to vector formats drastically reduces app download footprint and installs.`
      }
    ];
  }

  // 6. Design, UI/UX & Creative Domain Questions
  if (category === 'design' || norm.includes('design') || norm.includes('figma') || norm.includes('ui/ux') || norm.includes('illustrator') || norm.includes('typography')) {
    return [
      {
        id: `${slug}-des1`,
        difficulty: 'easy',
        topic: `${cap} Accessibility Standards`,
        question: `Under WCAG 2.1 AA accessibility guidelines relevant to ${cap}, what is the minimum contrast ratio required for standard body text against its background?`,
        options: ["1.5 : 1", "3.0 : 1", "4.5 : 1 (or 3:1 for large text)", "10 : 1"],
        correctIndex: 2,
        explanation: `WCAG 2.1 AA mandates a minimum contrast ratio of 4.5:1 for regular text and 3:1 for large text (18pt+ or bold 14pt+).`
      },
      {
        id: `${slug}-des2`,
        difficulty: 'medium',
        topic: `${cap} Design Systems & Tokens`,
        question: `What are Design Tokens in modern ${cap} workflows?`,
        options: [
          `Cryptocurrency used to purchase stock photography`,
          `Platform-agnostic visual design variables (colors, typography, spacing, elevations) shared across design and codebases to ensure systematic consistency`,
          `Custom vector icons that cannot be resized`,
          `Unique password tokens for graphic designers`
        ],
        correctIndex: 1,
        explanation: `Design tokens store visual properties as structured JSON values that export into CSS variables, iOS Swift, and Android XML.`
      },
      {
        id: `${slug}-des3`,
        difficulty: 'medium',
        topic: `${cap} Information Architecture & Hierarchy`,
        question: `When establishing visual hierarchy on a high-converting interface using ${cap}, what visual levers guide user attention most effectively?`,
        options: [
          `Making all text identical in size, weight, and color`,
          `Strategic scale, typographic weight contrast, white space proximity, and focal color accents`,
          `Covering the screen with animated popups`,
          `Hiding primary navigation behind 5 nested menus`
        ],
        correctIndex: 1,
        explanation: `Visual hierarchy uses contrasting scale, weight, and negative space to guide the user's eye naturally toward core calls-to-action.`
      },
      {
        id: `${slug}-des4`,
        difficulty: 'hard',
        topic: `${cap} Usability Heuristics`,
        question: `According to Jakob Nielsen's 10 Usability Heuristics applied in ${cap}, what does 'Visibility of System Status' mean?`,
        options: [
          `The app must show its server CPU usage to all users`,
          `The system should always keep users informed about what is going on through timely, appropriate feedback within reasonable time`,
          `Source code must be public and open source`,
          `The interface must not have dark mode`
        ],
        correctIndex: 1,
        explanation: `Users require clear feedback (spinners, progress bars, success toasts) so they understand the immediate state of their actions.`
      },
      {
        id: `${slug}-des5`,
        difficulty: 'hard',
        topic: `${cap} Responsive Layout Constraints`,
        question: `How does auto-layout with flex constraints in ${cap} streamline developer handoff compared to static absolute positioning?`,
        options: [
          `It forces developers to re-create designs from scratch`,
          `It creates fluid, dynamic components that adapt organically to localized text lengths, viewport dimensions, and device aspect ratios`,
          `It converts vector shapes into bitmap images`,
          `It eliminates the need for user testing`
        ],
        correctIndex: 1,
        explanation: `Auto-layout mirrors CSS Flexbox and Grid, ensuring designs flex responsively without manual pixel repositioning.`
      }
    ];
  }

  // 7. Universal General Software Engineering Domain Fallback
  return [
    {
      id: `${slug}-f1`,
      difficulty: 'easy',
      topic: `${cap} Fundamentals`,
      question: `Which statement best describes the primary architectural purpose of ${cap}?`,
      codeSnippet: null,
      options: [
        `It provides specialized abstractions and tools for solving domain problems in ${cap}.`,
        `It replaces the underlying operating system kernel entirely.`,
        `It is solely an image editing format with no runtime behavior.`,
        `It requires running exclusively inside an emulated browser environment.`
      ],
      correctIndex: 0,
      explanation: `${cap} provides high-level abstractions, standards, and patterns specifically designed to solve real-world problems in this domain efficiently.`
    },
    {
      id: `${slug}-f2`,
      difficulty: 'medium',
      topic: `${cap} Best Practices`,
      question: `When designing a production-grade system with ${cap}, what is considered an industry best practice?`,
      codeSnippet: null,
      options: [
        `Ignoring configuration errors and silencing runtime warnings.`,
        `Decoupling components, establishing explicit contracts, and applying automated verification.`,
        `Writing all logic in a single monolithic source file without modular boundaries.`,
        `Hardcoding environment secrets directly into repository version control.`
      ],
      correctIndex: 1,
      explanation: `Modularity, decoupled interfaces, and automated test coverage prevent regressions and ensure maintainability in production ${cap} deployments.`
    },
    {
      id: `${slug}-f3`,
      difficulty: 'medium',
      topic: `${cap} State & Error Handling`,
      question: `In ${cap}, how should unexpected exceptions or failure states ideally be managed?`,
      codeSnippet: null,
      options: [
        `Catching errors, logging contextual diagnostics, and failing gracefully or retrying idempotently.`,
        `Allowing the process to crash silently without emitting telemetry or exit logs.`,
        `Terminating the parent database server immediately upon error.`,
        `Disabling all error checking mechanisms in production to increase throughput.`
      ],
      correctIndex: 0,
      explanation: `Graceful error handling, structured logging, and idempotent retry strategies ensure resilience in ${cap} systems.`
    },
    {
      id: `${slug}-f4`,
      difficulty: 'hard',
      topic: `${cap} Performance Tuning`,
      question: `When diagnosing high latency or resource bottlenecks in ${cap}, which optimization yields the highest impact?`,
      codeSnippet: null,
      options: [
        `Profiling execution hot-paths, minimizing redundant allocations, and optimizing I/O bottlenecks.`,
        `Doubling CPU clock speed without analyzing profiler flamegraphs.`,
        `Replacing all asynchronous pipelines with synchronous blocking loops.`,
        `Increasing thread counts to unlimited without checking thread-pool saturation.`
      ],
      correctIndex: 0,
      explanation: `Profiler-guided optimization targeting memory allocation and I/O wait times produces measurable performance gains in ${cap}.`
    },
    {
      id: `${slug}-f5`,
      difficulty: 'hard',
      topic: `${cap} Concurrency & Reliability`,
      question: `How does ${cap} ensure reliability and data consistency under high concurrent throughput?`,
      codeSnippet: null,
      options: [
        `By avoiding locks and assuming operations will never execute concurrently.`,
        `Using synchronization primitives, atomic state transitions, or non-blocking event loops.`,
        `Restarting the entire cluster every minute to flush memory caches.`,
        `Relying on arbitrary client sleep timeouts to prevent race conditions.`
      ],
      correctIndex: 1,
      explanation: `Atomic transitions, proper locking protocols, or structured event-loop execution guarantee state integrity in concurrent ${cap} systems.`
    }
  ];
}

/**
 * Sanitize questions ensuring strict conformity to quiz schema
 */
function sanitizeQuestions(rawList, skill, providerName) {
  const norm = (skill || 'skill').toLowerCase().replace(/[^a-z0-9]/g, '');
  const difficulties = ['medium', 'easy', 'medium', 'hard', 'hard'];

  return rawList.slice(0, 5).map((q, idx) => {
    let opts = Array.isArray(q.options) && q.options.length >= 4
      ? q.options.slice(0, 4).map(String)
      : ['Option A', 'Option B', 'Option C', 'Option D'];

    let correct = Number(q.correctIndex);
    if (isNaN(correct) || correct < 0 || correct > 3) {
      correct = 0;
    }

    return {
      id: q.id || `${norm}-q${idx + 1}`,
      difficulty: q.difficulty || difficulties[idx] || 'medium',
      topic: q.topic || `${skill} Core`,
      question: q.question || `Question about ${skill}?`,
      codeSnippet: typeof q.codeSnippet === 'string' && q.codeSnippet.trim() ? q.codeSnippet.trim() : null,
      options: opts,
      correctIndex: correct,
      explanation: q.explanation || `Choice ${opts[correct]} is correct based on ${skill} specifications.`,
      provider: providerName
    };
  });
}

/**
 * Main entry point: Generates 5 adaptive questions for any skill using multi-model hierarchy
 */
async function generateAdaptiveSkillQuiz(skill, options = {}) {
  const {
    userApiKey = null,
    provider = 'auto', // 'auto' | 'groq' | 'gemini' | 'openai' | 'offline'
    skipCache = false
  } = options;

  const cacheKey = `${skill.toLowerCase()}_${provider}_${userApiKey ? 'custom' : 'server'}`;

  if (!skipCache && questionCache.has(cacheKey)) {
    const cached = questionCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        success: true,
        skill,
        provider: cached.provider,
        questions: cached.questions,
        cached: true
      };
    }
  }

  let questions = null;
  let activeProvider = 'offline';

  // 1. Explicit or Auto Groq
  if ((provider === 'auto' || provider === 'groq') && (userApiKey || process.env.GROQ_API_KEY)) {
    try {
      questions = await generateWithGroq(skill, userApiKey);
      activeProvider = 'groq';
    } catch (err) {
      console.warn(`[AIQuiz] Groq generation for "${skill}" failed: ${err.message}`);
    }
  }

  // 2. Explicit or Auto Gemini
  if (!questions && (provider === 'auto' || provider === 'gemini') && (userApiKey || process.env.GEMINI_API_KEY)) {
    try {
      questions = await generateWithGemini(skill, userApiKey);
      activeProvider = 'gemini';
    } catch (err) {
      console.warn(`[AIQuiz] Gemini generation for "${skill}" failed: ${err.message}`);
    }
  }

  // 3. Explicit Custom OpenAI-compatible
  if (!questions && (provider === 'openai' || userApiKey)) {
    try {
      questions = await generateWithOpenAICompatible(skill, userApiKey);
      activeProvider = 'openai';
    } catch (err) {
      console.warn(`[AIQuiz] Custom OpenAI generation for "${skill}" failed: ${err.message}`);
    }
  }

  // 4. Guaranteed Offline Domain Fallback
  if (!questions || questions.length < 3) {
    questions = generateOfflineFallback(skill);
    activeProvider = 'offline_engine';
  }

  // Save to cache
  questionCache.set(cacheKey, {
    questions,
    provider: activeProvider,
    timestamp: Date.now()
  });

  return {
    success: true,
    skill,
    provider: activeProvider,
    questions,
    cached: false
  };
}

/**
 * Return status of all configured AI providers on the server
 */
function getAvailableProviders() {
  return {
    groq: {
      available: Boolean(process.env.GROQ_API_KEY),
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      displayName: 'Groq Cloud (Llama / Qwen)',
      speed: '< 300ms',
      recommended: true
    },
    gemini: {
      available: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      displayName: 'Google Gemini',
      speed: '~1s',
      recommended: false
    },
    customKey: {
      available: true,
      displayName: 'Custom User API Key',
      supported: ['groq', 'gemini', 'openai']
    },
    offline: {
      available: true,
      displayName: 'Curated Question Bank & Offline Engine',
      speed: 'Instant (0ms)'
    }
  };
}

module.exports = {
  generateAdaptiveSkillQuiz,
  getAvailableProviders,
  generateWithGroq,
  generateWithGemini
};

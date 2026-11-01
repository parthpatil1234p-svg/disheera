/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * careerInsightService.js — AI-Powered Career Fit Brief & Market Insights
 * Powered by Groq Cloud & Google Gemini
 * Disheera · Enterprise Backend Service
 */

const { callGroq } = require('./groqService');
const { callGemini } = require('./geminiService');
const { cacheManager } = require('../utils/cacheManager');

// High-fidelity fallback market telemetry for verified roles (India 2026-27 tech landscape)
const DEFAULT_MARKET_INSIGHTS = {
  'front-end-developer': {
    salaryRange: '₹4.5 – ₹9.0 LPA (Entry-Level)',
    hiringDemand: 'High Demand · 35,000+ open roles across product startups & IT services',
    whyYouFit: 'Your visual creativity and frontend coding interests provide a natural transition into modern responsive UI engineering.',
    keyBottleneck: 'Mastering modern component state management and REST API integration is critical for technical hiring rounds.',
    actionableTip: 'Build a production-grade dashboard with responsive layout and clean component architecture on GitHub.'
  },
  'full-stack-developer': {
    salaryRange: '₹6.0 – ₹12.0 LPA (Entry-Level)',
    hiringDemand: 'Very High Demand · Most sought-after role for high-velocity startup engineering teams',
    whyYouFit: 'Your balanced technical interests make you an ideal candidate to build complete end-to-end web applications.',
    keyBottleneck: 'Connecting decoupled frontends with secure backend REST APIs and database schema design.',
    actionableTip: 'Create an authenticated full-stack CRUD application with JWT and MongoDB Atlas to prove production readiness.'
  },
  'data-analyst': {
    salaryRange: '₹4.5 – ₹8.5 LPA (Entry-Level)',
    hiringDemand: 'Fast Growing · Surging enterprise demand for business intelligence and data pipelines',
    whyYouFit: 'Your analytical mindset and quantitative background fit right into modern decision intelligence and data transformation.',
    keyBottleneck: 'Translating raw database SQL queries into clear business visual storytelling and statistical summaries.',
    actionableTip: 'Publish an interactive data visualization case study using Python (Pandas/Seaborn) or SQL on public Kaggle datasets.'
  },
  'ui-ux-designer': {
    salaryRange: '₹4.0 – ₹8.0 LPA (Entry-Level)',
    hiringDemand: 'High Demand · Crucial role in consumer apps, fintech, and AI user experience design',
    whyYouFit: 'Your design thinking and empathy for user workflows give you a strong edge in crafting intuitive product interfaces.',
    keyBottleneck: 'Creating systematic Figma design components, wireframing, and usability testing documentation.',
    actionableTip: 'Document a complete end-to-end case study from problem statement to interactive Figma prototype in your portfolio.'
  },
  'cybersecurity-analyst': {
    salaryRange: '₹5.5 – ₹11.0 LPA (Entry-Level)',
    hiringDemand: 'Critical Shortage · Rapidly expanding regulatory compliance and security operations centers',
    whyYouFit: 'Your interest in networks and systems security aligns directly with SOC defense and vulnerability assessments.',
    keyBottleneck: 'Practical hands-on familiarity with Linux CLI security tools, network packet analysis, and OWASP Top 10.',
    actionableTip: 'Document practical labs on TryHackMe or HackTheBox and write technical walkthroughs of security fundamentals.'
  },
  'ai-ml-engineer': {
    salaryRange: '₹7.0 – ₹15.0 LPA (Entry-Level)',
    hiringDemand: 'Exponential Growth · Surging demand across generative AI, autonomous systems, and predictive models',
    whyYouFit: 'Your interest in artificial intelligence and algorithmic models positions you perfectly for modern AI/ML development.',
    keyBottleneck: 'Mastering model fine-tuning, tensor operations, and production LLM orchestration with LangChain or PyTorch.',
    actionableTip: 'Deploy an end-to-end machine learning model pipeline or RAG application with an active demo on Hugging Face or GitHub.'
  },
  'devops-cloud-engineer': {
    salaryRange: '₹6.5 – ₹13.0 LPA (Entry-Level)',
    hiringDemand: 'Critical Need · 40,000+ vacancies across cloud infrastructure, CI/CD, and Kubernetes engineering',
    whyYouFit: 'Your systems knowledge and cloud curiosity provide an ideal foundation for automated platform and infrastructure reliability.',
    keyBottleneck: 'Hands-on production proficiency with Docker containerization, Kubernetes clustering, and Terraform IaC.',
    actionableTip: 'Containerize a multi-tier microservice with Docker and automate deployment using GitHub Actions and AWS or GCP free tier.'
  },
  'mobile-app-developer': {
    salaryRange: '₹5.0 – ₹10.5 LPA (Entry-Level)',
    hiringDemand: 'High Demand · Continuous mobile-first product launches across consumer tech, fintech, and e-commerce',
    whyYouFit: 'Your focus on client applications and user touchpoints translates directly into sleek native or cross-platform mobile experiences.',
    keyBottleneck: 'Mastering reactive state management, offline-first SQLite sync, and native platform device integrations.',
    actionableTip: 'Publish a clean Flutter or React Native mobile application to the Google Play Store or showcase a live APK on GitHub.'
  },
  'backend-engineer': {
    salaryRange: '₹6.0 – ₹12.5 LPA (Entry-Level)',
    hiringDemand: 'Very High Demand · Core hiring priority for microservices, high-throughput APIs, and distributed systems',
    whyYouFit: 'Your server architecture and database design interests make you a natural fit for high-performance backend systems.',
    keyBottleneck: 'Designing resilient distributed architectures with Redis caching, message queues, and ACID transactions.',
    actionableTip: 'Build a high-concurrency RESTful API featuring JWT auth, rate limiting, and Redis caching with automated unit test suites.'
  },
  'data-scientist': {
    salaryRange: '₹6.5 – ₹14.0 LPA (Entry-Level)',
    hiringDemand: 'High Growth · High enterprise investment in advanced predictive analytics, modeling, and deep learning',
    whyYouFit: 'Your mathematical rigor and quantitative analysis passion align with feature engineering and statistical machine learning.',
    keyBottleneck: 'Feature engineering on messy real-world datasets and defending statistical assumptions in production models.',
    actionableTip: 'Complete and publish an end-to-end Kaggle notebook with Exploratory Data Analysis, model benchmarking, and hyperparameter tuning.'
  },
  'qa-automation-engineer': {
    salaryRange: '₹4.5 – ₹9.0 LPA (Entry-Level)',
    hiringDemand: 'Steady Demand · Essential for modern CI/CD release safety, automated regression, and API testing suites',
    whyYouFit: 'Your attention to detail and software reliability mindset make you well-suited for automated quality assurance.',
    keyBottleneck: 'Writing resilient, non-flaky end-to-end Playwright/Cypress test scripts and integrating them into CI/CD pipelines.',
    actionableTip: 'Create an automated testing framework repo for a mock web app using Playwright or Cypress with automated GitHub Actions run.'
  },
  'game-developer': {
    salaryRange: '₹4.5 – ₹9.5 LPA (Entry-Level)',
    hiringDemand: 'Rapidly Expanding · Booming Indian gaming ecosystem, 3D interactive web, and simulation development',
    whyYouFit: 'Your 3D spatial thinking, physics interest, and interactive scripting align with modern real-time engine programming.',
    keyBottleneck: 'Mastering game loop optimization, shader authoring, and state management in Unity or Godot.',
    actionableTip: 'Build and deploy a playable WebGL game prototype on itch.io demonstrating polished gameplay mechanics and sound design.'
  },
  'blockchain-web3-developer': {
    salaryRange: '₹7.0 – ₹16.0 LPA (Entry-Level)',
    hiringDemand: 'Niche High Value · Specialized demand across decentralized finance, smart contract auditing, and Web3',
    whyYouFit: 'Your cryptography and decentralized ledger interests make you an early mover in secure blockchain development.',
    keyBottleneck: 'Writing gas-optimized Solidity smart contracts and defending against reentrancy and common Web3 attack vectors.',
    actionableTip: 'Deploy an audited Solidity smart contract on an Ethereum testnet and build a frontend dApp with ethers.js or viem.'
  },
  'cloud-security-engineer': {
    salaryRange: '₹6.5 – ₹13.5 LPA (Entry-Level)',
    hiringDemand: 'Top Shortage · Unprecedented corporate hiring to secure multi-cloud environments and prevent breaches',
    whyYouFit: 'Your passion for cloud architecture and security defense positions you directly at the frontier of DevSecOps.',
    keyBottleneck: 'Configuring least-privilege IAM policies, cloud security posture management (CSPM), and compliance automation.',
    actionableTip: 'Set up an automated cloud security compliance audit tool using open-source tools like Prowler or ScoutSuite on AWS/GCP.'
  },
  'technical-product-manager': {
    salaryRange: '₹7.5 – ₹15.0 LPA (Entry-Level)',
    hiringDemand: 'High Demand · High-impact role bridging engineering sprint execution, product roadmaps, and business metrics',
    whyYouFit: 'Your ability to synthesize technology, user needs, and cross-functional roadmaps makes you an ideal product leader.',
    keyBottleneck: 'Drafting precise PRDs (Product Requirement Documents) with clear acceptance criteria and data-backed success metrics.',
    actionableTip: 'Author a comprehensive product breakdown tear-down and PRD for a modern AI software product and publish it on Medium/Substack.'
  },

  // ── Business & Finance Track ─────────────────────────────────
  'financial-analyst': {
    salaryRange: '₹5.5 – ₹11.0 LPA (Entry-Level)',
    hiringDemand: 'High Demand · 25,000+ open roles across investment banking, fintech, corporate finance & advisory',
    whyYouFit: 'Your quantitative reasoning, analytical accuracy, and interest in financial dynamics provide an ideal foundation for financial modeling.',
    keyBottleneck: 'Mastering 3-statement integrated financial models, DCF valuation, and Excel financial modeling formulas.',
    actionableTip: 'Build an end-to-end DCF valuation model in Excel for a publicly listed Indian firm and present it on LinkedIn.'
  },
  'financial-analyst-modeler': {
    salaryRange: '₹5.5 – ₹11.0 LPA (Entry-Level)',
    hiringDemand: 'High Demand · 25,000+ open roles across investment banking, fintech, corporate finance & advisory',
    whyYouFit: 'Your quantitative reasoning, analytical accuracy, and interest in financial dynamics provide an ideal foundation for financial modeling.',
    keyBottleneck: 'Mastering 3-statement integrated financial models, DCF valuation, and Excel financial modeling formulas.',
    actionableTip: 'Build an end-to-end DCF valuation model in Excel for a publicly listed Indian firm and present it on LinkedIn.'
  },
  'business-operations-manager': {
    salaryRange: '₹5.0 – ₹10.5 LPA (Entry-Level)',
    hiringDemand: 'Strong Hiring · High demand across high-growth startups, logistics tech, and D2C enterprises',
    whyYouFit: 'Your structured problem-solving, operational clarity, and cross-functional coordination align directly with business operations leadership.',
    keyBottleneck: 'Translating business bottlenecks into streamlined SOPs, metric dashboards, and automated workflows.',
    actionableTip: 'Create an operational process map and KPI dashboard for a mock business using Notion, ClickUp, or Excel.'
  },
  'management-consultant': {
    salaryRange: '₹7.0 – ₹14.5 LPA (Entry-Level)',
    hiringDemand: 'Competitive & High Value · Significant recruitment across Big 4, boutique advisory, and strategy firms',
    whyYouFit: 'Your ability to break down complex business problems and synthesize high-level strategic recommendations fits consulting rigor.',
    keyBottleneck: 'Mastering hypothesis-driven problem solving, MECE structuring, and executive-ready presentations.',
    actionableTip: 'Solve and document 3 comprehensive business case studies focusing on market entry and cost optimization.'
  },

  // ── Digital Marketing & Growth Track ──────────────────────────
  'performance-marketer': {
    salaryRange: '₹4.5 – ₹9.5 LPA (Entry-Level)',
    hiringDemand: 'Rapid Growth · High demand across D2C brands, e-commerce, and high-velocity SaaS growth teams',
    whyYouFit: 'Your blend of analytical data interpretation and creative audience targeting makes you a natural performance media buyer.',
    keyBottleneck: 'Hands-on CAC/ROAS optimization, conversion attribution modeling, and Meta/Google Ads bidding strategies.',
    actionableTip: 'Run a live low-budget Meta or Google Ads test campaign to document real conversion metrics and creative split testing.'
  },
  'performance-marketer-media-buyer': {
    salaryRange: '₹4.5 – ₹9.5 LPA (Entry-Level)',
    hiringDemand: 'Rapid Growth · High demand across D2C brands, e-commerce, and high-velocity SaaS growth teams',
    whyYouFit: 'Your blend of analytical data interpretation and creative audience targeting makes you a natural performance media buyer.',
    keyBottleneck: 'Hands-on CAC/ROAS optimization, conversion attribution modeling, and Meta/Google Ads bidding strategies.',
    actionableTip: 'Run a live low-budget Meta or Google Ads test campaign to document real conversion metrics and creative split testing.'
  },
  'seo-growth-strategist': {
    salaryRange: '₹4.5 – ₹9.5 LPA (Entry-Level)',
    hiringDemand: 'Exponential Growth · Modern AI Answer Engine Optimization (AEO), technical indexability, and cross-border organic growth',
    whyYouFit: 'Your analytical mindset, technical curiosity, and content structuring skills match generative AI citation algorithms and search engine ranking mechanics.',
    keyBottleneck: 'Core Web Vitals performance, Answer Engine Optimization (AEO/llms.txt), Schema.org entity linking, and global search crawling (Google + Baidu).',
    actionableTip: 'Deploy an AEO-ready site architecture with llms.txt, Schema.org JSON-LD graphs, and run technical crawl audits using Google Search Console and Baidu Webmaster Tools.'
  },
  'seo-organic-growth-strategist': {
    salaryRange: '₹4.5 – ₹9.5 LPA (Entry-Level)',
    hiringDemand: 'Exponential Growth · Modern AI Answer Engine Optimization (AEO), technical indexability, and cross-border organic growth',
    whyYouFit: 'Your analytical mindset, technical curiosity, and content structuring skills match generative AI citation algorithms and search engine ranking mechanics.',
    keyBottleneck: 'Core Web Vitals performance, Answer Engine Optimization (AEO/llms.txt), Schema.org entity linking, and global search crawling (Google + Baidu).',
    actionableTip: 'Deploy an AEO-ready site architecture with llms.txt, Schema.org JSON-LD graphs, and run technical crawl audits using Google Search Console and Baidu Webmaster Tools.'
  },
  'social-media-growth-manager': {
    salaryRange: '₹3.8 – ₹7.5 LPA (Entry-Level)',
    hiringDemand: 'High Velocity · Growing demand across digital brands, creator agencies, and startup community hubs',
    whyYouFit: 'Your understanding of viral storytelling, trend analysis, and digital brand voice fits modern audience growth.',
    keyBottleneck: 'Data-driven content distribution, community retention metrics, and short-form video scripting frameworks.',
    actionableTip: 'Launch a niche social media page or newsletter, documenting organic growth experiments and engagement metrics.'
  },
  'social-media-content-growth-manager': {
    salaryRange: '₹3.8 – ₹7.5 LPA (Entry-Level)',
    hiringDemand: 'High Velocity · Growing demand across digital brands, creator agencies, and startup community hubs',
    whyYouFit: 'Your understanding of viral storytelling, trend analysis, and digital brand voice fits modern audience growth.',
    keyBottleneck: 'Data-driven content distribution, community retention metrics, and short-form video scripting frameworks.',
    actionableTip: 'Launch a niche social media page or newsletter, documenting organic growth experiments and engagement metrics.'
  },

  // ── Design & Creative Track ───────────────────────────────────
  'brand-identity-designer': {
    salaryRange: '₹4.2 – ₹8.5 LPA (Entry-Level)',
    hiringDemand: 'Steady Demand · Highly prized by creative agencies, design studios, and early-stage brand incubators',
    whyYouFit: 'Your visual eye, typography appreciation, and conceptual thinking make you a natural brand identity creator.',
    keyBottleneck: 'Developing comprehensive design systems, logo guidelines, vector typography, and multi-touchpoint brand collateral.',
    actionableTip: 'Publish a complete brand identity case study on Behance or Dribbble showcasing typography, color systems, and physical mockups.'
  },
  'brand-visual-identity-designer': {
    salaryRange: '₹4.2 – ₹8.5 LPA (Entry-Level)',
    hiringDemand: 'Steady Demand · Highly prized by creative agencies, design studios, and early-stage brand incubators',
    whyYouFit: 'Your visual eye, typography appreciation, and conceptual thinking make you a natural brand identity creator.',
    keyBottleneck: 'Developing comprehensive design systems, logo guidelines, vector typography, and multi-touchpoint brand collateral.',
    actionableTip: 'Publish a complete brand identity case study on Behance or Dribbble showcasing typography, color systems, and physical mockups.'
  },
  'motion-3d-designer': {
    salaryRange: '₹5.0 – ₹10.5 LPA (Entry-Level)',
    hiringDemand: 'Fast Expanding · Growing demand in UI motion, product showcases, gaming, and 3D web experiences',
    whyYouFit: 'Your spatial awareness, timing sensibility, and aesthetic vision align with production-grade motion design and real-time 3D pipelines.',
    keyBottleneck: 'Mastering Blender/Cinema 4D rendering pipelines, lighting, and After Effects micro-interaction choreography.',
    actionableTip: 'Publish a 15-second 3D product animation or UI motion reel demonstrating lighting and physics choreography on YouTube or Instagram.'
  },
  'motion-graphics-3d-designer': {
    salaryRange: '₹5.0 – ₹10.5 LPA (Entry-Level)',
    hiringDemand: 'Fast Expanding · Growing demand in UI motion, product showcases, gaming, and 3D web experiences',
    whyYouFit: 'Your spatial awareness, timing sensibility, and aesthetic vision align with production-grade motion design and real-time 3D pipelines.',
    keyBottleneck: 'Mastering Blender/Cinema 4D rendering pipelines, lighting, and After Effects micro-interaction choreography.',
    actionableTip: 'Publish a 15-second 3D product animation or UI motion reel demonstrating lighting and physics choreography on YouTube or Instagram.'
  },
  'copywriter-content-strategist': {
    salaryRange: '₹4.0 – ₹8.0 LPA (Entry-Level)',
    hiringDemand: 'High Value · Crucial for B2B SaaS, product marketing, pitch decks, and brand storytelling',
    whyYouFit: 'Your strong verbal clarity, persuasive rhetoric, and storytelling instincts enable high-converting copy creation.',
    keyBottleneck: 'Mastering conversion copywriting formulas (PAS, AIDA), customer interview synthesis, and value proposition testing.',
    actionableTip: 'Write and publish 3 high-converting landing page teardowns and rewritten copy assets on Substack or Medium.'
  },
  'b2b-technical-creative-copywriter': {
    salaryRange: '₹4.0 – ₹8.0 LPA (Entry-Level)',
    hiringDemand: 'High Value · Crucial for B2B SaaS, product marketing, pitch decks, and brand storytelling',
    whyYouFit: 'Your strong verbal clarity, persuasive rhetoric, and storytelling instincts enable high-converting copy creation.',
    keyBottleneck: 'Mastering conversion copywriting formulas (PAS, AIDA), customer interview synthesis, and value proposition testing.',
    actionableTip: 'Write and publish 3 high-converting landing page teardowns and rewritten copy assets on Substack or Medium.'
  }
};

// Circuit breakers to prevent repeated dead HTTP roundtrips when API keys are invalid or network is down
let groqCircuitOpenUntil = 0;
let geminiCircuitOpenUntil = 0;

/**
 * Generates an AI-Powered Career Fit Brief for a recommendation
 * @param {Object} recommendation - Scored recommendation object
 * @param {Object} user - User document
 * @returns {Promise<Object>} Enriched aiBrief
 */
async function generateCareerBrief(recommendation, user) {
  const career = recommendation.career || {};
  const slug = career.slug || '';
  const domain = career.domain || 'engineering';
  const defaultFallbackForDomain = domain === 'business'
    ? DEFAULT_MARKET_INSIGHTS['financial-analyst']
    : domain === 'marketing'
    ? DEFAULT_MARKET_INSIGHTS['performance-marketer']
    : domain === 'creative'
    ? DEFAULT_MARKET_INSIGHTS['brand-identity-designer']
    : DEFAULT_MARKET_INSIGHTS['front-end-developer'];

  const fallback = DEFAULT_MARKET_INSIGHTS[slug] || defaultFallbackForDomain;

  const matchedNames = (recommendation.matchedSkills || []).map(s => s.displayName || s.name).join(', ') || 'Foundational domain skills';
  const missingNames = (recommendation.missingSkills || []).map(s => s.displayName || s.name).join(', ') || 'Advanced specialization';
  const educationText = user.education?.course ? `${user.education.course} ${user.education.branch || ''}`.trim() : 'College Student';

  const skillSignature = (recommendation.matchedSkills || []).map(s => s.name || s.displayName).sort().join(',');
  const cacheKey = `ai_brief:${slug}:${educationText.toLowerCase()}:${skillSignature}`;

  return await cacheManager.wrap(cacheKey, 86400, async () => {
    const promptMessages = [
      {
        role: 'system',
        content: `You are an expert Career & Industry Talent Analyst for Disheera.
Generate an executive Career Fit & Market Brief for this college student.
Return strictly a raw, valid JSON object (no markdown code fences, no extra text) with these 5 keys:
{
  "salaryRange": "e.g. ₹5.0 – ₹9.5 LPA (Entry-Level in India)",
  "hiringDemand": "e.g. Very High · 40,000+ openings across companies",
  "whyYouFit": "2 clear sentences explaining why their specific skills and degree make them a solid candidate for this role.",
  "keyBottleneck": "1 concise sentence stating the exact primary missing skill or concept they must master first to become hireable.",
  "actionableTip": "1 practical, actionable tip for building a standout portfolio project or proof of work for this role."
}`
      },
      {
        role: 'user',
        content: `Target Role: ${career?.title || 'Unknown Role'}
Student Education: ${educationText}
Student Matched Skills: ${matchedNames}
Missing Skills to build: ${missingNames}
Match Score: ${recommendation.finalScore || 'N/A'}%`
      }
    ];

    // 1. Try Groq for ultra-fast generation (<100ms) if circuit is closed
    if (process.env.GROQ_API_KEY && Date.now() > groqCircuitOpenUntil) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const raw = await callGroq(promptMessages, controller.signal);
        clearTimeout(timeoutId);

        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.salaryRange && parsed.whyYouFit) {
          return {
            ...fallback,
            ...parsed,
            generatedByAI: true,
            engine: 'Groq Cloud',
          };
        }
      } catch (groqErr) {
        if (groqErr.message?.includes('Invalid API Key') || groqErr.message?.includes('401')) {
          groqCircuitOpenUntil = Date.now() + 10 * 60 * 1000; // Trip circuit for 10 minutes
          console.warn('⚠️  [FastPath] Groq API key invalid; circuit opened for 10 minutes.');
        }
        // Continue to Gemini fallback
      }
    }

    // 2. Fallback to Gemini if Groq failed or not configured and circuit is closed
    if (process.env.GEMINI_API_KEY && Date.now() > geminiCircuitOpenUntil) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const systemContent = promptMessages[0].content;
        const userContent = promptMessages[1].content;
        const raw = await callGemini(
          [{ role: 'user', parts: [{ text: userContent }] }],
          null,
          controller.signal,
          systemContent
        );
        clearTimeout(timeoutId);

        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.salaryRange && parsed.whyYouFit) {
          return {
            ...fallback,
            ...parsed,
            generatedByAI: true,
            engine: 'Google Gemini',
          };
        }
      } catch (geminiErr) {
        if (geminiErr.message?.includes('API key not valid') || geminiErr.message?.includes('400')) {
          geminiCircuitOpenUntil = Date.now() + 10 * 60 * 1000; // Trip circuit for 10 minutes
          console.warn('⚠️  [FastPath] Gemini API key invalid; circuit opened for 10 minutes.');
        }
        // Continue to static fallback
      }
    }

    // 3. Guaranteed High-Fidelity Static Fallback (Instant 0ms)
    return {
      ...fallback,
      generatedByAI: false,
      engine: 'Disheera Telemetry Engine',
    };
  });
}

/**
 * Enriches an array of recommendations with AI Career Fit Briefs
 * @param {Array} recommendations - Ranked recommendations
 * @param {Object} user - User document
 * @returns {Promise<Array>} Enriched recommendations
 */
async function enrichRecommendationsWithAI(recommendations, user) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return recommendations;
  }

  // Generate briefs in parallel for speed
  const enriched = await Promise.all(
    recommendations.map(async (rec) => {
      try {
        const aiBrief = await generateCareerBrief(rec, user);
        return {
          ...rec,
          aiBrief,
        };
      } catch (e) {
        return {
          ...rec,
          aiBrief: DEFAULT_MARKET_INSIGHTS[rec.career?.slug] || DEFAULT_MARKET_INSIGHTS['front-end-developer'],
        };
      }
    })
  );

  return enriched;
}

module.exports = {
  enrichRecommendationsWithAI,
  generateCareerBrief,
  DEFAULT_MARKET_INSIGHTS,
};

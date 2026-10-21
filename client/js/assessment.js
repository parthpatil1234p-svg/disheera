/**
 * assessment.js - Student Profile & Skill Assessment Controller
 *
 * Implements:
 * - 4-step progressive wizard with validation and step navigation
 * - Preloading existing user profile via GET /api/users/me
 * - Interactive interest chip toggling
 * - Category-filtered skill picker with proficiency selects
 * - Submitting assessment payload to PUT /api/assessment
 * - Preserves all existing IDs, fields, and API contracts
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Strict HTML escape helper for secure DOM rendering
  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // 1. Guard page (strict student portal isolation)
  if (!window.Auth?.requireStudent()) {
    return;
  }
  window.Auth?.consumePortalAlert();

  // 2. Constants & Data
  const ALL_INTERESTS = [
    // Tech & Engineering (stream: 'engineering')
    { id: 'web development', label: 'Web Development', icon: 'bi-code-slash', stream: 'engineering' },
    { id: 'app development', label: 'Mobile App Development', icon: 'bi-phone', stream: 'engineering' },
    { id: 'artificial intelligence', label: 'Artificial Intelligence & ML', icon: 'bi-cpu', stream: 'engineering' },
    { id: 'cybersecurity', label: 'Cybersecurity & Defense', icon: 'bi-shield-shaded', stream: 'engineering' },
    { id: 'cloud computing', label: 'Cloud Computing & DevOps', icon: 'bi-cloud', stream: 'engineering' },
    { id: 'backend engineering', label: 'Backend & Distributed Systems', icon: 'bi-hdd-network', stream: 'engineering' },
    { id: 'data science', label: 'Data Science & Deep Learning', icon: 'bi-clipboard-data', stream: 'engineering' },
    { id: 'qa testing', label: 'QA & Test Automation', icon: 'bi-check2-circle', stream: 'engineering' },
    { id: 'gaming', label: 'Game Development & 3D', icon: 'bi-controller', stream: 'engineering' },
    { id: 'blockchain', label: 'Blockchain & Web3', icon: 'bi-link-45deg', stream: 'engineering' },
    { id: 'cloud security', label: 'Cloud Security & DevSecOps', icon: 'bi-shield-lock', stream: 'engineering' },
    { id: 'product management', label: 'Technical Product Strategy', icon: 'bi-kanban', streams: ['engineering', 'business'] },

    // Business, Finance & Corporate Operations (stream: 'business')
    { id: 'financial modeling', label: 'Financial Modeling & Valuation', icon: 'bi-cash-coin', stream: 'business' },
    { id: 'finance', label: 'Corporate Finance & Reporting', icon: 'bi-bank', stream: 'business' },
    { id: 'valuation', label: 'DCF Valuation & Investment Analysis', icon: 'bi-calculator', stream: 'business' },
    { id: 'business operations', label: 'Business Operations & RevOps', icon: 'bi-briefcase', stream: 'business' },
    { id: 'management consulting', label: 'Management Consulting & Advisory', icon: 'bi-pie-chart', stream: 'business' },
    { id: 'business strategy', label: 'Corporate Strategy & Scaling', icon: 'bi-graph-up', stream: 'business' },

    // Digital Marketing & Growth (stream: 'marketing')
    { id: 'digital marketing', label: 'Digital Marketing & Growth', icon: 'bi-bullseye', stream: 'marketing' },
    { id: 'advertising', label: 'Paid Ads (Meta, Google, TikTok)', icon: 'bi-badge-ad', stream: 'marketing' },
    { id: 'seo', label: 'SEO & Organic Search Strategy', icon: 'bi-search', stream: 'marketing' },
    { id: 'content marketing', label: 'Content Strategy & Editorial', icon: 'bi-journal-text', streams: ['marketing', 'creative'] },
    { id: 'social media', label: 'Social Media & Community Building', icon: 'bi-megaphone', stream: 'marketing' },
    { id: 'viral growth', label: 'Short-Form Video & Viral Loops', icon: 'bi-fire', stream: 'marketing' },

    // Creative, Media & Design (stream: 'creative')
    { id: 'design', label: 'UI / UX Design & Prototyping', icon: 'bi-palette', streams: ['creative', 'engineering'] },
    { id: 'branding', label: 'Brand Identity & Visual Systems', icon: 'bi-vector-pen', streams: ['creative', 'marketing'] },
    { id: 'motion graphics', label: 'Motion Graphics & After Effects', icon: 'bi-film', stream: 'creative' },
    { id: '3d modeling', label: '3D Modeling & Blender', icon: 'bi-box', stream: 'creative' },
    { id: 'copywriting', label: 'High-Converting Copywriting', icon: 'bi-pen', streams: ['creative', 'marketing'] },
    { id: 'visual storytelling', label: 'Visual Storytelling & Narrative', icon: 'bi-brush', stream: 'creative' },

    // Transferable Cross-Domain
    { id: 'data analysis', label: 'Data Analysis & BI Dashboards', icon: 'bi-graph-up-arrow', streams: ['engineering', 'business'] },
    { id: 'market research', label: 'Market Research & Analytics', icon: 'bi-bar-chart', streams: ['business', 'marketing'] },
    { id: 'problem solving', label: 'Problem Solving & Logic', icon: 'bi-lightbulb', streams: ['engineering', 'business', 'marketing', 'creative', 'cross'] },
  ];

  // Helper: Strictly validate if an interest is permitted in the active stream
  const isInterestAllowedInStream = (interestOrId, stream) => {
    if (!stream || stream === 'cross') return true;
    const id = typeof interestOrId === 'string' ? interestOrId.toLowerCase().trim() : (interestOrId?.id || '').toLowerCase().trim();
    const item = ALL_INTERESTS.find((i) => i.id.toLowerCase() === id);
    if (!item) return false;
    if (item.stream === stream) return true;
    if (Array.isArray(item.streams) && item.streams.includes(stream)) return true;
    return false;
  };

  // ── Authoritative 94-Skill Stream Mapping ───────────────────────
  // Guarantees zero cross-stream contamination: a student in one stream
  // will NEVER see or select skills belonging to an unrelated stream.
  const SKILL_STREAM_MAP = {
    // Frontend (Engineering; html also in marketing for landing pages)
    'html': ['engineering', 'marketing'],
    'css': ['engineering'],
    'javascript': ['engineering'],
    'responsive-design': ['engineering'],
    'react': ['engineering'],
    'bootstrap': ['engineering'],
    'typescript': ['engineering'],
    'next.js': ['engineering'],
    'tailwind-css': ['engineering'],
    'flutter': ['engineering'],

    // Backend (Engineering)
    'node.js': ['engineering'],
    'express.js': ['engineering'],
    'rest-apis': ['engineering'],
    'authentication': ['engineering'],
    'python': ['engineering'],
    'fastapi': ['engineering'],
    'graphql': ['engineering'],
    'java': ['engineering'],
    'spring-boot': ['engineering'],
    'kafka': ['engineering'],
    'csharp': ['engineering'],
    'cpp': ['engineering'],

    // Database (Engineering; sql also in business for data-driven decisions)
    'mongodb': ['engineering'],
    'sql': ['engineering', 'business'],
    'mysql': ['engineering'],
    'database-design': ['engineering'],
    'postgresql': ['engineering'],
    'redis': ['engineering'],

    // Data & Analytics (Engineering, Business, Marketing)
    'excel': ['business', 'marketing', 'engineering'],
    'statistics': ['business', 'engineering', 'marketing'],
    'power-bi': ['business', 'engineering', 'marketing'],
    'data-visualization': ['business', 'engineering', 'marketing'],
    'data-cleaning': ['business', 'engineering'],
    'pandas': ['engineering'],

    // AI & Machine Learning (Engineering)
    'langchain': ['engineering'],
    'generative-ai': ['engineering'],
    'pytorch': ['engineering'],
    'tensorflow': ['engineering'],
    'scikit-learn': ['engineering'],
    'deep-learning': ['engineering'],
    'natural-language-processing': ['engineering'],

    // Security (Engineering)
    'networking': ['engineering'],
    'linux': ['engineering'],
    'cybersecurity-fundamentals': ['engineering'],
    'ethical-hacking': ['engineering'],
    'owasp-basics': ['engineering'],

    // Cloud & DevOps (Engineering)
    'docker': ['engineering'],
    'kubernetes': ['engineering'],
    'aws': ['engineering'],
    'terraform': ['engineering'],
    'firebase': ['engineering'],

    // Mobile (Engineering)
    'react-native': ['engineering'],
    'dart': ['engineering'],

    // QA & Testing (Engineering)
    'cypress': ['engineering'],
    'selenium': ['engineering'],
    'playwright': ['engineering'],
    'postman': ['engineering'],

    // Gaming (Engineering)
    'unity': ['engineering'],
    'unreal-engine': ['engineering'],

    // Web3 & Blockchain (Engineering)
    'solidity': ['engineering'],
    'web3js': ['engineering'],
    'smart-contracts': ['engineering'],

    // Developer Tools & CI/CD (Engineering)
    'git': ['engineering'],
    'github': ['engineering'],
    'ci-cd': ['engineering'],

    // Product & Agile (Engineering & Business)
    'agile-scrum': ['business', 'engineering'],
    'product-management': ['business', 'engineering'],
    'user-stories': ['business', 'engineering'],

    // Finance & Business Operations (Business)
    'financial-modeling': ['business'],
    'dcf-valuation': ['business'],
    'accounting': ['business'],
    'business-operations': ['business'],
    'management-consulting': ['business'],
    'market-research': ['business', 'marketing', 'creative'],

    // Digital Marketing & Growth (Marketing)
    'meta-ads': ['marketing'],
    'google-ads': ['marketing'],
    'seo': ['marketing'],
    'aeo': ['marketing', 'engineering'],
    'baidu-seo': ['marketing'],
    'technical-seo': ['marketing', 'engineering'],
    'content-marketing': ['marketing', 'creative'],
    'social-media-growth': ['marketing'],
    'google-analytics': ['marketing'],

    // Creative, Media & Design (Creative; figma/visual-design also in engineering/marketing)
    'brand-identity': ['creative', 'marketing'],
    'adobe-illustrator': ['creative'],
    'motion-graphics': ['creative'],
    'copywriting': ['creative', 'marketing'],
    'blender': ['creative'],
    'typography': ['creative'],
    'figma': ['creative', 'engineering'],
    'wireframing': ['creative', 'engineering'],
    'prototyping': ['creative', 'engineering'],
    'user-research': ['creative', 'engineering'],
    'visual-design': ['creative', 'marketing', 'engineering'],

    // Universal Soft Skills (Available across all streams)
    'problem-solving': ['engineering', 'business', 'marketing', 'creative', 'cross'],
    'communication': ['engineering', 'business', 'marketing', 'creative', 'cross'],
    'teamwork': ['engineering', 'business', 'marketing', 'creative', 'cross'],
  };

  // Helper: Strictly validate if a skill is permitted in the active stream
  const isSkillAllowedInStream = (skillOrName, stream) => {
    if (!stream || stream === 'cross') return true;
    const rawKey = typeof skillOrName === 'string' ? skillOrName : (skillOrName?.name || '');
    const key = String(rawKey || '').toLowerCase().trim();
    if (!key) return false;

    // 1. Authoritative lookup in SKILL_STREAM_MAP
    if (SKILL_STREAM_MAP[key]) {
      return SKILL_STREAM_MAP[key].includes(stream);
    }

    // 2. Object properties fallback
    if (typeof skillOrName === 'object') {
      if (skillOrName?.stream === 'universal') return true;
      if (skillOrName?.stream) return skillOrName.stream === stream;
      if (Array.isArray(skillOrName?.streams)) return skillOrName.streams.includes(stream);

      // Category fallback
      const cat = skillOrName?.category;
      if (cat === 'soft-skill') return true;
      if (['frontend', 'backend', 'database', 'cloud', 'security', 'ai', 'mobile', 'testing', 'gaming', 'web3', 'tool'].includes(cat)) {
        return stream === 'engineering';
      }
      if (['finance', 'business'].includes(cat)) {
        return stream === 'business';
      }
      if (['marketing'].includes(cat)) {
        return stream === 'marketing';
      }
      if (['design'].includes(cat)) {
        return stream === 'creative';
      }
    }

    // Custom or unmapped skills that are not exclusively claimed by another stream are allowed
    return true;
  };

  const FALLBACK_SKILLS = [
    // Frontend (9)
    { name: 'html', displayName: 'HTML', category: 'frontend', stream: 'engineering' },
    { name: 'css', displayName: 'CSS', category: 'frontend', stream: 'engineering' },
    { name: 'javascript', displayName: 'JavaScript', category: 'frontend', stream: 'engineering' },
    { name: 'responsive-design', displayName: 'Responsive Design', category: 'frontend', stream: 'engineering' },
    { name: 'react', displayName: 'React', category: 'frontend', stream: 'engineering' },
    { name: 'bootstrap', displayName: 'Bootstrap', category: 'frontend', stream: 'engineering' },
    { name: 'typescript', displayName: 'TypeScript', category: 'frontend', stream: 'engineering' },
    { name: 'next.js', displayName: 'Next.js', category: 'frontend', stream: 'engineering' },
    { name: 'tailwind-css', displayName: 'Tailwind CSS', category: 'frontend', stream: 'engineering' },

    // Backend (12)
    { name: 'node.js', displayName: 'Node.js', category: 'backend', stream: 'engineering' },
    { name: 'express.js', displayName: 'Express.js', category: 'backend', stream: 'engineering' },
    { name: 'rest-apis', displayName: 'REST APIs', category: 'backend', stream: 'engineering' },
    { name: 'authentication', displayName: 'Authentication', category: 'backend', stream: 'engineering' },
    { name: 'python', displayName: 'Python', category: 'backend', stream: 'engineering' },
    { name: 'fastapi', displayName: 'FastAPI', category: 'backend', stream: 'engineering' },
    { name: 'graphql', displayName: 'GraphQL', category: 'backend', stream: 'engineering' },
    { name: 'java', displayName: 'Java', category: 'backend', stream: 'engineering' },
    { name: 'spring-boot', displayName: 'Spring Boot', category: 'backend', stream: 'engineering' },
    { name: 'kafka', displayName: 'Apache Kafka', category: 'backend', stream: 'engineering' },
    { name: 'csharp', displayName: 'C# Programming', category: 'backend', stream: 'engineering' },
    { name: 'cpp', displayName: 'C++ Programming', category: 'backend', stream: 'engineering' },

    // Database (6)
    { name: 'mongodb', displayName: 'MongoDB', category: 'database', stream: 'engineering' },
    { name: 'sql', displayName: 'SQL', category: 'database', stream: 'engineering' },
    { name: 'mysql', displayName: 'MySQL', category: 'database', stream: 'engineering' },
    { name: 'database-design', displayName: 'Database Design', category: 'database', stream: 'engineering' },
    { name: 'postgresql', displayName: 'PostgreSQL', category: 'database', stream: 'engineering' },
    { name: 'redis', displayName: 'Redis Caching', category: 'database', stream: 'engineering' },

    // Data & AI (13)
    { name: 'excel', displayName: 'Excel', category: 'data' },
    { name: 'statistics', displayName: 'Statistics', category: 'data' },
    { name: 'power-bi', displayName: 'Power BI', category: 'data' },
    { name: 'data-visualization', displayName: 'Data Visualization', category: 'data' },
    { name: 'data-cleaning', displayName: 'Data Cleaning', category: 'data' },
    { name: 'pandas', displayName: 'Pandas & NumPy', category: 'data', stream: 'engineering' },
    { name: 'langchain', displayName: 'LangChain', category: 'ai', stream: 'engineering' },
    { name: 'generative-ai', displayName: 'Generative AI & LLMs', category: 'ai', stream: 'engineering' },
    { name: 'pytorch', displayName: 'PyTorch', category: 'ai', stream: 'engineering' },
    { name: 'tensorflow', displayName: 'TensorFlow', category: 'ai', stream: 'engineering' },
    { name: 'scikit-learn', displayName: 'Scikit-Learn', category: 'ai', stream: 'engineering' },
    { name: 'deep-learning', displayName: 'Deep Learning', category: 'ai', stream: 'engineering' },
    { name: 'natural-language-processing', displayName: 'NLP', category: 'ai', stream: 'engineering' },

    // Design (5)
    { name: 'figma', displayName: 'Figma', category: 'design' },
    { name: 'wireframing', displayName: 'Wireframing', category: 'design' },
    { name: 'prototyping', displayName: 'Prototyping', category: 'design' },
    { name: 'user-research', displayName: 'User Research', category: 'design' },
    { name: 'visual-design', displayName: 'Visual Design', category: 'design' },

    // Security (5)
    { name: 'networking', displayName: 'Networking', category: 'security', stream: 'engineering' },
    { name: 'linux', displayName: 'Linux', category: 'security', stream: 'engineering' },
    { name: 'cybersecurity-fundamentals', displayName: 'Cybersecurity Fundamentals', category: 'security', stream: 'engineering' },
    { name: 'ethical-hacking', displayName: 'Ethical Hacking', category: 'security', stream: 'engineering' },
    { name: 'owasp-basics', displayName: 'OWASP Basics', category: 'security', stream: 'engineering' },

    // Cloud & DevOps (5)
    { name: 'docker', displayName: 'Docker', category: 'cloud', stream: 'engineering' },
    { name: 'kubernetes', displayName: 'Kubernetes', category: 'cloud', stream: 'engineering' },
    { name: 'aws', displayName: 'AWS Cloud', category: 'cloud', stream: 'engineering' },
    { name: 'terraform', displayName: 'Terraform & IaC', category: 'cloud', stream: 'engineering' },
    { name: 'firebase', displayName: 'Firebase & Firestore', category: 'cloud', stream: 'engineering' },

    // Mobile (3)
    { name: 'flutter', displayName: 'Flutter', category: 'mobile', stream: 'engineering' },
    { name: 'react-native', displayName: 'React Native', category: 'mobile', stream: 'engineering' },
    { name: 'dart', displayName: 'Dart', category: 'mobile', stream: 'engineering' },

    // QA & Testing (4)
    { name: 'cypress', displayName: 'Cypress E2E Testing', category: 'testing', stream: 'engineering' },
    { name: 'selenium', displayName: 'Selenium WebDriver', category: 'testing', stream: 'engineering' },
    { name: 'playwright', displayName: 'Playwright Automation', category: 'testing', stream: 'engineering' },
    { name: 'postman', displayName: 'Postman & API Testing', category: 'testing', stream: 'engineering' },

    // Gaming (2)
    { name: 'unity', displayName: 'Unity Engine', category: 'gaming', stream: 'engineering' },
    { name: 'unreal-engine', displayName: 'Unreal Engine 5', category: 'gaming', stream: 'engineering' },

    // Web3 (3)
    { name: 'solidity', displayName: 'Solidity Smart Contracts', category: 'web3', stream: 'engineering' },
    { name: 'web3js', displayName: 'Web3.js & Ethers.js', category: 'web3', stream: 'engineering' },
    { name: 'smart-contracts', displayName: 'Smart Contract Architecture', category: 'web3', stream: 'engineering' },

    // Product & Management (3)
    { name: 'agile-scrum', displayName: 'Agile & Scrum Methodology', category: 'product' },
    { name: 'product-management', displayName: 'Product Management & PRDs', category: 'product' },
    { name: 'user-stories', displayName: 'User Story Mapping & JIRA', category: 'product' },

    // Business & Finance (6)
    { name: 'financial-modeling', displayName: 'Financial Modeling & Valuation', category: 'finance', stream: 'business' },
    { name: 'dcf-valuation', displayName: 'DCF Valuation & Financial Statements', category: 'finance', stream: 'business' },
    { name: 'accounting', displayName: 'Financial Accounting & Reporting', category: 'finance', stream: 'business' },
    { name: 'business-operations', displayName: 'Business Operations & RevOps', category: 'business', stream: 'business' },
    { name: 'management-consulting', displayName: 'Management Consulting & Strategy', category: 'business', stream: 'business' },
    { name: 'market-research', displayName: 'Market Research & Intelligence', category: 'business', stream: 'business' },

    // Digital Marketing & Growth
    { name: 'meta-ads', displayName: 'Meta Ads Manager & Paid Social', category: 'marketing', stream: 'marketing' },
    { name: 'google-ads', displayName: 'Google Ads & SEM', category: 'marketing', stream: 'marketing' },
    { name: 'seo', displayName: 'SEO & Organic Search Strategy', category: 'marketing', stream: 'marketing' },
    { name: 'aeo', displayName: 'Answer Engine Optimization (AEO) & AI Search', category: 'marketing', stream: 'marketing' },
    { name: 'baidu-seo', displayName: 'Baidu SEO & China Search Optimization', category: 'marketing', stream: 'marketing' },
    { name: 'technical-seo', displayName: 'Technical SEO & Core Web Vitals', category: 'marketing', stream: 'marketing' },
    { name: 'content-marketing', displayName: 'Content Marketing & Copywriting', category: 'marketing', stream: 'marketing' },
    { name: 'social-media-growth', displayName: 'Social Media & Viral Growth', category: 'marketing', stream: 'marketing' },
    { name: 'google-analytics', displayName: 'Google Analytics 4 & Attribution', category: 'marketing', stream: 'marketing' },

    // Creative, Media & Design (6)
    { name: 'brand-identity', displayName: 'Brand Identity & Logo Systems', category: 'design', stream: 'creative' },
    { name: 'adobe-illustrator', displayName: 'Adobe Illustrator', category: 'design', stream: 'creative' },
    { name: 'motion-graphics', displayName: 'Motion Graphics & After Effects', category: 'design', stream: 'creative' },
    { name: 'copywriting', displayName: 'High-Converting Copywriting', category: 'design', stream: 'creative' },
    { name: 'blender', displayName: 'Blender 3D Modeling', category: 'design', stream: 'creative' },
    { name: 'typography', displayName: 'Typography & Layout Design', category: 'design', stream: 'creative' },

    // Soft Skills & Tools (6)
    { name: 'git', displayName: 'Git', category: 'tool', stream: 'engineering' },
    { name: 'github', displayName: 'GitHub', category: 'tool', stream: 'engineering' },
    { name: 'ci-cd', displayName: 'CI/CD & GitHub Actions', category: 'tool', stream: 'engineering' },
    { name: 'problem-solving', displayName: 'Problem Solving', category: 'soft-skill' },
    { name: 'communication', displayName: 'Communication', category: 'soft-skill' },
    { name: 'teamwork', displayName: 'Teamwork', category: 'soft-skill' },
  ];

  // 3. State
  const urlParams = new URLSearchParams(window.location.search);
  const streamParam = urlParams.get('stream') || urlParams.get('track');
  const validStreams = ['engineering', 'business', 'marketing', 'creative', 'cross'];
  let selectedStream = (streamParam && validStreams.includes(streamParam)) ? streamParam : 'engineering';
  let allAvailableSkills = [...FALLBACK_SKILLS];
  const selectedInterests = new Set();
  const selectedSkillsMap = new Map(); // key: skillName, value: { name, displayName, proficiency, ... }
  let currentStep = 0;
  let hasCompletedSkillVerification = false; // Ensures quiz gate is only required once per account

  // Reality Check Quiz Constants (All 94 skills eligible; curated bank for instant 0ms launch)
  const BANKED_QUIZ_SKILLS = [
    'javascript', 'python', 'sql', 'react', 'node.js', 'html', 'css',
    'typescript', 'mongodb', 'docker', 'git', 'aws', 'postgresql',
    'express.js', 'tailwind-css', 'next.js', 'fastapi', 'linux', 'rest-apis',
    'redis', 'kubernetes'
  ];
  const AVAILABLE_QUIZ_SKILLS = BANKED_QUIZ_SKILLS; // Kept for backwards compatibility
  const SKILL_ALIASES = {
    'nodejs': 'node.js',
    'node': 'node.js',
    'reactjs': 'react',
    'react.js': 'react',
    'html5': 'html',
    'css3': 'css',
    'js': 'javascript',
    'py': 'python',
    'ts': 'typescript',
    'mongo': 'mongodb',
    'postgres': 'postgresql',
    'k8s': 'kubernetes',
    'tailwind': 'tailwind-css',
    'tailwindcss': 'tailwind-css',
    'express': 'express.js',
    'next': 'next.js',
    'nextjs': 'next.js',
    'tf': 'terraform'
  };
  const normalizeSkillSlug = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    return SKILL_ALIASES[s] || s;
  };
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const INTEREST_SKILL_AFFINITY = {
    'web development': ['javascript', 'html', 'css', 'react', 'node.js'],
    'backend engineering': ['node.js', 'python', 'sql'],
    'data analysis': ['python', 'sql'],
    'data science': ['python', 'sql'],
    'artificial intelligence': ['python'],
    'problem solving': ['javascript', 'python', 'sql'],
    'app development': ['react', 'javascript'],
    'cloud computing': ['node.js', 'python'],
    'cloud security': ['python', 'sql'],
    'qa testing': ['javascript', 'python'],
    'design': ['html', 'css']
  };

  // 4. DOM Elements
  const alertContainer = document.getElementById('alertContainer');
  const interestChipsWrapper = document.getElementById('interestChipsWrapper');
  const interestCount = document.getElementById('interestCount');
  const skillsGrid = document.getElementById('skillsGrid');
  const skillSearchInput = document.getElementById('skillSearchInput');
  const skillCategoryFilter = document.getElementById('skillCategoryFilter');
  const selectedSkillsSummary = document.getElementById('selectedSkillsSummary');
  const selectedSkillsCount = document.getElementById('selectedSkillsCount');
  const clearAllSkillsBtn = document.getElementById('clearAllSkillsBtn');
  const form = document.getElementById('assessmentForm');
  const submitBtn = document.getElementById('submitAssessmentBtn');

  // Prove Your Skills Panel Elements
  const proveSkillsPanel = document.getElementById('proveSkillsPanel');
  const proveSkillsSubtitle = document.getElementById('proveSkillsSubtitle');
  const proveSkillsBadge = document.getElementById('proveSkillsBadge');
  const proveSkillsBadgeText = document.getElementById('proveSkillsBadgeText');
  const proveSkillsList = document.getElementById('proveSkillsList');
  const proveSkillsProgressFill = document.getElementById('proveSkillsProgressFill');
  const step3ContinueBtn = document.getElementById('step3ContinueBtn');

  // Skill Check Modal Elements
  const skillCheckModalEl = document.getElementById('skillCheckModal');
  const modalSkillBadge = document.getElementById('modalSkillBadge');
  const modalProviderBadge = document.getElementById('modalProviderBadge');
  const skillCheckModalTitle = document.getElementById('skillCheckModalTitle');
  const modalDifficultyPill = document.getElementById('modalDifficultyPill');
  const modalLoadingState = document.getElementById('modalLoadingState');
  const modalQuestionState = document.getElementById('modalQuestionState');
  const modalVerdictState = document.getElementById('modalVerdictState');
  const modalStepText = document.getElementById('modalStepText');
  const modalStepper = document.getElementById('modalStepper');
  const modalQuestionPrompt = document.getElementById('modalQuestionPrompt');
  const modalCodeSnippet = document.getElementById('modalCodeSnippet');
  const modalOptionsList = document.getElementById('modalOptionsList');
  const modalFeedbackBox = document.getElementById('modalFeedbackBox');
  const modalFeedbackIcon = document.getElementById('modalFeedbackIcon');
  const modalFeedbackHeadline = document.getElementById('modalFeedbackHeadline');
  const modalFeedbackText = document.getElementById('modalFeedbackText');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalVerdictSelfClaimed = document.getElementById('modalVerdictSelfClaimed');
  const modalVerdictVerifiedLevel = document.getElementById('modalVerdictVerifiedLevel');
  const modalVerdictExplanation = document.getElementById('modalVerdictExplanation');
  const modalVerdictGapsWrap = document.getElementById('modalVerdictGapsWrap');
  const modalVerdictGaps = document.getElementById('modalVerdictGaps');
  const modalVerdictRetestBtn = document.getElementById('modalVerdictRetestBtn');
  const modalVerdictDoneBtn = document.getElementById('modalVerdictDoneBtn');

  // Step Wizard Elements
  const stepPanels = [
    document.getElementById('stepPanel0'),
    document.getElementById('stepPanel1'),
    document.getElementById('stepPanel2'),
    document.getElementById('stepPanel3'),
    document.getElementById('stepPanel4'),
  ];
  const desktopNavItems = [
    document.getElementById('navStep0'),
    document.getElementById('navStep1'),
    document.getElementById('navStep2'),
    document.getElementById('navStep3'),
    document.getElementById('navStep4'),
  ];
  const mobileStepLabel = document.getElementById('mobileStepLabel');
  const mobileStepPercent = document.getElementById('mobileStepPercent');
  const mobileProgressBar = document.getElementById('mobileProgressBar');

  let currentCategoryFilter = 'all';
  let currentSearchQuery = '';

  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  window.showAlert = showAlert;

  // 5. Step Navigation System
  const STEP_TITLES = [
    'Choose Stream',
    'Academic Background',
    'Domains of Interest',
    'Skills & Proficiency',
    'Career Aspirations',
  ];

  const updateStepUI = (targetStep) => {
    currentStep = targetStep;

    // Show active panel
    stepPanels.forEach((panel, idx) => {
      if (panel) {
        panel.classList.toggle('active', idx === currentStep);
      }
    });

    // Update desktop stepper
    desktopNavItems.forEach((item, idx) => {
      if (item) {
        item.classList.toggle('active', idx === currentStep);
        if (idx < currentStep) {
          item.classList.add('completed');
        } else {
          item.classList.remove('completed');
        }
      }
    });

    // Update mobile progress bar
    if (mobileStepLabel) {
      mobileStepLabel.textContent = `Step ${currentStep} of 4: ${STEP_TITLES[currentStep] || ''}`;
    }
    const pct = currentStep === 0 ? 10 : Math.round((currentStep / 4) * 100);
    if (mobileStepPercent) mobileStepPercent.textContent = `${pct}%`;
    if (mobileProgressBar) {
      mobileProgressBar.style.width = `${pct}%`;
      mobileProgressBar.setAttribute('aria-valuenow', pct);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const STREAM_META = {
    engineering: {
      label: 'Engineering & IT',
      badge: 'ENGINEERING TRACK',
      badgeClass: 'badge-teal'
    },
    business: {
      label: 'Business & Finance',
      badge: 'BUSINESS TRACK',
      badgeClass: 'badge-gold'
    },
    marketing: {
      label: 'Digital Marketing & Growth',
      badge: 'MARKETING TRACK',
      badgeClass: 'badge-emerald'
    },
    creative: {
      label: 'Creative & Design',
      badge: 'CREATIVE TRACK',
      badgeClass: 'badge-purple'
    },
    cross: {
      label: 'Cross-Disciplinary Track',
      badge: 'CROSS-TRACK',
      badgeClass: 'badge-teal'
    }
  };

  const updateCategoryFilterPills = () => {
    if (!skillCategoryFilter) return;
    const streamPillMap = {
      engineering: ['all', 'frontend', 'backend', 'data', 'cloud', 'security', 'mobile', 'testing', 'gaming', 'web3', 'product'],
      business: ['all', 'finance', 'product', 'data'],
      marketing: ['all', 'marketing', 'design', 'data'],
      creative: ['all', 'design', 'marketing'],
      cross: null
    };

    const allowedCats = streamPillMap[selectedStream];
    skillCategoryFilter.querySelectorAll('button').forEach((btn) => {
      const cat = btn.getAttribute('data-cat');
      if (!allowedCats || allowedCats.includes(cat)) {
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    });

    currentCategoryFilter = 'all';
    skillCategoryFilter.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-cat') === 'all');
    });
  };

  // Auto-prune any previously selected interests or skills that do not belong to active stream
  const pruneCrossStreamSelections = () => {
    if (selectedStream === 'cross') return;

    // 1. Prune unallowed interests
    for (const interestId of Array.from(selectedInterests)) {
      if (!isInterestAllowedInStream(interestId, selectedStream)) {
        selectedInterests.delete(interestId);
      }
    }
    if (interestCount) {
      interestCount.textContent = selectedInterests.size;
    }

    // 2. Prune unallowed skills
    for (const [key, skillData] of Array.from(selectedSkillsMap.entries())) {
      if (!isSkillAllowedInStream(skillData || key, selectedStream)) {
        selectedSkillsMap.delete(key);
      }
    }
    updateSelectedSkillsUI();
  };

  // Dynamically update custom skill category options based on active stream
  const updateCustomSkillCategoryDropdown = () => {
    const select = document.getElementById('customSkillCategory');
    if (!select) return;

    const streamCategoryOptions = {
      engineering: [
        { value: 'frontend', label: 'Frontend' },
        { value: 'backend', label: 'Backend' },
        { value: 'database', label: 'Database' },
        { value: 'cloud', label: 'Cloud / DevOps' },
        { value: 'security', label: 'Security' },
        { value: 'ai', label: 'AI / Data' },
        { value: 'mobile', label: 'Mobile' },
        { value: 'testing', label: 'QA / Testing' },
        { value: 'gaming', label: 'Gaming' },
        { value: 'web3', label: 'Web3' },
        { value: 'product', label: 'Product & Agile' },
        { value: 'design', label: 'UI / UX Design' },
        { value: 'tool', label: 'Developer Tool' }
      ],
      business: [
        { value: 'finance', label: 'Corporate Finance & Valuation' },
        { value: 'business', label: 'Business Operations & Consulting' },
        { value: 'product', label: 'Product & Project Management' },
        { value: 'data', label: 'Business Intelligence & Data' },
        { value: 'tool', label: 'Business Tool / Productivity' }
      ],
      marketing: [
        { value: 'marketing', label: 'Digital Marketing & Ads' },
        { value: 'data', label: 'Marketing Analytics & Tracking' },
        { value: 'design', label: 'Content Strategy & Copy' },
        { value: 'tool', label: 'Marketing Tool / CRM' }
      ],
      creative: [
        { value: 'design', label: 'Visual Design & 3D' },
        { value: 'marketing', label: 'Branding & Copywriting' },
        { value: 'tool', label: 'Creative Tool / Software' }
      ],
      cross: [
        { value: 'frontend', label: 'Frontend' },
        { value: 'backend', label: 'Backend' },
        { value: 'database', label: 'Database' },
        { value: 'data', label: 'Data / AI' },
        { value: 'cloud', label: 'Cloud / DevOps' },
        { value: 'security', label: 'Security' },
        { value: 'finance', label: 'Finance & Valuation' },
        { value: 'business', label: 'Business Operations' },
        { value: 'marketing', label: 'Digital Marketing' },
        { value: 'design', label: 'Design & Creative' },
        { value: 'product', label: 'Product Management' },
        { value: 'tool', label: 'Tool / Other' }
      ]
    };

    const options = streamCategoryOptions[selectedStream] || streamCategoryOptions.engineering;
    select.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
  };

  const applyStreamUI = (streamKey) => {
    selectedStream = streamKey || 'engineering';

    // Prune cross-stream selections so foreign interests & skills cannot persist
    pruneCrossStreamSelections();

    // Update stream card active state
    document.querySelectorAll('#streamCardsGrid .stream-card').forEach((card) => {
      const cardStream = card.getAttribute('data-stream');
      card.classList.toggle('selected', cardStream === selectedStream);
    });

    const meta = STREAM_META[selectedStream] || STREAM_META.engineering;
    const labelEl = document.getElementById('selectedStreamLabel');
    if (labelEl) labelEl.textContent = meta.label;

    const badgeEl = document.getElementById('streamBadge');
    if (badgeEl) {
      badgeEl.textContent = meta.badge;
      badgeEl.className = `badge ${meta.badgeClass} small font-mono`;
    }



    updateCategoryFilterPills();
    updateCustomSkillCategoryDropdown();
    renderInterests();
    renderSkillsGrid();
  };

  const validateStep = (step) => {
    if (alertContainer) alertContainer.innerHTML = '';
    if (step === 0) {
      if (!selectedStream) {
        showAlert('Please select your primary stream to proceed.');
        return false;
      }
      return true;
    }
    if (step === 1) {
      const fullName = document.getElementById('fullName').value.trim();
      const course = document.getElementById('course').value.trim();
      if (!fullName) {
        showAlert('Please enter your full name.');
        return false;
      }
      if (!course) {
        showAlert('Please enter your degree or course (e.g. BCA, B.Tech, B.Com, BBA, B.Des).');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (selectedInterests.size === 0) {
        showAlert('Please select at least 1 domain of interest before proceeding.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (selectedSkillsMap.size === 0) {
        showAlert('Please select at least 1 skill you possess before proceeding.');
        return false;
      }
      const verified = Array.from(selectedSkillsMap.values()).filter(
        (s) => s.isQuizVerified || s.isCodeVerified
      );
      if (verified.length === 0) {
        showAlert(
          `🔒 Baseline Verification Required: Please complete at least one 90-second Reality Check Quiz below to calibrate your baseline skill level before proceeding to Goals.`,
          'warning'
        );
        const container = document.getElementById('assessmentAlertContainer') || alertContainer;
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return false;
      }
      return true;
    }
    return true;
  };

  // Wire Step Buttons
  document.getElementById('step0ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(0)) updateStepUI(1);
  });

  document.getElementById('step1BackBtn')?.addEventListener('click', () => {
    updateStepUI(0);
  });
  document.getElementById('step1ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(1)) updateStepUI(2);
  });

  document.getElementById('step2BackBtn')?.addEventListener('click', () => {
    updateStepUI(1);
  });
  document.getElementById('step2ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(2)) updateStepUI(3);
  });

  document.getElementById('step3BackBtn')?.addEventListener('click', () => {
    updateStepUI(2);
  });
  document.getElementById('step3ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(3)) updateStepUI(4);
  });

  document.getElementById('step4BackBtn')?.addEventListener('click', () => {
    updateStepUI(3);
  });

  // Allow clicking desktop stepper items if prior steps are valid
  desktopNavItems.forEach((item, idx) => {
    item?.addEventListener('click', () => {
      const target = idx;
      if (target <= currentStep) {
        updateStepUI(target);
      } else {
        // Validate intermediate steps
        for (let s = currentStep; s < target; s++) {
          if (!validateStep(s)) return;
        }
        updateStepUI(target);
      }
    });
  });

  // Wire stream cards in Step 0
  document.querySelectorAll('#streamCardsGrid .stream-card').forEach((card) => {
    card.addEventListener('click', () => {
      const stream = card.getAttribute('data-stream');
      if (stream) {
        applyStreamUI(stream);
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const stream = card.getAttribute('data-stream');
        if (stream) applyStreamUI(stream);
      }
    });
  });

  // 6. Render Interest Chips
  const renderInterests = () => {
    if (!interestChipsWrapper) return;
    interestChipsWrapper.innerHTML = '';

    const visibleInterests = ALL_INTERESTS.filter((interest) => {
      return isInterestAllowedInStream(interest, selectedStream);
    });

    visibleInterests.forEach((interest) => {
      const isSelected = selectedInterests.has(interest.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `interest-chip ${isSelected ? 'selected' : ''}`;
      chip.innerHTML = `
        <i class="bi ${interest.icon}"></i>
        <span>${interest.label}</span>
      `;

      chip.addEventListener('click', () => {
        if (!isInterestAllowedInStream(interest, selectedStream)) {
          showAlert(`This domain of interest belongs to another stream and cannot be selected in ${STREAM_META[selectedStream]?.label || selectedStream}.`, 'warning');
          return;
        }
        if (selectedInterests.has(interest.id)) {
          selectedInterests.delete(interest.id);
        } else {
          if (selectedInterests.size >= 10) {
            showAlert('You can select a maximum of 10 interests.', 'warning');
            return;
          }
          selectedInterests.add(interest.id);
        }
        renderInterests();
      });

      interestChipsWrapper.appendChild(chip);
    });

    if (interestCount) {
      interestCount.textContent = selectedInterests.size;
    }
  };

  // ── Real-Time Synchronization Engine & Indicators ────────────
  let isPreloadingProfile = true;
  let realtimeSyncDebounceTimer = null;
  const realtimeBroadcastChannel = (typeof window !== 'undefined' && 'BroadcastChannel' in window)
    ? new BroadcastChannel('careerpath_realtime_channel')
    : null;

  const setRealtimeSyncIndicator = (state, label) => {
    const indicator = document.getElementById('realtimeSyncIndicator');
    if (!indicator) return;

    if (state === 'syncing') {
      indicator.className = 'badge bg-primary-subtle text-primary border border-primary font-mono px-2 py-0.5 ms-1';
      indicator.innerHTML = `<span class="spinner-border spinner-border-sm me-1" style="width: 0.65rem; height: 0.65rem;" role="status"></span> ${escapeHtml(label || 'Updating live...')}`;
    } else if (state === 'synced') {
      indicator.className = 'badge bg-success-subtle text-success border border-success font-mono px-2 py-0.5 ms-1';
      indicator.innerHTML = `<i class="bi bi-cloud-check-fill text-success me-1"></i> ${escapeHtml(label || 'Synced in real-time')}`;
    } else if (state === 'local') {
      indicator.className = 'badge bg-secondary-subtle text-secondary border border-secondary font-mono px-2 py-0.5 ms-1';
      indicator.innerHTML = `<i class="bi bi-hdd-fill text-secondary me-1"></i> ${escapeHtml(label || 'Saved locally')}`;
    } else if (state === 'warning') {
      indicator.className = 'badge bg-warning-subtle text-warning border border-warning font-mono px-2 py-0.5 ms-1';
      indicator.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-warning me-1"></i> ${escapeHtml(label || 'Offline')}`;
    }
  };

  const syncSkillsToBackendRealTime = () => {
    if (isPreloadingProfile) {
      setRealtimeSyncIndicator('synced', 'Synced in real-time');
      return;
    }

    setRealtimeSyncIndicator('syncing', 'Updating live...');

    if (realtimeSyncDebounceTimer) {
      clearTimeout(realtimeSyncDebounceTimer);
    }

    realtimeSyncDebounceTimer = setTimeout(async () => {
      try {
        const skillsArray = Array.from(selectedSkillsMap.values()).map((s) => {
          const prof = String(s.proficiency || 'intermediate').toLowerCase();
          const validProf = ['beginner', 'intermediate', 'advanced'].includes(prof) ? prof : 'intermediate';
          return {
            name: String(s.name || '').toLowerCase().trim(),
            displayName: s.displayName || s.name,
            category: s.category || 'tool',
            proficiency: validProf,
            selfRatedProficiency: String(s.selfRatedProficiency || validProf).toLowerCase(),
            verifiedProficiency: s.verifiedProficiency ? String(s.verifiedProficiency).toLowerCase() : null,
            isQuizVerified: Boolean(s.isQuizVerified),
            quizScore: typeof s.quizScore === 'number' ? s.quizScore : 0,
            quizGaps: Array.isArray(s.quizGaps) ? s.quizGaps : [],
            isCodeVerified: Boolean(s.isCodeVerified),
            verifiedSource: s.verifiedSource || 'self',
          };
        });

        // 1. Update client Auth cached user
        const user = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                     (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
        if (user) {
          user.skills = skillsArray;
          if (typeof window.Auth?.setCurrentUser === 'function') {
            window.Auth.setCurrentUser(user);
          }
        }

        // 2. Save persistent local draft
        if (typeof saveAutoDraft === 'function') {
          saveAutoDraft();
        }

        // 3. Broadcast real-time skills event across components and tabs
        try {
          window.dispatchEvent(new CustomEvent('careerpath-skills-updated', { detail: { skills: skillsArray } }));
          if (realtimeBroadcastChannel) {
            realtimeBroadcastChannel.postMessage({ type: 'SKILLS_UPDATED', skills: skillsArray, timestamp: Date.now() });
          }
          localStorage.setItem('cp_skills_last_synced', Date.now().toString());
        } catch (bcErr) {
          console.warn('Skills broadcast warning:', bcErr);
        }

        // 4. Persist to MongoDB backend if authenticated
        const isAuth = typeof window.Auth?.isAuthenticated === 'function' && window.Auth.isAuthenticated();
        if (isAuth && window.API?.put) {
          const res = await window.API.put('/users/me', { skills: skillsArray }, { auth: true });
          if (res?.success && res.data?.user) {
            if (typeof window.Auth?.setCurrentUser === 'function') {
              window.Auth.setCurrentUser(res.data.user);
            }
          }
          setRealtimeSyncIndicator('synced', 'Synced in real-time');
        } else {
          setRealtimeSyncIndicator('local', 'Saved locally');
        }

        if (typeof updateGitHubButtonState === 'function') {
          updateGitHubButtonState();
        }
      } catch (err) {
        console.warn('Real-time sync to backend warning:', err.message);
        setRealtimeSyncIndicator('local', 'Saved locally');
      }
    }, 350);
  };

  // 7. Render Available Skills Grid
  const renderSkillsGrid = () => {
    if (!skillsGrid) return;
    const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                        (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null) || null;
    skillsGrid.innerHTML = '';

    const filtered = allAvailableSkills.filter((skill) => {
      // 1. Strict Stream filter (blocks cross-stream skills from rendering or search matches)
      if (!isSkillAllowedInStream(skill, selectedStream)) return false;

      // 2. Category filter
      const matchesCategory =
        currentCategoryFilter === 'all' ||
        skill.category === currentCategoryFilter ||
        (currentCategoryFilter === 'data' && ['database', 'data', 'ai'].includes(skill.category)) ||
        (currentCategoryFilter === 'cloud' && ['cloud', 'tool'].includes(skill.category)) ||
        (currentCategoryFilter === 'security' && ['security'].includes(skill.category)) ||
        (currentCategoryFilter === 'frontend' && ['frontend', 'mobile'].includes(skill.category)) ||
        (currentCategoryFilter === 'backend' && ['backend', 'database'].includes(skill.category)) ||
        (currentCategoryFilter === 'finance' && ['finance', 'business'].includes(skill.category)) ||
        (currentCategoryFilter === 'marketing' && ['marketing'].includes(skill.category)) ||
        (currentCategoryFilter === 'design' && ['design'].includes(skill.category));

      const matchesSearch =
        !currentSearchQuery ||
        skill.displayName.toLowerCase().includes(currentSearchQuery) ||
        skill.name.toLowerCase().includes(currentSearchQuery);

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      skillsGrid.innerHTML = `
        <div class="col-12 text-center py-4 text-muted small">
          <i class="bi bi-search me-1"></i> No matching skills found for "<span class="search-term-slot"></span>".
        </div>
      `;
      const searchSlot = skillsGrid.querySelector('.search-term-slot');
      if (searchSlot) searchSlot.textContent = currentSearchQuery || '';
      return;
    }

    filtered.forEach((skill) => {
      const sKey = (skill.name || '').toLowerCase().trim();
      const isSelected = selectedSkillsMap.has(sKey) || selectedSkillsMap.has(skill.name);
      const selectedObj = isSelected ? (selectedSkillsMap.get(sKey) || selectedSkillsMap.get(skill.name)) : null;
      const isCodeVerified = selectedObj?.isCodeVerified;
      const isQuizVerified = selectedObj?.isQuizVerified;
      const currentProficiency = selectedObj ? (selectedObj.verifiedProficiency || selectedObj.proficiency || 'beginner') : 'beginner';
      const col = document.createElement('div');
      col.className = 'col-12 col-lg-6';
      col.innerHTML = `
        <div class="skill-picker-card" style="cursor: pointer;">
          <div class="d-flex align-items-center justify-content-between gap-2 w-100">
            <div class="form-check m-0 flex-grow-1 d-flex align-items-center gap-2" style="min-width: 0;">
              <input
                class="form-check-input skill-checkbox flex-shrink-0"
                type="checkbox"
              />
              <label class="form-check-label fw-semibold text-ink m-0 d-inline-flex align-items-center gap-1.5 skill-card-label" style="min-width: 0; cursor: pointer;">
                <span class="skill-logo-slot"></span>
                <span class="skill-name-text"></span>
                <span class="skill-type-slot"></span>
                <span class="skill-verified-slot"></span>
              </label>
            </div>
            <div class="d-flex align-items-center gap-1.5 flex-shrink-0 skill-action-dock">
              <span class="skill-level-slot"></span>
              <span class="skill-btn-slot"></span>
            </div>
          </div>
        </div>
      `;

      const card = col.querySelector('.skill-picker-card');
      if (isSelected) card.classList.add('active-skill');

      const checkbox = col.querySelector('.skill-checkbox');
      checkbox.id = `skill_${sKey}`;
      if (isSelected) checkbox.checked = true;

      const skillLabel = col.querySelector('.skill-card-label');
      skillLabel.htmlFor = `skill_${sKey}`;
      skillLabel.title = skill.displayName || skill.name;

      const skillNameSpan = col.querySelector('.skill-name-text');
      if (skillNameSpan) skillNameSpan.textContent = skill.displayName || skill.name;

      // Inject logo safely via DOM element
      const logoSlot = col.querySelector('.skill-logo-slot');
      const logoUrl = (window.TechLogos && typeof window.TechLogos.getLogoUrl === 'function')
        ? window.TechLogos.getLogoUrl(skill.name)
        : null;
      if (logoUrl) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = skill.displayName || skill.name;
        img.width = 16;
        img.height = 16;
        img.className = 'tech-brand-logo me-1';
        img.style.cssText = 'object-fit: contain; vertical-align: middle; flex-shrink: 0;';
        img.onerror = () => { img.remove(); };
        logoSlot.replaceWith(img);
      } else {
        logoSlot.remove();
      }

      // Inject type badge safely via DOM element
      const typeSlot = col.querySelector('.skill-type-slot');
      const skillType = String(skill.type || 'specialized').toLowerCase();
      const typeBadge = document.createElement('span');
      typeBadge.className = 'badge rounded-pill font-mono';
      typeBadge.style.cssText = 'font-size: 0.62rem; padding: 2px 6px;';
      if (skillType === 'software') {
        typeBadge.className += ' bg-primary-subtle text-primary border border-primary-subtle';
        typeBadge.innerHTML = '<i class="bi bi-tools me-1"></i>Tool';
      } else if (skillType === 'common') {
        typeBadge.className += ' bg-secondary-subtle text-secondary border border-secondary-subtle';
        typeBadge.innerHTML = '<i class="bi bi-people me-1"></i>Soft';
      } else {
        typeBadge.className += ' bg-info-subtle text-info border border-info-subtle';
        typeBadge.innerHTML = '<i class="bi bi-lightning-charge me-1"></i>Core';
      }
      typeSlot.replaceWith(typeBadge);

      // Build verified badge element
      const verifiedSlot = col.querySelector('.skill-verified-slot');
      if (isSelected && isQuizVerified) {
        const vBadge = document.createElement('span');
        vBadge.className = 'badge bg-success-subtle text-success border border-success ms-1';
        vBadge.title = `Calibrated via Reality Check Quiz (${capitalize(currentProficiency)})`;
        vBadge.style.cssText = 'padding: 1px 5px; font-size: 0.62rem; white-space: nowrap;';
        vBadge.innerHTML = '<i class="bi bi-patch-check-fill me-0.5"></i>Verified';
        verifiedSlot.replaceWith(vBadge);
      } else if (isSelected && isCodeVerified) {
        const vBadge = document.createElement('span');
        vBadge.className = 'badge-code-verified ms-1';
        vBadge.title = 'Verified by real GitHub repo code';
        vBadge.style.cssText = 'padding: 1px 4px; font-size: 0.62rem; white-space: nowrap;';
        vBadge.innerHTML = '<i class="bi bi-github me-0.5"></i>GitHub';
        verifiedSlot.replaceWith(vBadge);
      } else {
        verifiedSlot.remove();
      }

      // Build level badge element
      const levelSlot = col.querySelector('.skill-level-slot');
      if (isSelected) {
        const levelBadge = document.createElement('span');
        if (isQuizVerified) {
          levelBadge.className = 'badge bg-success-subtle text-success border border-success font-mono px-2 py-0.5 small';
          levelBadge.title = `Calibrated via Reality Check Quiz (${capitalize(currentProficiency)})`;
          levelBadge.innerHTML = '<i class="bi bi-patch-check-fill me-1"></i><span class="lvl-text"></span>';
          levelBadge.querySelector('.lvl-text').textContent = capitalize(currentProficiency);
        } else if (isCodeVerified) {
          levelBadge.className = 'badge bg-info-subtle text-info border border-info font-mono px-2 py-0.5 small';
          levelBadge.title = 'Calibrated via GitHub Repository Code';
          levelBadge.innerHTML = '<i class="bi bi-github me-1"></i><span class="lvl-text"></span>';
          levelBadge.querySelector('.lvl-text').textContent = capitalize(currentProficiency);
        } else {
          levelBadge.className = 'badge bg-warning-subtle text-warning border border-warning font-mono px-2 py-0.5 small animate-pulse-soft d-none d-sm-inline-block';
          levelBadge.title = 'Quiz required to determine knowledge level';
          levelBadge.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Pending';
        }
        levelSlot.replaceWith(levelBadge);
      } else {
        levelSlot.remove();
      }

      // Build action button element
      const btnSlot = col.querySelector('.skill-btn-slot');
      if (isSelected) {
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = 'btn btn-sm ms-1 text-nowrap py-0.5 px-2';
        actionBtn.setAttribute('data-skill', skill.name);

        if (isQuizVerified) {
          actionBtn.className += ' btn-outline-success btn-grid-retest';
          actionBtn.title = 'Verified via Quiz • Click to Retest';
          actionBtn.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i>Retest';
        } else if (isCodeVerified) {
          actionBtn.className += ' btn-outline-info btn-grid-retest';
          actionBtn.title = 'Take quiz to verify with full confidence';
          actionBtn.innerHTML = '<i class="bi bi-lightning-charge me-1"></i>Quiz';
        } else {
          actionBtn.className += ' cp-btn-primary btn-grid-take-quiz animate-pulse-soft shadow-sm';
          actionBtn.title = 'Take 90s reality check quiz to calibrate knowledge level';
          actionBtn.innerHTML = '<i class="bi bi-play-circle-fill me-1"></i>Take Quiz (90s)';
        }
        btnSlot.replaceWith(actionBtn);
      } else {
        const addAffordance = document.createElement('span');
        addAffordance.className = 'skill-add-affordance text-muted small opacity-50 pe-1';
        addAffordance.title = 'Click to select skill';
        addAffordance.innerHTML = '<i class="bi bi-plus-lg fs-6"></i>';
        btnSlot.replaceWith(addAffordance);
      }

      // Allow clicking the card anywhere (except inside button, input, label, link) to toggle skill
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('label') || e.target.closest('a')) {
          return;
        }
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });

      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          // Auto-clear validation alert immediately upon selecting a skill
          if (alertContainer) {
            alertContainer.innerHTML = '';
          }
          if (!isSkillAllowedInStream(skill, selectedStream)) {
            e.target.checked = false;
            showAlert(`This skill belongs to another stream and cannot be selected in ${STREAM_META[selectedStream]?.label || selectedStream}.`, 'warning');
            return;
          }
          if (selectedSkillsMap.size >= 20) {
            e.target.checked = false;
            showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
            return;
          }
          const existingUserSkill = (currentUser?.skills || []).find(
            (s) => (s.name || '').toLowerCase().trim() === sKey
          );
          const isQuizVer = Boolean(existingUserSkill?.isQuizVerified);
          const isCodeVer = Boolean(existingUserSkill?.isCodeVerified);
          const profVal = isQuizVer || isCodeVer
            ? (existingUserSkill?.verifiedProficiency || existingUserSkill?.proficiency || 'beginner')
            : 'beginner';

          selectedSkillsMap.set(sKey, {
            name: sKey,
            displayName: skill.displayName,
            category: skill.category || 'tool',
            proficiency: profVal,
            selfRatedProficiency: null,
            verifiedProficiency: isQuizVer || isCodeVer ? profVal : null,
            isQuizVerified: isQuizVer,
            quizScore: existingUserSkill?.quizScore || 0,
            quizGaps: existingUserSkill?.quizGaps || [],
            isCodeVerified: isCodeVer,
            verifiedSource: isQuizVer ? 'quiz' : (isCodeVer ? 'github' : 'unverified')
          });
        } else {
          selectedSkillsMap.delete(sKey);
          selectedSkillsMap.delete(skill.name);
        }
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      const gridTakeQuizBtn = col.querySelector('.btn-grid-take-quiz');
      if (gridTakeQuizBtn) {
        gridTakeQuizBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Auto-select skill if not yet selected
          if (!selectedSkillsMap.has(sKey) && !selectedSkillsMap.has(skill.name)) {
            if (alertContainer) alertContainer.innerHTML = '';
            if (!isSkillAllowedInStream(skill, selectedStream)) {
              showAlert(`This skill belongs to another stream and cannot be selected in ${STREAM_META[selectedStream]?.label || selectedStream}.`, 'warning');
              return;
            }
            if (selectedSkillsMap.size >= 20) {
              showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
              return;
            }
            const existingUserSkill = (currentUser?.skills || []).find(
              (s) => (s.name || '').toLowerCase().trim() === sKey
            );
            const isQuizVer = Boolean(existingUserSkill?.isQuizVerified);
            const isCodeVer = Boolean(existingUserSkill?.isCodeVerified);
            const profVal = isQuizVer || isCodeVer
              ? (existingUserSkill?.verifiedProficiency || existingUserSkill?.proficiency || 'beginner')
              : 'beginner';

            selectedSkillsMap.set(sKey, {
              name: sKey,
              displayName: skill.displayName,
              category: skill.category || 'tool',
              proficiency: profVal,
              selfRatedProficiency: null,
              verifiedProficiency: isQuizVer || isCodeVer ? profVal : null,
              isQuizVerified: isQuizVer,
              quizScore: existingUserSkill?.quizScore || 0,
              quizGaps: existingUserSkill?.quizGaps || [],
              isCodeVerified: isCodeVer,
              verifiedSource: isQuizVer ? 'quiz' : (isCodeVer ? 'github' : 'unverified')
            });
            updateSelectedSkillsUI();
            renderSkillsGrid();
          }

          startSkillCheck(skill.name);
        });
      }

      const gridRetestBtn = col.querySelector('.btn-grid-retest');
      if (gridRetestBtn) {
        gridRetestBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          startSkillCheck(skill.name);
        });
      }

      skillsGrid.appendChild(col);
    });
  };

  // 8. Update Selected Skills Summary Box
  const updateSelectedSkillsUI = () => {
    if (selectedSkillsCount) {
      selectedSkillsCount.textContent = selectedSkillsMap.size;
    }

    if (!selectedSkillsSummary) return;

    if (selectedSkillsMap.size === 0) {
      selectedSkillsSummary.innerHTML = `
        <span class="text-muted small fst-italic">No skills selected yet. Click any skill below to add it and take the reality check quiz.</span>
      `;
      const topHint = document.getElementById('topQuizStatusHint');
      if (topHint) topHint.classList.add('d-none');
      renderProveSkillsPanel();
      syncSkillsToBackendRealTime();
      if (typeof updateGitHubButtonState === 'function') {
        updateGitHubButtonState();
      }
      return;
    }

    // Auto-clear validation error if present
    if (alertContainer) {
      const text = alertContainer.textContent || '';
      if (text.includes('select at least 1 skill')) {
        alertContainer.innerHTML = '';
      }
    }

    const topHint = document.getElementById('topQuizStatusHint');
    if (topHint) {
      const unverifiedCount = Array.from(selectedSkillsMap.values()).filter(s => !s.isQuizVerified && !s.isCodeVerified).length;
      topHint.classList.remove('d-none');
      if (unverifiedCount > 0) {
        topHint.className = 'badge bg-warning-subtle text-warning border border-warning small';
        topHint.innerHTML = `<i class="bi bi-lock-fill me-1"></i>${unverifiedCount} skill(s) pending quiz verification`;
      } else {
        topHint.className = 'badge bg-success-subtle text-success border border-success small';
        topHint.innerHTML = `<i class="bi bi-shield-check me-1"></i>All skills calibrated &amp; verified`;
      }
    }

    selectedSkillsSummary.innerHTML = '';
    selectedSkillsMap.forEach((skill) => {
      const pill = document.createElement('span');
      pill.className = 'badge badge-navy border d-inline-flex align-items-center gap-1 py-1 px-2 small';

      const logoUrl = (window.TechLogos && typeof window.TechLogos.getLogoUrl === 'function')
        ? window.TechLogos.getLogoUrl(skill.name)
        : null;
      if (logoUrl) {
        const logoImg = document.createElement('img');
        logoImg.src = logoUrl;
        logoImg.alt = skill.displayName || skill.name;
        logoImg.width = 14;
        logoImg.height = 14;
        logoImg.className = 'tech-brand-logo me-0.5';
        logoImg.style.cssText = 'object-fit: contain; vertical-align: middle; flex-shrink: 0;';
        logoImg.onerror = () => { logoImg.remove(); };
        pill.appendChild(logoImg);
      }

      const pillLabel = document.createElement('span');
      pillLabel.className = 'fw-semibold text-ink pill-skill-label';
      pillLabel.textContent = skill.displayName || skill.name;
      pill.appendChild(pillLabel);

      const levelSpan = document.createElement('span');
      const actionSpan = document.createElement('span');

      if (skill.isQuizVerified) {
        const profStr = capitalize(skill.verifiedProficiency || skill.proficiency || 'intermediate');
        levelSpan.className = 'badge bg-success text-white font-mono small px-1.5 py-0.5';
        levelSpan.style.fontSize = '0.65rem';
        levelSpan.innerHTML = '<i class="bi bi-patch-check-fill me-0.5"></i><span class="prof-label"></span>';
        levelSpan.querySelector('.prof-label').textContent = profStr;

        actionSpan.className = 'badge bg-success-subtle text-success border border-success ms-1 cursor-pointer retest-pill-badge';
        actionSpan.setAttribute('role', 'button');
        actionSpan.setAttribute('data-skill', skill.name);
        actionSpan.title = 'Verified by Quiz - Click to Retest';
        actionSpan.style.cssText = 'padding: 1px 5px; font-size: 0.62rem; cursor: pointer;';
        actionSpan.innerHTML = '<i class="bi bi-arrow-repeat"></i> Retest';
      } else if (skill.isCodeVerified) {
        const profStr = capitalize(skill.verifiedProficiency || skill.proficiency || 'intermediate');
        levelSpan.className = 'badge bg-info text-white font-mono small px-1.5 py-0.5';
        levelSpan.style.fontSize = '0.65rem';
        levelSpan.innerHTML = '<i class="bi bi-github me-0.5"></i><span class="prof-label"></span>';
        levelSpan.querySelector('.prof-label').textContent = profStr;

        actionSpan.className = 'badge-code-verified ms-1 cursor-pointer retest-pill-badge';
        actionSpan.setAttribute('role', 'button');
        actionSpan.setAttribute('data-skill', skill.name);
        actionSpan.title = 'Verified by GitHub Repo Code - Click to Quiz';
        actionSpan.style.cssText = 'padding: 1px 4px; font-size: 0.62rem; cursor: pointer;';
        actionSpan.innerHTML = '<i class="bi bi-patch-question me-0.5"></i> Quiz';
      } else {
        levelSpan.className = 'badge bg-warning-subtle text-warning border border-warning small font-mono px-1.5 py-0.5 animate-pulse-soft';
        levelSpan.style.fontSize = '0.65rem';
        levelSpan.innerHTML = '<i class="bi bi-hourglass-split me-0.5"></i>Level Pending';

        actionSpan.className = 'badge cp-btn-primary text-white border border-primary ms-1 cursor-pointer take-quiz-pill-badge shadow-sm';
        actionSpan.setAttribute('role', 'button');
        actionSpan.setAttribute('data-skill', skill.name);
        actionSpan.title = 'Take 90s reality check quiz to calibrate knowledge level';
        actionSpan.style.cssText = 'padding: 2px 6px; font-size: 0.65rem; cursor: pointer;';
        actionSpan.innerHTML = '<i class="bi bi-play-circle-fill me-1"></i>Take Quiz (90s)';
      }

      pill.appendChild(levelSpan);
      pill.appendChild(actionSpan);

      const closeIcon = document.createElement('i');
      closeIcon.className = 'bi bi-x ms-1 cursor-pointer text-danger';
      closeIcon.title = 'Remove';
      closeIcon.style.cursor = 'pointer';
      pill.appendChild(closeIcon);

      actionSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        startSkillCheck(skill.name);
      });

      closeIcon.addEventListener('click', () => {
        const sKey = (skill.name || '').toLowerCase().trim();
        selectedSkillsMap.delete(sKey);
        selectedSkillsMap.delete(skill.name);
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      selectedSkillsSummary.appendChild(pill);
    });

    renderProveSkillsPanel();
    syncSkillsToBackendRealTime();
    if (typeof updateGitHubButtonState === 'function') {
      updateGitHubButtonState();
    }
  };

  // --- Verification Gate: Prove Your Skills Panel Logic ---
  const getRequiredVerificationSkills = () => {
    const candidates = [];
    selectedSkillsMap.forEach((s) => {
      const norm = normalizeSkillSlug(s.name);
      const isBanked = AVAILABLE_QUIZ_SKILLS.includes(norm);
      const isVerified = Boolean(s.isQuizVerified || s.isCodeVerified);

      let score = 0;
      // Prioritize already-verified skills so they ALWAYS remain visible with their checkmarks!
      if (isVerified) {
        score += 1000;
      }
      // Banked skills get a slight affinity boost for 0ms loading
      if (isBanked) {
        score += 20;
      }
      selectedInterests.forEach((interest) => {
        const affinity = INTEREST_SKILL_AFFINITY[interest] || [];
        if (affinity.includes(norm)) score += 10;
      });
      const levelToCheck = String(s.selfRatedProficiency || s.proficiency || '').toLowerCase();
      if (levelToCheck === 'advanced') score += 5;
      else if (levelToCheck === 'intermediate') score += 2;
      else score += 1;

      candidates.push({ key: s.name, norm, skill: s, score, isVerified, isBanked });
    });

    // Sort by verified first, then score descending, then alphabetical
    candidates.sort((a, b) => {
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      return b.score - a.score || (a.skill.displayName || a.skill.name).localeCompare(b.skill.displayName || b.skill.name);
    });

    // Return ALL selected skills in prioritized order so EVERY selected skill is available for verification
    return candidates.map(c => c.skill);
  };

  const renderProveSkillsPanel = () => {
    if (!proveSkillsPanel || !proveSkillsList) return;

    const requiredSkills = getRequiredVerificationSkills();
    const totalCount = requiredSkills.length;
    const verifiedCount = requiredSkills.filter(s => s.isQuizVerified || s.isCodeVerified).length;
    const unverifiedSkills = requiredSkills.filter(s => !s.isQuizVerified && !s.isCodeVerified);
    const isCompleted = totalCount > 0 && unverifiedSkills.length === 0;

    if (totalCount === 0) {
      if (proveSkillsBadge) {
        proveSkillsBadge.className = 'prove-skills-badge skipped';
      }
      if (proveSkillsBadgeText) {
        proveSkillsBadgeText.textContent = 'No skills selected';
      }
      if (proveSkillsProgressFill) {
        proveSkillsProgressFill.style.width = '0%';
        proveSkillsProgressFill.className = 'prove-skills-progress-fill';
      }
      if (proveSkillsSubtitle) {
        proveSkillsSubtitle.textContent = 'Select skills above to launch your 90-second reality-check quizzes.';
      }
      proveSkillsPanel.classList.remove('all-verified');

      proveSkillsList.innerHTML = `
        <div class="text-muted small py-2 fst-italic">
          <i class="bi bi-info-circle me-1"></i> Select at least 1 skill above to see reality-check quiz options.
        </div>
      `;

      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = true;
        step3ContinueBtn.className = 'btn btn-secondary px-4 disabled opacity-75';
        step3ContinueBtn.innerHTML = '<span>Continue to Goals</span> <i class="bi bi-arrow-right ms-1"></i>';
        step3ContinueBtn.title = 'Select at least 1 skill to continue';
      }
      return;
    }

    if (isCompleted) {
      hasCompletedSkillVerification = true;
      const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                          (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      if (currentUser && !currentUser.hasCompletedSkillVerification) {
        currentUser.hasCompletedSkillVerification = true;
        if (typeof window.Auth?.setCurrentUser === 'function') {
          window.Auth.setCurrentUser(currentUser);
        }
        if (typeof window.Auth?.initNav === 'function') {
          window.Auth.initNav();
        }
      }

      if (proveSkillsBadge) {
        proveSkillsBadge.className = 'prove-skills-badge completed';
      }
      if (proveSkillsBadgeText) {
        proveSkillsBadgeText.textContent = `All ${totalCount} Skills Calibrated & Verified \u2713`;
      }
      if (proveSkillsProgressFill) {
        proveSkillsProgressFill.style.width = '100%';
        proveSkillsProgressFill.className = 'prove-skills-progress-fill completed';
      }
      if (proveSkillsSubtitle) {
        proveSkillsSubtitle.textContent = 'All selected skills calibrated! Your knowledge levels are validated. You can now proceed to Goals.';
      }
      proveSkillsPanel.classList.add('all-verified');

      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.className = 'btn cp-btn-primary px-4';
        step3ContinueBtn.innerHTML = '<span>Continue to Goals</span> <i class="bi bi-arrow-right ms-1"></i>';
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('disabled', 'opacity-75');
      }
    } else if (verifiedCount >= 1) {
      hasCompletedSkillVerification = true;
      const pct = Math.min(100, Math.round((verifiedCount / totalCount) * 100));

      if (proveSkillsBadge) {
        proveSkillsBadge.className = 'prove-skills-badge in-progress bg-success-subtle text-success border border-success-subtle';
      }
      if (proveSkillsBadgeText) {
        proveSkillsBadgeText.textContent = `${verifiedCount} of ${totalCount} Calibrated (Ready to Continue)`;
      }
      if (proveSkillsProgressFill) {
        proveSkillsProgressFill.style.width = `${pct}%`;
        proveSkillsProgressFill.className = 'prove-skills-progress-fill bg-success';
      }
      if (proveSkillsSubtitle) {
        proveSkillsSubtitle.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-patch-check-fill me-1"></i> Baseline Calibrated:</span> You have calibrated <strong>${verifiedCount} skill${verifiedCount > 1 ? 's' : ''}</strong>! You can continue to Goals now, or optionally take quick quizzes for the remaining ${unverifiedSkills.length} skill(s) below to refine your recommendations.`;
      }
      proveSkillsPanel.classList.remove('all-verified');

      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.className = 'btn cp-btn-primary px-4';
        step3ContinueBtn.innerHTML = '<span>Continue to Goals</span> <i class="bi bi-arrow-right ms-1"></i>';
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('disabled', 'opacity-75');
      }
    } else {
      const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                          (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      const isAccountAlreadyVerified = Boolean(
        hasCompletedSkillVerification ||
        (currentUser && currentUser.hasCompletedSkillVerification)
      );

      if (isAccountAlreadyVerified) {
        hasCompletedSkillVerification = true;
        if (proveSkillsBadge) {
          proveSkillsBadge.className = 'prove-skills-badge in-progress bg-success-subtle text-success border border-success-subtle';
        }
        if (proveSkillsBadgeText) {
          proveSkillsBadgeText.textContent = `Account Verified \u2713 (Ready to Continue)`;
        }
        if (proveSkillsProgressFill) {
          proveSkillsProgressFill.style.width = '100%';
          proveSkillsProgressFill.className = 'prove-skills-progress-fill bg-success';
        }
        if (proveSkillsSubtitle) {
          proveSkillsSubtitle.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-patch-check-fill me-1"></i> Baseline Calibrated:</span> Your account skill verification is already verified! You can proceed to Goals now, or optionally take 90s quizzes below for newly added skills.`;
        }
        proveSkillsPanel.classList.remove('all-verified');

        if (step3ContinueBtn) {
          step3ContinueBtn.disabled = false;
          step3ContinueBtn.className = 'btn cp-btn-primary px-4';
          step3ContinueBtn.innerHTML = '<span>Continue to Goals</span> <i class="bi bi-arrow-right ms-1"></i>';
          step3ContinueBtn.title = 'Continue to Goals';
          step3ContinueBtn.classList.remove('disabled', 'opacity-75');
        }
      } else {
        hasCompletedSkillVerification = false;
        if (proveSkillsBadge) {
          proveSkillsBadge.className = 'prove-skills-badge in-progress bg-warning text-dark';
        }
        if (proveSkillsBadgeText) {
          proveSkillsBadgeText.textContent = `0 of ${totalCount} Verified (1 Required)`;
        }
        if (proveSkillsProgressFill) {
          proveSkillsProgressFill.style.width = '0%';
          proveSkillsProgressFill.className = 'prove-skills-progress-fill';
        }
        if (proveSkillsSubtitle) {
          proveSkillsSubtitle.innerHTML = `<span class="text-warning-emphasis fw-bold"><i class="bi bi-lock-fill me-1"></i> Baseline Verification Required:</span> Skill knowledge levels must be calibrated via Reality Check Quizzes or GitHub code (no self-ratings). Please complete the 90s quiz for at least 1 skill below to proceed to Goals.`;
        }
        proveSkillsPanel.classList.remove('all-verified');

        if (step3ContinueBtn) {
          step3ContinueBtn.disabled = true;
          step3ContinueBtn.className = 'btn btn-secondary px-4 disabled opacity-75';
          step3ContinueBtn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Verify at least 1 Skill to Continue';
          step3ContinueBtn.title = `Locked: Complete reality check quiz for at least 1 skill to calibrate your baseline`;
        }
      }
    }

    // Render Skill Rows
    proveSkillsList.innerHTML = '';
    requiredSkills.forEach((skill) => {
      const isQuizVer = !!skill.isQuizVerified;
      const isCodeVer = !!skill.isCodeVerified;
      const isVerified = isQuizVer || isCodeVer;
      const profStr = String(skill.verifiedProficiency || skill.proficiency || 'intermediate');
      const profClass = isVerified ? profStr.toLowerCase() : 'pending';

      const row = document.createElement('div');
      row.className = `prove-skill-item ${isVerified ? 'item-verified' : ''}`;

      const isFlagged = skill.verificationStatus === 'flagged_cheating';
      const isCooldown = Boolean(skill.cooldownActive || (skill.nextRetakeAvailableAt && new Date() < new Date(skill.nextRetakeAvailableAt)));
      const remainingHours = skill.cooldownRemainingHours || (skill.nextRetakeAvailableAt ? Math.max(1, Math.ceil((new Date(skill.nextRetakeAvailableAt) - new Date()) / (1000 * 60 * 60))) : 24);

      row.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
          <div class="prove-skill-info">
            <span class="prove-icon-slot"></span>
            <span class="prove-skill-name"></span>
            <span class="prove-verified-slot"></span>
            <span class="prove-level-slot"></span>
          </div>
          <div class="prove-skill-action"></div>
        </div>
        <div class="prove-note-container"></div>
      `;

      row.querySelector('.prove-skill-name').textContent = skill.displayName || skill.name;

      const iconSlot = row.querySelector('.prove-icon-slot');
      const iconEl = document.createElement('i');
      if (isVerified) {
        iconEl.className = 'bi bi-patch-check-fill text-success fs-5 flex-shrink-0';
        iconEl.title = 'Verified Skill \u2713';
      } else {
        iconEl.className = 'bi bi-lock-fill text-warning fs-5 flex-shrink-0';
        iconEl.title = 'Level pending quiz';
      }
      iconSlot.replaceWith(iconEl);

      const verifiedSlot = row.querySelector('.prove-verified-slot');
      if (isVerified) {
        const vBadge = document.createElement('span');
        vBadge.className = 'badge bg-success-subtle text-success border border-success-subtle py-0.5 px-2 ms-1';
        vBadge.style.fontSize = '0.72rem';
        vBadge.innerHTML = '<i class="bi bi-check-lg me-1"></i>Verified';
        verifiedSlot.replaceWith(vBadge);
      } else {
        verifiedSlot.remove();
      }

      const levelSlot = row.querySelector('.prove-level-slot');
      const lvlSpan = document.createElement('span');
      if (isVerified) {
        lvlSpan.className = `prove-skill-level ${profClass}`;
        lvlSpan.textContent = capitalize(profStr);
      } else {
        lvlSpan.className = 'prove-skill-level pending';
        lvlSpan.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Pending Quiz';
      }
      levelSlot.replaceWith(lvlSpan);

      const actionContainer = row.querySelector('.prove-skill-action');
      const actionWrap = document.createElement('div');
      actionWrap.className = 'd-flex align-items-center gap-2 flex-wrap';

      if (isFlagged || isCooldown) {
        const lockBadge = document.createElement('span');
        lockBadge.className = 'badge bg-danger-subtle text-danger border border-danger-subtle py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm';
        lockBadge.title = 'Locked due to proctoring violation';
        lockBadge.innerHTML = '<i class="bi bi-lock-fill"></i> <span>Locked &middot; <span class="lock-hrs"></span>h Cooldown</span>';
        lockBadge.querySelector('.lock-hrs').textContent = remainingHours;

        const disBtn = document.createElement('button');
        disBtn.type = 'button';
        disBtn.className = 'btn btn-outline-danger btn-sm';
        disBtn.disabled = true;
        disBtn.title = '24-hour retake lockout active';
        disBtn.innerHTML = '<i class="bi bi-slash-circle me-1"></i> Disqualified';

        actionWrap.appendChild(lockBadge);
        actionWrap.appendChild(disBtn);
      } else if (isQuizVer) {
        const vBadge = document.createElement('span');
        vBadge.className = 'badge bg-success text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm';
        vBadge.innerHTML = '<i class="bi bi-patch-check-fill"></i> <span class="prof-tag-text"></span>';
        vBadge.querySelector('.prof-tag-text').textContent = `Calibrated (${capitalize(profStr)}) \u2713`;

        const retBtn = document.createElement('button');
        retBtn.type = 'button';
        retBtn.className = 'btn-retest-check';
        retBtn.setAttribute('data-skill', skill.name);
        retBtn.title = 'Optional: Retake anytime to improve your score or calibrate to a higher tier';
        retBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> <span>Retest (Optional)</span>';

        actionWrap.appendChild(vBadge);
        actionWrap.appendChild(retBtn);
      } else if (isCodeVer) {
        const vBadge = document.createElement('span');
        vBadge.className = 'badge bg-info text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm';
        vBadge.title = 'Verified from connected GitHub repository code';
        vBadge.innerHTML = '<i class="bi bi-github"></i> <span class="prof-tag-text"></span>';
        vBadge.querySelector('.prof-tag-text').textContent = `GitHub-Verified (${capitalize(profStr)}) \u2713`;

        const qzBtn = document.createElement('button');
        qzBtn.type = 'button';
        qzBtn.className = 'btn-retest-check';
        qzBtn.setAttribute('data-skill', skill.name);
        qzBtn.title = 'Take reality check quiz to calibrate level with full confidence';
        qzBtn.innerHTML = '<i class="bi bi-patch-question"></i> <span>Take Quiz</span>';

        actionWrap.appendChild(vBadge);
        actionWrap.appendChild(qzBtn);
      } else {
        const pendBadge = document.createElement('span');
        pendBadge.className = 'badge bg-warning-subtle text-warning border border-warning py-1.5 px-2.5 small d-inline-flex align-items-center gap-1 font-mono';
        pendBadge.innerHTML = '<i class="bi bi-hourglass-split"></i> <span>Level Pending</span>';

        const stBtn = document.createElement('button');
        stBtn.type = 'button';
        stBtn.className = 'btn-start-check cp-btn-primary shadow-sm';
        stBtn.setAttribute('data-skill', skill.name);
        stBtn.title = 'Take 90s reality check quiz to calibrate knowledge level';
        stBtn.innerHTML = '<i class="bi bi-play-circle-fill"></i> <span>Start check (90s)</span>';

        actionWrap.appendChild(pendBadge);
        actionWrap.appendChild(stBtn);
      }
      actionContainer.appendChild(actionWrap);

      const noteContainer = row.querySelector('.prove-note-container');
      if (isFlagged) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'skill-adjusted-note text-danger border-danger-subtle bg-danger-subtle';
        noteDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill text-danger me-1"></i><span><strong>Integrity Violation:</strong> 3 proctoring strikes recorded. Retake locked for <span class="rem-hrs"></span> hours.</span>';
        noteDiv.querySelector('.rem-hrs').textContent = remainingHours;
        noteContainer.appendChild(noteDiv);
      } else if (!isVerified) {
        const noteDiv = document.createElement('div');
        noteDiv.className = `skill-adjusted-note ${verifiedCount >= 1 ? 'text-muted border-secondary-subtle bg-light' : 'text-warning border-warning-subtle bg-warning-subtle'}`;
        noteDiv.innerHTML = `<i class="bi ${verifiedCount >= 1 ? 'bi-info-circle text-secondary' : 'bi-shield-lock text-warning'} me-1"></i><span>${verifiedCount >= 1 ? 'Optional calibration: Take the 90-second quiz anytime to prove proficiency, or proceed with baseline.' : 'Knowledge level is not self-rated. Take the 90-second reality-check quiz to prove proficiency.'}</span>`;
        noteContainer.appendChild(noteDiv);
      } else if (isQuizVer && skill.quizGaps && skill.quizGaps.length > 0) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'skill-adjusted-note';
        noteDiv.innerHTML = '<i class="bi bi-info-circle text-primary me-1"></i><span>Calibrated to <strong class="gap-prof"></strong>. Recommended focus: <span class="gap-skills"></span>.</span>';
        noteDiv.querySelector('.gap-prof').textContent = capitalize(profStr);
        noteDiv.querySelector('.gap-skills').textContent = skill.quizGaps.slice(0, 2).join(', ');
        noteContainer.appendChild(noteDiv);
      }

      const checkBtn = row.querySelector('.btn-start-check');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          startSkillCheck(skill.name);
        });
      }

      const retestBtn = row.querySelector('.btn-retest-check');
      if (retestBtn) {
        retestBtn.addEventListener('click', () => {
          startSkillCheck(skill.name);
        });
      }

      proveSkillsList.appendChild(row);
    });
  };

  // --- Skill Check In-Page Modal Logic ---
  let activeQuizSession = null;
  let activeQuestion = null;
  let activeQuestionStep = 1;
  let activeSelectedOptionIndex = null;
  let activeQuizSummary = null;

  // Anti-Cheating & Proctoring Telemetry State (Pillars 2, 5, 6)
  const modalQuizTimerBadge = document.getElementById('modalQuizTimerBadge');
  const modalQuizTimerSeconds = document.getElementById('modalQuizTimerSeconds');
  const modalQuizTimerProgressBar = document.getElementById('modalQuizTimerProgressBar');
  const modalProctorAlert = document.getElementById('modalProctorAlert');
  const modalProctorAlertText = document.getElementById('modalProctorAlertText');
  const modalVerdictIntegrityBadge = document.getElementById('modalVerdictIntegrityBadge');
  const modalVerdictUnconfirmedNotice = document.getElementById('modalVerdictUnconfirmedNotice');
  const modalStrikesBadge = document.getElementById('modalStrikesBadge');
  const modalStrikesCount = document.getElementById('modalStrikesCount');
  const modalStrikeOverlay = document.getElementById('modalStrikeOverlay');
  const strikeView1 = document.getElementById('strikeView1');
  const strikeView2 = document.getElementById('strikeView2');
  const strikeView3 = document.getElementById('strikeView3');
  const strikeReasonText1 = document.getElementById('strikeReasonText1');
  const strikeReasonText2 = document.getElementById('strikeReasonText2');
  const modalStrike1AckBtn = document.getElementById('modalStrike1AckBtn');
  const modalStrike2AckBtn = document.getElementById('modalStrike2AckBtn');
  const modalDisqualifiedDoneBtn = document.getElementById('modalDisqualifiedDoneBtn');

  const MODAL_QUESTION_TIME_LIMIT = 45;
  let modalTimerInterval = null;
  let modalRemainingSeconds = MODAL_QUESTION_TIME_LIMIT;
  let modalQuestionStartTime = Date.now();
  let modalTabSwitchesCount = 0;
  let modalStrikes = 0;
  let isModalDisqualified = false;
  let isModalStrikeActive = false;
  let activeCheckingSkillName = null;
  let lastModalViolationTime = 0;

  const stopModalQuestionTimer = () => {
    if (modalTimerInterval) {
      clearInterval(modalTimerInterval);
      modalTimerInterval = null;
    }
  };

  const startModalQuestionTimer = (resumeSeconds) => {
    stopModalQuestionTimer();
    modalRemainingSeconds = typeof resumeSeconds === 'number' ? resumeSeconds : MODAL_QUESTION_TIME_LIMIT;
    modalQuestionStartTime = Date.now();

    if (modalQuizTimerSeconds) modalQuizTimerSeconds.textContent = modalRemainingSeconds;
    if (modalQuizTimerProgressBar) {
      const pct = Math.max(0, (modalRemainingSeconds / MODAL_QUESTION_TIME_LIMIT) * 100);
      modalQuizTimerProgressBar.style.width = `${pct}%`;
    }
    if (modalQuizTimerBadge) modalQuizTimerBadge.className = 'quiz-timer-badge';

    modalTimerInterval = setInterval(() => {
      modalRemainingSeconds--;
      if (modalQuizTimerSeconds) modalQuizTimerSeconds.textContent = Math.max(0, modalRemainingSeconds);
      if (modalQuizTimerProgressBar) {
        const pct = Math.max(0, (modalRemainingSeconds / MODAL_QUESTION_TIME_LIMIT) * 100);
        modalQuizTimerProgressBar.style.width = `${pct}%`;
      }

      if (modalQuizTimerBadge) {
        if (modalRemainingSeconds <= 10) {
          modalQuizTimerBadge.className = 'quiz-timer-badge danger';
        } else if (modalRemainingSeconds <= 15) {
          modalQuizTimerBadge.className = 'quiz-timer-badge warning';
        } else {
          modalQuizTimerBadge.className = 'quiz-timer-badge';
        }
      }

      if (modalRemainingSeconds <= 0) {
        stopModalQuestionTimer();
        if (modalSubmitBtn && !modalSubmitBtn.classList.contains('d-none')) {
          if (activeSelectedOptionIndex === null) {
            activeSelectedOptionIndex = 0;
            const firstCard = modalOptionsList?.querySelector('.quiz-option-card');
            if (firstCard) firstCard.classList.add('selected');
          }
          modalSubmitBtn.disabled = false;
          modalSubmitBtn.click();
        }
      }
    }, 1000);
  };

  const updateModalStrikesHud = () => {
    const count = Math.min(3, modalStrikes);
    const countEl = document.getElementById('modalStrikesCount');
    if (countEl) countEl.textContent = count;

    const badge = document.getElementById('modalStrikesBadge');
    if (badge) {
      if (count === 0) {
        badge.className = 'badge bg-success-subtle text-success border border-success-subtle font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-shield-check me-1"></i> Strikes: <span id="modalStrikesCount">0</span>/3`;
      } else if (count === 1) {
        badge.className = 'badge bg-warning-subtle text-warning border border-warning-subtle font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i> Strikes: <span id="modalStrikesCount">1</span>/3`;
      } else if (count === 2) {
        badge.className = 'badge bg-danger-subtle text-danger border border-danger-subtle font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-shield-slash-fill me-1"></i> Strikes: <span id="modalStrikesCount">2</span>/3`;
      } else {
        badge.className = 'badge bg-danger text-white border border-danger font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-lock-fill me-1"></i> 3/3 DISQUALIFIED`;
      }
    }
  };

  const triggerModalStrictStrike = async (violationType, description) => {
    // Only monitor if the skillCheckModal is currently open and an active question is displayed
    if (
      !skillCheckModalEl?.classList.contains('show') ||
      !modalQuestionState ||
      modalQuestionState.classList.contains('d-none') ||
      isModalDisqualified ||
      isModalStrikeActive
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastModalViolationTime < 800) {
      return; // Debounce rapid consecutive events (e.g. blur followed immediately by visibilitychange)
    }
    lastModalViolationTime = now;

    isModalStrikeActive = true;
    modalStrikes++;
    modalTabSwitchesCount = modalStrikes;

    // Immediately FREEZE the question countdown timer
    stopModalQuestionTimer();

    // Deduct 10 seconds from clock
    modalRemainingSeconds = Math.max(5, modalRemainingSeconds - 10);
    if (modalQuizTimerSeconds) {
      modalQuizTimerSeconds.textContent = modalRemainingSeconds;
      modalQuizTimerBadge?.classList.add('timer-penalty-flash');
      setTimeout(() => modalQuizTimerBadge?.classList.remove('timer-penalty-flash'), 700);
    }
    if (modalQuizTimerProgressBar) {
      const pct = Math.max(0, (modalRemainingSeconds / MODAL_QUESTION_TIME_LIMIT) * 100);
      modalQuizTimerProgressBar.style.width = `${pct}%`;
    }

    // Authoritative Server Violation Sync
    try {
      if (window.API && activeCheckingSkillName) {
        window.API.post('/quiz/violation', {
          skill: activeCheckingSkillName,
          violationType,
          details: { message: description, timestamp: now }
        }, { auth: true }).catch((e) => console.warn('[StrictProctor] Background violation report warning:', e.message));
      }
    } catch (_) {}

    // Update Live Strike HUD Badge in Header
    updateModalStrikesHud();

    // Show high-impact strike overlay
    const overlay = document.getElementById('modalStrikeOverlay');
    const v1 = document.getElementById('strikeView1');
    const v2 = document.getElementById('strikeView2');
    const v3 = document.getElementById('strikeView3');

    if (overlay) overlay.classList.remove('d-none');
    v1?.classList.add('d-none');
    v2?.classList.add('d-none');
    v3?.classList.add('d-none');

    if (modalStrikes === 1) {
      const r1 = document.getElementById('strikeReasonText1');
      if (r1) r1.textContent = `${description}. 10 seconds deducted from your timer and integrity score penalized.`;
      v1?.classList.remove('d-none');
    } else if (modalStrikes === 2) {
      const r2 = document.getElementById('strikeReasonText2');
      if (r2) r2.textContent = `${description}. Second violation logged! Another 10 seconds deducted. ONE MORE STRIKE AND YOU WILL BE DISQUALIFIED.`;
      v2?.classList.remove('d-none');
    } else if (modalStrikes >= 3) {
      // STRIKE 3: IMMEDIATE TERMINATION & 24H LOCKOUT
      isModalDisqualified = true;
      v3?.classList.remove('d-none');

      // Guarantee minimum height on modal elements to prevent collapse
      const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
      if (modalContentEl) modalContentEl.style.minHeight = '560px';
      const modalBodyEl = document.getElementById('modalQuizBody');
      if (modalBodyEl) modalBodyEl.style.minHeight = '480px';

      // Wipe/hide question state
      modalQuestionState?.classList.add('d-none');

      // Call authoritative backend disqualify endpoint
      try {
        if (window.API && activeCheckingSkillName) {
          await window.API.post('/quiz/disqualify', {
            skill: activeCheckingSkillName,
            strikes: 3,
            reason: description || 'REPEATED_PROCTORING_VIOLATIONS'
          }, { auth: true });
        }
      } catch (err) {
        console.error('[StrictProctor] Disqualify API error:', err);
      }

      // Update local skill record
      const targetSk = selectedSkillsMap.get(activeCheckingSkillName) ||
        Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === (activeCheckingSkillName || '').toLowerCase());
      if (targetSk) {
        targetSk.isQuizVerified = false;
        targetSk.quizScore = 0;
        targetSk.integrityScore = 0;
        targetSk.verificationStatus = 'flagged_cheating';
        targetSk.cooldownActive = true;
        targetSk.cooldownRemainingHours = 24;
        targetSk.nextRetakeAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }
  };

  // Wire Acknowledgement Buttons for Strike Overlays
  document.getElementById('modalStrike1AckBtn')?.addEventListener('click', () => {
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    isModalStrikeActive = false;
    startModalQuestionTimer(modalRemainingSeconds);
  });

  document.getElementById('modalStrike2AckBtn')?.addEventListener('click', () => {
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    isModalStrikeActive = false;
    startModalQuestionTimer(modalRemainingSeconds);
  });

  document.getElementById('modalDisqualifiedDoneBtn')?.addEventListener('click', () => {
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
    if (modalContentEl) modalContentEl.style.minHeight = '';
    const modalBodyEl = document.getElementById('modalQuizBody');
    if (modalBodyEl) modalBodyEl.style.minHeight = '';
    const modalInstance = bootstrap.Modal.getInstance(skillCheckModalEl);
    if (modalInstance) modalInstance.hide();
    renderSelectedSkills();
  });

  // Strict Proctor Sensors for in-page modal
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      triggerModalStrictStrike('tab_switch', 'Browser tab switch detected');
    }
  });

  window.addEventListener('blur', () => {
    triggerModalStrictStrike('window_blur', 'Window focus lost (Alt-Tab or desktop click)');
  });

  document.addEventListener('contextmenu', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('contextmenu', 'Right-click menu attempt blocked');
    }
  }, true);

  document.addEventListener('copy', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('clipboard', 'Unauthorized copy attempt blocked');
    }
  }, true);

  document.addEventListener('paste', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('clipboard', 'Unauthorized paste attempt blocked');
    }
  }, true);

  document.addEventListener('cut', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('clipboard', 'Unauthorized cut attempt blocked');
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key;

      if (key === 'F12' || (isCtrl && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) || (isCtrl && ['u', 'U'].includes(key))) {
        e.preventDefault();
        e.stopPropagation();
        triggerModalStrictStrike('devtools_attempt', 'Developer inspection shortcut attempt blocked');
        return false;
      }

      if (isCtrl && ['c', 'C', 'v', 'V', 'x', 'X'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerModalStrictStrike('clipboard_shortcut', `Clipboard shortcut Ctrl+${key.toUpperCase()} blocked`);
        return false;
      }
    }
  }, true);

  const startSkillCheck = async (skillName) => {
    let skill = selectedSkillsMap.get(skillName) ||
      Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === (skillName || '').toLowerCase());
    if (!skill) {
      const sKey = (skillName || '').toLowerCase().trim();
      const stdSkill = (allAvailableSkills || FALLBACK_SKILLS).find(
        s => (s.name || '').toLowerCase() === sKey || (s.displayName || '').toLowerCase() === sKey
      );
      const displayName = stdSkill?.displayName || capitalize(skillName);
      const newSkillObj = {
        name: sKey,
        displayName: displayName,
        category: stdSkill?.category || 'tool',
        proficiency: 'beginner',
        selfRatedProficiency: 'beginner',
        verifiedProficiency: null,
        isQuizVerified: false,
        quizScore: 0,
        quizGaps: [],
        isCodeVerified: false,
        verifiedSource: 'self'
      };
      selectedSkillsMap.set(sKey, newSkillObj);
      skill = newSkillObj;
      updateSelectedSkillsUI();
      renderSkillsGrid();
      renderProveSkillsPanel();
      if (typeof saveAutoDraft === 'function') saveAutoDraft();
    }

    // Check if skill has active cheating disqualification or cooldown
    const isFlagged = skill.verificationStatus === 'flagged_cheating';
    const isCooldown = Boolean(skill.cooldownActive || (skill.nextRetakeAvailableAt && new Date() < new Date(skill.nextRetakeAvailableAt)));
    if (isFlagged || isCooldown) {
      const hoursRemaining = skill.cooldownRemainingHours || (skill.nextRetakeAvailableAt ? Math.max(1, Math.ceil((new Date(skill.nextRetakeAvailableAt) - new Date()) / (1000 * 60 * 60))) : 24);
      const prefix = isFlagged ? '🚫 Integrity Violation Lockout:' : '⏳ Retake Cooldown Active:';
      showAlert(`${prefix} Skill check for "${skill.displayName || skill.name}" is locked. Retake available in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.`, 'danger');
      return;
    }

    if (!skillCheckModalEl) return;
    const modal = bootstrap.Modal.getOrCreateInstance(skillCheckModalEl);
    modal.show();

    // Reset modal UI and strict proctoring state
    activeCheckingSkillName = skill.name;
    modalTabSwitchesCount = 0;
    modalStrikes = 0;
    isModalDisqualified = false;
    isModalStrikeActive = false;
    updateModalStrikesHud();
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
    if (modalContentEl) modalContentEl.style.minHeight = '';
    const modalBodyEl = document.getElementById('modalQuizBody');
    if (modalBodyEl) modalBodyEl.style.minHeight = '';
    if (modalSkillBadge) modalSkillBadge.textContent = skill.displayName || skill.name;
    if (skillCheckModalTitle) skillCheckModalTitle.textContent = 'Reality Check';
    modalLoadingState?.classList.remove('d-none');
    modalQuestionState?.classList.add('d-none');
    modalVerdictState?.classList.add('d-none');
    modalFeedbackBox?.classList.add('d-none');
    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.classList.remove('d-none');
    }
    if (modalNextBtn) {
      modalNextBtn.classList.add('d-none');
    }

    try {
      const savedProvider = localStorage.getItem('cp_quiz_preferred_provider') || 'auto';
      const customKey = localStorage.getItem('cp_custom_quiz_key') || null;

      const res = await window.API.post('/quiz/start', {
        skill: skill.name,
        selfRated: skill.selfRatedProficiency || skill.proficiency || 'intermediate',
        displayName: skill.displayName || skill.name,
        provider: savedProvider !== 'auto' ? savedProvider : undefined,
        userApiKey: customKey || undefined
      }, { auth: true });

      if (!res.success || !res.data?.question) {
        throw new Error(res.message || 'Failed to initialize reality check session.');
      }

      activeQuizSession = {
        sessionId: res.data?.sessionId,
        skillName: skill.name,
        displayName: skill.displayName || skill.name,
        selfRated: skill.selfRatedProficiency || skill.proficiency || 'intermediate',
        provider: res.data?.provider,
        isAIGenerated: Boolean(res.data?.isAIGenerated)
      };
      activeQuestionStep = 1;
      activeQuestion = res.data.question;

      // Update provider badge in modal header
      if (modalProviderBadge) {
        modalProviderBadge.classList.remove('d-none');
        if (res.data.isAIGenerated) {
          const prov = res.data.provider || 'AI';
          const pName = prov === 'groq' ? 'Groq AI (Llama)' :
                        prov === 'gemini' ? 'Google Gemini' :
                        prov === 'custom_api_key' ? 'Custom AI Model' : 'Dynamic AI';
          modalProviderBadge.className = 'badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 small';
          modalProviderBadge.innerHTML = `<i class="bi bi-cpu me-1"></i>${escapeHtml(pName)}`;
        } else {
          modalProviderBadge.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small';
          modalProviderBadge.innerHTML = `<i class="bi bi-shield-check me-1"></i>Curated Bank`;
        }
      }

      renderModalQuestion(activeQuestion, 1);
    } catch (err) {
      console.error('Quiz start error:', err);
      const isCooldown = err.cooldownActive || (err.message && err.message.includes('24-hour'));
      if (isCooldown) {
        const hours = err.retryAfterHours || 24;
        showAlert(`\u23F3 24-Hour Review Cooldown: Skill checks can only be retaken after a 24-hour review period to protect credential integrity. Retake available in ${hours} hour${hours > 1 ? 's' : ''}.`, 'warning');
      } else {
        showAlert(`Could not start skill check: ${err.message}`, 'danger');
      }
      modal.hide();
    }
  };

  const renderModalQuestion = (question, stepNumber) => {
    modalLoadingState?.classList.add('d-none');
    modalQuestionState?.classList.remove('d-none');
    modalVerdictState?.classList.add('d-none');
    modalFeedbackBox?.classList.add('d-none');

    activeQuestion = question;
    activeQuestionStep = stepNumber;
    activeSelectedOptionIndex = null;
    startModalQuestionTimer();

    // Difficulty pill
    const diff = (question.difficulty || 'medium').toLowerCase();
    if (modalDifficultyPill) {
      modalDifficultyPill.className = `difficulty-pill ${diff}`;
      modalDifficultyPill.textContent = diff.toUpperCase();
    }

    // Step text & dots
    if (modalStepText) modalStepText.textContent = `Question ${stepNumber} of 5`;
    if (modalStepper) {
      const dots = modalStepper.querySelectorAll('.quiz-step-dot');
      dots.forEach((dot, idx) => {
        dot.className = 'quiz-step-dot';
        if (idx + 1 === stepNumber) dot.classList.add('active');
        else if (idx + 1 < stepNumber) dot.classList.add('completed');
      });
    }

    // Question title & code snippet
    if (modalQuestionPrompt) modalQuestionPrompt.textContent = question.text || question.prompt || '';
    if (modalCodeSnippet) {
      if (question.codeSnippet) {
        modalCodeSnippet.classList.remove('d-none');
        const codeEl = modalCodeSnippet.querySelector('code');
        if (codeEl) codeEl.textContent = question.codeSnippet;
      } else {
        modalCodeSnippet.classList.add('d-none');
      }
    }

    // Options
    if (modalOptionsList) {
      modalOptionsList.innerHTML = '';
      (question.options || []).forEach((opt, idx) => {
        const optCard = document.createElement('div');
        optCard.className = 'quiz-option-card';
        optCard.setAttribute('data-index', idx);
        optCard.innerHTML = `
          <div class="quiz-option-radio">
            <div class="quiz-option-radio-dot"></div>
          </div>
          <div class="quiz-option-text">${escapeHtml(opt)}</div>
        `;

        optCard.addEventListener('click', () => {
          if (optCard.classList.contains('locked')) return;
          modalOptionsList.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('selected'));
          optCard.classList.add('selected');
          activeSelectedOptionIndex = idx;
          if (modalSubmitBtn) modalSubmitBtn.disabled = false;
        });

        modalOptionsList.appendChild(optCard);
      });
    }

    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.innerHTML = `<span>Submit Answer</span><i class="bi bi-arrow-right ms-1"></i>`;
      modalSubmitBtn.classList.remove('d-none');
    }
    if (modalNextBtn) {
      modalNextBtn.classList.add('d-none');
    }
  };

  modalSubmitBtn?.addEventListener('click', async () => {
    if (activeSelectedOptionIndex === null) return;

    stopModalQuestionTimer();
    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - modalQuestionStartTime) / 1000));

    modalSubmitBtn.disabled = true;
    modalSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Checking...`;

    try {
      const res = await window.API.post('/quiz/answer', {
        skill: activeQuizSession?.skillName,
        sessionId: activeQuizSession?.sessionId,
        questionId: activeQuestion?.id,
        selectedIndex: activeSelectedOptionIndex,
        selectedOption: activeSelectedOptionIndex,
        timeTakenSeconds,
        tabSwitches: modalTabSwitchesCount
      }, { auth: true });

      if (!res.success) {
        throw new Error(res.message || 'Failed to submit answer.');
      }

      const data = res.data;
      const correctIdx = Number(data.correctIndex !== undefined ? data.correctIndex : data.correctAnswer);
      const isCorrect = Boolean(data.isCorrect);

      // Lock options and mark colors
      if (modalOptionsList) {
        modalOptionsList.querySelectorAll('.quiz-option-card').forEach((card) => {
          card.classList.add('locked');
          const cIdx = Number(card.getAttribute('data-index'));
          if (cIdx === correctIdx) {
            card.classList.add('option-correct');
          } else if (cIdx === activeSelectedOptionIndex && !isCorrect) {
            card.classList.add('option-wrong');
          }
        });
      }

      // Show feedback box
      if (modalFeedbackBox) {
        modalFeedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
        if (modalFeedbackIcon) {
          modalFeedbackIcon.className = `quiz-feedback-icon bi ${isCorrect ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`;
        }
        if (modalFeedbackHeadline) {
          modalFeedbackHeadline.textContent = isCorrect ? 'Correct!' : 'Not quite right';
        }
        if (modalFeedbackText) {
          modalFeedbackText.textContent = data.explanation || (isCorrect ? 'Great grasp of this concept!' : 'Review this concept in your study plan.');
        }
        modalFeedbackBox.classList.remove('d-none');
      }

      // Update buttons
      modalSubmitBtn.classList.add('d-none');
      if (modalNextBtn) {
        modalNextBtn.classList.remove('d-none');
        if (data.isFinished) {
          stopModalQuestionTimer();
          activeQuizSummary = data.summary || data.result;
          modalNextBtn.innerHTML = `<span>View Results</span><i class="bi bi-trophy-fill ms-1"></i>`;

          // 1. Immediately calibrate and verify the skill in selectedSkillsMap!
          const skillName = activeQuizSession?.skillName;
          const skill = selectedSkillsMap.get(skillName) ||
            (skillName ? Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === skillName.toLowerCase()) : null);

          const verifiedLevel = (
            activeQuizSummary?.verifiedProficiency ||
            activeQuizSummary?.verifiedLevel ||
            activeQuizSummary?.quizSays ||
            (skill ? (skill.verifiedProficiency || skill.proficiency) : 'intermediate') ||
            'intermediate'
          ).toLowerCase();

          if (skill && activeQuizSummary) {
            skill.selfRatedProficiency = skill.selfRatedProficiency || skill.proficiency || 'intermediate';
            skill.proficiency = verifiedLevel;
            skill.verifiedProficiency = verifiedLevel;
            skill.isQuizVerified = true;
            skill.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
            skill.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
            skill.verifiedSource = 'quiz';
            skill.quizSummaryMessage = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage;
            skill.verificationTier = activeQuizSummary.verificationTier || 'quiz_verified';
            skill.verificationStatus = activeQuizSummary.verificationStatus || 'verified';
            skill.integrityScore = activeQuizSummary.integrityScore ?? 100;
          }

          // 2. Mark account verification complete immediately
          hasCompletedSkillVerification = true;
          const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                              (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
          if (currentUser) {
            currentUser.hasCompletedSkillVerification = true;
            if (activeQuizSummary?.user?.skills) {
              currentUser.skills = activeQuizSummary.user.skills;
            } else if (Array.isArray(currentUser.skills)) {
              let matched = currentUser.skills.find(s => (s.name || '').toLowerCase() === (skillName || '').toLowerCase());
              if (!matched && skillName) {
                matched = { name: skillName, displayName: skill?.displayName || skillName };
                currentUser.skills.push(matched);
              }
              if (matched) {
                matched.selfRatedProficiency = matched.selfRatedProficiency || matched.proficiency || 'intermediate';
                matched.proficiency = verifiedLevel;
                matched.verifiedProficiency = verifiedLevel;
                matched.isQuizVerified = true;
                matched.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
                matched.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
                matched.verificationTier = activeQuizSummary.verificationTier || 'quiz_verified';
                matched.verificationStatus = activeQuizSummary.verificationStatus || 'verified';
                matched.integrityScore = activeQuizSummary.integrityScore ?? 100;
              }
            }
            if (typeof window.Auth?.setCurrentUser === 'function') {
              window.Auth.setCurrentUser(currentUser);
            }
          }

          // 3. Immediately render UI so checkmarks and verified badges appear behind modal!
          try {
            renderSkillsGrid();
            updateSelectedSkillsUI();
            renderProveSkillsPanel();
          } catch (renderErr) {
            console.error('Error re-rendering after quiz finished:', renderErr);
          }
        } else {
          activeQuestion = data.nextQuestion;
          modalNextBtn.innerHTML = `<span>Next Question</span><i class="bi bi-arrow-right ms-1"></i>`;
        }
      }
    } catch (err) {
      console.error('Answer submission error:', err);
      showAlert(`Could not submit answer: ${err.message}`, 'danger');
      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.innerHTML = `<span>Submit Answer</span><i class="bi bi-arrow-right ms-1"></i>`;
      }
    }
  });

  modalNextBtn?.addEventListener('click', () => {
    if (activeQuizSummary) {
      stopModalQuestionTimer();
      // Show verdict state
      modalQuestionState?.classList.add('d-none');
      modalVerdictState?.classList.remove('d-none');

      const skillName = activeQuizSession?.skillName;
      const skill = selectedSkillsMap.get(skillName) ||
        (skillName ? Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === skillName.toLowerCase()) : null);

      const verifiedLevel = (
        activeQuizSummary.verifiedProficiency ||
        activeQuizSummary.verifiedLevel ||
        activeQuizSummary.quizSays ||
        (skill ? (skill.verifiedProficiency || skill.proficiency) : 'intermediate') ||
        'intermediate'
      ).toLowerCase();

      if (modalVerdictSelfClaimed) {
        modalVerdictSelfClaimed.textContent = capitalize(activeQuizSummary.selfRated || (skill ? skill.selfRatedProficiency || skill.proficiency : 'Intermediate'));
      }
      if (modalVerdictVerifiedLevel) {
        modalVerdictVerifiedLevel.textContent = capitalize(verifiedLevel);
      }
      if (modalVerdictExplanation) {
        modalVerdictExplanation.textContent = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage || 'Reality check complete.';
      }

      // Proctor telemetry badge & notice (Pillars 6 & 7)
      const integrity = activeQuizSummary.integrityScore !== undefined ? activeQuizSummary.integrityScore : 100;
      if (modalVerdictIntegrityBadge) {
        modalVerdictIntegrityBadge.textContent = `Integrity: ${integrity}/100`;
        if (integrity < 75) {
          modalVerdictIntegrityBadge.className = 'badge bg-warning text-dark font-mono';
        } else {
          modalVerdictIntegrityBadge.className = 'badge bg-secondary font-mono';
        }
      }

      if (modalVerdictUnconfirmedNotice) {
        if (activeQuizSummary.verificationStatus === 'unconfirmed') {
          modalVerdictUnconfirmedNotice.classList.remove('d-none');
        } else {
          modalVerdictUnconfirmedNotice.classList.add('d-none');
        }
      }

      if (modalVerdictGapsWrap && modalVerdictGaps) {
        const gapsList = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
        if (gapsList.length > 0) {
          modalVerdictGapsWrap.classList.remove('d-none');
          modalVerdictGaps.textContent = gapsList.join(', ');
        } else {
          modalVerdictGapsWrap.classList.add('d-none');
        }
      }

      // Update in selectedSkillsMap
      if (skill) {
        skill.selfRatedProficiency = skill.selfRatedProficiency || skill.proficiency || 'intermediate';
        skill.proficiency = verifiedLevel;
        skill.verifiedProficiency = verifiedLevel;
        skill.isQuizVerified = true;
        skill.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
        skill.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
        skill.verifiedSource = 'quiz';
        skill.quizSummaryMessage = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage;
      }

      try {
        renderSkillsGrid();
        updateSelectedSkillsUI();
        renderProveSkillsPanel();
      } catch (renderErr) {
        console.error('Error re-rendering in verdict state:', renderErr);
      }
      return;
    }

    if (activeQuestion) {
      renderModalQuestion(activeQuestion, activeQuestionStep + 1);
    }
  });

  modalVerdictRetestBtn?.addEventListener('click', () => {
    const targetSkill = activeQuizSession?.skillName;
    if (targetSkill) {
      startSkillCheck(targetSkill);
    }
  });

  document.getElementById('modalRestartBtn')?.addEventListener('click', () => {
    const targetSkill = activeQuizSession?.skillName;
    if (targetSkill) {
      startSkillCheck(targetSkill);
    }
  });

  document.getElementById('modalCancelBtn')?.addEventListener('click', () => {
    stopModalQuestionTimer();
  });

  modalVerdictDoneBtn?.addEventListener('click', () => {
    stopModalQuestionTimer();
    if (skillCheckModalEl) {
      bootstrap.Modal.getInstance(skillCheckModalEl)?.hide();
    }

    // Reset active quiz variables
    activeQuizSession = null;
    activeQuestion = null;
    activeQuizSummary = null;

    // Mark account verification complete (only required once per account)
    hasCompletedSkillVerification = true;
    const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                        (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
    if (currentUser) {
      currentUser.hasCompletedSkillVerification = true;
      if (typeof window.Auth?.setCurrentUser === 'function') {
        window.Auth.setCurrentUser(currentUser);
      }
    }
    if (typeof window.Auth?.initNav === 'function') {
      window.Auth.initNav();
    }

    // Refresh UI
    try {
      renderSkillsGrid();
      updateSelectedSkillsUI();
      renderProveSkillsPanel();
    } catch (err) {
      console.error('Error refreshing UI on modal done:', err);
    }

    showAlert('\u{1F389} Account Verified \u2713! Your technical skills are verified. Dashboard, Recommendations, and Active Roadmap are now unlocked!', 'success');
  });

  // Ensure modal dismissal (via X button, backdrop click, or ESC) always guarantees immediate UI refresh
  skillCheckModalEl?.addEventListener('hidden.bs.modal', () => {
    stopModalQuestionTimer();
    activeQuizSession = null;
    activeQuestion = null;
    activeQuizSummary = null;
    const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
    if (modalContentEl) modalContentEl.style.minHeight = '';
    const modalBodyEl = document.getElementById('modalQuizBody');
    if (modalBodyEl) modalBodyEl.style.minHeight = '';
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    try {
      renderSkillsGrid();
      updateSelectedSkillsUI();
      renderProveSkillsPanel();
    } catch (err) {
      console.error('Error refreshing UI on modal hidden:', err);
    }
  });


  // 9. Filters & Search Handlers
  if (skillCategoryFilter) {
    skillCategoryFilter.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        skillCategoryFilter.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategoryFilter = btn.getAttribute('data-cat') || 'all';
        renderSkillsGrid();
      });
    });
  }

  if (skillSearchInput) {
    skillSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      renderSkillsGrid();
    });
  }

  if (clearAllSkillsBtn) {
    clearAllSkillsBtn.addEventListener('click', () => {
      selectedSkillsMap.clear();
      updateSelectedSkillsUI();
      renderSkillsGrid();
    });
  }

  // Custom Skill Addition Handler
  const customSkillNameInput = document.getElementById('customSkillName');
  const customSkillCategorySelect = document.getElementById('customSkillCategory');
  const customSkillProficiencySelect = document.getElementById('customSkillProficiency');
  const btnAddCustomSkill = document.getElementById('btnAddCustomSkill');
  const customSkillFeedback = document.getElementById('customSkillFeedback');

  if (btnAddCustomSkill && customSkillNameInput) {
    const handleAddCustomSkill = async () => {
      const rawInput = customSkillNameInput.value.trim();
      const rawName = rawInput.replace(/[^\w\s.+#/-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!rawName) {
        if (customSkillFeedback) {
          customSkillFeedback.className = 'small mt-2 text-danger';
          customSkillFeedback.textContent = 'Please enter a valid skill name (e.g. Rust, Solidity, Blender).';
          customSkillFeedback.classList.remove('d-none');
        }
        return;
      }
      if (rawInput.includes('@') || rawInput.includes('.com') || rawInput.includes('http')) {
        if (customSkillFeedback) {
          customSkillFeedback.className = 'small mt-2 text-danger';
          customSkillFeedback.textContent = 'Please enter a valid skill or technology name (e.g. Docker, Rust, Flutter).';
          customSkillFeedback.classList.remove('d-none');
        }
        return;
      }

      if (selectedSkillsMap.size >= 20) {
        showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
        return;
      }

      const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const detectSkillCategory = (name) => {
        const n = (name || '').toLowerCase();
        if (/rust|solidity|web3|solana|ethereum|blockchain|smart contract|crypto/i.test(n)) return 'web3';
        if (/python|pandas|numpy|pytorch|tensorflow|scikit|sql|ml|ai|data|spark|r\b|tableau|power bi|bigquery/i.test(n)) return 'data';
        if (/react|vue|angular|svelte|next|nuxt|html|css|tailwind|javascript|typescript|front/i.test(n)) return 'frontend';
        if (/node|express|django|flask|spring|fastapi|golang|go\b|c\+\+|java\b|c#|\.net|back|postgres|mongo|mysql|redis/i.test(n)) return 'backend';
        if (/aws|azure|gcp|docker|kubernetes|k8s|terraform|ci\/cd|devops|linux|cloud|nginx/i.test(n)) return 'cloud';
        if (/flutter|react native|swift|kotlin|android|ios|dart|mobile/i.test(n)) return 'mobile';
        if (/figma|adobe|ui|ux|photoshop|illustrator|blender|3d|maya|three\.js|design/i.test(n)) return 'design';
        if (/unity|unreal|godot|game/i.test(n)) return 'gaming';
        if (/selenium|cypress|playwright|jest|testing|qa/i.test(n)) return 'testing';
        if (/security|penetration|cyber|ethical|owasp|audit/i.test(n)) return 'security';
        if (/finance|accounting|excel|tally|tax|audit|valuation/i.test(n)) return 'finance';
        if (/marketing|seo|sem|content|social media|growth|copywriting/i.test(n)) return 'marketing';
        if (/product|agile|scrum|jira|management/i.test(n)) return 'product';
        return (currentCategoryFilter && currentCategoryFilter !== 'all') ? currentCategoryFilter : 'tool';
      };
      const category = customSkillCategorySelect?.value || detectSkillCategory(rawName);

      // Explicitly register custom skill in active stream
      const assignedStreams = selectedStream === 'cross' ? ['engineering', 'business', 'marketing', 'creative', 'cross'] : [selectedStream];
      SKILL_STREAM_MAP[cleanSlug] = assignedStreams;

      // Ensure skill is registered in available list
      let existing = allAvailableSkills.find((s) => s.name === cleanSlug);
      if (!existing) {
        existing = {
          name: cleanSlug,
          displayName: rawName,
          category: category,
          stream: selectedStream,
          isCustom: true,
        };
        allAvailableSkills.unshift(existing);
      } else {
        existing.stream = selectedStream;
      }

      // Add to selected map as unverified pending quiz calibration
      selectedSkillsMap.set(cleanSlug, {
        name: cleanSlug,
        displayName: rawName,
        category: category,
        proficiency: 'beginner',
        selfRatedProficiency: null,
        verifiedProficiency: null,
        isQuizVerified: false,
        isCodeVerified: false,
        isCustom: true
      });

      // Register with backend catalog in background
      try {
        window.API.post('/skills/custom', {
          name: cleanSlug,
          displayName: rawName,
          category: category,
        }, { auth: true }).catch(() => {});
      } catch (_) {}

      // Reset input & provide quick visual confirmation
      customSkillNameInput.value = '';
      if (customSkillFeedback) {
        customSkillFeedback.className = 'small mt-2 text-warning';
        customSkillFeedback.innerHTML = `<i class="bi bi-info-circle me-1"></i> <span class="custom-skill-confirm-name"></span> added! Level pending — take its 90s quiz below to calibrate your level and advance to goals.`;
        const confirmNameEl = customSkillFeedback.querySelector('.custom-skill-confirm-name');
        if (confirmNameEl) confirmNameEl.textContent = `"${rawName}"`;
        customSkillFeedback.classList.remove('d-none');
        setTimeout(() => {
          customSkillFeedback.classList.add('d-none');
        }, 5000);
      }

      if (alertContainer) {
        alertContainer.innerHTML = '';
      }
      renderSkillsGrid();
      updateSelectedSkillsUI();
      renderProveSkillsPanel();
      if (typeof saveAutoDraft === 'function') saveAutoDraft();
    };

    btnAddCustomSkill.addEventListener('click', handleAddCustomSkill);
    customSkillNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomSkill();
      }
    });
  }

  // Sample Demo Profile Auto-Fill Handler (Adaptive to Stream)
  const btnJudgeDemoFill = document.getElementById('btnJudgeDemoFill');
  if (btnJudgeDemoFill) {
    btnJudgeDemoFill.addEventListener('click', () => {
      const nameInput = document.getElementById('fullName');
      const courseInput = document.getElementById('course');
      const branchInput = document.getElementById('branch');
      const yearInput = document.getElementById('year');
      const collegeInput = document.getElementById('college');
      const careerGoalsInput = document.getElementById('careerGoals');

      // Clear existing interests & skills before filling stream-specific demo profile
      selectedInterests.clear();
      selectedSkillsMap.clear();

      if (selectedStream === 'business') {
        if (nameInput) nameInput.value = 'Aarav Sharma';
        if (courseInput) courseInput.value = 'BBA Finance & Analytics';
        if (branchInput) branchInput.value = 'Corporate Finance & M&A';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'Indian Institute of Management';
        if (careerGoalsInput) careerGoalsInput.value = 'Lead Financial Analyst & Strategic M&A Consultant';

        ['financial modeling', 'finance', 'valuation', 'business operations'].forEach(i => selectedInterests.add(i));

        const demoSkills = [
          { name: 'financial-modeling', displayName: 'Financial Modeling & Valuation', proficiency: 'advanced', category: 'finance' },
          { name: 'dcf-valuation', displayName: 'DCF Valuation & Financial Statements', proficiency: 'intermediate', category: 'finance' },
          { name: 'accounting', displayName: 'Financial Accounting & Reporting', proficiency: 'intermediate', category: 'finance' },
          { name: 'excel', displayName: 'Excel', proficiency: 'advanced', category: 'data' },
          { name: 'power-bi', displayName: 'Power BI', proficiency: 'intermediate', category: 'data' },
          { name: 'communication', displayName: 'Communication', proficiency: 'advanced', category: 'soft-skill' },
        ];
        demoSkills.forEach(s => selectedSkillsMap.set(s.name, {
          name: s.name,
          displayName: s.displayName,
          category: s.category,
          proficiency: s.proficiency,
          selfRatedProficiency: null,
          verifiedProficiency: s.proficiency,
          isQuizVerified: true,
          isCodeVerified: false,
          quizScore: 5,
          quizGaps: [],
          verifiedSource: 'quiz'
        }));
      } else if (selectedStream === 'marketing') {
        if (nameInput) nameInput.value = 'Priya Sen';
        if (courseInput) courseInput.value = 'B.Com Marketing & Digital Media';
        if (branchInput) branchInput.value = 'Performance Marketing';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'St. Xavier College of Commerce';
        if (careerGoalsInput) careerGoalsInput.value = 'Head of Growth Marketing & Paid Acquisition';

        ['digital marketing', 'advertising', 'seo', 'social media'].forEach(i => selectedInterests.add(i));

        const demoSkills = [
          { name: 'meta-ads', displayName: 'Meta Ads Manager & Paid Social', proficiency: 'advanced', category: 'marketing' },
          { name: 'google-ads', displayName: 'Google Ads & SEM', proficiency: 'intermediate', category: 'marketing' },
          { name: 'seo', displayName: 'SEO & Organic Search Strategy', proficiency: 'advanced', category: 'marketing' },
          { name: 'content-marketing', displayName: 'Content Marketing & Copywriting', proficiency: 'intermediate', category: 'marketing' },
          { name: 'google-analytics', displayName: 'Google Analytics 4 & Attribution', proficiency: 'intermediate', category: 'marketing' },
          { name: 'excel', displayName: 'Excel', proficiency: 'intermediate', category: 'data' },
        ];
        demoSkills.forEach(s => selectedSkillsMap.set(s.name, {
          name: s.name,
          displayName: s.displayName,
          category: s.category,
          proficiency: s.proficiency,
          selfRatedProficiency: null,
          verifiedProficiency: s.proficiency,
          isQuizVerified: true,
          isCodeVerified: false,
          quizScore: 5,
          quizGaps: [],
          verifiedSource: 'quiz'
        }));
      } else if (selectedStream === 'creative') {
        if (nameInput) nameInput.value = 'Ananya Roy';
        if (courseInput) courseInput.value = 'B.Des Interaction & Visual Design';
        if (branchInput) branchInput.value = 'Visual Communication';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'National Institute of Design (NID)';
        if (careerGoalsInput) careerGoalsInput.value = 'Lead Product & Brand Identity Visual Designer';

        ['design', 'branding', 'motion graphics', 'visual storytelling'].forEach(i => selectedInterests.add(i));

        const demoSkills = [
          { name: 'brand-identity', displayName: 'Brand Identity & Logo Systems', proficiency: 'advanced', category: 'design' },
          { name: 'adobe-illustrator', displayName: 'Adobe Illustrator', proficiency: 'advanced', category: 'design' },
          { name: 'figma', displayName: 'Figma', proficiency: 'advanced', category: 'design' },
          { name: 'visual-design', displayName: 'Visual Design', proficiency: 'advanced', category: 'design' },
          { name: 'motion-graphics', displayName: 'Motion Graphics & After Effects', proficiency: 'intermediate', category: 'design' },
          { name: 'typography', displayName: 'Typography & Layout Design', proficiency: 'intermediate', category: 'design' },
        ];
        demoSkills.forEach(s => selectedSkillsMap.set(s.name, {
          name: s.name,
          displayName: s.displayName,
          category: s.category,
          proficiency: s.proficiency,
          selfRatedProficiency: null,
          verifiedProficiency: s.proficiency,
          isQuizVerified: true,
          isCodeVerified: false,
          quizScore: 5,
          quizGaps: [],
          verifiedSource: 'quiz'
        }));
      } else {
        // Engineering / Cross track
        if (nameInput) nameInput.value = 'Parth Patil';
        if (courseInput) courseInput.value = 'B.Tech Computer Science';
        if (branchInput) branchInput.value = 'Information Technology';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'Pune Institute of Technology';
        if (careerGoalsInput) careerGoalsInput.value = 'Full-Stack Web & AI Application Developer';

        ['web development', 'artificial intelligence', 'problem solving', 'cloud computing'].forEach((i) => {
          selectedInterests.add(i);
        });

        const demoSkills = [
          { name: 'html', displayName: 'HTML', proficiency: 'intermediate', category: 'frontend', defaultScore: 5 },
          { name: 'css', displayName: 'CSS', proficiency: 'intermediate', category: 'frontend', defaultScore: 5 },
          { name: 'javascript', displayName: 'JavaScript', proficiency: 'advanced', category: 'frontend', defaultScore: 5 },
          { name: 'react', displayName: 'React', proficiency: 'intermediate', category: 'frontend', defaultScore: 4 },
          { name: 'node.js', displayName: 'Node.js', proficiency: 'intermediate', category: 'backend', defaultScore: 4 },
          { name: 'python', displayName: 'Python', proficiency: 'intermediate', category: 'backend', defaultScore: 4 },
        ];

        demoSkills.forEach((s) => {
          selectedSkillsMap.set(s.name, {
            name: s.name,
            displayName: s.displayName,
            category: s.category,
            proficiency: s.proficiency,
            selfRatedProficiency: null,
            verifiedProficiency: s.proficiency,
            isQuizVerified: true,
            isCodeVerified: false,
            quizScore: s.defaultScore || 5,
            quizGaps: [],
            verifiedSource: 'quiz'
          });
        });
      }

      hasCompletedSkillVerification = true;
      const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                          (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      if (currentUser) {
        currentUser.hasCompletedSkillVerification = true;
        if (typeof window.Auth?.setCurrentUser === 'function') {
          window.Auth.setCurrentUser(currentUser);
        }
      }

      renderInterests();
      renderSkillsGrid();
      updateSelectedSkillsUI();

      showAlert(`✓ Demo profile loaded for ${STREAM_META[selectedStream]?.label || 'selected stream'}!`, 'success');

      // Scroll smoothly to step 1 form
      const formEl = document.getElementById('assessmentForm');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Auto-Detect Skills from GitHub Repos Handler
  const btnAutoDetectGitHubSkills = document.getElementById('btnAutoDetectGitHubSkills');
  const btnAutoDetectGitHubText = document.getElementById('btnAutoDetectGitHubText');
  const btnChangeGitHubAccount = document.getElementById('btnChangeGitHubAccount');

  const updateGitHubButtonState = () => {
    const user = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) || 
                 (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null) || 
                 null;
    const connectedGhUser = user?.githubProfile?.username || user?.githubUsername;
    const verifiedSkillsCount = Array.from(selectedSkillsMap.values()).filter(s => s.isCodeVerified || s.isQuizVerified).length;

    if (connectedGhUser) {
      if (btnAutoDetectGitHubText) {
        btnAutoDetectGitHubText.textContent = verifiedSkillsCount > 0
          ? `@${connectedGhUser} (${verifiedSkillsCount} Verified)`
          : `Auto-Detect from @${connectedGhUser}`;
      }
      if (btnChangeGitHubAccount) {
        btnChangeGitHubAccount.classList.remove('d-none');
        btnChangeGitHubAccount.classList.add('d-inline-flex');
      }
    } else {
      if (btnAutoDetectGitHubText) {
        btnAutoDetectGitHubText.textContent = verifiedSkillsCount > 0
          ? `Auto-Detect GitHub (${verifiedSkillsCount} Verified)`
          : 'Auto-Detect from GitHub Repos';
      }
      if (btnChangeGitHubAccount) {
        btnChangeGitHubAccount.classList.add('d-none');
        btnChangeGitHubAccount.classList.remove('d-inline-flex');
      }
    }
  };

  // Wizard state preservation across OAuth redirection
  const saveAssessmentDraft = () => {
    try {
      const draft = {
        step: currentStep,
        fullName: document.getElementById('fullName')?.value || '',
        course: document.getElementById('course')?.value || '',
        branch: document.getElementById('branch')?.value || '',
        year: document.getElementById('year')?.value || '',
        college: document.getElementById('college')?.value || '',
        careerGoals: document.getElementById('careerGoals')?.value || '',
        selectedInterests: Array.from(selectedInterests),
        selectedSkills: Array.from(selectedSkillsMap.values()),
        hasCompletedSkillVerification: Boolean(hasCompletedSkillVerification),
        timestamp: Date.now(),
      };
      sessionStorage.setItem('cp_assessment_draft', JSON.stringify(draft));
    } catch (e) {}
  };
  window.saveAssessmentDraft = saveAssessmentDraft;

  const applyDetectedSkills = (data) => {
    const verifiedSkills = data?.detectedSkills || data?.verifiedSkills || (data?.user?.skills || []).filter(s => s.isCodeVerified) || [];
    let countAdded = 0;

    verifiedSkills.forEach(s => {
      const key = (s.name || '').toLowerCase();
      if (!key) return;
      if (!allAvailableSkills.some(item => item.name.toLowerCase() === key)) {
        allAvailableSkills.unshift({
          name: key,
          displayName: s.displayName || s.name,
          category: s.category || 'backend'
        });
      }
      selectedSkillsMap.set(key, {
        name: key,
        displayName: s.displayName || s.name,
        category: s.category || 'backend',
        proficiency: s.proficiency || 'intermediate',
        isCodeVerified: true,
        verifiedSource: s.verifiedSource || 'github_repo'
      });
      countAdded++;
    });

    if (countAdded > 0) {
      hasCompletedSkillVerification = true;
    }

    renderSkillsGrid();
    updateSelectedSkillsUI();
    updateGitHubButtonState();

    const ghUser = data?.profile?.username || data?.user?.githubProfile?.username || data?.profile?.login || 'user';
    const repoCount = data?.repositories?.length || data?.repos?.length || data?.user?.githubRepos?.length || 0;
    showAlert(`\u2713 Scanned @${ghUser} (${repoCount} study repos) and auto-detected ${countAdded} verified skills!`, 'success');
  };

  if (btnAutoDetectGitHubSkills) {
    btnAutoDetectGitHubSkills.addEventListener('click', () => {
      const origHtml = btnAutoDetectGitHubSkills.innerHTML;
      btnAutoDetectGitHubSkills.disabled = true;

      let isCleared = false;
      const resetBtn = () => {
        if (isCleared) return;
        isCleared = true;
        clearTimeout(failsafeTimer);
        btnAutoDetectGitHubSkills.disabled = false;
        btnAutoDetectGitHubSkills.innerHTML = origHtml;
        updateGitHubButtonState();
      };

      // Failsafe 15s timer ensures loading is NEVER non-stoppable
      const failsafeTimer = setTimeout(() => {
        console.warn('[GitHub Skills] Auto-reset triggered after 15s timeout');
        resetBtn();
      }, 15000);

      const user = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) || 
                   (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      const connectedGhUser = user?.githubProfile?.username || user?.githubUsername;

      // SMART SYNC: If user already connected GitHub, sync repositories directly!
      if (connectedGhUser && window.GitHubAuth?.syncRepos) {
        btnAutoDetectGitHubSkills.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Syncing Repositories...';
        window.GitHubAuth.syncRepos({
          showAlert: (msg, type) => {
            if (typeof showAlert === 'function') showAlert(msg, type);
          },
          setLoadingState: (loading) => {
            if (!loading) resetBtn();
          },
          onSuccess: (data) => {
            resetBtn();
            applyDetectedSkills(data);
          },
          onError: (err) => {
            if (err?.requireConnect && window.GitHubAuth?.startGitHubOAuth) {
              btnAutoDetectGitHubSkills.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Connecting GitHub...';
              window.GitHubAuth.startGitHubOAuth({
                onSuccess: (data) => {
                  resetBtn();
                  applyDetectedSkills(data);
                },
                onError: (oauthErr) => {
                  resetBtn();
                  if (typeof showAlert === 'function') showAlert(oauthErr?.message || err.message, 'warning');
                },
                setLoadingState: (loading) => {
                  if (!loading) resetBtn();
                }
              }, true);
            } else {
              resetBtn();
              if (typeof showAlert === 'function') {
                showAlert(err?.message || 'Could not sync repositories.', 'warning');
              }
            }
          }
        });
        return;
      }

      // FIRST-TIME CONNECT: Trigger 1-Click OAuth
      btnAutoDetectGitHubSkills.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Connecting GitHub...';

      try {
        if (window.GitHubAuth?.startGitHubOAuth) {
          window.GitHubAuth.startGitHubOAuth({
            onSuccess: (data) => {
              resetBtn();
              applyDetectedSkills(data);
            },
            onError: (err) => {
              resetBtn();
              if (typeof showAlert === 'function') {
                showAlert(err?.message || 'Could not verify GitHub account.', 'warning');
              }
              if ((err?.isCodeExchangeFailed || err?.requireConnect) && window.GitHubAuth?.showUniversalGitHubModal) {
                window.GitHubAuth.showUniversalGitHubModal({
                  showAlert: (msg, type) => {
                    if (typeof showAlert === 'function') showAlert(msg, type);
                  },
                  onSuccess: (data) => {
                    resetBtn();
                    applyDetectedSkills(data);
                  },
                  onError: () => resetBtn(),
                }, true, err?.message);
              }
            },
            setLoadingState: (loading) => {
              if (!loading) resetBtn();
            }
          }, true);
        } else if (window.GitHubAuth?.showUniversalGitHubModal) {
          window.GitHubAuth.showUniversalGitHubModal({
            onSuccess: (data) => {
              resetBtn();
              applyDetectedSkills(data);
            },
            onError: () => resetBtn(),
          }, true);
        } else {
          resetBtn();
          showAlert('GitHub integration script loading. Please refresh.', 'warning');
        }
      } catch (err) {
        console.error('[GitHub Skills] Click exception:', err);
        resetBtn();
      }
    });
  }

  // Switch / Change GitHub Account Button
  if (btnChangeGitHubAccount) {
    btnChangeGitHubAccount.addEventListener('click', () => {
      const origHtml = btnChangeGitHubAccount.innerHTML;
      btnChangeGitHubAccount.disabled = true;
      btnChangeGitHubAccount.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Switching...';

      let isCleared = false;
      const resetBtn = () => {
        if (isCleared) return;
        isCleared = true;
        clearTimeout(failsafeTimer);
        btnChangeGitHubAccount.disabled = false;
        btnChangeGitHubAccount.innerHTML = origHtml;
      };

      const failsafeTimer = setTimeout(() => {
        resetBtn();
      }, 15000);

      try {
        if (window.GitHubAuth?.startGitHubOAuth) {
          window.GitHubAuth.startGitHubOAuth({
            onSuccess: (data) => {
              resetBtn();
              applyDetectedSkills(data);
            },
            onError: () => resetBtn(),
            setLoadingState: (loading) => {
              if (!loading) resetBtn();
            }
          }, true);
        } else {
          resetBtn();
        }
      } catch (err) {
        resetBtn();
      }
    });
  }

  // Load Remote Skills from Catalog
  const loadRemoteSkills = async () => {
    try {
      const res = await window.API.get('/skills');
      if (res.success && Array.isArray(res.data?.skills) && res.data.skills.length > 0) {
        const map = new Map();
        FALLBACK_SKILLS.forEach((s) => map.set(s.name, s));
        res.data.skills.forEach((s) => {
          const existing = map.get(s.name);
          map.set(s.name, {
            name: s.name,
            displayName: s.displayName,
            category: s.category,
            subcategory: s.subcategory,
            type: s.type || 'specialized',
            lightcastId: s.lightcastId,
            aliases: s.aliases || [],
            stream: existing?.stream || (SKILL_STREAM_MAP[s.name] && SKILL_STREAM_MAP[s.name].length === 1 ? SKILL_STREAM_MAP[s.name][0] : undefined),
          });
        });
        allAvailableSkills = Array.from(map.values());
      }
    } catch (err) {
      console.warn('Using local fallback skills catalog:', err.message);
    }
  };

  // ── Persistent Auto-Draft System ──────────────────────────────
  const getDraftStorageKey = () => {
    const user = window.Auth?.getUser() || window.Auth?.getCurrentUser();
    const email = (user?.email || 'student').toLowerCase().trim();
    return `cp_assessment_auto_draft_${email}`;
  };

  let autoDraftTimer = null;
  const saveAutoDraft = () => {
    if (autoDraftTimer) clearTimeout(autoDraftTimer);
    autoDraftTimer = setTimeout(() => {
      try {
        const draft = {
          name: document.getElementById('fullName')?.value || '',
          primaryStream: selectedStream,
          education: {
            course: document.getElementById('course')?.value || '',
            branch: document.getElementById('branch')?.value || '',
            year: document.getElementById('year')?.value || '',
            college: document.getElementById('college')?.value || '',
          },
          interests: Array.from(selectedInterests),
          skills: Array.from(selectedSkillsMap.values()),
          careerGoals: document.getElementById('careerGoals')?.value || '',
          hasCompletedSkillVerification: Boolean(hasCompletedSkillVerification),
          savedAt: Date.now(),
        };
        localStorage.setItem(getDraftStorageKey(), JSON.stringify(draft));
      } catch (e) {
        console.warn('AutoDraft write error:', e);
      }
    }, 400);
  };
  window.saveAssessmentDraft = saveAutoDraft;

  // Wire auto-draft triggers on form text inputs
  ['fullName', 'course', 'branch', 'year', 'college', 'careerGoals'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', saveAutoDraft);
      el.addEventListener('change', saveAutoDraft);
    }
  });

  const populateFormWithData = (data, source = 'db') => {
    if (!data) return;

    if (data.name) {
      const fullNameEl = document.getElementById('fullName');
      if (fullNameEl && (!fullNameEl.value || source === 'db')) {
        fullNameEl.value = data.name;
      }
    }

    if (data.education) {
      const cEl = document.getElementById('course');
      if (cEl && (data.education.course || source === 'db')) cEl.value = data.education.course || '';
      const bEl = document.getElementById('branch');
      if (bEl && (data.education.branch || source === 'db')) bEl.value = data.education.branch || '';
      const yEl = document.getElementById('year');
      if (yEl && (data.education.year || source === 'db')) yEl.value = data.education.year || '';
      const clgEl = document.getElementById('college');
      if (clgEl && (data.education.college || source === 'db')) clgEl.value = data.education.college || '';
    }

    if (Array.isArray(data.interests) && data.interests.length > 0) {
      if (source === 'db') selectedInterests.clear();
      data.interests.forEach((i) => {
        if (typeof i === 'string' && i.trim()) {
          selectedInterests.add(i.trim().toLowerCase());
        }
      });
    }

    if (Array.isArray(data.skills) && data.skills.length > 0) {
      data.skills.forEach((s) => {
        const rawKey = s.name || '';
        const key = rawKey.toLowerCase().trim();
        if (!key) return;

        if (!allAvailableSkills.some(item => (item.name || '').toLowerCase() === key)) {
          allAvailableSkills.unshift({
            name: key,
            displayName: s.displayName || s.name || key,
            category: s.category || 'tool'
          });
        }

        // Skill persistence guard: Stale drafts or caches must NEVER downgrade an already verified skill!
        const existing = selectedSkillsMap.get(key);
        const isQuizVerified = Boolean(s.isQuizVerified || existing?.isQuizVerified);
        const isCodeVerified = Boolean(s.isCodeVerified || existing?.isCodeVerified);
        const verifiedProficiency = s.verifiedProficiency || existing?.verifiedProficiency || null;
        const quizScore = Math.max(Number(s.quizScore) || 0, Number(existing?.quizScore) || 0);
        const quizGaps = (Array.isArray(s.quizGaps) && s.quizGaps.length) ? s.quizGaps : (existing?.quizGaps || []);
        const quizVerifiedAt = s.quizVerifiedAt || existing?.quizVerifiedAt || null;
        const verificationTier = isCodeVerified ? 'project_verified' : (isQuizVerified ? 'quiz_verified' : (s.verificationTier || existing?.verificationTier || 'self_rated'));
        const verificationStatus = (isQuizVerified || isCodeVerified) ? 'verified' : (s.verificationStatus || existing?.verificationStatus || 'unverified');
        const integrityScore = (typeof s.integrityScore === 'number' && s.integrityScore !== 100) ? s.integrityScore : (existing?.integrityScore ?? (s.integrityScore ?? 100));
        const verifiedSource = s.verifiedSource || existing?.verifiedSource || (isQuizVerified ? 'quiz' : (isCodeVerified ? 'github' : 'self'));

        selectedSkillsMap.set(key, {
          name: key,
          displayName: s.displayName || existing?.displayName || s.name || key,
          category: s.category || existing?.category || 'tool',
          proficiency: verifiedProficiency || s.proficiency || existing?.proficiency || 'beginner',
          isCodeVerified,
          verifiedSource,
          isQuizVerified,
          selfRatedProficiency: s.selfRatedProficiency || existing?.selfRatedProficiency || s.proficiency || 'beginner',
          verifiedProficiency,
          quizScore,
          quizGaps,
          quizVerifiedAt,
          verificationTier,
          verificationStatus,
          integrityScore,
        });
      });
    }

    if (data.primaryStream && validStreams.includes(data.primaryStream)) {
      selectedStream = data.primaryStream;
    }

    if (Array.isArray(data.careerGoals) && data.careerGoals.length > 0) {
      const gEl = document.getElementById('careerGoals');
      if (gEl && data.careerGoals[0]) gEl.value = data.careerGoals[0];
    } else if (typeof data.careerGoals === 'string' && data.careerGoals.trim()) {
      const gEl = document.getElementById('careerGoals');
      if (gEl) gEl.value = data.careerGoals.trim();
    }

    if (data.hasCompletedSkillVerification || hasCompletedSkillVerification || (Array.isArray(data.skills) && data.skills.some((s) => s.isQuizVerified || s.isCodeVerified))) {
      hasCompletedSkillVerification = true;
    }
  };

  // 10. Preload Profile Data
  const preloadProfile = async () => {
    await loadRemoteSkills();

    // Step 1: Immediate local sync from Auth cache (zero visual delay)
    const cachedUser = window.Auth?.getUser() || window.Auth?.getCurrentUser();
    if (cachedUser) {
      populateFormWithData(cachedUser, 'cache');
    }

    // Step 2: Authoritative DB fetch
    let authoritativeData = null;
    try {
      const assessRes = await window.API.get('/assessment', { auth: true });
      if (assessRes.success && assessRes.data?.assessment) {
        authoritativeData = assessRes.data.assessment;
      }
    } catch (err) {
      console.warn('GET /assessment fallback:', err.message);
    }

    if (!authoritativeData) {
      try {
        const userRes = await window.API.get('/users/me', { auth: true });
        if (userRes.success && userRes.data?.user) {
          authoritativeData = userRes.data.user;
        }
      } catch (err) {
        console.warn('GET /users/me fallback:', err.message);
      }
    }

    if (authoritativeData) {
      populateFormWithData(authoritativeData, 'db');
      if (typeof window.Auth?.setCurrentUser === 'function') {
        const merged = Object.assign({}, cachedUser || {}, authoritativeData);
        window.Auth.setCurrentUser(merged);
      }

      // Auto-restore and apply skills from existing GitHub repositories on page refresh
      if (Array.isArray(authoritativeData.githubRepos) && authoritativeData.githubRepos.length > 0) {
        applyDetectedSkills({
          repositories: authoritativeData.githubRepos,
          profile: authoritativeData.githubProfile,
          user: authoritativeData
        });
      }
      updateGitHubButtonState();

      // Reconcile and fix any stale local drafts in localStorage so they never conflict
      if (authoritativeData.hasCompletedSkillVerification || (Array.isArray(authoritativeData.skills) && authoritativeData.skills.some(s => s.isQuizVerified || s.isCodeVerified))) {
        hasCompletedSkillVerification = true;
        try {
          const draftKey = getDraftStorageKey();
          const draftRaw = localStorage.getItem(draftKey);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (Array.isArray(draft.skills)) {
              draft.skills = draft.skills.map((ds) => {
                const matchedDb = (authoritativeData.skills || []).find((dbs) => (dbs.name || '').toLowerCase().trim() === (ds.name || '').toLowerCase().trim());
                if (matchedDb && (matchedDb.isQuizVerified || matchedDb.isCodeVerified)) {
                  return { ...ds, ...matchedDb };
                }
                return ds;
              });
              draft.hasCompletedSkillVerification = true;
              localStorage.setItem(draftKey, JSON.stringify(draft));
            }
          }
        } catch (dErr) {}
      }
    }

    // Step 3: Restore any local draft edits (with merge preservation guaranteed)
    try {
      const draftRaw = localStorage.getItem(getDraftStorageKey());
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        populateFormWithData(draft, 'draft');
      }
    } catch (err) {}

    // Step 4: Check OAuth sessionStorage draft
    try {
      const sessDraftRaw = sessionStorage.getItem('cp_assessment_draft');
      if (sessDraftRaw) {
        const sessDraft = JSON.parse(sessDraftRaw);
        populateFormWithData(sessDraft, 'draft');
        sessionStorage.removeItem('cp_assessment_draft');
      }
    } catch (err) {}

    if (streamParam && validStreams.includes(streamParam)) {
      selectedStream = streamParam;
    }

    applyStreamUI(selectedStream);
    renderInterests();
    renderSkillsGrid();
    updateSelectedSkillsUI();

    // Check if user has an existing saved assessment
    const courseVal = document.getElementById('course')?.value?.trim();
    const hasExistingAssessment = Boolean(
      (authoritativeData && (authoritativeData.profileCompleted || authoritativeData.education?.course)) ||
      (cachedUser && (cachedUser.profileCompleted || cachedUser.education?.course)) ||
      courseVal ||
      selectedSkillsMap.size > 0
    );

    const banner = document.getElementById('profileLoadedBanner');
    const details = document.getElementById('profileLoadedDetails');
    const jumpBtn = document.getElementById('btnJumpToAcademics');

    if (hasExistingAssessment && banner) {
      banner.classList.remove('d-none');
      if (details) {
        const streamLabel = STREAM_META[selectedStream]?.label || selectedStream;
        const skCount = selectedSkillsMap.size;
        const intCount = selectedInterests.size;
        details.innerHTML = `Loaded saved profile for <strong>${escapeHtml(streamLabel)}</strong> &bull; ${skCount} skills &bull; ${intCount} domains of interest. All information is restored.`;
      }
      if (jumpBtn) {
        jumpBtn.onclick = () => updateStepUI(1);
      }
    }

    // Determine target step: if already filled and not explicitly starting at 0, open Step 1 so data is immediately visible!
    let targetStep = 0;
    const urlParams = new URLSearchParams(window.location.search);
    const requestedStep = urlParams.get('step');
    if (requestedStep !== null && !isNaN(parseInt(requestedStep))) {
      targetStep = Math.min(4, Math.max(0, parseInt(requestedStep)));
    } else if (hasExistingAssessment && courseVal) {
      targetStep = 1;
    }

    updateStepUI(targetStep);
    isPreloadingProfile = false;
  };

  // 11. Form Submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertContainer) alertContainer.innerHTML = '';

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    const resetSubmitBtn = () => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    };

    const fullName = document.getElementById('fullName').value.trim();
    const course = document.getElementById('course').value.trim();
    const branch = document.getElementById('branch').value.trim();
    const year = document.getElementById('year').value;
    const college = document.getElementById('college').value.trim();
    const goalText = document.getElementById('careerGoals').value.trim();

    if (!selectedStream) {
      updateStepUI(0);
      showAlert('Please select your primary stream.');
      return;
    }

    if (!fullName) {
      updateStepUI(1);
      showAlert('Full Name is required.');
      return;
    }

    if (!course) {
      updateStepUI(1);
      showAlert('Degree or Course is required.');
      return;
    }

    if (selectedInterests.size === 0) {
      updateStepUI(2);
      showAlert('Please select at least 1 domain of interest.');
      return;
    }

    if (selectedSkillsMap.size === 0) {
      updateStepUI(3);
      showAlert('Please select at least 1 skill you possess before submitting.');
      return;
    }

    const verifiedSkills = Array.from(selectedSkillsMap.values()).filter(
      (s) => s.isQuizVerified || s.isCodeVerified
    );
    if (verifiedSkills.length === 0) {
      updateStepUI(3);
      showAlert(
        `🔒 Baseline Verification Required: Please complete at least one 90-second Reality Check Quiz to calibrate your baseline skill level before submitting.`,
        'warning'
      );
      return;
    }

    const payload = {
      name: fullName,
      primaryStream: selectedStream,
      education: {
        course,
        branch,
        year,
        college,
      },
      interests: Array.from(selectedInterests),
      skills: Array.from(selectedSkillsMap.values()),
      careerGoals: goalText ? [goalText] : [],
      hasCompletedSkillVerification: Boolean(hasCompletedSkillVerification || verifiedSkills.length > 0),
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="rg-shine"><span></span></span>
        <span class="rg-bg"></span>
        <span class="rg-label">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span>Calculating Career Matches...</span>
        </span>
      `;
    }

    try {
      const response = await window.API.put('/assessment', payload, { auth: true });

      if (response.success) {
        try {
          localStorage.removeItem(getDraftStorageKey());
        } catch (e) {}

        if (response.data?.user) {
          window.Auth.setCurrentUser(response.data.user);
        }

        showAlert('\u2713 Profile & verified skills saved! Directing you to your career recommendations...', 'success');
        resetSubmitBtn();
        setTimeout(() => {
          window.location.href = 'recommendations.html';
        }, 600);
      } else {
        showAlert(response.message || 'Failed to submit assessment.');
        resetSubmitBtn();
      }
    } catch (err) {
      resetSubmitBtn();

      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorMsg = err.errors.map((e) => e.message).join('; ');
        showAlert(errorMsg);
      } else {
        showAlert(err.message || 'Error saving assessment. Please try again.');
      }
    }
  });

  // Initial load
  preloadProfile();
});

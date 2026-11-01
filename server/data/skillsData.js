/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * data/skillsData.js — 35+ Standardized Industry Skills
 *
 * Seed data for the Skill collection.
 * Categories match SkillCategoryEnum in models/Skill.js.
 */

const skillsData = [
  // ── Frontend (6) ──────────────────────────────────────────
  {
    name: 'html',
    displayName: 'HTML',
    category: 'frontend',
    description: 'Hypertext Markup Language for creating the semantic structure of modern web pages.',
  },
  {
    name: 'css',
    displayName: 'CSS',
    category: 'frontend',
    description: 'Cascading Style Sheets for layout, styling, colors, and responsive visual design.',
  },
  {
    name: 'javascript',
    displayName: 'JavaScript',
    category: 'frontend',
    description: 'Core scripting language for interactive web experiences, DOM manipulation, and dynamic logic.',
  },
  {
    name: 'responsive-design',
    displayName: 'Responsive Design',
    category: 'frontend',
    description: 'Techniques including flexbox, grid, and media queries to ensure websites look great across mobile and desktop.',
  },
  {
    name: 'react',
    displayName: 'React',
    category: 'frontend',
    description: 'Popular component-based JavaScript library for building scalable Single Page Applications and reactive UIs.',
  },
  {
    name: 'bootstrap',
    displayName: 'Bootstrap',
    category: 'frontend',
    description: 'Component-rich CSS framework for fast, responsive web design with pre-styled grid and interactive utilities.',
  },

  // ── Backend (5) ───────────────────────────────────────────
  {
    name: 'node.js',
    displayName: 'Node.js',
    category: 'backend',
    description: 'V8-powered asynchronous JavaScript runtime for high-throughput backend services and servers.',
  },
  {
    name: 'express.js',
    displayName: 'Express.js',
    category: 'backend',
    description: 'Minimalist, flexible Node.js web application framework for structuring RESTful APIs and middleware.',
  },
  {
    name: 'rest-apis',
    displayName: 'REST APIs',
    category: 'backend',
    description: 'Design and implementation of standard HTTP endpoints, status codes, JSON payloads, and stateless architecture.',
  },
  {
    name: 'authentication',
    displayName: 'Authentication',
    category: 'backend',
    description: 'Secure user identity management, password hashing with bcrypt, and token-based auth with JSON Web Tokens (JWT).',
  },
  {
    name: 'python',
    displayName: 'Python',
    category: 'backend',
    description: 'Versatile, high-level programming language used extensively in backend development, data analysis, and automation.',
  },

  // ── Database (4) ──────────────────────────────────────────
  {
    name: 'mongodb',
    displayName: 'MongoDB',
    category: 'database',
    description: 'Leading document-oriented NoSQL database for flexible JSON-like documents and scalable data storage.',
  },
  {
    name: 'sql',
    displayName: 'SQL',
    category: 'database',
    description: 'Structured Query Language for creating, reading, updating, and querying relational database management systems.',
  },
  {
    name: 'mysql',
    displayName: 'MySQL',
    category: 'database',
    description: 'Reliable open-source relational database system widely used for structured tables, indexing, and transactions.',
  },
  {
    name: 'database-design',
    displayName: 'Database Design',
    category: 'database',
    description: 'Architecting efficient data schemas, relationships, normalization, indexing, and data integrity guarantees.',
  },

  // ── Data (5) ──────────────────────────────────────────────
  {
    name: 'excel',
    displayName: 'Excel',
    category: 'data',
    description: 'Spreadsheet tool for data organization, formulas, pivot tables, and baseline business intelligence.',
  },
  {
    name: 'statistics',
    displayName: 'Statistics',
    category: 'data',
    description: 'Mathematical foundation of data analysis: distributions, probability, hypothesis testing, and statistical significance.',
  },
  {
    name: 'power-bi',
    displayName: 'Power BI',
    category: 'data',
    description: 'Microsoft business analytics platform for interactive dashboards, reports, and organizational KPIs.',
  },
  {
    name: 'data-visualization',
    displayName: 'Data Visualization',
    category: 'data',
    description: 'Communicating insights visually using charts, scatter plots, trend lines, and clear visual narratives.',
  },
  {
    name: 'data-cleaning',
    displayName: 'Data Cleaning',
    category: 'data',
    description: 'Identifying and correcting inaccurate, missing, or malformed records from raw datasets to prepare for analysis.',
  },

  // ── Design (5) ────────────────────────────────────────────
  {
    name: 'figma',
    displayName: 'Figma',
    category: 'design',
    description: 'Industry-standard collaborative interface design tool for wireframing, UI prototyping, and design systems.',
  },
  {
    name: 'wireframing',
    displayName: 'Wireframing',
    category: 'design',
    description: 'Low-fidelity structural blueprints of digital products defining page layout, content flow, and hierarchy.',
  },
  {
    name: 'prototyping',
    displayName: 'Prototyping',
    category: 'design',
    description: 'Building interactive and clickable mockups to simulate end-user workflows and validate usability.',
  },
  {
    name: 'user-research',
    displayName: 'User Research',
    category: 'design',
    description: 'Methods for discovering user behaviors, friction points, and motivations through interviews and usability tests.',
  },
  {
    name: 'visual-design',
    displayName: 'Visual Design',
    category: 'design',
    description: 'Principles of typography, color theory, spacing, accessibility contrast, and modern aesthetic elegance.',
  },

  // ── Security (5) ──────────────────────────────────────────
  {
    name: 'networking',
    displayName: 'Networking',
    category: 'security',
    description: 'Fundamentals of TCP/IP, DNS, routing, subnets, firewalls, and network packet flow.',
  },
  {
    name: 'linux',
    displayName: 'Linux',
    category: 'security',
    description: 'Command line operations, file permissions, shell scripting, and server administration on Linux environments.',
  },
  {
    name: 'cybersecurity-fundamentals',
    displayName: 'Cybersecurity Fundamentals',
    category: 'security',
    description: 'Core security tenets: confidentiality, integrity, availability, threat vectors, and defensive measures.',
  },
  {
    name: 'ethical-hacking',
    displayName: 'Ethical Hacking',
    category: 'security',
    description: 'Authorized penetration testing techniques to discover and remediate security vulnerabilities before adversaries do.',
  },
  {
    name: 'owasp-basics',
    displayName: 'OWASP Basics',
    category: 'security',
    description: 'Understanding and mitigating the Top 10 Web Application Security Risks including injection and XSS.',
  },

  // ── Tools & Soft Skills (5) ───────────────────────────────
  {
    name: 'git',
    displayName: 'Git',
    category: 'tool',
    description: 'Distributed version control system for tracking code changes, branching, merging, and collaboration.',
  },
  {
    name: 'github',
    displayName: 'GitHub',
    category: 'tool',
    description: 'Cloud hosting platform for Git repositories with pull requests, issue tracking, and CI/CD workflows.',
  },
  {
    name: 'problem-solving',
    displayName: 'Problem Solving',
    category: 'soft-skill',
    description: 'Analytical mindset to deconstruct complex technical roadblocks into structured, testable algorithmic solutions.',
  },
  {
    name: 'communication',
    displayName: 'Communication',
    category: 'soft-skill',
    description: 'Clear, concise verbal and written conveyance of technical ideas, documentation, and cross-functional updates.',
  },
  {
    name: 'teamwork',
    displayName: 'Teamwork',
    category: 'soft-skill',
    description: 'Collaborating effectively in agile teams, pair programming, active listening, and constructive peer reviews.',
  },

  // ── Modern & Trending Industry Skills (12) ────────────────
  {
    name: 'typescript',
    displayName: 'TypeScript',
    category: 'frontend',
    description: 'Typed superset of JavaScript for scalable, maintainable, and type-safe enterprise web applications.',
  },
  {
    name: 'next.js',
    displayName: 'Next.js',
    category: 'frontend',
    description: 'Production-grade React framework featuring server-side rendering, static site generation, and full-stack API routes.',
  },
  {
    name: 'tailwind-css',
    displayName: 'Tailwind CSS',
    category: 'frontend',
    description: 'Utility-first CSS framework for rapid, highly customized modern responsive user interface construction.',
  },
  {
    name: 'flutter',
    displayName: 'Flutter',
    category: 'frontend',
    description: 'Google multi-platform UI framework for building natively compiled mobile (iOS, Android), web, and desktop applications.',
  },
  {
    name: 'fastapi',
    displayName: 'FastAPI',
    category: 'backend',
    description: 'Modern, blazing-fast Python web framework for building REST & OpenAPI backends with automatic type validation.',
  },
  {
    name: 'graphql',
    displayName: 'GraphQL',
    category: 'backend',
    description: 'Declarative query language and runtime for APIs that empowers clients to request exactly what they need.',
  },
  {
    name: 'docker',
    displayName: 'Docker',
    category: 'cloud',
    description: 'Containerization engine for isolating and deploying lightweight, portable applications reproducibly across any cloud.',
  },
  {
    name: 'kubernetes',
    displayName: 'Kubernetes',
    category: 'cloud',
    description: 'Automated container orchestration platform for scaling, load balancing, and managing high-availability microservices.',
  },
  {
    name: 'aws',
    displayName: 'AWS Cloud',
    category: 'cloud',
    description: 'Amazon Web Services cloud architecture covering EC2, S3, Lambda serverless, IAM security, and cloud networking.',
  },
  {
    name: 'langchain',
    displayName: 'LangChain',
    category: 'data',
    description: 'Open-source framework for building contextual AI agents, RAG pipelines, and chaining Large Language Models.',
  },
  {
    name: 'generative-ai',
    displayName: 'Generative AI & LLMs',
    category: 'data',
    description: 'Prompt engineering, LLM integration, fine-tuning, vector embeddings, and building production-ready generative systems.',
  },
  {
    name: 'pytorch',
    displayName: 'PyTorch',
    category: 'ai',
    description: 'Leading deep learning framework for training and deploying computer vision, NLP, and neural network architectures.',
  },
  {
    name: 'tensorflow',
    displayName: 'TensorFlow',
    category: 'ai',
    description: 'Open-source end-to-end platform for machine learning, neural computation, and enterprise ML pipelines.',
  },
  {
    name: 'scikit-learn',
    displayName: 'Scikit-Learn',
    category: 'ai',
    description: 'Python library for statistical modeling, regression, clustering, decision trees, and predictive analytics.',
  },
  {
    name: 'pandas',
    displayName: 'Pandas & NumPy',
    category: 'data',
    description: 'High-performance Python data manipulation libraries for data structures, series, arrays, and exploratory data analysis.',
  },
  {
    name: 'deep-learning',
    displayName: 'Deep Learning',
    category: 'ai',
    description: 'Multi-layer artificial neural networks, backpropagation, CNNs for computer vision, and Transformer architectures.',
  },
  {
    name: 'natural-language-processing',
    displayName: 'NLP (Natural Language Processing)',
    category: 'ai',
    description: 'Techniques and models for computational linguistics, tokenization, semantic embeddings, and language understanding.',
  },
  {
    name: 'terraform',
    displayName: 'Terraform & IaC',
    category: 'cloud',
    description: 'Infrastructure as Code software tool to safely and predictably create, change, and improve multi-cloud infrastructure.',
  },
  {
    name: 'ci-cd',
    displayName: 'CI/CD & GitHub Actions',
    category: 'tool',
    description: 'Continuous Integration and Continuous Deployment pipelines for automated testing, linting, and artifact deployment.',
  },
  {
    name: 'react-native',
    displayName: 'React Native',
    category: 'mobile',
    description: 'Cross-platform mobile development framework using React to build native iOS and Android apps with a single codebase.',
  },
  {
    name: 'dart',
    displayName: 'Dart',
    category: 'mobile',
    description: 'Client-optimized programming language for building high-speed multi-platform UI applications with Flutter.',
  },
  {
    name: 'firebase',
    displayName: 'Firebase & Firestore',
    category: 'cloud',
    description: 'Backend-as-a-Service platform offering real-time NoSQL databases, authentication, cloud storage, and hosting.',
  },
  {
    name: 'java',
    displayName: 'Java',
    category: 'backend',
    description: 'Robust, object-oriented, class-based programming language powering enterprise backends and distributed systems.',
  },
  {
    name: 'spring-boot',
    displayName: 'Spring Boot',
    category: 'backend',
    description: 'Convention-over-configuration Java framework for building production-grade, stand-alone, RESTful microservices.',
  },
  {
    name: 'postgresql',
    displayName: 'PostgreSQL',
    category: 'database',
    description: 'Advanced, open-source object-relational database system known for reliability, ACID compliance, and complex queries.',
  },
  {
    name: 'redis',
    displayName: 'Redis Caching',
    category: 'database',
    description: 'In-memory data structure store used as a distributed database, cache, message broker, and streaming engine.',
  },
  {
    name: 'kafka',
    displayName: 'Apache Kafka',
    category: 'backend',
    description: 'Distributed event streaming platform for high-performance data pipelines, streaming analytics, and event-driven architecture.',
  },
  {
    name: 'cypress',
    displayName: 'Cypress E2E Testing',
    category: 'testing',
    description: 'Next-generation front-end testing tool constructed for modern web applications with real-time browser execution.',
  },
  {
    name: 'selenium',
    displayName: 'Selenium WebDriver',
    category: 'testing',
    description: 'Browser automation framework supporting multi-browser test suites and automated web UI verification.',
  },
  {
    name: 'playwright',
    displayName: 'Playwright Automation',
    category: 'testing',
    description: 'Modern cross-browser end-to-end testing library for Chromium, Firefox, and WebKit with resilient auto-waiting.',
  },
  {
    name: 'postman',
    displayName: 'Postman & API Testing',
    category: 'testing',
    description: 'Comprehensive API development, automated regression testing, environment simulation, and contract verification platform.',
  },
  {
    name: 'unity',
    displayName: 'Unity Engine',
    category: 'gaming',
    description: 'Leading real-time 3D development platform for creating interactive video games, AR/VR, and simulation experiences.',
  },
  {
    name: 'csharp',
    displayName: 'C# Programming',
    category: 'backend',
    description: 'Modern, object-oriented programming language developed by Microsoft for .NET enterprise systems and Unity game development.',
  },
  {
    name: 'unreal-engine',
    displayName: 'Unreal Engine 5',
    category: 'gaming',
    description: 'AAA photorealistic 3D game engine featuring Nanite virtualized geometry, Lumen global illumination, and C++ scripting.',
  },
  {
    name: 'cpp',
    displayName: 'C++ Programming',
    category: 'backend',
    description: 'High-performance compiled language providing low-level memory management for game engines, operating systems, and finance.',
  },
  {
    name: 'solidity',
    displayName: 'Solidity Smart Contracts',
    category: 'web3',
    description: 'Statically-typed contract-oriented programming language for implementing smart contracts on Ethereum Virtual Machine (EVM).',
  },
  {
    name: 'web3js',
    displayName: 'Web3.js & Ethers.js',
    category: 'web3',
    description: 'JavaScript libraries for connecting web frontends to Ethereum nodes, querying balances, and signing crypto transactions.',
  },
  {
    name: 'smart-contracts',
    displayName: 'Smart Contract Architecture',
    category: 'web3',
    description: 'Decentralized application architecture, ERC-20/ERC-721 token standards, DeFi protocols, and contract security auditing.',
  },
  {
    name: 'agile-scrum',
    displayName: 'Agile & Scrum Methodology',
    category: 'product',
    description: 'Iterative project management framework for sprint planning, daily standups, backlog refinement, and continuous delivery.',
  },
  {
    name: 'product-management',
    displayName: 'Product Management & PRDs',
    category: 'product',
    description: 'Product lifecycle strategy, market validation, KPI tracking, Product Requirement Documents, and roadmap prioritization.',
  },
  {
    name: 'user-stories',
    displayName: 'User Story Mapping & JIRA',
    category: 'product',
    description: 'Defining persona-based user stories, acceptance criteria, epics, release planning, and tracking in JIRA.',
  },

  // ── Business, Finance & Management Skills ─────────────────
  {
    name: 'financial-modeling',
    displayName: 'Financial Modeling & Valuation',
    category: 'finance',
    description: 'Three-statement financial modeling, DCF forecasting, scenario analysis, and valuation benchmarks in Excel.',
  },
  {
    name: 'dcf-valuation',
    displayName: 'DCF Valuation & Financial Statements',
    category: 'finance',
    description: 'Discounted Cash Flow valuation, balance sheet analysis, P&L inspection, and enterprise value calculation.',
  },
  {
    name: 'accounting',
    displayName: 'Financial Accounting & Reporting',
    category: 'finance',
    description: 'GAAP and IFRS accounting standards, ledger maintenance, financial audits, and quarterly corporate reporting.',
  },
  {
    name: 'business-operations',
    displayName: 'Business Operations & RevOps',
    category: 'business',
    description: 'Cross-functional operational efficiency, process optimization, revenue operations, and KPI dashboarding.',
  },
  {
    name: 'management-consulting',
    displayName: 'Management Consulting & Strategy',
    category: 'business',
    description: 'Hypothesis-driven problem solving, market entry strategy, cost rationalization, and C-suite presentation synthesis.',
  },
  {
    name: 'market-research',
    displayName: 'Market Research & Competitive Intelligence',
    category: 'business',
    description: 'Industry sizing, competitor benchmarking, qualitative customer interviews, and TAM/SAM/SOM market estimation.',
  },

  // ── Digital Marketing & Growth Skills ──────────────────────
  {
    name: 'meta-ads',
    displayName: 'Meta Ads Manager & Paid Social',
    category: 'marketing',
    description: 'Campaign architecture on Facebook and Instagram, pixel event tracking, creative testing, and CAC/ROAS scaling.',
  },
  {
    name: 'google-ads',
    displayName: 'Google Ads & SEM',
    category: 'marketing',
    description: 'Paid search keyword bidding, Quality Score optimization, Display network remarketing, and performance max campaigns.',
  },
  {
    name: 'seo',
    displayName: 'SEO & Organic Search Strategy',
    category: 'marketing',
    description: 'On-page SEO, technical crawling audits, keyword intent research, search console diagnostics, and backlink authority building.',
  },
  {
    name: 'content-marketing',
    displayName: 'Content Marketing & Copywriting',
    category: 'marketing',
    description: 'Editorial calendar strategy, high-converting blog and newsletter creation, customer storytelling, and lead magnets.',
  },
  {
    name: 'social-media-growth',
    displayName: 'Social Media & Viral Growth',
    category: 'marketing',
    description: 'Short-form video hooks, audience retention mechanics, cross-platform community building, and organic viral growth.',
  },
  {
    name: 'google-analytics',
    displayName: 'Google Analytics 4 & Attribution',
    category: 'marketing',
    description: 'GA4 event implementation, conversion funnel tracking, user cohort analysis, and multi-touch attribution modeling.',
  },
  {
    name: 'aeo',
    displayName: 'Answer Engine Optimization (AEO) & AI Search',
    category: 'marketing',
    description: 'Optimizing content discovery and entity citations for AI answer engines (Perplexity, ChatGPT Search, Claude, Google AI Overviews) via llms.txt, structured data, and informational gain.',
  },
  {
    name: 'baidu-seo',
    displayName: 'Baidu SEO & China Search Optimization',
    category: 'marketing',
    description: 'Baiduspider indexing, ICP compliance (ICP备案), Simplified Chinese keyword segmentation (分词), Baidu Webmaster Tools (站长平台), and Baidu ecosystem authority.',
  },
  {
    name: 'technical-seo',
    displayName: 'Technical SEO & Core Web Vitals',
    category: 'marketing',
    description: 'Advanced crawl budget optimization, Core Web Vitals (LCP, INP, CLS), Schema.org JSON-LD graphs, canonicalization, and XML sitemap indexation.',
  },

  // ── Design & Creative Media Skills ─────────────────────────
  {
    name: 'brand-identity',
    displayName: 'Brand Identity & Logo Systems',
    category: 'design',
    description: 'Brand architecture, visual design systems, logo guidelines, color theory, and corporate visual assets.',
  },
  {
    name: 'adobe-illustrator',
    displayName: 'Adobe Illustrator',
    category: 'design',
    description: 'Vector graphics creation, typography styling, custom iconography, illustrations, and print-ready digital exports.',
  },
  {
    name: 'motion-graphics',
    displayName: 'Motion Graphics & After Effects',
    category: 'design',
    description: 'Kinetic typography, UI micro-animations, explainer video production, and 2D visual effects in Adobe After Effects.',
  },
  {
    name: 'copywriting',
    displayName: 'High-Converting Copywriting',
    category: 'design',
    description: 'Direct-response copywriting for landing pages, sales emails, ad copy, value propositions, and investor pitch decks.',
  },
  {
    name: 'blender',
    displayName: 'Blender 3D Modeling',
    category: 'design',
    description: '3D asset modeling, procedural texturing, realistic lighting, and photorealistic rendering in Blender.',
  },
  {
    name: 'typography',
    displayName: 'Typography & Layout Design',
    category: 'design',
    description: 'Font pairing, editorial layout grids, hierarchy scaling, readability standards, and editorial publication styling.',
  },
];

module.exports = skillsData;

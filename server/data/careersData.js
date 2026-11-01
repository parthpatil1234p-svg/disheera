/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * data/careersData.js — 5 Core Career Definitions
 *
 * Seed data for the Career collection.
 * Required skills reference names from skillsData.js.
 * Resolved to ObjectIds during seed execution.
 */

const careersData = [
  // ── 1. Front-End Developer ─────────────────────────────────
  {
    title: 'Front-End Developer',
    slug: 'front-end-developer',
    shortDescription: 'Build intuitive, responsive, and visually stunning user interfaces for modern web applications.',
    longDescription:
      'Front-End Developers build the client-facing side of websites and web applications. They translate Figma UI designs into clean, maintainable HTML, CSS, and modern JavaScript code. They focus on responsive mobile-first layouts, cross-browser compatibility, web performance, and engaging micro-interactions to create delight for millions of active users.',
    category: 'development',
    icon: 'bi-window-fullscreen',
    color: '#22D3EE', // Cyan
    educationPreferences: ['BCA', 'B.Tech', 'B.E.', 'B.Sc Computer Science', 'MCA', 'Computer Engineering', 'Information Technology'],
    interestTags: ['web development', 'design', 'problem solving', 'app development'],
    requiredSkills: [
      { skillName: 'html', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'css', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'javascript', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'react', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'responsive-design', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'tailwind-css', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'typescript', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'bootstrap', importance: 'low', requiredProficiency: 'beginner' },
      { skillName: 'git', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'github', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 2. Full-Stack Developer ────────────────────────────────
  {
    title: 'Full-Stack Developer',
    slug: 'full-stack-developer',
    shortDescription: 'Master both client and server architectures to engineer end-to-end digital products.',
    longDescription:
      'Full-Stack Developers possess comprehensive knowledge spanning frontend interfaces, backend application servers, databases, and API integrations. They architect robust data models in MongoDB, design scalable RESTful APIs in Node.js and Express, implement secure JWT authentication, and connect everything with fluid client experiences.',
    category: 'development',
    icon: 'bi-stack',
    color: '#7C3AED', // Purple
    educationPreferences: ['BCA', 'B.Tech', 'B.E.', 'B.Sc Computer Science', 'MCA', 'Computer Engineering', 'Information Technology'],
    interestTags: ['web development', 'problem solving', 'app development', 'cloud computing'],
    requiredSkills: [
      { skillName: 'javascript', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'react', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'node.js', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'express.js', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'mongodb', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'rest-apis', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'typescript', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'next.js', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'docker', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'authentication', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'html', importance: 'low', requiredProficiency: 'beginner' },
      { skillName: 'css', importance: 'low', requiredProficiency: 'beginner' },
    ],
  },

  // ── 3. Data Analyst ────────────────────────────────────────
  {
    title: 'Data Analyst',
    slug: 'data-analyst',
    shortDescription: 'Transform raw data into actionable business intelligence, dashboards, and growth insights.',
    longDescription:
      'Data Analysts query and inspect organizational datasets using SQL, conduct exploratory statistical analyses, clean raw logs, and build compelling interactive dashboards in Power BI and Excel. They empower executives and product managers to make evidence-based strategic decisions by uncovering trends, customer behaviors, and anomalies.',
    category: 'data',
    icon: 'bi-bar-chart-line-fill',
    color: '#10B981', // Emerald Green
    educationPreferences: ['BCA', 'B.Tech', 'B.Sc Statistics', 'B.Sc Mathematics', 'B.Com', 'BBA', 'MCA', 'Data Science'],
    interestTags: ['data analysis', 'problem solving', 'business', 'artificial intelligence'],
    requiredSkills: [
      { skillName: 'sql', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'python', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'excel', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'statistics', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'power-bi', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'data-visualization', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'data-cleaning', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'generative-ai', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'problem-solving', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 4. UI/UX Designer ──────────────────────────────────────
  {
    title: 'UI/UX Designer',
    slug: 'ui-ux-designer',
    shortDescription: 'Craft empathetic user experiences, wireframes, and polished design systems.',
    longDescription:
      'UI/UX Designers conduct user research, synthesize user journeys, and construct accessible, intuitive digital workflows. Using Figma, they produce high-fidelity component libraries, interactive prototypes, and cohesive visual designs that harmonize usability, aesthetic appeal, and business goals before engineering begins.',
    category: 'design',
    icon: 'bi-palette-fill',
    color: '#EC4899', // Pink
    educationPreferences: ['B.Des', 'BCA', 'B.Tech', 'B.Sc Visual Communication', 'B.A. Multimedia', 'Fine Arts'],
    interestTags: ['design', 'web development', 'app development', 'gaming'],
    requiredSkills: [
      { skillName: 'figma', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'wireframing', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'prototyping', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'visual-design', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'user-research', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'communication', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 5. Cybersecurity Analyst ───────────────────────────────
  {
    title: 'Cybersecurity Analyst',
    slug: 'cybersecurity-analyst',
    shortDescription: 'Defend networks, systems, and enterprise applications from vulnerabilities and cyber threats.',
    longDescription:
      'Cybersecurity Analysts monitor network traffic, identify configuration flaws, perform threat modeling, and ensure software systems adhere to defensive security benchmarks such as OWASP. Operating on Linux and command-line toolsets, they investigate security alerts, configure firewalls, and fortify enterprise infrastructure against exploits.',
    category: 'security',
    icon: 'bi-shield-lock-fill',
    color: '#F59E0B', // Amber
    educationPreferences: ['BCA', 'B.Tech', 'B.E.', 'B.Sc Computer Science', 'B.Sc IT', 'MCA', 'Cybersecurity'],
    interestTags: ['cybersecurity', 'problem solving', 'cloud computing', 'web development'],
    requiredSkills: [
      { skillName: 'networking', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'linux', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'cybersecurity-fundamentals', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'owasp-basics', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'ethical-hacking', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'docker', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'aws', importance: 'low', requiredProficiency: 'beginner' },
      { skillName: 'problem-solving', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 6. AI / Machine Learning Engineer ──────────────────────
  {
    title: 'AI / Machine Learning Engineer',
    slug: 'ai-ml-engineer',
    shortDescription: 'Architect, train, and deploy neural networks, foundation models, and LLM-powered autonomous systems.',
    longDescription:
      'AI & Machine Learning Engineers design and train predictive models and multi-layer neural networks using PyTorch and TensorFlow. They build Retrieval-Augmented Generation (RAG) pipelines with LangChain, fine-tune open-source LLMs, engineer vector embeddings, and operationalize high-performance ML inference endpoints for real-world enterprise applications.',
    category: 'ai',
    icon: 'bi-cpu-fill',
    color: '#8B5CF6', // Violet
    educationPreferences: ['B.Tech', 'B.E.', 'BCA', 'MCA', 'B.Sc Computer Science', 'Data Science', 'Artificial Intelligence'],
    interestTags: ['artificial intelligence', 'data analysis', 'problem solving', 'coding', 'app development'],
    requiredSkills: [
      { skillName: 'python', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'pytorch', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'tensorflow', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'scikit-learn', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'generative-ai', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'langchain', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'deep-learning', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'pandas', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'git', importance: 'low', requiredProficiency: 'beginner' },
    ],
  },

  // ── 7. DevOps & Cloud Engineer ─────────────────────────────
  {
    title: 'DevOps & Cloud Engineer',
    slug: 'devops-cloud-engineer',
    shortDescription: 'Automate multi-cloud infrastructure, CI/CD pipelines, and high-availability container clusters.',
    longDescription:
      'DevOps Engineers bridge software development and cloud operations. They orchestrate resilient microservice clusters using Kubernetes and Docker, declare reproducible cloud infrastructure using Terraform on AWS, and architect automated GitHub Actions CI/CD pipelines to guarantee zero-downtime deployments at global scale.',
    category: 'cloud',
    icon: 'bi-cloud-check-fill',
    color: '#06B6D4', // Cyan
    educationPreferences: ['B.Tech', 'B.E.', 'BCA', 'MCA', 'Information Technology', 'Computer Engineering'],
    interestTags: ['cloud computing', 'problem solving', 'cybersecurity', 'web development'],
    requiredSkills: [
      { skillName: 'aws', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'docker', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'kubernetes', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'linux', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'terraform', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'ci-cd', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'networking', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'git', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'github', importance: 'low', requiredProficiency: 'beginner' },
    ],
  },

  // ── 8. Mobile App Developer ────────────────────────────────
  {
    title: 'Mobile App Developer',
    slug: 'mobile-app-developer',
    shortDescription: 'Build high-performance, fluid native and cross-platform apps for iOS and Android devices.',
    longDescription:
      'Mobile App Developers craft silky smooth, responsive mobile experiences using Flutter, Dart, and React Native. They integrate cloud authentication and real-time NoSQL storage via Firebase, connect backend RESTful APIs, manage mobile state architectures, and publish polished applications to the Google Play Store and Apple App Store.',
    category: 'mobile',
    icon: 'bi-phone-fill',
    color: '#3B82F6', // Blue
    educationPreferences: ['BCA', 'B.Tech', 'B.E.', 'B.Sc Computer Science', 'MCA', 'App Development'],
    interestTags: ['app development', 'web development', 'design', 'problem solving'],
    requiredSkills: [
      { skillName: 'flutter', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'dart', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'react-native', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'javascript', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'firebase', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'rest-apis', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'wireframing', importance: 'low', requiredProficiency: 'beginner' },
      { skillName: 'git', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 9. Backend Engineer ────────────────────────────────────
  {
    title: 'Backend Engineer',
    slug: 'backend-engineer',
    shortDescription: 'Design high-throughput distributed microservices, caching layers, and enterprise databases.',
    longDescription:
      'Backend Engineers architect the resilient server engines that power enterprise platforms. They write high-performance microservices in Java Spring Boot and Node.js, manage relational schemas in PostgreSQL and NoSQL in MongoDB, accelerate read-heavy queries with Redis caching, and coordinate event-driven streams using Apache Kafka.',
    category: 'development',
    icon: 'bi-server',
    color: '#6366F1', // Indigo
    educationPreferences: ['B.Tech', 'B.E.', 'BCA', 'MCA', 'B.Sc Computer Science', 'Computer Engineering'],
    interestTags: ['web development', 'problem solving', 'cloud computing', 'coding'],
    requiredSkills: [
      { skillName: 'java', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'spring-boot', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'node.js', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'express.js', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'postgresql', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'mongodb', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'redis', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'rest-apis', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'kafka', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'docker', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 10. Data Scientist ─────────────────────────────────────
  {
    title: 'Data Scientist',
    slug: 'data-scientist',
    shortDescription: 'Uncover hidden patterns, build statistical models, and extract high-value insights from big data.',
    longDescription:
      'Data Scientists combine statistical rigor, mathematical algorithms, and programming to extract actionable value from massive complex datasets. They engineer exploratory pipelines in Pandas and NumPy, build predictive classification and regression models in Scikit-Learn, and construct deep neural networks for computer vision and NLP.',
    category: 'data',
    icon: 'bi-graph-up-arrow',
    color: '#10B981', // Emerald
    educationPreferences: ['B.Tech', 'B.Sc Statistics', 'B.Sc Mathematics', 'Data Science', 'MCA', 'BCA', 'Artificial Intelligence'],
    interestTags: ['data analysis', 'artificial intelligence', 'problem solving', 'business'],
    requiredSkills: [
      { skillName: 'python', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'sql', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'statistics', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'scikit-learn', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'pandas', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'data-visualization', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'data-cleaning', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'deep-learning', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'power-bi', importance: 'low', requiredProficiency: 'beginner' },
    ],
  },

  // ── 11. QA Automation Engineer ─────────────────────────────
  {
    title: 'QA Automation Engineer',
    slug: 'qa-automation-engineer',
    shortDescription: 'Guarantee rock-solid software quality through automated end-to-end testing and CI/CD validation.',
    longDescription:
      'QA Automation Engineers architect comprehensive testing frameworks that validate modern web applications across multiple viewports and browsers. They write resilient end-to-end test suites in Cypress, Playwright, and Selenium, conduct rigorous API contract testing in Postman, and integrate automated regression suites into CI/CD pipelines.',
    category: 'testing',
    icon: 'bi-check2-circle',
    color: '#14B8A6', // Teal
    educationPreferences: ['BCA', 'B.Tech', 'B.E.', 'B.Sc IT', 'MCA', 'Computer Science'],
    interestTags: ['problem solving', 'web development', 'app development', 'coding'],
    requiredSkills: [
      { skillName: 'cypress', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'playwright', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'selenium', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'postman', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'javascript', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'python', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'ci-cd', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'git', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'problem-solving', importance: 'high', requiredProficiency: 'intermediate' },
    ],
  },

  // ── 12. Game Developer ─────────────────────────────────────
  {
    title: 'Game Developer',
    slug: 'game-developer',
    shortDescription: 'Program immersive 2D/3D gameplay mechanics, physics simulations, and interactive virtual worlds.',
    longDescription:
      'Game Developers bring virtual worlds to life by engineering gameplay mechanics, particle effects, player physics, and audio engines. Using Unity (C#) and Unreal Engine 5 (C++), they build high-fidelity interactive experiences, optimize frame rate budgets, manage asset pipelines, and publish cross-platform desktop and mobile games.',
    category: 'gaming',
    icon: 'bi-controller',
    color: '#F43F5E', // Rose
    educationPreferences: ['B.Tech', 'B.E.', 'BCA', 'B.Sc Gaming & Animation', 'MCA', 'Computer Science'],
    interestTags: ['gaming', 'design', 'app development', 'problem solving'],
    requiredSkills: [
      { skillName: 'unity', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'csharp', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'unreal-engine', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'cpp', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'visual-design', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'problem-solving', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'git', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 13. Blockchain & Web3 Developer ────────────────────────
  {
    title: 'Blockchain & Web3 Developer',
    slug: 'blockchain-web3-developer',
    shortDescription: 'Build decentralized applications, trustless smart contracts, and cryptographic protocols.',
    longDescription:
      'Blockchain Developers build on the Ethereum Virtual Machine (EVM) and decentralized networks. They write secure, gas-optimized smart contracts in Solidity, connect decentralized web frontends using Web3.js and Ethers.js, implement ERC token standards, and audit smart contract security vulnerabilities to prevent financial exploits.',
    category: 'web3',
    icon: 'bi-link-45deg',
    color: '#F59E0B', // Amber
    educationPreferences: ['B.Tech', 'B.E.', 'BCA', 'MCA', 'B.Sc Computer Science', 'Cybersecurity'],
    interestTags: ['web development', 'cybersecurity', 'problem solving', 'cloud computing'],
    requiredSkills: [
      { skillName: 'solidity', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'smart-contracts', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'web3js', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'javascript', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'node.js', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'cybersecurity-fundamentals', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'rest-apis', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'git', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },

  // ── 14. Cloud Security & DevSecOps Engineer ─────────────────
  {
    title: 'Cloud Security & DevSecOps Engineer',
    slug: 'cloud-security-engineer',
    shortDescription: 'Integrate security automation into cloud pipelines, enforce zero-trust, and harden infrastructure.',
    longDescription:
      'Cloud Security & DevSecOps Engineers bake security into every stage of the software delivery lifecycle. They enforce Zero Trust IAM policies on AWS, scan container images in Docker and Kubernetes for zero-day vulnerabilities, implement OWASP defense-in-depth, and conduct automated penetration testing inside CI/CD pipelines.',
    category: 'security',
    icon: 'bi-shield-check',
    color: '#EF4444', // Red
    educationPreferences: ['B.Tech', 'B.E.', 'BCA', 'MCA', 'Cybersecurity', 'Information Technology'],
    interestTags: ['cybersecurity', 'cloud computing', 'problem solving', 'web development'],
    requiredSkills: [
      { skillName: 'cybersecurity-fundamentals', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'linux', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'networking', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'aws', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'docker', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'owasp-basics', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'ethical-hacking', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'ci-cd', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },

  // ── 15. Technical Product Manager ──────────────────────────
  {
    title: 'Technical Product Manager',
    slug: 'technical-product-manager',
    domain: 'engineering',
    shortDescription: 'Bridge business strategy, user experience, and technical architecture to deliver high-impact software.',
    longDescription:
      'Technical Product Managers define product strategy, craft detailed Product Requirement Documents (PRDs), and prioritize roadmaps using Agile/Scrum sprint frameworks. They translate complex user research into actionable JIRA user stories, partner with engineering leads on architectural feasibility, and analyze product KPIs to maximize user value.',
    category: 'product',
    icon: 'bi-kanban-fill',
    color: '#EAB308', // Yellow Gold
    educationPreferences: ['B.Tech', 'BCA', 'BBA', 'MBA', 'MCA', 'Product Management', 'Computer Science'],
    interestTags: ['business', 'design', 'problem solving', 'artificial intelligence'],
    requiredSkills: [
      { skillName: 'product-management', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'agile-scrum', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'user-stories', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'user-research', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'communication', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'problem-solving', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'statistics', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'wireframing', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },

  // ============================================================
  // SECTION 2: 💼 BUSINESS, FINANCE & CORPORATE OPERATIONS
  // ============================================================
  {
    title: 'Financial Analyst & Modeler',
    slug: 'financial-analyst',
    domain: 'business',
    shortDescription: 'Evaluate corporate valuation, forecast three-statement models, and guide investment decisions with financial data.',
    longDescription:
      'Financial Analysts construct robust financial models, analyze balance sheets and cash flows, evaluate investment prospects with DCF methodologies, and synthesize executive reporting in Excel and Power BI.',
    category: 'finance',
    icon: 'bi-cash-coin',
    color: '#F59E0B', // Gold
    educationPreferences: ['B.Com', 'BBA', 'MBA', 'Economics', 'Finance', 'B.Sc Mathematics', 'Commerce'],
    interestTags: ['financial modeling', 'finance', 'business', 'data analysis', 'valuation', 'excel'],
    requiredSkills: [
      { skillName: 'financial-modeling', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'dcf-valuation', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'accounting', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'excel', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'power-bi', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'communication', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'problem-solving', importance: 'high', requiredProficiency: 'intermediate' },
    ],
  },
  {
    title: 'Business Operations Manager',
    slug: 'business-operations-manager',
    domain: 'business',
    shortDescription: 'Optimize cross-department workflows, manage revenue operations, and drive operational KPI growth.',
    longDescription:
      'Business Operations Managers streamline internal processes, track company-wide performance metrics, facilitate cross-functional execution between product, sales, and finance teams, and build automated reporting systems.',
    category: 'business',
    icon: 'bi-briefcase-fill',
    color: '#D97706',
    educationPreferences: ['BBA', 'MBA', 'B.Com', 'Economics', 'Management', 'B.Tech'],
    interestTags: ['operations', 'business', 'strategy', 'problem solving', 'management'],
    requiredSkills: [
      { skillName: 'business-operations', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'agile-scrum', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'excel', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'communication', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'problem-solving', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'teamwork', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },
  {
    title: 'Management Consultant',
    slug: 'management-consultant',
    domain: 'business',
    shortDescription: 'Solve high-stakes strategic roadblocks, formulate market entry plans, and advise executive leadership.',
    longDescription:
      'Management Consultants deconstruct complex corporate challenges into structured hypotheses. They conduct comprehensive market research, build quantitative decision models, and formulate strategic decks to transform enterprise performance.',
    category: 'business',
    icon: 'bi-pie-chart-fill',
    color: '#B45309',
    educationPreferences: ['MBA', 'BBA', 'B.Com', 'Economics', 'B.Tech', 'Management'],
    interestTags: ['consulting', 'business strategy', 'market research', 'problem solving', 'finance'],
    requiredSkills: [
      { skillName: 'management-consulting', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'market-research', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'financial-modeling', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'communication', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'problem-solving', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'excel', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },

  // ============================================================
  // SECTION 3: 📈 DIGITAL MARKETING & GROWTH
  // ============================================================
  {
    title: 'Performance Marketer & Media Buyer',
    slug: 'performance-marketer',
    domain: 'marketing',
    shortDescription: 'Scale customer acquisition through data-driven paid advertising across Meta, Google Ads, and TikTok.',
    longDescription:
      'Performance Marketers design, execute, and analyze paid media campaigns across Meta Ads Manager and Google Ads. They optimize conversion funnels, run multi-variant creative tests, and lower customer acquisition cost (CAC) while scaling return on ad spend (ROAS).',
    category: 'marketing',
    icon: 'bi-bullseye',
    color: '#10B981', // Emerald
    educationPreferences: ['BBA', 'B.Com', 'B.A. Mass Comm', 'Marketing', 'Digital Marketing'],
    interestTags: ['digital marketing', 'advertising', 'growth', 'data analysis'],
    requiredSkills: [
      { skillName: 'meta-ads', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'google-ads', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'google-analytics', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'excel', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'communication', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },
  {
    title: 'SEO & Organic Growth Strategist',
    slug: 'seo-growth-strategist',
    domain: 'marketing',
    shortDescription: 'Drive compounding organic search traffic through technical indexing, search intent, and content hubs.',
    longDescription:
      'SEO Strategists audit technical crawlability, design content architecture tailored to high-intent keywords, conduct competitive backlink research, and optimize search performance using Google Search Console and analytics.',
    category: 'marketing',
    icon: 'bi-search',
    color: '#059669',
    educationPreferences: ['BBA', 'B.Com', 'B.A.', 'Marketing', 'BCA', 'Information Technology'],
    interestTags: ['seo', 'digital marketing', 'content', 'growth', 'analytics', 'aeo', 'ai search', 'baidu seo'],
    requiredSkills: [
      { skillName: 'seo', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'technical-seo', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'aeo', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'baidu-seo', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'content-marketing', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'google-analytics', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'html', importance: 'low', requiredProficiency: 'beginner' },
      { skillName: 'communication', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },
  {
    title: 'Social Media & Content Growth Manager',
    slug: 'social-media-growth-manager',
    domain: 'marketing',
    shortDescription: 'Build engaged brand communities and master short-form viral storytelling across social algorithms.',
    longDescription:
      'Social Media Managers develop editorial calendars, craft thumb-stopping short-form hooks, engage online communities, analyze reach and engagement analytics, and convert brand attention into loyal customer advocates.',
    category: 'marketing',
    icon: 'bi-megaphone-fill',
    color: '#047857',
    educationPreferences: ['B.A. Mass Comm', 'BBA', 'B.Com', 'Marketing', 'Media & Journalism', 'English'],
    interestTags: ['social media', 'content creation', 'viral growth', 'branding', 'storytelling'],
    requiredSkills: [
      { skillName: 'social-media-growth', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'content-marketing', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'copywriting', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'visual-design', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'communication', importance: 'high', requiredProficiency: 'advanced' },
    ],
  },

  // ============================================================
  // SECTION 4: 🎨 DESIGN & CREATIVE MEDIA
  // ============================================================
  {
    title: 'Brand & Visual Identity Designer',
    slug: 'brand-identity-designer',
    domain: 'creative',
    shortDescription: 'Design cohesive corporate identities, typography systems, vector logos, and brand guidelines.',
    longDescription:
      'Brand Designers craft visual identities that define company personalities. Using Adobe Illustrator and Figma, they create vector logo marks, color systems, typography pairings, collateral mockups, and comprehensive brand books.',
    category: 'design',
    icon: 'bi-vector-pen',
    color: '#8B5CF6', // Purple
    educationPreferences: ['B.Des', 'B.A. Fine Arts', 'Visual Communication', 'Multimedia', 'Design'],
    interestTags: ['branding', 'design', 'visual design', 'creative media', 'illustration'],
    requiredSkills: [
      { skillName: 'brand-identity', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'adobe-illustrator', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'figma', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'typography', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'visual-design', importance: 'high', requiredProficiency: 'advanced' },
    ],
  },
  {
    title: 'Motion Graphics & 3D Designer',
    slug: 'motion-3d-designer',
    domain: 'creative',
    shortDescription: 'Bring visual assets to life with kinetic typography, 3D modeling, and dynamic motion animations.',
    longDescription:
      'Motion & 3D Designers produce engaging visual sequences for marketing videos, product launches, and interactive digital interfaces using Adobe After Effects and Blender. They master keyframing, lighting, and spatial composition.',
    category: 'design',
    icon: 'bi-film',
    color: '#7C3AED',
    educationPreferences: ['B.Des', 'B.Sc Animation', 'Multimedia', 'Visual Arts', 'Fine Arts'],
    interestTags: ['motion graphics', '3d modeling', 'design', 'video production', 'animation'],
    requiredSkills: [
      { skillName: 'motion-graphics', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'blender', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'visual-design', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'prototyping', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'communication', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },
  {
    title: 'B2B Technical & Creative Copywriter',
    slug: 'copywriter-content-strategist',
    domain: 'creative',
    shortDescription: 'Craft persuasive, high-converting copy for landing pages, product messaging, and technical case studies.',
    longDescription:
      'Copywriters translate intricate product capabilities into clear, persuasive, customer-centric narratives. They write high-converting landing page headlines, pitch decks, case studies, and email sequences that drive engagement and revenue.',
    category: 'design',
    icon: 'bi-pen-fill',
    color: '#6D28D9',
    educationPreferences: ['B.A. English', 'B.A. Mass Comm', 'Journalism', 'BBA', 'Marketing'],
    interestTags: ['copywriting', 'storytelling', 'creative writing', 'branding', 'marketing'],
    requiredSkills: [
      { skillName: 'copywriting', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'content-marketing', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'market-research', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'communication', importance: 'high', requiredProficiency: 'advanced' },
      { skillName: 'problem-solving', importance: 'medium', requiredProficiency: 'intermediate' },
    ],
  },
];

module.exports = careersData;

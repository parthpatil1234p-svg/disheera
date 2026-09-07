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
      { skillName: 'responsive-design', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'bootstrap', importance: 'medium', requiredProficiency: 'beginner' },
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
      { skillName: 'node.js', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'express.js', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'mongodb', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'rest-apis', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'authentication', importance: 'medium', requiredProficiency: 'intermediate' },
      { skillName: 'html', importance: 'medium', requiredProficiency: 'beginner' },
      { skillName: 'css', importance: 'medium', requiredProficiency: 'beginner' },
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
      { skillName: 'excel', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'statistics', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'power-bi', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'data-visualization', importance: 'high', requiredProficiency: 'intermediate' },
      { skillName: 'data-cleaning', importance: 'medium', requiredProficiency: 'intermediate' },
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
      { skillName: 'problem-solving', importance: 'medium', requiredProficiency: 'beginner' },
    ],
  },
];

module.exports = careersData;

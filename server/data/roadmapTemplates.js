/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * data/roadmapTemplates.js — Curated Curriculum Templates for 5 Core Careers
 *
 * Provides deterministic, structured weekly tasks for:
 *  - 4 Weeks: Core skill building, practical exercises, and a portfolio project
 *  - 8 Weeks: Extended intermediate mastery, secondary project, and mock assessment
 *  - 12 Weeks: Advanced capstone, deployment, interview preparation, and portfolio readiness
 */

const roadmapTemplates = {
  // ── 1. Front-End Developer ─────────────────────────────────
  'front-end-developer': {
    title: 'Front-End Developer',
    category: 'development',
    weeks: [
      // Week 1: Semantic HTML5 & Modern Responsive CSS
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Master HTML5 Semantic Structure & Accessibility',
            description: 'Learn semantic elements (main, nav, article, section) and basic ARIA landmark rules for web accessibility.',
            type: 'learn',
            skillName: 'html',
            priority: 'high',
            estimatedHours: 4,
            isVideoTask: true,
            videoDurationSeconds: 720,
            resource: {
              title: 'HTML & CSS Crash Course for Beginners',
              url: 'https://www.youtube.com/watch?v=mU6anWqZJcc',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'CSS Flexbox & CSS Grid Mastery',
            description: 'Build flexible one-dimensional navigation bars and two-dimensional product card grids using pure modern CSS.',
            type: 'practice',
            skillName: 'css',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'A Complete Guide to Flexbox',
              url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
              provider: 'CSS-Tricks',
            },
          },
          {
            order: 3,
            title: 'Mobile-First Responsive Layout Challenge',
            description: 'Convert a static desktop layout into a mobile-first responsive web page using CSS media queries and fluid clamp typography.',
            type: 'practice',
            skillName: 'responsive-design',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'web.dev: Responsive Web Design Basics',
              url: 'https://web.dev/learn/design/responsive-web-design-basics',
              provider: 'web.dev (Google)',
            },
          },
        ],
      },

      // Week 2: JavaScript DOM, Events & Bootstrap 5
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'JavaScript DOM Manipulation & Event Handling',
            description: 'Deep dive into querySelector, event listeners, dynamic element creation, and form input validation using vanilla JavaScript.',
            type: 'learn',
            skillName: 'javascript',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 600,
            resource: {
              title: 'JavaScript DOM Manipulation - Full Tutorial for Beginners',
              url: 'https://www.youtube.com/watch?v=5fb2aPlgoys',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Rapid Prototyping with Bootstrap 5 Components',
            description: 'Implement modals, responsive navbars, accordions, and utilities using Bootstrap 5 framework without breaking custom CSS.',
            type: 'practice',
            skillName: 'bootstrap',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Bootstrap 5 Official Documentation',
              url: 'https://getbootstrap.com/docs/5.3/getting-started/introduction/',
              provider: 'Bootstrap',
            },
          },
        ],
      },

      // Week 3: Git Version Control & Interactive Project
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'Version Control Workflows with Git & GitHub',
            description: 'Initialize repositories, craft meaningful commits, handle branching, pull requests, and host code on GitHub.',
            type: 'learn',
            skillName: 'git',
            priority: 'medium',
            estimatedHours: 3,
            isVideoTask: true,
            videoDurationSeconds: 600,
            resource: {
              title: 'Git and GitHub for Beginners - Crash Course',
              url: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Project: Interactive Product Catalog Dashboard',
            description: 'Build a fully responsive product catalog featuring dynamic filtering, live search, and modal previews using HTML, CSS, and JS.',
            type: 'project',
            skillName: 'javascript',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'freeCodeCamp: Build an Interactive Web App Project',
              url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
              provider: 'freeCodeCamp',
            },
          },
        ],
      },

      // Week 4: Front-End Milestone Assessment & Deployment
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Front-End Knowledge & Code Quality Review',
            description: 'Evaluate semantics, Lighthouse performance scores, cross-browser compatibility, and fix code smells.',
            type: 'assessment',
            skillName: 'problem-solving',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'W3C HTML & CSS Markup Validation Service',
              url: 'https://validator.w3.org/',
              provider: 'W3C',
            },
          },
          {
            order: 2,
            title: 'Deploy to Vercel / GitHub Pages & Portfolio Publishing',
            description: 'Deploy your catalog project live to the web and document installation and architecture in a professional GitHub README.',
            type: 'practice',
            skillName: 'github',
            priority: 'medium',
            estimatedHours: 3,
            resource: {
              title: 'Vercel: Deploying Static Websites',
              url: 'https://vercel.com/docs/deployments/overview',
              provider: 'Vercel',
            },
          },
        ],
      },

      // Weeks 5–8 (Included for 8 & 12 Weeks Tracks)
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'Asynchronous JavaScript & RESTful API Fetching',
            description: 'Master async/await, Promises, error handling with try/catch, and connecting third-party public REST APIs.',
            type: 'learn',
            skillName: 'javascript',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'MDN: How to Use the Fetch API',
              url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
              provider: 'MDN Web Docs',
            },
          },
          {
            order: 2,
            title: 'Build a Live Weather / News Feed App',
            description: 'Consume a live public REST API to display real-time weather forecasts or news cards with loading skeletons.',
            type: 'practice',
            skillName: 'rest-apis',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'Public APIs Directory for Developers',
              url: 'https://github.com/public-apis/public-apis',
              provider: 'GitHub Open Source',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'Introduction to React & Component Lifecycle',
            description: 'Learn React JSX, components, props, state management with useState, and side effects with useEffect.',
            type: 'learn',
            skillName: 'react',
            priority: 'high',
            estimatedHours: 6,
            isVideoTask: true,
            videoDurationSeconds: 800,
            resource: {
              title: 'React 18 Full Course for Beginners',
              url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'React Single Page App Exercise',
            description: 'Build a task tracker or notes manager with dynamic state, filtering, and localStorage synchronization.',
            type: 'practice',
            skillName: 'react',
            priority: 'medium',
            estimatedHours: 6,
            resource: {
              title: 'React State Tutorial',
              url: 'https://react.dev/learn/state-a-components-memory',
              provider: 'React Official Docs',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Mid-Curriculum Milestone Project: Developer Portfolio Website',
            description: 'Architect a dark-mode personal developer portfolio highlighting your live projects, skills, and contact form.',
            type: 'project',
            skillName: 'responsive-design',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'freeCodeCamp: Personal Portfolio Webpage Project',
              url: 'https://www.freecodecamp.org/learn/responsive-web-design/',
              provider: 'freeCodeCamp',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'Frontend Performance & Accessibility (a11y) Audit',
            description: 'Audit your portfolio with Google Lighthouse for 90+ scores across Performance, Accessibility, Best Practices, and SEO.',
            type: 'assessment',
            skillName: 'problem-solving',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'web.dev: How to Measure and Improve Performance',
              url: 'https://web.dev/measure/',
              provider: 'web.dev (Google)',
            },
          },
        ],
      },

      // Weeks 9–12 (Included for 12 Weeks Track)
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Advanced React: Custom Hooks & Context API',
            description: 'Refactor app state using React Context, reducers, and write reusable custom hooks for API querying.',
            type: 'learn',
            skillName: 'react',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'React Context API Documentation',
              url: 'https://react.dev/learn/passing-data-deeply-with-context',
              provider: 'React Official Docs',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'Capstone Project Phase 1: Interactive Web App Design & Architecture',
            description: 'Scaffold an e-commerce storefront or collaboration tool with modular components, routing, and search parameters.',
            type: 'project',
            skillName: 'javascript',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'React Router Tutorial',
              url: 'https://reactrouter.com/en/main/start/tutorial',
              provider: 'React Router Docs',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'Capstone Project Phase 2: Polish, Optimization & CI/CD Pipeline',
            description: 'Implement automated linting, GitHub Actions workflow, bundle optimization, and production deployment.',
            type: 'project',
            skillName: 'git',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'GitHub Actions for Web Deployment',
              url: 'https://docs.github.com/en/actions',
              provider: 'GitHub Docs',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Frontend Technical Interview Prep & Resume Polish',
            description: 'Solve common frontend coding challenges (closures, debouncing, DOM manipulation) and finalize your developer resume.',
            type: 'assessment',
            skillName: 'communication',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Frontend Interview Handbook',
              url: 'https://www.frontendinterviewhandbook.com/',
              provider: 'Yangshun Tay / Tech Community',
            },
          },
        ],
      },
    ],
  },

  // ── 2. Full-Stack Developer ────────────────────────────────
  'full-stack-developer': {
    title: 'Full-Stack Developer',
    category: 'development',
    weeks: [
      // Week 1: Node.js, Express & REST Architecture
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Node.js Core Architecture & Express.js Setup',
            description: 'Understand the event loop, CommonJS modules, and construct an Express server with modular routing and request parsing.',
            type: 'learn',
            skillName: 'node.js',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 600,
            resource: {
              title: 'Node.js and Express.js - Full Course',
              url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Build a RESTful CRUD API with In-Memory Data',
            description: 'Implement GET, POST, PUT, DELETE endpoints following standard HTTP conventions and JSON response shapes.',
            type: 'practice',
            skillName: 'rest-apis',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Mozilla: HTTP Methods & Status Codes',
              url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
              provider: 'MDN Web Docs',
            },
          },
        ],
      },

      // Week 2: MongoDB Atlas & Mongoose Modeling
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'MongoDB Document Modeling with Mongoose',
            description: 'Define schemas, subdocuments, data validation, and indexes in Mongoose for robust data persistence.',
            type: 'learn',
            skillName: 'mongodb',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 600,
            resource: {
              title: 'MongoDB Full Tutorial for Beginners',
              url: 'https://www.youtube.com/watch?v=ofme2o29ngU',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Connect Express to MongoDB & Implement Queries',
            description: 'Replace in-memory data with Mongoose queries (find, findByIdAndUpdate, delete) and error handling middleware.',
            type: 'practice',
            skillName: 'mongodb',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'MongoDB University: Basics of Aggregation and CRUD',
              url: 'https://learn.mongodb.com/',
              provider: 'MongoDB',
            },
          },
        ],
      },

      // Week 3: Authentication & Security Middleware
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'JWT Authentication & Bcrypt Password Hashing',
            description: 'Implement user registration with salt-hashed passwords and stateless JWT token authentication middleware.',
            type: 'learn',
            skillName: 'authentication',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'JWT.io: Introduction to JSON Web Tokens',
              url: 'https://jwt.io/introduction',
              provider: 'Auth0 / JWT.io',
            },
          },
          {
            order: 2,
            title: 'Project: Full-Stack Note Taking API with Protected Routes',
            description: 'Create a complete backend API where users can authenticate and manage their private notes securely.',
            type: 'project',
            skillName: 'express.js',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'freeCodeCamp: Back End Development and APIs',
              url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/',
              provider: 'freeCodeCamp',
            },
          },
        ],
      },

      // Week 4: Frontend Integration & Deployment
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Connect Frontend Client to Backend REST API',
            description: 'Implement client-side fetch calls, Bearer token storage in localStorage, and dynamic rendering of server data.',
            type: 'practice',
            skillName: 'javascript',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'MDN: Using Fetch with Auth Headers',
              url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#supplying_request_options',
              provider: 'MDN Web Docs',
            },
          },
          {
            order: 2,
            title: 'Deploy Full-Stack App to Render & Vercel',
            description: 'Deploy Express backend to Render with environment variables and host static frontend on Vercel with CORS configured.',
            type: 'assessment',
            skillName: 'github',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Render: Deploy a Node.js Express App',
              url: 'https://render.com/docs/deploy-node-express-app',
              provider: 'Render Docs',
            },
          },
        ],
      },

      // Weeks 5–8 (8 & 12 Weeks)
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'Relational Database Concepts with SQL & MySQL',
            description: 'Learn SQL schema design, foreign keys, inner/outer joins, and compare relational vs document database trade-offs.',
            type: 'learn',
            skillName: 'sql',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'SQL Tutorial for Beginners',
              url: 'https://www.w3schools.com/sql/',
              provider: 'W3Schools',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'API Security Hardening: Helmet, Rate Limiting & Input Sanitization',
            description: 'Prevent NoSQL injection, brute force login attacks, and XSS by enforcing middleware security guards.',
            type: 'practice',
            skillName: 'authentication',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'OWASP Node.js Security Cheat Sheet',
              url: 'https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html',
              provider: 'OWASP',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Project: Multi-User Collaboration Board',
            description: 'Develop a Kanban-style board with user authentication, team workspaces, drag-and-drop tasks, and MongoDB transactions.',
            type: 'project',
            skillName: 'mongodb',
            priority: 'high',
            estimatedHours: 9,
            resource: {
              title: 'freeCodeCamp: Full Stack Project Guidelines',
              url: 'https://www.freecodecamp.org/news/how-to-build-a-fullstack-app/',
              provider: 'freeCodeCamp',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'Midterm Code Review & API Documentation with Postman',
            description: 'Publish a complete Postman Collection or Swagger OpenAPI spec for all API routes.',
            type: 'assessment',
            skillName: 'rest-apis',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Postman: Documenting Your APIs',
              url: 'https://learning.postman.com/docs/publishing-your-api/documenting-your-api/',
              provider: 'Postman Learning',
            },
          },
        ],
      },

      // Weeks 9–12 (12 Weeks)
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Caching Strategies with Redis & Query Optimization',
            description: 'Optimize high-traffic database queries using in-memory caching and Mongoose lean() queries.',
            type: 'learn',
            skillName: 'database-design',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Redis University: Fast Data Caching',
              url: 'https://university.redis.com/',
              provider: 'Redis',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'Capstone Project Phase 1: SaaS Application Architecture',
            description: 'Architect a production-grade full-stack SaaS MVP (e.g. Learning Management or Job Board).',
            type: 'project',
            skillName: 'node.js',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'Architecting Scalable Web Applications',
              url: 'https://aws.amazon.com/architecture/well-architected/',
              provider: 'AWS Architecture Center',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'Capstone Project Phase 2: Polish, Testing & Deployment',
            description: 'Write Jest integration tests for endpoints, optimize database indexes, and finalize production deployment.',
            type: 'project',
            skillName: 'problem-solving',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Testing Express Apps with Jest & Supertest',
              url: 'https://jestjs.io/docs/getting-started',
              provider: 'Jest Docs',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Full-Stack Technical Interview & System Design Prep',
            description: 'Practice system design questions (design TinyURL, scale a database) and technical interview mock rounds.',
            type: 'assessment',
            skillName: 'communication',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'System Design Primer',
              url: 'https://github.com/donnemartin/system-design-primer',
              provider: 'GitHub Open Source',
            },
          },
        ],
      },
    ],
  },

  // ── 3. Data Analyst ────────────────────────────────────────
  'data-analyst': {
    title: 'Data Analyst',
    category: 'data',
    weeks: [
      // Week 1: Excel Mastery & Analytical Thinking
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Advanced Excel Formulas: VLOOKUP, XLOOKUP & INDEX/MATCH',
            description: 'Clean and manipulate tabular datasets using modern Excel lookup functions and logical formulas.',
            type: 'learn',
            skillName: 'excel',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Microsoft Support: Advanced Excel Formulas',
              url: 'https://support.microsoft.com/en-us/office/excel-functions-by-category-5f91f4e9-7b42-46d2-9bd1-63f26a86c0eb',
              provider: 'Microsoft Learn',
            },
          },
          {
            order: 2,
            title: 'Pivot Tables, Slicers & Dynamic Summary Reports',
            description: 'Aggregate large retail transactions into interactive summary reports with grouping, calculated fields, and slicers.',
            type: 'practice',
            skillName: 'excel',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Microsoft Learn: Create a Pivot Table to Analyze Data',
              url: 'https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576',
              provider: 'Microsoft Learn',
            },
          },
        ],
      },

      // Week 2: SQL Querying for Data Analysis
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'SQL Fundamentals: SELECT, WHERE, GROUP BY & HAVING',
            description: 'Query database tables to filter records, aggregate sales numbers, and extract key business metrics.',
            type: 'learn',
            skillName: 'sql',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 600,
            resource: {
              title: 'SQL Tutorial - Full Database Course for Beginners',
              url: 'https://www.youtube.com/watch?v=HXV3zeRR3h4',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Multi-Table Joins & Subqueries in SQL',
            description: 'Perform INNER, LEFT, and FULL joins across normalized tables to reconstruct unified analytical datasets.',
            type: 'practice',
            skillName: 'sql',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'SQL Joins Explained Interactively',
              url: 'https://sqlbolt.com/',
              provider: 'SQLBolt',
            },
          },
        ],
      },

      // Week 3: Statistics & Data Cleaning
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'Descriptive Statistics & Exploratory Data Analysis (EDA)',
            description: 'Calculate mean, median, standard deviation, percentiles, and identify outliers in real-world business data.',
            type: 'learn',
            skillName: 'statistics',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Khan Academy: Summarizing Quantitative Data',
              url: 'https://www.khanacademy.org/math/statistics-probability',
              provider: 'Khan Academy',
            },
          },
          {
            order: 2,
            title: 'Project: E-Commerce Customer Insights Report',
            description: 'Import, clean, and analyze an e-commerce customer transaction dataset to identify high-value customer cohorts.',
            type: 'project',
            skillName: 'data-cleaning',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Kaggle: Datasets for Data Analytics Practice',
              url: 'https://www.kaggle.com/datasets',
              provider: 'Kaggle',
            },
          },
        ],
      },

      // Week 4: Power BI Dashboards & Executive Presentation
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Building Interactive Dashboards in Power BI',
            description: 'Model data relationships, create DAX measures, and build visual KPI cards, line charts, and geo-maps.',
            type: 'practice',
            skillName: 'power-bi',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Microsoft Learn: Get Started with Power BI Desktop',
              url: 'https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-getting-started',
              provider: 'Microsoft Learn',
            },
          },
          {
            order: 2,
            title: 'Data Storytelling & Executive Summary Assessment',
            description: 'Translate raw statistical findings into 3 actionable recommendations for non-technical leadership.',
            type: 'assessment',
            skillName: 'problem-solving',
            priority: 'medium',
            estimatedHours: 3,
            resource: {
              title: 'Storytelling with Data Guide',
              url: 'https://www.storytellingwithdata.com/blog',
              provider: 'Storytelling with Data',
            },
          },
        ],
      },

      // Weeks 5–8 (8 & 12 Weeks)
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'Python for Data Analysis: Pandas & NumPy Basics',
            description: 'Load CSVs, inspect DataFrames, filter rows, handle null values, and apply vectorized math in Python.',
            type: 'learn',
            skillName: 'python',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Python Data Science Handbook',
              url: 'https://jakevdp.github.io/PythonDataScienceHandbook/',
              provider: 'O’Reilly Open Access',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'Data Visualization with Seaborn & Matplotlib',
            description: 'Create publication-grade histograms, boxplots, correlation heatmaps, and pair plots to uncover multivariate relationships.',
            type: 'practice',
            skillName: 'data-visualization',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'Seaborn Tutorial: Statistical Data Visualization',
              url: 'https://seaborn.pydata.org/tutorial.html',
              provider: 'Seaborn Documentation',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Project: End-to-End Sales Performance Dashboard',
            description: 'Connect SQL database to Power BI, implement automated refresh pipelines, and publish an interactive business report.',
            type: 'project',
            skillName: 'power-bi',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Power BI Guided Project',
              url: 'https://learn.microsoft.com/en-us/training/paths/model-data-power-bi/',
              provider: 'Microsoft Learn',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'SQL Window Functions & Advanced Metrics Assessment',
            description: 'Calculate running totals, moving averages, and ranks using ROW_NUMBER(), RANK(), and PARTITION BY.',
            type: 'assessment',
            skillName: 'sql',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'PostgreSQL: Window Functions Tutorial',
              url: 'https://www.postgresql.org/docs/current/tutorial-window.html',
              provider: 'PostgreSQL Docs',
            },
          },
        ],
      },

      // Weeks 9–12 (12 Weeks)
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Predictive Analytics: Simple Linear & Logistic Regression',
            description: 'Understand predictive modeling fundamentals with scikit-learn for forecasting churn and continuous metrics.',
            type: 'learn',
            skillName: 'statistics',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Scikit-Learn: Machine Learning in Python',
              url: 'https://scikit-learn.org/stable/getting_started.html',
              provider: 'Scikit-Learn',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'Capstone Project Phase 1: Multi-Source Data Pipeline & Wrangling',
            description: 'Extract data from multiple CSVs/APIs, cleanse anomalies, and load into a normalized database.',
            type: 'project',
            skillName: 'data-cleaning',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Data Wrangling with Pandas',
              url: 'https://pandas.pydata.org/docs/user_guide/10min.html',
              provider: 'Pandas Docs',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'Capstone Project Phase 2: Final Report, Visuals & Presentation',
            description: 'Synthesize the capstone analysis into an executive presentation deck and comprehensive GitHub write-up.',
            type: 'project',
            skillName: 'communication',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Communicating Data Findings Effectively',
              url: 'https://hbr.org/2013/04/how-to-tell-a-story-with-data',
              provider: 'Harvard Business Review',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Data Analyst Portfolio Review & SQL Interview Preparation',
            description: 'Solve real-world SQL case studies (LeetCode / StrataScratch problems) and polish your analytics GitHub portfolio.',
            type: 'assessment',
            skillName: 'problem-solving',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'StrataScratch: Data Science & SQL Interview Questions',
              url: 'https://www.stratascratch.com/',
              provider: 'StrataScratch',
            },
          },
        ],
      },
    ],
  },

  // ── 4. UI/UX Designer ──────────────────────────────────────
  'ui-ux-designer': {
    title: 'UI/UX Designer',
    category: 'design',
    weeks: [
      // Week 1: Design Fundamentals & User Empathy
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Foundations of UX: User Research & Persona Creation',
            description: 'Learn qualitative user interview methodologies, construct user empathy maps, and define target user personas.',
            type: 'learn',
            skillName: 'user-research',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Nielsen Norman Group: UX Research Basics',
              url: 'https://www.nngroup.com/articles/user-research-basics/',
              provider: 'Nielsen Norman Group',
            },
          },
          {
            order: 2,
            title: 'User Journeys & Information Architecture (IA)',
            description: 'Map out step-by-step user flows, friction points, and create hierarchical site maps for digital products.',
            type: 'practice',
            skillName: 'user-research',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Information Architecture 101 Guide',
              url: 'https://uxdesign.cc/information-architecture-for-designers-a-practical-guide-52b21aa1c1ec',
              provider: 'UX Collective',
            },
          },
        ],
      },

      // Week 2: Wireframing & Low-Fidelity Prototyping
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'Low-Fidelity Wireframing Principles',
            description: 'Sketch and wireframe mobile and desktop screen layouts focusing strictly on content hierarchy without color distractions.',
            type: 'practice',
            skillName: 'wireframing',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Figma: How to Create Wireframes',
              url: 'https://www.figma.com/resource-library/how-to-wireframe/',
              provider: 'Figma Resource Library',
            },
          },
          {
            order: 2,
            title: 'Visual Design Fundamentals: Typography & Spacing',
            description: 'Master the 8pt spatial grid system, typographic scale, vertical rhythm, and WCAG accessibility color contrast ratios.',
            type: 'learn',
            skillName: 'visual-design',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Refactoring UI: Practical Design Tips',
              url: 'https://www.refactoringui.com/',
              provider: 'Tailwind Labs / Refactoring UI',
            },
          },
        ],
      },

      // Week 3: Figma Prototyping & Design Systems
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'Figma Mastery: Auto Layout, Components & Variants',
            description: 'Construct responsive, dynamic Figma UI components using Auto Layout v4, state variants, and design tokens.',
            type: 'learn',
            skillName: 'figma',
            priority: 'high',
            estimatedHours: 6,
            isVideoTask: true,
            videoDurationSeconds: 600,
            resource: {
              title: 'Figma UI UX Design Essentials Full Course',
              url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Project: Mobile Banking or Fitness App Prototype',
            description: 'Design a 5-screen interactive, clickable mobile app prototype complete with onboarding, transactions, and micro-animations.',
            type: 'project',
            skillName: 'prototyping',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Figma: Creating Clickable Interactive Prototypes',
              url: 'https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma',
              provider: 'Figma Help Center',
            },
          },
        ],
      },

      // Week 4: Usability Testing & Case Study Presentation
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Conduct Guerrilla Usability Testing & Feedback Synthesis',
            description: 'Test your interactive prototype with 3 real users, record friction points, and iterate based on actionable feedback.',
            type: 'practice',
            skillName: 'user-research',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Steve Krug: Usability Testing Simplified',
              url: 'https://sensible.com/dont-make-me-think/',
              provider: 'Sensible UX',
            },
          },
          {
            order: 2,
            title: 'Publish UX Case Study Document on Behance / Notion',
            description: 'Structure your project as a professional case study detailing problem definition, research, wireframes, and final UI.',
            type: 'assessment',
            skillName: 'communication',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'How to Write a Compelling UX Case Study',
              url: 'https://uxdesign.cc/how-to-write-a-ux-case-study-that-gets-you-hired-74b0be3060f6',
              provider: 'UX Collective',
            },
          },
        ],
      },

      // Weeks 5–8 (8 & 12 Weeks)
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'Design Systems Architecture & Token Management',
            description: 'Build a scalable design system library in Figma covering typography, color variables, spacing tokens, and buttons.',
            type: 'learn',
            skillName: 'figma',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Design Systems Repo: Guides & Resources',
              url: 'https://designsystemsrepo.com/',
              provider: 'Design Systems Repo',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'Micro-Interactions & Smart Animate in Figma',
            description: 'Design delightful micro-animations: toggle switches, card expansions, animated loaders, and page view transitions.',
            type: 'practice',
            skillName: 'prototyping',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'Figma: Smart Animate Mastery',
              url: 'https://help.figma.com/hc/en-us/articles/360039818874-Smart-animate-layers-between-frames',
              provider: 'Figma Help Center',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Project: Web SaaS Dashboard Redesign',
            description: 'Redesign a complex desktop data dashboard focusing on data density, clean visual balance, and modern glassmorphism.',
            type: 'project',
            skillName: 'visual-design',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Dribbble: Dashboard Inspiration & Patterns',
              url: 'https://dribbble.com/tags/dashboard',
              provider: 'Dribbble Community',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'Accessibility (WCAG 2.1 AA) Compliance Audit',
            description: 'Evaluate color contrast, touch target sizes (minimum 44x44px), and keyboard focus rings for your designs.',
            type: 'assessment',
            skillName: 'visual-design',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'W3C: Web Content Accessibility Guidelines (WCAG) Overview',
              url: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
              provider: 'W3C WAI',
            },
          },
        ],
      },

      // Weeks 9–12 (12 Weeks)
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Design to Code Handoff: Inspecting CSS & Developer Collaboration',
            description: 'Learn dev handoff best practices: redlining, exporting SVGs, inspecting CSS properties, and writing component documentation.',
            type: 'learn',
            skillName: 'communication',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'Figma Dev Mode: Bridge Design & Code',
              url: 'https://www.figma.com/dev-mode/',
              provider: 'Figma',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'Capstone Phase 1: Full Product Discovery & High-Fidelity Specs',
            description: 'Execute discovery for a zero-to-one product idea (problem statement, competitive audit, wireframes, and design system).',
            type: 'project',
            skillName: 'user-research',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'Product Design Process from 0 to 1',
              url: 'https://www.interaction-design.org/literature/article/the-design-thinking-process',
              provider: 'Interaction Design Foundation',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'Capstone Phase 2: High-Fidelity Prototype & Video Walkthrough',
            description: 'Assemble the final clickable prototype and record a 3-minute video walkthrough explaining key design decisions.',
            type: 'project',
            skillName: 'prototyping',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'How to Present UI/UX Designs Professionally',
              url: 'https://uxdesign.cc/how-to-present-your-designs-effectively-b4618e470d9a',
              provider: 'UX Collective',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Design Portfolio Polish & Whiteboard Challenge Prep',
            description: 'Prepare for product design interviews: practice app critique exercises, portfolio defense, and whiteboard challenges.',
            type: 'assessment',
            skillName: 'communication',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Design Life: Product Design Portfolio Guide',
              url: 'https://www.bestfolios.com/',
              provider: 'Bestfolios',
            },
          },
        ],
      },
    ],
  },

  // ── 5. Cybersecurity Analyst ───────────────────────────────
  'cybersecurity-analyst': {
    title: 'Cybersecurity Analyst',
    category: 'security',
    weeks: [
      // Week 1: Network Fundamentals & Traffic Analysis
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Networking Fundamentals: OSI Model & TCP/IP Protocol Suite',
            description: 'Understand packet structures, IP addressing, subnets, DNS resolution, and core transport protocols (TCP vs UDP).',
            type: 'learn',
            skillName: 'networking',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 600,
            resource: {
              title: 'Computer Networking Full Course for Beginners',
              url: 'https://www.youtube.com/watch?v=IPvYjXCsTg8',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Inspect Network Packets with Wireshark',
            description: 'Capture live traffic, inspect HTTP headers, follow TCP streams, and analyze packet anomalies using Wireshark.',
            type: 'practice',
            skillName: 'networking',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Wireshark User Guide & Practice Captures',
              url: 'https://www.wireshark.org/docs/wsug_html_chunked/',
              provider: 'Wireshark Documentation',
            },
          },
        ],
      },

      // Week 2: Linux Administration & Defensive Command Line
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'Linux CLI Operations & File Permission Hardening',
            description: 'Navigate terminal, manage process logs (systemctl, journalctl), enforce chmod/chown permissions, and inspect /etc/passwd.',
            type: 'learn',
            skillName: 'linux',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Linux Journey: Grasshopper to Master',
              url: 'https://linuxjourney.com/',
              provider: 'Linux Journey',
            },
          },
          {
            order: 2,
            title: 'Bash Scripting for Security Log Auditing',
            description: 'Write a Bash shell script that parses authentication logs (/var/log/auth.log) and flags repeated failed SSH login attempts.',
            type: 'practice',
            skillName: 'linux',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'OverTheWire: Bandit Wargame for Linux Security',
              url: 'https://overthewire.org/wargames/bandit/',
              provider: 'OverTheWire',
            },
          },
        ],
      },

      // Week 3: Web Application Security & OWASP Top 10
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'OWASP Top 10 Web Security Vulnerabilities',
            description: 'Deep dive into SQL Injection, Cross-Site Scripting (XSS), Broken Access Control, and Insecure Direct Object References (IDOR).',
            type: 'learn',
            skillName: 'owasp-basics',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'OWASP Top 10 Web Application Security Risks',
              url: 'https://owasp.org/www-project-top-ten/',
              provider: 'OWASP Foundation',
            },
          },
          {
            order: 2,
            title: 'Project: Vulnerability Assessment & Mitigation Report',
            description: 'Audit a sample vulnerable web application, demonstrate the vulnerability safely in a sandbox, and write code patches.',
            type: 'project',
            skillName: 'ethical-hacking',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'OWASP Juice Shop: Security Sandbox Practice',
              url: 'https://owasp.org/www-project-juice-shop/',
              provider: 'OWASP Foundation',
            },
          },
        ],
      },

      // Week 4: Security Operations & Incident Response Assessment
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Firewall Rules, iptables & UFW Configuration',
            description: 'Configure software firewalls to block unauthorized ports, drop malformed packets, and permit only secure SSH and HTTPS traffic.',
            type: 'practice',
            skillName: 'cybersecurity-fundamentals',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Ubuntu Documentation: UFW (Uncomplicated Firewall)',
              url: 'https://help.ubuntu.com/community/UFW',
              provider: 'Ubuntu Community',
            },
          },
          {
            order: 2,
            title: 'Incident Response Simulation & Triage Assessment',
            description: 'Analyze an incident triage scenario, trace lateral movement from logs, and draft an incident containment playbook.',
            type: 'assessment',
            skillName: 'problem-solving',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'NIST Computer Security Incident Handling Guide',
              url: 'https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final',
              provider: 'NIST Special Publication',
            },
          },
        ],
      },

      // Weeks 5–8 (8 & 12 Weeks)
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'Cryptography Fundamentals: Symmetric, Asymmetric & Hashes',
            description: 'Understand AES, RSA, SHA-256, TLS handshake, public key infrastructure (PKI), and digital certificate chains.',
            type: 'learn',
            skillName: 'cybersecurity-fundamentals',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Cloudflare Learning: What is Cryptography?',
              url: 'https://www.cloudflare.com/learning/ssl/what-is-cryptography/',
              provider: 'Cloudflare Learning',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'Vulnerability Scanning with Nmap & OpenVAS',
            description: 'Perform authorized network service discovery, port enumeration, banner grabbing, and OS fingerprinting with Nmap.',
            type: 'practice',
            skillName: 'ethical-hacking',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Nmap Official Reference Guide',
              url: 'https://nmap.org/book/man.html',
              provider: 'Nmap.org',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Project: Automated Security Incident SIEM Dashboard',
            description: 'Set up an ELK / Wazuh log aggregator, configure rules for brute-force alerting, and visualize events on a dashboard.',
            type: 'project',
            skillName: 'cybersecurity-fundamentals',
            priority: 'high',
            estimatedHours: 9,
            resource: {
              title: 'Wazuh Open Source Security Platform',
              url: 'https://wazuh.com/',
              provider: 'Wazuh Documentation',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'SOC Analyst Threat Hunting & Log Analysis Assessment',
            description: 'Given raw web server and DNS logs, identify the attacker IP, timestamp of breach, data exfiltrated, and root cause.',
            type: 'assessment',
            skillName: 'problem-solving',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'TryHackMe: Pre-Security & SOC Level 1 Pathways',
              url: 'https://tryhackme.com/',
              provider: 'TryHackMe',
            },
          },
        ],
      },

      // Weeks 9–12 (12 Weeks)
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Cloud Security Fundamentals: AWS IAM & S3 Bucket Hardening',
            description: 'Audit cloud resource access, write least-privilege IAM policies, and configure encryption and access logging.',
            type: 'learn',
            skillName: 'cybersecurity-fundamentals',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'AWS Security Best Practices Guide',
              url: 'https://aws.amazon.com/security/security-learning/',
              provider: 'AWS Training',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'Capstone Phase 1: Security Posture Assessment of Enterprise Network',
            description: 'Execute full threat model (STRIDE), network architecture review, and identify configuration weaknesses.',
            type: 'project',
            skillName: 'networking',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Microsoft Threat Modeling Tool & STRIDE Methodology',
              url: 'https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool',
              provider: 'Microsoft Learn',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'Capstone Phase 2: Remediation Playbook & Defense Hardening',
            description: 'Implement defensive countermeasures, automated IDS/IPS alert rules, and draft a formal executive remediation audit.',
            type: 'project',
            skillName: 'linux',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'CIS Benchmarks: Security Hardening Guidelines',
              url: 'https://www.cisecurity.org/cis-benchmarks',
              provider: 'Center for Internet Security',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Security+ Certification Readiness & Technical Interview Mock',
            description: 'Review CompTIA Security+ / CEH core domains, practice defense-in-depth scenarios, and finalize portfolio.',
            type: 'assessment',
            skillName: 'communication',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Professor Messer: CompTIA Security+ Training Course',
              url: 'https://www.professormesser.com/',
              provider: 'Professor Messer',
            },
          },
        ],
      },
    ],
  },

  // ── 6. AI / Machine Learning Engineer & Autonomous Agents ────
  'ai-ml-engineer': {
    title: 'AI / Machine Learning Engineer',
    category: 'ai-data',
    weeks: [
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Master Python for AI & Numerical Vectorization',
            description: 'Learn NumPy multi-dimensional array operations, vectorization, and Pandas DataFrame data cleaning pipelines.',
            type: 'learn',
            skillName: 'python',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 780,
            resource: {
              title: 'Python for Data Science & Machine Learning Bootcamp',
              url: 'https://www.youtube.com/watch?v=eWRfhZUzrAc',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Mathematics of AI: Linear Algebra & Matrix Transformations',
            description: 'Master dot products, matrix multiplications, eigenvalues, and gradient descent optimization basics.',
            type: 'practice',
            skillName: 'mathematics',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: '3Blue1Brown: Essence of Linear Algebra',
              url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
              provider: '3Blue1Brown',
            },
          },
        ],
      },
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'Transformer Architecture & Foundation LLM Mechanics',
            description: 'Study self-attention mechanisms, tokenization (BPE), temperature sampling, context windows, and KV cache principles.',
            type: 'learn',
            skillName: 'machine-learning',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 720,
            resource: {
              title: 'The Illustrated Transformer by Jay Alammar',
              url: 'https://jalammar.github.io/illustrated-transformer/',
              provider: 'Jay Alammar',
              mediaType: 'doc',
            },
          },
          {
            order: 2,
            title: 'Advanced Prompt Engineering & Chain-of-Thought (CoT)',
            description: 'Build robust prompt pipelines using few-shot exemplars, role-based system prompts, and Chain-of-Thought reasoning.',
            type: 'practice',
            skillName: 'prompt-engineering',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'DAIR.AI: Prompt Engineering Guide',
              url: 'https://www.promptingguide.ai/',
              provider: 'DAIR.AI',
            },
          },
        ],
      },
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'Vector Embeddings & Semantic Similarity Search',
            description: 'Generate high-dimensional vector embeddings with OpenAI/Gemini models and calculate cosine similarity scores.',
            type: 'learn',
            skillName: 'vector-embeddings',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'OpenAI Embeddings Guide & Best Practices',
              url: 'https://platform.openai.com/docs/guides/embeddings',
              provider: 'OpenAI Docs',
            },
          },
          {
            order: 2,
            title: 'Vector Databases: ChromaDB & Pinecone Hands-On',
            description: 'Initialize a vector database collection, insert text embeddings with metadata tags, and query top-k nearest neighbors.',
            type: 'practice',
            skillName: 'vector-databases',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'ChromaDB Getting Started Guide',
              url: 'https://docs.trychroma.com/getting-started',
              provider: 'Chroma Docs',
            },
          },
        ],
      },
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Build a Full Retrieval-Augmented Generation (RAG) System',
            description: 'Implement semantic chunking, embedding generation, vector store retrieval, and context-injected LLM synthesis.',
            type: 'project',
            skillName: 'rag',
            priority: 'high',
            estimatedHours: 8,
            isVideoTask: true,
            videoDurationSeconds: 900,
            resource: {
              title: 'Building Production RAG Systems with LlamaIndex',
              url: 'https://docs.llamaindex.ai/en/stable/',
              provider: 'LlamaIndex',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Structured Outputs Validation with Zod & Pydantic',
            description: 'Enforce strict schema validation on model outputs to guarantee reliable JSON payloads without syntax hallucinations.',
            type: 'practice',
            skillName: 'structured-outputs',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Pydantic Documentation for Structured Data',
              url: 'https://docs.pydantic.dev/latest/',
              provider: 'Pydantic Docs',
            },
          },
        ],
      },
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'LangChain & LCEL Composition Patterns',
            description: 'Compose multi-stage prompt pipelines, memory buffers, and streaming response handlers using LangChain Expression Language.',
            type: 'learn',
            skillName: 'langchain',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'LangChain Expression Language (LCEL) Documentation',
              url: 'https://python.langchain.com/docs/expression_language/',
              provider: 'LangChain',
            },
          },
          {
            order: 2,
            title: 'Hybrid Search & Cross-Encoder Reranking',
            description: 'Combine BM25 keyword search with dense vector similarity search, and apply Cohere Rerank for superior context relevance.',
            type: 'practice',
            skillName: 'rag',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Cohere Rerank API & Best Practices',
              url: 'https://docs.cohere.com/docs/reranking-best-practices',
              provider: 'Cohere',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'Autonomous AI Agents & Tool Calling (ReAct Loop)',
            description: 'Implement the ReAct pattern (Reason -> Act -> Observe) to let AI models execute real external functions and APIs.',
            type: 'learn',
            skillName: 'ai-agents',
            priority: 'high',
            estimatedHours: 6,
            isVideoTask: true,
            videoDurationSeconds: 840,
            resource: {
              title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
              url: 'https://arxiv.org/abs/2210.03629',
              provider: 'arXiv.org',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Model Context Protocol (MCP) Server Development',
            description: 'Construct a compliant MCP server exposing custom database tools and local filesystem resources to AI client agents.',
            type: 'practice',
            skillName: 'mcp',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Model Context Protocol Official Specification',
              url: 'https://modelcontextprotocol.io/',
              provider: 'Anthropic / MCP Standards',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Multi-Agent StateGraph Orchestration with LangGraph',
            description: 'Design multi-agent workflows with state persistence, cyclical graphs, human-in-the-loop review, and branch routing.',
            type: 'learn',
            skillName: 'langgraph',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'LangGraph Tutorial: Multi-Agent Workflows',
              url: 'https://langchain-ai.github.io/langgraph/',
              provider: 'LangChain AI',
            },
          },
          {
            order: 2,
            title: 'Subagent Delegation & CrewAI Team Workflows',
            description: 'Configure specialized subagent roles (Researcher, Critic, Code Generator) working collaboratively toward an objective.',
            type: 'practice',
            skillName: 'crewai',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'CrewAI Multi-Agent Framework Documentation',
              url: 'https://docs.crewai.com/',
              provider: 'CrewAI Docs',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'RAG Quantitative Evaluation with Ragas Benchmark',
            description: 'Measure Faithfulness, Answer Relevance, Context Precision, and Context Recall using automated evaluation testsets.',
            type: 'assessment',
            skillName: 'evaluation',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Ragas: Automated Evaluation of RAG Pipelines',
              url: 'https://docs.ragas.io/',
              provider: 'Ragas Docs',
            },
          },
          {
            order: 2,
            title: 'Autonomous Research & Summarization Agent Capstone',
            description: 'Engineer an autonomous research agent capable of web search, document parsing, citation tracking, and report synthesis.',
            type: 'project',
            skillName: 'ai-agents',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'Autonomous AI Agent Architecture Guide',
              url: 'https://roadmap.sh/ai-agents',
              provider: 'roadmap.sh',
            },
          },
        ],
      },
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Fine-Tuning & Parameter-Efficient LoRA/QLoRA',
            description: 'Prepare supervised instruction fine-tuning datasets, understand LoRA rank adapters, and run fine-tuning jobs.',
            type: 'learn',
            skillName: 'fine-tuning',
            priority: 'medium',
            estimatedHours: 6,
            resource: {
              title: 'Hugging Face: Parameter-Efficient Fine-Tuning (PEFT)',
              url: 'https://huggingface.co/docs/peft/index',
              provider: 'Hugging Face',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'AI Security, Guardrails & Defense Against Prompt Injections',
            description: 'Implement NeMo Guardrails, input/output content moderation, token usage limits, and defense against jailbreaks.',
            type: 'practice',
            skillName: 'guardrails',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'NVIDIA NeMo Guardrails Architecture',
              url: 'https://github.com/NVIDIA/NeMo-Guardrails',
              provider: 'NVIDIA',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'Production LLM Serving & Observability with LangSmith',
            description: 'Deploy low-latency inference with vLLM / Ollama, expose FastAPI endpoints, and track execution traces in LangSmith.',
            type: 'practice',
            skillName: 'observability',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'LangSmith Observability & Tracing Documentation',
              url: 'https://docs.smith.langchain.com/',
              provider: 'LangSmith',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Enterprise Multi-Agent Platform Capstone & Technical Showcase',
            description: 'Complete, containerize, and deploy an end-to-end multi-agent enterprise AI system with benchmarked evaluation metrics.',
            type: 'project',
            skillName: 'ai-agents',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'Production AI Engineer Capstone Project Standards',
              url: 'https://github.com/topics/llm-application',
              provider: 'Open Source AI Community',
            },
          },
        ],
      },
    ],
  },

  // ── 7. DevOps & Cloud Engineer ──────────────────────────────
  'devops-cloud-engineer': {
    title: 'DevOps & Cloud Engineer',
    category: 'cloud-infrastructure',
    weeks: [
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Linux Server Administration & Bash Automation',
            description: 'Master systemd service units, cron jobs, file permissions, user groups, and writing automated bash scripts.',
            type: 'learn',
            skillName: 'linux',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 720,
            resource: {
              title: 'Linux Server Administration for Beginners',
              url: 'https://www.youtube.com/watch?v=oxuRxtrO2Ag',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Networking & SSH Key Security Architecture',
            description: 'Configure firewalls (UFW), understand TCP/UDP ports, DNS records, and configure key-based SSH authentication.',
            type: 'practice',
            skillName: 'networking',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'DigitalOcean: How to Set Up SSH Keys on Ubuntu',
              url: 'https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-22-04',
              provider: 'DigitalOcean Community',
            },
          },
        ],
      },
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'Git Version Control & Conventional Commit Workflows',
            description: 'Master interactive rebasing, feature branches, pull request reviews, and merge conflict resolution.',
            type: 'practice',
            skillName: 'git',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Git Documentation and Reference Manual',
              url: 'https://git-scm.com/doc',
              provider: 'Git SCM',
            },
          },
          {
            order: 2,
            title: 'GitHub Actions Automated CI/CD Pipelines',
            description: 'Write declarative YAML workflow files that automatically lint code, run test suites, and report build status.',
            type: 'learn',
            skillName: 'github-actions',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 660,
            resource: {
              title: 'GitHub Actions Tutorial for Beginners',
              url: 'https://www.youtube.com/watch?v=R8_veQiYBjI',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
        ],
      },
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'Docker Containerization & Multi-Stage Builds',
            description: 'Package web applications into optimized Docker images, using multi-stage builds and minimal Alpine/Distroless bases.',
            type: 'learn',
            skillName: 'docker',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 780,
            resource: {
              title: 'Docker Tutorial for Beginners',
              url: 'https://www.youtube.com/watch?v=pg19Z8LL06w',
              provider: 'Programming with Mosh (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Multi-Service Orchestration with Docker Compose',
            description: 'Configure and network web, API, and database containers with isolated networks, persistent volumes, and healthchecks.',
            type: 'practice',
            skillName: 'docker',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Docker Compose Official Specification & Guides',
              url: 'https://docs.docker.com/compose/',
              provider: 'Docker Docs',
            },
          },
        ],
      },
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Container Security & Vulnerability Scanning (Trivy)',
            description: 'Scan container images and dependencies for CVE vulnerabilities in CI pipelines, and configure unprivileged user runtimes.',
            type: 'practice',
            skillName: 'devsecops',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Trivy: Comprehensive Security Scanner',
              url: 'https://trivy.dev/',
              provider: 'Aqua Security',
            },
          },
          {
            order: 2,
            title: 'Automated Container Build & Deployment Pipeline Project',
            description: 'Build an end-to-end pipeline that builds, tests, scans, and pushes Docker containers to GitHub Packages / Docker Hub.',
            type: 'project',
            skillName: 'ci-cd',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Publishing Docker Images with GitHub Actions',
              url: 'https://docs.github.com/en/actions/publishing-packages/publishing-docker-images',
              provider: 'GitHub Docs',
            },
          },
        ],
      },
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'Kubernetes Architecture & Core Primitives',
            description: 'Understand the control plane (API server, etcd, scheduler), worker nodes, pods, replica sets, and deployments.',
            type: 'learn',
            skillName: 'kubernetes',
            priority: 'high',
            estimatedHours: 6,
            isVideoTask: true,
            videoDurationSeconds: 840,
            resource: {
              title: 'Kubernetes Crash Course for Beginners',
              url: 'https://www.youtube.com/watch?v=X48VuDVv0do',
              provider: 'TechWorld with Nana (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Kubernetes Services & Ingress Controllers',
            description: 'Expose pods internally using ClusterIP, externally with NodePort/LoadBalancer, and route HTTP traffic via Ingress Nginx.',
            type: 'practice',
            skillName: 'kubernetes',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Kubernetes Services & Networking Guide',
              url: 'https://kubernetes.io/docs/concepts/services-networking/',
              provider: 'Kubernetes Docs',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'Kubernetes ConfigMaps, Secrets & Volumes',
            description: 'Manage decoupled environment configurations and encrypted credentials with ConfigMaps, Secrets, and persistent volumes.',
            type: 'practice',
            skillName: 'kubernetes',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Kubernetes Configuration Best Practices',
              url: 'https://kubernetes.io/docs/concepts/configuration/',
              provider: 'Kubernetes Docs',
            },
          },
          {
            order: 2,
            title: 'Helm Package Manager for Kubernetes Releases',
            description: 'Package application manifests into reusable Helm charts with parameterized values.yaml files and rollback management.',
            type: 'learn',
            skillName: 'helm',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'Helm Documentation & Chart Development Guide',
              url: 'https://helm.sh/docs/',
              provider: 'Helm Docs',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Infrastructure as Code (IaC) with Terraform',
            description: 'Master HashiCorp Configuration Language (HCL), providers, resource declarations, and remote S3/DynamoDB state locking.',
            type: 'learn',
            skillName: 'terraform',
            priority: 'high',
            estimatedHours: 6,
            isVideoTask: true,
            videoDurationSeconds: 780,
            resource: {
              title: 'Terraform Course - Automate Your AWS Infrastructure',
              url: 'https://www.youtube.com/watch?v=7xngnjfIlK4',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Terraform Modular Cloud Provisioning',
            description: 'Construct reusable Terraform modules for VPC subnets, security groups, EC2 instances, and RDS databases.',
            type: 'practice',
            skillName: 'terraform',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'HashiCorp Terraform Module Registry & Documentation',
              url: 'https://developer.hashicorp.com/terraform/docs',
              provider: 'HashiCorp',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'AWS Cloud Architecture & IAM Least Privilege',
            description: 'Provision secure cloud infrastructure on AWS: VPCs, Route 53, S3 buckets, and enforce strict IAM role policies.',
            type: 'practice',
            skillName: 'aws',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'AWS Well-Architected Framework: Security Pillar',
              url: 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html',
              provider: 'AWS Docs',
            },
          },
          {
            order: 2,
            title: 'Automated Cloud Infrastructure Provisioning Project',
            description: 'Write complete Terraform code to provision an AWS VPC with public/private subnets, an application load balancer, and EC2 nodes.',
            type: 'project',
            skillName: 'terraform',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Terraform AWS Reference Architecture',
              url: 'https://github.com/terraform-aws-modules',
              provider: 'Open Source Community',
            },
          },
        ],
      },
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Observability: Prometheus Metrics & PromQL',
            description: 'Deploy Prometheus server, configure node_exporter metrics, and write PromQL queries to monitor CPU, memory, and HTTP rates.',
            type: 'learn',
            skillName: 'prometheus',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Prometheus Getting Started & Querying',
              url: 'https://prometheus.io/docs/introduction/overview/',
              provider: 'Prometheus Docs',
            },
          },
          {
            order: 2,
            title: 'Grafana Real-Time Operational Dashboards & Alerts',
            description: 'Connect Grafana to Prometheus data sources, build operational dashboards, and configure alert notification channels.',
            type: 'practice',
            skillName: 'grafana',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Grafana Documentation & Dashboard Templates',
              url: 'https://grafana.com/docs/',
              provider: 'Grafana Docs',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'Centralized Log Aggregation with Grafana Loki & Fluentd',
            description: 'Collect, ship, and query container logs across microservices with Loki and LogCLI without indexing overhead.',
            type: 'practice',
            skillName: 'observability',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'Grafana Loki Log Aggregation System',
              url: 'https://grafana.com/docs/loki/latest/',
              provider: 'Grafana Labs',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'DevSecOps & Software Supply Chain Security',
            description: 'Integrate Gitleaks, OWASP Dependency-Check, and SBOM generation into GitHub Actions to block vulnerable commits.',
            type: 'practice',
            skillName: 'devsecops',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'OWASP DevSecOps Guideline',
              url: 'https://owasp.org/www-project-devsecops-guideline/',
              provider: 'OWASP',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Production GitOps Infrastructure Capstone & SRE Verification',
            description: 'Deploy a resilient GitOps pipeline using ArgoCD / Flux that continuously syncs Kubernetes state with zero downtime.',
            type: 'project',
            skillName: 'kubernetes',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'GitOps Principles and Workflows',
              url: 'https://opengitops.dev/',
              provider: 'OpenGitOps Standards',
            },
          },
        ],
      },
    ],
  },

  // ── 8. Backend Engineer ─────────────────────────────────────
  'backend-engineer': {
    title: 'Backend Engineer',
    category: 'development',
    weeks: [
      {
        weekNumber: 1,
        tasks: [
          {
            order: 1,
            title: 'Node.js Runtime Internals & The V8 Event Loop',
            description: 'Understand the V8 JavaScript engine, libuv event loop phases, non-blocking I/O, streams, and buffer manipulation.',
            type: 'learn',
            skillName: 'node.js',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 780,
            resource: {
              title: 'Node.js Event Loop and Architecture Deep Dive',
              url: 'https://www.youtube.com/watch?v=PNa9OMajw9w',
              provider: 'freeCodeCamp (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Operating System Shell Automation & Process Control',
            description: 'Master Linux command-line operations, standard streams (stdin, stdout, stderr), pipes, and process management.',
            type: 'practice',
            skillName: 'linux',
            priority: 'medium',
            estimatedHours: 4,
            resource: {
              title: 'The Linux Command Line Tutorial',
              url: 'https://linuxcommand.org/tlcl.php',
              provider: 'LinuxCommand.org',
            },
          },
        ],
      },
      {
        weekNumber: 2,
        tasks: [
          {
            order: 1,
            title: 'RESTful API Architecture & Express.js MVC Routing',
            description: 'Structure clean MVC controllers, modular routers, custom middleware pipelines, and centralized error handlers.',
            type: 'learn',
            skillName: 'express.js',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 660,
            resource: {
              title: 'Express.js Complete API Development Guide',
              url: 'https://www.youtube.com/watch?v=7H_QH9nipNs',
              provider: 'Traversy Media (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Request Validation with Zod & OpenAPI Specifications',
            description: 'Validate request bodies, query params, and route parameters strictly with Zod schemas to reject invalid inputs.',
            type: 'practice',
            skillName: 'rest-apis',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'Zod: TypeScript-First Schema Validation',
              url: 'https://zod.dev/',
              provider: 'Zod Docs',
            },
          },
        ],
      },
      {
        weekNumber: 3,
        tasks: [
          {
            order: 1,
            title: 'Relational Data Modeling with PostgreSQL & Prisma ORM',
            description: 'Design normalized relational schemas, foreign keys, compound indexes, and execute ACID transactions with Prisma.',
            type: 'learn',
            skillName: 'postgresql',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'PostgreSQL Tutorial: From Beginner to Advanced',
              url: 'https://www.postgresqltutorial.com/',
              provider: 'PostgreSQL Tutorial',
            },
          },
          {
            order: 2,
            title: 'Database Indexing & Query Performance Optimization',
            description: 'Analyze query execution plans with EXPLAIN ANALYZE, apply B-Tree and GIN indexes, and resolve slow queries.',
            type: 'practice',
            skillName: 'sql',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Use The Index, Luke! A Guide to Database Performance',
              url: 'https://use-the-index-luke.com/',
              provider: 'Use The Index, Luke',
            },
          },
        ],
      },
      {
        weekNumber: 4,
        tasks: [
          {
            order: 1,
            title: 'Document Data Modeling with MongoDB & Mongoose',
            description: 'Construct scalable document collections, subdocuments, references, and complex aggregation pipelines.',
            type: 'learn',
            skillName: 'mongodb',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'MongoDB University: Data Modeling Course',
              url: 'https://learn.mongodb.com/',
              provider: 'MongoDB',
            },
          },
          {
            order: 2,
            title: 'Build a Production CRUD API with Prisma & PostgreSQL',
            description: 'Implement a complete backend service with pagination, sorting, search filters, and transactional integrity.',
            type: 'project',
            skillName: 'rest-apis',
            priority: 'high',
            estimatedHours: 8,
            resource: {
              title: 'Building REST APIs with Prisma and Express',
              url: 'https://www.prisma.io/docs/getting-started/quickstart',
              provider: 'Prisma Docs',
            },
          },
        ],
      },
      {
        weekNumber: 5,
        tasks: [
          {
            order: 1,
            title: 'Authentication, JWT & Refresh Token Rotation',
            description: 'Implement stateless JWT access tokens, secure HTTP-only refresh tokens, bcrypt password hashing, and logout blacklists.',
            type: 'learn',
            skillName: 'authentication',
            priority: 'high',
            estimatedHours: 5,
            isVideoTask: true,
            videoDurationSeconds: 720,
            resource: {
              title: 'JWT Authentication & Refresh Token Rotation Guide',
              url: 'https://www.youtube.com/watch?v=mbsmsi7l3r4',
              provider: 'Web Dev Simplified (YouTube)',
              mediaType: 'video',
            },
          },
          {
            order: 2,
            title: 'Role-Based Access Control (RBAC) Middleware',
            description: 'Create authorization middleware that enforces permissions across admin, recruiter, and student roles.',
            type: 'practice',
            skillName: 'authentication',
            priority: 'high',
            estimatedHours: 4,
            resource: {
              title: 'OWASP Authorization Cheat Sheet',
              url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
              provider: 'OWASP',
            },
          },
        ],
      },
      {
        weekNumber: 6,
        tasks: [
          {
            order: 1,
            title: 'In-Memory Caching & Rate Limiting with Redis',
            description: 'Implement cache-aside patterns, cache invalidation, and token-bucket rate limiters with Redis to protect API throughput.',
            type: 'learn',
            skillName: 'redis',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Redis University: Cache-Aside Patterns & Performance',
              url: 'https://university.redis.com/',
              provider: 'Redis University',
            },
          },
          {
            order: 2,
            title: 'Asynchronous Job Queues with BullMQ & Redis',
            description: 'Offload long-running background tasks (PDF generation, emails) to background worker processes via BullMQ.',
            type: 'practice',
            skillName: 'redis',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'BullMQ: Premium Message Queue for Node.js',
              url: 'https://docs.bullmq.io/',
              provider: 'BullMQ Docs',
            },
          },
        ],
      },
      {
        weekNumber: 7,
        tasks: [
          {
            order: 1,
            title: 'Real-Time Communication with WebSockets (Socket.io)',
            description: 'Build bidirectional real-time channels for live updates, notifications, chat rooms, and heartbeat monitoring.',
            type: 'learn',
            skillName: 'websockets',
            priority: 'medium',
            estimatedHours: 5,
            resource: {
              title: 'Socket.io Official Documentation & Getting Started',
              url: 'https://socket.io/docs/v4/',
              provider: 'Socket.io',
            },
          },
        ],
      },
      {
        weekNumber: 8,
        tasks: [
          {
            order: 1,
            title: 'API Security Hardening & OWASP Top 10 Mitigation',
            description: 'Secure Express endpoints against NoSQL injection, XSS, parameter pollution, and DDoS with Helmet and CORS.',
            type: 'assessment',
            skillName: 'api-security',
            priority: 'high',
            estimatedHours: 6,
            resource: {
              title: 'Node.js Security Best Practices & OWASP Guide',
              url: 'https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices',
              provider: 'Node.js Best Practices Community',
            },
          },
          {
            order: 2,
            title: 'High-Throughput E-Commerce API Capstone',
            description: 'Build a production-grade backend service with auth, caching, rate limiting, database transactions, and test coverage.',
            type: 'project',
            skillName: 'rest-apis',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'Enterprise Backend System Design Patterns',
              url: 'https://roadmap.sh/backend',
              provider: 'roadmap.sh',
            },
          },
        ],
      },
      {
        weekNumber: 9,
        tasks: [
          {
            order: 1,
            title: 'Microservices Communication: REST, gRPC & Message Brokers',
            description: 'Understand synchronous HTTP/REST, binary protobuf gRPC, and asynchronous event streams via RabbitMQ/Kafka.',
            type: 'learn',
            skillName: 'system-design',
            priority: 'medium',
            estimatedHours: 6,
            resource: {
              title: 'Microservices Patterns by Chris Richardson',
              url: 'https://microservices.io/patterns/index.html',
              provider: 'Microservices.io',
            },
          },
        ],
      },
      {
        weekNumber: 10,
        tasks: [
          {
            order: 1,
            title: 'Dockerizing Backend Microservices & CI/CD Delivery',
            description: 'Write production-ready multi-stage Dockerfiles and automate automated linting, testing, and deployment in GitHub Actions.',
            type: 'practice',
            skillName: 'docker',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Dockerizing a Node.js Web Application Guide',
              url: 'https://nodejs.org/en/docs/guides/nodejs-docker-webapp/',
              provider: 'Node.js Docs',
            },
          },
        ],
      },
      {
        weekNumber: 11,
        tasks: [
          {
            order: 1,
            title: 'Observability: Winston Structured Logging & Prometheus Metrics',
            description: 'Standardize structured JSON logs with correlation IDs, expose Prometheus /metrics, and monitor HTTP latency percentiles.',
            type: 'practice',
            skillName: 'monitoring',
            priority: 'high',
            estimatedHours: 5,
            resource: {
              title: 'Winston Logger & Prom-Client Guide',
              url: 'https://github.com/winstonjs/winston',
              provider: 'Winston GitHub',
            },
          },
        ],
      },
      {
        weekNumber: 12,
        tasks: [
          {
            order: 1,
            title: 'Distributed System Capstone & Architecture Interview Prep',
            description: 'Perform load testing with k6, benchmark 1,000 req/sec throughput, document API endpoints with Swagger, and finalize portfolio.',
            type: 'project',
            skillName: 'system-design',
            priority: 'high',
            estimatedHours: 10,
            resource: {
              title: 'System Design Primer by Donne Martin',
              url: 'https://github.com/donnemartin/system-design-primer',
              provider: 'System Design Primer',
            },
          },
        ],
      },
    ],
  },
};

// Aliases for seamless slug matching
roadmapTemplates['ai-engineer'] = roadmapTemplates['ai-ml-engineer'];
roadmapTemplates['devops-engineer'] = roadmapTemplates['devops-cloud-engineer'];

module.exports = roadmapTemplates;


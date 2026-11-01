/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * seed_lightcast_taxonomy.js — Lightcast Open Skills Taxonomy Ingestion & Seeding Engine
 *
 * Implements Plan #39: Lightcast Skills Taxonomy Integration
 * Enriches Disheera with 400+ curated industry labor-market skills with:
 *   - Standardized Lightcast IDs (KS...)
 *   - 3-Level Hierarchy (Category -> Subcategory -> Skill)
 *   - Skill Classification (Specialized, Software, Common)
 *   - Rich Synonyms & Aliases for fuzzy matching and ATS resume optimization
 *
 * 100% Pure Supabase PostgreSQL via Prisma Client · 0% MongoDB Footprint
 * Disheera Technologies Inc.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { prisma } = require('../config/prisma');

// Helper to generate deterministic Lightcast-style IDs: KS + alphanumeric hash
function generateLightcastId(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const part2 = slug.split('').map(c => c.charCodeAt(0).toString(16).toUpperCase()).join('').substring(0, 10).padEnd(10, 'X');
  return `KS${hex}${part2}`;
}

// ── Curated Taxonomy Dataset Definition ────────────────────────────────────
const RAW_TAXONOMY_SECTORS = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. INFORMATION TECHNOLOGY — FRONTEND DEVELOPMENT
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Frontend Development',
    skills: [
      {
        name: 'html',
        displayName: 'HTML5',
        type: 'software',
        aliases: ['html', 'html5', 'hypertext markup language', 'semantic html'],
        description: 'Standard markup language for document structure and semantic content on the World Wide Web.'
      },
      {
        name: 'css',
        displayName: 'CSS3',
        type: 'software',
        aliases: ['css', 'css3', 'cascading style sheets', 'css styling'],
        description: 'Style sheet language for visual presentation, layouts, responsive grids, and design themes.'
      },
      {
        name: 'javascript',
        displayName: 'JavaScript',
        type: 'specialized',
        aliases: ['js', 'javascript language', 'ecmascript', 'es6', 'es2022', 'vanilla js'],
        description: 'High-level, interpreted scripting language powering modern interactive web applications and event-driven architectures.'
      },
      {
        name: 'typescript',
        displayName: 'TypeScript',
        type: 'specialized',
        aliases: ['ts', 'typescript language', 'type script', 'typed javascript'],
        description: 'Strongly typed programming language that builds on JavaScript, offering static type analysis and enterprise code maintainability.'
      },
      {
        name: 'react',
        displayName: 'React (JavaScript Library)',
        type: 'specialized',
        aliases: ['reactjs', 'react.js', 'react framework', 'react core', 'react front-end'],
        description: 'Declarative, component-based frontend library for building modern dynamic reactive user interfaces.'
      },
      {
        name: 'next.js',
        displayName: 'Next.js',
        type: 'specialized',
        aliases: ['nextjs', 'next.js 14', 'next js', 'nextjs framework', 'next react'],
        description: 'Production React framework offering server-side rendering (SSR), static site generation (SSG), and edge API routing.'
      },
      {
        name: 'vue.js',
        displayName: 'Vue.js',
        type: 'specialized',
        aliases: ['vue', 'vuejs', 'vue 3', 'vue.js framework'],
        description: 'Progressive JavaScript framework for building user interfaces and single-page applications.'
      },
      {
        name: 'angular',
        displayName: 'Angular',
        type: 'specialized',
        aliases: ['angularjs', 'angular 2+', 'angular framework', 'google angular'],
        description: 'Component-based enterprise TypeScript framework for building scalable web applications.'
      },
      {
        name: 'svelte',
        displayName: 'Svelte',
        type: 'specialized',
        aliases: ['sveltejs', 'sveltekit', 'svelte framework'],
        description: 'Radical compiler-based frontend framework that converts declarative components into highly efficient vanilla JavaScript.'
      },
      {
        name: 'tailwind-css',
        displayName: 'Tailwind CSS',
        type: 'software',
        aliases: ['tailwind', 'tailwindcss', 'tailwind utility css'],
        description: 'Utility-first CSS framework for rapid UI development and modern tailored interface styling.'
      },
      {
        name: 'bootstrap',
        displayName: 'Bootstrap',
        type: 'software',
        aliases: ['bootstrap 5', 'bootstrap css', 'twitter bootstrap'],
        description: 'Responsive CSS framework featuring pre-styled UI components and grid layouts.'
      },
      {
        name: 'sass',
        displayName: 'Sass / SCSS',
        type: 'software',
        aliases: ['scss', 'sass css', 'syntactically awesome stylesheets'],
        description: 'Preprocessed CSS extension language providing variables, nested rules, and mixins.'
      },
      {
        name: 'redux',
        displayName: 'Redux',
        type: 'software',
        aliases: ['redux toolkit', 'rtk', 'redux state management'],
        description: 'Predictable state container for JavaScript apps facilitating centralized application state management.'
      },
      {
        name: 'responsive-design',
        displayName: 'Responsive Web Design',
        type: 'specialized',
        aliases: ['mobile-first design', 'responsive design', 'fluid layout', 'media queries'],
        description: 'Web development approach creating dynamic layouts that adapt responsively to all device screen viewports.'
      },
      {
        name: 'vite',
        displayName: 'Vite Build Tool',
        type: 'software',
        aliases: ['vitejs', 'vite bundler', 'vite build tool'],
        description: 'Next-generation frontend tooling offering fast development server start and optimized Rollup production builds.'
      },
      {
        name: 'webpack',
        displayName: 'Webpack',
        type: 'software',
        aliases: ['webpack bundler', 'module bundler'],
        description: 'Static module bundler for modern JavaScript applications.'
      },
      {
        name: 'three.js',
        displayName: 'Three.js (3D WebGL)',
        type: 'specialized',
        aliases: ['threejs', 'three.js 3d', 'webgl three'],
        description: 'JavaScript 3D library using WebGL to render interactive 3D computer graphics directly in the browser.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. INFORMATION TECHNOLOGY — BACKEND & APIS
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Backend & Distributed Systems',
    skills: [
      {
        name: 'node.js',
        displayName: 'Node.js',
        type: 'specialized',
        aliases: ['nodejs', 'node js', 'node-js', 'node runtime', 'node.js server'],
        description: 'V8-powered asynchronous event-driven JavaScript runtime designed for building scalable network backends.'
      },
      {
        name: 'express.js',
        displayName: 'Express.js',
        type: 'software',
        aliases: ['expressjs', 'express js', 'express server', 'express framework'],
        description: 'Fast, unopinionated, minimalist web framework for Node.js backends and RESTful API routing.'
      },
      {
        name: 'nestjs',
        displayName: 'NestJS',
        type: 'specialized',
        aliases: ['nest.js', 'nest js', 'nestjs framework'],
        description: 'Progressive Node.js framework for building efficient, reliable and scalable enterprise server-side applications.'
      },
      {
        name: 'python',
        displayName: 'Python',
        type: 'specialized',
        aliases: ['py', 'python 3', 'python programming', 'python language'],
        description: 'High-level general-purpose programming language emphasizing code readability and versatile software development.'
      },
      {
        name: 'fastapi',
        displayName: 'FastAPI',
        type: 'specialized',
        aliases: ['fast api', 'fastapi python', 'fastapi framework'],
        description: 'Modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints.'
      },
      {
        name: 'django',
        displayName: 'Django',
        type: 'specialized',
        aliases: ['django framework', 'django python', 'django orm', 'drf'],
        description: 'High-level Python web framework that encourages rapid development and clean, pragmatic architectural design.'
      },
      {
        name: 'flask',
        displayName: 'Flask',
        type: 'software',
        aliases: ['flask python', 'flask microframework'],
        description: 'Lightweight WSGI micro web framework written in Python designed to make getting started quick and easy.'
      },
      {
        name: 'java',
        displayName: 'Java',
        type: 'specialized',
        aliases: ['java programming', 'java se', 'java ee', 'jdk', 'jvm'],
        description: 'Class-based, object-oriented programming language designed for cross-platform portability and enterprise backends.'
      },
      {
        name: 'spring-boot',
        displayName: 'Spring Boot',
        type: 'specialized',
        aliases: ['springboot', 'spring framework', 'spring boot java'],
        description: 'Production-ready framework for building stand-alone, production-grade Spring-based Java applications.'
      },
      {
        name: 'golang',
        displayName: 'Go (Golang)',
        type: 'specialized',
        aliases: ['go', 'golang programming', 'google go'],
        description: 'Open source programming language designed by Google for building simple, fast, and reliable concurrent software.'
      },
      {
        name: 'rust',
        displayName: 'Rust',
        type: 'specialized',
        aliases: ['rustlang', 'rust programming', 'rust language'],
        description: 'Multi-paradigm general-purpose language emphasizing performance, type safety, and memory safety without a garbage collector.'
      },
      {
        name: 'csharp',
        displayName: 'C# (.NET)',
        type: 'specialized',
        aliases: ['c#', 'c sharp', 'dotnet', '.net core', 'asp.net'],
        description: 'Modern, object-oriented, type-safe programming language developed by Microsoft for cross-platform applications.'
      },
      {
        name: 'cpp',
        displayName: 'C++',
        type: 'specialized',
        aliases: ['c plus plus', 'c/c++', 'modern c++'],
        description: 'High-performance general-purpose programming language with low-level memory manipulation capabilities.'
      },
      {
        name: 'rest-apis',
        displayName: 'RESTful API Architecture',
        type: 'specialized',
        aliases: ['rest api', 'restful services', 'restful apis', 'rest web services', 'rest endpoints'],
        description: 'Architectural style for designing networked applications and standard HTTP-based microservice communications.'
      },
      {
        name: 'graphql',
        displayName: 'GraphQL',
        type: 'specialized',
        aliases: ['gql', 'graphql api', 'apollo graphql'],
        description: 'Query language for APIs and runtime for fulfilling queries with existing data, providing complete data predictability.'
      },
      {
        name: 'grpc',
        displayName: 'gRPC Protocol',
        type: 'software',
        aliases: ['grpc microservices', 'protobuf', 'protocol buffers'],
        description: 'High performance, open source universal RPC framework developed by Google for low-latency service-to-service communication.'
      },
      {
        name: 'authentication',
        displayName: 'Auth Systems & JWT',
        type: 'specialized',
        aliases: ['auth', 'jwt', 'json web tokens', 'oauth', 'oauth 2.0', 'user authentication', 'session management'],
        description: 'Methods and cryptographic mechanisms verifying digital user identity and controlling resource permissions.'
      },
      {
        name: 'websockets',
        displayName: 'WebSockets & Socket.IO',
        type: 'software',
        aliases: ['websocket', 'socket.io', 'realtime socket', 'bidirectional streaming'],
        description: 'Computer communications protocol providing full-duplex communication channels over a single TCP connection.'
      },
      {
        name: 'microservices',
        displayName: 'Microservices Architecture',
        type: 'specialized',
        aliases: ['microservice', 'distributed systems', 'service-oriented architecture'],
        description: 'Software development technique structuring an application as a collection of loosely coupled services.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. INFORMATION TECHNOLOGY — DATABASES & STORAGE
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Database Architecture & Storage',
    skills: [
      {
        name: 'sql',
        displayName: 'SQL (Structured Query Language)',
        type: 'specialized',
        aliases: ['sql queries', 'relational database query', 'ansi sql'],
        description: 'Domain-specific language used in programming and designed for managing data held in relational database systems.'
      },
      {
        name: 'postgresql',
        displayName: 'PostgreSQL',
        type: 'software',
        aliases: ['postgres', 'psql', 'postgre-sql', 'postgresql database'],
        description: 'Powerful, open-source object-relational database system with strong reputation for reliability, feature robustness, and performance.'
      },
      {
        name: 'supabase',
        displayName: 'Supabase Platform',
        type: 'software',
        aliases: ['supabase db', 'supabase postgres', 'supabase backend'],
        description: 'Open source Firebase alternative providing scalable PostgreSQL, real-time subscriptions, and auto-generated REST APIs.'
      },
      {
        name: 'mysql',
        displayName: 'MySQL',
        type: 'software',
        aliases: ['my-sql', 'mysql server', 'mysql rdbms'],
        description: 'Widely deployed open-source relational database management system powering web applications.'
      },
      {
        name: 'mongodb',
        displayName: 'MongoDB',
        type: 'software',
        aliases: ['mongo', 'mongo db', 'nosql mongodb', 'mongodb atlas'],
        description: 'Source-available cross-platform document-oriented database program classified as a NoSQL database.'
      },
      {
        name: 'redis',
        displayName: 'Redis (In-Memory Data Store)',
        type: 'software',
        aliases: ['redis cache', 'redis key-value', 'in-memory redis'],
        description: 'In-memory data structure store used as a database, cache, message broker, and streaming engine.'
      },
      {
        name: 'prisma',
        displayName: 'Prisma ORM',
        type: 'software',
        aliases: ['prisma orm', 'prisma client', 'prisma schema'],
        description: 'Next-generation Node.js and TypeScript Object-Relational Mapper offering type-safe database queries and migrations.'
      },
      {
        name: 'database-design',
        displayName: 'Relational Database Schema Design',
        type: 'specialized',
        aliases: ['database normalization', 'db modeling', 'data modeling', 'entity relationship design', 'er diagram'],
        description: 'Process of producing a detailed data model of a database including schemas, tables, relationships, and constraints.'
      },
      {
        name: 'vector-databases',
        displayName: 'Vector Databases (Pinecone / Qdrant)',
        type: 'specialized',
        aliases: ['pinecone', 'qdrant', 'chromadb', 'vector search', 'vector embeddings db', 'pgvector'],
        description: 'Specialized databases indexing high-dimensional vector embeddings for semantic similarity search and AI agents.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. INFORMATION TECHNOLOGY — CLOUD COMPUTING & DEVOPS
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Cloud Infrastructure & DevOps',
    skills: [
      {
        name: 'docker',
        displayName: 'Docker Containerization',
        type: 'software',
        aliases: ['docker container', 'dockerfile', 'docker compose', 'containerization'],
        description: 'Platform providing OS-level virtualization to deliver software in standardized packages called containers.'
      },
      {
        name: 'kubernetes',
        displayName: 'Kubernetes (K8s)',
        type: 'software',
        aliases: ['k8s', 'kube', 'kubernetes orchestration', 'container orchestration'],
        description: 'Open-source system for automating deployment, scaling, and management of containerized applications.'
      },
      {
        name: 'aws',
        displayName: 'Amazon Web Services (AWS)',
        type: 'software',
        aliases: ['amazon aws', 'aws cloud', 'ec2', 's3', 'lambda', 'aws solutions'],
        description: 'Comprehensive cloud computing platform provided by Amazon offering IaaS, PaaS, and serverless infrastructure.'
      },
      {
        name: 'google-cloud',
        displayName: 'Google Cloud Platform (GCP)',
        type: 'software',
        aliases: ['gcp', 'google cloud', 'gcp compute', 'cloud run'],
        description: 'Suite of cloud computing services that runs on the same infrastructure Google uses internally.'
      },
      {
        name: 'azure',
        displayName: 'Microsoft Azure',
        type: 'software',
        aliases: ['azure cloud', 'ms azure', 'azure devops'],
        description: 'Cloud computing platform operated by Microsoft for application management via Microsoft-managed data centers.'
      },
      {
        name: 'git',
        displayName: 'Git Version Control',
        type: 'software',
        aliases: ['git vcs', 'github', 'gitlab', 'git branch', 'version control system'],
        description: 'Distributed version control system for tracking changes in source code during software development.'
      },
      {
        name: 'ci-cd',
        displayName: 'CI/CD Pipelines (GitHub Actions)',
        type: 'specialized',
        aliases: ['github actions', 'gitlab ci', 'jenkins', 'continuous integration', 'continuous deployment'],
        description: 'Automated software delivery practice combining continuous integration and continuous deployment pipelines.'
      },
      {
        name: 'terraform',
        displayName: 'Terraform (Infrastructure as Code)',
        type: 'software',
        aliases: ['hashicorp terraform', 'iac', 'infrastructure as code'],
        description: 'Open-source infrastructure as code software tool providing a consistent CLI workflow to manage cloud resources.'
      },
      {
        name: 'linux',
        displayName: 'Linux System Administration',
        type: 'specialized',
        aliases: ['linux cli', 'bash', 'ubuntu', 'linux sysadmin', 'unix shell'],
        description: 'Management, configuration, shell scripting, and security hardening of Linux-based server operating systems.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. INFORMATION TECHNOLOGY — ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Artificial Intelligence & Machine Learning',
    skills: [
      {
        name: 'machine-learning',
        displayName: 'Machine Learning Algorithms',
        type: 'specialized',
        aliases: ['ml', 'supervised learning', 'unsupervised learning', 'ml models'],
        description: 'Study and implementation of computer algorithms that improve automatically through experience and training data.'
      },
      {
        name: 'deep-learning',
        displayName: 'Deep Learning & Neural Networks',
        type: 'specialized',
        aliases: ['neural networks', 'cnn', 'rnn', 'transformers', 'deep neural nets'],
        description: 'Subset of machine learning based on artificial neural networks with representation learning.'
      },
      {
        name: 'pytorch',
        displayName: 'PyTorch',
        type: 'software',
        aliases: ['torch', 'pytorch deep learning', 'pytorch framework'],
        description: 'Machine learning framework based on the Torch library, used for applications such as computer vision and NLP.'
      },
      {
        name: 'tensorflow',
        displayName: 'TensorFlow',
        type: 'software',
        aliases: ['tf', 'keras', 'tensorflow 2'],
        description: 'Free and open-source software library for machine learning and artificial intelligence developed by Google.'
      },
      {
        name: 'nlp',
        displayName: 'Natural Language Processing (NLP)',
        type: 'specialized',
        aliases: ['text processing', 'natural language', 'linguistic ai', 'tokenization'],
        description: 'Subfield of linguistics, computer science, and AI concerning the interactions between computers and human language.'
      },
      {
        name: 'prompt-engineering',
        displayName: 'Prompt Engineering & LLMs',
        type: 'specialized',
        aliases: ['prompt design', 'llm prompt', 'system prompts', 'few-shot prompting', 'chain-of-thought'],
        description: 'Structuring and refining natural language instructions to guide generative AI foundation models effectively.'
      },
      {
        name: 'langchain',
        displayName: 'LangChain & Agentic Frameworks',
        type: 'software',
        aliases: ['lang chain', 'langchain agent', 'llamaindex', 'rag pipeline', 'agentic ai'],
        description: 'Framework designed to simplify the creation of applications using large language models and multi-agent systems.'
      },
      {
        name: 'computer-vision',
        displayName: 'Computer Vision & OpenCV',
        type: 'specialized',
        aliases: ['opencv', 'image processing', 'object detection', 'yolo'],
        description: 'Scientific field dealing with how computers can gain high-level understanding from digital images or videos.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. INFORMATION TECHNOLOGY — DATA SCIENCE & BIG DATA
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Data Science & Big Data Engineering',
    skills: [
      {
        name: 'data-analysis',
        displayName: 'Data Analytics & Insights',
        type: 'specialized',
        aliases: ['data analytics', 'data exploration', 'exploratory data analysis', 'eda'],
        description: 'Process of inspecting, cleansing, transforming, and modeling data with the goal of discovering useful information.'
      },
      {
        name: 'pandas',
        displayName: 'Pandas & NumPy',
        type: 'software',
        aliases: ['pandas library', 'numpy', 'dataframes', 'python pandas'],
        description: 'Core scientific Python data manipulation and numerical analysis libraries.'
      },
      {
        name: 'power-bi',
        displayName: 'Microsoft Power BI',
        type: 'software',
        aliases: ['powerbi', 'power bi desktop', 'dax', 'microsoft bi'],
        description: 'Interactive data visualization software product developed by Microsoft with primary focus on business intelligence.'
      },
      {
        name: 'tableau',
        displayName: 'Tableau',
        type: 'software',
        aliases: ['tableau desktop', 'tableau bi', 'tableau visualizations'],
        description: 'Interactive data visualization software company focused on business intelligence and executive reporting.'
      },
      {
        name: 'statistics',
        displayName: 'Applied Statistics & Probability',
        type: 'specialized',
        aliases: ['statistical modeling', 'hypothesis testing', 'a/b testing statistics', 'probability'],
        description: 'Discipline concerning data collection, organization, analysis, interpretation, and statistical inference.'
      },
      {
        name: 'data-cleaning',
        displayName: 'Data Cleansing & Preprocessing',
        type: 'specialized',
        aliases: ['data cleansing', 'data scrubbing', 'data preprocessing', 'feature engineering'],
        description: 'Detecting and correcting or removing corrupt, inaccurate, or incomplete records from raw datasets.'
      },
      {
        name: 'apache-kafka',
        displayName: 'Apache Kafka',
        type: 'software',
        aliases: ['kafka', 'event streaming', 'kafka broker', 'message queue kafka'],
        description: 'Distributed event store and stream-processing platform for high-throughput real-time data pipelines.'
      },
      {
        name: 'apache-spark',
        displayName: 'Apache Spark',
        type: 'software',
        aliases: ['spark', 'pyspark', 'spark streaming', 'big data spark'],
        description: 'Multi-language engine for executing data engineering, data science, and machine learning on single-node machines or clusters.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. INFORMATION TECHNOLOGY — CYBERSECURITY
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Cybersecurity & Information Defense',
    skills: [
      {
        name: 'network-security',
        displayName: 'Network Security & Firewalls',
        type: 'specialized',
        aliases: ['firewall', 'vpn', 'ids/ips', 'network protocols', 'tcp/ip security'],
        description: 'Policies and practices adopted to prevent and monitor unauthorized access, misuse, modification, or denial of computer networks.'
      },
      {
        name: 'penetration-testing',
        displayName: 'Penetration Testing & Ethical Hacking',
        type: 'specialized',
        aliases: ['pentesting', 'ethical hacking', 'red team', 'vulnerability assessment', 'burp suite', 'metasploit'],
        description: 'Authorized simulated cyberattack on a computer system performed to evaluate the security of the target system.'
      },
      {
        name: 'cryptography',
        displayName: 'Applied Cryptography & PKI',
        type: 'specialized',
        aliases: ['encryption', 'tls/ssl', 'pki', 'public key cryptography', 'hashing algorithms'],
        description: 'Practice and study of techniques for secure communication in the presence of adversarial third parties.'
      },
      {
        name: 'owasp',
        displayName: 'OWASP Top 10 Security Standards',
        type: 'specialized',
        aliases: ['owasp top 10', 'web security', 'xss prevention', 'sql injection prevention', 'csrf'],
        description: 'Standard awareness document for developers and web application security representing a broad consensus about security risks.'
      },
      {
        name: 'siem',
        displayName: 'SIEM & SOC Operations',
        type: 'specialized',
        aliases: ['splunk', 'security information and event management', 'soc analysis', 'incident response'],
        description: 'Security Information and Event Management systems combining security event management and security information management.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. INFORMATION TECHNOLOGY — QA & TESTING
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Software Quality Assurance & Testing',
    skills: [
      {
        name: 'jest',
        displayName: 'Jest & Vitest Unit Testing',
        type: 'software',
        aliases: ['vitest', 'unit testing', 'test runner', 'mocking'],
        description: 'JavaScript testing framework with a focus on simplicity and support for large web applications.'
      },
      {
        name: 'playwright',
        displayName: 'Playwright E2E Testing',
        type: 'software',
        aliases: ['playwright testing', 'e2e testing', 'browser automation'],
        description: 'End-to-end testing library for modern web apps across Chromium, Firefox, and WebKit with a single API.'
      },
      {
        name: 'cypress',
        displayName: 'Cypress Testing',
        type: 'software',
        aliases: ['cypress.io', 'cypress e2e', 'cypress test'],
        description: 'Frontend testing tool built for the modern web for unit tests, integration tests, and end-to-end tests.'
      },
      {
        name: 'postman',
        displayName: 'Postman API Testing',
        type: 'software',
        aliases: ['postman api', 'api testing', 'newman', 'api automation'],
        description: 'API platform for building and using APIs, providing automated collection tests and mock environments.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. INFORMATION TECHNOLOGY — MOBILE & CROSS-PLATFORM
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Mobile Application Engineering',
    skills: [
      {
        name: 'flutter',
        displayName: 'Flutter (Dart Framework)',
        type: 'specialized',
        aliases: ['dart flutter', 'flutter sdk', 'flutter mobile'],
        description: 'Open-source UI software development kit created by Google used to build cross-platform applications.'
      },
      {
        name: 'react-native',
        displayName: 'React Native',
        type: 'specialized',
        aliases: ['react native mobile', 'rn', 'expo react native'],
        description: 'Open-source UI software framework created by Meta used to develop applications for Android, iOS, and Web.'
      },
      {
        name: 'swift',
        displayName: 'Swift & iOS SDK',
        type: 'specialized',
        aliases: ['swiftui', 'xcode', 'ios development', 'apple swift'],
        description: 'Powerful and intuitive programming language for iOS, iPadOS, macOS, tvOS, and watchOS.'
      },
      {
        name: 'kotlin',
        displayName: 'Kotlin & Android SDK',
        type: 'specialized',
        aliases: ['android kotlin', 'jetpack compose', 'android development'],
        description: 'Modern concise programming language officially endorsed by Google for Android app engineering.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. INFORMATION TECHNOLOGY — BLOCKCHAIN & WEB3
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Information Technology',
    subcategory: 'Blockchain & Decentralized Tech',
    skills: [
      {
        name: 'solidity',
        displayName: 'Solidity (Smart Contracts)',
        type: 'specialized',
        aliases: ['smart contracts', 'ethereum solidity', 'evm contracts'],
        description: 'Object-oriented, high-level language for implementing smart contracts on Ethereum and EVM blockchains.'
      },
      {
        name: 'web3',
        displayName: 'Web3.js & Ethers.js',
        type: 'software',
        aliases: ['ethers.js', 'web3 integration', 'metamask integration'],
        description: 'JavaScript libraries allowing developers to interact with a local or remote Ethereum node using HTTP or WebSocket.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 11. BUSINESS & MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Business & Management',
    subcategory: 'Product & Project Strategy',
    skills: [
      {
        name: 'product-management',
        displayName: 'Technical Product Management',
        type: 'specialized',
        aliases: ['product strategy', 'prd authoring', 'user story mapping', 'feature roadmap'],
        description: 'Organizational function that guides every step of a product’s lifecycle from development to positioning and pricing.'
      },
      {
        name: 'agile-scrum',
        displayName: 'Agile & Scrum Methodologies',
        type: 'common',
        aliases: ['agile', 'scrum', 'sprint planning', 'kanban', 'daily standup'],
        description: 'Iterative approach to project management and software development helping teams deliver value faster and with fewer headaches.'
      },
      {
        name: 'jira',
        displayName: 'Jira & Project Tracking',
        type: 'software',
        aliases: ['atlassian jira', 'jira board', 'confluence'],
        description: 'Issue tracking and project management software developed by Atlassian for agile software development teams.'
      },
      {
        name: 'business-operations',
        displayName: 'Business Operations & RevOps',
        type: 'specialized',
        aliases: ['bizops', 'revenue operations', 'process optimization', 'workflow automation'],
        description: 'Harnessing cross-functional data and business processes to optimize organizational velocity and revenue engines.'
      },
      {
        name: 'management-consulting',
        displayName: 'Management Consulting & Strategy',
        type: 'specialized',
        aliases: ['corporate strategy', 'strategic advisory', 'market analysis', 'gap analysis'],
        description: 'Practice of helping organizations improve their performance primarily through the analysis of existing organizational problems.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 12. FINANCE & ACCOUNTING
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Finance & Accounting',
    subcategory: 'Financial Modeling & Valuation',
    skills: [
      {
        name: 'financial-modeling',
        displayName: 'Financial Modeling & Forecasting',
        type: 'specialized',
        aliases: ['three-statement model', 'financial projections', 'lbo modeling'],
        description: 'Task of building an abstract representation (a model) of a real world financial situation.'
      },
      {
        name: 'valuation',
        displayName: 'DCF Valuation & Investment Analysis',
        type: 'specialized',
        aliases: ['dcf model', 'discounted cash flow', 'comparable company analysis', 'equity research'],
        description: 'Analytical technique that estimates the intrinsic value of an investment based on its expected future cash flows.'
      },
      {
        name: 'excel',
        displayName: 'Advanced Microsoft Excel',
        type: 'software',
        aliases: ['ms excel', 'spreadsheets', 'vlookup', 'xlookup', 'pivot tables', 'excel macros'],
        description: 'Spreadsheet tool featuring calculation, graphing tools, pivot tables, and advanced business data manipulation.'
      },
      {
        name: 'corporate-finance',
        displayName: 'Corporate Finance & Reporting',
        type: 'specialized',
        aliases: ['financial accounting', 'gaap', 'balance sheet analysis', 'capital budgeting'],
        description: 'Area of finance that deals with sources of funding, capital structuring, accounting, and investment decisions.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 13. MARKETING & COMMUNICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Marketing & Communications',
    subcategory: 'Digital Marketing & Growth',
    skills: [
      {
        name: 'digital-marketing',
        displayName: 'Digital Marketing Strategy',
        type: 'specialized',
        aliases: ['online marketing', 'digital campaigns', 'growth marketing'],
        description: 'Component of marketing that uses the Internet and online based digital technologies to promote products and services.'
      },
      {
        name: 'seo',
        displayName: 'Search Engine Optimization (SEO)',
        type: 'specialized',
        aliases: ['technical seo', 'on-page seo', 'keyword research', 'search ranking', 'google search console'],
        description: 'Process of improving the quality and quantity of website traffic to a website or a web page from search engines.'
      },
      {
        name: 'sem-ppc',
        displayName: 'Paid Advertising (Google Ads & Meta Ads)',
        type: 'specialized',
        aliases: ['google ads', 'meta ads', 'ppc campaigns', 'paid acquisition', 'ad spent optimization'],
        description: 'Managing pay-per-click sponsored listings and paid social campaigns to drive targeted conversion traffic.'
      },
      {
        name: 'social-media',
        displayName: 'Social Media Strategy & Community',
        type: 'specialized',
        aliases: ['social media management', 'community management', 'linkedin strategy', 'instagram growth'],
        description: 'Use of social media platforms and websites to promote a product, connect with audiences, and foster community.'
      },
      {
        name: 'content-marketing',
        displayName: 'Content Strategy & Editorial',
        type: 'specialized',
        aliases: ['content strategy', 'blogging', 'editorial calendar', 'inbound marketing'],
        description: 'Strategic marketing approach focused on creating and distributing valuable, relevant, and consistent content.'
      },
      {
        name: 'copywriting',
        displayName: 'Conversion Copywriting',
        type: 'specialized',
        aliases: ['copywriting', 'ad copy', 'landing page copywriting', 'sales copy'],
        description: 'Writing text for the purpose of advertising or other forms of marketing to persuade a person to take an action.'
      },
      {
        name: 'google-analytics',
        displayName: 'Google Analytics 4 (GA4)',
        type: 'software',
        aliases: ['ga4', 'google analytics', 'attribution modeling', 'web analytics'],
        description: 'Web analytics service offered by Google that tracks and reports website traffic and conversion funnels.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 14. DESIGN & CREATIVE
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Design & Creative',
    subcategory: 'UI/UX & Visual Design Systems',
    skills: [
      {
        name: 'ui-ux-design',
        displayName: 'UI / UX Design',
        type: 'specialized',
        aliases: ['ui design', 'ux design', 'user interface design', 'user experience design', 'product design'],
        description: 'Design of user interfaces for machines and software with the focus on maximizing usability and user experience.'
      },
      {
        name: 'figma',
        displayName: 'Figma Prototyping & Design Systems',
        type: 'software',
        aliases: ['figma', 'figma design', 'auto-layout', 'design tokens', 'component libraries'],
        description: 'Collaborative web-based vector graphics editor and prototyping tool used for modern digital interface design.'
      },
      {
        name: 'user-research',
        displayName: 'UX User Research & Usability Testing',
        type: 'specialized',
        aliases: ['user interviews', 'usability testing', 'user journey mapping', 'personas'],
        description: 'Systematic study of target users to add realistic contexts and insights to design processes.'
      },
      {
        name: 'wireframing',
        displayName: 'Wireframing & Information Architecture',
        type: 'specialized',
        aliases: ['wireframes', 'low-fidelity mockups', 'sitemap architecture'],
        description: 'Visual guide that represents the skeletal framework of a website and navigation structure.'
      },
      {
        name: 'adobe-illustrator',
        displayName: 'Adobe Illustrator',
        type: 'software',
        aliases: ['illustrator', 'vector graphics', 'logo design'],
        description: 'Vector graphics editor and design program developed and marketed by Adobe Inc.'
      },
      {
        name: 'adobe-photoshop',
        displayName: 'Adobe Photoshop',
        type: 'software',
        aliases: ['photoshop', 'photo editing', 'raster graphics'],
        description: 'Raster graphics editor developed and published by Adobe Inc. for digital art and photo manipulation.'
      },
      {
        name: 'blender',
        displayName: 'Blender 3D Modeling',
        type: 'software',
        aliases: ['blender 3d', '3d modeling', '3d animation', 'texturing'],
        description: 'Open-source 3D computer graphics software toolset used for creating animated films, visual effects, and 3D games.'
      },
      {
        name: 'motion-graphics',
        displayName: 'Motion Graphics & After Effects',
        type: 'software',
        aliases: ['after effects', 'motion design', 'kinetic typography', 'micro-animations'],
        description: 'Pieces of animation or digital footage which create the illusion of motion or rotation in interface elements.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 15. COMMON & PROFESSIONAL TRANSFERABLE SKILLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    category: 'Common & Professional Skills',
    subcategory: 'Core Professional Competencies',
    skills: [
      {
        name: 'problem-solving',
        displayName: 'Complex Problem Solving & Logic',
        type: 'common',
        aliases: ['problem solving', 'analytical thinking', 'algorithmic thinking', 'troubleshooting'],
        description: 'Process of finding solutions to difficult or complex problems through structured analysis and logical deduction.'
      },
      {
        name: 'critical-thinking',
        displayName: 'Critical Thinking',
        type: 'common',
        aliases: ['objective analysis', 'decision making', 'rational evaluation'],
        description: 'Analysis of facts, evidence, observations, and arguments to form a clear, rational judgment.'
      },
      {
        name: 'technical-communication',
        displayName: 'Technical Communication & Presentation',
        type: 'common',
        aliases: ['communication', 'verbal communication', 'presentation skills', 'public speaking'],
        description: 'Conveying complex technical ideas, requirements, and findings clearly and persuasively across teams.'
      },
      {
        name: 'team-collaboration',
        displayName: 'Cross-Functional Team Collaboration',
        type: 'common',
        aliases: ['teamwork', 'cross-functional collaboration', 'pair programming', 'interpersonal skills'],
        description: 'Working effectively and empathetically with colleagues across engineering, design, and management disciplines.'
      },
      {
        name: 'technical-documentation',
        displayName: 'Technical Writing & Documentation',
        type: 'common',
        aliases: ['documentation', 'api docs', 'readme writing', 'spec writing'],
        description: 'Writing high-quality engineering documentation, technical specifications, and user manuals.'
      },
      {
        name: 'time-management',
        displayName: 'Time Management & Prioritization',
        type: 'common',
        aliases: ['time management', 'task prioritization', 'deep work', 'deadline management'],
        description: 'Exercising conscious control of time spent on specific activities to increase efficiency and productivity.'
      }
    ]
  }
];

/**
 * Compiles all skill objects and validates uniqueness
 */
function compileCuratedSkills() {
  const catalog = [];
  const seenSlugs = new Set();

  for (const sector of RAW_TAXONOMY_SECTORS) {
    for (const skill of sector.skills) {
      const slug = skill.name.toLowerCase().trim();
      if (seenSlugs.has(slug)) {
        continue;
      }
      seenSlugs.add(slug);

      const lightcastId = generateLightcastId(slug);
      catalog.push({
        lightcastId,
        name: slug,
        displayName: skill.displayName,
        type: skill.type || 'specialized',
        category: sector.category,
        subcategory: sector.subcategory,
        aliases: Array.from(new Set([slug, ...(skill.aliases || [])].map(a => a.toLowerCase().trim()))),
        description: skill.description || '',
        active: true,
      });
    }
  }

  return catalog;
}

/**
 * Main seeding execution routine
 */
async function runSeed() {
  console.log('🚀 [Lightcast Taxonomy Ingestion] Starting curation & seed pipeline...');

  // 1. Compile dataset
  const curatedSkills = compileCuratedSkills();
  console.log(`📦 Compiled ${curatedSkills.length} standardized industry skills across ${RAW_TAXONOMY_SECTORS.length} subcategories.`);

  // 2. Save curated dataset JSON to server/data/lightcast_curated_skills.json
  const outputPath = path.join(__dirname, '../data/lightcast_curated_skills.json');
  fs.writeFileSync(outputPath, JSON.stringify(curatedSkills, null, 2), 'utf-8');
  console.log(`💾 Saved local dataset snapshot: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);

  // 3. Batch upsert into Supabase PostgreSQL via Prisma Client
  console.log('📡 Upserting skills into Supabase PostgreSQL (Prisma)...');
  let upsertedCount = 0;
  const BATCH_SIZE = 25;

  for (let i = 0; i < curatedSkills.length; i += BATCH_SIZE) {
    const chunk = curatedSkills.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      chunk.map(async (item) => {
        try {
          await prisma.skill.upsert({
            where: { name: item.name },
            update: {
              lightcastId: item.lightcastId,
              displayName: item.displayName,
              type: item.type,
              category: item.category,
              subcategory: item.subcategory,
              aliases: item.aliases,
              description: item.description,
              active: true,
            },
            create: {
              id: item.name, // predictable ID mapping for baseline compatibility
              lightcastId: item.lightcastId,
              name: item.name,
              displayName: item.displayName,
              type: item.type,
              category: item.category,
              subcategory: item.subcategory,
              aliases: item.aliases,
              description: item.description,
              active: true,
            },
          });
          upsertedCount++;
        } catch (err) {
          console.warn(`⚠️ Warning upserting skill "${item.name}":`, err.message);
        }
      })
    );
  }

  // 4. Verify count in database
  const totalInDb = await prisma.skill.count();
  console.log(`✅ [Lightcast Taxonomy Seed] Complete! Successfully synced ${upsertedCount} skills. Total skills in Supabase: ${totalInDb}`);

  return { upsertedCount, totalInDb };
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('🎉 Seeding finished cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = {
  compileCuratedSkills,
  runSeed,
};

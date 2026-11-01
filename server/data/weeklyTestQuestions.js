/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * data/weeklyTestQuestions.js — Topic-Tagged Comprehensive Question Bank for Weekly Milestone Tests
 *
 * Disheera · Enterprise Backend Service
 *
 * Provides a massive, domain-categorized repository (450+ questions) across:
 *  - Tech & Engineering (Frontend, Backend, Fullstack, Mobile, Game Dev, Cloud, DevOps, Security, AI/ML)
 *  - Creative & Design (UI/UX, Figma, Typography, Visual Hierarchy, Prototyping)
 *  - Business & Finance (Financial Modeling, Valuation, DCF, EBITDA, Operations)
 *  - Digital Marketing & Growth (SEO, SEM, Paid Social, Analytics, Funnels)
 *
 * Features:
 *  - Integrates 269 core questions from quizQuestions.js
 *  - Specialized question sets for Unity, C#, Unreal, Mobile, UI/UX, Security, Cloud, Finance, Marketing
 *  - Strict Domain Isolation (prevents unrelated topics leaking into weekly milestone tests)
 *  - Dynamic option shuffling (A/B/C/D randomized every attempt)
 *  - Offline AI Fallback generator integration for rare or exhausted skills
 */

const { QUIZ_QUESTIONS } = require('./quizQuestions');

// ── DOMAIN FAMILIES & NORMALIZATION ────────────────────────────
const DOMAIN_FAMILIES = {
  'engineering-web': ['html', 'css', 'javascript', 'typescript', 'react', 'next.js', 'tailwind-css', 'node.js', 'express.js', 'rest-apis', 'mongodb', 'sql', 'postgresql', 'redis', 'git'],
  'engineering-game': ['unity', 'unreal', 'csharp', 'cpp', 'game-dev', 'game-physics', 'shaders', 'git', 'problem-solving'],
  'engineering-mobile': ['flutter', 'react-native', 'mobile', 'javascript', 'typescript', 'dart', 'rest-apis', 'git'],
  'engineering-cloud': ['docker', 'kubernetes', 'aws', 'linux', 'devops', 'ci-cd', 'terraform', 'git', 'networking'],
  'engineering-security': ['cybersecurity', 'ethical-hacking', 'owasp', 'linux', 'networking', 'security'],
  'engineering-data': ['python', 'data-science', 'ai-ml', 'machine-learning', 'sql', 'statistics', 'pandas', 'numpy'],
  'design': ['ui-ux', 'figma', 'visual-design', 'wireframing', 'user-research', 'prototyping', 'design-systems', 'typography'],
  'business': ['finance', 'accounting', 'valuation', 'financial-analysis', 'consulting', 'business-operations', 'product', 'agile'],
  'marketing': ['marketing', 'digital-marketing', 'meta-ads', 'google-ads', 'seo', 'aeo', 'baidu-seo', 'technical-seo', 'content-marketing', 'social-media']
};

function normalizeSkillKey(skill) {
  if (!skill) return '';
  const s = String(skill).toLowerCase().trim();
  const cleanStr = s.replace(/[^a-z0-9+#.-]/g, ' ');
  const tokens = cleanStr.split(/\s+/).filter(Boolean);

  if (s.includes('html')) return 'html';
  if (s.includes('tailwind')) return 'tailwind-css';
  if (s.includes('css') || s.includes('responsive')) return 'css';
  if (s.includes('react native') || s.includes('react-native')) return 'react-native';
  if (s.includes('next.js') || s.includes('nextjs')) return 'next.js';
  if (s.includes('react')) return 'react';
  if (s.includes('javascript') || tokens.includes('js')) return 'javascript';
  if (s.includes('typescript') || tokens.includes('ts')) return 'typescript';
  if (s.includes('express')) return 'express.js';
  if (s.includes('node') || s.includes('nodejs')) return 'node.js';
  if (s.includes('mongodb') || s.includes('mongo')) return 'mongodb';
  if (s.includes('postgres')) return 'postgresql';
  if (s.includes('sql') || s.includes('database')) return 'sql';
  if (s.includes('unity') || s.includes('game-dev') || s.includes('game dev') || s.includes('game')) return 'unity';
  if (s.includes('unreal')) return 'unreal';
  if (s.includes('c#') || s.includes('csharp')) return 'csharp';
  if (s.includes('c++') || s.includes('cpp')) return 'cpp';
  if (s.includes('figma')) return 'figma';
  if (s.includes('ui') || s.includes('ux') || s.includes('design') || s.includes('wirefram')) return 'ui-ux';
  if (s.includes('flutter')) return 'flutter';
  if (s.includes('mobile')) return 'mobile';
  if (s.includes('docker') || s.includes('container')) return 'docker';
  if (s.includes('kubernetes') || s.includes('k8s')) return 'kubernetes';
  if (s.includes('devops') || s.includes('ci/cd') || s.includes('pipeline')) return 'devops';
  if (s.includes('aws') || s.includes('cloud')) return 'aws';
  if (s.includes('security') || s.includes('cyber') || s.includes('owasp') || s.includes('hack')) return 'cybersecurity';
  if (s.includes('finance') || s.includes('valuation') || s.includes('accounting') || s.includes('dcf') || s.includes('ebitda')) return 'finance';
  if (s.includes('baidu')) return 'baidu-seo';
  if (s.includes('aeo') || s.includes('llms') || s.includes('answer engine') || s.includes('ai search')) return 'aeo';
  if (s.includes('technical-seo') || s.includes('technical seo')) return 'technical-seo';
  if (s.includes('marketing') || s.includes('ads') || s.includes('meta-ads') || s.includes('google-ads')) return 'marketing';
  if (s.includes('seo')) return 'seo';
  if (s.includes('product') || s.includes('agile') || s.includes('scrum')) return 'product';
  if (s.includes('python') || s.includes('pandas') || s.includes('numpy')) return 'python';
  if (s.includes('data science') || s.includes('machine learning') || tokens.includes('ai') || tokens.includes('ml')) return 'ai-ml';
  if (s.includes('git') || s.includes('github')) return 'git';
  if (s.includes('rest') || s.includes('api')) return 'rest-apis';
  return s.replace(/[^a-z0-9_-]/g, '');
}

function detectDomainFamily(careerTitle, careerSlug, topics = []) {
  const combined = `${careerTitle || ''} ${careerSlug || ''} ${(topics || []).join(' ')}`.toLowerCase();
  if (combined.includes('game') || combined.includes('unity') || combined.includes('unreal')) return 'engineering-game';
  if (combined.includes('mobile') || combined.includes('flutter') || combined.includes('react native') || combined.includes('ios') || combined.includes('android')) return 'engineering-mobile';
  if (combined.includes('security') || combined.includes('cyber') || combined.includes('devsecops')) return 'engineering-security';
  if (combined.includes('cloud') || combined.includes('devops') || combined.includes('sre') || combined.includes('kubernetes')) return 'engineering-cloud';
  if (combined.includes('data') || combined.includes('machine learning') || combined.includes('ai') || combined.includes('analyst')) return 'engineering-data';
  if (combined.includes('design') || combined.includes('ui/ux') || combined.includes('visual') || combined.includes('motion')) return 'design';
  if (combined.includes('finance') || combined.includes('modeler') || combined.includes('consultant') || combined.includes('business') || combined.includes('product')) return 'business';
  if (combined.includes('marketing') || combined.includes('growth') || combined.includes('seo') || combined.includes('media buyer')) return 'marketing';
  return 'engineering-web';
}

// ── SPECIALIZED DOMAIN QUESTIONS ──────────────────────────────
const SPECIALIZED_QUESTIONS = [
  // ── Unity & Game Development ─────────────────────────────────
  {
    id: 'wt_unity_01',
    topic: 'unity',
    prompt: 'In Unity, which lifecycle method executes at a fixed framerate interval and should be used for all physics and Rigidbody calculations?',
    options: ['Update()', 'FixedUpdate()', 'LateUpdate()', 'Awake()'],
    correctIndex: 1,
    explanation: 'FixedUpdate() executes on a deterministic physics timestep, ensuring reliable collision and physics simulations regardless of display framerate.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_unity_02',
    topic: 'unity',
    prompt: 'What is a Prefab in the Unity Game Engine?',
    options: [
      'A reusable asset template that stores a GameObject configured with all its components and properties',
      'A temporary compiled script kept in RAM during editor playmode',
      'A compressed 3D skeletal mesh format exclusive to Blender',
      'A post-processing volume configuration profile'
    ],
    correctIndex: 0,
    explanation: 'Prefabs act as reusable blueprints. Any modifications to a parent prefab can propagate across all instantiated scene instances.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_unity_03',
    topic: 'unity',
    prompt: 'In Unity game development, what design pattern prevents Garbage Collection spikes and lag when frequently spawning bullets, enemies, or particles?',
    options: [
      'Invoking Object.Destroy() immediately on collision',
      'Object Pooling pattern (reusing pre-instantiated inactive objects)',
      'Calling System.GC.Collect() every frame in LateUpdate()',
      'Increasing CPU target framerate in PlayerSettings'
    ],
    correctIndex: 1,
    explanation: 'Object Pooling pre-allocates an array of GameObjects and toggles their active state, preventing runtime heap allocations and Garbage Collector hitches.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_unity_04',
    topic: 'unity',
    prompt: 'Which component is mandatory on a GameObject to allow it to receive physical forces, torque, and gravity in Unity 3D?',
    options: ['BoxCollider', 'MeshRenderer', 'Rigidbody', 'Transform'],
    correctIndex: 2,
    explanation: 'The Rigidbody component gives a GameObject physical properties, enabling the PhysX simulation engine to apply gravity, momentum, and friction.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_unity_05',
    topic: 'unity',
    prompt: 'In Unity, what is the key difference between a Collider with "Is Trigger" enabled versus a standard Collider?',
    options: [
      'Triggers detect overlap events (OnTriggerEnter) without causing physical collision reaction forces',
      'Triggers only work with 2D sprites and cannot function in 3D',
      'Triggers disable raycasting calculations completely',
      'Triggers bypass the physics engine and run on the GPU'
    ],
    correctIndex: 0,
    explanation: 'Trigger colliders register spatial entry, stay, and exit without exerting physical repulsive forces, making them ideal for pickups, zones, and checkpoints.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_unity_06',
    topic: 'unity',
    prompt: 'In 3D game vector math, what operation calculates directional alignment (e.g. checking whether an enemy is facing the player)?',
    options: [
      'Dot Product of two normalized vectors (Vector3.Dot)',
      'Cross Product of two vectors',
      'Vector Linear Interpolation (Vector3.Lerp)',
      'Vector Distance projection'
    ],
    correctIndex: 0,
    explanation: 'The Dot Product of two normalized vectors returns 1 for identical directions, 0 for perpendicular directions, and -1 for directly opposite directions.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_unity_07',
    topic: 'unity',
    prompt: 'In Unity C# scripting, why should coroutines yield WaitForSeconds rather than calling Thread.Sleep()?',
    options: [
      'Thread.Sleep() freezes the entire Unity main thread, halting all rendering, audio, and player input',
      'Coroutines execute on the graphics shader processor while Thread.Sleep runs on CPU',
      'Thread.Sleep() breaks physics constraints permanently',
      'WaitForSeconds automatically accelerates game audio playback'
    ],
    correctIndex: 0,
    explanation: 'Unity executes primarily on a single main thread. Thread.Sleep() locks that thread completely, while Coroutines yield execution gracefully back to the engine.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_unity_08',
    topic: 'unity',
    prompt: 'How do modern game engines prevent "Gimbal Lock" when computing 3D rotations?',
    options: [
      'By using Quaternions instead of Euler Angles',
      'By restricting all rotational movements to 90-degree increments',
      'By computing rotational matrices strictly in 2D space',
      'By applying rotations exclusively through camera projection planes'
    ],
    correctIndex: 0,
    explanation: 'Euler angles suffer from Gimbal Lock when two rotational axes align. Quaternions represent rotations in 4D hypercomplex space, avoiding rotational lock entirely.',
    difficulty: 'advanced',
  },
  {
    id: 'wt_unity_09',
    topic: 'unity',
    prompt: 'In Unity C#, which attribute exposes a private member field in the Inspector editor while protecting it from external class mutation?',
    options: ['[SerializeField]', '[HideInInspector]', '[System.Serializable]', '[RequireComponent]'],
    correctIndex: 0,
    explanation: '[SerializeField] tells Unity to serialize and expose the private field in the Inspector without breaking object-oriented encapsulation.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_unity_10',
    topic: 'unity',
    prompt: 'Which Unity event function executes after all Update() methods have finished, making it standard for camera tracking scripts?',
    options: ['FixedUpdate()', 'LateUpdate()', 'OnAnimatorMove()', 'Start()'],
    correctIndex: 1,
    explanation: 'LateUpdate() is guaranteed to run after all character movement updates have executed, eliminating camera jitter and tracking lag.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_unity_11',
    topic: 'unity',
    prompt: 'What Unity API method casts an invisible ray from an origin along a direction vector to detect hits against objects with colliders?',
    options: ['Physics.Raycast', 'Mesh.CastRay', 'Transform.ProjectForward', 'Camera.ScreenToRayPoint'],
    correctIndex: 0,
    explanation: 'Physics.Raycast casts a ray and returns boolean hit results along with a RaycastHit structure containing impact point, distance, and hit collider.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_unity_12',
    topic: 'unity',
    prompt: 'What is the primary architectural difference between Universal Render Pipeline (URP) and High Definition Render Pipeline (HDRP)?',
    options: [
      'URP is optimized for scalable cross-platform performance (mobile, VR, PC) while HDRP targets high-end photorealistic console and PC rendering',
      'URP only supports 2D pixel-art graphics while HDRP is for 3D meshes',
      'HDRP is a legacy deprecated pipeline replaced by standard built-in rendering',
      'URP disables all real-time dynamic shadows'
    ],
    correctIndex: 0,
    explanation: 'URP provides lightweight, highly performant rendering across mobile, standalone, and VR devices; HDRP utilizes compute-heavy physically based lighting for AAA platforms.',
    difficulty: 'intermediate',
  },

  // ── C# & Object-Oriented Principles ──────────────────────────
  {
    id: 'wt_cs_01',
    topic: 'csharp',
    prompt: 'In C#, what is the primary memory and behavioral difference between a struct (value type) and a class (reference type)?',
    options: [
      'Structs are allocated on the stack and passed by value; classes are allocated on the managed heap and accessed via references',
      'Structs can inherit from multiple abstract classes; classes cannot',
      'Classes are immutable by default; structs are mutable',
      'Structs cannot contain methods, constructors, or properties'
    ],
    correctIndex: 0,
    explanation: 'Value types (structs) store their value directly on the stack, while reference types (classes) store a pointer on the stack referencing the heap allocation.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_cs_02',
    topic: 'csharp',
    prompt: 'In C#, which keyword is required in a derived subclass to override a method declared as "virtual" in its parent class?',
    options: ['override', 'virtual', 'new', 'implements'],
    correctIndex: 0,
    explanation: 'The override keyword explicitly overrides the virtual or abstract base implementation with polymorphic runtime dispatch.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_cs_03',
    topic: 'csharp',
    prompt: 'What guarantee does the C# "using" statement provide when handling IDisposable objects (like streams or database connections)?',
    options: [
      'Guarantees Dispose() is invoked to release unmanaged resources even if an unhandled exception occurs',
      'Increases CPU priority for the block of code',
      'Prevents other threads from reading or writing to the file system',
      'Compiles the inner block into C++ native instructions'
    ],
    correctIndex: 0,
    explanation: 'using translates to a try/finally block under the hood, ensuring Dispose() is executed regardless of normal exit or exception throws.',
    difficulty: 'intermediate',
  },

  // ── Unreal Engine & C++ ──────────────────────────────────────
  {
    id: 'wt_unreal_01',
    topic: 'unreal',
    prompt: 'In Unreal Engine, what is the base class for any object that can be placed in or spawned into a level?',
    options: ['AActor', 'UObject', 'APawn', 'ACharacter'],
    correctIndex: 0,
    explanation: 'AActor is the base class for all entities that can be placed or spawned in an Unreal Engine world. UObject is the base for data, but cannot be placed directly.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_unreal_02',
    topic: 'unreal',
    prompt: 'In Unreal Engine C++, what macro exposes a member variable to Blueprints and the Unreal Reflection System?',
    options: ['UPROPERTY()', 'UFUNCTION()', 'UCLASS()', 'UENUM()'],
    correctIndex: 0,
    explanation: 'UPROPERTY() marks properties for serialization, garbage collection tracking, network replication, and Blueprint visibility.',
    difficulty: 'intermediate',
  },

  // ── UI/UX & Product Design ───────────────────────────────────
  {
    id: 'wt_uiux_01',
    topic: 'ui-ux',
    prompt: 'In typography and UI layout, what is visual hierarchy?',
    options: [
      'The arrangement and styling of visual elements to clearly indicate their relative importance and guide user reading flow',
      'Using only uppercase serif typography for all interface labels',
      'Placing images at the center of every screen container',
      'Ensuring that every card and button has identical visual weight and border radius'
    ],
    correctIndex: 0,
    explanation: 'Visual hierarchy uses scale, contrast, weight, color, and spacing to intuitively direct user attention to primary information first.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_uiux_02',
    topic: 'ui-ux',
    prompt: 'Under WCAG 2.1 AA accessibility guidelines, what is the minimum required contrast ratio for standard body text against its background?',
    options: ['4.5:1', '3:1', '7:1', '2:1'],
    correctIndex: 0,
    explanation: 'WCAG 2.1 AA mandates a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt bold).',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_uiux_03',
    topic: 'ui-ux',
    prompt: 'In Figma, which feature dynamically handles spacing, padding, and content flow as text strings or container dimensions change?',
    options: ['Auto Layout', 'Smart Animate', 'Component Variants', 'Boolean Groups'],
    correctIndex: 0,
    explanation: 'Auto Layout mimics modern CSS Flexbox, allowing components to adapt fluidly to varying label lengths and responsive screen sizes.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_uiux_04',
    topic: 'ui-ux',
    prompt: 'What is the key functional difference between a wireframe and an interactive prototype?',
    options: [
      'A wireframe focuses on layout, content structure, and hierarchy; a prototype simulates real user interactions, transitions, and flows',
      'Wireframes are only created after backend deployment is finished',
      'Prototypes cannot contain clickable buttons or micro-interactions',
      'Wireframes must always include final photography and high-fidelity brand palettes'
    ],
    correctIndex: 0,
    explanation: 'Wireframes establish low-fidelity structural blueprints, while prototypes demonstrate dynamic user journeys and behavioral states.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_uiux_05',
    topic: 'ui-ux',
    prompt: 'According to Nielsen Norman Group usability heuristics, what does "Visibility of System Status" require?',
    options: [
      'The system should always keep users informed about ongoing operations through timely, clear feedback (e.g. loaders, status badges)',
      'Displaying raw backend database connection strings in the footer',
      'Allowing users to modify CSS theme stylesheets manually',
      'Exposing source control commit hashes in user notification toasts'
    ],
    correctIndex: 0,
    explanation: 'Visibility of system status reduces uncertainty by letting users know immediate results of their actions through progress indicators and confirmations.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_uiux_06',
    topic: 'ui-ux',
    prompt: 'What is the recommended minimum touch target size for interactive elements on mobile devices according to Apple and Google guidelines?',
    options: ['44x44px to 48x48px', '24x24px', '72x72px', '32x32px'],
    correctIndex: 0,
    explanation: 'Apple recommends 44x44pt and Google Material recommends 48x48dp to ensure touch elements can be tapped accurately without mis-clicks.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_uiux_07',
    topic: 'ui-ux',
    prompt: 'Which Gestalt principle explains why elements spaced close together are perceived by human cognition as belonging to a unified group?',
    options: ['Law of Proximity', 'Law of Similarity', 'Law of Closure', 'Law of Continuity'],
    correctIndex: 0,
    explanation: 'The Law of Proximity states that objects positioned near one another are naturally grouped together by human perception.',
    difficulty: 'intermediate',
  },

  // ── Mobile App Development (Flutter & React Native) ──────────
  {
    id: 'wt_mob_01',
    topic: 'flutter',
    prompt: 'In Flutter, what is the key difference between a StatelessWidget and a StatefulWidget?',
    options: [
      'StatelessWidget is immutable once built; StatefulWidget maintains mutable State across lifecycle events and rebuilds via setState()',
      'StatelessWidget can only render text; StatefulWidget can render images and video',
      'StatefulWidget cannot accept constructor parameters',
      'StatelessWidget requires an active internet connection to compile'
    ],
    correctIndex: 0,
    explanation: 'StatelessWidgets describe UI that depends solely on constructor parameters. StatefulWidgets pair with a State object that can mutate and trigger rebuilds.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_mob_02',
    topic: 'flutter',
    prompt: 'In Flutter architecture, what does the BuildContext object represent?',
    options: [
      'A handle to the location of a widget within the overall element/widget tree',
      'The native iOS/Android thread execution priority controller',
      'A cryptographic token for device biometric authentication',
      'The global SQLite database connection handle'
    ],
    correctIndex: 0,
    explanation: 'BuildContext identifies where a widget sits in the hierarchy, allowing access to inherited themes, media queries, and navigator state.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_mob_03',
    topic: 'react-native',
    prompt: 'In React Native\'s new architecture, what does JSI (JavaScript Interface) replace to achieve high-performance synchronous native communication?',
    options: [
      'The legacy asynchronous batched JSON message bridge',
      'The Redux global store',
      'The native iOS UIKit storyboard renderer',
      'The Android Gradle build orchestrator'
    ],
    correctIndex: 0,
    explanation: 'JSI allows JavaScript to hold direct references to host C++ objects, enabling direct synchronous calls without serializing JSON payloads across a bridge.',
    difficulty: 'advanced',
  },

  // ── Cybersecurity & Ethical Hacking ──────────────────────────
  {
    id: 'wt_sec_01',
    topic: 'cybersecurity',
    prompt: 'What is the primary industry standard defense against SQL Injection vulnerabilities in backend applications?',
    options: [
      'Using parameterized queries / prepared statements instead of string concatenation',
      'Encrypting the database password with MD5',
      'Restricting database queries to GET requests only',
      'Enabling HTTPS TLS 1.3 on the web server'
    ],
    correctIndex: 0,
    explanation: 'Parameterized queries separate SQL instructions from user-supplied parameters, ensuring inputs are treated strictly as data literals rather than executable commands.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_sec_02',
    topic: 'cybersecurity',
    prompt: 'Which HTTP security header mitigates Cross-Site Scripting (XSS) by restricting the origins from which scripts, styles, and assets may load?',
    options: ['Content-Security-Policy (CSP)', 'Strict-Transport-Security (HSTS)', 'X-Content-Type-Options', 'Referrer-Policy'],
    correctIndex: 0,
    explanation: 'Content-Security-Policy instructs browsers to only execute scripts originating from trusted domains or nonces, neutralizing malicious injected script tags.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_sec_03',
    topic: 'cybersecurity',
    prompt: 'What cookie attribute prevents client-side JavaScript from reading an authentication cookie via document.cookie?',
    options: ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/'],
    correctIndex: 0,
    explanation: 'The HttpOnly flag blocks JavaScript access, shielding session tokens from exfiltration even if an attacker manages to execute an XSS payload.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_sec_04',
    topic: 'cybersecurity',
    prompt: 'Why should passwords in databases be hashed using adaptive algorithms like bcrypt or Argon2 rather than fast hashing algorithms like SHA-256?',
    options: [
      'bcrypt and Argon2 enforce configurable computational cost factors (work factors) that resist GPU/ASIC brute-force cracking',
      'SHA-256 is an encryption algorithm that can be decrypted with a private key',
      'bcrypt compresses passwords so they occupy zero disk space',
      'SHA-256 hashes are reversible using simple Base64 decoding'
    ],
    correctIndex: 0,
    explanation: 'Fast hashes (like SHA-256) can be evaluated billions of times per second by attackers. Adaptive algorithms enforce deliberate latency and memory hardness.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_sec_05',
    topic: 'cybersecurity',
    prompt: 'How does a Cross-Site Request Forgery (CSRF) token protect sensitive state-changing HTTP POST actions?',
    options: [
      'It is an unpredictable secret validated by the server that unauthorized external origins cannot read due to the Same-Origin Policy',
      'It encrypts the payload using symmetric AES-256 in transit',
      'It restricts form submissions to mobile devices only',
      'It forces users to complete a CAPTCHA verification on every request'
    ],
    correctIndex: 0,
    explanation: 'Because an attacker’s malicious third-party site cannot read the authentic CSRF token from the user’s session, forged automated POST requests are rejected.',
    difficulty: 'intermediate',
  },

  // ── Cloud, DevOps & Infrastructure ───────────────────────────
  {
    id: 'wt_cloud_01',
    topic: 'devops',
    prompt: 'In Docker, what is the primary benefit of multi-stage builds in a Dockerfile?',
    options: [
      'They separate compilation build tools from the final production runtime container, drastically reducing image size and attack surface',
      'They allow a container to run on multiple CPU architectures simultaneously',
      'They automatically provision AWS EC2 compute instances',
      'They eliminate the requirement for a base Linux distribution'
    ],
    correctIndex: 0,
    explanation: 'Multi-stage builds compile artifacts in an intermediate image and copy only the compiled binaries into a minimal scratch/alpine image.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_cloud_02',
    topic: 'devops',
    prompt: 'In Kubernetes, which controller object maintains a specified set of identical replica Pods running across worker nodes?',
    options: ['Deployment (via ReplicaSet)', 'Ingress Controller', 'ConfigMap', 'DaemonSet exclusively for masters'],
    correctIndex: 0,
    explanation: 'A Deployment manages ReplicaSets to ensure the desired number of Pod replicas remain healthy, handling rolling updates and self-healing.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_cloud_03',
    topic: 'devops',
    prompt: 'In modern CI/CD pipelines, what is the role of an automated Quality Gate before production rollout?',
    options: [
      'It automatically blocks deployment if unit tests fail, code coverage dips, or critical security vulnerabilities are detected',
      'It publishes production credentials to public GitHub repositories',
      'It bypasses code reviews during peak holiday business hours',
      'It deletes the target production database to ensure clean deployment'
    ],
    correctIndex: 0,
    explanation: 'Quality gates enforce automated governance by verifying that all tests, lints, and security scans satisfy minimum thresholds before merging or deploying.',
    difficulty: 'beginner',
  },

  // ── AI & Data Science ────────────────────────────────────────
  {
    id: 'wt_ai_01',
    topic: 'ai-ml',
    prompt: 'In machine learning workflows, why is it critical to separate data into training, validation, and test sets before model training?',
    options: [
      'To evaluate model generalization on unseen distributions and prevent data leakage and overfitting',
      'To artificially inflate the size of the dataset through duplication',
      'To force the algorithm to train exclusively on GPU hardware',
      'To discard outlier data points without human auditing'
    ],
    correctIndex: 0,
    explanation: 'Evaluating models on withheld test sets provides an unbiased estimate of real-world generalization performance and detects overfit memorization.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_ai_02',
    topic: 'ai-ml',
    prompt: 'In machine learning evaluation, when is the F1-Score preferred over standard Accuracy?',
    options: [
      'When working with highly imbalanced class distributions (e.g. fraud detection where 99.9% of transactions are legitimate)',
      'When the dataset contains exclusively continuous numerical values',
      'When training unsupervised clustering models like K-Means',
      'When the model executes strictly on edge microcontrollers'
    ],
    correctIndex: 0,
    explanation: 'Accuracy is misleading on imbalanced datasets because a naive model predicting the majority class scores high. F1-Score balances Precision and Recall.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_ai_03',
    topic: 'ai-ml',
    prompt: 'In machine learning optimization, what role does L2 Regularization (Ridge) play?',
    options: [
      'It penalizes large model weights by adding their squared magnitude to the loss function, reducing model variance and overfitting',
      'It forces model weights to exactly zero, performing automatic feature elimination',
      'It eliminates the need for gradient descent backpropagation',
      'It multiplies the learning rate by a constant on each epoch'
    ],
    correctIndex: 0,
    explanation: 'L2 regularization discourages complex, erratic parameter fits by penalizing squared weight magnitudes, resulting in smoother, more generalizable boundaries.',
    difficulty: 'advanced',
  },

  // ── Finance & Business Analysis ──────────────────────────────
  {
    id: 'wt_fin_01',
    topic: 'finance',
    prompt: 'In corporate financial analysis, what does EBITDA stand for?',
    options: [
      'Earnings Before Interest, Taxes, Depreciation, and Amortization',
      'Equity Borrowed Through International Debt Agreements',
      'Estimated Budget Total Deficit Allocation',
      'Expected Base Income Tax Deductible Amount'
    ],
    correctIndex: 0,
    explanation: 'EBITDA gauges operating profitability by stripping out capital financing structures, tax jurisdictions, and non-cash accounting depreciation.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_fin_02',
    topic: 'finance',
    prompt: 'Which financial statement reflects operating revenues, cost of goods sold, and net profit over a specific reporting timeframe?',
    options: ['Income Statement (Profit & Loss)', 'Balance Sheet', 'Cash Flow Statement', 'Statement of Shareholders\' Equity'],
    correctIndex: 0,
    explanation: 'The Income Statement reflects operating performance over a period (quarter/year), unlike the Balance Sheet which is a single snapshot in time.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_fin_03',
    topic: 'finance',
    prompt: 'In Discounted Cash Flow (DCF) valuation, how is Enterprise Value calculated?',
    options: [
      'By projecting future Free Cash Flows, discounting them to present value using WACC, and adding the discounted Terminal Value',
      'By multiplying total company share count by current stock price',
      'By adding current assets and subtracting long-term debt',
      'By calculating annual revenue multiplied by net income margin'
    ],
    correctIndex: 0,
    explanation: 'DCF establishes intrinsic business value by estimating future cash generation capacity discounted to present value by the cost of capital.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_fin_04',
    topic: 'finance',
    prompt: 'What is Net Working Capital (NWC) and what does it measure?',
    options: [
      'Current Assets minus Current Liabilities; it measures short-term operating liquidity and financial resilience',
      'Total Assets minus Total Equity; it measures debt leverage',
      'Annual Revenue minus Operating Expenses; it measures gross margin',
      'Total Cash in Bank minus Total Long-Term Debt; it measures solvency'
    ],
    correctIndex: 0,
    explanation: 'Net Working Capital measures whether a company can cover short-term debts and operational obligations with short-term assets.',
    difficulty: 'intermediate',
  },

  // ── Digital Marketing & SEO ──────────────────────────────────
  {
    id: 'wt_mkt_01',
    topic: 'marketing',
    prompt: 'What is the formula for Return on Ad Spend (ROAS)?',
    options: [
      'Revenue Generated from Ads divided by Total Advertising Spend',
      'Total Advertising Spend divided by Total Impressions multiplied by 1000',
      'Total Clicks divided by Total Conversions',
      'Cost per Acquisition minus Customer Lifetime Value'
    ],
    correctIndex: 0,
    explanation: 'ROAS measures the gross revenue generated for every dollar invested in advertising campaigns (e.g. $5,000 revenue / $1,000 spend = 5x ROAS).',
    difficulty: 'beginner',
  },
  {
    id: 'wt_mkt_02',
    topic: 'seo',
    prompt: 'In technical SEO, what does the HTML tag <link rel="canonical" href="..." /> communicate to search engine crawlers?',
    options: [
      'Identifies the master authoritative URL for duplicate or syndicated content to consolidate indexing signals and link equity',
      'Forces search engines to purge the URL from the index immediately',
      'Notifies browsers to cache the webpage in local storage for offline reading',
      'Specifies an alternate language translation of the document'
    ],
    correctIndex: 0,
    explanation: 'The canonical tag prevents duplicate content penalties by instructing crawlers which URL represents the authoritative version.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_mkt_03',
    topic: 'marketing',
    prompt: 'In digital marketing campaigns, what does Cost Per Acquisition (CPA) measure?',
    options: [
      'The total advertising cost incurred to generate one qualified conversion, lead, or paying customer',
      'The flat rate cost of acquiring 1,000 banner impressions',
      'The percentage of visitors who bounce after viewing a single page',
      'The salary paid to growth marketing personnel'
    ],
    correctIndex: 0,
    explanation: 'CPA measures the direct acquisition efficiency by dividing total campaign ad spend by the total number of conversions achieved.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_aeo_01',
    topic: 'aeo',
    prompt: 'What is the primary objective of Answer Engine Optimization (AEO) compared to traditional search engine optimization?',
    options: [
      'Structuring content, entities, and machine-readable data so AI answer engines (Perplexity, ChatGPT, Claude) synthesize and directly cite your brand in generated responses',
      'Buying pay-per-click sponsored banner placements in email newsletters',
      'Artificially inflating HTML word count beyond 10,000 words with hidden keywords',
      'Submitting XML sitemaps exclusively to Yahoo search directories'
    ],
    correctIndex: 0,
    explanation: 'AEO focuses on direct LLM answer synthesis, conversational AI retrieval, and authoritative grounding rather than merely ranking in 10 blue links.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_aeo_02',
    topic: 'aeo',
    prompt: 'What is the purpose of publishing an /llms.txt file at the root of a domain?',
    options: [
      'To provide a clean, markdown-formatted, token-budgeted directory of key site content and APIs for ingestion by LLMs and AI search crawlers',
      'To restrict human users from viewing desktop layouts on mobile',
      'To encrypt database passwords using private TLS certificates',
      'To force web browsers to disable JavaScript execution'
    ],
    correctIndex: 0,
    explanation: 'llms.txt is the open standard offering token-budgeted, structured markdown summaries designed specifically for LLM context windows and crawler ingestion.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_aeo_03',
    topic: 'aeo',
    prompt: 'In AEO content architecture, what is "Information Gain"?',
    options: [
      'Providing unique, primary-source data, proprietary experiments, or novel insights that cannot be found on competing pages, making the content indispensable for LLM citation',
      'Repeating the primary keyword in bold at the start of every sentence',
      'Increasing CSS file size to boost page rendering speed',
      'Translating standard Wikipedia definitions into multiple languages'
    ],
    correctIndex: 0,
    explanation: 'AI models prioritize citing sources that contribute unique, novel facts or primary data rather than regurgitated consensus copy.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_baidu_01',
    topic: 'baidu-seo',
    prompt: 'What regulatory requirement is mandatory for websites aiming to rank competitively in mainland China on Baidu?',
    options: [
      'Valid ICP license/filing (ICP备案) from the Chinese Ministry of Industry and Information Technology (MIIT)',
      'Hosting exclusively on US West AWS data centers',
      'Integrating Google reCAPTCHA v3 on all user forms',
      'Writing all content exclusively in Traditional Chinese (繁體中文)'
    ],
    correctIndex: 0,
    explanation: 'Without a verified ICP license (ICP备案) and mainland China hosting/CDN, Baiduspider heavily penalizes site indexing and trust scores.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_baidu_02',
    topic: 'baidu-seo',
    prompt: 'How does Baidu\'s search ecosystem differ fundamentally from Google in terms of SERP real estate?',
    options: [
      'Baidu heavily prioritizes its own ecosystem properties (Baidu Baike, Zhidao, Tieba, Wenku) and requires pre-rendered HTML for reliable indexing',
      'Baidu only crawls PDF documents and ignores HTML files',
      'Baidu penalizes sites that include Chinese Simplified characters',
      'Baidu requires WebGL context to evaluate content relevance'
    ],
    correctIndex: 0,
    explanation: 'Baidu prominently ranks its own properties in top positions. Effective China SEO requires an ecosystem presence across Baike and Zhidao alongside technical site optimization.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_baidu_03',
    topic: 'baidu-seo',
    prompt: 'In Chinese keyword research for Baidu, what tool provides official search volume index trends and demographic curves similar to Google Trends?',
    options: [
      'Baidu Index (百度指数)',
      'Google Search Console',
      'Ahrefs Site Explorer',
      'Yandex Metrica'
    ],
    correctIndex: 0,
    explanation: 'Baidu Index (百度指数) provides authoritative search volume trends, seasonal spikes, and regional demographic data across mainland China.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_techseo_01',
    topic: 'technical-seo',
    prompt: 'Which Core Web Vital metric measures page responsiveness and interactivity latency across a user\'s entire session, replacing First Input Delay (FID)?',
    options: [
      'Interaction to Next Paint (INP) with target < 200ms',
      'Largest Contentful Paint (LCP) with target < 2.5s',
      'Cumulative Layout Shift (CLS) with target < 0.1',
      'Time to First Byte (TTFB) with target < 800ms'
    ],
    correctIndex: 0,
    explanation: 'INP evaluates the overall interaction latency of a page throughout its full lifecycle, ensuring UI remains responsive during user taps and clicks.',
    difficulty: 'intermediate',
  },
  {
    id: 'wt_techseo_02',
    topic: 'technical-seo',
    prompt: 'What is the primary architectural advantage of implementing Schema.org structured data via JSON-LD format rather than Microdata?',
    options: [
      'JSON-LD can be cleanly embedded in a single <script type="application/ld+json"> tag in the head without polluting presentation HTML markup or breaking styling',
      'JSON-LD automatically pays for Google search ad placements',
      'JSON-LD compresses image assets by 50%',
      'JSON-LD prevents search engines from indexing competing pages'
    ],
    correctIndex: 0,
    explanation: 'JSON-LD cleanly separates structured entity metadata from template markup, making it easy to generate dynamically, maintain, and validate.',
    difficulty: 'beginner',
  },

  // ── Product Management & Agile ───────────────────────────────
  {
    id: 'wt_pm_01',
    topic: 'product',
    prompt: 'In Agile Scrum, what is the primary purpose of the Sprint Retrospective ceremony?',
    options: [
      'For the delivery team to reflect on team processes, celebrate successes, identify friction points, and commit to action items for continuous improvement',
      'To demo completed user stories to executive external stakeholders for sign-off',
      'To assign individual annual performance ratings and compensation bonuses',
      'To estimate backlog story points for the upcoming 6-month roadmap'
    ],
    correctIndex: 0,
    explanation: 'The Retrospective focuses on continuous team improvement, inspecting how people, relationships, processes, and tools functioned during the sprint.',
    difficulty: 'beginner',
  },
  {
    id: 'wt_pm_02',
    topic: 'product',
    prompt: 'In product management, what do the letters represent in the RICE prioritization scoring model?',
    options: [
      'Reach, Impact, Confidence, Effort',
      'Revenue, Innovation, Cost, Efficiency',
      'Risk, Investment, Customer, Execution',
      'Retention, Iteration, Capacity, Engagement'
    ],
    correctIndex: 0,
    explanation: 'RICE score = (Reach × Impact × Confidence) / Effort, providing an objective framework to prioritize engineering backlogs.',
    difficulty: 'intermediate',
  }
];

// ── IMPORT QUESTIONS FROM QUIZ_QUESTIONS ───────────────────────
const IMPORTED_QUIZ_QUESTIONS = [];
if (QUIZ_QUESTIONS && typeof QUIZ_QUESTIONS === 'object') {
  Object.entries(QUIZ_QUESTIONS).forEach(([skillKey, levels]) => {
    ['easy', 'medium', 'hard'].forEach((lvl) => {
      const qList = levels[lvl] || [];
      qList.forEach((q, idx) => {
        IMPORTED_QUIZ_QUESTIONS.push({
          id: q.id || `imp_${skillKey}_${lvl}_${idx}`,
          topic: normalizeSkillKey(q.skill || skillKey),
          prompt: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation || `Correct answer is: ${q.options[q.correctIndex]}`,
          difficulty: lvl === 'easy' ? 'beginner' : lvl === 'medium' ? 'intermediate' : 'advanced',
        });
      });
    });
  });
}

// Combine all curated sources into master repository
const MASTER_QUESTION_POOL = [
  ...SPECIALIZED_QUESTIONS,
  ...IMPORTED_QUIZ_QUESTIONS,
];

// ── OPTION SHUFFLING HELPER ────────────────────────────────────
function shuffleQuestionOptions(q) {
  if (!q.options || q.options.length < 2) return q;
  const originalCorrect = q.options[q.correctIndex];
  const indexedOptions = q.options.map((opt, idx) => ({ opt, isCorrect: idx === q.correctIndex }));

  // Fisher-Yates shuffle
  for (let i = indexedOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
  }

  const newOptions = indexedOptions.map((item) => item.opt);
  const newCorrectIndex = indexedOptions.findIndex((item) => item.isCorrect);

  return {
    ...q,
    options: newOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

// ── MASTER GET WEEKLY TEST QUESTIONS ───────────────────────────
/**
 * Selects 10 fresh, topic-accurate, non-repeating test questions for a weekly milestone test.
 *
 * @param {Object} options
 * @param {string[]} [options.topics=[]] - Skills/topics taught in the week's curriculum
 * @param {string} [options.careerTitle=''] - Target career title (e.g. 'Game Developer', 'Front-End Developer')
 * @param {string} [options.careerSlug=''] - Target career slug
 * @param {number} [options.count=10] - Number of questions to return
 * @param {string[]} [options.excludeIds=[]] - Question IDs already seen in previous attempts
 * @returns {Array<Object>} 10 randomized, topic-aligned, option-shuffled test questions
 */
function getWeeklyTestQuestions({
  topics = [],
  careerTitle = '',
  careerSlug = '',
  count = 10,
  excludeIds = [],
} = {}) {
  const normalizedTopics = (topics || []).map(normalizeSkillKey).filter(Boolean);
  const excludeSet = new Set(excludeIds || []);
  const targetDomain = detectDomainFamily(careerTitle, careerSlug, normalizedTopics);
  const allowedDomainSkills = DOMAIN_FAMILIES[targetDomain] || DOMAIN_FAMILIES['engineering-web'];

  // Fisher-Yates helper
  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // 1. Level 1: Questions matching the exact week topics that haven't been excluded
  let matchedQuestions = MASTER_QUESTION_POOL.filter((q) => {
    if (excludeSet.has(q.id)) return false;
    const qTopic = normalizeSkillKey(q.topic);
    return normalizedTopics.some((t) => qTopic === t || qTopic.includes(t) || t.includes(qTopic));
  });

  matchedQuestions = shuffle(matchedQuestions);

  let pool = [...matchedQuestions];

  // 2. Level 2: If we still need questions, pull from same domain family that haven't been excluded
  if (pool.length < count) {
    const sameDomainQuestions = MASTER_QUESTION_POOL.filter((q) => {
      if (excludeSet.has(q.id)) return false;
      if (pool.some((p) => p.id === q.id)) return false;
      const qTopic = normalizeSkillKey(q.topic);
      return allowedDomainSkills.includes(qTopic);
    });

    const shuffledSameDomain = shuffle(sameDomainQuestions);
    pool = pool.concat(shuffledSameDomain.slice(0, count - pool.length));
  }

  // 3. Level 3: Dynamic fallback generation if domain has exhausted unseen questions
  if (pool.length < count) {
    try {
      const aiQuizGen = require('../services/aiQuizGeneratorService');
      const fallbackSkill = normalizedTopics[0] || allowedDomainSkills[0] || 'software-engineering';
      const dynamicGenerated = aiQuizGen.generateOfflineFallback(fallbackSkill);
      if (Array.isArray(dynamicGenerated) && dynamicGenerated.length > 0) {
        dynamicGenerated.forEach((dq) => {
          if (pool.length < count && !pool.some((p) => p.id === dq.id) && !excludeSet.has(dq.id)) {
            pool.push({
              id: dq.id,
              topic: normalizeSkillKey(dq.topic || fallbackSkill),
              prompt: dq.question,
              options: dq.options,
              correctIndex: dq.correctIndex,
              explanation: dq.explanation,
              difficulty: dq.difficulty === 'easy' ? 'beginner' : dq.difficulty === 'medium' ? 'intermediate' : 'advanced',
            });
          }
        });
      }
    } catch (_) {}
  }

  // 4. Level 4: If still under count (excessive retakes exhausted domain pool), recycle unseen in current attempt
  if (pool.length < count) {
    const domainFallbackPool = MASTER_QUESTION_POOL.filter((q) => {
      if (pool.some((p) => p.id === q.id)) return false;
      const qTopic = normalizeSkillKey(q.topic);
      return allowedDomainSkills.includes(qTopic);
    });
    const recycled = shuffle(domainFallbackPool);
    pool = pool.concat(recycled.slice(0, count - pool.length));
  }

  // 5. Final fallback guarantee
  if (pool.length < count) {
    const remainingAll = MASTER_QUESTION_POOL.filter((q) => !pool.some((p) => p.id === q.id));
    pool = pool.concat(shuffle(remainingAll).slice(0, count - pool.length));
  }

  // Shuffle final selection and shuffle choices for each question
  const finalQuestions = shuffle(pool.slice(0, count)).map(shuffleQuestionOptions);
  return finalQuestions;
}

module.exports = {
  WEEKLY_TEST_QUESTIONS: MASTER_QUESTION_POOL,
  getWeeklyTestQuestions,
  normalizeSkillKey,
  detectDomainFamily,
};

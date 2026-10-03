# Backend Schema & REST API Reference Specification

> **Hack2Ignite 2026–27 · Round 1 Qualifier**  
> **Team:** 404 Brain Not Found  
> **Problem Statement ID:** ED-02 (AI-Powered Career Guidance System)  
> **Backend Stack:** Node.js v18+, Express.js, MongoDB Atlas (Mongoose ODM), JWT, bcryptjs

---

## 1. Production Backend Structure

```
server/
├── server.js                      # Express app entry, rate limiting, process safety listeners
├── seed.js                        # Complete career, skill & quiz database seeding script
├── seedDemoUser.js                # Dedicated evaluator demo user seeder
├── config/
│   └── db.js                      # MongoDB Atlas connection singleton
├── models/
│   ├── User.js                    # Student & recruiter accounts, corporate domain & verification
│   ├── Company.js                 # Corporate entities, domain validation & verification scores
│   ├── JobOpening.js              # Direct corporate jobs, mandatory verified skills & salary CTC
│   ├── JobApplication.js          # Candidate 1-click applications, match scores & hiring stages
│   ├── Resume.js                  # Dedicated 1:1 user resume document schema
│   ├── Career.js                  # 15+ industry career definitions & required skills
│   ├── Roadmap.js                 # Generated student roadmaps, partial unique index & cooldown
│   ├── RoadmapTask.js             # Atomic checklist tasks & YouTube anti-scrub telemetry
│   ├── Attempt.js                 # Weekly milestone test attempts and answer scorecards
│   └── Skill.js                   # Master skill intelligence directory
├── routes/
│   ├── authRoutes.js              # Register, login, OTP verification, Google auth, GitHub sync
│   ├── recruiterRoutes.js         # Corporate precheck, registration, job openings & ATS pipeline
│   ├── jobRoutes.js               # Adzuna jobs, recruiter openings, 1-click apply & gap bridging
│   ├── roadmapRoutes.js           # Roadmap generation, video checkpoints & milestone tests
│   ├── assessmentRoutes.js        # Student profile evaluation & skills submission
│   ├── quizRoutes.js              # Reality-check quiz: /start, /answer, /status, /providers
│   ├── recommendationRoutes.js    # 60/25/15 deterministic matching engine & skill gap analysis
│   ├── dashboardRoutes.js         # Unified student analytics, verified skills & goals
│   ├── careerRoutes.js            # Careers directory, slugs & detail lookups
│   ├── chatRoutes.js              # AI Career Mentor (Groq Llama 3.3 + Gemini Flash)
│   ├── resumeRoutes.js            # 1:1 resume upload & magic-byte validation
│   ├── readinessRoutes.js         # 4-Rule industry job ready compliance evaluations
│   ├── skillRoutes.js             # Skill directory & catalog
│   └── userRoutes.js              # Profile updates, Cloudinary avatar & resume uploads
├── controllers/
│   ├── authController.js          # Authentication, token generation & GitHub session sync
│   ├── recruiterController.js     # Recruiter onboarding, job openings & applicant management
│   ├── assessmentController.js    # Assessment validation & student profile updating
│   ├── quizController.js          # Dynamic quiz generation, answer scoring & skill verification
│   ├── recommendationController.js# In-memory matrix matching & gap classification
│   ├── roadmapController.js       # Timeline generation, task completion & video verification
│   ├── dashboardController.js     # Dashboard telemetry & progress aggregation
│   └── userController.js          # User profile management & document uploads
├── services/
│   ├── aiQuizGeneratorService.js  # Multi-model Groq Llama + Gemini Flash quiz engine
│   ├── quizService.js             # Quiz business logic, scoring & gap extraction
│   ├── githubService.js           # GitHub REST API repository analysis & language parsing
│   ├── groqService.js             # Groq Cloud AI mentor integration
│   ├── geminiService.js           # Google Gemini AI failover integration
│   ├── jobBoardService.js         # Adzuna & AIDevBoard live job streaming & multi-portal deep links
│   ├── cloudinaryService.js       # Cloudinary media and document management
│   ├── emailService.js            # Nodemailer transactional email delivery
│   ├── recommendationService.js   # 60/25/15 core mathematical scoring
│   └── roadmapService.js          # Roadmap templating & task generation
├── middleware/
│   ├── authMiddleware.js          # JWT authentication, requireStudent, requireRecruiter, requireVerifiedRecruiter
│   ├── errorMiddleware.js         # Centralized error formatting & status codes
│   ├── otpRateLimiter.js          # In-memory windowed OTP request throttling
│   └── validateRequest.js         # Express-validator input sanitization
└── data/
    ├── careersData.js             # Predefined career tracks & requirement matrices
    ├── skillsData.js              # Comprehensive skills taxonomy
    ├── quizQuestions.js           # 860+ lines curated fallback domain questions
    └── roadmapTemplates.js        # 4, 8, 12-week weekly milestone blueprints
```

---

## 2. Mongoose Data Models & Schemas

### 2.1 User Model (`server/models/User.js`)
Stores authentication credentials, academic profile, self-reported and verified skills, GitHub repository analytics, and micro-quiz verification state.

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    minlength: 6,
    select: false // Excluded from default queries
  },
  role: {
    type: String,
    enum: ['student', 'recruiter', 'admin'],
    default: 'student',
    index: true
  },
  // Recruiter & Corporate Verification Profile
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  companyName: { type: String, default: '' },
  companyDomain: { type: String, default: '' },
  isCompanyVerified: { type: Boolean, default: false },
  recruiterStatus: {
    type: String,
    enum: ['pending_otp', 'active', 'rejected', 'suspended'],
    default: 'active'
  },
  canPostJobs: { type: Boolean, default: false },
  // Academic Profile
  education: {
    type: String,
    default: '' // e.g., "B.Tech CSE 2nd Year", "BCA 3rd Year"
  },
  branch: { type: String, default: '' },
  college: { type: String, default: '' },
  interests: [{ type: String, trim: true }],
  // Multi-tier skill competency structure
  skills: [{
    skillName: { type: String, required: true },
    proficiency: { type: Number, required: true, min: 1, max: 5 },
    isCodeVerified: { type: Boolean, default: false }, // Verified via GitHub code
    isQuizVerified: { type: Boolean, default: false }, // Verified via Reality-Check Quiz
    quizScore: { type: Number, default: null },
    quizVerifiedAt: { type: Date, default: null }
  }],
  hasCompletedSkillVerification: { type: Boolean, default: false },
  // Job Readiness Index Evaluation State
  jobReadiness: {
    score: { type: Number, default: 0 },
    tierLabel: { type: String, default: 'Foundational Learner' },
    isJobReady: { type: Boolean, default: false },
    evaluatedAt: { type: Date, default: null }
  },
  // Connected GitHub telemetry
  githubId: { type: String, default: null },
  githubProfile: {
    username: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    profileUrl: { type: String, default: null },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    bio: { type: String, default: '' }
  },
  githubRepos: [mongoose.Schema.Types.Mixed],
  avatarUrl: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  lastAbandonedRouteAt: { type: Date, default: null }
}, {
  timestamps: true
});
```

### 2.2 Company Model (`server/models/Company.js`)
Stores registered enterprise employers, corporate web domains, and automated legitimacy scoring:

```javascript
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  domain: { type: String, required: true, unique: true, lowercase: true, index: true },
  website: { type: String, trim: true, default: '' },
  logoUrl: { type: String, trim: true, default: '' },
  industry: { type: String, trim: true, default: 'Technology & Software' },
  verificationScore: { type: Number, default: 85, min: 0, max: 100 },
  isVerified: { type: Boolean, default: true },
  authorizedRecruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});
```

### 2.3 JobOpening Model (`server/models/JobOpening.js`)
Stores recruiter-published jobs with mandatory verified skill criteria and applicant counts:

```javascript
const JobOpeningSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  companyName: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  careerSlug: { type: String, lowercase: true, trim: true, default: 'general' },
  workplace: { type: String, enum: ['remote', 'hybrid', 'on-site'], default: 'hybrid' },
  location: { type: String, required: true },
  experienceLevel: { type: String, enum: ['fresher', 'internship', 'junior', 'mid'], default: 'fresher' },
  minSalary: { type: Number, default: 400000 },
  maxSalary: { type: Number, default: 1200000 },
  requiredSkills: [{
    skillName: { type: String, required: true, lowercase: true },
    minimumProficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    requiresVerification: { type: Boolean, default: true }
  }],
  status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active', index: true },
  applicantsCount: { type: Number, default: 0 }
}, {
  timestamps: true
});
```

### 2.4 JobApplication Model (`server/models/JobApplication.js`)
Stores candidate 1-click job submissions, match percentages, and recruitment decision stages:

```javascript
const JobApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOpening', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  matchScore: { type: Number, default: 0, min: 0, max: 100 },
  matchedSkills: [String],
  missingSkills: [String],
  readinessTier: { type: String, default: 'Foundational Learner' },
  resumeUrl: { type: String, default: '' },
  coverNote: { type: String, default: '', maxlength: 500 },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview', 'offered', 'rejected'],
    default: 'applied',
    index: true
  }
}, {
  timestamps: true
});
JobApplicationSchema.index({ job: 1, student: 1 }, { unique: true }); // Prevent duplicate applications
```

### 2.5 Resume Model (`server/models/Resume.js`)
Enforces strict database engine-level 1:1 user resume relationship:

```javascript
const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Database engine level unique index: 1 resume per user
    index: true
  },
  originalName: { type: String, required: true, trim: true },
  fileType: {
    type: String,
    required: true,
    enum: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
  },
  sizeBytes: { type: Number, required: true, min: 1, max: 5 * 1024 * 1024 },
  fileLocation: { type: String, required: true }, // Cloudinary secure_url
  publicId: { type: String, required: true },
  version: { type: Number, default: 1 },
  extractedText: { type: String, default: '' }
}, {
  timestamps: true
});
```

### 2.6 RoadmapTask Model (`server/models/RoadmapTask.js`)
Stores atomic weekly learning tasks with YouTube anti-scrubbing telemetry fields:

```javascript
const RoadmapTaskSchema = new mongoose.Schema({
  roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
  weekNumber: { type: Number, required: true, min: 1, max: 12 },
  order: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  type: {
    type: String,
    enum: ['learn', 'practice', 'project', 'assessment', 'interview'],
    default: 'learn'
  },
  skillName: { type: String, trim: true, default: '' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  estimatedHours: { type: Number, default: 2 },
  resource: {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    provider: { type: String, default: '' },
    mediaType: { type: String, enum: ['video', 'reading', 'doc', 'lab', 'project'], default: 'reading' }
  },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  // YouTube Video Dedication & Anti-Scrub Telemetry
  isVideoTask: { type: Boolean, default: false, index: true },
  videoWatchTimeSeconds: { type: Number, default: 0 },
  videoDurationSeconds: { type: Number, default: 0 },
  videoMaxWatchedTime: { type: Number, default: 0 },
  videoMidCheckPassed: { type: Boolean, default: false },
  isVideoVerified: { type: Boolean, default: false, index: true },
  videoVerifiedAt: { type: Date, default: null },
  videoReflectionSummary: { type: String, trim: true, default: '' }
}, {
  timestamps: true
});
```

---

## 3. Complete REST API Endpoints Specification

### 3.1 Authentication & GitHub Session Sync (`/api/auth`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create new student account, hashes password via bcrypt |
| `POST` | `/api/auth/login` | Public | Authenticate email + password, returns JWT token |
| `POST` | `/api/auth/google` | Public | Google Identity Services OAuth sign-in / sign-up |
| `POST` | `/api/auth/github` | Public | Fast-track GitHub OAuth connection |
| `POST` | `/api/auth/github/sync` | Protected (JWT) | **Auth-based repository sync:** Resolves student GitHub identity from session, fetches public repos, calculates top languages, marks `isCodeVerified: true` with zero manual prompt |

#### Sample Request: `POST /api/auth/github/sync`
```http
POST /api/auth/github/sync HTTP/1.1
Host: localhost:5000
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{ "auth": true }
```

#### Sample Response: `POST /api/auth/github/sync` (200 OK)
```json
{
  "success": true,
  "message": "Successfully synchronized @parthpatil1234p-svg's repositories via auth system! Analyzed 7 study repositories.",
  "data": {
    "username": "parthpatil1234p-svg",
    "reposCount": 7,
    "topLanguages": ["JavaScript", "HTML", "CSS", "TypeScript"],
    "verifiedSkills": ["JavaScript", "HTML", "CSS", "TypeScript"]
  }
}
```

---

### 3.2 Adaptive Skill Reality-Check Micro-Quiz (`/api/quiz`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/quiz/start` | Optional / Demo | Initializes a 5-question technical quiz for selected skills. Invokes Groq Llama 3.3 70B, Gemini 2.5 Flash, or domain fallback |
| `POST` | `/api/quiz/answer` | Optional / Demo | Evaluates submitted answer, provides instant explanation, updates running score, and advances question stepper |
| `GET` | `/api/quiz/status` | Protected (JWT) | Returns verification status, verified skills list, and total verified count for current student |
| `GET` | `/api/quiz/providers`| Public | Returns available AI quiz generation providers (Groq, Gemini, BYOK, Fallback) |

#### Sample Request: `POST /api/quiz/start`
```json
{
  "skill": "JavaScript",
  "difficulty": "intermediate",
  "provider": "groq",
  "apiKey": ""
}
```

#### Sample Response: `POST /api/quiz/start` (200 OK)
```json
{
  "success": true,
  "data": {
    "sessionId": "quiz_session_88192a",
    "skill": "JavaScript",
    "questionIndex": 1,
    "totalQuestions": 5,
    "question": "What is the expected output of `typeof null` in standard JavaScript?",
    "options": [
      "\"null\"",
      "\"undefined\"",
      "\"object\"",
      "\"boolean\""
    ],
    "timeLimitSeconds": 45,
    "engine": "Groq Llama 3.3 70B"
  }
}
```

---

### 3.3 Career Recommendations & Matching Engine (`/api/recommendations`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/recommendations/generate` | Protected (JWT) | Executes 60/25/15 deterministic scoring algorithm across all 15 career tracks |
| `GET` | `/api/recommendations/latest` | Protected (JWT) | Retrieves previously computed top recommendations and tri-color skill gaps |

---

### 3.4 Roadmap & Task Execution (`/api/roadmaps`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/roadmaps/generate` | Protected (JWT) | Generates customized 4, 8, or 12-week roadmap based on student's missing skills |
| `GET` | `/api/roadmaps/current` | Protected (JWT) | Returns active roadmap, weekly milestones, resource links, and progress |
| `PATCH`| `/api/roadmaps/tasks/:taskId` | Protected (JWT) | Toggles milestone task completion; triggers atomic percentage progress recalculation |

---

### 3.5 Student Dashboard (`/api/dashboard`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Protected (JWT) | Returns unified profile summary, active career goal, upcoming tasks, verified skills, and 0–100% progress metrics |

---

### 3.6 AI Mentor & Live Market Telemetry (`/api/chat` & `/api/jobs`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/message` | Protected / Demo | Sends question to AI Career Mentor (Groq Llama 3.3 70B with Gemini Flash failover) |
| `GET` | `/api/jobs/adzuna` | Public | Real-time Indian tech job listings & CTC salary data from Adzuna API |
| `GET` | `/api/jobs/career/:slug` | Public | Localized vacancies filtered by specific career track |

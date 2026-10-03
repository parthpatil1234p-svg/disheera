# 48-Hour Implementation Plan & Execution Log

> **🏆 Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> **Problem Statement ID:** ED-02 (AI Career Guidance System)  
> **Execution Status:** 100% Completed & Verified

---

## Team Roster & Ownership

| Member | Primary Role | Core Delivery Modules |
| :--- | :--- | :--- |
| **Parth Patil** | Team Leader & Full Stack Lead | Backend architecture, 60/25/15 engine, Groq/Gemini AI quiz service, GitHub auth sync |
| **Aditi Vispute** | Integration & Curriculum Lead | Skill-gap analysis, 76+ skill taxonomy, roadmap templates, assessment logic |
| **Suyog Pawar** | UI/UX & Frontend Systems Lead | 90% viewport layout, 2D percentage SVG gauge, Three.js 3D Career Universe |
| **Sanika Bodhnawar** | QA, Docs & Presentation Lead | API test suites, documentation suite, pitch deck presentation, evaluator flow |

---

## Phase 1: Foundation (Hours 0 – 8) ✅ COMPLETED
**Goal:** Server running, MongoDB Atlas connected, authentication operational, basic glassmorphic UI.

| Task | Owner | Duration | Status |
| :--- | :--- | :---: | :---: |
| Init Express server + security middleware (CORS, helmet, rate-limit) | Parth | 1h | ✅ |
| Configure MongoDB Atlas cloud connection (`config/db.js`) | Parth | 0.5h | ✅ |
| Create Mongoose schemas (`User.js`, `Career.js`, `Roadmap.js`) | Aditi | 2h | ✅ |
| Implement Auth routes (register + login) with bcrypt & JWT | Parth | 2h | ✅ |
| Create JWT authentication middleware for protected routes | Parth | 1h | ✅ |
| Build Login/Register glassmorphic UI (`login.html`, `register.html`) | Aditi | 2h | ✅ |
| Initialize Three.js boilerplate & starfield canvas on landing page | Suyog | 2h | ✅ |
| Automated Postman auth test validation | Sanika | 0.5h | ✅ |

---

## Phase 2: Core Matching Logic (Hours 8 – 20) ✅ COMPLETED
**Goal:** 60/25/15 matching engine operational, database seeded, 3D career universe nodes.

| Task | Owner | Duration | Status |
| :--- | :--- | :---: | :---: |
| Build deterministic 60/25/15 career matching algorithm | Parth | 3h | ✅ |
| Create `POST /api/recommendations/generate` endpoint | Parth | 1h | ✅ |
| Create student profile endpoints (`GET /api/users/me`, `PUT`) | Parth | 1.5h | ✅ |
| Generate seed dataset: 15 career tracks with 76+ industry skills | Aditi | 3h | ✅ |
| Implement seeding automation scripts (`server/seed.js`) | Aditi | 1h | ✅ |
| Build student assessment profiler (`client/assessment.html`) | Aditi | 3h | ✅ |
| Implement Three.js 3D Career Universe constellation with orbital physics | Suyog | 4h | ✅ |
| Add Raycaster hover interaction and responsive 2D fallback | Suyog | 2h | ✅ |

---

## Phase 3: Roadmaps & Dashboard Integration (Hours 20 – 32) ✅ COMPLETED
**Goal:** End-to-end integration, skill-gap analysis, 4/8/12-week roadmap generation, and dashboard.

| Task | Owner | Duration | Status |
| :--- | :--- | :---: | :---: |
| Build unified student dashboard (`client/dashboard.html`) | Aditi | 3h | ✅ |
| Implement skill-gap classification (🟢 Matched, 🟡 Upgrade, 🔴 Missing) | Aditi | 2h | ✅ |
| Build roadmap generation algorithm for 4, 8, and 12-week timelines | Aditi | 3h | ✅ |
| Create `POST /api/roadmaps/generate` & task toggle endpoints | Parth | 1.5h | ✅ |
| Implement atomic progress recalculation on task completion | Parth | 1h | ✅ |
| Build roadmap checklist interface with 1-click PDF print styling | Suyog | 3h | ✅ |
| Implement floating 24/7 AI Career Mentor drawer (`client/js/chat.js`) | Parth | 2h | ✅ |

---

## Phase 4: Market Telemetry & GitHub Verification (Hours 32 – 40) ✅ COMPLETED
**Goal:** Live external APIs, Indian CTC salary data, and GitHub code verification.

| Task | Owner | Duration | Status |
| :--- | :--- | :---: | :---: |
| Integrate Adzuna Developer API for live Indian tech jobs & CTC | Parth | 2h | ✅ |
| Integrate AIDevBoard API for global AI/developer telemetry | Parth | 1h | ✅ |
| Implement GitHub REST API repository analysis service | Parth | 2h | ✅ |
| Implement Cloudinary avatar and resume document upload services | Parth | 1.5h | ✅ |
| Add Google Identity Services 1-click OAuth authentication | Parth | 1.5h | ✅ |
| Create evaluator 1-click demo account auto-fill mechanism | Aditi | 1h | ✅ |
| Build automated 21-endpoint Postman test collection | Sanika | 1.5h | ✅ |

---

## Phase 5: Multi-Model Quiz, Auth Sync & Layout Overhaul (Hours 40 – 48) ✅ COMPLETED
**Goal:** Dynamic AI reality-check micro-quiz, auth-based GitHub sync, 2D percentage gauge, 90% wide layout.

| Task | Owner | Duration | Status |
| :--- | :--- | :---: | :---: |
| Build dynamic AI micro-quiz service (`aiQuizGeneratorService.js`) with Groq Llama 3.3 70B | Parth | 2.5h | ✅ |
| Implement Google Gemini 2.5 Flash pedagogical failover engine | Parth | 1.5h | ✅ |
| Curate 860+ lines domain question fallback dataset (`quizQuestions.js`) | Aditi | 2h | ✅ |
| Build dedicated 5-question micro-quiz interface (`client/quiz.html`) | Suyog | 3h | ✅ |
| Implement BYOK modal & model switcher for live evaluator testing | Parth | 1h | ✅ |
| Implement one-time verification policy (`hasCompletedSkillVerification`) | Parth | 1h | ✅ |
| Implement `POST /api/auth/github/sync` (auth-based repo sync without username modal) | Parth | 1.5h | ✅ |
| Replace 3D angle gauge with accessible 2D circular SVG percentage gauge (0–100%) | Suyog | 2h | ✅ |
| Calibrate global CSS layout to 90% viewport width with 10% breathing room margins | Suyog | 2h | ✅ |
| Boost typography scale across all headings, cards, and chips | Suyog | 1h | ✅ |
| Fix sticky notch-navbar clearance preventing header text overlap | Suyog | 1h | ✅ |
| Attach process safety handlers (`unhandledRejection`, `uncaughtException`) | Parth | 0.5h | ✅ |
| Rebuild codebase knowledge graph with `graft build` (357 nodes, 617 edges) | Sanika | 0.5h | ✅ |

# Requirements Traceability Matrix (RTM)

> **🏆 Hack2Ignite 2026–27 · Round 1 Qualifier**  
> **Project:** CareerPath AI  
> **Team:** 404 Brain Not Found (Parth Patil, Aditi Vispute, Suyog Pawar, Sanika Bodhnawar)  
> **Problem Statement ID:** ED-02 (AI Career Guidance System)

---

## 1. Source Classification Key

| Code | Category | Definition | Authority |
| :--- | :--- | :--- | :--- |
| `RULE` | Official Hackathon Rule | Compulsory organizer rulebook condition | **Mandatory** |
| `PS` | Official Problem Statement | Organizer-provided domain challenge requirement | **Mandatory** |
| `TEAM` | Product Feature | Team-engineered feature solving the core problem | **Core Deliverable** |
| `TECH` | Technical Architecture | Engineering, API, security, and database solutions | **Core Deliverable** |
| `INNOV`| Competition Innovation | Differentiators (Two-Factor Verification, BYOK, Live CTC) | **Value Add** |

---

## 2. Complete Traceability & Verification Matrix

| ID | Requirement Description | Source | Category | Planned Implementation | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **RULE-001** | Develop within official 48-hour window | Rulebook | `RULE` | Continuous atomic commits during active window | Git log & commit history | **Verified** |
| **RULE-002** | Maintain clear GitHub commit history | Rulebook | `RULE` | Conventional commits (`feat:`, `fix:`, `chore:`) | Git log audit | **Verified** |
| **RULE-003** | Disclose AI tool usage in PPT and README | Rulebook | `RULE` | Explicit AI architecture disclosure in docs & deck | Documentation review | **Verified** |
| **RULE-004** | Deliver original implementation | Rulebook | `RULE` | Custom algorithms, original UI, custom schemas | Codebase originality audit | **Verified** |
| **RULE-005** | No timestamp or git history manipulation | Rulebook | `RULE` | Real-time pushing, no amended dates | Git reflog inspection | **Verified** |
| **RULE-006** | Zero exposed secrets or credentials | Rulebook | `RULE` | All API keys in `.env`, `.env.example` committed | Security grep & secret scan | **Verified** |
| **RULE-007** | Permitted open-source libraries | Rulebook | `RULE` | Express, Mongoose, JWT, Three.js, Bootstrap | `package.json` license check | **Verified** |
| **RULE-008** | Deployed working prototype & PPT links | Rulebook | `RULE` | Vercel (Client) + Render (API) + Google Drive PPT | Live incognito testing | **Verified** |
| **PS-001** | EduTech Track: AI Career Guidance Platform | Problem ED-02 | `PS` | 60/25/15 career matching, roadmaps & verification | Problem statement alignment | **Verified** |
| **TEAM-001** | Student profile & skills evaluation (76+ skills) | PRD Sec 5.2 | `TEAM` | Assessment form (`assessment.html`) + `User.js` | Form submission & DB check | **Verified** |
| **TEAM-002** | Career matching engine with transparent breakdown | PRD Sec 5.3 | `TEAM` | 60/25/15 weighted formula in `recommendationController.js` | In-memory math test (<50ms) | **Verified** |
| **TEAM-003** | Skill-gap analysis (Matched, Weak, Missing) | PRD Sec 5.4 | `TEAM` | Gap categorization + color-coded badges | Skill matrix inspection | **Verified** |
| **TEAM-004** | Dynamic roadmap generation (4, 8, 12 weeks) | PRD Sec 5.5 | `TEAM` | Weekly milestone generator in `roadmapController.js` | Non-empty weeks validation | **Verified** |
| **TEAM-005** | Task checklist & atomic progress persistence | PRD Sec 5.6 | `TEAM` | `PATCH /api/roadmaps/tasks/:taskId` + progress math | Task toggle test & DB save | **Verified** |
| **TEAM-006** | Seed database with 15 complete industry careers | Implementation | `TEAM` | `server/seed.js` script with complete benchmark skills | MongoDB Atlas query check | **Verified** |
| **TEAM-007** | Adaptive Skill Reality-Check Micro-Quiz | PRD Sec 5.7 | `INNOV`| 5-Question interactive quiz (`quiz.html`) with BYOK | Live Groq/Gemini test | **Verified** |
| **TEAM-008** | Auth-Based GitHub Repository Sync | PRD Sec 5.8 | `INNOV`| `POST /api/auth/github/sync` (Bearer JWT, no username modal) | Live API test & repo sync | **Verified** |
| **TECH-001** | Express.js REST API with security middleware | TRD Sec 3 | `TECH` | Helmet, CORS, rate-limiter, error middleware | `GET /api/health` test | **Verified** |
| **TECH-002** | MongoDB Atlas with Mongoose ODM | TRD Sec 4 | `TECH` | `config/db.js` + `User`, `Career`, `Roadmap`, `Skill` | Schema compile & connect | **Verified** |
| **TECH-003** | Stateless JWT + bcrypt authentication | BACKEND-SCHEMA | `TECH` | `/api/auth/register`, `/login`, auth middleware | Auth token & protected routes | **Verified** |
| **TECH-004** | Accessible 2D SVG Percentage Progress Meter | TRD Sec 2 | `TECH` | 0% to 100% SVG circular meter on dashboard | Visual & accessibility audit | **Verified** |
| **TECH-005** | 90% Viewport Container Layout & Scaled Typography| UI-UX-DESIGN | `TECH` | `--container-width: 90%`, 10% margins, fixed navbar | Cross-device viewport check | **Verified** |
| **TECH-006** | Process safety listeners for crash hardening | TRD Sec 3 | `TECH` | `process.on('unhandledRejection')` in `server.js` | Process exception testing | **Verified** |
| **TECH-007** | Three.js 3D Career Universe with 2D fallback | TRD Sec 2 | `TECH` | WebGL canvas with instant 2D glassmorphic fallback | Frame rate test (60 FPS) | **Verified** |
| **INNOV-001** | Dual-Engine AI Career Mentor (Groq + Gemini) | API-ECOSYSTEM | `INNOV`| Sub-300ms LPU mentor drawer with Gemini failover | Live chat speed audit | **Verified** |
| **INNOV-002** | Live Indian Tech Jobs & CTC Salary Telemetry | API-ECOSYSTEM | `INNOV`| Adzuna Developer API integration with cached failover | Live job query test | **Verified** |
| **TEAM-009** | Recruiter Verification & Corporate Domain Onboarding | ARCHITECTURE Sec 11 | `TEAM` | Free webmail blacklist + corporate DNS + OTP activation | Corporate email & OTP test | **Verified** |
| **TEAM-010** | Direct Recruiter Job Posting & ATS Pipeline | ARCHITECTURE Sec 11 | `TEAM` | `POST /api/recruiter/jobs` with mandatory verified skills | Job creation & applicant fetch | **Verified** |
| **TEAM-011** | Candidate 1-Click Application & AI Match Radar | API-SPEC Sec 14 | `TEAM` | `POST /api/jobs/:id/apply` + real-time match scoring (96%) | 1-Click apply & stage transition | **Verified** |
| **TEAM-012** | Recruiter & Student Portal Isolation & RBAC | ARCHITECTURE Sec 12 | `TECH` | `requireStudent`, `requireRecruiter`, 403 gates & dual bypass | 26/26 unit test assertions | **Verified** |
| **TEAM-013** | Role-Smart Brand Logo Dispatch & Landing Auto-Redirect | ARCHITECTURE Sec 13 | `TECH` | `Auth.bindSmartLogo()` + pre-render recruiter forward | Client redirect test suite | **Verified** |
| **TEAM-014** | AI Video Learning Dedication & Anti-Scrubbing Guard | ROADMAP Sec 5 | `INNOV`| YouTube IFrame telemetry, 1.5x cap & reflection gate | Video verification test | **Verified** |
| **TEAM-015** | Apple/Linear-Grade Modern Student Profile Header Card | UI-UX Sec 6 | `TEAM` | Glassmorphic card, circular avatar, segmented status pill | Cross-viewport design review | **Verified** |


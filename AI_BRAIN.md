# AI BRAIN — PRIMARY MEMORY

> This is the first file the AI must read before doing any task.
> Do NOT scan the full project unless this file explicitly says more context is needed.

## 1. Project Identity

Project Name: CareerPath AI
Project Type: FULL STACK (Web App + REST API)
Primary Goal: AI-powered career guidance and personalized learning roadmap generator for students in a 3D/glassmorphism interface.

## 2. Current Tech Stack

Frontend:
- HTML5, CSS3, JavaScript (Vanilla ES6+)
- Bootstrap 5
- Three.js & GSAP (3D animations and visual roadmaps)

Backend:
- Node.js & Express.js

Database:
- MongoDB Atlas (Free Tier) with Mongoose

Authentication:
- JWT (jsonwebtoken) & bcryptjs

Deployment:
- Frontend: Vercel
- Backend: Render

External Services:
- College Scorecard API (U.S. Dept of Ed) — College & program data source (costs, graduation rates, earnings) displayed post-career match. Note: External data provider, not core career AI brain.

## 3. Project Structure Summary

```text
docs/                         # Project specifications & Traceability
  OFFICIAL-RULEBOOK.md        # Organizer rulebook summary (RULE-xxx)
  OFFICIAL-PROBLEM-STATEMENT.md # Raw problem statement (PS-xxx)
  REQUIREMENTS-MATRIX.md      # Requirements Traceability Matrix (RTM)
  PRD.md                      # Product planning document (TEAM-xxx)
  TRD.md                      # Technical specifications (TECH-xxx)
  APP-FLOW.md                 # User journeys & sequence flows
  UI-UX-DESIGN.md             # Design tokens & 3D specs
  BACKEND-SCHEMA.md           # API contracts & Mongoose schemas
  IMPLEMENTATION-PLAN.md      # 48h schedule & team division
careerpath-ai/
  server/                     # Backend API
    config/db.js              # MongoDB connection
    controllers/              # Express controllers
    middleware/               # Error & Auth middleware
    routes/                   # Express routes
    server.js                 # Entry point
    package.json
  client/                     # Frontend (to be built)
```

## 4. Important Architecture Decisions

- Decoupled client-server architecture with REST API.
- Rule-based weighted matching algorithm for MVP: `Skill (60%) + Interest (25%) + Education (15%)`.
- Critical skill penalty: -20 points if a critical required skill is completely absent.
- Mobile/No-WebGL fallback: Graceful degradation to 2D CSS grid cards for screens < 768px.
- Stateless JWT authentication with 24-hour expiration.

## 5. Existing Features

### Completed
- Server scaffolding with Helmet, Rate-Limiting, CORS, Morgan, and centralized error handler ([careerpath-ai/server/server.js](careerpath-ai/server/server.js))
- Health check route at `GET /api/health` ([careerpath-ai/server/routes/healthRoutes.js](careerpath-ai/server/routes/healthRoutes.js))
- MongoDB Atlas connection active and verified
- Auth & Profile routes (`/api/auth/register`, `/api/auth/login`, `/api/users/profile`) with bcrypt & JWT
- Career catalog routes (`GET /api/careers`, `GET /api/careers/:id`) with 5 benchmarked seeded careers
- Matching Engine (`POST /api/match/recommend`) with 60/25/15 weighted score + critical skill check + gap analysis
- Roadmap Generator (`POST /api/roadmap/generate`, `PUT /api/roadmap/:id/task/:taskId`) with 4/8/12-week schedules & progress tracking
- College Scorecard API endpoint (`GET /api/colleges`) with live API key, in-memory caching, and resilient demo fallback
- Complete backend verified with automated integration tests (all 8 endpoints 200 OK)

### In Progress
- Frontend UI (Client glassmorphism interface with 3D/cards visualizer)

### Planned
- Client UI & Three.js/Glassmorphism visualizer
- Interactive assessment quiz & Roadmap task tracker
- Higher education / College Scorecard tab cards on frontend


## 6. Important APIs / Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Health check |
| POST | /api/auth/register | Register student |
| POST | /api/auth/login | Login & receive JWT |
| GET | /api/users/profile | Get student profile |
| PUT | /api/users/profile | Update skills/interests |
| GET | /api/careers | List all careers |
| POST | /api/match/recommend | Run weighted career matching |
| POST | /api/roadmap/generate | Generate 4/8/12-week roadmap |
| PUT | /api/roadmap/:id/task/:taskId | Mark task complete |
| GET | /api/colleges | College Scorecard data by career/field (tuition, earnings, grad rate) |

## 7. Database Memory

Main models:
- `User`: name, email, password, education, skills `[{ skillName, proficiency (1-5) }]`, interests `[String]`
- `Career`: title, description, domain, baseEducationScore, tags `[String]`, requiredSkills `[{ skillName, minimumProficiency, isCritical }]`
- `Roadmap`: userId, targetCareerId, careerTitle, durationWeeks (4/8/12), progress (0-100), tasks `[{ weekNumber, title, description, resourceLink, isCompleted }]`

## 8. Security Rules

- Never expose secrets or `.env` in GitHub.
- Password minimum length: 6 characters, hashed with bcrypt (10 salt rounds).
- Rate limit: 100 requests per 15 minutes per IP.
- Mongoose strict schemas to prevent NoSQL injection.

## 9. Coding Conventions

- RESTful API design with consistent JSON responses `{ success: true, ... }` or `{ success: false, error: "..." }`.
- Vanilla JS for client side to avoid heavy build toolchains.
- Glassmorphism UI tokens defined in CSS variables.

## 10. Current Known Issues

- `client/` directory and frontend assets not yet created.
- Server does not yet connect to MongoDB on startup.
- Models and controllers need implementation.

## 11. Recent Changes

- 2026-09-16 — Created `docs/OFFICIAL-PROBLEM-STATEMENT.md` template for hackathon problem statement.
- 2026-09-16 — Completed Round 1 comprehensive audit and inception report.

## 12. Important File Map

| Topic | Files |
|---|---|
| Specifications | docs/PRD.md, docs/TRD.md, docs/BACKEND-SCHEMA.md |
| Official Statement | docs/OFFICIAL-PROBLEM-STATEMENT.md |
| Backend Entry | careerpath-ai/server/server.js |
| DB Config | careerpath-ai/server/config/db.js |

## 13. Current Task Context
 
Current task:
Backend is 100% complete and verified. Now building client frontend:
1. `index.html` (Glassmorphism layout, hero section, interactive assessment quiz, results dashboard, roadmap tracker, and college scorecard explorer).
2. `css/styles.css` (Glassmorphic dark design tokens, animations, responsive cards).
3. `js/api.js` (Fetch wrapper for `/api/match`, `/api/roadmap`, `/api/colleges`, `/api/auth`).
4. `js/app.js` (State management, interactive roadmap task toggling, dynamic DOM rendering).


## 14. Last Session Summary

Completed thorough repository audit for Round 1 of Hack2Ignite 2026–27. Created `docs/OFFICIAL-PROBLEM-STATEMENT.md` ready for organizers' raw text. Identified existing server foundation and defined step-by-step roadmap for core MVP delivery.

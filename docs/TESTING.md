# CareerPath AI — Comprehensive Quality Assurance & Testing Plan

> **Hack2Ignite 2026–27 · Round 1 MVP**  
> Team: **404 Brain Not Found** · Domain: **EduTech / AI for Good**

This document specifies the complete test matrix, manual verification steps, edge cases, security validation, and cross-browser compatibility checklist for CareerPath AI.

---

## 📋 Pre-Deployment Local Verification Checklist

Before pushing commits to GitHub or triggering deployment to Render/Vercel:

- [ ] MongoDB local daemon is running (`mongodb://localhost:27017/careerpath-ai`).
- [ ] Database seed executed: `npm run seed` in `server/` (35+ skills, 5 careers inserted).
- [ ] Backend syntax check passed: `node -c server/server.js`.
- [ ] Backend server runs without uncaught exceptions on `http://localhost:5000`.
- [ ] Client static server serves all files on `http://localhost:5500`.
- [ ] Postman collection passes all 14 request cycles.
- [ ] No real API keys, passwords, or Atlas connection URIs are committed.

---

## 🧪 Detailed Test Cases Matrix

| Test ID | Category | Feature Under Test | Test Execution Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Auth | User Registration | Send `POST /api/auth/register` with valid name, unique email, and password (min 6 chars). | Status `201 Created`. Returns `{ success: true, data: { user, token } }`. | *To be verified* |
| **AUTH-02** | Auth | Duplicate Email Registration | Send `POST /api/auth/register` with an email address that already exists in MongoDB. | Status `409 Conflict`. Informative message: "An account with this email already exists". | *To be verified* |
| **AUTH-03** | Auth | User Login Success | Send `POST /api/auth/login` with correct registered email and password. | Status `200 OK`. Returns new signed JWT token and user profile. | *To be verified* |
| **AUTH-04** | Auth | User Login Failure | Send `POST /api/auth/login` with incorrect password or non-existent email. | Status `401 Unauthorized`. Generic error: "Invalid email or password" (prevents user enumeration). | *To be verified* |
| **AUTH-05** | Security | Protected Route Guard | Send `GET /api/users/me` or `GET /api/roadmaps/current` with missing or invalid `Authorization` header. | Status `401 Unauthorized`. Access denied message: "Not authorized, token missing or invalid". | *To be verified* |
| **PROF-01** | Assessment | Assessment Profile Validation | Send `PUT /api/assessment` with empty education course or empty skills array. | Status `400 Bad Request`. Array of specific field-level validation errors returned. | *To be verified* |
| **PROF-02** | Assessment | Valid Assessment Save | Send `PUT /api/assessment` with valid degree, 3 interest tags, and 3 skills with proficiencies. | Status `200 OK`. Profile saved to MongoDB with `profileCompleted: true`. | *To be verified* |
| **DATA-01** | Seed Data | Career & Skill Catalog | Send `GET /api/careers` without authentication. | Status `200 OK`. Returns 5 populated career objects (`front-end-developer`, etc.) with skill details. | *To be verified* |
| **RECS-01** | Engine | Deterministic Recommendation Calculation | Submit assessment with `html (intermediate)`, `css (intermediate)`, `web development` interest; call `POST /api/recommendations/generate`. | Status `200 OK`. Front-End Developer ranks #1 with calculated score breakdown: $60\% \text{ Skills} + 25\% \text{ Interests} + 15\% \text{ Education}$. | *To be verified* |
| **RECS-02** | Engine | Skill Gap Partitioning | Check output arrays of top recommendation from `POST /api/recommendations/generate`. | Accurately partitions skills into `matchedSkills`, `weakSkills`, and `missingSkills` with natural language explanation. | *To be verified* |
| **ROADM-01** | Roadmap | Unranked Career Guard | Send `POST /api/roadmaps/generate` with a career slug that is NOT among the user's top 3 matches. | Status `400 Bad Request`. Error message: "Please choose a career from your top recommendations". | *To be verified* |
| **ROADM-02** | Roadmap | Valid Roadmap Generation | Send `POST /api/roadmaps/generate` with `careerSlug: "front-end-developer"` and `durationWeeks: 8`. | Status `201 Created`. Creates 8-week structured roadmap with tasks scheduled (missing skills prioritized first). | *To be verified* |
| **ROADM-03** | Roadmap | Single Active Roadmap Enforcement | Generate a new 4-week roadmap while an active 8-week roadmap already exists. | Status `201 Created`. Previous roadmap status becomes `archived`; new roadmap becomes `active`. | *To be verified* |
| **TASK-01** | Tasks | Task Progress Toggling | Send `PATCH /api/roadmaps/tasks/:taskId/toggle` for a task belonging to user's active roadmap. | Status `200 OK`. `completed` flips to `true`, `completedAt` timestamp set, roadmap progress recalculated. | *To be verified* |
| **TASK-02** | Security | Cross-User Task Tampering | Send `PATCH /api/roadmaps/tasks/:taskId/toggle` using Student A's JWT token against a task belonging to Student B. | Status `403 Forbidden`. Error message: "You are not authorized to modify this roadmap task". | *To be verified* |
| **DASH-01** | Dashboard | Unified Telemetry Synchronization | Send `GET /api/dashboard` with valid token after toggling tasks. | Status `200 OK`. Telemetry reflects accurate completion %, first 5 incomplete tasks, and dynamic `nextAction`. | *To be verified* |
| **CORS-01** | Security | CORS Origin Validation | Make request from unauthorized origin (e.g. `http://malicious-site.com`). | Blocked by CORS middleware with origin not permitted error. | *To be verified* |
| **3D-01** | WebGL | 3D Graceful Fallback | Disable WebGL in browser flags or run on a device without hardware acceleration. | Canvas containers (`#careerUniverse`, `#skill-orbit`, `#roadmap-path`, `#progress-orb`) display 2D UI fallbacks without breaking the page. | *To be verified* |
| **RESP-01** | UI/UX | Mobile Responsive Layout | Load all pages on mobile viewport (< 576px). | Navigation collapses into hamburger menu; cards, tables, and buttons adapt without horizontal page overflow. | *To be verified* |

---

## 🌐 Cross-Browser Compatibility Matrix

| Browser | Platform | Layout Integrity | 3D Animations (Three.js/GSAP) | Forms & Modals | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Chrome (v120+)** | Windows / macOS | Verified | Hardware accelerated WebGL 2.0 | Native inputs & modals operational | *To be verified* |
| **Microsoft Edge (v120+)** | Windows | Verified | Hardware accelerated WebGL 2.0 | Native inputs & modals operational | *To be verified* |
| **Mozilla Firefox (v120+)** | Windows / Linux | Verified | WebGL canvas renders with smooth 60fps | CSS Backdrop-filter & modals operational | *To be verified* |
| **Mobile Chrome / Safari** | Android / iOS | Responsive flex layout | Touch orbital rotation active or 2D fallback | Touch targets exceed 44px standard | *To be verified* |

---

## ⚡ Production Smoke Test Sequence (Live Render + Vercel)

Execute these steps immediately following cloud deployment:

1. **Backend Liveness:**
   ```bash
   curl -I https://YOUR-RENDER-SERVICE.onrender.com/api/health
   # Expected: HTTP/2 200 with JSON payload
   ```

2. **Frontend Liveness:**
   ```bash
   curl -I https://YOUR-VERCEL-APP.vercel.app/
   # Expected: HTTP/2 200 with security headers
   ```

3. **End-to-End User Journey (Browser):**
   - Navigate to `https://YOUR-VERCEL-APP.vercel.app`.
   - Register a live student account (`demostudent@hack2ignite.com`).
   - Submit assessment: B.Tech Computer Science, Web Development interest, HTML/CSS intermediate skills.
   - Verify Top 3 recommendations appear with match percentages and skill gap breakdown.
   - Choose Front-End Developer, select 8 Weeks duration, and generate roadmap.
   - Toggle first two tasks on `roadmap.html` and verify progress bar updates.
   - Open `dashboard.html` and verify 3D progress orb and upcoming tasks list.

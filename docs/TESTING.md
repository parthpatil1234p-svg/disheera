# Quality Assurance & Testing Plan — CareerPath AI

> **Status:** Test Suite / To be executed during qualifier  
> **Hack2Ignite 2026–27 · Round 1 MVP**  
> **Team:** 404 Brain Not Found · Domain: **EduTech / AI for Good**

This document specifies the complete test matrix, manual verification procedures, edge cases, and cross-browser compatibility checklist for CareerPath AI.

---

## 📋 Pre-Deployment Local Verification Checklist

- [ ] Local MongoDB service is running (`mongodb://localhost:27017/careerpath-ai`).
- [ ] Database seed executed: `npm run seed` in `server/` (35+ skills, 5 careers inserted).
- [ ] Backend syntax check passed: `node -c server/server.js`.
- [ ] Backend runs cleanly without unhandled rejections on `http://localhost:5000`.
- [ ] Client static server serves all files on `http://localhost:5500`.
- [ ] Postman collection passes all 14 request cycles.
- [ ] No real API keys, passwords, or Atlas connection URIs are committed.

---

## 🧪 Comprehensive Manual Test Cases Matrix

| Test ID | Feature Under Test | Test Execution Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Health Check Endpoint | Send `GET /api/health` without headers. | Status `200 OK`. Returns `{ success: true, message: "CareerPath AI Server is running ✅" }`. | Not run | Pending |
| **TEST-02** | User Registration | Send `POST /api/auth/register` with valid name, unique email, and password. | Status `201 Created`. Returns user profile and signed JWT token. | Not run | Pending |
| **TEST-03** | Duplicate Registration | Send `POST /api/auth/register` with an already registered email address. | Status `409 Conflict`. Informative message: "An account with this email already exists". | Not run | Pending |
| **TEST-04** | User Login Success | Send `POST /api/auth/login` with correct registered credentials. | Status `200 OK`. Returns new signed JWT token and user profile. | Not run | Pending |
| **TEST-05** | User Login Failure | Send `POST /api/auth/login` with wrong password or non-existent email. | Status `401 Unauthorized`. Generic error: "Invalid email or password". | Not run | Pending |
| **TEST-06** | Protected Routes Guard | Send `GET /api/users/me` without `Authorization` header. | Status `401 Unauthorized`. Error: "Not authorized, token missing or invalid". | Not run | Pending |
| **TEST-07** | Assessment Validation | Send `PUT /api/assessment` with empty education or missing skills array. | Status `400 Bad Request`. Field-level validation error messages returned. | Not run | Pending |
| **TEST-08** | Seed Data Verification | Send `GET /api/careers` without authentication. | Status `200 OK`. Returns 5 populated careers with required skill references. | Not run | Pending |
| **TEST-09** | Recommendation Scoring Formula | Submit assessment with HTML, CSS, JS; call `POST /api/recommendations/generate`. | Returns top 3 careers calculated via $(60\% \text{ Skills} + 25\% \text{ Interests} + 15\% \text{ Education})$. | Not run | Pending |
| **TEST-10** | Recommendation Results | Verify top career recommendations list contains 3 distinct careers ranked by score. | Exactly 3 recommendations returned with ranks 1, 2, and 3. | Not run | Pending |
| **TEST-11** | Skill-Gap Categorization | Inspect output of `POST /api/recommendations/generate` for top career. | Accurately partitions skills into `matchedSkills`, `weakSkills`, and `missingSkills`. | Not run | Pending |
| **TEST-12** | Roadmap Generation | Send `POST /api/roadmaps/generate` with `careerSlug` and `durationWeeks: 8`. | Status `201 Created`. Generates 8-week curriculum prioritizing missing skills first. | Not run | Pending |
| **TEST-13** | Task Progress Toggling | Send `PATCH /api/roadmaps/tasks/:taskId/toggle` with valid task ID. | Status `200 OK`. `completed` flips to `true`, `completedAt` timestamp set, progress % updated. | Not run | Pending |
| **TEST-14** | Progress Persistence | Refresh `roadmap.html` and `dashboard.html` after checking off a task. | Checked tasks remain completed; progress bar and Progress Orb reflect updated %. | Not run | Pending |
| **TEST-15** | Cross-User Authorization | Send `PATCH /tasks/:taskId/toggle` using Student A's token against Student B's task. | Status `403 Forbidden`. Error: "You are not authorized to modify this task". | Not run | Pending |
| **TEST-16** | CORS Policy Enforcement | Send request from unauthorized origin (e.g. `http://malicious-site.com`). | Request blocked by CORS middleware with origin not allowed error. | Not run | Pending |
| **TEST-17** | Mobile Responsiveness | Load application on mobile screen size (< 576px). | Navigation collapses into hamburger; layout stacks cleanly without horizontal scroll. | Not run | Pending |
| **TEST-18** | WebGL 3D Graceful Fallback | Disable WebGL in browser flags or test on non-accelerated environment. | Three.js canvases hide; clean 2D HTML/CSS cards display without console crash. | Not run | Pending |
| **TEST-19** | Cloud Deployment Smoke Test | Execute user registration, assessment, recommendation, and task toggle on cloud URLs. | Full end-to-end user journey succeeds on production Vercel + Render URLs. | Not run | Pending |

---

## 🌐 Cross-Browser Compatibility Matrix

| Browser | OS Platform | Layout & CSS | WebGL 3D Visuals | Form Validation | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Chrome (v120+)** | Windows / macOS | Verified | Hardware accelerated WebGL 2.0 | Native HTML5 inputs & validation | Pending |
| **Microsoft Edge (v120+)** | Windows | Verified | Hardware accelerated WebGL 2.0 | Native HTML5 inputs & validation | Pending |
| **Mozilla Firefox (v120+)** | Windows / Linux | Verified | 60fps WebGL canvas rendering | CSS Backdrop-filter & modals | Pending |
| **Mobile Safari (iOS 16+)** | iOS | Responsive flex | Touch orbital rotation or 2D fallback | Touch targets exceed 44px standard | Pending |
| **Mobile Chrome (Android)** | Android | Responsive flex | Touch orbital rotation or 2D fallback | Touch targets exceed 44px standard | Pending |

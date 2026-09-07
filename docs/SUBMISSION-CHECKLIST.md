# CareerPath AI — Hack2Ignite 2026–27 Submission Checklist

> **Hack2Ignite 2026–27 · Round 1 Submission Verification Matrix**  
> Project: **CareerPath AI — Discover Your Career. Build Your Skills.**  
> Track / Domain: **EduTech / AI for Good**  
> Team: **404 Brain Not Found**  
> Team Members: **Parth Patil (Team Lead), Suyog Pawar, Asmita Lokhande, Aditi Vispute**

---

## 📋 Comprehensive Submission Checklist

This checklist acts as the final gatekeeping protocol before final project submission. Check off every item prior to deadline cutoff.

---

### 1. 📁 Repository & Codebase Integrity

- [ ] **Repository Structure**: Clean monorepo directory layout (`client/`, `server/`, `docs/`, `postman/`).
- [ ] **Clean Working Tree**: No dangling temporary scripts, scratch logs, or unnecessary binary dumps.
- [ ] **`.gitignore` Active & Verified**:
  - `server/.env` and `.env` are strictly excluded from git tracking.
  - `node_modules/` is excluded.
  - No secret keys, credentials, or MongoDB connection strings exist in git history.
- [ ] **Package Files Valid**:
  - `server/package.json` contains working `start`, `dev`, and `seed` scripts.
  - Dependencies are explicitly locked and installable via `npm install`.
- [ ] **License & Attribution**:
  - Open-source MIT license declared in repository root.
  - All third-party libraries (Bootstrap, Three.js, GSAP) properly credited in documentation.
  - No uncredited or copyrighted assets present in codebase.

---

### 2. 🔐 Security & Secrets Audit

- [ ] **No Real Secrets Committed**:
  - `.env.example` contains only sanitized dummy values (`mongodb+srv://<username>:<password>@...`).
  - Render blueprint `render.yaml` specifies `sync: false` for all sensitive credentials.
- [ ] **JWT Security**:
  - Tokens expire after a reasonable window (`7d`).
  - Secret key is loaded via `process.env.JWT_SECRET` with no hardcoded fallback in production.
- [ ] **CORS Hardening**:
  - Express backend restricts CORS origins to trusted domains (`CLIENT_URL` and `localhost`).
  - OPTIONS preflight requests handled cleanly.
- [ ] **Database Connection Security**:
  - MongoDB user privileges scoped strictly to the `careerpath-ai` database.
  - Passwords with special characters are URL-encoded in the connection URI.

---

### 3. ☁️ Cloud Deployments & Hosting

#### Backend (Render)
- [ ] **Render Web Service Created**:
  - Root directory set to `server`.
  - Build command set to `npm install`.
  - Start command set to `npm start`.
- [ ] **Environment Variables Injected on Render Dashboard**:
  - `NODE_ENV=production`
  - `PORT=5000` (or Render default)
  - `MONGODB_URI=<your-atlas-connection-string>`
  - `JWT_SECRET=<your-long-random-secret>`
  - `CLIENT_URL=https://<your-vercel-frontend-domain>.vercel.app`
- [ ] **Live Health Checks Verified**:
  - `GET https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns HTTP 200 `{ "status": "UP" }`.
  - `GET https://YOUR-RENDER-SERVICE.onrender.com/api/version` returns version `1.0.0` and `environment: "production"`.

#### Frontend (Vercel)
- [ ] **Vercel Project Configured**:
  - Root directory set to `client`.
  - Framework preset: `Other`.
  - Multi-page configuration verified (`vercel.json` with security headers and clean URLs).
- [ ] **Production API URL Configured**:
  - `client/js/config.js` points to deployed Render backend URL (`https://YOUR-RENDER-SERVICE.onrender.com/api`).
  - Tested that HTTPS is strictly enforced.
- [ ] **Custom 404 Page**:
  - `client/404.html` deployed and accessible upon navigation to unknown routes.

---

### 4. 🗄️ Database & Seed Verification

- [ ] **MongoDB Atlas Cluster Online**:
  - Free M0 cluster provisioned in closest geographical region.
  - Network access whitelist active (`0.0.0.0/0` enabled for demo availability).
- [ ] **Seed Executed Against Cloud Database**:
  - `npm run seed` executed successfully.
  - Minimum **35 standardized skills** populated across 8 categories.
  - Minimum **5 industry careers** populated with required skill references:
    1. Front-End Developer
    2. Full-Stack Developer
    3. Data Analyst
    4. UI/UX Designer
    5. Cybersecurity Analyst
- [ ] **Indexes Active**: Unique indexes on `User.email`, `Skill.slug`, and `Career.slug`.

---

### 5. 🔄 End-to-End User Flow Smoke Test

- [ ] **Account Creation**:
  - Register new student account via `register.html`.
  - Verify automatic JWT storage in `localStorage` and redirect to assessment.
- [ ] **Student Assessment**:
  - Fill out education details, domain interests, and skills with proficiencies on `assessment.html`.
  - Submit assessment and verify profile update (`profileCompleted: true`).
- [ ] **AI Recommendation Generation**:
  - Generate recommendations on `recommendations.html`.
  - Verify top 3 matched careers appear with calculated match percentage scores.
  - Confirm skill gap breakdown displays Matched (green), Upgrade Needed (amber), and Missing (red) badges.
- [ ] **Roadmap Generation**:
  - Select career and choose 4, 8, or 12-week roadmap duration on `roadmap.html`.
  - Confirm weekly curriculum milestones render with curated resource links.
- [ ] **Task Toggle & Progress Persistence**:
  - Check off a milestone task.
  - Refresh page; confirm task remains completed and progress bar updates accurately.
- [ ] **Student Dashboard**:
  - Navigate to `dashboard.html`.
  - Verify current career goal, overall progress percentage, and upcoming weekly tasks reflect live state.
- [ ] **Session & Logout**:
  - Click logout; confirm token is cleared and user is redirected to `login.html`.
  - Attempting to visit `dashboard.html` while logged out properly redirects back to `login.html`.

---

### 6. 🌐 3D Experience & Graceful Fallbacks

- [ ] **Career Universe (Landing)**: Three.js celestial constellation animates smoothly on desktop Chrome/Edge.
- [ ] **Skill Orbit (Recommendations)**: Planetary skill orbit renders concentric orbital tracks.
- [ ] **Roadmap Path (Roadmap)**: 3D stepping-stone path highlights current milestone.
- [ ] **Progress Orb (Dashboard)**: Pulsing holographic sphere animates in dashboard hero.
- [ ] **WebGL Disabled / Fallback Validation**:
  - Test pages with WebGL disabled or simulated failure.
  - Confirm pages render clean 2D HTML/CSS fallback cards without broken layouts or runtime crashes.
- [ ] **Mobile Responsiveness**:
  - Test layouts on mobile viewport (375px–430px).
  - Confirm hamburger menus, responsive cards, and touch interactions operate smoothly.

---

### 7. 🧪 Testing & Postman Collection Verification

- [ ] **Postman Collection Importable**:
  - `postman/CareerPath-AI.postman_collection.json` imports into Postman without syntax errors.
  - Collection variables (`baseUrl`, `token`, `taskId`) resolve properly.
- [ ] **Authentication Token Auto-Capture**:
  - Register/Login requests automatically set `{{token}}` in test scripts.
- [ ] **14 Endpoints Covered**:
  - Health & Version
  - Auth (Register, Login)
  - User Profile (`GET /api/users/me`)
  - Assessment (`PUT /api/assessment`)
  - Careers (`GET /api/careers`, `GET /api/careers/:slug`)
  - Recommendations (`POST /api/recommendations/generate`)
  - Roadmaps (`POST /api/roadmaps/generate`, `GET /api/roadmaps/current`, `PATCH /tasks/:taskId/toggle`, `DELETE /current`)
  - Dashboard (`GET /api/dashboard`)
- [ ] **Documentation Match**: `docs/TESTING.md` includes test cases with status noted as "To be verified".

---

### 8. 🎤 Presentation, Demo & Video Preparedness

- [ ] **Demo Account Pre-Created**:
  - Dedicated demo user account registered and seeded with representative profile data.
  - Credentials verified: `demo.student@careerpath.ai` / `DemoStudent2026!`.
- [ ] **Slide Deck Ready (`docs/PPT-CONTENT.md`)**:
  - 10 slides complete with problem, solution, formula, architecture, 3D innovation, and roadmap.
  - Speaker division assigned to all 4 team members.
  - Presentation export format (PDF/PowerPoint) ready on local drive and cloud backup.
- [ ] **Demo Script Rehearsed (`docs/DEMO-SCRIPT.md`)**:
  - Rehearsed 3–4 minute timing strictly adhering to schedule.
  - Judge Q&A rebuttals reviewed by all speakers.
- [ ] **Screenshots & Screen Recording Captured**:
  - High-resolution screenshots of Landing, Assessment, Recommendations, Roadmap, and Dashboard saved locally.
  - 1080p demo walkthrough video recorded as backup in case of internet instability during presentation.

---

### 9. 🛡️ Emergency Contingency Plan (If Cloud Fails)

In the event of Render cold starts, database network timeouts, or conference Wi-Fi failures during judging:

| Issue | Contingency Action |
| :--- | :--- |
| **Render backend spinning down (cold start)** | Run a warm-up ping (`curl https://YOUR-RENDER-SERVICE.onrender.com/api/health`) 5 minutes before demo time. |
| **Conference Wi-Fi latency / drop** | Immediately switch to Localhost Demo: run `npm run dev` in `server/` and `python -m http.server 5500` in `client/`. |
| **MongoDB Atlas connection timeout** | Switch `server/.env` to local MongoDB (`mongodb://localhost:27017/careerpath-ai`) and run `npm run seed`. |
| **Browser WebGL driver crash** | CareerPath AI automatically detects WebGL unavailability and shows clean 2D UI cards. Continue demo seamlessly. |
| **Total display or projector failure** | Present from offline PPT PDF on tablet and walk through pre-recorded 3-minute MP4 demo video. |

---

### 10. ⏱️ Final 30-Minute Countdown Checklist

Execute this checklist exactly 30 minutes before official portal submission:

```
[ ] T-30 min: Perform git status. Ensure working directory is completely clean.
[ ] T-25 min: Verify both Vercel frontend URL and Render backend health endpoint in incognito window.
[ ] T-20 min: Perform one complete live walkthrough on production using the demo account.
[ ] T-15 min: Double-check Hack2Ignite registration details:
              - Team Name: 404 Brain Not Found
              - Team Lead: Parth Patil
              - Team Members: Suyog Pawar, Asmita Lokhande, Aditi Vispute
              - Track: EduTech / AI for Good
              - Project Title: CareerPath AI
[ ] T-10 min: Verify submission form URLs (GitHub repo, live app link, video link, PPT link).
[ ] T-05 min: Click Submit on portal.
[ ] T-00 min: Download submission confirmation / take confirmation screenshot.
```

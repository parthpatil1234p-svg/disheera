# Hack2Ignite 2026–27 — Official Submission Checklist

> **Status:** Submission Verification Protocol / All items begin unchecked  
> **Project:** CareerPath AI — Discover Your Career. Build Your Skills.  
> **Domain:** EduTech / AI for Good  
> **Team:** 404 Brain Not Found (Parth Patil, Suyog Pawar, Asmita Lokhande, Aditi Vispute)

---

## 📋 Comprehensive Pre-Submission Verification Matrix

Verify and check off every item prior to final submission.

---

### 1. 📁 Repository & Project Readiness
- [ ] Working tree is clean (`git status` shows no untracked or unstaged files).
- [ ] Directory layout matches the standard structure (`client/`, `server/`, `docs/`, `postman/`, `assets/`, `presentation/`).
- [ ] Root `package.json` contains helper scripts (`server:install`, `server:dev`, `server:seed`).
- [ ] MIT `LICENSE` file is present and credited to Team 404 Brain Not Found.
- [ ] No extraneous build artifacts, `.DS_Store`, or OS caches exist in repository.

---

### 2. 📜 GitHub Commit History & Integrity
- [ ] Commit messages follow the Conventional Commits format (`feat`, `fix`, `docs`, `chore`).
- [ ] No fake or bot-generated commits exist in history.
- [ ] Commit timestamps reflect genuine development progression during the hackathon.
- [ ] All team members have contributed commits reflecting their respective roles.

---

### 3. 🔐 Security & Secrets Audit
- [ ] Root `.gitignore` actively ignores `.env`, `server/.env`, and `client/.env`.
- [ ] No real MongoDB Atlas connection strings or database credentials are committed.
- [ ] `JWT_SECRET` is set via environment variables with no hardcoded fallback in production.
- [ ] `render.yaml` sets `sync: false` on sensitive environment variables.
- [ ] No third-party API keys or personal access tokens exist in cleartext.

---

### 4. 📐 Code Quality & Standards
- [ ] Backend syntax check passes cleanly: `node -c server/server.js`.
- [ ] Frontend code contains zero broken script imports or syntax errors.
- [ ] API URLs are resolved dynamically via `client/js/config.js` without hardcoded localhost references.
- [ ] Centralized error handler catches and formats unhandled exceptions cleanly.

---

### 5. ☁️ Backend & Frontend Deployment
- [ ] MongoDB Atlas M0 cluster is provisioned and network access is configured.
- [ ] Database seed script (`npm run seed`) has been executed against the active database.
- [ ] Render Web Service is deployed and `/api/health` returns HTTP 200.
- [ ] Vercel frontend is deployed and accessible via public HTTPS URL.
- [ ] Backend `CLIENT_URL` is synchronized with the live Vercel domain to permit CORS.

---

### 6. 🧪 Testing & Verification Suite
- [ ] All 19 manual test cases in `docs/TESTING.md` have been reviewed.
- [ ] Postman collection in `postman/` imports cleanly and collection variables resolve properly.
- [ ] Automated JWT token capture scripts in Postman execute successfully.
- [ ] Authentication, assessment submission, recommendation scoring, and task toggles verified.

---

### 7. 📱 UI, Mobile Responsiveness & 3D Fallbacks
- [ ] Glassmorphism UI renders correctly across desktop viewports (1200px+).
- [ ] Mobile responsive layout tested (< 576px) with clean navigation collapse.
- [ ] Three.js 3D modules (Career Universe, Skill Orbit, Roadmap Path, Progress Orb) animate smoothly.
- [ ] WebGL fallback verified: 2D HTML/CSS cards display if hardware acceleration is disabled.

---

### 8. 📚 Documentation & Attribution
- [ ] Main `README.md` includes status notice: "Hackathon MVP — Development in progress".
- [ ] All documentation files in `docs/` (`PRD.md`, `TRD.md`, `APP-FLOW.md`, `UI-UX-DESIGN.md`, `BACKEND-SCHEMA.md`, `IMPLEMENTATION-PLAN.md`, `API.md`, `DEPLOYMENT.md`, `TESTING.md`, `DEMO-SCRIPT.md`, `PPT-CONTENT.md`, `SUBMISSION-CHECKLIST.md`) are complete and valid.
- [ ] `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and `CHANGELOG.md` are present in root.
- [ ] Open-source libraries (Bootstrap, Three.js, GSAP, Mongoose) are properly credited.

---

### 9. 🎤 Presentation, Demo & Video
- [ ] 10-slide presentation deck prepared according to `docs/PPT-CONTENT.md`.
- [ ] Slide deck exported as PDF/PPTX and saved in `presentation/`.
- [ ] 3–4 minute demo script rehearsed with team speaker division.
- [ ] Dedicated demo user account registered and seeded with representative assessment data.
- [ ] Backup MP4 demo walkthrough video recorded in case of internet instability.

---

### 10. 👥 Team & Registration Verification
- [ ] Team Name verified: **404 Brain Not Found**.
- [ ] Team Lead verified: **Parth Patil**.
- [ ] Team Members verified: **Suyog Pawar, Asmita Lokhande, Aditi Vispute**.
- [ ] Hackathon Track verified: **EduTech / AI for Good**.
- [ ] Project Title verified: **CareerPath AI**.

---

### 11. 📑 Hackathon Rulebook & Submission Form Review
- [ ] Official Hack2Ignite 2026–27 qualifier rulebook reviewed for any specific constraints.
- [ ] Submission form links verified: GitHub repository URL, live application URL, demo video link, presentation deck link.
- [ ] Public access permissions on GitHub repository confirmed (or added evaluators if private).

---

### 12. 🛡️ Emergency Contingency Plan
- [ ] Local environment ready as immediate backup (`npm run dev` and `python -m http.server 5500`).
- [ ] Postman collection ready to demonstrate live API functionality if frontend fails.
- [ ] Offline presentation PDF and demo video accessible locally.

---

### 13. ⏱️ Final 30-Minute Countdown Checklist

```text
[ ] T-30 min: Perform git status. Confirm working tree is 100% clean.
[ ] T-25 min: Verify Vercel frontend and Render /api/health endpoint in a clean incognito browser.
[ ] T-20 min: Execute one end-to-end user journey test on production using demo credentials.
[ ] T-15 min: Double-check team details and project links on submission portal form.
[ ] T-10 min: Preview final presentation slide deck and backup video file.
[ ] T-05 min: Click Submit on the official hackathon portal.
[ ] T-00 min: Save submission receipt and take confirmation screenshot.
```

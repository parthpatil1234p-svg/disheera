# Changelog — CareerPath AI

All notable changes to **CareerPath AI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned / In Development (Hack2Ignite 2026–27 Qualifier)

#### Added
- **Project Foundation:** Initial monorepo layout separating `client/` and `server/` with shared documentation.
- **Authentication:** User registration, password encryption via `bcryptjs`, and stateless JWT authorization.
- **Career & Skill Database:** 35+ standardized skills across 8 domains and 5 industry career definitions.
- **Student Assessment:** Assessment form capturing educational background, interest domains, and skill proficiencies.
- **Recommendation Engine:** Deterministic career matching algorithm ($60\% \text{ Skills} + 25\% \text{ Interests} + 15\% \text{ Education}$) and skill-gap categorization (Matched, Needs Upgrade, Missing).
- **Personalized Roadmaps:** Dynamic 4/8/12-week roadmap generator prioritizing missing and weak skills.
- **Task Progress Tracking:** Checkbox task completion with atomic progress updates and student dashboard telemetry.
- **3D Experiences (Three.js & GSAP):**
  - Career Universe celestial constellation hero on landing page.
  - Skill Orbit planetary ring visualization on recommendations page.
  - Roadmap Milestone 3D path on roadmap page.
  - Holographic Progress Orb on student dashboard.
- **Documentation Suite:** PRD, TRD, App Flow, Schemas, Deployment Guide, QA Testing Plan, Demo Script, and Submission Checklist.

#### Changed
- Enhanced CORS policy to dynamically authorize local development and Vercel production domains.
- Standardized API response format across all controllers (`{ success, message, data }`).

#### Fixed
- Resolved WebGL context loss handling with automatic 2D fallback rendering.
- Addressed JWT authorization header format parsing and edge-case token expiration.

#### Security
- Added `helmet` security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- Applied rate limiting to protect authentication routes against brute-force attacks.
- Configured `.gitignore` to prevent leakage of `.env` files and Atlas connection URIs.

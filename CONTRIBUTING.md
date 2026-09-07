# Contributing to CareerPath AI

> **Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> *Discover Your Career. Build Your Skills.*

Thank you for collaborating on **CareerPath AI**. This document outlines our team workflow, code standards, Git branch structure, and contribution rules during the 48-hour Hack2Ignite hackathon qualifier.

---

## 👥 Team Roles & Responsibilities

| Contributor | Focus Area | Scope |
| :--- | :--- | :--- |
| **Parth Patil** (Team Lead) | Backend, Database & Deployment | Express API, Mongoose schemas, algorithms, Render deployment |
| **Suyog Pawar** | Frontend & Vercel Deployment | HTML5/CSS3/Bootstrap structuring, DOM logic, Vercel configuration |
| **Asmita Lokhande** | UI/UX & 3D Interactive Design | Design system, Three.js constellations & orbits, presentation design |
| **Aditi Vispute** | QA, Documentation & Demo Support | Manual testing, dataset curation, demo script, submission checks |

---

## 🌿 Branch Strategy

All team members must work on isolated branches created from `develop` (or `main` if single-branch trunk development is chosen). Never push broken code directly to `main`.

```text
main           ← Production-ready, deployed to Vercel and Render
  └── develop  ← Staging integration branch
        ├── feature/<feature-name>   ← New capabilities (e.g., feature/recommendation-engine)
        ├── fix/<bug-name>           ← Defect fixes (e.g., fix/cors-preflight)
        └── docs/<doc-name>          ← Documentation updates (e.g., docs/api-specification)
```

### Branch Naming Conventions
- `feature/assessment-form`
- `feature/threejs-skill-orbit`
- `feature/roadmap-generator`
- `fix/jwt-token-expiration`
- `fix/threejs-canvas-resize`
- `docs/deployment-guide`

---

## 📝 Commit Message Guidelines

We enforce the **Conventional Commits** specification to ensure a clean, audit-compliant Git history:

### Allowed Types
- `feat`: A new user-facing or backend feature.
- `fix`: A bug fix or runtime issue resolution.
- `docs`: Documentation creation or revisions.
- `style`: Formatting, whitespace, or CSS styling (no functional logic change).
- `refactor`: Code restructuring without adding features or fixing bugs.
- `test`: Adding or verifying tests (manual or automated).
- `chore`: Build tasks, dependency updates, `.gitignore` adjustments.

### Meaningful Commit Examples for CareerPath AI
```bash
feat(backend): implement deterministic career recommendation scoring engine
feat(frontend): create 3D skill orbit visualization with Three.js
feat(api): add task completion toggle endpoint with progress recalculation
fix(auth): handle expired JWT token with redirect to login
docs(testing): add 19 manual test cases with step-by-step verification
style(ui): apply dark glassmorphism styling to roadmap milestones
chore(config): configure vercel.json headers and clean URLs
```

---

## 🔍 Pull Request (PR) Checklist

Before submitting or merging a pull request into `develop` or `main`:

- [ ] Branch is up to date with target branch (`git rebase develop` or `git merge develop`).
- [ ] No merge conflicts remain unresolved.
- [ ] Local tests have been executed and pass without unhandled rejections.
- [ ] Server starts cleanly with `npm run dev` and health check returns HTTP 200.
- [ ] Three.js 3D elements function properly and graceful 2D fallbacks display if WebGL is disabled.
- [ ] No hardcoded credentials, secret keys, or real database URLs are included.
- [ ] Corresponding documentation has been updated (e.g., `docs/API.md` for new endpoints).
- [ ] Minimum of one peer review approval from the team.

---

## 📐 Code Quality & Architecture Standards

1. **Frontend Architecture:**
   - Plain HTML5, CSS3, and JavaScript (ES6+).
   - Use Bootstrap 5.3 utility classes combined with custom CSS tokens in `client/css/style.css`.
   - Never hardcode absolute API URLs in individual fetch calls; always reference `window.CONFIG.API_BASE_URL` from `client/js/config.js`.
   - Ensure all interactive elements have semantic HTML and accessible labels.

2. **Backend Architecture:**
   - Node.js + Express using CommonJS syntax (`require`/`module.exports`).
   - Keep controllers thin and business logic isolated in `services/`.
   - Every protected route must use `protect` middleware from `middleware/authMiddleware.js`.
   - Centralize all error handling through `middleware/errorMiddleware.js`.

3. **Avoiding Merge Conflicts:**
   - Coordinate file ownership before starting a sprint.
   - Pull the latest target branch before starting work: `git pull origin develop`.
   - Keep pull requests small and focused on a single responsibility.

---

## ⚠️ Hackathon Compliance & Integrity Notice

- **Original Code Only:** All submitted code must be developed by Team 404 Brain Not Found.
- **No Fabricated Commits:** Do not generate artificial commit timestamps, fake author names, or bot-generated git spam.
- **No Committed Secrets:** Never commit `.env`, passwords, or API keys. Any accidental commit of secrets must be immediately revoked and purged from git history.

# Contributing to Disheera

First off, thank you for considering contributing to **Disheera**! It’s people like you that make Disheera a truly accessible, AI-powered career guidance ecosystem for students and educators worldwide.

Following these guidelines helps communicate that you respect the time of the developers managing and developing this open-source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [What Can I Contribute?](#what-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Branching Strategy](#branching-strategy)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Design System & Theme Standards](#design-system--theme-standards)
7. [Testing & Quality Verification](#testing--quality-verification)
8. [Submitting a Pull Request](#submitting-a-pull-request)
9. [Reporting Security Issues](#reporting-security-issues)

---

## Code of Conduct

This project and everyone participating in it is governed by the [Disheera Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [contact@disheera.site](mailto:contact@disheera.site).

---

## What Can I Contribute?

- **Bug Fixes:** Address bugs logged in our [GitHub Issues](https://github.com/parthpatil1234p-svg/disheera/issues).
- **Features & Enhancements:** Help implement roadmap milestones, college assignment rubrics, or new AI mentor capabilities.
- **Documentation:** Clarify READMEs, API specifications, setup guides, and student tutorials.
- **Translations & Accessibility:** Help audit WCAG AAA contrast, keyboard accessibility, and localization.

---

## Development Setup

### Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **PostgreSQL / Supabase:** A PostgreSQL instance (or Supabase project) with connection string.

### Quick Start

1. **Fork and Clone the Repository:**
   ```bash
   git clone https://github.com/<your-username>/disheera.git
   cd disheera
   ```

2. **Install Root & Server Dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `server/.env`:
   ```bash
   cp .env.example server/.env
   ```
   Fill in your PostgreSQL `DATABASE_URL` and `JWT_SECRET`.

4. **Initialize Database Models:**
   ```bash
   cd server
   npx prisma generate
   cd ..
   ```

5. **Start Local Development Servers:**
   - **Backend API (Port 5000):**
     ```bash
     npm run server:dev
     ```
   - **Frontend Client (Port 5500):**
     ```bash
     npm run client:serve
     ```
   - **Admin Cockpit (Port 5501):**
     ```bash
     npm run admin:serve
     ```

---

## Branching Strategy

- **Main Branch:** `main` represents the stable, deployable production release.
- **Feature Branches:** Create descriptive branch names from `main`:
  - `feat/feature-name` (e.g., `feat/weekly-quiz-analytics`)
  - `fix/bug-description` (e.g., `fix/mobile-navbar-overflow`)
  - `docs/doc-update` (e.g., `docs/api-reference`)
  - `perf/optimization` (e.g., `perf/cache-roadmap-queries`)

---

## Commit Message Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/) standards. Commit messages should be structured as follows:

```text
<type>(<scope>): <short description in imperative present tense>
```

### Common Types:
- `feat:` A new user-facing feature.
- `fix:` A bug fix.
- `docs:` Documentation changes only.
- `style:` Formatting, indentation, missing semi-colons (no code logic changes).
- `refactor:` Code restructuring without changing external behavior.
- `perf:` Performance optimizations.
- `test:` Adding or updating tests.
- `chore:` Build process, dependency updates, or auxiliary tool changes.

**Example:**
```bash
git commit -m "feat(auth): enforce strict 1:1 mobile number to account uniqueness and live pre-check"
```

---

## Design System & Theme Standards

> [!IMPORTANT]
> **Light-Theme Modern EduTech Platform Only:**
> Disheera is exclusively designed with a clean, high-contrast light theme.
> - **Canvas Background:** `#F8FAFC`
> - **Cards & Modals:** `#FFFFFF` with `#E2E8F0` border and subtle elevation shadow.
> - **Headings:** `#0F172A` (Slate 900)
> - **Body:** `#334155` (Slate 700)
> - **Brand Primary:** `#2563EB` (Royal Blue)
> - **Strictly Prohibited:** NEVER use pitch-dark/black card backgrounds (`#0f172a`, `#0b1120`, `#111827`) or glowing cyberpunk neon borders in modal dialogs or standard views.

---

## Testing & Quality Verification

Before submitting a Pull Request, all automated verification suites must pass with zero errors:

```bash
# 1. Syntax & Core Verification
npm test

# 2. 1:1 Mobile Uniqueness Verification
node tests/test_one_mobile_one_account.js

# 3. Weekly Assignment & Submission Suites (Phases 1-4)
npm run test:assignments
npm run test:assignments-phase2
npm run test:assignments-phase3
npm run test:assignments-phase4

# 4. Portal RBAC & Corporate Recruiter Isolation
npm run test:rbac
npm run test:recruiter

# 5. Dependency Audit Check
npm audit
cd server && npm audit
```

---

## Submitting a Pull Request

1. Push your branch to your forked repository:
   ```bash
   git push origin feat/your-feature
   ```
2. Navigate to the GitHub repository and open a **Pull Request**.
3. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely:
   - Provide a clear summary of changes.
   - Link related issue numbers (`Fixes #123`).
   - Confirm all quality checks and tests have passed.
4. Maintainers will review your PR and provide feedback or merge your contribution.

---

## Reporting Security Issues

Please **do not** open public GitHub issues for security vulnerabilities. Review our [Security Policy](SECURITY.md) for details on responsible vulnerability disclosure.

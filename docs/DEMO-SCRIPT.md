# Official Hackathon Demo Script — Golden Path Walkthrough (3-Minute Evaluator Guide)

> **🏆 Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> **Problem Statement ID:** ED-02 (AI Career Guidance and Skill Roadmap Platform)  
> **Presenter / Speaker Guide:** 3–4 Minute Live Prototype Demonstration

---

## ⏱️ Live Demonstration Timeline & Speaking Notes

### 🎬 Minute 0:00 – 0:35 · Hook & Frictionless Authentication
- **Action:** Open landing page at `http://localhost:5500/index.html` (or [live Vercel URL](https://careerpath-ai-jade.vercel.app)).
- **What to show:**
  1. Highlight the **CareerPath AI** headline and EduTech positioning: *"Discover Your Career. Bridge Your Skill Gaps. Build Your Future."*
  2. Point out the interactive **Three.js 3D Career Universe** constellation (and instant 2D fallback).
  3. Click **"Get Started"** to navigate to `/login.html`.
  4. Click the purple button: **"⚡ 1-Click Fill Demo Account"** (`demouser@gmail.com` / `demo123`) and hit **Login**.
- **Speaker Script:**
  > *"Respected judges, every year over 1.5 million engineers graduate in India, but more than 80% struggle to meet industry hiring benchmarks because of generic advice and self-reported resume inflation. Today, we present CareerPath AI — an explainable, code-grounded career navigation engine."*

---

### 🎬 Minute 0:35 – 1:15 · Assessment & Auth-Based GitHub Repository Sync
- **Action:** Navigate to `/assessment.html`.
- **What to show:**
  1. Show academic profile inputs (Course: B.Tech, Year: Third Year, Primary Stream: Tech & Engineering).
  2. Scroll to the **Skills Profiler** section.
  3. Click **"Auto-Detect Skills"**:
     - *Point out that NO manual username prompt modal appears.*
     - Show the inline loading state and success toast: *"✓ Repositories synchronized via auth system!"*
  4. Show the green luminous badges: `[✓ Code Verified]` attached to detected technologies (JavaScript, HTML, CSS, TypeScript).
- **Speaker Script:**
  > *"Instead of relying on unverified claims, CareerPath AI introduces two-factor skill verification. Notice how clicking 'Auto-Detect Skills' directly queries our backend via an authenticated session token, fetching real public GitHub repositories, calculating language distributions, and issuing verified code badges with zero friction."*

---

### 🎬 Minute 1:15 – 1:55 · Adaptive Skill Reality-Check Micro-Quiz
- **Action:** Click **"Take Reality-Check Quiz"** or navigate to `/quiz.html`.
- **What to show:**
  1. Show the **Provider Switcher / BYOK Modal**: point out that judges can toggle between **Groq Llama 3.3 70B** (<300ms speed), **Google Gemini 2.5 Flash**, or enter their own API key.
  2. Answer Question 1 of 5: show instant pedagogical explanation explaining *why* the answer is correct or incorrect.
  3. Show the dynamic stepper dots advancing from Question 1 to 5.
  4. Complete the 5 questions to display the scorecard.
  5. Explain the **One-Time Verification Rule**: the student is marked as `isQuizVerified: true` and `hasCompletedSkillVerification: true`, permanently recording their competency without annoying re-gating.
- **Speaker Script:**
  > *"To defeat resume inflation, our adaptive micro-quiz generates 5 dynamic reality-check questions using Groq Llama 3.3 70B in under 300 milliseconds, with automated Google Gemini failover. Once verified, this credential is saved permanently to the student's profile."*

---

### 🎬 Minute 1:55 – 2:35 · Explainable Recommendations & "Lock Enrolling, Never Browsing"
- **Action:** Navigate to `/recommendations.html`.
- **What to show:**
  1. Point out the **Top 3 Recommended Careers** (e.g., Full Stack Developer, DevOps Engineer, Data Scientist) scoped to their **Primary Stream**.
  2. Highlight the **60/25/15 Mathematical Breakdown**: 60% Skill Match, 25% Interest Overlap, 15% Academic Alignment — zero hallucinations.
  3. Show the **Tri-Color Skill Gap Matrix**:
     - 🟢 **Matched Skills** (with verified badges)
     - 🟡 **Proficiency Upgrades**
     - 🔴 **Missing Skills** (the exact curriculum for the roadmap)
  4. Demonstrate the **"Lock Enrolling, Never Browsing" Architecture**:
     - Highlight that the student has an active route: `[⚡ ACTIVE ROUTE · Week 2 of 4 (45% Tasks)]`.
     - Notice that **exploration is 100% open**: click the **"What-If Simulator"** and **"Live Market Telemetry & CTC"** (Adzuna API) on any career card!
     - But note the enrollment discipline: other "Start Roadmap" buttons are safely disabled with the notice: *"Finish your current route or abandon it to start this one."*
- **Speaker Script:**
  > *"Notice our 'Lock Enrolling, Never Browsing' architecture. Students can freely explore alternative careers, run What-If simulations, and inspect live salaries, but they cannot enroll in multiple simultaneous tracks. This prevents tutorial hopping while keeping learning focused."*

---

### 🎬 Minute 2:35 – 3:15 · Adaptive Roadmap & 4-Rule Job Ready Engine
- **Action:** Open `/roadmap.html`.
- **What to show:**
  1. Show week-by-week actionable tasks with verified documentation links. Check off one task to show progress recalculating atomically.
  2. Point out the **`🔥 4-Rule Industry Job Ready Certification`** card:
     - Rule 1: Readiness Score ≥ 70%
     - Rule 2: Role-Specific Verified Skills ≥ 4
     - Rule 3: Roadmap Progress ≥ 80% or Graduated
     - Rule 4: Zero Expired Skills (<90 Days)
  3. Show the **Safe Route Abandonment** modal: explain that abandonment is non-destructive (all verified skills and scores are preserved) and protected by a 7-day anti-abuse cooldown.
  4. Click **"1-Click Print / PDF Export"** to showcase clean printing layout.
- **Speaker Script:**
  > *"On the roadmap, students track progress toward true industry readiness. Our 4-Rule Job Ready Engine verifies real competencies, completed milestones, and skill retention. If a student chooses to abandon a route, all their earned skills and quiz scores are preserved, backed by a 7-day rate-limiting cooldown."*

---

### 🎬 Minute 3:15 – 3:45 · Student Dashboard & Single Resume per Account
- **Action:** Open `/dashboard.html`.
- **What to show:**
  1. Point out the **Accessible 2D SVG Percentage Progress Gauge** (0–100%).
  2. Demonstrate the **Single Resume per Account Manager**:
     - Show the active verified resume card with file size and upload date.
     - Highlight our binary **Magic-Byte Inspector** (`%PDF`, `PK\x03\x04`, `\xD0\xCF\x11\xE0`) preventing fake or malicious file uploads.
     - Mention the transactional **Cloudinary replacement workflow** that automatically destroys old assets so storage never leaks.
  3. Show the **GitHub Study Lab** displaying connected repositories and language telemetry.
  4. Open the floating **`🤖 AI Mentor`** drawer in the bottom right corner and send a sample question: *"How do I prepare for React system design interviews?"* Show sub-300ms AI response.
- **Speaker Script:**
  > *"Finally, on the dashboard, students manage their verified Single Resume, inspect their GitHub Study Lab, and consult our 24/7 AI Mentor. CareerPath AI transforms career confusion into disciplined, verifiable daily progress. Thank you!"*

---

## 🛡️ Quick Answers for Judges' Questions

| Question from Evaluator | Winning Response |
| :--- | :--- |
| **"Why do you restrict students to one active roadmap at a time?"** | *"Over 78% of students drop out due to 'tutorial hopping'. Our database-level partial unique index `{ user: 1, status: 'active' }` guarantees focus and clean state tracking, while our 'Lock Enrolling, Never Browsing' UX lets students explore other careers freely."* |
| **"What happens if a student abandons their career route?"** | *"It is 100% non-destructive. Status changes to 'abandoned', but all quiz scores, verified skill badges, and completed tasks are permanently preserved. To prevent impulsive hopping, a 7-day rate-limiting cooldown is enforced."* |
| **"What is the 4-Rule Job Ready Certification?"** | *"Instead of a fake certificate of completion for watching videos, students must satisfy 4 objective criteria: Readiness Score ≥ 70%, at least 4 role-specific verified skills, roadmap progress ≥ 80%, and zero expired skills within 90 days."* |
| **"How do you secure user resumes?"** | *"We enforce a dedicated 1:1 Resume schema, inspect binary magic bytes (`%PDF`, `PK\x03\x04`, `\xD0\xCF\x11\xE0`) to prevent extension spoofing, cap size at 5MB, and execute transactional Cloudinary asset destruction to prevent storage bloat."* |
| **"Is the AI recommendation advice trustworthy?"** | *"Yes. We don't ask the AI to guess a career blindly. We use an explainable 60/25/15 mathematical formula for recommendations, and use AI strictly for generating validated quiz questions and conversational mentoring."* |
| **"How does the app prevent cheating on self-reported skills?"** | *"Through our two-factor verification pipeline: 1) Auth-based GitHub repo code scanning (`isCodeVerified`), and 2) Dynamic 5-question reality-check micro-quizzes (`isQuizVerified`)."* |
| **"How does the business sustain itself without charging students?"** | *"CareerPath AI is free for students always. We monetize via an institutional B2B placement SaaS for colleges (TPO Portal for NAAC/NIRF reporting at ₹1.99L/year) and a recruiter verified-talent pass at ₹24,999/month."* |
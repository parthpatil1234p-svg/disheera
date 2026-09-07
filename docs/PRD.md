# Product Requirements Document (PRD) — CareerPath AI

> **Status:** Draft / To be validated during qualifier  
> **Hack2Ignite 2026–27 · Round 1 MVP**  
> **Domain:** EduTech / AI for Good  
> **Team:** 404 Brain Not Found  
> **Primary Author:** Parth Patil (with contributions from Team)

---

## 1. Executive Summary & Product Vision

**CareerPath AI** is an intelligent, immersive career navigation and skill development platform designed to empower undergraduate students and aspiring technologists to make informed, data-backed career decisions. 

Our vision is to replace generic, subjective career counseling questionnaires with an **objective, deterministic skill-matching engine** paired with an **interactive 3D learning experience**. By mapping students' existing skills directly against target industry roles, CareerPath AI reveals exact skill gaps and synthesizes personalized, time-boxed learning roadmaps that guide students from academic theory to job-ready execution.

---

## 2. Problem Statement

Undergraduate tech students face three primary structural hurdles:
1. **Degree-Industry Disconnect:** Universities focus heavily on foundational theory, leaving students uncertain about which tools, frameworks, and workflows modern employers demand.
2. **Subjective Advice & Analysis Paralysis:** Career tests often give high-level personality classifications rather than actionable technical skill evaluations.
3. **The Generic Course Avalanche:** Students who seek out online courses are inundated with massive 50-hour generic courses without knowing what they actually need to learn versus what they already know.

---

## 3. Goals & Non-Goals

### Project Goals (Hackathon MVP)
- Provide a responsive, accessible multi-page web platform with dark glassmorphism aesthetics.
- Deliver a 100% deterministic, explainable career recommendation engine:
  $$\text{Career Match Score} = (\text{Skill Match} \times 0.60) + (\text{Interest Match} \times 0.25) + (\text{Education Match} \times 0.15)$$
- Provide granular skill-gap analysis (Matched, Needs Upgrade, Missing) for top 3 career matches.
- Generate personalized 4, 8, or 12-week learning roadmaps with week-by-week actionable tasks.
- Track task completion dynamically with persistent progress calculation on a student dashboard.
- Deliver engaging 3D visual experiences (Career Universe, Skill Orbit, Roadmap Path, Progress Orb) with guaranteed 2D fallbacks.

### Non-Goals (Out of Scope for 48-Hour Qualifier)
- Integrating opaque external LLM chatbots (e.g., live ungrounded chat prompts).
- Automated resume PDF parsing or GitHub scraping.
- Native mobile application builds (iOS / Android binaries).
- Payment gateways, course sales, or premium subscriptions.
- Blockchain certification or web3 credentialing.

---

## 4. Target User Personas

### Persona 1: Rohan — The Confused Computer Science Fresher
- **Demographics:** 20 years old, 3rd year BCA / B.Tech CSE student.
- **Background:** Knows basic C++, HTML, and CSS from university coursework, but has no portfolio projects.
- **Pain Point:** Intimidated by the sheer variety of job descriptions (DevOps, Full-Stack, Cloud, AI). Does not know if he knows enough to apply for internships or what to learn next.
- **Goal:** Wants an objective evaluation of his current foundation, a clear recommendation on what role suits him best, and a step-by-step roadmap to become internship-ready.

### Persona 2: Priya — The Transitioning Skill Switcher
- **Demographics:** 22 years old, Non-CS graduate (Commerce / Statistics) learning to code independently.
- **Background:** Self-taught in Python and Excel; interested in data-oriented roles.
- **Pain Point:** Has scattered knowledge from YouTube tutorials with significant blind spots in SQL, visualization, and data storytelling.
- **Goal:** Wants to identify her exact missing skills for a Data Analyst career and follow a structured 8-week curriculum with curated resources.

---

## 5. Feature Scope: MVP vs. Future Horizon

| Category | MVP Scope (Hack2Ignite Round 1) | Future Scope (Post-Qualifier) |
| :--- | :--- | :--- |
| **Authentication** | Custom JWT auth, bcrypt hashing, protected routes | OAuth2 (Google/GitHub login), 2FA |
| **Assessment** | Education degree, domain interests, skills + proficiencies | Resume PDF upload parsing, GitHub repo skills extraction |
| **Recommendation** | Deterministic 60/25/15 weighted formula across 5 careers | Machine learning clustering over 100+ industry job specs |
| **Skill Gap** | Matched (Green), Needs Upgrade (Amber), Missing (Red) | Interactive skill assessment quizzes for validated badges |
| **Roadmap** | 4, 8, 12-week curricula with week-by-week task checklists | Dynamic calendar sync (Google Calendar / Outlook) |
| **Progress** | Checkbox task toggle with persistent completion % | Portfolio project code evaluation & peer review hub |
| **Visuals** | Three.js Constellations, Orbits, Paths & Orbs with 2D fallbacks | WebXR immersive VR workspace & career simulator |

---

## 6. Functional Requirements

1. **User Management:**
   - User registration (`name`, `email`, `password` with min 6 characters).
   - User login issuing signed JWT tokens.
   - User profile endpoint (`GET /api/users/me`) returning current assessment state.
2. **Assessment Capture:**
   - Education details (degree, field of study, graduation year).
   - Domain interests (minimum 1, maximum 5).
   - Skills selection with explicit proficiency levels (`beginner`, `intermediate`, `advanced`).
3. **Recommendation Engine:**
   - Calculate match scores for all 5 seeded careers: Front-End Developer, Full-Stack Developer, Data Analyst, UI/UX Designer, Cybersecurity Analyst.
   - Return top 3 ranked recommendations with percentage scores.
   - Partition required career skills into Matched, Needs Upgrade, and Missing.
4. **Roadmap & Task Execution:**
   - Generate structured 4, 8, or 12-week roadmap for a selected recommended career.
   - Prioritize missing and weak skills in early weeks.
   - Allow students to toggle task completion with immediate progress recalculation.
5. **Dashboard Telemetry:**
   - Display active career goal, overall progress percentage, first 5 upcoming tasks, and dynamic next-action guidance.

---

## 7. Non-Functional Requirements

- **Performance:** Recommendation generation and roadmap synthesis must complete in under 200 milliseconds.
- **Reliability:** All pages must function cleanly even if Three.js/WebGL fails (100% functional 2D fallback).
- **Security:** Zero plaintext passwords, sanitized MongoDB query inputs, and hardened HTTP headers (`helmet`).
- **Responsiveness:** Fluid layout adaptability across desktop (1920px) down to mobile screens (375px).

---

## 8. Success Metrics (Hackathon Evaluation)

- **Execution Stability:** 0 unhandled exceptions during judge live demo.
- **Algorithmic Accuracy:** Career recommendations logically align with input skills and domain interests.
- **User Experience:** Seamless end-to-end user journey from assessment to active task tracking within 3 minutes.
- **Visual Distinction:** Memorable, performant 3D WebGL components that clarify user data rather than serving as visual clutter.

# Pitch Deck Content Specification (10 Slides) — CareerPath AI

> **Status:** Slide Deck Content / To be updated with final presentation assets  
> **Hack2Ignite 2026–27 · Round 1 Evaluation**  
> **Team:** 404 Brain Not Found · Domain: **EduTech / AI for Good**

---

## 🖥️ Slide 1: Title Slide
- **Title:** CareerPath AI
- **Subtitle:** AI Career Guidance & Skill Roadmap Platform
- **Tagline:** *Discover Your Career. Build Your Skills.*
- **Event:** Hack2Ignite 2026–27 (Round 1 Qualifier)
- **Domain:** EduTech / AI for Good
- **Team Name:** 404 Brain Not Found
- **Team Members:**
  - **Parth Patil** — Team Leader & Backend Architect
  - **Suyog Pawar** — Frontend & UI Integration Engineer
  - **Asmita Lokhande** — UI/UX & 3D Interactive Designer
  - **Aditi Vispute** — Data Structuring & QA Specialist
- **Visual Suggestion:** Dark navy glassmorphism theme with subtle cyan/purple accent lighting; 3D constellation motif.
- **Speaker:** Parth Patil
- **Duration:** 20 Seconds

---

## ⚠️ Slide 2: Problem Statement
- **Title:** The Higher-Education Career Paradox
- **Key Points:**
  - **70%+ Undergraduates Face Analysis Paralysis:** Overwhelmed by rapidly evolving industry roles and fragmented job descriptions.
  - **Degree-Industry Disconnect:** Academic curricula focus on theory, leaving students blind to practical tech stack requirements.
  - **The Generic Course Avalanche:** Traditional portals push 40-hour generic courses without diagnosing existing proficiencies.
  - **Lack of Time-Boxed Roadmaps:** Students know *what* careers exist, but not *how* to prepare week by week.
- **Visual Suggestion:** 3-column infographic contrasting student confusion with fragmented course catalogs.
- **Speaker:** Parth Patil
- **Duration:** 25 Seconds

---

## 🎯 Slide 3: Target Users & Pain Points
- **Title:** Who We Are Building For
- **Target Personas:**
  - **Undergraduate Tech Students (BCA, B.Tech, BSc CS):** Needing guidance to choose and prepare for their first specialized tech role.
  - **Career Changers & Transitioning Self-Learners:** Possessing scattered knowledge and needing an actionable bridge to become hireable.
- **Core Pain Points Solved:**
  - *"Which career best matches my current foundation?"*
  - *"What are my exact missing skills vs. skills I already have?"*
  - *"How do I structure my self-study over 4, 8, or 12 weeks to get hired?"*
- **Visual Suggestion:** Persona comparison cards with student quotes and pain-point callouts.
- **Speaker:** Parth Patil
- **Duration:** 20 Seconds

---

## 💡 Slide 4: Proposed Solution
- **Title:** The CareerPath AI Solution
- **Core Pillars:**
  - **1. Objective Profiling:** Multi-step evaluation of degree, domain interests, and granular skill proficiencies.
  - **2. Deterministic AI Scoring:** Transparent, explainable career matching without black-box hallucinations.
  - **3. Precision Skill-Gap Analysis:** Categorizes skills into Matched (Green), Needs Upgrade (Amber), and Missing (Red).
  - **4. Time-Boxed Personalized Roadmaps:** Dynamic 4, 8, or 12-week curricula with free curated resources.
  - **5. Interactive 3D Visuals:** Immersive Three.js experiences that clarify user progress with 100% 2D fallbacks.
- **Visual Suggestion:** Solution workflow diagram linking Assessment → Scoring → Gap Analysis → Roadmap.
- **Speaker:** Suyog Pawar
- **Duration:** 25 Seconds

---

## 🔄 Slide 5: User Journey & Application Flow
- **Title:** Seamless Student User Flow
- **Key Steps:**
  - **Onboarding & Auth:** Quick registration; immediate JWT session initialization.
  - **Assessment:** Input education, domain interests, and current technical skills.
  - **Recommendations:** View top 3 careers with match scores and 3D Skill Orbit.
  - **Roadmap Synthesis:** Choose career and duration (4, 8, or 12 weeks).
  - **Execution & Telemetry:** Check off tasks; observe dynamic progress updates on dashboard.
- **Visual Suggestion:** Horizontal chevron user journey pipeline with screenshot placeholders:  
  *(Placeholder: Screenshots to be added after implementation)*
- **Speaker:** Suyog Pawar
- **Duration:** 25 Seconds

---

## 🌟 Slide 6: Core Features & Architecture
- **Title:** Platform Capabilities & Tech Stack
- **Key Capabilities:**
  - Standardized catalog of 35+ skills across 8 categories and 5 industry career profiles.
  - Atomic task progress toggling with persistent database synchronization.
  - Unified student dashboard with live progress and next recommended actions.
- **Stack Summary:**
  - **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Three.js, GSAP.
  - **Backend:** Node.js, Express.js (CommonJS), Mongoose.
  - **Database & Cloud:** MongoDB Atlas (M0), Vercel (Frontend), Render (Backend).
- **Visual Suggestion:** Tech stack logo grid alongside system feature breakdown table.
- **Speaker:** Suyog Pawar
- **Duration:** 25 Seconds

---

## 🧮 Slide 7: AI Recommendation Engine & Formula
- **Title:** Deterministic Career Scoring Engine
- **Formula:**
  $$\text{Career Match Score} = (\text{Skill Match} \times 0.60) + (\text{Interest Match} \times 0.25) + (\text{Education Match} \times 0.15)$$
- **Why Deterministic Scoring?**
  - **Transparent & Explainable:** Students and mentors can audit exactly why a score was awarded.
  - **Zero Hallucinations:** Prevents arbitrary or fabricated career recommendations.
  - **Zero Operational Cost:** Ultra-fast sub-50ms execution without third-party API dependencies.
- **Visual Suggestion:** Interactive pie chart or weighted bar graph showing the 60% / 25% / 15% breakdown.
- **Speaker:** Parth Patil
- **Duration:** 25 Seconds

---

## 🏗️ Slide 8: Technical Architecture
- **Title:** Robust, Scalable Cloud Architecture
- **Architecture Highlights:**
  - **Decoupled Frontend:** Multi-page static web app hosted on Vercel with security headers and clean URLs.
  - **Hardened REST API:** Express service on Render with `helmet`, `cors`, and `express-rate-limit`.
  - **Encrypted Database:** MongoDB Atlas M0 Free Tier with TLS in-transit encryption.
- **Visual Suggestion:** Mermaid architecture diagram (Browser → Vercel → Render → MongoDB Atlas).  
  *(Placeholder: Architecture diagram to be added from `docs/TRD.md`)*
- **Speaker:** Parth Patil
- **Duration:** 20 Seconds

---

## 🌌 Slide 9: 3D UI/UX Innovation & Aesthetics
- **Title:** Purposeful 3D Data Storytelling
- **Four Meaningful Experiences:**
  - **Career Universe (Landing):** Celestial constellation representing infinite possibilities.
  - **Skill Orbit (Recommendations):** Planetary orbits showing matched, weak, and missing skills.
  - **Roadmap Path (Roadmap):** 3D stepping-stone trail of weekly milestones.
  - **Progress Orb (Dashboard):** Holographic sphere pulsing with student energy and growth.
- **Progressive Enhancement:** 100% functional 2D card fallbacks if WebGL is unsupported.
- **Visual Suggestion:** 4-panel collage of 3D canvas visuals alongside their 2D fallbacks:  
  *(Placeholder: Screenshots to be added after implementation)*
- **Speaker:** Asmita Lokhande
- **Duration:** 30 Seconds

---

## 🚀 Slide 10: Social Impact, Future Scope & Conclusion
- **Title:** Empowering the Next Generation of Tech Talent
- **Social Impact:**
  - Democratizing career counseling for underserved students who lack access to private mentors.
  - Bridging the academic divide by aligning self-study directly with industry requirements.
- **Post-Hackathon Roadmap:**
  - Resume PDF parsing and automated GitHub profile skill extraction.
  - Gemini-powered context-grounded learning mentors.
  - Peer study groups and corporate hiring partner integration.
- **Thank You:** Questions & Discussion.
- **Speaker:** Aditi Vispute
- **Duration:** 25 Seconds

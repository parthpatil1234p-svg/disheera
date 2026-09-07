# Live Demo Presentation Script (3–4 Minutes) — CareerPath AI

> **Status:** Proposed Rehearsed Script / To be finalized with live data  
> **Hack2Ignite 2026–27 · Round 1 MVP**  
> **Team:** 404 Brain Not Found · Domain: **EduTech / AI for Good**  
> **Tagline:** *Discover Your Career. Build Your Skills.*

---

## 👥 Speaker Division & Timeline

| Speaker | Role in Demo | Timing | Primary Focus Areas |
| :--- | :--- | :--- | :--- |
| **Parth Patil** (Team Lead) | Lead Presenter & System Architect | 0:00 – 1:00 | Project intro, problem statement, architecture, deterministic scoring formula |
| **Suyog Pawar** | Frontend & Assessment Lead | 1:00 – 1:55 | User onboarding, student assessment, recommendation generation |
| **Asmita Lokhande** | UI/UX & 3D Visuals Designer | 1:55 – 2:50 | 3D design philosophy, Skill Orbit, Milestone Path, Progress Orb & 2D fallback |
| **Aditi Vispute** | Roadmap, Data & Impact Lead | 2:50 – 3:45 | Curriculum generation, task progress toggle, dashboard telemetry, social impact |

---

## ⏱️ Step-by-Step Live Demo Flow (3–4 Minutes)

### Act 1: The Problem & System Architecture (0:00 – 1:00)
**Speaker: Parth Patil**

- **[Screen: Landing Page Hero with 3D Career Universe]** *(Placeholder: `assets/screenshots/landing-hero.png`)*
- *"Good morning/afternoon, esteemed judges! We are Team **404 Brain Not Found**, and we are excited to present **CareerPath AI**.*
- *Over 70% of undergraduate students experience analysis paralysis when transitioning from university coursework to specialized tech careers. Traditional career websites either give vague personality survey results or push generic 50-hour courses without diagnosing what the student already knows.*
- *CareerPath AI acts as an intelligent career compass: analyzing each student's academic background, domain interests, and exact skill proficiency levels to recommend their top 3 career paths, pinpoint skill gaps, and generate a personalized, week-by-week learning roadmap.*
- *Under the hood, our solution features a secure, modular Node.js and Express backend hosted on Render, connected to MongoDB Atlas, and paired with an accessible, high-performance HTML5/Bootstrap and Three.js frontend deployed on Vercel."*

---

### Act 2: Assessment & Recommendation Engine (1:00 – 1:55)
**Speaker: Suyog Pawar**

- **[Screen: Click 'Get Started' → assessment.html]** *(Placeholder: `assets/screenshots/assessment.png`)*
- *"Let's follow Rohan, a 3rd-year student. He registers, logs in, and opens our interactive assessment.*
- *Instead of binary yes/no questions, Rohan inputs his degree, chooses domain interests like Web Development and UI/UX Design, and specifies his technical skills with granular proficiency—for instance, HTML and CSS at Intermediate, and JavaScript at Beginner.*
- *When he clicks **'Find My Career Path'**, our backend recommendation engine runs in under 50 milliseconds across 35+ industry skill vectors."*
- **[Screen: recommendations.html Displays Top 3 Matches]** *(Placeholder: `assets/screenshots/recommendations.png`)*
- *"Our engine is 100% deterministic and explainable:*
  $$\text{Match Score} = (\text{Skill Match} \times 60\%) + (\text{Interest Match} \times 25\%) + (\text{Education Match} \times 15\%)$$
- *Notice Rohan's top recommendation: **Front-End Developer at 81%**.*
- *Right below, our Skill-Gap Breakdown classifies skills into: **Matched** (Green), **Needs Upgrade** (Amber), and **Missing** (Red), immediately showing Rohan his exact learning priorities."*

---

### Act 3: 3D Innovation & Visual Storytelling (1:55 – 2:50)
**Speaker: Asmita Lokhande**

- **[Screen: Interactive 3D Skill Orbit Canvas on recommendations.html]** *(Placeholder: `assets/screenshots/skill-orbit-3d.png`)*
- *"To make career exploration inspiring rather than intimidating, we designed four purposeful Three.js WebGL experiences:*
  1. *On the home page, the **Career Universe** lets students explore celestial career nodes.*
  2. *Here on recommendations, the **Skill Orbit** transforms abstract skill gaps into a planetary system—with the career at the center, surrounded by orbiting matched green planets, amber upgrade satellites, and red missing meteors.*
  3. *On the roadmap page, the **Roadmap Path** displays a 3D stepping-stone trail.*
  4. *On the dashboard, the **Progress Orb** pulses with energy corresponding to live task completion.*
- *Crucially, we follow **Progressive Enhancement**: if a student's device lacks WebGL or hardware acceleration, the canvas gracefully hides and displays clean 2D HTML/CSS cards without blocking any functionality."*

---

### Act 4: Roadmap Generation, Dashboard & Impact (2:50 – 3:45)
**Speaker: Aditi Vispute**

- **[Screen: Click 'Generate Roadmap' → roadmap.html]** *(Placeholder: `assets/screenshots/roadmap.png`)*
- *"Rohan chooses the Front-End Developer path and selects an **8-Week Roadmap**.*
- *Our curriculum generator prioritizes his missing skills—Responsive Design, Bootstrap, and Git—in early milestones, complete with curated, free documentation and tutorial links.*
- *When Rohan marks a task as done—watch this: with a single click, our backend updates `completedAt` and recalculates his progress in real time.*
- **[Screen: Navigate to dashboard.html]** *(Placeholder: `assets/screenshots/dashboard.png`)*
- *On the student dashboard, his active goal, next recommended action, upcoming tasks, and holographic Progress Orb are all perfectly synchronized.*
- *CareerPath AI bridges the academia-industry divide, making career guidance accessible, transparent, and actionable for all students. Thank you, and we are now ready for your questions!"*

---

## 🎯 Anticipated Judge Q&A Rebuttals

1. **"Why do you call this AI if you aren't calling an external LLM?"**  
   *Answer:* "We use an expert recommendation system powered by deterministic weighted algorithms. In career guidance, transparency and accuracy are critical; probabilistic LLMs hallucinate requirements, whereas our mathematical model is 100% verifiable, unbiased, and free from API latency or operational costs."

2. **"Why did you use Three.js 3D?"**  
   *Answer:* "Career guidance often feels dry and intimidating. Our 3D modules provide intuitive data storytelling—turning abstract skill gaps into planetary orbits and progress into an energy orb. Plus, our architecture guarantees 100% functional 2D fallbacks if WebGL is unavailable."

3. **"How does the scoring formula prevent bias?"**  
   *Answer:* "Skills carry the dominant 60% weight based on industry requirements. Education carries only 15% to ensure self-taught students aren't penalized, and interests carry 25% to respect student passion."

4. **"What will you build after the hackathon?"**  
   *Answer:* "Automated resume PDF parsing, GitHub repository skill extraction, Gemini-powered context-aware roadmaps, and peer study hubs."

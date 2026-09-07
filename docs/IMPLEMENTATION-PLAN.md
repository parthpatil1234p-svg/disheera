# 48-Hour Implementation Plan — CareerPath AI

> **Status:** Proposed Execution Plan / To be validated during qualifier  
> **Hack2Ignite 2026–27 · Round 1 Qualifier**  
> **Domain:** EduTech / AI for Good  
> **Team:** 404 Brain Not Found (Parth Patil, Suyog Pawar, Asmita Lokhande, Aditi Vispute)

---

## 1. Hackathon Guidelines & Pre-Qualifier Boundaries

- **Permitted Pre-Qualifier Preparation:** Architecture brainstorming, documentation templates, schema design, public library selection, and environment configuration templates.
- **Prohibited Pre-Qualifier Work:** Pre-building application business logic, pre-generating fake commits, hardcoding closed evaluation credentials, or submitting third-party codebases.
- **Commitment:** All application code will be constructed iteratively during the official 48-hour hackathon window.

---

## 2. Team Member Workstreams

| Team Member | Workstream | Primary Responsibilities |
| :--- | :--- | :--- |
| **Parth Patil** | Backend & Database Lead | Server architecture, Express APIs, Mongoose models, recommendation algorithms, Render deployment |
| **Suyog Pawar** | Frontend & Integration Lead | HTML5/CSS/Bootstrap structuring, DOM manipulation, client API integration, Vercel deployment |
| **Asmita Lokhande** | UI/UX & 3D WebGL Lead | Glassmorphism design tokens, Three.js constellations and orbital paths, GSAP tweens, slide deck design |
| **Aditi Vispute** | Data, QA & Documentation Lead | Seed data standardization, manual QA testing matrix, Postman verification, demo script rehearsal |

---

## 3. Five Implementation Phases

```text
Phase 1: Foundation (Hours 00 – 08)
  └── Monorepo setup, Express health check, MongoDB Atlas connection, User Auth, Basic HTML/CSS scaffolding.

Phase 2: Core Engine & Assessment (Hours 08 – 20)
  └── Skill & Career seed data, Student assessment UI, Deterministic recommendation engine (60/25/15), Skill-gap analysis.

Phase 3: Roadmaps & Task Telemetry (Hours 20 – 32)
  └── Roadmap & RoadmapTask schemas, dynamic curriculum generation (4/8/12 wks), task checkbox toggle, dashboard API.

Phase 4: 3D Innovation & Comprehensive QA (Hours 32 – 40)
  └── Three.js Career Universe, Skill Orbit, Roadmap Path, and Progress Orb with 2D fallbacks; full QA matrix execution.

Phase 5: Presentation, Final Polish & Submission (Hours 40 – 48)
  └── PPT deck finalization, 3–4 min demo rehearsal, Vercel/Render production synchronization, submission form verification.
```

---

## 4. Hour-by-Hour Timeline

| Hours | Focus Area | Deliverables & Milestones | Primary Owner |
| :--- | :--- | :--- | :--- |
| **00:00 – 04:00** | Environment & Repo Setup | Git repository setup, `.gitignore`, Express setup, MongoDB Atlas connection | Parth & Suyog |
| **04:00 – 08:00** | Authentication Pipeline | User registration, login, bcrypt password hashing, JWT authorization guards | Parth & Suyog |
| **08:00 – 14:00** | Dataset & Assessment | Curate 35+ skills and 5 careers; build multi-step assessment form | Aditi & Suyog |
| **14:00 – 20:00** | Recommendation Engine | Build recommendation algorithm ($60\% \text{ Skills} + 25\% \text{ Interests} + 15\% \text{ Education}$); skill-gap breakdown | Parth |
| **20:00 – 26:00** | Recommendations UI | Build recommendations page; display top 3 matches with gap badges | Suyog & Asmita |
| **26:00 – 32:00** | Roadmaps & Task Engine | Roadmap generator (4/8/12 weeks), task toggle PATCH endpoint, dashboard API | Parth & Suyog |
| **32:00 – 36:00** | 3D WebGL Visuals | Three.js Career Universe, Skill Orbit, Roadmap Path & Progress Orb with 2D fallbacks | Asmita |
| **36:00 – 40:00** | Quality Assurance Matrix | Execute all 19 manual test cases in `TESTING.md`; Postman collection validation | Aditi |
| **40:00 – 44:00** | Cloud Deployment | Deploy backend to Render, frontend to Vercel; synchronize CORS and environment variables | Parth & Suyog |
| **44:00 – 46:00** | Demo Script & Slide Deck | Finalize 10-slide deck (`PPT-CONTENT.md`) and rehearse 3–4 minute demo flow | All Team |
| **46:00 – 48:00** | Final Code Freeze & Submit | Code freeze, execute `docs/SUBMISSION-CHECKLIST.md`, submit via official portal | Parth |

---

## 5. Critical Path & Code Freeze Rules

1. **Critical Path Dependencies:**
   $$\text{Database Seeds} \longrightarrow \text{Assessment Form} \longrightarrow \text{Recommendation Engine} \longrightarrow \text{Roadmap Generator}$$
2. **Code Freeze Rule:**
   - **T-4 Hours (Hour 44:00):** Absolute code freeze on backend and core algorithms.
   - Only critical visual bug fixes and documentation polish are allowed between Hour 44 and Hour 48.

---

## 6. Communication & Emergency Contingency Protocols

- **Sprint Standups:** 10-minute check-ins every 8 hours.
- **Blocker Resolution:** If a team member is blocked for > 45 minutes, pair programming is initiated immediately.
- **Contingency Plans:**
  - *Cloud Outage during demo:* Immediate failover to local environment (`localhost:5000` and `localhost:5500`).
  - *WebGL Incompatibility:* Automatic fallback to clean 2D HTML/CSS cards.
  - *Internet failure:* Present from offline PPT PDF and pre-recorded MP4 demo video.

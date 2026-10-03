# Technical Requirements Document (TRD)
## CareerPath AI — Hack2Ignite 2026–27

---

## 1. Technical Architecture & System Overview

CareerPath AI uses a decoupled full-stack architecture with a high-performance vanilla JavaScript client communicating with a Node.js/Express REST API backed by MongoDB Atlas and external intelligence APIs.

```
┌─────────────────────────────────┐        HTTPS / REST        ┌───────────────────────────────────┐
│     CLIENT (Vercel Edge)        │ ◄────────────────────────► │     SERVER (Render Cloud)         │
│  • HTML5 · CSS3 · Vanilla JS    │                            │  • Express.js REST API            │
│  • 90% Viewport Container       │                            │  • Mongoose ODM · JWT · bcrypt    │
│  • 2D SVG Percentage Meter      │                            │  • Process Safety Listeners       │
│  • Micro-Quiz Stepper UI        │                            │  • Rate Limiter · Helmet · CORS   │
│  • Three.js 3D Career Universe  │                            └───────────────┬───────────────────┘
└─────────────────────────────────┘                                            │
                                                                               ▼
                                                                ┌───────────────────────────────────┐
                                                                │  MongoDB Atlas (M0 Replica Set)   │
                                                                │  users, careers, roadmaps, skills │
                                                                └───────────────┬───────────────────┘
                                                                                │
                                           ┌────────────────────────────────────┴───────────────────┐
                                           │                                                        │
                                           ▼                                                        ▼
                        ┌─────────────────────────────────────┐                  ┌───────────────────────────────────┐
                        │   AI Engines (Quiz & Mentor)        │                  │   Market & Developer Telemetry    │
                        │   • Groq LPU Llama 3.3 70B (<300ms) │                  │   • GitHub REST API v3 (Auth Sync)│
                        │   • Google Gemini 2.5 Flash Failover│                  │   • Adzuna API (India Tech Jobs)  │
                        │   • 860+ Line Curated Domain Bank   │                  │   • AIDevBoard API (Global AI)    │
                        └─────────────────────────────────────┘                  └───────────────────────────────────┘
```

---

## 2. Frontend Architecture & Design System

| Aspect | Technology | Rationale & Performance |
| :--- | :--- | :--- |
| **Language** | Vanilla JavaScript (ES6+) | Instant execution, zero bundle overhead, FCP < 800ms |
| **Layout System** | CSS Grid & Flexbox (90% Width) | `--container-width: 90%` with balanced 10% margins; eliminates empty space |
| **Typography** | Space Grotesk + Inter | Scaled typography tokens for presentation legibility |
| **Progress Meter** | 2D Circular SVG Gauge | Accessible, high-contrast 0–100% progress tracking; eliminates confusing degree angles |
| **3D Engine** | Three.js r128 | Hardware-accelerated 3D Career Universe on landing page with instant 2D fallback |
| **HTTP Client** | Native Fetch API | Built-in browser support with async/await error boundaries |

### Page Structure & Routes
| Page | File | Purpose |
| :--- | :--- | :--- |
| **Landing** | `client/index.html` | Hero, 3D Career Universe constellation, problem statement |
| **Authentication** | `client/login.html` & `register.html` | 1-Click Google/GitHub OAuth, demo account auto-fill |
| **Assessment** | `client/assessment.html` | Academic background, 76+ skills profiler, GitHub auto-detect |
| **Micro-Quiz** | `client/quiz.html` | 5-Question adaptive reality-check quiz, BYOK modal |
| **Recommendations** | `client/recommendations.html` | Top 3 matches, 60/25/15 score cards, tri-color skill gaps |
| **Roadmap** | `client/roadmap.html` | 4, 8, 12-week milestone checklist, PDF print export |
| **Dashboard** | `client/dashboard.html` | Bento grid, 2D percentage gauge, auth repo sync, verified badges |

---

## 3. Backend Architecture & API Layers

```
server/
Routes (HTTP mappings) ➔ Controllers (Req/Res validation) ➔ Services (Business Logic) ➔ Models (Mongoose) ➔ MongoDB
```

### Key Services:
1. **`aiQuizGeneratorService.js`**: Multi-model dynamic quiz generator routing between Groq Llama 3.3 70B, Google Gemini 2.5 Flash, and curated domain questions.
2. **`githubService.js`**: Analyzes student repositories via GitHub REST API, calculates top languages, and tags skills with `isCodeVerified: true`.
3. **`recommendationService.js`**: Evaluates student profile against all career requirements using the 60/25/15 formula.
4. **`roadmapService.js`**: Assembles personalized weekly curriculum milestones with resource links and progress tracking.
5. **`jobBoardService.js`**: Streams live tech job listings and salary ranges from Adzuna and AIDevBoard.

### Process Safety Handlers:
```javascript
// server/server.js
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
```

---

## 4. Database Collections & Indexes

**Engine:** MongoDB Atlas M0 (Free Tier), Replica Set.

| Collection | Model File | Key Indexed Fields | Purpose |
| :--- | :--- | :--- | :--- |
| **`users`** | `User.js` | `{ email: 1 }` (unique), `{ githubId: 1 }` | Student identity, verified skills, GitHub repos, quiz scores |
| **`careers`** | `Career.js` | `{ title: "text", domain: 1 }` | 15+ curated industry career tracks with required skill matrices |
| **`roadmaps`** | `Roadmap.js` | `{ userId: 1, careerId: 1 }` | Time-boxed weekly curriculums with completion percentages |
| **`roadmaptasks`**| `RoadmapTask.js` | `{ roadmapId: 1, weekNumber: 1 }` | Atomic checklist items with verified completion states |
| **`skills`** | `Skill.js` | `{ name: 1, category: 1 }` | Master competency taxonomy (76+ skills) |

---

## 5. Career Matching Algorithm — Mathematical Specification

### Master Formula:
$$\text{Total Score} = (\text{SkillScore} \times 0.60) + (\text{InterestScore} \times 0.25) + (\text{EducationScore} \times 0.15)$$

### 1. Skill Score ($0 - 100$):
$$\text{SkillScore} = \frac{\sum_{i=1}^{N} \min(1.0, \frac{\text{UserProficiency}_i}{\text{RequiredProficiency}_i}) \times \text{Weight}_i}{\sum_{i=1}^{N} \text{Weight}_i} \times 100$$
*Verified skills (via code audit or quiz) receive a confidence multiplier ensuring objective merit.*

### 2. Interest Score ($0 - 100$):
$$\text{InterestScore} = \frac{|\text{UserInterests} \cap \text{CareerTags}|}{|\text{CareerTags}|} \times 100$$

### 3. Education Score ($0 - 100$):
$$\text{EducationScore} = \text{BaseEducationScore} + \text{AcademicTierModifier}$$

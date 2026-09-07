# CareerPath AI — Discover Your Career. Build Your Skills.

> **Hack2Ignite 2026–27 · Round 1 MVP**  
> Domain: EduTech / AI for Good · Team: **404 Brain Not Found**

An immersive, AI-powered 3D interactive web platform that analyzes students’ skills, interests, academic backgrounds, and career goals to recommend highly suitable career paths, identify exact skill gaps, and generate personalized learning roadmaps.

---

## 👥 The Team (404 Brain Not Found)

| Member | Focus Area | Responsibilities |
| :--- | :--- | :--- |
| **Parth Patil** | Team Leader & Backend | System architecture, Express REST API, MongoDB models, Recommendation Engine algorithm |
| **Suyog Pawar** | Frontend & Integration | HTML5/CSS3/Bootstrap structuring, DOM manipulation, client API integration |
| **Asmita Lokhande** | UI/UX & Web Aesthetics | Glassmorphism design system, interactive states, Three.js 3D constellation concept |
| **Aditi Vispute** | Data & Documentation | Curating career skill matrices, seed data standardization, testing & validation |

---

## 🚀 Completed Milestones

- ✅ **Step 1 — Foundation & Monorepo Architecture**: Clean structure, responsive landing page, design tokens, Express health check.
- ✅ **Step 2 — Authentication & Profile Security**: MongoDB connection, User model, JWT protection middleware, bcrypt hashing, `/api/auth/register`, `/api/auth/login`, `/api/users/me`.
- ✅ **Step 3 — Student Assessment & Recommendation Engine**:
  - `Skill` and `Career` Mongoose models with indexes.
  - Standardized seed dataset: **35+ skills** and **5 industry careers**.
  - CLI database seed: `npm run seed`.
  - Deterministic mathematical recommendation engine: $(60\% \text{ Skills} + 25\% \text{ Interests} + 15\% \text{ Education})$.
  - Skill gap categorization: **Matched** (Green), **Needs Upgrade** (Amber), **Missing** (Red).
  - Deterministic natural language explanations without external AI dependencies.
  - End-to-end frontend: `assessment.html`, `recommendations.html`, `login.html`, `register.html`.

---

## 🧠 Recommendation Engine Algorithm

The recommendation engine is 100% deterministic and runs on the backend:

$$\text{Career Match Score} = (\text{Skill Match} \times 0.60) + (\text{Interest Match} \times 0.25) + (\text{Education Match} \times 0.15)$$

1. **Skill Match (60% Weight):** Evaluates importance weights (High=3, Med=2, Low=1) and proficiency levels (Beg=1, Int=2, Adv=3).
2. **Interest Match (25% Weight):** Calculates overlap between student's chosen domains and career interest tags.
3. **Education Match (15% Weight):** Compares degree/major with career educational preferences (100 for match, 50 neutral fallback).
4. **Skill-Gap Analysis:** Automatically categorizes every required career skill into:
   - 🟢 **Matched:** User meets or exceeds required proficiency level.
   - 🟡 **Needs Upgrade (Weak):** User has the skill, but requires a higher proficiency level.
   - 🔴 **Missing:** Core skill user has not yet learned.

---

## 📦 Standardized Initial Datasets

### 5 Industry Careers
1. **Front-End Developer** (`front-end-developer`): HTML, CSS, JavaScript, Responsive Design, Bootstrap, Git, GitHub
2. **Full-Stack Developer** (`full-stack-developer`): HTML, CSS, JavaScript, Node.js, Express.js, MongoDB, REST APIs, Authentication
3. **Data Analyst** (`data-analyst`): Excel, SQL, Statistics, Power BI, Data Visualization, Data Cleaning, Problem Solving
4. **UI/UX Designer** (`ui-ux-designer`): Figma, Wireframing, Prototyping, User Research, Visual Design, Communication
5. **Cybersecurity Analyst** (`cybersecurity-analyst`): Networking, Linux, Cybersecurity Fundamentals, OWASP Basics, Ethical Hacking, Problem Solving

### 35+ Standardized Skills
Organized across **Frontend, Backend, Database, Data, Design, Security, Cloud, Soft Skills, and Tools**.

---

## 📁 Repository Structure

```
demo/
├── server/                          ← Backend (Node.js + Express.js CommonJS)
│   ├── config/db.js                 ← MongoDB Atlas / Local connection
│   ├── models/
│   │   ├── User.js                  ← User account & profile schema
│   │   ├── Skill.js                 ← Standardized skills schema
│   │   └── Career.js                ← Career requirements schema
│   ├── data/
│   │   ├── skillsData.js            ← 35+ curated skills
│   │   ├── careersData.js           ← 5 target career definitions
│   │   └── seedData.js              ← Seed data aggregation
│   ├── seed.js                      ← CLI seed script (npm run seed)
│   ├── services/
│   │   └── recommendationService.js ← Scoring & skill-gap engine
│   ├── controllers/                 ← Auth, User, Career, Assessment, Recommendation
│   ├── routes/                      ← Express routers
│   ├── middleware/                  ← JWT protect, input validation, error handling
│   ├── server.js                    ← App bootstrap & listening
│   └── README.md                    ← Backend API documentation
├── client/                          ← Frontend (HTML5, Vanilla CSS, JS, Bootstrap 5)
│   ├── index.html                   ← Interactive landing page
│   ├── login.html                   ← User login portal
│   ├── register.html                ← New student registration
│   ├── assessment.html              ← Interactive skill & interest assessment form
│   ├── recommendations.html         ← Top 3 recommendations & skill-gap analysis
│   ├── css/style.css                ← Glassmorphism styling & design system
│   └── js/
│       ├── config.js                ← API base URL & settings
│       ├── api.js                   ← Fetch helper with JWT auth handling
│       ├── auth.js                  ← Auth session & route guards
│       ├── login.js                 ← Login form controller
│       ├── register.js              ← Registration controller
│       ├── assessment.js            ← Assessment form controller
│       ├── recommendations.js       ← Recommendations UI controller
│       └── main.js                  ← Landing page animations & nav logic
└── docs/                            ← PRD, TRD, App Flow, UI/UX, Schemas
```

---

## ⚙️ Local Setup & How to Run

### 1. Backend Server
```powershell
cd server
npm install
npm run seed       # Seeds 35+ skills and 5 careers into MongoDB
npm run dev        # Starts Express on http://localhost:5000
```

### 2. Frontend Client
```powershell
cd client
python -m http.server 5500
# Or right-click client/index.html in VS Code → Open with Live Server
```

Open browser at: **[http://localhost:5500](http://localhost:5500)**

---

## 🧪 Postman / API Verification Sequence

1. `GET http://localhost:5000/api/health` → `200 OK`
2. `npm run seed` → 35 skills & 5 careers populated
3. `GET http://localhost:5000/api/careers` → `200 OK`
4. `POST http://localhost:5000/api/auth/register` (or `/login`) → Returns JWT
5. `PUT http://localhost:5000/api/assessment` with Bearer token → Profile updated (`profileCompleted: true`)
6. `POST http://localhost:5000/api/recommendations/generate` with Bearer token → Top 3 ranked recommendations
7. `GET http://localhost:5000/api/careers/front-end-developer` → `200 OK` with populated skills

# Project: CareerPath AI
> **Discover Your Career. Build Your Skills.**

An immersive, AI-powered 3D interactive web platform that analyzes students’ skills, interests, academic backgrounds, and career goals to recommend highly suitable career paths, identify exact skill gaps, and generate actionable, personalized learning roadmaps.

## 📖 1. Executive Summary
**CareerPath AI** is an EduTech platform conceptualized for the **Hack2Ignite 2026–27** hackathon. It bridges the gap between academic learning and industry expectations by providing students with a clear, data-driven, and visually interactive (3D) roadmap to their ideal careers.

## 🚨 2. The Problem Statement
Millions of students graduate every year without a clear understanding of what industry roles they actually qualify for. Problems include:
*   **Information Overload:** Generic advice doesn't account for a student's unique starting point.
*   **The Skill Gap:** Students lack visibility into *exactly* which technologies they are missing for their desired jobs.
*   **Lack of Structure:** Without a week-by-week plan, self-teaching leads to burnout and tutorial hell.
*   **Low Engagement:** Existing career portals are boring, text-heavy forms that fail to engage modern digital-native students.

## 💡 3. The Solution
CareerPath AI solves this through a 4-step pipeline:
1.  **Assess:** Captures detailed user profiles (academics, current skills, proficiency, interests).
2.  **Analyze (Engine):** Uses a weighted custom algorithm to cross-reference the user's profile with real-world industry requirements.
3.  **Visualize (3D):** Transcends traditional UI by rendering careers, skills, and progress in an interactive 3D universe using WebGL/Three.js.
4.  **Execute (Roadmap):** Generates actionable, time-boxed learning roadmaps (4, 8, or 12 weeks) directly targeting the user's missing skills, complete with curated free resources.

## 🌟 4. Key Features (Detailed)

### 4.1. Core MVP Features
*   **3D Interactive Career Universe:** A WebGL-powered landing page representing careers as connected constellation nodes.
*   **Intelligent Career Matching Engine:** A deterministic backend scoring matrix evaluating skill proficiency, interest alignment, and education level.
*   **Dynamic Skill-Gap Analysis:** Visually compares user strengths against role requirements (Green = Mastered, Amber = Missing).
*   **Personalized Roadmap Generator:** Translates missing skills into a week-by-week curriculum.
*   **Task Management & Progress Tracking:** Interactive dashboards linking directly to modern learning resources (MDN, YouTube, FreeCodeCamp).
*   **Secure Authentication:** JWT-based login mechanism with hashed passwords utilizing bcrypt.

### 4.2. Optional & Future Scope
*   **Gemini AI Chatbot:** Context-aware assistant to answer specific career queries.
*   **Resume/GitHub Parsing:** Automated skill extraction to bypass manual form entry.
*   **Admin Dashboard:** GUI for adding new careers and updating skill definitions.

## 💻 5. Technology Stack

| Domain | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, CSS3, Vanilla JS, Bootstrap 5 | Rapid prototyping without build-step overhead for a 48hr hackathon. |
| **Frontend 3D** | Three.js, WebGL, GSAP | Lightweight 3D rendering and cinematic animations directly in the browser. |
| **Backend API** | Node.js, Express.js | Non-blocking, fast execution, uniform language (JS) across the stack. |
| **Database** | MongoDB Atlas | Flexible schema design, perfect for evolving user profiles and nested roadmaps. |
| **Authentication**| JWT (JSON Web Tokens), bcrypt | Stateless, scalable security. |
| **Deployment** | Vercel (Front), Render (Back) | Reliable, fast CI/CD pipelines with generous free tiers. |

## 🏗️ 6. Comprehensive Project Structure

```text
careerpath-ai/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js     # Login/Register logic
│   │   ├── profileController.js  # User profile CRUD
│   │   ├── careerController.js   # Matching algorithm logic
│   │   └── roadmapController.js  # Generation & task tracking
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification shield
│   │   └── errorMiddleware.js    # Global error handler
│   ├── models/
│   │   ├── User.js               # User + linked skills schema
│   │   ├── Career.js             # Roles and required skills
│   │   └── Roadmap.js            # User-specific generated plans
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── profileRoutes.js      # /api/profile endpoints
│   │   ├── careerRoutes.js       # /api/careers endpoints
│   │   └── roadmapRoutes.js      # /api/roadmaps endpoints
│   ├── .env.example              # Template for environment vars
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express bootstrap & listen
├── frontend/
│   ├── assets/
│   │   ├── models/               # GLTF/GLB files (if any)
│   │   └── textures/             # 3D material textures
│   ├── css/
│   │   ├── main.css              # Global styles, variables, reset
│   │   └── components.css        # Dashboard/Cards glassmorphism
│   ├── js/
│   │   ├── api.js                # Fetch wrappers for API calls
│   │   ├── auth.js               # Frontend login/register handling
│   │   ├── dashboard.js          # DOM manipulation for progress
│   │   └── three-scenes/
│   │       ├── universe.js       # Landing page 3D logic
│   │       ├── skillOrbit.js     # Career gap 3D logic
│   │       └── roadmapPath.js    # 3D progression logic
│   ├── index.html                # Landing page
│   ├── login.html                # Auth page
│   ├── dashboard.html            # Main user portal
│   └── roadmap.html              # Task execution view
├── docs/                         # Extensive Architecture Docs
└── README.md                     # This file
```

## ⚙️ 7. Installation & Setup Guide

### Prerequisites
*   Node.js (v18 or higher)
*   Git
*   MongoDB Atlas Account (Free Tier)
*   VSCode (Recommended with Live Server extension)

### Step 1: Clone & Setup Backend
1. Clone the repository: `git clone <repo-url>`
2. Navigate to backend: `cd backend`
3. Install dependencies: `npm install`
4. Environment Setup: Create a `.env` file in the `backend/` directory:
    ```env
    PORT=5000
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/careerpath?retryWrites=true&w=majority
    JWT_SECRET=your_super_secret_jwt_key_here
    NODE_ENV=development
    ```
5. Start the backend: `npm run dev` (Runs on http://localhost:5000)

### Step 2: Setup Frontend
1. Open a new terminal and navigate to frontend: `cd frontend`
2. Update API Base URL: Ensure `frontend/js/api.js` points to `http://localhost:5000/api` during local development.
3. Serve the frontend: Use VSCode "Live Server" on `index.html`, or run a basic static server:
    ```bash
    npx serve .
    ```

## 👨‍💻 8. The Team (Hack2Ignite)

| Member | Focus Area | Responsibilities |
| :--- | :--- | :--- |
| **Parth Patil** | Lead & Backend | Architecture, Node/Express routing, MongoDB aggregation, Matching Engine algorithm, Render Deployment. |
| **Suyog Pawar** | Frontend & API | HTML/CSS structuring, DOM manipulation, connecting Vercel to GitHub, API fetch integration. |
| **Asmita Lokhande** | UI/UX & 3D Web | Glassmorphism design system, Figma prototyping, Three.js scengraph mapping, animations. |
| **Aditi Vispute** | Data & Documentation| Curating career maps, skill matrices, QA testing, demo prep, presentation structure. |

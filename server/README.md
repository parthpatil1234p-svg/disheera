# CareerPath AI — Backend Server (Step 4)

> Node.js + Express.js REST API · MongoDB Atlas / Local · JWT Authentication · Deterministic Recommendation Engine · Personalized Roadmaps · Student Dashboard

---

## 📁 Folder Structure

```
server/
├── server.js                        ← Express entry point & route mounting
├── package.json                     ← Dependencies & scripts ("start", "dev", "seed")
├── render.yaml                      ← Render Web Service deployment blueprint
├── .env.example                     ← Template for environment variables
├── .env                             ← Local configuration (do not commit)
├── seed.js                          ← Seeds Skill and Career collections
├── config/
│   └── db.js                        ← MongoDB connection logic (Atlas / Local)
├── models/
│   ├── User.js                      ← User schema with subdocuments for skills & education
│   ├── Skill.js                     ← Standardized skills with categories and indexes
│   ├── Career.js                    ← Career catalog with populated skill references
│   ├── Roadmap.js                   ← Personalized learning roadmap (duration, status, progress)
│   └── RoadmapTask.js               ← Actionable tasks with weekNumber, priority, resource links
├── controllers/
│   ├── authController.js            ← Register & login controllers
│   ├── userController.js            ← User profile read & update controllers
│   ├── careerController.js          ← Catalog querying and slug lookup
│   ├── assessmentController.js      ← Profile assessment submission controller
│   ├── recommendationController.js  ← Recommendation generation controller
│   ├── roadmapController.js         ← Roadmap generation, active query, task toggling & archiving
│   └── dashboardController.js       ← Unified student dashboard telemetry
├── routes/
│   ├── authRoutes.js                ← /api/auth (register, login)
│   ├── userRoutes.js                ← /api/users (/me)
│   ├── careerRoutes.js              ← /api/careers (list, :slug)
│   ├── assessmentRoutes.js          ← /api/assessment (PUT, POST)
│   ├── recommendationRoutes.js      ← /api/recommendations (/generate)
│   ├── roadmapRoutes.js             ← /api/roadmaps (generate, current, tasks/:taskId/toggle)
│   └── dashboardRoutes.js           ← /api/dashboard (get unified dashboard)
├── services/
│   ├── recommendationService.js     ← Deterministic mathematical scoring engine
│   └── roadmapService.js            ← Skill-gap prioritized curriculum generator
├── middleware/
│   ├── authMiddleware.js            ← JWT protect & role authorize guards
│   ├── validateRequest.js           ← Request payload validators (roadmap, task, assessment, auth)
│   └── errorMiddleware.js           ← Centralized error handler
├── data/
│   ├── skillsData.js                ← 35+ standardized skills across 8 categories
│   ├── careersData.js               ← 5 target industry career profiles
│   ├── roadmapTemplates.js          ← Curated 4, 8, 12-week curricula for all 5 careers
│   └── seedData.js                  ← Aggregated seed datasets
└── utils/
    └── generateToken.js             ← JWT token signing utility
```

---

## ⚙️ Setup & Installation

### Step 1 — Install Dependencies
```powershell
cd server
npm install
```

### Step 2 — Configure `.env`
Make sure `server/.env` exists with your MongoDB connection string and JWT secret:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/careerpath-ai
JWT_SECRET=careerpathai404brainsecret2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5500
```

*(If using MongoDB Atlas in cloud, paste your `mongodb+srv://...` URI in `MONGODB_URI`)*

### Step 3 — Seed Database (Skills & Careers)
Populate the database with 35+ standardized skills and 5 target industry careers:

```powershell
npm run seed
```

Output:
```text
🌱 Starting CareerPath AI Database Seed...
✅ MongoDB Connected: localhost
📦 Database: careerpath-ai
🧹 Clearing existing Skill and Career collections...
   (User accounts preserved — never modified by seed)
📦 Inserting 35 skills...
✅ Successfully seeded 35 skills!
📦 Resolving skill references and inserting 5 careers...
✅ Successfully seeded 5 careers!
🎉 Database seeding completed successfully!
```

> **Note:** The seed script never deletes user accounts. It only refreshes the `Skill` and `Career` collections.

---

## ▶️ Running the Server

```powershell
# Development mode with nodemon auto-restart
npm run dev

# Production mode
npm start
```

Default address: **http://localhost:5000**

---

## 🎯 Recommendation Engine Formula

The career recommendation engine is **100% deterministic and runs entirely on the backend** without calling any external AI API.

$$\text{Career Match Score} = (\text{Skill Match} \times 0.60) + (\text{Interest Match} \times 0.25) + (\text{Education Match} \times 0.15)$$

### 1. Skill Match (60% Weight, 0–100)
- **Importance Weights:**
  - High = 3 points
  - Medium = 2 points
  - Low = 1 point
- **Proficiency Values:**
  - Beginner = 1
  - Intermediate = 2
  - Advanced = 3
- For each career skill requirement:
  $$\text{Proficiency Ratio} = \min\left(\frac{\text{User Proficiency Value}}{\text{Required Proficiency Value}}, 1.0\right)$$
  $$\text{Earned Points} = \text{Importance Weight} \times \text{Proficiency Ratio}$$
  $$\text{Skill Match Score} = \left(\frac{\sum \text{Earned Points}}{\sum \text{Importance Weights}}\right) \times 100$$

### 2. Interest Match (25% Weight, 0–100)
$$\text{Interest Match Score} = \left(\frac{\text{Number of Matching User Interests in Career Tags}}{\text{Total Career Interest Tags}}\right) \times 100$$
*(Returns neutral 50 if career has no interest tags)*

### 3. Education Match (15% Weight, 0–100)
Compares the student's degree and major against the career's `educationPreferences` (e.g. BCA, B.Tech, B.Sc CS).
- If matched: **100**
- If no match or undeclared: **50** (neutral fallback)

### 4. Skill Gap Classification
- **Matched Skills:** Skills where user proficiency meets or exceeds requirement ($\ge$).
- **Weak Skills:** Skills where user proficiency is below requirement ($<$).
- **Missing Skills:** Core skills required for the career that the user has not acquired.

---

## 🌐 API Reference

### All responses follow this unified shape:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

---

### 1. Health Check
`GET /api/health` — Public
```json
{
  "success": true,
  "message": "CareerPath AI Server is running ✅",
  "version": "3.0.0"
}
```

---

### 2. Careers Catalog
* `GET /api/careers` — Public (supports query params: `?category=development` & `?search=developer`)
* `GET /api/careers/:slug` — Public (returns career with populated skill references)

Example response:
```json
{
  "success": true,
  "data": {
    "career": {
      "title": "Front-End Developer",
      "slug": "front-end-developer",
      "shortDescription": "Build intuitive, responsive, and visually stunning user interfaces...",
      "category": "development",
      "requiredSkills": [
        {
          "skill": {
            "name": "html",
            "displayName": "HTML",
            "category": "frontend"
          },
          "importance": "high",
          "requiredProficiency": "intermediate"
        }
      ]
    }
  }
}
```

---

### 3. Student Assessment
`PUT /api/assessment` — Protected (requires `Authorization: Bearer <token>`)

**Request Payload:**
```json
{
  "name": "Parth Patil",
  "education": {
    "course": "BCA",
    "branch": "Computer Science",
    "year": "Second Year",
    "college": "Pune University"
  },
  "interests": ["web development", "design"],
  "skills": [
    { "name": "html", "displayName": "HTML", "proficiency": "intermediate" },
    { "name": "css", "displayName": "CSS", "proficiency": "intermediate" },
    { "name": "javascript", "displayName": "JavaScript", "proficiency": "beginner" }
  ],
  "careerGoals": ["Become a front-end engineer at a top startup"]
}
```

---

### 4. Career Recommendations
`POST /api/recommendations/generate` — Protected (requires `Authorization: Bearer <token>`)

**Response:**
```json
{
  "success": true,
  "message": "Career recommendations generated successfully",
  "data": {
    "generatedAt": "2026-09-07T07:45:00.000Z",
    "profileSummary": {
      "education": { "course": "BCA", "branch": "Computer Science" },
      "interests": ["web development", "design"],
      "skills": [
        { "name": "html", "displayName": "HTML", "proficiency": "intermediate" }
      ]
    },
    "recommendations": [
      {
        "rank": 1,
        "career": {
          "id": "67cc5...",
          "title": "Front-End Developer",
          "slug": "front-end-developer",
          "shortDescription": "Build intuitive, responsive, and visually stunning user interfaces...",
          "category": "development"
        },
        "finalScore": 81,
        "scoreBreakdown": {
          "skillMatch": 68,
          "interestMatch": 100,
          "educationMatch": 100
        },
        "whyRecommended": "Strong match for your profile with a high 81% alignment. You already have strong competence in HTML, CSS. To become fully job-ready as a Front-End Developer, focus next on mastering JavaScript.",
        "matchedSkills": [...],
        "weakSkills": [...],
        "missingSkills": [...]
      }
    ]
  }
}
```

---

## 🗺️ Step 4 Roadmap & Dashboard Endpoints

### 1. Generate Learning Roadmap
- **Method:** `POST`
- **URL:** `/api/roadmaps/generate`
- **Auth:** `Bearer <token>`
- **Request Body:**
```json
{
  "careerSlug": "front-end-developer",
  "durationWeeks": 8
}
```
- **Validation Rules:**
  - `careerSlug`: non-empty string matching one of the user's top 3 recommendations
  - `durationWeeks`: integer matching `4`, `8`, or `12`
  - User must have completed assessment profile
  - Existing active roadmap is automatically archived
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Personalized roadmap generated successfully",
  "data": {
    "roadmap": {
      "id": "67cc5...",
      "career": { "title": "Front-End Developer", "slug": "front-end-developer" },
      "durationWeeks": 8,
      "status": "active",
      "totalTasks": 15,
      "completedTasks": 0,
      "progressPercentage": 0
    },
    "weeks": [ ... ]
  }
}
```

### 2. Get Current Active Roadmap
- **Method:** `GET`
- **URL:** `/api/roadmaps/current`
- **Auth:** `Bearer <token>`
- **Response `200 OK`:**
Returns active roadmap metadata, flat `tasks` array, and grouped `weeks` array with curated external resources.

### 3. Toggle Task Progress
- **Method:** `PATCH`
- **URL:** `/api/roadmaps/tasks/:taskId/toggle`
- **Auth:** `Bearer <token>`
- **Response `200 OK`:**
Toggles completed status, sets `completedAt`, and recalculates roadmap completion percentage.

### 4. Student Unified Dashboard
- **Method:** `GET`
- **URL:** `/api/dashboard`
- **Auth:** `Bearer <token>`
- **Response `200 OK`:**
Returns user profile, active roadmap progress, first 5 upcoming incomplete tasks, and dynamic `nextAction` prompt.

---

## 🧪 Postman & Integration Testing Sequence

> 📬 **Official Postman Collection:** Import `postman/CareerPath-AI.postman_collection.json` directly into Postman. It includes pre-configured collection variables (`baseUrl`, `token`, `taskId`) and automated token capture scripts.

Follow this order to verify all endpoints:

1. **Health Check & API Version**  
   - `GET http://localhost:5000/api/health` → Expect `200 OK` (`{ "status": "UP" }`)
   - `GET http://localhost:5000/api/version` → Expect `200 OK` (`{ "data": { "version": "1.0.0" } }`)

2. **Seed Verification**  
   In terminal: `npm run seed`

3. **Get All Careers**  
   `GET http://localhost:5000/api/careers` → Expect `200 OK` (5 careers returned)

4. **Register or Login**  
   `POST http://localhost:5000/api/auth/register` (or `/login`)  
   Save returned `token`.

5. **Submit Assessment**  
   `PUT /api/assessment` (or `POST /api/assessment`)  
   Header: `Authorization: Bearer <token>`

6. **Generate Recommendations**  
   `POST http://localhost:5000/api/recommendations/generate`  
   Header: `Authorization: Bearer <token>`

7. **Generate Roadmap**  
   `POST http://localhost:5000/api/roadmaps/generate`  
   Header: `Authorization: Bearer <token>`  
   Body: `{ "careerSlug": "front-end-developer", "durationWeeks": 8 }`

8. **Fetch Active Roadmap**  
   `GET http://localhost:5000/api/roadmaps/current`  
   Header: `Authorization: Bearer <token>`

9. **Toggle Task Progress**  
   `PATCH http://localhost:5000/api/roadmaps/tasks/<TASK_ID>/toggle`  
   Header: `Authorization: Bearer <token>`

10. **Fetch Dashboard**  
    `GET http://localhost:5000/api/dashboard`  
    Header: `Authorization: Bearer <token>`

---

## 🛠️ Troubleshooting

### Issue 1: "No active career profiles available in the system"
**Cause:** Database has not been seeded yet.  
**Fix:** Run `npm run seed` inside the `server/` directory.

### Issue 2: "Please complete your profile with education, at least one interest, and at least one skill"
**Cause:** The logged-in user hasn't filled in their degree, at least one interest, or at least one skill.  
**Fix:** Submit `PUT /api/assessment` with valid data before calling `/api/recommendations/generate`.

### Issue 3: "Cannot connect to MongoDB"
**Cause:** Local MongoDB service is not running or Atlas URI credentials in `.env` are invalid.  
**Fix:** On Windows PowerShell: `Start-Service MongoDB` or verify your `MONGODB_URI` in `.env`.

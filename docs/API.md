# REST API Specification — CareerPath AI

> **Status:** Planned API Guide / To be validated during qualifier  
> **Hack2Ignite 2026–27 · Round 1 MVP**  
> **Team:** 404 Brain Not Found

*Note: Final endpoint names, parameters, or schemas may receive minor adjustments during active qualifier implementation.*

---

## 🌐 Base URL & Environments

| Environment | Base URL Placeholder | Description |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:5000/api` | Local Node.js / Express development server |
| **Production Cloud** | `https://YOUR-RENDER-SERVICE.onrender.com/api` | Deployed Render Web Service |

---

## 🔒 Authentication Header

All protected endpoints require a valid JWT token in the `Authorization` request header:
```text
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## 📋 API Endpoints Summary

| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Server uptime and health status |
| `GET` | `/version` | Public | API version and runtime environment |
| `POST` | `/auth/register` | Public | Register a new student account |
| `POST` | `/auth/login` | Public | Authenticate student and issue JWT |
| `GET` | `/users/me` | Protected | Retrieve authenticated student profile |
| `PUT` | `/assessment` | Protected | Submit or update student assessment |
| `GET` | `/careers` | Public | List all 5 industry career paths |
| `GET` | `/careers/:slug` | Public | Retrieve single career profile with required skills |
| `POST` | `/recommendations/generate` | Protected | Generate top 3 recommendations and skill gaps |
| `POST` | `/roadmaps/generate` | Protected | Create personalized 4/8/12-week roadmap |
| `GET` | `/roadmaps/current` | Protected | Retrieve active roadmap and tasks |
| `PATCH`| `/roadmaps/tasks/:taskId/toggle`| Protected | Toggle milestone task completion |
| `DELETE`| `/roadmaps/current` | Protected | Archive current active roadmap |
| `GET` | `/dashboard` | Protected | Unified telemetry and upcoming tasks |

---

## 📨 Request & Response Examples

### 1. Register Student
`POST /api/auth/register`
```json
// Request Body:
{
  "name": "Rohan Sharma",
  "email": "rohan@example.com",
  "password": "SecurePassword123!"
}

// Response (201 Created):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65e8a1f2b3c4d5e6f7a8b9c0",
      "name": "Rohan Sharma",
      "email": "rohan@example.com",
      "profileCompleted": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login Student
`POST /api/auth/login`
```json
// Request Body:
{
  "email": "rohan@example.com",
  "password": "SecurePassword123!"
}

// Response (200 OK):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65e8a1f2b3c4d5e6f7a8b9c0",
      "name": "Rohan Sharma",
      "email": "rohan@example.com",
      "profileCompleted": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User Profile
`GET /api/users/me`  
*Header: `Authorization: Bearer <token>`*
```json
// Response (200 OK):
{
  "success": true,
  "data": {
    "id": "65e8a1f2b3c4d5e6f7a8b9c0",
    "name": "Rohan Sharma",
    "email": "rohan@example.com",
    "education": {
      "degree": "Bachelor of Computer Applications (BCA)",
      "fieldOfStudy": "Computer Science",
      "graduationYear": 2026
    },
    "interests": ["Web Development", "UI/UX Design"],
    "skills": [
      { "name": "HTML", "proficiency": "intermediate" },
      { "name": "CSS", "proficiency": "intermediate" },
      { "name": "JavaScript", "proficiency": "beginner" }
    ],
    "profileCompleted": true
  }
}
```

---

### 4. Submit Student Assessment
`PUT /api/assessment`  
*Header: `Authorization: Bearer <token>`*
```json
// Request Body:
{
  "education": {
    "degree": "Bachelor of Computer Applications (BCA)",
    "fieldOfStudy": "Computer Science",
    "graduationYear": 2026
  },
  "interests": ["Web Development", "UI/UX Design"],
  "skills": [
    { "name": "HTML", "proficiency": "intermediate" },
    { "name": "CSS", "proficiency": "intermediate" },
    { "name": "JavaScript", "proficiency": "beginner" }
  ],
  "careerGoals": "Become an industry-ready front-end developer"
}

// Response (200 OK):
{
  "success": true,
  "message": "Assessment profile updated successfully",
  "data": {
    "profileCompleted": true
  }
}
```

---

### 5. Generate Career Recommendations
`POST /api/recommendations/generate`  
*Header: `Authorization: Bearer <token>`*
```json
// Response (200 OK):
{
  "success": true,
  "message": "Career recommendations generated successfully",
  "data": {
    "recommendations": [
      {
        "rank": 1,
        "career": {
          "title": "Front-End Developer",
          "slug": "front-end-developer",
          "description": "Build responsive, high-performance web applications using modern web standards."
        },
        "matchScore": 81,
        "scoreBreakdown": {
          "skillMatch": 75,
          "interestMatch": 90,
          "educationMatch": 85
        },
        "skillGap": {
          "matchedSkills": ["HTML", "CSS"],
          "weakSkills": ["JavaScript"],
          "missingSkills": ["Responsive Design", "Bootstrap", "Git", "GitHub"]
        },
        "explanation": "Strong foundation in core web layout technologies with high alignment to your Web Development interest."
      }
    ]
  }
}
```

---

### 6. Generate Personalized Roadmap
`POST /api/roadmaps/generate`  
*Header: `Authorization: Bearer <token>`*
```json
// Request Body:
{
  "careerSlug": "front-end-developer",
  "durationWeeks": 8
}

// Response (201 Created):
{
  "success": true,
  "message": "Personalized 8-week roadmap generated successfully",
  "data": {
    "roadmap": {
      "id": "65e8b2c3d4e5f6a7b8c9d0e1",
      "careerTitle": "Front-End Developer",
      "durationWeeks": 8,
      "status": "active",
      "progressPercentage": 0,
      "totalTasks": 16,
      "completedTasks": 0
    }
  }
}
```

---

### 7. Toggle Milestone Task Progress
`PATCH /api/roadmaps/tasks/:taskId/toggle`  
*Header: `Authorization: Bearer <token>`*
```json
// Response (200 OK):
{
  "success": true,
  "message": "Task progress updated",
  "data": {
    "taskId": "65e8c3d4e5f6a7b8c9d0e1f2",
    "completed": true,
    "completedAt": "2026-09-07T14:00:00.000Z",
    "progressPercentage": 6
  }
}
```

---

### 8. Student Dashboard Telemetry
`GET /api/dashboard`  
*Header: `Authorization: Bearer <token>`*
```json
// Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "name": "Rohan Sharma",
      "email": "rohan@example.com"
    },
    "activeRoadmap": {
      "careerTitle": "Front-End Developer",
      "durationWeeks": 8,
      "progressPercentage": 6,
      "totalTasks": 16,
      "completedTasks": 1
    },
    "upcomingTasks": [
      {
        "id": "65e8c3d4e5f6a7b8c9d0e1f3",
        "weekNumber": 1,
        "title": "Master CSS Flexbox & Responsive Layouts",
        "skillTag": "Responsive Design",
        "priority": "high",
        "completed": false
      }
    ],
    "nextAction": "Complete Week 1 tasks to strengthen your Responsive Design skills!"
  }
}
```

---

## 🚦 Standard HTTP Status Codes

| Code | Status | Meaning in CareerPath AI |
| :--- | :--- | :--- |
| `200` | OK | Successful GET, PUT, or PATCH operation |
| `201` | Created | Resource successfully created (registration, roadmap generation) |
| `400` | Bad Request | Missing required fields, invalid proficiency, or unrecommended career |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Attempted access or modification of another student's task |
| `404` | Not Found | Requested career, user, roadmap, or task does not exist |
| `409` | Conflict | Account with the submitted email address already exists |
| `500` | Internal Server Error | Unhandled server exception (handled cleanly by `errorMiddleware`) |

---

## ⚠️ Standard Error Response Format

```json
{
  "success": false,
  "message": "Detailed human-readable error explanation",
  "errors": []
}
```

# Application User Flow Diagrams — CareerPath AI

> **Status:** Proposed Application Flow / To be validated during qualifier  
> **Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> *Discover Your Career. Build Your Skills.*

This document visually illustrates the four primary user flows within CareerPath AI using Mermaid diagrams.

---

## 1. Authentication & Session Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant Browser as Browser Client
    participant API as Express Auth API (/api/auth)
    participant DB as MongoDB Atlas (Users)

    Student->>Browser: Opens login.html or register.html
    Student->>Browser: Enters Credentials (Email & Password)
    Browser->>API: POST /api/auth/login (or /register)
    API->>DB: Query User by Email
    alt User Not Found or Password Invalid
        API-->>Browser: 401 Unauthorized / 409 Conflict
        Browser-->>Student: Displays Error Banner
    else Credentials Validated
        API->>API: Generate Signed JWT Token (7d expiry)
        API-->>Browser: 200 OK with { user, token }
        Browser->>Browser: Save token & user in localStorage
        Browser-->>Student: Redirect to assessment.html or dashboard.html
    end
```

---

## 2. Onboarding & Student Assessment Flow

```mermaid
flowchart TD
    Start(["Student Logs In"]) --> CheckProfile{"Profile Completed?"}
    
    CheckProfile -- "No" --> AssessmentPage["Navigate to assessment.html"]
    CheckProfile -- "Yes" --> DashboardPage["Navigate to dashboard.html"]

    subgraph AssessmentForm ["Interactive Assessment Form"]
        Step1["1. Select Education Level & Degree"]
        Step2["2. Select 1 to 5 Areas of Interest"]
        Step3["3. Choose Current Skills & Proficiencies\n(Beginner / Intermediate / Advanced)"]
        Step4["4. Enter Optional Career Aspirations"]
        Step1 --> Step2 --> Step3 --> Step4
    end

    AssessmentPage --> AssessmentForm
    Step4 --> SubmitAssessment["Click 'Submit Assessment'"]
    SubmitAssessment --> APIPut["PUT /api/assessment\n(Bearer JWT Attached)"]
    APIPut --> ValidateInput{"Valid Education,\nInterests & Skills?"}
    
    ValidateInput -- "No (Validation Error)" --> ShowErrors["Show field-level errors on form"]
    ValidateInput -- "Yes" --> SaveDB[("Update User Document\nSet profileCompleted = true")]
    SaveDB --> RedirectRecs["Redirect to recommendations.html"]
```

---

## 3. Career Recommendation & Skill-Gap Analysis Flow

```mermaid
flowchart TD
    RecEntry(["Student Enters recommendations.html"]) --> FetchRecs["POST /api/recommendations/generate\n(Authorization: Bearer JWT)"]
    
    subgraph ScoringEngine ["Deterministic Scoring Engine (recommendationService.js)"]
        LoadCareers["Fetch 5 Industry Career Profiles & Skills"]
        ScoreSkills["1. Calculate Skill Match (60% Weight)\nWeighted by importance & proficiency"]
        ScoreInterests["2. Calculate Interest Match (25% Weight)\nJaccard index of domain tags"]
        ScoreEducation["3. Calculate Education Match (15% Weight)\nDegree alignment evaluation"]
        TotalScore["Compute Overall Score:\n(Skill * 0.60) + (Interest * 0.25) + (Education * 0.15)"]
        PartitionSkills["Classify Required Career Skills:\n- Matched (Proficiency >= Required)\n- Needs Upgrade (Proficiency < Required)\n- Missing (Absent from User Profile)"]
        SortRank["Rank Careers by Match Score\nSelect Top 3 Paths"]
        
        LoadCareers --> ScoreSkills --> ScoreInterests --> ScoreEducation --> TotalScore --> PartitionSkills --> SortRank
    end

    FetchRecs --> ScoringEngine
    SortRank --> RenderCards["Render Top 3 Career Cards with Match %"]
    SortRank --> RenderOrbits["Initialize Three.js 3D Skill Orbit\n(Planetary Matched, Weak & Missing spheres)"]
    RenderCards --> ChooseCareer["Student selects top career & clicks 'Generate Roadmap'"]
    ChooseCareer --> RoadmapModal["Select Duration: 4, 8, or 12 Weeks"]
```

---

## 4. Personalized Roadmap & Progress Tracking Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant Browser as Browser Client
    participant RoadmapAPI as Roadmap API (/api/roadmaps)
    participant DashAPI as Dashboard API (/api/dashboard)
    participant DB as MongoDB Atlas

    Student->>Browser: Selects Career & Duration (e.g., 8 Weeks)
    Browser->>RoadmapAPI: POST /api/roadmaps/generate { careerSlug, durationWeeks }
    RoadmapAPI->>DB: Archive existing active roadmaps
    RoadmapAPI->>DB: Create new Roadmap & RoadmapTask documents (prioritize missing skills)
    RoadmapAPI-->>Browser: 201 Created with generated milestones & resources
    Browser-->>Student: Displays weekly milestone curriculum + Three.js Roadmap Path 3D

    Note over Student,Browser: Student studies and finishes a milestone
    Student->>Browser: Clicks checkbox to complete Task #1
    Browser->>RoadmapAPI: PATCH /api/roadmaps/tasks/:taskId/toggle
    RoadmapAPI->>DB: Toggle task status & update completedAt
    RoadmapAPI->>DB: Recalculate Roadmap progress percentage
    RoadmapAPI-->>Browser: 200 OK with updated progress %
    Browser-->>Student: Live checkmark animation & progress bar update

    Student->>Browser: Navigates to dashboard.html
    Browser->>DashAPI: GET /api/dashboard
    DashAPI->>DB: Query active roadmap, incomplete tasks & user profile
    DashAPI-->>Browser: 200 OK with dashboard telemetry
    Browser-->>Student: Displays active goal, upcoming tasks, next action & 3D Progress Orb
```

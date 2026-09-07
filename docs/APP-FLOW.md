# Application Flow (Detailed)

This document visualizes the exact state transitions for the user. It is critical for the Frontend and Backend teams to understand these flows to ensure API continuity.

---

## 1. Authentication & Session Flow

**Scenario:** A returning user logs in, or a new user registers.
**Edge Cases Handled:** Invalid credentials, duplicate email registration, expired tokens.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API (Express)
    participant Auth Middleware
    participant Database (Mongo)

    User->>Browser: Enter Email & Password
    Browser->>API (Express): POST /api/auth/login {email, pass}
    API (Express)->>Database (Mongo): Find user by Email
    alt User Not Found
        Database (Mongo)-->>API (Express): null
        API (Express)-->>Browser: 404 User Not Found
    else User Found
        API (Express)->>API (Express): bcrypt.compare(pass, hash)
        alt Password Mismatch
            API (Express)-->>Browser: 401 Unauthorized
        else Password Valid
            API (Express)->>API (Express): jwt.sign({id}, secret, {expiresIn: '24h'})
            API (Express)-->>Browser: 200 OK + {token, user_id}
            Browser->>Browser: localStorage.setItem('token')
            Browser-->>User: Redirect to /dashboard.html
        end
    end
```

---

## 2. Onboarding & Intelligent Matching Flow

**Scenario:** A freshly registered user fills out their profile. The system calculates their path immediately.

```mermaid
flowchart TD
    Start[User Hits Onboarding Page] --> Form1[Fill Academic Details]
    Form1 --> Form2[Select Existing Skills & Proficiency]
    Form2 --> Form3[Select Domain Interests]
    Form3 --> Submit[Click 'Analyze My Profile']
    
    Submit --> API[POST /api/profile/evaluate]
    
    API --> Engine[Career Matching Engine Runs]
    Engine --> FetchC[Fetch All Careers & Requirements from DB]
    FetchC --> Compute[Compute Formulas for each Career]
    Compute --> Sort[Sort by Highest Match Score]
    Sort --> Slice[Extract Top 3 Matches]
    
    Slice --> Return[Return JSON Array to Frontend]
    Return --> 3D[Three.js Renders Top 3 Careers as 3D Orbits]
    3D --> End[User explores recommendations]
```

---

## 3. Skill-Gap and Roadmap Generation Flow

**Scenario:** The user selects one of the recommended careers and commits to a roadmap.

```mermaid
sequenceDiagram
    actor User
    participant UI (Dashboard)
    participant Scene (Three.js)
    participant Backend

    User->>UI (Dashboard): Clicks Career Card (e.g. "Data Analyst")
    UI (Dashboard)->>Scene (Three.js): Transition Camera to Data Analyst Node
    UI (Dashboard)->>Backend: GET /api/careers/gap/:careerId
    Backend-->>UI (Dashboard): Returns {strengths: [], missing: []}
    UI (Dashboard)->>Scene (Three.js): Render Green Orbits (Owned) & Amber Orbits (Missing)
    
    User->>UI (Dashboard): Selects "8 Weeks" & Clicks "Build Roadmap"
    UI (Dashboard)->>Backend: POST /api/roadmaps/generate {careerId, duration: 8}
    Backend->>Backend: Allocate 'missing' skills across 8 weeks
    Backend->>Database: Save Roadmap & RoadmapTasks
    Backend-->>UI (Dashboard): Returns 201 Created {roadmapId}
    
    UI (Dashboard)-->>User: Redirects to /roadmap.html with 3D Path UI
```

---

## 4. Weekly Progress Update Flow

**Scenario:** The user marks a specific study resource / tutorial as completed.

```mermaid
flowchart LR
    A[User clicks Checkbox on Task] --> B[Frontend disables checkbox visually]
    B --> C[PUT /api/roadmaps/tasks/:id {isCompleted: true}]
    
    C --> D{API Validator}
    D -- Success --> E[Update Task in DB]
    D -- Fail --> F[Return 400/500 Error]
    F --> G[Frontend reverts checkbox]
    
    E --> H[Backend recalculates overall Roadmap %]
    H --> I[Update Roadmap doc in DB]
    I --> J[Return New % to Frontend]
    
    J --> K[Update DOM Progress Bar]
    K --> L[Update 3D Roadmap Avatar position]
```

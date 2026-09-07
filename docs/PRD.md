# Product Requirements Document (PRD)

## 1. Product Vision
To democratize high-quality, data-driven career guidance by transforming the intimidating process of skill acquisition into an engaging, visual, and highly structured journey.

## 2. User Personas

### Persona 1: "The Confused Fresher" (Rohan)
*   **Profile:** 3rd Year B.Tech IT student. Knows a bit of C++, basic HTML, but no specialized skills.
*   **Pain Point:** Hears about Data Science, MERN stack, and Cloud, but doesn't know which fits him or where to start.
*   **Goal:** Needs the system to tell him what he's actually capable of based on his current traits and give him a strict 12-week plan to land an internship.

### Persona 2: "The Skill Switcher" (Priya)
*   **Profile:** BCA Graduate currently doing data entry. Wants to become a UI/UX Designer.
*   **Pain Point:** She knows what she wants to do, but doesn't know what skills she's missing to get an entry-level job.
*   **Goal:** Needs a skill-gap analysis to identify exact tools (Figma, Adobe XD) and a 4-week fast-track roadmap to build a portfolio.

## 3. Detailed Functional Requirements (MVP)

### Authentication & Authorization (FR-1)
*   **FR-1.1:** System must allow users to register using Email, Full Name, and Password.
*   **FR-1.2:** System must enforce password complexity (min 8 chars).
*   **FR-1.3:** System must authenticate via JWT for all backend data requests.
*   **FR-1.4:** System must maintain session state on the frontend until manual logout or token expiry (24h).

### Data Ingestion / Profile Setup (FR-2)
*   **FR-2.1:** System must capture academic details (Degree, Branch, Year).
*   **FR-2.2:** System must capture user's existing skills from a predefined database list.
*   **FR-2.3:** User must rate their skill proficiency (1=Beginner, 2=Intermediate, 3=Advanced).
*   **FR-2.4:** System must capture 3-5 core career interests via a UI selection grid.

### Career Recommendation Engine (FR-3)
*   **FR-3.1:** System must process user input against the Career models in the DB.
*   **FR-3.2:** System must calculate a "Career Match Score" (out of 100%) for every available career.
*   **FR-3.3:** System must return the top 3 highest-scoring careers to the user dashboard.

### Skill-Gap Analysis (FR-4)
*   **FR-4.1:** For a selected career, system must compare required skills against user's skills.
*   **FR-4.2:** System must output a "Strengths" array (skills matched or exceeded).
*   **FR-4.3:** System must output a "Missing Skills" array (skills absent, or proficiency too low).

### Roadmap Generation & Tracking (FR-5)
*   **FR-5.1:** User must be able to select a duration (4, 8, 12 weeks).
*   **FR-5.2:** System must distribute "Missing Skills" across the selected weeks as actionable Tasks.
*   **FR-5.3:** System must provide minimum 1 free resource link per task.
*   **FR-5.4:** User must be able to mark tasks as `isCompleted: true`.
*   **FR-5.5:** System must recalculate overall progress percentage on every task update.

### 3D Visualization / UI (FR-6)
*   **FR-6.1:** Web application must feature a WebGL canvas background rendering interactive elements.
*   **FR-6.2:** Careers must be represented as 3D interactive nodes that accept click events.
*   **FR-6.3:** Progress must be visually represented linearly in a 3D space.

## 4. Non-Functional Requirements (NFR)

*   **NFR-1 (Performance):** The backend Recommendation Engine must process the match score and return Top 3 careers in under 800ms.
*   **NFR-2 (Performance):** Three.js scenes must maintain 60 FPS on standard desktop hardware and fallback or reduce geometry on mobile devices to prevent thermal throttling.
*   **NFR-3 (Security):** Passwords must never be stored in plain text. JWT tokens must not store sensitive PII in the payload. Backend must validate all incoming POST/PUT bodies.
*   **NFR-4 (Usability):** The web app must be fully responsive. 3D elements on mobile must support touch/swipe inputs (OrbitControls touch handling).
*   **NFR-5 (Availability):** MongoDB connections must include retry logic to handle serverless cold starts.

## 5. Success Metrics for Hack2Ignite
1.  **Fully Functional MVP Showcase:** Zero fatal crashes during the live presentation.
2.  **Engine Accuracy:** The recommendation engine logically outputs expected careers based on obvious input sets (e.g., Inputting JS/HTML/CSS should output Web Dev).
3.  **Wow Factor:** Smooth 3D animations that clearly differentiate this project from standard CRUD forms.
4.  **Completion:** The flow from Registration -> Top 3 -> Roadmap generation works seamlessly end-to-end.

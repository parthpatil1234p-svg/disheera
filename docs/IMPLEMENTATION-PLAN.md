# Exact Implementation Plan (48-Hour Qualifier Execution)

This is the exact, hour-by-hour operational blueprint for the 4-person team. Success relies on parallel execution. No one waits for someone else.

## PRE-HACKATHON (Before the Clock Starts)
*   **Parth:** Ensure GitHub Repo is created, branches mapped, and Vercel/Render accounts are active.
*   **Asmita:** Have the basic Figma style-guide (Colors, Fonts, Glassmorphism CSS variables) ready.
*   **Aditi:** Compile a spreadsheet containing 5 Careers and ~30 mapped skills (High/Med/Low importance) to seed the database immediately.

---

## 🟢 PHASE 1: The Foundation (Hours 0-6)
**Goal:** Empty repo goes to a working full-stack scaffold and DB connection.
*   **Parth (Backend):**
    *   `npm init`, install express, mongoose, cors, dotenv, bcrypt, jsonwebtoken.
    *   Create standard folder structure. Connect to MongoDB Atlas.
    *   Write the Base User and Career schemas. 
*   **Suyog (Frontend):**
    *   Create `index.html`, import CSS variables, import Bootstrap via CDN.
    *   Build standard Login/Registration HTML forms.
    *   Write the basic `api.js` fetch wrappers holding the base URL and Token injection.
*   **Asmita (UI/3D):**
    *   Establish the Three.js boilerplate (`scene`, `camera`, `renderer`, `requestAnimationFrame`).
    *   Get a black canvas rendering on the screen with basic ambient light.
*   **Aditi (Data):**
    *   Convert spreadsheet data into raw JSON arrays so Parth can seed the database immediately instead of using GUI tools.

---

## 🟡 PHASE 2: The Core Logic (Hours 6-18)
*(Includes sleeping/eating buffer)*
**Goal:** Authentication works, and the Recommendation algorithm proves it works via Postman.
*   **Parth (Backend):**
    *   Finalize `/api/auth/login` and `/api/auth/register`.
    *   **CRITICAL PATH:** Write the math logic for `/api/careers/recommendations`. Test edge cases (User with 0 skills, User with all skills) using Postman.
*   **Suyog (Frontend):**
    *   Connect HTML forms to auth APIs. Store JWT in local storage.
    *   Build the multi-part "Profile Builder" form (Course -> Skills -> Interests). Send via PUT request to backend.
*   **Asmita (UI/3D):**
    *   Build the visual "Top 3 Cards" utilizing glassmorphism CSS.
    *   In Three.js, create logic to spawn 3 glowing spheres (Careers) that respond to mouse hover (Raycasting).

---

## 🟠 PHASE 3: Integration & Roadmaps (Hours 18-32)
**Goal:** Frontend talks to Backend perfectly. Gaps become Roadmaps.
*   **Parth (Backend):**
    *   Write the Roadmap generator. Take "Missing Skills", map them to Task Objects, assign a week number, and save to DB.
    *   Write the Task Completion toggle and Percentage recalculator API.
*   **Suyog (Frontend):**
    *   Render the Top 3 payload from backend into Asmita's HTML cards.
    *   Build the Roadmap UI (Sidebar of checkboxes grouped by Week). Click checkbox -> Call Backend PUT -> Update HTML Progress Bar.
*   **Asmita (UI/3D):**
    *   Build the Career Drilldown Scene: One large center sphere (Career), orbiting smaller spheres (Green = Owned Skill, Amber = Missing Skill).

---

## 🔴 PHASE 4: Polishing, Fallbacks, & QA (Hours 32-42)
**Goal:** Make it bulletproof for the judges.
*   **Parth & Suyog (Code review):**
    *   Add Loading Spinners to API calls. 
    *   Add graceful error alerts (e.g., "Invalid Password", "Server Error").
    *   Ensure JWT expiry kicks user back to `/login.html` cleanly.
*   **Asmita (Design):**
    *   Check mobile responsiveness. Hide complex Three.js elements on screens `< 768px` if performance stutters, falling back to CSS backgrounds.
*   **Aditi (QA):**
    *   Run multiple test-users through the flow. Intentionally try to break things (skip form fields, try to generate roadmaps with no careers selected).

---

## 🏆 PHASE 5: Presentation & Delivery (Hours 42-48)
**Goal:** Package the code into a winning pitch.
*   **Full Team:** Zero new code commits. Code Freeze.
*   **Parth:** Ensure live production databases on Render/Atlas are seeded with Aditi's data, not dummy Dev data.
*   **Suyog:** Record a 2-minute raw screen-capture video clicking through the app perfectly (Backup Demo Video).
*   **Aditi & Asmita:** Finalize the PowerPoint/Canva presentation linking the Problem Statement to the Live Vercel URL.

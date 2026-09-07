# Technical Requirements Document (TRD)

## 1. System Architecture Overview
The system relies on a decoupled Client/Server architecture. 
*   **Stateless Backend:** The Node.js server maintains no session state. All requests are authenticated via the JWT passed in the `Authorization: Bearer <token>` header.
*   **Client-Side Rendering (CSR):** Since we are using Vanilla JS (to save build time), DOM manipulation and 3D rendering will be handled directly in the browser via JavaScript DOM APIs and Three.js WebGL bindings.

## 2. In-Depth Backend Algorithm: Career Match Engine

The system calculates a `MatchScore` out of 100 for a User ($U$) against a Career ($C$).

### Variables:
*   $S_req$: Skills required for career $C$.
*   $S_user$: Skills possessed by user $U$.
*   $I_req$: Interest tags for career $C$.
*   $I_user$: Interest tags selected by user $U$.

### 2.1 Skill Score Calculation (Weight: 60%)
For every skill $s$ in $S_req$:
*   `MaxPoints = s.importance (1 to 3) * s.minProficiency (1 to 3)`
*   `UserPoints` = 0.
*   If $s$ exists in $S_user$: `UserPoints = s.importance * userProcifiency (1 to 3)`
    *   *(Note: UserPoints cannot exceed MaxPoints for a single skill)*

> `TotalSkillScore` = ($\sum$ `UserPoints` / $\sum$ `MaxPoints`) * 60

### 2.2 Interest Score Calculation (Weight: 25%)
Count the intersection of $I_req$ and $I_user$.
> `InterestScore` = (Number of Matching Interests / Total $I_req$ length) * 25

### 2.3 Education/Base Modifier (Weight: 15%)
If the user's Degree/Branch closely aligns with the Career's primary technical field (e.g., B.Tech CS for SWE), assign full 15 points. If tangent (e.g., B.Sc Physics for SWE), assign 7 points.

### Final Output
`TotalMatchScore = TotalSkillScore + InterestScore + EducationModifier`
The backend runs this array reduction for all careers and sorts descending, returning `array.slice(0, 3)`.

## 3. Roadmap Generation Algorithm
When a user requests a roadmap of $W$ weeks (e.g., 8 weeks):
1.  **Identify Gaps:** `MissingSkills = S_req - S_user` (including skills where user proficiency < required).
2.  **Sort Gaps:** Sort `MissingSkills` based on prerequisite hierarchy (e.g., HTML must come before React). *For MVP, rely on a simplified order index defined in the DB.*
3.  **Allocate Time:** Divide `MissingSkills` array into $W$ chunks.
4.  **Generate DB Records:** Create $W$ new `RoadmapTask` documents linking to the user and the specific skill module, defaulting to `isCompleted: false`.

## 4. 3D Engine Implementation (Three.js)

### Core Components
*   **Renderer:** `THREE.WebGLRenderer` configured with `antialias: true` and `alpha: true` (transparent background to allow CSS gradients to bleed through).
*   **Scene & Camera:** `THREE.PerspectiveCamera` (FOV 45-60) handling responsive window resize events.
*   **Lighting:** `AmbientLight` (for base visibility) + `PointLights` attached to specific "Career Nodes" to create a glowing effect.
*   **Geometry & Materials:** Favor `MeshStandardMaterial` for reactivity to light. Use `SphereGeometry` for planets/nodes.
*   **Animation Loop:** `requestAnimationFrame` handling delta time for smooth planetary rotations and particle system updates. GSAP will be used to transition camera positions when a user clicks a specific career node.

### Optimization Strategies
*   Implement `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to prevent performance dips on ultra-high-resolution mobile screens.
*   Destroy unused WebGL geometries and materials if the user navigates away from the 3D view (garbage collection).

## 5. Security Protocols
*   **Protection against NoSQL Injection:** Validate and sanitize all raw inputs using libraries like `validator` or by casting strictly to Mongoose schema types.
*   **Rate Limiting:** Implement `express-rate-limit` on the `/api/auth/register` and `/api/auth/login` to prevent brute force attacks.
*   **CORS Configuration:** Restrict the `cors()` middleware origin to exactly the Vercel deployed URL and `localhost` during development. Do not use wildcard `*` origins in production.
*   **Password Security:** Passwords hashed with `bcrypt.hash(password, 10)` before DB save.

## 6. Testing Strategy (Hackathon Level)
*   **API Testing:** Extensive use of Postman to verify JWT generation, score calculations, and roadmap retrieval.
*   **Frontend Testing:** Manual testing across Chrome, Firefox, and Safari constraints. Chrome DevTools Network throttling (Fast 3G) to test Three.js load times.

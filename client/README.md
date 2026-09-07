# CareerPath AI — Frontend Client Documentation

> **Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> *Discover Your Career. Build Your Skills.*

The `client/` directory contains the presentation and interaction tier of CareerPath AI. It is architected as a clean, performant, multi-page static web application built without heavy frontend frameworks to maximize runtime performance, eliminate build overhead, and ensure universal browser compatibility.

---

## 🛠️ Technologies Used

- **HTML5:** Semantic document structuring, form accessibility, and responsive viewports.
- **Vanilla CSS3:** Custom design tokens, dark glassmorphism styling, and layout grids.
- **Bootstrap 5.3:** Grid layout scaffolding, responsive utilities, and modal dialogs.
- **JavaScript (ES6+):** Vanilla DOM controllers, asynchronous `fetch` wrappers, and state persistence.
- **Three.js (r128):** Hardware-accelerated 3D WebGL visualizations (constellations, orbital tracks, milestone paths, holographic energy spheres).
- **GSAP (GreenSock):** Micro-interactions, smooth camera interpolations, and interface transitions.

---

## 📄 Application Pages

| File | Route | Description |
| :--- | :--- | :--- |
| `index.html` | `/` or `/index.html` | Landing page featuring the **Career Universe** 3D constellation hero, features overview, and demo CTA. |
| `login.html` | `/login.html` | Student authentication portal with client-side validation and JWT storage. |
| `register.html` | `/register.html` | New student account registration with automatic token acquisition. |
| `assessment.html` | `/assessment.html` | Multi-section student evaluation form capturing education, interests, and skill proficiencies. |
| `recommendations.html` | `/recommendations.html` | Displays top 3 matched careers, deterministic percentage scores, skill-gap analysis, and **Skill Orbit** 3D. |
| `roadmap.html` | `/roadmap.html` | Interactive milestone curriculum (4, 8, 12 weeks) with task checkboxes and **Roadmap Path** 3D. |
| `dashboard.html` | `/dashboard.html` | Student command center with active career goals, live progress telemetry, and **Progress Orb** 3D. |
| `404.html` | `/404.html` | Custom styled glassmorphism error page guiding lost users back to safety. |

---

## 🌌 3D Components & Fallback Requirements

CareerPath AI integrates four purposeful 3D visual experiences:
1. **Career Universe** (`js/three-career-universe.js`): Celestial nodes representing infinite tech opportunities.
2. **Skill Orbit** (`js/three-skill-orbit.js`): Planetary orbits illustrating Matched (green), Weak (amber), and Missing (red) skills.
3. **Roadmap Path** (`js/three-roadmap-path.js`): Stepping-stone trail visualizing the student's journey.
4. **Progress Orb** (`js/three-progress.js`): Pulsing energy sphere reflecting live progress percentage.

### Graceful Fallback Guarantee
If WebGL is unavailable (e.g., legacy mobile device, disabled GPU acceleration, software rendering), every Three.js controller automatically detects the condition and renders crisp, accessible **2D HTML/CSS cards**. Core functionality is never blocked by graphics hardware.

---

## ⚙️ Local Development Instructions

Because this is a static frontend, no `npm install` is required in the `client/` directory.

### Option 1: Python HTTP Server (Recommended)
```bash
cd client
python -m http.server 5500
```
Open **[http://localhost:5500](http://localhost:5500)** in your browser.

### Option 2: VS Code Live Server
1. Open the repository in VS Code.
2. Right-click `client/index.html` and select **Open with Live Server** (Port 5500).

### Option 3: Node `serve`
```bash
npx --yes serve client -p 5500
```

---

## 🔌 API Configuration (`js/config.js`)

All frontend API calls dynamically resolve the backend URL through `client/js/config.js`:

```javascript
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const LOCAL_API_URL = 'http://localhost:5000/api';
const PRODUCTION_API_URL = 'https://YOUR-RENDER-SERVICE.onrender.com/api';

const CONFIG = {
  API_BASE_URL: isLocal ? LOCAL_API_URL : PRODUCTION_API_URL,
  TOKEN_KEY: 'careerpath_token',
  USER_KEY: 'careerpath_user'
};
```

> **Security Note:** Never place private API keys or secrets in client-side `.env` files. Browsers execute code publicly, meaning all client assets are visible in DevTools.

---

## ☁️ Vercel Deployment Instructions

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New → Project**.
3. Select your repository.
4. Set **Root Directory** to `client`.
5. Set **Framework Preset** to `Other`.
6. Leave the build command and output directory empty.
7. Click **Deploy**.
8. Copy the deployed domain: `https://YOUR-PROJECT.vercel.app`.
9. Update `client/js/config.js` with your deployed Render backend URL.

---

## 🛠️ Troubleshooting Common Frontend Issues

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **CORS error in browser console** | Backend does not recognize the frontend origin. | Ensure `CLIENT_URL` in `server/.env` matches `http://localhost:5500` or your Vercel URL. |
| **Blank canvas / WebGL errors** | Browser hardware acceleration disabled or unsupported GPU. | The fallback 2D UI will display automatically; check console for WebGL warnings. |
| **Network request failed (404/ECONNREFUSED)** | Backend server is not running or wrong port in `config.js`. | Verify backend is active on `http://localhost:5000` via `curl http://localhost:5000/api/health`. |
| **Page redirect loops to login** | Expired or missing JWT token in `localStorage`. | Clear browser storage (`localStorage.clear()`) and log in again. |

# CareerPath AI — Frontend Client

> Plain HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Three.js, and GSAP.  
> Deployed on **Vercel** (Static Multi-page).

---

## 📁 Frontend Architecture

```
client/
├── index.html                   ← Landing page with 3D Career Universe constellation hero
├── login.html                   ← Student login portal with JWT session storage
├── register.html                ← New student registration form
├── assessment.html              ← Interactive skill & interest assessment questionnaire
├── recommendations.html         ← Top 3 career matches & 3D Skill Orbit visualization
├── roadmap.html                 ← Weekly curriculum tracker & 3D Milestone Pathway
├── dashboard.html               ← Student telemetry hub & 3D Progress Orb
├── 404.html                     ← Custom 404 error page
├── vercel.json                  ← Vercel multi-page deployment & security headers config
├── css/
│   ├── style.css                ← Core design system tokens, typography, glassmorphism
│   ├── roadmap.css              ← Weekly modules, task items, badges, timeline layout
│   └── dashboard.css            ← Student metrics cards, shortcuts, progress styling
└── js/
    ├── config.js                ← API base URL (Localhost vs Render production)
    ├── api.js                   ← Centralized fetch wrapper with Bearer token & error handling
    ├── auth.js                  ← Session management, route guard (requireAuth), logout
    ├── login.js                 ← Login submission controller
    ├── register.js              ← Registration submission controller
    ├── assessment.js            ← Multi-category skill & interest picker controller
    ├── recommendations.js       ← Recommendation card generator & duration modal logic
    ├── roadmap.js               ← Active curriculum controller & task checkbox toggle handler
    ├── dashboard.js             ← Student dashboard controller & telemetry synchronizer
    ├── main.js                  ← Landing page scroll animations, navbar glass, mobile close
    ├── three-career-universe.js ← 3D celestial constellation on landing page
    ├── three-skill-orbit.js     ← 3D planetary skill gap orbit on recommendations page
    ├── three-roadmap-path.js    ← 3D interactive milestone pathway on roadmap page
    └── three-progress.js        ← 3D holographic energy sphere on dashboard
```

---

## 🚀 Running Locally

The frontend is completely static (no build step or bundler required).

```powershell
# In the demo/client directory:
python -m http.server 5500
```
Then open: **`http://localhost:5500`** in your browser.

---

## ☁️ Vercel Production Deployment

1. Push code to GitHub.
2. In Vercel, select **Import Project** → choose your repository.
3. Set **Root Directory** to `client`.
4. Leave **Framework Preset** as **Other**.
5. Do not specify a build command.
6. Click **Deploy**.

### ⚠️ Pre-Deployment Checklist
- [x] `config.js` points to deployed Render backend URL (`https://YOUR-RENDER-SERVICE.onrender.com/api`).
- [x] Security headers (`X-Frame-Options`, `X-Content-Type-Options`) configured in `vercel.json`.
- [x] All HTML pages use relative paths (`css/...`, `js/...`).
- [x] All 4 Three.js 3D modules feature progressive enhancement with graceful 2D fallbacks.
- [x] 401 Unauthorized responses automatically clear session and redirect to `login.html`.

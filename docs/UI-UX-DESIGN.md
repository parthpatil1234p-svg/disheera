# UI/UX & Design Systems Specification

> **🏆 Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> **Project:** CareerPath AI (ED-02)  
> **Design Language:** High-Contrast Futuristic Sci-Fi EdTech with Accessible 90% Bento Grid

---

## 1. Design Philosophy & Layout Architecture

### 1.1 Core Principles
1. **Clarity & Accessibility First:** Data (scores, gaps, progress percentages) must be immediately legible on all displays. Confusing 3D degree gauges have been replaced with crisp, high-contrast **2D SVG percentage meters (0%–100%)**.
2. **90% Viewport Container Layout:** We eliminated awkward empty spaces and cramped center columns by calibrating containers to fill **90% of the screen width** with balanced **10% margins** on widescreen monitors (`--container-max: 1600px`).
3. **Progressive Disclosure:** High-level match summaries appear first; deep technical skill breakdowns, live CTC telemetry, and weekly task checklists are accessible on demand.
4. **Resilient Visual Fallbacks:** Every 3D canvas (such as the landing page Career Universe) includes a hardware-sensing 2D glassmorphic fallback that activates in <5ms on low-power devices.

---

## 2. Layout Grid & Global CSS Tokens

```css
:root {
  /* ── Layout & Responsive Boundaries ── */
  --container-width: 90%;             /* Fills 90% of available viewport width */
  --container-max: 1600px;            /* Max width cap for ultra-wide displays */
  --container-margin: 0 auto;         /* Centered with balanced 10% margins */
  --nav-height: 72px;                 /* Sticky notch navbar height */
  --nav-clearance: calc(var(--nav-height) + 1.5rem); /* Prevents header overlap */

  /* ── Typography Scale ── */
  --font-heading: 'Space Grotesk', -apple-system, sans-serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-xs: 0.8rem;                  /* 12.8px — captions & micro badges */
  --text-sm: 0.925rem;                /* 14.8px — labels & secondary text */
  --text-base: 1.05rem;               /* 16.8px — body copy & inputs */
  --text-lg: 1.35rem;                 /* 21.6px — subheadings & card titles */
  --text-xl: 1.65rem;                 /* 26.4px — section headers */
  --text-2xl: 2.25rem;                /* 36.0px — page headlines */
  --text-3xl: 3.25rem;                /* 52.0px — hero banners */

  /* ── Color Palette & Glowing Accents ── */
  --bg-space: #0B0F19;                /* Deep cosmic dark background */
  --bg-surface: #111827;              /* Bento card backgrounds */
  --bg-elevated: #1F2937;             /* Elevated panels & dropdowns */

  --primary-glow: #00F0FF;            /* Electric Cyan — CTA, links, active state */
  --secondary-glow: #7000FF;          /* Cyber Purple — gradients & accents */
  --accent-cyan: #38BDF8;             /* Sky Blue — code snippets & tags */

  /* ── Semantic Verification & Skill States ── */
  --status-verified: #10B981;         /* Emerald Green — Code / Quiz Verified */
  --status-matched: #22C55E;          /* Bright Green — Matched skills */
  --status-weak: #F59E0B;             /* Amber / Yellow — Proficiency upgrade needed */
  --status-missing: #EF4444;          /* Coral Red — Missing core skills */

  /* ── Glassmorphism ── */
  --glass-bg: rgba(17, 24, 39, 0.75);
  --glass-border: rgba(56, 189, 248, 0.2);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45);
}
```

---

## 3. High-Contrast 2D Percentage Circular Gauge

To eliminate confusion from degree angles (e.g. 90° or 180°), the student dashboard uses an accessible **2D SVG Percentage Progress Meter**:

```html
<div class="progress-gauge-container">
  <svg class="progress-ring" width="160" height="160" viewBox="0 0 160 160">
    <circle class="progress-ring-bg" cx="80" cy="80" r="70" />
    <circle class="progress-ring-fill" cx="80" cy="80" r="70" stroke-dashoffset="calc(440 - (440 * var(--percent)) / 100)" />
  </svg>
  <div class="progress-gauge-text">
    <span class="progress-value">68%</span>
    <span class="progress-label">Milestones Completed</span>
  </div>
</div>
```

- **Benefits:** Pure percentage output (0%–100%), hardware-accelerated SVG transitions, zero WebGL overhead, and accessible screen-reader compliance.

---

## 4. Adaptive Skill Reality-Check Micro-Quiz Interface (`/quiz.html`)

The micro-quiz interface is designed for high-focus technical evaluation:
1. **Dynamic Stepper Bar:** 5 circular stepper dots connected by an animated progress beam indicating the active question.
2. **Question Countdown Timer:** Visual countdown ring displaying remaining seconds per question.
3. **Interactive Radio Cards:** Full-width selectable option blocks with neon focus outlines and hover lifts.
4. **Pedagogical Explanation Card:** Instantly reveals after an answer is submitted, explaining the underlying computer science reasoning.
5. **BYOK / Provider Switcher Modal:** Accessible modal allowing evaluators to switch between Groq Llama 3.3 70B, Google Gemini 2.5 Flash, or their own API key.

---

## 5. Verified Skill Badges & Chip System

Skills in the assessment profiler and dashboard use luminous badge indicators:

| Badge Type | Visual Styling | Trigger / Source |
| :--- | :--- | :--- |
| **`[✓ Code Verified]`** | Emerald green background, glowing border, green checkmark icon | Granted via `POST /api/auth/github/sync` when language is detected in user's public repositories |
| **`[✓ Quiz Verified]`** | Cyan/Green gradient pill, checkmark badge | Granted upon scoring $\ge 60\%$ on the 5-question micro-quiz (`/quiz.html`) |
| **`[🟢 Matched]`** | Soft emerald badge | User proficiency $\ge$ career required proficiency |
| **`[🟡 Upgrade]`** | Muted amber badge | User has skill, but below required benchmark level |
| **`[🔴 Missing]`** | Dark red pill badge | Skill not yet acquired; targeted for milestone roadmap |

---

## 6. Page Layout Matrix

| Page | URL | Container Width | Primary Visual Component |
| :--- | :--- | :---: | :--- |
| **Landing** | `/index.html` | 90% | Three.js 3D Career Universe constellation + 2D fallback |
| **Auth** | `/login.html` | Centered (520px) | Glassmorphic auth card, 1-Click demo account auto-fill button |
| **Assessment** | `/assessment.html` | 90% | 3-step profiler, GitHub auto-detect button, verified skill chips |
| **Micro-Quiz** | `/quiz.html` | 90% (Max 1400px) | 5-question stepper card, BYOK modal, interactive options |
| **Recommendations** | `/recommendations.html` | 90% | 3-column career match cards, 60/25/15 score breakdowns |
| **Roadmap** | `/roadmap.html` | 90% | Weekly milestone checklist, 1-click PDF print button, video dedication player |
| **Dashboard** | `/dashboard.html` | 90% Bento Grid | Apple/Linear profile card, 2D circular gauge, GitHub Study Lab |
| **Direct Jobs** | `/jobs.html` | 90% Bento Grid | Verified enterprise jobs, 1-click apply modal, match percentage cards |
| **Recruiter Portal** | `/recruiter-dashboard.html` | 90% Bento Grid | ATS applicant radar, job opening creator, candidate stage tracker |
| **Recruiter Onboarding** | `/recruiter-onboarding.html` | Centered (600px) | Domain verification precheck, corporate email validation, OTP input |

---

## 7. Modernized Student Profile Header Card (Apple & Linear Aesthetic)

The student profile header card on `/dashboard.html` was completely overhauled to align with modern design standards (Apple Developer / Linear design systems):

```html
<div class="profile-header-card glass-panel">
  <div class="profile-avatar-wrapper">
    <div class="profile-avatar-circle">
      <img src="..." alt="Student Avatar" class="avatar-img-50pct" />
      <span class="avatar-status-dot online"></span>
    </div>
  </div>
  <div class="profile-meta-column">
    <div class="profile-name-row">
      <h2 class="profile-name">Parth Patil</h2>
      <span class="badge-verified-student">✓ Verified Student</span>
    </div>
    <div class="profile-tags-row">
      <span class="meta-tag"><i class="fas fa-graduation-cap"></i> B.Tech CSE (2026)</span>
      <span class="meta-tag"><i class="fas fa-university"></i> GHRISTU Pune</span>
      <span class="meta-tag"><i class="fab fa-github"></i> Connected (8 Repos)</span>
    </div>
  </div>
  <div class="profile-status-pill-column">
    <div class="segmented-status-pill">
      <button class="pill-option active" data-status="actively_looking">Actively Looking</button>
      <button class="pill-option" data-status="open_to_offers">Open to Offers</button>
      <button class="pill-option" data-status="casually_browsing">Casually Browsing</button>
      <button class="pill-option" data-status="not_available">Not Available</button>
    </div>
  </div>
</div>
```

### 7.1 Visual Tokens & Aesthetics
- **Surface Elevation:** Translucent dark canvas (`background: rgba(15, 23, 42, 0.65)`) with `backdrop-filter: blur(16px)` and 1px crisp border `rgba(255, 255, 255, 0.08)`.
- **50% Circular Geometry:** Profile image rendered inside a strict `border-radius: 50%` wrapper with smooth cyan glow on hover.
- **Segmented Control:** Subtle pill switcher with animated sliding background indicator and tactile active states.

---

## 8. Recruiter Dashboard & ATS Talent Radar UI

The recruiter interface on `/recruiter-dashboard.html` is engineered for high-efficiency candidate screening:
1. **Corporate Trust Header:** Shows verified company domain badge, verification score (e.g. `99/100`), and quick action button to publish jobs.
2. **Glassmorphic Candidate Radar:** Applicant cards prominently display candidate AI match percentage (`96%`), verified skill badges (`[✓ Quiz Verified]`), and job readiness tier.
3. **Interactive Stage Pipeline:** 4-state hiring pipeline (`Applied` ➔ `Shortlisted` ➔ `Interview` ➔ `Offered`) with one-click status transitions and recruiter notes modal.

---

## 9. Dedicated AI Video Learning Player & Anti-Scrubbing UX

The video learning modal on `/roadmap.html` transforms YouTube tutorials into dedicated learning sessions:
1. **Clean Video Container:** 16:9 embedded player with high-contrast playback indicators.
2. **Telemetry Status Bar:** Real-time progress bar displaying watched seconds versus required minimum duration.
3. **Tactile Feedback Toasts:** Dispatches warning notifications if a student tries forward-scrubbing beyond watched bounds or attempts to set playback speed above 1.5x.
4. **Reflection Input Card:** Slides into view upon reaching 90% watch time with live character counter (requiring 30+ chars) before unlocking task completion.

---

## 10. Role-Smart Brand Logo Navigation & Floating Session Bar

1. **Smart Logo Anchor (`Auth.bindSmartLogo()`):**
   - Clicking the navbar brand logo automatically checks role context:
     - Recruiter ➔ routes to `/recruiter-dashboard.html`
     - Student ➔ routes to `/dashboard.html`
     - Guest ➔ routes to `/index.html`
2. **Floating Recruiter Session Bar:**
   - Displayed fixed to the viewport when an authenticated recruiter browses student pages (`jobs.html`), preventing portal confusion and providing a 1-click return button back to the recruiter dashboard.


# UI/UX Design System Specification — CareerPath AI

> **Status:** Draft / To be validated during qualifier  
> **Hack2Ignite 2026–27 · Round 1 MVP**  
> **Domain:** EduTech / AI for Good  
> **Team:** 404 Brain Not Found  
> **Primary Author:** Asmita Lokhande (UI/UX & 3D Interactive Designer)

---

## 1. Design Principles & Aesthetic Philosophy

CareerPath AI balances a **futuristic, cutting-edge aesthetic** with a **warm, student-friendly cognitive clarity**. Our core principles include:
1. **Reduce Career Anxiety:** Present complex career paths and skill gaps through structured cards and orbital visualizations rather than dense walls of text.
2. **Deterministic Clarity:** Ensure match scores and skill categories (Matched, Needs Upgrade, Missing) are instantly discernible via distinct color tokens.
3. **Immersive Yet Functional:** Use 3D graphics to enrich data storytelling without compromising load times, accessibility, or low-end device performance.

---

## 2. Design Tokens & Color Palette

The interface is built upon a curated dark-mode glassmorphism foundation:

| Token Name | Hex Code | Color Swatch | Usage & Semantics |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `#4F46E5` | Indigo | Main brand accents, primary buttons, active tabs |
| **Secondary Brand** | `#7C3AED` | Deep Purple | Secondary gradients, orbital rings, badge highlights |
| **Cyan Accent** | `#22D3EE` | Bright Cyan | 3D particle nodes, hover glows, metric numbers |
| **Success (Matched)** | `#22C55E` | Emerald Green | Matched skills, completed tasks, high scores |
| **Warning (Upgrade)**| `#F59E0B` | Amber | Weak skills needing proficiency upgrade |
| **Danger (Missing)** | `#EF4444` | Coral Red | Missing critical career skills |
| **Dark Canvas** | `#0B1020` | Deep Navy | Main page background canvas |
| **Glass Surface** | `rgba(17, 24, 39, 0.7)` | Translucent Slate | Glassmorphism cards with `backdrop-filter: blur(12px)` |
| **Light Foreground** | `#F8FAFC` | Crisp White | Primary headings, prominent body text |
| **Muted Text** | `#94A3B8` | Slate Grey | Subtitles, helper descriptions, secondary metrics |

---

## 3. Typography & Font Hierarchy

- **Headings & Brand Title:** `Space Grotesk`, sans-serif (Weights: 600, 700) — geometric, technical, and forward-looking.
- **Body & Interactive Elements:** `Inter`, sans-serif (Weights: 400, 500, 600) — highly readable at dense data scales.
- **Code & Scores:** `Outfit` / Monospace (Weights: 600) — distinct numerals for match percentages and week counters.

---

## 4. Component Guidelines

### Glassmorphism Cards
```css
.glass-card {
  background: rgba(17, 24, 39, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.glass-card:hover {
  transform: translateY(-3px);
  border-color: rgba(34, 211, 238, 0.3);
}
```

### Skill Gap Badge Indicators
- 🟢 **Matched:** `badge bg-success-subtle text-success border border-success`
- 🟡 **Needs Upgrade:** `badge bg-warning-subtle text-warning border border-warning`
- 🔴 **Missing:** `badge bg-danger-subtle text-danger border border-danger`

---

## 5. 3D WebGL Experiences (Three.js + GSAP)

| Module Name | Canvas Container | Page | Interaction & Visual Meaning |
| :--- | :--- | :--- | :--- |
| **Career Universe** | `#careerUniverse` | `index.html` | Interactive particle constellation in hero; rotating starry nodes representing infinite paths. |
| **Skill Orbit** | `#skill-orbit` | `recommendations.html` | Concentric planetary orbital tracks with the target career at the center, surrounded by skill spheres. |
| **Roadmap Path** | `#roadmap-path` | `roadmap.html` | 3D stepping-stone trail of glowing milestones representing the weekly progression. |
| **Progress Orb** | `#progress-orb` | `dashboard.html` | Holographic energy sphere pulsing and glowing based on active completion percentage. |

---

## 6. WebGL Fallback & Accessibility Standards

### Graceful Degradation Rules
1. **WebGL Check:** If `window.WebGLRenderingContext` is false or GPU initialization throws an error, the 3D canvas is hidden.
2. **Fallback Cards:** Clean, accessible 2D HTML/CSS cards display instantly in place of the 3D canvas.
3. **Zero Blockers:** Critical user actions (completing assessment, choosing roadmaps, checking tasks) are completely independent of WebGL.

### Reduced Motion
Users with `prefers-reduced-motion: reduce` will receive static particle distributions with GSAP tweens disabled.

---

## 7. Responsive Breakpoints

- **Desktop (≥ 1200px):** Full multi-column dashboard, interactive 3D WebGL sidebars, horizontal timeline cards.
- **Tablet (768px – 1199px):** 2-column flex layout, scaled 3D canvas height (300px), compact skill badges.
- **Mobile (< 768px):** Single-column stacked cards, collapsible Bootstrap hamburger navigation, touch-friendly tap targets (min 44px height).

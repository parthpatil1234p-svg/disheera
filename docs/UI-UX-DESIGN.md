# UI/UX & 3D Interactive Design System

## 1. Core Visual Philosophy
CareerPath AI abandons the traditional "boring form web app" look. It uses **"Futuristic Immersive Education"** aesthetics. The goal is to make the user feel like they are plotting a course through a physical tech universe.

## 2. Typography Constraints
To maintain a high-tech yet readable interface:
*   **Primary Font:** `Space Grotesk` (Google Fonts) - Used for all Headings (H1-H6) and Dashboard Metrics.
*   **Secondary Font:** `Inter` (Google Fonts) - Used for all body text, paragraphs, tooltips, and forms.
*   **Font Weights:**
    *   H1/H2: `700` (Bold)
    *   Subheadings: `500` (Medium)
    *   Body: `400` (Regular)
    *   Micro-copy (labels): `300` (Light) - Size 12px.

## 3. Exact Color Palette & CSS Variables
Add these directly to `:root` in `main.css`.

```css
:root {
  /* Brand Primary */
  --cp-indigo: #4F46E5;
  --cp-purple: #7C3AED;
  
  /* 3D Accents & Glows */
  --cp-cyan: #22D3EE;
  
  /* Status Colors (Semantic) */
  --cp-success: #22C55E;  /* Green: Mastered skills, Completed tasks */
  --cp-warning: #F59E0B;  /* Amber: Missing skills, In-progress */
  --cp-error: #EF4444;    /* Red: Validation errors */
  
  /* Backgrounds & Glassmorphism */
  --cp-bg-deep: #0B1020;         /* Deep Navy background for 3D canvas */
  --cp-glass-bg: rgba(255, 255, 255, 0.05); /* Card backgrounds */
  --cp-glass-border: rgba(255, 255, 255, 0.1);
  
  /* Text */
  --cp-text-main: #F8FAFC;
  --cp-text-muted: #94A3B8;
}
```

## 4. Glassmorphism Specifications
All UI panels floating *above* the 3D canvas must adhere to this CSS rule to ensure the 3D scene remains visible underneath:

```css
.glass-panel {
    background: var(--cp-glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--cp-glass-border);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    color: var(--cp-text-main);
}
```

## 5. Three.js Detailed Interactions

### 5.1. Background Atmosphere (Global)
*   **Particles:** 1000 tiny white/blue `Point` geometries slowly drifting. Gives the illusion of space/data points.
*   **Lighting:** `AmbientLight(0xffffff, 0.3)` to keep things dark, with colored `PointLight` attached to specific career spheres to make them glow.

### 5.2. Top 3 Career Presentation (Dashboard)
*   **Layout:** 3 major Spheres arranged horizontally on the screen.
*   **Materials:** `MeshStandardMaterial`.
    *   Rank 1 Match: Emits a Cyan glow.
    *   Rank 2 & 3: Dimmer blue/purple glows.
*   **Hover State:** Raycaster detects mouse over. GSAP scales the sphere by `1.2x`. An HTML label absolute positions over the mouse coordinates reading the career name and match percentage.
*   **Click State:** Camera uses GSAP to fly close to the selected sphere. UI updates to show the "Skill Gap" menu.

### 5.3. Roadmap Path (Progress View)
*   **Layout:** A `TubeGeometry` curving from the bottom of the screen deep into the Z-axis.
*   **Milestones:** Small glowing spheres positioned along the tube representing weeks.
*   **Visual Check:** When a user clicks "Completed" in the HTML task list, the milestone sphere changes material color from Amber to Green via a smooth 0.5s transition.

## 6. Responsive Fallbacks (Mobile Constraints)
*   If `window.innerWidth < 768`, disable the background particle system in Three.js to save battery/CPU.
*   Collapse sidebars into bottom-drawer off-canvas menus.
*   Ensure hit-boxes (buttons and 3D raycast targets) are at least `44x44px` to comply with touch-target accessibility standards.

# SPEC.md — Disheera Launch & Explainer Film: "The Talent Signal"

GOAL: The viewer realizes that unverified hiring is broken, and feels total clarity that Disheera autonomously converts student diagnostic skill assessments into instant, cryptographically verified recruiter hires.

OUTPUT: HyperFrames, 1920 x 1080, 30 fps

TIME: 30 seconds x 30 fps = 900 frames; 120 BPM, 15 frames per beat, 60 frames per bar (4 beats).

LOOK:
  - Ground: #F8FAFC (Slate-50 pristine canvas), 0% grain, 0% vignette.
  - Ink: Primary #0F172A (Slate 900) at 100% opacity; Secondary #475569 (Slate 600); Muted #94A3B8 (Slate 400).
  - Accent: #2563EB (Royal Blue 600) on primary action elements and active route nodes; #10B981 (Emerald 500) on verified stamps; #EF4444 (Red 500) on unverified resume alerts during the tension hook.
  - Display face: Inter Bold (weight 800), 56px (5.2% frame height), -0.025em tracking.
  - Body face: Inter Medium (weight 500), 24px, 0em tracking.
  - Medium: Pristine vector UI cards, 1px solid #E2E8F0 borders, 16px border-radius, crisp shadow 0 20px 45px -12px rgba(15, 23, 42, 0.08).
  - Light and depth: Shadow offset 0px X, 12px Y, blur 28px, opacity 0.08, zero dark neon glow.

OBJECTS:
  - Left Pane (Job Seeker Pain): 1200x900px card, rejection notice list with counter "42 Applications · 0 Responses", faded avatar, unverified PDF badge.
  - Right Pane (Recruiter Screening Pain): 1200x900px card, inbox counter "840 Resumes · 92% Unverified", alert stamp "Unverified Skills", fatigue meter at 94%.
  - Disheera Unified Cockpit: 1720x960px elevated card with navigation bar, active "Talent Discovery Radar" tab, candidate dossier for "Aarav Sharma", 94.2% verified skill gauge, institutional verification badge "SPPU Pune #84920", and "Invite on WhatsApp" button.
  - End Card: Disheera shield emblem (Royal Blue #2563EB, 140x140px), wordmark "DISHEERA" (64px, weight 900), subtitle "Autonomous Career GPS & Institutional Verification", primary CTA button "Explore Platform → disheera.site" (280x64px, background #2563EB, text #FFFFFF).

MOTION:
  - Enter ease: power3.out (duration: 12 frames / 0.4s).
  - Exit ease: power2.in (duration: 8 frames / 0.27s).
  - Split collapse: power4.inOut (duration: 24 frames / 0.8s).
  - Stamp / Seal: back.out(2) (duration: 10 frames / 0.33s).
  - Progress scrub / gauge: power2.out (duration: 30 frames / 1.0s).
  - Stagger between card children: 3 frames (0.1s).

SHOTS:
  - Shot 1 (Frames 0–75 | 0.0–2.5s): Split-Screen Hook — Left pane scrolls rejection notices ("Application Not Selected"), right pane scrolls 800 unverified resumes. Sound: Staccato typewriter typing + warning buzz. Handoff: Red warning stamp slams onto right pane.
  - Shot 2 (Frames 75–150 | 2.5–5.0s): The Tension — Red warning stamp "85% Unverified Claims" hits right resume, left side shows student fatigue. Sub bass drop on frame 120. Handoff: horizontal collapse into central seam.
  - Shot 3 (Frames 150–240 | 5.0–8.0s): The Collapse & Reveal — Split panes collapse inward into a 2px Royal Blue center beam; beam expands into Disheera Light Cockpit. Headline reads: "Disheera: Autonomous Career GPS & Verification". Sound: Sub bass sweep into clean rhythmic groove (120 BPM). Handoff: Smooth camera punch-in on Candidate Radar.
  - Shot 4 (Frames 240–420 | 8.0–14.0s): Proof 1 (Student Assessment & GPS) — Diagnostic Assessment Chamber shows "Full-Stack System Diagnostic", score gauges run from 0 to 94.2%, green institutional attestation seals "SPPU Verified · Top 3.8%". Sound: Tactile click & crisp harmonic seal chime. Handoff: Badge travels into Candidate Dossier.
  - Shot 5 (Frames 420–600 | 14.0–20.0s): Proof 2 (ATS LaTeX Studio) — Split view of resume studio with live LaTeX compilation, ATS score hits 96/100, cryptographic QR hash generates. Sound: Crisp printer sweep sound. Handoff: QR code resolves into verified recruiter dossier.
  - Shot 6 (Frames 600–780 | 20.0–26.0s): Payoff (Recruiter Cockpit & Instant WhatsApp) — Recruiter radar cockpit filters for "Top 5% Verified Full-Stack", candidate dossier for Aarav Sharma unlocks, click "Invite on WhatsApp" triggers instant verified notification. Sound: Tactile button press and clean notification chime. Handoff: Screen slides out smoothly.
  - Shot 7 (Frames 780–840 | 26.0–28.0s): The Claim — Bold kinetic display typography on clean white ground: "The End of Unverified Hiring. Verified Skills. Instant Placements." Sound: Tonal swell with percussive accent. Handoff: Letters wipe into logo emblem.
  - Shot 8 (Frames 840–900 | 28.0–30.0s): End Card — Disheera logo emblem draws in Royal Blue `#2563EB`, wordmark wipes left to right, pill CTA button lands with `disheera.site` and holds for 60 frames (2.0s). Sound: Final musical resolve with soft tail reverb.

BANNED:
  - Dark voids, pitch-black canvases, or dark navy background with floating cards.
  - Glowing neon borders, cyberpunk cyan/magenta glows, bloom effects, or floating particle stars.
  - Purple/violet gradient meshes or translucent glassmorphism cards.
  - Cream/off-white paper with serif fonts or numbered "01/02" decorative labels.
  - Everything fading and sliding up at once.
  - Unverified mockups or invented UI buttons that do not exist in the Disheera platform.
  - Small docked logo in the top corner throughout the video.

QA:
  - Frame 45: Split screen active, left application list visible, right unverified resume counter visible.
  - Frame 180: Central blue beam expanding into Disheera cockpit; no layout jerk or overlap.
  - Frame 330: Diagnostic score gauge reads 94.2% with green "SPPU Verified" seal clearly legible (>28px).
  - Frame 510: ATS Resume Studio LaTeX code side-by-side with 96/100 ATS gauge.
  - Frame 720: Recruiter cockpit candidate dossier with WhatsApp interview modal trigger.
  - Frame 870: End card fully settled, Disheera logo, wordmark, and CTA button centered and legible.

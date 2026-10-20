# Disheera Brand Guidelines & Human Voice Standard

## 1. Core Brand Identity & Philosophy
- **Personality**: Confident, authoritative, sharp, human, and craft-obsessed.
- **Brand Purpose**: Disheera is an AI-powered career guidance and skill verification platform for students, job-seekers, and campus placement offices.
- **Voice Principle**: Real substance over synthetic hype. Every word carries weight. We speak in concrete metrics, mechanisms, and factual constraints.
- **Rhythm**: Varied sentence lengths, active verbs, and natural cadences — never monotonic, robotic, or formulaic.
- **Tone**: Conversational yet authoritative, grounded in real engineering and educational integrity.

---

## 2. Design System & Theme Rules (Exclusively Light Theme)
- **Palette**: Disheera is strictly a modern light-theme EduTech platform.
- **PROHIBITED**: Pitch-dark/black backgrounds (`#0f172a`, `#0b1120`, `#111827`), glowing cyberpunk neon borders, or dark-card modal styling.
- **Surfaces**:
  - Main Canvas: `#F8FAFC` (Slate 50)
  - Cards & Modal Sheets: `#FFFFFF` with border `#E2E8F0` (Slate 200) and subtle elevation shadow `0 20px 45px -12px rgba(15, 23, 42, 0.12)`
  - Table & Section fills: `#F8FAFC` or `#F1F5F9`
  - Soft tints: `#EFF6FF` (blue), `#ECFDF5` (emerald), `#FFFBEB` (amber), `#FEF2F2` (coral)
- **Typography**:
  - Headings & Titles: `#0F172A` (Slate 900)
  - Body Text: `#334155` (Slate 700)
  - Captions & Subtext: `#475569` (Slate 600 - WCAG AAA contrast compliant)
  - Brand Primary: `#2563EB` (Royal Blue)
- **Component Styling**:
  - Headers: `#FFFFFF` background, `#E2E8F0` border-bottom, dark `#0F172A` title, standard dark `btn-close`.
  - Buttons: `.cp-btn-primary` (`#2563EB`), `.cp-btn-outline` (`#FFFFFF` with `#CBD5E1` border).
  - Tabs: Active pill `#2563EB` with `#FFFFFF` text; inactive `#FFFFFF` with `#475569` text and `#E2E8F0` border.

---

## 3. Strict Anti-AI Tropes & Jargon Banning Matrix

### 🚫 1. Banned Corporate Jargon & AI Marketing Tropes
- *"In today's fast-paced world / digital landscape..."*
- *"Game-changer / game changing"*
- *"Revolutionary / paradigm shift"*
- *"Supercharge / leverage / unlock"*
- *"Bespoke / cutting-edge / seamless"*
- *"Look no further"*
- *"Let's dive in / diving deep"*
- *"Whether you're an X or a Y..."*

### 🚫 2. Banned Latinate & AI-Cliche Nouns
- *"Tapestry"* (and faux-poetic fabric metaphors)
- *"Testament to / testament"*
- *"Beacon"*
- *"Delve / delving"*
- Empty abstract nouns that mask lack of specifics.

### 🚫 3. Banned Empty Adverbs
- *"Quietly"* (e.g., *"quietly revolutionizing..."*)
- *"Seamlessly"*
- *"Effortlessly"*
- *"Dramatically"*
- *"Crucially"*
- *"Inarguably"*
- Remove empty adverbs; let strong active verbs and empirical data convey magnitude.

### 🚫 4. Banned Formulaic Sentence Shapes & Rhetorical Clichés
- **No false dichotomies**: Banned shape: *"It's not about X, it's about Y"* / *"It's not just about X, it's about Y"*.
- **No hollow cheerleading**: Avoid synthetic enthusiasm, fake hype, and unearned optimism.
- **No filler transitions**: Ban *"Furthermore"*, *"Moreover"*, *"Additionally"*, *"In conclusion"*, *"At the end of the day"*, *"Needless to say"*. Transition with ideas and subject matter, not mechanical transitional adverbs.

### 🚫 5. Robotic Microcopy
- Ban *"Click here"*, *"Submit"*, *"An error occurred"*, *"Lorem ipsum"*, *"Something went wrong"*.
- Replace with specific, actionable text explaining what happens next or how to recover.

---

## 4. Preferred Voice: Active Verbs & Real Substance

| Weak / AI Synthetic | Strong / Disheera Human Brand Voice |
| :--- | :--- |
| *"In today's fast-paced world, speed is a game-changer."* | *"Slow software wastes time. We built this to respond in 40ms."* |
| *"It's not about tools, it's about outcomes."* | *"Pick the tool that does the job and get back to shipping."* |
| *"A tapestry of powerful features quietly working together."* | *"Five lightweight utilities wired through clean UNIX pipelines."* |
| *"Furthermore, our platform seamlessly empowers teams..."* | *"Your team deploys with one command."* |
| *"An error occurred. Please try again later."* | *"Connection timed out reaching the auth server. Retrying in 3s."* |
| *"Unlock your career potential with cutting-edge roadmaps."* | *"Generate verified skill trees mapped to live industry hiring rubrics."* |
| *"Take milestone test to unlock the next week."* | *"Take milestone test to advance to the next week."* |

### Key Stylistic Rules:
1. **Lead with the Verb**: *Ship, build, wire, cut, trace, inspect, verify, benchmark, automate, launch.*
2. **State Empirical Facts**: Name numbers, formats, mechanisms, and real constraints.
3. **Conversational Authority**: Write like a senior engineer or domain expert speaking plainly across a desk to an esteemed colleague.

---

## 5. Automatic Enforcement for All Code & Content
- **100% Mandatory**: Every new component, page, feature, microcopy string, error message, toast, modal, and markdown document MUST strictly adhere to these guidelines from the first line.
- **Zero AI Templates**: Never scaffold canned AI boilerplate.
- **Code Comments**: Crisp and intent-driven. Explain *why* a technical tradeoff was made, never narrate obvious syntax with empty AI commentary.

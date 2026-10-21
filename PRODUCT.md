# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web (Desktop, Tablet & Mobile Responsive Web Applications)

## Users

- **Primary (B2C)**: Engineering, BCA, MCA, and STEM students seeking career clarity, objective skill-gap analysis, and actionable tech career roadmaps.
- **Institutional (B2B)**: Training & Placement Officers (TPOs), College Academic Directors, and HODs requiring verified student readiness analytics, NAAC/NIRF employability data, and batch progress tracking.
- **Enterprise Recruiters (B2B)**: Talent acquisition specialists, hiring managers, and corporate tech recruiters seeking pre-verified candidates backed by proctored code milestone evaluations and verified portfolio proof of work.

## Product Purpose

Democratize AI-driven, evidence-based career guidance and talent placement. Disheera eliminates career blindness and credential inflation by transforming subjective student aspirations into deterministic matching, actionable week-by-week learning milestones, and tamper-resistant proof of competency.

## Positioning

Unlike generic roadmap blogs, uncurated job boards, or ungrounded generative AI chatbots, Disheera delivers:
1. An **explainable deterministic matching algorithm** (60% Skill Match + 25% Interest Match + 15% Education Fit).
2. **Two-Factor Skill Verification** (Automated GitHub repository audit + proctored reality-check milestone exams).
3. **Corporate Talent Radar** with enterprise DNS/MX domain validation, one-click candidate shortlisting, and direct interview pipelines.

## Operating Context

- Cross-platform web application optimized for desktop, tablet, and mobile browsers.
- Integrates with PostgreSQL / Supabase, Prisma ORM, Google Identity Services, GitHub REST API, Google Gemini AI Engine, and automated WhatsApp alert gateways (Dakly / OpenWA).
- Operates in high-throughput academic seasons (placement drives, semester onboarding, hackathons, and corporate hiring cycles).

## Capabilities and Technical Architecture

- **Autonomous Career Matching**: Deterministic 60/25/15 weighted matching engine covering high-demand technical tracks (Full-Stack, Cloud & DevOps, AI/ML, Cybersecurity, Data Science, Mobile Engineering, etc.).
- **Dynamic Learning Roadmaps**: 4, 8, and 12-week customizable curriculum paths with interactive milestone checkboxes, proctored weekly evaluation chambers, and real-time progress persistence.
- **Two-Factor Competency Verification**: Automated GitHub profile auditing (commit velocity, language breakdown, repo health) coupled with anti-cheat proctored technical evaluations (tab-switch tracking, strike penalties, server-side grading).
- **Recruiter & Talent Portal**: Verified recruiter dashboard with corporate domain authentication, talent radar filtering, 1-click candidate shortlisting, and live job vacancy management.
- **Full-Stack Stack**: Node.js & Express REST API with PostgreSQL (Supabase) via Prisma ORM; high-performance client architecture with Vanilla JS, Tailwind CSS, Bootstrap 5, and Chart.js; production deployment on Vercel and Render.
- **Security & Hygiene**: 1:1 mobile number uniqueness via PostgreSQL partial unique index, Row Level Security (RLS), helmet security headers, and continuous 0-vulnerability dependency baseline (`npm audit`).

## Brand Commitments

- **Organization**: Disheera Technologies Inc.
- **Product**: Disheera EduTech Platform
- **Leadership**: Parth Patil (Founder & CEO)
- **Tagline**: Discover Your Career. Bridge Your Skill Gaps. Build Your Future.
- **Official Palette**: Exclusively **Light-Theme Modern EduTech Platform**.
  - Canvas: `#F8FAFC` (Slate 50)
  - Cards & Modals: Pure `#FFFFFF` with `#E2E8F0` borders and subtle elevation
  - Brand Primary: `#2563EB` (Royal Blue)
  - Text Hierarchy: Primary `#0F172A`, Body `#334155`, Subtext `#475569`
- **Voice**: Authoritative, encouraging, objective, and transparent (objective gap analysis: 🟢 Matched, 🟡 Upgrade, 🔴 Missing).

## Product Documentation & Specifications

- Architectural Specifications: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/PRD.md`](docs/PRD.md), [`docs/TRD.md`](docs/TRD.md)
- Engineering & Schemas: [`docs/BACKEND-SCHEMA.md`](docs/BACKEND-SCHEMA.md), [`docs/API-SPECIFICATION.md`](docs/API-SPECIFICATION.md), [`docs/API-ECOSYSTEM.md`](docs/API-ECOSYSTEM.md)
- Security & Verification: [`SECURITY.md`](SECURITY.md), [`docs/STRIX_SECURITY_AUDIT_REPORT.md`](docs/STRIX_SECURITY_AUDIT_REPORT.md)
- Design Guidelines: [`docs/UI-UX-DESIGN.md`](docs/UI-UX-DESIGN.md), [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Live Deployments:
  - Frontend: `https://disheera.site` (Local: `http://localhost:5500`)
  - Backend API: `https://api.disheera.site` (Local: `http://localhost:5000`)

## Product Principles

1. **Truth Over Hype**: Every career recommendation and skill evaluation is grounded in transparent formulas and objective evidence, avoiding ungrounded AI hallucinations.
2. **Actionable Over Theoretical**: Learning pathways break complex multi-month career goals into atomic, weekly milestone tasks with verifiable code projects.
3. **Institutional Trust**: Verifiable digital credentials with unique verification IDs (`CP-YYYY-XXXXXX`), live QR verification, and proctored exam transcripts.
4. **Local & Cloud Reliability**: Development workflows guarantee 100% local machine execution alongside robust cloud production instances.

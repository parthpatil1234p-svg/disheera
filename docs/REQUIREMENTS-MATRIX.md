# Requirements Traceability & Statutory Governance Matrix (RTM)

> **Disheera Technologies Inc. · Enterprise Architecture & Compliance Standards**  
> **Platform:** Disheera Autonomous Career Guidance & Verified Talent Marketplace  
> **Executive Leadership:** Parth Patil (Founder & CEO)  
> **Engineering Team:** Aditi Vispute (Head of Product), Suyog Pawar (Head of Operations), Sanika Bodhnawar (Lead AI Researcher)

---

## 1. Source Classification & Governance Key

| Code | Category | Definition | Authority |
| :--- | :--- | :--- | :--- |
| `STAT` | Statutory & Regulatory | MeitY DPDP Act 2023, IT Act 2000, UGC/AICTE Accreditation Guidelines | **Mandatory** |
| `SEC` | Security & Data Integrity | OWASP Top 10, Zero-Trust Architecture, RLS, 1:1 Mobile Uniqueness | **Mandatory** |
| `CORE` | Core Platform Engine | 60/25/15 Deterministic Matching, Curriculum Pathways & Progress Engine | **Core Deliverable** |
| `CORP` | Enterprise & Recruiter | Corporate Recruiter Verification, Talent Radar, 1-Click ATS Pipeline | **B2B Deliverable** |
| `INNOV`| Proprietary Innovation | Proctored Milestone Testing, WhatsApp Nudges, GitHub Code Sync | **Value Add** |

---

## 2. Complete Traceability & Verification Matrix

| ID | Requirement Description | Source | Category | Planned Implementation | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **STAT-001** | MeitY DPDP Act 2023 compliance & consent notice | DPDP Act s. 5 | `STAT` | Explicit consent notice modal & privacy.html portal | Legal audit & UI verification | **Verified** |
| **STAT-002** | Designated Statutory Grievance Redressal Desk | DPDP Act s. 8(10) | `STAT` | Dedicated Grievance Officer on support.html & ticket API | Response SLA & contact verification | **Verified** |
| **STAT-003** | Purpose limitation & student data minimization | DPDP Act s. 6 | `STAT` | Single resume per account & strict data access controls | Schema inspection & endpoint audit | **Verified** |
| **SEC-001** | Strict 1:1 Mobile Number Uniqueness Guard | Platform Invariant | `SEC` | PostgreSQL partial unique index `User_phone_unique_not_empty` | Automated DB test (9/9 passed) | **Verified** |
| **SEC-002** | PostgreSQL Row Level Security (RLS) on all tables | Supabase Security | `SEC` | RLS enabled with explicit tenant isolation policies | Supabase Database Linter (0 warnings) | **Verified** |
| **SEC-003** | Zero Hardcoded Secrets or Production Credentials | Zero-Trust Policy | `SEC` | Environment variables via `.env`, mirrored in `.env.example` | Automated secret scanning & grep | **Verified** |
| **SEC-004** | Independent Penetration Testing (OWASP WSTG) | Strix AI Platform | `SEC` | Multi-agent automated security audit (0 exploitable bugs) | Strix Security Audit Report | **Verified** |
| **SEC-005** | Zero-Vulnerability Dependency Hygiene | DevSecOps Standard| `SEC` | Continuous `npm audit` zero critical/high alerts | `npm audit` (0 vulnerabilities) | **Verified** |
| **SEC-006** | Anti-Cheat Proctored Examination Chamber | Academic Integrity | `SEC` | Tab switch tracking, blur listeners, tamper-proof hashes | Milestone exam proctor test | **Verified** |
| **CORE-001**| Student profile & skills evaluation (76+ skills) | Product Spec | `CORE` | Assessment form (`assessment.html`) + User schema | Multi-step form completion test | **Verified** |
| **CORE-002**| 60/25/15 Deterministic Career Matching Engine | Algorithm Spec | `CORE` | 60% Skill + 25% Interest + 15% Education Fit matrix | Mathematical validation (<50ms) | **Verified** |
| **CORE-003**| Transparent Skill-Gap Categorization | Product Spec | `CORE` | Color-coded badges (🟢 Matched, 🟡 Upgrade, 🔴 Missing) | Recommendation card visual audit | **Verified** |
| **CORE-004**| Dynamic 4, 8, and 12-Week Roadmap Generation | Curriculum Engine | `CORE` | Structured milestone pathways with atomic task checklists | Non-empty weekly milestone audit | **Verified** |
| **CORE-005**| Non-Destructive Progression & Task Persistence | Database Invariant| `CORE` | Instant database persistence & 7-day abandon cooldown | Task toggle test & DB state check | **Verified** |
| **CORE-006**| 16:9 Aspect Ratio Verified Career Certificate | Credential Engine | `CORE` | High-resolution widescreen certificate with live QR verify | Browser dimension & print audit | **Verified** |
| **CORP-001**| Recruiter Corporate Domain & DNS Verification | B2B Portal Spec | `CORP` | Free webmail blacklist + MX domain lookup + work OTP | Recruiter onboarding flow test | **Verified** |
| **CORP-002**| Direct Corporate Job Postings with Verified Skills | B2B Portal Spec | `CORP` | `POST /api/recruiter/jobs` with mandatory skill tags | Job creation & applicant fetch test | **Verified** |
| **CORP-003**| Candidate Talent Radar & 1-Click ATS Pipeline | B2B Portal Spec | `CORP` | Candidate skill radar, match scoring, stage transitions | Recruiter talent review audit | **Verified** |
| **CORP-004**| Strict Role-Based Portal Isolation (RBAC) | Security Spec | `CORP` | `requireStudent`, `requireRecruiter` & 403 route gates | 26/26 unit test assertions | **Verified** |
| **INNOV-001**| Dual-Engine AI Career Mentor (Gemini + Groq) | AI Intelligence | `INNOV`| Google Gemini 2.0 Flash + Groq LPU sub-300ms speed | Real-time chat benchmark audit | **Verified** |
| **INNOV-002**| Auth-Based GitHub Repository Sync & Code Audit | Proof of Work | `INNOV`| `POST /api/auth/github/sync` (repo scan & verified badges) | Live GitHub API sync test | **Verified** |
| **INNOV-003**| Multi-Channel WhatsApp Alert Gateway (Dakly/OpenWA)| Notification Spec | `INNOV`| Weekly assignment reminders, exam links & streak nudges | WhatsApp dispatch API test | **Verified** |
| **INNOV-004**| Live Indian Tech Jobs & CTC Salary Telemetry | Job Market Radar | `INNOV`| Adzuna Developer API streaming real-time CTC packages | Real-time job query audit | **Verified** |

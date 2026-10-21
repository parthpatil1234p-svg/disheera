# Enterprise Architectural Standards & Platform Governance

> **Disheera Technologies Inc. · Quality Assurance & Architecture Policy**

---

## 1. Foundational Architecture Principles

1. **Deterministic Core Over Unpredictable LLMs:**  
   Core evaluation mathematics, fit scoring, and prerequisite validation are strictly deterministic. Generative AI is deployed as a conversational pedagogical mentor, resume evaluator, and dynamic micro-quiz author, never as an ungrounded gatekeeper.

2. **Database-Level Invariants:**  
   Critical business rules must be enforced at the database layer (PostgreSQL / Supabase with Prisma ORM):
   - Strict 1:1 mobile number uniqueness via partial unique indexes.
   - Single active roadmap enrollment per student with 7-day cooldown.
   - Dedicated single resume draft per student to prevent media storage bloat.
   - Row Level Security (RLS) on all public tables.

3. **Strict Light-Theme Modern EduTech Design System:**  
   Disheera is exclusively a Light-Theme platform (Canvas: `#F8FAFC`, Cards: `#FFFFFF`, Brand: `#2563EB`). Dark backgrounds (`#0f172a`, `#000000`) and cyberpunk neon styling are strictly prohibited across all interfaces and modals.

4. **Continuous Zero-Vulnerability Security Hygiene:**  
   Every software release must maintain zero high or critical dependency vulnerabilities (`npm audit` reporting 0 vulnerabilities).

5. **Local Run Integrity:**  
   The application must always remain fully functional on local developer environments (`http://localhost:5500` client and `http://localhost:5000` API) with zero reliance on hardcoded cloud URLs.

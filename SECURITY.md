# Security Policy — Disheera

> **Disheera Technologies Inc. · Enterprise Production Security Standards**

The security, privacy, and integrity of student and institutional data are paramount to Disheera. This document outlines our official security policies, responsible vulnerability disclosure procedures, active security controls, and enterprise compliance standards.

---

## 🔒 Confidential & Restricted Credentials (Never Commit to Git)

The following items must **never** be committed to source control or logged in cleartext:

- PostgreSQL / Supabase connection strings containing database credentials (`DATABASE_URL`, `DIRECT_URL`, `postgresql://...`).
- JWT signing secrets (`JWT_SECRET`).
- Third-party API keys (e.g., Google Gemini API, Dakly WhatsApp Gateway API keys, OpenWA session tokens, OAuth client secrets).
- Plaintext student or recruiter passwords or hashes in static seed files.
- Production environment configurations (`.env`, `.env.production`).
- Personally Identifiable Information (PII) of real students, job applicants, or corporate recruiters.

All local configuration must be managed through `server/.env` (strictly excluded by `.gitignore`) and mirrored in `.env.example` with non-sensitive placeholder variables.

---

## 📢 Responsible Vulnerability Disclosure

If you discover a potential vulnerability or security flaw in the Disheera platform:

1. **Do not create a public GitHub issue or disclose the vulnerability publicly.**
2. Report the vulnerability privately via email to our Security Operations Team:
   - **Primary Security Contact:** [security@disheera.site](mailto:security@disheera.site)
   - **Alternative Contact:** [contact@disheera.site](mailto:contact@disheera.site)
   - **Executive Oversight:** Parth Patil (Founder & CEO, Disheera Technologies Inc.)
3. Please provide:
   - A descriptive summary of the vulnerability.
   - Affected endpoint, component, or file path.
   - Minimal reproduction steps or proof-of-concept payload.
   - Expected impact and suggested remediation (if known).

### Triage SLA
- **Critical & High Severity:** Initial triage and containment acknowledgement within **4 hours**.
- **Medium & Low Severity:** Triage acknowledgement within **24 hours**.
- Disheera commits to keeping reporters informed of resolution timelines and will credit responsible security researchers in release advisories.

---

## 🛡️ Production Security Architecture & Baseline Controls

Disheera enforces a multi-layered defense-in-depth architecture across all microservices and web interfaces:

1. **Cryptographic Password Security:** All user credentials are automatically salted and hashed using `bcryptjs` with 10 salt rounds before database persistence. Plaintext passwords are never stored or logged.
2. **Stateless JWT Session Management:** Cryptographically signed JSON Web Tokens (HMAC-SHA256) with strict claims verification and automated expiration lifetimes.
3. **HTTP Security Headers & Defenses:** Integrated `helmet` middleware enforcing strict `X-Content-Type-Options`, `X-Frame-Options` (clickjacking defense), Content Security Policies, and referrer protections.
4. **Adaptive Rate Limiting:** `express-rate-limit` throttles brute-force attempts across sensitive authentication routes (`/api/auth/*`), assessment generation, and AI proctoring services.
5. **CORS Hardening:** Cross-Origin Resource Sharing is strictly whitelisted to production frontend domains (`https://disheera.site`, `https://*.disheera.site`) and local development ports (`http://localhost:5500`, `http://localhost:5000`).
6. **PostgreSQL Row Level Security (RLS):** All public tables enforce Supabase PostgreSQL RLS policies isolating student records, corporate vacancies, and audit logs.
7. **1:1 Strict Mobile Uniqueness Guard:** Enforced via a PostgreSQL partial unique index (`User_phone_unique_not_empty`) ensuring each mobile number maps to exactly one account with zero collisions across phone takeovers.
8. **Proctored Anti-Cheat Security:** Web-based proctoring chamber featuring real-time tab switch detection, browser blur listeners, strike counters, and tamper-resistant milestone submission hashes.
9. **Zero-Vulnerability Dependency Baseline:** Continuous vulnerability hygiene maintained across all root, client, and backend packages (`npm audit` reporting 0 vulnerabilities).

---

## 🔍 Independent Penetration Testing (Strix AI Audit — Oct 2026)

An automated offensive security penetration test was executed against Disheera's live deployments (`https://disheera.site` & `https://api.disheera.site`) using the **Strix Multi-Agent Cybersecurity Platform (v1.7.0)** conforming to the **OWASP Web Security Testing Guide (WSTG)**:

- **Overall Risk Rating:** **Low to Moderate (Production Grade)**
- **Exploitable Vulnerabilities:** **0 Detected (VERIFIED PASS)**
- **Verified Protections:**
  - ✅ **Authentication:** Unsigned, tampered, and `alg:none` JWT bypass attempts rejected.
  - ✅ **Injection & SSRF:** Zero SQLi, SSRF, or system prompt extraction on `/api/chat` and `/api/interview`.
  - ✅ **File Upload:** Secure PDF processing on `/api/resume/upload` without path traversal or execution bugs.
  - ✅ **Boundary Isolation:** Strict routing defenses, zero unauthorized directory exposures.

For full technical analysis and methodology, see [`docs/STRIX_SECURITY_AUDIT_REPORT.md`](docs/STRIX_SECURITY_AUDIT_REPORT.md).

---

## 🔒 Enterprise Compliance & Production Hardening Roadmap

Disheera is continuously expanding enterprise governance for university institutions and hiring partners:

- **HttpOnly Secure Session Cookies:** Transitioning client session tokens to HttpOnly, SameSite=Strict cookies with automated rotation.
- **Enterprise SSO / SAML 2.0:** Single Sign-On integration for partner universities and enterprise corporate recruiters.
- **Data Encryption at Rest:** AES-256 field-level encryption for student academic transcripts and institutional assessments.
- **SOC 2 Type II & ISO 27001 Alignment:** Establishing formal compliance logging, audit trails, and automated access reviews.
- **Continuous CI/CD Security Scanning:** Automated SAST/DAST pipelines and Dependabot security updates on every pull request.

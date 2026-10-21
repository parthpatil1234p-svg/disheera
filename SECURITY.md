# Security Policy — Disheera

> **Hack2Ignite 2026–27 · Team 404 Brain Not Found**

The security and privacy of student data are paramount to Disheera. This document outlines our security policies, vulnerability reporting procedure, and architecture safeguards.

---

## 🔒 Prohibited Data (Never Commit to Git)

The following items must **never** be committed to source control or logged in cleartext:

- MongoDB connection strings containing database credentials (`mongodb+srv://...`).
- JWT signing secrets (`JWT_SECRET`).
- Third-party API keys (e.g., Gemini API, Cloudinary keys, OAuth tokens).
- Plaintext student passwords or hashes in static seed files.
- Real `.env` or `.env.production` files.
- Personally Identifiable Information (PII) of real users.

All local configuration must be managed through `server/.env` (excluded by `.gitignore`).

---

## 📢 Vulnerability Reporting Procedure

If you discover a potential vulnerability or security flaw in Disheera:

1. **Do not create a public GitHub issue.**
2. Report the vulnerability privately to **Parth Patil (Team Leader)** or via the private team communication channel.
3. Provide:
   - Description of the vulnerability.
   - Affected endpoint, component, or file.
   - Minimal reproduction steps or proof-of-concept payload.
   - Suggested remediation (if known).

The team lead will review and triage the issue within 4 hours during active hackathon phases.

---

## 🛡️ Current MVP Security Measures

For the Hack2Ignite Round 1 MVP, the following baseline security controls are active:

1. **Password Hashing:** Passwords are salted and hashed using `bcryptjs` with 10 salt rounds before database persistence.
2. **Stateless Authentication:** JSON Web Tokens (JWT) signed with HMAC-SHA256 and configured with 7-day expiration.
3. **HTTP Security Headers:** Integrated `helmet` middleware setting `X-Content-Type-Options`, `X-Frame-Options`, and referrer policies.
4. **Rate Limiting:** `express-rate-limit` throttles brute-force attempts on sensitive endpoints.
5. **CORS Hardening:** Cross-Origin Resource Sharing is locked down to authorized frontend origins and localhost.
6. **PostgreSQL Row Level Security (RLS):** All public tables enforce Supabase PostgreSQL RLS policies isolating student records, corporate vacancies, and audit logs.
7. **1:1 Mobile Uniqueness Guard:** Database partial unique index (`User_phone_unique_not_empty`) prevents duplicate accounts or phone takeovers.
8. **Dependency Security Hygiene:** Continuous zero-vulnerability security baseline maintained across all dependencies (`npm audit` 0 vulnerabilities).

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

## ⚠️ MVP Architecture Notice & Future Production Hardening

> **Educational Hackathon Context:** For this 48-hour prototype, JWT tokens are stored in browser `localStorage` to facilitate multi-page client-side authentication without an active domain cookie policy.

For commercial production deployment, the following enhancements are planned:
- **HttpOnly Cookies:** Migrate JWT storage to secure, HttpOnly, SameSite cookies to defend against Cross-Site Scripting (XSS).
- **CSRF Protection:** Implement double-submit cookie verification or anti-CSRF tokens.
- **Enhanced Rate Limiting:** Redis-backed distributed rate limiters across all API routes.
- **Data Minimization:** Encrypt student assessment records at rest using AES-256.
- **Automated Dependency Audits:** Continuous integration pipeline running `npm audit` and Snyk security scans on every commit.

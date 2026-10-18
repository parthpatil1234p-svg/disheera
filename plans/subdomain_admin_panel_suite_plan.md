# IMPLEMENTATION PLAN: DISHEERA SUBDOMAIN ADMIN PANEL (`admin.disheera.site`)
**Plan Number:** Plan 45  
**Version:** 1.2.0 (Strict Security & Operational Hardening Edition)  
**Status:** ⏳ Ready for User Approval / Execution  
**Target Domains:** Production: `https://admin.disheera.site` | Local Dev: `http://localhost:5501`  
**API Prefix:** `/api/admin/*` (Strict Host-Guarded & Multi-Layer RBAC)  
**Database:** Pure Supabase PostgreSQL via Prisma ORM (`prisma migrate dev`)  

---

## 1. Executive Summary & Core Requirements

Disheera requires a dedicated, secure, and physically isolated Admin Panel served **ONLY** on the subdomain `https://admin.disheera.site` (dev: `http://localhost:5501`). The public domain `https://disheera.site` must **NEVER** serve the admin UI or expose admin authentication endpoints.

### Non-Negotiable Security Tenets (v1.2 Hardened):
1. **Environment-Aware Cookie Naming & Security:**
   - **Production (`NODE_ENV === 'production'`):** Cookie name is `__Host-disheera_admin_session` with `Secure: true`, `HttpOnly: true`, `SameSite: 'Strict'`, `Path: '/'`, and NO `Domain` attribute (host-only cookie, mathematically blocked from `disheera.site`).
   - **Local Development (`NODE_ENV === 'development'`):** Cookie name is `disheera_admin_session` (no `__Host-` prefix) with `Secure: false`, since browsers strictly reject `__Host-` cookies on plain-HTTP `localhost`.
2. **Multi-Layer Defense & Reverse Proxy Trust:**
   - Layer 1: Host/Origin checks (`adminHostGuard.js`).
   - Layer 2: Dedicated Admin JWT verification.
   - Layer 3: Active `admin_sessions` database lookup (checks `tokenHash` for instantaneous revocation).
   - Layer 4: Active `admin_users` record check (`isActive`, `lockedUntil`, `mustChangePassword`).
   - Layer 5: RBAC Permission Matrix (`SUPER_ADMIN > ADMIN > MODERATOR`).
   - Reverse proxy configuration: Express `app.set('trust proxy', 1)` reads `X-Forwarded-Host` and `X-Forwarded-Proto` reliably behind Render and Vercel.
3. **Two-Tier Brute-Force & Denial-of-Service Defense:**
   - **Tier 1 (IP Rate Limiting):** Strict rate-limiter applied **ONLY** to `/api/admin/auth/login` (max **20 requests per 15 minutes per IP**). Regular authenticated `/api/admin/*` routes are NOT subject to this login limiter to avoid degrading operational administrative workflows.
   - **Tier 2 (Account Lockout):** Tracked in `admin_users` table (`failedLoginAttempts`, `lockedUntil`). 5 consecutive failed attempts on an admin email triggers an automated 15-minute lock.
   - **Lockout DoS Mitigation & Emergency Unlock CLI:** A malicious actor could attempt to intentionally lock out the Super Admin by submitting 5 incorrect passwords. All attempts are recorded in `admin_login_attempts`. An emergency CLI unlock script (`server/scripts/unlockAdmin.js`, wired to `npm run admin:unlock -- <email>`) immediately resets `failedLoginAttempts = 0` and clears `lockedUntil = null`.
4. **Physical Table Isolation (`admin_users` & `admin_sessions`):**
   - Administrators reside strictly in a separate `admin_users` table. The public `users` table is never queried for admin logins, eliminating privilege escalation.
   - Active tokens are tracked in `admin_sessions` using a SHA-256 hash (`tokenHash`). On logout or session invalidation, the session record is deleted, instantaneously terminating access across all browser tabs.
5. **Hardened Super Admin Seeding (`seedAdmin.js`):**
   - **Zero Hardcoded Fallbacks:** Both `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` must be provided in `.env`. The script must crash immediately (`process.exit(1)`) if either variable is missing or blank.
   - Password hashed with `bcrypt` cost factor 12.
   - `mustChangePassword = true` enforced on initial login.
6. **Mandatory Dedicated `ADMIN_JWT_SECRET` (Zero Fallbacks):**
   - Server startup validation in `server.js` strictly requires `process.env.ADMIN_JWT_SECRET`.
   - Must be at least 32 characters long (`ADMIN_JWT_SECRET.length >= 32`).
   - Must **NOT** equal `JWT_SECRET` (prevents cross-portal token forgery).
   - **Zero Fallback Allowed:** The server unconditionally aborts startup (`process.exit(1)`) if `ADMIN_JWT_SECRET` is missing, too short, or equals `JWT_SECRET`.
7. **Strict Env-Driven CORS from Phase 1:**
   - `ALLOWED_ORIGINS` loaded strictly from `.env` as an exact allowlist (no wildcards permitted for admin routes).
8. **Phase 1 Acceptance Testing:**
   - Tests focus on Phase 1 endpoints (`/api/admin/auth/me` and `/api/admin/auth/change-password`), asserting that student tokens, recruiter tokens, and main-domain cookies receive 401/403. Phase 2 endpoints (like `/dashboard/stats`) are NOT invoked in Phase 1 tests.
9. **Prisma Migrations:**
   - Database schema changes are executed strictly via `npx prisma migrate dev --name add_admin_system` (preserving migration history and Supabase PostgreSQL schema integrity; never `db push`).

---

## 2. Technical Architecture & Defense-in-Depth Topology

```mermaid
flowchart TD
    subgraph Clients
        STD["Student / Recruiter Browser<br/>(disheera.site / localhost:5500)"]
        ADM["Super Admin / Admin Browser<br/>(admin.disheera.site / localhost:5501)"]
    end

    subgraph Reverse Proxy / CDN
        RP["Vercel / Render Reverse Proxy<br/>(appends X-Forwarded-Host, X-Forwarded-Proto)"]
    end

    subgraph Express Backend (:5000)
        TP["app.set('trust proxy', 1)"]
        HG["Layer 1: adminHostGuard Middleware<br/>(Checks Host / X-Forwarded-Host & Origin)"]
        
        subgraph Login Path Only
            IP_RL["Layer 2: IP-Level Rate Limiter<br/>(20 req / 15 min per IP ONLY on /auth/login)"]
        end
        
        subgraph Authenticated Admin Routes
            JWT_MD["Layer 3: verifyAdminToken Middleware<br/>(Reads cookie or Bearer, verifies ADMIN_JWT_SECRET)"]
            SESS_MD["Layer 4: admin_sessions TokenHash Check<br/>(Verifies active non-expired session for instant revocation)"]
            DB_LK["Layer 5: admin_users Active Check<br/>(Checks isActive, lockedUntil, mustChangePassword)"]
            RBAC["Layer 6: requireAdminRole Matrix<br/>(SUPER_ADMIN > ADMIN > MODERATOR)"]
            API["Admin Route Handlers<br/>(/api/admin/*)"]
        end
    end

    subgraph Database (Supabase PostgreSQL)
        A_TAB[("admin_users Table")]
        S_TAB[("admin_sessions Table")]
        L_TAB[("admin_login_attempts Table")]
        LOGS[("admin_audit_logs Table")]
    end

    STD -->|Tries /api/admin/*| RP
    ADM -->|Accesses /api/admin/*| RP
    RP --> TP --> HG

    HG -->|Host != admin.disheera.site| REJ1["403 Forbidden<br/>ADMIN_SUBDOMAIN_ONLY"]
    HG -->|Host == admin.disheera.site & /auth/login| IP_RL
    HG -->|Host == admin.disheera.site & Authenticated Routes| JWT_MD

    IP_RL -->|Too many attempts| REJ2["429 Too Many Requests"]
    IP_RL -->|Within limits| A_TAB
    IP_RL -.->|Record attempt| L_TAB

    JWT_MD -->|Student/Recruiter Token or Invalid| REJ3["401 Unauthorized<br/>INVALID_ADMIN_TOKEN"]
    JWT_MD -->|Valid Token Signature| SESS_MD

    SESS_MD -->|Session Revoked / Deleted| REJ4["401 Unauthorized<br/>SESSION_REVOKED"]
    SESS_MD -->|Active Session Found| DB_LK

    DB_LK -->|Account Locked / Inactive| REJ5["403 Forbidden<br/>ACCOUNT_LOCKED"]
    DB_LK -->|Active Admin| RBAC

    RBAC -->|Insufficient Role| REJ6["403 Forbidden<br/>INSUFFICIENT_PERMISSIONS"]
    RBAC -->|Authorized| API

    API --> A_TAB
    API -.->|Record action| LOGS
```

---

## 3. Database Schema Design (Pure Supabase PostgreSQL)

```prisma
// server/prisma/schema.prisma additions

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
}

model AdminUser {
  id                  String             @id @default(uuid())
  name                String
  email               String             @unique
  password            String             // bcrypt cost 12
  role                AdminRole          @default(MODERATOR)
  mustChangePassword  Boolean            @default(true)
  totpSecret          String?
  totpEnabled         Boolean            @default(false)
  failedLoginAttempts Int                @default(0)
  lockedUntil         DateTime?
  isActive            Boolean            @default(true)
  lastLoginAt         DateTime?
  lastLoginIp         String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  auditLogs           AdminAuditLog[]
  sessions            AdminSession[]

  @@map("admin_users")
}

model AdminSession {
  id        String    @id @default(uuid())
  adminId   String
  tokenHash String    @unique            // SHA-256 of JWT for instant revocation
  ipAddress String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  admin     AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([expiresAt])
  @@map("admin_sessions")
}

model AdminAuditLog {
  id         String     @id @default(uuid())
  adminId    String
  adminEmail String
  action     String     // e.g., "USER_SUSPEND", "RECRUITER_VERIFY", "PASSPORT_REVOKE", "VIDEO_ADD", "RADAR_UPDATE"
  targetType String     // "USER", "RECRUITER", "PASSPORT", "COURSE", "RADAR", "SYSTEM"
  targetId   String?
  details    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime   @default(now())

  admin      AdminUser  @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([action])
  @@index([createdAt])
  @@map("admin_audit_logs")
}

model AdminLoginAttempt {
  id          String    @id @default(uuid())
  email       String
  ipAddress   String
  success     Boolean
  reason      String?   // "INVALID_CREDENTIALS", "ACCOUNT_LOCKED", "INACTIVE_ACCOUNT"
  attemptedAt DateTime  @default(now())

  @@index([email])
  @@index([ipAddress])
  @@index([attemptedAt])
  @@map("admin_login_attempts")
}
```

---

## 4. Phased Implementation Plan

### Phase 1: Security Foundation, Host Guard, Super Admin Seeder, Session Revocation & Tests
**Focus:** Host-checking with reverse proxy trust, Prisma migration via `migrate dev`, zero-fallback seeder, server startup validation for `ADMIN_JWT_SECRET`, cookie & `AdminSession` token-hash verification, two-tier brute-force defenses (20 req/15 min on `/login` only), emergency unlock CLI, strict CORS allowlist, and Phase 1 route isolation tests.

#### Files to Create / Modify:
1. **[MODIFY] `server/prisma/schema.prisma`**
   - Add `AdminRole` enum, `AdminUser`, `AdminSession`, `AdminAuditLog`, and `AdminLoginAttempt` models.
   - Run `npx prisma migrate dev --name add_admin_system` and `npx prisma generate`.
2. **[NEW] `server/middleware/adminHostGuard.js`**
   - Resolves effective host: `req.headers['x-forwarded-host'] || req.headers.host`.
   - Resolves effective origin: `req.headers.origin || req.headers.referer`.
   - Allowed hosts:
     - Production: `admin.disheera.site`
     - Development (`NODE_ENV === 'development'`): `localhost:5501`, `127.0.0.1:5501`
   - Rejects unauthorized hosts immediately with `403 ADMIN_SUBDOMAIN_ONLY`.
3. **[NEW] `server/middleware/adminAuthMiddleware.js`**
   - Resolves cookie name dynamically:
     ```javascript
     const isProd = process.env.NODE_ENV === 'production';
     const COOKIE_NAME = isProd ? '__Host-disheera_admin_session' : 'disheera_admin_session';
     ```
   - Extracts cookie or `Authorization: Bearer` header.
   - Verifies JWT using `process.env.ADMIN_JWT_SECRET` (strictly no fallbacks).
   - Computes `crypto.createHash('sha256').update(token).digest('hex')`.
   - Queries `prisma.adminSession` for active session (`tokenHash` match and `expiresAt > now()`). If absent, returns `401 SESSION_REVOKED`.
   - Unconditionally rejects student/recruiter tokens with `401 INVALID_ADMIN_TOKEN`.
   - Fetches active admin from `prisma.adminUser`; rejects if `isActive === false` or `lockedUntil > now()`.
   - `requireAdminRole(allowedRoles)` middleware enforcing role hierarchy (`SUPER_ADMIN > ADMIN > MODERATOR`).
4. **[NEW] `server/controllers/adminAuthController.js`**
   - Dedicated login rate limiter applied **ONLY** to `/api/admin/auth/login`:
     ```javascript
     const adminLoginLimiter = rateLimit({
       windowMs: 15 * 60 * 1000,
       max: 20, // 20 requests per 15 minutes per IP
       standardHeaders: true,
       legacyHeaders: false,
       message: { success: false, code: 'LOGIN_RATE_LIMIT_EXCEEDED', message: 'Too many login attempts. Please wait 15 minutes.' }
     });
     ```
   - Account lockout check: if `admin.lockedUntil && admin.lockedUntil > new Date()`, log to `admin_login_attempts` and return `403 ACCOUNT_LOCKED`.
   - Password verification: `bcrypt.compare(password, admin.password)`.
     - On failure: increment `failedLoginAttempts`. If $\ge 5$, set `lockedUntil = now + 15 min`. Log to `admin_login_attempts`.
     - On success: reset `failedLoginAttempts = 0`, clear `lockedUntil`, update `lastLoginAt` and `lastLoginIp`. Log to `admin_login_attempts`.
     - Create `AdminSession` record in DB storing `tokenHash`, `ipAddress`, `userAgent`, and `expiresAt`.
   - Issue host-only cookie with environment flag:
     ```javascript
     res.cookie(COOKIE_NAME, token, {
       httpOnly: true,
       secure: isProd, // false on localhost dev, true in prod
       sameSite: 'strict',
       path: '/',
       maxAge: 8 * 60 * 60 * 1000 // 8 hours
     });
     ```
   - `POST /api/admin/auth/logout`: Computes `tokenHash`, deletes row from `prisma.adminSession`, clears cookie, returns 200.
   - `GET /api/admin/auth/me`: Returns sanitized admin profile, permissions, and `mustChangePassword` flag.
   - `POST /api/admin/auth/change-password`: Validates old password, hashes new password (min 10 chars, bcrypt 12), sets `mustChangePassword = false`, logs audit trail.
5. **[NEW] `server/prisma/seedAdmin.js`**
   - Idempotent script for `npm run seed:admin`.
   - **Zero Hardcoded Fallbacks:**
     ```javascript
     const email = process.env.ADMIN_SEED_EMAIL;
     const password = process.env.ADMIN_SEED_PASSWORD;
     if (!email || !email.trim()) {
       console.error('[FATAL] ADMIN_SEED_EMAIL is missing in .env. Admin seeding aborted.');
       process.exit(1);
     }
     if (!password || password.trim().length < 8) {
       console.error('[FATAL] ADMIN_SEED_PASSWORD is missing or too short (< 8 chars) in .env. Admin seeding aborted.');
       process.exit(1);
     }
     ```
   - Hashes password with `bcrypt.hash(password, 12)`.
   - Upserts into `prisma.adminUser` with `role: 'SUPER_ADMIN'` and `mustChangePassword: true`.
6. **[NEW] `server/scripts/unlockAdmin.js`**
   - Emergency CLI unlock utility:
     ```javascript
     // Usage: node server/scripts/unlockAdmin.js <email>
     // Or: npm run admin:unlock -- <email>
     ```
   - Looks up `AdminUser` by email, resets `failedLoginAttempts: 0`, `lockedUntil: null`.
   - Logs an administrative unlock event in `admin_audit_logs`.
7. **[MODIFY] `server/server.js`**
   - Configure proxy trust: `app.set('trust proxy', 1)`.
   - **Startup Environment Validation for Admin Security:**
     ```javascript
     const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
     if (!adminJwtSecret || adminJwtSecret.length < 32) {
       console.error('\n🛑 [FATAL] STARTUP ABORTED: ADMIN_JWT_SECRET must be configured with at least 32 characters in .env.');
       process.exit(1);
     }
     if (adminJwtSecret === process.env.JWT_SECRET) {
       console.error('\n🛑 [FATAL] STARTUP ABORTED: ADMIN_JWT_SECRET must NOT be identical to JWT_SECRET.');
       process.exit(1);
     }
     ```
   - Parse `process.env.ALLOWED_ORIGINS` (comma-separated allowlist, zero wildcards for admin endpoints).
   - Mount `adminHostGuard` on `/api/admin/*`.
   - Mount `adminAuthRoutes` on `/api/admin/auth`.
8. **[MODIFY] `package.json` & `server/package.json`**
   - Add `"seed:admin": "node server/prisma/seedAdmin.js"`.
   - Add `"admin:unlock": "node server/scripts/unlockAdmin.js"`.
   - Add `"admin:serve": "npx --yes serve admin-client -p 5501"`.
   - Update `"start"`: Concurrently orchestrate Backend (:5000), Client (:5500), and Admin Client (:5501).
9. **[MODIFY] `.env.example`**
   - Add `ADMIN_SEED_EMAIL="your-admin-email@domain.com"`, `ADMIN_SEED_PASSWORD="your-strong-password-min-8-chars"`, `ADMIN_JWT_SECRET="your-dedicated-admin-secret-at-least-32-chars"`, `ALLOWED_ORIGINS="https://disheera.site,https://admin.disheera.site,http://localhost:5500,http://localhost:5501"`.
10. **[NEW] `tests/admin_subdomain_isolation_test.js`**
    - Phase 1 specific automated test suite asserting:
      1. Student JWT token gets 401 on `/api/admin/auth/me` and `/api/admin/auth/change-password`.
      2. Recruiter JWT token gets 401 on `/api/admin/auth/me` and `/api/admin/auth/change-password`.
      3. Main-domain session cookie gets 401 on all `/api/admin/*` endpoints.
      4. Request with `Host: disheera.site` gets 403 `ADMIN_SUBDOMAIN_ONLY`.
      5. Request with `Host: admin.disheera.site` (or `localhost:5501` in dev) passes host guard.
      6. Super Admin seeder crashes when `ADMIN_SEED_EMAIL` or `ADMIN_SEED_PASSWORD` is missing.
      7. Server crashes at startup if `ADMIN_JWT_SECRET` is missing, < 32 chars, or equals `JWT_SECRET`.
      8. 5 consecutive wrong passwords lock the account for 15 minutes.
      9. `unlockAdmin.js` successfully clears lockout state.
      10. Logging out deletes the session from `admin_sessions`, causing subsequent requests with that token to be rejected with 401 `SESSION_REVOKED`.

---

### Phase 2: Core Admin UI Shell, Dashboard & User/Recruiter Management
**Focus:** Dark glassmorphic interface, KPI metrics, student management, and recruiter verification.

#### Files to Create / Modify:
1. **[NEW] `careerpath-ai/admin-client/robots.txt`**
   - `User-agent: * \n Disallow: /`.
2. **[NEW] `careerpath-ai/admin-client/index.html`**
   - Responsive admin dashboard shell with collapsible sidebar, Super Admin badge, toast container, confirm modal dialogs.
3. **[NEW] `careerpath-ai/admin-client/login.html`**
   - Dark luxury login portal with lockout countdown timer and forced password change modal.
4. **[NEW] `careerpath-ai/admin-client/css/admin.css`**
   - Glassmorphic dark design system (deep slate backgrounds, neon cyan/violet accents, frosted glass panels, responsive data-tables, badge pills).
5. **[NEW] `careerpath-ai/admin-client/js/admin-api.js`**
   - Fetch client with credentials handling, error interceptors, and automatic redirect on 401/403.
6. **[NEW] `careerpath-ai/admin-client/js/admin-auth.js`**
   - Authentication lifecycle, session validation, logout, and forced password reset handler.
7. **[NEW] `server/controllers/adminDashboardController.js` & `server/routes/adminDashboardRoutes.js`**
   - `GET /api/admin/dashboard/stats`: KPI aggregations (total users, daily signups, active roadmap learners, recruiters, pending approvals, job postings, test attempts).
8. **[NEW] `server/controllers/adminUserController.js` & `server/routes/adminUserRoutes.js`**
   - `GET /api/admin/users`: Paginated, searchable (name, email, role, stream), filter by verified/suspended.
   - `GET /api/admin/users/:id`: Complete student dossier (profile, roadmap, attempts, passport, resume).
   - `PATCH /api/admin/users/:id/suspend`: Toggle account suspension (`isSuspended`).
   - `DELETE /api/admin/users/:id`: Safe account deactivation (SUPER_ADMIN only).
9. **[NEW] `server/controllers/adminRecruiterController.js` & `server/routes/adminRecruiterRoutes.js`**
   - `GET /api/admin/recruiters`: List recruiter accounts and verification statuses.
   - `POST /api/admin/recruiters/:id/approve`: Approve recruiter account and issue verified corporate badge.
   - `POST /api/admin/recruiters/:id/reject`: Reject with rejection reason notification.

---

### Phase 3: Domain Modules (Skill Passport, Video Content, Radar & Roadmaps)
**Focus:** Control panels for Plans 41, 43, 44, and assessment oversight.

#### Files to Create / Modify:
1. **[NEW] `server/controllers/adminPassportController.js` & `server/routes/adminPassportRoutes.js`**
   - List issued Skill Passports, verify cryptographic signatures, revoke compromised credentials.
   - Inspect QR code verification scan telemetry.
2. **[NEW] `server/controllers/adminContentController.js` & `server/routes/adminContentRoutes.js`**
   - CRUD for Curated Masterclasses (Plan 43): Add/edit/disable YouTube videos, bilingual metadata (Hindi/English tags), duration, instructor name.
3. **[NEW] `server/controllers/adminRadarController.js` & `server/routes/adminRadarRoutes.js`**
   - CRUD for 60+ Industrial Radar Employers (Plan 44): Name, coordinates (`latitude`, `longitude`), industrial cluster (MIDC Jalgaon, Chakan, Hinjewadi, Whitefield), hiring domains.
4. **[NEW] `server/controllers/adminRoadmapController.js` & `server/routes/adminRoadmapRoutes.js`**
   - View top generated career tracks, flag anomalous test scores or anti-cheat lockouts.
5. **[NEW] `careerpath-ai/admin-client/js/modules/`**
   - `passportsView.js`: Digital credential inspector.
   - `contentView.js`: Video masterclass management grid.
   - `radarView.js`: Employer coordinate manager with visual cluster tags.
   - `roadmapsView.js`: Student progression monitor.

---

### Phase 4: Auditing, WhatsApp Alerts, Hardening & Deployment
**Focus:** Audit log viewer, system telemetry, admin management, and deployment setup.

#### Files to Create / Modify:
1. **[NEW] `server/controllers/adminAuditController.js` & `server/routes/adminAuditRoutes.js`**
   - `GET /api/admin/audit-logs`: Searchable by admin email, action type, date range.
2. **[NEW] `server/controllers/adminAlertController.js` & `server/routes/adminAlertRoutes.js`**
   - Integration with WhatsApp / n8n (Plan 40): Broadcast announcement, view notification queue and delivery metrics.
3. **[NEW] `server/controllers/adminSystemController.js` & `server/routes/adminSystemRoutes.js`**
   - `GET /api/admin/system/health`: DB query latency, server memory/CPU uptime, Gemini API rate-limit headroom.
4. **[NEW] `server/controllers/adminManagementController.js` & `server/routes/adminManagementRoutes.js`**
   - `GET /api/admin/admins`: List sub-admins (SUPER_ADMIN only).
   - `POST /api/admin/admins`: Create new `ADMIN` or `MODERATOR`.
   - `PATCH /api/admin/admins/:id/toggle-active`: Deactivate sub-admin.
5. **[MODIFY] `server/server.js`**
   - Mount security headers: `X-Robots-Tag: noindex, nofollow, noarchive` for `/api/admin/*`.
6. **[NEW] `careerpath-ai/admin-client/vercel.json`**
   - Static hosting configuration for Vercel deployment of `admin.disheera.site`:
     ```json
     {
       "headers": [
         {
           "source": "/(.*)",
           "headers": [
             { "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive" },
             { "key": "X-Frame-Options", "value": "DENY" },
             { "key": "X-Content-Type-Options", "value": "nosniff" }
           ]
         }
       ],
       "rewrites": [
         { "source": "/api/(.*)", "destination": "https://api.disheera.site/api/$1" }
       ]
     }
     ```
7. **[NEW] `docs/ADMIN_DEPLOYMENT_GUIDE.md`**
   - Complete DNS CNAME instructions for `admin.disheera.site`, SSL cert verification, and environment checklist.

---

## 5. Acceptance Criteria & Verification Strategy

| Verification Area | Test Command / Action | Expected Outcome |
| :--- | :--- | :--- |
| **Cross-Role Token Rejection** | `node tests/admin_subdomain_isolation_test.js` | Student & Recruiter tokens get `401 INVALID_ADMIN_TOKEN` on `/api/admin/auth/me` and `/api/admin/auth/change-password` |
| **Main-Domain Cookie Rejection** | `node tests/admin_subdomain_isolation_test.js` | Main domain session cookies are completely ignored on admin routes |
| **Host-Guard Protection** | `node tests/admin_subdomain_isolation_test.js` | Requests with `Host: disheera.site` receive `403 ADMIN_SUBDOMAIN_ONLY` |
| **Dev vs Prod Cookie Naming** | Unit check in `adminAuthMiddleware.js` | `disheera_admin_session` in dev (HTTP); `__Host-disheera_admin_session` in prod (HTTPS) |
| **Zero-Fallback Seeder Guard** | Run `seedAdmin.js` without `ADMIN_SEED_EMAIL` or `ADMIN_SEED_PASSWORD` | Process immediately crashes with code 1; no default accounts created |
| **Strict ADMIN_JWT_SECRET Guard** | Start server without `ADMIN_JWT_SECRET` or with identical `JWT_SECRET` | Server startup immediately aborts with fatal error; refuses to boot |
| **Session Revocation on Logout** | Call `/api/admin/auth/logout` | `AdminSession` row deleted; immediate subsequent request with old token returns `401 SESSION_REVOKED` |
| **Brute-Force Account Lockout** | 5 consecutive wrong passwords | Account locked for 15 minutes (`403 ACCOUNT_LOCKED`) and recorded in `admin_login_attempts` |
| **Emergency Unlock CLI** | `npm run admin:unlock -- <email>` | Resets `failedLoginAttempts = 0`, clears `lockedUntil`, logs to audit trail |
| **Full Regression Suite** | `npm test` | Existing test suite passes with 0 errors |
| **Local Run Integrity** | `npm start` | Concurrently serves Backend (`:5000`), Student Client (`:5500`), and Admin Client (`:5501`) |

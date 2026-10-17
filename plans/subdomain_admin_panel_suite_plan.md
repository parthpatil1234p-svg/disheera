# IMPLEMENTATION PLAN: DISHEERA SUBDOMAIN ADMIN PANEL (`admin.disheera.site`)
**Plan Number:** Plan 45  
**Version:** 1.1.0 (Hardened Security Edition)  
**Status:** ⏳ Ready for User Approval / Execution  
**Target Domains:** Production: `https://admin.disheera.site` | Local Dev: `http://localhost:5501`  
**API Prefix:** `/api/admin/*` (Strict Host-Guarded & Multi-Layer RBAC)  
**Database:** Pure Supabase PostgreSQL via Prisma ORM  

---

## 1. Executive Summary & Core Requirements

Disheera requires a dedicated, secure, and physically isolated Admin Panel served **ONLY** on the subdomain `https://admin.disheera.site` (dev: `http://localhost:5501`). The public domain `https://disheera.site` must **NEVER** serve the admin UI or expose admin authentication endpoints.

### Non-Negotiable Security Tenets (User-Reviewed & Approved):
1. **Environment-Aware Cookie Naming & Security:**
   - **Production (`NODE_ENV === 'production'`):** Cookie name is `__Host-disheera_admin_session` with `Secure: true`, `HttpOnly: true`, `SameSite: 'Strict'`, `Path: '/'`, and NO `Domain` attribute (host-only cookie, mathematically blocked from `disheera.site`).
   - **Local Development (`NODE_ENV === 'development'`):** Cookie name is `disheera_admin_session` (no `__Host-` prefix) with `Secure: false`, since browsers strictly reject `__Host-` cookies on plain-HTTP `localhost`.
2. **Multi-Layer Defense-in-Depth:**
   - Host/Origin checks serve as Layer 1 (edge routing filter).
   - Core authorization is enforced by:
     $$\text{Admin JWT Verification} \longrightarrow \text{Active } \texttt{admin\_users} \text{ DB Lookup} \longrightarrow \text{RBAC Permission Matrix}$$
   - Reverse proxy configuration: Express `app.set('trust proxy', 1)` reads `X-Forwarded-Host` and `X-Forwarded-Proto` reliably behind Render and Vercel.
3. **Two-Tier Brute-Force & Denial-of-Service Defense:**
   - **Tier 1 (IP Rate Limiting):** Strict rate-limiter on `/api/admin/auth/login` (max 5 requests per 15 minutes per IP address) to stop distributed denial of service and credential stuffing.
   - **Tier 2 (Account Lockout):** Tracked in `admin_users` table (`failedLoginAttempts`, `lockedUntil`). 5 consecutive failed attempts on an admin email triggers an automated 15-minute lock.
4. **Physical Table Isolation (`admin_users`):**
   - Administrators reside strictly in a separate `admin_users` table. The public `users` table is never queried for admin logins, eliminating privilege escalation.
5. **Hardened Super Admin Seeding (`seedAdmin.js`):**
   - Email: `parthpatil1234p@gmail.com` | Role: `SUPER_ADMIN`.
   - **Zero Default Passwords:** The script must explicitly crash (`process.exit(1)`) if `ADMIN_SEED_PASSWORD` is missing from `.env`. No hardcoded fallback passwords exist anywhere in code, plans, or commits.
   - Password hashed with `bcrypt` cost factor 12.
   - `mustChangePassword = true` enforced on initial login.
6. **Strict Env-Driven CORS from Phase 1:**
   - `ALLOWED_ORIGINS` loaded strictly from `.env` as an exact allowlist (no wildcards permitted for admin routes).
7. **Acceptance Testing Suite:**
   - Mandatory test suite verifying that student tokens, recruiter tokens, and main-domain cookies receive 401/403 on every `/api/admin/*` route.

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
        IP_RL["Layer 2: IP-Level Rate Limiter<br/>(5 req / 15 min per IP)"]
        JWT_MD["Layer 3: verifyAdminToken Middleware<br/>(Reads cookie or Bearer, verifies type='admin_session')"]
        DB_LK["Layer 4: admin_users Active Check<br/>(Checks isActive, lockedUntil, mustChangePassword)"]
        RBAC["Layer 5: requireAdminRole Matrix<br/>(SUPER_ADMIN > ADMIN > MODERATOR)"]
        API["Admin Route Handlers<br/>(/api/admin/*)"]
    end

    subgraph Database (Supabase PostgreSQL)
        A_TAB[("admin_users Table")]
        L_TAB[("admin_login_attempts Table")]
        LOGS[("admin_audit_logs Table")]
    end

    STD -->|Tries /api/admin/*| RP
    ADM -->|Accesses /api/admin/*| RP
    RP --> TP --> HG

    HG -->|Host != admin.disheera.site| REJ1["403 Forbidden<br/>ADMIN_SUBDOMAIN_ONLY"]
    HG -->|Host == admin.disheera.site| IP_RL

    IP_RL -->|Too many attempts| REJ2["429 Too Many Requests"]
    IP_RL -->|Within limits| JWT_MD

    JWT_MD -->|Student/Recruiter Token or Invalid| REJ3["401 Unauthorized<br/>INVALID_ADMIN_TOKEN"]
    JWT_MD -->|Valid Admin Token| DB_LK

    DB_LK -->|Account Locked / Inactive| REJ4["403 Forbidden<br/>ACCOUNT_LOCKED"]
    DB_LK -->|Active Admin| RBAC

    RBAC -->|Insufficient Role| REJ5["403 Forbidden<br/>INSUFFICIENT_PERMISSIONS"]
    RBAC -->|Authorized| API

    API --> A_TAB
    API -.->|Record action| LOGS
    IP_RL -.->|Log attempt| L_TAB
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

model AdminSession {
  id        String    @id @default(uuid())
  adminId   String
  tokenHash String    @unique
  ipAddress String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  admin     AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@map("admin_sessions")
}
```

---

## 4. Phased Implementation Plan

### Phase 1: Security Foundation, Host Guard, Super Admin Seeder & Route Isolation Tests
**Focus:** Host-checking with reverse proxy support, Prisma schema & migration, zero-default password seeder, cookie & JWT auth, two-tier brute-force defenses, strict CORS allowlist, and automated cross-role rejection unit tests.

#### Files to Create / Modify:
1. **[MODIFY] `server/prisma/schema.prisma`**
   - Add `AdminRole` enum, `AdminUser`, `AdminAuditLog`, `AdminLoginAttempt`, and `AdminSession` models.
   - Run `npx prisma generate` and `npx prisma db push`.
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
   - Verifies JWT signed with `ADMIN_JWT_SECRET` (fallback `JWT_SECRET + '_admin'`).
   - Ensures `decoded.type === 'admin_session'`.
   - Unconditionally rejects student/recruiter tokens with `401 INVALID_ADMIN_TOKEN`.
   - Fetches active admin from `prisma.adminUser`; rejects if `isActive === false` or `lockedUntil > now()`.
   - `requireAdminRole(allowedRoles)` middleware implementing role hierarchy (`SUPER_ADMIN > ADMIN > MODERATOR`).
4. **[NEW] `server/controllers/adminAuthController.js`**
   - IP Rate Limiter: 5 attempts per 15 minutes per IP.
   - Account lockout check: if `admin.lockedUntil && admin.lockedUntil > new Date()`, return `403 ACCOUNT_LOCKED`.
   - Password verification: `bcrypt.compare(password, admin.password)`.
     - On failure: increment `failedLoginAttempts`. If $\ge 5$, set `lockedUntil = now + 15 min`.
     - On success: reset `failedLoginAttempts = 0`, update `lastLoginAt` and `lastLoginIp`.
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
   - `POST /api/admin/auth/change-password`: Enforces password update if `mustChangePassword === true`.
5. **[NEW] `server/prisma/seedAdmin.js`**
   - Idempotent script for `npm run seed:admin`.
   - **Zero Default Passwords:**
     ```javascript
     const email = process.env.ADMIN_SEED_EMAIL || 'parthpatil1234p@gmail.com';
     const password = process.env.ADMIN_SEED_PASSWORD;
     if (!password || password.trim().length < 8) {
       console.error('[FATAL] ADMIN_SEED_PASSWORD is not set or too short in .env. Seeding aborted.');
       process.exit(1);
     }
     ```
   - Hashes password with `bcrypt.hash(password, 12)`.
   - Upserts into `prisma.adminUser` with `role: 'SUPER_ADMIN'` and `mustChangePassword: true`.
6. **[MODIFY] `server/server.js`**
   - Configure proxy trust: `app.set('trust proxy', 1)`.
   - Parse `process.env.ALLOWED_ORIGINS` (comma-separated allowlist, zero wildcards).
   - Mount `adminHostGuard` on `/api/admin/*`.
   - Mount `adminAuthRoutes` on `/api/admin/auth`.
7. **[MODIFY] `package.json` & `server/package.json`**
   - Add `"seed:admin": "node server/prisma/seedAdmin.js"`.
   - Add `"admin:serve": "npx --yes serve admin-client -p 5501"`.
   - Update `"start"`: Concurrently orchestrate Backend (:5000), Client (:5500), and Admin Client (:5501).
8. **[MODIFY] `.env.example`**
   - Add `ADMIN_SEED_EMAIL="parthpatil1234p@gmail.com"`, `ADMIN_SEED_PASSWORD="your-strong-password"`, `ADMIN_JWT_SECRET="generate-32-char-random-secret"`, `ALLOWED_ORIGINS="https://disheera.site,https://admin.disheera.site,http://localhost:5500,http://localhost:5501"`.
9. **[NEW] `tests/admin_subdomain_isolation_test.js`**
   - Comprehensive test suite asserting:
     1. Student JWT token gets 401 on `/api/admin/auth/me` and `/api/admin/dashboard/stats`.
     2. Recruiter JWT token gets 401 on `/api/admin/auth/me` and `/api/admin/dashboard/stats`.
     3. Main-domain cookie (`token` or regular session) gets 401 on `/api/admin/*`.
     4. Request with `Host: disheera.site` gets 403 `ADMIN_SUBDOMAIN_ONLY`.
     5. Request with `Host: admin.disheera.site` (or `localhost:5501` in dev) passes host guard.
     6. Super Admin seeder crashes when `ADMIN_SEED_PASSWORD` is missing.
     7. 5 consecutive wrong passwords lock the account for 15 minutes.

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
| **Cross-Role Token Rejection** | `node tests/admin_subdomain_isolation_test.js` | Student & Recruiter tokens get `401 INVALID_ADMIN_TOKEN` on all `/api/admin/*` endpoints |
| **Main-Domain Cookie Rejection** | `node tests/admin_subdomain_isolation_test.js` | Main domain session cookies are completely ignored on admin routes |
| **Host-Guard Protection** | `node tests/admin_subdomain_isolation_test.js` | Requests with `Host: disheera.site` receive `403 ADMIN_SUBDOMAIN_ONLY` |
| **Dev vs Prod Cookie Naming** | Unit check in `adminAuthMiddleware.js` | `disheera_admin_session` in dev (HTTP); `__Host-disheera_admin_session` in prod (HTTPS) |
| **Zero-Default Seeder Guard** | Run `seedAdmin.js` without `ADMIN_SEED_PASSWORD` | Process immediately crashes with error code 1; no accounts created |
| **Idempotent Seeder** | Run `npm run seed:admin` twice | Super Admin updated cleanly; no duplicate key crashes |
| **Brute-Force Account Lockout** | 5 consecutive invalid passwords | Account locked for 15 minutes (`403 ACCOUNT_LOCKED`) |
| **Full Regression Suite** | `npm test` | Existing test suite passes with 0 errors |
| **Local Run Integrity** | `npm start` | Concurrently serves Backend (`:5000`), Student Client (`:5500`), and Admin Client (`:5501`) |

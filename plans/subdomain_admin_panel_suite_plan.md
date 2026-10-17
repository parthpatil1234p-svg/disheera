# IMPLEMENTATION PLAN: DISHEERA SUBDOMAIN ADMIN PANEL (`admin.disheera.site`)
**Plan Number:** Plan 45  
**Version:** 1.0.0  
**Status:** ⏳ Ready for User Approval  
**Target Domains:** Production: `https://admin.disheera.site` | Local Dev: `http://localhost:5501`  
**API Prefix:** `/api/admin/*` (Strict Host-Guarded)  
**Database:** Pure Supabase PostgreSQL via Prisma ORM  

---

## 1. Executive Summary & Core Requirements

Disheera currently operates as a dual-portal platform (Students + Corporate Recruiters) on `disheera.site`. As Disheera transitions into institutional deployments across Maharashtra (Seva / Jalgaon pilot), Lightcast taxonomy expansion, and pan-India industrial radar matching, an **enterprise-grade, separate, and zero-compromise Admin Panel** is required.

### Non-Negotiable Security & Architectural Tenets:
1. **Total Domain & Route Isolation:**
   - The main domain `https://disheera.site` must **NEVER** serve the admin UI or expose admin login routes.
   - The admin panel is served **ONLY** on `https://admin.disheera.site` (dev: `http://localhost:5501`).
   - All admin REST endpoints live under `/api/admin/*`.
   - Host-check middleware strictly rejects requests to `/api/admin/*` unless the incoming `Host` or `Origin` header matches `admin.disheera.site` (or `localhost:5501` in dev).
2. **Physical Storage Separation:**
   - Dedicated frontend directory: `careerpath-ai/admin-client/` (completely decoupled from `careerpath-ai/client/`).
3. **Dedicated Super Admin & Zero Public Signup:**
   - Main Super Admin: `parthpatil1234p@gmail.com` with role `SUPER_ADMIN`.
   - Credentials seeded via `.env` (`ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`).
   - Idempotent database seeder (`server/prisma/seedAdmin.js`) with `bcrypt` cost 12.
   - Forced password change on initial login (`mustChangePassword = true`).
   - Only `SUPER_ADMIN` can provision other administrators (`ADMIN`, `MODERATOR`).
4. **Host-Only Strict Session Security:**
   - Cookie standard: `__Host-disheera_admin_session` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, no `Domain` wildcard).
   - Regular student/recruiter JWTs are unconditionally rejected by admin middleware.
5. **SEO Stealth & Crawler Shielding:**
   - `X-Robots-Tag: noindex, nofollow, noarchive`.
   - `robots.txt` with `User-agent: * \n Disallow: /`.
6. **Local Development Integrity:**
   - Running `npm start` must run Backend (`:5000`), Student Client (`:5500`), and Admin Client (`:5501`) concurrently with zero collision.
   - All tests (`npm test`) must pass with 0 errors.

---

## 2. Technical Architecture & Component Diagrams

### Subdomain Routing & Isolation Topology

```mermaid
flowchart TD
    subgraph Browser Clients
        C1["Student / Recruiter Browser<br/>(disheera.site :5500)"]
        C2["Super Admin / Admin Browser<br/>(admin.disheera.site :5501)"]
    end

    subgraph Network & Host Guard
        HG["Admin Host Guard Middleware<br/>(inspects Host, Origin, x-forwarded-host)"]
    end

    subgraph Disheera Express Backend (:5000)
        PUB["Public APIs<br/>/api/auth/*, /api/roadmaps/*"]
        ADM["Admin APIs<br/>/api/admin/*"]
    end

    subgraph Supabase PostgreSQL
        U_TAB["users table<br/>(Students & Recruiters)"]
        A_TAB["admin_users table<br/>(SUPER_ADMIN, ADMIN, MODERATOR)"]
        LOGS["admin_audit_logs table"]
    end

    C1 -->|Origin: disheera.site| PUB
    C1 -.->|Attempt /api/admin/*| HG
    HG -->|Host != admin.disheera.site| REJ["403 Forbidden<br/>ADMIN_SUBDOMAIN_ONLY"]

    C2 -->|Origin: admin.disheera.site| HG
    HG -->|Host == admin.disheera.site| ADM
    ADM -->|verifyAdminToken & RBAC| A_TAB
    ADM -->|CRUD Operations| U_TAB
    ADM -->|Async Logging| LOGS
    PUB --> U_TAB
```

---

## 3. Database Schema Design (Pure Supabase PostgreSQL)

To prevent privilege escalation and ensure database-level boundary enforcement, administrators will reside in a dedicated `admin_users` table rather than mixing admin flags into the public `users` table.

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

### Phase 1: Security Foundation, Host Guard & Super Admin Auth
**Focus:** Subdomain isolation, database seeding, JWT/Cookie authentication, account lockout, and unit tests.

#### Files to Create / Modify:
1. **[MODIFY] `server/prisma/schema.prisma`**
   - Add `AdminRole` enum, `AdminUser`, `AdminAuditLog`, `AdminLoginAttempt`, and `AdminSession` models.
   - Run `npx prisma generate` and `npx prisma db push`.
2. **[NEW] `server/middleware/adminHostGuard.js`**
   - Inspects `req.headers.host`, `x-forwarded-host`, and `req.headers.origin`.
   - Allows only `admin.disheera.site` in production and `localhost:5501` / `127.0.0.1:5501` in dev.
   - Rejects unauthorized hosts with `403 ADMIN_SUBDOMAIN_ONLY`.
3. **[NEW] `server/middleware/adminAuthMiddleware.js`**
   - Extracts `__Host-disheera_admin_session` cookie or `Authorization: Bearer` header.
   - Verifies JWT with `ADMIN_JWT_SECRET` (fallback `JWT_SECRET + '_admin'`).
   - Ensures payload has `type: 'admin_session'`. Rejects regular student/recruiter tokens with `401 INVALID_ADMIN_TOKEN`.
   - `requireAdminRole(['SUPER_ADMIN', 'ADMIN'])` middleware enforcing RBAC hierarchy.
4. **[NEW] `server/utils/adminAuditLogger.js`**
   - Asynchronous helper `logAdminAction(admin, action, targetType, targetId, details, req)`.
5. **[NEW] `server/controllers/adminAuthController.js`**
   - `POST /api/admin/auth/login`: Brute-force protection (5 failed attempts $\to$ 15-min lock), bcrypt check, sets `__Host-disheera_admin_session` cookie.
   - `POST /api/admin/auth/logout`: Clears cookie and invalidates session.
   - `GET /api/admin/auth/me`: Returns current admin profile and permissions.
   - `POST /api/admin/auth/change-password`: Enforces password reset if `mustChangePassword === true`.
6. **[NEW] `server/routes/adminAuthRoutes.js`**
   - Mounts admin authentication endpoints.
7. **[NEW] `server/prisma/seedAdmin.js`**
   - Idempotent script reading `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` from `.env`.
   - Upserts `parthpatil1234p@gmail.com` as `SUPER_ADMIN` with bcrypt cost 12.
8. **[MODIFY] `package.json` & `server/package.json`**
   - Add script: `"seed:admin": "node server/prisma/seedAdmin.js"`.
   - Add script: `"admin:serve": "npx --yes serve admin-client -p 5501"`.
   - Update `"start"`: Concurrently starts backend (:5000), client (:5500), and admin-client (:5501).
9. **[MODIFY] `.env.example`**
   - Add `ADMIN_SEED_EMAIL="parthpatil1234p@gmail.com"`, `ADMIN_SEED_PASSWORD="your-strong-password"`, `ADMIN_JWT_SECRET="generate-32-char-random-secret"`.
10. **[NEW] `tests/admin_subdomain_isolation_test.js`**
    - Unit and integration tests verifying:
      - Host guard blocks requests from `disheera.site` or `localhost:5500`.
      - Super Admin login and cookie attributes (`HttpOnly`, `SameSite=Strict`).
      - Account lockout activates after 5 failed attempts.
      - Student/recruiter JWTs are strictly rejected on `/api/admin/*`.

---

### Phase 2: Core Admin UI Shell, Dashboard & User/Recruiter Management
**Focus:** Luxury dark glassmorphic interface, KPI metrics, student management, and recruiter verification.

#### Files to Create / Modify:
1. **[NEW] `careerpath-ai/admin-client/robots.txt`**
   - `User-agent: * \n Disallow: /`.
2. **[NEW] `careerpath-ai/admin-client/index.html`**
   - Glassmorphic admin dashboard shell, responsive sidebar, topbar with Super Admin badge, toast container, confirm modal.
   - Dynamic view panels: Dashboard, Users, Recruiters, Passports, Masterclasses, Radar, Roadmaps, Broadcasts, Logs, Settings.
3. **[NEW] `careerpath-ai/admin-client/login.html`**
   - Clean, secure login portal with password visibility toggle, lockout countdown timer, and force-password-change modal.
4. **[NEW] `careerpath-ai/admin-client/css/admin.css`**
   - Design tokens consistent with Disheera (deep slate backgrounds, neon cyan/violet accents, frosted glass panels, responsive tables, badge pills).
5. **[NEW] `careerpath-ai/admin-client/js/admin-api.js`**
   - Fetch wrapper handling credentials, CSRF, error handling, session expiration redirect.
6. **[NEW] `careerpath-ai/admin-client/js/admin-auth.js`**
   - Client auth state management, logout, forced password reset flow.
7. **[NEW] `server/controllers/adminDashboardController.js` & `server/routes/adminDashboardRoutes.js`**
   - `GET /api/admin/dashboard/stats`: Total users, daily signups, active roadmap learners, total recruiters, pending approvals, job postings, test attempts.
8. **[NEW] `server/controllers/adminUserController.js` & `server/routes/adminUserRoutes.js`**
   - `GET /api/admin/users`: Paginated, searchable (name, email, role, stream), filter by verified/suspended.
   - `GET /api/admin/users/:id`: Full student dossier (profile, roadmap, attempts, passport, resume).
   - `PATCH /api/admin/users/:id/suspend`: Toggle account suspension (`isSuspended`).
   - `DELETE /api/admin/users/:id`: Safe account deactivation (SUPER_ADMIN only).
9. **[NEW] `server/controllers/adminRecruiterController.js` & `server/routes/adminRecruiterRoutes.js`**
   - `GET /api/admin/recruiters`: List recruiter accounts and verification statuses.
   - `POST /api/admin/recruiters/:id/approve`: Approve recruiter and trigger verification badge.
   - `POST /api/admin/recruiters/:id/reject`: Reject with rejection reason notification.

---

### Phase 3: Domain Modules (Skill Passport, Video Content, Radar & Roadmaps)
**Focus:** Control panels for Plans 41, 43, 44, and assessment oversight.

#### Files to Create / Modify:
1. **[NEW] `server/controllers/adminPassportController.js` & `server/routes/adminPassportRoutes.js`**
   - List issued Skill Passports, verify authenticity, revoke compromised certificates.
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
   - Mount `adminHostGuard` on `/api/admin/*`.
   - Mount all admin routes under `/api/admin/*`.
   - Add security headers: `X-Robots-Tag: noindex, nofollow, noarchive` for `/api/admin/*`.
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
   - Step-by-step DNS CNAME setup (`admin.disheera.site`), SSL certificate generation, and production environment checklist.

---

## 5. Verification & Testing Strategy

### Automated Verification Pipeline:
1. **Type & Syntax Checking:**
   - `node --check server/server.js`
   - `npx prisma validate`
2. **Dedicated Admin Isolation Test Suite:**
   - Execute: `node tests/admin_subdomain_isolation_test.js`
   - Test Cases:
     1. Host Guard rejects requests originating from `disheera.site` with HTTP 403.
     2. Host Guard accepts requests originating from `admin.disheera.site` (and `localhost:5501` in dev).
     3. Super Admin seeding is idempotent (running twice produces no duplicate errors).
     4. Super Admin login issues `__Host-` prefixed cookie with `HttpOnly` and `SameSite=Strict`.
     5. 5 consecutive invalid login attempts trigger account lockout for 15 minutes.
     6. Regular student and recruiter JWT tokens receive HTTP 401 when accessing `/api/admin/dashboard/stats`.
     7. Admin audit log record is created automatically upon administrative action.
3. **End-to-End Regression Test:**
   - `npm test` passing with 0 errors across existing student and recruiter suites.

---

## 6. User Review & Approval Required

> [!IMPORTANT]
> **Key Decisions Baked into this Plan:**
> 1. **Separate `AdminUser` Table:** Administrators are physically isolated from the `User` table to guarantee that no student or recruiter account can ever be elevated via API payload injection or auth provider mix-ups.
> 2. **`__Host-` Cookie Standard:** The admin session cookie is configured as `__Host-disheera_admin_session`, which modern browsers strictly restrict to the exact host (`admin.disheera.site`) and forbid passing to `disheera.site`.
> 3. **Concurrently Running Local Development:** In development, running `npm start` will serve Backend on `localhost:5000`, Student Client on `localhost:5500`, and Admin Client on `localhost:5501`.

# Disheera Enterprise Admin Panel — Production Deployment Guide
**Subdomain:** `admin.disheera.site`  
**API Endpoint:** `https://api.disheera.site` (Render: `careerpath-ai-bdbt.onrender.com`)  
**Database:** Supabase Managed PostgreSQL (`aws-0-ap-south-1.pooler.supabase.com`)  
**Version:** Plan 45 v1.2 Enterprise Architecture

---

## Table of Contents
1. [Architecture & Network Topology](#1-architecture--network-topology)
2. [DNS Record Configuration](#2-dns-record-configuration)
3. [SSL/TLS Edge Certificate Provisioning](#3-ssltls-edge-certificate-provisioning)
4. [Production Environment Checklist](#4-production-environment-checklist)
5. [`__Host-` Cookie Mechanics behind Reverse Proxy](#5-__host--cookie-mechanics-behind-reverse-proxy)
6. [Reverse Proxy Trust Hop Count (`trust proxy = 2`)](#6-reverse-proxy-trust-hop-count-trust-proxy--2)
7. [Database Backup & Safe Migration Protocol](#7-database-backup--safe-migration-protocol)
8. [Initial Super Admin Seeding & Post-Seed Hygiene](#8-initial-super-admin-seeding--post-seed-hygiene)
9. [Emergency Recovery & Account Unlock Procedure](#9-emergency-recovery--account-unlock-procedure)
10. [Disaster Recovery & Rollback Protocol](#10-disaster-recovery--rollback-protocol)

---

## 1. Architecture & Network Topology

Disheera employs an enterprise zero-trust subdomain isolation model:
```
                      ┌──────────────────────────────────────┐
                      │            Client Browser            │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │ HTTPS Request to: admin.disheera.site         │
                 ▼                                               ▼
     ┌────────────────────────┐                     ┌────────────────────────┐
     │  Static Assets (HTML/  │                     │  API Proxy Rewrite:    │
     │  CSS/JS Modules)       │                     │  /api/*                │
     └───────────┬────────────┘                     └───────────┬────────────┘
                 │                                              │
                 │ [Served Directly by Vercel Edge]             │ [Hop 1: Vercel Reverse Proxy]
                 │                                              ▼
                 │                                  ┌────────────────────────┐
                 │                                  │ Render Load Balancer   │
                 │                                  │ (Hop 2: Render Proxy)  │
                 │                                  └───────────┬────────────┘
                 │                                              │ Forwarded with X-Forwarded-For
                 │                                              ▼
                 │                                  ┌────────────────────────┐
                 │                                  │ Express Backend (:5000)│
                 │                                  │ [trust proxy = 2]      │
                 │                                  └───────────┬────────────┘
                 │                                              │
                 │                                              ▼
                 │                                  ┌────────────────────────┐
                 │                                  │ Supabase PostgreSQL DB │
                 │                                  └────────────────────────┘
```

---

## 2. DNS Record Configuration

Configure the following DNS records in your domain registrar / DNS provider (Cloudflare, GoDaddy, Namecheap):

| Record Type | Host / Name | Target / Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `admin` | `cname.vercel-dns.com` | Auto (300s) | Routes `admin.disheera.site` to Vercel deployment of `admin-client` |
| **CNAME** | `api` | `careerpath-ai-bdbt.onrender.com` | Auto (300s) | Routes `api.disheera.site` to backend Render service |
| **CNAME** | `@` / `www` | `cname.vercel-dns.com` | Auto (300s) | Routes main public student platform (`disheera.site`) |

> [!IMPORTANT]
> If using Cloudflare DNS, ensure the proxy status is set to **DNS Only** (Grey Cloud) during initial certificate issuance, or ensure Cloudflare SSL mode is configured to **Full (Strict)**.

---

## 3. SSL/TLS Edge Certificate Provisioning

1. In Vercel Project Settings for `admin-client`:
   - Navigate to **Settings** > **Domains**.
   - Add `admin.disheera.site`.
   - Vercel automatically requests and provisions a Let's Encrypt / ZeroSSL TLS certificate via HTTP-01 challenge.
2. In Render Dashboard for `careerpath-ai-bdbt`:
   - Navigate to **Settings** > **Custom Domains**.
   - Add `api.disheera.site`.
   - Render automatically provisions a wildcard or dedicated TLS certificate for the backend.
3. Verify TLS termination:
   ```bash
   curl -Iv https://admin.disheera.site
   curl -Iv https://api.disheera.site/api/health
   ```
   Both endpoints must return HTTP 200 with valid TLS 1.3 / TLS 1.2 certificates.

---

## 4. Production Environment Checklist

Configure these environment variables in your Render production dashboard under **Environment**:

| Variable Name | Required Value / Specification | Security Note |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables strict error sanitization, cookie security, and disables stack traces |
| `PORT` | `10000` (or leave default for Render) | Dynamically assigned by Render |
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase pooled connection string |
| `DIRECT_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` | Supabase direct connection for schema migrations |
| `ADMIN_JWT_SECRET` | 64+ char high-entropy cryptographically random string | **MANDATORY**: Server will crash on boot if $<32$ chars or if equal to `JWT_SECRET` |
| `JWT_SECRET` | 64+ char random string | Used exclusively for student/recruiter tokens |
| `ALLOWED_ORIGINS` | `https://disheera.site,https://www.disheera.site,https://admin.disheera.site` | Strict comma-separated origins. No wildcards in production |
| `ADMIN_SEED_EMAIL` | `parthpatil1234p@gmail.com` | Primary Super Admin email for seed script |
| `ADMIN_SEED_PASSWORD` | Set temporarily for seed, then **PURGE** | **MUST BE DELETED** from Render dashboard immediately after `seed:admin` completes |

### Secret Generation Command:
To generate cryptographically secure 64-character tokens:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## 5. `__Host-` Cookie Mechanics behind Reverse Proxy

In production (`NODE_ENV === 'production'`), administrative session tokens are issued in an RFC 6265bis-compliant cookie:
```http
Set-Cookie: __Host-disheera_admin_session=<JWT_TOKEN>; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800
```

### Why the `__Host-` prefix is critical:
1. **No Domain Scope Allowed**: The cookie cannot specify a `Domain=` attribute. It is locked strictly to the host that issued it (`admin.disheera.site`).
2. **Subdomain Hijacking Protection**: Compromised subdomains or main domain scripts cannot overwrite or read this cookie.
3. **Mandatory Secure Flag**: The browser refuses to accept or transmit the cookie over unencrypted HTTP.
4. **Strict SameSite**: Prevents all Cross-Site Request Forgery (CSRF) vectors from third-party sites or external links.

### How it works with Vercel API Rewrites:
1. The administrator visits `https://admin.disheera.site`.
2. The browser requests `/api/admin/auth/login`.
3. Vercel's rewrite rule forwards the request to `https://api.disheera.site/api/admin/auth/login`.
4. The Express backend sends `Set-Cookie: __Host-disheera_admin_session=...; Path=/; Secure; HttpOnly; SameSite=Strict`.
5. Vercel forwards the `Set-Cookie` header to the browser.
6. Because the browser initiated the request to `admin.disheera.site`, the `__Host-` cookie is stored directly under `admin.disheera.site`.
7. Subsequent requests to `/api/admin/*` automatically include this cookie in the `Cookie` header.

---

## 6. Reverse Proxy Trust Hop Count (`trust proxy = 2`)

### Real-World Topology:
1. **Client Browser** (`203.0.113.195`) connects to Vercel Edge (`admin.disheera.site`).
2. **Hop 1 — Vercel Edge Proxy**: Rewrites `/api/*` and forwards upstream with `X-Forwarded-For: 203.0.113.195`.
3. **Hop 2 — Render Load Balancer**: Receives request and forwards to the Node.js container with `X-Forwarded-For: 203.0.113.195, 76.76.21.21`.
4. **Node.js Express Server**:
   ```javascript
   app.set('trust proxy', process.env.NODE_ENV === 'production' ? 2 : 1);
   ```

### Verification:
With `trust proxy = 2`, Express strips the Render proxy IP and the Vercel edge proxy IP, accurately resolving:
```javascript
req.ip === '203.0.113.195' // The true client IP
```
This ensures:
- Admin login rate limiting (`20 req / 15 min`) applies per client, not to all users sharing the Vercel edge IP.
- IP addresses recorded in `admin_audit_logs` reflect the true administrator device, not an internal proxy hop.
- `maskIpAddress(ip)` correctly masks the true IP for `MODERATOR` and `ADMIN` personnel (`203.0.***.***`).

---

## 7. Database Backup & Safe Migration Protocol

### Pre-Deployment Backup:
Before running any migration on the live database:
1. Open the **Supabase Dashboard** > **Project Settings** > **Database**.
2. Trigger an immediate manual backup or snapshot.
3. Alternatively, export schema and data using PostgreSQL CLI:
   ```bash
   pg_dump -Fc --no-acl --no-owner -h aws-0-ap-south-1.pooler.supabase.com -U postgres.[ref] -d postgres > backup_pre_phase4.dump
   ```

### Safe Migration Deployment:
> [!CAUTION]
> **NEVER run `npx prisma migrate dev` against the live production database.**
> `migrate dev` detects drift and may prompt to drop the database schema.

To deploy reviewed migrations safely to production:
```bash
# 1. Verify migration status and pending migrations
npx prisma migrate status

# 2. Apply pending migrations deterministically
npx prisma migrate deploy

# 3. Generate updated Prisma Client types
npx prisma generate
```

---

## 8. Initial Super Admin Seeding & Post-Seed Hygiene

1. Ensure `.env` contains:
   ```env
   ADMIN_SEED_EMAIL="parthpatil1234p@gmail.com"
   ADMIN_SEED_PASSWORD="<YourTemporarySecurePassword>"
   ```
2. Execute the seeder:
   ```bash
   npm run seed:admin
   ```
   Output:
   ```
   [SeedAdmin] Super Admin account successfully provisioned for: parthpatil1234p@gmail.com
   [SeedAdmin] mustChangePassword flag set to TRUE. Initial password change will be enforced.
   ```
3. **Post-Seed Security Hygiene (Mandatory)**:
   - Immediately delete `ADMIN_SEED_PASSWORD` from `.env` and Render Environment Variables.
   - Leave `ADMIN_SEED_EMAIL` for reference, but ensure no plain-text password remains in any file or configuration.
4. On first login at `https://admin.disheera.site/login.html`:
   - Enter your email and temporary password.
   - The system intercepts the login and presents the **Forced Password Change** screen.
   - Set a permanent password (minimum 10 characters).
   - Once saved, `mustChangePassword` is set to `false`, and all other sessions are terminated.

---

## 9. Emergency Recovery & Account Unlock Procedure

If an administrator account becomes locked out due to 5 consecutive failed login attempts:

### Method A: Via NPM Script (Recommended)
```bash
npm run admin:unlock -- parthpatil1234p@gmail.com
```

### Method B: Via Node CLI
```bash
node server/scripts/unlockAdmin.js parthpatil1234p@gmail.com
```

### What the script executes:
1. Connects to PostgreSQL via Prisma.
2. Locates the `AdminUser` row matching the email.
3. Resets `failedLoginAttempts` to `0`.
4. Sets `lockedUntil` to `null`.
5. Records a permanent security entry in `admin_audit_logs`:
   ```json
   {
     "action": "ADMIN_UNLOCK",
     "targetType": "ADMIN",
     "targetId": "<admin_id>",
     "details": { "unlockedBy": "CLI_EMERGENCY_SCRIPT" }
   }
   ```

---

## 10. Disaster Recovery & Rollback Protocol

### Application Rollback:
If a regression or failure occurs after deployment:
1. **Render**:
   - Go to Render Dashboard > `careerpath-ai-bdbt` > **Events**.
   - Click **Rollback** on the previous successful deploy.
2. **Vercel**:
   - Go to Vercel Dashboard > `disheera-admin` > **Deployments**.
   - Find the previous production deployment > Click **Promote to Production**.

### Database State Verification:
Verify system health immediately after any deployment or recovery:
```bash
curl -s -H "Host: admin.disheera.site" https://api.disheera.site/api/admin/system/health | jq .
```
Expected response:
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "database": {
      "status": "connected",
      "engine": "PostgreSQL (Supabase)",
      "latencyMs": 42.5
    }
  }
}
```

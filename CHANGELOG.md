# Changelog

All notable changes to the **Disheera** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-21

### Added
- **1:1 Mobile Number to Account Uniqueness:**
  - Implemented database-level partial unique constraint (`User_phone_unique_not_empty`) in PostgreSQL to guarantee physical uniqueness.
  - Added pending registrations phone lock via `pendingSignupStore.getPendingSignupByPhone(phone)`.
  - Added live availability endpoint `POST /api/auth/check-phone` with debounced client-side validation on registration forms.
  - Strict 1:1 validation across student registrations, recruiter onboarding, Google OAuth, and profile phone linking.
- **Supabase Database Linter & Security Hardening:**
  - Created Row Level Security (RLS) policies for `weekly_assignments`, `assignment_submissions`, `student_merit_scores`, and `internship_rewards`.
  - Removed redundant duplicate indexes (`weekly_assignments_careerId_idx`, `student_merit_scores_currentRank_idx`).
  - Added covering B-tree index `assignment_submissions_assignmentId_idx` for the cascading foreign key constraint (`0001_unindexed_foreign_keys`).
- **Comprehensive Dependency Security Audit:**
  - Resolved all 17 open GitHub Dependabot alerts across root and server manifests.
  - Upgraded dependencies and configured npm overrides for `chokidar`, `deepmerge-ts`, `compression`, `on-headers`, `serve`, `morgan`, and `qs`.
  - Reached **0 vulnerabilities** across entire dependency tree (`npm audit`).

---

## [1.1.0] - 2026-10-20

### Added
- **Collegiate Weekly Assignments & Submissions Engine (Phases 1–4):**
  - Standardized 1-Page Cover PDF Generator and multi-page assignment PDF ingestion pipeline.
  - Multimodal AI Grading Engine featuring 4D evaluation rubrics (Problem Solving, Methodology, Clarity).
  - Anti-AI Shield with semantic perplexity checks and penalty scaling.
  - Subdomain Admin Review Cockpit with official score override, side-by-side question review, and Part C Stamped Evaluation Sheets.
  - Cumulative Merit Score (CMS) composite ranking engine (Assignments 40%, Quizzes 30%, Progress 20%, Consistency 10%).
  - Dynamic Top 3 Podium Leaderboard and partner tech internship reward opportunities (Gold, Silver, Bronze crests).
- **Luxury Career Certificate & Verification Suite:**
  - Responsive 16:9 widescreen landscape certificate modal with luxury double gold border, rosette medal, and authorized digital signatures.
  - Standalone verification portal (`/verify.html`) with anti-tamper QR code lookup.

---

## [1.0.0] - 2026-10-18

### Added
- **Core Platform Architecture:**
  - Complete autonomous student career onboarding and multi-step assessment workflow.
  - Personalized 4-week roadmap generation with weekly milestones and resource chambers.
  - Strict Proctoring & Anti-Cheat Engine for weekly milestone assessments (tab-switch detection, fullscreen enforcement, strike tracker).
  - Corporate Recruiter Portal with automated company domain verification and Talent Radar applicant tracking.
  - Dual-channel authentication: Gmail and WhatsApp OTP verification.
  - Full Supabase PostgreSQL migration using Prisma ORM with connection pooling.

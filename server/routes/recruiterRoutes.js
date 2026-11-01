/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/recruiterRoutes.js — Corporate Recruiter & Job Management Routes
 *
 * Disheera · Enterprise Backend Service
 */

const express = require('express');
const router = express.Router();
const {
  verifyCompanyPrecheck,
  registerRecruiter,
  getRecruiterProfile,
  createJob,
  getMyJobs,
  getJobDetails,
  updateJob,
  deleteJob,
  getJobApplicants,
  updateApplicationStatus,
} = require('../controllers/recruiterController');
const { protect, authorize, requireVerifiedRecruiter, requireRecruiter } = require('../middleware/authMiddleware');

// ── Public Routes (Onboarding & Company Verification) ─────────
router.post('/verify-company-precheck', verifyCompanyPrecheck);
router.post('/register', registerRecruiter);

// ── Protected Recruiter Routes ────────────────────────────────
router.get('/profile', protect, requireRecruiter, getRecruiterProfile);

// Job Openings Management
router.post('/jobs', protect, requireVerifiedRecruiter, createJob);
router.get('/jobs', protect, requireRecruiter, getMyJobs);
router.get('/jobs/:id', protect, requireRecruiter, getJobDetails);
router.patch('/jobs/:id', protect, requireRecruiter, updateJob);
router.delete('/jobs/:id', protect, requireRecruiter, deleteJob);

// Candidate Applications & Hiring Stages
router.get('/jobs/:id/applicants', protect, requireRecruiter, getJobApplicants);
router.patch('/applications/:appId/status', protect, requireRecruiter, updateApplicationStatus);

module.exports = router;

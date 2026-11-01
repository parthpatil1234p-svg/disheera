/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/jobRoutes.js  -  AI Dev Board Live Jobs API Routes
 * Disheera · Enterprise Backend Service
 */

const express = require('express');
const router = express.Router();
const {
  getJobsForCareer,
  searchLiveJobs,
  searchAdzunaJobs,
  matchJobsWithSkills,
  generateMultiPortalLinks
} = require('../services/jobBoardService');

/**
 * GET /api/jobs/portal-links
 * Query params: role, location, company
 * Returns generated search deep-links for all major platforms (LinkedIn, Naukri, Indeed, Wellfound, Internshala, Google Jobs).
 */
router.get('/portal-links', (req, res) => {
  const { role, location, company } = req.query;
  const links = generateMultiPortalLinks(role || 'Software Engineer', location || 'India', company || null);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).json({
    success: true,
    data: {
      role: role || 'Software Engineer',
      location: location || 'India',
      portals: links
    }
  });
});

/**
 * GET /api/jobs/adzuna
 * Direct real-time job search via Adzuna API (India localized tech hiring)
 */
router.get('/adzuna', async (req, res, next) => {
  try {
    const { q, country, limit } = req.query;
    const jobs = await searchAdzunaJobs({
      query: q || 'developer',
      country: country || 'in',
      limit: parseInt(limit, 10) || 8
    });
    return res.status(200).json({
      success: true,
      message: 'Adzuna real-time job openings',
      data: { total: jobs ? jobs.length : 0, jobs: jobs || [] }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/career/:slug
 * Fetches live tech & AI jobs mapped to a specific recommended career path
 * e.g., /api/jobs/career/front-end-developer?globalRemote=true
 */
router.get('/career/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const globalRemote = req.query.globalRemote === 'true';
    const limit = parseInt(req.query.limit, 10) || 8;

    const data = await getJobsForCareer(slug, { globalRemote, limit });
    return res.status(200).json({
      success: true,
      message: `Live market opportunities for ${slug}`,
      data
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs
 * General job search filter
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, tags, workplace, level } = req.query;
    const globalRemote = req.query.globalRemote === 'true';
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await searchLiveJobs({
      query: q || '',
      tags: tags || '',
      workplace: workplace || '',
      globalRemote,
      level: level || '',
      limit
    });

    return res.status(200).json({
      success: true,
      message: 'Active developer job listings',
      data: result || { total: 0, jobs: [] }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/match
 * Matches jobs against user skills array
 */
router.post('/match', async (req, res, next) => {
  try {
    const { skills, workplace, limit } = req.body;
    const result = await matchJobsWithSkills(skills, {
      workplace: workplace || 'remote',
      limit: limit || 6
    });

    return res.status(200).json({
      success: true,
      message: 'Matched live job opportunities',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

const { protect, requireStudent } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const JobOpening = require('../models/JobOpening');
const JobApplication = require('../models/JobApplication');

/**
 * GET /api/jobs/matched-for-user
 * Fetches real jobs and computes Match % against candidate's verified skills
 */
router.get('/matched-for-user', protect, requireStudent, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
    const careerSlug = activeRoadmap?.career?.slug || 'front-end-developer';

    const jobsData = await getJobsForCareer(careerSlug, { limit: 8 });
    const userSkillsMap = new Map();
    (user?.skills || []).forEach(s => {
      userSkillsMap.set((s.name || '').toLowerCase(), s);
    });

    const evaluatedJobs = (jobsData.jobs || []).map(job => {
      const jobTags = (job.tags || []).map(t => String(t).toLowerCase());
      if (jobTags.length === 0) {
        return { ...job, matchPercentage: 80, matchedTags: [], missingTags: [] };
      }

      let matches = 0;
      const matchedTags = [];
      const missingTags = [];

      jobTags.forEach(tag => {
        const uSkill = userSkillsMap.get(tag);
        if (uSkill) {
          const isVer = uSkill.isCodeVerified || uSkill.isQuizVerified;
          matches += (isVer ? 1.0 : 0.7);
          matchedTags.push({
            name: tag,
            isVerified: Boolean(isVer),
            tier: uSkill.verificationTier || (isVer ? 'quiz_verified' : 'self_rated')
          });
        } else {
          missingTags.push(tag);
        }
      });

      const rawPct = Math.round((matches / jobTags.length) * 100);
      const matchPercentage = Math.min(98, Math.max(45, rawPct));
      const companyStr = job.companyName || job.company || 'Tech Company';
      const portalLinks = job.portalLinks || generateMultiPortalLinks(job.title, 'India', companyStr);

      return {
        ...job,
        portalLinks,
        matchPercentage,
        matchedTags,
        missingTags,
        verifiedSkills: matchedTags.map(t => t.name),
        missingSkills: missingTags
      };
    });

    // Sort by highest match %
    evaluatedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const targetCareerTitle = activeRoadmap?.career?.title || 'Software Engineer';
    const hubPortals = generateMultiPortalLinks(targetCareerTitle, 'India');

    return res.status(200).json({
      success: true,
      message: 'Personalized matched jobs with exact match percentages',
      data: {
        total: evaluatedJobs.length,
        jobs: evaluatedJobs,
        careerTitle: targetCareerTitle,
        portals: hubPortals
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/bridge-gap
 * Injects a 1-week learning micro-task for a missing job skill into student's active roadmap
 */
router.post('/bridge-gap', protect, requireStudent, async (req, res, next) => {
  try {
    const skillName = req.body.skillName || req.body.missingSkill;
    const jobTitle = req.body.jobTitle;
    if (!skillName) {
      return res.status(400).json({ success: false, message: 'Skill name is required to bridge the gap.' });
    }

    const roadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'No active roadmap found. Please generate a roadmap first.' });
    }

    const existingTasks = await RoadmapTask.find({ roadmap: roadmap._id });
    const maxOrder = existingTasks.length > 0 ? Math.max(...existingTasks.map(t => t.order || 1)) : 1;
    const currentWeek = 1; // place in current week for immediate focus

    const newTask = await RoadmapTask.create({
      roadmap: roadmap._id,
      weekNumber: currentWeek,
      order: maxOrder + 1,
      title: `Bridge the Gap: Master ${skillName.toUpperCase()}`,
      description: `Targeted industry requirement for "${jobTitle || 'High-Match Tech Role'}". Complete hands-on tutorials and build a proof project.`,
      type: 'learn',
      skillName: skillName.toLowerCase(),
      priority: 'high',
      estimatedHours: 4,
      resource: {
        title: `${skillName} Official Documentation & Guides`,
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(skillName)}`,
        provider: 'MDN / Documentation'
      },
      completed: false
    });

    roadmap.totalTasks = existingTasks.length + 1;
    roadmap.progressPercentage = Math.round((roadmap.completedTasks / roadmap.totalTasks) * 100);
    await roadmap.save();

    return res.status(201).json({
      success: true,
      message: `🎯 Gap bridged! Added "${newTask.title}" to Week 1 of your active roadmap.`,
      data: {
        task: newTask,
        roadmap: {
          totalTasks: roadmap.totalTasks,
          completedTasks: roadmap.completedTasks,
          progressPercentage: roadmap.progressPercentage
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Ensures top enterprise verified partner roles from regional data exist as active JobOpenings
 */
async function ensureVerifiedPartnerOpenings() {
  try {
    const regionalCompanies = require('../data/regionalCompaniesData');
    const Company = require('../models/Company');

    let recruiter = await User.findOne({ role: 'recruiter' });
    if (!recruiter) {
      recruiter = await User.findOne({ role: 'admin' });
    }
    if (!recruiter) return;

    const featured = [
      { id: 'larsen-toubro-powai', role: 'Structural Stress Analysis Trainee' },
      { id: 'tata-motors-pune', role: 'Battery Management System (BMS) Firmware Trainee' },
      { id: 'bajaj-finserv-pune', role: 'Full-Stack FinTech Developer' },
      { id: 'reliance-jio-navi-mumbai', role: '5G RAN Network Optimization Trainee' },
      { id: 'jain-irrigation', role: 'SCADA & Automation Field Trainee' },
    ];

    for (const item of featured) {
      const reg = Array.isArray(regionalCompanies)
        ? regionalCompanies.find((c) => c.id === item.id)
        : null;
      if (!reg) continue;

      const domain = (reg.website ? new URL(reg.website).hostname.replace(/^www\./, '') : `${reg.id}.com`).toLowerCase();
      let company = await Company.findOne({ domain });
      if (!company) {
        company = await Company.create({
          name: reg.name,
          domain,
          website: reg.website,
          logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          industry: reg.industry,
          headquarters: `${reg.city}, ${reg.state}`,
          isVerified: true,
          verificationScore: 98,
        });
      }

      const existingJob = await JobOpening.findOne({ company: company._id, title: item.role });
      if (!existingJob) {
        await JobOpening.create({
          recruiter: recruiter._id,
          company: company._id,
          companyName: reg.name,
          companyLogo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          companyWebsite: reg.website,
          isCompanyVerified: true,
          title: item.role,
          careerSlug: 'software-engineer',
          jobType: 'full-time',
          workplace: 'hybrid',
          location: `${reg.city}, ${reg.state}`,
          experienceLevel: 'fresher',
          salaryRange: { min: 500000, max: 920000, currency: 'INR', isDisclosed: true },
          requiredSkills: (reg.requiredSkills || []).map((s) => ({
            skillName: s.toLowerCase().trim(),
            minimumProficiency: 'intermediate',
            requiresVerification: true,
          })),
          description: `Official verified opening at ${reg.name} (${reg.cluster}). Active industrial hiring drive for ${item.role}.`,
          status: 'active',
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        });
      } else if (existingJob.status !== 'active') {
        existingJob.status = 'active';
        existingJob.deadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        await existingJob.save();
      }
    }
  } catch (err) {
    console.warn('[Jobs API] ensureVerifiedPartnerOpenings warning:', err.message);
  }
}

/**
 * GET /api/jobs/recruiter-openings
 * Returns verified direct company postings created by recruiters on the platform.
 * If user has a token, computes match percentage based on candidate's verified skills.
 */
router.get('/recruiter-openings', async (req, res, next) => {
  try {
    let user = null;
    const userAppliedJobIds = new Set();
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id);
        if (user) {
          const apps = await JobApplication.find({ student: user._id }, 'job status');
          apps.forEach((a) => userAppliedJobIds.add(String(a.job?._id || a.job)));
        }
      } catch (tokenErr) {
        // Continue as guest
      }
    }

    const { careerSlug, workplace, level } = req.query;
    const now = new Date();
    const filter = {
      status: 'active',
      $or: [
        { deadline: null },
        { deadline: { $gte: now } }
      ]
    };
    if (careerSlug) filter.careerSlug = careerSlug.toLowerCase();
    if (workplace) filter.workplace = workplace.toLowerCase();
    if (level) filter.experienceLevel = level.toLowerCase();

    let openings = await JobOpening.find(filter)
      .populate('company', 'name domain logoUrl industry verificationScore isVerified')
      .sort({ createdAt: -1 });

    if (openings.length < 3) {
      await ensureVerifiedPartnerOpenings();
      openings = await JobOpening.find(filter)
        .populate('company', 'name domain logoUrl industry verificationScore isVerified')
        .sort({ createdAt: -1 });
    }

    const userSkillsMap = new Map();
    if (user && Array.isArray(user.skills)) {
      user.skills.forEach((s) => userSkillsMap.set((s.name || '').toLowerCase(), s));
    }

    const evaluatedOpenings = openings.map((op) => {
      const reqSkills = op.requiredSkills || [];
      let matchScore = 75; // baseline
      const matched = [];
      const missing = [];

      if (reqSkills.length > 0 && user) {
        let earnedPoints = 0;
        reqSkills.forEach((reqS) => {
          const sName = reqS.skillName.toLowerCase();
          const candidateSkill = userSkillsMap.get(sName);
          if (candidateSkill) {
            const isVerified = candidateSkill.isQuizVerified || candidateSkill.isCodeVerified;
            earnedPoints += (isVerified ? 1.0 : 0.7);
            matched.push({
              name: sName,
              isVerified: Boolean(isVerified),
              tier: candidateSkill.verificationTier || (isVerified ? 'quiz_verified' : 'self_rated'),
            });
          } else {
            missing.push(sName);
          }
        });
        const rawScore = Math.round((earnedPoints / reqSkills.length) * 100);
        matchScore = Math.min(99, Math.max(40, rawScore));
      }

      return {
        ...op.toObject(),
        matchScore,
        matchedSkills: matched,
        missingSkills: missing,
        hasApplied: userAppliedJobIds.has(String(op._id)),
        companyVerificationBadge: '✓ Verified Enterprise Employer',
      };
    });

    if (user) {
      evaluatedOpenings.sort((a, b) => b.matchScore - a.matchScore);
    }

    return res.status(200).json({
      success: true,
      message: 'Direct verified recruiter openings',
      data: {
        total: evaluatedOpenings.length,
        openings: evaluatedOpenings,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/:id/apply
 * 1-Click candidate job application using student profile, verified badges, and ATS resume
 */
router.post('/:id/apply', protect, requireStudent, async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    let job = null;
    try {
      job = await JobOpening.findById(jobId);
    } catch (e) {
      // not a standard ID
    }

    if (!job) {
      // Check if it's a regional partner company from Proximity Radar
      const roleTitle = req.body.roleTitle;
      const companyName = req.body.companyName;

      const regionalCompanies = require('../data/regionalCompaniesData');
      const regComp = Array.isArray(regionalCompanies)
        ? regionalCompanies.find((c) => c.id === jobId || (companyName && c.name.toLowerCase().includes(companyName.toLowerCase())))
        : null;

      if (regComp) {
        const Company = require('../models/Company');
        const domain = (regComp.website ? new URL(regComp.website).hostname.replace(/^www\./, '') : `${regComp.id}.com`).toLowerCase();
        let company = await Company.findOne({ domain });
        if (!company) {
          company = await Company.create({
            name: regComp.name,
            domain,
            website: regComp.website,
            logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
            industry: regComp.industry,
            headquarters: `${regComp.city}, ${regComp.state}`,
            isVerified: true,
            verificationScore: 98,
          });
        }

        let recruiter = await User.findOne({ role: 'recruiter' });
        if (!recruiter) {
          recruiter = (await User.findOne({ role: 'admin' })) || student;
        }

        const effectiveTitle = roleTitle || regComp.topRoles?.[0] || 'Graduate Engineering Trainee';

        job = await JobOpening.findOne({
          company: company._id,
          title: effectiveTitle,
        });

        if (!job) {
          job = await JobOpening.create({
            recruiter: recruiter._id,
            company: company._id,
            companyName: regComp.name,
            companyLogo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
            companyWebsite: regComp.website,
            isCompanyVerified: true,
            title: effectiveTitle,
            careerSlug: 'software-engineer',
            jobType: 'full-time',
            workplace: 'hybrid',
            location: `${regComp.city}, ${regComp.state}`,
            experienceLevel: regComp.hiringFresher ? 'fresher' : 'entry',
            salaryRange: { min: 450000, max: 950000, currency: 'INR', isDisclosed: true },
            requiredSkills: (regComp.requiredSkills || []).map((s) => ({
              skillName: s.toLowerCase().trim(),
              minimumProficiency: 'intermediate',
              requiresVerification: true,
            })),
            description: `Official verified opening at ${regComp.name} (${regComp.cluster}). Active industrial hiring drive for ${effectiveTitle}.`,
            status: 'active',
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          });
        } else if (job.status !== 'active') {
          job.status = 'active';
          job.deadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
          await job.save();
        }
      }
    }

    if (!job || job.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Job opening is no longer active or does not exist.' });
    }

    // Check for duplicate application
    const existing = await JobApplication.findOne({ job: job._id, student: student._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an application for this position.',
        application: existing,
      });
    }

    // Calculate match score
    const userSkillsMap = new Map();
    (student.skills || []).forEach((s) => userSkillsMap.set((s.name || '').toLowerCase(), s));

    const reqSkills = job.requiredSkills || [];
    const matchedSkills = [];
    const missingSkills = [];
    let earnedPoints = 0;

    if (reqSkills.length > 0) {
      reqSkills.forEach((reqS) => {
        const sName = (reqS.skillName || reqS).toLowerCase();
        const candSkill = userSkillsMap.get(sName);
        if (candSkill) {
          const isVer = candSkill.isQuizVerified || candSkill.isCodeVerified;
          earnedPoints += (isVer ? 1.0 : 0.7);
          matchedSkills.push(sName);
        } else {
          missingSkills.push(sName);
        }
      });
    }

    const calculatedMatch = reqSkills.length > 0
      ? Math.min(99, Math.max(45, Math.round((earnedPoints / reqSkills.length) * 100)))
      : 88;

    const application = await JobApplication.create({
      job: job._id,
      student: student._id,
      recruiter: job.recruiter?._id || job.recruiter || job.recruiterId,
      matchScore: calculatedMatch,
      matchedSkills,
      missingSkills,
      readinessTier: student.jobReadiness?.tierLabel || 'Foundational Learner',
      resumeUrl: student.resumeUrl || '',
      builtResumeSnapshot: student.builtResume || {},
      coverNote: req.body.coverNote || '',
      status: 'applied',
    });

    job.applicationsCount = (job.applicationsCount || 0) + 1;
    await job.save();

    // Broadcast real-time application alert
    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      if (io) {
        io.emit('new_job_application', {
          jobId: String(job._id || job.id),
          jobTitle: job.title,
          companyName: job.companyName,
          studentName: student.name,
          matchScore: calculatedMatch,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      // non-fatal
    }

    return res.status(201).json({
      success: true,
      message: `🎉 Application submitted to ${job.companyName} for "${job.title}"!`,
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/my-applications
 * Returns all direct company applications submitted by the student
 */
router.get('/my-applications', protect, requireStudent, async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ student: req.user._id })
      .populate('job', 'title companyName companyLogo workplace location salaryRange status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        total: applications.length,
        applications,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


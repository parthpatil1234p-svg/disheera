/**
 * controllers/recruiterController.js  -  Recruiter Verification & Job Opening Management
 *
 * Implements:
 *  - verifyCompanyPrecheck: Public live pre-check for registration form
 *  - registerRecruiter: Registers corporate recruiter with domain checks & OTP dispatch
 *  - getRecruiterProfile: Retrieves company record & recruiter permissions
 *  - createJob: Posts a new job opening with required skill verifications
 *  - getMyJobs: Returns all jobs posted by the recruiter
 *  - getJobDetails: Single job details
 *  - updateJob: Edit job or toggle status (active, paused, closed)
 *  - deleteJob: Closes or removes a job
 *  - getJobApplicants: Enriched candidate radar with verified skill badges & match scores
 *  - updateApplicationStatus: Moves candidate across recruitment stages
 *
 * Disheera · Enterprise Backend Service
 */

const User = require('../models/User');
const Company = require('../models/Company');
const JobOpening = require('../models/JobOpening');
const JobApplication = require('../models/JobApplication');
const { computeOverallCompanyVerification } = require('../services/companyVerificationService');
const { sendOtpEmail } = require('../services/emailService');
const pendingSignupStore = require('../data/pendingSignupStore');

// ── Helper: 6-Digit Secure OTP Generator ─────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── verifyCompanyPrecheck ────────────────────────────────────
/**
 * POST /api/recruiter/verify-company-precheck
 * Public endpoint called with debounced input from register.html
 * Body: { companyName, email, website }
 */
const verifyCompanyPrecheck = async (req, res, next) => {
  try {
    const { companyName, email, website } = req.body;

    if (!email && !website) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a corporate email or company website to verify.',
      });
    }

    const verification = await computeOverallCompanyVerification({
      companyName: (companyName || '').trim(),
      email: (email || '').trim(),
      website: (website || '').trim(),
    });

    if (!verification.isRealCompany) {
      return res.status(422).json({
        success: false,
        isRealCompany: false,
        confidenceScore: verification.confidenceScore,
        message: verification.reason || 'Company verification check failed.',
        verificationDetails: verification.verificationDetails,
      });
    }

    return res.status(200).json({
      success: true,
      isRealCompany: true,
      confidenceScore: verification.confidenceScore,
      message: `Verified Corporate Domain: ${verification.companyDetails.name} (${verification.companyDetails.industry})`,
      companyDetails: verification.companyDetails,
      verificationDetails: verification.verificationDetails,
    });
  } catch (error) {
    next(error);
  }
};

// ── registerRecruiter ────────────────────────────────────────
/**
 * POST /api/recruiter/register
 * Body: { name, email, password, companyName, website, title, linkedinUrl, workPhone }
 */
const registerRecruiter = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      companyName,
      website,
      title,
      linkedinUrl,
      workPhone,
    } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Name, corporate email, password, and company name are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in directly.',
      });
    }

    // Run full corporate legitimacy checks
    const verification = await computeOverallCompanyVerification({
      companyName: companyName.trim(),
      email: normalizedEmail,
      website: (website || '').trim(),
    });

    if (!verification.isRealCompany) {
      return res.status(422).json({
        success: false,
        message: verification.reason || 'Corporate verification failed. Please register with a verified company domain.',
        details: verification.verificationDetails,
      });
    }

    // Find or create Company record
    const compDetails = verification.companyDetails;
    let company = await Company.findOne({ domain: compDetails.domain });

    if (!company) {
      company = await Company.create({
        name: compDetails.name,
        domain: compDetails.domain,
        website: compDetails.website,
        logoUrl: compDetails.logoUrl,
        industry: compDetails.industry,
        companySize: compDetails.companySize,
        isVerified: true,
        verificationScore: verification.confidenceScore,
        verificationDetails: verification.verificationDetails,
      });
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const recruiterProfileData = {
      company: company.id || company._id,
      companyName: company.name,
      companyDomain: company.domain,
      title: (title || 'Technical Recruiter').trim(),
      corporateEmail: normalizedEmail,
      linkedinUrl: (linkedinUrl || '').trim(),
      workPhone: (workPhone || '').trim(),
      verificationStatus: 'verified',
      verificationScore: verification.confidenceScore,
      verificationMethod: 'corporate_email_otp_plus_ai_intel',
      canPostJobs: true,
      verifiedAt: new Date(),
    };

    // Purge any legacy unverified user row for this email to maintain zero unverified rows in public.User
    if (existingUser && !existingUser.isVerified) {
      try {
        await User.deleteOne({ _id: existingUser.id || existingUser._id });
      } catch (_) {}
    }

    // Save pending registration outside public.User
    await pendingSignupStore.savePendingSignup({
      email: normalizedEmail,
      name: name.trim(),
      password,
      role: 'recruiter',
      phone: (workPhone || '').trim(),
      emailOtp: otpCode,
      backupOtp: otpCode,
      recruiterProfile: recruiterProfileData,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n🔑 [RECRUITER REGISTRATION OTP] 6-digit corporate code for ${normalizedEmail}: ${otpCode}\n`);
    }

    const isEmailConfigured = Boolean((process.env.SMTP_USER || process.env.EMAIL_USER) && (process.env.SMTP_PASS || process.env.EMAIL_PASS));
    const mailSent = isEmailConfigured || process.env.NODE_ENV === 'production';

    sendOtpEmail(normalizedEmail, name.trim(), otpCode)
      .catch((mailErr) => {
        console.error('[recruiterController.registerRecruiter] Mail dispatch error:', mailErr.message);
      });

    return res.status(201).json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      companyName: company.name,
      mailSent,
      backupOtp: (process.env.NODE_ENV !== 'production' && !mailSent) ? otpCode : undefined,
      message: mailSent
        ? `Corporate verification code sent to ${normalizedEmail}. Please check your Inbox and Spam/Junk folder.`
        : `Corporate registration initiated. A verification code has been dispatched to ${normalizedEmail}. Please check your Inbox and Spam/Junk folder.`,
    });
  } catch (error) {
    next(error);
  }
};

// ── getRecruiterProfile ──────────────────────────────────────
/**
 * GET /api/recruiter/profile
 * Returns logged in recruiter information and company data
 */
const getRecruiterProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('recruiterProfile.company');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const myJobs = await JobOpening.find({ recruiter: req.user._id });
    const totalOpenings = myJobs.length;
    const activeOpenings = myJobs.filter((j) => j.status === 'active').length;
    const jobIds = myJobs.map((j) => j._id);

    const totalApplicants = await JobApplication.countDocuments({ job: { $in: jobIds } });
    const shortlistedCount = await JobApplication.countDocuments({
      job: { $in: jobIds },
      status: { $in: ['shortlisted', 'interview_scheduled'] },
    });

    return res.status(200).json({
      success: true,
      data: {
        recruiter: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.recruiterProfile?.title || 'Technical Recruiter',
          linkedinUrl: user.recruiterProfile?.linkedinUrl || '',
          canPostJobs: user.recruiterProfile?.canPostJobs || false,
          verificationStatus: user.recruiterProfile?.verificationStatus || 'pending',
          verificationScore: user.recruiterProfile?.verificationScore || 0,
        },
        company: user.recruiterProfile?.company || {
          name: user.recruiterProfile?.companyName || 'Enterprise Employer',
          domain: user.recruiterProfile?.companyDomain || '',
          industry: 'Technology',
          isVerified: true,
        },
        stats: {
          totalOpenings,
          activeOpenings,
          totalApplicants,
          shortlistedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── createJob ────────────────────────────────────────────────
/**
 * POST /api/recruiter/jobs
 * Protected: verified recruiter creates a new job opening
 */
const createJob = async (req, res, next) => {
  try {
    const {
      title,
      careerSlug,
      jobType,
      workplace,
      location,
      experienceLevel,
      salaryRange,
      requiredSkills,
      description,
      responsibilities,
      requirements,
      deadline,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Job title and description are required.',
      });
    }

    // Resolve company for recruiter
    let companyId = req.user.recruiterProfile?.company;
    let company = null;
    if (companyId) {
      company = await Company.findById(companyId);
    }
    if (!company) {
      company = await Company.findOne({ domain: req.user.recruiterProfile?.companyDomain });
    }
    if (!company) {
      // Create fallback company for demo/admin recruiter
      const domain = req.user.email.includes('@') ? req.user.email.split('@')[1] : 'careerpath.ai';
      company = await Company.findOneAndUpdate(
        { domain },
        {
          name: req.user.recruiterProfile?.companyName || 'Disheera Enterprise Partner',
          domain,
          website: `https://${domain}`,
          isVerified: true,
          industry: 'Software & Technology',
        },
        { upsert: true, new: true }
      );
    }

    // Normalize required skills
    let formattedSkills = [];
    if (Array.isArray(requiredSkills)) {
      formattedSkills = requiredSkills.map((s) => {
        if (typeof s === 'string') {
          return { skillName: s.toLowerCase().trim(), minimumProficiency: 'intermediate', requiresVerification: true };
        }
        return {
          skillName: (s.skillName || s.name || '').toLowerCase().trim(),
          minimumProficiency: s.minimumProficiency || 'intermediate',
          requiresVerification: s.requiresVerification !== false,
        };
      }).filter((s) => s.skillName);
    }

    const jobOpening = await JobOpening.create({
      recruiter: req.user._id,
      company: company._id,
      companyName: company.name,
      companyLogo: company.logoUrl || `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`,
      companyWebsite: company.website,
      isCompanyVerified: Boolean(company.isVerified),
      title: title.trim(),
      careerSlug: (careerSlug || 'front-end-developer').trim().toLowerCase(),
      jobType: jobType || 'full-time',
      workplace: workplace || 'remote',
      location: location || 'Bengaluru, India',
      experienceLevel: experienceLevel || 'fresher',
      salaryRange: {
        min: Number(salaryRange?.min) || 400000,
        max: Number(salaryRange?.max) || 800000,
        currency: salaryRange?.currency || 'INR',
        isDisclosed: salaryRange?.isDisclosed !== false,
      },
      requiredSkills: formattedSkills,
      description: description.trim(),
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      if (io) {
        io.emit('new_job_opening', {
          job: {
            ...(jobOpening.toObject ? jobOpening.toObject() : jobOpening),
            _id: String(jobOpening._id || jobOpening.id),
            id: String(jobOpening._id || jobOpening.id),
          },
          message: `New verified role posted: ${jobOpening.title} at ${jobOpening.companyName}`,
          timestamp: Date.now(),
        });
      }
    } catch (socketErr) {
      console.warn('[Socket.io] Real-time job broadcast notice:', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Job opening "${jobOpening.title}" posted successfully!`,
      data: jobOpening,
    });
  } catch (error) {
    next(error);
  }
};

// ── getMyJobs ────────────────────────────────────────────────
/**
 * GET /api/recruiter/jobs
 * Returns all jobs created by this recruiter
 */
const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await JobOpening.find({ recruiter: req.user._id }).sort({ createdAt: -1 });

    // Populate live applicant counts
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await JobApplication.countDocuments({ job: job._id });
        const shortlisted = await JobApplication.countDocuments({
          job: job._id,
          status: { $in: ['shortlisted', 'interview_scheduled'] },
        });
        return {
          ...job.toObject(),
          applicantsCount: count,
          shortlistedCount: shortlisted,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        total: jobsWithCounts.length,
        jobs: jobsWithCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getJobDetails ────────────────────────────────────────────
/**
 * GET /api/recruiter/jobs/:id
 */
const getJobDetails = async (req, res, next) => {
  try {
    const job = await JobOpening.findById(req.params.id).populate('company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    const applicantsCount = await JobApplication.countDocuments({ job: job._id });

    return res.status(200).json({
      success: true,
      data: {
        ...job.toObject(),
        applicantsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── updateJob ────────────────────────────────────────────────
/**
 * PATCH /api/recruiter/jobs/:id
 */
const updateJob = async (req, res, next) => {
  try {
    const job = await JobOpening.findOne({ _id: req.params.id, recruiter: req.user._id });
    if (!job && req.user.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Job opening not found or unauthorized' });
    }

    const targetJob = job || (await JobOpening.findById(req.params.id));
    const allowedFields = [
      'title', 'description', 'careerSlug', 'jobType', 'workplace',
      'location', 'experienceLevel', 'salaryRange', 'requiredSkills',
      'responsibilities', 'requirements', 'status', 'deadline'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        targetJob[field] = req.body[field];
      }
    });

    await targetJob.save();

    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      if (io) {
        io.emit('job_status_changed', {
          jobId: String(targetJob._id || targetJob.id),
          status: targetJob.status,
          title: targetJob.title,
          job: targetJob.toObject ? targetJob.toObject() : targetJob,
          timestamp: Date.now(),
        });
      }
    } catch (socketErr) {
      console.warn('[Socket.io] Job update broadcast notice:', socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Job opening updated successfully',
      data: targetJob,
    });
  } catch (error) {
    next(error);
  }
};

// ── deleteJob ────────────────────────────────────────────────
/**
 * DELETE /api/recruiter/jobs/:id
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await JobOpening.findOne({ _id: req.params.id, recruiter: req.user._id });
    if (!job && req.user.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Job opening not found or unauthorized' });
    }

    const targetJob = job || (await JobOpening.findById(req.params.id));
    targetJob.status = 'closed';
    await targetJob.save();

    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      if (io) {
        io.emit('job_status_changed', {
          jobId: String(targetJob._id || targetJob.id),
          status: 'closed',
          title: targetJob.title,
          timestamp: Date.now(),
        });
      }
    } catch (socketErr) {
      console.warn('[Socket.io] Job close broadcast notice:', socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Job opening closed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ── getJobApplicants ─────────────────────────────────────────
/**
 * GET /api/recruiter/jobs/:id/applicants
 * Returns candidate applications enriched with AI match scores and verified skills
 */
const getJobApplicants = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const job = await JobOpening.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    const applications = await JobApplication.find({ job: jobId })
      .populate('student', 'name email avatarUrl skills education careerGoals resumeUrl jobReadiness')
      .sort({ matchScore: -1, createdAt: -1 });

    const enrichedApplicants = applications.map((app) => {
      const student = app.student || {};
      const studentSkills = student.skills || [];

      // Extract candidate's verified credentials
      const verifiedBadges = studentSkills
        .filter((s) => s.isQuizVerified || s.isCodeVerified)
        .map((s) => ({
          name: s.name,
          tier: s.verificationTier || 'quiz_verified',
          isQuiz: Boolean(s.isQuizVerified),
          isCode: Boolean(s.isCodeVerified),
          score: s.quizScore || 85,
        }));

      return {
        applicationId: app._id,
        status: app.status,
        matchScore: app.matchScore,
        matchedSkills: app.matchedSkills,
        missingSkills: app.missingSkills,
        readinessTier: app.readinessTier || student.jobReadiness?.tierLabel || 'Foundational',
        coverNote: app.coverNote,
        recruiterNotes: app.recruiterNotes,
        appliedAt: app.appliedAt,
        student: {
          id: student._id,
          name: student.name || 'Candidate',
          email: student.email || '',
          avatarUrl: student.avatarUrl || '',
          education: student.education || {},
          resumeUrl: app.resumeUrl || student.resumeUrl || '',
          verifiedBadges,
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        jobTitle: job.title,
        jobId: job._id,
        totalApplicants: enrichedApplicants.length,
        applicants: enrichedApplicants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── updateApplicationStatus ──────────────────────────────────
/**
 * PATCH /api/recruiter/applications/:appId/status
 * Recruiter updates applicant status: shortlisted, interview_scheduled, rejected, etc.
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { status, recruiterNotes } = req.body;

    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'rejected', 'interview_scheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await JobApplication.findById(appId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = status;
    if (recruiterNotes !== undefined) {
      application.recruiterNotes = recruiterNotes;
    }
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Applicant stage updated to "${status.replace('_', ' ')}"`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

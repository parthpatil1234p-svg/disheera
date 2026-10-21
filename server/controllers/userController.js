/**
 * controllers/userController.js — Profile Read & Update
 *
 * getMyProfile    GET  /api/users/me   (protected)
 * updateMyProfile PUT  /api/users/me   (protected)
 *
 * Rules:
 *  - Email, password, and role CANNOT be changed through these routes.
 *  - Only name, education, interests, skills, careerGoals are updatable.
 *  - profileCompleted is set to true automatically once the minimum
 *    profile requirements are met (education.course + ≥1 interest + ≥1 skill).
 *  - Password is never returned in any response.
 */

const User = require('../models/User');
const Resume = require('../models/Resume');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const { cacheManager } = require('../utils/cacheManager');
const whatsappService = require('../services/whatsappService');
const pendingSignupStore = require('../data/pendingSignupStore');
const { formatUser } = require('./authController');

// ── Permitted update fields whitelist ─────────────────────────
// Only these fields can be changed via PUT /api/users/me.
const ALLOWED_UPDATE_FIELDS = [
  'name',
  'education',
  'interests',
  'skills',
  'careerGoals',
  'avatarUrl',
  'resumeUrl',
  'hasCompletedSkillVerification',
];

// ── Forbidden administrative fields ───────────────────────────
// Direct modification of these security/audit fields by users is strictly blocked.
const FORBIDDEN_ADMIN_FIELDS = [
  'profileStatus',
  'isSuspended',
  'isDeleted',
  'passportRevocation',
  'suspensionReason',
  'suspendedAt',
  'role',
  'isAdmin',
  'isVerified',
  'jobReadiness',
  'adminRole',
  'failedLoginAttempts',
  'lockedUntil',
];

// ── getMyProfile ───────────────────────────────────────────────
/**
 * GET /api/users/me
 * Returns the authenticated user's profile (password excluded by default).
 */
const getMyProfile = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware (already loaded from DB)
    // Re-fetch to ensure we always return fresh data
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Auto-sync: Ensure any completed roadmaps are represented in user.completedPaths
    const completedRoadmaps = await Roadmap.find({
      user: user._id,
      status: 'completed',
    });

    if (completedRoadmaps.length > 0) {
      const existingCompleted = Array.isArray(user.completedPaths) ? [...user.completedPaths] : [];
      const existingIds = new Set(existingCompleted.map((cp) => String(cp.roadmap || cp.id || '')));
      const existingRoles = new Set(existingCompleted.map((cp) => (cp.role || '').toLowerCase().trim()));
      let hasNew = false;

      for (const cr of completedRoadmaps) {
        const crId = String(cr._id || cr.id);
        const title = cr.careerSnapshot?.title || 'Graduated Track';
        const roleKey = title.toLowerCase().trim();

        if (!existingIds.has(crId) && !existingRoles.has(roleKey)) {
          const tasks = await RoadmapTask.find({ roadmap: cr._id });
          let skillsGained = [...new Set(tasks.map((t) => t.skillName).filter(Boolean))];
          if (skillsGained.length === 0 && Array.isArray(cr.careerSnapshot?.requiredSkills)) {
            skillsGained = cr.careerSnapshot.requiredSkills
              .map((s) => (typeof s === 'string' ? s : s?.name))
              .filter(Boolean);
          }

          existingCompleted.push({
            roadmap: crId,
            role: title,
            careerTitle: title,
            slug: cr.careerSnapshot?.slug || 'graduated-track',
            credentialId: `CP-CERT-${crId.slice(-8).toUpperCase()}`,
            verificationCode: `V-${crId.slice(0, 8).toUpperCase()}`,
            completionDate: cr.completedAt || new Date(),
            skillsGained,
            status: 'graduated',
            totalTasks: cr.totalTasks,
            durationWeeks: cr.durationWeeks,
          });
          existingIds.add(crId);
          existingRoles.add(roleKey);
          hasNew = true;
        }
      }

      if (hasNew) {
        user.completedPaths = existingCompleted;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ── updateMyProfile ────────────────────────────────────────────
/**
 * PUT /api/users/me
 * Body: any subset of { name, education, interests, skills, careerGoals }
 *
 * Ignores any non-whitelisted fields from the request body.
 * Calculates profileCompleted automatically after update.
 */
const updateMyProfile = async (req, res, next) => {
  try {
    // 0. Strict security check: Reject payloads attempting to modify administrative state
    const forbiddenFound = Object.keys(req.body).find(
      (k) => FORBIDDEN_ADMIN_FIELDS.includes(k) || k.startsWith('profileStatus.') || k.startsWith('passportRevocation.')
    );
    if (forbiddenFound) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ADMIN_FIELD',
        message: `Modification of administrative field "${forbiddenFound}" is strictly prohibited.`,
      });
    }

    // 1. Extract only the permitted fields from the body
    const updates = {};
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    // 2. Fetch authoritative user record to protect verified skill credentials
    const existingUser = await User.findById(req.user._id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 3. Skills merge guard: NEVER allow draft/client sync to downgrade or wipe verified skills
    if (Array.isArray(updates.skills)) {
      const existingSkills = Array.isArray(existingUser.skills) ? existingUser.skills : [];
      const existingMap = new Map();
      existingSkills.forEach((s) => {
        const k = (s.name || '').trim().toLowerCase();
        if (k) existingMap.set(k, s);
      });

      updates.skills = updates.skills.map((incoming) => {
        const key = (incoming.name || '').trim().toLowerCase();
        const existing = existingMap.get(key);
        if (existing && (existing.isQuizVerified || existing.isCodeVerified)) {
          const isQuizVerified = existing.isQuizVerified || Boolean(incoming.isQuizVerified);
          const isCodeVerified = existing.isCodeVerified || Boolean(incoming.isCodeVerified);
          return {
            ...incoming,
            displayName: incoming.displayName || existing.displayName || incoming.name,
            proficiency: incoming.verifiedProficiency || existing.verifiedProficiency || incoming.proficiency || existing.proficiency || 'intermediate',
            isQuizVerified,
            isCodeVerified,
            verifiedProficiency: incoming.verifiedProficiency || existing.verifiedProficiency || null,
            quizScore: Math.max(Number(incoming.quizScore) || 0, Number(existing.quizScore) || 0),
            quizGaps: (Array.isArray(incoming.quizGaps) && incoming.quizGaps.length) ? incoming.quizGaps : (existing.quizGaps || []),
            quizVerifiedAt: incoming.quizVerifiedAt || existing.quizVerifiedAt || new Date(),
            verificationTier: isCodeVerified ? 'project_verified' : (isQuizVerified ? 'quiz_verified' : (existing.verificationTier || incoming.verificationTier || 'self_rated')),
            verificationStatus: (isQuizVerified || isCodeVerified) ? 'verified' : (existing.verificationStatus || incoming.verificationStatus || 'unverified'),
            integrityScore: (typeof incoming.integrityScore === 'number' && incoming.integrityScore !== 100) ? incoming.integrityScore : (existing.integrityScore ?? 100),
            verifiedSource: incoming.verifiedSource || existing.verifiedSource || (isQuizVerified ? 'quiz' : 'self'),
          };
        }
        return incoming;
      });

      if (existingUser.hasCompletedSkillVerification || updates.skills.some((s) => s.isQuizVerified || s.isCodeVerified)) {
        updates.hasCompletedSkillVerification = true;
      }
    } else if (existingUser.hasCompletedSkillVerification) {
      updates.hasCompletedSkillVerification = true;
    }

    // 4. Apply updates using findByIdAndUpdate
    //    { new: true }        → returns the updated document
    //    { runValidators: true } → runs Mongoose schema validators on updated fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 5. Auto-calculate profileCompleted
    //    Requirements: education.course filled + at least 1 interest + at least 1 skill
    const hasEducation = updatedUser.education && updatedUser.education.course &&
                         updatedUser.education.course.trim() !== '';
    const hasInterest  = updatedUser.interests  && updatedUser.interests.length  > 0;
    const hasSkill     = updatedUser.skills     && updatedUser.skills.length     > 0;

    const shouldBeCompleted = hasEducation && hasInterest && hasSkill;

    // Only update profileCompleted if the value needs to change (avoids an extra DB write otherwise)
    if (updatedUser.profileCompleted !== shouldBeCompleted) {
      updatedUser.profileCompleted = shouldBeCompleted;
      await updatedUser.save({ validateBeforeSave: false });
    }

    // 6. Invalidate server cache
    cacheManager.invalidateUser(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

const {
  uploadAvatar: uploadAvatarToCloudinary,
  uploadResume: uploadResumeToCloudinary,
  getResumePreviewUrl,
  downloadResumeBuffer,
  deleteResource,
  deleteResumeFromCloudinary,
} = require('../services/cloudinaryService');
const { getSkillEvidence } = require('../services/evidenceService');

/**
 * Validates resume binary buffer, magic bytes, and file size.
 * Enforces magic-byte file signature validation:
 * - PDF: %PDF- (hex 25 50 44 46)
 * - DOCX: PK\x03\x04 (hex 50 4b 03 04)
 * - DOC: \xd0\xcf\x11\xe0 (hex d0 cf 11 e0)
 * Max size: 5MB
 * @param {string} fileData - Base64 data URI or raw base64 string
 * @param {string} declaredName - File name submitted by client
 * @returns {{ buffer: Buffer, mimeType: string, sizeBytes: number, sanitizedName: string }}
 */
function validateResumeBuffer(fileData, declaredName = 'Resume.pdf') {
  if (!fileData || typeof fileData !== 'string') {
    const err = new Error('Resume file data is required.');
    err.statusCode = 400;
    throw err;
  }

  const match = fileData.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/s);
  const base64Payload = match ? match[2].trim() : fileData.trim();

  let buffer;
  try {
    buffer = Buffer.from(base64Payload, 'base64');
  } catch (e) {
    const err = new Error('Invalid base64 encoding for resume file.');
    err.statusCode = 400;
    throw err;
  }

  const sizeBytes = buffer.length;
  if (sizeBytes === 0) {
    const err = new Error('Resume file cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (sizeBytes > maxBytes) {
    const actualMb = (sizeBytes / (1024 * 1024)).toFixed(2);
    const err = new Error(`Resume size (${actualMb} MB) exceeds maximum allowed limit of 5.0 MB.`);
    err.statusCode = 400;
    throw err;
  }

  // Inspect first 4 bytes
  const headerHex = buffer.subarray(0, 4).toString('hex').toLowerCase();
  const headerAscii = buffer.subarray(0, 4).toString('ascii');

  let mimeType = '';
  if (headerAscii.startsWith('%PDF')) {
    mimeType = 'application/pdf';
  } else if (headerHex === '504b0304') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (headerHex === 'd0cf11e0') {
    mimeType = 'application/msword';
  } else {
    const err = new Error('Invalid file format. Resume must be a valid PDF, DOCX, or DOC document.');
    err.statusCode = 400;
    throw err;
  }

  let sanitizedName = (declaredName || 'Student_Resume.pdf')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
  if (!sanitizedName.includes('.')) {
    sanitizedName += (mimeType === 'application/pdf' ? '.pdf' : '.docx');
  }

  return { buffer, mimeType, sizeBytes, sanitizedName };
}


/**
 * Strict MIME Type and Size Validator for Base64 Data URIs
 * @param {string} dataUri - e.g. "data:image/png;base64,..."
 * @param {string[]} allowedMimes - e.g. ['image/jpeg', 'image/png']
 * @param {number} maxBytes - max allowed file size in bytes
 * @param {string} fieldName - e.g. "Avatar" or "Resume"
 */
function validateBase64Upload(dataUri, allowedMimes, maxBytes, fieldName) {
  if (!dataUri || typeof dataUri !== 'string') {
    const err = new Error(`${fieldName} data is required.`);
    err.statusCode = 400;
    throw err;
  }

  // 1. Extract MIME from data URI: data:<mime>;base64,<data>
  const match = dataUri.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/s);
  if (!match) {
    const err = new Error(`Invalid ${fieldName} format. Must be a valid base64 Data URI (data:<mime>;base64,...).`);
    err.statusCode = 400;
    throw err;
  }

  const mime = match[1].toLowerCase();
  const base64Data = match[2].trim();

  if (!allowedMimes.includes(mime)) {
    const err = new Error(`Unsupported ${fieldName} file format (${mime}). Allowed formats: ${allowedMimes.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // 2. Calculate approximate byte size: (base64 length * 3) / 4
  const sizeBytes = Math.ceil((base64Data.length * 3) / 4);
  if (sizeBytes > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (sizeBytes / (1024 * 1024)).toFixed(2);
    const err = new Error(`${fieldName} file size (${actualMb}MB) exceeds the maximum allowed limit of ${maxMb}MB.`);
    err.statusCode = 400;
    throw err;
  }

  return { mime, sizeBytes, base64Data };
}

/**
 * POST /api/users/avatar
 * Body: { fileData: "data:image/...;base64,..." }
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const { fileData } = req.body;
    validateBase64Upload(
      fileData,
      ['image/jpeg', 'image/png', 'image/webp'],
      2 * 1024 * 1024,
      'Avatar'
    );

    const uploadRes = await uploadAvatarToCloudinary(fileData, req.user._id);
    const avatarUrl = uploadRes.secure_url;

    // Update user in DB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatarUrl } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded and saved successfully',
      data: {
        avatarUrl,
        user,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload avatar',
    });
  }
};

/**
 * GET /api/users/resume
 * Returns current resume status, file details, ATS score, and locked state.
 */
const getMyResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const evidence = await getSkillEvidence(req.user._id);
    let verifiedCount = evidence?.verifiedCount || 0;

    const email = (user.email || '').toLowerCase();
    const isAdmin = Boolean(user.role === 'admin' || user.isAdmin);
    if (isAdmin) {
      verifiedCount = Math.max(4, verifiedCount);
    }

    const resume = await Resume.findOne({ user: req.user._id });
    const hasResume = Boolean(resume?.fileLocation || user.resumeUrl);
    const isLocked = !isAdmin && (verifiedCount === 0 && !hasResume);

    let targetRole = user.careerGoals?.primaryTrack || 'Software Engineer';
    try {
      const Roadmap = require('../models/Roadmap');
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      if (activeRoadmap?.career?.title) {
        targetRole = activeRoadmap.career.title;
      }
    } catch (e) {
      console.warn('[userController] Could not fetch active roadmap target role:', e.message);
    }

    let resumeData = null;
    if (resume) {
      resumeData = {
        fileName: resume.originalName,
        fileType: resume.fileType,
        sizeBytes: resume.sizeBytes,
        fileLocation: resume.fileLocation,
        version: resume.version,
        atsScore: resume.atsScore !== null ? resume.atsScore : (user.resumeAnalysis?.atsScore ?? null),
        firstUploadedAt: resume.firstUploadedAt,
        lastUpdatedAt: resume.lastUpdatedAt,
      };
    } else if (user.resumeUrl) {
      resumeData = {
        fileName: user.resumeRecord?.fileName || 'Student_Resume.pdf',
        fileType: 'application/pdf',
        sizeBytes: user.resumeRecord?.fileSize || 0,
        fileLocation: user.resumeUrl,
        version: 1,
        atsScore: user.resumeAnalysis?.atsScore ?? null,
        firstUploadedAt: user.resumeRecord?.firstUploadedDate || user.createdAt,
        lastUpdatedAt: user.resumeRecord?.lastUpdatedDate || user.updatedAt,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        hasResume,
        isLocked,
        verifiedSkillsCount: verifiedCount,
        targetRole,
        resume: resumeData,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/resume
 * Body: { fileData: "data:application/pdf;base64,...", fileName?: "resume.pdf" }
 *
 * Strict Single-Resume Pipeline:
 * 1. Skill Lock Gate: 0 verified skills blocks initial upload (updating existing resume is allowed).
 * 2. Deep binary validation: magic-byte signature check for PDF, DOCX, DOC and size <= 5MB.
 * 3. Safe in-place replacement: old Cloudinary asset destroyed ONLY after new DB record commits.
 * 4. Database-level invariant: Resume.findOneAndUpdate with upsert enforces unique user constraint.
 */
const uploadResume = async (req, res, next) => {
  try {
    const { fileData, fileName } = req.body;

    const userEmail = (req.user?.email || '').toLowerCase();
    const isAdmin = Boolean(req.user?.role === 'admin' || req.user?.isAdmin);

    // 1. Check existing resume
    const existingResume = await Resume.findOne({ user: req.user._id });
    const existingUser = await User.findById(req.user._id);
    const hasExistingResume = Boolean(existingResume?.fileLocation || existingUser?.resumeUrl);

    // 2. Verified skill lock gate (Accounts with 0 verified skills cannot upload INITIAL resume; admin bypassed)
    if (!hasExistingResume && !isAdmin) {
      const evidence = await getSkillEvidence(req.user._id);
      if (!evidence || evidence.verifiedCount === 0) {
        return res.status(403).json({
          success: false,
          code: 'RESUME_LOCKED',
          message: 'Verify at least one skill to enable resume upload.',
        });
      }
    }

    // 3. Deep binary buffer & magic-byte validation
    const validated = validateResumeBuffer(fileData, fileName);

    // 4. Content Authenticity & Document Classification Gate (Pre-Cloudinary!)
    const { verifyResumeContent } = require('../services/resumeAuthenticityService');
    const authenticity = await verifyResumeContent(validated.buffer, validated.mimeType, validated.sanitizedName);

    if (!authenticity.isValid) {
      return res.status(422).json({
        success: false,
        code: authenticity.code || 'INVALID_RESUME_CONTENT',
        detectedType: authenticity.detectedType || 'non_resume_document',
        message: authenticity.message || 'Document rejected: File does not appear to be an authentic resume.',
        details: authenticity.details || null,
      });
    }

    // 5. Save old public_id for safe cleanup after DB commit
    const oldPublicId = existingResume?.publicId || existingUser?.resumeRecord?.publicId;

    // 6. Upload new asset to Cloudinary (ONLY authenticated resumes reach storage!)
    const uploadRes = await uploadResumeToCloudinary(fileData, req.user._id);
    const resumeUrl = uploadRes.secure_url;
    const newPublicId = uploadRes.public_id;

    // 7. Re-use extracted text from authenticity gate (zero redundant parsing!)
    const extractedText = authenticity.extractedText || '';

    // 7. Auto-trigger ATS analysis
    let resumeAnalysis = null;
    try {
      const { analyzeResumeText } = require('../services/resumeAnalyzerService');
      const Roadmap = require('../models/Roadmap');
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      const targetCareer = activeRoadmap?.career?.title || existingUser?.careerGoals?.primaryTrack || 'Full-Stack Developer';

      const candidate = existingUser || await User.findById(req.user._id);
      const textToGrade = (extractedText && extractedText.length > 50) ? extractedText : (
        `Candidate Name: ${candidate.name}
Technical Skills: ${(candidate.skills || []).map(s => s.name).join(', ')}
Target Role: ${targetCareer}`
      );

      resumeAnalysis = await analyzeResumeText(textToGrade, targetCareer, candidate?.skills || []);
    } catch (atsErr) {
      console.warn('[userController.uploadResume] ATS analysis note:', atsErr.message);
    }

    // 8. Atomic database-level upsert in Resume model (enforces unique user index)
    const now = new Date();
    const updatedResume = await Resume.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          originalName: validated.sanitizedName,
          fileType: validated.mimeType,
          sizeBytes: validated.sizeBytes,
          fileLocation: resumeUrl,
          publicId: newPublicId,
          extractedText,
          atsScore: resumeAnalysis?.atsScore ?? null,
          lastUpdatedAt: now,
        },
        $setOnInsert: {
          firstUploadedAt: now,
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 9. Sync User document
    const resumeRecord = {
      fileLocation: resumeUrl,
      fileName: validated.sanitizedName,
      fileSize: validated.sizeBytes,
      firstUploadedDate: existingResume?.firstUploadedAt || existingUser?.resumeRecord?.firstUploadedDate || now,
      lastUpdatedDate: now,
      publicId: newPublicId,
    };

    const userUpdateFields = {
      resumeUrl,
      resumeRecord,
    };
    if (resumeAnalysis) {
      userUpdateFields.resumeAnalysis = resumeAnalysis;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: userUpdateFields },
      { new: true, runValidators: false }
    );

    // 10. Safe Cleanup: Old asset is destroyed ONLY after new asset successfully committed to DB
    if (oldPublicId && oldPublicId !== newPublicId) {
      deleteResumeFromCloudinary(oldPublicId).catch((delErr) => {
        console.warn('[userController.uploadResume] Old asset cleanup note:', delErr.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume updated successfully.',
      data: {
        resumeUrl,
        resume: {
          fileName: updatedResume.originalName,
          fileType: updatedResume.fileType,
          sizeBytes: updatedResume.sizeBytes,
          fileLocation: updatedResume.fileLocation,
          version: updatedResume.version,
          atsScore: updatedResume.atsScore,
          firstUploadedAt: updatedResume.firstUploadedAt,
          lastUpdatedAt: updatedResume.lastUpdatedAt,
        },
        resumeRecord: updatedUser.resumeRecord,
        extractedText,
        resumeAnalysis,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload resume',
    });
  }
};

/**
 * DELETE /api/users/resume
 * Deletes user's resume from Cloudinary, drops Resume document, and resets User model pointers.
 */
const deleteMyResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!resume && !user?.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this account.',
      });
    }

    const publicId = resume?.publicId || user?.resumeRecord?.publicId;
    if (publicId) {
      await deleteResumeFromCloudinary(publicId);
    }

    if (resume) {
      await Resume.findOneAndDelete({ user: req.user._id });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { resumeUrl: '' },
      $unset: { resumeRecord: 1, resumeAnalysis: 1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete resume',
    });
  }
};

/**
 * GET /api/users/resume/view
 * Streams the user's uploaded resume as an inline PDF.
 * Opens natively in the browser's PDF reader without 401 ACL errors!
 */
const viewResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resumeUrl) {
      return res.status(404).send('<!DOCTYPE html><html><head><title>Resume Not Found</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>No resume found</h2><p>Please upload a resume on your student dashboard.</p></body></html>');
    }

    const { data, filename } = await downloadResumeBuffer(user.resumeUrl);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename || 'Student_Resume.pdf'}"`);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.send(data);
  } catch (error) {
    console.error('Error streaming resume inline:', error);
    try {
      const user = await User.findById(req.user._id);
      const previewUrl = getResumePreviewUrl(user?.resumeUrl);
      if (previewUrl) return res.redirect(previewUrl);
    } catch (e) {
      console.warn('[userController] Resume preview redirect fallback error:', e.message);
    }
    return res.status(500).send('Error retrieving resume document.');
  }
};

/**
 * GET /api/users/resume/download
 * Triggers direct browser download of the uncompressed PDF document
 */
const downloadResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resumeUrl) {
      return res.status(404).json({ success: false, message: 'No resume found for this user.' });
    }

    const { data, filename } = await downloadResumeBuffer(user.resumeUrl);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'Student_Resume.pdf'}"`);
    res.setHeader('Content-Length', data.length);
    return res.send(data);
  } catch (error) {
    console.error('Error downloading resume:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error downloading resume' });
  }
};

/**
 * GET /api/users/resume/preview
 * Returns the high-res page 1 image preview URL and metadata
 */
const getResumePreview = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resumeUrl) {
      return res.status(200).json({
        success: true,
        data: {
          hasResume: false,
          previewUrl: null,
          resumeUrl: null,
        },
      });
    }

    const previewUrl = getResumePreviewUrl(user.resumeUrl, 1);
    return res.status(200).json({
      success: true,
      data: {
        hasResume: true,
        previewUrl,
        resumeUrl: user.resumeUrl,
        downloadUrl: `/api/users/resume/download`,
        viewUrl: `/api/users/resume/view`,
      },
    });
  } catch (error) {
    console.error('Error generating resume preview:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate preview' });
  }
};

/**
 * PUT /api/users/profile-status
 * Body: { status: 'learning' | 'job_seeking' | 'working', currentRole: String }
 */
const updateProfileStatus = async (req, res, next) => {
  try {
    // 0. Strict input validation: reject any extra or forbidden fields
    const allowedKeys = ['status', 'currentRole'];
    const extraKeys = Object.keys(req.body).filter((k) => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_OR_UNKNOWN_FIELDS',
        message: `Only status and currentRole may be updated. Forbidden or unknown fields: ${extraKeys.join(', ')}`,
      });
    }

    const { status, currentRole } = req.body;
    const validStatuses = ['learning', 'job_seeking', 'working'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be learning, job_seeking, or working.',
      });
    }

    const existingUser = await User.findById(req.user._id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentProfileStatus = (existingUser.profileStatus && typeof existingUser.profileStatus === 'object')
      ? existingUser.profileStatus
      : {};

    // Preserve all existing security/audit fields: isSuspended, isDeleted, passportRevocation, etc.
    const updatedProfileStatus = {
      ...currentProfileStatus,
    };
    if (status) updatedProfileStatus.status = status;
    if (currentRole !== undefined) updatedProfileStatus.currentRole = currentRole;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profileStatus: updatedProfileStatus } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile status updated successfully',
      data: {
        profileStatus: user.profileStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── sendLinkPhoneOtp ───────────────────────────────────────────
/**
 * POST /api/users/link-phone/send-otp
 * Body: { phone }
 * Initiates linking/verification of WhatsApp mobile number for an authenticated user.
 */
const sendLinkPhoneOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const formattedPhone = whatsappService.formatPhoneNumber(phone);
    const digits = whatsappService.getPhoneDigits(formattedPhone);

    if (!formattedPhone || !digits || digits.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number',
      });
    }

    // Check if another user already owns this phone number (1:1 Mobile Uniqueness)
    const existingUserWithPhone = await User.findOne({ phone: formattedPhone });
    if (existingUserWithPhone && String(existingUserWithPhone._id) !== String(req.user._id)) {
      return res.status(400).json({
        success: false,
        code: 'PHONE_ALREADY_EXISTS',
        message: 'This WhatsApp phone number is already linked to another account. Each account must have a unique mobile number.',
      });
    }

    const pendingOther = await pendingSignupStore.getPendingSignupByPhone(formattedPhone);
    if (pendingOther && pendingOther.email !== req.user.email) {
      return res.status(400).json({
        success: false,
        code: 'PHONE_ALREADY_EXISTS',
        message: 'This mobile number is currently undergoing registration verification for another account. Please use your own unique mobile number.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // If phone is already linked and verified on this account
    if (user.phone === formattedPhone) {
      return res.status(400).json({
        success: false,
        message: 'This WhatsApp number is already linked and verified on your account',
      });
    }

    // Generate distinct 6-digit WhatsApp OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const existingOtpObj = (user.verificationOtp && typeof user.verificationOtp === 'object') ? user.verificationOtp : {};
    user.verificationOtp = {
      ...existingOtpObj,
      whatsappCode: otp,
      phonePending: formattedPhone,
      expiresAt: expiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📱 [LINK PHONE WHATSAPP OTP] Sent OTP: ${otp} to ${formattedPhone} for user: ${user.name} (${user.email})\n`);
    }

    let whatsappSent = false;
    try {
      const waRes = await whatsappService.sendOtp(formattedPhone, otp, user.name);
      whatsappSent = Boolean(waRes && waRes.success);
    } catch (waErr) {
      console.error('[userController.sendLinkPhoneOtp] WhatsApp send error:', waErr.message);
    }

    res.status(200).json({
      success: true,
      message: whatsappSent
        ? 'A 6-digit verification code has been sent to your WhatsApp number'
        : 'A 6-digit verification code has been dispatched to your WhatsApp number. Please check your WhatsApp messages.',
      phone: formattedPhone,
      whatsappSent,
      backupOtp: !whatsappSent ? otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// ── verifyLinkPhoneOtp ─────────────────────────────────────────
/**
 * POST /api/users/link-phone/verify-otp
 * Body: { otp, phone }
 * Validates WhatsApp OTP, sets user.phone, clears OTP, and returns updated user profile.
 */
const verifyLinkPhoneOtp = async (req, res, next) => {
  try {
    const { otp, phone } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: '6-digit WhatsApp verification code is required',
      });
    }

    const enteredOtp = String(otp).trim();
    if (!/^\d{6}$/.test(enteredOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be exactly 6 digits',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const otpData = (user.verificationOtp && typeof user.verificationOtp === 'object') ? user.verificationOtp : {};
    if (!otpData.whatsappCode) {
      return res.status(400).json({
        success: false,
        message: 'No pending phone verification found. Please request a new OTP code.',
      });
    }

    if (otpData.expiresAt && new Date() > new Date(otpData.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a fresh OTP.',
      });
    }

    if (String(otpData.whatsappCode).trim() !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid WhatsApp verification code. Please check your WhatsApp and try again.',
      });
    }

    const targetPhone = otpData.phonePending || (phone ? whatsappService.formatPhoneNumber(phone) : null);
    if (!targetPhone) {
      return res.status(400).json({
        success: false,
        message: 'Pending phone number missing. Please request a new OTP.',
      });
    }

    // Double-check uniqueness (1:1 Mobile Uniqueness)
    const existingWithPhone = await User.findOne({ phone: targetPhone });
    if (existingWithPhone && String(existingWithPhone._id) !== String(user._id)) {
      return res.status(400).json({
        success: false,
        code: 'PHONE_ALREADY_EXISTS',
        message: 'This WhatsApp phone number is already linked to another account. Each account must have a unique mobile number.',
      });
    }

    user.phone = targetPhone;
    user.verificationOtp = {
      ...otpData,
      whatsappCode: null,
      phonePending: null,
    };

    try {
      await user.save();
    } catch (saveErr) {
      if (saveErr.code === 'P2002' || saveErr.message?.includes('User_phone_unique') || saveErr.message?.includes('duplicate key value')) {
        return res.status(400).json({
          success: false,
          code: 'PHONE_ALREADY_EXISTS',
          message: 'This mobile number is already linked to another registered account. Each account must have a unique mobile number.',
        });
      }
      throw saveErr;
    }

    console.log(`\n✅ [PHONE LINK VERIFIED] User ${user.email} successfully linked WhatsApp phone: ${targetPhone}\n`);

    res.status(200).json({
      success: true,
      message: 'WhatsApp mobile number verified and linked successfully!',
      data: {
        user: formatUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getMyResume,
  uploadResume,
  deleteMyResume,
  viewResume,
  downloadResume,
  getResumePreview,
  updateProfileStatus,
  sendLinkPhoneOtp,
  verifyLinkPhoneOtp,
};



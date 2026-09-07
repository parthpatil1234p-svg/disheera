/**
 * middleware/validateRequest.js — Input Validation Middleware
 *
 * Provides three simple, dependency-free validation functions:
 *
 *  validateRegister      — checks name, email, password for POST /api/auth/register
 *  validateLogin         — checks email, password for POST /api/auth/login
 *  validateProfileUpdate — checks optional profile fields for PUT /api/users/me
 *
 * On failure returns HTTP 400 with this exact shape:
 *  {
 *    "success": false,
 *    "message": "Validation failed",
 *    "errors": [{ "field": "email", "message": "..." }]
 *  }
 *
 * On success calls next() so the request proceeds to the controller.
 */

// ── Helpers ────────────────────────────────────────────────────
const mongoose = require('mongoose');

/** Basic email format check */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Send the standardised validation error response */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
};

// ── validateRegister ───────────────────────────────────────────
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (name.trim().length > 60) {
    errors.push({ field: 'name', message: 'Name must not exceed 60 characters' });
  }

  // email
  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // password
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

// ── validateLogin ──────────────────────────────────────────────
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // email
  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // password (just required — don't reveal length constraints on login)
  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

// ── validateProfileUpdate ──────────────────────────────────────
const validateProfileUpdate = (req, res, next) => {
  const { name, education, interests, skills, careerGoals } = req.body;
  const errors = [];

  // name (optional, but if provided must be valid)
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    } else if (name.trim().length > 60) {
      errors.push({ field: 'name', message: 'Name must not exceed 60 characters' });
    }
  }

  // education — must be a plain object if provided
  if (education !== undefined) {
    if (typeof education !== 'object' || Array.isArray(education) || education === null) {
      errors.push({ field: 'education', message: 'Education must be an object' });
    }
  }

  // interests — must be an array of strings if provided
  if (interests !== undefined) {
    if (!Array.isArray(interests)) {
      errors.push({ field: 'interests', message: 'Interests must be an array' });
    } else {
      const badInterest = interests.find((i) => typeof i !== 'string');
      if (badInterest !== undefined) {
        errors.push({ field: 'interests', message: 'Each interest must be a string' });
      }
    }
  }

  // skills — must be array, each item must have name + valid proficiency
  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      errors.push({ field: 'skills', message: 'Skills must be an array' });
    } else {
      const validProficiencies = ['beginner', 'intermediate', 'advanced'];
      skills.forEach((skill, idx) => {
        if (!skill.name || typeof skill.name !== 'string' || skill.name.trim() === '') {
          errors.push({
            field: `skills[${idx}].name`,
            message: `Skill at index ${idx} must have a name`,
          });
        }
        if (!skill.proficiency || !validProficiencies.includes(skill.proficiency)) {
          errors.push({
            field: `skills[${idx}].proficiency`,
            message: `Skill at index ${idx} proficiency must be beginner, intermediate, or advanced`,
          });
        }
      });
    }
  }

  // careerGoals — must be an array of strings if provided
  if (careerGoals !== undefined) {
    if (!Array.isArray(careerGoals)) {
      errors.push({ field: 'careerGoals', message: 'Career goals must be an array' });
    } else {
      const badGoal = careerGoals.find((g) => typeof g !== 'string');
      if (badGoal !== undefined) {
        errors.push({ field: 'careerGoals', message: 'Each career goal must be a string' });
      }
    }
  }

  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

// ── validateAssessment ─────────────────────────────────────────
/**
 * Validation for PUT /api/assessment
 *
 * Rules:
 *  - education must be an object with non-empty education.course
 *  - interests must be a non-empty array (max 10 items) of non-empty strings
 *  - skills must be a non-empty array (max 20 items)
 *  - each skill must have valid name and proficiency (beginner, intermediate, advanced)
 *  - no duplicate skills allowed (case-insensitive check)
 */
const validateAssessment = (req, res, next) => {
  const { education, interests, skills, careerGoals } = req.body;
  const errors = [];

  // 1. education
  if (!education || typeof education !== 'object' || Array.isArray(education)) {
    errors.push({ field: 'education', message: 'Education details must be an object' });
  } else {
    if (!education.course || typeof education.course !== 'string' || education.course.trim() === '') {
      errors.push({ field: 'education.course', message: 'Degree or Course is required (e.g. BCA, B.Tech)' });
    }
  }

  // 2. interests
  if (!interests || !Array.isArray(interests) || interests.length === 0) {
    errors.push({ field: 'interests', message: 'At least one interest is required' });
  } else {
    if (interests.length > 10) {
      errors.push({ field: 'interests', message: 'Cannot select more than 10 interests' });
    }
    interests.forEach((item, idx) => {
      if (!item || typeof item !== 'string' || item.trim() === '') {
        errors.push({ field: `interests[${idx}]`, message: 'Each interest must be a non-empty string' });
      }
    });
  }

  // 3. skills
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    errors.push({ field: 'skills', message: 'At least one skill is required' });
  } else {
    if (skills.length > 20) {
      errors.push({ field: 'skills', message: 'Cannot select more than 20 skills' });
    }

    const seenSkillNames = new Set();
    const validProficiencies = ['beginner', 'intermediate', 'advanced'];

    skills.forEach((skill, idx) => {
      if (!skill || typeof skill !== 'object') {
        errors.push({ field: `skills[${idx}]`, message: `Skill at index ${idx} must be an object` });
        return;
      }

      const skillName = typeof skill.name === 'string' ? skill.name.trim().toLowerCase() : '';

      if (!skillName) {
        errors.push({ field: `skills[${idx}].name`, message: `Skill at index ${idx} must have a name` });
      } else if (seenSkillNames.has(skillName)) {
        errors.push({
          field: `skills[${idx}].name`,
          message: `Duplicate skill "${skill.name}" is not allowed`,
        });
      } else {
        seenSkillNames.add(skillName);
      }

      const prof = typeof skill.proficiency === 'string' ? skill.proficiency.trim().toLowerCase() : '';
      if (!prof || !validProficiencies.includes(prof)) {
        errors.push({
          field: `skills[${idx}].proficiency`,
          message: `Skill "${skill.name || idx}" proficiency must be beginner, intermediate, or advanced`,
        });
      }
    });
  }

  // 4. careerGoals (optional)
  if (careerGoals !== undefined) {
    if (!Array.isArray(careerGoals)) {
      errors.push({ field: 'careerGoals', message: 'Career goals must be an array' });
    } else {
      careerGoals.forEach((goal, idx) => {
        if (typeof goal !== 'string') {
          errors.push({ field: `careerGoals[${idx}]`, message: 'Each career goal must be a string' });
        }
      });
    }
  }

  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

// ── validateRoadmapGeneration ──────────────────────────────────
/**
 * Validation for POST /api/roadmaps/generate
 *
 * Rules:
 *  - careerSlug: required string, max 100 chars
 *  - durationWeeks: required integer and must be 4, 8, or 12
 */
const validateRoadmapGeneration = (req, res, next) => {
  const { careerSlug, durationWeeks } = req.body;
  const errors = [];

  if (!careerSlug || typeof careerSlug !== 'string' || careerSlug.trim() === '') {
    errors.push({ field: 'careerSlug', message: 'Career slug is required' });
  } else if (careerSlug.trim().length > 100) {
    errors.push({ field: 'careerSlug', message: 'Career slug cannot exceed 100 characters' });
  }

  const validDurations = [4, 8, 12];
  const parsedDuration = Number(durationWeeks);

  if (
    durationWeeks === undefined ||
    isNaN(parsedDuration) ||
    !validDurations.includes(parsedDuration)
  ) {
    errors.push({ field: 'durationWeeks', message: 'Duration must be 4, 8, or 12 weeks' });
  }

  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

// ── validateTaskId ─────────────────────────────────────────────
/**
 * Validation for routes containing :taskId parameter
 */
const validateTaskId = (req, res, next) => {
  const { taskId } = req.params;

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID format',
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateAssessment,
  validateRoadmapGeneration,
  validateTaskId,
};


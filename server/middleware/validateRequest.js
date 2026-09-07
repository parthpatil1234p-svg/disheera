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

module.exports = { validateRegister, validateLogin, validateProfileUpdate };

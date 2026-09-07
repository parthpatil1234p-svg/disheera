/**
 * models/User.js — Mongoose User Schema
 *
 * Defines the shape of every document in the `users` MongoDB collection.
 *
 * Fields:
 *  name, email, password (hashed), role, education, interests,
 *  skills (with proficiency), careerGoals, profileCompleted
 *
 * Security:
 *  - Password is hashed with bcrypt (salt rounds 12) in a pre-save hook.
 *  - Password field uses `select: false` so it is NEVER returned by default.
 *  - Use .select('+password') only when you need to compare for login.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Sub-schema: a single skill entry ─────────────────────────
const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    proficiency: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Proficiency must be beginner, intermediate, or advanced',
      },
      required: [true, 'Skill proficiency is required'],
      lowercase: true,
    },
  },
  { _id: false } // No separate _id for sub-documents
);

// ── Sub-schema: education details ────────────────────────────
const EducationSchema = new mongoose.Schema(
  {
    course:  { type: String, trim: true, default: '' },
    branch:  { type: String, trim: true, default: '' },
    year:    { type: String, trim: true, default: '' },
    college: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// ── Main User Schema ──────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    // Basic identity
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [60, 'Name must not exceed 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // select: false → password is NEVER returned in a query unless explicitly asked
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    // Role-based access control (student vs admin)
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be student or admin',
      },
      default: 'student',
    },

    // Academic background
    education: {
      type: EducationSchema,
      default: () => ({}),
    },

    // Career interests (e.g. ["AI/ML", "Web Development"])
    interests: {
      type: [String],
      default: [],
    },

    // Skills the student currently has
    skills: {
      type: [SkillSchema],
      default: [],
    },

    // What the student wants to achieve (e.g. ["Get a job at a startup"])
    careerGoals: {
      type: [String],
      default: [],
    },

    // True once the user has filled in education + interests + skills
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ── Pre-save hook: Hash password before saving ────────────────
// Only runs when the password field has been modified (new user or password change).
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    // 12 salt rounds — secure enough for 2024 hardware, reasonable performance
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare a plain password with the stored hash ────
UserSchema.methods.comparePassword = async function (enteredPassword) {
  // `this.password` is only available if the document was queried with .select('+password')
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

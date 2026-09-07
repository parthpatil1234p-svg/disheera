/**
 * models/Career.js — Mongoose Career Schema
 *
 * Defines target careers, required skill profiles, importance levels,
 * education preferences, and interest tags for the recommendation engine.
 *
 * Fields:
 *  - title: String (unique)
 *  - slug: String (unique URL-friendly identifier)
 *  - shortDescription: String (max 250 chars)
 *  - longDescription: String (max 1200 chars)
 *  - category: String (enum)
 *  - icon: String (optional Bootstrap icon class)
 *  - color: String (optional hex color code)
 *  - educationPreferences: [String] (e.g. ["BCA", "B.Tech", "Computer Science"])
 *  - interestTags: [String] (lowercase, e.g. ["web development", "coding"])
 *  - requiredSkills: Array of subdocuments referencing Skill with importance & requiredProficiency
 *  - active: Boolean (default true)
 *
 * Timestamps enabled: createdAt, updatedAt
 */

const mongoose = require('mongoose');
require('./Skill'); // Ensure Skill model is registered for populate('requiredSkills.skill')

const CareerCategoryEnum = [
  'development',
  'data',
  'design',
  'security',
  'cloud',
  'ai',
];

const RequiredSkillSchema = new mongoose.Schema(
  {
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required'],
    },
    importance: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: 'Importance must be high, medium, or low',
      },
      default: 'medium',
      lowercase: true,
    },
    requiredProficiency: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Required proficiency must be beginner, intermediate, or advanced',
      },
      default: 'beginner',
      lowercase: true,
    },
  },
  { _id: false }
);

const CareerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Career title is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Career slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [250, 'Short description cannot exceed 250 characters'],
    },
    longDescription: {
      type: String,
      required: [true, 'Long description is required'],
      trim: true,
      maxlength: [1200, 'Long description cannot exceed 1200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Career category is required'],
      enum: {
        values: CareerCategoryEnum,
        message: 'Invalid career category: {VALUE}',
      },
      lowercase: true,
    },
    icon: {
      type: String,
      trim: true,
      default: 'bi-briefcase-fill',
    },
    color: {
      type: String,
      trim: true,
      default: '#22D3EE',
    },
    educationPreferences: {
      type: [String],
      default: [],
    },
    interestTags: {
      type: [String],
      default: [],
      set: (tags) => (Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()) : []),
    },
    requiredSkills: {
      type: [RequiredSkillSchema],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for active, category, slug, and interestTags
CareerSchema.index({ active: 1 });
CareerSchema.index({ category: 1 });
CareerSchema.index({ interestTags: 1 });
CareerSchema.index({ title: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Career', CareerSchema);

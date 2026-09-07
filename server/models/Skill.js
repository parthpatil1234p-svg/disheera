/**
 * models/Skill.js — Mongoose Skill Schema
 *
 * Defines industry skills referenced by Careers and assigned to Users.
 *
 * Fields:
 *  - name: String (unique identifier, e.g. "javascript", "react", "sql")
 *  - displayName: String (formatted label, e.g. "JavaScript", "React.js")
 *  - category: String (enum)
 *  - description: String (optional summary, max 300 chars)
 *  - active: Boolean (default true)
 *
 * Timestamps enabled: createdAt, updatedAt
 */

const mongoose = require('mongoose');

const SkillCategoryEnum = [
  'frontend',
  'backend',
  'database',
  'data',
  'design',
  'security',
  'cloud',
  'soft-skill',
  'tool',
  'other',
];

const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: [true, 'Skill display name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      enum: {
        values: SkillCategoryEnum,
        message: 'Invalid skill category: {VALUE}',
      },
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Skill description cannot exceed 300 characters'],
      default: '',
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

// Indexes for high performance querying
SkillSchema.index({ category: 1 });
SkillSchema.index({ active: 1 });
SkillSchema.index({ displayName: 'text', description: 'text' });

module.exports = mongoose.model('Skill', SkillSchema);

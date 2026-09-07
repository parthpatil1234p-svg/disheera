/**
 * models/Roadmap.js — Mongoose Roadmap Schema
 *
 * Represents a student's personalized learning roadmap for a specific career path.
 * Tracks week duration, active status, completion metrics, and snapshot data.
 */

const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    career: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Career',
      required: [true, 'Career reference is required'],
    },
    careerSnapshot: {
      title: { type: String, required: true },
      slug: { type: String, required: true },
      shortDescription: { type: String, default: '' },
    },
    durationWeeks: {
      type: Number,
      required: [true, 'Duration in weeks is required'],
      enum: {
        values: [4, 8, 12],
        message: 'Duration must be 4, 8, or 12 weeks',
      },
      default: 4,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'archived'],
        message: 'Status must be active, completed, or archived',
      },
      default: 'active',
    },
    generatedFrom: {
      missingSkills: { type: [String], default: [] },
      weakSkills: { type: [String], default: [] },
      userInterests: { type: [String], default: [] },
      userSkillNames: { type: [String], default: [] },
    },
    totalTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's active roadmap efficiently
RoadmapSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Roadmap', RoadmapSchema);

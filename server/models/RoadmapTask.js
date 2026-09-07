/**
 * models/RoadmapTask.js — Mongoose Roadmap Task Schema
 *
 * Defines individual actionable tasks within a week of a student's learning roadmap.
 * Contains estimated hours, learning resource links, and completion tracking.
 */

const mongoose = require('mongoose');

const RoadmapTaskSchema = new mongoose.Schema(
  {
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: [true, 'Roadmap reference is required'],
      index: true,
    },
    weekNumber: {
      type: Number,
      required: [true, 'Week number is required'],
      min: [1, 'Week number must be at least 1'],
      max: [12, 'Week number cannot exceed 12'],
    },
    order: {
      type: Number,
      required: [true, 'Task order within the week is required'],
      min: 1,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [140, 'Task title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      maxlength: [500, 'Task description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['learn', 'practice', 'project', 'assessment'],
        message: 'Task type must be learn, practice, project, or assessment',
      },
      default: 'learn',
      lowercase: true,
    },
    skillName: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: 'Priority must be high, medium, or low',
      },
      default: 'medium',
      lowercase: true,
    },
    estimatedHours: {
      type: Number,
      default: 2,
      min: [1, 'Estimated hours must be at least 1'],
      max: [40, 'Estimated hours cannot exceed 40'],
    },
    resource: {
      title: { type: String, default: '' },
      url: { type: String, default: '' },
      provider: { type: String, default: '' },
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying tasks by roadmap and week order
RoadmapTaskSchema.index({ roadmap: 1, weekNumber: 1, order: 1 });

module.exports = mongoose.model('RoadmapTask', RoadmapTaskSchema);

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/Resume.js — Pure Prisma ORM Resume Model
 *
 * Implements Mongoose-compatible interface for uploaded resumes.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

class ResumeDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'Resume', fieldMap = { user: 'userId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
  }
}

const ResumeModel = createPrismaModel('Resume', {
  user: 'userId',
});

const Resume = function (data = {}) {
  return new ResumeDocument(data, 'Resume', { user: 'userId' }, true);
};

Object.assign(Resume, ResumeModel);

// findOneAndUpdate helper
Resume.findOneAndUpdate = async function (filter, update, options = {}) {
  const crypto = require('crypto');
  const where = { ...filter };
  if (where.user) {
    where.userId = String(where.user);
    delete where.user;
  }
  if (where._id) {
    where.id = String(where._id);
    delete where._id;
  }

  const existing = await Resume.findOne(where);
  if (!existing && options.upsert) {
    const rawData = update.$set || update || {};
    const createData = {
      id: crypto.randomUUID(),
      userId: where.userId || String(filter.user || filter.userId),
      ...(update.$setOnInsert || {}),
      ...rawData,
    };
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        createData[k] = (createData[k] || 0) + v;
      }
    }
    if (!createData.publicId) {
      createData.publicId = `disheera/resumes/resume_${createData.userId}_${Date.now()}`;
    }
    delete createData.$set;
    delete createData.$setOnInsert;
    delete createData.$inc;
    delete createData.user;
    return Resume.create(createData);
  }
  if (!existing) return null;

  const updatePayload = { ...update };
  if (update.$inc) {
    const currentSet = updatePayload.$set ? { ...updatePayload.$set } : {};
    for (const [k, v] of Object.entries(update.$inc)) {
      currentSet[k] = (existing[k] !== undefined && existing[k] !== null ? Number(existing[k]) : 0) + Number(v);
    }
    updatePayload.$set = currentSet;
    delete updatePayload.$inc;
  }

  return Resume.findByIdAndUpdate(existing.id, updatePayload, options);
};

const origFindOne = ResumeModel.findOne;
Resume.findOne = function (filter = {}) {
  const query = origFindOne.call(ResumeModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new ResumeDocument(res, 'Resume', { user: 'userId' });
  };
  return query;
};

const origFindById = ResumeModel.findById;
Resume.findById = function (id) {
  const query = origFindById.call(ResumeModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new ResumeDocument(res, 'Resume', { user: 'userId' });
  };
  return query;
};

module.exports = Resume;

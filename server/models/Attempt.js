/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/Attempt.js — Pure Prisma ORM Attempt Model
 *
 * Implements Mongoose-compatible interface for skill quizzes & milestone tests.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

function sanitizeAttemptFilter(filter = {}) {
  if (!filter || typeof filter !== 'object') return filter;
  const clean = { ...filter };
  if (clean.status !== undefined) {
    if (clean.status === 'completed') {
      clean.submitTime = { $ne: null };
    } else if (clean.status === 'in_progress') {
      clean.submitTime = null;
    }
    delete clean.status;
  }
  return clean;
}

class AttemptDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'Attempt', fieldMap = { user: 'userId', roadmap: 'roadmapId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
  }

  async save() {
    // Preserve virtual fields into integrityMetadata if needed
    if (this.status || this.strikesCount !== undefined || this.violationLog) {
      if (!this.integrityMetadata || typeof this.integrityMetadata !== 'object') {
        this.integrityMetadata = {};
      }
      if (this.status) this.integrityMetadata.status = this.status;
      if (this.strikesCount !== undefined) this.integrityMetadata.strikesCount = this.strikesCount;
      if (this.violationLog) this.integrityMetadata.violationLog = this.violationLog;

      delete this.status;
      delete this.strikesCount;
      delete this.violationLog;
    }
    return super.save();
  }
}

const AttemptModel = createPrismaModel('Attempt', {
  user: 'userId',
  roadmap: 'roadmapId',
});

const Attempt = function (data = {}) {
  return new AttemptDocument(data, 'Attempt', { user: 'userId', roadmap: 'roadmapId' }, true);
};

Object.assign(Attempt, AttemptModel);

const origFindOne = AttemptModel.findOne;
Attempt.findOne = function (filter = {}) {
  const query = origFindOne.call(AttemptModel, sanitizeAttemptFilter(filter));
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new AttemptDocument(res, 'Attempt', { user: 'userId', roadmap: 'roadmapId' });
  };
  return query;
};

const origFindById = AttemptModel.findById;
Attempt.findById = function (id) {
  const query = origFindById.call(AttemptModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new AttemptDocument(res, 'Attempt', { user: 'userId', roadmap: 'roadmapId' });
  };
  return query;
};

const origFind = AttemptModel.find;
Attempt.find = function (filter = {}) {
  const query = origFind.call(AttemptModel, sanitizeAttemptFilter(filter));
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const list = await origExec();
    if (query._isLean) return list;
    return list.map((doc) => new AttemptDocument(doc, 'Attempt', { user: 'userId', roadmap: 'roadmapId' }));
  };
  return query;
};

Attempt.countDocuments = function (filter = {}) {
  return AttemptModel.countDocuments(sanitizeAttemptFilter(filter));
};

Attempt.create = async function (data = {}) {
  if (Array.isArray(data)) {
    const results = [];
    for (const item of data) {
      const doc = new AttemptDocument(item, 'Attempt', { user: 'userId', roadmap: 'roadmapId' }, true);
      await doc.save();
      results.push(doc);
    }
    return results;
  }
  const doc = new AttemptDocument(data, 'Attempt', { user: 'userId', roadmap: 'roadmapId' }, true);
  await doc.save();
  return doc;
};

module.exports = Attempt;

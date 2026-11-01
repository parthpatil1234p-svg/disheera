/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/Roadmap.js — Pure Prisma ORM Roadmap Model
 *
 * Implements Mongoose-compatible interface for learning roadmaps.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

class RoadmapDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'Roadmap', fieldMap = { user: 'userId', career: 'careerId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
    // If career relation is included, ensure doc.career is accessible
    if (this.career && typeof this.career === 'object') {
      this.career._id = this.career.id;
    }
  }
}

const RoadmapModel = createPrismaModel('Roadmap', {
  user: 'userId',
  career: 'careerId',
});

const Roadmap = function (data = {}) {
  return new RoadmapDocument(data, 'Roadmap', { user: 'userId', career: 'careerId' }, true);
};

Object.assign(Roadmap, RoadmapModel);

const origFindOne = RoadmapModel.findOne;
Roadmap.findOne = function (filter = {}) {
  const query = origFindOne.call(RoadmapModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new RoadmapDocument(res, 'Roadmap', { user: 'userId', career: 'careerId' });
  };
  return query;
};

const origFindById = RoadmapModel.findById;
Roadmap.findById = function (id) {
  const query = origFindById.call(RoadmapModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new RoadmapDocument(res, 'Roadmap', { user: 'userId', career: 'careerId' });
  };
  return query;
};

const origFind = RoadmapModel.find;
Roadmap.find = function (filter = {}) {
  const query = origFind.call(RoadmapModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const list = await origExec();
    if (query._isLean) return list;
    return list.map((doc) => new RoadmapDocument(doc, 'Roadmap', { user: 'userId', career: 'careerId' }));
  };
  return query;
};

module.exports = Roadmap;

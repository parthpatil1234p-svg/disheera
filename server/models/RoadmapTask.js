/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/RoadmapTask.js — Pure Prisma ORM RoadmapTask Model
 *
 * Implements Mongoose-compatible interface for weekly learning tasks.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

class RoadmapTaskDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'RoadmapTask', fieldMap = { roadmap: 'roadmapId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
  }
}

const RoadmapTaskModel = createPrismaModel('RoadmapTask', {
  roadmap: 'roadmapId',
});

const RoadmapTask = function (data = {}) {
  return new RoadmapTaskDocument(data, 'RoadmapTask', { roadmap: 'roadmapId' }, true);
};

Object.assign(RoadmapTask, RoadmapTaskModel);

const origFindOne = RoadmapTaskModel.findOne;
RoadmapTask.findOne = function (filter = {}) {
  const query = origFindOne.call(RoadmapTaskModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new RoadmapTaskDocument(res, 'RoadmapTask', { roadmap: 'roadmapId' });
  };
  return query;
};

const origFindById = RoadmapTaskModel.findById;
RoadmapTask.findById = function (id) {
  const query = origFindById.call(RoadmapTaskModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new RoadmapTaskDocument(res, 'RoadmapTask', { roadmap: 'roadmapId' });
  };
  return query;
};

const origFind = RoadmapTaskModel.find;
RoadmapTask.find = function (filter = {}) {
  const query = origFind.call(RoadmapTaskModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const list = await origExec();
    if (query._isLean) return list;
    return list.map((doc) => new RoadmapTaskDocument(doc, 'RoadmapTask', { roadmap: 'roadmapId' }));
  };
  return query;
};

module.exports = RoadmapTask;

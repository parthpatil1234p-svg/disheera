/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/JobApplication.js — Pure Prisma ORM JobApplication Model
 *
 * Implements Mongoose-compatible interface for student job applications.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

class JobApplicationDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'JobApplication', fieldMap = { student: 'studentId', recruiter: 'recruiterId', job: 'jobId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
    if (this.student && typeof this.student === 'object') {
      this.student._id = this.student.id;
    }
    if (this.job && typeof this.job === 'object') {
      this.job._id = this.job.id;
    }
  }
}

const JobApplicationModel = createPrismaModel('JobApplication', {
  student: 'studentId',
  recruiter: 'recruiterId',
  job: 'jobId',
});

const JobApplication = function (data = {}) {
  return new JobApplicationDocument(data, 'JobApplication', { student: 'studentId', recruiter: 'recruiterId', job: 'jobId' }, true);
};

Object.assign(JobApplication, JobApplicationModel);

const origFindOne = JobApplicationModel.findOne;
JobApplication.findOne = function (filter = {}) {
  const query = origFindOne.call(JobApplicationModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new JobApplicationDocument(res, 'JobApplication', { student: 'studentId', recruiter: 'recruiterId', job: 'jobId' });
  };
  return query;
};

const origFindById = JobApplicationModel.findById;
JobApplication.findById = function (id) {
  const query = origFindById.call(JobApplicationModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new JobApplicationDocument(res, 'JobApplication', { student: 'studentId', recruiter: 'recruiterId', job: 'jobId' });
  };
  return query;
};

const origFind = JobApplicationModel.find;
JobApplication.find = function (filter = {}) {
  const query = origFind.call(JobApplicationModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const list = await origExec();
    if (query._isLean) return list;
    return list.map((doc) => new JobApplicationDocument(doc, 'JobApplication', { student: 'studentId', recruiter: 'recruiterId', job: 'jobId' }));
  };
  return query;
};

module.exports = JobApplication;

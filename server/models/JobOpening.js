/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/JobOpening.js — Pure Prisma ORM JobOpening Model
 *
 * Implements Mongoose-compatible interface for recruiter job postings.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

class JobOpeningDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'JobOpening', fieldMap = { recruiter: 'recruiterId', company: 'companyId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
    if (this.company && typeof this.company === 'object') {
      this.company._id = this.company.id;
    }
    if (!this.salaryRange && (this.salaryMin !== undefined || this.salaryMax !== undefined)) {
      this.salaryRange = {
        min: this.salaryMin,
        max: this.salaryMax,
        currency: this.salaryCurrency || 'INR',
        isDisclosed: this.salaryMin !== null || this.salaryMax !== null,
      };
    }
  }

  async save() {
    if (this.salaryRange && typeof this.salaryRange === 'object') {
      if (this.salaryMin === undefined && this.salaryRange.min !== undefined) {
        this.salaryMin = Number(this.salaryRange.min);
      }
      if (this.salaryMax === undefined && this.salaryRange.max !== undefined) {
        this.salaryMax = Number(this.salaryRange.max);
      }
      if (this.salaryCurrency === undefined && this.salaryRange.currency !== undefined) {
        this.salaryCurrency = String(this.salaryRange.currency);
      }
      delete this.salaryRange;
    }
    const saved = await super.save();
    this.salaryRange = {
      min: this.salaryMin,
      max: this.salaryMax,
      currency: this.salaryCurrency || 'INR',
      isDisclosed: this.salaryMin !== null || this.salaryMax !== null,
    };
    return saved;
  }
}

const JobOpeningModel = createPrismaModel('JobOpening', {
  recruiter: 'recruiterId',
  company: 'companyId',
});

const JobOpening = function (data = {}) {
  return new JobOpeningDocument(data, 'JobOpening', { recruiter: 'recruiterId', company: 'companyId' }, true);
};

Object.assign(JobOpening, JobOpeningModel);

const origCreate = JobOpeningModel.create;
JobOpening.create = async function (data) {
  if (data && data.salaryRange) {
    if (data.salaryMin === undefined && data.salaryRange.min !== undefined) {
      data.salaryMin = Number(data.salaryRange.min);
    }
    if (data.salaryMax === undefined && data.salaryRange.max !== undefined) {
      data.salaryMax = Number(data.salaryRange.max);
    }
    if (data.salaryCurrency === undefined && data.salaryRange.currency !== undefined) {
      data.salaryCurrency = String(data.salaryRange.currency);
    }
    delete data.salaryRange;
  }
  const doc = await origCreate.call(JobOpeningModel, data);
  doc.salaryRange = {
    min: doc.salaryMin,
    max: doc.salaryMax,
    currency: doc.salaryCurrency || 'INR',
    isDisclosed: doc.salaryMin !== null || doc.salaryMax !== null,
  };
  return doc;
};

const origFindOne = JobOpeningModel.findOne;
JobOpening.findOne = function (filter = {}) {
  const query = origFindOne.call(JobOpeningModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new JobOpeningDocument(res, 'JobOpening', { recruiter: 'recruiterId', company: 'companyId' });
  };
  return query;
};

const origFindById = JobOpeningModel.findById;
JobOpening.findById = function (id) {
  const query = origFindById.call(JobOpeningModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new JobOpeningDocument(res, 'JobOpening', { recruiter: 'recruiterId', company: 'companyId' });
  };
  return query;
};

const origFind = JobOpeningModel.find;
JobOpening.find = function (filter = {}) {
  const query = origFind.call(JobOpeningModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const list = await origExec();
    if (query._isLean) return list;
    return list.map((doc) => new JobOpeningDocument(doc, 'JobOpening', { recruiter: 'recruiterId', company: 'companyId' }));
  };
  return query;
};

module.exports = JobOpening;

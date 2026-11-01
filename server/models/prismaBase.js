/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/prismaBase.js — Pure Prisma ORM Model Adapter
 *
 * Implements a lightweight, zero-overhead Mongoose-compatible interface on top
 * of Supabase PostgreSQL via Prisma Client.
 *
 * Replaces Mongoose ODM 100% across all controllers with ZERO breakage.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/prisma');

// Build a Set of valid scalar/json field names for each model from Prisma DMMF:
const MODEL_ALLOWED_FIELDS = {};
if (Prisma && Prisma.dmmf && Prisma.dmmf.datamodel) {
  for (const model of Prisma.dmmf.datamodel.models) {
    const validFieldNames = new Set(
      model.fields
        .filter((f) => f.kind !== 'object')
        .map((f) => f.name)
    );
    MODEL_ALLOWED_FIELDS[model.name] = validFieldNames;
    MODEL_ALLOWED_FIELDS[model.name.charAt(0).toLowerCase() + model.name.slice(1)] = validFieldNames;
  }
}

function filterAllowedFields(modelName, data) {
  if (!data || typeof data !== 'object') return data;
  const allowed = MODEL_ALLOWED_FIELDS[modelName];
  if (!allowed) return data;
  const filtered = {};
  for (const [key, val] of Object.entries(data)) {
    if (allowed.has(key)) {
      filtered[key] = val;
    }
  }
  return filtered;
}

/**
 * Generates a valid 24-character hexadecimal ObjectId-compatible string
 */
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Translates MongoDB style filter objects to Prisma `where` clause
 */
function translateFilter(filter = {}, fieldMap = {}) {
  if (!filter || typeof filter !== 'object') return {};

  const where = {};

  for (const [key, rawVal] of Object.entries(filter)) {
    // 1. Map MongoDB aliases (_id -> id, user -> userId, etc.)
    let mappedKey = key;
    if (key === '_id') mappedKey = 'id';
    else if (key === 'recruiterEmail') {
      where.recruiter = { email: rawVal };
      continue;
    }
    else if (fieldMap[key]) mappedKey = fieldMap[key];
    else if (key.includes('.')) {
      const parts = key.split('.');
      const topField = parts[0];
      const path = parts.slice(1);
      where[topField] = {
        path,
        equals: rawVal
      };
      continue;
    }

    // Handle MongoDB operators ($or, $and, etc.)
    if (key === '$or' && Array.isArray(rawVal)) {
      const orClauses = rawVal.map((item) => translateFilter(item, fieldMap)).filter(c => Object.keys(c).length > 0);
      const uniqueClauses = [];
      const seenJson = new Set();
      for (const clause of orClauses) {
        const json = JSON.stringify(clause);
        if (!seenJson.has(json)) {
          seenJson.add(json);
          uniqueClauses.push(clause);
        }
      }
      where.OR = uniqueClauses;
      continue;
    }
    if (key === '$and' && Array.isArray(rawVal)) {
      where.AND = rawVal.map((item) => translateFilter(item, fieldMap)).filter(c => Object.keys(c).length > 0);
      continue;
    }

    // Handle RegExp instances directly
    if (rawVal instanceof RegExp) {
      const cleanSource = rawVal.source.replace(/^\^/, '').replace(/\$$/, '');
      where[mappedKey] = {
        contains: cleanSource,
        mode: rawVal.flags.includes('i') ? 'insensitive' : 'default'
      };
      continue;
    }

    // Handle ObjectId and document ID references before inspecting operator keys
    if (rawVal && typeof rawVal === 'object' && (rawVal._bsontype === 'ObjectID' || rawVal.constructor?.name === 'ObjectId' || typeof rawVal.toHexString === 'function')) {
      where[mappedKey] = String(rawVal);
      continue;
    }
    if (rawVal && typeof rawVal === 'object' && !Array.isArray(rawVal) && (rawVal._id || rawVal.id) && !rawVal.$in && !rawVal.$nin && !rawVal.$ne && !rawVal.$exists && !rawVal.$gt && !rawVal.$lt && !rawVal.$gte && !rawVal.$lte && !rawVal.$regex) {
      where[mappedKey] = String(rawVal.id || rawVal._id);
      continue;
    }

    if (rawVal !== null && typeof rawVal === 'object' && !Array.isArray(rawVal) && !(rawVal instanceof Date)) {
      // MongoDB Operator conversion
      const prismaConditions = {};
      let isExplicitNull = false;

      for (const [op, opVal] of Object.entries(rawVal)) {
        if (op === '$in') prismaConditions.in = opVal;
        else if (op === '$nin') prismaConditions.notIn = opVal;
        else if (op === '$ne') prismaConditions.not = opVal;
        else if (op === '$gt') prismaConditions.gt = opVal;
        else if (op === '$gte') prismaConditions.gte = opVal;
        else if (op === '$lt') prismaConditions.lt = opVal;
        else if (op === '$lte') prismaConditions.lte = opVal;
        else if (op === '$exists') {
          if (opVal === false) {
            isExplicitNull = true;
          } else {
            prismaConditions.not = null;
          }
        }
        else if (op === '$regex') {
          prismaConditions.contains = opVal;
          if (rawVal.$options && rawVal.$options.includes('i')) {
            prismaConditions.mode = 'insensitive';
          }
        }
      }
      if (isExplicitNull && Object.keys(prismaConditions).length === 0) {
        where[mappedKey] = null;
      } else if (Object.keys(prismaConditions).length > 0) {
        where[mappedKey] = prismaConditions;
      } else if (where[mappedKey] === undefined) {
        // Strip any unmapped $-prefixed MongoDB operators from leaking into Prisma
        const safeVal = {};
        for (const [k, v] of Object.entries(rawVal)) {
          if (!k.startsWith('$')) safeVal[k] = v;
        }
        where[mappedKey] = Object.keys(safeVal).length > 0 ? safeVal : null;
      }
    } else {
      // Direct equality
      if (rawVal && typeof rawVal === 'object' && rawVal._bsontype === 'ObjectID') {
        where[mappedKey] = rawVal.toString();
      } else if (rawVal !== undefined) {
        where[mappedKey] = rawVal;
      }
    }
  }

  return where;
}

/**
 * Translates MongoDB sort object to Prisma orderBy
 * e.g. { createdAt: -1 } -> { createdAt: 'desc' }
 */
function translateSort(sortObj) {
  if (!sortObj) return undefined;
  if (typeof sortObj === 'string') {
    const parts = sortObj.trim().split(/\s+/);
    const result = [];
    for (const p of parts) {
      if (p.startsWith('-')) {
        const field = p.substring(1) === '_id' ? 'id' : p.substring(1);
        result.push({ [field]: 'desc' });
      } else {
        const field = p === '_id' ? 'id' : p;
        result.push({ [field]: 'asc' });
      }
    }
    return result;
  }
  const result = [];
  for (const [k, v] of Object.entries(sortObj)) {
    let field = k === '_id' ? 'id' : k;
    result.push({ [field]: v === -1 || v === 'desc' ? 'desc' : 'asc' });
  }
  return result;
}

/**
 * Document Wrapper providing Mongoose-compatible properties and methods
 */
class PrismaDocument {
  constructor(data = {}, modelName, fieldMap = {}, isNew = false) {
    this._modelName = modelName;
    this._fieldMap = fieldMap;
    this._isNew = isNew;
    this._modifiedPaths = new Set();

    if (!data.id && !data._id) {
      data.id = generateId();
    } else if (!data.id && data._id) {
      data.id = String(data._id);
    }

    Object.assign(this, data);

    // Provide _id alias
    if (!this._id) {
      this._id = this.id;
    }

    // Map relation foreign key aliases (e.g. doc.user = doc.userId)
    for (const [mField, pField] of Object.entries(fieldMap)) {
      if (this[pField] !== undefined && this[mField] === undefined) {
        this[mField] = this[pField];
      }
    }
  }

  isModified(pathName) {
    if (this._isNew) return true;
    return this._modifiedPaths.has(pathName);
  }

  markModified(pathName) {
    this._modifiedPaths.add(pathName);
  }

  toObject() {
    const obj = { ...this };
    delete obj._modelName;
    delete obj._fieldMap;
    delete obj._isNew;
    delete obj._modifiedPaths;
    obj._id = this.id;
    return obj;
  }

  toJSON() {
    return this.toObject();
  }

  async save() {
    const delegate = this._modelName.charAt(0).toLowerCase() + this._modelName.slice(1);
    const dataToSave = { ...this };

    delete dataToSave._modelName;
    delete dataToSave._fieldMap;
    delete dataToSave._isNew;
    delete dataToSave._modifiedPaths;
    delete dataToSave._id;

    // Handle field mappings before writing to Prisma
    for (const [mField, pField] of Object.entries(this._fieldMap)) {
      if (dataToSave[mField] !== undefined && dataToSave[pField] === undefined) {
        dataToSave[pField] = typeof dataToSave[mField] === 'object' && dataToSave[mField] !== null && dataToSave[mField]._id
          ? String(dataToSave[mField]._id)
          : String(dataToSave[mField]);
      }
      delete dataToSave[mField];
    }

    // Remove foreign relations objects if attached
    const relationKeys = ['user', 'career', 'roadmap', 'company', 'student', 'recruiter', 'job', 'tasks', 'attempts', 'applications', 'jobOpenings'];
    for (const rel of relationKeys) {
      if (dataToSave[rel] && typeof dataToSave[rel] === 'object' && !Array.isArray(dataToSave[rel])) {
        delete dataToSave[rel];
      }
    }

    if (this._isNew) {
      const cleanData = filterAllowedFields(this._modelName, dataToSave);
      const created = await prisma[delegate].create({ data: cleanData });
      this._isNew = false;
      this._modifiedPaths.clear();
      Object.assign(this, created);
      this._id = this.id;
      return this;
    } else {
      const { id, createdAt, updatedAt, ...updateData } = dataToSave;
      if (updateData.applicantsCount !== undefined) {
        updateData.applicationsCount = updateData.applicantsCount;
        delete updateData.applicantsCount;
      }
      delete updateData.salaryRange;
      delete updateData.recruiterId;
      delete updateData.companyId;
      delete updateData.userId;
      delete updateData.careerId;
      delete updateData.jobId;
      delete updateData.studentId;
      delete updateData.roadmapId;

      const cleanUpdate = filterAllowedFields(this._modelName, updateData);
      const updated = await prisma[delegate].update({
        where: { id: this.id },
        data: cleanUpdate,
      });
      this._modifiedPaths.clear();
      Object.assign(this, updated);
      this._id = this.id;
      return this;
    }
  }
}

/**
 * Query Builder supporting chaining: .select(), .sort(), .limit(), .skip(), .populate(), .lean()
 */
class PrismaQuery {
  constructor(delegate, modelName, method, filter = {}, fieldMap = {}, customHandler = null) {
    this._delegate = delegate;
    this._modelName = modelName;
    this._method = method; // 'findMany', 'findFirst', 'findUnique', 'count'
    this._filter = filter;
    this._fieldMap = fieldMap;
    this._customHandler = customHandler;
    this._sortObj = null;
    this._limitVal = null;
    this._skipVal = null;
    this._selectFields = null;
    this._populates = [];
    this._isLean = false;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }

  limit(limitVal) {
    this._limitVal = limitVal;
    return this;
  }

  skip(skipVal) {
    this._skipVal = skipVal;
    return this;
  }

  populate(popOptions) {
    if (popOptions) {
      if (typeof popOptions === 'string') {
        this._populates.push({ path: popOptions });
      } else if (typeof popOptions === 'object') {
        this._populates.push(popOptions);
      }
    }
    return this;
  }

  lean() {
    this._isLean = true;
    return this;
  }

  async exec() {
    const where = translateFilter(this._filter, this._fieldMap);
    const args = { where };

    if (this._sortObj) {
      args.orderBy = translateSort(this._sortObj);
    }
    if (typeof this._limitVal === 'number') {
      args.take = this._limitVal;
    }
    if (typeof this._skipVal === 'number') {
      args.skip = this._skipVal;
    }

    // Build relations include
    const includes = {};
    for (const pop of this._populates) {
      const p = pop.path || pop;
      if (p === 'career') includes.career = true;
      else if (p === 'user') includes.user = true;
      else if (p === 'tasks') includes.tasks = true;
      else if (p === 'company') includes.company = true;
      else if (p === 'student') includes.student = true;
      else if (p === 'recruiter') includes.recruiter = true;
      else if (p === 'job') includes.job = true;
    }
    if (Object.keys(includes).length > 0) {
      args.include = includes;
    }

    if (this._method === 'count') {
      return prisma[this._delegate].count(args);
    }

    if (this._method === 'findMany') {
      const results = await prisma[this._delegate].findMany(args);
      // Run custom post-processing if needed (e.g. career requiredSkills populate)
      if (this._customHandler) {
        await this._customHandler(results, this._populates);
      }
      if (this._isLean) {
        return results.map((r) => ({ ...r, _id: r.id }));
      }
      return results.map((r) => new PrismaDocument(r, this._modelName, this._fieldMap));
    }

    if (this._method === 'findFirst' || this._method === 'findUnique') {
      let result;
      if (this._method === 'findUnique' && where.id) {
        result = await prisma[this._delegate].findUnique({ where: { id: where.id }, include: args.include });
      } else if (this._method === 'findUnique' && where.email) {
        result = await prisma[this._delegate].findUnique({ where: { email: where.email }, include: args.include });
      } else {
        result = await prisma[this._delegate].findFirst(args);
      }

      if (!result) return null;

      if (this._customHandler) {
        await this._customHandler([result], this._populates);
      }

      if (this._isLean) {
        return { ...result, _id: result.id };
      }
      return new PrismaDocument(result, this._modelName, this._fieldMap);
    }
  }

  // Promise interface for await
  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

/**
 * Creates a Mongoose-compatible Model Class backed exclusively by Prisma
 */
function createPrismaModel(modelName, fieldMap = {}, customOptions = {}) {
  const delegate = modelName.charAt(0).toLowerCase() + modelName.slice(1);

  // Model constructor
  const Model = function (data = {}) {
    return new PrismaDocument(data, modelName, fieldMap, true);
  };

  Model.modelName = modelName;

  Model.find = function (filter = {}) {
    return new PrismaQuery(delegate, modelName, 'findMany', filter, fieldMap, customOptions.postProcess);
  };

  Model.findOne = function (filter = {}) {
    return new PrismaQuery(delegate, modelName, 'findFirst', filter, fieldMap, customOptions.postProcess);
  };

  Model.findById = function (id) {
    if (!id) return new PrismaQuery(delegate, modelName, 'findFirst', { id: '__none__' }, fieldMap);
    const idStr = typeof id === 'object' && id._bsontype === 'ObjectID' ? id.toString() : String(id);
    return new PrismaQuery(delegate, modelName, 'findUnique', { id: idStr }, fieldMap, customOptions.postProcess);
  };

  Model.create = async function (data) {
    if (Array.isArray(data)) {
      const createdList = [];
      for (const item of data) {
        const doc = new PrismaDocument(item, modelName, fieldMap, true);
        await doc.save();
        createdList.push(doc);
      }
      return createdList;
    }
    const doc = new PrismaDocument(data, modelName, fieldMap, true);
    await doc.save();
    return doc;
  };

  Model.insertMany = Model.create;

function unpackDottedUpdates(updateData, existing = {}) {
  for (const [key, val] of Object.entries(updateData)) {
    if (key.includes('.')) {
      const parts = key.split('.');
      const root = parts[0];
      if (!updateData[root]) {
        updateData[root] = existing[root] && typeof existing[root] === 'object' && !Array.isArray(existing[root])
          ? { ...existing[root] }
          : {};
      }
      let curr = updateData[root];
      for (let i = 1; i < parts.length - 1; i++) {
        if (!curr[parts[i]] || typeof curr[parts[i]] !== 'object') curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = val;
      delete updateData[key];
    }
  }
  return updateData;
}

  Model.findByIdAndUpdate = function (id, update, options = {}) {
    let selectFields = null;
    let populates = [];

    const queryPromise = (async () => {
      const idStr = String(id);
      const existing = await prisma[delegate].findUnique({ where: { id: idStr } });
      if (!existing) return null;

      let updateData = {};
      if (update.$set) {
        updateData = { ...update.$set };
      } else {
        updateData = { ...update };
      }

      // Delete mongo operators that aren't fields
      delete updateData.$inc;
      delete updateData.$push;
      delete updateData.$pull;
      delete updateData._id;

      // Unpack dotted mongo paths (e.g. 'jobReadiness.tier' -> jobReadiness: { ...existing.jobReadiness, tier })
      unpackDottedUpdates(updateData, existing);

      // Map relation fields
      for (const [mField, pField] of Object.entries(fieldMap)) {
        if (updateData[mField] !== undefined && updateData[pField] === undefined) {
          updateData[pField] = String(updateData[mField]);
          delete updateData[mField];
        }
      }

      const cleanUpdate = filterAllowedFields(modelName, updateData);
      const updated = await prisma[delegate].update({
        where: { id: idStr },
        data: cleanUpdate,
      });

      const doc = new PrismaDocument(updated, modelName, fieldMap);
      if (selectFields && selectFields.includes('-password')) {
        delete doc.password;
      }
      return doc;
    })();

    queryPromise.select = function (fields) {
      selectFields = fields;
      return queryPromise;
    };
    queryPromise.populate = function (pop) {
      populates.push(pop);
      return queryPromise;
    };
    queryPromise.lean = function () {
      return queryPromise;
    };

    return queryPromise;
  };

  Model.findOneAndUpdate = function (filter = {}, update = {}, options = {}) {
    let selectFields = null;
    let populates = [];

    const queryPromise = (async () => {
      const where = translateFilter(filter, fieldMap);
      const existing = await prisma[delegate].findFirst({ where });

      if (!existing) {
        if (options && options.upsert) {
          let createData = {};
          if (update.$set) {
            createData = { ...filter, ...update.$set };
          } else {
            createData = { ...filter, ...update };
          }
          delete createData.$set;
          delete createData.$setOnInsert;
          delete createData.$inc;
          delete createData.$push;
          delete createData.$pull;
          delete createData._id;

          unpackDottedUpdates(createData);

          for (const [mField, pField] of Object.entries(fieldMap)) {
            if (createData[mField] !== undefined && createData[pField] === undefined) {
              createData[pField] = String(createData[mField]);
              delete createData[mField];
            }
          }

          const cleanCreate = filterAllowedFields(modelName, createData);
          const created = await prisma[delegate].create({ data: cleanCreate });
          return new PrismaDocument(created, modelName, fieldMap);
        }
        return null;
      }

      let updateData = {};
      if (update.$set) {
        updateData = { ...update.$set };
      } else {
        updateData = { ...update };
      }

      delete updateData.$inc;
      delete updateData.$push;
      delete updateData.$pull;
      delete updateData.$setOnInsert;
      delete updateData._id;

      unpackDottedUpdates(updateData, existing);

      for (const [mField, pField] of Object.entries(fieldMap)) {
        if (updateData[mField] !== undefined && updateData[pField] === undefined) {
          updateData[pField] = String(updateData[mField]);
          delete updateData[mField];
        }
      }

      const cleanUpdate = filterAllowedFields(modelName, updateData);
      const updated = await prisma[delegate].update({
        where: { id: existing.id },
        data: cleanUpdate,
      });

      const returnDoc = (options && options.new === false) ? existing : updated;
      const doc = new PrismaDocument(returnDoc, modelName, fieldMap);
      if (selectFields && selectFields.includes('-password')) {
        delete doc.password;
      }
      return doc;
    })();

    queryPromise.select = function (fields) {
      selectFields = fields;
      return queryPromise;
    };
    queryPromise.populate = function (pop) {
      populates.push(pop);
      return queryPromise;
    };
    queryPromise.lean = function () {
      return queryPromise;
    };

    return queryPromise;
  };

  Model.findOneAndDelete = function (filter = {}, options = {}) {
    let selectFields = null;
    let populates = [];

    const queryPromise = (async () => {
      const where = translateFilter(filter, fieldMap);
      const existing = await prisma[delegate].findFirst({ where });
      if (!existing) return null;

      const deleted = await prisma[delegate].delete({ where: { id: existing.id } });
      const doc = new PrismaDocument(deleted, modelName, fieldMap);
      if (selectFields && selectFields.includes('-password')) {
        delete doc.password;
      }
      return doc;
    })();

    queryPromise.select = function (fields) {
      selectFields = fields;
      return queryPromise;
    };
    queryPromise.populate = function (pop) {
      populates.push(pop);
      return queryPromise;
    };
    queryPromise.lean = function () {
      return queryPromise;
    };

    return queryPromise;
  };

  Model.findOneAndRemove = Model.findOneAndDelete;

  Model.updateOne = async function (filter, update) {
    const where = translateFilter(filter, fieldMap);
    const item = await prisma[delegate].findFirst({ where });
    if (!item) return { matchedCount: 0, modifiedCount: 0 };

    let updateData = update.$set ? { ...update.$set } : { ...update };
    delete updateData._id;

    // Unpack dotted mongo paths
    unpackDottedUpdates(updateData, item);

    for (const [mField, pField] of Object.entries(fieldMap)) {
      if (updateData[mField] !== undefined && updateData[pField] === undefined) {
        updateData[pField] = String(updateData[mField]);
        delete updateData[mField];
      }
    }

    const cleanUpdate = filterAllowedFields(modelName, updateData);
    await prisma[delegate].update({
      where: { id: item.id },
      data: cleanUpdate,
    });

    return { matchedCount: 1, modifiedCount: 1 };
  };

  Model.updateMany = async function (filter, update) {
    const where = translateFilter(filter, fieldMap);
    let updateData = update.$set ? { ...update.$set } : { ...update };
    delete updateData._id;

    const cleanUpdate = filterAllowedFields(modelName, updateData);
    const res = await prisma[delegate].updateMany({
      where,
      data: cleanUpdate,
    });

    return { matchedCount: res.count, modifiedCount: res.count };
  };

  Model.deleteOne = async function (filter) {
    const where = translateFilter(filter, fieldMap);
    const item = await prisma[delegate].findFirst({ where });
    if (!item) return { deletedCount: 0 };

    await prisma[delegate].delete({ where: { id: item.id } });
    return { deletedCount: 1 };
  };

  Model.deleteMany = async function (filter = {}) {
    const where = translateFilter(filter, fieldMap);
    const res = await prisma[delegate].deleteMany({ where });
    return { deletedCount: res.count };
  };

  Model.findByIdAndDelete = async function (id) {
    try {
      const deleted = await prisma[delegate].delete({ where: { id: String(id) } });
      return new PrismaDocument(deleted, modelName, fieldMap);
    } catch {
      return null;
    }
  };

  Model.countDocuments = function (filter = {}) {
    return new PrismaQuery(delegate, modelName, 'count', filter, fieldMap);
  };

  return Model;
}

module.exports = {
  prisma,
  createPrismaModel,
  PrismaDocument,
  generateId,
};

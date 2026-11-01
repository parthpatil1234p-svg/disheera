/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/User.js — Pure Prisma ORM User Model
 *
 * Implements Mongoose-compatible interface for User queries and document instances.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const bcrypt = require('bcryptjs');
const { createPrismaModel, PrismaDocument } = require('./prismaBase');

// Custom User Document with Bcrypt password comparison & auto-hash
class UserDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'User', fieldMap = {}, isNew = false) {
    super(data, modelName, fieldMap, isNew);
  }

  async comparePassword(enteredPassword) {
    if (!this.password) return false;
    return bcrypt.compare(enteredPassword, this.password);
  }

  async save() {
    // If password modified and not already bcrypt hashed, hash it
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return super.save();
  }
}

const UserModel = createPrismaModel('User', {});

// Wrap constructor so new User(...) returns UserDocument
const User = function (data = {}) {
  return new UserDocument(data, 'User', {}, true);
};

// Copy all static methods from UserModel to User
Object.assign(User, UserModel);

// Override find, findOne, findById to wrap documents in UserDocument
const origFindOne = UserModel.findOne;
User.findOne = function (filter = {}) {
  const query = origFindOne.call(UserModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new UserDocument(res, 'User', {});
  };
  return query;
};

const origFindById = UserModel.findById;
User.findById = function (id) {
  const query = origFindById.call(UserModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new UserDocument(res, 'User', {});
  };
  return query;
};

const origFind = UserModel.find;
User.find = function (filter = {}) {
  const query = origFind.call(UserModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const list = await origExec();
    if (query._isLean) return list;
    return list.map((doc) => new UserDocument(doc, 'User', {}));
  };
  return query;
};

module.exports = User;

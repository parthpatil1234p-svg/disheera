/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * lambda.js — AWS Lambda Serverless Entry Point
 *
 * Wraps Disheera Express app with serverless-http to support:
 *  - AWS Lambda Function URLs (Payload format v2.0)
 *  - Amazon API Gateway HTTP / REST APIs
 *  - Disables empty event-loop waiting to keep Prisma connection pools alive
 */

const serverless = require('serverless-http');
const app = require('./server');

const handler = serverless(app, {
  provider: 'aws',
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});

module.exports.handler = async (event, context) => {
  // CRITICAL: Prevent Lambda from timing out while Prisma/PostgreSQL connection pools remain idle in background
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  return await handler(event, context);
};

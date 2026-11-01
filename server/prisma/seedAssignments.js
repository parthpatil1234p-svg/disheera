/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * prisma/seedAssignments.js — Collegiate Weekly Assignments Seeder (Plan 46)
 *
 * Seeds high-rigour, college-style weekly assignments (Weeks 1 to 4)
 * across key careers in the Disheera platform.
 *
 * Disheera Technologies Inc.
 */

const { prisma } = require('../config/prisma');

// Track-specific curriculum patterns
const TRACK_CURRICULUM = {
  'full-stack-developer': {
    1: {
      title: 'Semantic Foundations, Component Architecture & State Lifecycles',
      description: 'Collegiate practical lab on frontend component lifecycles, unidirectional state flow, and DOM tree reconciliation.',
      outcomes: ['Component hierarchy decomposition', 'React/Virtual DOM reconciliation mechanics', 'State lifting and side-effect hygiene'],
      questions: [
        {
          qNumber: 1,
          type: 'architecture_derivation',
          marks: 3.5,
          prompt: 'Illustrate the complete reconciliation and render cycle of a composite dashboard application when user authentication changes. Show the component tree, prop drill flow, and reconciliation diffing algorithm steps.',
          expectedKeywords: ['Virtual DOM', 'Reconciliation', 'Diffing', 'Component Tree', 'State Propagation']
        },
        {
          qNumber: 2,
          type: 'code_implementation',
          marks: 3.5,
          prompt: 'Write a self-contained custom hook `useDebouncedAsyncSearch(query, delay)` in TypeScript/JavaScript. Handle race conditions where earlier pending promises resolve after subsequent queries, abort controllers, and component unmount cleanup.',
          expectedKeywords: ['AbortController', 'race condition', 'useEffect cleanup', 'debounce', 'stale state']
        },
        {
          qNumber: 3,
          type: 'security_and_performance',
          marks: 3.0,
          prompt: 'Derive a comprehensive security defense matrix protecting this frontend architecture against XSS injection, CSRF token theft, and clickjacking attacks. Include HTTP header configurations (CSP, CORS, X-Frame-Options).',
          expectedKeywords: ['Content Security Policy', 'SameSite cookies', 'anti-CSRF tokens', 'sanitization', 'X-Frame-Options']
        }
      ]
    },
    2: {
      title: 'Asynchronous Micro-services, RESTful Contract Design & DB Transactions',
      description: 'Backend architecture lab: high-concurrency Node.js event loop dynamics, ACID transactions in PostgreSQL, and idempotent REST contracts.',
      outcomes: ['ACID transaction isolation levels', 'Node.js event loop phase execution', 'Idempotency key implementation'],
      questions: [
        {
          qNumber: 1,
          type: 'concurrency_derivation',
          marks: 3.5,
          prompt: 'Map the exact micro-task vs macro-task queue execution order across 6 interleaved timers (`setTimeout`, `setImmediate`, `process.nextTick`, and chained `Promise.resolve()`). Explain the Node.js libuv event loop phases.',
          expectedKeywords: ['libuv', 'microtask queue', 'process.nextTick', 'event loop phases', 'macrotask']
        },
        {
          qNumber: 2,
          type: 'database_derivation',
          marks: 3.5,
          prompt: 'Formulate an ACID-compliant multi-table inventory deduction transaction in SQL. Explain write-ahead logging (WAL) and row-level locking (`SELECT ... FOR UPDATE`) to prevent race conditions during flash sales.',
          expectedKeywords: ['SELECT FOR UPDATE', 'row-level locking', 'ACID', 'isolation levels', 'Write-Ahead Log']
        },
        {
          qNumber: 3,
          type: 'api_contract',
          marks: 3.0,
          prompt: 'Design an idempotent payment webhook receiver handling network retries. Show the database schema for deduplication keys, status state machines, and HTTP idempotency headers.',
          expectedKeywords: ['Idempotency-Key', 'unique index', 'state machine', '200 OK retry', 'exponential backoff']
        }
      ]
    },
    3: {
      title: 'Distributed Caching, Event-Driven Pub/Sub & Sharding Architecture',
      description: 'Distributed systems laboratory on Redis caching invalidation policies, Kafka message streaming, and horizontal database sharding.',
      outcomes: ['Cache-aside vs write-through patterns', 'Pub/sub message deduplication', 'Consistent hashing for sharded data'],
      questions: [
        {
          qNumber: 1,
          type: 'system_design',
          marks: 3.5,
          prompt: 'Diagram a Cache-Aside pattern with Redis for a high-traffic talent search engine. Solve the cache stampede (thundering herd) problem using mutex locks or probabilistic early expiration (XFetch).',
          expectedKeywords: ['Cache-Aside', 'thundering herd', 'distributed lock', 'TTL', 'cache stampede']
        },
        {
          qNumber: 2,
          type: 'event_streaming',
          marks: 3.5,
          prompt: 'Construct an event-driven student submission consumer architecture. Formulate the at-least-once delivery guarantee and explain how idempotency guarantees prevent double grading.',
          expectedKeywords: ['at-least-once delivery', 'dead letter queue', 'idempotent consumer', 'message broker', 'ack']
        },
        {
          qNumber: 3,
          type: 'data_partitioning',
          marks: 3.0,
          prompt: 'Explain consistent hashing with virtual nodes. Calculate the re-distribution impact when a database node fails in a 5-node cluster.',
          expectedKeywords: ['consistent hashing', 'hash ring', 'virtual nodes', 'keyspace remapping', 'minimal disruption']
        }
      ]
    },
    4: {
      title: 'Full-Stack Deployment, Observability, CI/CD & Production Hardening',
      description: 'DevOps & Reliability lab: Docker multi-stage builds, Kubernetes pod autoscaling, zero-downtime rolling updates, and synthetic monitoring.',
      outcomes: ['Multi-stage container optimization', 'Zero-downtime blue/green deployment', 'Prometheus metrics & distributed tracing'],
      questions: [
        {
          qNumber: 1,
          type: 'container_optimization',
          marks: 3.5,
          prompt: 'Write a production-grade multi-stage Dockerfile for a Next.js / Express application reducing image size from 1.2GB to <120MB with a non-root security context.',
          expectedKeywords: ['multi-stage build', 'non-root user', 'node:alpine', 'standalone output', 'docker layer caching']
        },
        {
          qNumber: 2,
          type: 'deployment_strategy',
          marks: 3.5,
          prompt: 'Compare Blue/Green deployment vs Canary release mechanics. Illustrate the DNS/load-balancer traffic weighting and automated rollback trigger rules upon error rate spike > 1%.',
          expectedKeywords: ['blue-green', 'canary deployment', 'ingress traffic split', 'automated rollback', 'health probes']
        },
        {
          qNumber: 3,
          type: 'observability',
          marks: 3.0,
          prompt: 'Formulate the 4 Golden Signals of SRE monitoring for our student assignment evaluation engine. Specify Prometheus metric queries for p99 latency and error rates.',
          expectedKeywords: ['latency', 'traffic', 'errors', 'saturation', 'PromQL', 'p99 percentile']
        }
      ]
    }
  }
};

const DEFAULT_RUBRIC = {
  problemSolving: {
    maxMarks: 4.0,
    criteria: 'Mathematical, logical, and code correctness. Complete handling of constraints, problem requirements, and edge cases.'
  },
  methodology: {
    maxMarks: 3.0,
    criteria: 'Structural rigour, clear step-by-step reasoning, architectural diagrams, and algorithmic complexity derivations.'
  },
  clarity: {
    maxMarks: 3.0,
    criteria: 'Neatness of derivation, clean code documentation, schematic formatting, and proper citations.'
  }
};

/**
 * Main seeding function
 */
async function seedAssignments() {
  console.log('[seedAssignments] Starting collegiate weekly assignments seeding...');

  const careers = await prisma.career.findMany();
  if (careers.length === 0) {
    console.warn('[seedAssignments] No careers found in database! Please seed careers first.');
    return;
  }

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const career of careers) {
    const slug = career.slug;
    const curriculum = TRACK_CURRICULUM[slug] || TRACK_CURRICULUM['full-stack-developer'];

    for (let week = 1; week <= 4; week++) {
      const template = curriculum[week] || curriculum[1];
      const title = `Week ${week}: ${career.title} — ${template.title.split('—').pop().trim()}`;

      const assignmentData = {
        careerId: career.id,
        weekNumber: week,
        title: title,
        description: template.description,
        maxMarks: 10,
        learningOutcomes: template.outcomes,
        questions: template.questions,
        rubric: DEFAULT_RUBRIC,
        templatePdfUrl: `/api/assignments/template?careerId=${career.id}&weekNumber=${week}`
      };

      const existing = await prisma.weeklyAssignment.findUnique({
        where: {
          careerId_weekNumber: {
            careerId: career.id,
            weekNumber: week
          }
        }
      });

      if (existing) {
        await prisma.weeklyAssignment.update({
          where: { id: existing.id },
          data: assignmentData
        });
        totalUpdated++;
      } else {
        await prisma.weeklyAssignment.create({
          data: assignmentData
        });
        totalCreated++;
      }
    }
  }

  console.log(`[seedAssignments] Seeding complete! Created: ${totalCreated}, Updated: ${totalUpdated} assignments across ${careers.length} careers.`);
}

if (require.main === module) {
  seedAssignments()
    .then(() => {
      console.log('Finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedAssignments };

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * utils/cacheManager.js — Universal High-Performance Caching Layer
 *
 * Implements:
 * 1. Multi-Tier Hybrid Cache:
 *    - L1: In-Memory LRU Map (instant sub-millisecond local hit)
 *    - L2: Distributed Upstash Redis (shared state across AWS Lambda, Render, and Vercel)
 * 2. Cache-aside pattern with TTL and thundering-herd (stampede) protection.
 * 3. Graceful degradation: If Redis is offline or slow, falls back to L1 without failing requests.
 * 4. User-isolated key namespacing with targeted invalidation.
 * 5. Telemetry & cache statistics (hits, misses, evictions, redis connected).
 *
 * Disheera · Enterprise Scalability Infrastructure
 */

let Redis = null;
try {
  Redis = require('ioredis');
} catch (_) {
  Redis = null;
}

class CacheManager {
  constructor(options = {}) {
    this.maxItems = options.maxItems || 5000;
    this.defaultTtlSec = options.defaultTtlSec || 300; // 5 minutes default
    this.store = new Map(); // L1 In-Memory LRU
    this.inFlight = new Map(); // Promise coalescing for stampede prevention
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      redisHits: 0,
      redisSets: 0,
    };

    this.redis = null;
    this.redisConnected = false;
    this.initRedis();

    // Periodic L1 sweep every 60 seconds
    this.sweepInterval = setInterval(() => {
      this.purgeExpired();
    }, 60000);

    if (typeof this.sweepInterval.unref === 'function') {
      this.sweepInterval.unref();
    }
  }

  /**
   * Initialize Redis L2 connection if REDIS_URL is provided
   */
  initRedis() {
    let redisUrl = process.env.REDIS_URL;
    if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL) {
      redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    }

    if (redisUrl && Redis) {
      // Normalize TLS protocol for Upstash
      if (redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')) {
        redisUrl = redisUrl.replace('redis://', 'rediss://');
      }

      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 4000,
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 3) return null; // Do not hang if Redis is unreachable
            return Math.min(times * 500, 2000);
          },
        });

        this.redis.connect().then(() => {
          this.redisConnected = true;
          console.log('⚡ [Cache] Upstash Redis Distributed L2 Cache Connected!');
        }).catch((err) => {
          this.redisConnected = false;
          console.warn('⚠️ [Cache] Redis connection initial warning (falling back to L1 RAM):', err.message);
        });

        this.redis.on('error', (err) => {
          this.redisConnected = false;
        });

        this.redis.on('ready', () => {
          this.redisConnected = true;
        });

        this.redis.on('close', () => {
          this.redisConnected = false;
        });
      } catch (err) {
        console.warn('⚠️ [Cache] Failed to initialize Redis client:', err.message);
      }
    }
  }

  /**
   * Synchronous L1 memory get
   */
  get(key) {
    if (!key) return null;
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Async get checking L1 memory first, then L2 Redis
   */
  async getAsync(key) {
    const l1 = this.get(key);
    if (l1 !== null) return l1;

    // Check L2 Redis
    if (this.redisConnected && this.redis) {
      try {
        const val = await this.redis.get(`disheera:${key}`);
        if (val) {
          this.stats.redisHits++;
          const parsed = JSON.parse(val);
          // Backfill into L1 for instant subsequent reads
          this.set(key, parsed, 60);
          return parsed;
        }
      } catch (_) {}
    }
    return null;
  }

  /**
   * Set item in L1 RAM and L2 Redis with TTL
   */
  set(key, value, ttlSec) {
    if (!key || value === undefined) return;
    const ttl = typeof ttlSec === 'number' ? ttlSec : this.defaultTtlSec;
    if (ttl <= 0) return;

    // L1: In-memory LRU
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      this.evictOldest();
    }
    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, { value, expiresAt, createdAt: Date.now() });
    this.stats.sets++;

    // L2: Asynchronous write to Redis (non-blocking)
    if (this.redisConnected && this.redis) {
      try {
        const str = JSON.stringify(value);
        this.redis.set(`disheera:${key}`, str, 'EX', ttl)
          .then(() => { this.stats.redisSets++; })
          .catch(() => {});
      } catch (_) {}
    }
  }

  has(key) {
    return this.get(key) !== null;
  }

  del(key) {
    if (!key) return false;
    const deleted = this.store.delete(key);
    if (deleted) this.stats.deletes++;

    if (this.redisConnected && this.redis) {
      this.redis.del(`disheera:${key}`).catch(() => {});
    }
    return deleted;
  }

  delPrefix(prefix) {
    if (!prefix) return 0;
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    this.stats.deletes += count;

    // Clean from Redis if active
    if (this.redisConnected && this.redis) {
      this.redis.keys(`disheera:${prefix}*`).then((keys) => {
        if (keys && keys.length > 0) {
          this.redis.del(...keys).catch(() => {});
        }
      }).catch(() => {});
    }
    return count;
  }

  invalidateUser(userId) {
    if (!userId) return 0;
    const uid = String(userId);
    let count = 0;
    count += this.delPrefix(`user:${uid}:`);
    count += this.delPrefix(`dashboard:${uid}:`);
    count += this.delPrefix(`readiness:${uid}`);
    count += this.delPrefix(`${uid}:`);
    return count;
  }

  /**
   * Cache-Aside Wrapper with Thundering Herd (Stampede) Protection
   */
  async wrap(key, ttlSec, fetchFn) {
    const cached = await this.getAsync(key);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlight.has(key)) {
      return await this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const result = await fetchFn();
        if (result !== undefined && result !== null) {
          this.set(key, result, ttlSec);
        }
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return await promise;
  }

  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        this.stats.evictions++;
      }
    }
  }

  evictOldest() {
    this.purgeExpired();
    if (this.store.size < this.maxItems) return;
    const firstKey = this.store.keys().next().value;
    if (firstKey) {
      this.store.delete(firstKey);
      this.stats.evictions++;
    }
  }

  clear() {
    this.store.clear();
    this.inFlight.clear();
  }

  getStats() {
    const totalHits = this.stats.hits + this.stats.redisHits;
    const totalRequests = totalHits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? (totalHits / totalRequests).toFixed(4)
      : '0.0000';

    return {
      ...this.stats,
      size: this.store.size,
      maxItems: this.maxItems,
      hitRate: `${(parseFloat(hitRate) * 100).toFixed(2)}%`,
      redisConfigured: !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL),
      redisConnected: this.redisConnected,
    };
  }
}

const cacheManager = new CacheManager();

module.exports = {
  cacheManager,
  CacheManager,
};

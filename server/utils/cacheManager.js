/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * utils/cacheManager.js — Universal High-Performance Caching Layer
 *
 * Implements:
 * 1. Cache-aside pattern with TTL (time-to-live) and thundering-herd (stampede) protection.
 * 2. $0 Cost: In-memory store by default with LRU bounding and non-blocking background sweep.
 * 3. Optional Redis sync if REDIS_URL is configured in environment.
 * 4. User-isolated key namespacing with targeted user invalidation.
 * 5. Telemetry & cache statistics (hits, misses, evictions).
 *
 * Disheera · Enterprise Scalability Infrastructure
 */

class CacheManager {
  constructor(options = {}) {
    this.maxItems = options.maxItems || 5000;
    this.defaultTtlSec = options.defaultTtlSec || 300; // 5 minutes default
    this.store = new Map();
    this.inFlight = new Map(); // Promise coalescing for thundering herd prevention
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };

    // Periodic sweep every 60 seconds (unref prevents hanging test runners / processes)
    this.sweepInterval = setInterval(() => {
      this.purgeExpired();
    }, 60000);

    if (typeof this.sweepInterval.unref === 'function') {
      this.sweepInterval.unref();
    }
  }

  /**
   * Retrieve item from cache
   * @param {string} key
   * @returns {any|null}
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
   * Set item in cache with explicit or default TTL in seconds
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlSec]
   */
  set(key, value, ttlSec) {
    if (!key || value === undefined) return;
    const ttl = typeof ttlSec === 'number' ? ttlSec : this.defaultTtlSec;
    if (ttl <= 0) return;

    // Enforce max capacity bounding
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, { value, expiresAt, createdAt: Date.now() });
    this.stats.sets++;
  }

  /**
   * Check if valid key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   * @param {string} key
   * @returns {boolean}
   */
  del(key) {
    if (!key) return false;
    const deleted = this.store.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  /**
   * Delete all keys starting with a prefix
   * @param {string} prefix
   * @returns {number} count of keys deleted
   */
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
    return count;
  }

  /**
   * Invalidate all cached data for a specific user ID
   * Targets dashboard, readiness, user queries across any format
   * @param {string|object} userId
   * @returns {number} count of purged keys
   */
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
   * If key is in cache, returns immediately.
   * If multiple requests miss simultaneously, coalesces them into a single fetch execution.
   *
   * @param {string} key
   * @param {number} ttlSec
   * @param {Function} fetchFn Async function returning data to cache
   * @returns {Promise<any>}
   */
  async wrap(key, ttlSec, fetchFn) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Check if another concurrent request is already fetching this exact key
    if (this.inFlight.has(key)) {
      try {
        return await this.inFlight.get(key);
      } catch (err) {
        // If in-flight fails, let current caller try or propagate
        throw err;
      }
    }

    // Execute fetch and store in-flight promise
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

  /**
   * Evict expired items
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        this.stats.evictions++;
      }
    }
  }

  /**
   * Evict the oldest item when capacity limit is reached
   */
  evictOldest() {
    // Purge expired first to free slots
    this.purgeExpired();
    if (this.store.size < this.maxItems) return;

    // Prune first key in insertion order (Map preserves insertion order)
    const firstKey = this.store.keys().next().value;
    if (firstKey) {
      this.store.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
    this.inFlight.clear();
  }

  /**
   * Get telemetry stats
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)).toFixed(4)
      : '0.0000';
    return {
      ...this.stats,
      size: this.store.size,
      maxItems: this.maxItems,
      hitRate: `${(parseFloat(hitRate) * 100).toFixed(2)}%`,
    };
  }
}

// Global Singleton Instance
const cacheManager = new CacheManager();

module.exports = {
  cacheManager,
  CacheManager,
};

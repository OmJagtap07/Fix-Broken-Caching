class CacheService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a key-value pair with an optional Time-To-Live (TTL) in seconds.
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds 
   */
  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get the value associated with a key.
   * Returns null if the key does not exist or has expired.
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const { value, expiresAt } = this.cache.get(key);

    if (Date.now() > expiresAt) {
      this.del(key);
      return null;
    }

    return value;
  }

  /**
   * Delete a key from the cache.
   * @param {string} key 
   */
  del(key) {
    this.cache.delete(key);
  }

  /**
   * Check if a key exists and is not expired.
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = new CacheService();

/* eslint-disable @typescript-eslint/no-explicit-any */
type CacheEntry<T> = {
  data: T;
  expiry: number;
};

type ErrorEntry = {
  error: string;
  expiry: number;
};

class ServerCache {
  private cache = new Map<string, CacheEntry<any>>();
  private errors = new Map<string, ErrorEntry>();
  private pendingPromises = new Map<string, Promise<any>>();

  /**
   * Retrieves data from cache or runs fetchFn if not cached or expired.
   * Leverages "single-flight" request coalescing to prevent cache stampedes.
   * Errors are also cached (for errorTtlMs) to stop hammering a failing service.
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number,
    errorTtlMs: number = 5 * 60_000 // cache errors for 5 minutes by default
  ): Promise<T> {
    const now = Date.now();

    // Return cached data if still fresh
    const entry = this.cache.get(key);
    if (entry && entry.expiry > now) {
      return entry.data;
    }

    // Throw cached error if still in error backoff window
    const errorEntry = this.errors.get(key);
    if (errorEntry && errorEntry.expiry > now) {
      throw new Error(errorEntry.error);
    }

    // Single-flight: if a fetch is already in progress, reuse it
    let pending = this.pendingPromises.get(key);
    if (!pending) {
      pending = fetchFn()
        .then((data) => {
          this.cache.set(key, { data, expiry: Date.now() + ttlMs });
          this.errors.delete(key); // clear any previous error
          this.pendingPromises.delete(key);
          return data;
        })
        .catch((err) => {
          // Cache the error so we don't hammer a failing service
          this.errors.set(key, {
            error: err?.message || String(err),
            expiry: Date.now() + errorTtlMs,
          });
          this.pendingPromises.delete(key);
          throw err;
        });
      this.pendingPromises.set(key, pending);
    }

    return pending;
  }

  /** Invalidate a specific cache key (and its error state). */
  invalidate(key: string) {
    this.cache.delete(key);
    this.errors.delete(key);
    this.pendingPromises.delete(key);
  }

  /** Invalidate cache keys containing a substring. */
  invalidatePattern(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
    for (const key of this.errors.keys()) {
      if (key.includes(pattern)) this.errors.delete(key);
    }
    for (const key of this.pendingPromises.keys()) {
      if (key.includes(pattern)) this.pendingPromises.delete(key);
    }
  }

  /** Clear everything. */
  invalidateAll() {
    this.cache.clear();
    this.errors.clear();
    this.pendingPromises.clear();
  }
}

export const serverCache = new ServerCache();


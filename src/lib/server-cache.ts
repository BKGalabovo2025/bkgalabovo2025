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
  private stale = new Map<string, any>(); // последни добри данни (stale-while-revalidate)
  private errors = new Map<string, ErrorEntry>();
  private pendingPromises = new Map<string, Promise<any>>();

  /**
   * Retrieves data from cache or runs fetchFn if not cached or expired.
   * Leverages "single-flight" request coalescing to prevent cache stampedes.
   *
   * ★ QUOTA-SAFE поведение:
   *   - При грешка → QUOTA: backoff само 1 мин, връща stale данни ако ги има
   *   - При грешка → друга: backoff 5 мин, връща stale данни ако ги има
   *   - Само ако НЯМА никакви стари данни → хвърля грешката
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number,
    errorTtlMs: number = 5 * 60_000
  ): Promise<T> {
    const now = Date.now();

    // Върни кешираните данни ако са свежи
    const entry = this.cache.get(key);
    if (entry && entry.expiry > now) {
      return entry.data;
    }

    // Проверка за кеширана грешка (backoff период)
    const errorEntry = this.errors.get(key);
    if (errorEntry && errorEntry.expiry > now) {
      // ★ КЛЮЧОВО: ако имаме stale данни → върни ги вместо да хвърляме грешка
      const staleData = this.stale.get(key);
      if (staleData !== undefined) {
        console.warn(
          `[ServerCache] Quota/error backoff for "${key}" — serving stale data`
        );
        return staleData as T;
      }
      // Нямаме никакви данни → хвърли грешката
      throw new Error(errorEntry.error);
    }

    // Single-flight: ако вече тече заявка, изчакай я
    let pending = this.pendingPromises.get(key);
    if (!pending) {
      pending = fetchFn()
        .then((data) => {
          this.cache.set(key, { data, expiry: Date.now() + ttlMs });
          this.stale.set(key, data); // запази като stale за бъдещи грешки
          this.errors.delete(key);
          this.pendingPromises.delete(key);
          return data;
        })
        .catch((err) => {
          const msg: string = err?.message || String(err);
          const isQuota =
            msg.includes("RESOURCE_EXHAUSTED") ||
            msg.includes("Quota exceeded");
          // Quota грешки → по-кратък backoff (1 мин), останалите → 5 мин
          const ttl = isQuota ? 60_000 : errorTtlMs;

          this.errors.set(key, {
            error: msg,
            expiry: Date.now() + ttl,
          });
          this.pendingPromises.delete(key);

          // ★ Ако имаме stale данни → НЕ хвърляй грешка, върни ги
          const staleData = this.stale.get(key);
          if (staleData !== undefined) {
            console.warn(
              `[ServerCache] Fetch failed for "${key}" (${isQuota ? "QUOTA" : "ERROR"}) — serving stale data`
            );
            return staleData as T;
          }

          throw err;
        });
      this.pendingPromises.set(key, pending);
    }

    return pending;
  }

  /** Инвалидира конкретен ключ (и stale данните му). */
  invalidate(key: string) {
    this.cache.delete(key);
    this.stale.delete(key);
    this.errors.delete(key);
    this.pendingPromises.delete(key);
  }

  /** Инвалидира всички ключове съдържащи подниз. */
  invalidatePattern(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
    for (const key of this.stale.keys()) {
      if (key.includes(pattern)) this.stale.delete(key);
    }
    for (const key of this.errors.keys()) {
      if (key.includes(pattern)) this.errors.delete(key);
    }
    for (const key of this.pendingPromises.keys()) {
      if (key.includes(pattern)) this.pendingPromises.delete(key);
    }
  }

  /** Изчиства всичко. */
  invalidateAll() {
    this.cache.clear();
    this.stale.clear();
    this.errors.clear();
    this.pendingPromises.clear();
  }
}

export const serverCache = new ServerCache();

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
}

class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  getAge(key: string): number | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    return Date.now() - entry.createdAt;
  }

  getStats(): { entries: number; keys: string[] } {
    // Clean expired entries first
    for (const [key, entry] of this.store) {
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    return {
      entries: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

export const cache = new TTLCache();

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 500;
const CLEANUP_INTERVAL_MS = 30_000; // 30s auto-cleanup

class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Auto-cleanup expired entries periodically
    if (typeof globalThis !== 'undefined') {
      this.cleanupTimer = setInterval(() => this.evictExpired(), CLEANUP_INTERVAL_MS);
      // Allow Node to exit even if timer is running
      if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
        this.cleanupTimer.unref();
      }
    }
  }

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
    // Evict if at capacity
    if (this.store.size >= MAX_CACHE_ENTRIES && !this.store.has(key)) {
      this.evictOldest();
    }
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
    this.evictExpired();
    return {
      entries: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private evictOldest(): void {
    // Remove the oldest entry when at capacity
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of this.store) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    if (oldestKey) this.store.delete(oldestKey);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }
}

export const cache = new TTLCache();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const limiters = new Map<string, Map<string, number[]>>();
const MAX_IPS_PER_LIMITER = 10_000;

// Periodic cleanup of stale IP entries every 60s
if (typeof globalThis !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [, requests] of limiters) {
      for (const [ip, timestamps] of requests) {
        const filtered = timestamps.filter((t) => t > now - 120_000);
        if (filtered.length === 0) {
          requests.delete(ip);
        } else {
          requests.set(ip, filtered);
        }
      }
    }
  }, 60_000);
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function rateLimit(name: string, config: RateLimitConfig) {
  if (!limiters.has(name)) {
    limiters.set(name, new Map());
  }
  const requests = limiters.get(name)!;

  return function check(ip: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const timestamps = (requests.get(ip) || []).filter((t) => t > windowStart);

    if (timestamps.length >= config.maxRequests) {
      const oldestInWindow = timestamps[0];
      return {
        allowed: false,
        retryAfterMs: oldestInWindow + config.windowMs - now,
      };
    }

    // Enforce max IPs per limiter to prevent memory exhaustion
    if (requests.size >= MAX_IPS_PER_LIMITER && !requests.has(ip)) {
      let oldestIp: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of requests) {
        const latest = v[v.length - 1] || 0;
        if (latest < oldestTime) {
          oldestTime = latest;
          oldestIp = k;
        }
      }
      if (oldestIp) requests.delete(oldestIp);
    }

    timestamps.push(now);
    requests.set(ip, timestamps);
    return { allowed: true };
  };
}

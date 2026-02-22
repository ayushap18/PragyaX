interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const limiters = new Map<string, Map<string, number[]>>();

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

    timestamps.push(now);
    requests.set(ip, timestamps);
    return { allowed: true };
  };
}

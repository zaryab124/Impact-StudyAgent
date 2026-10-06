/**
 * In-memory sliding token bucket rate limiter for API protection.
 * In a distributed multi-node production setup (Phase 4), this will be backed by Redis.
 */

interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  limit?: number; // Maximum tokens per window
  windowMs?: number; // Time window in milliseconds
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetMs: number } {
  const limit =
    options.limit ||
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    100;
  const windowMs =
    options.windowMs ||
    Number(process.env.RATE_LIMIT_WINDOW_MS) ||
    60000;

  const now = Date.now();
  const record = memoryStore.get(identifier) || {
    tokens: limit,
    lastRefill: now,
  };

  // Refill tokens based on elapsed time
  const elapsed = now - record.lastRefill;
  if (elapsed > windowMs) {
    record.tokens = limit;
    record.lastRefill = now;
  }

  if (record.tokens > 0) {
    record.tokens -= 1;
    memoryStore.set(identifier, record);
    return {
      allowed: true,
      remaining: record.tokens,
      resetMs: windowMs - (now - record.lastRefill),
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetMs: windowMs - (now - record.lastRefill),
  };
}

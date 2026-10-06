// ==============================================================================
// AI Live Paper Generator - Granular Tiered Rate Limiter (Phase 10)
// Sliding Window Rate Limiting with Dedicated Exam-Safe Burst Protection
// ==============================================================================

export type RateLimitTier =
  | "STUDENT_EXAM_AUTOSAVE"
  | "STUDENT_GENERAL"
  | "TEACHER"
  | "ADMIN"
  | "PUBLIC_AUTH";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstAllowance: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds?: number;
}

export class RateLimiter {
  private static tierConfigs: Record<RateLimitTier, RateLimitConfig> = {
    // Generous burst allowances to guarantee students in live examinations are NEVER blocked
    STUDENT_EXAM_AUTOSAVE: {
      maxRequests: 120,
      windowMs: 60 * 1000,
      burstAllowance: 30,
    },
    STUDENT_GENERAL: {
      maxRequests: 60,
      windowMs: 60 * 1000,
      burstAllowance: 10,
    },
    TEACHER: {
      maxRequests: 120,
      windowMs: 60 * 1000,
      burstAllowance: 20,
    },
    ADMIN: {
      maxRequests: 300,
      windowMs: 60 * 1000,
      burstAllowance: 50,
    },
    PUBLIC_AUTH: {
      maxRequests: 10,
      windowMs: 60 * 1000,
      burstAllowance: 3,
    },
  };

  // In-memory sliding window timestamps: Map<tier_key, number[]>
  private static requestWindows: Map<string, number[]> = new Map();

  /**
   * Evaluates if a request from an identifier (e.g. IP or userId) is allowed under a given tier.
   */
  public static checkLimit(identifier: string, tier: RateLimitTier): RateLimitResult {
    const config = this.tierConfigs[tier];
    const totalAllowed = config.maxRequests + config.burstAllowance;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const cacheKey = `${tier}::${identifier}`;
    let timestamps = this.requestWindows.get(cacheKey) || [];

    // Filter out expired timestamps outside current sliding window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= totalAllowed) {
      const oldestInWindow = timestamps[0];
      const resetMs = Math.max(0, oldestInWindow + config.windowMs - now);
      const retryAfterSeconds = Math.ceil(resetMs / 1000);

      this.requestWindows.set(cacheKey, timestamps);
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetMs,
        retryAfterSeconds,
      };
    }

    // Register current request
    timestamps.push(now);
    this.requestWindows.set(cacheKey, timestamps);

    const remaining = Math.max(0, totalAllowed - timestamps.length);
    const resetMs = config.windowMs;

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining,
      resetMs,
    };
  }

  /**
   * Resets rate limiter memory for testing.
   */
  public static reset(): void {
    this.requestWindows.clear();
  }
}

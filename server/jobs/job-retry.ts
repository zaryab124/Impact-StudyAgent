// ==============================================================================
// AI Live Paper Generator - Job Retry & Dead-Letter Manager (Phase 10)
// Exponential Backoff with Jitter & Fault Recovery Policies
// ==============================================================================

import { JobRecord } from "./job-types";

export class JobRetryManager {
  private static readonly DEFAULT_BASE_DELAY_MS = 1000;
  private static readonly DEFAULT_MAX_DELAY_MS = 30000;

  /**
   * Computes the next retry delay using exponential backoff with jitter:
   * delay = min(baseDelay * 2^(attempt - 1), maxDelay) +/- jitter
   */
  public static calculateBackoff(
    attempt: number,
    baseDelayMs: number = this.DEFAULT_BASE_DELAY_MS,
    maxDelayMs: number = this.DEFAULT_MAX_DELAY_MS
  ): number {
    const exponential = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
    const capped = Math.min(exponential, maxDelayMs);
    // Add 10% deterministic jitter
    const jitter = capped * 0.1 * ((attempt % 3) / 2);
    return Math.round(capped + jitter);
  }

  /**
   * Determines if a job can be retried or should be transitioned to FAILED / DLQ.
   */
  public static evaluateRetry(job: JobRecord): {
    canRetry: boolean;
    nextDelayMs: number;
    targetStatus: "RETRYING" | "FAILED";
  } {
    if (job.attempts < job.maxAttempts) {
      const nextDelayMs = this.calculateBackoff(job.attempts);
      return {
        canRetry: true,
        nextDelayMs,
        targetStatus: "RETRYING",
      };
    }

    return {
      canRetry: false,
      nextDelayMs: 0,
      targetStatus: "FAILED",
    };
  }
}

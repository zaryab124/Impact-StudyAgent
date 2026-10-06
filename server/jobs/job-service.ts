// ==============================================================================
// AI Live Paper Generator - Background Job Service (Phase 10)
// Centralized Job Dispatch, Progress Queries & Lifecycle Operations
// ==============================================================================

import {
  JobRecord,
  JobType,
  JobPriority,
  JobStatus,
  QueueMetrics,
} from "./job-types";
import { JobQueue } from "./job-queue";
import { JobWorker, JobProcessor } from "./job-worker";

export class JobService {
  /**
   * Registers a processor for background jobs.
   */
  public static registerProcessor<P = any, R = any>(type: JobType, processor: JobProcessor<P, R>): void {
    JobWorker.registerProcessor(type, processor);
  }

  /**
   * Dispatches a background job to the queue.
   */
  public static dispatchJob<P = Record<string, unknown>>(
    type: JobType,
    payload: P,
    options: { priority?: JobPriority; maxAttempts?: number; userId?: string } = {}
  ): JobRecord<P> {
    return JobQueue.enqueue(type, payload, options);
  }

  /**
   * Gets the live status of a job.
   */
  public static getJobStatus(jobId: string): JobRecord | undefined {
    return JobQueue.getJob(jobId);
  }

  /**
   * Cancels a pending job.
   */
  public static cancelJob(jobId: string): boolean {
    return JobQueue.cancelJob(jobId);
  }

  /**
   * Lists jobs with filters.
   */
  public static listJobs(filter?: { status?: JobStatus; type?: JobType; limit?: number }): JobRecord[] {
    return JobQueue.listJobs(filter);
  }

  /**
   * Gets queue metrics.
   */
  public static getQueueMetrics(): QueueMetrics {
    return JobQueue.getMetrics();
  }

  /**
   * Drains available jobs (useful for testing or batch runs).
   */
  public static async processPendingJobs(): Promise<number> {
    return JobWorker.drainQueue();
  }

  /**
   * Resets queue state for testing.
   */
  public static reset(): void {
    JobQueue.reset();
  }
}

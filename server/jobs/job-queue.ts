// ==============================================================================
// AI Live Paper Generator - Priority Job Queue (Phase 10)
// Thread-Safe Background Task Queue with Priority Scheduling & Dead-Letter Support
// ==============================================================================

import { randomUUID } from "crypto";
import {
  JobRecord,
  JobType,
  JobPriority,
  JobStatus,
  QueueMetrics,
} from "./job-types";
import { JobRetryManager } from "./job-retry";

export class JobQueue {
  private static jobs: Map<string, JobRecord> = new Map();
  private static deadLetterJobs: string[] = [];

  private static priorityWeight(priority: JobPriority): number {
    switch (priority) {
      case "CRITICAL": return 4;
      case "HIGH": return 3;
      case "NORMAL": return 2;
      case "LOW": return 1;
    }
  }

  /**
   * Enqueues a new background job.
   */
  public static enqueue<P = Record<string, unknown>>(
    type: JobType,
    payload: P,
    options: {
      priority?: JobPriority;
      maxAttempts?: number;
      userId?: string;
    } = {}
  ): JobRecord<P> {
    const id = randomUUID();
    const job: JobRecord<P> = {
      id,
      type,
      priority: options.priority || "NORMAL",
      status: "QUEUED",
      payload,
      progressPercentage: 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      queuedAt: new Date().toISOString(),
      userId: options.userId,
    };

    this.jobs.set(id, job as any);
    return job;
  }

  /**
   * Dequeues the highest priority available job in QUEUED or ready RETRYING state.
   */
  public static dequeue(): JobRecord | null {
    const candidates = Array.from(this.jobs.values()).filter(
      (j) => j.status === "QUEUED" || j.status === "RETRYING"
    );

    if (candidates.length === 0) return null;

    // Sort by priority descending, then queuedAt ascending
    candidates.sort((a, b) => {
      const pDiff = this.priorityWeight(b.priority) - this.priorityWeight(a.priority);
      if (pDiff !== 0) return pDiff;
      return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime();
    });

    const selected = candidates[0];
    selected.status = "RUNNING";
    selected.startedAt = new Date().toISOString();
    selected.attempts++;

    return selected;
  }

  /**
   * Updates job progress percentage (0 - 100).
   */
  public static updateProgress(jobId: string, progressPercentage: number): void {
    const job = this.jobs.get(jobId);
    if (job && job.status === "RUNNING") {
      job.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    }
  }

  /**
   * Marks a running job as completed with its resulting data.
   */
  public static completeJob<R = Record<string, unknown>>(jobId: string, result?: R): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = "COMPLETED";
      job.progressPercentage = 100;
      job.completedAt = new Date().toISOString();
      job.result = result as any;
    }
  }

  /**
   * Fails a running job and evaluates retry or dead-letter escalation.
   */
  public static failJob(jobId: string, error: string): { status: JobStatus; canRetry: boolean } {
    const job = this.jobs.get(jobId);
    if (!job) return { status: "FAILED", canRetry: false };

    job.error = error;
    const retryEval = JobRetryManager.evaluateRetry(job);

    if (retryEval.canRetry) {
      job.status = "RETRYING";
      job.retryDelayMs = retryEval.nextDelayMs;
      return { status: "RETRYING", canRetry: true };
    }

    job.status = "FAILED";
    job.completedAt = new Date().toISOString();
    if (!this.deadLetterJobs.includes(jobId)) {
      this.deadLetterJobs.push(jobId);
    }

    return { status: "FAILED", canRetry: false };
  }

  /**
   * Cancels a queued or retrying job.
   */
  public static cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && (job.status === "QUEUED" || job.status === "RETRYING")) {
      job.status = "CANCELLED";
      job.completedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Retrieves a job by ID.
   */
  public static getJob(jobId: string): JobRecord | undefined {
    const job = this.jobs.get(jobId);
    return job ? JSON.parse(JSON.stringify(job)) : undefined;
  }

  /**
   * Lists jobs with optional filtering.
   */
  public static listJobs(filter?: { status?: JobStatus; type?: JobType; limit?: number }): JobRecord[] {
    let list = Array.from(this.jobs.values());
    if (filter?.status) {
      list = list.filter((j) => j.status === filter.status);
    }
    if (filter?.type) {
      list = list.filter((j) => j.type === filter.type);
    }
    const limit = filter?.limit || 50;
    return list.slice(0, limit);
  }

  /**
   * Computes real-time queue metrics.
   */
  public static getMetrics(): QueueMetrics {
    const metrics: QueueMetrics = {
      totalJobs: this.jobs.size,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      retrying: 0,
      cancelled: 0,
      deadLetterCount: this.deadLetterJobs.length,
    };

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case "QUEUED": metrics.queued++; break;
        case "RUNNING": metrics.running++; break;
        case "COMPLETED": metrics.completed++; break;
        case "FAILED": metrics.failed++; break;
        case "RETRYING": metrics.retrying++; break;
        case "CANCELLED": metrics.cancelled++; break;
      }
    }

    return metrics;
  }

  /**
   * Clears queue for testing.
   */
  public static reset(): void {
    this.jobs.clear();
    this.deadLetterJobs = [];
  }
}

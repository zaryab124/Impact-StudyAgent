// ==============================================================================
// AI Live Paper Generator - Background Job Worker (Phase 10)
// Asynchronous Job Execution Loop with Handlers & Progress Monitoring
// ==============================================================================

import { JobRecord, JobType } from "./job-types";
import { JobQueue } from "./job-queue";

export type JobProcessor<P = any, R = any> = (
  job: JobRecord<P>,
  updateProgress: (pct: number) => void
) => Promise<R>;

export class JobWorker {
  private static processors: Map<JobType, JobProcessor> = new Map();
  private static isRunning = false;

  /**
   * Registers a task execution handler for a specific JobType.
   */
  public static registerProcessor<P = any, R = any>(
    type: JobType,
    processor: JobProcessor<P, R>
  ): void {
    this.processors.set(type, processor);
  }

  /**
   * Processes a single available job from the queue.
   */
  public static async processNextJob(): Promise<{ processed: boolean; jobId?: string; status?: string }> {
    const job = JobQueue.dequeue();
    if (!job) return { processed: false };

    const processor = this.processors.get(job.type);
    if (!processor) {
      JobQueue.failJob(job.id, `No handler registered for job type "${job.type}".`);
      return { processed: true, jobId: job.id, status: "FAILED" };
    }

    try {
      const updateProgress = (pct: number) => {
        JobQueue.updateProgress(job.id, pct);
      };

      const result = await processor(job, updateProgress);
      JobQueue.completeJob(job.id, result);
      return { processed: true, jobId: job.id, status: "COMPLETED" };
    } catch (err: any) {
      const { status } = JobQueue.failJob(job.id, err.message || "Unknown error during job execution");
      return { processed: true, jobId: job.id, status };
    }
  }

  /**
   * Processes all currently queued jobs until the queue is drained.
   */
  public static async drainQueue(): Promise<number> {
    let count = 0;
    while (true) {
      const res = await this.processNextJob();
      if (!res.processed) break;
      count++;
    }
    return count;
  }
}

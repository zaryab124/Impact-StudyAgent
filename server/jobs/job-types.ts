// ==============================================================================
// AI Live Paper Generator - Background Job System Types (Phase 10)
// Asynchronous Processing, Retry Policies & Dead-Letter Queue Contracts
// ==============================================================================

export type JobType =
  | "DOCUMENT_EXTRACTION"
  | "SYLLABUS_ALIGNMENT"
  | "BATCH_QUESTION_GENERATION"
  | "EXAM_EVALUATION"
  | "KNOWLEDGE_SYNC";

export type JobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING"
  | "CANCELLED";

export type JobPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface JobRecord<P = Record<string, unknown>, R = Record<string, unknown>> {
  id: string;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  payload: P;
  result?: R;
  progressPercentage: number;
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  userId?: string;
  retryDelayMs?: number;
}

export interface QueueMetrics {
  totalJobs: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
  cancelled: number;
  deadLetterCount: number;
}

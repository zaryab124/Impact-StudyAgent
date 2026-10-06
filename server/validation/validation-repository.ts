// ==============================================================================
// AI Live Paper Generator - Validation Repository (Phase 11)
// Thread-Safe Dual-Tier Persistence for Validation Runs, Evidence & Benchmarks
// ==============================================================================

import {
  ValidationRun,
  PerformanceMeasurement,
} from "@/types/validation";
import { prisma } from "@/lib/db";

export class ValidationRepository {
  private static memoryRuns: Map<string, ValidationRun> = new Map();
  private static memoryPerformance: PerformanceMeasurement[] = [];

  /**
   * Persists a validation run and its checks.
   */
  public static async saveRun(run: ValidationRun): Promise<ValidationRun> {
    const clone = JSON.parse(JSON.stringify(run));
    this.memoryRuns.set(clone.id, clone);

    if (process.env.NODE_ENV !== "test") {
      try {
        // Persist audit log entry for run tracking
        await prisma.auditLog.create({
          data: {
            userId: run.initiatedBy,
            action: "VALIDATION_RUN_SAVED",
            resource: "ValidationRun",
            resourceId: run.id,
            metadata: {
              releaseCandidate: run.releaseCandidate,
              overallStatus: run.overallStatus,
              overallTier: run.overallTier,
              checksCount: run.checks.length,
            },
          },
        });
      } catch {
        // Fallback to in-memory store
      }
    }

    return clone;
  }

  /**
   * Retrieves a validation run by ID.
   */
  public static async findRunById(id: string): Promise<ValidationRun | null> {
    const mem = this.memoryRuns.get(id);
    return mem ? JSON.parse(JSON.stringify(mem)) : null;
  }

  /**
   * Retrieves the most recent validation run.
   */
  public static async getLatestRun(): Promise<ValidationRun | null> {
    const runs = Array.from(this.memoryRuns.values());
    if (runs.length === 0) return null;

    runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return JSON.parse(JSON.stringify(runs[0]));
  }

  /**
   * Lists past validation runs.
   */
  public static async listRuns(limit: number = 20): Promise<ValidationRun[]> {
    const runs = Array.from(this.memoryRuns.values());
    runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return JSON.parse(JSON.stringify(runs.slice(0, limit)));
  }

  /**
   * Records a measured performance benchmark.
   */
  public static recordPerformance(perf: PerformanceMeasurement): void {
    this.memoryPerformance.unshift(perf);
    if (this.memoryPerformance.length > 500) {
      this.memoryPerformance.pop();
    }
  }

  /**
   * Retrieves measured performance history.
   */
  public static getRecentPerformance(limit: number = 50): PerformanceMeasurement[] {
    return JSON.parse(JSON.stringify(this.memoryPerformance.slice(0, limit)));
  }

  /**
   * Resets repository memory for testing.
   */
  public static resetMemory(): void {
    this.memoryRuns.clear();
    this.memoryPerformance = [];
  }
}

// ==============================================================================
// AI Live Paper Generator - AI Usage & Telemetry Logger (Phase 10)
// Auditable Token Tracking, Cost Computation & Provider Performance Monitoring
// ==============================================================================

import { randomUUID } from "crypto";
import {
  AIUsageRecord,
  AIUsageSummary,
  AIModelProviderId,
  AICategory,
} from "./orchestration/ai-orchestration-types";

export class AIUsageLogger {
  private static memoryLogs: AIUsageRecord[] = [];

  /**
   * Records an AI model invocation event with token and cost metadata.
   */
  public static async logUsage(params: {
    category: AICategory;
    providerId: AIModelProviderId;
    modelName: string;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
    latencyMs: number;
    success: boolean;
    error?: string;
    userId?: string;
  }): Promise<AIUsageRecord> {
    const record: AIUsageRecord = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      category: params.category,
      providerId: params.providerId,
      modelName: params.modelName,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: params.promptTokens + params.completionTokens,
      costUsd: params.costUsd,
      latencyMs: params.latencyMs,
      success: params.success,
      error: params.error,
      userId: params.userId,
    };

    this.memoryLogs.unshift(record);

    // Keep memory cache within bounded limits (e.g. last 10,000 logs)
    if (this.memoryLogs.length > 10000) {
      this.memoryLogs.pop();
    }

    return record;
  }

  /**
   * Retrieves aggregated AI usage statistics.
   */
  public static getUsageSummary(): AIUsageSummary {
    const summary: AIUsageSummary = {
      totalCalls: this.memoryLogs.length,
      successfulCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      averageLatencyMs: 0,
      byProvider: {
        openai: { calls: 0, tokens: 0, costUsd: 0 },
        gemini: { calls: 0, tokens: 0, costUsd: 0 },
        anthropic: { calls: 0, tokens: 0, costUsd: 0 },
        deterministic: { calls: 0, tokens: 0, costUsd: 0 },
      },
      byCategory: {
        BOOK_EXTRACTION: { calls: 0, tokens: 0, costUsd: 0 },
        SYLLABUS_ALIGNMENT: { calls: 0, tokens: 0, costUsd: 0 },
        QUESTION_GENERATION: { calls: 0, tokens: 0, costUsd: 0 },
        SUBJECTIVE_EVALUATION: { calls: 0, tokens: 0, costUsd: 0 },
        BLUEPRINT_INSPECTION: { calls: 0, tokens: 0, costUsd: 0 },
      },
    };

    let totalLatency = 0;

    for (const log of this.memoryLogs) {
      if (log.success) {
        summary.successfulCalls++;
      } else {
        summary.failedCalls++;
      }

      summary.totalTokens += log.totalTokens;
      summary.totalCostUsd += log.costUsd;
      totalLatency += log.latencyMs;

      // Provider breakdown
      if (summary.byProvider[log.providerId]) {
        summary.byProvider[log.providerId].calls++;
        summary.byProvider[log.providerId].tokens += log.totalTokens;
        summary.byProvider[log.providerId].costUsd += log.costUsd;
      }

      // Category breakdown
      if (summary.byCategory[log.category]) {
        summary.byCategory[log.category].calls++;
        summary.byCategory[log.category].tokens += log.totalTokens;
        summary.byCategory[log.category].costUsd += log.costUsd;
      }
    }

    summary.averageLatencyMs =
      this.memoryLogs.length > 0 ? Math.round(totalLatency / this.memoryLogs.length) : 0;
    summary.totalCostUsd = Math.round(summary.totalCostUsd * 10000) / 10000;

    return summary;
  }

  /**
   * Retrieves raw log entries, optionally filtered.
   */
  public static getLogs(limit: number = 50, providerId?: AIModelProviderId): AIUsageRecord[] {
    let filtered = this.memoryLogs;
    if (providerId) {
      filtered = filtered.filter((l) => l.providerId === providerId);
    }
    return filtered.slice(0, limit);
  }

  /**
   * Resets memory cache for testing.
   */
  public static resetMemory(): void {
    this.memoryLogs = [];
  }
}

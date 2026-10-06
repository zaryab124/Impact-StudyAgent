// ==============================================================================
// AI Live Paper Generator - Multi-LLM Orchestration & Consensus Types (Phase 10)
// Type Contracts for Multi-Model Routing, Consensus & Usage Telemetry
// ==============================================================================

export type AIModelProviderId = "openai" | "gemini" | "anthropic" | "deterministic";

export type AICategory =
  | "BOOK_EXTRACTION"
  | "SYLLABUS_ALIGNMENT"
  | "QUESTION_GENERATION"
  | "SUBJECTIVE_EVALUATION"
  | "BLUEPRINT_INSPECTION";

export type ProviderHealthState = "HEALTHY" | "DEGRADED" | "OFFLINE" | "UNVERIFIED";

export type ConsensusVerdict =
  | "CONSENSUS_REACHED"
  | "MODEL_DISAGREEMENT"
  | "INSUFFICIENT_RESPONSES"
  | "HUMAN_REVIEW_REQUIRED";

export interface AIModelConfig {
  providerId: AIModelProviderId;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  costPer1kPromptTokens: number;
  costPer1kCompletionTokens: number;
}

export interface ProviderHealthMetrics {
  providerId: AIModelProviderId;
  status: ProviderHealthState;
  averageLatencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  consecutiveFailures: number;
  lastCheckedAt: string;
  errorMessage?: string;
}

export interface ModelInferenceResult {
  providerId: AIModelProviderId;
  modelName: string;
  content: string;
  parsedJson?: Record<string, unknown>;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  success: boolean;
  errorMessage?: string;
}

export interface ConsensusCandidate {
  providerId: AIModelProviderId;
  modelName: string;
  value: string | number | Record<string, unknown>;
  confidence: number;
}

export interface ConsensusResult<T = unknown> {
  verdict: ConsensusVerdict;
  agreementRate: number; // 0.0 - 1.0
  consensusValue?: T;
  divergingValues?: Array<{
    providerId: AIModelProviderId;
    modelName: string;
    value: unknown;
    reason?: string;
  }>;
  totalModelsPolled: number;
  modelsAgreed: number;
  requiresHumanReview: boolean;
  notes: string;
}

export interface AIUsageRecord {
  id: string;
  timestamp: string;
  category: AICategory;
  providerId: AIModelProviderId;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  userId?: string;
}

export interface AIUsageSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  totalCostUsd: number;
  averageLatencyMs: number;
  byProvider: Record<AIModelProviderId, { calls: number; tokens: number; costUsd: number }>;
  byCategory: Record<AICategory, { calls: number; tokens: number; costUsd: number }>;
}

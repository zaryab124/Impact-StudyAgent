// ==============================================================================
// AI Live Paper Generator - AI Task Router & Fallback Manager (Phase 10)
// Dynamic Category-Based Model Selection with Graceful Degradation
// ==============================================================================

import {
  AICategory,
  AIModelProviderId,
  AIModelConfig,
} from "./ai-orchestration-types";
import { ProviderHealthTracker } from "./provider-health";

export interface TaskRouteDecision {
  primaryProvider: AIModelProviderId;
  fallbackChain: AIModelProviderId[];
  config: AIModelConfig;
  reason: string;
}

export class TaskRouter {
  // Category-specific preference hierarchy
  private static categoryPreferences: Record<AICategory, AIModelProviderId[]> = {
    BOOK_EXTRACTION: ["gemini", "openai", "anthropic", "deterministic"],
    SYLLABUS_ALIGNMENT: ["openai", "gemini", "anthropic", "deterministic"],
    QUESTION_GENERATION: ["openai", "gemini", "anthropic", "deterministic"],
    SUBJECTIVE_EVALUATION: ["anthropic", "openai", "gemini", "deterministic"],
    BLUEPRINT_INSPECTION: ["openai", "gemini", "deterministic", "anthropic"],
  };

  /**
   * Resolves the optimal provider and fallback chain for an AI task category.
   */
  public static resolveRoute(
    category: AICategory,
    allowDeterministicFallback: boolean = true
  ): TaskRouteDecision {
    const preferences = this.categoryPreferences[category] || ["openai", "gemini", "deterministic"];

    // Find the first healthy provider in preference order
    const healthyProviders: AIModelProviderId[] = [];
    const degradedProviders: AIModelProviderId[] = [];

    for (const p of preferences) {
      if (p === "deterministic" && !allowDeterministicFallback) {
        continue;
      }

      const health = ProviderHealthTracker.getProviderHealth(p);
      if (health.status === "HEALTHY") {
        healthyProviders.push(p);
      } else if (health.status === "DEGRADED" || health.status === "UNVERIFIED") {
        degradedProviders.push(p);
      }
    }

    // Usable candidate list: healthy first, then degraded/unverified, with deterministic guaranteed if allowed
    const usable = [...healthyProviders, ...degradedProviders];
    if (allowDeterministicFallback && !usable.includes("deterministic")) {
      usable.push("deterministic");
    }

    if (usable.length === 0) {
      throw new Error(
        `AI_SERVICE_UNAVAILABLE: All AI providers for category "${category}" are currently OFFLINE and deterministic fallback is disabled.`
      );
    }

    const selected = usable[0];
    const fallbacks = usable.slice(1);

    return {
      primaryProvider: selected,
      fallbackChain: fallbacks,
      config: this.getModelConfig(selected),
      reason: `Routed to ${selected} based on category "${category}" priority and health status.`,
    };
  }

  /**
   * Gets pricing and model execution configuration.
   */
  public static getModelConfig(providerId: AIModelProviderId): AIModelConfig {
    switch (providerId) {
      case "openai":
        return {
          providerId: "openai",
          modelName: "gpt-4o",
          temperature: 0.2,
          maxTokens: 2048,
          timeoutMs: 15000,
          costPer1kPromptTokens: 0.005,
          costPer1kCompletionTokens: 0.015,
        };
      case "gemini":
        return {
          providerId: "gemini",
          modelName: "gemini-1.5-pro",
          temperature: 0.2,
          maxTokens: 2048,
          timeoutMs: 15000,
          costPer1kPromptTokens: 0.00125,
          costPer1kCompletionTokens: 0.005,
        };
      case "anthropic":
        return {
          providerId: "anthropic",
          modelName: "claude-3-5-sonnet",
          temperature: 0.2,
          maxTokens: 2048,
          timeoutMs: 15000,
          costPer1kPromptTokens: 0.003,
          costPer1kCompletionTokens: 0.015,
        };
      case "deterministic":
      default:
        return {
          providerId: "deterministic",
          modelName: "deterministic-educational-engine-v1",
          temperature: 0,
          maxTokens: 1024,
          timeoutMs: 2000,
          costPer1kPromptTokens: 0,
          costPer1kCompletionTokens: 0,
        };
    }
  }
}

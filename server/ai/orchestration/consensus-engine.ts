// ==============================================================================
// AI Live Paper Generator - AI Provider Consensus Engine (Phase 10)
// Cross-Model Agreement Validation, Disagreement Escalation & Human Review Routing
// ==============================================================================

import {
  ConsensusCandidate,
  ConsensusResult,
} from "./ai-orchestration-types";

export class ConsensusEngine {
  /**
   * Evaluates consensus across multiple independent model outputs.
   *
   * STRICT INVARIANT: Disagreements on educational facts or answer keys
   * MUST NEVER be masked or forced via arbitrary majority vote.
   * Flag MODEL_DISAGREEMENT and route to HUMAN_REVIEW_REQUIRED.
   */
  public static evaluateConsensus<T = unknown>(
    candidates: ConsensusCandidate[],
    options: {
      minimumAgreedThreshold?: number; // default 0.8 (80%)
      fieldLabel?: string;
    } = {}
  ): ConsensusResult<T> {
    const threshold = options.minimumAgreedThreshold ?? 0.8;
    const label = options.fieldLabel || "Target Property";

    if (!candidates || candidates.length === 0) {
      return {
        verdict: "INSUFFICIENT_RESPONSES",
        agreementRate: 0,
        totalModelsPolled: 0,
        modelsAgreed: 0,
        requiresHumanReview: true,
        notes: "No model candidate outputs were provided for consensus verification.",
      };
    }

    if (candidates.length === 1) {
      return {
        verdict: "CONSENSUS_REACHED",
        agreementRate: 1.0,
        consensusValue: candidates[0].value as T,
        totalModelsPolled: 1,
        modelsAgreed: 1,
        requiresHumanReview: false,
        notes: `Single model output accepted for ${label} without multi-provider cross-validation.`,
      };
    }

    // Group values by canonical string representation
    const frequencyMap = new Map<string, { value: unknown; count: number; providers: string[] }>();

    for (const c of candidates) {
      const canonical = typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value).trim().toLowerCase();
      const existing = frequencyMap.get(canonical);

      if (existing) {
        existing.count++;
        existing.providers.push(c.providerId);
      } else {
        frequencyMap.set(canonical, {
          value: c.value,
          count: 1,
          providers: [c.providerId],
        });
      }
    }

    // Find the most frequent value
    let topGroup: { value: unknown; count: number; providers: string[] } | null = null;
    for (const group of frequencyMap.values()) {
      if (!topGroup || group.count > topGroup.count) {
        topGroup = group;
      }
    }

    const totalModels = candidates.length;
    const modelsAgreed = topGroup?.count || 0;
    const agreementRate = modelsAgreed / totalModels;

    // Build diverging values report
    const divergingValues: Array<{
      providerId: any;
      modelName: string;
      value: unknown;
      reason?: string;
    }> = [];

    const canonicalTop = topGroup ? (typeof topGroup.value === "object" ? JSON.stringify(topGroup.value) : String(topGroup.value).trim().toLowerCase()) : "";

    for (const c of candidates) {
      const canonicalCandidate = typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value).trim().toLowerCase();
      if (canonicalCandidate !== canonicalTop) {
        divergingValues.push({
          providerId: c.providerId,
          modelName: c.modelName,
          value: c.value,
          reason: `Diverged from majority consensus value for ${label}`,
        });
      }
    }

    // Evaluate agreement rate against threshold
    if (agreementRate >= threshold && divergingValues.length === 0) {
      return {
        verdict: "CONSENSUS_REACHED",
        agreementRate,
        consensusValue: topGroup!.value as T,
        totalModelsPolled: totalModels,
        modelsAgreed,
        requiresHumanReview: false,
        notes: `All ${totalModels} models reached 100% unanimous agreement on ${label}.`,
      };
    }

    if (agreementRate >= threshold && divergingValues.length > 0) {
      return {
        verdict: "CONSENSUS_REACHED",
        agreementRate,
        consensusValue: topGroup!.value as T,
        divergingValues,
        totalModelsPolled: totalModels,
        modelsAgreed,
        requiresHumanReview: false,
        notes: `Consensus reached with ${modelsAgreed}/${totalModels} models (${Math.round(agreementRate * 100)}%) agreeing on ${label}.`,
      };
    }

    // Models disagree below threshold
    return {
      verdict: "MODEL_DISAGREEMENT",
      agreementRate,
      consensusValue: undefined,
      divergingValues,
      totalModelsPolled: totalModels,
      modelsAgreed,
      requiresHumanReview: true,
      notes: `CRITICAL: Multi-model disagreement detected (${modelsAgreed}/${totalModels} agreed, rate ${Math.round(agreementRate * 100)}% < threshold ${Math.round(threshold * 100)}%). Routed to human curriculum review.`,
    };
  }
}

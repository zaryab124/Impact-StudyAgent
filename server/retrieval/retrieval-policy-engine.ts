import { RetrievalPolicy } from "@/types/retrieval";
import { RankingConfigRegistry } from "./ranking-config";

export class RetrievalPolicyEngine {
  private static readonly PRODUCTION_POLICY: RetrievalPolicy = {
    id: "policy-production-default",
    name: "Production Default Educational Policy",
    allowedSyllabusStatuses: ["VERIFIED", "PUBLISHED"],
    allowedEligibilityStatuses: ["ELIGIBLE"],
    defaultTopK: 10,
    defaultSimilarityThreshold: 0.35,
    maxChunks: 10,
    maxTokens: 3000,
    maxPages: 8,
    maxCharacters: 12000,
    provenanceRequired: true,
    allowDiagnosticBypass: false,
    rankingConfigVersion: RankingConfigRegistry.DEFAULT_VERSION,
    targetLatencyMs: 500,
    weights: {
      semantic: 0.55,
      keyword: 0.25,
      metadata: 0.20,
    },
    diversity: {
      maxChunksPerPage: 3,
      deduplicationSimilarityThreshold: 0.95,
      deduplicationTextOverlap: 0.85,
    },
  };

  private static readonly DIAGNOSTIC_POLICY: RetrievalPolicy = {
    id: "policy-admin-diagnostic",
    name: "Admin Diagnostic Testing Policy",
    allowedSyllabusStatuses: ["VERIFIED", "PUBLISHED", "UNDER_REVIEW", "DRAFT"],
    allowedEligibilityStatuses: ["ELIGIBLE", "REQUIRES_REVIEW", "UNKNOWN", "EXCLUDED"],
    defaultTopK: 20,
    defaultSimilarityThreshold: 0.20,
    maxChunks: 20,
    maxTokens: 6000,
    maxPages: 15,
    maxCharacters: 25000,
    provenanceRequired: false,
    allowDiagnosticBypass: true,
    rankingConfigVersion: RankingConfigRegistry.DEFAULT_VERSION,
    targetLatencyMs: 1000,
    weights: {
      semantic: 0.50,
      keyword: 0.30,
      metadata: 0.20,
    },
    diversity: {
      maxChunksPerPage: 5,
      deduplicationSimilarityThreshold: 0.98,
      deduplicationTextOverlap: 0.90,
    },
  };

  public static getProductionPolicy(): RetrievalPolicy {
    return { ...this.PRODUCTION_POLICY };
  }

  public static getDiagnosticPolicy(): RetrievalPolicy {
    return { ...this.DIAGNOSTIC_POLICY };
  }

  public static getActivePolicy(isDiagnostic: boolean = false, isAdmin: boolean = false): RetrievalPolicy {
    if (isDiagnostic && isAdmin) {
      return this.getDiagnosticPolicy();
    }
    return this.getProductionPolicy();
  }

  public static getPolicies(): RetrievalPolicy[] {
    return [this.getProductionPolicy(), this.getDiagnosticPolicy()];
  }

  /**
   * Evaluates if a given syllabus status and eligibility status comply with policy.
   * STRICT INVARIANT: Non-admin or non-diagnostic requests can NEVER retrieve unverified syllabi or excluded/unknown content.
   */
  public static validateCompliance(
    syllabusStatus: string,
    eligibilityStatus: string,
    isDiagnostic: boolean = false,
    isAdmin: boolean = false
  ): { isAllowed: boolean; reason?: string } {
    const policy = this.getActivePolicy(isDiagnostic, isAdmin);

    if (!policy.allowedSyllabusStatuses.includes(syllabusStatus)) {
      return {
        isAllowed: false,
        reason: `Syllabus status "${syllabusStatus}" is not authorized under ${policy.name}. Allowed: ${policy.allowedSyllabusStatuses.join(", ")}.`,
      };
    }

    if (!policy.allowedEligibilityStatuses.includes(eligibilityStatus)) {
      return {
        isAllowed: false,
        reason: `Content eligibility status "${eligibilityStatus}" is excluded under ${policy.name}. Allowed: ${policy.allowedEligibilityStatuses.join(", ")}.`,
      };
    }

    return { isAllowed: true };
  }
}

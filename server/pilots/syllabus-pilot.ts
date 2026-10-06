// ==============================================================================
// AI Live Paper Generator - Syllabus Eligibility Pilot Engine (Phase 11)
// Multi-Version Alignment Verification & Strict Eligibility Gate Enforcement
// ==============================================================================

export type BlockedSyllabusState =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "ARCHIVED"
  | "REJECTED"
  | "UNKNOWN"
  | "EXCLUDED"
  | "REVIEW_REQUIRED";

export interface SyllabusPilotCheckResult {
  syllabusId: string;
  version: string;
  status: string;
  isEligibleForExamination: boolean;
  blockingReason?: string;
  checkedRules: Array<{ rule: string; passed: boolean; note?: string }>;
}

export class SyllabusPilot {
  private static readonly BLOCKED_STATES: Set<string> = new Set([
    "DRAFT",
    "UNDER_REVIEW",
    "ARCHIVED",
    "REJECTED",
    "UNKNOWN",
    "EXCLUDED",
    "REVIEW_REQUIRED",
  ]);

  /**
   * Evaluates if a syllabus record is legally and educationally eligible to generate examination blueprints.
   * STRICT INVARIANT: Any syllabus not explicitly PUBLISHED or VERIFIED must be blocked.
   */
  public static evaluateSyllabusEligibility(syllabus: {
    id: string;
    version: string;
    status: string;
    provenanceHash?: string;
    publisher?: string;
    unresolvedTopicMappingsCount?: number;
    weightageSum?: number;
  }): SyllabusPilotCheckResult {
    const checkedRules: Array<{ rule: string; passed: boolean; note?: string }> = [];

    // Rule 1: Status Gate
    const isStateBlocked = this.BLOCKED_STATES.has(syllabus.status.toUpperCase());
    const isPublishedOrVerified =
      syllabus.status.toUpperCase() === "PUBLISHED" || syllabus.status.toUpperCase() === "VERIFIED";

    checkedRules.push({
      rule: "STATUS_GATE",
      passed: !isStateBlocked && isPublishedOrVerified,
      note: `Syllabus status is "${syllabus.status}". Blocked states: [${Array.from(this.BLOCKED_STATES).join(", ")}]`,
    });

    // Rule 2: Cryptographic Provenance
    const hasProvenance = Boolean(syllabus.provenanceHash && syllabus.provenanceHash.length >= 16);
    checkedRules.push({
      rule: "PROVENANCE_INTEGRITY",
      passed: hasProvenance,
      note: hasProvenance ? "Cryptographic hash present" : "Missing source document hash",
    });

    // Rule 3: Publisher Authority
    const hasAuthority = Boolean(syllabus.publisher && syllabus.publisher.trim().length > 3);
    checkedRules.push({
      rule: "PUBLISHER_AUTHORITY",
      passed: hasAuthority,
      note: syllabus.publisher || "Missing official publisher",
    });

    // Rule 4: Unresolved Mappings Gate
    const unmappedCount = syllabus.unresolvedTopicMappingsCount || 0;
    checkedRules.push({
      rule: "ZERO_UNRESOLVED_MAPPINGS",
      passed: unmappedCount === 0,
      note: `${unmappedCount} unresolved topic mappings`,
    });

    // Overall Eligibility
    const allPassed = checkedRules.every((r) => r.passed);
    let blockingReason: string | undefined = undefined;

    if (!allPassed) {
      const failed = checkedRules.filter((r) => !r.passed).map((r) => r.rule);
      blockingReason = `SYLLABUS_GATE_BLOCKED: Failed verification rules [${failed.join(", ")}]. Downstream examination generation is strictly prohibited.`;
    }

    return {
      syllabusId: syllabus.id,
      version: syllabus.version,
      status: syllabus.status,
      isEligibleForExamination: allPassed,
      blockingReason,
      checkedRules,
    };
  }

  /**
   * Helper to verify each of the 7 blocked states.
   */
  public static testAllBlockedStates(): Record<BlockedSyllabusState, boolean> {
    const states: BlockedSyllabusState[] = [
      "DRAFT",
      "UNDER_REVIEW",
      "ARCHIVED",
      "REJECTED",
      "UNKNOWN",
      "EXCLUDED",
      "REVIEW_REQUIRED",
    ];

    const results: Record<string, boolean> = {};

    for (const st of states) {
      const res = this.evaluateSyllabusEligibility({
        id: `syl-test-${st.toLowerCase()}`,
        version: "2025.1",
        status: st,
        provenanceHash: "abcdef1234567890abcdef1234567890",
        publisher: "Official Board",
        unresolvedTopicMappingsCount: 0,
      });

      // True means correctly blocked!
      results[st] = !res.isEligibleForExamination && Boolean(res.blockingReason);
    }

    return results as Record<BlockedSyllabusState, boolean>;
  }
}

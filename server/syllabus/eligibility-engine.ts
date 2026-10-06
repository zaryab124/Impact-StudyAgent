import { prisma } from "@/lib/db";
import { EligibilityStatus, GranularScope, SyllabusStatus } from "@/types/syllabus";

export type EligibilityDiagnosticCode =
  | "ELIGIBLE"
  | "EXCLUDED_BY_CHAPTER"
  | "EXCLUDED_BY_TOPIC"
  | "EXCLUDED_BY_GRANULAR"
  | "REVIEW_REQUIRED_CHAPTER"
  | "REVIEW_REQUIRED_TOPIC"
  | "REVIEW_REQUIRED_GRANULAR"
  | "UNKNOWN_SYLLABUS"
  | "UNKNOWN_CHAPTER"
  | "UNKNOWN_TOPIC"
  | "UNKNOWN_GRANULAR"
  | "UNRESOLVED_IN_MIXED_CHAPTER";

export interface EligibilityEvaluationResult {
  eligibility: EligibilityStatus;
  isEligibleForProduction: boolean;
  reason: string;
  syllabusStatus: SyllabusStatus;
  chapterIncluded?: boolean;
  topicIncluded?: boolean;
  granularIncluded?: boolean;

  // Provenance & Diagnostic metadata
  syllabusId?: string;
  chapterId?: string | null;
  topicId?: string | null;
  granularItemId?: string | null;
  scope?: GranularScope | null;
  identifier?: string | null;
  diagnosticCode?: EligibilityDiagnosticCode;
}

export interface ContentItemQuery {
  syllabusId?: string;
  chapterId?: string | null;
  topicId?: string | null;
  scope?: GranularScope | null;
  identifier?: string | null;
  title?: string | null;
  heading?: string | null;
  chunkType?: string | null;
  subtopic?: string | null;
  exerciseQuestion?: string | null;
  isContentChunk?: boolean;
  metadata?: Record<string, any> | null;
  [key: string]: any;
}

/**
 * Deterministically normalizes whitespace and casing for robust identifier/title comparisons.
 */
export function normalizeIdentifier(str?: string | null): string {
  if (!str) return "";
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Normalizes question identifiers canonicalizing "question" and "q".
 */
function canonicalQuestionNormalize(str: string): string {
  return str.replace(/\bquestion\s*/g, "q");
}

/**
 * Matches a content query against granular syllabus records using authoritative deterministic matching.
 * Never uses fuzzy AI interpretation or semantic guesswork.
 */
export function matchGranularItem(
  items: any[],
  query: ContentItemQuery
): any | undefined {
  if (!items || items.length === 0) return undefined;

  const matches: any[] = [];
  const addMatch = (it?: any) => {
    if (it && !matches.some((m) => (m.id && it.id ? m.id === it.id : m === it))) {
      matches.push(it);
    }
  };

  // 0. Direct match by ID if specified
  const queryItemId = query.granularItemId || query.id;
  if (queryItemId) {
    const idMatch = items.find((it) => it.id === queryItemId);
    if (idMatch) addMatch(idMatch);
  }

  const queryIdentifier = query.identifier || query.subtopic || query.exerciseQuestion;
  const normQueryId = normalizeIdentifier(queryIdentifier);
  const canonQueryId = normQueryId ? canonicalQuestionNormalize(normQueryId) : "";
  const normHeading = normalizeIdentifier(query.heading);
  const canonHeading = normHeading ? canonicalQuestionNormalize(normHeading) : "";
  const normTitle = normalizeIdentifier(query.title);

  // 1. Direct match by identifier and scope (if scope specified)
  if (normQueryId) {
    if (query.scope) {
      const match = items.find((it) => {
        if (it.scope !== query.scope) return false;
        const normItId = normalizeIdentifier(it.identifier);
        return (
          normItId === normQueryId ||
          canonicalQuestionNormalize(normItId) === canonQueryId
        );
      });
      if (match) addMatch(match);
    }

    // Match by identifier across scopes
    const match = items.find((it) => {
      const normItId = normalizeIdentifier(it.identifier);
      return (
        normItId === normQueryId ||
        canonicalQuestionNormalize(normItId) === canonQueryId
      );
    });
    if (match) addMatch(match);
  }

  // 2. Direct match by title and scope (if scope specified)
  if (normTitle) {
    if (query.scope) {
      const match = items.find(
        (it) => it.scope === query.scope && it.title && normalizeIdentifier(it.title) === normTitle
      );
      if (match) addMatch(match);
    }
    const match = items.find((it) => it.title && normalizeIdentifier(it.title) === normTitle);
    if (match) addMatch(match);
  }

  // 3. Match via heading
  if (normHeading) {
    // Exact match with identifier or title
    const matchExact = items.find((it) => {
      const normItId = normalizeIdentifier(it.identifier);
      const normItTitle = it.title ? normalizeIdentifier(it.title) : "";
      return (
        normItId === normHeading ||
        canonicalQuestionNormalize(normItId) === canonHeading ||
        normItTitle === normHeading
      );
    });
    if (matchExact) addMatch(matchExact);

    // Deterministic prefix match: heading begins with identifier followed by delimiter
    const matchPrefix = items.find((it) => {
      const itId = normalizeIdentifier(it.identifier);
      if (!itId) return false;
      return (
        normHeading.startsWith(itId + " ") ||
        normHeading.startsWith(itId + " -") ||
        normHeading.startsWith(itId + ":") ||
        normHeading.startsWith(itId + ".")
      );
    });
    if (matchPrefix) addMatch(matchPrefix);
  }

  // 4. Subtopic-specific match
  if (query.subtopic) {
    const normSub = normalizeIdentifier(query.subtopic);
    const match = items.find(
      (it) =>
        it.scope === "SUBTOPIC" &&
        (normalizeIdentifier(it.identifier) === normSub ||
          (it.title && normalizeIdentifier(it.title) === normSub))
    );
    if (match) addMatch(match);
  }

  // 5. ExerciseQuestion-specific match
  if (query.exerciseQuestion) {
    const normEq = normalizeIdentifier(query.exerciseQuestion);
    const canonEq = canonicalQuestionNormalize(normEq);
    const match = items.find((it) => {
      if (it.scope !== "EXERCISE_QUESTION") return false;
      const normItId = normalizeIdentifier(it.identifier);
      return (
        normItId === normEq ||
        canonicalQuestionNormalize(normItId) === canonEq ||
        (it.title && normalizeIdentifier(it.title) === normEq)
      );
    });
    if (match) addMatch(match);
  }

  if (matches.length === 0) return undefined;

  // STRICT INVARIANT: If ANY matching granular rule is EXCLUDED, the EXCLUDED rule dominates.
  // An included match can NEVER override an excluded match.
  const excludedMatch = matches.find(
    (m) => !m.isIncluded || m.eligibility === "EXCLUDED"
  );
  if (excludedMatch) return excludedMatch;

  // If ANY matching granular rule requires review or is unknown, fail safely
  const reviewMatch = matches.find(
    (m) => m.eligibility === "REQUIRES_REVIEW" || m.alignmentStatus === "REQUIRES_REVIEW"
  );
  if (reviewMatch) return reviewMatch;

  const unknownMatch = matches.find((m) => m.eligibility === "UNKNOWN");
  if (unknownMatch) return unknownMatch;

  return matches[0];
}

export class EligibilityEngine {
  /**
   * Evaluates whether a syllabus is production-ready for examination generation.
   * Strict Invariant: Only VERIFIED or PUBLISHED syllabi can approve content.
   */
  public static isSyllabusProductionReady(status: SyllabusStatus): boolean {
    return status === "VERIFIED" || status === "PUBLISHED";
  }

  /**
   * Evaluates eligibility synchronously against an in-memory Syllabus hierarchy.
   *
   * HIERARCHICAL PRECEDENCE:
   * Syllabus -> Chapter -> Topic -> Granular Item (Subtopic / Heading / Exercise Question)
   *
   * CRITICAL SAFETY INVARIANTS:
   * 1. EXCLUDED parent strictly blocks ALL descendants (child inclusion can NEVER revive parent).
   * 2. UNKNOWN / REQUIRES_REVIEW parent blocks child evaluation.
   * 3. A missing granular record does NOT mean excluded (Phase 4 backward compatibility preserved).
   * 4. Mixed exclusions in a chapter with unresolved content mapping -> BLOCKED (UNRESOLVED_IN_MIXED_CHAPTER).
   * 5. Purely deterministic and data-driven: no AI/LLM models decide eligibility.
   */
  public static evaluateHierarchySync(
    syllabus: any,
    query: ContentItemQuery
  ): EligibilityEvaluationResult {
    // 1. Syllabus level evaluation
    if (!syllabus) {
      return {
        eligibility: "UNKNOWN",
        isEligibleForProduction: false,
        reason: query.syllabusId
          ? `Syllabus "${query.syllabusId}" was not found.`
          : "Syllabus was not found.",
        syllabusStatus: "DRAFT",
        diagnosticCode: "UNKNOWN_SYLLABUS",
        syllabusId: query.syllabusId,
      };
    }

    const syllabusStatus: SyllabusStatus = syllabus.status || "DRAFT";
    const productionReady = this.isSyllabusProductionReady(syllabusStatus);

    // 2. Identify target chapter and topic items from syllabus
    let topItem = query.topicId
      ? syllabus.topicItems?.find((ti: any) => ti.topicId === query.topicId)
      : undefined;

    let chapterId = query.chapterId;
    if (!chapterId && topItem) {
      chapterId = topItem.chapterId || topItem.topic?.chapterId;
    }

    // Coordinate mismatch check: If query specified both chapterId and topicId, verify topic belongs to that chapter
    if (query.chapterId && topItem) {
      const trueChapId = topItem.chapterId || topItem.topic?.chapterId;
      if (trueChapId && trueChapId !== query.chapterId) {
        return {
          eligibility: "UNKNOWN",
          isEligibleForProduction: false,
          reason: `Coordinate mismatch: Topic "${query.topicId}" belongs to chapter "${trueChapId}", but request specified chapter "${query.chapterId}".`,
          syllabusStatus,
          chapterIncluded: false,
          topicIncluded: false,
          granularIncluded: false,
          syllabusId: syllabus.id,
          chapterId: query.chapterId,
          topicId: query.topicId,
          diagnosticCode: "UNKNOWN_TOPIC",
        };
      }
    }

    let chapItem: any = undefined;
    if (chapterId) {
      chapItem = syllabus.chapterItems?.find((ci: any) => ci.chapterId === chapterId);
      if (!chapItem && syllabus.chapterItems?.length === 1 && (!syllabus.chapterItems[0].chapterId || syllabus.chapterItems[0].chapterId === chapterId)) {
        chapItem = syllabus.chapterItems[0];
      }
    } else if (!query.topicId && syllabus.chapterItems?.length === 1) {
      chapItem = syllabus.chapterItems[0];
      chapterId = chapItem.chapterId;
    }

    // Unregistered Chapter
    if (chapterId && !chapItem) {
      return {
        eligibility: "UNKNOWN",
        isEligibleForProduction: false,
        reason: "Chapter is not registered in the syllabus (status is UNKNOWN; cannot be treated as eligible).",
        syllabusStatus,
        chapterIncluded: false,
        syllabusId: syllabus.id,
        chapterId,
        diagnosticCode: "UNKNOWN_CHAPTER",
      };
    }

    // Unspecified Chapter and Topic
    if (!chapterId && !query.topicId) {
      return {
        eligibility: "UNKNOWN",
        isEligibleForProduction: false,
        reason: "Content does not have chapter or topic references (status is UNKNOWN).",
        syllabusStatus: "DRAFT",
        diagnosticCode: "UNKNOWN_CHAPTER",
        syllabusId: syllabus.id,
      };
    }

    // Parent Chapter EXCLUDED: STRICT INVARIANT: Child can NEVER override parent exclusion
    if (chapItem && (!chapItem.isIncluded || chapItem.eligibility === "EXCLUDED")) {
      const reason = !query.topicId && !query.identifier
        ? `Chapter is explicitly excluded from the syllabus (relevance: ${chapItem.examinationRelevance || "OPTIONAL"}).`
        : "Topic is excluded by inheritance from parent chapter exclusion.";

      return {
        eligibility: "EXCLUDED",
        isEligibleForProduction: false,
        reason,
        syllabusStatus,
        chapterIncluded: false,
        topicIncluded: false,
        granularIncluded: false,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        scope: query.scope,
        identifier: query.identifier,
        diagnosticCode: "EXCLUDED_BY_CHAPTER",
      };
    }

    // Parent Chapter REQUIRES_REVIEW
    if (
      chapItem &&
      (chapItem.alignmentStatus === "REQUIRES_REVIEW" || chapItem.eligibility === "REQUIRES_REVIEW")
    ) {
      return {
        eligibility: "REQUIRES_REVIEW",
        isEligibleForProduction: false,
        reason: !query.topicId && !query.identifier
          ? "Chapter alignment confidence is below threshold and requires manual administrator review."
          : "Parent chapter alignment requires review.",
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: false,
        granularIncluded: false,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        scope: query.scope,
        identifier: query.identifier,
        diagnosticCode: "REVIEW_REQUIRED_CHAPTER",
      };
    }

    // Parent Chapter UNKNOWN
    if (chapItem && chapItem.eligibility === "UNKNOWN") {
      return {
        eligibility: "UNKNOWN",
        isEligibleForProduction: false,
        reason: "Parent chapter status is UNKNOWN.",
        syllabusStatus,
        chapterIncluded: false,
        topicIncluded: false,
        granularIncluded: false,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        scope: query.scope,
        identifier: query.identifier,
        diagnosticCode: "UNKNOWN_CHAPTER",
      };
    }

    // 3. Topic Level Evaluation
    // Case 3A: No topicId provided in query (evaluating at chapter level or unmapped chunk)
    if (!query.topicId) {
      // Find all topic items belonging to this chapter if possible
      const chapterTopics = (syllabus.topicItems || []).filter((ti: any) => {
        if (chapterId && ti.chapterId) return ti.chapterId === chapterId;
        if (chapterId && ti.topic?.chapterId) return ti.topic.chapterId === chapterId;
        return true;
      });

      const hasExcludedTopic = chapterTopics.some(
        (ti: any) => !ti.isIncluded || ti.eligibility === "EXCLUDED"
      );
      const hasGranularExclusionInChapter = chapterTopics.some((ti: any) =>
        (ti.granularItems || []).some(
          (gi: any) => !gi.isIncluded || gi.eligibility === "EXCLUDED"
        )
      );

      // Mixed exclusions with unresolved mapping -> BLOCK
      if (query.isContentChunk && (hasExcludedTopic || hasGranularExclusionInChapter)) {
        return {
          eligibility: "REQUIRES_REVIEW",
          isEligibleForProduction: false,
          reason: "Content belongs to a chapter with mixed exclusions, but topic or granular mapping is missing.",
          syllabusStatus,
          chapterIncluded: true,
          syllabusId: syllabus.id,
          chapterId,
          diagnosticCode: "UNRESOLVED_IN_MIXED_CHAPTER",
        };
      }

      // Pure Chapter Eligibility evaluation (e.g. evaluateChapterEligibility)
      return {
        eligibility: "ELIGIBLE",
        isEligibleForProduction: productionReady,
        reason: productionReady
          ? "Chapter is officially included in verified/published syllabus."
          : `Chapter is marked included, but syllabus status is "${syllabusStatus}" (must be VERIFIED or PUBLISHED for exam generation).`,
        syllabusStatus,
        chapterIncluded: true,
        syllabusId: syllabus.id,
        chapterId,
        diagnosticCode: "ELIGIBLE",
      };
    }

    // Case 3B: topicId IS provided
    const hasTopicItem = !!topItem;

    if (hasTopicItem) {
      // Topic explicitly EXCLUDED
      if (!topItem.isIncluded || topItem.eligibility === "EXCLUDED") {
        return {
          eligibility: "EXCLUDED",
          isEligibleForProduction: false,
          reason: "Topic is explicitly excluded from the syllabus.",
          syllabusStatus,
          chapterIncluded: chapItem ? chapItem.isIncluded : true,
          topicIncluded: false,
          granularIncluded: false,
          syllabusId: syllabus.id,
          chapterId,
          topicId: query.topicId,
          scope: query.scope,
          identifier: query.identifier,
          diagnosticCode: "EXCLUDED_BY_TOPIC",
        };
      }

      // Topic REQUIRES_REVIEW
      if (
        topItem.alignmentStatus === "REQUIRES_REVIEW" ||
        topItem.eligibility === "REQUIRES_REVIEW"
      ) {
        return {
          eligibility: "REQUIRES_REVIEW",
          isEligibleForProduction: false,
          reason: "Topic alignment requires administrator review.",
          syllabusStatus,
          chapterIncluded: chapItem ? chapItem.isIncluded : true,
          topicIncluded: true,
          granularIncluded: false,
          syllabusId: syllabus.id,
          chapterId,
          topicId: query.topicId,
          scope: query.scope,
          identifier: query.identifier,
          diagnosticCode: "REVIEW_REQUIRED_TOPIC",
        };
      }

      // Topic UNKNOWN
      if (topItem.eligibility === "UNKNOWN") {
        return {
          eligibility: "UNKNOWN",
          isEligibleForProduction: false,
          reason: "Topic has unknown syllabus status.",
          syllabusStatus,
          chapterIncluded: chapItem ? chapItem.isIncluded : true,
          topicIncluded: false,
          granularIncluded: false,
          syllabusId: syllabus.id,
          chapterId,
          topicId: query.topicId,
          scope: query.scope,
          identifier: query.identifier,
          diagnosticCode: "UNKNOWN_TOPIC",
        };
      }
    } else {
      // Topic not explicitly listed in topicItems
      if (!chapItem) {
        return {
          eligibility: "UNKNOWN",
          isEligibleForProduction: false,
          reason: "Topic has unknown syllabus status and cannot be automatically treated as eligible.",
          syllabusStatus,
          diagnosticCode: "UNKNOWN_TOPIC",
          syllabusId: syllabus.id,
          topicId: query.topicId,
        };
      }

      // Phase 4 Backward Compatibility: Inherits chapter inclusion when no explicit topic rule
      return {
        eligibility: "ELIGIBLE",
        isEligibleForProduction: productionReady,
        reason: productionReady
          ? "Topic is officially eligible under syllabus."
          : `Topic is marked included, but syllabus status is "${syllabusStatus}" (must be VERIFIED or PUBLISHED).`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        diagnosticCode: "ELIGIBLE",
      };
    }

    // 4. Granular Level Evaluation (Topic is confirmed INCLUDED)
    const granularItems: any[] = topItem.granularItems || [];

    // Granular Absence Rule: If no granular records exist for a topic, Chapter/Topic eligibility stands unchanged
    if (granularItems.length === 0) {
      return {
        eligibility: "ELIGIBLE",
        isEligibleForProduction: productionReady,
        reason: productionReady
          ? "Topic is officially eligible under syllabus."
          : `Topic is marked included, but syllabus status is "${syllabusStatus}" (must be VERIFIED or PUBLISHED).`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        scope: query.scope,
        identifier: query.identifier,
        diagnosticCode: "ELIGIBLE",
      };
    }

    // Granular rules exist: Evaluate granular matching & exclusions
    const subtopicExclusions = granularItems.filter(
      (gi) => gi.scope === "SUBTOPIC" && (!gi.isIncluded || gi.eligibility === "EXCLUDED")
    );
    const headingExclusions = granularItems.filter(
      (gi) => gi.scope === "HEADING" && (!gi.isIncluded || gi.eligibility === "EXCLUDED")
    );
    const exerciseExclusions = granularItems.filter(
      (gi) => gi.scope === "EXERCISE_QUESTION" && (!gi.isIncluded || gi.eligibility === "EXCLUDED")
    );
    const hasAnyGranularExclusion =
      subtopicExclusions.length > 0 ||
      headingExclusions.length > 0 ||
      exerciseExclusions.length > 0;

    const APPROVED_SCOPES: string[] = ["SUBTOPIC", "HEADING", "EXERCISE_QUESTION"];
    if (query.scope && !APPROVED_SCOPES.includes(query.scope)) {
      return {
        eligibility: "UNKNOWN",
        isEligibleForProduction: false,
        reason: `Query specified unapproved granular scope "${query.scope}". Approved scopes are ONLY SUBTOPIC, HEADING, EXERCISE_QUESTION.`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        granularIncluded: false,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        scope: query.scope,
        identifier: query.identifier,
        diagnosticCode: "UNKNOWN_GRANULAR",
      };
    }

    const matchedGranular = matchGranularItem(granularItems, query);

    if (matchedGranular) {
      if (matchedGranular.scope && !APPROVED_SCOPES.includes(matchedGranular.scope)) {
        return {
          eligibility: "UNKNOWN",
          isEligibleForProduction: false,
          reason: `Granular item "${matchedGranular.identifier}" has unapproved scope "${matchedGranular.scope}". Approved scopes are ONLY SUBTOPIC, HEADING, EXERCISE_QUESTION.`,
          syllabusStatus,
          chapterIncluded: true,
          topicIncluded: true,
          granularIncluded: false,
          syllabusId: syllabus.id,
          chapterId,
          topicId: query.topicId,
          granularItemId: matchedGranular.id,
          scope: matchedGranular.scope,
          identifier: matchedGranular.identifier,
          diagnosticCode: "UNKNOWN_GRANULAR",
        };
      }

      // 1. Matched Granular item UNKNOWN
      if (matchedGranular.eligibility === "UNKNOWN") {
        return {
          eligibility: "UNKNOWN",
          isEligibleForProduction: false,
          reason: `Granular item "${matchedGranular.identifier}" has unknown syllabus status.`,
          syllabusStatus,
          chapterIncluded: true,
          topicIncluded: true,
          granularIncluded: false,
          syllabusId: syllabus.id,
          chapterId,
          topicId: query.topicId,
          granularItemId: matchedGranular.id,
          scope: matchedGranular.scope,
          identifier: matchedGranular.identifier,
          diagnosticCode: "UNKNOWN_GRANULAR",
        };
      }

      // 2. Matched Granular item REQUIRES_REVIEW
      if (matchedGranular.eligibility === "REQUIRES_REVIEW") {
        return {
          eligibility: "REQUIRES_REVIEW",
          isEligibleForProduction: false,
          reason: `Granular item "${matchedGranular.identifier}" requires administrator review.`,
          syllabusStatus,
          chapterIncluded: true,
          topicIncluded: true,
          granularIncluded: true,
          syllabusId: syllabus.id,
          chapterId,
          topicId: query.topicId,
          granularItemId: matchedGranular.id,
          scope: matchedGranular.scope,
          identifier: matchedGranular.identifier,
          diagnosticCode: "REVIEW_REQUIRED_GRANULAR",
        };
      }

      // 3. Matched Granular item is EXCLUDED
      if (!matchedGranular.isIncluded || matchedGranular.eligibility === "EXCLUDED") {
        return {
          eligibility: "EXCLUDED",
          isEligibleForProduction: false,
          reason: `Granular item "${matchedGranular.identifier}" (${matchedGranular.scope}) is explicitly excluded from the syllabus.`,
          syllabusStatus,
          chapterIncluded: true,
          topicIncluded: true,
          granularIncluded: false,
          syllabusId: syllabus.id,
          chapterId,
          topicId: query.topicId,
          granularItemId: matchedGranular.id,
          scope: matchedGranular.scope,
          identifier: matchedGranular.identifier,
          diagnosticCode: "EXCLUDED_BY_GRANULAR",
        };
      }

      // 4. Matched Granular item INCLUDED / ELIGIBLE
      return {
        eligibility: "ELIGIBLE",
        isEligibleForProduction: productionReady,
        reason: productionReady
          ? `Granular item "${matchedGranular.identifier}" (${matchedGranular.scope}) is officially included in verified/published syllabus.`
          : `Granular item "${matchedGranular.identifier}" is marked included, but syllabus status is "${syllabusStatus}".`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        granularIncluded: true,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        granularItemId: matchedGranular.id,
        scope: matchedGranular.scope,
        identifier: matchedGranular.identifier,
        diagnosticCode: "ELIGIBLE",
      };
    }

    // No granular item matched
    const hasExplicitIdentifier = !!(query.identifier || query.subtopic || query.exerciseQuestion);

    // If query specified an explicit identifier not present in syllabus granular items -> UNKNOWN
    if (hasExplicitIdentifier) {
      return {
        eligibility: "UNKNOWN",
        isEligibleForProduction: false,
        reason: `Granular item "${query.identifier || query.subtopic || query.exerciseQuestion}" is not registered in the syllabus (status is UNKNOWN; cannot be treated as eligible).`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        granularIncluded: false,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        scope: query.scope,
        identifier: query.identifier || query.subtopic || query.exerciseQuestion,
        diagnosticCode: "UNKNOWN_GRANULAR",
      };
    }

    // No explicit identifier provided
    if (!hasAnyGranularExclusion) {
      // All granular items under topic are included
      return {
        eligibility: "ELIGIBLE",
        isEligibleForProduction: productionReady,
        reason: productionReady
          ? "Topic is officially eligible under syllabus."
          : `Topic is marked included, but syllabus status is "${syllabusStatus}".`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        diagnosticCode: "ELIGIBLE",
      };
    }

    // Topic has SUBTOPIC or HEADING exclusions and content has no identifier to resolve
    if (subtopicExclusions.length > 0 || headingExclusions.length > 0) {
      return {
        eligibility: "REQUIRES_REVIEW",
        isEligibleForProduction: false,
        reason: `Content in topic "${query.topicId}" cannot be deterministically resolved to an included granular item in the presence of granular exclusions.`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        diagnosticCode: "UNRESOLVED_IN_MIXED_CHAPTER",
      };
    }

    // Topic has only EXERCISE_QUESTION exclusions
    const isExerciseContent =
      query.scope === "EXERCISE_QUESTION" ||
      query.chunkType === "EXERCISE" ||
      query.chunkType === "PROBLEM_SOLVING" ||
      query.chunkType === "SAMPLE_QUESTION";

    if (isExerciseContent) {
      return {
        eligibility: "REQUIRES_REVIEW",
        isEligibleForProduction: false,
        reason: `Exercise/question content in topic "${query.topicId}" cannot be resolved against excluded exercise questions without question identifier.`,
        syllabusStatus,
        chapterIncluded: true,
        topicIncluded: true,
        syllabusId: syllabus.id,
        chapterId,
        topicId: query.topicId,
        diagnosticCode: "UNRESOLVED_IN_MIXED_CHAPTER",
      };
    }

    // Normal non-exercise content in topic where only exercise questions are excluded
    return {
      eligibility: "ELIGIBLE",
      isEligibleForProduction: productionReady,
      reason: productionReady
        ? "Topic is officially eligible under syllabus (exercise exclusion does not apply to non-exercise content)."
        : `Topic is marked included, but syllabus status is "${syllabusStatus}".`,
      syllabusStatus,
      chapterIncluded: true,
      topicIncluded: true,
      syllabusId: syllabus.id,
      chapterId,
      topicId: query.topicId,
      diagnosticCode: "ELIGIBLE",
    };
  }

  /**
   * Evaluates the eligibility of a Chapter under a specific Syllabus.
   */
  public static async evaluateChapterEligibility(
    syllabusId: string,
    chapterId: string
  ): Promise<EligibilityEvaluationResult> {
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
      include: {
        chapterItems: {
          where: { chapterId },
        },
      },
    });

    return this.evaluateHierarchySync(syllabus, { syllabusId, chapterId });
  }

  /**
   * Evaluates the eligibility of a Topic under a specific Syllabus applying hierarchical precedence.
   */
  public static async evaluateTopicEligibility(
    syllabusId: string,
    chapterId: string,
    topicId: string,
    granularQuery?: {
      scope?: GranularScope | null;
      identifier?: string | null;
      title?: string | null;
      heading?: string | null;
    }
  ): Promise<EligibilityEvaluationResult> {
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
      include: {
        chapterItems: { where: { chapterId } },
        topicItems: {
          where: { topicId },
          include: { granularItems: true },
        },
      },
    });

    return this.evaluateHierarchySync(syllabus, {
      syllabusId,
      chapterId,
      topicId,
      scope: granularQuery?.scope,
      identifier: granularQuery?.identifier,
      title: granularQuery?.title,
      heading: granularQuery?.heading,
    });
  }

  /**
   * Evaluates the eligibility of a specific granular syllabus item (Subtopic / Heading / Exercise Question).
   */
  public static async evaluateGranularEligibility(
    syllabusId: string,
    chapterId: string,
    topicId: string,
    granularQuery: {
      scope: GranularScope;
      identifier: string;
      title?: string | null;
    }
  ): Promise<EligibilityEvaluationResult> {
    return this.evaluateTopicEligibility(syllabusId, chapterId, topicId, granularQuery);
  }

  /**
   * Evaluates eligibility for an individual educational content chunk.
   */
  public static async evaluateChunkEligibility(
    syllabusId: string,
    chunk: {
      chapterId?: string | null;
      topicId?: string | null;
      scope?: GranularScope | null;
      identifier?: string | null;
      title?: string | null;
      heading?: string | null;
      chunkType?: string | null;
      subtopic?: string | null;
      exerciseQuestion?: string | null;
      metadata?: Record<string, any> | null;
      [key: string]: any;
    }
  ): Promise<EligibilityEvaluationResult> {
    if (!chunk.chapterId && !chunk.topicId) {
      return {
        eligibility: "UNKNOWN",
        isEligibleForProduction: false,
        reason: "Chunk does not have chapter or topic references (status is UNKNOWN).",
        syllabusStatus: "DRAFT",
        diagnosticCode: "UNKNOWN_CHAPTER",
        syllabusId,
      };
    }

    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
      include: {
        chapterItems: chunk.chapterId ? { where: { chapterId: chunk.chapterId } } : true,
        topicItems: {
          where: chunk.topicId ? { topicId: chunk.topicId } : undefined,
          include: { granularItems: true },
        },
      },
    });

    return this.evaluateHierarchySync(syllabus, {
      syllabusId,
      chapterId: chunk.chapterId,
      topicId: chunk.topicId,
      scope: chunk.scope,
      identifier: chunk.identifier || chunk.subtopic || chunk.exerciseQuestion,
      title: chunk.title,
      heading: chunk.heading,
      chunkType: chunk.chunkType,
      subtopic: chunk.subtopic,
      exerciseQuestion: chunk.exerciseQuestion,
      isContentChunk: true,
      metadata: chunk.metadata,
    });
  }

  /**
   * Evaluates eligibility across the full educational content query.
   */
  public static async evaluateContentEligibility(
    query: ContentItemQuery
  ): Promise<EligibilityEvaluationResult> {
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: query.syllabusId },
      include: {
        chapterItems: query.chapterId ? { where: { chapterId: query.chapterId } } : true,
        topicItems: {
          where: query.topicId ? { topicId: query.topicId } : undefined,
          include: { granularItems: true },
        },
      },
    });

    return this.evaluateHierarchySync(syllabus, {
      ...query,
      isContentChunk: query.isContentChunk ?? true,
    });
  }
}

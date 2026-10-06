import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EligibilityEngine,
  EligibilityEvaluationResult,
} from "@/server/syllabus/eligibility-engine";
import { prisma } from "@/lib/db";

describe("Step 3: Deterministic Hierarchical Eligibility Engine Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // TEST 1: Chapter EXCLUDED -> all descendants blocked
  // --------------------------------------------------------------------------
  it("1. Chapter EXCLUDED blocks all descendants (topic, subtopic, heading, exercise)", async () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [
        {
          id: "sci-3",
          chapterId: "ch-3",
          isIncluded: false,
          eligibility: "EXCLUDED",
          examinationRelevance: "OPTIONAL",
        },
      ],
      topicItems: [
        {
          id: "sti-3-1",
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-3-1-1",
              scope: "SUBTOPIC",
              identifier: "3.1.1",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
            {
              id: "sgi-3-1-h",
              scope: "HEADING",
              identifier: "Inertia Principles",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
            {
              id: "sgi-3-1-eq",
              scope: "EXERCISE_QUESTION",
              identifier: "Exercise 3.1 Question 1",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    // 1. Chapter evaluation
    const chapRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
    });
    expect(chapRes.eligibility).toBe("EXCLUDED");
    expect(chapRes.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
    expect(chapRes.isEligibleForProduction).toBe(false);

    // 2. Topic evaluation under excluded chapter
    const topRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
    });
    expect(topRes.eligibility).toBe("EXCLUDED");
    expect(topRes.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
    expect(topRes.reason).toContain("inheritance from parent chapter exclusion");
    expect(topRes.isEligibleForProduction).toBe(false);

    // 3. Subtopic under excluded chapter
    const subRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.1",
    });
    expect(subRes.eligibility).toBe("EXCLUDED");
    expect(subRes.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
    expect(subRes.isEligibleForProduction).toBe(false);

    // 4. Heading under excluded chapter
    const headRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "HEADING",
      identifier: "Inertia Principles",
    });
    expect(headRes.eligibility).toBe("EXCLUDED");
    expect(headRes.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");

    // 5. Exercise question under excluded chapter
    const eqRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "EXERCISE_QUESTION",
      identifier: "Exercise 3.1 Question 1",
    });
    expect(eqRes.eligibility).toBe("EXCLUDED");
    expect(eqRes.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
  });

  // --------------------------------------------------------------------------
  // TEST 2: Chapter INCLUDED + Topic EXCLUDED -> topic descendants blocked
  // --------------------------------------------------------------------------
  it("2. Chapter INCLUDED + Topic EXCLUDED blocks all topic descendants", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          id: "sti-3-2",
          topicId: "top-3-2",
          chapterId: "ch-3",
          isIncluded: false,
          eligibility: "EXCLUDED",
          granularItems: [
            {
              id: "sgi-3-2-1",
              scope: "SUBTOPIC",
              identifier: "3.2.1",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    // Topic itself
    const topRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
    });
    expect(topRes.eligibility).toBe("EXCLUDED");
    expect(topRes.diagnosticCode).toBe("EXCLUDED_BY_TOPIC");
    expect(topRes.reason).toContain("explicitly excluded");

    // Granular descendant under excluded topic
    const granRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
      scope: "SUBTOPIC",
      identifier: "3.2.1",
    });
    expect(granRes.eligibility).toBe("EXCLUDED");
    expect(granRes.diagnosticCode).toBe("EXCLUDED_BY_TOPIC");
    expect(granRes.isEligibleForProduction).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Chapter INCLUDED + Topic INCLUDED + Subtopic EXCLUDED
  // --------------------------------------------------------------------------
  it("3. Chapter INCLUDED + Topic INCLUDED + Subtopic EXCLUDED blocks only that subtopic", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          id: "sti-3-1",
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-3-1-1",
              scope: "SUBTOPIC",
              identifier: "3.1.1",
              title: "Newton's First Law",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
            {
              id: "sgi-3-1-2",
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              title: "Inertia Special Cases",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
          ],
        },
      ],
    };

    // 3.1.2 is explicitly EXCLUDED
    const res312 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.2",
    });
    expect(res312.eligibility).toBe("EXCLUDED");
    expect(res312.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    expect(res312.granularItemId).toBe("sgi-3-1-2");
    expect(res312.isEligibleForProduction).toBe(false);

    // 3.1.1 is INCLUDED
    const res311 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.1",
    });
    expect(res311.eligibility).toBe("ELIGIBLE");
    expect(res311.diagnosticCode).toBe("ELIGIBLE");
    expect(res311.granularItemId).toBe("sgi-3-1-1");
    expect(res311.isEligibleForProduction).toBe(true);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Chapter INCLUDED + Topic INCLUDED + Heading EXCLUDED
  // --------------------------------------------------------------------------
  it("4. Chapter INCLUDED + Topic INCLUDED + Heading EXCLUDED blocks only that heading/content", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          id: "sti-3-1",
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-h1",
              scope: "HEADING",
              identifier: "Atwood Machine",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
            {
              id: "sgi-h2",
              scope: "HEADING",
              identifier: "Newton's Second Law",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    // Heading "Atwood Machine" is EXCLUDED
    const resH1 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      heading: "Atwood Machine",
    });
    expect(resH1.eligibility).toBe("EXCLUDED");
    expect(resH1.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    expect(resH1.granularItemId).toBe("sgi-h1");

    // Heading "Newton's Second Law" is ELIGIBLE
    const resH2 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      heading: "Newton's Second Law",
    });
    expect(resH2.eligibility).toBe("ELIGIBLE");
    expect(resH2.diagnosticCode).toBe("ELIGIBLE");
    expect(resH2.granularItemId).toBe("sgi-h2");
  });

  // --------------------------------------------------------------------------
  // TEST 5: Chapter INCLUDED + Topic INCLUDED + Exercise Question EXCLUDED
  // --------------------------------------------------------------------------
  it("5. Chapter INCLUDED + Topic INCLUDED + Exercise Question EXCLUDED blocks only that question", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          id: "sti-3-2",
          topicId: "top-3-2",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-eq-4",
              scope: "EXERCISE_QUESTION",
              identifier: "Exercise 3.2 Question 4",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
            {
              id: "sgi-eq-3",
              scope: "EXERCISE_QUESTION",
              identifier: "Exercise 3.2 Question 3",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    // Exercise 3.2 Question 4 is EXCLUDED
    const resQ4 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
      scope: "EXERCISE_QUESTION",
      identifier: "Exercise 3.2 Question 4",
    });
    expect(resQ4.eligibility).toBe("EXCLUDED");
    expect(resQ4.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");

    // Exercise 3.2 Question 3 is ELIGIBLE
    const resQ3 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
      scope: "EXERCISE_QUESTION",
      identifier: "Exercise 3.2 Question 3",
    });
    expect(resQ3.eligibility).toBe("ELIGIBLE");
    expect(resQ3.diagnosticCode).toBe("ELIGIBLE");

    // Theory content in Topic 3.2 is unaffected by exercise exclusions
    const resTheory = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
      chunkType: "CONCEPT",
    });
    expect(resTheory.eligibility).toBe("ELIGIBLE");
  });

  // --------------------------------------------------------------------------
  // TEST 6: INCLUDED child under EXCLUDED parent -> still blocked
  // --------------------------------------------------------------------------
  it("6. INCLUDED child under EXCLUDED parent is strictly blocked (invariant 1 & 2)", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-excluded", isIncluded: false, eligibility: "EXCLUDED" }],
      topicItems: [
        {
          id: "sti-child",
          topicId: "top-child",
          chapterId: "ch-excluded",
          isIncluded: true, // child says included
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-child-sub",
              scope: "SUBTOPIC",
              identifier: "Subtopic 1.1",
              isIncluded: true, // grandchild says included
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    const resTopic = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-excluded",
      topicId: "top-child",
    });
    expect(resTopic.eligibility).toBe("EXCLUDED");
    expect(resTopic.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");

    const resSubtopic = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-excluded",
      topicId: "top-child",
      scope: "SUBTOPIC",
      identifier: "Subtopic 1.1",
    });
    expect(resSubtopic.eligibility).toBe("EXCLUDED");
    expect(resSubtopic.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
    expect(resSubtopic.isEligibleForProduction).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 7: EXCLUDED child under INCLUDED parent -> blocked
  // --------------------------------------------------------------------------
  it("7. EXCLUDED child under INCLUDED parent is blocked", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-inc", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          id: "sti-inc",
          topicId: "top-inc",
          chapterId: "ch-inc",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-exc",
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
          ],
        },
      ],
    };

    const res = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-inc",
      topicId: "top-inc",
      scope: "SUBTOPIC",
      identifier: "3.1.2",
    });
    expect(res.eligibility).toBe("EXCLUDED");
    expect(res.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    expect(res.isEligibleForProduction).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 8: UNKNOWN granular item -> blocked
  // --------------------------------------------------------------------------
  it("8. UNKNOWN granular item is blocked from production", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-1", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          id: "sti-1",
          topicId: "top-1",
          chapterId: "ch-1",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-unk",
              scope: "SUBTOPIC",
              identifier: "1.1.2",
              isIncluded: true,
              eligibility: "UNKNOWN",
            },
          ],
        },
      ],
    };

    // Registered with UNKNOWN status
    const res = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-1",
      topicId: "top-1",
      scope: "SUBTOPIC",
      identifier: "1.1.2",
    });
    expect(res.eligibility).toBe("UNKNOWN");
    expect(res.diagnosticCode).toBe("UNKNOWN_GRANULAR");
    expect(res.isEligibleForProduction).toBe(false);

    // Unregistered identifier in a topic with granular registry
    const resUnreg = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-1",
      topicId: "top-1",
      scope: "SUBTOPIC",
      identifier: "1.1.999",
    });
    expect(resUnreg.eligibility).toBe("UNKNOWN");
    expect(resUnreg.diagnosticCode).toBe("UNKNOWN_GRANULAR");
    expect(resUnreg.isEligibleForProduction).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 9: REQUIRES_REVIEW granular item -> blocked
  // --------------------------------------------------------------------------
  it("9. REQUIRES_REVIEW granular item is blocked from production", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-1", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          id: "sti-1",
          topicId: "top-1",
          chapterId: "ch-1",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-rev",
              scope: "SUBTOPIC",
              identifier: "1.1.3",
              isIncluded: true,
              eligibility: "REQUIRES_REVIEW",
            },
          ],
        },
      ],
    };

    const res = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-1",
      topicId: "top-1",
      scope: "SUBTOPIC",
      identifier: "1.1.3",
    });
    expect(res.eligibility).toBe("REQUIRES_REVIEW");
    expect(res.diagnosticCode).toBe("REVIEW_REQUIRED_GRANULAR");
    expect(res.isEligibleForProduction).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 10: No granular records -> existing Chapter/Topic behavior preserved
  // --------------------------------------------------------------------------
  it("10. No granular records preserves existing Chapter/Topic eligibility behavior", () => {
    const oldSyllabus = {
      id: "syl-legacy-2024",
      status: "PUBLISHED",
      chapterItems: [
        {
          chapterId: "ch-legacy-1",
          isIncluded: true,
          eligibility: "ELIGIBLE",
        },
      ],
      topicItems: [
        {
          topicId: "top-legacy-1",
          chapterId: "ch-legacy-1",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [], // No granular records in legacy syllabus
        },
      ],
    };

    const res = EligibilityEngine.evaluateHierarchySync(oldSyllabus, {
      chapterId: "ch-legacy-1",
      topicId: "top-legacy-1",
    });
    expect(res.eligibility).toBe("ELIGIBLE");
    expect(res.isEligibleForProduction).toBe(true);
    expect(res.diagnosticCode).toBe("ELIGIBLE");
  });

  // --------------------------------------------------------------------------
  // TEST 11: Mixed exclusions inside one chapter
  // --------------------------------------------------------------------------
  it("11. Mixed exclusions inside one chapter correctly resolves each component", () => {
    // The exact canonical scenario:
    // Chapter 3 = INCLUDED
    // Topic 3.1 = INCLUDED
    //   Subtopic 3.1.1 = INCLUDED
    //   Subtopic 3.1.2 = EXCLUDED
    // Topic 3.2 = EXCLUDED
    // Topic 3.3 = INCLUDED
    //   Exercise 3.3 Q4 = EXCLUDED
    const mixedSyllabus = {
      id: "syl-pctb-revised",
      status: "PUBLISHED",
      chapterItems: [
        {
          chapterId: "ch-3",
          chapterNumber: 3,
          isIncluded: true,
          eligibility: "ELIGIBLE",
        },
      ],
      topicItems: [
        {
          id: "sti-3-1",
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "g-3-1-1",
              scope: "SUBTOPIC",
              identifier: "3.1.1",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
            {
              id: "g-3-1-2",
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
          ],
        },
        {
          id: "sti-3-2",
          topicId: "top-3-2",
          chapterId: "ch-3",
          isIncluded: false,
          eligibility: "EXCLUDED",
          granularItems: [],
        },
        {
          id: "sti-3-3",
          topicId: "top-3-3",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "g-3-3-q4",
              scope: "EXERCISE_QUESTION",
              identifier: "Exercise 3.3 Question 4",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
          ],
        },
      ],
    };

    // 1. Subtopic 3.1.1 -> ELIGIBLE
    const res311 = EligibilityEngine.evaluateHierarchySync(mixedSyllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.1",
    });
    expect(res311.eligibility).toBe("ELIGIBLE");
    expect(res311.isEligibleForProduction).toBe(true);

    // 2. Subtopic 3.1.2 -> EXCLUDED
    const res312 = EligibilityEngine.evaluateHierarchySync(mixedSyllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.2",
    });
    expect(res312.eligibility).toBe("EXCLUDED");
    expect(res312.isEligibleForProduction).toBe(false);

    // 3. Topic 3.2 and descendants -> EXCLUDED
    const res32 = EligibilityEngine.evaluateHierarchySync(mixedSyllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
    });
    expect(res32.eligibility).toBe("EXCLUDED");
    expect(res32.diagnosticCode).toBe("EXCLUDED_BY_TOPIC");

    // 4. Topic 3.3 normal content -> ELIGIBLE
    const res33Theory = EligibilityEngine.evaluateHierarchySync(mixedSyllabus, {
      chapterId: "ch-3",
      topicId: "top-3-3",
      chunkType: "CONCEPT",
    });
    expect(res33Theory.eligibility).toBe("ELIGIBLE");
    expect(res33Theory.isEligibleForProduction).toBe(true);

    // 5. Topic 3.3 Exercise Q4 -> EXCLUDED
    const res33Q4 = EligibilityEngine.evaluateHierarchySync(mixedSyllabus, {
      chapterId: "ch-3",
      topicId: "top-3-3",
      scope: "EXERCISE_QUESTION",
      identifier: "Exercise 3.3 Question 4",
    });
    expect(res33Q4.eligibility).toBe("EXCLUDED");
    expect(res33Q4.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
  });

  // --------------------------------------------------------------------------
  // TEST 12: Non-contiguous exclusions
  // --------------------------------------------------------------------------
  it("12. Non-contiguous exclusions do NOT block unrelated eligible content", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: false, // EXCLUDED
          eligibility: "EXCLUDED",
        },
        {
          topicId: "top-3-2",
          chapterId: "ch-3",
          isIncluded: true, // INCLUDED between two exclusions
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "3.2.1",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
            {
              scope: "SUBTOPIC",
              identifier: "3.2.2",
              isIncluded: false, // Non-contiguous granular exclusion
              eligibility: "EXCLUDED",
            },
            {
              scope: "SUBTOPIC",
              identifier: "3.2.3",
              isIncluded: true, // Follows exclusion but is eligible
              eligibility: "ELIGIBLE",
            },
          ],
        },
        {
          topicId: "top-3-3",
          chapterId: "ch-3",
          isIncluded: false, // EXCLUDED
          eligibility: "EXCLUDED",
        },
      ],
    };

    // Topic 3.2 is unaffected by 3.1 and 3.3 exclusions
    const res32 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
      scope: "SUBTOPIC",
      identifier: "3.2.1",
    });
    expect(res32.eligibility).toBe("ELIGIBLE");

    // 3.2.2 is blocked
    const res322 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
      scope: "SUBTOPIC",
      identifier: "3.2.2",
    });
    expect(res322.eligibility).toBe("EXCLUDED");

    // 3.2.3 is eligible despite following an exclusion
    const res323 = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-3-2",
      scope: "SUBTOPIC",
      identifier: "3.2.3",
    });
    expect(res323.eligibility).toBe("ELIGIBLE");
  });

  // --------------------------------------------------------------------------
  // TEST 13: Mixed chapter + content missing required mapping -> UNRESOLVED
  // --------------------------------------------------------------------------
  it("13. Mixed chapter with content missing required mapping returns UNRESOLVED_IN_MIXED_CHAPTER", () => {
    const mixedSyllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
          ],
        },
        {
          topicId: "top-3-2",
          chapterId: "ch-3",
          isIncluded: false,
          eligibility: "EXCLUDED",
        },
      ],
    };

    // Case A: Chunk in mixed chapter without topicId
    const resNoTopic = EligibilityEngine.evaluateHierarchySync(mixedSyllabus, {
      chapterId: "ch-3",
      isContentChunk: true,
    });
    expect(resNoTopic.eligibility).toBe("REQUIRES_REVIEW");
    expect(resNoTopic.diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");
    expect(resNoTopic.isEligibleForProduction).toBe(false);

    // Case B: Chunk in topic 3.1 which has subtopic exclusions, but chunk has no identifier
    const resNoSubtopic = EligibilityEngine.evaluateHierarchySync(mixedSyllabus, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      isContentChunk: true,
    });
    expect(resNoSubtopic.eligibility).toBe("REQUIRES_REVIEW");
    expect(resNoSubtopic.diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");
    expect(resNoSubtopic.isEligibleForProduction).toBe(false);

    // Case C: Exercise chunk in topic with exercise exclusion, missing question identifier
    const syllabusWithExerciseExclusion = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-3-3",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "EXERCISE_QUESTION",
              identifier: "Exercise 3.3 Question 4",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
          ],
        },
      ],
    };

    const resUnresolvedExercise = EligibilityEngine.evaluateHierarchySync(
      syllabusWithExerciseExclusion,
      {
        chapterId: "ch-3",
        topicId: "top-3-3",
        chunkType: "EXERCISE",
        isContentChunk: true,
      }
    );
    expect(resUnresolvedExercise.eligibility).toBe("REQUIRES_REVIEW");
    expect(resUnresolvedExercise.diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");
  });

  // --------------------------------------------------------------------------
  // TEST 14: Multiple granular scopes in one topic
  // --------------------------------------------------------------------------
  it("14. Multiple granular scopes in one topic evaluate deterministically without collision", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
            {
              scope: "SUBTOPIC",
              identifier: "3.1.1",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
            {
              scope: "HEADING",
              identifier: "Advanced Applications",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
            {
              scope: "HEADING",
              identifier: "Fundamental Laws",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
            {
              scope: "EXERCISE_QUESTION",
              identifier: "Exercise 3.1 Question 5",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
            {
              scope: "EXERCISE_QUESTION",
              identifier: "Exercise 3.1 Question 1",
              isIncluded: true,
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    // Subtopic excluded
    expect(
      EligibilityEngine.evaluateHierarchySync(syllabus, {
        chapterId: "ch-3",
        topicId: "top-3-1",
        scope: "SUBTOPIC",
        identifier: "3.1.2",
      }).eligibility
    ).toBe("EXCLUDED");

    // Subtopic included
    expect(
      EligibilityEngine.evaluateHierarchySync(syllabus, {
        chapterId: "ch-3",
        topicId: "top-3-1",
        scope: "SUBTOPIC",
        identifier: "3.1.1",
      }).eligibility
    ).toBe("ELIGIBLE");

    // Heading excluded
    expect(
      EligibilityEngine.evaluateHierarchySync(syllabus, {
        chapterId: "ch-3",
        topicId: "top-3-1",
        heading: "Advanced Applications",
      }).eligibility
    ).toBe("EXCLUDED");

    // Heading included
    expect(
      EligibilityEngine.evaluateHierarchySync(syllabus, {
        chapterId: "ch-3",
        topicId: "top-3-1",
        heading: "Fundamental Laws",
      }).eligibility
    ).toBe("ELIGIBLE");

    // Exercise excluded
    expect(
      EligibilityEngine.evaluateHierarchySync(syllabus, {
        chapterId: "ch-3",
        topicId: "top-3-1",
        scope: "EXERCISE_QUESTION",
        identifier: "Exercise 3.1 Question 5",
      }).eligibility
    ).toBe("EXCLUDED");

    // Exercise included
    expect(
      EligibilityEngine.evaluateHierarchySync(syllabus, {
        chapterId: "ch-3",
        topicId: "top-3-1",
        scope: "EXERCISE_QUESTION",
        identifier: "Exercise 3.1 Question 1",
      }).eligibility
    ).toBe("ELIGIBLE");
  });

  // --------------------------------------------------------------------------
  // TEST 15: Conflicting child inclusion vs parent exclusion -> parent wins
  // --------------------------------------------------------------------------
  it("15. Conflicting child inclusion vs parent exclusion: parent exclusion strictly wins", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-10", isIncluded: false, eligibility: "EXCLUDED" }],
      topicItems: [
        {
          topicId: "top-10-1",
          chapterId: "ch-10",
          isIncluded: true, // CONFLICT: topic claims included under excluded chapter
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "10.1.1",
              isIncluded: true, // CONFLICT: subtopic claims included
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    // Parent exclusion wins over child topic
    const resTopic = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-10",
      topicId: "top-10-1",
    });
    expect(resTopic.eligibility).toBe("EXCLUDED");
    expect(resTopic.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");

    // Parent exclusion wins over child subtopic
    const resSubtopic = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-10",
      topicId: "top-10-1",
      scope: "SUBTOPIC",
      identifier: "10.1.1",
    });
    expect(resSubtopic.eligibility).toBe("EXCLUDED");
    expect(resSubtopic.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
  });

  // --------------------------------------------------------------------------
  // TEST 16: Same identifier under different topics
  // --------------------------------------------------------------------------
  it("16. Same identifier under different topics applies correct topic-scoped rule", () => {
    const syllabus = {
      id: "syl-pub",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-physics",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "1.1", // Same identifier
              isIncluded: false, // EXCLUDED in Topic Physics
              eligibility: "EXCLUDED",
            },
          ],
        },
        {
          topicId: "top-chemistry",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "1.1", // Same identifier
              isIncluded: true, // INCLUDED in Topic Chemistry
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    // Under top-physics -> EXCLUDED
    const resPhys = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-physics",
      scope: "SUBTOPIC",
      identifier: "1.1",
    });
    expect(resPhys.eligibility).toBe("EXCLUDED");

    // Under top-chemistry -> ELIGIBLE
    const resChem = EligibilityEngine.evaluateHierarchySync(syllabus, {
      chapterId: "ch-3",
      topicId: "top-chemistry",
      scope: "SUBTOPIC",
      identifier: "1.1",
    });
    expect(resChem.eligibility).toBe("ELIGIBLE");
  });

  // --------------------------------------------------------------------------
  // TEST 17: Same identifier under different syllabus versions
  // --------------------------------------------------------------------------
  it("17. Same identifier under different syllabus versions correctly evaluates per version", () => {
    const syllabusV1 = {
      id: "syl-2024-v1",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              isIncluded: true, // INCLUDED in 2024 syllabus
              eligibility: "ELIGIBLE",
            },
          ],
        },
      ],
    };

    const syllabusV2 = {
      id: "syl-2025-v2",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              isIncluded: false, // DELETED / EXCLUDED in 2025 gazette revision
              eligibility: "EXCLUDED",
            },
          ],
        },
      ],
    };

    const resV1 = EligibilityEngine.evaluateHierarchySync(syllabusV1, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.2",
    });
    expect(resV1.eligibility).toBe("ELIGIBLE");

    const resV2 = EligibilityEngine.evaluateHierarchySync(syllabusV2, {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.2",
    });
    expect(resV2.eligibility).toBe("EXCLUDED");
  });

  // --------------------------------------------------------------------------
  // TEST 18: Deterministic repeatability
  // --------------------------------------------------------------------------
  it("18. Deterministic repeatability: same syllabus data + same content metadata produces identical result", () => {
    const syllabus = {
      id: "syl-repeatable",
      status: "PUBLISHED",
      chapterItems: [{ chapterId: "ch-3", isIncluded: true, eligibility: "ELIGIBLE" }],
      topicItems: [
        {
          topicId: "top-3-1",
          chapterId: "ch-3",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [
            {
              id: "sgi-3-1-2",
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              isIncluded: false,
              eligibility: "EXCLUDED",
            },
          ],
        },
      ],
    };

    const query = {
      chapterId: "ch-3",
      topicId: "top-3-1",
      scope: "SUBTOPIC" as const,
      identifier: "3.1.2",
    };

    const referenceResult = EligibilityEngine.evaluateHierarchySync(syllabus, query);

    for (let i = 0; i < 50; i++) {
      const repeatedResult = EligibilityEngine.evaluateHierarchySync(syllabus, query);
      expect(repeatedResult).toEqual(referenceResult);
    }
  });

  // --------------------------------------------------------------------------
  // Async Database Engine Methods Verification
  // --------------------------------------------------------------------------
  describe("Async Database-driven methods (evaluateChapterEligibility, evaluateTopicEligibility, evaluateGranularEligibility, evaluateChunkEligibility)", () => {
    it("evaluateGranularEligibility queries DB and delegates deterministically", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-db-1",
        status: "PUBLISHED",
        chapterItems: [{ chapterId: "ch-1", isIncluded: true, eligibility: "ELIGIBLE" }],
        topicItems: [
          {
            topicId: "top-1",
            chapterId: "ch-1",
            isIncluded: true,
            eligibility: "ELIGIBLE",
            granularItems: [
              {
                id: "sgi-1",
                scope: "SUBTOPIC",
                identifier: "1.1.2",
                isIncluded: false,
                eligibility: "EXCLUDED",
              },
            ],
          },
        ],
      } as any);

      const res = await EligibilityEngine.evaluateGranularEligibility(
        "syl-db-1",
        "ch-1",
        "top-1",
        {
          scope: "SUBTOPIC",
          identifier: "1.1.2",
        }
      );

      expect(res.eligibility).toBe("EXCLUDED");
      expect(res.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    });

    it("evaluateChunkEligibility with heading matches granular rule", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-db-1",
        status: "PUBLISHED",
        chapterItems: [{ chapterId: "ch-1", isIncluded: true, eligibility: "ELIGIBLE" }],
        topicItems: [
          {
            topicId: "top-1",
            chapterId: "ch-1",
            isIncluded: true,
            eligibility: "ELIGIBLE",
            granularItems: [
              {
                id: "sgi-h",
                scope: "HEADING",
                identifier: "3.1.2",
                title: "Inertia",
                isIncluded: false,
                eligibility: "EXCLUDED",
              },
            ],
          },
        ],
      } as any);

      const res = await EligibilityEngine.evaluateChunkEligibility("syl-db-1", {
        chapterId: "ch-1",
        topicId: "top-1",
        heading: "3.1.2 - Inertia",
      });

      expect(res.eligibility).toBe("EXCLUDED");
      expect(res.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    });
  });
});

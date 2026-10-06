import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyllabusGate } from "@/server/retrieval/syllabus-gate";
import { RetrievalService } from "@/server/retrieval/retrieval-service";
import { RetrievalRequest } from "@/types/retrieval";
import { AIProviderFactory } from "@/lib/ai/factory";
import { prisma } from "@/lib/db";

describe("Step 4: Granular Syllabus Gate & Retrieval Pipeline Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.syllabus as any, "findUnique").mockImplementation(async (args: any) => {
      const id = args?.where?.id;
      if (id === "syl-granular-2025") return mockGranularSyllabus as any;
      return null;
    });
  });

  // Comprehensive mock syllabus with mixed granular rules
  const mockGranularSyllabus = {
    id: "syl-granular-2025",
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-grade-9",
    subjectId: "subj-physics",
    status: "VERIFIED",
    version: "2025-v1.0",
    title: "Official Grade 9 Physics Syllabus 2025",
    board: { code: "FBISE" },
    class: { name: "Class 9" },
    subject: { name: "Physics" },
    chapterItems: [
      {
        id: "sci-3",
        chapterId: "chap-03",
        chapterNumber: 3,
        chapterTitle: "Dynamics",
        isIncluded: true,
        weightage: 25,
        alignmentStatus: "MATCHED",
        examinationRelevance: "HIGH",
        eligibility: "ELIGIBLE",
      },
      {
        id: "sci-4",
        chapterId: "chap-04-excluded",
        chapterNumber: 4,
        chapterTitle: "Excluded Chapter",
        isIncluded: false,
        weightage: 0,
        alignmentStatus: "MATCHED",
        examinationRelevance: "OPTIONAL",
        eligibility: "EXCLUDED",
      },
    ],
    topicItems: [
      {
        id: "sti-3-1",
        topicId: "top-3-1",
        chapterId: "chap-03",
        topicTitle: "Newton's Laws of Motion",
        isIncluded: true,
        weightage: 15,
        alignmentStatus: "MATCHED",
        examinationRelevance: "HIGH",
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
          {
            id: "sgi-h-atwood",
            scope: "HEADING",
            identifier: "Atwood Machine",
            title: "Atwood Machine Motion",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
          {
            id: "sgi-h-momentum",
            scope: "HEADING",
            identifier: "Momentum Conservation",
            title: "Law of Conservation of Momentum",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "sgi-eq-review",
            scope: "SUBTOPIC",
            identifier: "3.1.3",
            title: "Third Law Nuance",
            isIncluded: true,
            eligibility: "REQUIRES_REVIEW",
          },
        ],
      },
      {
        id: "sti-3-2",
        topicId: "top-3-2-excluded",
        chapterId: "chap-03",
        topicTitle: "Excluded Momentum Topic",
        isIncluded: false,
        weightage: 0,
        alignmentStatus: "MATCHED",
        examinationRelevance: "OPTIONAL",
        eligibility: "EXCLUDED",
        granularItems: [
          {
            id: "sgi-3-2-child",
            scope: "SUBTOPIC",
            identifier: "3.2.1",
            isIncluded: true, // Child claims included under excluded topic
            eligibility: "ELIGIBLE",
          },
        ],
      },
      {
        id: "sti-3-3",
        topicId: "top-3-3",
        chapterId: "chap-03",
        topicTitle: "Friction",
        isIncluded: true,
        weightage: 10,
        alignmentStatus: "MATCHED",
        examinationRelevance: "HIGH",
        eligibility: "ELIGIBLE",
        granularItems: [
          {
            id: "sgi-3-3-q4",
            scope: "EXERCISE_QUESTION",
            identifier: "Exercise 3.3 Question 4",
            title: "Problem 3.4 Numerical",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
        ],
      },
    ],
  };

  const baseRetrievalRequest: RetrievalRequest = {
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-grade-9",
    subjectId: "subj-physics",
    syllabusId: "syl-granular-2025",
    query: "Explain laws of motion and force calculation",
    mode: "QUESTION_SUPPORT",
  };

  // --------------------------------------------------------------------------
  // TEST 1: Eligible granular chunk passes retrieval
  // --------------------------------------------------------------------------
  it("1. Eligible granular chunk passes syllabus gate and enters retrieval results", async () => {
    const chunkEligible = {
      id: "chunk-sub-311",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 40,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      topicTitle: "Newton's Laws of Motion",
      scope: "SUBTOPIC",
      identifier: "3.1.1",
      heading: "3.1.1 - Newton's First Law",
      content: "A body continues its state of rest or uniform motion unless acted upon by a net force.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkEligible],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(1);
    expect(rejected.length).toBe(0);
    expect(eligible[0].eligibilityStatus).toBe("ELIGIBLE");
    expect(eligible[0].granularIdentifier).toBe("3.1.1");
    expect(eligible[0].granularItemId).toBe("sgi-3-1-1");

    // Full retrieval pipeline test
    const response = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
      syntheticCandidates: [chunkEligible],
    });

    expect(response.status).toBe("SUCCESS");
    expect(response.results.length).toBe(1);
    expect(response.results[0].chunkId).toBe("chunk-sub-311");
    expect(response.results[0].provenance.eligibilityStatus).toBe("ELIGIBLE");
  });

  // --------------------------------------------------------------------------
  // TEST 2: Excluded subtopic chunk is filtered
  // --------------------------------------------------------------------------
  it("2. Excluded subtopic chunk is filtered and never enters retrieval context", async () => {
    const chunkExcludedSubtopic = {
      id: "chunk-sub-312-excluded",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 45,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      topicTitle: "Newton's Laws of Motion",
      scope: "SUBTOPIC",
      identifier: "3.1.2",
      heading: "Inertia Special Cases",
      content: "Complex inertial frames and non-inertial fictitious centrifugal calculations.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkExcludedSubtopic],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].eligibilityStatus).toBe("EXCLUDED");
    expect(rejected[0].diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");

    // Full retrieval pipeline test
    const response = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
      syntheticCandidates: [chunkExcludedSubtopic],
    });

    expect(response.status).toBe("NO_RELEVANT_KNOWLEDGE");
    expect(response.results.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Excluded heading chunk is filtered
  // --------------------------------------------------------------------------
  it("3. Excluded heading chunk is filtered deterministically via heading metadata", async () => {
    const chunkExcludedHeading = {
      id: "chunk-head-atwood",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 52,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      topicTitle: "Newton's Laws of Motion",
      heading: "Atwood Machine Acceleration and Tension",
      content: "Calculation of tension T = 2m1m2g / (m1 + m2) for two masses hanging vertically.",
      chunkType: "FORMULA",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkExcludedHeading],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].eligibilityStatus).toBe("EXCLUDED");
    expect(rejected[0].diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    expect(rejected[0].granularItemId).toBe("sgi-h-atwood");

    const response = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
      syntheticCandidates: [chunkExcludedHeading],
    });
    expect(response.status).toBe("NO_RELEVANT_KNOWLEDGE");
    expect(response.results.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Excluded exercise/question chunk is filtered
  // --------------------------------------------------------------------------
  it("4. Excluded exercise/question chunk is filtered while theory in same topic remains eligible", async () => {
    const chunkExcludedExercise = {
      id: "chunk-eq-33q4",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 65,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-3",
      topicTitle: "Friction",
      scope: "EXERCISE_QUESTION",
      identifier: "Exercise 3.3 Question 4",
      content: "Calculate coefficient of static friction for a 5 kg block sliding down a 30 degree incline.",
      chunkType: "EXERCISE",
    };

    const chunkEligibleTheory = {
      id: "chunk-theory-33",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 60,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-3",
      topicTitle: "Friction",
      heading: "Rolling Friction vs Sliding Friction",
      content: "Rolling friction is much smaller than sliding friction due to reduced contact area.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkExcludedExercise, chunkEligibleTheory],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(1);
    expect(eligible[0].id).toBe("chunk-theory-33");
    expect(rejected.length).toBe(1);
    expect(rejected[0].id).toBe("chunk-eq-33q4");
    expect(rejected[0].diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");

    // Full retrieval pipeline
    const response = await RetrievalService.retrieveKnowledge(
      {
        ...baseRetrievalRequest,
        query: "Explain friction and force calculation",
        similarityThreshold: 0.15,
      },
      {
        syntheticCandidates: [chunkExcludedExercise, chunkEligibleTheory],
      }
    );

    expect(response.status).toBe("SUCCESS");
    expect(response.results.length).toBe(1);
    expect(response.results[0].chunkId).toBe("chunk-theory-33");
    expect(response.results.some((r) => r.chunkId === "chunk-eq-33q4")).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Excluded topic blocks all descendant chunks
  // --------------------------------------------------------------------------
  it("5. Excluded topic blocks all descendant chunks regardless of child claims", async () => {
    const chunkUnderExcludedTopic = {
      id: "chunk-under-exc-topic",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 55,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-2-excluded",
      topicTitle: "Excluded Momentum Topic",
      scope: "SUBTOPIC",
      identifier: "3.2.1",
      content: "Momentum analysis of elastic collisions in 2D.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkUnderExcludedTopic],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].eligibilityStatus).toBe("EXCLUDED");
    expect(rejected[0].diagnosticCode).toBe("EXCLUDED_BY_TOPIC");
  });

  // --------------------------------------------------------------------------
  // TEST 6: Excluded chapter blocks all descendant chunks
  // --------------------------------------------------------------------------
  it("6. Excluded chapter blocks all descendant chunks", async () => {
    const chunkUnderExcludedChapter = {
      id: "chunk-under-exc-chapter",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 80,
      chapterId: "chap-04-excluded",
      chapterTitle: "Excluded Chapter",
      topicId: "top-4-1",
      topicTitle: "Some Topic",
      content: "Content from an excluded chapter.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkUnderExcludedChapter],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].eligibilityStatus).toBe("EXCLUDED");
    expect(rejected[0].diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
  });

  // --------------------------------------------------------------------------
  // TEST 7: Included child cannot override excluded parent
  // --------------------------------------------------------------------------
  it("7. Included child cannot override excluded parent in retrieval pipeline", async () => {
    const chunkConflict = {
      id: "chunk-override-attempt",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 56,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-2-excluded", // Parent is EXCLUDED
      scope: "SUBTOPIC",
      identifier: "3.2.1", // Child item marked INCLUDED in granularItems
      content: "Attempting to bypass topic exclusion via included subtopic.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkConflict],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected[0].eligibilityStatus).toBe("EXCLUDED");
    expect(rejected[0].diagnosticCode).toBe("EXCLUDED_BY_TOPIC");
  });

  // --------------------------------------------------------------------------
  // TEST 8: UNKNOWN granular decision is filtered
  // --------------------------------------------------------------------------
  it("8. UNKNOWN granular item is filtered from production retrieval", async () => {
    const chunkUnknownGranular = {
      id: "chunk-unknown-subtopic",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 42,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.999", // Unregistered identifier under topic with granular items
      content: "Unregistered syllabus content claiming to be part of chapter 3.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkUnknownGranular],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].eligibilityStatus).toBe("UNKNOWN");
    expect(rejected[0].diagnosticCode).toBe("UNKNOWN_GRANULAR");
  });

  // --------------------------------------------------------------------------
  // TEST 9: REQUIRES_REVIEW granular decision is filtered
  // --------------------------------------------------------------------------
  it("9. REQUIRES_REVIEW granular item is filtered from production retrieval", async () => {
    const chunkReviewGranular = {
      id: "chunk-review-subtopic",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 44,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.3",
      content: "Third law subtleties requiring manual curriculum review.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkReviewGranular],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].eligibilityStatus).toBe("REQUIRES_REVIEW");
    expect(rejected[0].diagnosticCode).toBe("REVIEW_REQUIRED_GRANULAR");
  });

  // --------------------------------------------------------------------------
  // TEST 10: UNRESOLVED_IN_MIXED_CHAPTER is filtered
  // --------------------------------------------------------------------------
  it("10. UNRESOLVED_IN_MIXED_CHAPTER chunk is filtered from production retrieval", async () => {
    // Chunk has chapterId, but no topicId in a chapter that has excluded topics & granular rules
    const chunkUnresolvedInMixed = {
      id: "chunk-unresolved-chapter",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 41,
      chapterId: "chap-03",
      // topicId is missing
      content: "General dynamics content without topic mapping.",
      chunkType: "CONCEPT",
    };

    // Chunk in topic 3.1 which has subtopic exclusions, but chunk has no identifier
    const chunkUnresolvedInTopic = {
      id: "chunk-unresolved-topic",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 43,
      chapterId: "chap-03",
      topicId: "top-3-1",
      // no scope, identifier, or heading provided
      content: "Ambiguous dynamics paragraph without subtopic heading.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkUnresolvedInMixed, chunkUnresolvedInTopic],
      mockGranularSyllabus
    );

    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(2);
    expect(rejected[0].eligibilityStatus).toBe("REQUIRES_REVIEW");
    expect(rejected[0].diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");
    expect(rejected[1].eligibilityStatus).toBe("REQUIRES_REVIEW");
    expect(rejected[1].diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");
  });

  // --------------------------------------------------------------------------
  // TEST 11: Mixed chapter: eligible chunk passes, excluded chunk filtered
  // --------------------------------------------------------------------------
  it("11. Mixed chapter simultaneously allows eligible chunks and filters excluded chunks", async () => {
    const candidatePool = [
      {
        id: "chunk-pool-311-eligible",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 40,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        topicTitle: "Newton's Laws",
        scope: "SUBTOPIC",
        identifier: "3.1.1",
        heading: "Newton's First Law",
        content: "Every object perseveres in its state of rest or uniform motion in a straight line.",
        chunkType: "DEFINITION",
      },
      {
        id: "chunk-pool-312-excluded",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 42,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        topicTitle: "Newton's Laws",
        scope: "SUBTOPIC",
        identifier: "3.1.2",
        heading: "Inertia Special Cases",
        content: "Excluded inertia special cases for advanced classes.",
        chunkType: "CONCEPT",
      },
      {
        id: "chunk-pool-32-excluded",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 50,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-2-excluded",
        topicTitle: "Excluded Topic",
        content: "Momentum collision physics.",
        chunkType: "CONCEPT",
      },
      {
        id: "chunk-pool-33-theory-eligible",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 61,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-3",
        topicTitle: "Friction",
        heading: "Methods of Reducing Friction",
        content: "Friction can be reduced by using lubricants, ball bearings, and streamlining.",
        chunkType: "CONCEPT",
      },
      {
        id: "chunk-pool-33-q4-excluded",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 66,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-3",
        topicTitle: "Friction",
        scope: "EXERCISE_QUESTION",
        identifier: "Exercise 3.3 Question 4",
        content: "Question 4: Calculate stopping distance on icy surface.",
        chunkType: "EXERCISE",
      },
    ];

    const response = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
      syntheticCandidates: candidatePool,
    });

    expect(response.status).toBe("SUCCESS");
    expect(response.results.length).toBe(2);

    const resultIds = response.results.map((r) => r.chunkId);
    expect(resultIds).toContain("chunk-pool-311-eligible");
    expect(resultIds).toContain("chunk-pool-33-theory-eligible");
    expect(resultIds).not.toContain("chunk-pool-312-excluded");
    expect(resultIds).not.toContain("chunk-pool-32-excluded");
    expect(resultIds).not.toContain("chunk-pool-33-q4-excluded");
  });

  // --------------------------------------------------------------------------
  // TEST 12: Non-contiguous exclusions
  // --------------------------------------------------------------------------
  it("12. Non-contiguous exclusions do NOT block unrelated eligible content", async () => {
    const nonContiguousSyllabus = {
      ...mockGranularSyllabus,
      topicItems: [
        {
          id: "sti-nc-1",
          topicId: "top-nc-1",
          chapterId: "chap-03",
          isIncluded: false, // EXCLUDED
          eligibility: "EXCLUDED",
        },
        {
          id: "sti-nc-2",
          topicId: "top-nc-2",
          chapterId: "chap-03",
          isIncluded: true, // INCLUDED between two exclusions
          eligibility: "ELIGIBLE",
          granularItems: [],
        },
        {
          id: "sti-nc-3",
          topicId: "top-nc-3",
          chapterId: "chap-03",
          isIncluded: false, // EXCLUDED
          eligibility: "EXCLUDED",
        },
      ],
    };

    const chunkTopic2 = {
      id: "chunk-nc-topic2",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 48,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-nc-2",
      topicTitle: "Unrelated Middle Topic",
      heading: "Middle Topic Concept",
      content: "Valid educational theory in topic 2.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkTopic2],
      nonContiguousSyllabus
    );

    expect(eligible.length).toBe(1);
    expect(rejected.length).toBe(0);
    expect(eligible[0].id).toBe("chunk-nc-topic2");
  });

  // --------------------------------------------------------------------------
  // TEST 13: Legacy syllabus with no granular records
  // --------------------------------------------------------------------------
  it("13. Legacy syllabus with no granular records continues working normally", async () => {
    const legacySyllabus = {
      id: "syl-legacy-2023",
      status: "PUBLISHED",
      chapterItems: [
        {
          chapterId: "chap-01",
          isIncluded: true,
          eligibility: "ELIGIBLE",
        },
      ],
      topicItems: [
        {
          topicId: "top-01",
          chapterId: "chap-01",
          isIncluded: true,
          eligibility: "ELIGIBLE",
          granularItems: [], // No granular records
        },
      ],
    };

    const legacyChunk = {
      id: "chunk-legacy-01",
      documentId: "doc-leg",
      bookId: "book-leg",
      bookTitle: "Old Textbook",
      pageNumber: 12,
      chapterId: "chap-01",
      chapterTitle: "Measurements",
      topicId: "top-01",
      topicTitle: "Physical Quantities",
      content: "Physical quantities are measurable characteristics.",
      chunkType: "CONCEPT",
    };

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [legacyChunk],
      legacySyllabus
    );

    expect(eligible.length).toBe(1);
    expect(rejected.length).toBe(0);
    expect(eligible[0].eligibilityStatus).toBe("ELIGIBLE");
  });

  // --------------------------------------------------------------------------
  // TEST 14: Excluded content does not enter assembled QUESTION_SUPPORT context
  // --------------------------------------------------------------------------
  it("14. Excluded content never enters assembled QUESTION_SUPPORT context", async () => {
    const mixedPool = [
      {
        id: "chunk-valid-for-support",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 40,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        topicTitle: "Newton's Laws",
        scope: "SUBTOPIC",
        identifier: "3.1.1",
        heading: "Laws of Motion and Force",
        content: "First law definition for question support.",
        chunkType: "DEFINITION",
      },
      {
        id: "chunk-blocked-subtopic",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 42,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        topicTitle: "Newton's Laws",
        scope: "SUBTOPIC",
        identifier: "3.1.2",
        content: "Blocked content that must never leak.",
        chunkType: "CONCEPT",
      },
    ];

    const response = await RetrievalService.retrieveKnowledge(
      {
        ...baseRetrievalRequest,
        mode: "QUESTION_SUPPORT",
        similarityThreshold: 0.15,
      },
      { syntheticCandidates: mixedPool }
    );

    expect(response.results.length).toBe(1);
    expect(response.results[0].chunkId).toBe("chunk-valid-for-support");
    expect(response.results.some((r) => r.content.includes("Blocked content"))).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 15: All candidates filtered -> NO_RELEVANT_KNOWLEDGE
  // --------------------------------------------------------------------------
  it("15. If every candidate is filtered by granular gate, NO_RELEVANT_KNOWLEDGE occurs without hallucination", async () => {
    const onlyExcludedCandidates = [
      {
        id: "chunk-exc-1",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 45,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        scope: "SUBTOPIC",
        identifier: "3.1.2", // EXCLUDED
        content: "Excluded concept 1.",
        chunkType: "CONCEPT",
      },
      {
        id: "chunk-exc-2",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 52,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        heading: "Atwood Machine", // EXCLUDED
        content: "Excluded formula.",
        chunkType: "FORMULA",
      },
    ];

    const response = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
      syntheticCandidates: onlyExcludedCandidates,
    });

    expect(response.status).toBe("NO_RELEVANT_KNOWLEDGE");
    expect(response.results.length).toBe(0);
    expect(response.returnedCount).toBe(0);
    expect(response.message).toContain("NO_RELEVANT_KNOWLEDGE");
  });

  // --------------------------------------------------------------------------
  // TEST 16: Existing retrieval provenance remains complete
  // --------------------------------------------------------------------------
  it("16. Eligible retrieval result exposes complete 13 provenance coordinates plus granular metadata", async () => {
    const chunkEligible = {
      id: "chunk-prov-test",
      documentId: "doc-phys-01",
      documentName: "Federal Physics Grade 9.pdf",
      bookId: "book-phys-9",
      bookTitle: "Physics Textbook Grade 9",
      pageNumber: 40,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      chapterNumber: 3,
      topicId: "top-3-1",
      topicTitle: "Newton's Laws of Motion",
      topicCode: "3.1",
      scope: "SUBTOPIC",
      identifier: "3.1.1",
      heading: "Newton's First Law",
      content: "An object remains at rest unless acted on by external force.",
      chunkType: "DEFINITION",
      confidence: 0.99,
    };

    const response = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
      syntheticCandidates: [chunkEligible],
    });

    expect(response.results.length).toBe(1);
    const prov = response.results[0].provenance;

    // All 13 core educational coordinates
    expect(prov.documentId).toBe("doc-phys-01");
    expect(prov.documentName).toBe("Federal Physics Grade 9.pdf");
    expect(prov.bookId).toBe("book-phys-9");
    expect(prov.bookTitle).toBe("Physics Textbook Grade 9");
    expect(prov.pageNumber).toBe(40);
    expect(prov.chapterId).toBe("chap-03");
    expect(prov.chapterTitle).toBe("Dynamics");
    expect(prov.topicId).toBe("top-3-1");
    expect(prov.topicTitle).toBe("Newton's Laws of Motion");
    expect(prov.chunkId).toBe("chunk-prov-test");
    expect(prov.syllabusId).toBe("syl-granular-2025");
    expect(prov.syllabusVersion).toBe("2025-v1.0");
    expect(prov.eligibilityStatus).toBe("ELIGIBLE");
    expect(prov.sourceReference).toContain("p.40");

    // Granular provenance extensions
    expect(prov.granularIdentifier).toBe("3.1.1");
    expect(prov.granularItemId).toBe("sgi-3-1-1");
    expect(prov.granularScope).toBe("SUBTOPIC");
  });

  // --------------------------------------------------------------------------
  // TEST 17: Retrieval ranking behavior remains intact for eligible candidates
  // --------------------------------------------------------------------------
  it("17. Hybrid ranking and similarity threshold operate properly on eligible candidates", async () => {
    const candidateA = {
      id: "chunk-rank-high",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 40,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      topicTitle: "Newton's Laws",
      scope: "SUBTOPIC",
      identifier: "3.1.1",
      heading: "Explain laws of motion and force calculation",
      content: "Explain laws of motion and force calculation in detail with Newton's second law F = ma.",
      chunkType: "DEFINITION",
    };

    const candidateB = {
      id: "chunk-rank-lower",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 48,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      topicTitle: "Newton's Laws",
      scope: "HEADING",
      identifier: "Momentum Conservation",
      heading: "Momentum Conservation",
      content: "Isolated system total momentum remains constant.",
      chunkType: "CONCEPT",
    };

    const response = await RetrievalService.retrieveKnowledge(
      {
        ...baseRetrievalRequest,
        query: "Explain laws of motion force calculation and momentum conservation",
        similarityThreshold: 0.15,
      },
      {
        syntheticCandidates: [candidateA, candidateB],
      }
    );

    expect(response.results.length).toBe(2);
    // Candidate A has higher query keyword/semantic match
    expect(response.results[0].chunkId).toBe("chunk-rank-high");
    expect(response.results[1].chunkId).toBe("chunk-rank-lower");
    expect(response.results[0].relevanceScore).toBeGreaterThanOrEqual(
      response.results[1].relevanceScore
    );
  });

  // --------------------------------------------------------------------------
  // TEST 18: Deterministic repeated retrieval produces same outcome
  // --------------------------------------------------------------------------
  it("18. Deterministic repeated retrieval produces identical eligibility outcome across iterations", async () => {
    const candidatePool = [
      {
        id: "chunk-rep-1",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 40,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        scope: "SUBTOPIC",
        identifier: "3.1.1", // Eligible
        content: "First law definition.",
        chunkType: "CONCEPT",
      },
      {
        id: "chunk-rep-2",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 42,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        scope: "SUBTOPIC",
        identifier: "3.1.2", // Excluded
        content: "Inertia special cases.",
        chunkType: "CONCEPT",
      },
    ];

    const ref = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
      syntheticCandidates: candidatePool,
    });

    for (let i = 0; i < 10; i++) {
      const rep = await RetrievalService.retrieveKnowledge(baseRetrievalRequest, {
        syntheticCandidates: candidatePool,
      });
      expect(rep.status).toBe(ref.status);
      expect(rep.returnedCount).toBe(ref.returnedCount);
      expect(rep.results.map((r) => r.chunkId)).toEqual(ref.results.map((r) => r.chunkId));
    }
  });

  // --------------------------------------------------------------------------
  // TEST 19: No AI provider is required for eligibility decisions
  // --------------------------------------------------------------------------
  it("19. No AI provider is called or required for syllabus eligibility decisions", async () => {
    const chunkCandidate = {
      id: "chunk-no-ai",
      documentId: "doc-1",
      bookId: "book-1",
      bookTitle: "Physics Grade 9",
      pageNumber: 40,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-1",
      scope: "SUBTOPIC",
      identifier: "3.1.2", // Excluded
      content: "Content tested without AI.",
      chunkType: "CONCEPT",
    };

    const aiSpy = vi.spyOn(AIProviderFactory, "getProvider");

    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [chunkCandidate],
      mockGranularSyllabus
    );

    expect(aiSpy).not.toHaveBeenCalled();
    expect(eligible.length).toBe(0);
    expect(rejected.length).toBe(1);
    expect(rejected[0].eligibilityStatus).toBe("EXCLUDED");
  });

  // --------------------------------------------------------------------------
  // TEST 20: Existing retrieval ranking behavior remains unchanged for eligible candidates
  // --------------------------------------------------------------------------
  it("20. Existing retrieval ranking behavior remains unchanged for eligible candidates and excluded candidates never enter ranking", async () => {
    const candidates = [
      {
        id: "chunk-rank-1",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 40,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        scope: "SUBTOPIC",
        identifier: "3.1.1", // Eligible
        heading: "Newton Laws Force",
        content: "Force calculation F = ma.",
        chunkType: "DEFINITION",
      },
      {
        id: "chunk-rank-2",
        documentId: "doc-1",
        bookId: "book-1",
        bookTitle: "Physics Grade 9",
        pageNumber: 42,
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        topicId: "top-3-1",
        scope: "SUBTOPIC",
        identifier: "3.1.2", // Excluded
        heading: "Excluded Subtopic",
        content: "Excluded from ranking.",
        chunkType: "CONCEPT",
      },
    ];

    const response = await RetrievalService.retrieveKnowledge(
      {
        ...baseRetrievalRequest,
        similarityThreshold: 0.15,
      },
      { syntheticCandidates: candidates }
    );

    expect(response.results.length).toBe(1);
    expect(response.results[0].chunkId).toBe("chunk-rank-1");
    expect(response.results[0].relevanceScore).toBeGreaterThan(0);
  });
});

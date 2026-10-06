// ==============================================================================
// AI Live Paper Generator - Granular Syllabus Pipeline End-to-End Tests (Step 6)
// Final End-to-End Integration and Safety Validation across the Complete Study Agent Pipeline:
// Official Syllabus -> Syllabus Version -> Chapter -> Topic -> Subtopic / Heading / Exercise Question
// -> Eligibility Engine -> RAG Retrieval -> Blueprint -> Question Generation -> Question Bank
// -> Practice / Paper Assembly -> Final Paper
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";

// Repositories & Services
import { EligibilityEngine } from "@/server/syllabus/eligibility-engine";
import { SyllabusService } from "@/server/syllabus/syllabus-service";
import { SyllabusGate } from "@/server/retrieval/syllabus-gate";
import { RetrievalService } from "@/server/retrieval/retrieval-service";
import { ContextAssembler } from "@/server/retrieval/context-assembler";
import { CoverageAllocationEngine } from "@/server/blueprint/coverage-allocation-engine";
import { BlueprintSlotGenerator } from "@/server/blueprint/blueprint-slot-generator";
import { BlueprintValidator } from "@/server/blueprint/blueprint-validator";
import { BlueprintRepository } from "@/server/blueprint/blueprint-repository";
import { QuestionIntelligenceEngine } from "@/server/blueprint/question-intelligence-engine";
import { QuestionGenerationService } from "@/server/question-generation/question-generation-service";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";
import { PaperAssemblyService } from "@/server/exam-engine/paper-assembly-service";
import { PaperValidator } from "@/server/exam-engine/paper-validator";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { prisma } from "@/lib/db";

// Types
import {
  ExaminationBlueprint,
  BlueprintSection,
  BlueprintQuestionSlot,
} from "@/types/blueprint";
import { QuestionBankItem, QuestionCandidate } from "@/types/question-generation";
import { RetrievalRequest } from "@/types/retrieval";

describe("Step 6: Granular Syllabus Complete Pipeline End-to-End Integration & Safety", () => {
  // Master Official Verified Syllabus 2025 with Complete Granular Hierarchy
  const masterSyllabus2025 = {
    id: "syl-fbise-phy-2025",
    title: "FBISE Grade 9 Physics Curriculum 2025-26",
    version: "2025-v2.0",
    status: "VERIFIED",
    boardId: "board-fbise",
    academicYearId: "year-2025-26",
    classId: "class-9",
    subjectId: "subj-physics",
    chapterItems: [
      {
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities and Measurement",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 25,
        alignmentStatus: "MATCHED",
      },
      {
        chapterId: "chap-02",
        chapterTitle: "Kinematics",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 25,
        alignmentStatus: "MATCHED",
      },
      {
        chapterId: "chap-03",
        chapterTitle: "Dynamics (Mixed Non-Contiguous)",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 30,
        alignmentStatus: "MATCHED",
      },
      {
        chapterId: "chap-04-legacy",
        chapterTitle: "Turn of Forces (Legacy - No Granular Records)",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 20,
        alignmentStatus: "MATCHED",
      },
      {
        chapterId: "chap-05-excluded",
        chapterTitle: "Nuclear Physics (Complete Excluded Chapter)",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "UNMATCHED",
      },
    ],
    topicItems: [
      // Chapter 1: Standard Included Topic with Granular Subtopics & Headings
      {
        topicId: "top-1-1",
        chapterId: "chap-01",
        topicTitle: "Introduction to Physics & Measurements",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 15,
        alignmentStatus: "MATCHED",
        granularItems: [
          {
            id: "gi-1-1-sub-si",
            scope: "SUBTOPIC",
            identifier: "1.1.1",
            title: "International System of Units",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-1-1-sub-imperial",
            scope: "SUBTOPIC",
            identifier: "1.1.2",
            title: "Imperial Foot-Pound System",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
          {
            id: "gi-1-1-head-prefix",
            scope: "HEADING",
            identifier: "Sec 1.2: Prefixes",
            title: "Standard SI Prefixes",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-1-1-head-historical",
            scope: "HEADING",
            identifier: "Sec 1.3: Historical Systems",
            title: "Obsolete Ancient Systems",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
          {
            id: "gi-1-1-ex-q1",
            scope: "EXERCISE_QUESTION",
            identifier: "Ex 1.1 Q1",
            title: "Convert km to meters",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-1-1-ex-q4",
            scope: "EXERCISE_QUESTION",
            identifier: "Ex 1.1 Q4",
            title: "Cubit to yard conversion",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
        ],
      },
      // Chapter 2: Topics where one entire topic is excluded
      {
        topicId: "top-2-1",
        chapterId: "chap-02",
        topicTitle: "Translational Motion",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 15,
        alignmentStatus: "MATCHED",
      },
      {
        topicId: "top-2-2-excluded",
        chapterId: "chap-02",
        topicTitle: "Relativistic Motion (Entire Topic Excluded)",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "UNMATCHED",
        granularItems: [
          {
            id: "gi-2-2-sub-lorentz",
            scope: "SUBTOPIC",
            identifier: "2.2.1",
            title: "Lorentz Transformations",
            isIncluded: true, // Child marked true under excluded topic
            eligibility: "ELIGIBLE",
          },
        ],
      },
      // Chapter 3: Complex Mixed Non-Contiguous Chapter (Scenario F)
      // Topic A: Included topic with both included & excluded subtopics
      {
        topicId: "top-3-a",
        chapterId: "chap-03",
        topicTitle: "Topic A: Newton's Laws",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 10,
        alignmentStatus: "MATCHED",
        granularItems: [
          {
            id: "gi-3-a-sub-first-law",
            scope: "SUBTOPIC",
            identifier: "Subtopic 3.A.1",
            title: "First Law of Motion & Inertia",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-3-a-sub-excluded",
            scope: "SUBTOPIC",
            identifier: "Subtopic 3.A.2",
            title: "Aristotelian Fallacy (Excluded Subtopic)",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
        ],
      },
      // Topic B: Wholly excluded topic in mixed chapter
      {
        topicId: "top-3-b-excluded",
        chapterId: "chap-03",
        topicTitle: "Topic B: Frictionless Perpetual Devices",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "UNMATCHED",
      },
      // Topic C: Included topic with excluded heading and excluded exercise question
      {
        topicId: "top-3-c",
        chapterId: "chap-03",
        topicTitle: "Topic C: Momentum & Collisions",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 20,
        alignmentStatus: "MATCHED",
        granularItems: [
          {
            id: "gi-3-c-head-elastic",
            scope: "HEADING",
            identifier: "Heading 3.C.1: Elastic Collisions",
            title: "One-Dimensional Elastic Collisions",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-3-c-head-relativistic",
            scope: "HEADING",
            identifier: "Heading 3.C.2: Relativistic Momentum",
            title: "Relativistic Momentum Correction",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
          {
            id: "gi-3-c-ex-q1",
            scope: "EXERCISE_QUESTION",
            identifier: "Ex 3.3 Q1",
            title: "Calculate momentum of 2kg sphere",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-3-c-ex-q4",
            scope: "EXERCISE_QUESTION",
            identifier: "Ex 3.3 Q4",
            title: "High-energy proton scatter (Excluded Exercise)",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
        ],
      },
      // Chapter 4: Legacy Chapter (No granular records)
      {
        topicId: "top-4-legacy",
        chapterId: "chap-04-legacy",
        topicTitle: "Torque and Equilibrium",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 20,
        alignmentStatus: "MATCHED",
      },
      // Chapter 5: Topics under excluded chapter
      {
        topicId: "top-5-nuclear",
        chapterId: "chap-05-excluded",
        topicTitle: "Nuclear Reactions",
        isIncluded: true, // Marked true, but parent chapter is EXCLUDED
        eligibility: "ELIGIBLE",
        weightage: 0,
        granularItems: [
          {
            id: "gi-5-fission",
            scope: "SUBTOPIC",
            identifier: "Subtopic 5.1",
            title: "Nuclear Fission Energy",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
        ],
      },
    ],
  };

  // Syllabus Version A: Topic 3.2 is INCLUDED
  const syllabusVersionA = {
    id: "syl-phy-version-a",
    title: "Physics Curriculum 2024",
    version: "2024-v1.0",
    status: "VERIFIED",
    boardId: "board-fbise",
    academicYearId: "year-2024",
    classId: "class-9",
    subjectId: "subj-physics",
    chapterItems: [
      {
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 100,
      },
    ],
    topicItems: [
      {
        topicId: "top-3-2",
        chapterId: "chap-03",
        topicTitle: "Topic 3.2: Universal Gravitation",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 100,
      },
    ],
  };

  // Syllabus Version B: Topic 3.2 is EXCLUDED
  const syllabusVersionB = {
    id: "syl-phy-version-b",
    title: "Physics Curriculum 2025",
    version: "2025-v1.0",
    status: "VERIFIED",
    boardId: "board-fbise",
    academicYearId: "year-2025",
    classId: "class-9",
    subjectId: "subj-physics",
    chapterItems: [
      {
        chapterId: "chap-03",
        chapterTitle: "Dynamics",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 100,
      },
    ],
    topicItems: [
      {
        topicId: "top-3-2",
        chapterId: "chap-03",
        topicTitle: "Topic 3.2: Universal Gravitation",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    QuestionBankRepository.resetMemory();
    BlueprintRepository.resetMemory();
    ExamRepository.resetMemory();

    vi.spyOn(prisma.syllabus as any, "findUnique").mockImplementation(async (args: any) => {
      const id = args?.where?.id;
      if (id === "syl-fbise-phy-2025") return masterSyllabus2025 as any;
      if (id === "syl-phy-version-a") return syllabusVersionA as any;
      if (id === "syl-phy-version-b") return syllabusVersionB as any;
      return null;
    });

    vi.spyOn(SyllabusService, "getSyllabusById").mockImplementation(async (id: string) => {
      if (id === "syl-fbise-phy-2025") return masterSyllabus2025 as any;
      if (id === "syl-phy-version-a") return syllabusVersionA as any;
      if (id === "syl-phy-version-b") return syllabusVersionB as any;
      return null;
    });
  });

  // ==========================================================================
  // STEP 6A: REALISTIC SHORTENED-SYLLABUS END-TO-END SCENARIOS
  // ==========================================================================

  it("Step 6A - Scenario A: Complete Chapter Deletion blocks retrieval, blueprint, generation, question bank, and paper assembly", async () => {
    const chapterId = "chap-05-excluded";
    const topicId = "top-5-nuclear";

    // 1. Authoritative Deterministic Engine Evaluation
    const evalRes = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId,
      topicId,
      scope: "SUBTOPIC",
      identifier: "Subtopic 5.1",
    });
    expect(evalRes.eligibility).toBe("EXCLUDED");
    expect(evalRes.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
    expect(evalRes.isEligibleForProduction).toBe(false);

    // 2. Retrieval Gate & RAG Pipeline
    const candidateChunks = [
      {
        id: "chunk-nuc-01",
        chapterId,
        topicId,
        title: "Nuclear Fission Overview",
        content: "Nuclear fission releases vast amounts of energy.",
        heading: "Section 5.1",
        chunkType: "CONCEPT",
        confidence: 0.95,
        tokenCount: 40,
        pageNumber: 150,
      },
    ];
    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      candidateChunks,
      masterSyllabus2025
    );
    expect(eligible).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].eligibilityStatus).toBe("EXCLUDED");

    // RAG Context Assembly
    const contextPkg = ContextAssembler.assembleContext(
      rejected.map((c) => ({
        chunk: c,
        finalScore: 0.95,
        explanation: { matchedTerms: [], rankingBoostsApplied: [], textRelevanceScore: 0.95, diversityScore: 1 },
      })) as any,
      masterSyllabus2025,
      { provenanceRequired: true }
    );
    expect(contextPkg.items).toHaveLength(0);
    expect(contextPkg.rejectedProvenanceCount).toBe(1);

    // 3. Blueprint Allocation Engine
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 100,
    });
    const allocatedChapterIds = coverage.chapters.map((c) => c.chapterId);
    expect(allocatedChapterIds).not.toContain(chapterId);

    // 4. Question Generation Gate
    const genGate = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: masterSyllabus2025 },
      {
        id: "spec-nuc",
        blueprintSlotId: "slot-nuc",
        chapterId,
        topicId,
        marks: 3,
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        requiredAnswerDepth: "BRIEF",
        requiredEvidenceCount: 1,
      } as any,
      {
        id: "slot-nuc",
        chapterId,
        topicId,
        marks: 3,
        targetDifficulty: "MEDIUM",
        questionType: "SHORT",
      }
    );
    expect(genGate.canGenerate).toBe(false);
    expect(genGate.contentEligibility).toBe("EXCLUDED");

    // 5. Question Bank Approval Gate
    const excludedCandidate: any = {
      id: "cand-nuc-01",
      blueprintSlotId: "slot-nuc",
      questionText: "Explain the process of nuclear fission.",
      questionType: "SHORT",
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      marks: 3,
      chapterId,
      topicId,
      syllabusId: masterSyllabus2025.id,
      status: "GENERATED",
      provenance: {
        sourceChunkIds: ["chunk-nuc-01"],
        chunkTitles: ["Nuclear Fission"],
        bookId: "book-phy-9",
        confidenceScore: 0.9,
        syllabusId: masterSyllabus2025.id,
        eligibilityStatus: "EXCLUDED",
      },
      evaluationReport: {
        isCurriculumAligned: true,
        pedagogicalScore: 85,
        alignmentNotes: "Aligned with book",
        strengths: ["Clear"],
        weaknesses: [],
        suggestions: [],
      },
      reviewNotes: [],
      suggestedReviewers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await QuestionBankRepository.saveCandidate(excludedCandidate);
    await expect(
      QuestionGenerationService.approveCandidate(
        excludedCandidate.id,
        "admin-reviewer"
      )
    ).rejects.toThrow("CANNOT_APPROVE_INELIGIBLE_CANDIDATE");

    // 6. Practice / Paper Assembly
    const fakeApprovedBankItem: any = {
      id: "qb-nuc-01",
      candidateId: excludedCandidate.id,
      version: "1.0",
      historicalVersions: [],
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      syllabusId: masterSyllabus2025.id,
      syllabusVersion: masterSyllabus2025.version,
      chapterId,
      chapterTitle: "Nuclear Physics",
      topicId,
      topicTitle: "Nuclear Reactions",
      questionText: excludedCandidate.questionText,
      questionType: "SHORT",
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      marks: 3,
      reviewState: "APPROVED",
      sourceProvenance: {
        ...excludedCandidate.provenance,
        eligibilityStatus: "EXCLUDED",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bpForAssembly: any = {
      id: "bp-test-assembly",
      version: "v1.0",
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      syllabusId: masterSyllabus2025.id,
      syllabus: masterSyllabus2025,
      title: "Assembly Test Paper",
      totalMarks: 3,
      durationMinutes: 30,
      language: "en",
      status: "APPROVED",
      sections: [
        {
          id: "sec-1",
          blueprintId: "bp-test-assembly",
          sectionName: "Section A",
          sectionOrder: 1,
          questionCount: 1,
          marksPerQuestion: 3,
          totalMarks: 3,
          displayedMarks: 3,
          attemptableMarks: 3,
          maximumObtainableMarks: 3,
          questionTypes: ["SHORT"],
          choiceRule: { type: "NO_CHOICE" },
        },
      ],
      slots: [
        {
          id: "slot-1",
          blueprintId: "bp-test-assembly",
          sectionId: "sec-1",
          sectionName: "Section A",
          sequence: 1,
          questionType: "SHORT",
          marks: 3,
          targetDifficulty: "MEDIUM",
          chapterId,
          chapterTitle: "Nuclear Physics",
          topicId,
          topicTitle: "Nuclear Reactions",
          knowledgeType: "CONCEPTUAL",
          cognitiveLevel: "UNDERSTAND",
          requiredAnswerDepth: "BRIEF",
          optionalState: "COMPULSORY",
          retrievalRequirements: { chapterId, topicId, marks: 3, questionType: "SHORT" },
        },
      ],
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 3, difficultMarks: 0 } },
      coverageAllocation: { chapters: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await BlueprintRepository.saveBlueprint(bpForAssembly);
    await QuestionBankRepository.saveBankItem(fakeApprovedBankItem);

    // Paper assembly MUST reject the question under the excluded chapter
    await expect(
      PaperAssemblyService.assemblePaper(bpForAssembly.id, {
        actorId: "admin-1",
      })
    ).rejects.toThrow("INSUFFICIENT_APPROVED_QUESTION_BANK");
  });

  it("Step 6A - Scenario B: Complete Topic Deletion blocks topic 2.2 and all descendants while topic 2.1 remains eligible", async () => {
    // 1. Evaluate Excluded Topic 2.2 and its child subtopic
    const evalExcludedTopic = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-02",
      topicId: "top-2-2-excluded",
    });
    expect(evalExcludedTopic.eligibility).toBe("EXCLUDED");
    expect(evalExcludedTopic.diagnosticCode).toBe("EXCLUDED_BY_TOPIC");

    const evalChildUnderExcludedTopic = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-02",
      topicId: "top-2-2-excluded",
      scope: "SUBTOPIC",
      identifier: "2.2.1",
    });
    expect(evalChildUnderExcludedTopic.eligibility).toBe("EXCLUDED");
    expect(evalChildUnderExcludedTopic.diagnosticCode).toBe("EXCLUDED_BY_TOPIC");

    // 2. Evaluate Eligible Sibling Topic 2.1
    const evalEligibleTopic = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-02",
      topicId: "top-2-1",
    });
    expect(evalEligibleTopic.eligibility).toBe("ELIGIBLE");
    expect(evalEligibleTopic.diagnosticCode).toBe("ELIGIBLE");

    // 3. Retrieval Pipeline
    const candidateChunks = [
      {
        id: "chunk-rel-01",
        chapterId: "chap-02",
        topicId: "top-2-2-excluded",
        title: "Relativistic Velocity",
        content: "Nothing travels faster than the speed of light.",
        confidence: 0.9,
      },
      {
        id: "chunk-trans-01",
        chapterId: "chap-02",
        topicId: "top-2-1",
        title: "Uniform Translational Motion",
        content: "Velocity is displacement divided by elapsed time.",
        confidence: 0.9,
      },
    ];
    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      candidateChunks,
      masterSyllabus2025
    );
    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe("chunk-trans-01");
    expect(rejected).toHaveLength(1);
    expect(rejected[0].id).toBe("chunk-rel-01");

    // 4. Blueprint Coverage
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 100,
    });
    const chap2 = coverage.chapters.find((c) => c.chapterId === "chap-02");
    expect(chap2).toBeDefined();
    const chap2TopicIds = chap2!.topicAllocations.map((t) => t.topicId);
    expect(chap2TopicIds).toContain("top-2-1");
    expect(chap2TopicIds).not.toContain("top-2-2-excluded");
  });

  it("Step 6A - Scenario C: Subtopic Deletion blocks subtopic 1.1.2 while subtopic 1.1.1 remains eligible", async () => {
    // 1. Deterministic Engine Evaluation
    const evalExcludedSub = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "SUBTOPIC",
      identifier: "1.1.2",
    });
    expect(evalExcludedSub.eligibility).toBe("EXCLUDED");
    expect(evalExcludedSub.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");

    const evalEligibleSub = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "SUBTOPIC",
      identifier: "1.1.1",
    });
    expect(evalEligibleSub.eligibility).toBe("ELIGIBLE");
    expect(evalEligibleSub.diagnosticCode).toBe("ELIGIBLE");

    // 2. Blueprint Allocation
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 100,
    });
    const top11 = coverage.chapters
      .find((c) => c.chapterId === "chap-01")
      ?.topicAllocations.find((t) => t.topicId === "top-1-1");
    expect(top11).toBeDefined();
    const granulars = top11!.granularAllocations || [];
    const subIdentifiers = granulars.filter((g) => g.scope === "SUBTOPIC").map((g) => g.identifier);
    expect(subIdentifiers).toContain("1.1.1");
    expect(subIdentifiers).not.toContain("1.1.2");

    // 3. Question Generation Gate
    const gateExcluded = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: masterSyllabus2025 },
      {
        id: "spec-ex",
        blueprintSlotId: "slot-sub-ex",
        chapterId: "chap-01",
        topicId: "top-1-1",
        granularScope: "SUBTOPIC",
        granularIdentifier: "1.1.2",
        marks: 2,
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "APPLY",
        requiredAnswerDepth: "BRIEF",
        requiredEvidenceCount: 1,
      } as any,
      {
        id: "slot-sub-ex",
        chapterId: "chap-01",
        topicId: "top-1-1",
        granularScope: "SUBTOPIC",
        granularIdentifier: "1.1.2",
        marks: 2,
        questionType: "SHORT",
        targetDifficulty: "MEDIUM",
      }
    );
    expect(gateExcluded.canGenerate).toBe(false);
    expect(gateExcluded.contentEligibility).toBe("EXCLUDED");

    const gateEligible = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: masterSyllabus2025 },
      {
        id: "spec-el",
        blueprintSlotId: "slot-sub-el",
        chapterId: "chap-01",
        topicId: "top-1-1",
        granularScope: "SUBTOPIC",
        granularIdentifier: "1.1.1",
        marks: 2,
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "APPLY",
        requiredAnswerDepth: "BRIEF",
        requiredEvidenceCount: 1,
      } as any,
      {
        id: "slot-sub-el",
        chapterId: "chap-01",
        topicId: "top-1-1",
        granularScope: "SUBTOPIC",
        granularIdentifier: "1.1.1",
        marks: 2,
        questionType: "SHORT",
        targetDifficulty: "MEDIUM",
      }
    );
    expect(gateEligible.canGenerate).toBe(true);
    expect(gateEligible.contentEligibility).toBe("ELIGIBLE");
  });

  it("Step 6A - Scenario D: Heading/Section Deletion blocks excluded heading while unrelated eligible material remains usable", async () => {
    // 1. Evaluate Headings
    const evalExcludedHead = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "HEADING",
      identifier: "Sec 1.3: Historical Systems",
    });
    expect(evalExcludedHead.eligibility).toBe("EXCLUDED");
    expect(evalExcludedHead.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");

    const evalEligibleHead = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "HEADING",
      identifier: "Sec 1.2: Prefixes",
    });
    expect(evalEligibleHead.eligibility).toBe("ELIGIBLE");
    expect(evalEligibleHead.diagnosticCode).toBe("ELIGIBLE");

    // 2. Blueprint Allocation
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 100,
    });
    const top11 = coverage.chapters
      .find((c) => c.chapterId === "chap-01")
      ?.topicAllocations.find((t) => t.topicId === "top-1-1");
    const granulars = top11!.granularAllocations || [];
    const headIdentifiers = granulars.filter((g) => g.scope === "HEADING").map((g) => g.identifier);
    expect(headIdentifiers).toContain("Sec 1.2: Prefixes");
    expect(headIdentifiers).not.toContain("Sec 1.3: Historical Systems");
  });

  it("Step 6A - Scenario E: Specific Exercise Question Deletion blocks Ex 1.1 Q4 while Ex 1.1 Q1 and theory content remain eligible", async () => {
    // 1. Evaluate Exercise Questions
    const evalExcludedQ = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "EXERCISE_QUESTION",
      identifier: "Ex 1.1 Q4",
    });
    expect(evalExcludedQ.eligibility).toBe("EXCLUDED");
    expect(evalExcludedQ.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");

    const evalEligibleQ = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "EXERCISE_QUESTION",
      identifier: "Ex 1.1 Q1",
    });
    expect(evalEligibleQ.eligibility).toBe("ELIGIBLE");
    expect(evalEligibleQ.diagnosticCode).toBe("ELIGIBLE");

    // 2. Blueprint Allocation
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 100,
    });
    const top11 = coverage.chapters
      .find((c) => c.chapterId === "chap-01")
      ?.topicAllocations.find((t) => t.topicId === "top-1-1");
    const granulars = top11!.granularAllocations || [];
    const eqIdentifiers = granulars
      .filter((g) => g.scope === "EXERCISE_QUESTION")
      .map((g) => g.identifier);
    expect(eqIdentifiers).toContain("Ex 1.1 Q1");
    expect(eqIdentifiers).not.toContain("Ex 1.1 Q4");
  });

  it("Step 6A - Scenario F: Mixed Non-Contiguous Deletions within a single chapter guarantees final paper contains ONLY eligible material", async () => {
    // Chapter 3 contains:
    // - Included Topic A (with included subtopic 3.A.1 and excluded subtopic 3.A.2)
    // - Wholly Excluded Topic B
    // - Included Topic C (with included heading 3.C.1, excluded heading 3.C.2, included Q1, excluded Q4)

    // 1. Generate Coverage and Blueprint
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 30,
      requestedChapterRequirements: { "chap-03": 30 },
    });
    const chap3Coverage = coverage.chapters.find((c) => c.chapterId === "chap-03");
    expect(chap3Coverage).toBeDefined();

    const topicIds = chap3Coverage!.topicAllocations.map((t) => t.topicId);
    expect(topicIds).toContain("top-3-a");
    expect(topicIds).toContain("top-3-c");
    expect(topicIds).not.toContain("top-3-b-excluded");

    // Verify Granular Sub-Allocations in Blueprint
    const topAAlloc = chap3Coverage!.topicAllocations.find((t) => t.topicId === "top-3-a");
    const topAGranular = topAAlloc?.granularAllocations?.map((g) => g.identifier) || [];
    expect(topAGranular).toContain("Subtopic 3.A.1");
    expect(topAGranular).not.toContain("Subtopic 3.A.2");

    const topCAlloc = chap3Coverage!.topicAllocations.find((t) => t.topicId === "top-3-c");
    const topCGranular = topCAlloc?.granularAllocations?.map((g) => g.identifier) || [];
    expect(topCGranular).toContain("Heading 3.C.1: Elastic Collisions");
    expect(topCGranular).not.toContain("Heading 3.C.2: Relativistic Momentum");
    expect(topCGranular).toContain("Ex 3.3 Q1");
    expect(topCGranular).not.toContain("Ex 3.3 Q4");

    // 2. Generate Slots
    const sections: BlueprintSection[] = [
      {
        id: "sec-mixed-1",
        blueprintId: "bp-mixed",
        sectionName: "Section A - Dynamics",
        sectionOrder: 1,
        questionCount: 3,
        marksPerQuestion: 2,
        totalMarks: 6,
        displayedMarks: 6,
        attemptableMarks: 6,
        maximumObtainableMarks: 6,
        questionTypes: ["SHORT"],
        choiceRule: { type: "NO_CHOICE" },
      },
    ];
    const slots = BlueprintSlotGenerator.generateSlots({
      blueprintId: "bp-mixed",
      sections,
      chapterAllocations: coverage.chapters,
    });
    expect(slots).toHaveLength(3);

    // Verify all generated slots are strictly from eligible granular pool
    for (const slot of slots) {
      expect(slot.topicId).not.toBe("top-3-b-excluded");
      if (slot.granularIdentifier) {
        expect(slot.granularIdentifier).not.toBe("Subtopic 3.A.2");
        expect(slot.granularIdentifier).not.toBe("Heading 3.C.2: Relativistic Momentum");
        expect(slot.granularIdentifier).not.toBe("Ex 3.3 Q4");
      }
    }

    // 3. Populate Question Bank: Both eligible and excluded items
    const bankItems: any[] = [
      {
        id: "qb-el-01",
        candidateId: "cand-el-01",
        version: "1.0",
        historicalVersions: [],
        boardId: masterSyllabus2025.boardId,
        academicYearId: masterSyllabus2025.academicYearId,
        classId: masterSyllabus2025.classId,
        subjectId: masterSyllabus2025.subjectId,
        syllabusId: masterSyllabus2025.id,
        syllabusVersion: masterSyllabus2025.version,
        blueprintSlotId: slots[0].id,
        questionText: "State Newton's first law of motion and define inertia.",
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        marks: 2,
        chapterId: "chap-03",
        topicId: "top-3-a",
        granularItemId: "gi-3-a-sub-first-law",
        granularScope: "SUBTOPIC",
        granularIdentifier: "Subtopic 3.A.1",
        reviewState: "APPROVED",
        sourceProvenance: {
          granularScope: "SUBTOPIC",
          granularIdentifier: "Subtopic 3.A.1",
          eligibilityStatus: "ELIGIBLE",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qb-ex-02",
        candidateId: "cand-ex-02",
        version: "1.0",
        historicalVersions: [],
        boardId: masterSyllabus2025.boardId,
        academicYearId: masterSyllabus2025.academicYearId,
        classId: masterSyllabus2025.classId,
        subjectId: masterSyllabus2025.subjectId,
        syllabusId: masterSyllabus2025.id,
        syllabusVersion: masterSyllabus2025.version,
        blueprintSlotId: slots[0].id,
        questionText: "Discuss the Aristotelian fallacy regarding motion.",
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        marks: 2,
        chapterId: "chap-03",
        topicId: "top-3-a",
        granularItemId: "gi-3-a-sub-excluded",
        granularScope: "SUBTOPIC",
        granularIdentifier: "Subtopic 3.A.2",
        reviewState: "APPROVED",
        sourceProvenance: {
          granularScope: "SUBTOPIC",
          granularIdentifier: "Subtopic 3.A.2",
          eligibilityStatus: "EXCLUDED",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qb-el-03",
        candidateId: "cand-el-03",
        version: "1.0",
        historicalVersions: [],
        boardId: masterSyllabus2025.boardId,
        academicYearId: masterSyllabus2025.academicYearId,
        classId: masterSyllabus2025.classId,
        subjectId: masterSyllabus2025.subjectId,
        syllabusId: masterSyllabus2025.id,
        syllabusVersion: masterSyllabus2025.version,
        blueprintSlotId: slots[1].id,
        questionText: "Define an elastic collision and give an example.",
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        marks: 2,
        chapterId: "chap-03",
        topicId: "top-3-c",
        granularItemId: "gi-3-c-head-elastic",
        granularScope: "HEADING",
        granularIdentifier: "Heading 3.C.1: Elastic Collisions",
        reviewState: "APPROVED",
        sourceProvenance: {
          granularScope: "HEADING",
          granularIdentifier: "Heading 3.C.1: Elastic Collisions",
          eligibilityStatus: "ELIGIBLE",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qb-ex-04",
        candidateId: "cand-ex-04",
        version: "1.0",
        historicalVersions: [],
        boardId: masterSyllabus2025.boardId,
        academicYearId: masterSyllabus2025.academicYearId,
        classId: masterSyllabus2025.classId,
        subjectId: masterSyllabus2025.subjectId,
        syllabusId: masterSyllabus2025.id,
        syllabusVersion: masterSyllabus2025.version,
        blueprintSlotId: slots[1].id,
        questionText: "Calculate relativistic momentum correction for an electron.",
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        marks: 2,
        chapterId: "chap-03",
        topicId: "top-3-c",
        granularItemId: "gi-3-c-head-relativistic",
        granularScope: "HEADING",
        granularIdentifier: "Heading 3.C.2: Relativistic Momentum",
        reviewState: "APPROVED",
        sourceProvenance: {
          granularScope: "HEADING",
          granularIdentifier: "Heading 3.C.2: Relativistic Momentum",
          eligibilityStatus: "EXCLUDED",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qb-el-05",
        candidateId: "cand-el-05",
        version: "1.0",
        historicalVersions: [],
        boardId: masterSyllabus2025.boardId,
        academicYearId: masterSyllabus2025.academicYearId,
        classId: masterSyllabus2025.classId,
        subjectId: masterSyllabus2025.subjectId,
        syllabusId: masterSyllabus2025.id,
        syllabusVersion: masterSyllabus2025.version,
        blueprintSlotId: slots[2].id,
        questionText: "Calculate momentum of a 2kg sphere moving at 5 m/s.",
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "APPLY",
        marks: 2,
        chapterId: "chap-03",
        topicId: "top-3-c",
        granularItemId: "gi-3-c-ex-q1",
        granularScope: "EXERCISE_QUESTION",
        granularIdentifier: "Ex 3.3 Q1",
        reviewState: "APPROVED",
        sourceProvenance: {
          granularScope: "EXERCISE_QUESTION",
          granularIdentifier: "Ex 3.3 Q1",
          eligibilityStatus: "ELIGIBLE",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qb-ex-06",
        candidateId: "cand-ex-06",
        version: "1.0",
        historicalVersions: [],
        boardId: masterSyllabus2025.boardId,
        academicYearId: masterSyllabus2025.academicYearId,
        classId: masterSyllabus2025.classId,
        subjectId: masterSyllabus2025.subjectId,
        syllabusId: masterSyllabus2025.id,
        syllabusVersion: masterSyllabus2025.version,
        blueprintSlotId: slots[2].id,
        questionText: "Calculate high-energy proton scattering angle.",
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "APPLY",
        marks: 2,
        chapterId: "chap-03",
        topicId: "top-3-c",
        granularItemId: "gi-3-c-ex-q4",
        granularScope: "EXERCISE_QUESTION",
        granularIdentifier: "Ex 3.3 Q4",
        reviewState: "APPROVED",
        sourceProvenance: {
          granularScope: "EXERCISE_QUESTION",
          granularIdentifier: "Ex 3.3 Q4",
          eligibilityStatus: "EXCLUDED",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mixedBlueprint: any = {
      id: "bp-mixed",
      version: "v1.0",
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      syllabusId: masterSyllabus2025.id,
      syllabus: masterSyllabus2025,
      title: "Mixed Dynamics Paper",
      totalMarks: 6,
      durationMinutes: 45,
      language: "en",
      status: "APPROVED",
      sections,
      slots,
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 6, difficultMarks: 0 } },
      coverageAllocation: coverage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await BlueprintRepository.saveBlueprint(mixedBlueprint);
    for (const item of bankItems) {
      await QuestionBankRepository.saveBankItem(item);
    }

    // 4. Assemble Final Paper
    const assembledPaper = await PaperAssemblyService.assemblePaper(mixedBlueprint.id, {
      actorId: "admin-examiner",
    });

    expect(assembledPaper).toBeDefined();
    expect(assembledPaper.questions).toHaveLength(3);

    // 5. Verify the Final Paper contains ONLY eligible material
    for (const q of assembledPaper.questions) {
      expect(q.topicId).not.toBe("top-3-b-excluded");
      expect(q.granularIdentifier).not.toBe("Subtopic 3.A.2");
      expect(q.granularIdentifier).not.toBe("Heading 3.C.2: Relativistic Momentum");
      expect(q.granularIdentifier).not.toBe("Ex 3.3 Q4");
      expect(q.provenance.eligibilityStatus).toBe("ELIGIBLE");

      // Verify deterministic engine confirms production eligibility
      const liveEval = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
        chapterId: q.chapterId,
        topicId: q.topicId,
        scope: q.granularScope as any,
        identifier: q.granularIdentifier,
      });
      expect(liveEval.eligibility).toBe("ELIGIBLE");
      expect(liveEval.isEligibleForProduction).toBe(true);
    }

    // 6. Paper Validator confirms 100% compliance
    const valReport = PaperValidator.validatePaper(assembledPaper, mixedBlueprint);
    expect(valReport.isValid).toBe(true);
    expect(valReport.errors).toHaveLength(0);
  });

  // ==========================================================================
  // STEP 6B: PARENT/CHILD CONFLICT TESTING
  // An included child must NEVER revive an excluded parent.
  // ==========================================================================

  it("Step 6B - Rule 1: Chapter EXCLUDED + Topic INCLUDED => BLOCK", () => {
    const res = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-05-excluded",
      topicId: "top-5-nuclear",
    });
    expect(res.eligibility).toBe("EXCLUDED");
    expect(res.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
    expect(res.isEligibleForProduction).toBe(false);
  });

  it("Step 6B - Rule 2: Chapter EXCLUDED + Topic INCLUDED + Subtopic INCLUDED => BLOCK", () => {
    const res = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-05-excluded",
      topicId: "top-5-nuclear",
      scope: "SUBTOPIC",
      identifier: "Subtopic 5.1",
    });
    expect(res.eligibility).toBe("EXCLUDED");
    expect(res.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
    expect(res.isEligibleForProduction).toBe(false);
  });

  it("Step 6B - Rule 3: Topic EXCLUDED + Subtopic INCLUDED => BLOCK", () => {
    const res = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-02",
      topicId: "top-2-2-excluded",
      scope: "SUBTOPIC",
      identifier: "2.2.1",
    });
    expect(res.eligibility).toBe("EXCLUDED");
    expect(res.diagnosticCode).toBe("EXCLUDED_BY_TOPIC");
    expect(res.isEligibleForProduction).toBe(false);
  });

  it("Step 6B - Rule 4: Subtopic EXCLUDED => BLOCK", () => {
    const res = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "SUBTOPIC",
      identifier: "1.1.2",
    });
    expect(res.eligibility).toBe("EXCLUDED");
    expect(res.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    expect(res.isEligibleForProduction).toBe(false);
  });

  it("Step 6B - Rule 5: Heading EXCLUDED => BLOCK", () => {
    const res = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "HEADING",
      identifier: "Sec 1.3: Historical Systems",
    });
    expect(res.eligibility).toBe("EXCLUDED");
    expect(res.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    expect(res.isEligibleForProduction).toBe(false);
  });

  it("Step 6B - Rule 6: Exercise Question EXCLUDED => BLOCK", () => {
    const res = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      scope: "EXERCISE_QUESTION",
      identifier: "Ex 1.1 Q4",
    });
    expect(res.eligibility).toBe("EXCLUDED");
    expect(res.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");
    expect(res.isEligibleForProduction).toBe(false);
  });

  // ==========================================================================
  // STEP 6C: UNKNOWN / REVIEW SAFETY
  // UNKNOWN and REQUIRES_REVIEW are NEVER treated as eligible in production.
  // ==========================================================================

  it("Step 6C: UNKNOWN and REQUIRES_REVIEW are blocked across all pipeline stages", async () => {
    const syllabusWithReview = {
      ...masterSyllabus2025,
      id: "syl-review-test",
      chapterItems: [
        ...masterSyllabus2025.chapterItems,
        {
          chapterId: "chap-review",
          chapterTitle: "Fluid Mechanics",
          isIncluded: true,
          eligibility: "REQUIRES_REVIEW",
          weightage: 10,
        },
      ],
      topicItems: [
        ...masterSyllabus2025.topicItems,
        {
          topicId: "top-review",
          chapterId: "chap-review",
          topicTitle: "Bernoulli's Principle",
          isIncluded: true,
          eligibility: "REQUIRES_REVIEW",
          weightage: 10,
        },
      ],
    };

    // Stage 1: Deterministic Engine Check
    const unknownEval = EligibilityEngine.evaluateHierarchySync(syllabusWithReview, {
      chapterId: "chap-non-existent",
      topicId: "top-non-existent",
    });
    expect(unknownEval.eligibility).toBe("UNKNOWN");
    expect(unknownEval.isEligibleForProduction).toBe(false);

    const reviewEval = EligibilityEngine.evaluateHierarchySync(syllabusWithReview, {
      chapterId: "chap-review",
      topicId: "top-review",
    });
    expect(reviewEval.eligibility).toBe("REQUIRES_REVIEW");
    expect(reviewEval.isEligibleForProduction).toBe(false);

    // Stage 2: Retrieval Gate
    const chunks = [
      { id: "c-unk", chapterId: "chap-non-existent", topicId: "top-non-existent", content: "Unk" },
      { id: "c-rev", chapterId: "chap-review", topicId: "top-review", content: "Rev" },
    ];
    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(chunks, syllabusWithReview);
    expect(eligible).toHaveLength(0);
    expect(rejected).toHaveLength(2);

    // Stage 3: RAG Context Assembler
    const assembled = ContextAssembler.assembleContext(
      rejected.map((c) => ({
        chunk: c,
        finalScore: 0.9,
        explanation: { matchedTerms: [], rankingBoostsApplied: [], textRelevanceScore: 0.9, diversityScore: 1 },
      })) as any,
      syllabusWithReview,
      { provenanceRequired: true }
    );
    expect(assembled.items).toHaveLength(0);
    expect(assembled.rejectedProvenanceCount).toBe(2);

    // Stage 4: Blueprint Allocation
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: syllabusWithReview,
      totalMarks: 50,
    });
    const allocatedChaps = coverage.chapters.map((c) => c.chapterId);
    expect(allocatedChaps).not.toContain("chap-non-existent");
    expect(allocatedChaps).not.toContain("chap-review");

    // Stage 5: Question Generation Gate
    const gateUnk = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: syllabusWithReview },
      {
        id: "spec-unk",
        blueprintSlotId: "slot-unk",
        chapterId: "chap-non-existent",
        topicId: "top-non-existent",
        marks: 2,
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        requiredAnswerDepth: "BRIEF",
        requiredEvidenceCount: 1,
      } as any,
      {
        id: "slot-unk",
        chapterId: "chap-non-existent",
        topicId: "top-non-existent",
        marks: 2,
        questionType: "SHORT",
        targetDifficulty: "MEDIUM",
      }
    );
    expect(gateUnk.canGenerate).toBe(false);

    const gateRev = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: syllabusWithReview },
      {
        id: "spec-rev",
        blueprintSlotId: "slot-rev",
        chapterId: "chap-review",
        topicId: "top-review",
        marks: 2,
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        requiredAnswerDepth: "BRIEF",
        requiredEvidenceCount: 1,
      } as any,
      {
        id: "slot-rev",
        chapterId: "chap-review",
        topicId: "top-review",
        marks: 2,
        questionType: "SHORT",
        targetDifficulty: "MEDIUM",
      }
    );
    expect(gateRev.canGenerate).toBe(false);
  });

  // ==========================================================================
  // STEP 6D: UNRESOLVED MIXED-CHAPTER SAFETY
  // Content in mixed chapter without granular identifier => UNRESOLVED => BLOCKED
  // ==========================================================================

  it("Step 6D: Unresolved content in mixed chapter returns UNRESOLVED_IN_MIXED_CHAPTER and is blocked from production", async () => {
    // Topic 1.1 has granular exclusions (Imperial Units, Obsolete Systems, Ex 1.1 Q4)
    // When query omits identifier, the engine CANNOT assume it is included:
    const unresolvedEval = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-01",
      topicId: "top-1-1",
      // Scope and identifier intentionally omitted
    });
    expect(unresolvedEval.eligibility).toBe("REQUIRES_REVIEW");
    expect(unresolvedEval.diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");
    expect(unresolvedEval.isEligibleForProduction).toBe(false);

    // Retrieval Gate rejects ambiguous content
    const ambiguousChunk = {
      id: "chunk-ambiguous",
      chapterId: "chap-01",
      topicId: "top-1-1",
      content: "Measurement units must be clearly specified.",
      // identifier or heading omitted
    };
    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      [ambiguousChunk],
      masterSyllabus2025
    );
    expect(eligible).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");

    // Blueprint Slot Generator rejects slots with unresolved mixed topic without granular assignment
    const mockSlotAmbiguous: BlueprintQuestionSlot = {
      id: "slot-ambiguous",
      blueprintId: "bp-amb",
      sectionId: "sec-1",
      sectionName: "Section A",
      sequence: 1,
      questionType: "SHORT",
      marks: 2,
      targetDifficulty: "MEDIUM",
      chapterId: "chap-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-1-1",
      topicTitle: "Introduction to Physics",
      knowledgeType: "CONCEPTUAL",
      cognitiveLevel: "UNDERSTAND",
      requiredAnswerDepth: "BRIEF",
      optionalState: "COMPULSORY",
      retrievalRequirements: {
        chapterId: "chap-01",
        topicId: "top-1-1",
        knowledgeTypes: ["CONCEPTUAL"],
        questionType: "SHORT",
        difficulty: "MEDIUM",
        marks: 2,
      },
    };

    const mockBpAmbiguous: any = {
      id: "bp-amb",
      version: "v1.0",
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      totalMarks: 2,
      syllabusId: masterSyllabus2025.id,
      sections: [],
      slots: [mockSlotAmbiguous],
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 2, difficultMarks: 0 } },
      coverageAllocation: { chapters: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = BlueprintValidator.validateBlueprint(
      mockBpAmbiguous,
      masterSyllabus2025
    );
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes("UNRESOLVED_IN_MIXED_CHAPTER"))).toBe(true);
  });

  // ==========================================================================
  // STEP 6E: SYLLABUS VERSION ISOLATION
  // Cross-version eligibility leakage must be strictly ZERO.
  // ==========================================================================

  it("Step 6E: Topic valid in Version A is rejected when assembling paper under Version B, and reverse", async () => {
    // 1. Version A evaluation
    const evalA = EligibilityEngine.evaluateHierarchySync(syllabusVersionA, {
      chapterId: "chap-03",
      topicId: "top-3-2",
    });
    expect(evalA.eligibility).toBe("ELIGIBLE");
    expect(evalA.isEligibleForProduction).toBe(true);

    // 2. Version B evaluation
    const evalB = EligibilityEngine.evaluateHierarchySync(syllabusVersionB, {
      chapterId: "chap-03",
      topicId: "top-3-2",
    });
    expect(evalB.eligibility).toBe("EXCLUDED");
    expect(evalB.diagnosticCode).toBe("EXCLUDED_BY_TOPIC");
    expect(evalB.isEligibleForProduction).toBe(false);

    // 3. Question created and valid under Version A
    const bankItemGravitation: any = {
      id: "qb-grav-01",
      candidateId: "cand-grav-01",
      version: "1.0",
      historicalVersions: [],
      boardId: syllabusVersionB.boardId,
      academicYearId: syllabusVersionB.academicYearId,
      classId: syllabusVersionB.classId,
      subjectId: syllabusVersionB.subjectId,
      syllabusId: syllabusVersionB.id,
      syllabusVersion: syllabusVersionB.version,
      chapterId: "chap-03",
      chapterTitle: "Dynamics",
      topicId: "top-3-2",
      topicTitle: "Topic 3.2: Universal Gravitation",
      questionText: "State Newton's Law of Universal Gravitation.",
      questionType: "SHORT",
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      marks: 3,
      reviewState: "APPROVED",
      sourceProvenance: {
        curriculumCode: "2024-v1.0",
        eligibilityStatus: "ELIGIBLE",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Blueprint specifying Version B (where topic 3.2 is EXCLUDED)
    const bpVersionB: any = {
      id: "bp-v-b",
      version: "v2.0",
      boardId: syllabusVersionB.boardId,
      academicYearId: syllabusVersionB.academicYearId,
      classId: syllabusVersionB.classId,
      subjectId: syllabusVersionB.subjectId,
      syllabusId: syllabusVersionB.id,
      syllabus: syllabusVersionB,
      title: "Version B Exam",
      totalMarks: 3,
      durationMinutes: 30,
      language: "en",
      status: "APPROVED",
      sections: [
        {
          id: "sec-1",
          blueprintId: "bp-v-b",
          sectionName: "Section A",
          sectionOrder: 1,
          questionCount: 1,
          marksPerQuestion: 3,
          totalMarks: 3,
          displayedMarks: 3,
          attemptableMarks: 3,
          maximumObtainableMarks: 3,
          questionTypes: ["SHORT"],
          choiceRule: { type: "NO_CHOICE" },
        },
      ],
      slots: [
        {
          id: "slot-1",
          blueprintId: "bp-v-b",
          sectionId: "sec-1",
          sectionName: "Section A",
          sequence: 1,
          questionType: "SHORT",
          marks: 3,
          targetDifficulty: "MEDIUM",
          chapterId: "chap-03",
          chapterTitle: "Dynamics",
          topicId: "top-3-2",
          topicTitle: "Topic 3.2: Universal Gravitation",
          knowledgeType: "CONCEPTUAL",
          cognitiveLevel: "UNDERSTAND",
          requiredAnswerDepth: "BRIEF",
          optionalState: "COMPULSORY",
          retrievalRequirements: { chapterId: "chap-03", topicId: "top-3-2", marks: 3, questionType: "SHORT" },
        },
      ],
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 3, difficultMarks: 0 } },
      coverageAllocation: { chapters: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await BlueprintRepository.saveBlueprint(bpVersionB);
    await QuestionBankRepository.saveBankItem(bankItemGravitation);

    // Paper assembly under Version B MUST reject the question
    await expect(
      PaperAssemblyService.assemblePaper(bpVersionB.id, { actorId: "admin" })
    ).rejects.toThrow("INSUFFICIENT_APPROVED_QUESTION_BANK");

    // Reverse Scenario: Assemble paper under Version A where topic 3.2 is INCLUDED
    const bpVersionA: any = {
      ...bpVersionB,
      id: "bp-v-a",
      syllabusId: syllabusVersionA.id,
      syllabus: syllabusVersionA,
    };
    const bankItemVersionA: QuestionBankItem = {
      ...bankItemGravitation,
      id: "qb-grav-v-a",
      syllabusId: syllabusVersionA.id,
      syllabusVersion: syllabusVersionA.version,
    };
    await BlueprintRepository.saveBlueprint(bpVersionA);
    await QuestionBankRepository.saveBankItem(bankItemVersionA);
    const paperA = await PaperAssemblyService.assemblePaper(bpVersionA.id, {
      actorId: "admin",
    });
    expect(paperA).toBeDefined();
    expect(paperA.questions).toHaveLength(1);
    expect(paperA.questions[0].topicId).toBe("top-3-2");
  });

  // ==========================================================================
  // STEP 6F: LEGACY COMPATIBILITY
  // Syllabi without granular records continue working without issue.
  // ==========================================================================

  it("Step 6F: Legacy syllabus with no granular records works seamlessly under Granular Absence Rule", async () => {
    // Chapter 4 (Turn of Forces) has topic top-4-legacy with NO granular items
    const evalLegacy = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: "chap-04-legacy",
      topicId: "top-4-legacy",
    });
    expect(evalLegacy.eligibility).toBe("ELIGIBLE");
    expect(evalLegacy.diagnosticCode).toBe("ELIGIBLE");
    expect(evalLegacy.isEligibleForProduction).toBe(true);

    // Blueprint coverage allocates legacy chapter and topic normally
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 20,
      requestedChapterRequirements: { "chap-04-legacy": 20 },
    });
    const legacyChap = coverage.chapters.find((c) => c.chapterId === "chap-04-legacy");
    expect(legacyChap).toBeDefined();
    expect(legacyChap!.topicAllocations[0].topicId).toBe("top-4-legacy");

    // Retrieval returns candidate for legacy topic
    const candidateChunks = [
      {
        id: "chunk-torque-01",
        chapterId: "chap-04-legacy",
        topicId: "top-4-legacy",
        title: "Principle of Moments",
        content: "In equilibrium, the sum of clockwise moments equals counterclockwise moments.",
        confidence: 0.95,
      },
    ];
    const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
      candidateChunks,
      masterSyllabus2025
    );
    expect(eligible).toHaveLength(1);
    expect(rejected).toHaveLength(0);
    expect(eligible[0].eligibilityStatus).toBe("ELIGIBLE");
  });

  // ==========================================================================
  // STEP 6G: COMPLETE RETRIEVAL -> GENERATION -> PAPER PIPELINE
  // Full Golden Flow: Query -> Retrieval -> Context -> Blueprint -> Gen ->
  // Provenance -> Validation -> Bank -> Assembly -> Final Paper
  // ==========================================================================

  it("Step 6G: Complete end-to-end golden flow succeeds for eligible content and strictly halts at every step for excluded content", async () => {
    // ------------------------------------------------------------------------
    // Part 1: Eligible Golden Path
    // ------------------------------------------------------------------------
    const elChapterId = "chap-01";
    const elTopicId = "top-1-1";
    const elScope = "SUBTOPIC" as const;
    const elIdentifier = "1.1.1";

    // 1. Query for eligible content
    const elRetrievalRequest: RetrievalRequest = {
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      syllabusId: masterSyllabus2025.id,
      chapterId: elChapterId,
      topicId: elTopicId,
      query: "Explain SI base units and derived units",
    };

    const elChunk = {
      id: "chunk-si-01",
      documentId: "doc-phy-9",
      bookId: "book-phy-9",
      bookTitle: "Physics Grade 9",
      chapterId: elChapterId,
      chapterNumber: 1,
      chapterTitle: "Physical Quantities",
      topicId: elTopicId,
      topicTitle: "Introduction to Physics",
      heading: "Section 1.1",
      chunkType: "CONCEPT",
      scope: elScope,
      identifier: elIdentifier,
      title: "SI Base Units",
      content: "The International System of Units specifies seven fundamental base units.",
      confidence: 0.98,
      tokenCount: 50,
      pageNumber: 5,
    };

    // 2. Retrieval returns only eligible content
    const elRetrievalPkg = await RetrievalService.retrieveKnowledge(elRetrievalRequest, {
      syntheticCandidates: [elChunk],
    });
    expect(elRetrievalPkg.results.length).toBeGreaterThan(0);
    expect(elRetrievalPkg.results[0].productionEligible).toBe(true);

    // 3. Context assembler receives only eligible content
    const elContextPkg = ContextAssembler.assembleContext(
      [
        {
          chunk: elChunk,
          finalScore: 0.95,
          explanation: {
            matchedTerms: [],
            rankingBoostsApplied: [],
            textRelevanceScore: 0.95,
            diversityScore: 1,
          },
        },
      ] as any,
      masterSyllabus2025,
      { provenanceRequired: true }
    );
    expect(elContextPkg.items).toHaveLength(1);
    expect(elContextPkg.items[0].provenance.eligibilityStatus).toBe("ELIGIBLE");

    // 4. Blueprint allocates eligible content
    const { coverage: elCoverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: masterSyllabus2025,
      totalMarks: 4,
      requestedChapterRequirements: { [elChapterId]: 4 },
    });
    const elSections: BlueprintSection[] = [
      {
        id: "sec-el-1",
        blueprintId: "bp-golden",
        sectionName: "Section A",
        sectionOrder: 1,
        questionCount: 1,
        marksPerQuestion: 4,
        totalMarks: 4,
        displayedMarks: 4,
        attemptableMarks: 4,
        maximumObtainableMarks: 4,
        questionTypes: ["SHORT"],
        choiceRule: { type: "NO_CHOICE" },
      },
    ];
    const elSlots = BlueprintSlotGenerator.generateSlots({
      blueprintId: "bp-golden",
      sections: elSections,
      chapterAllocations: elCoverage.chapters,
    });
    expect(elSlots).toHaveLength(1);

    // 5. Question specification and generation uses eligible source context
    const elSlot = elSlots[0];
    const elSpec = QuestionIntelligenceEngine.createSpecification(elSlot);
    expect(elSpec.chapterId).toBe(elChapterId);
    expect(elSpec.topicId).toBe(elTopicId);

    const elGate = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: masterSyllabus2025 },
      elSpec,
      elSlot
    );
    expect(elGate.canGenerate).toBe(true);
    expect(elGate.contentEligibility).toBe("ELIGIBLE");

    // 6. Generated question receives correct provenance
    const elCandidate: any = {
      id: "cand-el-si-01",
      blueprintSlotId: elSlot.id,
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      syllabusId: masterSyllabus2025.id,
      syllabusVersion: masterSyllabus2025.version,
      questionText: "List three SI base quantities and their corresponding standard units.",
      questionType: elSlot.questionType,
      difficulty: elSlot.targetDifficulty,
      cognitiveLevel: elSlot.cognitiveLevel,
      marks: elSlot.marks,
      chapterId: elSlot.chapterId,
      chapterTitle: elSlot.chapterTitle,
      topicId: elSlot.topicId,
      topicTitle: elSlot.topicTitle,
      granularItemId: elSlot.granularItemId || "gi-1-1-sub-si",
      granularScope: elSlot.granularScope || elScope,
      granularIdentifier: elSlot.granularIdentifier || elIdentifier,
      status: "GENERATED",
      provenance: {
        sourceChunkIds: [elChunk.id],
        chunkTitles: [elChunk.title],
        bookId: elChunk.bookId,
        granularItemId: "gi-1-1-sub-si",
        granularScope: elScope,
        granularIdentifier: elIdentifier,
        eligibilityStatus: "ELIGIBLE",
        confidenceScore: 0.95,
      },
      evaluationReport: {
        isCurriculumAligned: true,
        pedagogicalScore: 90,
        alignmentNotes: "Excellent",
        strengths: ["Clear"],
        weaknesses: [],
        suggestions: [],
      },
      reviewNotes: [],
      suggestedReviewers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 7. Question passes final eligibility validation
    const elFinalEval = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: elCandidate.chapterId,
      topicId: elCandidate.topicId,
      scope: elCandidate.granularScope as any,
      identifier: elCandidate.granularIdentifier,
    });
    expect(elFinalEval.eligibility).toBe("ELIGIBLE");
    expect(elFinalEval.isEligibleForProduction).toBe(true);

    // 8. Question enters Question Bank
    await QuestionBankRepository.saveCandidate(elCandidate);
    const elBankItem = await QuestionGenerationService.approveCandidate(
      elCandidate.id,
      "admin-lead"
    );
    expect(elBankItem.reviewState).toBe("APPROVED");
    expect(elBankItem.sourceProvenance?.eligibilityStatus).toBe("ELIGIBLE");

    // 9. Paper assembly selects it
    const elBlueprint: any = {
      id: "bp-golden",
      version: "v1.0",
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      syllabusId: masterSyllabus2025.id,
      syllabus: masterSyllabus2025,
      title: "Golden Path Examination",
      totalMarks: 4,
      durationMinutes: 30,
      language: "en",
      status: "APPROVED",
      sections: elSections,
      slots: elSlots,
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 4, difficultMarks: 0 } },
      coverageAllocation: elCoverage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await BlueprintRepository.saveBlueprint(elBlueprint);
    await QuestionBankRepository.saveBankItem(elBankItem);

    const finalPaper = await PaperAssemblyService.assemblePaper(elBlueprint.id, {
      actorId: "admin-lead",
    });

    // 10. Final paper contains it and passes validation
    expect(finalPaper.questions).toHaveLength(1);
    expect(finalPaper.questions[0].questionBankItemId).toBe(elBankItem.id);
    expect(finalPaper.questions[0].provenance.eligibilityStatus).toBe("ELIGIBLE");

    const finalValReport = PaperValidator.validatePaper(finalPaper, elBlueprint);
    expect(finalValReport.isValid).toBe(true);
    expect(finalValReport.errors).toHaveLength(0);

    // ------------------------------------------------------------------------
    // Part 2: Excluded Path — Blocked at EVERY single step
    // ------------------------------------------------------------------------
    const exChapterId = "chap-01";
    const exTopicId = "top-1-1";
    const exScope = "SUBTOPIC" as const;
    const exIdentifier = "1.1.2"; // Imperial Foot-Pound System (EXCLUDED)

    // Step 2 blocked: Retrieval Gate rejects chunk
    const exChunk = {
      id: "chunk-imperial-01",
      documentId: "doc-phy-9",
      bookId: "book-phy-9",
      chapterId: exChapterId,
      topicId: exTopicId,
      scope: exScope,
      identifier: exIdentifier,
      title: "Imperial Units",
      content: "The foot-pound-second system was widely used historically.",
      confidence: 0.9,
    };
    const { eligible: exEligible, rejected: exRejected } = await SyllabusGate.filterEligibleChunks(
      [exChunk],
      masterSyllabus2025
    );
    expect(exEligible).toHaveLength(0);
    expect(exRejected).toHaveLength(1);

    // Step 3 blocked: Context assembler rejects excluded provenance
    const exContextPkg = ContextAssembler.assembleContext(
      [
        {
          chunk: exRejected[0],
          finalScore: 0.9,
          explanation: {
            matchedTerms: [],
            rankingBoostsApplied: [],
            textRelevanceScore: 0.9,
            diversityScore: 0,
          },
        },
      ] as any,
      masterSyllabus2025,
      { provenanceRequired: true }
    );
    expect(exContextPkg.items).toHaveLength(0);
    expect(exContextPkg.rejectedProvenanceCount).toBe(1);

    // Step 4 blocked: Blueprint coverage allocation excludes it
    const exGranulars = elCoverage.chapters[0].topicAllocations[0].granularAllocations || [];
    expect(exGranulars.some((g) => g.identifier === exIdentifier)).toBe(false);

    // Step 5 blocked: Question generation gate blocks excluded coordinates
    const exGate = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: masterSyllabus2025 },
      {
        id: "spec-ex",
        blueprintSlotId: "slot-ex",
        chapterId: exChapterId,
        topicId: exTopicId,
        granularScope: exScope,
        granularIdentifier: exIdentifier,
        marks: 4,
        questionType: "SHORT",
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        requiredEvidenceCount: 1,
      } as any,
      {
        id: "slot-ex",
        chapterId: exChapterId,
        topicId: exTopicId,
        granularScope: exScope,
        granularIdentifier: exIdentifier,
        marks: 4,
        questionType: "SHORT",
        targetDifficulty: "MEDIUM",
      } as any
    );
    expect(exGate.canGenerate).toBe(false);
    expect(exGate.contentEligibility).toBe("EXCLUDED");

    // Step 7 blocked: Final eligibility validation returns EXCLUDED
    const exFinalEval = EligibilityEngine.evaluateHierarchySync(masterSyllabus2025, {
      chapterId: exChapterId,
      topicId: exTopicId,
      scope: exScope,
      identifier: exIdentifier,
    });
    expect(exFinalEval.eligibility).toBe("EXCLUDED");
    expect(exFinalEval.isEligibleForProduction).toBe(false);

    // Step 8 blocked: Question approval into Question Bank is rejected
    const exCandidate: any = {
      id: "cand-ex-imperial-01",
      blueprintSlotId: "slot-ex",
      questionText: "Define the foot-pound-second system.",
      questionType: "SHORT",
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      marks: 4,
      chapterId: exChapterId,
      topicId: exTopicId,
      syllabusId: masterSyllabus2025.id,
      granularItemId: "gi-1-1-sub-imperial",
      granularScope: exScope,
      granularIdentifier: exIdentifier,
      status: "GENERATED",
      provenance: {
        sourceChunkIds: [exChunk.id],
        chunkTitles: [exChunk.title],
        bookId: exChunk.bookId,
        syllabusId: masterSyllabus2025.id,
        granularItemId: "gi-1-1-sub-imperial",
        granularScope: exScope,
        granularIdentifier: exIdentifier,
        eligibilityStatus: "EXCLUDED",
        confidenceScore: 0.9,
      },
      evaluationReport: {
        isCurriculumAligned: false,
        pedagogicalScore: 30,
        alignmentNotes: "Excluded content",
        strengths: [],
        weaknesses: ["Curriculum violation"],
        suggestions: [],
      },
      reviewNotes: [],
      suggestedReviewers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await QuestionBankRepository.saveCandidate(exCandidate);
    await expect(
      QuestionGenerationService.approveCandidate(
        exCandidate.id,
        "admin"
      )
    ).rejects.toThrow("CANNOT_APPROVE_INELIGIBLE_CANDIDATE");

    // Step 9 & 10 blocked: Paper assembly rejects question bank item even if spoofed
    const fakeExBankItem: any = {
      id: "qb-fake-ex-01",
      candidateId: exCandidate.id,
      version: "1.0",
      historicalVersions: [],
      boardId: masterSyllabus2025.boardId,
      academicYearId: masterSyllabus2025.academicYearId,
      classId: masterSyllabus2025.classId,
      subjectId: masterSyllabus2025.subjectId,
      syllabusId: masterSyllabus2025.id,
      syllabusVersion: masterSyllabus2025.version,
      blueprintSlotId: elSlot.id,
      questionText: exCandidate.questionText,
      questionType: "SHORT",
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      marks: 4,
      chapterId: exChapterId,
      topicId: exTopicId,
      reviewState: "APPROVED",
      sourceProvenance: {
        granularScope: exScope,
        granularIdentifier: exIdentifier,
        eligibilityStatus: "EXCLUDED",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save spoofed bank item
    await QuestionBankRepository.saveBankItem(fakeExBankItem);

    // Clear the eligible item from bank to force assembly on slot
    QuestionBankRepository.resetMemory();
    await QuestionBankRepository.saveBankItem(fakeExBankItem);

    await expect(
      PaperAssemblyService.assemblePaper(elBlueprint.id, { actorId: "admin" })
    ).rejects.toThrow("INSUFFICIENT_APPROVED_QUESTION_BANK");
  });
});

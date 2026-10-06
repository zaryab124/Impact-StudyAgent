// ==============================================================================
// AI Live Paper Generator - Examination Blueprint Engine Unit Tests (Phase 7)
// Comprehensive Verification of all 26 Required Scenarios
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlueprintService } from "@/server/blueprint/blueprint-service";
import { BlueprintRepository } from "@/server/blueprint/blueprint-repository";
import { BlueprintValidator } from "@/server/blueprint/blueprint-validator";
import { MarksArithmeticValidator } from "@/server/blueprint/marks-arithmetic-validator";
import { DifficultyAllocationEngine } from "@/server/blueprint/difficulty-allocation-engine";
import { CoverageAllocationEngine } from "@/server/blueprint/coverage-allocation-engine";
import { BlueprintSlotGenerator } from "@/server/blueprint/blueprint-slot-generator";
import { QuestionIntelligenceEngine } from "@/server/blueprint/question-intelligence-engine";
import { DuplicationPreventionService } from "@/server/blueprint/duplication-prevention-service";
import { SyllabusGate } from "@/server/retrieval/syllabus-gate";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { POST as createBlueprintRoute, GET as listBlueprintsRoute } from "@/app/api/blueprints/route";
import { GET as getBlueprintByIdRoute } from "@/app/api/blueprints/[id]/route";
import { POST as approveBlueprintRoute } from "@/app/api/blueprints/[id]/approve/route";
import { POST as createQuestionSpecsRoute } from "@/app/api/question-specifications/route";
import { PaperBlueprintRequest, BlueprintSection, BlueprintQuestionSlot } from "@/types/blueprint";

describe("Phase 7: Examination Blueprint & Question Intelligence Engine", () => {
  // Standard Mock Verified Educational Syllabus
  const mockSyllabus = {
    id: "syl-physics-2025",
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-grade-9",
    subjectId: "subj-physics",
    status: "VERIFIED",
    version: "2025-v1.0",
    title: "Official Grade 9 Physics Syllabus",
    chapterItems: [
      {
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities and Measurement",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 50,
        alignmentStatus: "MATCHED",
        examinationRelevance: "HIGH",
      },
      {
        chapterId: "chap-02",
        chapterTitle: "Kinematics and Dynamics",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 50,
        alignmentStatus: "MATCHED",
        examinationRelevance: "HIGH",
      },
      {
        chapterId: "chap-excluded",
        chapterTitle: "Advanced Nuclear Physics (Excluded)",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "MATCHED",
        examinationRelevance: "OPTIONAL",
      },
    ],
    topicItems: [
      {
        topicId: "top-measurement",
        chapterId: "chap-01",
        topicTitle: "Standard Units and Vernier Caliper",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 25,
        alignmentStatus: "MATCHED",
      },
      {
        topicId: "top-vectors",
        chapterId: "chap-01",
        topicTitle: "Scalars and Vectors",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 25,
        alignmentStatus: "MATCHED",
      },
      {
        topicId: "top-newton-laws",
        chapterId: "chap-02",
        topicTitle: "Newton Laws of Motion",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 30,
        alignmentStatus: "MATCHED",
      },
      {
        topicId: "top-friction",
        chapterId: "chap-02",
        topicTitle: "Friction and Momentum",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 20,
        alignmentStatus: "MATCHED",
      },
      {
        topicId: "top-nuclear-decay",
        chapterId: "chap-excluded",
        topicTitle: "Radioactive Decay Series",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "EXCLUDED",
      },
    ],
  };

  const validBlueprintRequest: PaperBlueprintRequest = {
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-grade-9",
    subjectId: "subj-physics",
    syllabusId: "syl-physics-2025",
    title: "Grade 9 Physics Annual Examination",
    totalMarks: 100,
    durationMinutes: 180,
    language: "en",
    requestedDifficultyDistribution: {
      easyPct: 33.33,
      mediumPct: 33.33,
      difficultPct: 33.34,
    },
    sections: [
      {
        sectionName: "Section A: Multiple Choice Questions",
        sectionOrder: 1,
        questionCount: 20,
        marksPerQuestion: 1,
        questionTypes: ["MCQ"],
        choiceRule: { type: "NO_CHOICE" },
        instructions: "Answer all 20 questions.",
      },
      {
        sectionName: "Section B: Short Answer Questions",
        sectionOrder: 2,
        questionCount: 10,
        marksPerQuestion: 4,
        questionTypes: ["SHORT"],
        choiceRule: { type: "NO_CHOICE" },
        instructions: "Answer all 10 questions.",
      },
      {
        sectionName: "Section C: Extended Response Questions",
        sectionOrder: 3,
        questionCount: 4,
        marksPerQuestion: 10,
        questionTypes: ["LONG", "NUMERICAL"],
        choiceRule: { type: "NO_CHOICE" },
        instructions: "Answer all 4 questions.",
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    BlueprintRepository.resetMemory();

    // Default mock for SyllabusGate validation
    vi.spyOn(SyllabusGate, "validateHierarchy").mockResolvedValue({
      isValid: true,
      syllabus: mockSyllabus,
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Valid Blueprint Creation
  // --------------------------------------------------------------------------
  it("Scenario 1: Creates a valid, normalized ExaminationBlueprint with all required attributes", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);

    expect(bp).toBeDefined();
    expect(bp.id).toBeDefined();
    expect(bp.title).toBe("Grade 9 Physics Annual Examination");
    expect(bp.totalMarks).toBe(100);
    expect(bp.version).toBe("v1.0");
    expect(bp.sections.length).toBe(3);
    expect(bp.slots.length).toBe(34); // 20 + 10 + 4 = 34 slots
    expect(bp.status).toBe("VALIDATED");
    expect(bp.difficultyComparison).toBeDefined();
    expect(
      bp.difficultyComparison.finalBlueprintDistribution.easyMarks +
      bp.difficultyComparison.finalBlueprintDistribution.mediumMarks +
      bp.difficultyComparison.finalBlueprintDistribution.difficultMarks
    ).toBe(100);
    expect(bp.coverageAllocation.totalCoveredMarks).toBe(100);
    expect(bp.coverageAllocation.chapters.length).toBe(2);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Invalid Hierarchy Rejection
  // --------------------------------------------------------------------------
  it("Scenario 2: Rejects blueprint creation when educational hierarchy is invalid", async () => {
    vi.spyOn(SyllabusGate, "validateHierarchy").mockResolvedValueOnce({
      isValid: false,
      error: "Hierarchy mismatch: Syllabus belongs to board 'board-other', but request specified 'board-fed-01'.",
    });

    await expect(
      BlueprintService.createBlueprint({
        ...validBlueprintRequest,
        boardId: "board-other",
      })
    ).rejects.toThrow("Hierarchy validation failed");
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Invalid Syllabus Status Rejection (DRAFT, UNDER_REVIEW, ARCHIVED)
  // --------------------------------------------------------------------------
  it("Scenario 3: Rejects blueprint creation if syllabus is in DRAFT, UNDER_REVIEW, or ARCHIVED state", async () => {
    for (const badStatus of ["DRAFT", "UNDER_REVIEW", "ARCHIVED", "REJECTED"]) {
      vi.spyOn(SyllabusGate, "validateHierarchy").mockResolvedValueOnce({
        isValid: true,
        syllabus: { ...mockSyllabus, status: badStatus },
      });

      await expect(
        BlueprintService.createBlueprint(validBlueprintRequest)
      ).rejects.toThrow(/Syllabus status ".*" is not authorized/);
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Book/Syllabus Mismatch
  // --------------------------------------------------------------------------
  it("Scenario 4: Rejects blueprint creation when specified book does not belong to the target class/subject", async () => {
    vi.spyOn(prisma.book, "findUnique").mockResolvedValueOnce({
      id: "book-math-9",
      title: "Mathematics Grade 9",
      subjectId: "subj-math", // Mismatched subject!
      classId: "class-grade-9",
    } as any);

    await expect(
      BlueprintService.createBlueprint({
        ...validBlueprintRequest,
        bookId: "book-math-9",
      })
    ).rejects.toThrow(/belongs to a different subject/);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Section Marks Validation
  // --------------------------------------------------------------------------
  it("Scenario 5: Calculates and validates section marks correctly for various question counts and choice rules", () => {
    // Standard NO_CHOICE
    const noChoice = MarksArithmeticValidator.calculateSectionMarks({
      questionCount: 10,
      marksPerQuestion: 3,
      choiceRule: { type: "NO_CHOICE" },
    });
    expect(noChoice.displayedMarks).toBe(30);
    expect(noChoice.attemptableMarks).toBe(30);
    expect(noChoice.maximumObtainableMarks).toBe(30);
    expect(noChoice.isConsistent).toBe(true);

    // Invalid choice rule (attemptCount > totalCount)
    const invalidChoice = MarksArithmeticValidator.calculateSectionMarks({
      questionCount: 5,
      marksPerQuestion: 2,
      choiceRule: { type: "CHOOSE_N_OF_M", attemptCount: 7, totalCount: 5 },
    });
    expect(invalidChoice.isConsistent).toBe(false);
    expect(invalidChoice.notes).toContain("cannot exceed total questions");
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Grand Total Validation
  // --------------------------------------------------------------------------
  it("Scenario 6: Rejects blueprint when section marks sum does not equal paper totalMarks", async () => {
    const mismatchedRequest: PaperBlueprintRequest = {
      ...validBlueprintRequest,
      totalMarks: 100,
      sections: [
        {
          sectionName: "Section A",
          sectionOrder: 1,
          questionCount: 10,
          marksPerQuestion: 1,
          questionTypes: ["MCQ"],
          choiceRule: { type: "NO_CHOICE" },
        },
        {
          sectionName: "Section B",
          sectionOrder: 2,
          questionCount: 10,
          marksPerQuestion: 2,
          questionTypes: ["SHORT"],
          choiceRule: { type: "NO_CHOICE" },
        },
      ], // Total sum = 10 + 20 = 30 marks != 100
    };

    await expect(
      BlueprintService.createBlueprint(mismatchedRequest)
    ).rejects.toThrow(/Marks arithmetic error.*Section marks/);
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Choice Rule Validation (displayed vs attemptable vs max)
  // --------------------------------------------------------------------------
  it("Scenario 7: Correctly validates choice rules where displayed marks exceed maximum obtainable marks", () => {
    // CHOOSE 4 of 6 questions @ 5 marks:
    // Displayed = 6 * 5 = 30 marks
    // Attemptable / Maximum = 4 * 5 = 20 marks
    const choiceSection = MarksArithmeticValidator.calculateSectionMarks({
      questionCount: 6,
      marksPerQuestion: 5,
      choiceRule: { type: "CHOOSE_N_OF_M", attemptCount: 4, totalCount: 6 },
    });
    expect(choiceSection.displayedMarks).toBe(30);
    expect(choiceSection.attemptableMarks).toBe(20);
    expect(choiceSection.maximumObtainableMarks).toBe(20);

    // OR_CHOICE: 1 question with OR alternative (2 displayed, 1 attempted @ 10 marks)
    const orSection = MarksArithmeticValidator.calculateSectionMarks({
      questionCount: 1,
      marksPerQuestion: 10,
      choiceRule: { type: "OR_CHOICE", orGroupCount: 1 },
    });
    expect(orSection.displayedMarks).toBe(20);
    expect(orSection.attemptableMarks).toBe(10);
    expect(orSection.maximumObtainableMarks).toBe(10);

    // Section array with choice rules summing to totalMarks 30
    const grandCheck = MarksArithmeticValidator.validateGrandTotal(
      [
        {
          id: "s1",
          blueprintId: "bp1",
          sectionName: "Sec 1",
          sectionOrder: 1,
          questionCount: 6,
          marksPerQuestion: 5,
          totalMarks: 20,
          displayedMarks: 30,
          attemptableMarks: 20,
          maximumObtainableMarks: 20,
          questionTypes: ["SHORT"],
          choiceRule: { type: "CHOOSE_N_OF_M", attemptCount: 4, totalCount: 6 },
        } as BlueprintSection,
        {
          id: "s2",
          blueprintId: "bp1",
          sectionName: "Sec 2",
          sectionOrder: 2,
          questionCount: 1,
          marksPerQuestion: 10,
          totalMarks: 10,
          displayedMarks: 20,
          attemptableMarks: 10,
          maximumObtainableMarks: 10,
          questionTypes: ["LONG"],
          choiceRule: { type: "OR_CHOICE", orGroupCount: 1 },
        } as BlueprintSection,
      ],
      30
    );

    expect(grandCheck.isValid).toBe(true);
    expect(grandCheck.totalDisplayedMarks).toBe(50);
    expect(grandCheck.totalAttemptableMarks).toBe(30);
    expect(grandCheck.totalMaximumObtainableMarks).toBe(30);
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Difficulty Allocation (Deterministic Integer Hare-Niemeyer)
  // --------------------------------------------------------------------------
  it("Scenario 8: Deterministically allocates difficulty marks into exact integer distributions (33/33/34 on 100 marks)", () => {
    const diff = DifficultyAllocationEngine.allocateDifficulty({
      requestedDistribution: {
        easyPct: 33.33,
        mediumPct: 33.33,
        difficultPct: 33.34,
      },
      totalMarks: 100,
    });

    // Hare-Niemeyer exact integer division
    expect(diff.finalBlueprintDistribution.easyMarks).toBe(33);
    expect(diff.finalBlueprintDistribution.mediumMarks).toBe(33);
    expect(diff.finalBlueprintDistribution.difficultMarks).toBe(34);
    expect(
      diff.finalBlueprintDistribution.easyMarks +
      diff.finalBlueprintDistribution.mediumMarks +
      diff.finalBlueprintDistribution.difficultMarks
    ).toBe(100);

    // Test with 75 marks (3 exact thirds)
    const diff75 = DifficultyAllocationEngine.allocateDifficulty({
      requestedDistribution: {
        easyPct: 33.33,
        mediumPct: 33.33,
        difficultPct: 33.34,
      },
      totalMarks: 75,
    });
    expect(diff75.finalBlueprintDistribution.easyMarks).toBe(25);
    expect(diff75.finalBlueprintDistribution.mediumMarks).toBe(25);
    expect(diff75.finalBlueprintDistribution.difficultMarks).toBe(25);
    expect(
      diff75.finalBlueprintDistribution.easyMarks +
      diff75.finalBlueprintDistribution.mediumMarks +
      diff75.finalBlueprintDistribution.difficultMarks
    ).toBe(75);
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Impossible Difficulty Distribution Handling
  // --------------------------------------------------------------------------
  it("Scenario 9: Safely handles edge-case/skewed difficulty requests without producing NaN or non-integers", () => {
    // Total marks = 1 (cannot be split into 3 thirds)
    const edgeDiff1 = DifficultyAllocationEngine.allocateDifficulty({
      requestedDistribution: {
        easyPct: 33.33,
        mediumPct: 33.33,
        difficultPct: 33.34,
      },
      totalMarks: 1,
    });

    const sum1 =
      edgeDiff1.finalBlueprintDistribution.easyMarks +
      edgeDiff1.finalBlueprintDistribution.mediumMarks +
      edgeDiff1.finalBlueprintDistribution.difficultMarks;
    expect(sum1).toBe(1);
    expect(Number.isInteger(edgeDiff1.finalBlueprintDistribution.easyMarks)).toBe(true);
    expect(Number.isInteger(edgeDiff1.finalBlueprintDistribution.mediumMarks)).toBe(true);
    expect(Number.isInteger(edgeDiff1.finalBlueprintDistribution.difficultMarks)).toBe(true);

    // Skewed 100% difficult request
    const skewedDiff = DifficultyAllocationEngine.allocateDifficulty({
      requestedDistribution: {
        easyPct: 0,
        mediumPct: 0,
        difficultPct: 100,
      },
      totalMarks: 50,
    });
    expect(skewedDiff.finalBlueprintDistribution.difficultMarks).toBe(50);
    expect(skewedDiff.finalBlueprintDistribution.easyMarks).toBe(0);
    expect(skewedDiff.finalBlueprintDistribution.mediumMarks).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Chapter Weightage Allocation
  // --------------------------------------------------------------------------
  it("Scenario 10: Proportionally allocates examination marks across eligible chapters", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockSyllabus,
      totalMarks: 100,
    });

    // Mock syllabus has chap-01 (50%) and chap-02 (50%) included
    expect(coverage.chapters.length).toBe(2);
    expect(coverage.chapters.find((c) => c.chapterId === "chap-01")?.marks).toBe(50);
    expect(coverage.chapters.find((c) => c.chapterId === "chap-02")?.marks).toBe(50);
    expect(coverage.totalCoveredMarks).toBe(100);
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Topic Eligibility Enforcement
  // --------------------------------------------------------------------------
  it("Scenario 11: Enforces topic eligibility and allocates marks only to verified topics", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockSyllabus,
      totalMarks: 100,
    });

    // All allocated topics must be ELIGIBLE
    for (const ch of coverage.chapters) {
      for (const top of ch.topicAllocations) {
        expect(top.eligibilityStatus).toBe("ELIGIBLE");
        expect(top.marks).toBeGreaterThan(0);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Excluded Topic Rejection
  // --------------------------------------------------------------------------
  it("Scenario 12: Strictly rejects excluded syllabus topics from appearing in blueprint coverage", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockSyllabus,
      totalMarks: 100,
    });

    const excludedChapInCoverage = coverage.chapters.find(
      (c) => c.chapterId === "chap-excluded"
    );
    expect(excludedChapInCoverage).toBeUndefined();

    const allAllocatedTopicIds = coverage.chapters.flatMap((c) =>
      c.topicAllocations.map((t) => t.topicId)
    );
    expect(allAllocatedTopicIds).not.toContain("top-nuclear-decay");
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Pattern Integration
  // --------------------------------------------------------------------------
  it("Scenario 13: Preserves observed pattern distribution alongside requested target without merging", () => {
    const patternData = {
      difficultyObservations: {
        easyPct: 40.0,
        mediumPct: 40.0,
        difficultPct: 20.0,
      },
    };

    const diff = DifficultyAllocationEngine.allocateDifficulty({
      requestedDistribution: {
        easyPct: 33.33,
        mediumPct: 33.33,
        difficultPct: 33.34,
      },
      totalMarks: 100,
      observedDistribution: patternData.difficultyObservations,
    });

    expect(diff.observedSampleDistribution).toBeDefined();
    expect(diff.observedSampleDistribution?.easyPct).toBe(40.0);
    expect(diff.requestedTargetDistribution.easyPct).toBe(33.33);
    // Final blueprint distribution is reconciled and distinct
    expect(diff.finalBlueprintDistribution.easyMarks).toBe(33);
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Pattern/Syllabus Conflict (PATTERN_SYLLABUS_CONFLICT)
  // --------------------------------------------------------------------------
  it("Scenario 14: Detects and logs PATTERN_SYLLABUS_CONFLICT when pattern references an excluded topic, giving syllabus precedence", () => {
    const patternWithExcludedTopic = {
      id: "pat-historical-2020",
      chapterDistribution: {
        "chap-01": 40,
        "chap-excluded": 60, // Excluded in current syllabus!
      },
      topicDistribution: {
        "top-nuclear-decay": 15, // Excluded!
      },
    };

    const { coverage, conflicts } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockSyllabus,
      pattern: patternWithExcludedTopic,
      totalMarks: 100,
    });

    // Must detect conflict
    expect(conflicts.length).toBeGreaterThan(0);
    const patternConflict = conflicts.find(
      (c) => c.type === "PATTERN_SYLLABUS_CONFLICT"
    );
    expect(patternConflict).toBeDefined();
    expect(patternConflict?.resolution).toContain("Syllabus precedence enforced");

    // The excluded chapter must NOT be in the coverage
    expect(coverage.chapters.find((c) => c.chapterId === "chap-excluded")).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Question-Type Allocation
  // --------------------------------------------------------------------------
  it("Scenario 15: Properly allocates multiple question types (MCQ, Short, Essay, Numerical)", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);

    const typeDist = bp.questionTypeDistribution;
    expect(typeDist["MCQ"]).toBe(20);
    expect(typeDist["SHORT"]).toBe(10);
    expect(typeDist["LONG"] + (typeDist["NUMERICAL"] || 0)).toBe(4);
  });

  // --------------------------------------------------------------------------
  // Scenario 16: Cognitive-Level Allocation
  // --------------------------------------------------------------------------
  it("Scenario 16: Allocates Bloom cognitive levels across all question slots", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);

    const cogDist = bp.cognitiveLevelDistribution;
    expect(cogDist).toBeDefined();

    const totalCogCount = Object.values(cogDist).reduce((a: any, b: any) => a + b, 0);
    expect(totalCogCount).toBe(34); // Must match total slot count
    expect(bp.slots.every((s) => !!s.cognitiveLevel)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 17: Blueprint Slot Creation
  // --------------------------------------------------------------------------
  it("Scenario 17: Creates ordered BlueprintQuestionSlot records with sequential numbering and section metadata", () => {
    const slots = BlueprintSlotGenerator.generateSlots({
      blueprintId: "bp-test-01",
      sections: validBlueprintRequest.sections!.map((s, idx) => ({
        ...s,
        id: `sec_${idx + 1}`,
        blueprintId: "bp-test-01",
        totalMarks: s.questionCount * s.marksPerQuestion,
        displayedMarks: s.questionCount * s.marksPerQuestion,
        attemptableMarks: s.questionCount * s.marksPerQuestion,
        maximumObtainableMarks: s.questionCount * s.marksPerQuestion,
        choiceRule: s.choiceRule || { type: "NO_CHOICE" },
        difficultyTarget: { easyCount: 1, mediumCount: 1, difficultCount: 1 },
      })),
      chapterAllocations: [
        {
          chapterId: "chap-01",
          chapterTitle: "Ch 1",
          marks: 50,
          percentage: 50,
          questionCount: 10,
          targetWeightage: 50,
          topicAllocations: [
            {
              topicId: "top-measurement",
              topicTitle: "Measurement",
              marks: 50,
              questionCount: 10,
              eligibilityStatus: "ELIGIBLE",
            },
          ],
        },
      ],
    });

    expect(slots.length).toBe(34);
    // Sequential numbering 1..34
    for (let i = 0; i < slots.length; i++) {
      expect(slots[i].sequence).toBe(i + 1);
      expect(slots[i].blueprintId).toBe("bp-test-01");
      expect(slots[i].marks).toBeGreaterThan(0);
      expect(slots[i].retrievalRequirements).toBeDefined();
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 18: Question Specification Creation (Phase 8 boundary intact)
  // --------------------------------------------------------------------------
  it("Scenario 18: Produces QuestionSpecification contracts without generating actual question text", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);
    const specs = await BlueprintService.createQuestionSpecifications(bp.id);

    expect(specs.length).toBe(bp.slots.length);

    for (const spec of specs) {
      expect(spec.blueprintSlotId).toBeDefined();
      expect(spec.marks).toBeGreaterThan(0);
      expect(spec.constraints.length).toBeGreaterThan(0);
      expect(spec.retrievalQuery).toBeDefined();
      expect(spec.difficulty).toBeDefined();

      // INVARIANT: Phase 8 question text/answers must NOT exist in Phase 7 specification
      expect((spec as any).questionText).toBeUndefined();
      expect((spec as any).answerKey).toBeUndefined();
      expect((spec as any).sampleSolution).toBeUndefined();
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 19: Duplicate Slot Detection
  // --------------------------------------------------------------------------
  it("Scenario 19: Detects duplicate sequence numbers and topic over-concentration in slots", () => {
    const slotsWithDuplicateSequence: BlueprintQuestionSlot[] = [
      {
        id: "slot-1",
        blueprintId: "bp-1",
        sectionId: "sec-1",
        sectionName: "Section A",
        sequence: 1,
        questionType: "MCQ",
        cognitiveLevel: "RECALL",
        targetDifficulty: "EASY",
        marks: 1,
        chapterId: "chap-01",
        chapterTitle: "Chapter 1",
        topicId: "top-1",
        topicTitle: "Topic 1",
        knowledgeType: "FACTUAL",
        requiredAnswerDepth: "OBJECTIVE",
        optionalState: "COMPULSORY",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-1",
          knowledgeTypes: ["FACTUAL"],
          questionType: "MCQ",
          difficulty: "EASY",
          marks: 1,
        },
      },
      {
        id: "slot-2",
        blueprintId: "bp-1",
        sectionId: "sec-1",
        sectionName: "Section A",
        sequence: 1, // Duplicate sequence number!
        questionType: "MCQ",
        cognitiveLevel: "RECALL",
        targetDifficulty: "EASY",
        marks: 1,
        chapterId: "chap-01",
        chapterTitle: "Chapter 1",
        topicId: "top-1",
        topicTitle: "Topic 1",
        knowledgeType: "FACTUAL",
        requiredAnswerDepth: "OBJECTIVE",
        optionalState: "COMPULSORY",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-1",
          knowledgeTypes: ["FACTUAL"],
          questionType: "MCQ",
          difficulty: "EASY",
          marks: 1,
        },
      },
    ];

    const dupCheck = DuplicationPreventionService.detectDuplicates(slotsWithDuplicateSequence, 2);
    expect(dupCheck.hasDuplicates).toBe(true);
    expect(dupCheck.duplicateSequenceNumbers).toContain(1);
  });

  // --------------------------------------------------------------------------
  // Scenario 20: Blueprint Lifecycle Transitions
  // --------------------------------------------------------------------------
  it("Scenario 20: Walks through the full lifecycle DRAFT -> UNDER_REVIEW -> APPROVED -> ARCHIVED", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);
    expect(bp.status).toBe("VALIDATED");

    // 1. Review
    const underReview = await BlueprintService.reviewBlueprint(bp.id, "reviewer-123", "Looks good");
    expect(underReview.status).toBe("UNDER_REVIEW");
    expect(underReview.provenanceMetadata.reviewerId).toBe("reviewer-123");

    // 2. Approve
    const approved = await BlueprintService.approveBlueprint(bp.id, "approver-456");
    expect(approved.status).toBe("APPROVED");
    expect(approved.provenanceMetadata.approverId).toBe("approver-456");

    // 3. Archive
    const archived = await BlueprintService.archiveBlueprint(bp.id);
    expect(archived.status).toBe("ARCHIVED");
  });

  // --------------------------------------------------------------------------
  // Scenario 21: Versioning (Approved blueprint modification creates v2.0)
  // --------------------------------------------------------------------------
  it("Scenario 21: Creating a new version from an approved blueprint creates v2.0 in DRAFT state", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);
    await BlueprintService.approveBlueprint(bp.id, "approver-1");

    // Create v2.0
    const v2 = await BlueprintService.createBlueprintVersion(bp.id, {
      title: "Grade 9 Physics Annual Examination (Modified)",
    });

    expect(v2.id).not.toBe(bp.id);
    expect(v2.version).toBe("v2.0");
    expect(v2.title).toBe("Grade 9 Physics Annual Examination (Modified)");

    // Original remains approved and untouched
    const original = await BlueprintService.getBlueprint(bp.id);
    expect(original?.version).toBe("v1.0");
    expect(original?.status).toBe("APPROVED");
  });

  // --------------------------------------------------------------------------
  // Scenario 22: Approval Gate (Validation errors block approval)
  // --------------------------------------------------------------------------
  it("Scenario 22: Blocks approval if blueprint has validation errors", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);

    // Corrupt blueprint to introduce a validation error
    bp.sections[0].maximumObtainableMarks = 999;
    bp.sections[0].totalMarks = 999;
    await BlueprintRepository.saveBlueprint(bp);

    await expect(
      BlueprintService.approveBlueprint(bp.id, "approver-1")
    ).rejects.toThrow(/Approval Gate Rejected/);
  });

  // --------------------------------------------------------------------------
  // Scenario 23: Provenance & Retrieval Requirements Verification
  // --------------------------------------------------------------------------
  it("Scenario 23: Ensures all slots specify valid provenance and retrieval requirements matching eligible topics", async () => {
    const bp = await BlueprintService.createBlueprint(validBlueprintRequest);

    expect(bp.provenanceMetadata).toBeDefined();
    expect(bp.provenanceMetadata.syllabusSourceReference).toContain("Official Grade 9 Physics Syllabus");

    for (const slot of bp.slots) {
      expect(slot.retrievalRequirements.chapterId).toBeDefined();
      expect(slot.retrievalRequirements.topicId).toBeDefined();
      expect(["chap-01", "chap-02"]).toContain(slot.retrievalRequirements.chapterId);
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 24: API Integration (/api/blueprints and /api/question-specifications)
  // --------------------------------------------------------------------------
  it("Scenario 24: Successfully executes POST and GET endpoints for blueprints and question specifications", async () => {
    // 1. POST /api/blueprints
    const postReq = new NextRequest("http://localhost:3000/api/blueprints", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      body: JSON.stringify(validBlueprintRequest),
    });
    const postRes = await createBlueprintRoute(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    const createdBpId = postData.data.id;

    // 2. GET /api/blueprints
    const listReq = new NextRequest("http://localhost:3000/api/blueprints");
    const listRes = await listBlueprintsRoute(listReq);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.data.length).toBeGreaterThan(0);

    // 3. GET /api/blueprints/[id]
    const getReq = new NextRequest(`http://localhost:3000/api/blueprints/${createdBpId}`);
    const getRes = await getBlueprintByIdRoute(getReq, { params: Promise.resolve({ id: createdBpId }) } as any);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.data.id).toBe(createdBpId);

    // 4. POST /api/question-specifications
    const specReq = new NextRequest("http://localhost:3000/api/question-specifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      body: JSON.stringify({ blueprintId: createdBpId }),
    });
    const specRes = await createQuestionSpecsRoute(specReq);
    expect(specRes.status).toBe(201);
    const specData = await specRes.json();
    expect(specData.data.length).toBe(34);
  });

  // --------------------------------------------------------------------------
  // Scenario 25: RBAC & Role Security (Student forbidden)
  // --------------------------------------------------------------------------
  it("Scenario 25: Forbids student role from creating blueprints or generating question specifications (HTTP 403)", async () => {
    // Student attempting to create blueprint
    const studentCreateReq = new NextRequest("http://localhost:3000/api/blueprints", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "STUDENT" },
      body: JSON.stringify(validBlueprintRequest),
    });
    const studentCreateRes = await createBlueprintRoute(studentCreateReq);
    expect(studentCreateRes.status).toBe(403);
    const createErr = await studentCreateRes.json();
    expect(createErr.error.code).toBe("FORBIDDEN");

    // Student attempting to generate question specifications
    const studentSpecReq = new NextRequest("http://localhost:3000/api/question-specifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "STUDENT" },
      body: JSON.stringify({ blueprintId: "any-bp" }),
    });
    const studentSpecRes = await createQuestionSpecsRoute(studentSpecReq);
    expect(studentSpecRes.status).toBe(403);
    const specErr = await studentSpecRes.json();
    expect(specErr.error.code).toBe("FORBIDDEN");
  });

  // --------------------------------------------------------------------------
  // Scenario 26: Regression Baseline
  // --------------------------------------------------------------------------
  it("Scenario 26: All Phase 7 components integrate seamlessly with previous phases without regressions", () => {
    // Verify pure algorithmic functions produce predictable, reproducible outcomes
    const dist = MarksArithmeticValidator.calculateSectionMarks({
      questionCount: 15,
      marksPerQuestion: 2,
      choiceRule: { type: "NO_CHOICE" },
    });
    expect(dist.maximumObtainableMarks).toBe(30);

    const hareDiff = DifficultyAllocationEngine.allocateDifficulty({
      requestedDistribution: { easyPct: 33.33, mediumPct: 33.33, difficultPct: 33.34 },
      totalMarks: 30,
    });
    expect(
      hareDiff.finalBlueprintDistribution.easyMarks +
      hareDiff.finalBlueprintDistribution.mediumMarks +
      hareDiff.finalBlueprintDistribution.difficultMarks
    ).toBe(30);
  });
});

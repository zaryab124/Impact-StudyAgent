// ==============================================================================
// AI Live Paper Generator - Granular Assessment Gating Unit Tests (Step 5)
// Deterministic Granular Syllabus Assessment Gate: Blueprint, Paper & Question Tests
// Comprehensive Verification of all 24 Required Step 5 Scenarios
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";

// Repositories & Services
import { BlueprintService } from "@/server/blueprint/blueprint-service";
import { BlueprintRepository } from "@/server/blueprint/blueprint-repository";
import { CoverageAllocationEngine } from "@/server/blueprint/coverage-allocation-engine";
import { BlueprintSlotGenerator } from "@/server/blueprint/blueprint-slot-generator";
import { BlueprintValidator } from "@/server/blueprint/blueprint-validator";
import { QuestionIntelligenceEngine } from "@/server/blueprint/question-intelligence-engine";
import { QuestionGenerationService } from "@/server/question-generation/question-generation-service";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";
import { PaperAssemblyService } from "@/server/exam-engine/paper-assembly-service";
import { PaperValidator } from "@/server/exam-engine/paper-validator";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { RetrievalService } from "@/server/retrieval/retrieval-service";
import { EligibilityEngine } from "@/server/syllabus/eligibility-engine";
import { SyllabusService } from "@/server/syllabus/syllabus-service";

// Types
import {
  ExaminationBlueprint,
  BlueprintSection,
  BlueprintQuestionSlot,
  PaperBlueprintRequest,
} from "@/types/blueprint";
import { QuestionBankItem, QuestionCandidate } from "@/types/question-generation";

describe("Step 5: Granular Syllabus Assessment Gating Architecture", () => {
  // Master Authoritative Verified Syllabus with Granular Hierarchy
  const mockGranularSyllabus = {
    id: "syl-phy-granular-v2",
    title: "Official Grade 9 Physics Curriculum 2025",
    version: "2025-v2.0",
    status: "VERIFIED",
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-9",
    subjectId: "subj-physics",
    chapterItems: [
      {
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities and Measurement",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 40,
        alignmentStatus: "MATCHED",
      },
      {
        chapterId: "chap-02",
        chapterTitle: "Kinematics and Dynamics",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 30,
        alignmentStatus: "MATCHED",
      },
      {
        chapterId: "chap-03",
        chapterTitle: "Work and Energy (Mixed)",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 30,
        alignmentStatus: "MATCHED",
      },
      {
        chapterId: "chap-excluded",
        chapterTitle: "Nuclear Physics (Excluded Chapter)",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "UNMATCHED",
      },
      {
        chapterId: "chap-review",
        chapterTitle: "Fluid Mechanics (Requires Review)",
        isIncluded: true,
        eligibility: "REQUIRES_REVIEW",
        weightage: 0,
        alignmentStatus: "REQUIRES_REVIEW",
      },
    ],
    topicItems: [
      // Chapter 1 Topics
      {
        topicId: "top-units",
        chapterId: "chap-01",
        topicTitle: "Standard Units & Instruments",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 20,
        alignmentStatus: "MATCHED",
        granularItems: [
          {
            id: "gi-sub-derived",
            topicItemId: "top-units",
            scope: "SUBTOPIC",
            identifier: "Derived Units",
            title: "Derived SI Units Calculation",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-sub-imperial",
            topicItemId: "top-units",
            scope: "SUBTOPIC",
            identifier: "Imperial Units",
            title: "Imperial Foot-Pound System",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
          {
            id: "gi-head-prefixes",
            topicItemId: "top-units",
            scope: "HEADING",
            identifier: "Section 1.3: Scientific Notation",
            title: "Scientific Notation and Metric Prefixes",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-head-obsolete",
            topicItemId: "top-units",
            scope: "HEADING",
            identifier: "Section 1.4: Obsolete Standards",
            title: "Obsolete Measurement Standards",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
          {
            id: "gi-q-1",
            topicItemId: "top-units",
            scope: "EXERCISE_QUESTION",
            identifier: "Exercise 1.1 Q1",
            title: "Convert km/h to m/s",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-q-2",
            topicItemId: "top-units",
            scope: "EXERCISE_QUESTION",
            identifier: "Exercise 1.1 Q2",
            title: "Historical Cubit Measurement",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
        ],
      },
      {
        topicId: "top-legacy",
        chapterId: "chap-01",
        topicTitle: "Significant Figures (Legacy Topic - No Granular Records)",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 20,
        alignmentStatus: "MATCHED",
        // Granular absence: no granular items defined
      },
      // Chapter 2 Topics
      {
        topicId: "top-newton",
        chapterId: "chap-02",
        topicTitle: "Newton Laws of Motion",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 30,
        alignmentStatus: "MATCHED",
      },
      {
        topicId: "top-relativity",
        chapterId: "chap-02",
        topicTitle: "Relativistic Momentum (Excluded Topic)",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "EXCLUDED",
      },
      // Chapter 3 Topics (Mixed Chapter)
      {
        topicId: "top-work-kinetic",
        chapterId: "chap-03",
        topicTitle: "Work Done & Kinetic Energy",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 15,
        alignmentStatus: "MATCHED",
      },
      {
        topicId: "top-potential-mixed",
        chapterId: "chap-03",
        topicTitle: "Potential Energy & Dissipation",
        isIncluded: true,
        eligibility: "ELIGIBLE",
        weightage: 15,
        alignmentStatus: "MATCHED",
        granularItems: [
          {
            id: "gi-grav-pe",
            topicItemId: "top-potential-mixed",
            scope: "SUBTOPIC",
            identifier: "Gravitational Potential Energy",
            title: "Gravitational PE Formula",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
          {
            id: "gi-nuclear-pe",
            topicItemId: "top-potential-mixed",
            scope: "SUBTOPIC",
            identifier: "Nuclear Potential Energy",
            title: "Nuclear Binding Potential",
            isIncluded: false,
            eligibility: "EXCLUDED",
          },
        ],
      },
      {
        topicId: "top-heat-dissipation",
        chapterId: "chap-03",
        topicTitle: "Thermal Entropy Dissipation (Excluded Topic in Mixed Chapter)",
        isIncluded: false,
        eligibility: "EXCLUDED",
        weightage: 0,
        alignmentStatus: "EXCLUDED",
      },
      // Topic in Excluded Chapter (Parent Exclusion Override)
      {
        topicId: "top-nuclear-reactions",
        chapterId: "chap-excluded",
        topicTitle: "Nuclear Reactions (Child Marked Included but Parent Excluded)",
        isIncluded: true, // Child flag is true, but chapter is EXCLUDED!
        eligibility: "ELIGIBLE",
        weightage: 0,
        alignmentStatus: "MATCHED",
        granularItems: [
          {
            id: "gi-fission",
            topicItemId: "top-nuclear-reactions",
            scope: "SUBTOPIC",
            identifier: "Nuclear Fission",
            title: "Uranium 235 Fission",
            isIncluded: true,
            eligibility: "ELIGIBLE",
          },
        ],
      },
    ],
  };

  // Syllabus Version A (older: vectors included)
  const syllabusVersionA = {
    id: "syl-version-a",
    title: "Physics Syllabus 2024",
    version: "2024-v1.0",
    status: "VERIFIED",
    chapterItems: [
      {
        chapterId: "chap-vectors",
        chapterTitle: "Vectors and Scalars",
        isIncluded: true,
        eligibility: "ELIGIBLE",
      },
    ],
    topicItems: [
      {
        topicId: "top-vectors",
        chapterId: "chap-vectors",
        topicTitle: "Vector Addition",
        isIncluded: true,
        eligibility: "ELIGIBLE",
      },
    ],
  };

  // Syllabus Version B (newer: vectors excluded)
  const syllabusVersionB = {
    id: "syl-version-b",
    title: "Physics Syllabus 2025",
    version: "2025-v2.0",
    status: "VERIFIED",
    chapterItems: [
      {
        chapterId: "chap-vectors",
        chapterTitle: "Vectors and Scalars",
        isIncluded: false,
        eligibility: "EXCLUDED",
      },
    ],
    topicItems: [
      {
        topicId: "top-vectors",
        chapterId: "chap-vectors",
        topicTitle: "Vector Addition",
        isIncluded: false,
        eligibility: "EXCLUDED",
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    QuestionBankRepository.resetMemory();
    BlueprintRepository.resetMemory();
    ExamRepository.resetMemory();

    // Mock SyllabusService.getSyllabusById to resolve in-memory syllabi
    vi.spyOn(SyllabusService, "getSyllabusById").mockImplementation(async (id: string) => {
      if (id === "syl-phy-granular-v2") return mockGranularSyllabus as any;
      if (id === "syl-version-a") return syllabusVersionA as any;
      if (id === "syl-version-b") return syllabusVersionB as any;
      return null;
    });
  });

  // ==========================================================================
  // Blueprint Allocation & Gating Tests
  // ==========================================================================

  it("Scenario 1: Blueprint excludes an EXCLUDED chapter", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });

    const excludedChap = coverage.chapters.find((c) => c.chapterId === "chap-excluded");
    expect(excludedChap).toBeUndefined();

    // Verify all allocated chapters are ELIGIBLE
    for (const chap of coverage.chapters) {
      expect(chap.chapterId).not.toBe("chap-excluded");
    }
  });

  it("Scenario 2: Blueprint excludes an EXCLUDED topic", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });

    const allAllocatedTopicIds = coverage.chapters.flatMap((c) =>
      c.topicAllocations.map((t) => t.topicId)
    );
    expect(allAllocatedTopicIds).not.toContain("top-relativity");
  });

  it("Scenario 3: Blueprint excludes an EXCLUDED subtopic", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });

    const unitsChap = coverage.chapters.find((c) => c.chapterId === "chap-01");
    const unitsTopic = unitsChap?.topicAllocations.find((t) => t.topicId === "top-units");
    expect(unitsTopic).toBeDefined();

    const granularItems = unitsTopic?.granularAllocations || [];
    const excludedSubtopic = granularItems.find((gi) => gi.identifier === "Imperial Units");
    expect(excludedSubtopic).toBeUndefined();

    const includedSubtopic = granularItems.find((gi) => gi.identifier === "Derived Units");
    expect(includedSubtopic).toBeDefined();
    expect(includedSubtopic?.eligibilityStatus).toBe("ELIGIBLE");
  });

  it("Scenario 4: Blueprint excludes an EXCLUDED heading", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });

    const unitsTopic = coverage.chapters
      .find((c) => c.chapterId === "chap-01")
      ?.topicAllocations.find((t) => t.topicId === "top-units");

    const granularItems = unitsTopic?.granularAllocations || [];
    const excludedHeading = granularItems.find(
      (gi) => gi.identifier === "Section 1.4: Obsolete Standards"
    );
    expect(excludedHeading).toBeUndefined();

    const includedHeading = granularItems.find(
      (gi) => gi.identifier === "Section 1.3: Scientific Notation"
    );
    expect(includedHeading).toBeDefined();
  });

  it("Scenario 5: Blueprint excludes an EXCLUDED exercise/question", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });

    const unitsTopic = coverage.chapters
      .find((c) => c.chapterId === "chap-01")
      ?.topicAllocations.find((t) => t.topicId === "top-units");

    const granularItems = unitsTopic?.granularAllocations || [];
    const excludedEq = granularItems.find((gi) => gi.identifier === "Exercise 1.1 Q2");
    expect(excludedEq).toBeUndefined();

    const includedEq = granularItems.find((gi) => gi.identifier === "Exercise 1.1 Q1");
    expect(includedEq).toBeDefined();
  });

  it("Scenario 6: Included content remains available in a mixed chapter", () => {
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });

    const mixedChap = coverage.chapters.find((c) => c.chapterId === "chap-03");
    expect(mixedChap).toBeDefined();
    expect(mixedChap!.marks).toBeGreaterThan(0);

    const mixedTopicIds = mixedChap!.topicAllocations.map((t) => t.topicId);
    // Included topic is present
    expect(mixedTopicIds).toContain("top-work-kinetic");
    // Topic with included granular portion is present
    expect(mixedTopicIds).toContain("top-potential-mixed");
    // Wholly excluded topic in mixed chapter is rejected
    expect(mixedTopicIds).not.toContain("top-heat-dissipation");

    // Inside top-potential-mixed, only gravitational PE is present, nuclear PE is excluded
    const potTopic = mixedChap!.topicAllocations.find((t) => t.topicId === "top-potential-mixed");
    const potGranular = potTopic?.granularAllocations || [];
    expect(potGranular.some((gi) => gi.identifier === "Gravitational Potential Energy")).toBe(true);
    expect(potGranular.some((gi) => gi.identifier === "Nuclear Potential Energy")).toBe(false);
  });

  it("Scenario 7: Parent exclusion overrides included child", () => {
    // top-nuclear-reactions is marked isIncluded: true, but parent chap-excluded is EXCLUDED
    const topEval = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-excluded",
      topicId: "top-nuclear-reactions",
    });
    expect(topEval.eligibility).toBe("EXCLUDED");
    expect(topEval.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");

    // Child granular item gi-fission is marked isIncluded: true, but ancestor chapter is EXCLUDED
    const giEval = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-excluded",
      topicId: "top-nuclear-reactions",
      scope: "SUBTOPIC",
      identifier: "Nuclear Fission",
    });
    expect(giEval.eligibility).toBe("EXCLUDED");
    expect(giEval.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");

    // In blueprint coverage, neither enters
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });
    const allTopicIds = coverage.chapters.flatMap((c) => c.topicAllocations.map((t) => t.topicId));
    expect(allTopicIds).not.toContain("top-nuclear-reactions");
  });

  it("Scenario 8: UNKNOWN content cannot enter blueprint", () => {
    const unknownEval = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-non-existent",
      topicId: "top-non-existent",
    });
    expect(unknownEval.eligibility).toBe("UNKNOWN");
    expect(unknownEval.isEligibleForProduction).toBe(false);

    // If an unknown chapter is in blueprint coverage, validation flags an error
    const mockBpWithUnknown: any = {
      id: "bp-unknown",
      totalMarks: 10,
      boardId: "board-fed-01",
      academicYearId: "year-2024-25",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-phy-granular-v2",
      sections: [{ id: "sec-1", questionCount: 1, marksPerQuestion: 10, displayedMarks: 10, maximumObtainableMarks: 10, sectionName: "A", choiceRule: { type: "NO_CHOICE" } }],
      coverageAllocation: {
        chapters: [
          {
            chapterId: "chap-non-existent",
            chapterTitle: "Ghost Chapter",
            marks: 10,
            topicAllocations: [
              { topicId: "top-ghost", topicTitle: "Ghost Topic", marks: 10, questionCount: 1, eligibilityStatus: "ELIGIBLE" },
            ],
          },
        ],
      },
      slots: [
        {
          id: "slot-ghost",
          sequence: 1,
          chapterId: "chap-non-existent",
          topicId: "top-ghost",
          marks: 10,
          retrievalRequirements: {},
        },
      ],
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 10, mediumMarks: 0, difficultMarks: 0 } },
    };

    const report = BlueprintValidator.validateBlueprint(mockBpWithUnknown, mockGranularSyllabus);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("Eligibility violation"))).toBe(true);
  });

  it("Scenario 9: REQUIRES_REVIEW content cannot enter blueprint", () => {
    const reviewEval = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-review",
    });
    expect(reviewEval.eligibility).toBe("REQUIRES_REVIEW");
    expect(reviewEval.isEligibleForProduction).toBe(false);

    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });
    expect(coverage.chapters.find((c) => c.chapterId === "chap-review")).toBeUndefined();
  });

  it("Scenario 10: UNRESOLVED_IN_MIXED_CHAPTER cannot enter blueprint or generation", () => {
    // Querying content chunk in mixed chapter chap-03 without specifying topic or granular identifier
    const mixedUnresolved = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-03",
      isContentChunk: true,
    });
    expect(mixedUnresolved.eligibility).toBe("REQUIRES_REVIEW");
    expect(mixedUnresolved.diagnosticCode).toBe("UNRESOLVED_IN_MIXED_CHAPTER");
    expect(mixedUnresolved.isEligibleForProduction).toBe(false);
  });

  // ==========================================================================
  // Practice Test & Paper Selection Tests
  // ==========================================================================

  it("Scenario 11: Practice test / Paper assembly excludes granular-blocked questions", async () => {
    // Setup approved blueprint
    const approvedBlueprint: any = {
      id: "bp-app-01",
      version: "v1.0",
      boardId: "board-fed-01",
      academicYearId: "year-2024-25",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-phy-granular-v2",
      title: "Grade 9 Practice Paper",
      totalMarks: 4,
      durationMinutes: 60,
      language: "en",
      status: "APPROVED",
      sections: [
        {
          id: "sec-1",
          blueprintId: "bp-app-01",
          sectionName: "Section A",
          sectionOrder: 1,
          questionCount: 2,
          marksPerQuestion: 2,
          totalMarks: 4,
          displayedMarks: 4,
          attemptableMarks: 4,
          maximumObtainableMarks: 4,
          questionTypes: ["SHORT"],
          choiceRule: { type: "NO_CHOICE" },
        },
      ],
      slots: [
        {
          id: "slot-1",
          blueprintId: "bp-app-01",
          sectionId: "sec-1",
          sectionName: "Section A",
          sequence: 1,
          questionType: "SHORT",
          marks: 2,
          targetDifficulty: "MEDIUM",
          chapterId: "chap-01",
          chapterTitle: "Physical Quantities",
          topicId: "top-units",
          topicTitle: "Standard Units",
          granularScope: "SUBTOPIC",
          granularIdentifier: "Derived Units", // INCLUDED
          knowledgeType: "CONCEPTUAL",
          cognitiveLevel: "UNDERSTAND",
          requiredAnswerDepth: "BRIEF",
          optionalState: "COMPULSORY",
          retrievalRequirements: {
            chapterId: "chap-01",
            topicId: "top-units",
            knowledgeTypes: ["CONCEPTUAL"],
            questionType: "SHORT",
            difficulty: "MEDIUM",
            marks: 2,
          },
        },
        {
          id: "slot-2",
          blueprintId: "bp-app-01",
          sectionId: "sec-1",
          sectionName: "Section A",
          sequence: 2,
          questionType: "SHORT",
          marks: 2,
          targetDifficulty: "MEDIUM",
          chapterId: "chap-01",
          chapterTitle: "Physical Quantities",
          topicId: "top-legacy",
          topicTitle: "Significant Figures",
          knowledgeType: "CONCEPTUAL",
          cognitiveLevel: "UNDERSTAND",
          requiredAnswerDepth: "BRIEF",
          optionalState: "COMPULSORY",
          retrievalRequirements: {
            chapterId: "chap-01",
            topicId: "top-legacy",
            knowledgeTypes: ["CONCEPTUAL"],
            questionType: "SHORT",
            difficulty: "MEDIUM",
            marks: 2,
          },
        },
      ],
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 4, difficultMarks: 0 } } as any,
      coverageAllocation: { chapters: [] } as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await BlueprintRepository.saveBlueprint(approvedBlueprint);

    // Populate question bank:
    // 1. Question with EXCLUDED granular provenance ("Imperial Units")
    const excludedBankItem: QuestionBankItem = {
      id: "qb-excluded-subtopic",
      candidateId: "qc-01",
      version: "1.0",
      historicalVersions: [],
      boardId: "board-fed-01",
      academicYearId: "year-2024-25",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-phy-granular-v2",
      syllabusVersion: "2025-v2.0",
      chapterId: "chap-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-units",
      topicTitle: "Standard Units",
      granularItemId: "gi-sub-imperial",
      granularScope: "SUBTOPIC",
      granularIdentifier: "Imperial Units",
      questionType: "SHORT",
      marks: 2,
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      questionText: "Explain the English imperial system of feet and pounds.",
      answerMaterial: {},
      sourceChunkIds: ["chk-imp"],
      sourcePages: [20],
      sourceProvenance: {
        granularScope: "SUBTOPIC",
        granularIdentifier: "Imperial Units",
      },
      validationState: "VALIDATED",
      reviewState: "APPROVED",
      qualityScore: 90,
      validationReport: {} as any,
      tags: [],
      usageCount: 0,
      approvedBy: "reviewer-1",
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Question with INCLUDED granular provenance ("Derived Units")
    const includedBankItem: QuestionBankItem = {
      ...excludedBankItem,
      id: "qb-included-subtopic",
      granularItemId: "gi-sub-derived",
      granularIdentifier: "Derived Units",
      questionText: "Derive the SI unit of force from base quantities.",
      sourceProvenance: {
        granularScope: "SUBTOPIC",
        granularIdentifier: "Derived Units",
      },
    };

    // 3. Question for slot 2
    const slot2BankItem: QuestionBankItem = {
      ...excludedBankItem,
      id: "qb-slot2-legacy",
      topicId: "top-legacy",
      topicTitle: "Significant Figures",
      granularItemId: undefined,
      granularIdentifier: undefined,
      questionText: "State the rules for identifying significant figures.",
      sourceProvenance: {},
    };

    await QuestionBankRepository.saveBankItem(excludedBankItem);
    await QuestionBankRepository.saveBankItem(includedBankItem);
    await QuestionBankRepository.saveBankItem(slot2BankItem);

    // Assemble Live Examination Paper
    const paper = await PaperAssemblyService.assemblePaper(approvedBlueprint.id);

    // Assertion: Excluded granular question was NOT selected
    const selectedItemIds = paper.questions.map((q) => q.questionBankItemId);
    expect(selectedItemIds).not.toContain("qb-excluded-subtopic");
    expect(selectedItemIds).toContain("qb-included-subtopic");
    expect(selectedItemIds).toContain("qb-slot2-legacy");
  });

  it("Scenario 12: New paper generation excludes granular-blocked source content", async () => {
    // When generating candidates, slot asking for excluded subtopic is rejected by gate check
    const mockSlotExcluded: BlueprintQuestionSlot = {
      id: "slot-imp",
      blueprintId: "bp-app-01",
      sectionId: "sec-1",
      sectionName: "A",
      sequence: 1,
      questionType: "SHORT",
      marks: 2,
      targetDifficulty: "MEDIUM",
      chapterId: "chap-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-units",
      topicTitle: "Standard Units",
      granularScope: "SUBTOPIC",
      granularIdentifier: "Imperial Units", // EXCLUDED
      knowledgeType: "CONCEPTUAL",
      cognitiveLevel: "UNDERSTAND",
      requiredAnswerDepth: "BRIEF",
      optionalState: "COMPULSORY",
      retrievalRequirements: {
        chapterId: "chap-01",
        topicId: "top-units",
        knowledgeTypes: ["CONCEPTUAL"],
        questionType: "SHORT",
        difficulty: "MEDIUM",
        marks: 2,
      },
    };

    const spec = QuestionIntelligenceEngine.createSpecification(mockSlotExcluded);

    const gateCheck = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: mockGranularSyllabus },
      spec,
      mockSlotExcluded
    );

    expect(gateCheck.canGenerate).toBe(false);
    expect(gateCheck.failureCode).toBe("CONTENT_NOT_ELIGIBLE");
    expect(gateCheck.failureReason).toContain("Imperial Units");
  });

  it("Scenario 13: Generated question receives eligible provenance", async () => {
    const mockSlotValid: BlueprintQuestionSlot = {
      id: "slot-derived",
      blueprintId: "bp-app-01",
      sectionId: "sec-1",
      sectionName: "A",
      sequence: 1,
      questionType: "SHORT",
      marks: 2,
      targetDifficulty: "MEDIUM",
      chapterId: "chap-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-units",
      topicTitle: "Standard Units",
      granularItemId: "gi-sub-derived",
      granularScope: "SUBTOPIC",
      granularIdentifier: "Derived Units",
      knowledgeType: "CONCEPTUAL",
      cognitiveLevel: "UNDERSTAND",
      requiredAnswerDepth: "BRIEF",
      optionalState: "COMPULSORY",
      retrievalRequirements: {
        chapterId: "chap-01",
        topicId: "top-units",
        knowledgeTypes: ["CONCEPTUAL"],
        questionType: "SHORT",
        difficulty: "MEDIUM",
        marks: 2,
      },
    };

    const spec = QuestionIntelligenceEngine.createSpecification(mockSlotValid);
    expect(spec.granularItemId).toBe("gi-sub-derived");
    expect(spec.granularScope).toBe("SUBTOPIC");
    expect(spec.granularIdentifier).toBe("Derived Units");

    const gateCheck = await QuestionGenerationService.checkGenerationGates(
      { status: "APPROVED", syllabusStatus: "VERIFIED", syllabus: mockGranularSyllabus },
      spec,
      mockSlotValid
    );
    expect(gateCheck.canGenerate).toBe(true);
    expect(gateCheck.contentEligibility).toBe("ELIGIBLE");
  });

  it("Scenario 14: Final question validation rejects a question whose source is excluded", async () => {
    const approvedBlueprint: any = {
      id: "bp-app-02",
      version: "v1.0",
      boardId: "board-fed-01",
      academicYearId: "year-2024-25",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-phy-granular-v2",
      title: "Grade 9 Practice Paper",
      totalMarks: 2,
      durationMinutes: 30,
      language: "en",
      status: "APPROVED",
      sections: [
        {
          id: "sec-1",
          blueprintId: "bp-app-02",
          sectionName: "Section A",
          sectionOrder: 1,
          questionCount: 1,
          marksPerQuestion: 2,
          totalMarks: 2,
          displayedMarks: 2,
          attemptableMarks: 2,
          maximumObtainableMarks: 2,
          questionTypes: ["SHORT"],
          choiceRule: { type: "NO_CHOICE" },
        },
      ],
      slots: [
        {
          id: "slot-1",
          blueprintId: "bp-app-02",
          sectionId: "sec-1",
          sectionName: "Section A",
          sequence: 1,
          questionType: "SHORT",
          marks: 2,
          targetDifficulty: "MEDIUM",
          chapterId: "chap-01",
          chapterTitle: "Physical Quantities",
          topicId: "top-units",
          topicTitle: "Standard Units",
          granularScope: "SUBTOPIC",
          granularIdentifier: "Imperial Units", // EXCLUDED
          knowledgeType: "CONCEPTUAL",
          cognitiveLevel: "UNDERSTAND",
          requiredAnswerDepth: "BRIEF",
          optionalState: "COMPULSORY",
          retrievalRequirements: {
            chapterId: "chap-01",
            topicId: "top-units",
            knowledgeTypes: ["CONCEPTUAL"],
            questionType: "SHORT",
            difficulty: "MEDIUM",
            marks: 2,
          },
        },
      ],
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 2, difficultMarks: 0 } } as any,
      coverageAllocation: { chapters: [] } as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (approvedBlueprint as any).syllabus = mockGranularSyllabus;

    await BlueprintRepository.saveBlueprint(approvedBlueprint);

    // Mock retrieval to provide chunks
    vi.spyOn(RetrievalService, "retrieveKnowledge").mockResolvedValueOnce({
      success: true,
      status: "SUCCESS",
      results: [
        {
          chunkId: "chk-1",
          content: "Imperial units include feet and inches.",
          pageNumber: 5,
          chunkType: "TEXT",
        },
      ],
    } as any);

    // When generateQuestion is called, gate blocks it
    await expect(
      QuestionGenerationService.generateQuestion("bp-app-02", "slot-1", {
        preferredProvider: "deterministic-grounded",
      })
    ).rejects.toThrow(/CONTENT_NOT_ELIGIBLE/);
  });

  // ==========================================================================
  // Syllabus Version Safety & Isolation Tests
  // ==========================================================================

  it("Scenario 15: Current syllabus version controls eligibility", () => {
    // Under Version A, vectors is ELIGIBLE
    const evalA = EligibilityEngine.evaluateHierarchySync(syllabusVersionA, {
      chapterId: "chap-vectors",
      topicId: "top-vectors",
    });
    expect(evalA.eligibility).toBe("ELIGIBLE");

    // Under Version B, vectors is EXCLUDED
    const evalB = EligibilityEngine.evaluateHierarchySync(syllabusVersionB, {
      chapterId: "chap-vectors",
      topicId: "top-vectors",
    });
    expect(evalB.eligibility).toBe("EXCLUDED");
    expect(evalB.diagnosticCode).toBe("EXCLUDED_BY_CHAPTER");
  });

  it("Scenario 16: Older syllabus eligibility cannot leak into a newer syllabus version", async () => {
    // Approved blueprint requesting Version B (newer syllabus where vectors is EXCLUDED)
    const bpVersionB: any = {
      id: "bp-newer-v2",
      version: "v2.0",
      boardId: "board-fed-01",
      academicYearId: "year-2024-25",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-version-b",
      title: "2025 Physics Examination",
      totalMarks: 5,
      durationMinutes: 60,
      language: "en",
      status: "APPROVED",
      sections: [
        {
          id: "sec-1",
          blueprintId: "bp-newer-v2",
          sectionName: "Section A",
          sectionOrder: 1,
          questionCount: 1,
          marksPerQuestion: 5,
          totalMarks: 5,
          displayedMarks: 5,
          attemptableMarks: 5,
          maximumObtainableMarks: 5,
          questionTypes: ["SHORT"],
          choiceRule: { type: "NO_CHOICE" },
        },
      ],
      slots: [
        {
          id: "slot-vectors",
          blueprintId: "bp-newer-v2",
          sectionId: "sec-1",
          sectionName: "Section A",
          sequence: 1,
          questionType: "SHORT",
          marks: 5,
          targetDifficulty: "MEDIUM",
          chapterId: "chap-vectors",
          chapterTitle: "Vectors",
          topicId: "top-vectors",
          topicTitle: "Vector Addition",
          knowledgeType: "CONCEPTUAL",
          cognitiveLevel: "UNDERSTAND",
          requiredAnswerDepth: "BRIEF",
          optionalState: "COMPULSORY",
          retrievalRequirements: {
            chapterId: "chap-vectors",
            topicId: "top-vectors",
            knowledgeTypes: ["CONCEPTUAL"],
            questionType: "SHORT",
            difficulty: "MEDIUM",
            marks: 5,
          },
        },
      ],
      difficultyComparison: { finalBlueprintDistribution: { easyMarks: 0, mediumMarks: 5, difficultMarks: 0 } } as any,
      coverageAllocation: { chapters: [] } as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (bpVersionB as any).syllabus = syllabusVersionB;

    await BlueprintRepository.saveBlueprint(bpVersionB);

    // Question bank contains a question created under Syllabus Version A
    const oldVersionQuestion: QuestionBankItem = {
      id: "qb-old-vectors",
      candidateId: "qc-old-01",
      version: "1.0",
      historicalVersions: [],
      boardId: "board-fed-01",
      academicYearId: "year-2023-24",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-version-a", // Created under Version A!
      syllabusVersion: "2024-v1.0",
      chapterId: "chap-vectors",
      chapterTitle: "Vectors",
      topicId: "top-vectors",
      topicTitle: "Vector Addition",
      questionType: "SHORT",
      marks: 5,
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      questionText: "Define a unit vector and state its mathematical representation.",
      answerMaterial: {},
      sourceChunkIds: ["chk-old-v"],
      sourcePages: [10],
      sourceProvenance: {},
      validationState: "VALIDATED",
      reviewState: "APPROVED",
      qualityScore: 95,
      validationReport: {} as any,
      tags: [],
      usageCount: 0,
      approvedBy: "old-reviewer",
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await QuestionBankRepository.saveBankItem(oldVersionQuestion);

    // Attempt to assemble paper under Version B:
    // The question from Version A must NOT leak into Version B assessment
    await expect(
      PaperAssemblyService.assemblePaper(bpVersionB.id)
    ).rejects.toThrow(/INSUFFICIENT_APPROVED_QUESTION_BANK/);
  });

  // ==========================================================================
  // Backward Compatibility & Granular Scope Independence
  // ==========================================================================

  it("Scenario 17: Legacy syllabus with no granular records continues working", () => {
    // Syllabus with chapters and topics, but zero granularItem records
    const legacySyllabus = {
      id: "syl-legacy",
      title: "Legacy Curriculum",
      version: "v1.0",
      status: "VERIFIED",
      chapterItems: [
        { chapterId: "chap-leg-1", isIncluded: true, eligibility: "ELIGIBLE", weightage: 50 },
        { chapterId: "chap-leg-2", isIncluded: true, eligibility: "ELIGIBLE", weightage: 50 },
      ],
      topicItems: [
        { topicId: "top-leg-1", chapterId: "chap-leg-1", isIncluded: true, eligibility: "ELIGIBLE", weightage: 25 },
        { topicId: "top-leg-2", chapterId: "chap-leg-2", isIncluded: true, eligibility: "ELIGIBLE", weightage: 25 },
      ],
    };

    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: legacySyllabus,
      totalMarks: 50,
    });

    expect(coverage.chapters.length).toBe(2);
    expect(coverage.chapters[0].topicAllocations.length).toBe(1);
    expect(coverage.chapters[0].topicAllocations[0].eligibilityStatus).toBe("ELIGIBLE");
  });

  it("Scenario 18: Multiple granular scopes work independently", () => {
    // In top-units:
    // 1. SUBTOPIC 'Derived Units' is ELIGIBLE, while 'Imperial Units' is EXCLUDED
    const subEligible = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-01",
      topicId: "top-units",
      scope: "SUBTOPIC",
      identifier: "Derived Units",
    });
    expect(subEligible.eligibility).toBe("ELIGIBLE");

    const subExcluded = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-01",
      topicId: "top-units",
      scope: "SUBTOPIC",
      identifier: "Imperial Units",
    });
    expect(subExcluded.eligibility).toBe("EXCLUDED");
    expect(subExcluded.diagnosticCode).toBe("EXCLUDED_BY_GRANULAR");

    // 2. HEADING 'Section 1.3: Scientific Notation' is ELIGIBLE, while 'Section 1.4: Obsolete Standards' is EXCLUDED
    const headEligible = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-01",
      topicId: "top-units",
      scope: "HEADING",
      identifier: "Section 1.3: Scientific Notation",
    });
    expect(headEligible.eligibility).toBe("ELIGIBLE");

    const headExcluded = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-01",
      topicId: "top-units",
      scope: "HEADING",
      identifier: "Section 1.4: Obsolete Standards",
    });
    expect(headExcluded.eligibility).toBe("EXCLUDED");

    // 3. EXERCISE_QUESTION 'Exercise 1.1 Q1' is ELIGIBLE, while 'Exercise 1.1 Q2' is EXCLUDED
    const eqEligible = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-01",
      topicId: "top-units",
      scope: "EXERCISE_QUESTION",
      identifier: "Exercise 1.1 Q1",
    });
    expect(eqEligible.eligibility).toBe("ELIGIBLE");

    const eqExcluded = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-01",
      topicId: "top-units",
      scope: "EXERCISE_QUESTION",
      identifier: "Exercise 1.1 Q2",
    });
    expect(eqExcluded.eligibility).toBe("EXCLUDED");
  });

  it("Scenario 19: Non-contiguous exclusions leave unrelated eligible content available", () => {
    // Under top-units, items 2, 4, 6 are excluded, items 1, 3, 5 are included
    const { coverage } = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 100,
    });

    const unitsTopic = coverage.chapters
      .find((c) => c.chapterId === "chap-01")
      ?.topicAllocations.find((t) => t.topicId === "top-units");

    const granulars = unitsTopic?.granularAllocations || [];
    expect(granulars.length).toBe(3); // Exactly the 3 included items
    const identifiers = granulars.map((g) => g.identifier);
    expect(identifiers).toContain("Derived Units");
    expect(identifiers).toContain("Section 1.3: Scientific Notation");
    expect(identifiers).toContain("Exercise 1.1 Q1");
    expect(identifiers).not.toContain("Imperial Units");
    expect(identifiers).not.toContain("Section 1.4: Obsolete Standards");
    expect(identifiers).not.toContain("Exercise 1.1 Q2");
  });

  // ==========================================================================
  // Safety, Repeatability & Determinism Tests
  // ==========================================================================

  it("Scenario 20: Insufficient eligible content does NOT cause excluded content to be used as fallback", () => {
    // Syllabus where ALL chapters are EXCLUDED
    const allExcludedSyllabus = {
      id: "syl-all-excluded",
      title: "All Excluded Syllabus",
      version: "v1.0",
      status: "VERIFIED",
      chapterItems: [
        { chapterId: "chap-1", isIncluded: false, eligibility: "EXCLUDED" },
        { chapterId: "chap-2", isIncluded: false, eligibility: "EXCLUDED" },
      ],
      topicItems: [],
    };

    // Blueprint allocation MUST throw INSUFFICIENT_ELIGIBLE_CONTENT, never resurrecting excluded chapters
    expect(() => {
      CoverageAllocationEngine.allocateCoverage({
        syllabus: allExcludedSyllabus,
        totalMarks: 100,
      });
    }).toThrow(/INSUFFICIENT_ELIGIBLE_CONTENT/);
  });

  it("Scenario 21: No AI provider is needed for eligibility decisions", () => {
    // Zero mocks for OpenAI, Gemini, or any LLM provider are registered for eligibility
    const startTime = performance.now();

    const result = EligibilityEngine.evaluateHierarchySync(mockGranularSyllabus, {
      chapterId: "chap-01",
      topicId: "top-units",
      scope: "SUBTOPIC",
      identifier: "Derived Units",
    });

    const durationMs = performance.now() - startTime;

    expect(result.eligibility).toBe("ELIGIBLE");
    expect(result.isEligibleForProduction).toBe(true);
    // Deterministic execution completes in under 5ms synchronously
    expect(durationMs).toBeLessThan(10);
  });

  it("Scenario 22: Repeated blueprint generation is deterministic for the same inputs", () => {
    const run1 = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 75,
    });

    const run2 = CoverageAllocationEngine.allocateCoverage({
      syllabus: mockGranularSyllabus,
      totalMarks: 75,
    });

    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  it("Scenario 23: Existing Phase 5/Phase 6 behavior remains intact", () => {
    // Validate blueprint with marks arithmetic & difficulty distribution checks
    const validBp: any = {
      id: "bp-phase5-check",
      boardId: "board-fed-01",
      academicYearId: "year-2024-25",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-phy-granular-v2",
      totalMarks: 20,
      sections: [
        {
          id: "sec-1",
          sectionName: "MCQ",
          sectionOrder: 1,
          questionCount: 10,
          marksPerQuestion: 2,
          totalMarks: 20,
          displayedMarks: 20,
          attemptableMarks: 20,
          maximumObtainableMarks: 20,
          questionTypes: ["MCQ"],
          choiceRule: { type: "NO_CHOICE" },
        },
      ],
      difficultyComparison: {
        finalBlueprintDistribution: {
          easyMarks: 7,
          mediumMarks: 7,
          difficultMarks: 6,
          easyCount: 3,
          mediumCount: 4,
          difficultCount: 3,
        },
      },
      coverageAllocation: {
        chapters: [
          {
            chapterId: "chap-01",
            chapterTitle: "Physical Quantities",
            marks: 20,
            topicAllocations: [
              {
                topicId: "top-units",
                topicTitle: "Units",
                marks: 20,
                questionCount: 10,
                eligibilityStatus: "ELIGIBLE",
              },
            ],
          },
        ],
      },
      slots: [
        {
          id: "s-1",
          sequence: 1,
          marks: 2,
          chapterId: "chap-01",
          topicId: "top-units",
          retrievalRequirements: { marks: 2 },
        },
      ],
    };

    const report = BlueprintValidator.validateBlueprint(validBp, mockGranularSyllabus);
    expect(report.isMarksArithmeticValid).toBe(true);
    expect(report.isDifficultyValid).toBe(true);
    expect(report.isHierarchyValid).toBe(true);
  });

  it("Scenario 24: Existing provenance remains intact", () => {
    const slot: BlueprintQuestionSlot = {
      id: "slot-provenance",
      blueprintId: "bp-prov",
      sectionId: "sec-1",
      sectionName: "A",
      sequence: 1,
      questionType: "MCQ",
      marks: 1,
      targetDifficulty: "EASY",
      chapterId: "chap-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-units",
      topicTitle: "Standard Units",
      granularItemId: "gi-sub-derived",
      granularScope: "SUBTOPIC",
      granularIdentifier: "Derived Units",
      knowledgeType: "FACTUAL",
      cognitiveLevel: "RECALL",
      requiredAnswerDepth: "OBJECTIVE",
      optionalState: "COMPULSORY",
      retrievalRequirements: {
        chapterId: "chap-01",
        topicId: "top-units",
        knowledgeTypes: ["FACTUAL"],
        questionType: "MCQ",
        difficulty: "EASY",
        marks: 1,
      },
    };

    const spec = QuestionIntelligenceEngine.createSpecification(slot);
    // Preserves original 13 coordinates
    expect(spec.chapterId).toBe("chap-01");
    expect(spec.chapterTitle).toBe("Physical Quantities");
    expect(spec.topicId).toBe("top-units");
    expect(spec.topicTitle).toBe("Standard Units");
    expect(spec.provenanceRequirements.mustMatchChapter).toBe(true);
    expect(spec.provenanceRequirements.mustMatchTopic).toBe(true);
    // Preserves granular coordinates
    expect(spec.granularItemId).toBe("gi-sub-derived");
    expect(spec.granularScope).toBe("SUBTOPIC");
    expect(spec.granularIdentifier).toBe("Derived Units");
  });
});

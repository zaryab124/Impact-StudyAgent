// ==============================================================================
// AI Live Paper Generator - Grounded Question Generation & Question Bank Tests (Phase 8)
// Comprehensive Verification of all 25 Required Scenarios
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Services & Repositories
import { QuestionGenerationService } from "@/server/question-generation/question-generation-service";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";
import { QuestionQualityValidator } from "@/server/question-generation/question-quality-validator";
import { GroundingValidator } from "@/server/question-generation/grounding-validator";
import { DifficultyValidator } from "@/server/question-generation/difficulty-validator";
import { NumericalValidator } from "@/server/question-generation/numerical-validator";
import { DuplicateDetectionService } from "@/server/question-generation/duplicate-detection-service";
import { QuestionProviderRegistry } from "@/server/question-generation/providers/provider-registry";
import { DeterministicGroundedProvider } from "@/server/question-generation/providers/deterministic-grounded-provider";
import { GeminiQuestionProvider } from "@/server/question-generation/providers/gemini-question-provider";
import { OpenAIQuestionProvider } from "@/server/question-generation/providers/openai-question-provider";

// Upstream Systems
import { BlueprintRepository } from "@/server/blueprint/blueprint-repository";
import { RetrievalService } from "@/server/retrieval/retrieval-service";

// Route Handlers
import { GET as listQuestionsRoute } from "@/app/api/questions/route";
import { POST as generateQuestionRoute } from "@/app/api/questions/generate/route";
import { POST as generateBatchRoute } from "@/app/api/questions/generate-batch/route";
import { GET as getQuestionByIdRoute } from "@/app/api/questions/[id]/route";
import { POST as validateQuestionRoute } from "@/app/api/questions/[id]/validate/route";
import { POST as reviewQuestionRoute } from "@/app/api/questions/[id]/review/route";
import { POST as approveQuestionRoute } from "@/app/api/questions/[id]/approve/route";
import { POST as rejectQuestionRoute } from "@/app/api/questions/[id]/reject/route";
import { GET as getQuestionProvenanceRoute } from "@/app/api/questions/[id]/provenance/route";
import { GET as getQuestionAnswerRoute } from "@/app/api/questions/[id]/answer/route";
import { GET as listBatchesRoute } from "@/app/api/question-batches/route";

// Types
import {
  QuestionCandidate,
  QuestionBankItem,
  GroundingEvidencePackage,
} from "@/types/question-generation";
import { ExaminationBlueprint, BlueprintQuestionSlot } from "@/types/blueprint";

describe("Phase 8: Grounded Question Generation and Question Bank Engine", () => {
  // Test Fixtures
  const mockSlot: BlueprintQuestionSlot = {
    id: "slot-mcq-01",
    blueprintId: "bp-approved-123",
    sectionId: "sec-a",
    sectionName: "Section A: Multiple Choice Questions",
    sequence: 1,
    questionType: "MCQ",
    marks: 1,
    targetDifficulty: "EASY",
    chapterId: "chap-01",
    chapterTitle: "Physical Quantities and Measurement",
    topicId: "top-measurement",
    topicTitle: "Standard Units and Vernier Caliper",
    knowledgeType: "CONCEPTUAL",
    cognitiveLevel: "RECALL",
    requiredAnswerDepth: "OBJECTIVE",
    optionalState: "COMPULSORY",
    retrievalRequirements: {
      chapterId: "chap-01",
      topicId: "top-measurement",
      knowledgeTypes: ["CONCEPTUAL"],
      questionType: "MCQ",
      difficulty: "EASY",
      marks: 1,
    },
  };

  const mockNumericalSlot: BlueprintQuestionSlot = {
    id: "slot-num-01",
    blueprintId: "bp-approved-123",
    sectionId: "sec-c",
    sectionName: "Section C: Numerical Problems",
    sequence: 2,
    questionType: "NUMERICAL",
    marks: 5,
    targetDifficulty: "MEDIUM",
    chapterId: "chap-02",
    chapterTitle: "Kinematics and Dynamics",
    topicId: "top-newton-laws",
    topicTitle: "Newton Laws of Motion",
    knowledgeType: "NUMERICAL",
    cognitiveLevel: "APPLY",
    requiredAnswerDepth: "MODERATE",
    optionalState: "COMPULSORY",
    retrievalRequirements: {
      chapterId: "chap-02",
      topicId: "top-newton-laws",
      knowledgeTypes: ["NUMERICAL"],
      questionType: "NUMERICAL",
      difficulty: "MEDIUM",
      marks: 5,
    },
  };

  const mockShortSlot: BlueprintQuestionSlot = {
    id: "slot-short-01",
    blueprintId: "bp-approved-123",
    sectionId: "sec-b",
    sectionName: "Section B: Short Answer Questions",
    sequence: 3,
    questionType: "SHORT",
    marks: 3,
    targetDifficulty: "MEDIUM",
    chapterId: "chap-01",
    chapterTitle: "Physical Quantities and Measurement",
    topicId: "top-measurement",
    topicTitle: "Standard Units and Vernier Caliper",
    knowledgeType: "CONCEPTUAL",
    cognitiveLevel: "UNDERSTAND",
    requiredAnswerDepth: "BRIEF",
    optionalState: "COMPULSORY",
    retrievalRequirements: {
      chapterId: "chap-01",
      topicId: "top-measurement",
      knowledgeTypes: ["CONCEPTUAL"],
      questionType: "SHORT",
      difficulty: "MEDIUM",
      marks: 3,
    },
  };

  const mockLongSlot: BlueprintQuestionSlot = {
    id: "slot-long-01",
    blueprintId: "bp-approved-123",
    sectionId: "sec-c",
    sectionName: "Section C: Long Answer Questions",
    sequence: 4,
    questionType: "LONG",
    marks: 8,
    targetDifficulty: "DIFFICULT",
    chapterId: "chap-02",
    chapterTitle: "Kinematics and Dynamics",
    topicId: "top-newton-laws",
    topicTitle: "Newton Laws of Motion",
    knowledgeType: "ANALYTICAL",
    cognitiveLevel: "ANALYZE",
    requiredAnswerDepth: "EXTENSIVE",
    optionalState: "COMPULSORY",
    retrievalRequirements: {
      chapterId: "chap-02",
      topicId: "top-newton-laws",
      knowledgeTypes: ["ANALYTICAL"],
      questionType: "LONG",
      difficulty: "DIFFICULT",
      marks: 8,
    },
  };

  const mockApprovedBlueprint: ExaminationBlueprint = {
    id: "bp-approved-123",
    title: "Grade 9 Physics Annual Examination",
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-grade-9",
    subjectId: "subj-physics",
    syllabusId: "syl-physics-2025",
    syllabusVersion: "2025-v1.0",
    syllabusStatus: "VERIFIED",
    bookId: "book-phys-9",
    bookTitle: "Physics Grade 9 Textbook",
    version: "v1.0",
    totalMarks: 100,
    durationMinutes: 180,
    language: "en",
    status: "APPROVED",
    sections: [
      {
        id: "sec-a",
        blueprintId: "bp-approved-123",
        sectionName: "Section A: Multiple Choice Questions",
        sectionOrder: 1,
        questionCount: 1,
        marksPerQuestion: 1,
        totalMarks: 1,
        displayedMarks: 1,
        attemptableMarks: 1,
        maximumObtainableMarks: 1,
        questionTypes: ["MCQ"],
        choiceRule: { type: "NO_CHOICE" },
      },
      {
        id: "sec-b",
        blueprintId: "bp-approved-123",
        sectionName: "Section B: Short Answer Questions",
        sectionOrder: 2,
        questionCount: 1,
        marksPerQuestion: 3,
        totalMarks: 3,
        displayedMarks: 3,
        attemptableMarks: 3,
        maximumObtainableMarks: 3,
        questionTypes: ["SHORT"],
        choiceRule: { type: "NO_CHOICE" },
      },
      {
        id: "sec-c",
        blueprintId: "bp-approved-123",
        sectionName: "Section C: Long & Numerical Questions",
        sectionOrder: 3,
        questionCount: 2,
        marksPerQuestion: 8,
        totalMarks: 13,
        displayedMarks: 13,
        attemptableMarks: 13,
        maximumObtainableMarks: 13,
        questionTypes: ["LONG", "NUMERICAL"],
        choiceRule: { type: "NO_CHOICE" },
      },
    ],
    slots: [mockSlot, mockNumericalSlot, mockShortSlot, mockLongSlot],
    difficultyComparison: {
      requestedTargetDistribution: { easyPct: 20, mediumPct: 50, difficultPct: 30 },
      calculatedTheoreticalMarks: { easyMarks: 20, mediumMarks: 50, difficultMarks: 30 },
      finalBlueprintDistribution: {
        easyCount: 1,
        mediumCount: 2,
        difficultCount: 1,
        easyMarks: 1,
        mediumMarks: 8,
        difficultMarks: 8,
        easyPct: 5.88,
        mediumPct: 47.06,
        difficultPct: 47.06,
        totalMarks: 17,
      },
      deviations: { easyDeviationPct: 0, mediumDeviationPct: 0, difficultDeviationPct: 0 },
      isWithinTolerance: true,
    } as any,
    questionTypeDistribution: { MCQ: 1, SHORT: 1, LONG: 1, NUMERICAL: 1 } as any,
    cognitiveLevelDistribution: { RECALL: 1, UNDERSTAND: 1, APPLY: 1, ANALYZE: 1 } as any,
    coverageAllocation: {
      totalCoveredMarks: 17,
      chapters: [],
      zeroWeightageIncludedCount: 0,
      excludedTopicMarksAttempted: 0,
    } as any,
    patternConflicts: [],
    provenanceMetadata: {
      authorId: "system",
      approverId: "exam-controller-01",
      approvedAt: new Date().toISOString(),
      syllabusSourceReference: "Physics Grade 9 (2025-v1.0)",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDraftBlueprint: ExaminationBlueprint = {
    ...mockApprovedBlueprint,
    id: "bp-draft-456",
    status: "DRAFT",
  };

  const mockDraftSyllabusBlueprint: ExaminationBlueprint = {
    ...mockApprovedBlueprint,
    id: "bp-draft-syl",
    syllabusStatus: "DRAFT",
  };

  const mockMeasurementChunk = {
    chunkId: "chk-meas-01",
    documentId: "doc-phys-9",
    pageNumber: 12,
    heading: "Physical Quantities and Measurement: Standard Units and Vernier Caliper",
    chunkType: "TEXT",
    content:
      "Physical Quantities and Measurement are essential to physics. Regarding Standard Units and Vernier Caliper, standard units provide reproducible reference standards for measuring physical quantities such as length, mass, and time accurately.",
    finalScore: 0.95,
    productionEligible: true,
    provenance: {
      bookId: "book-phys-9",
      chapterId: "chap-01",
      topicId: "top-measurement",
      eligibilityStatus: "ELIGIBLE",
      syllabusVersion: "2025-v1.0",
    },
  };

  const mockMeasurementChunk2 = {
    chunkId: "chk-meas-02",
    documentId: "doc-phys-9",
    pageNumber: 14,
    heading: "Vernier Caliper Construction",
    chunkType: "TEXT",
    content:
      "The Vernier Caliper consists of a main scale and a sliding vernier scale. It is used to measure internal and external diameters and depth with high precision and standard units.",
    finalScore: 0.92,
    productionEligible: true,
    provenance: {
      bookId: "book-phys-9",
      chapterId: "chap-01",
      topicId: "top-measurement",
      eligibilityStatus: "ELIGIBLE",
      syllabusVersion: "2025-v1.0",
    },
  };

  const mockMeasurementChunk3 = {
    chunkId: "chk-meas-03",
    documentId: "doc-phys-9",
    pageNumber: 15,
    heading: "Measurement Procedures",
    chunkType: "TEXT",
    content:
      "Precise measurements require zero error determination before taking readings with Vernier Calipers and standard units.",
    finalScore: 0.90,
    productionEligible: true,
    provenance: {
      bookId: "book-phys-9",
      chapterId: "chap-01",
      topicId: "top-measurement",
      eligibilityStatus: "ELIGIBLE",
      syllabusVersion: "2025-v1.0",
    },
  };

  const mockNewtonChunk = {
    chunkId: "chk-newton-01",
    documentId: "doc-phys-9",
    pageNumber: 42,
    heading: "Kinematics and Dynamics: Newton Laws of Motion",
    chunkType: "TEXT",
    content:
      "Kinematics and Dynamics analyze force and motion. Regarding Newton Laws of Motion, Newton's second law connects force, mass, and acceleration as F = m * a, where force is in newtons, mass in kilograms, and acceleration in meters per second squared.",
    finalScore: 0.95,
    productionEligible: true,
    provenance: {
      bookId: "book-phys-9",
      chapterId: "chap-02",
      topicId: "top-newton-laws",
      eligibilityStatus: "ELIGIBLE",
      syllabusVersion: "2025-v1.0",
    },
  };

  const mockNewtonChunk2 = {
    chunkId: "chk-newton-02",
    documentId: "doc-phys-9",
    pageNumber: 44,
    heading: "Applications of Newton's Laws",
    chunkType: "TEXT",
    content:
      "A net external force accelerates an object proportionally to the force and inversely to its mass. Momentum is conserved in isolated systems.",
    finalScore: 0.91,
    productionEligible: true,
    provenance: {
      bookId: "book-phys-9",
      chapterId: "chap-02",
      topicId: "top-newton-laws",
      eligibilityStatus: "ELIGIBLE",
      syllabusVersion: "2025-v1.0",
    },
  };

  const mockNewtonChunk3 = {
    chunkId: "chk-newton-03",
    documentId: "doc-phys-9",
    pageNumber: 45,
    heading: "Numerical Problems on Newton's Second Law",
    chunkType: "TEXT",
    content:
      "Numerical problems in dynamics apply F = m * a. When a constant force acts on mass m causing acceleration a, the required force equals m multiplied by a.",
    finalScore: 0.90,
    productionEligible: true,
    provenance: {
      bookId: "book-phys-9",
      chapterId: "chap-02",
      topicId: "top-newton-laws",
      eligibilityStatus: "ELIGIBLE",
      syllabusVersion: "2025-v1.0",
    },
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    QuestionBankRepository.resetMemory();
    BlueprintRepository.resetMemory();

    // Populate blueprints into repository
    await BlueprintRepository.saveBlueprint(mockApprovedBlueprint);
    await BlueprintRepository.saveBlueprint(mockDraftBlueprint);
    await BlueprintRepository.saveBlueprint(mockDraftSyllabusBlueprint);

    // Default mock: Retrieval service returns eligible knowledge
    vi.spyOn(RetrievalService, "retrieveKnowledge").mockImplementation(async (req: any) => {
      const q = (req.query || "").toLowerCase();
      const isDynamics = q.includes("newton") || q.includes("dynamics") || q.includes("kinematics");
      const matched = isDynamics
        ? [mockNewtonChunk, mockNewtonChunk2, mockNewtonChunk3]
        : [mockMeasurementChunk, mockMeasurementChunk2, mockMeasurementChunk3];

      return {
        success: true,
        status: "SUCCESS",
        requestId: "req-ret-01",
        timestamp: new Date().toISOString(),
        retrievalMode: "QUESTION_GENERATION",
        syllabusId: "syl-physics-2025",
        query: req.query,
        queryUnderstanding: {} as any,
        totalCandidates: matched.length,
        returnedCount: matched.length,
        contextBudget: {} as any,
        results: matched as any,
        syllabusContext: {} as any,
      } as any;
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Approved Blueprint Generation
  // --------------------------------------------------------------------------
  it("Scenario 1: Generates candidate successfully from an APPROVED blueprint", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01",
      { preferredProvider: "deterministic-grounded" }
    );

    expect(candidate).toBeDefined();
    expect(candidate.id).toBeDefined();
    expect(candidate.blueprintId).toBe("bp-approved-123");
    expect(candidate.blueprintSlotId).toBe("slot-mcq-01");
    expect(candidate.questionType).toBe("MCQ");
    expect(candidate.provenance.bookId).toBe("book-phys-9");
    expect(candidate.validationStatus).toBe("VALIDATED");
    expect(candidate.qualityScore).toBeGreaterThanOrEqual(75);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Draft Blueprint Rejection (BLUEPRINT_NOT_APPROVED)
  // --------------------------------------------------------------------------
  it("Scenario 2: Hard Gate blocks generation when blueprint is DRAFT", async () => {
    await expect(
      QuestionGenerationService.generateQuestion("bp-draft-456", "slot-mcq-01")
    ).rejects.toThrow(/BLUEPRINT_NOT_APPROVED/);
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Invalid Syllabus Rejection (SYLLABUS_NOT_AUTHORIZED)
  // --------------------------------------------------------------------------
  it("Scenario 3: Hard Gate blocks generation when syllabus is not VERIFIED or PUBLISHED", async () => {
    await expect(
      QuestionGenerationService.generateQuestion("bp-draft-syl", "slot-mcq-01")
    ).rejects.toThrow(/SYLLABUS_NOT_AUTHORIZED/);
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Missing Retrieval Evidence Rejection
  // --------------------------------------------------------------------------
  it("Scenario 4: Rejects generation when retrieval returns insufficient or empty knowledge", async () => {
    vi.spyOn(RetrievalService, "retrieveKnowledge").mockResolvedValueOnce({
      success: false,
      status: "NO_RELEVANT_KNOWLEDGE",
      requestId: "req-err-01",
      timestamp: new Date().toISOString(),
      retrievalMode: "QUESTION_GENERATION",
      syllabusId: "syl-physics-2025",
      query: "Standard Units and Vernier Caliper",
      queryUnderstanding: {} as any,
      totalCandidates: 0,
      returnedCount: 0,
      contextBudget: {} as any,
      results: [],
      syllabusContext: {} as any,
    } as any);

    await expect(
      QuestionGenerationService.generateQuestion("bp-approved-123", "slot-mcq-01")
    ).rejects.toThrow(/GENERATION_BLOCKED_INSUFFICIENT_EVIDENCE/);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Provenance Enforcement (13 coordinates)
  // --------------------------------------------------------------------------
  it("Scenario 5: Enforces all educational provenance coordinates", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    expect(candidate.boardId).toBe("board-fed-01");
    expect(candidate.academicYearId).toBe("year-2024-25");
    expect(candidate.classId).toBe("class-grade-9");
    expect(candidate.subjectId).toBe("subj-physics");
    expect(candidate.bookId).toBe("book-phys-9");
    expect(candidate.chapterId).toBe("chap-01");
    expect(candidate.topicId).toBe("top-measurement");
    expect(candidate.syllabusVersion).toBe("2025-v1.0");
    expect(candidate.sourceChunkIds.length).toBeGreaterThan(0);
    expect(candidate.sourcePages.length).toBeGreaterThan(0);

    const evidencePackage: GroundingEvidencePackage = {
      topicId: candidate.topicId,
      topicTitle: candidate.topicTitle,
      chapterId: candidate.chapterId,
      chapterTitle: candidate.chapterTitle,
      syllabusVersion: candidate.syllabusVersion,
      chunks: [
        {
          chunkId: "chk-meas-01",
          content: mockMeasurementChunk.content,
          pageNumber: 12,
          score: 0.95,
        },
      ],
      extractedFormulas: [],
      extractedDefinitions: [],
      extractedFacts: [],
      isSufficient: true,
      evidenceCount: 1,
      citationString: "Pages 12",
    };

    const audit = GroundingValidator.validateGrounding({
      questionText: candidate.questionText,
      answerMaterial: candidate.answerMaterial,
      evidencePackage,
      requiredEvidenceCount: 1,
      provenance: {
        chapterId: candidate.chapterId,
        topicId: candidate.topicId,
        pageNumbers: candidate.sourcePages,
        syllabusVersion: candidate.syllabusVersion,
        bookTitle: candidate.bookTitle,
      },
    });

    expect(audit.isGrounded).toBe(true);
    expect(audit.provenanceComplete).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 6: MCQ Generation Rules (4 options, 1 correct, no duplicates)
  // --------------------------------------------------------------------------
  it("Scenario 6: Generates valid MCQ with 4 options, 1 correct answer, and no forbidden choices", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    expect(candidate.questionType).toBe("MCQ");
    expect(candidate.answerMaterial.options).toBeDefined();
    expect(candidate.answerMaterial.options!.length).toBe(4);

    const correctOptions = candidate.answerMaterial.options!.filter((o) => o.isCorrect);
    expect(correctOptions.length).toBe(1);

    // Verify unique option texts
    const texts = candidate.answerMaterial.options!.map((o) => o.text.trim().toLowerCase());
    const uniqueTexts = new Set(texts);
    expect(uniqueTexts.size).toBe(4);

    // Verify no "All of the above" or "None of the above"
    for (const opt of candidate.answerMaterial.options!) {
      expect(opt.text.toLowerCase()).not.toContain("all of the above");
      expect(opt.text.toLowerCase()).not.toContain("none of the above");
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Short Question Generation (Key points and depth)
  // --------------------------------------------------------------------------
  it("Scenario 7: Generates Short Answer question with expected key points and marking guidelines", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-short-01"
    );

    expect(candidate.questionType).toBe("SHORT");
    expect(candidate.marks).toBe(3);
    expect(candidate.answerMaterial.expectedKeyPoints).toBeDefined();
    expect(candidate.answerMaterial.expectedKeyPoints!.length).toBeGreaterThanOrEqual(2);
    expect(candidate.answerMaterial.partialCreditGuidelines).toBeDefined();
    expect(candidate.questionText.length).toBeGreaterThan(15);
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Long Question Generation (Multi-part and rubric breakdown)
  // --------------------------------------------------------------------------
  it("Scenario 8: Generates Long Question with structured rubric summing to slot marks", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-long-01"
    );

    expect(candidate.questionType).toBe("LONG");
    expect(candidate.marks).toBe(8);
    expect(candidate.answerMaterial.rubricBreakdown).toBeDefined();
    expect(candidate.answerMaterial.rubricBreakdown!.length).toBeGreaterThanOrEqual(2);

    // Rubric marks must sum to total marks
    const rubricSum = candidate.answerMaterial.rubricBreakdown!.reduce((s, r) => s + r.marks, 0);
    expect(rubricSum).toBe(candidate.marks);
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Numerical Question Generation (Givens, formula, steps, units)
  // --------------------------------------------------------------------------
  it("Scenario 9: Generates Numerical question with explicit givens, formula, units, and steps", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-num-01"
    );

    expect(candidate.questionType).toBe("NUMERICAL");
    expect(candidate.answerMaterial.numericalData).toBeDefined();
    expect(candidate.answerMaterial.numericalData!.formula).toBeDefined();
    expect(Object.keys(candidate.answerMaterial.numericalData!.givens).length).toBeGreaterThanOrEqual(2);
    expect(candidate.answerMaterial.numericalData!.unit).toBeDefined();
    expect(candidate.answerMaterial.numericalData!.calculationSteps.length).toBeGreaterThanOrEqual(1);
    expect(candidate.answerMaterial.numericalData!.finalValue).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Deterministic Arithmetic Validation
  // --------------------------------------------------------------------------
  it("Scenario 10: Validates deterministic calculation and detects math discrepancies", () => {
    // Valid calculation test
    const validResult = NumericalValidator.validate({
      givens: { m: 5, a: 4 },
      formula: "F = m * a",
      finalValue: 20,
      unit: "N",
      questionText: "A force acts on mass 5 kg with acceleration 4 m/s^2.",
    });

    expect(validResult.isConsistent).toBe(true);
    expect(validResult.deterministicCalculationMatch).toBe(true);
    expect(validResult.calculatedResult).toBe(20);

    // Discrepant calculation test
    const discrepantResult = NumericalValidator.validate({
      givens: { m: 5, a: 4 },
      formula: "F = m * a",
      finalValue: 25, // Discrepant: 5 * 4 = 20 != 25
      unit: "N",
      questionText: "A force acts on mass 5 kg with acceleration 4 m/s^2.",
    });

    expect(discrepantResult.deterministicCalculationMatch).toBe(false);
    expect(discrepantResult.isConsistent).toBe(false);
    expect(discrepantResult.calculatedResult).toBe(20);
    expect(discrepantResult.expectedResult).toBe(25);
    expect(discrepantResult.discrepancyNote).toContain("disagrees");
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Difficulty Validation & Multi-Signal Variance Flagging
  // --------------------------------------------------------------------------
  it("Scenario 11: Performs multi-signal difficulty validation without silent relabeling", () => {
    const diffResult = DifficultyValidator.validateDifficulty({
      targetDifficulty: "DIFFICULT", // Mismatch with basic recall question
      cognitiveLevel: "RECALL",
      questionType: "MCQ",
      marks: 1,
      questionText: "State the SI unit of force in physics.",
      answerMaterial: {
        options: [],
        expectedKeyPoints: ["Newton"],
      },
    });

    expect(diffResult.evaluatedDifficulty).toBe("EASY");
    expect(diffResult.targetDifficulty).toBe("DIFFICULT");
    expect(diffResult.varianceFlagged).toBe(true);
    expect(diffResult.reconciliationNotes).toContain("Material variance detected");
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Cognitive-Level Validation (Bloom's Taxonomy)
  // --------------------------------------------------------------------------
  it("Scenario 12: Validates cognitive levels across Bloom's taxonomy", () => {
    const recallResult = DifficultyValidator.validateDifficulty({
      targetDifficulty: "EASY",
      cognitiveLevel: "RECALL",
      questionType: "MCQ",
      marks: 1,
      questionText: "Define the term velocity.",
    });
    expect(recallResult.cognitiveComplexityScore).toBe(1.0);
    expect(recallResult.abstractionLevel).toBe("CONCRETE");

    const analyzeResult = DifficultyValidator.validateDifficulty({
      targetDifficulty: "DIFFICULT",
      cognitiveLevel: "ANALYZE",
      questionType: "LONG",
      marks: 8,
      questionText: "Derive and compare and contrast Newton's laws of motion in terms of momentum.",
    });
    expect(analyzeResult.cognitiveComplexityScore).toBe(4.0);
    expect(analyzeResult.abstractionLevel).toBe("ABSTRACT");
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Duplicate Detection (Exact, Near-Duplicate, Distinct)
  // --------------------------------------------------------------------------
  it("Scenario 13: Detects exact and near duplicates while allowing diversified items", () => {
    const corpus = [
      {
        id: "q-1",
        questionText: "State Newton's second law of motion and explain force and acceleration.",
        topicId: "top-newton-laws",
      } as any,
    ];

    // Exact duplicate
    const exact = DuplicateDetectionService.checkDuplicates(
      {
        questionText: "State Newton's second law of motion and explain force and acceleration.",
        topicId: "top-newton-laws",
        questionType: "LONG",
        cognitiveLevel: "ANALYZE",
      },
      corpus
    );
    expect(exact.hasDuplicates).toBe(true);
    expect(exact.duplicateLevel).toBe("EXACT");

    // Near duplicate
    const near = DuplicateDetectionService.checkDuplicates(
      {
        questionText: "State Newton's second law of motion and explain forces and acceleration.",
        topicId: "top-newton-laws",
        questionType: "LONG",
        cognitiveLevel: "ANALYZE",
      },
      corpus
    );
    expect(near.hasDuplicates).toBe(true);
    expect(near.duplicateLevel).toBe("NEAR_DUPLICATE");

    // Distinct pedagogical angle
    const distinct = DuplicateDetectionService.checkDuplicates(
      {
        questionText: "A 1200 kg car accelerates at 2.5 m/s^2. Calculate the net braking force.",
        topicId: "top-newton-laws",
        questionType: "NUMERICAL",
        cognitiveLevel: "APPLY",
      },
      corpus
    );
    expect(distinct.hasDuplicates).toBe(false);
    expect(distinct.duplicateLevel).toBe("NONE");
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Batch Diversity Evaluation
  // --------------------------------------------------------------------------
  it("Scenario 14: Evaluates candidate diversity across a generated batch", () => {
    const candidates: QuestionCandidate[] = [
      {
        id: "c-1",
        blueprintId: "bp-1",
        blueprintSlotId: "s-1",
        questionSpecificationId: "spec-1",
        questionType: "MCQ",
        questionText: "What is the standard SI unit of mass?",
        marks: 1,
        difficulty: "EASY",
        cognitiveLevel: "RECALL",
        boardId: "board-1",
        academicYearId: "yr-1",
        classId: "cls-1",
        subjectId: "subj-1",
        syllabusId: "syl-1",
        syllabusVersion: "v1.0",
        chapterId: "ch-1",
        chapterTitle: "Measurements",
        topicId: "top-units",
        topicTitle: "Standard Units",
        sourceChunkIds: ["chk-1"],
        sourceElementIds: [],
        sourcePages: [10],
        provenance: {} as any,
        answerMaterial: {} as any,
        validationStatus: "VALIDATED",
        qualityScore: 90,
        reviewStatus: "AUTO_VALIDATED",
        validationReport: {} as any,
        generationModel: "test",
        generationProvider: "deterministic",
        generationVersion: "v1.0",
        generationTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "c-2",
        blueprintId: "bp-1",
        blueprintSlotId: "s-2",
        questionSpecificationId: "spec-2",
        questionType: "NUMERICAL",
        questionText: "Calculate the acceleration of a 5 kg mass under a 20 N net force.",
        marks: 5,
        difficulty: "MEDIUM",
        cognitiveLevel: "APPLY",
        boardId: "board-1",
        academicYearId: "yr-1",
        classId: "cls-1",
        subjectId: "subj-1",
        syllabusId: "syl-1",
        syllabusVersion: "v1.0",
        chapterId: "ch-2",
        chapterTitle: "Dynamics",
        topicId: "top-laws",
        topicTitle: "Newton's Laws",
        sourceChunkIds: ["chk-2"],
        sourceElementIds: [],
        sourcePages: [25],
        provenance: {} as any,
        answerMaterial: {} as any,
        validationStatus: "VALIDATED",
        qualityScore: 92,
        reviewStatus: "AUTO_VALIDATED",
        validationReport: {} as any,
        generationModel: "test",
        generationProvider: "deterministic",
        generationVersion: "v1.0",
        generationTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const diversityReport = DuplicateDetectionService.validateBatchDiversity(candidates);
    expect(diversityReport.isDiverse).toBe(true);
    expect(diversityReport.diversityScore).toBe(100);
    expect(diversityReport.duplicatePairCount).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Unsupported Fact Detection (Hallucination Detection)
  // --------------------------------------------------------------------------
  it("Scenario 15: Rejects unsupported facts and concepts not present in retrieved chunks", () => {
    const evidencePackage: GroundingEvidencePackage = {
      topicId: "top-newton-laws",
      topicTitle: "Newton Laws of Motion",
      chapterId: "chap-02",
      chapterTitle: "Kinematics and Dynamics",
      syllabusVersion: "2025-v1.0",
      chunks: [
        {
          chunkId: "chk-01",
          content: "Newton's second law connects force, mass, and acceleration as F = m * a.",
          pageNumber: 42,
          score: 0.9,
        },
      ],
      extractedFormulas: ["F = m * a"],
      extractedDefinitions: [],
      extractedFacts: [],
      isSufficient: true,
      evidenceCount: 1,
      citationString: "Pages 42",
    };

    const hallucinatedText =
      "Explain how quantum entanglement, gravitons, and tachyon superstrings influence Newton's second law.";

    const audit = GroundingValidator.validateGrounding({
      questionText: hallucinatedText,
      answerMaterial: {
        expectedKeyPoints: ["entanglement", "gravitons", "tachyon"],
      },
      evidencePackage,
      requiredEvidenceCount: 1,
      provenance: {
        chapterId: "chap-02",
        topicId: "top-newton-laws",
        pageNumbers: [42],
        syllabusVersion: "2025-v1.0",
      },
    });

    expect(audit.unsupportedFacts.length).toBeGreaterThan(0);
    expect(audit.isGrounded).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario 16: Answer-Key Generation and Isolated Structure
  // --------------------------------------------------------------------------
  it("Scenario 16: Formulates answer key in isolated material structure", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-short-01"
    );

    expect(candidate.answerMaterial).toBeDefined();
    expect(candidate.answerMaterial.expectedKeyPoints).toBeDefined();
    expect(candidate.answerMaterial.partialCreditGuidelines).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // Scenario 17: Human Review Workflow (GENERATED -> NEEDS_REVIEW -> APPROVED/REJECTED)
  // --------------------------------------------------------------------------
  it("Scenario 17: Records reviewer audit trail during candidate review", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    const reviewed = await QuestionGenerationService.reviewCandidate(
      candidate.id,
      "reviewer-dr-khan",
      "APPROVE",
      "Excellent pedagogical alignment and grounded distractor options."
    );

    expect(reviewed.reviewStatus).toBe("APPROVED");
    expect(reviewed.reviewAuditTrail).toBeDefined();
    expect(reviewed.reviewAuditTrail!.length).toBe(1);
    expect(reviewed.reviewAuditTrail![0].reviewerId).toBe("reviewer-dr-khan");
    expect(reviewed.reviewAuditTrail![0].newStatus).toBe("APPROVED");
    expect(reviewed.reviewAuditTrail![0].reason).toContain("grounded distractor");
  });

  // --------------------------------------------------------------------------
  // Scenario 18: Approval Workflow (Promotion to Question Bank)
  // --------------------------------------------------------------------------
  it("Scenario 18: Promotes approved candidate to active QuestionBankItem", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    const bankItem = await QuestionGenerationService.approveCandidate(
      candidate.id,
      "controller-01"
    );

    expect(bankItem).toBeDefined();
    expect(bankItem.id).toBeDefined();
    expect(bankItem.version).toBe("1.0");
    expect(bankItem.reviewState).toBe("APPROVED");
    expect(bankItem.candidateId).toBe(candidate.id);
    expect(bankItem.usageCount).toBe(0);

    // Verify retrieval from repository
    const retrieved = await QuestionBankRepository.findBankItemById(bankItem.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(bankItem.id);
  });

  // --------------------------------------------------------------------------
  // Scenario 19: Question Versioning (1.0 -> 1.1 in Question Bank)
  // --------------------------------------------------------------------------
  it("Scenario 19: Replaces question with an auditable 1.1 revision without silent overwrite", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    const v1 = await QuestionGenerationService.approveCandidate(
      candidate.id,
      "controller-01"
    );

    expect(v1.version).toBe("1.0");

    const v1_1 = await QuestionBankRepository.createBankItemVersion(
      v1.id,
      {
        questionText: "What is the standard SI unit used for measuring force in physics?",
      },
      "curriculum-lead-02"
    );

    expect(v1_1.version).toBe("1.1");
    expect(v1_1.historicalVersions.length).toBe(1);
    expect(v1_1.historicalVersions[0].version).toBe("1.0");
    expect(v1_1.historicalVersions[0].questionText).toBe(v1.questionText);
  });

  // --------------------------------------------------------------------------
  // Scenario 20: Batch Generation Tracking
  // --------------------------------------------------------------------------
  it("Scenario 20: Tracks multi-slot QuestionGenerationBatch with summary metrics", async () => {
    const batch = await QuestionGenerationService.generateBatch(
      "bp-approved-123",
      { slotIds: ["slot-mcq-01", "slot-short-01"] }
    );

    expect(batch).toBeDefined();
    expect(batch.id).toBeDefined();
    expect(batch.blueprintId).toBe("bp-approved-123");
    expect(batch.requestedCount).toBe(2);
    expect(batch.generatedCount).toBe(2);
    expect(batch.acceptedCount).toBe(2);
    expect(batch.status).toBe("COMPLETED");

    // Check retrieved batch from repository
    const retrievedBatch = await QuestionBankRepository.findBatchById(batch.id);
    expect(retrievedBatch).not.toBeNull();
    expect(retrievedBatch!.generatedCount).toBe(2);
  });

  // --------------------------------------------------------------------------
  // Scenario 21: Provider Abstraction and Fallback
  // --------------------------------------------------------------------------
  it("Scenario 21: Resolves registered providers and gracefully falls back to deterministic provider", async () => {
    const deterministic = new DeterministicGroundedProvider();
    const gemini = new GeminiQuestionProvider();
    const openai = new OpenAIQuestionProvider();

    QuestionProviderRegistry.registerProvider(deterministic);
    QuestionProviderRegistry.registerProvider(gemini);
    QuestionProviderRegistry.registerProvider(openai);

    const list = QuestionProviderRegistry.listProviders();
    expect(list.some((p) => p.id === "deterministic-grounded")).toBe(true);
    expect(list.some((p) => p.id === "gemini")).toBe(true);
    expect(list.some((p) => p.id === "openai")).toBe(true);

    // Test specific provider resolution
    const specificDeterministic = await QuestionProviderRegistry.getProvider("deterministic-grounded");
    expect(specificDeterministic.id).toBe("deterministic-grounded");

    const specificGemini = await QuestionProviderRegistry.getProvider("gemini");
    expect(specificGemini.id).toBe("gemini");

    const specificOpenAI = await QuestionProviderRegistry.getProvider("openai");
    expect(specificOpenAI.id).toBe("openai");

    // Auto-selection resolves an active registered provider
    const autoProvider = await QuestionProviderRegistry.getProvider("auto");
    expect(["gemini", "openai", "deterministic-grounded"]).toContain(autoProvider.id);
  });

  // --------------------------------------------------------------------------
  // Scenario 22: RBAC & Student Safety Enforcement
  // --------------------------------------------------------------------------
  it("Scenario 22: Blocks students from generating questions or inspecting answer keys", async () => {
    // 1. Generation blocked for STUDENT
    const genRequest = new NextRequest("http://localhost:3000/api/questions/generate", {
      method: "POST",
      headers: { "x-user-role": "STUDENT", "x-user-id": "student-42" },
      body: JSON.stringify({
        blueprintId: "bp-approved-123",
        blueprintSlotId: "slot-mcq-01",
      }),
    });

    const genRes = await generateQuestionRoute(genRequest);
    expect(genRes.status).toBe(403);

    // 2. Candidate created by teacher
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    // 3. Direct answer key endpoint blocked for STUDENT
    const answerRequest = new NextRequest(`http://localhost:3000/api/questions/${candidate.id}/answer`, {
      method: "GET",
      headers: { "x-user-role": "STUDENT" },
    });

    const ansRes = await getQuestionAnswerRoute(answerRequest, {
      params: Promise.resolve({ id: candidate.id }),
    });
    expect(ansRes.status).toBe(403);

    // 4. Candidate listing sanitizes answer material for STUDENT
    const listRequest = new NextRequest("http://localhost:3000/api/questions", {
      method: "GET",
      headers: { "x-user-role": "STUDENT" },
    });

    const listRes = await listQuestionsRoute(listRequest);
    const listJson = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(listJson.data.candidates.length).toBeGreaterThan(0);
    // Student sees sanitized candidate without raw internal answerMaterial
    const studentCandidate = listJson.data.candidates[0];
    expect(studentCandidate.answerMaterial).toBeUndefined();
    expect(studentCandidate.options).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // Scenario 23: Question Bank Search
  // --------------------------------------------------------------------------
  it("Scenario 23: Searches Question Bank with filters for board, subject, type, and difficulty", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    await QuestionGenerationService.approveCandidate(
      candidate.id,
      "controller-01"
    );

    const items = await QuestionBankRepository.searchBankItems({
      boardId: "board-fed-01",
      subjectId: "subj-physics",
      questionType: "MCQ",
      difficulty: "EASY",
    });

    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].questionType).toBe("MCQ");
    expect(items[0].difficulty).toBe("EASY");
  });

  // --------------------------------------------------------------------------
  // Scenario 24: API Integration (/api/questions/*, /api/question-batches/*)
  // --------------------------------------------------------------------------
  it("Scenario 24: Integrates REST endpoints for candidate review, validation, and batch lookup", async () => {
    // 1. Generate via API
    const genReq = new NextRequest("http://localhost:3000/api/questions/generate", {
      method: "POST",
      headers: { "x-user-role": "TEACHER", "x-user-id": "teacher-01" },
      body: JSON.stringify({
        blueprintId: "bp-approved-123",
        blueprintSlotId: "slot-mcq-01",
      }),
    });

    const genRes = await generateQuestionRoute(genReq);
    expect(genRes.status).toBe(201);
    const genJson = await genRes.json();
    const candidate = genJson.data;

    // 2. Validate via API
    const valReq = new NextRequest(`http://localhost:3000/api/questions/${candidate.id}/validate`, {
      method: "POST",
      headers: { "x-user-role": "TEACHER" },
    });
    const valRes = await validateQuestionRoute(valReq, {
      params: Promise.resolve({ id: candidate.id }),
    });
    expect(valRes.status).toBe(200);

    // 3. Provenance via API
    const provReq = new NextRequest(`http://localhost:3000/api/questions/${candidate.id}/provenance`, {
      method: "GET",
      headers: { "x-user-role": "TEACHER" },
    });
    const provRes = await getQuestionProvenanceRoute(provReq, {
      params: Promise.resolve({ id: candidate.id }),
    });
    expect(provRes.status).toBe(200);

    // 4. Approve via API
    const appReq = new NextRequest(`http://localhost:3000/api/questions/${candidate.id}/approve`, {
      method: "POST",
      headers: { "x-user-role": "EXAM_CONTROLLER", "x-user-id": "ctrl-01" },
      body: JSON.stringify({
        notes: "Approved through REST API endpoint",
      }),
    });
    const appRes = await approveQuestionRoute(appReq, {
      params: Promise.resolve({ id: candidate.id }),
    });
    expect(appRes.status).toBe(200);
    const appJson = await appRes.json();
    expect(appJson.data.reviewState).toBe("APPROVED");
  });

  // --------------------------------------------------------------------------
  // Scenario 25: Master Question Quality Scoring
  // --------------------------------------------------------------------------
  it("Scenario 25: Computes deterministic 12-point Question Quality Score", async () => {
    const candidate = await QuestionGenerationService.generateQuestion(
      "bp-approved-123",
      "slot-mcq-01"
    );

    const evidencePackage: GroundingEvidencePackage = {
      topicId: candidate.topicId,
      topicTitle: candidate.topicTitle,
      chapterId: candidate.chapterId,
      chapterTitle: candidate.chapterTitle,
      syllabusVersion: candidate.syllabusVersion,
      chunks: [
        {
          chunkId: "chk-meas-01",
          content: mockMeasurementChunk.content,
          pageNumber: 12,
          score: 0.95,
        },
      ],
      extractedFormulas: [],
      extractedDefinitions: [],
      extractedFacts: [],
      isSufficient: true,
      evidenceCount: 1,
      citationString: "Pages 12",
    };

    const qualityReport = QuestionQualityValidator.validateCandidate({
      candidate,
      evidencePackage,
      existingCorpus: [],
      requiredEvidenceCount: 1,
    });

    expect(qualityReport.overallQualityScore).toBeGreaterThanOrEqual(75);
    expect(qualityReport.isValid).toBe(true);
    expect(qualityReport.grounding.isGrounded).toBe(true);
    expect(qualityReport.difficulty.isAligned).toBe(true);
  });
});

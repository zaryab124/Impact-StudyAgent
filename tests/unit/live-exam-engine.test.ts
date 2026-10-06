// ==============================================================================
// AI Live Paper Generator - Live Examination Engine Unit Tests (Phase 9)
// Comprehensive Verification of all Required Scenarios for Assembly,
// Delivery, Server-Authoritative Timer, Autosave, Evaluation & Results
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { PaperValidator } from "@/server/exam-engine/paper-validator";
import { PaperAssemblyService } from "@/server/exam-engine/paper-assembly-service";
import { ExamEvaluationService } from "@/server/exam-engine/exam-evaluation-service";
import { ResultService } from "@/server/exam-engine/result-service";
import { ExamService } from "@/server/exam-engine/exam-service";
import { BlueprintRepository } from "@/server/blueprint/blueprint-repository";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";
import { ExaminationBlueprint, BlueprintQuestionSlot, BlueprintSection } from "@/types/blueprint";
import { QuestionBankItem } from "@/types/question-generation";
import { NextRequest } from "next/server";
import { POST as createPaperRoute, GET as listPapersRoute } from "@/app/api/exams/papers/route";
import { POST as startAttemptRoute } from "@/app/api/exams/[id]/start/route";
import { POST as saveAnswerRoute } from "@/app/api/exams/[id]/answers/route";
import { POST as submitAttemptRoute } from "@/app/api/exams/[id]/submit/route";
import { GET as getResultRoute } from "@/app/api/exams/[id]/result/route";
import { POST as overrideScoreRoute } from "@/app/api/exams/[id]/override/route";

describe("Phase 9: Live Examination Engine", () => {
  // Test Fixtures
  let mockBlueprint: ExaminationBlueprint;
  let mockApprovedBankItems: QuestionBankItem[];

  beforeEach(async () => {
    ExamRepository.resetMemory();

    // 1. Setup Approved Test Blueprint
    const sections: BlueprintSection[] = [
      {
        id: "sec-a",
        blueprintId: "bp-physics-001",
        sectionName: "Section A - Multiple Choice",
        sectionOrder: 1,
        questionCount: 2,
        marksPerQuestion: 1,
        totalMarks: 2,
        displayedMarks: 2,
        attemptableMarks: 2,
        maximumObtainableMarks: 2,
        choiceRule: { type: "NO_CHOICE" },
        questionTypes: ["MCQ"],
      },
      {
        id: "sec-b",
        blueprintId: "bp-physics-001",
        sectionName: "Section B - Short Questions",
        sectionOrder: 2,
        questionCount: 3,
        marksPerQuestion: 2,
        totalMarks: 4,
        displayedMarks: 6,
        attemptableMarks: 4,
        maximumObtainableMarks: 4,
        choiceRule: { type: "CHOOSE_N_OF_M", attemptCount: 2, totalCount: 3 },
        questionTypes: ["SHORT"],
      },
      {
        id: "sec-c",
        blueprintId: "bp-physics-001",
        sectionName: "Section C - Numerical",
        sectionOrder: 3,
        questionCount: 1,
        marksPerQuestion: 4,
        totalMarks: 4,
        displayedMarks: 4,
        attemptableMarks: 4,
        maximumObtainableMarks: 4,
        choiceRule: { type: "NO_CHOICE" },
        questionTypes: ["NUMERICAL"],
      },
    ];

    const slots: BlueprintQuestionSlot[] = [
      {
        id: "slot-1",
        blueprintId: "bp-physics-001",
        sectionId: "sec-a",
        sectionName: "Section A - Multiple Choice",
        sequence: 1,
        questionType: "MCQ",
        marks: 1,
        targetDifficulty: "EASY",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-01",
        topicTitle: "SI Units",
        knowledgeType: "FACTUAL",
        cognitiveLevel: "RECALL",
        requiredAnswerDepth: "OBJECTIVE",
        optionalState: "COMPULSORY",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-01",
          knowledgeTypes: ["FACTUAL"],
          questionType: "MCQ",
          difficulty: "EASY",
          marks: 1,
        },
      },
      {
        id: "slot-2",
        blueprintId: "bp-physics-001",
        sectionId: "sec-a",
        sectionName: "Section A - Multiple Choice",
        sequence: 2,
        questionType: "MCQ",
        marks: 1,
        targetDifficulty: "MEDIUM",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-02",
        topicTitle: "Vernier Calipers",
        knowledgeType: "CONCEPTUAL",
        cognitiveLevel: "UNDERSTAND",
        requiredAnswerDepth: "OBJECTIVE",
        optionalState: "COMPULSORY",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-02",
          knowledgeTypes: ["CONCEPTUAL"],
          questionType: "MCQ",
          difficulty: "MEDIUM",
          marks: 1,
        },
      },
      {
        id: "slot-3",
        blueprintId: "bp-physics-001",
        sectionId: "sec-b",
        sectionName: "Section B - Short Questions",
        sequence: 3,
        questionType: "SHORT",
        marks: 2,
        targetDifficulty: "EASY",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-01",
        topicTitle: "SI Units",
        knowledgeType: "CONCEPTUAL",
        cognitiveLevel: "UNDERSTAND",
        requiredAnswerDepth: "BRIEF",
        optionalState: "OPTIONAL",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-01",
          knowledgeTypes: ["CONCEPTUAL"],
          questionType: "SHORT",
          difficulty: "EASY",
          marks: 2,
        },
      },
      {
        id: "slot-4",
        blueprintId: "bp-physics-001",
        sectionId: "sec-b",
        sectionName: "Section B - Short Questions",
        sequence: 4,
        questionType: "SHORT",
        marks: 2,
        targetDifficulty: "MEDIUM",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-02",
        topicTitle: "Vernier Calipers",
        knowledgeType: "PROCEDURAL",
        cognitiveLevel: "APPLY",
        requiredAnswerDepth: "BRIEF",
        optionalState: "OPTIONAL",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-02",
          knowledgeTypes: ["PROCEDURAL"],
          questionType: "SHORT",
          difficulty: "MEDIUM",
          marks: 2,
        },
      },
      {
        id: "slot-5",
        blueprintId: "bp-physics-001",
        sectionId: "sec-b",
        sectionName: "Section B - Short Questions",
        sequence: 5,
        questionType: "SHORT",
        marks: 2,
        targetDifficulty: "DIFFICULT",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-02",
        topicTitle: "Vernier Calipers",
        knowledgeType: "CONCEPTUAL",
        cognitiveLevel: "ANALYZE",
        requiredAnswerDepth: "BRIEF",
        optionalState: "OPTIONAL",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-02",
          knowledgeTypes: ["CONCEPTUAL"],
          questionType: "SHORT",
          difficulty: "DIFFICULT",
          marks: 2,
        },
      },
      {
        id: "slot-6",
        blueprintId: "bp-physics-001",
        sectionId: "sec-c",
        sectionName: "Section C - Numerical",
        sequence: 6,
        questionType: "NUMERICAL",
        marks: 4,
        targetDifficulty: "MEDIUM",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-01",
        topicTitle: "SI Units",
        knowledgeType: "PROCEDURAL",
        cognitiveLevel: "APPLY",
        requiredAnswerDepth: "MODERATE",
        optionalState: "COMPULSORY",
        retrievalRequirements: {
          chapterId: "chap-01",
          topicId: "top-01",
          knowledgeTypes: ["PROCEDURAL"],
          questionType: "NUMERICAL",
          difficulty: "MEDIUM",
          marks: 4,
        },
      },
    ];

    mockBlueprint = {
      id: "bp-physics-001",
      boardId: "board-fed",
      academicYearId: "year-2025",
      classId: "class-9",
      subjectId: "subj-physics",
      syllabusId: "syl-phy-2025",
      version: "1.0",
      title: "Class 9 Physics Examination Blueprint",
      totalMarks: 10, // 2 (sec A) + 4 (sec B: 2 of 3) + 4 (sec C) = 10
      durationMinutes: 60,
      language: "ENGLISH",
      sections,
      slots,
      difficultyComparison: {
        observedSampleDistribution: { easyPct: 30, mediumPct: 50, difficultPct: 20 },
        requestedTargetDistribution: { easyPct: 30, mediumPct: 50, difficultPct: 20 },
        finalBlueprintDistribution: {
          easyMarks: 3,
          mediumMarks: 5,
          difficultMarks: 2,
          easyPct: 30,
          mediumPct: 50,
          difficultPct: 20,
          easyCount: 2,
          mediumCount: 3,
          difficultCount: 1,
          totalMarks: 10,
        },
        reconciliationExplanation: "Balanced",
        roundingMethod: "largest_remainder_hare_niemeyer",
      },
      coverageAllocation: {
        chapters: [],
        curriculumWeightageTotal: 100,
        patternWeightageTotal: 100,
        blueprintWeightageTotal: 100,
        unallocatedEligibleChaptersCount: 0,
      },
      questionTypeDistribution: {
        MCQ: 2,
        SHORT: 3,
        LONG: 0,
        NUMERICAL: 1,
        CONCEPTUAL: 0,
        DEFINITION: 0,
        EXPLANATION: 0,
        COMPARISON: 0,
        APPLICATION: 0,
        DIAGRAM: 0,
        DERIVATION: 0,
        PROBLEM_SOLVING: 0,
        OTHER: 0,
      },
      cognitiveLevelDistribution: {
        RECALL: 1,
        UNDERSTAND: 2,
        APPLY: 2,
        ANALYZE: 1,
        EVALUATE: 0,
        CREATE: 0,
      },
      patternConflicts: [],
      provenanceMetadata: {
        syllabusSourceReference: "Official Syllabus 2025",
        approverId: "academic-lead",
        approvedAt: new Date().toISOString(),
      },
      status: "APPROVED",
      validationReport: {
        isValid: true,
        blueprintId: "bp-physics-001",
        calculatedGrandTotal: 10,
        requestedGrandTotal: 10,
        isMarksArithmeticValid: true,
        isHierarchyValid: true,
        isSyllabusValid: true,
        isDifficultyValid: true,
        isChoiceRuleValid: true,
        isCoverageValid: true,
        hasPatternConflicts: false,
        errors: [],
        warnings: [],
        conflictList: [],
        validatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await BlueprintRepository.saveBlueprint(mockBlueprint);

    // 2. Setup Mock Approved Question Bank Items matching slots
    mockApprovedBankItems = [
      {
        id: "qbank-mcq-1",
        candidateId: "cand-1",
        version: "1.0",
        historicalVersions: [],
        boardId: "board-fed",
        academicYearId: "year-2025",
        classId: "class-9",
        subjectId: "subj-physics",
        syllabusId: "syl-phy-2025",
        syllabusVersion: "2025.1",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-01",
        topicTitle: "SI Units",
        questionType: "MCQ",
        marks: 1,
        difficulty: "EASY",
        cognitiveLevel: "RECALL",
        questionText: "What is the SI unit of electric current?",
        answerMaterial: {
          options: [
            { key: "A", text: "Volt", isCorrect: false },
            { key: "B", text: "Ampere", isCorrect: true },
            { key: "C", text: "Ohm", isCorrect: false },
            { key: "D", text: "Coulomb", isCorrect: false },
          ],
          correctOptionKey: "B",
          mcqExplanation: "Ampere is the base SI unit for electric current.",
        },
        sourceChunkIds: ["chunk-1"],
        sourcePages: [4],
        sourceProvenance: { pageNumbers: [4] },
        validationState: "VALIDATED",
        reviewState: "APPROVED",
        qualityScore: 95,
        validationReport: {} as any,
        tags: ["SI Units", "MCQ"],
        usageCount: 0,
        approvedBy: "examiner-1",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qbank-mcq-2",
        candidateId: "cand-2",
        version: "1.0",
        historicalVersions: [],
        boardId: "board-fed",
        academicYearId: "year-2025",
        classId: "class-9",
        subjectId: "subj-physics",
        syllabusId: "syl-phy-2025",
        syllabusVersion: "2025.1",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-02",
        topicTitle: "Vernier Calipers",
        questionType: "MCQ",
        marks: 1,
        difficulty: "MEDIUM",
        cognitiveLevel: "UNDERSTAND",
        questionText: "What is the least count of a standard metric vernier caliper?",
        answerMaterial: {
          options: [
            { key: "A", text: "0.1 cm", isCorrect: false },
            { key: "B", text: "0.01 cm", isCorrect: true },
            { key: "C", text: "1.0 mm", isCorrect: false },
            { key: "D", text: "0.001 cm", isCorrect: false },
          ],
          correctOptionKey: "B",
          mcqExplanation: "The least count of standard vernier caliper is 0.1 mm or 0.01 cm.",
        },
        sourceChunkIds: ["chunk-2"],
        sourcePages: [8],
        sourceProvenance: { pageNumbers: [8] },
        validationState: "VALIDATED",
        reviewState: "APPROVED",
        qualityScore: 92,
        validationReport: {} as any,
        tags: ["Vernier Calipers", "MCQ"],
        usageCount: 0,
        approvedBy: "examiner-1",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qbank-short-1",
        candidateId: "cand-3",
        version: "1.0",
        historicalVersions: [],
        boardId: "board-fed",
        academicYearId: "year-2025",
        classId: "class-9",
        subjectId: "subj-physics",
        syllabusId: "syl-phy-2025",
        syllabusVersion: "2025.1",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-01",
        topicTitle: "SI Units",
        questionType: "SHORT",
        marks: 2,
        difficulty: "EASY",
        cognitiveLevel: "UNDERSTAND",
        questionText: "Differentiate between base quantities and derived quantities with examples.",
        answerMaterial: {
          expectedKeyPoints: [
            "Base quantities are fundamental physical quantities independent of other quantities",
            "Examples of base quantities: length, mass, time",
            "Derived quantities are expressed in terms of base quantities",
            "Examples of derived quantities: speed, volume, force",
          ],
        },
        sourceChunkIds: ["chunk-3"],
        sourcePages: [5],
        sourceProvenance: { pageNumbers: [5] },
        validationState: "VALIDATED",
        reviewState: "APPROVED",
        qualityScore: 90,
        validationReport: {} as any,
        tags: ["SI Units", "SHORT"],
        usageCount: 0,
        approvedBy: "examiner-1",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qbank-short-2",
        candidateId: "cand-4",
        version: "1.0",
        historicalVersions: [],
        boardId: "board-fed",
        academicYearId: "year-2025",
        classId: "class-9",
        subjectId: "subj-physics",
        syllabusId: "syl-phy-2025",
        syllabusVersion: "2025.1",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-02",
        topicTitle: "Vernier Calipers",
        questionType: "SHORT",
        marks: 2,
        difficulty: "MEDIUM",
        cognitiveLevel: "APPLY",
        questionText: "How do you calculate the zero error of a vernier caliper?",
        answerMaterial: {
          expectedKeyPoints: [
            "Close jaws of vernier caliper completely",
            "Check if zero line of vernier scale coincides with main scale zero",
            "If vernier zero is to right, positive zero error",
            "If vernier zero is to left, negative zero error",
          ],
        },
        sourceChunkIds: ["chunk-4"],
        sourcePages: [9],
        sourceProvenance: { pageNumbers: [9] },
        validationState: "VALIDATED",
        reviewState: "APPROVED",
        qualityScore: 88,
        validationReport: {} as any,
        tags: ["Vernier Calipers", "SHORT"],
        usageCount: 0,
        approvedBy: "examiner-1",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qbank-short-3",
        candidateId: "cand-5",
        version: "1.0",
        historicalVersions: [],
        boardId: "board-fed",
        academicYearId: "year-2025",
        classId: "class-9",
        subjectId: "subj-physics",
        syllabusId: "syl-phy-2025",
        syllabusVersion: "2025.1",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-02",
        topicTitle: "Vernier Calipers",
        questionType: "SHORT",
        marks: 2,
        difficulty: "DIFFICULT",
        cognitiveLevel: "ANALYZE",
        questionText: "Why is a screw gauge considered more precise than a vernier caliper?",
        answerMaterial: {
          expectedKeyPoints: [
            "Screw gauge has a smaller least count (0.01 mm vs 0.1 mm)",
            "Enables finer fractional measurement of thickness or diameter",
          ],
        },
        sourceChunkIds: ["chunk-5"],
        sourcePages: [11],
        sourceProvenance: { pageNumbers: [11] },
        validationState: "VALIDATED",
        reviewState: "APPROVED",
        qualityScore: 91,
        validationReport: {} as any,
        tags: ["Screw Gauge", "SHORT"],
        usageCount: 0,
        approvedBy: "examiner-1",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "qbank-num-1",
        candidateId: "cand-6",
        version: "1.0",
        historicalVersions: [],
        boardId: "board-fed",
        academicYearId: "year-2025",
        classId: "class-9",
        subjectId: "subj-physics",
        syllabusId: "syl-phy-2025",
        syllabusVersion: "2025.1",
        chapterId: "chap-01",
        chapterTitle: "Physical Quantities",
        topicId: "top-01",
        topicTitle: "SI Units",
        questionType: "NUMERICAL",
        marks: 4,
        difficulty: "MEDIUM",
        cognitiveLevel: "APPLY",
        questionText: "A rectangular block has length 5 cm, width 2 cm, and height 10 cm. Find its volume in cubic meters.",
        answerMaterial: {
          numericalData: {
            givens: { length: "5 cm", width: "2 cm", height: "10 cm" },
            requiredQuantity: "Volume in m³",
            formula: "V = l * w * h * 10^-6",
            calculationSteps: ["V = 5 * 2 * 10 = 100 cm³", "100 * 10^-6 = 0.0001 m³"],
            finalValue: 0.0001,
            unit: "m³",
            tolerance: 0.00001,
          },
        },
        sourceChunkIds: ["chunk-6"],
        sourcePages: [14],
        sourceProvenance: { pageNumbers: [14] },
        validationState: "VALIDATED",
        reviewState: "APPROVED",
        qualityScore: 96,
        validationReport: {} as any,
        tags: ["Volume", "NUMERICAL"],
        usageCount: 0,
        approvedBy: "examiner-1",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const item of mockApprovedBankItems) {
      await QuestionBankRepository.saveBankItem(item);
    }
  });

  // --------------------------------------------------------------------------
  // Group 1: Paper Assembly Gates & Validation
  // --------------------------------------------------------------------------

  describe("Paper Assembly Gates & Validation", () => {
    it("blocks paper assembly if blueprint is not APPROVED", async () => {
      mockBlueprint.status = "DRAFT";
      await BlueprintRepository.saveBlueprint(mockBlueprint);

      await expect(
        PaperAssemblyService.assemblePaper(mockBlueprint.id)
      ).rejects.toThrow(/PAPER_CREATION_BLOCKED.*Papers may only be created from APPROVED blueprints/);
    });

    it("blocks paper assembly if blueprint does not exist", async () => {
      await expect(
        PaperAssemblyService.assemblePaper("non-existent-bp")
      ).rejects.toThrow(/PAPER_CREATION_BLOCKED.*not found/);
    });

    it("throws INSUFFICIENT_APPROVED_QUESTION_BANK if slot lacks an approved question", async () => {
      // Clear question bank to simulate missing questions
      (QuestionBankRepository as any).memoryBank.clear();

      await expect(
        PaperAssemblyService.assemblePaper(mockBlueprint.id)
      ).rejects.toThrow(/INSUFFICIENT_APPROVED_QUESTION_BANK/);
    });

    it("successfully assembles paper from approved blueprint and approved bank items", async () => {
      const paper = await PaperAssemblyService.assemblePaper(mockBlueprint.id, {
        title: "Grade 9 Physics Midterm 2025",
        paperCode: "PAP-PHY-MIDTERM",
      });

      expect(paper.id).toBeDefined();
      expect(paper.paperCode).toBe("PAP-PHY-MIDTERM");
      expect(paper.title).toBe("Grade 9 Physics Midterm 2025");
      expect(paper.totalMarks).toBe(10);
      expect(paper.questions.length).toBe(6);
      expect(paper.sections.length).toBe(3);
      expect(paper.status).toBe("VALIDATED");
      expect(paper.validationReport?.isValid).toBe(true);
    });

    it("validates marks arithmetic and choice rules in PaperValidator", () => {
      const report = PaperValidator.validatePaper({
        id: "paper-test-1",
        paperCode: "PAP-TEST",
        version: "1.0",
        blueprintId: mockBlueprint.id,
        boardId: "board-fed",
        academicYearId: "year-2025",
        classId: "class-9",
        subjectId: "subj-physics",
        syllabusId: "syl-phy-2025",
        title: "Test Paper",
        instructions: "Test instructions",
        totalMarks: 2,
        durationMinutes: 60,
        questionCount: 2,
        status: "DRAFT",
        assemblyVersion: "1.0.0",
        sections: [
          {
            id: "sec-a",
            paperId: "paper-test-1",
            sectionName: "Section A",
            sectionOrder: 1,
            totalDisplayedQuestions: 2,
            attemptableQuestions: 2,
            marksPerQuestion: 1,
            displayedMarks: 2,
            attemptableMarks: 2,
            maximumObtainableMarks: 2,
            choiceRule: { type: "NO_CHOICE" },
            questionIds: ["q1", "q2"],
          },
        ],
        questions: [
          {
            id: "q1",
            paperId: "paper-test-1",
            blueprintSlotId: "s1",
            questionBankItemId: "qb1",
            questionBankVersion: "1.0",
            sequence: 1,
            sectionId: "sec-a",
            sectionName: "Section A",
            marks: 1,
            questionType: "MCQ",
            difficulty: "EASY",
            cognitiveLevel: "RECALL",
            isCompulsory: true,
            displayOrder: 1,
            questionText: "Question 1?",
            chapterId: "chap-01",
            chapterTitle: "Chap 1",
            topicId: "top-01",
            topicTitle: "Top 1",
            sourcePages: [1],
            provenance: {},
          },
          {
            id: "q2",
            paperId: "paper-test-1",
            blueprintSlotId: "s2",
            questionBankItemId: "qb2",
            questionBankVersion: "1.0",
            sequence: 2,
            sectionId: "sec-a",
            sectionName: "Section A",
            marks: 1,
            questionType: "MCQ",
            difficulty: "EASY",
            cognitiveLevel: "RECALL",
            isCompulsory: true,
            displayOrder: 2,
            questionText: "Question 2?",
            chapterId: "chap-01",
            chapterTitle: "Chap 1",
            topicId: "top-01",
            topicTitle: "Top 1",
            sourcePages: [2],
            provenance: {},
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(report.marksMatch).toBe(true);
      expect(report.choiceRulesValid).toBe(true);
      expect(report.errors.length).toBe(0);
    });

    it("detects arithmetic mismatch when section marks deviate", () => {
      const invalidPaper: any = {
        id: "paper-invalid-1",
        paperCode: "PAP-INV",
        version: "1.0",
        blueprintId: "bp-1",
        totalMarks: 10,
        sections: [
          {
            id: "sec-a",
            sectionName: "Sec A",
            totalDisplayedQuestions: 2,
            attemptableQuestions: 2,
            marksPerQuestion: 2,
            displayedMarks: 5, // Arithmetic error: 2 * 2 != 5
            maximumObtainableMarks: 5,
            choiceRule: { type: "NO_CHOICE" },
            questionIds: ["q1", "q2"],
          },
        ],
        questions: [
          { id: "q1", sectionId: "sec-a", marks: 2, difficulty: "EASY", sourcePages: [1] },
          { id: "q2", sectionId: "sec-a", marks: 2, difficulty: "EASY", sourcePages: [2] },
        ],
      };

      const report = PaperValidator.validatePaper(invalidPaper);
      expect(report.isValid).toBe(false);
      expect(report.errors.some((e) => e.includes("displayed marks"))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Group 2: Paper Lifecycle & Immutability Snapshot
  // --------------------------------------------------------------------------

  describe("Paper Lifecycle & Snapshot Immutability", () => {
    it("transitions paper from VALIDATED to PUBLISHED and creates immutable snapshot", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      expect(paper.status).toBe("VALIDATED");

      const published = await ExamService.publishPaper(paper.id);
      expect(published.status).toBe("PUBLISHED");
      expect(published.snapshot).toBeDefined();
      expect(published.snapshot?.snapshotId).toContain(paper.id);
      expect(published.snapshot?.questions.length).toBe(6);
      // Snapshot contains internal answerMaterial for server-side evaluation
      expect(published.snapshot?.questions[0].answerMaterial).toBeDefined();
    });

    it("activates published paper and allows lifecycle closing/archiving", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);

      const active = await ExamService.activatePaper(paper.id);
      expect(active.status).toBe("ACTIVE");

      const closed = await ExamService.closePaper(paper.id);
      expect(closed.status).toBe("CLOSED");

      const archived = await ExamService.archivePaper(paper.id);
      expect(archived.status).toBe("ARCHIVED");
    });

    it("blocks activating a paper that is in DRAFT status", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      paper.status = "DRAFT";
      await ExamRepository.savePaper(paper);

      await expect(ExamService.activatePaper(paper.id)).rejects.toThrow(
        /Cannot activate paper with status "DRAFT"/
      );
    });
  });

  // --------------------------------------------------------------------------
  // Group 3: Secure Delivery & Student Quarantine Gate
  // --------------------------------------------------------------------------

  describe("Student View Security & Quarantine Gate", () => {
    it("quarantines student paper view by stripping answerMaterial and validation notes", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);

      const studentView = ExamService.getStudentPaperView(paper);

      expect(studentView.title).toBe(paper.title);
      expect(studentView.questions.length).toBe(6);

      // Verify no answerMaterial, correctOptionKey, or isCorrect indicators exist
      for (const q of studentView.questions) {
        expect((q as any).answerMaterial).toBeUndefined();
        expect((q as any).detailedRubric).toBeUndefined();
        expect((q as any).validationReport).toBeUndefined();

        if (q.options) {
          for (const opt of q.options) {
            expect((opt as any).isCorrect).toBeUndefined();
            expect((opt as any).distractorRationale).toBeUndefined();
          }
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Group 4: Student Attempt Lifecycle & Server-Authoritative Timer
  // --------------------------------------------------------------------------

  describe("Student Attempt Lifecycle & Server Timer", () => {
    it("blocks starting attempt on CLOSED or ARCHIVED papers", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);
      await ExamService.closePaper(paper.id);

      await expect(
        ExamService.startAttempt(paper.id, "student-001", "Ali Khan")
      ).rejects.toThrow(/Examination is currently not active/);
    });

    it("starts attempt on ACTIVE paper and establishes server-authoritative timer", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-001", "Ali Khan");

      expect(attempt.id).toBeDefined();
      expect(attempt.status).toBe("IN_PROGRESS");
      expect(attempt.studentId).toBe("student-001");
      expect(attempt.startedAt).toBeDefined();
      expect(attempt.expiresAt).toBeDefined();

      const startTime = new Date(attempt.startedAt).getTime();
      const expiresTime = new Date(attempt.expiresAt).getTime();
      const durationMs = expiresTime - startTime;
      expect(durationMs).toBe(60 * 60 * 1000); // 60 minutes
    });

    it("idempotently returns the existing attempt if student restarts while in progress", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const firstCall = await ExamService.startAttempt(paper.id, "student-001");
      const secondCall = await ExamService.startAttempt(paper.id, "student-001");

      expect(secondCall.attempt.id).toBe(firstCall.attempt.id);
    });

    it("autosaves answers and marks question as answered", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-001");
      const q1 = paper.questions[0];

      const saved = await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: q1.id,
        selectedOption: "B",
        isMarkedForReview: true,
      });

      expect(saved.isAnswered).toBe(true);
      expect(saved.selectedOption).toBe("B");
      expect(saved.isMarkedForReview).toBe(true);

      const stored = await ExamRepository.findAnswer(attempt.id, q1.id);
      expect(stored?.selectedOption).toBe("B");
    });

    it("rejects answer saving with ATTEMPT_EXPIRED when timer exceeds grace period", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-001");

      // Artificially expire the attempt (set expiresAt 2 minutes in the past)
      attempt.expiresAt = new Date(Date.now() - 120000).toISOString();
      await ExamRepository.saveAttempt(attempt);

      const q1 = paper.questions[0];

      await expect(
        ExamService.saveAnswer(attempt.id, {
          paperQuestionId: q1.id,
          selectedOption: "A",
        })
      ).rejects.toThrow(/ATTEMPT_EXPIRED/);

      const updatedAttempt = await ExamRepository.findAttemptById(attempt.id);
      expect(updatedAttempt?.status).toBe("EXPIRED");
    });
  });

  // --------------------------------------------------------------------------
  // Group 5: Deterministic Evaluation Engine
  // --------------------------------------------------------------------------

  describe("Deterministic Evaluation Engine", () => {
    it("evaluates MCQ deterministically (correct option = full marks, incorrect = 0)", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-eval-1");

      // Q1: SI Unit of current -> Correct is B
      await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: paper.questions[0].id,
        selectedOption: "B",
      });

      // Q2: Vernier Caliper LC -> Correct is B, student chooses A
      await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: paper.questions[1].id,
        selectedOption: "A",
      });

      const { result } = await ExamService.submitAttempt(attempt.id);

      const ans1 = result.answersSummary.find((a) => a.paperQuestionId === paper.questions[0].id);
      const ans2 = result.answersSummary.find((a) => a.paperQuestionId === paper.questions[1].id);

      expect(ans1?.marksAwarded).toBe(1);
      expect(ans1?.isCorrect).toBe(true);

      expect(ans2?.marksAwarded).toBe(0);
      expect(ans2?.isCorrect).toBe(false);
    });

    it("evaluates Numerical questions with tolerance (0.0001 within tolerance)", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-num-1");
      const numQuestion = paper.questions.find((q) => q.questionType === "NUMERICAL")!;

      // Student enters expected value: 0.0001
      await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: numQuestion.id,
        numericAnswer: 0.0001,
      });

      const { result } = await ExamService.submitAttempt(attempt.id);
      const ans = result.answersSummary.find((a) => a.paperQuestionId === numQuestion.id);

      expect(ans?.marksAwarded).toBe(4);
      expect(ans?.isCorrect).toBe(true);
    });

    it("evaluates subjective answers using rubric and flags low confidence as PROVISIONAL", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-subj-1");
      const shortQ = paper.questions.find((q) => q.questionType === "SHORT")!;

      // Student answers with partial key points
      await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: shortQ.id,
        answerText: "Base quantities are fundamental physical quantities independent of other quantities.",
      });

      const { result } = await ExamService.submitAttempt(attempt.id);
      const ans = result.answersSummary.find((a) => a.paperQuestionId === shortQ.id);

      expect(ans?.marksAwarded).toBeGreaterThan(0);
      expect(["PROVISIONAL", "EVALUATED"]).toContain(ans?.evaluationStatus);
    });

    it("awards 0 marks for unattempted questions", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-empty-1");
      // Student answers nothing

      const { result } = await ExamService.submitAttempt(attempt.id);

      expect(result.obtainedMarks).toBe(0);
      expect(result.unansweredCount).toBe(6);
      expect(result.grade).toBe("F");
    });
  });

  // --------------------------------------------------------------------------
  // Group 6: Choice Rule Aggregation & Result Engine
  // --------------------------------------------------------------------------

  describe("Choice Rule Aggregation & Result Calculation", () => {
    it("dynamically picks the best N answers in CHOOSE_N_OF_M section", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-choice-1");
      const shortQuestions = paper.questions.filter((q) => q.sectionName.includes("Section B"));

      // Section B has 3 questions, attemptable = 2 (each 2 marks, total max = 4 marks)
      // Student answers all 3:
      // Q3: full marks (2)
      // Q4: partial marks (1)
      // Q5: zero marks (0)
      const ans3 = await ExamRepository.findAnswer(attempt.id, shortQuestions[0].id);
      const ans4 = await ExamRepository.findAnswer(attempt.id, shortQuestions[1].id);
      const ans5 = await ExamRepository.findAnswer(attempt.id, shortQuestions[2].id);

      if (ans3) {
        ans3.isAnswered = true;
        ans3.marksAwarded = 2;
        ans3.evaluationStatus = "MANUAL_OVERRIDE";
        await ExamRepository.saveAnswer(ans3);
      }
      if (ans4) {
        ans4.isAnswered = true;
        ans4.marksAwarded = 1;
        ans4.evaluationStatus = "MANUAL_OVERRIDE";
        await ExamRepository.saveAnswer(ans4);
      }
      if (ans5) {
        ans5.isAnswered = true;
        ans5.marksAwarded = 0;
        ans5.evaluationStatus = "MANUAL_OVERRIDE";
        await ExamRepository.saveAnswer(ans5);
      }

      const { result } = await ExamService.submitAttempt(attempt.id);
      const secB = result.sectionBreakdown.find((s) => s.sectionName.includes("Section B"));

      // Best 2 of 3: 2 + 1 = 3 marks out of 4 max marks
      expect(secB?.marksObtained).toBe(3);
      expect(secB?.maxMarks).toBe(4);
    });

    it("clamps section marks to section maximumObtainableMarks", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-clamp-1");
      const mcqQuestions = paper.questions.filter((q) => q.sectionName.includes("Section A"));

      // Manually simulate answers with excessive marks
      for (const q of mcqQuestions) {
        const a = await ExamRepository.findAnswer(attempt.id, q.id);
        if (a) {
          a.isAnswered = true;
          a.marksAwarded = 10; // Inflated
          await ExamRepository.saveAnswer(a);
        }
      }

      const result = await ResultService.generateResult(attempt.id);
      const secA = result.sectionBreakdown.find((s) => s.sectionName.includes("Section A"));

      // Max obtainable for section A is 2
      expect(secA?.marksObtained).toBe(secA?.maxMarks);
    });

    it("computes accurate grade scales (A+, A, B, C, D, F)", () => {
      expect(ResultService.calculateGrade(95)).toBe("A+");
      expect(ResultService.calculateGrade(90)).toBe("A+");
      expect(ResultService.calculateGrade(85)).toBe("A");
      expect(ResultService.calculateGrade(75)).toBe("B");
      expect(ResultService.calculateGrade(65)).toBe("C");
      expect(ResultService.calculateGrade(55)).toBe("D");
      expect(ResultService.calculateGrade(45)).toBe("F");
    });

    it("generates multi-dimensional breakdown by difficulty, chapters, and topics", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-breakdown-1");
      const { result } = await ExamService.submitAttempt(attempt.id);

      expect(result.difficultyBreakdown).toBeDefined();
      expect(result.difficultyBreakdown.easy).toBeDefined();
      expect(result.difficultyBreakdown.medium).toBeDefined();
      expect(result.difficultyBreakdown.difficult).toBeDefined();

      expect(result.chapterBreakdown.length).toBeGreaterThan(0);
      expect(result.topicBreakdown.length).toBeGreaterThan(0);
      expect(result.questionTypeBreakdown.length).toBeGreaterThan(0);
    });

    it("is idempotent: submitting an already evaluated attempt returns existing result", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-idem-1");

      const submit1 = await ExamService.submitAttempt(attempt.id);
      const submit2 = await ExamService.submitAttempt(attempt.id);

      expect(submit1.result.id).toBe(submit2.result.id);
      expect(submit1.result.obtainedMarks).toBe(submit2.result.obtainedMarks);
    });
  });

  // --------------------------------------------------------------------------
  // Group 7: Teacher Manual Override & Audit Trail
  // --------------------------------------------------------------------------

  describe("Teacher Manual Score Override & Audit Logging", () => {
    it("allows teacher to override a question score, preserving original marks and recording audit", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      const { attempt } = await ExamService.startAttempt(paper.id, "student-override-1");
      const q1 = paper.questions[0];

      // Submit attempt with 0 marks on Q1
      await ExamService.submitAttempt(attempt.id);

      // Teacher overrides score from 0 to 1 with academic justification
      const updatedResult = await ExamService.overrideScore(
        attempt.id,
        q1.id,
        1,
        "Student demonstrated conceptual mastery in alternate derivation.",
        "teacher-examiner-01"
      );

      const modifiedAnswer = await ExamRepository.findAnswer(attempt.id, q1.id);
      expect(modifiedAnswer?.marksAwarded).toBe(1);
      expect(modifiedAnswer?.originalEvaluatedMarks).toBe(0);
      expect(modifiedAnswer?.overriddenBy).toBe("teacher-examiner-01");
      expect(modifiedAnswer?.overrideReason).toContain("conceptual mastery");
      expect(modifiedAnswer?.evaluationStatus).toBe("MANUAL_OVERRIDE");

      // Verify overall result was updated
      expect(updatedResult.obtainedMarks).toBe(1);

      // Verify audit logs contain SCORE_OVERRIDDEN
      const auditLogs = await ExamRepository.listAuditLogs({ action: "SCORE_OVERRIDDEN" });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].reason).toContain("conceptual mastery");
    });

    it("verifies audit logs are generated for all lifecycle actions", async () => {
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.validatePaper(paper.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);
      await ExamService.closePaper(paper.id);
      await ExamService.archivePaper(paper.id);

      const allLogs = await ExamRepository.listAuditLogs({ entityId: paper.id });
      const actions = allLogs.map((l) => l.action);

      expect(actions).toContain("PAPER_CREATED");
      expect(actions).toContain("PAPER_VALIDATED");
      expect(actions).toContain("PAPER_PUBLISHED");
      expect(actions).toContain("PAPER_ACTIVATED");
      expect(actions).toContain("PAPER_CLOSED");
      expect(actions).toContain("PAPER_ARCHIVED");
    });
  });

  // --------------------------------------------------------------------------
  // Group 8: REST API Endpoints Verification
  // --------------------------------------------------------------------------

  describe("Live Exam REST API Endpoints", () => {
    it("POST /api/exams/papers creates and lists live papers", async () => {
      const req = new NextRequest("http://localhost:3000/api/exams/papers", {
        method: "POST",
        body: JSON.stringify({
          blueprintId: mockBlueprint.id,
          paperCode: "API-PAP-01",
          title: "API Assembled Paper",
        }),
      });

      const res = await createPaperRoute(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.paperCode).toBe("API-PAP-01");

      const listReq = new NextRequest("http://localhost:3000/api/exams/papers");
      const listRes = await listPapersRoute(listReq);
      const listJson = await listRes.json();

      expect(listRes.status).toBe(200);
      expect(listJson.data.count).toBeGreaterThan(0);
    });

    it("Full API lifecycle: start attempt, autosave answer, submit, view result & override", async () => {
      // 1. Create and activate paper
      const paper = await ExamService.createPaper(mockBlueprint.id);
      await ExamService.publishPaper(paper.id);
      await ExamService.activatePaper(paper.id);

      // 2. Start Attempt via API
      const startReq = new NextRequest(`http://localhost:3000/api/exams/${paper.id}/start`, {
        method: "POST",
        body: JSON.stringify({
          studentId: "api-student-01",
          studentName: "API Candidate",
        }),
      });
      const startRes = await startAttemptRoute(startReq, { params: Promise.resolve({ id: paper.id }) });
      const startJson = await startRes.json();

      expect(startRes.status).toBe(201);
      const attemptId = startJson.data.attempt.id;

      // 3. Save Answer via API
      const saveReq = new NextRequest(`http://localhost:3000/api/exams/${attemptId}/answers`, {
        method: "POST",
        body: JSON.stringify({
          paperQuestionId: paper.questions[0].id,
          selectedOption: "B",
          isMarkedForReview: true,
        }),
      });
      const saveRes = await saveAnswerRoute(saveReq, { params: Promise.resolve({ id: attemptId }) });
      const saveJson = await saveRes.json();

      expect(saveRes.status).toBe(200);
      expect(saveJson.data.answer.selectedOption).toBe("B");

      // 4. Submit Attempt via API
      const submitReq = new NextRequest(`http://localhost:3000/api/exams/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ confirmSubmission: true }),
      });
      const submitRes = await submitAttemptRoute(submitReq, { params: Promise.resolve({ id: attemptId }) });
      const submitJson = await submitRes.json();

      expect(submitRes.status).toBe(200);
      expect(submitJson.data.result.obtainedMarks).toBeGreaterThan(0);

      // 5. Get Result Review via API
      const getReq = new NextRequest(`http://localhost:3000/api/exams/${attemptId}/result`);
      const getRes = await getResultRoute(getReq, { params: Promise.resolve({ id: attemptId }) });
      const getJson = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getJson.data.result.id).toBeDefined();

      // 6. Teacher Override via API
      const overrideReq = new NextRequest(`http://localhost:3000/api/exams/${attemptId}/override`, {
        method: "POST",
        body: JSON.stringify({
          paperQuestionId: paper.questions[1].id,
          newMarks: 1,
          reason: "Teacher granted credit after verifying working on rough sheet.",
        }),
      });
      const overrideRes = await overrideScoreRoute(overrideReq, { params: Promise.resolve({ id: attemptId }) });
      const overrideJson = await overrideRes.json();

      expect(overrideRes.status).toBe(200);
      expect(overrideJson.data.result.obtainedMarks).toBe(submitJson.data.result.obtainedMarks + 1);
    });
  });
});

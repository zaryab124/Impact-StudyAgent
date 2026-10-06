// ==============================================================================
// Phase 15 Unit & Lifecycle Tests: Live Paper Generation & Frozen Exam Architecture
// Complete Live Pipeline Verification:
// Request → Config Validation → Blueprint Creation → RAG Retrieval →
// Question Generation → Validation → Replacement Loop → Final Assembly →
// Paper Freeze → Exam Start → Quarantined Delivery → Autosave → Submit → Results
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LivePaperGenerator } from "@/server/exam-engine/live-paper-generator";
import { ExamService } from "@/server/exam-engine/exam-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { BlueprintRepository } from "@/server/blueprint/blueprint-repository";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";
import { ExaminationPaper, ExaminationPaperSnapshot } from "@/types/exam-engine";
import { RAGPipeline } from "@/server/retrieval/rag-pipeline";

describe("Phase 15: Live Paper Generation & Frozen Exam Architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. CONFIGURATION & BLUEPRINT VALIDATION
  // --------------------------------------------------------------------------
  describe("Configuration & Blueprint Generation", () => {
    it("should reject paper generation when required educational hierarchy is missing", async () => {
      await expect(
        LivePaperGenerator.generateLivePaper({
          boardId: "",
          classId: "class-9",
          subjectId: "",
        })
      ).rejects.toThrow(/VALIDATION_ERROR/);
    });

    it("should generate balanced difficulty distribution (~33% Easy, Medium, Difficult)", async () => {
      const result = await LivePaperGenerator.generateLivePaper({
        boardId: "board-fed-01",
        classId: "class-9",
        subjectId: "subj-physics",
        totalQuestions: 15,
        title: "Federal Board Physics Final 2025",
      });

      expect(result.paper).toBeDefined();
      expect(result.blueprint).toBeDefined();
      expect(result.paper.questions.length).toBe(15);

      const easyCount = result.paper.questions.filter((q) => q.difficulty === "EASY").length;
      const medCount = result.paper.questions.filter((q) => q.difficulty === "MEDIUM").length;
      const diffCount = result.paper.questions.filter((q) => q.difficulty === "DIFFICULT").length;

      expect(easyCount).toBe(5);
      expect(medCount).toBe(5);
      expect(diffCount).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // 2. RAG RETRIEVAL & REPLACEMENT LOOP
  // --------------------------------------------------------------------------
  describe("RAG Question Generation & Replacement Loop", () => {
    it("should trigger replacement generation when a candidate fails validation gate", async () => {
      let callCount = 0;
      const spyRAG = vi.spyOn(RAGPipeline, "executePipeline").mockImplementation(async (req): Promise<any> => {
        callCount++;
        // First attempt fails; second attempt succeeds
        if (callCount === 1) {
          return {
            status: "REJECTED",
            success: false,
            error: "Content fails strict syllabus eligibility gate.",
            retrievedEvidence: [],
            assembledContext: "",
            candidate: null,
            provenanceTrail: [],
            executionDurationMs: 10,
          };
        }
        return {
          status: "APPROVED",
          success: true,
          retrievedEvidence: [],
          assembledContext: "Textbook context",
          candidate: {
            id: `cand_rep_${callCount}`,
            questionText: "Which fundamental particle determines the atomic number of an element?",
            questionType: "MCQ",
            marks: 1,
            difficulty: "EASY",
            cognitiveLevel: "UNDERSTAND",
            boardId: req.boardId,
            academicYearId: req.academicYearId || "year-current",
            classId: req.classId,
            subjectId: req.subjectId,
            syllabusId: req.syllabusId,
            syllabusVersion: "v1.0",
            chapterId: req.chapterId || "chap-01",
            chapterTitle: "Atomic Structure",
            topicId: req.topicId || "top-01",
            topicTitle: "Subatomic Particles",
            blueprintId: "bp-test",
            blueprintSlotId: "slot-test",
            questionSpecificationId: "spec-test",
            sourceChunkIds: ["chk-1"],
            sourceElementIds: [],
            sourcePages: [12],
            provenance: {
              chapterId: req.chapterId || "chap-01",
              chapterTitle: "Atomic Structure",
              topicId: req.topicId || "top-01",
              topicTitle: "Subatomic Particles",
              pageNumbers: [12],
              syllabusVersion: "v1.0",
              eligibilityStatus: "ELIGIBLE",
            },
            answerMaterial: {
              correctOptionKey: "A",
              options: [
                { key: "A", text: "Proton", isCorrect: true },
                { key: "B", text: "Neutron", isCorrect: false },
                { key: "C", text: "Electron", isCorrect: false },
                { key: "D", text: "Positron", isCorrect: false },
              ],
            },
            generationModel: "gemini-2.5-pro",
            generationProvider: "GoogleGeminiProvider",
            generationVersion: "v1.0",
            generationTimestamp: new Date().toISOString(),
            validationStatus: "VALIDATED",
            qualityScore: 0.95,
            reviewStatus: "APPROVED",
            validationReport: {
              isValid: true,
              overallQualityScore: 95,
              grounding: { isGrounded: true, groundingScore: 0.95, supportedFacts: ["Proton determines atomic number"], unsupportedFacts: [], provenanceComplete: true, evidenceChunkCount: 1, verificationNotes: "Grounded." },
              difficulty: { targetDifficulty: "EASY", evaluatedDifficulty: "EASY", isAligned: true, cognitiveComplexityScore: 3, reasoningStepsCount: 1, abstractionLevel: "CONCRETE", responseDepthLevel: "OBJECTIVE", varianceFlagged: false, reconciliationNotes: "Aligned." },
              duplication: { hasDuplicates: false, duplicateLevel: "NONE", highestSimilarityScore: 0, analysisDetails: "Unique." },
              curriculum: { isSyllabusEligible: true, chapterMatch: true, topicMatch: true, learningObjectiveCovered: true },
              issues: [],
              validatedAt: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          provenanceTrail: [],
          executionDurationMs: 25,
        };
      });

      const result = await LivePaperGenerator.generateLivePaper({
        boardId: "board-fed-01",
        classId: "class-9",
        subjectId: "subj-chem",
        totalQuestions: 5,
        title: "Chemistry Model Paper",
      });

      expect(result.replacementCount).toBeGreaterThanOrEqual(1);
      expect(result.paper.questions.length).toBe(5);
      expect(result.paper.status).toBe("ACTIVE");
      spyRAG.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // 3. PAPER FREEZING & IMMUTABILITY
  // --------------------------------------------------------------------------
  describe("Paper Freezing & Exam Immutability", () => {
    it("should produce a frozen immutable snapshot with server-only answerMaterial", async () => {
      const result = await LivePaperGenerator.generateLivePaper({
        boardId: "board-fed-01",
        classId: "class-9",
        subjectId: "subj-bio",
        totalQuestions: 6,
        title: "Biology Grade 9 Assessment",
      });

      const paper = result.paper;
      expect(paper.snapshot).toBeDefined();
      expect(paper.snapshot?.snapshotId).toBeDefined();
      expect(paper.snapshot?.frozenAt).toBeDefined();
      expect(paper.snapshot?.questions.length).toBe(6);

      // Snapshot stores answerMaterial for server-side grading
      const snapshotQ1 = paper.snapshot?.questions[0];
      expect(snapshotQ1?.answerMaterial).toBeDefined();

      // Student quarantined view must NOT leak answerKey or answerMaterial
      const studentView = ExamService.getStudentPaperView(paper);
      expect(studentView.questions[0].answerKey).toBeUndefined();
      expect(studentView.questions[0].answerMaterial).toBeUndefined();
    });

    it("should preserve frozen paper across exam attempts without regeneration", async () => {
      const result = await LivePaperGenerator.generateLivePaper({
        boardId: "board-fed-01",
        classId: "class-9",
        subjectId: "subj-math",
        totalQuestions: 5,
        title: "Mathematics Exam",
      });

      const paperId = result.paper.id;
      const initialQuestionIds = result.paper.questions.map((q) => q.id);

      // Student 1 starts attempt
      const attempt1 = await ExamService.startAttempt(paperId, "std-001", "Ali Khan");
      expect(attempt1.paper.id).toBe(paperId);

      // Student 2 starts attempt
      const attempt2 = await ExamService.startAttempt(paperId, "std-002", "Sara Ahmed");
      expect(attempt2.paper.id).toBe(paperId);

      // Paper questions must remain exactly identical
      const reloadedPaper = await ExamRepository.findPaperById(paperId);
      const reloadedQuestionIds = reloadedPaper?.questions.map((q) => q.id);

      expect(reloadedQuestionIds).toEqual(initialQuestionIds);
    });
  });

  // --------------------------------------------------------------------------
  // 4. FULL EXAM LIFECYCLE: AUTOSAVE & DETERMINISTIC EVALUATION
  // --------------------------------------------------------------------------
  describe("Exam Lifecycle: Autosave, Submission & Objective Grading", () => {
    it("should successfully execute start -> autosave -> submit -> grading against frozen snapshot", async () => {
      const result = await LivePaperGenerator.generateLivePaper({
        boardId: "board-fed-01",
        classId: "class-9",
        subjectId: "subj-physics",
        totalQuestions: 5,
        title: "Physics End-of-Term Exam",
      });

      const paper = result.paper;
      const { attempt } = await ExamService.startAttempt(paper.id, "std-live-1", "Hamza");

      // Verify attempt is IN_PROGRESS
      expect(attempt.status).toBe("IN_PROGRESS");
      expect(attempt.expiresAt).toBeDefined();

      // Student autosaves answers
      const q1 = paper.questions[0];
      const savedAns = await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: q1.id,
        selectedOption: "A",
      });
      expect(savedAns.isAnswered).toBe(true);
      expect(savedAns.selectedOption).toBe("A");

      // Student submits exam
      const submitRes = await ExamService.submitAttempt(attempt.id);
      expect(submitRes.attempt.status).toBe("EVALUATED");
      expect(submitRes.result).toBeDefined();
      expect(submitRes.result.totalMarks).toBe(paper.totalMarks);
      expect(typeof submitRes.result.obtainedMarks).toBe("number");
      expect(submitRes.result.chapterBreakdown.length).toBeGreaterThan(0);
    });
  });
});

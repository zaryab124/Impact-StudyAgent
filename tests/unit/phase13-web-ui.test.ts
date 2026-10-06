// ==============================================================================
// AI Live Paper Generator - Phase 13 Web UI & Student Dashboard Unit Tests
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateDifficultyDistribution } from "@/lib/blueprint/calculator";
import { ExamService } from "@/server/exam-engine/exam-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ExaminationPaper } from "@/types/exam-engine";

describe("Phase 13: Web UI & Student Experience Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    ExamRepository.resetMemory();
  });

  // --------------------------------------------------------------------------
  // 1. PAPER GENERATOR CONFIGURATION & DIFFICULTY ALLOCATION
  // --------------------------------------------------------------------------
  describe("Paper Generator Configuration & ~33% Distribution", () => {
    it("should compute exact 33% difficulty distribution for 30 questions without remainder errors", () => {
      const dist = calculateDifficultyDistribution(30);
      expect(dist.easy + dist.medium + dist.difficult).toBe(30);
      expect(dist.easy).toBe(10);
      expect(dist.medium).toBe(10);
      expect(dist.difficult).toBe(10);
      expect(dist.percentageSummary.easyPct).toBe(33.33);
      expect(dist.percentageSummary.mediumPct).toBe(33.33);
      expect(dist.percentageSummary.difficultPct).toBe(33.33);
    });

    it("should handle odd question counts deterministically using largest remainder", () => {
      const dist = calculateDifficultyDistribution(25);
      expect(dist.easy + dist.medium + dist.difficult).toBe(25);
      expect(dist.easy).toBe(8);
      expect(dist.medium).toBe(9);
      expect(dist.difficult).toBe(8);
    });
  });

  // --------------------------------------------------------------------------
  // 2. EXAM EXPERIENCE & STUDENT QUARANTINE
  // --------------------------------------------------------------------------
  describe("Exam Experience & Answer Sanitization", () => {
    const mockPaper: any = {
      id: "paper-ui-test-1",
      paperCode: "PAP-BIO-101",
      title: "Biology Grade 9 Midterm",
      blueprintId: "bp-1",
      boardId: "board-1",
      academicYearId: "yr-1",
      classId: "cls-1",
      subjectId: "subj-1",
      bookId: "bk-1",
      status: "ACTIVE",
      totalMarks: 50,
      durationMinutes: 45,
      sections: [
        {
          id: "sec-1",
          sectionName: "Section A: Objective",
          questionType: "MCQ",
          totalQuestions: 2,
          attemptableQuestions: 2,
          marksPerQuestion: 1,
          maximumObtainableMarks: 2,
          choiceRule: { type: "NO_CHOICE" },
          sequenceOrder: 1,
        },
      ],
      questions: [
        {
          id: "q-1",
          sequence: 1,
          sectionId: "sec-1",
          sectionName: "Section A: Objective",
          questionType: "MCQ",
          marks: 1,
          difficulty: "EASY",
          questionText: "What is the powerhouse of the cell?",
          options: [
            { key: "A", text: "Mitochondria", isCorrect: true },
            { key: "B", text: "Ribosome", isCorrect: false },
          ],
          answerKey: "A",
          rubricCriteria: { correct: "A" },
          sourceProvenance: {
            documentId: "doc-1",
            bookId: "bk-1",
            bookTitle: "Biology 9",
            pageNumber: 25,
            chapterId: "ch-1",
            chapterTitle: "Cell Biology",
            chunkId: "chk-1",
            syllabusId: "syl-1",
            syllabusVersion: "v1.0",
            eligibilityStatus: "ELIGIBLE",
            sourceReference: "Biology 9 p.25",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("getStudentPaperView should quarantine answerKey and isCorrect indicators from student", () => {
      const studentView = ExamService.getStudentPaperView(mockPaper);

      expect(studentView.questions?.length).toBe(1);
      const q = studentView.questions![0];
      // Student must not see answerKey or rubricCriteria
      expect((q as any).answerKey).toBeUndefined();
      expect((q as any).rubricCriteria).toBeUndefined();
      expect((q as any).answerMaterial).toBeUndefined();

      // Options must have isCorrect stripped
      expect(q.options?.length).toBe(2);
      expect((q.options![0] as any).isCorrect).toBeUndefined();
      expect((q.options![1] as any).isCorrect).toBeUndefined();
    });

    it("should start exam attempt and initialize blank answers", async () => {
      await ExamRepository.savePaper(mockPaper);
      const { attempt, paper } = await ExamService.startAttempt(mockPaper.id, "std-1", "Amina Ali");

      expect(attempt.status).toBe("IN_PROGRESS");
      expect(attempt.studentId).toBe("std-1");
      expect(attempt.studentName).toBe("Amina Ali");
      expect(new Date(attempt.expiresAt).getTime()).toBeGreaterThan(Date.now());

      const answers = await ExamRepository.getAnswersForAttempt(attempt.id);
      expect(answers.length).toBe(1);
      expect(answers[0].isAnswered).toBe(false);
    });

    it("saveAnswer should update student response and enforce server timer", async () => {
      await ExamRepository.savePaper(mockPaper);
      const { attempt } = await ExamService.startAttempt(mockPaper.id, "std-2", "Bilal Khan");

      const saved = await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: "q-1",
        selectedOption: "A",
      });

      expect(saved.isAnswered).toBe(true);
      expect(saved.selectedOption).toBe("A");

      // Verify answer retrieved from repository
      const answers = await ExamRepository.getAnswersForAttempt(attempt.id);
      expect(answers[0].selectedOption).toBe("A");
    });

    it("submitAttempt should score objective MCQs deterministically and freeze attempt", async () => {
      await ExamRepository.savePaper(mockPaper);
      const { attempt } = await ExamService.startAttempt(mockPaper.id, "std-3", "Hamza Tariq");

      // Student selects correct option A
      await ExamService.saveAnswer(attempt.id, {
        paperQuestionId: "q-1",
        selectedOption: "A",
      });

      // Submit attempt
      const { attempt: submittedAtt, result } = await ExamService.submitAttempt(attempt.id);

      expect(submittedAtt.status).toBe("EVALUATED");
      expect(submittedAtt.obtainedMarks).toBe(1);
      expect(submittedAtt.percentage).toBe(50); // 1 out of 2 max section marks
      expect(result.obtainedMarks).toBe(1);

      // Attempt is frozen: further saveAnswer calls must be rejected
      await expect(
        ExamService.saveAnswer(attempt.id, {
          paperQuestionId: "q-1",
          selectedOption: "B",
        })
      ).rejects.toThrow(/Only IN_PROGRESS attempts accept answers/);
    });
  });

  // --------------------------------------------------------------------------
  // 3. RESULTS & WEAK AREAS AGGREGATION
  // --------------------------------------------------------------------------
  describe("Results Review & Diagnostic Analysis", () => {
    it("getStudentResultReview should provide detailed question review with earned marks", async () => {
      const mockPaperWith2Qs: any = {
        id: "paper-ui-test-2",
        paperCode: "PAP-PHY-102",
        title: "Physics Grade 9",
        blueprintId: "bp-2",
        boardId: "board-1",
        academicYearId: "yr-1",
        classId: "cls-1",
        subjectId: "subj-phy",
        bookId: "bk-phy",
        status: "ACTIVE",
        totalMarks: 2,
        durationMinutes: 30,
        sections: [
          {
            id: "sec-obj",
            sectionName: "MCQs",
            questionType: "MCQ",
            totalQuestions: 2,
            attemptableQuestions: 2,
            marksPerQuestion: 1,
            maximumObtainableMarks: 2,
            choiceRule: { type: "NO_CHOICE" },
            sequenceOrder: 1,
          },
        ],
        questions: [
          {
            id: "q-p1",
            sequence: 1,
            sectionId: "sec-obj",
            sectionName: "MCQs",
            questionType: "MCQ",
            marks: 1,
            difficulty: "EASY",
            questionText: "Unit of speed is:",
            options: [
              { key: "A", text: "m/s", isCorrect: true },
              { key: "B", text: "kg", isCorrect: false },
            ],
            answerKey: "A",
          },
          {
            id: "q-p2",
            sequence: 2,
            sectionId: "sec-obj",
            sectionName: "MCQs",
            questionType: "MCQ",
            marks: 1,
            difficulty: "MEDIUM",
            questionText: "Unit of force is:",
            options: [
              { key: "A", text: "Newton", isCorrect: true },
              { key: "B", text: "Joule", isCorrect: false },
            ],
            answerKey: "A",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await ExamRepository.savePaper(mockPaperWith2Qs);
      const { attempt } = await ExamService.startAttempt(mockPaperWith2Qs.id, "std-4", "Zainab");

      // Answer Q1 correctly, Q2 incorrectly
      await ExamService.saveAnswer(attempt.id, { paperQuestionId: "q-p1", selectedOption: "A" });
      await ExamService.saveAnswer(attempt.id, { paperQuestionId: "q-p2", selectedOption: "B" });

      await ExamService.submitAttempt(attempt.id);

      const review = await ExamService.getStudentResultReview(attempt.id);
      expect(review.result.obtainedMarks).toBe(1);
      expect(review.result.totalMarks).toBe(2);
      expect(review.result.percentage).toBe(50);
      expect(review.detailedReview.length).toBe(2);
      expect(review.detailedReview[0].marksAwarded).toBe(1);
      expect(review.detailedReview[1].marksAwarded).toBe(0);
    });
  });
});

// ==============================================================================
// AI Live Paper Generator - Concurrency & Race-Condition Pilot Engine (Phase 11)
// Multi-Student Simulated Exam Ingestion, Simultaneous Autosaves & Submissions
// ==============================================================================

import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ExamService } from "@/server/exam-engine/exam-service";
import { PaperAssemblyService } from "@/server/exam-engine/paper-assembly-service";
import { ExaminationPaper } from "@/types/exam-engine";

export interface ConcurrencyPilotMetrics {
  concurrentStudentsCount: number;
  totalAutosaveOperations: number;
  successfulStarts: number;
  successfulSaves: number;
  successfulSubmissions: number;
  zeroAnswerLossVerified: boolean;
  zeroCrossContaminationVerified: boolean;
  totalDurationMs: number;
  operationsPerSecond: number;
  checks: Array<{ check: string; status: "PASS" | "FAIL"; details?: string }>;
  errors: string[];
}

export class ConcurrencyPilot {
  /**
   * Executes a multi-student concurrent examination lifecycle.
   * Simulates N simultaneous students starting, answering multiple questions in parallel,
   * autosaving continuously, and submitting simultaneously.
   */
  public static async executeConcurrencyPilot(params?: {
    studentCount?: number;
    questionsPerPaper?: number;
  }): Promise<ConcurrencyPilotMetrics> {
    const studentCount = params?.studentCount || 10;
    const questionsCount = params?.questionsPerPaper || 4;
    const errors: string[] = [];
    const checks: Array<{ check: string; status: "PASS" | "FAIL"; details?: string }> = [];

    const startTime = Date.now();

    // 1. Prepare Active Examination Paper with Snapshot
    const paperId = `paper_concurrency_${Date.now()}`;
    const testPaper: any = {
      id: paperId,
      paperCode: `CONC-${Date.now().toString().slice(-4)}`,
      title: "Concurrent Stress Testing Physics SSC-I",
      status: "ACTIVE",
      totalMarks: 20,
      passingMarks: 8,
      durationMinutes: 60,
      syllabusVersion: "2024.1",
      metadata: {},
      sections: [
        {
          id: `sec_${paperId}_1`,
          paperId,
          sectionName: "Section A - Objective",
          sectionOrder: 1,
          totalDisplayedQuestions: questionsCount,
          attemptableQuestions: questionsCount,
          marksPerQuestion: 5,
          displayedMarks: questionsCount * 5,
          attemptableMarks: questionsCount * 5,
          maximumObtainableMarks: 20,
          choiceRule: { type: "NO_CHOICE", description: "All compulsory" },
          questionIds: Array.from({ length: questionsCount }, (_, i) => `pq_conc_${i + 1}`),
        },
      ],
      questions: Array.from({ length: questionsCount }, (_, i) => ({
        id: `pq_conc_${i + 1}`,
        paperId,
        sequence: i + 1,
        sectionId: `sec_${paperId}_1`,
        sectionName: "Section A - Objective",
        marks: 5,
        questionType: "MCQ",
        difficulty: "MEDIUM" as const,
        isCompulsory: true,
        questionText: `Physics Stress Test Question ${i + 1}`,
        options: [
          { key: "A", text: "Option A", isCorrect: true },
          { key: "B", text: "Option B", isCorrect: false },
          { key: "C", text: "Option C", isCorrect: false },
        ],
        correctOption: "A",
        solution: "Option A is correct",
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    testPaper.snapshot = await PaperAssemblyService.createSnapshot(testPaper);
    await ExamRepository.savePaper(testPaper);

    // 2. Simultaneous Starts
    const studentIds = Array.from({ length: studentCount }, (_, i) => `student_conc_${i + 1}`);
    const startPromises = studentIds.map((sid) =>
      ExamService.startAttempt(paperId, sid, `Candidate ${sid}`)
    );

    const startResults = await Promise.all(startPromises);
    const successfulStarts = startResults.filter((r) => r.attempt && r.attempt.status === "IN_PROGRESS").length;

    checks.push({
      check: "CONCURRENT_ATTEMPT_INITIALIZATION",
      status: successfulStarts === studentCount ? "PASS" : "FAIL",
      details: `${successfulStarts}/${studentCount} attempts successfully initialized simultaneously without locks or conflicts`,
    });
    if (successfulStarts !== studentCount) {
      errors.push(`Failed to initialize all attempts: got ${successfulStarts}, expected ${studentCount}`);
    }

    // 3. Parallel Autosaves across all students and questions
    const saveOperations: Promise<any>[] = [];
    const expectedAnswersMap = new Map<string, Record<string, string>>(); // studentId -> { questionId: selectedOption }

    for (let sIdx = 0; sIdx < studentCount; sIdx++) {
      const attempt = startResults[sIdx].attempt;
      const sid = studentIds[sIdx];
      const studentExpected: Record<string, string> = {};

      for (let qIdx = 0; qIdx < questionsCount; qIdx++) {
        const qId = `pq_conc_${qIdx + 1}`;
        // Select 'A' for even students, 'B' for odd students
        const option = sIdx % 2 === 0 ? "A" : "B";
        studentExpected[qId] = option;

        saveOperations.push(
          ExamService.saveAnswer(attempt.id, {
            paperQuestionId: qId,
            sequenceNumber: qIdx + 1,
            selectedOption: option,
          })
        );
      }
      expectedAnswersMap.set(sid, studentExpected);
    }

    const saveResults = await Promise.all(saveOperations);
    const successfulSaves = saveResults.filter((a) => a && a.isAnswered).length;
    const totalExpectedSaves = studentCount * questionsCount;

    checks.push({
      check: "CONCURRENT_AUTOSAVE_INTEGRITY",
      status: successfulSaves === totalExpectedSaves ? "PASS" : "FAIL",
      details: `${successfulSaves}/${totalExpectedSaves} autosaves written concurrently with zero drops`,
    });
    if (successfulSaves !== totalExpectedSaves) {
      errors.push(`Autosave drop detected: expected ${totalExpectedSaves}, got ${successfulSaves}`);
    }

    // 4. Simultaneous Submissions
    const submitPromises = startResults.map((res) =>
      ExamService.submitAttempt(res.attempt.id, res.attempt.studentId)
    );
    const submitResults = await Promise.all(submitPromises);
    const successfulSubmissions = submitResults.filter((r) => r.attempt.status === "SUBMITTED" || r.attempt.status === "EVALUATED").length;

    checks.push({
      check: "CONCURRENT_SUBMISSION_AND_EVALUATION",
      status: successfulSubmissions === studentCount ? "PASS" : "FAIL",
      details: `${successfulSubmissions}/${studentCount} attempts submitted and evaluated concurrently without deadlock`,
    });

    // 5. Verification: Zero Answer Loss & Cross-Contamination
    let zeroAnswerLoss = true;
    let zeroCrossContamination = true;

    for (let sIdx = 0; sIdx < studentCount; sIdx++) {
      const attempt = startResults[sIdx].attempt;
      const sid = studentIds[sIdx];
      const expected = expectedAnswersMap.get(sid) || {};

      const savedAnswers = await ExamRepository.getAnswersForAttempt(attempt.id);
      if (savedAnswers.length !== questionsCount) {
        zeroAnswerLoss = false;
      }

      for (const ans of savedAnswers) {
        if (ans.attemptId !== attempt.id) {
          zeroCrossContamination = false;
        }
        if (ans.selectedOption !== expected[ans.paperQuestionId]) {
          zeroAnswerLoss = false;
        }
      }
    }

    checks.push({
      check: "ZERO_ANSWER_LOSS_VERIFICATION",
      status: zeroAnswerLoss ? "PASS" : "FAIL",
      details: zeroAnswerLoss ? "100% of student answers intact and verified" : "Answer loss detected during concurrency",
    });
    checks.push({
      check: "ZERO_CROSS_CONTAMINATION_VERIFICATION",
      status: zeroCrossContamination ? "PASS" : "FAIL",
      details: zeroCrossContamination ? "Strict attempt isolation preserved; no cross-contamination between students" : "Cross-contamination detected",
    });

    const totalDurationMs = Date.now() - startTime;
    const totalOps = studentCount + totalExpectedSaves + studentCount;
    const opsPerSecond = Math.round((totalOps / (totalDurationMs || 1)) * 1000);

    return {
      concurrentStudentsCount: studentCount,
      totalAutosaveOperations: totalExpectedSaves,
      successfulStarts,
      successfulSaves,
      successfulSubmissions,
      zeroAnswerLossVerified: zeroAnswerLoss,
      zeroCrossContaminationVerified: zeroCrossContamination,
      totalDurationMs,
      operationsPerSecond: opsPerSecond,
      checks,
      errors,
    };
  }
}

// ==============================================================================
// AI Live Paper Generator - Master Examination Service Orchestrator (Phase 9)
// Paper Lifecycle, Server-Authoritative Timer, Safe Delivery & Evaluation Gate
// STRICT INVARIANTS:
// 1. Papers only transition: DRAFT -> VALIDATED -> PUBLISHED -> ACTIVE -> CLOSED -> ARCHIVED.
// 2. Timer is strictly server-authoritative; client cannot extend.
// 3. Student view is quarantined; answerMaterial, rubrics & validation are stripped.
// 4. Submissions are idempotent; duplicate calls return the existing evaluation.
// ==============================================================================

import {
  ExaminationPaper,
  ExaminationAttempt,
  StudentAnswer,
  ExaminationResult,
  ExaminationPaperStatus,
} from "@/types/exam-engine";
import { BlueprintRepository } from "@/server/blueprint/blueprint-repository";
import { ExamRepository } from "./exam-repository";
import { PaperAssemblyService, CreatePaperOptions } from "./paper-assembly-service";
import { PaperValidator } from "./paper-validator";
import { ExamEvaluationService } from "./exam-evaluation-service";
import { ResultService } from "./result-service";

export class ExamService {
  // --------------------------------------------------------------------------
  // Paper Lifecycle Management
  // --------------------------------------------------------------------------

  public static async createPaper(
    blueprintId: string,
    options: CreatePaperOptions = {}
  ): Promise<ExaminationPaper> {
    return await PaperAssemblyService.assemblePaper(blueprintId, options);
  }

  public static async validatePaper(
    paperId: string,
    actorId: string = "system-admin"
  ): Promise<ExaminationPaper> {
    const paper = await ExamRepository.findPaperById(paperId);
    if (!paper) {
      throw new Error(`Paper "${paperId}" not found.`);
    }

    const blueprint = await BlueprintRepository.findBlueprintById(paper.blueprintId);
    const report = PaperValidator.validatePaper(paper, blueprint);
    paper.validationReport = report;

    if (report.isValid) {
      if (paper.status === "DRAFT" || paper.status === "VALIDATING") {
        paper.status = "VALIDATED";
      }
    } else {
      paper.status = "DRAFT";
    }

    paper.updatedAt = new Date().toISOString();
    await ExamRepository.savePaper(paper);

    await ExamRepository.logAudit({
      actorId,
      actorRole: "ADMIN",
      action: "PAPER_VALIDATED",
      entityId: paper.id,
      entityType: "PAPER",
      details: `Validated paper "${paper.paperCode}". Valid: ${report.isValid}. Errors: ${report.errors.length}.`,
    });

    return paper;
  }

  public static async publishPaper(
    paperId: string,
    actorId: string = "system-admin"
  ): Promise<ExaminationPaper> {
    const paper = await ExamRepository.findPaperById(paperId);
    if (!paper) {
      throw new Error(`Paper "${paperId}" not found.`);
    }

    // Must be VALIDATED or pass validation immediately
    const blueprint = await BlueprintRepository.findBlueprintById(paper.blueprintId);
    const report = PaperValidator.validatePaper(paper, blueprint);
    if (!report.isValid) {
      throw new Error(
        `Cannot publish paper "${paperId}": Validation failed with errors: ${report.errors.join("; ")}`
      );
    }

    // Freeze snapshot
    const snapshot = await PaperAssemblyService.createSnapshot(paper);
    paper.snapshot = snapshot;
    paper.status = "PUBLISHED";
    paper.publishedAt = new Date().toISOString();
    paper.updatedAt = new Date().toISOString();

    await ExamRepository.savePaper(paper);

    await ExamRepository.logAudit({
      actorId,
      actorRole: "ADMIN",
      action: "PAPER_PUBLISHED",
      entityId: paper.id,
      entityType: "PAPER",
      details: `Published paper "${paper.paperCode}" with immutable snapshot "${snapshot.snapshotId}".`,
    });

    return paper;
  }

  public static async activatePaper(
    paperId: string,
    actorId: string = "system-admin"
  ): Promise<ExaminationPaper> {
    const paper = await ExamRepository.findPaperById(paperId);
    if (!paper) {
      throw new Error(`Paper "${paperId}" not found.`);
    }

    if (paper.status !== "PUBLISHED" && paper.status !== "CLOSED") {
      throw new Error(
        `Cannot activate paper with status "${paper.status}". Must be PUBLISHED or CLOSED.`
      );
    }

    paper.status = "ACTIVE";
    paper.updatedAt = new Date().toISOString();
    await ExamRepository.savePaper(paper);

    await ExamRepository.logAudit({
      actorId,
      actorRole: "ADMIN",
      action: "PAPER_ACTIVATED",
      entityId: paper.id,
      entityType: "PAPER",
      details: `Activated paper "${paper.paperCode}" for student live attempts.`,
    });

    return paper;
  }

  public static async closePaper(
    paperId: string,
    actorId: string = "system-admin"
  ): Promise<ExaminationPaper> {
    const paper = await ExamRepository.findPaperById(paperId);
    if (!paper) {
      throw new Error(`Paper "${paperId}" not found.`);
    }

    paper.status = "CLOSED";
    paper.updatedAt = new Date().toISOString();
    await ExamRepository.savePaper(paper);

    await ExamRepository.logAudit({
      actorId,
      actorRole: "ADMIN",
      action: "PAPER_CLOSED",
      entityId: paper.id,
      entityType: "PAPER",
      details: `Closed paper "${paper.paperCode}". No new attempts allowed.`,
    });

    return paper;
  }

  public static async archivePaper(
    paperId: string,
    actorId: string = "system-admin"
  ): Promise<ExaminationPaper> {
    const paper = await ExamRepository.findPaperById(paperId);
    if (!paper) {
      throw new Error(`Paper "${paperId}" not found.`);
    }

    paper.status = "ARCHIVED";
    paper.archivedAt = new Date().toISOString();
    paper.updatedAt = new Date().toISOString();
    await ExamRepository.savePaper(paper);

    await ExamRepository.logAudit({
      actorId,
      actorRole: "ADMIN",
      action: "PAPER_ARCHIVED",
      entityId: paper.id,
      entityType: "PAPER",
      details: `Archived paper "${paper.paperCode}".`,
    });

    return paper;
  }

  // --------------------------------------------------------------------------
  // Student Examination Attempt Lifecycle
  // --------------------------------------------------------------------------

  public static async startAttempt(
    paperId: string,
    studentId: string,
    studentName?: string
  ): Promise<{ attempt: ExaminationAttempt; paper: Partial<ExaminationPaper> }> {
    const paper = await ExamRepository.findPaperById(paperId);
    if (!paper) {
      throw new Error(`ExaminationPaper "${paperId}" not found.`);
    }

    if (paper.status !== "ACTIVE" && paper.status !== "PUBLISHED") {
      throw new Error(
        `Examination is currently not active (status: ${paper.status}). Live attempts are closed.`
      );
    }

    // Check for existing active attempt (prevent duplicate starting)
    const existing = await ExamRepository.findActiveAttempt(paperId, studentId);
    if (existing) {
      const sanitizedPaper = this.getStudentPaperView(paper);
      return { attempt: existing, paper: sanitizedPaper };
    }

    // Count existing attempts for student on this paper
    const pastAttempts = await ExamRepository.listAttempts({ paperId, studentId });
    const attemptNumber = pastAttempts.length + 1;

    // Server-Authoritative Timer: startedAt and expiresAt
    const now = Date.now();
    const startedAt = new Date(now).toISOString();
    const durationMs = (paper.durationMinutes || 60) * 60 * 1000;
    const expiresAt = new Date(now + durationMs).toISOString();

    const attemptId = `att_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    const attempt: ExaminationAttempt = {
      id: attemptId,
      paperId: paper.id,
      paperCode: paper.paperCode,
      paperTitle: paper.title,
      studentId,
      studentName: studentName || `Student ${studentId}`,
      attemptNumber,
      status: "IN_PROGRESS",
      startedAt,
      expiresAt,
      durationMinutes: paper.durationMinutes,
      totalMarks: paper.totalMarks,
      obtainedMarks: 0,
      percentage: 0,
      grade: "F",
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: paper.questions.length,
      timeSpentSeconds: 0,
      createdAt: startedAt,
      updatedAt: startedAt,
    };

    await ExamRepository.saveAttempt(attempt);

    // Initialize blank StudentAnswer records
    const questions = paper.snapshot?.questions || paper.questions;
    for (const q of questions) {
      const answer: StudentAnswer = {
        id: `ans_${attemptId}_${q.id}`,
        attemptId,
        paperQuestionId: q.id,
        sequenceNumber: q.sequence,
        isAnswered: false,
        isMarkedForReview: false,
        savedAt: startedAt,
        evaluationStatus: "PENDING",
        marksAwarded: 0,
        maxMarks: q.marks,
        evaluatorType: "AUTOMATIC_DETERMINISTIC",
      };
      await ExamRepository.saveAnswer(answer);
    }

    await ExamRepository.logAudit({
      actorId: studentId,
      actorRole: "STUDENT",
      action: "ATTEMPT_STARTED",
      entityId: attempt.id,
      entityType: "ATTEMPT",
      details: `Student "${studentId}" started attempt #${attemptNumber} for paper "${paper.paperCode}". Expires at: ${expiresAt}.`,
    });

    const sanitizedPaper = this.getStudentPaperView(paper);
    return { attempt, paper: sanitizedPaper };
  }

  public static async saveAnswer(
    attemptId: string,
    data: {
      paperQuestionId: string;
      sequenceNumber?: number;
      selectedOption?: "A" | "B" | "C" | "D" | null;
      answerText?: string | null;
      numericAnswer?: number | null;
      isMarkedForReview?: boolean;
    }
  ): Promise<StudentAnswer> {
    const attempt = await ExamRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt "${attemptId}" not found.`);
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new Error(
        `Cannot save answer: Attempt is already "${attempt.status}". Only IN_PROGRESS attempts accept answers.`
      );
    }

    // Server-Authoritative Timer Gate (30-second network grace period)
    const now = Date.now();
    const expiryTime = new Date(attempt.expiresAt).getTime();
    const gracePeriodMs = 30 * 1000;

    if (now > expiryTime + gracePeriodMs) {
      attempt.status = "EXPIRED";
      attempt.updatedAt = new Date().toISOString();
      await ExamRepository.saveAttempt(attempt);
      throw new Error(
        `ATTEMPT_EXPIRED: Exam time limit (${attempt.durationMinutes} mins) has expired. No further answers can be saved.`
      );
    }

    let existingAnswer = await ExamRepository.findAnswer(attemptId, data.paperQuestionId);

    const isAnswered =
      data.selectedOption !== undefined && data.selectedOption !== null
        ? true
        : data.numericAnswer !== undefined && data.numericAnswer !== null
        ? true
        : typeof data.answerText === "string" && data.answerText.trim().length > 0;

    if (!existingAnswer) {
      existingAnswer = {
        id: `ans_${attemptId}_${data.paperQuestionId}`,
        attemptId,
        paperQuestionId: data.paperQuestionId,
        sequenceNumber: data.sequenceNumber || 1,
        selectedOption: data.selectedOption || undefined,
        answerText: data.answerText || undefined,
        numericAnswer: data.numericAnswer !== null ? data.numericAnswer : undefined,
        isAnswered,
        isMarkedForReview: data.isMarkedForReview ?? false,
        savedAt: new Date().toISOString(),
        evaluationStatus: "PENDING",
        marksAwarded: 0,
        maxMarks: 1,
        evaluatorType: "AUTOMATIC_DETERMINISTIC",
      };
    } else {
      if (data.selectedOption !== undefined) {
        existingAnswer.selectedOption = data.selectedOption || undefined;
      }
      if (data.answerText !== undefined) {
        existingAnswer.answerText = data.answerText || undefined;
      }
      if (data.numericAnswer !== undefined) {
        existingAnswer.numericAnswer = data.numericAnswer !== null ? data.numericAnswer : undefined;
      }
      if (data.isMarkedForReview !== undefined) {
        existingAnswer.isMarkedForReview = data.isMarkedForReview;
      }
      existingAnswer.isAnswered = isAnswered;
      existingAnswer.savedAt = new Date().toISOString();
    }

    const saved = await ExamRepository.saveAnswer(existingAnswer);
    return saved;
  }

  public static async submitAttempt(
    attemptId: string,
    actorId?: string
  ): Promise<{ attempt: ExaminationAttempt; result: ExaminationResult }> {
    const attempt = await ExamRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt "${attemptId}" not found.`);
    }

    // Idempotent: If already evaluated or submitted, return existing result
    if (attempt.status === "EVALUATED") {
      const existingResult = await ExamRepository.findResultByAttemptId(attemptId);
      if (existingResult) {
        return { attempt, result: existingResult };
      }
    }

    const paper = await ExamRepository.findPaperById(attempt.paperId);
    if (!paper) {
      throw new Error(`Paper "${attempt.paperId}" not found.`);
    }

    const submittedAt = new Date().toISOString();
    attempt.submittedAt = submittedAt;
    attempt.status = "SUBMITTED";

    const startTime = new Date(attempt.startedAt).getTime();
    attempt.timeSpentSeconds = Math.max(0, Math.round((new Date(submittedAt).getTime() - startTime) / 1000));
    await ExamRepository.saveAttempt(attempt);

    // Run Evaluation using Snapshot (with answer keys)
    const snapshot = paper.snapshot || (await PaperAssemblyService.createSnapshot(paper));
    await ExamEvaluationService.evaluateAttempt(attemptId, snapshot);

    // Compute & Generate Result
    const result = await ResultService.generateResult(attemptId);
    const updatedAttempt = (await ExamRepository.findAttemptById(attemptId)) || attempt;

    await ExamRepository.logAudit({
      actorId: actorId || attempt.studentId,
      actorRole: "STUDENT",
      action: "ATTEMPT_SUBMITTED",
      entityId: attempt.id,
      entityType: "ATTEMPT",
      details: `Attempt "${attempt.id}" submitted and evaluated. Score: ${result.obtainedMarks}/${result.totalMarks} (${result.percentage}%).`,
    });

    return { attempt: updatedAttempt, result };
  }

  // --------------------------------------------------------------------------
  // Teacher Override
  // --------------------------------------------------------------------------

  public static async overrideScore(
    attemptId: string,
    paperQuestionId: string,
    newMarks: number,
    reason: string,
    reviewerId: string = "teacher-examiner"
  ): Promise<ExaminationResult> {
    await ExamEvaluationService.overrideScore(
      attemptId,
      paperQuestionId,
      newMarks,
      reason,
      reviewerId
    );

    // Recompute result
    return await ResultService.generateResult(attemptId);
  }

  // --------------------------------------------------------------------------
  // Student Safe Quarantine Views
  // --------------------------------------------------------------------------

  public static getStudentPaperView(paper: ExaminationPaper): any {
    return {
      id: paper.id,
      paperCode: paper.paperCode,
      version: paper.version,
      title: paper.title,
      instructions: paper.instructions,
      totalMarks: paper.totalMarks,
      durationMinutes: paper.durationMinutes,
      questionCount: paper.questionCount,
      sections: paper.sections.map((s) => ({
        id: s.id,
        sectionName: s.sectionName,
        sectionOrder: s.sectionOrder,
        totalDisplayedQuestions: s.totalDisplayedQuestions,
        attemptableQuestions: s.attemptableQuestions,
        marksPerQuestion: s.marksPerQuestion,
        displayedMarks: s.displayedMarks,
        maximumObtainableMarks: s.maximumObtainableMarks,
        choiceRule: s.choiceRule,
        instructions: s.instructions,
        questionIds: s.questionIds,
      })),
      questions: paper.questions.map((q) => ({
        id: q.id,
        sequence: q.sequence,
        sectionId: q.sectionId,
        sectionName: q.sectionName,
        marks: q.marks,
        questionType: q.questionType,
        difficulty: q.difficulty,
        choiceGroup: q.choiceGroup,
        isCompulsory: q.isCompulsory,
        questionText: q.questionText,
        options: q.options?.map((opt) => ({
          key: opt.key,
          text: opt.text,
        })),
        chapterTitle: q.chapterTitle,
        topicTitle: q.topicTitle,
      })),
    };
  }

  public static async getStudentAttemptState(attemptId: string): Promise<any> {
    const attempt = await ExamRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt "${attemptId}" not found.`);
    }

    const paper = await ExamRepository.findPaperById(attempt.paperId);
    if (!paper) {
      throw new Error(`Paper "${attempt.paperId}" not found.`);
    }

    const answers = await ExamRepository.getAnswersForAttempt(attemptId);
    const sanitizedPaper = this.getStudentPaperView(paper);

    // Strip internal evaluation notes from answers if still in progress
    const cleanAnswers = answers.map((a) => ({
      paperQuestionId: a.paperQuestionId,
      sequenceNumber: a.sequenceNumber,
      selectedOption: a.selectedOption,
      answerText: a.answerText,
      numericAnswer: a.numericAnswer,
      isAnswered: a.isAnswered,
      isMarkedForReview: a.isMarkedForReview,
      savedAt: a.savedAt,
    }));

    return {
      attempt: {
        id: attempt.id,
        paperId: attempt.paperId,
        paperCode: attempt.paperCode,
        paperTitle: attempt.paperTitle,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        durationMinutes: attempt.durationMinutes,
        totalMarks: attempt.totalMarks,
      },
      paper: sanitizedPaper,
      answers: cleanAnswers,
    };
  }

  public static async getStudentResultReview(attemptId: string): Promise<any> {
    const result = await ExamRepository.findResultByAttemptId(attemptId);
    if (!result) {
      throw new Error(`Result for attempt "${attemptId}" not found.`);
    }

    const paper = await ExamRepository.findPaperById(result.paperId);
    const answers = await ExamRepository.getAnswersForAttempt(attemptId);

    // Construct enriched student review showing question prompt, student answer, marks, feedback
    const detailedReview = result.answersSummary.map((summary) => {
      const q = paper?.questions.find((pq) => pq.id === summary.paperQuestionId);
      const ans = answers.find((a) => a.paperQuestionId === summary.paperQuestionId);

      return {
        ...summary,
        questionText: q?.questionText || "",
        studentAnswer: ans?.selectedOption || ans?.numericAnswer || ans?.answerText || "Not Attempted",
        feedback: ans?.feedback || (summary.isCorrect ? "Correct" : "Incorrect"),
      };
    });

    return {
      result,
      detailedReview,
    };
  }
}

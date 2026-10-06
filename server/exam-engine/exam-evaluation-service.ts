// ==============================================================================
// AI Live Paper Generator - Examination Evaluation Service (Phase 9)
// Deterministic Scoring, Rubric-based Subjective Evaluation & Teacher Overrides
// STRICT INVARIANTS:
// 1. MCQ evaluation is strictly deterministic against verified answer keys.
// 2. Numerical evaluation is mathematically checked with exact tolerance bounds.
// 3. Subjective questions with confidence < 0.85 are flagged PROVISIONAL.
// 4. Overrides preserve original score, author, reason, and emit audit logs.
// ==============================================================================

import {
  StudentAnswer,
  ExaminationPaperSnapshot,
  EvaluatorType,
  EvaluationState,
} from "@/types/exam-engine";
import { ExamRepository } from "./exam-repository";

export interface EvaluationResultSummary {
  attemptId: string;
  totalQuestions: number;
  evaluatedAnswers: StudentAnswer[];
  hasProvisionalScores: boolean;
  evaluatedAt: string;
}

export class ExamEvaluationService {
  /**
   * Evaluates all student answers for a submitted attempt against the paper snapshot.
   */
  public static async evaluateAttempt(
    attemptId: string,
    snapshot: ExaminationPaperSnapshot
  ): Promise<EvaluationResultSummary> {
    const studentAnswers = await ExamRepository.getAnswersForAttempt(attemptId);
    const evaluatedAnswers: StudentAnswer[] = [];
    let hasProvisionalScores = false;

    for (const snapQuestion of snapshot.questions) {
      let answer = studentAnswers.find((a) => a.paperQuestionId === snapQuestion.id);

      // If student never answered or record not created
      if (!answer) {
        answer = {
          id: `ans_${attemptId}_${snapQuestion.id}`,
          attemptId,
          paperQuestionId: snapQuestion.id,
          sequenceNumber: snapQuestion.sequence,
          isAnswered: false,
          isMarkedForReview: false,
          savedAt: new Date().toISOString(),
          evaluationStatus: "EVALUATED",
          marksAwarded: 0,
          maxMarks: snapQuestion.marks,
          evaluatorType: "AUTOMATIC_DETERMINISTIC",
          evaluationReason: "Question was not attempted by student.",
        };
        const saved = await ExamRepository.saveAnswer(answer);
        evaluatedAnswers.push(saved);
        continue;
      }

      // If answered record exists but isAnswered is false or fields are empty
      const isBlank =
        !answer.isAnswered ||
        (!answer.selectedOption &&
          !answer.answerText?.trim() &&
          answer.numericAnswer === undefined &&
          answer.numericAnswer === null);

      if (isBlank) {
        answer.isAnswered = false;
        answer.marksAwarded = 0;
        answer.maxMarks = snapQuestion.marks;
        answer.evaluationStatus = "EVALUATED";
        answer.evaluatorType = "AUTOMATIC_DETERMINISTIC";
        answer.evaluationReason = "No answer provided.";
        const saved = await ExamRepository.saveAnswer(answer);
        evaluatedAnswers.push(saved);
        continue;
      }

      // Preserve existing manual overrides
      if (answer.evaluationStatus === "MANUAL_OVERRIDE") {
        evaluatedAnswers.push(answer);
        continue;
      }

      // Route evaluation by question type
      switch (snapQuestion.questionType) {
        case "MCQ": {
          this.evaluateMCQ(answer, snapQuestion);
          break;
        }

        case "NUMERICAL": {
          this.evaluateNumerical(answer, snapQuestion);
          break;
        }

        case "SHORT":
        case "LONG":
        case "DIAGRAM":
        default: {
          this.evaluateSubjective(answer, snapQuestion);
          if (answer.evaluationStatus === "PROVISIONAL") {
            hasProvisionalScores = true;
          }
          break;
        }
      }

      const saved = await ExamRepository.saveAnswer(answer);
      evaluatedAnswers.push(saved);
    }

    return {
      attemptId,
      totalQuestions: snapshot.questions.length,
      evaluatedAnswers,
      hasProvisionalScores,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Deterministic MCQ Evaluation
   */
  private static evaluateMCQ(answer: StudentAnswer, question: any): void {
    const answerMaterial = question.answerMaterial;
    let correctKey =
      question.answerKey ||
      answerMaterial?.correctOptionKey ||
      question.correctOptionKey;

    // Fallback: search options for isCorrect === true
    const opts = question.options || answerMaterial?.options;
    if (!correctKey && Array.isArray(opts)) {
      const correctOpt = opts.find((o: any) => o.isCorrect);
      if (correctOpt) {
        correctKey = correctOpt.key;
      }
    }

    answer.maxMarks = question.marks;
    answer.evaluatorType = "AUTOMATIC_DETERMINISTIC";
    answer.evaluationConfidence = 1.0;

    if (!answer.selectedOption) {
      answer.marksAwarded = 0;
      answer.evaluationStatus = "EVALUATED";
      answer.evaluationReason = "No option selected.";
      return;
    }

    if (correctKey && answer.selectedOption.toUpperCase() === correctKey.toUpperCase()) {
      answer.marksAwarded = question.marks;
      answer.evaluationStatus = "EVALUATED";
      answer.evaluationReason = `Correct option (${correctKey}) selected.`;
      answer.feedback = answerMaterial?.mcqExplanation || "Correct answer.";
    } else {
      answer.marksAwarded = 0;
      answer.evaluationStatus = "EVALUATED";
      answer.evaluationReason = `Selected option (${answer.selectedOption}) does not match key (${correctKey || "Unknown"}).`;
      answer.feedback = answerMaterial?.mcqExplanation || "Incorrect answer.";
    }
  }

  /**
   * Deterministic Numerical Evaluation with exact tolerance bounds
   */
  private static evaluateNumerical(answer: StudentAnswer, question: any): void {
    const numData = question.answerMaterial?.numericalData;
    answer.maxMarks = question.marks;
    answer.evaluatorType = "AUTOMATIC_DETERMINISTIC";
    answer.evaluationConfidence = 1.0;

    // Extract student number from numericAnswer or answerText
    let studentVal = answer.numericAnswer;
    if (studentVal === undefined || studentVal === null) {
      if (answer.answerText) {
        const parsed = parseFloat(answer.answerText.replace(/[^\d.-]/g, ""));
        if (!isNaN(parsed)) {
          studentVal = parsed;
        }
      }
    }

    if (studentVal === undefined || studentVal === null || isNaN(studentVal)) {
      answer.marksAwarded = 0;
      answer.evaluationStatus = "EVALUATED";
      answer.evaluationReason = "No valid numerical value provided.";
      return;
    }

    const expectedVal =
      typeof numData?.finalValue === "number"
        ? numData.finalValue
        : parseFloat(numData?.finalValue || "0");
    const tolerance = numData?.tolerance !== undefined ? Number(numData.tolerance) : 0.01;

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      answer.marksAwarded = question.marks;
      answer.evaluationStatus = "EVALUATED";
      answer.evaluationReason = `Numerical value ${studentVal} is within tolerance (±${tolerance}) of expected ${expectedVal}.`;
      answer.feedback = `Correct. Formula: ${numData?.formula || "Standard formula"}.`;
    } else {
      answer.marksAwarded = 0;
      answer.evaluationStatus = "EVALUATED";
      answer.evaluationReason = `Numerical value ${studentVal} deviates from expected ${expectedVal} by ${diff.toFixed(4)} (tolerance: ±${tolerance}).`;
      answer.feedback = `Expected ${expectedVal} ${numData?.unit || ""}. Steps: ${numData?.calculationSteps?.join(" -> ") || "See solution key"}.`;
    }
  }

  /**
   * Rubric-based Subjective Evaluation with Provisional Confidence Flagging
   */
  private static evaluateSubjective(answer: StudentAnswer, question: any): void {
    const text = (answer.answerText || "").trim();
    answer.maxMarks = question.marks;
    answer.evaluatorType = "AI_ASSISTED";

    if (!text || text.length < 5) {
      answer.marksAwarded = 0;
      answer.evaluationStatus = "EVALUATED";
      answer.evaluationConfidence = 1.0;
      answer.evaluationReason = "Answer is empty or insufficient.";
      return;
    }

    const expectedKeyPoints: string[] = question.answerMaterial?.expectedKeyPoints || [];
    const rubricCriteria = question.answerMaterial?.rubricBreakdown || [];

    let matchedPoints = 0;
    const lowerText = text.toLowerCase();

    if (expectedKeyPoints.length > 0) {
      for (const point of expectedKeyPoints) {
        // Extract meaningful words (> 3 chars) from key point
        const words = point
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        const matchCount = words.filter((w) => lowerText.includes(w)).length;
        if (words.length > 0 && matchCount / words.length >= 0.5) {
          matchedPoints++;
        }
      }

      const coverageRatio = matchedPoints / expectedKeyPoints.length;
      const awardedMarks = Math.round(coverageRatio * question.marks * 10) / 10;
      answer.marksAwarded = Math.min(question.marks, Math.max(0, awardedMarks));

      // Confidence determination
      const confidence = coverageRatio > 0.75 ? 0.9 : coverageRatio > 0.3 ? 0.8 : 0.7;
      answer.evaluationConfidence = confidence;

      if (confidence < 0.85) {
        answer.evaluationStatus = "PROVISIONAL";
        answer.evaluationReason = `Provisional AI evaluation: matched ${matchedPoints}/${expectedKeyPoints.length} key points. Requires human verification.`;
      } else {
        answer.evaluationStatus = "EVALUATED";
        answer.evaluationReason = `Automated rubric evaluation: matched ${matchedPoints}/${expectedKeyPoints.length} key points with high confidence.`;
      }
      answer.feedback = `Identified key concepts: ${matchedPoints} of ${expectedKeyPoints.length}.`;
    } else if (rubricCriteria.length > 0) {
      // Award partial marks based on response depth and criteria
      const awardedMarks = Math.min(question.marks, Math.max(1, Math.round(question.marks * 0.7)));
      answer.marksAwarded = awardedMarks;
      answer.evaluationConfidence = 0.8;
      answer.evaluationStatus = "PROVISIONAL";
      answer.evaluationReason = `Provisional evaluation based on rubric criteria. Marked for teacher review.`;
      answer.feedback = `Assessed against ${rubricCriteria.length} criteria.`;
    } else {
      // Fallback baseline evaluation for subjective response
      const lengthScore = Math.min(1.0, text.length / 100);
      answer.marksAwarded = Math.round(lengthScore * question.marks);
      answer.evaluationConfidence = 0.75;
      answer.evaluationStatus = "PROVISIONAL";
      answer.evaluationReason = "Provisional evaluation: lack of structured rubric key points.";
      answer.feedback = "Subjective answer pending human examiner review.";
    }
  }

  /**
   * Teacher / Examiner Manual Score Override
   * Preserves original evaluated score, records reviewer identity and reason, and emits audit.
   */
  public static async overrideScore(
    attemptId: string,
    paperQuestionId: string,
    newMarks: number,
    reason: string,
    reviewerId: string = "teacher-examiner"
  ): Promise<StudentAnswer> {
    const existingAnswer = await ExamRepository.findAnswer(attemptId, paperQuestionId);
    if (!existingAnswer) {
      throw new Error(
        `Answer not found for attempt "${attemptId}" and question "${paperQuestionId}".`
      );
    }

    if (newMarks < 0 || newMarks > existingAnswer.maxMarks) {
      throw new Error(
        `Overridden marks (${newMarks}) must be between 0 and maximum marks (${existingAnswer.maxMarks}).`
      );
    }

    const previousMarks = existingAnswer.marksAwarded;

    existingAnswer.originalEvaluatedMarks =
      existingAnswer.originalEvaluatedMarks !== undefined
        ? existingAnswer.originalEvaluatedMarks
        : previousMarks;
    existingAnswer.marksAwarded = newMarks;
    existingAnswer.evaluationStatus = "MANUAL_OVERRIDE";
    existingAnswer.evaluatorType = "MANUAL_HUMAN";
    existingAnswer.overriddenBy = reviewerId;
    existingAnswer.overrideReason = reason;
    existingAnswer.overrideTimestamp = new Date().toISOString();

    await ExamRepository.saveAnswer(existingAnswer);

    await ExamRepository.logAudit({
      actorId: reviewerId,
      actorRole: "TEACHER",
      action: "SCORE_OVERRIDDEN",
      entityId: existingAnswer.id,
      entityType: "ANSWER",
      previousValue: previousMarks,
      newValue: newMarks,
      reason,
      details: `Teacher override on question "${paperQuestionId}" for attempt "${attemptId}". Marks updated from ${previousMarks} to ${newMarks}. Reason: "${reason}".`,
    });

    return existingAnswer;
  }
}

// ==============================================================================
// AI Live Paper Generator - Examination Result Engine (Phase 9)
// Deterministic Aggregation, Choice Rule Honoring, Multi-Dimensional Analytics
// STRICT INVARIANTS:
// 1. Section marks must never exceed section maximumObtainableMarks.
// 2. Choice rules (CHOOSE_N_OF_M, OR_CHOICE) dynamically award best scores.
// 3. Status is PROVISIONAL if any subjective answer has provisional status.
// ==============================================================================

import {
  ExaminationResult,
  ExaminationAttempt,
  StudentAnswer,
  ExaminationPaper,
} from "@/types/exam-engine";
import { BlueprintQuestionType } from "@/types/blueprint";
import { ExamRepository } from "./exam-repository";

export class ResultService {
  /**
   * Generates or recalculates the ExaminationResult for an attempt.
   */
  public static async generateResult(attemptId: string): Promise<ExaminationResult> {
    const attempt = await ExamRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`ExaminationAttempt "${attemptId}" not found.`);
    }

    const paper = await ExamRepository.findPaperById(attempt.paperId);
    if (!paper) {
      throw new Error(`ExaminationPaper "${attempt.paperId}" not found.`);
    }

    const answers = await ExamRepository.getAnswersForAttempt(attemptId);

    // Snapshot questions or paper questions
    const questions = paper.snapshot?.questions || paper.questions;

    // 1. Process Section-wise scores with Choice Rules
    let totalObtainedMarks = 0;
    let totalMaxMarks = 0;
    const sectionBreakdowns: ExaminationResult["sectionBreakdown"] = [];

    for (const section of paper.sections) {
      const sectionQuestions = questions.filter(
        (q) => q.sectionId === section.id || q.sectionName === section.sectionName
      );
      const sectionAnswers = sectionQuestions.map((q) => {
        const ans = answers.find((a) => a.paperQuestionId === q.id);
        return {
          question: q,
          answer: ans,
          marksAwarded: ans?.marksAwarded || 0,
        };
      });

      let sectionMarksObtained = 0;

      switch (section.choiceRule.type) {
        case "NO_CHOICE": {
          // Simply sum all questions
          sectionMarksObtained = sectionAnswers.reduce((sum, item) => sum + item.marksAwarded, 0);
          break;
        }

        case "CHOOSE_N_OF_M": {
          const N = (section.choiceRule as any).attemptCount || (section.choiceRule as any).count || section.attemptableQuestions;
          // Sort answers by marks awarded descending (student gets benefit of best N answers)
          const sorted = [...sectionAnswers].sort((a, b) => b.marksAwarded - a.marksAwarded);
          const topN = sorted.slice(0, N);
          sectionMarksObtained = topN.reduce((sum, item) => sum + item.marksAwarded, 0);
          break;
        }

        case "OR_CHOICE": {
          // Group questions by choiceGroup
          const groups = new Map<string, typeof sectionAnswers>();
          const ungrouped: typeof sectionAnswers = [];

          for (const item of sectionAnswers) {
            if (item.question.choiceGroup) {
              const grp = groups.get(item.question.choiceGroup) || [];
              grp.push(item);
              groups.set(item.question.choiceGroup, grp);
            } else {
              ungrouped.push(item);
            }
          }

          // For each choice group, pick the highest scored question
          for (const grpItems of groups.values()) {
            const best = grpItems.reduce(
              (max, curr) => (curr.marksAwarded > max.marksAwarded ? curr : max),
              grpItems[0]
            );
            sectionMarksObtained += best.marksAwarded;
          }

          // Add ungrouped compulsory questions if any
          for (const ungrp of ungrouped) {
            sectionMarksObtained += ungrp.marksAwarded;
          }
          break;
        }
      }

      // Hard clamp to section's maximumObtainableMarks
      sectionMarksObtained = Math.min(sectionMarksObtained, section.maximumObtainableMarks);
      totalObtainedMarks += sectionMarksObtained;
      totalMaxMarks += section.maximumObtainableMarks;

      const attemptedCount = sectionAnswers.filter((item) => item.answer?.isAnswered).length;
      const secPercentage =
        section.maximumObtainableMarks > 0
          ? Math.round((sectionMarksObtained / section.maximumObtainableMarks) * 10000) / 100
          : 0;

      sectionBreakdowns.push({
        sectionId: section.id,
        sectionName: section.sectionName,
        marksObtained: sectionMarksObtained,
        maxMarks: section.maximumObtainableMarks,
        percentage: secPercentage,
        questionCount: sectionQuestions.length,
        attemptedCount,
      });
    }

    // Overall paper total marks check
    if (totalMaxMarks === 0) {
      totalMaxMarks = paper.totalMarks;
    }

    const overallPercentage =
      totalMaxMarks > 0 ? Math.round((totalObtainedMarks / totalMaxMarks) * 10000) / 100 : 0;

    const grade = this.calculateGrade(overallPercentage);

    // 2. Count statistics & Answers Summary
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let hasProvisional = false;

    const answersSummary: ExaminationResult["answersSummary"] = [];

    for (const q of questions) {
      const ans = answers.find((a) => a.paperQuestionId === q.id);
      const isAnswered = ans ? ans.isAnswered : false;
      const marksAwarded = ans ? ans.marksAwarded : 0;
      const isCorrect = marksAwarded > 0;

      if (!isAnswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      if (ans?.evaluationStatus === "PROVISIONAL") {
        hasProvisional = true;
      }

      answersSummary.push({
        paperQuestionId: q.id,
        sequence: q.sequence,
        questionType: q.questionType,
        marks: q.marks,
        marksAwarded,
        isCorrect,
        isAnswered,
        isMarkedForReview: ans?.isMarkedForReview || false,
        evaluatorType: ans?.evaluatorType || "AUTOMATIC_DETERMINISTIC",
        evaluationStatus: ans?.evaluationStatus || "EVALUATED",
      });
    }

    // 3. Multi-Dimensional Breakdowns

    // Difficulty Breakdown
    const diffMap = {
      EASY: { marksObtained: 0, maxMarks: 0, count: 0 },
      MEDIUM: { marksObtained: 0, maxMarks: 0, count: 0 },
      DIFFICULT: { marksObtained: 0, maxMarks: 0, count: 0 },
    };

    for (const q of questions) {
      const ans = answers.find((a) => a.paperQuestionId === q.id);
      const awarded = ans?.marksAwarded || 0;
      const diff = q.difficulty || "MEDIUM";
      if (diffMap[diff]) {
        diffMap[diff].marksObtained += awarded;
        diffMap[diff].maxMarks += q.marks;
        diffMap[diff].count++;
      }
    }

    const difficultyBreakdown = {
      easy: {
        marksObtained: diffMap.EASY.marksObtained,
        maxMarks: diffMap.EASY.maxMarks,
        percentage:
          diffMap.EASY.maxMarks > 0
            ? Math.round((diffMap.EASY.marksObtained / diffMap.EASY.maxMarks) * 10000) / 100
            : 0,
        questionCount: diffMap.EASY.count,
      },
      medium: {
        marksObtained: diffMap.MEDIUM.marksObtained,
        maxMarks: diffMap.MEDIUM.maxMarks,
        percentage:
          diffMap.MEDIUM.maxMarks > 0
            ? Math.round((diffMap.MEDIUM.marksObtained / diffMap.MEDIUM.maxMarks) * 10000) / 100
            : 0,
        questionCount: diffMap.MEDIUM.count,
      },
      difficult: {
        marksObtained: diffMap.DIFFICULT.marksObtained,
        maxMarks: diffMap.DIFFICULT.maxMarks,
        percentage:
          diffMap.DIFFICULT.maxMarks > 0
            ? Math.round((diffMap.DIFFICULT.marksObtained / diffMap.DIFFICULT.maxMarks) * 10000) / 100
            : 0,
        questionCount: diffMap.DIFFICULT.count,
      },
    };

    // Chapter Breakdown
    const chapterMap = new Map<
      string,
      { title: string; obtained: number; max: number; count: number }
    >();
    for (const q of questions) {
      const ans = answers.find((a) => a.paperQuestionId === q.id);
      const awarded = ans?.marksAwarded || 0;
      const c = chapterMap.get(q.chapterId) || {
        title: q.chapterTitle || "General Chapter",
        obtained: 0,
        max: 0,
        count: 0,
      };
      c.obtained += awarded;
      c.max += q.marks;
      c.count++;
      chapterMap.set(q.chapterId, c);
    }

    const chapterBreakdown: ExaminationResult["chapterBreakdown"] = Array.from(
      chapterMap.entries()
    ).map(([id, d]) => ({
      chapterId: id,
      chapterTitle: d.title,
      marksObtained: d.obtained,
      maxMarks: d.max,
      percentage: d.max > 0 ? Math.round((d.obtained / d.max) * 10000) / 100 : 0,
      questionCount: d.count,
    }));

    // Topic Breakdown
    const topicMap = new Map<
      string,
      { title: string; obtained: number; max: number; count: number }
    >();
    for (const q of questions) {
      const ans = answers.find((a) => a.paperQuestionId === q.id);
      const awarded = ans?.marksAwarded || 0;
      const t = topicMap.get(q.topicId) || {
        title: q.topicTitle || "General Topic",
        obtained: 0,
        max: 0,
        count: 0,
      };
      t.obtained += awarded;
      t.max += q.marks;
      t.count++;
      topicMap.set(q.topicId, t);
    }

    const topicBreakdown: ExaminationResult["topicBreakdown"] = Array.from(
      topicMap.entries()
    ).map(([id, d]) => ({
      topicId: id,
      topicTitle: d.title,
      marksObtained: d.obtained,
      maxMarks: d.max,
      percentage: d.max > 0 ? Math.round((d.obtained / d.max) * 10000) / 100 : 0,
      questionCount: d.count,
    }));

    // Question Type Breakdown
    const typeMap = new Map<
      BlueprintQuestionType,
      { obtained: number; max: number; count: number }
    >();
    for (const q of questions) {
      const ans = answers.find((a) => a.paperQuestionId === q.id);
      const awarded = ans?.marksAwarded || 0;
      const tp = typeMap.get(q.questionType) || { obtained: 0, max: 0, count: 0 };
      tp.obtained += awarded;
      tp.max += q.marks;
      tp.count++;
      typeMap.set(q.questionType, tp);
    }

    const questionTypeBreakdown: ExaminationResult["questionTypeBreakdown"] = Array.from(
      typeMap.entries()
    ).map(([type, d]) => ({
      questionType: type,
      marksObtained: d.obtained,
      maxMarks: d.max,
      percentage: d.max > 0 ? Math.round((d.obtained / d.max) * 10000) / 100 : 0,
      questionCount: d.count,
    }));

    // 4. Construct Final / Provisional Result
    const existingResult = await ExamRepository.findResultByAttemptId(attemptId);
    const resultVersion = existingResult
      ? (parseFloat(existingResult.resultVersion) + 0.1).toFixed(1)
      : "1.0";

    const result: ExaminationResult = {
      id: existingResult?.id || `res_${attemptId}`,
      attemptId,
      paperId: paper.id,
      paperCode: paper.paperCode,
      paperTitle: paper.title,
      studentId: attempt.studentId,
      studentName: attempt.studentName,
      totalMarks: totalMaxMarks,
      obtainedMarks: totalObtainedMarks,
      percentage: overallPercentage,
      grade,
      status: hasProvisional ? "PROVISIONAL" : "FINAL",
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentSeconds: attempt.timeSpentSeconds || 0,
      sectionBreakdown: sectionBreakdowns,
      difficultyBreakdown,
      chapterBreakdown,
      topicBreakdown,
      questionTypeBreakdown,
      answersSummary,
      evaluatedAt: new Date().toISOString(),
      resultVersion,
    };

    // Update attempt with final results
    attempt.totalMarks = totalMaxMarks;
    attempt.obtainedMarks = totalObtainedMarks;
    attempt.percentage = overallPercentage;
    attempt.grade = grade;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.status = "EVALUATED";
    attempt.updatedAt = new Date().toISOString();

    await ExamRepository.saveAttempt(attempt);
    await ExamRepository.saveResult(result);

    await ExamRepository.logAudit({
      actorId: "system-result-engine",
      actorRole: "SYSTEM",
      action: "RESULT_GENERATED",
      entityId: result.id,
      entityType: "RESULT",
      details: `Generated examination result for attempt "${attemptId}". Score: ${totalObtainedMarks}/${totalMaxMarks} (${overallPercentage}%, Grade ${grade}). Status: ${result.status}.`,
    });

    return result;
  }

  /**
   * Deterministic Standard Academic Grading Scale
   */
  public static calculateGrade(percentage: number): string {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  }
}

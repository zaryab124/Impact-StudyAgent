// ==============================================================================
// AI Live Paper Generator - Sample Paper Quality Reporter
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import {
  SamplePaperQualityReportDTO,
  DifficultyDistributionDTO,
  DeterministicMarksArithmeticDTO,
  SamplePaperQuestionDTO,
  SectionStructureDTO,
} from "@/types/sample-paper";

export class QualityReporter {
  /**
   * Generates a factual analysis report for an analyzed sample paper.
   * Spec 24: Do not fabricate values; calculate exact provenance and coverage metrics.
   */
  public static generateQualityReport(
    samplePaperId: string,
    title: string,
    totalMarks: number,
    durationMinutes: number,
    sections: SectionStructureDTO[],
    questions: SamplePaperQuestionDTO[],
    arithmetic: DeterministicMarksArithmeticDTO,
    observedDifficulty: DifficultyDistributionDTO
  ): SamplePaperQualityReportDTO {
    const totalQuestions = questions.length;

    let mcqCount = 0;
    let shortCount = 0;
    let longCount = 0;
    let numericalCount = 0;
    let optionalCount = 0;
    let reviewRequiredCount = 0;
    let fullyTraceableCount = 0;

    const mappedChapters = new Set<string>();
    const mappedTopics = new Set<string>();

    for (const q of questions) {
      if (q.primaryType === "MCQ") mcqCount++;
      else if (q.primaryType === "SHORT") shortCount++;
      else if (q.primaryType === "LONG") longCount++;
      else if (q.primaryType === "NUMERICAL") numericalCount++;

      if (!q.isCompulsory) optionalCount++;
      if (q.needsReview || q.mappingStatus === "REQUIRES_REVIEW" || q.difficulty === "UNKNOWN") {
        reviewRequiredCount++;
      }

      if (q.chapterId) mappedChapters.add(q.chapterId);
      if (q.topicId) mappedTopics.add(q.topicId);

      // Provenance check: pageNumber > 0 and originalNumber present
      if (q.pageNumber > 0 && q.originalNumber && q.originalNumber.trim().length > 0) {
        fullyTraceableCount++;
      }
    }

    const provenanceCoverage =
      totalQuestions > 0 ? Number(((fullyTraceableCount / totalQuestions) * 100).toFixed(1)) : 100;

    return {
      samplePaperId,
      title,
      totalMarks: arithmetic.calculatedTotalMarks > 0 ? arithmetic.calculatedTotalMarks : totalMarks,
      durationMinutes,
      sectionsCount: sections.length,
      questionsCount: totalQuestions,
      mcqCount,
      shortCount,
      longCount,
      numericalCount,
      optionalCount,
      observedDifficulty,
      targetDifficultyPlaceholder: {
        easyPercentage: 33,
        mediumPercentage: 33,
        difficultPercentage: 34,
        note: "Target difficulty distribution will be deterministically enforced in Phase 6 Paper Blueprint Engine.",
      },
      chapterCoverageCount: mappedChapters.size,
      topicCoverageCount: mappedTopics.size,
      reviewRequiredCount,
      provenanceCoverage,
      isArithmeticallyConsistent: arithmetic.isConsistent,
      arithmeticFlags: arithmetic.discrepancyFlags,
    };
  }
}

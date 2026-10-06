// ==============================================================================
// AI Live Paper Generator - Sample Paper Comparison Service
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { PaperComparisonDTO, SamplePaperDTO, SampleQuestionType } from "@/types/sample-paper";

export class PaperComparisonService {
  /**
   * Performs descriptive side-by-side comparison of 2 or more sample papers.
   * Spec 17: Must remain descriptive; does not rank papers.
   */
  public static compareSamplePapers(papers: SamplePaperDTO[]): PaperComparisonDTO {
    if (papers.length < 2) {
      throw new Error("Comparison requires at least two sample papers.");
    }

    const marksComparison = papers.map((p) => ({
      paperId: p.id,
      totalMarks: p.totalMarks,
      compulsoryMarks: p.arithmeticValidation?.calculatedCompulsoryMarks || p.totalMarks,
      optionalMarks: p.arithmeticValidation?.calculatedOptionalMarks || 0,
    }));

    const durationComparison = papers.map((p) => ({
      paperId: p.id,
      durationMinutes: p.durationMinutes,
    }));

    const sectionComparison = papers.map((p) => ({
      paperId: p.id,
      sectionCount: p.extractedStructure?.sections.length || 0,
      sections: (p.extractedStructure?.sections || []).map((s) => ({
        name: s.name,
        questionCount: s.questionCount,
        marks: s.totalMarks,
      })),
    }));

    // Collect all unique question types observed across papers
    const allTypes: SampleQuestionType[] = [
      "MCQ",
      "SHORT",
      "LONG",
      "NUMERICAL",
      "CONCEPTUAL",
      "DEFINITION",
      "EXPLANATION",
      "COMPARISON",
      "APPLICATION",
      "DIAGRAM",
      "DERIVATION",
      "PROBLEM_SOLVING",
    ];

    const questionTypeComparison = allTypes.map((type) => {
      const counts: Record<string, number> = {};
      for (const p of papers) {
        if (type === "MCQ") counts[p.id] = p.qualityReport?.mcqCount || 0;
        else if (type === "SHORT") counts[p.id] = p.qualityReport?.shortCount || 0;
        else if (type === "LONG") counts[p.id] = p.qualityReport?.longCount || 0;
        else if (type === "NUMERICAL") counts[p.id] = p.qualityReport?.numericalCount || 0;
        else counts[p.id] = 0;
      }
      return { type, counts };
    });

    const difficultyComparison = papers.map((p) => ({
      paperId: p.id,
      observedDifficulty: p.qualityReport?.observedDifficulty || {
        easyCount: 0,
        mediumCount: 0,
        difficultCount: 0,
        unknownCount: 0,
        total: 0,
        easyPercentage: 0,
        mediumPercentage: 0,
        difficultPercentage: 0,
        unknownPercentage: 0,
      },
    }));

    const choiceRulesComparison = papers.map((p) => ({
      paperId: p.id,
      choiceRules: (p.extractedStructure?.sections || [])
        .map((s) => s.choiceRule)
        .filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined),
    }));

    const curriculumCoverageComparison = papers.map((p) => ({
      paperId: p.id,
      mappedChaptersCount: p.qualityReport?.chapterCoverageCount || 0,
      mappedTopicsCount: p.qualityReport?.topicCoverageCount || 0,
    }));

    return {
      papers: papers.map((p) => ({
        id: p.id,
        title: p.title,
        year: p.year,
        status: p.status,
      })),
      marksComparison,
      durationComparison,
      sectionComparison,
      questionTypeComparison,
      difficultyComparison,
      choiceRulesComparison,
      curriculumCoverageComparison,
    };
  }
}

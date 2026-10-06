// ==============================================================================
// AI Live Paper Generator - Examination Pattern Learner & Multi-Paper Aggregator
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import {
  PaperPatternSpecificationDTO,
  SectionStructureDTO,
  ChoiceRuleDTO,
  SampleQuestionType,
  DifficultyDistributionDTO,
  PatternAggregationLevel,
} from "@/types/sample-paper";
import { prisma } from "@/lib/prisma";

export interface AnalyzedPaperData {
  id: string;
  title: string;
  year: number;
  subjectId: string;
  boardId?: string | null;
  academicYearId?: string | null;
  classId?: string | null;
  syllabusId?: string | null;
  totalMarks: number;
  durationMinutes: number;
  sections: SectionStructureDTO[];
  questions: {
    originalNumber: string;
    normalizedNumber: string;
    sectionName: string;
    primaryType: SampleQuestionType;
    secondaryTypes: SampleQuestionType[];
    marks: number;
    isCompulsory: boolean;
    difficulty: "EASY" | "MEDIUM" | "DIFFICULT" | "UNKNOWN";
    commandVerb?: string | null;
    questionStem?: string | null;
    expectedResponseDepth?: string | null;
    text: string;
    chapterId?: string | null;
    topicId?: string | null;
  }[];
}

export class PatternLearner {
  /**
   * Learns an abstract examination pattern specification from one or more sample papers.
   * Enforces Mandatory Refinements:
   * - 4: Abstract structural and semantic patterns only; NO verbatim question templates.
   * - 5: Descriptive classification of COMMON_PATTERN, OCCASIONAL_PATTERN, and OUTLIER.
   * - 9: Non-destructive versioning (v1, v2).
   */
  public static async learnPatternFromSamplePapers(
    subjectId: string,
    samplePapers: AnalyzedPaperData[],
    customVersionTitle?: string
  ): Promise<PaperPatternSpecificationDTO> {
    if (samplePapers.length === 0) {
      throw new Error("Cannot learn examination pattern: No sample papers provided.");
    }

    // 1. Determine Next Non-Destructive Version
    const nextVersion = await this.getNextPatternVersion(subjectId);

    // 2. Identify Cohort Characteristics & Outliers (Mandatory Refinement 5)
    const marksList = samplePapers.map((p) => p.totalMarks).filter((m) => m > 0);
    const modeTotalMarks = this.calculateMode(marksList) || samplePapers[0].totalMarks || 60;

    const durationList = samplePapers.map((p) => p.durationMinutes).filter((d) => d > 0);
    const modeDuration = this.calculateMode(durationList) || samplePapers[0].durationMinutes || 180;

    const contributingPapers: {
      samplePaperId: string;
      title: string;
      year: number;
      isOutlier: boolean;
      outlierReason?: string | null;
    }[] = [];

    let outlierCount = 0;
    for (const paper of samplePapers) {
      let isOutlier = false;
      let outlierReason: string | null = null;

      if (marksList.length > 2 && Math.abs(paper.totalMarks - modeTotalMarks) > 20) {
        isOutlier = true;
        outlierReason = `Total marks (${paper.totalMarks}) deviates significantly from cohort mode (${modeTotalMarks}).`;
      } else if (durationList.length > 2 && Math.abs(paper.durationMinutes - modeDuration) > 60) {
        isOutlier = true;
        outlierReason = `Duration (${paper.durationMinutes}m) deviates from cohort mode (${modeDuration}m).`;
      }

      if (isOutlier) outlierCount++;

      contributingPapers.push({
        samplePaperId: paper.id,
        title: paper.title,
        year: paper.year,
        isOutlier,
        outlierReason,
      });
    }

    // Determine Aggregation Level
    let aggregationLevel: PatternAggregationLevel = "SINGLE_PAPER";
    if (samplePapers.length > 1) {
      const normalPaperCount = samplePapers.length - outlierCount;
      const consistencyRatio = normalPaperCount / samplePapers.length;
      if (consistencyRatio >= 0.7) {
        aggregationLevel = "COMMON_PATTERN";
      } else if (consistencyRatio >= 0.3) {
        aggregationLevel = "OCCASIONAL_PATTERN";
      } else {
        aggregationLevel = "AGGREGATED";
      }
    }

    // 3. Aggregate Section Structure
    const sectionStructure = this.aggregateSectionStructure(samplePapers);

    // 4. Aggregate Question & Marks Distribution
    const questionDistribution: Record<string, number> = {};
    const marksByType: Record<string, number> = {};
    let totalQuestionsCount = 0;
    let totalCompulsoryMarks = 0;
    let totalOptionalMarks = 0;

    // Linguistic / Wording characteristics counters (Mandatory Refinement 4)
    const verbCounts = new Map<string, number>();
    const stems: string[] = [];
    let totalQuestionLength = 0;
    const responseDepths: Record<string, number> = {};
    let numericalCount = 0;
    let conceptualCount = 0;
    let diagramCount = 0;
    let definitionCount = 0;
    let applicationCount = 0;
    let choiceQuestionsCount = 0;

    // Difficulty counts across all papers
    let easyCount = 0;
    let mediumCount = 0;
    let difficultCount = 0;
    let unknownCount = 0;

    for (const paper of samplePapers) {
      for (const q of paper.questions) {
        totalQuestionsCount++;

        // Types
        questionDistribution[q.primaryType] = (questionDistribution[q.primaryType] || 0) + 1;
        marksByType[q.primaryType] = (marksByType[q.primaryType] || 0) + q.marks;

        if (q.isCompulsory) {
          totalCompulsoryMarks += q.marks;
        } else {
          totalOptionalMarks += q.marks;
          choiceQuestionsCount++;
        }

        // Difficulty
        if (q.difficulty === "EASY") easyCount++;
        else if (q.difficulty === "MEDIUM") mediumCount++;
        else if (q.difficulty === "DIFFICULT") difficultCount++;
        else unknownCount++;

        // Linguistic patterns
        if (q.commandVerb) {
          const v = q.commandVerb.charAt(0).toUpperCase() + q.commandVerb.slice(1).toLowerCase();
          verbCounts.set(v, (verbCounts.get(v) || 0) + 1);
        }
        if (q.questionStem && stems.length < 15) {
          stems.push(q.questionStem);
        }
        totalQuestionLength += q.text.length;

        if (q.expectedResponseDepth) {
          responseDepths[q.expectedResponseDepth] = (responseDepths[q.expectedResponseDepth] || 0) + 1;
        }

        // Feature categories
        if (q.primaryType === "NUMERICAL" || q.secondaryTypes.includes("NUMERICAL")) numericalCount++;
        if (q.primaryType === "CONCEPTUAL" || q.secondaryTypes.includes("CONCEPTUAL")) conceptualCount++;
        if (q.primaryType === "DIAGRAM" || q.secondaryTypes.includes("DIAGRAM")) diagramCount++;
        if (q.primaryType === "DEFINITION" || q.secondaryTypes.includes("DEFINITION")) definitionCount++;
        if (q.primaryType === "APPLICATION" || q.secondaryTypes.includes("APPLICATION")) applicationCount++;
      }
    }

    // Normalize per paper average
    const paperCount = Math.max(1, samplePapers.length);
    const avgQuestions = totalQuestionsCount / paperCount;

    // Common command verbs
    const commonCommandVerbs = Array.from(verbCounts.entries())
      .map(([verb, count]) => ({
        verb,
        count,
        frequency: Number((count / totalQuestionsCount).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Observed Difficulty Distribution
    const observedDifficulty: DifficultyDistributionDTO = {
      easyCount,
      mediumCount,
      difficultCount,
      unknownCount,
      total: totalQuestionsCount,
      easyPercentage: totalQuestionsCount > 0 ? Number(((easyCount / totalQuestionsCount) * 100).toFixed(1)) : 0,
      mediumPercentage: totalQuestionsCount > 0 ? Number(((mediumCount / totalQuestionsCount) * 100).toFixed(1)) : 0,
      difficultPercentage: totalQuestionsCount > 0 ? Number(((difficultCount / totalQuestionsCount) * 100).toFixed(1)) : 0,
      unknownPercentage: totalQuestionsCount > 0 ? Number(((unknownCount / totalQuestionsCount) * 100).toFixed(1)) : 0,
    };

    // Calculate Pattern Confidence derived from supporting papers & consistency
    const patternConfidence = Number(
      Math.min(0.98, 0.7 + Math.min(0.25, (paperCount - 1) * 0.08) - (outlierCount / paperCount) * 0.15).toFixed(2)
    );

    // Primary sample paper reference
    const primaryPaper = samplePapers[0];

    const title =
      customVersionTitle ||
      `${primaryPaper.title.replace(/\s*(?:20\d\d|v\d+)\s*/gi, "").trim()} Examination Pattern ${nextVersion}`;

    // Choice rules aggregated across sections
    const choiceRules: ChoiceRuleDTO[] = sectionStructure
      .map((s) => s.choiceRule)
      .filter((r): r is ChoiceRuleDTO => r !== null && r !== undefined);

    const patternSpecification: PaperPatternSpecificationDTO = {
      id: `pat_${Date.now()}`,
      title,
      version: nextVersion,
      subjectId,
      boardId: primaryPaper.boardId || null,
      academicYearId: primaryPaper.academicYearId || null,
      classId: primaryPaper.classId || null,
      syllabusId: primaryPaper.syllabusId || null,
      totalMarks: modeTotalMarks,
      durationMinutes: modeDuration,
      status: "ACTIVE",
      patternConfidence,
      supportingSampleCount: paperCount,
      aggregationLevel,
      sectionStructure,
      questionDistribution,
      marksDistribution: {
        total: modeTotalMarks,
        compulsory: Math.round(totalCompulsoryMarks / paperCount),
        optional: Math.round(totalOptionalMarks / paperCount),
        byType: marksByType,
      },
      difficultyObservations: observedDifficulty,
      targetDifficulty: {
        easyPct: 33,
        mediumPct: 33,
        difficultPct: 34,
        note: "Target 33/33/33 for future Paper Blueprint generation (Mandatory Refinement 3).",
      },
      choiceRules,
      wordingCharacteristics: {
        commonCommandVerbs,
        commonStems: stems.slice(0, 10),
        averageQuestionLengthChars: totalQuestionsCount > 0 ? Math.round(totalQuestionLength / totalQuestionsCount) : 0,
        expectedResponseDepths: responseDepths,
        numericalFrequency: totalQuestionsCount > 0 ? Number((numericalCount / totalQuestionsCount).toFixed(2)) : 0,
        conceptualFrequency: totalQuestionsCount > 0 ? Number((conceptualCount / totalQuestionsCount).toFixed(2)) : 0,
        diagramFrequency: totalQuestionsCount > 0 ? Number((diagramCount / totalQuestionsCount).toFixed(2)) : 0,
        definitionFrequency: totalQuestionsCount > 0 ? Number((definitionCount / totalQuestionsCount).toFixed(2)) : 0,
        applicationFrequency: totalQuestionsCount > 0 ? Number((applicationCount / totalQuestionsCount).toFixed(2)) : 0,
        choiceFrequency: totalQuestionsCount > 0 ? Number((choiceQuestionsCount / totalQuestionsCount).toFixed(2)) : 0,
      },
      contributingPapers,
      validationReport: {
        isConsistent: outlierCount === 0,
        issues: outlierCount > 0 ? [`${outlierCount} of ${paperCount} papers flagged as outliers.`] : [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return patternSpecification;
  }

  /**
   * Generates non-destructive version string e.g. "v1", "v2".
   */
  public static async getNextPatternVersion(subjectId: string): Promise<string> {
    try {
      const existingPatterns = await prisma.paperPattern.findMany({
        where: { subjectId },
        select: { version: true },
      });

      if (existingPatterns.length === 0) {
        return "v1";
      }

      let maxVer = 0;
      for (const p of existingPatterns) {
        const match = p.version.match(/v?(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxVer) maxVer = num;
        }
      }

      return `v${maxVer + 1}`;
    } catch {
      return "v1";
    }
  }

  private static aggregateSectionStructure(papers: AnalyzedPaperData[]): SectionStructureDTO[] {
    const sectionMap = new Map<string, SectionStructureDTO[]>();

    for (const paper of papers) {
      for (const sec of paper.sections) {
        const normalizedName = this.normalizeSectionName(sec.name);
        const list = sectionMap.get(normalizedName) || [];
        list.push(sec);
        sectionMap.set(normalizedName, list);
      }
    }

    const aggregatedSections: SectionStructureDTO[] = [];
    let order = 1;

    for (const [name, secList] of sectionMap.entries()) {
      const avgMarks = Math.round(secList.reduce((sum, s) => sum + s.totalMarks, 0) / secList.length);
      const avgQuestions = Math.round(secList.reduce((sum, s) => sum + s.questionCount, 0) / secList.length);
      const avgCompulsory = Math.round(secList.reduce((sum, s) => sum + s.compulsoryCount, 0) / secList.length);
      const avgOptional = Math.round(secList.reduce((sum, s) => sum + s.optionalCount, 0) / secList.length);

      // Representative choice rule
      const representativeChoice = secList.find((s) => s.choiceRule !== null)?.choiceRule || null;

      // Unique question types across all occurrences
      const questionTypesSet = new Set<SampleQuestionType>();
      for (const s of secList) {
        s.questionTypes.forEach((t) => questionTypesSet.add(t));
      }

      aggregatedSections.push({
        name,
        order: order++,
        totalMarks: avgMarks,
        questionCount: avgQuestions,
        compulsoryCount: avgCompulsory,
        optionalCount: avgOptional,
        choiceRule: representativeChoice,
        questionTypes: Array.from(questionTypesSet),
        marksPerQuestion: secList[0]?.marksPerQuestion || [1],
        instructions: secList[0]?.instructions || undefined,
      });
    }

    return aggregatedSections;
  }

  private static normalizeSectionName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("objective") || lower.includes("section a") || lower.includes("part i") || lower.includes("group a")) {
      return "Section A (Objective)";
    }
    if (lower.includes("short") || lower.includes("section b") || lower.includes("part ii") || lower.includes("group b")) {
      return "Section B (Short Questions)";
    }
    if (lower.includes("long") || lower.includes("section c") || lower.includes("part iii") || lower.includes("descriptive") || lower.includes("group c")) {
      return "Section C (Long Questions)";
    }
    return name.trim();
  }

  private static calculateMode(numbers: number[]): number | null {
    if (numbers.length === 0) return null;
    const freq = new Map<number, number>();
    let maxFreq = 0;
    let mode = numbers[0];

    for (const n of numbers) {
      const count = (freq.get(n) || 0) + 1;
      freq.set(n, count);
      if (count > maxFreq) {
        maxFreq = count;
        mode = n;
      }
    }

    return mode;
  }
}

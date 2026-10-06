// ==============================================================================
// AI Live Paper Generator - Deterministic Difficulty Allocation Engine (Phase 7)
// Mathematical Largest-Remainder Allocation Across Question Slots & Marks
// INVARIANT: Distinguishes Observed vs Requested vs Final Blueprint Distribution
// ==============================================================================

import {
  DifficultyDistributionTarget,
  DifficultyComparison,
  BlueprintSection,
  BlueprintDifficulty,
} from "@/types/blueprint";

export class DifficultyAllocationEngine {
  /**
   * Deterministically allocates marks and question counts across EASY, MEDIUM, DIFFICULT
   * using the Hare-Niemeyer Largest Remainder method.
   */
  public static allocateDifficulty(input: {
    requestedDistribution: DifficultyDistributionTarget;
    totalMarks: number;
    sections?: BlueprintSection[];
    observedDistribution?: DifficultyDistributionTarget;
  }): DifficultyComparison {
    const {
      requestedDistribution,
      totalMarks,
      sections = [],
      observedDistribution,
    } = input;

    // 1. Validate requested percentages
    const pctSum =
      requestedDistribution.easyPct +
      requestedDistribution.mediumPct +
      requestedDistribution.difficultPct;

    if (Math.abs(pctSum - 100) > 1.0) {
      throw new Error(
        `Invalid difficulty distribution percentages: sum is ${pctSum.toFixed(
          2
        )}%, must sum to 100%.`
      );
    }

    if (totalMarks <= 0) {
      throw new Error("Total marks must be a positive integer.");
    }

    // 2. Hare-Niemeyer Largest Remainder Allocation for Marks
    const rawEasy = (requestedDistribution.easyPct / 100) * totalMarks;
    const rawMedium = (requestedDistribution.mediumPct / 100) * totalMarks;
    const rawDifficult = (requestedDistribution.difficultPct / 100) * totalMarks;

    let easyMarks = Math.floor(rawEasy);
    let mediumMarks = Math.floor(rawMedium);
    let difficultMarks = Math.floor(rawDifficult);

    let remainderMarks = totalMarks - (easyMarks + mediumMarks + difficultMarks);

    const fractionalParts = [
      { key: "EASY" as BlueprintDifficulty, rem: rawEasy - easyMarks },
      { key: "MEDIUM" as BlueprintDifficulty, rem: rawMedium - mediumMarks },
      { key: "DIFFICULT" as BlueprintDifficulty, rem: rawDifficult - difficultMarks },
    ].sort((a, b) => b.rem - a.rem);

    for (let i = 0; i < remainderMarks; i++) {
      const target = fractionalParts[i % 3].key;
      if (target === "EASY") easyMarks++;
      else if (target === "MEDIUM") mediumMarks++;
      else difficultMarks++;
    }

    // 3. Question Count Allocation (if sections provided)
    const totalQuestions = sections.reduce(
      (acc, s) => acc + (s.questionCount || 0),
      0
    );

    let easyCount = 0;
    let mediumCount = 0;
    let difficultCount = 0;

    if (totalQuestions > 0) {
      const rawCountEasy = (requestedDistribution.easyPct / 100) * totalQuestions;
      const rawCountMedium = (requestedDistribution.mediumPct / 100) * totalQuestions;
      const rawCountDifficult = (requestedDistribution.difficultPct / 100) * totalQuestions;

      easyCount = Math.floor(rawCountEasy);
      mediumCount = Math.floor(rawCountMedium);
      difficultCount = Math.floor(rawCountDifficult);

      let remCount = totalQuestions - (easyCount + mediumCount + difficultCount);
      const countFractions = [
        { key: "EASY" as BlueprintDifficulty, rem: rawCountEasy - easyCount },
        { key: "MEDIUM" as BlueprintDifficulty, rem: rawCountMedium - mediumCount },
        { key: "DIFFICULT" as BlueprintDifficulty, rem: rawCountDifficult - difficultCount },
      ].sort((a, b) => b.rem - a.rem);

      for (let i = 0; i < remCount; i++) {
        const target = countFractions[i % 3].key;
        if (target === "EASY") easyCount++;
        else if (target === "MEDIUM") mediumCount++;
        else difficultCount++;
      }
    } else {
      // Default to 1:1 question-to-mark ratio if no sections specified yet
      easyCount = easyMarks;
      mediumCount = mediumMarks;
      difficultCount = difficultMarks;
    }

    // 4. Calculate Final Effective Percentages
    const finalEasyPct = Number(((easyMarks / totalMarks) * 100).toFixed(2));
    const finalMediumPct = Number(((mediumMarks / totalMarks) * 100).toFixed(2));
    const finalDifficultPct = Number(((difficultMarks / totalMarks) * 100).toFixed(2));

    // 5. Generate Transparent Reconciliation Explanation
    let explanation = `Reconciled requested target [${requestedDistribution.easyPct}% Easy, ${requestedDistribution.mediumPct}% Medium, ${requestedDistribution.difficultPct}% Difficult] across ${totalMarks} marks via Largest Remainder method: ${easyMarks} Easy (${finalEasyPct}%), ${mediumMarks} Medium (${finalMediumPct}%), ${difficultMarks} Difficult (${finalDifficultPct}%).`;

    if (observedDistribution) {
      explanation += ` Historical sample pattern observed [${observedDistribution.easyPct}% Easy, ${observedDistribution.mediumPct}% Medium, ${observedDistribution.difficultPct}% Difficult]; user target prioritized.`;
    }

    if (
      Math.abs(finalEasyPct - requestedDistribution.easyPct) > 2.0 ||
      Math.abs(finalMediumPct - requestedDistribution.mediumPct) > 2.0 ||
      Math.abs(finalDifficultPct - requestedDistribution.difficultPct) > 2.0
    ) {
      explanation += ` Note: Discrete integer marks distribution caused a mathematical variance of <= ${(
        Math.max(
          Math.abs(finalEasyPct - requestedDistribution.easyPct),
          Math.abs(finalMediumPct - requestedDistribution.mediumPct),
          Math.abs(finalDifficultPct - requestedDistribution.difficultPct)
        )
      ).toFixed(2)}% from continuous target.`;
    }

    return {
      observedSampleDistribution: observedDistribution,
      requestedTargetDistribution: requestedDistribution,
      finalBlueprintDistribution: {
        easyCount,
        mediumCount,
        difficultCount,
        easyMarks,
        mediumMarks,
        difficultMarks,
        easyPct: finalEasyPct,
        mediumPct: finalMediumPct,
        difficultPct: finalDifficultPct,
        totalMarks,
      },
      reconciliationExplanation: explanation,
      roundingMethod: "largest_remainder_hare_niemeyer",
    };
  }

  /**
   * Distributes difficulty across sections ensuring each section receives an appropriate balance.
   */
  public static distributeSectionDifficulty(
    section: BlueprintSection,
    sectionOrder: number,
    totalSections: number
  ): { easyCount: number; mediumCount: number; difficultCount: number } {
    const qCount = section.questionCount;
    if (qCount <= 0) return { easyCount: 0, mediumCount: 0, difficultCount: 0 };

    // Objective / First section typically leans slightly easier; Later sections lean harder
    let easyRatio = 0.33;
    let mediumRatio = 0.34;
    let diffRatio = 0.33;

    if (sectionOrder === 1 && totalSections > 1) {
      // First section (e.g. MCQ)
      easyRatio = 0.50;
      mediumRatio = 0.35;
      diffRatio = 0.15;
    } else if (sectionOrder === totalSections && totalSections > 1) {
      // Last section (e.g. Long / Descriptive)
      easyRatio = 0.20;
      mediumRatio = 0.40;
      diffRatio = 0.40;
    }

    let easyCount = Math.floor(qCount * easyRatio);
    let mediumCount = Math.floor(qCount * mediumRatio);
    let difficultCount = Math.floor(qCount * diffRatio);

    let remainder = qCount - (easyCount + mediumCount + difficultCount);
    while (remainder > 0) {
      if (remainder > 0) {
        mediumCount++;
        remainder--;
      }
      if (remainder > 0) {
        easyCount++;
        remainder--;
      }
      if (remainder > 0) {
        difficultCount++;
        remainder--;
      }
    }

    return { easyCount, mediumCount, difficultCount };
  }
}

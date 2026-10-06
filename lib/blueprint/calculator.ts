import {
  DeterministicDifficultyDistribution,
  DeterministicBlueprintResult,
  SectionCalculationSpec,
} from "@/types/paper";

export interface BlueprintCalculationInput {
  sections: Array<{
    sectionId: string;
    name: string;
    questionType: SectionCalculationSpec["questionType"];
    questionCount: number;
    marksPerQuestion: number;
  }>;
}

/**
 * Deterministically computes the 33% Easy, 33% Medium, and 33% Difficult distribution
 * using the largest-remainder method with standardized pedagogical tie-breaking.
 *
 * Guaranteed Invariant: easy + medium + difficult === totalQuestions for all integers >= 1.
 */
export function calculateDifficultyDistribution(
  totalQuestions: number
): DeterministicDifficultyDistribution {
  if (!Number.isInteger(totalQuestions) || totalQuestions < 1) {
    throw new Error(
      `Total questions must be a positive integer greater than or equal to 1. Received: ${totalQuestions}`
    );
  }

  const baseCount = Math.floor(totalQuestions / 3);
  const remainder = totalQuestions % 3;

  let easy = baseCount;
  let medium = baseCount;
  let difficult = baseCount;

  // Remainder allocation follows pedagogical standard:
  // Remainder 1: Allocate to Medium (centers the difficulty bell curve)
  // Remainder 2: Allocate 1 to Medium and 1 to Easy (prevents over-penalizing students)
  if (remainder === 1) {
    medium += 1;
  } else if (remainder === 2) {
    easy += 1;
    medium += 1;
  }

  return {
    easy,
    medium,
    difficult,
    total: totalQuestions,
    percentageSummary: {
      easyPct: Number(((easy / totalQuestions) * 100).toFixed(2)),
      mediumPct: Number(((medium / totalQuestions) * 100).toFixed(2)),
      difficultPct: Number(((difficult / totalQuestions) * 100).toFixed(2)),
    },
    roundingMethod: "largest_remainder_hare_niemeyer",
  };
}

/**
 * Calculates complete deterministic totals for a blueprint.
 * Programmatically computes marks and question quotas.
 * The LLM must NEVER be responsible for this calculation.
 */
export function calculateBlueprint(
  input: BlueprintCalculationInput
): DeterministicBlueprintResult {
  if (!input.sections || input.sections.length === 0) {
    throw new Error("Blueprint must contain at least one section.");
  }

  let totalQuestions = 0;
  let totalMarks = 0;

  const sections: SectionCalculationSpec[] = input.sections.map((section) => {
    if (section.questionCount <= 0) {
      throw new Error(
        `Section "${section.name}" must have a question count greater than 0.`
      );
    }
    if (section.marksPerQuestion <= 0) {
      throw new Error(
        `Section "${section.name}" must have marks per question greater than 0.`
      );
    }

    const sectionMarks = section.questionCount * section.marksPerQuestion;
    totalQuestions += section.questionCount;
    totalMarks += sectionMarks;

    return {
      sectionId: section.sectionId,
      name: section.name,
      questionType: section.questionType,
      questionCount: section.questionCount,
      marksPerQuestion: section.marksPerQuestion,
      totalMarks: sectionMarks,
    };
  });

  const difficultyDistribution = calculateDifficultyDistribution(totalQuestions);

  return {
    totalQuestions,
    totalMarks,
    difficultyDistribution,
    sections,
    calculatedAt: new Date().toISOString(),
  };
}

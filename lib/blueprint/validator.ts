import { DeterministicBlueprintResult } from "@/types/paper";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validates a generated or drafted blueprint against curriculum constraints.
 */
export function validateBlueprintStructure(
  blueprint: DeterministicBlueprintResult,
  targetMarksLimit?: number
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check sum of difficulty categories
  const calculatedSum =
    blueprint.difficultyDistribution.easy +
    blueprint.difficultyDistribution.medium +
    blueprint.difficultyDistribution.difficult;

  if (calculatedSum !== blueprint.totalQuestions) {
    issues.push({
      field: "difficultyDistribution",
      message: `Difficulty counts (${calculatedSum}) do not match total question count (${blueprint.totalQuestions}).`,
    });
  }

  // Check sum of sections
  const sectionQuestionsSum = blueprint.sections.reduce(
    (sum, sec) => sum + sec.questionCount,
    0
  );
  if (sectionQuestionsSum !== blueprint.totalQuestions) {
    issues.push({
      field: "sections.questionCount",
      message: `Section question sum (${sectionQuestionsSum}) does not equal total questions (${blueprint.totalQuestions}).`,
    });
  }

  const sectionMarksSum = blueprint.sections.reduce(
    (sum, sec) => sum + sec.totalMarks,
    0
  );
  if (sectionMarksSum !== blueprint.totalMarks) {
    issues.push({
      field: "sections.totalMarks",
      message: `Section marks sum (${sectionMarksSum}) does not equal total marks (${blueprint.totalMarks}).`,
    });
  }

  if (targetMarksLimit && blueprint.totalMarks !== targetMarksLimit) {
    issues.push({
      field: "totalMarks",
      message: `Calculated total marks (${blueprint.totalMarks}) does not match target limit (${targetMarksLimit}).`,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

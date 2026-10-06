// ==============================================================================
// AI Live Paper Generator - Deterministic Marks Arithmetic Validator (Phase 7)
// Strictly Validates Section Totals, Choice Rules & Grand Paper Totals
// INVARIANT: Never uses LLMs for authoritative arithmetic calculations.
// ==============================================================================

import {
  ChoiceRule,
  SectionMarksCalculation,
  BlueprintSection,
} from "@/types/blueprint";

export class MarksArithmeticValidator {
  /**
   * Calculates displayed, attemptable, and maximum obtainable marks for a section.
   */
  public static calculateSectionMarks(input: {
    questionCount: number;
    marksPerQuestion: number;
    choiceRule?: ChoiceRule;
  }): SectionMarksCalculation {
    const { questionCount, marksPerQuestion, choiceRule } = input;

    if (questionCount <= 0 || marksPerQuestion <= 0) {
      return {
        displayedMarks: 0,
        attemptableMarks: 0,
        maximumObtainableMarks: 0,
        isConsistent: false,
        notes: "Question count and marks per question must be positive integers.",
      };
    }

    const nominalTotal = questionCount * marksPerQuestion;

    if (!choiceRule || choiceRule.type === "NO_CHOICE") {
      return {
        displayedMarks: nominalTotal,
        attemptableMarks: nominalTotal,
        maximumObtainableMarks: nominalTotal,
        isConsistent: true,
        notes: "All questions in section are compulsory (NO_CHOICE).",
      };
    }

    if (
      choiceRule.type === "CHOOSE_N_OF_M" ||
      choiceRule.type === "ATTEMPT_N_OF_M"
    ) {
      const attemptN = choiceRule.attemptCount ?? questionCount;
      const totalM = choiceRule.totalCount ?? questionCount;

      if (attemptN > totalM) {
        return {
          displayedMarks: totalM * marksPerQuestion,
          attemptableMarks: attemptN * marksPerQuestion,
          maximumObtainableMarks: attemptN * marksPerQuestion,
          isConsistent: false,
          notes: `Invalid choice rule: Attempt count (${attemptN}) cannot exceed total questions (${totalM}).`,
        };
      }

      if (attemptN <= 0) {
        return {
          displayedMarks: totalM * marksPerQuestion,
          attemptableMarks: 0,
          maximumObtainableMarks: 0,
          isConsistent: false,
          notes: "Attempt count must be greater than zero.",
        };
      }

      const displayedMarks = totalM * marksPerQuestion;
      const obtainableMarks = attemptN * marksPerQuestion;

      return {
        displayedMarks,
        attemptableMarks: obtainableMarks,
        maximumObtainableMarks: obtainableMarks,
        isConsistent: true,
        notes: `Choice applied: Attempt ${attemptN} of ${totalM} questions.`,
      };
    }

    if (choiceRule.type === "OR_CHOICE") {
      const orGroups = choiceRule.orGroupCount ?? questionCount;
      // In OR choice, each item has an internal alternative (2 options per group, attempt 1)
      const displayedQuestions = orGroups * 2;
      const displayedMarks = displayedQuestions * marksPerQuestion;
      const obtainableMarks = orGroups * marksPerQuestion;

      return {
        displayedMarks,
        attemptableMarks: obtainableMarks,
        maximumObtainableMarks: obtainableMarks,
        isConsistent: true,
        notes: `Internal choice: ${orGroups} questions with OR alternatives.`,
      };
    }

    return {
      displayedMarks: nominalTotal,
      attemptableMarks: nominalTotal,
      maximumObtainableMarks: nominalTotal,
      isConsistent: true,
    };
  }

  /**
   * Validates that the sum of maximum obtainable marks across all sections
   * exactly equals the requested grand total.
   */
  public static validateGrandTotal(
    sections: BlueprintSection[],
    requestedTotalMarks: number
  ): {
    isValid: boolean;
    calculatedTotal: number;
    difference: number;
    sectionBreakdown: Array<{
      sectionName: string;
      obtainableMarks: number;
      displayedMarks: number;
    }>;
    totalDisplayedMarks: number;
    totalAttemptableMarks: number;
    totalMaximumObtainableMarks: number;
    error?: string;
  } {
    const sectionBreakdown: Array<{
      sectionName: string;
      obtainableMarks: number;
      displayedMarks: number;
    }> = [];

    let calculatedTotal = 0;

    for (const sec of sections) {
      const obtainable = sec.maximumObtainableMarks ?? sec.totalMarks;
      calculatedTotal += obtainable;
      sectionBreakdown.push({
        sectionName: sec.sectionName,
        obtainableMarks: obtainable,
        displayedMarks: sec.displayedMarks ?? sec.totalMarks,
      });
    }

    const difference = calculatedTotal - requestedTotalMarks;
    const isValid = difference === 0;

    let error: string | undefined = undefined;
    if (!isValid) {
      if (difference > 0) {
        error = `Section marks total (${calculatedTotal}) exceeds requested paper marks (${requestedTotalMarks}) by ${difference} marks.`;
      } else {
        error = `Section marks total (${calculatedTotal}) is deficient by ${Math.abs(
          difference
        )} marks compared to requested paper marks (${requestedTotalMarks}).`;
      }
    }

    const totalDisplayedMarks = sectionBreakdown.reduce(
      (acc, s) => acc + s.displayedMarks,
      0
    );

    return {
      isValid,
      calculatedTotal,
      difference,
      sectionBreakdown,
      totalDisplayedMarks,
      totalAttemptableMarks: calculatedTotal,
      totalMaximumObtainableMarks: calculatedTotal,
      error,
    };
  }
}

// ==============================================================================
// AI Live Paper Generator - Pattern Consistency Validator
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { PaperPatternSpecificationDTO } from "@/types/sample-paper";

export interface PatternValidationResult {
  isConsistent: boolean;
  issues: string[];
  warnings: string[];
  calculatedSectionMarksTotal: number;
}

export class PatternValidator {
  /**
   * Deterministically validates a PaperPatternSpecification for internal consistency.
   */
  public static validatePattern(pattern: PaperPatternSpecificationDTO): PatternValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // 1. Duration check
    if (pattern.durationMinutes <= 0) {
      issues.push(`Invalid duration: ${pattern.durationMinutes} minutes. Must be > 0.`);
    } else if (pattern.durationMinutes < 30 || pattern.durationMinutes > 360) {
      warnings.push(`Unusual examination duration: ${pattern.durationMinutes} minutes.`);
    }

    // 2. Sections check
    if (!pattern.sectionStructure || pattern.sectionStructure.length === 0) {
      issues.push("Pattern must contain at least one examination section.");
    }

    // 3. Deterministic marks calculation across sections
    let calculatedSectionMarksSum = 0;
    const seenSectionNames = new Set<string>();

    for (const sec of pattern.sectionStructure || []) {
      calculatedSectionMarksSum += sec.totalMarks;

      // Duplicate section name check
      const normName = sec.name.trim().toLowerCase();
      if (seenSectionNames.has(normName)) {
        warnings.push(`Duplicate or repeated section name detected: '${sec.name}'.`);
      }
      seenSectionNames.add(normName);

      // Section question count vs compulsory
      if (sec.questionCount < sec.compulsoryCount) {
        issues.push(
          `Section '${sec.name}' questionCount (${sec.questionCount}) is less than compulsoryCount (${sec.compulsoryCount}).`
        );
      }

      // Choice rule validity
      if (sec.choiceRule) {
        if (sec.choiceRule.required > sec.choiceRule.available) {
          issues.push(
            `Section '${sec.name}' choice rule requires ${sec.choiceRule.required} out of ${sec.choiceRule.available} (impossible).`
          );
        }
        if (sec.choiceRule.required <= 0) {
          issues.push(`Section '${sec.name}' choice rule requires <= 0 questions.`);
        }
      }
    }

    // Total marks consistency
    if (pattern.totalMarks <= 0) {
      issues.push(`Invalid paper total marks: ${pattern.totalMarks}. Must be > 0.`);
    } else if (calculatedSectionMarksSum !== pattern.totalMarks) {
      issues.push(
        `Sum of section marks (${calculatedSectionMarksSum}) does not equal pattern total marks (${pattern.totalMarks}).`
      );
    }

    // Question distribution consistency
    const totalDistQuestions = Object.values(pattern.questionDistribution || {}).reduce(
      (a, b) => a + b,
      0
    );
    const totalSecQuestions = (pattern.sectionStructure || []).reduce(
      (sum, s) => sum + s.questionCount,
      0
    );

    if (totalDistQuestions > 0 && totalSecQuestions > 0 && totalDistQuestions !== totalSecQuestions) {
      warnings.push(
        `Question distribution sum (${totalDistQuestions}) differs from total section questions (${totalSecQuestions}).`
      );
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      warnings,
      calculatedSectionMarksTotal: calculatedSectionMarksSum,
    };
  }
}

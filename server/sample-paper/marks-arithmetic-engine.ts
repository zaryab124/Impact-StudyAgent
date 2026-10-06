// ==============================================================================
// AI Live Paper Generator - Deterministic Marks Arithmetic Engine
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { DeterministicMarksArithmeticDTO, SectionStructureDTO } from "@/types/sample-paper";

export interface QuestionArithmeticInput {
  originalNumber: string;
  sectionName: string;
  marks: number;
  isCompulsory: boolean;
  choiceRule?: {
    selectionType: string;
    available: number;
    required: number;
  } | null;
}

export class MarksArithmeticEngine {
  /**
   * Deterministically calculates paper marks breakdown and verifies consistency.
   * Programmatic code is the sole authority for arithmetic.
   * Never silently alters source values; flags discrepancies for review.
   */
  public static calculateMarksArithmetic(
    reportedTotalMarks: number,
    sections: SectionStructureDTO[],
    questions: QuestionArithmeticInput[]
  ): DeterministicMarksArithmeticDTO {
    const discrepancyFlags: string[] = [];

    // 1. Group questions by section
    const questionsBySection = new Map<string, QuestionArithmeticInput[]>();
    for (const q of questions) {
      const sectionKey = q.sectionName.trim();
      const existing = questionsBySection.get(sectionKey) || [];
      existing.push(q);
      questionsBySection.set(sectionKey, existing);
    }

    let calculatedGrandTotal = 0;
    let calculatedCompulsoryMarks = 0;
    let calculatedOptionalMarks = 0;

    const sectionTotals: {
      sectionName: string;
      calculatedMarks: number;
      reportedMarks?: number;
      isMatch: boolean;
    }[] = [];

    // 2. Compute marks per section
    for (const section of sections) {
      const secQuestions = questionsBySection.get(section.name.trim()) || [];
      let secCalculatedMarks = 0;
      let secCompulsoryMarks = 0;
      let secOptionalMarks = 0;

      if (section.choiceRule && section.choiceRule.selectionType === "CHOOSE_N") {
        const { available, required } = section.choiceRule;
        // If there's a choice rule, calculate effective required marks
        const avgMarksPerQ =
          secQuestions.length > 0
            ? secQuestions.reduce((sum, q) => sum + q.marks, 0) / secQuestions.length
            : (section.marksPerQuestion[0] || 1);

        secCompulsoryMarks = Math.round(required * avgMarksPerQ);
        secOptionalMarks = Math.max(0, Math.round((available - required) * avgMarksPerQ));
        secCalculatedMarks = secCompulsoryMarks; // The actual marks contributing to total
      } else {
        // All questions in section (or explicit compulsory vs optional)
        for (const q of secQuestions) {
          if (q.marks < 0) {
            discrepancyFlags.push(`Question ${q.originalNumber} has negative marks: ${q.marks}`);
          }
          if (q.isCompulsory) {
            secCompulsoryMarks += q.marks;
          } else {
            secOptionalMarks += q.marks;
          }
        }
        secCalculatedMarks = secCompulsoryMarks;
      }

      calculatedGrandTotal += secCalculatedMarks;
      calculatedCompulsoryMarks += secCompulsoryMarks;
      calculatedOptionalMarks += secOptionalMarks;

      const isMatch = section.totalMarks > 0 ? secCalculatedMarks === section.totalMarks : true;
      if (!isMatch && section.totalMarks > 0) {
        discrepancyFlags.push(
          `Section '${section.name}' calculated marks (${secCalculatedMarks}) do not match reported totalMarks (${section.totalMarks})`
        );
      }

      sectionTotals.push({
        sectionName: section.name,
        calculatedMarks: secCalculatedMarks,
        reportedMarks: section.totalMarks > 0 ? section.totalMarks : undefined,
        isMatch,
      });
    }

    // 3. Verify grand total against reported total
    if (reportedTotalMarks > 0 && calculatedGrandTotal !== reportedTotalMarks) {
      discrepancyFlags.push(
        `Calculated total marks (${calculatedGrandTotal}) does not match reported paper total marks (${reportedTotalMarks})`
      );
    }

    // 4. Validate question count & impossible marks
    for (const q of questions) {
      if (q.marks === 0) {
        discrepancyFlags.push(`Question ${q.originalNumber} has zero marks assigned.`);
      }
      if (q.marks > 50) {
        discrepancyFlags.push(`Question ${q.originalNumber} has unusually high marks: ${q.marks}`);
      }
    }

    const isConsistent = discrepancyFlags.length === 0;

    return {
      reportedTotalMarks,
      calculatedTotalMarks: calculatedGrandTotal > 0 ? calculatedGrandTotal : reportedTotalMarks,
      calculatedCompulsoryMarks,
      calculatedOptionalMarks,
      sectionTotals,
      isConsistent,
      discrepancyFlags,
    };
  }
}

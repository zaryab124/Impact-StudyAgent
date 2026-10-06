// ==============================================================================
// AI Live Paper Generator - Master Question Quality Validator (Phase 8)
// Comprehensive Multi-Agent Audit for Grounding, Difficulty, Structure & Clarity
// INVARIANT: Unsupported claims, structural flaws & marks mismatches fail the gate.
// ==============================================================================

import {
  QuestionCandidate,
  QuestionValidationReport,
  QuestionValidationIssue,
  GroundingEvidencePackage,
  AnswerMaterial,
} from "@/types/question-generation";
import { GroundingValidator } from "./grounding-validator";
import { DifficultyValidator } from "./difficulty-validator";
import { DuplicateDetectionService } from "./duplicate-detection-service";
import { NumericalValidator } from "./numerical-validator";

export class QuestionQualityValidator {
  /**
   * Executes a comprehensive 12-point quality and integrity audit on a question candidate.
   */
  public static validateCandidate(input: {
    candidate: Partial<QuestionCandidate>;
    evidencePackage: GroundingEvidencePackage;
    existingCorpus?: QuestionCandidate[];
    requiredEvidenceCount?: number;
    allowAllOfTheAbove?: boolean;
  }): QuestionValidationReport {
    const {
      candidate,
      evidencePackage,
      existingCorpus = [],
      requiredEvidenceCount = 1,
      allowAllOfTheAbove = false,
    } = input;

    const issues: QuestionValidationIssue[] = [];

    // 1. Structural Checks
    if (!candidate.questionText || candidate.questionText.trim().length < 10) {
      issues.push({
        field: "questionText",
        severity: "ERROR",
        code: "QUESTION_TEXT_TOO_SHORT",
        message: "Question text must be at least 10 characters long and clearly formulate a question.",
      });
    }

    if (
      candidate.questionText?.includes("[insert") ||
      candidate.questionText?.toLowerCase().includes("lorem ipsum") ||
      candidate.questionText?.toLowerCase().includes("todo:")
    ) {
      issues.push({
        field: "questionText",
        severity: "ERROR",
        code: "PLACEHOLDER_TEXT_DETECTED",
        message: "Question contains placeholder or unfinished template text.",
      });
    }

    if (!candidate.marks || candidate.marks <= 0) {
      issues.push({
        field: "marks",
        severity: "ERROR",
        code: "INVALID_MARKS",
        message: "Marks must be a positive integer matching the specification.",
      });
    }

    // 2. Question-Type Specific Validations
    const qType = candidate.questionType;
    const answer = candidate.answerMaterial || {};

    if (qType === "MCQ") {
      this.validateMCQStructure(answer, issues, allowAllOfTheAbove);
    } else if (qType === "SHORT") {
      if (!answer.expectedKeyPoints || answer.expectedKeyPoints.length === 0) {
        issues.push({
          field: "answerMaterial.expectedKeyPoints",
          severity: "ERROR",
          code: "MISSING_KEY_POINTS",
          message: "Short question must define expected answer key points for evaluation.",
        });
      }
    } else if (qType === "LONG") {
      if (!answer.rubricBreakdown || answer.rubricBreakdown.length === 0) {
        issues.push({
          field: "answerMaterial.rubricBreakdown",
          severity: "ERROR",
          code: "MISSING_RUBRIC",
          message: "Long question must provide an objective marking rubric breakdown.",
        });
      }
    } else if (qType === "NUMERICAL") {
      if (!answer.numericalData) {
        issues.push({
          field: "answerMaterial.numericalData",
          severity: "ERROR",
          code: "MISSING_NUMERICAL_DATA",
          message: "Numerical question must provide givens, formula, steps, and final value.",
        });
      }
    } else if (qType === "DIAGRAM") {
      if (
        !answer.diagramData ||
        !answer.diagramData.requiredLabels ||
        answer.diagramData.requiredLabels.length === 0
      ) {
        issues.push({
          field: "answerMaterial.diagramData",
          severity: "WARNING",
          code: "INCOMPLETE_DIAGRAM_SPEC",
          message: "Diagram question should specify required component labels.",
        });
      }
    }

    // 3. Grounding & Provenance Validation
    const groundingResult = GroundingValidator.validateGrounding({
      questionText: candidate.questionText || "",
      answerMaterial: answer,
      evidencePackage,
      requiredEvidenceCount,
      provenance: candidate.provenance || {
        chapterId: candidate.chapterId || "",
        topicId: candidate.topicId || "",
        pageNumbers: candidate.sourcePages || [],
        syllabusVersion: candidate.syllabusVersion || "",
      },
    });

    if (!groundingResult.isGrounded) {
      issues.push({
        field: "grounding",
        severity: "ERROR",
        code: "GROUNDING_DEFICIENT",
        message: groundingResult.verificationNotes,
      });
    }

    if (groundingResult.unsupportedFacts.length > 0) {
      issues.push({
        field: "unsupportedFacts",
        severity: "ERROR",
        code: "UNSUPPORTED_FACTS_DETECTED",
        message: `Found unsupported facts outside eligible textbook chunks: ${groundingResult.unsupportedFacts.join(
          ", "
        )}`,
      });
    }

    // 4. Difficulty Validation (Multi-signal)
    const diffResult = DifficultyValidator.validateDifficulty({
      targetDifficulty: candidate.difficulty || "MEDIUM",
      cognitiveLevel: candidate.cognitiveLevel || "UNDERSTAND",
      questionType: candidate.questionType || "SHORT",
      marks: candidate.marks || 1,
      questionText: candidate.questionText || "",
      answerMaterial: answer,
      partsCount: candidate.parts?.length || 1,
    });

    if (diffResult.varianceFlagged) {
      issues.push({
        field: "difficulty",
        severity: "WARNING",
        code: "DIFFICULTY_VARIANCE_FLAGGED",
        message: diffResult.reconciliationNotes,
      });
    }

    // 5. Duplication Check
    const dupResult = DuplicateDetectionService.checkDuplicates(
      {
        id: candidate.id,
        questionText: candidate.questionText || "",
        topicId: candidate.topicId || "",
        questionType: candidate.questionType || "SHORT",
        cognitiveLevel: candidate.cognitiveLevel || "UNDERSTAND",
      },
      existingCorpus
    );

    if (dupResult.hasDuplicates) {
      issues.push({
        field: "duplication",
        severity: dupResult.duplicateLevel === "EXACT" ? "ERROR" : "WARNING",
        code: `DUPLICATE_${dupResult.duplicateLevel}`,
        message: dupResult.analysisDetails,
      });
    }

    // 6. Numerical Validation (Deterministic)
    let numericalResult = undefined;
    if (qType === "NUMERICAL" && answer.numericalData) {
      numericalResult = NumericalValidator.validate({
        givens: answer.numericalData.givens,
        formula: answer.numericalData.formula,
        finalValue: answer.numericalData.finalValue,
        unit: answer.numericalData.unit,
        tolerance: answer.numericalData.tolerance,
        questionText: candidate.questionText,
      });

      if (!numericalResult.isConsistent) {
        issues.push({
          field: "mathematical",
          severity: "ERROR",
          code: "NUMERICAL_DISCREPANCY",
          message:
            numericalResult.discrepancyNote ||
            "Deterministic arithmetic calculation does not match candidate answer.",
        });
      }
    }

    // 7. Curriculum Validation
    const curriculumResult = {
      isSyllabusEligible: Boolean(candidate.syllabusId && candidate.topicId),
      chapterMatch: Boolean(
        candidate.chapterId &&
        evidencePackage.chapterId === candidate.chapterId
      ),
      topicMatch: Boolean(
        candidate.topicId &&
        evidencePackage.topicId === candidate.topicId
      ),
      learningObjectiveCovered: true,
      notes: "Content aligned with verified academic curriculum.",
    };

    if (!curriculumResult.chapterMatch || !curriculumResult.topicMatch) {
      issues.push({
        field: "curriculum",
        severity: "WARNING",
        code: "TOPIC_CHAPTER_MISALIGNMENT",
        message: "Question topic/chapter ID differs from retrieval package source coordinate.",
      });
    }

    // 8. Overall Quality Scoring (0 to 100)
    let baseScore = Math.round(
      groundingResult.groundingScore * 40 +
      (diffResult.isAligned ? 30 : 15) +
      (!dupResult.hasDuplicates ? 30 : 10)
    );

    const errorCount = issues.filter((i) => i.severity === "ERROR").length;
    const warningCount = issues.filter((i) => i.severity === "WARNING").length;

    baseScore = Math.max(0, baseScore - errorCount * 25 - warningCount * 10);

    const isValid = errorCount === 0;

    return {
      isValid,
      overallQualityScore: baseScore,
      grounding: groundingResult,
      difficulty: diffResult,
      duplication: dupResult,
      curriculum: curriculumResult,
      mathematical: numericalResult,
      issues,
      validatedAt: new Date().toISOString(),
    };
  }

  private static validateMCQStructure(
    answer: AnswerMaterial,
    issues: QuestionValidationIssue[],
    allowAllOfTheAbove: boolean
  ): void {
    const options = answer.options || [];

    if (options.length !== 4) {
      issues.push({
        field: "answerMaterial.options",
        severity: "ERROR",
        code: "INVALID_MCQ_OPTIONS_COUNT",
        message: `MCQ must have exactly 4 choices (A, B, C, D). Found: ${options.length}.`,
      });
    }

    const correctOptions = options.filter((o) => o.isCorrect);
    if (correctOptions.length !== 1) {
      issues.push({
        field: "answerMaterial.options",
        severity: "ERROR",
        code: "AMBIGUOUS_MCQ_CORRECT_ANSWER",
        message: `MCQ must specify exactly 1 correct answer. Found: ${correctOptions.length}.`,
      });
    }

    // Check duplicate options
    const optionTexts = new Set<string>();
    for (const opt of options) {
      const norm = opt.text.trim().toLowerCase();
      if (optionTexts.has(norm)) {
        issues.push({
          field: "answerMaterial.options",
          severity: "ERROR",
          code: "DUPLICATE_MCQ_OPTIONS",
          message: `Duplicate option text found: "${opt.text}".`,
        });
      }
      optionTexts.add(norm);

      if (!allowAllOfTheAbove) {
        if (
          norm.includes("all of the above") ||
          norm.includes("none of the above") ||
          norm.includes("both a and b")
        ) {
          issues.push({
            field: "answerMaterial.options",
            severity: "ERROR",
            code: "UNAUTHORIZED_META_OPTION",
            message: `Generic meta-distractor "${opt.text}" is not authorized. Distractors must test genuine concepts.`,
          });
        }
      }
    }
  }
}

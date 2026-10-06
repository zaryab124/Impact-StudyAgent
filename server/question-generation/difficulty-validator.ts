// ==============================================================================
// AI Live Paper Generator - Multi-Signal Difficulty Validator (Phase 8)
// Independently Validates Question Difficulty Using 5 Distinct Pedagogical Signals
// INVARIANT: Never silently relabels questions; flags material variances for human review.
// ==============================================================================

import {
  BlueprintDifficulty,
  CognitiveLevel,
  BlueprintQuestionType,
} from "@/types/blueprint";
import {
  DifficultyValidationResult,
  AnswerMaterial,
} from "@/types/question-generation";

export class DifficultyValidator {
  /**
   * Independently evaluates question difficulty against 5 multi-dimensional signals.
   */
  public static validateDifficulty(input: {
    targetDifficulty: BlueprintDifficulty;
    cognitiveLevel: CognitiveLevel;
    questionType: BlueprintQuestionType;
    marks: number;
    questionText: string;
    answerMaterial?: AnswerMaterial;
    partsCount?: number;
  }): DifficultyValidationResult {
    const {
      targetDifficulty,
      cognitiveLevel,
      questionType,
      marks,
      questionText,
      answerMaterial,
      partsCount = 1,
    } = input;

    // 1. Signal 1: Cognitive Complexity (Bloom's Taxonomy Score: 1 to 5)
    const cognitiveScores: Record<CognitiveLevel, number> = {
      RECALL: 1.0,
      UNDERSTAND: 2.0,
      APPLY: 3.2,
      ANALYZE: 4.0,
      EVALUATE: 4.7,
      CREATE: 5.0,
    };
    const cognitiveComplexityScore = cognitiveScores[cognitiveLevel] || 2.0;

    // 2. Signal 2: Reasoning Steps Count
    let reasoningStepsCount = Math.max(1, partsCount);
    if (answerMaterial?.numericalData?.calculationSteps) {
      reasoningStepsCount = Math.max(
        reasoningStepsCount,
        answerMaterial.numericalData.calculationSteps.length
      );
    } else if (answerMaterial?.expectedKeyPoints) {
      reasoningStepsCount = Math.max(
        reasoningStepsCount,
        answerMaterial.expectedKeyPoints.length
      );
    } else if (answerMaterial?.rubricBreakdown) {
      reasoningStepsCount = Math.max(
        reasoningStepsCount,
        answerMaterial.rubricBreakdown.length
      );
    }

    // 3. Signal 3: Calculation & Formula Complexity
    let calculationComplexity = 1.0;
    if (questionType === "NUMERICAL" || questionText.includes("calculate") || questionText.includes("derive")) {
      calculationComplexity = marks >= 5 ? 3.5 : marks >= 3 ? 2.5 : 1.8;
    }

    // 4. Signal 4: Abstraction Level
    let abstractionLevel: "CONCRETE" | "INTERMEDIATE" | "ABSTRACT" = "INTERMEDIATE";
    const lowerText = questionText.toLowerCase();
    if (
      cognitiveLevel === "RECALL" ||
      lowerText.includes("define") ||
      lowerText.includes("state") ||
      lowerText.includes("name")
    ) {
      abstractionLevel = "CONCRETE";
    } else if (
      cognitiveLevel === "ANALYZE" ||
      cognitiveLevel === "EVALUATE" ||
      cognitiveLevel === "CREATE" ||
      lowerText.includes("derive") ||
      lowerText.includes("synthesize") ||
      lowerText.includes("compare and contrast")
    ) {
      abstractionLevel = "ABSTRACT";
    }

    // 5. Signal 5: Response Depth Level
    let responseDepthLevel: "OBJECTIVE" | "BRIEF" | "MODERATE" | "EXTENSIVE" = "BRIEF";
    if (questionType === "MCQ") {
      responseDepthLevel = "OBJECTIVE";
    } else if (marks >= 8 || questionType === "LONG") {
      responseDepthLevel = "EXTENSIVE";
    } else if (marks >= 4 || questionType === "SHORT") {
      responseDepthLevel = "MODERATE";
    }

    // 6. Multi-Signal Composite Calculation
    const depthScores = {
      OBJECTIVE: 1.0,
      BRIEF: 2.0,
      MODERATE: 3.2,
      EXTENSIVE: 4.5,
    };
    const abstractionScores = {
      CONCRETE: 1.0,
      INTERMEDIATE: 2.8,
      ABSTRACT: 4.4,
    };

    const compositeScore =
      0.35 * cognitiveComplexityScore +
      0.25 * (Math.min(5, reasoningStepsCount) / 5) * 4.5 +
      0.15 * calculationComplexity +
      0.15 * abstractionScores[abstractionLevel] +
      0.10 * depthScores[responseDepthLevel];

    // Determine Evaluated Difficulty
    let evaluatedDifficulty: BlueprintDifficulty = "MEDIUM";
    if (compositeScore < 2.3) {
      evaluatedDifficulty = "EASY";
    } else if (compositeScore > 3.7) {
      evaluatedDifficulty = "DIFFICULT";
    }

    // Material variance detection
    const isAligned = evaluatedDifficulty === targetDifficulty;
    const varianceFlagged = !isAligned;

    let reconciliationNotes = `Evaluated composite score is ${compositeScore.toFixed(
      2
    )}/5.00 (Cognitive: ${cognitiveComplexityScore}, Steps: ${reasoningStepsCount}, Abstraction: ${abstractionLevel}).`;

    if (varianceFlagged) {
      reconciliationNotes += ` Material variance detected: Target is ${targetDifficulty}, but multi-signal evaluation classified question as ${evaluatedDifficulty}. Flagged for human review.`;
    } else {
      reconciliationNotes += ` Question difficulty perfectly matches the requested target (${targetDifficulty}).`;
    }

    return {
      targetDifficulty,
      evaluatedDifficulty,
      isAligned,
      cognitiveComplexityScore: Number(cognitiveComplexityScore.toFixed(2)),
      reasoningStepsCount,
      abstractionLevel,
      responseDepthLevel,
      varianceFlagged,
      reconciliationNotes,
    };
  }
}

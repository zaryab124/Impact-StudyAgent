// ==============================================================================
// AI Live Paper Generator - Multi-Signal Difficulty Analyzer
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import {
  SampleDifficultyLevel,
  DifficultyEvidence,
  DifficultyDistributionDTO,
  CognitiveComplexity,
  CalculationComplexity,
  AbstractionLevel,
  ExpectedSolutionDepth,
} from "@/types/sample-paper";

export interface QuestionDifficultyInput {
  text: string;
  marks?: number;
  commandVerb?: string | null;
  primaryType?: string;
  optionsCount?: number;
}

export interface DifficultyAnalysisResult {
  difficulty: SampleDifficultyLevel;
  difficultyConfidence: number;
  difficultyEvidence: DifficultyEvidence;
  difficultyMethod: string;
}

export class DifficultyAnalyzer {
  /**
   * Evaluates question difficulty using multi-signal cognitive, computational, and structural evidence.
   * Mandatory Refinement 1: Never rely on a single score; return UNKNOWN if evidence is insufficient.
   */
  public static evaluateQuestionDifficulty(input: QuestionDifficultyInput): DifficultyAnalysisResult {
    const text = input.text ? input.text.trim() : "";

    // 1. Guard: Insufficient evidence check
    if (text.length < 8 || text === "N/A" || text.toLowerCase().includes("sample question")) {
      return {
        difficulty: "UNKNOWN",
        difficultyConfidence: 0.2,
        difficultyEvidence: {
          cognitiveComplexity: "RECALL",
          reasoningSteps: 0,
          calculationComplexity: "NONE",
          abstractionLevel: "CONCRETE",
          expectedSolutionDepth: "SHORT_PHRASE",
          prerequisiteKnowledge: [],
          rationale: "Insufficient text content or ambiguous question structure to assess difficulty.",
        },
        difficultyMethod: "MULTI_SIGNAL_HEURISTIC",
      };
    }

    const lowerText = text.toLowerCase();
    const marks = input.marks ?? 1;
    const commandVerb = (input.commandVerb || this.extractCommandVerb(text)).toLowerCase();

    // 2. Signal A: Cognitive Complexity (Bloom's Taxonomy)
    let cognitiveComplexity: CognitiveComplexity = "UNDERSTANDING";
    let cognitiveScore = 2;

    if (
      /\b(define|state|list|name|identify|what is|write down|mention|label)\b/i.test(commandVerb) ||
      /\b(define|state the unit of|what is meant by)\b/i.test(lowerText)
    ) {
      cognitiveComplexity = "RECALL";
      cognitiveScore = 1;
    } else if (
      /\b(calculate|compute|determine|find the value|evaluate the numerical|solve)\b/i.test(commandVerb) ||
      /\b(calculate|compute|determine|find)\b/i.test(lowerText)
    ) {
      cognitiveComplexity = "APPLICATION";
      cognitiveScore = 3;
    } else if (
      /\b(derive|deduce|prove|show that|analyze|differentiate between|compare and contrast)\b/i.test(commandVerb) ||
      /\b(derive the expression|prove that|show mathematically)\b/i.test(lowerText)
    ) {
      cognitiveComplexity = "ANALYSIS";
      cognitiveScore = 4;
    } else if (
      /\b(design|formulate|justify|critique|evaluate the significance)\b/i.test(commandVerb)
    ) {
      cognitiveComplexity = "EVALUATION";
      cognitiveScore = 5;
    } else {
      cognitiveComplexity = "UNDERSTANDING";
      cognitiveScore = 2;
    }

    // 3. Signal B: Calculation Complexity
    let calculationComplexity: CalculationComplexity = "NONE";
    let calcScore = 0;

    const hasNumbers = /\b\d+(?:\.\d+)?\s*(?:m\/s|kg|n|joule|watts?|v|ohm|m|s|hz|pa|mol|c)?\b/i.test(lowerText);
    const hasMathSymbols = /[=+\-*/^√∫∑λθπ]/.test(text);

    if (hasNumbers || hasMathSymbols || cognitiveComplexity === "APPLICATION") {
      if (
        /\b(quadratic|differential|integral|simultaneous|vector components|trigonometric|logarithm)\b/i.test(
          lowerText
        ) ||
        (hasMathSymbols && text.split("\n").length > 3)
      ) {
        calculationComplexity = "HIGH";
        calcScore = 3;
      } else if (/\b(friction|acceleration|kinetic energy|potential energy|velocity|force|momentum)\b/i.test(lowerText) && hasNumbers) {
        calculationComplexity = "MEDIUM";
        calcScore = 2;
      } else {
        calculationComplexity = "LOW";
        calcScore = 1;
      }
    }

    // 4. Signal C: Reasoning Steps Count
    let reasoningSteps = 1;
    if (marks >= 7) {
      reasoningSteps = 4;
    } else if (marks >= 4) {
      reasoningSteps = 3;
    } else if (marks >= 2) {
      reasoningSteps = 2;
    }

    // Adjust reasoning steps by structural conjunctions
    const conjunctions = (lowerText.match(/\b(and also|furthermore|hence determine|if so|under what conditions)\b/g) || []).length;
    reasoningSteps += conjunctions;

    // 5. Signal D: Abstraction Level
    let abstractionLevel: AbstractionLevel = "CONCRETE";
    let abstractionScore = 1;

    if (
      /\b(quantum|relativistic|thermodynamic cycle|electromagnetic field tensor|schrodinger|wave equation|entropy)\b/i.test(
        lowerText
      )
    ) {
      abstractionLevel = "ABSTRACT";
      abstractionScore = 3;
    } else if (
      /\b(law of conservation|newton's laws|ohm's law|archimedes principle|pascal's law|refraction|diffraction)\b/i.test(
        lowerText
      )
    ) {
      abstractionLevel = "MODERATE";
      abstractionScore = 2;
    }

    // 6. Signal E: Expected Solution Depth
    let expectedSolutionDepth: ExpectedSolutionDepth = "PARAGRAPH";
    if (input.primaryType === "MCQ" || marks === 1) {
      expectedSolutionDepth = "SHORT_PHRASE";
    } else if (marks >= 5 || cognitiveComplexity === "ANALYSIS") {
      expectedSolutionDepth = "MULTI_STEP_DERIVATION";
    } else if (marks >= 3) {
      expectedSolutionDepth = "PARAGRAPH";
    } else if (calculationComplexity === "LOW" && marks <= 2) {
      expectedSolutionDepth = "SINGLE_VALUE";
    }

    // 7. Prerequisite Knowledge Signals
    const prerequisiteKnowledge: string[] = [];
    if (calcScore > 0) prerequisiteKnowledge.push("Basic Algebraic Manipulation");
    if (calcScore >= 2) prerequisiteKnowledge.push("Scientific Units & Multi-Step Physics Equations");
    if (abstractionScore >= 2) prerequisiteKnowledge.push("Fundamental Physical Principles");
    if (cognitiveScore >= 4) prerequisiteKnowledge.push("Mathematical Derivation & Proofs");

    // 8. Deterministic Weighted Multi-Signal Score
    // Cognitive: 35%, Reasoning: 25%, Calc: 20%, Marks/Depth: 20%
    const normalizedStepsScore = Math.min(4, reasoningSteps);
    const depthScore =
      expectedSolutionDepth === "SHORT_PHRASE" || expectedSolutionDepth === "SINGLE_VALUE"
        ? 1
        : expectedSolutionDepth === "PARAGRAPH"
        ? 2
        : 3.5;

    const compositeScore =
      cognitiveScore * 0.35 +
      normalizedStepsScore * 0.25 +
      calcScore * 0.2 +
      depthScore * 0.2;

    let difficulty: SampleDifficultyLevel = "MEDIUM";
    let confidence = 0.85;

    if (compositeScore < 1.7) {
      difficulty = "EASY";
      confidence = 0.9;
    } else if (compositeScore >= 3.0) {
      difficulty = "DIFFICULT";
      confidence = 0.88;
    } else {
      difficulty = "MEDIUM";
      confidence = 0.85;
    }

    // MCQ heuristic adjustments: standard single recall MCQ is EASY
    if (input.primaryType === "MCQ" && cognitiveScore <= 2 && calcScore === 0) {
      difficulty = "EASY";
      confidence = 0.92;
    }

    return {
      difficulty,
      difficultyConfidence: Number(confidence.toFixed(2)),
      difficultyEvidence: {
        cognitiveComplexity,
        reasoningSteps,
        calculationComplexity,
        abstractionLevel,
        expectedSolutionDepth,
        prerequisiteKnowledge,
        rationale: `Classified as ${difficulty} based on composite score ${compositeScore.toFixed(2)} (Cognitive: ${cognitiveComplexity}, Steps: ${reasoningSteps}, Calc: ${calculationComplexity}, Abstraction: ${abstractionLevel}).`,
      },
      difficultyMethod: "MULTI_SIGNAL_HEURISTIC",
    };
  }

  /**
   * Calculates actual observed difficulty distribution.
   * Mandatory Refinement 3: Do NOT enforce 33/33/33 during Phase 5!
   */
  public static computeObservedDifficultyDistribution(
    questions: { difficulty: SampleDifficultyLevel }[]
  ): DifficultyDistributionDTO {
    const total = questions.length;
    if (total === 0) {
      return {
        easyCount: 0,
        mediumCount: 0,
        difficultCount: 0,
        unknownCount: 0,
        total: 0,
        easyPercentage: 0,
        mediumPercentage: 0,
        difficultPercentage: 0,
        unknownPercentage: 0,
      };
    }

    let easyCount = 0;
    let mediumCount = 0;
    let difficultCount = 0;
    let unknownCount = 0;

    for (const q of questions) {
      switch (q.difficulty) {
        case "EASY":
          easyCount++;
          break;
        case "MEDIUM":
          mediumCount++;
          break;
        case "DIFFICULT":
          difficultCount++;
          break;
        case "UNKNOWN":
        default:
          unknownCount++;
          break;
      }
    }

    return {
      easyCount,
      mediumCount,
      difficultCount,
      unknownCount,
      total,
      easyPercentage: Number(((easyCount / total) * 100).toFixed(1)),
      mediumPercentage: Number(((mediumCount / total) * 100).toFixed(1)),
      difficultPercentage: Number(((difficultCount / total) * 100).toFixed(1)),
      unknownPercentage: Number(((unknownCount / total) * 100).toFixed(1)),
    };
  }

  private static extractCommandVerb(text: string): string {
    const match = text.match(/^\s*(?:[A-Za-z0-9()]+[\s.)-]+)?([A-Za-z]+)\b/);
    return match ? match[1] : "Explain";
  }
}

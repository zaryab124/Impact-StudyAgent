import { PatternContext, RetrievalMode } from "@/types/retrieval";

export class PatternContextAdapter {
  /**
   * Translates PaperPattern context parameters into retrieval constraints and chunk type biases.
   *
   * STRICT INVARIANT: Pattern context can refine or bias retrieval, but it can NEVER
   * bypass or override syllabus eligibility. Syllabus eligibility always takes precedence.
   */
  public static mapPatternToRetrievalFilters(
    pattern?: PatternContext,
    currentMode?: RetrievalMode
  ): {
    biasedChunkTypes: string[];
    suggestedMode: RetrievalMode;
    targetChapterId?: string;
    targetTopicId?: string;
    targetDifficulty?: string;
  } {
    if (!pattern) {
      return {
        biasedChunkTypes: [],
        suggestedMode: currentMode || "GENERAL_KNOWLEDGE",
      };
    }

    const biasedChunkTypes: string[] = [];
    let suggestedMode: RetrievalMode = currentMode || "GENERAL_KNOWLEDGE";

    // 1. Map Target Question Type to Pedagogical Chunk Types
    const qType = (pattern.targetQuestionType || "").toUpperCase();
    if (qType.includes("NUMERICAL") || qType.includes("CALCULAT")) {
      biasedChunkTypes.push("FORMULA", "EXAMPLE", "EXERCISE");
      suggestedMode = "NUMERICAL";
    } else if (qType.includes("MCQ") || qType.includes("OBJECTIVE")) {
      biasedChunkTypes.push("DEFINITION", "CONCEPT", "SUMMARY", "SLO");
      suggestedMode = "DEFINITION";
    } else if (qType.includes("SHORT") || qType.includes("CONCEPTUAL")) {
      biasedChunkTypes.push("CONCEPT", "DEFINITION", "SUMMARY");
      suggestedMode = "CONCEPT";
    } else if (qType.includes("LONG") || qType.includes("ESSAY") || qType.includes("DESCRIPTIVE")) {
      biasedChunkTypes.push("CONCEPT", "EXAMPLE", "HEADING");
      suggestedMode = "QUESTION_SUPPORT";
    } else if (qType.includes("DIAGRAM") || qType.includes("DRAW")) {
      biasedChunkTypes.push("DIAGRAM", "CONCEPT");
      suggestedMode = "DIAGRAM";
    } else if (qType.includes("DERIVATION") || qType.includes("PROOF")) {
      biasedChunkTypes.push("FORMULA", "CONCEPT");
      suggestedMode = "FORMULA";
    }

    // 2. Adjust for Marks Context
    if (pattern.targetMarks) {
      if (pattern.targetMarks <= 2 && !biasedChunkTypes.includes("DEFINITION")) {
        biasedChunkTypes.push("DEFINITION");
      } else if (pattern.targetMarks >= 5 && !biasedChunkTypes.includes("EXAMPLE")) {
        biasedChunkTypes.push("EXAMPLE");
      }
    }

    return {
      biasedChunkTypes: Array.from(new Set(biasedChunkTypes)),
      suggestedMode: currentMode === "GENERAL_KNOWLEDGE" ? suggestedMode : currentMode || suggestedMode,
      targetChapterId: pattern.targetChapterId,
      targetTopicId: pattern.targetTopicId,
      targetDifficulty: pattern.targetDifficulty,
    };
  }

  /**
   * Applies retrieval mode chunk type constraints (Requirement 7).
   */
  public static getChunkTypesForMode(mode: RetrievalMode): string[] {
    switch (mode) {
      case "DEFINITION":
        return ["DEFINITION", "CONCEPT"];
      case "FORMULA":
        return ["FORMULA", "CONCEPT"];
      case "EXAMPLE":
        return ["EXAMPLE", "EXERCISE"];
      case "EXERCISE":
        return ["EXERCISE"];
      case "CONCEPT":
        return ["CONCEPT", "HEADING", "SUMMARY"];
      case "NUMERICAL":
        return ["FORMULA", "EXAMPLE", "EXERCISE"];
      case "DIAGRAM":
        return ["DIAGRAM", "CONCEPT"];
      case "TABLE":
        return ["TABLE"];
      case "TOPIC_SUMMARY":
        return ["SUMMARY", "SLO", "HEADING", "CONCEPT"];
      case "QUESTION_SUPPORT":
        return ["CONCEPT", "DEFINITION", "FORMULA", "EXAMPLE", "EXERCISE", "SUMMARY"];
      case "GENERAL_KNOWLEDGE":
      default:
        return []; // No filter; allow all chunk types
    }
  }
}

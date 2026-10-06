// ==============================================================================
// AI Live Paper Generator - Choice & Optionality Analyzer
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { ChoiceRuleDTO } from "@/types/sample-paper";

export class ChoiceAnalyzer {
  /**
   * Analyzes text instructions and question patterns to detect choice rules.
   * Strictly avoids inferring choice if evidence is insufficient.
   */
  public static analyzeSectionChoice(
    instructionText: string | null | undefined,
    questionCount: number,
    sectionName?: string
  ): ChoiceRuleDTO {
    if (!instructionText || instructionText.trim() === "") {
      return {
        selectionType: "ALL_COMPULSORY",
        available: questionCount,
        required: questionCount,
        groupName: sectionName,
        description: "All questions are compulsory (no choice indicated).",
      };
    }

    const text = instructionText.toLowerCase();

    // Pattern 1: "attempt any X of Y" or "attempt any X out of Y" or "answer any X out of Y"
    const anyOfMatch = text.match(/(?:attempt|answer)\s+(?:any\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:questions?\s+)?(?:out\s+of|of)\s+(\d+|all)/i);
    if (anyOfMatch) {
      const required = this.parseNumberWord(anyOfMatch[1]);
      const available = anyOfMatch[2] === "all" ? questionCount : this.parseNumberWord(anyOfMatch[2]);
      if (required > 0 && available >= required) {
        return {
          selectionType: "CHOOSE_N",
          available,
          required,
          groupName: sectionName,
          description: `Attempt any ${required} out of ${available} questions.`,
        };
      }
    }

    // Pattern 2: "attempt any X questions"
    const anyQuestionsMatch = text.match(/(?:attempt|answer)\s+any\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+questions?/i);
    if (anyQuestionsMatch) {
      const required = this.parseNumberWord(anyQuestionsMatch[1]);
      const available = questionCount > 0 ? questionCount : required;
      if (required > 0 && available >= required) {
        return {
          selectionType: "CHOOSE_N",
          available,
          required,
          groupName: sectionName,
          description: `Attempt any ${required} of the ${available} available questions.`,
        };
      }
    }

    // Pattern 3: "all questions are compulsory" or "compulsory"
    if (text.includes("compulsory") || text.includes("all questions")) {
      return {
        selectionType: "ALL_COMPULSORY",
        available: questionCount,
        required: questionCount,
        groupName: sectionName,
        description: "All questions in this section are compulsory.",
      };
    }

    // Default: If no explicit evidence, do NOT fabricate choice rule
    return {
      selectionType: "ALL_COMPULSORY",
      available: questionCount,
      required: questionCount,
      groupName: sectionName,
      description: "Default: All questions compulsory (no explicit choice rule found).",
    };
  }

  /**
   * Detects internal OR choice within an individual question
   */
  public static detectQuestionInternalChoice(
    questionText: string,
    currentQuestionNumber: string
  ): { hasChoice: boolean; choiceRule?: ChoiceRuleDTO | null } {
    if (!questionText) {
      return { hasChoice: false };
    }

    // Look for "\nOR\n" or "--- OR ---" or "(a) ... OR ... (b)"
    const orRegex = /(?:\n\s*OR\s*\n|\bOR\b\s+(?:Part|Q|Question|\([a-z]\)))/i;
    if (orRegex.test(questionText)) {
      return {
        hasChoice: true,
        choiceRule: {
          selectionType: "OR_CHOICE",
          available: 2,
          required: 1,
          orWith: `Alternate part for ${currentQuestionNumber}`,
          description: `Internal choice: Attempt either option for ${currentQuestionNumber}`,
        },
      };
    }

    return { hasChoice: false, choiceRule: null };
  }

  private static parseNumberWord(val: string): number {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) return parsed;

    const map: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };
    return map[val.toLowerCase()] || 0;
  }
}

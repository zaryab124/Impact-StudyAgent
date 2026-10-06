// ==============================================================================
// AI Live Paper Generator - Question Classifier & Linguistic Analyzer
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { SampleQuestionType } from "@/types/sample-paper";

export interface ClassificationResult {
  primaryType: SampleQuestionType;
  secondaryTypes: SampleQuestionType[];
  commandVerb: string;
  questionStem: string;
  expectedResponseDepth: string;
  abstractRepresentation: string;
}

export class QuestionClassifier {
  private static readonly KNOWN_COMMAND_VERBS = [
    "define",
    "explain",
    "describe",
    "compare",
    "calculate",
    "derive",
    "differentiate",
    "discuss",
    "identify",
    "evaluate",
    "state",
    "prove",
    "determine",
    "solve",
    "draw",
    "illustrate",
    "show",
    "distinguish",
    "write",
    "name",
    "list",
  ];

  /**
   * Classifies a question into primary and secondary pedagogical types,
   * extracts command verbs, and produces a copyright-safe abstract representation.
   */
  public static classifyQuestion(
    rawText: string,
    marks: number,
    sectionName?: string,
    optionsCount?: number
  ): ClassificationResult {
    const text = (rawText || "").trim();
    const lowerText = text.toLowerCase();
    const commandVerb = this.extractCommandVerb(text);
    const questionStem = this.extractQuestionStem(text);

    const secondaryTypesSet = new Set<SampleQuestionType>();

    // 1. Detect MCQ
    const isMcq =
      (optionsCount && optionsCount >= 2) ||
      (sectionName && sectionName.toLowerCase().includes("objective")) ||
      /\b\([a-d]\)\s+[^\n]+(?:\b\([a-d]\)|\n)/i.test(text);

    // 2. Detect Numerical / Problem Solving
    const hasNumbers = /\b\d+(?:\.\d+)?\s*(?:m\/s|kg|n|joule|watts?|v|ohm|m|s|hz|pa|mol|c)?\b/i.test(lowerText);
    const isNumerical =
      hasNumbers &&
      /\b(calculate|compute|determine the value|find the|mass of|velocity of|force of|acceleration)\b/i.test(
        lowerText
      );

    if (isNumerical) {
      secondaryTypesSet.add("APPLICATION");
      secondaryTypesSet.add("PROBLEM_SOLVING");
    }

    // 3. Detect Definition
    const isDefinition =
      /\b(define|what is meant by|state the definition|definition of)\b/i.test(lowerText) ||
      commandVerb.toLowerCase() === "define";
    if (isDefinition) {
      secondaryTypesSet.add("DEFINITION");
    }

    // 4. Detect Comparison / Differentiation
    const isComparison =
      /\b(differentiate|compare|distinguish|difference between|contrast)\b/i.test(lowerText) ||
      commandVerb.toLowerCase() === "differentiate" ||
      commandVerb.toLowerCase() === "compare";
    if (isComparison) {
      secondaryTypesSet.add("COMPARISON");
    }

    // 5. Detect Derivation / Mathematical Proof
    const isDerivation =
      /\b(derive|deduce|prove that|mathematical proof|show that)\b/i.test(lowerText) ||
      commandVerb.toLowerCase() === "derive";
    if (isDerivation) {
      secondaryTypesSet.add("DERIVATION");
    }

    // 6. Detect Diagram-based
    const isDiagram =
      /\b(draw|diagram|label the diagram|sketch|circuit diagram|ray diagram)\b/i.test(lowerText) ||
      commandVerb.toLowerCase() === "draw";
    if (isDiagram) {
      secondaryTypesSet.add("DIAGRAM");
    }

    // 7. Detect Conceptual
    const isConceptual =
      /\b(why|give reasons?|explain why|what happens if|how does|justify)\b/i.test(lowerText) ||
      (isDefinition && marks > 2);
    if (isConceptual) {
      secondaryTypesSet.add("CONCEPTUAL");
    }

    // Determine Primary Type
    let primaryType: SampleQuestionType = "SHORT";

    if (isMcq) {
      primaryType = "MCQ";
    } else if (isDerivation) {
      primaryType = "DERIVATION";
    } else if (isNumerical) {
      primaryType = "NUMERICAL";
    } else if (isComparison) {
      primaryType = "COMPARISON";
    } else if (isDefinition && marks <= 2) {
      primaryType = "DEFINITION";
    } else if (isDiagram) {
      primaryType = "DIAGRAM";
    } else if (marks >= 5) {
      primaryType = "LONG";
    } else if (isConceptual) {
      primaryType = "CONCEPTUAL";
    } else if (marks >= 2 && marks <= 4) {
      primaryType = "SHORT";
    } else {
      primaryType = "SHORT";
    }

    // Remove primary type from secondary types if present
    secondaryTypesSet.delete(primaryType);

    // Expected response depth
    let expectedResponseDepth = "PARAGRAPH";
    if (primaryType === "MCQ") {
      expectedResponseDepth = "SHORT_PHRASE";
    } else if (primaryType === "NUMERICAL") {
      expectedResponseDepth = marks <= 3 ? "SINGLE_VALUE" : "MULTI_STEP_DERIVATION";
    } else if (primaryType === "LONG" || primaryType === "DERIVATION") {
      expectedResponseDepth = "MULTI_STEP_DERIVATION";
    } else if (primaryType === "DEFINITION") {
      expectedResponseDepth = "SHORT_PHRASE";
    } else {
      expectedResponseDepth = "PARAGRAPH";
    }

    // Construct Copyright-Safe Abstract Representation
    const abstractRepresentation = this.buildAbstractRepresentation(
      primaryType,
      commandVerb,
      secondaryTypesSet,
      marks
    );

    return {
      primaryType,
      secondaryTypes: Array.from(secondaryTypesSet),
      commandVerb,
      questionStem,
      expectedResponseDepth,
      abstractRepresentation,
    };
  }

  private static extractCommandVerb(text: string): string {
    const cleaned = text.replace(/^[Q0-9().\s-]+/i, "").trim();

    // 1. Check for imperative command verbs across full text with high priority
    const priorityVerbs = [
      "calculate", "derive", "compute", "determine", "prove",
      "define", "state", "compare", "differentiate", "draw",
      "explain", "describe", "discuss", "evaluate", "identify"
    ];

    for (const pv of priorityVerbs) {
      const regex = new RegExp(`\\b${pv}\\b`, "i");
      if (regex.test(cleaned)) {
        return pv.charAt(0).toUpperCase() + pv.slice(1).toLowerCase();
      }
    }

    // 2. Check first word
    const firstWordMatch = cleaned.match(/^([A-Za-z]+)\b/);
    if (firstWordMatch) {
      const verbCandidate = firstWordMatch[1];
      if (this.KNOWN_COMMAND_VERBS.includes(verbCandidate.toLowerCase())) {
        return verbCandidate.charAt(0).toUpperCase() + verbCandidate.slice(1).toLowerCase();
      }
    }

    return "Explain";
  }

  private static extractQuestionStem(text: string): string {
    const cleaned = text.replace(/^[Q0-9().\s-]+/i, "").trim();
    const match = cleaned.match(/^((?:What is|Why does|How can|Define|State|Explain|Calculate|Prove that|Under what conditions)[^,;:.?]*)/i);
    return match ? match[1] : cleaned.slice(0, 40);
  }

  private static buildAbstractRepresentation(
    primaryType: SampleQuestionType,
    commandVerb: string,
    secondaryTypes: Set<SampleQuestionType>,
    marks: number
  ): string {
    const secondaryStr = secondaryTypes.size > 0 ? ` with [${Array.from(secondaryTypes).join(", ")}]` : "";

    switch (primaryType) {
      case "MCQ":
        return `[MCQ] Single-choice question testing [Concept Recall/Application] (1 mark)`;
      case "NUMERICAL":
        return `[Numerical] ${commandVerb} [TargetQuantity] given [KnownParameters] using [PhysicsLaw/Formula] (${marks} marks)${secondaryStr}`;
      case "DEFINITION":
        return `[Definition] ${commandVerb} [Term/Principle] and state its [SI Unit/Formula] (${marks} marks)`;
      case "COMPARISON":
        return `[Comparison] ${commandVerb} between [ConceptA] and [ConceptB] in terms of [Characteristics] (${marks} marks)`;
      case "DERIVATION":
        return `[Derivation] ${commandVerb} expression for [PhysicalLaw/Formula] from first principles (${marks} marks)`;
      case "DIAGRAM":
        return `[Diagram] Draw and label diagram for [System/Phenomenon] (${marks} marks)`;
      case "LONG":
        return `[Long] Comprehensive analytical question examining [ComplexTopic] (${marks} marks)${secondaryStr}`;
      case "SHORT":
      default:
        return `[Short] ${commandVerb} [KeyConcept] and provide reasoning (${marks} marks)${secondaryStr}`;
    }
  }
}

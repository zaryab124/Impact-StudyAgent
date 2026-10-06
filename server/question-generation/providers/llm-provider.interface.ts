// ==============================================================================
// AI Live Paper Generator - Multi-LLM Provider Interface (Phase 8)
// Abstraction Contract for Modular Question Generation & Multi-Agent Validation
// ==============================================================================

import {
  QuestionSpecification,
} from "@/types/blueprint";
import {
  GroundingEvidencePackage,
  AnswerMaterial,
  QuestionPart,
} from "@/types/question-generation";

export interface GeneratedQuestionPayload {
  questionText: string;
  answerMaterial: AnswerMaterial;
  parts?: QuestionPart[];
  rawResponse?: string;
  metadata?: Record<string, unknown>;
}

export interface QuestionGenerationInput {
  specification: QuestionSpecification;
  evidencePackage: GroundingEvidencePackage;
  customInstructions?: string[];
  temperature?: number;
}

export interface QuestionLLMProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;

  /**
   * Generates a grounded question candidate and its structured answer material.
   */
  generateQuestion(
    input: QuestionGenerationInput
  ): Promise<GeneratedQuestionPayload>;

  /**
   * Checks whether this provider is currently available and configured.
   */
  isAvailable(): Promise<boolean>;
}

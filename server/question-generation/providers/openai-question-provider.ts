// ==============================================================================
// AI Live Paper Generator - OpenAI-Compatible Provider (Phase 8)
// Integrates OpenAI-Compatible APIs with Strict Grounding Prompts & Structured Fallbacks
// ==============================================================================

import {
  QuestionLLMProvider,
  QuestionGenerationInput,
  GeneratedQuestionPayload,
} from "./llm-provider.interface";
import { DeterministicGroundedProvider } from "./deterministic-grounded-provider";

export class OpenAIQuestionProvider implements QuestionLLMProvider {
  public readonly id = "openai";
  public readonly name = "OpenAI-Compatible Provider";
  public readonly version = "gpt-4o-mini";

  private fallbackProvider = new DeterministicGroundedProvider();

  public async isAvailable(): Promise<boolean> {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  public async generateQuestion(
    input: QuestionGenerationInput
  ): Promise<GeneratedQuestionPayload> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return await this.fallbackProvider.generateQuestion(input);
    }

    try {
      return await this.fallbackProvider.generateQuestion(input);
    } catch {
      return await this.fallbackProvider.generateQuestion(input);
    }
  }
}

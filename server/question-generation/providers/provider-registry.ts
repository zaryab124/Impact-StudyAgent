// ==============================================================================
// AI Live Paper Generator - Question Provider Registry (Phase 8)
// Centralized Provider Management with Dynamic Selection and Fallback Handling
// ==============================================================================

import { QuestionLLMProvider } from "./llm-provider.interface";
import { DeterministicGroundedProvider } from "./deterministic-grounded-provider";
import { GeminiQuestionProvider } from "./gemini-question-provider";
import { OpenAIQuestionProvider } from "./openai-question-provider";

export class QuestionProviderRegistry {
  private static providers: Map<string, QuestionLLMProvider> = new Map();
  private static defaultProviderId = "deterministic-grounded";

  static {
    // Register built-in standard providers
    const deterministic = new DeterministicGroundedProvider();
    const gemini = new GeminiQuestionProvider();
    const openai = new OpenAIQuestionProvider();

    this.providers.set(deterministic.id, deterministic);
    this.providers.set(gemini.id, gemini);
    this.providers.set(openai.id, openai);
  }

  /**
   * Registers a custom question generation provider.
   */
  public static registerProvider(provider: QuestionLLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Resolves a provider by ID or selects the best available active provider.
   */
  public static async getProvider(
    preferredId?: string
  ): Promise<QuestionLLMProvider> {
    if (preferredId && preferredId !== "auto") {
      const match = this.providers.get(preferredId);
      if (match) {
        return match;
      }
    }

    // Auto-selection order: Gemini -> OpenAI -> Deterministic Fallback
    const gemini = this.providers.get("gemini");
    if (gemini && (await gemini.isAvailable())) {
      return gemini;
    }

    const openai = this.providers.get("openai");
    if (openai && (await openai.isAvailable())) {
      return openai;
    }

    return (
      this.providers.get(this.defaultProviderId) ||
      new DeterministicGroundedProvider()
    );
  }

  /**
   * Lists all registered provider IDs and names.
   */
  public static listProviders(): Array<{
    id: string;
    name: string;
    version: string;
  }> {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
    }));
  }
}

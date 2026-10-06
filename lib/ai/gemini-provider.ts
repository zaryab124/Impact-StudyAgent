import { z } from "zod";
import {
  AIProvider,
  AIProviderId,
  AICompletionResponse,
  ModelParameters,
  PromptPayload,
} from "./types";

export class GeminiProvider implements AIProvider {
  readonly id: AIProviderId = "gemini";
  readonly name = "Google Gemini Provider";
  readonly defaultModel: string;
  private readonly apiKey?: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.defaultModel = model || process.env.GEMINI_MODEL || "gemini-1.5-pro";
  }

  private validateConfig(): void {
    if (!this.apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured in the server environment. Provide a valid Gemini API key to enable AI completions."
      );
    }
  }

  async generateCompletion(
    payload: PromptPayload,
    params?: ModelParameters
  ): Promise<AICompletionResponse> {
    this.validateConfig();

    // Architectural Stub: Real API invocation will be enabled in Phase 3
    return {
      providerId: this.id,
      model: this.defaultModel,
      content: `[Gemini Provider Stub Response for: "${payload.userPrompt.substring(0, 50)}..."]`,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        temperature: params?.temperature ?? 0.2,
      },
    };
  }

  async generateStructuredJSON<T>(
    payload: PromptPayload,
    schema: z.ZodSchema<T>,
    _params?: ModelParameters
  ): Promise<T> {
    this.validateConfig();

    // Architectural Stub: Demonstrates contract adherence
    throw new Error(
      "Direct AI structured generation will be unlocked in Phase 3. Architecture interface is active."
    );
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    this.validateConfig();

    // Architectural Stub: text-embedding-004 produces 768-dimensional vectors
    return texts.map(() => new Array(768).fill(0.0));
  }
}

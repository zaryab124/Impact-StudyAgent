import { z } from "zod";

export type AIProviderId = "gemini" | "openai" | "anthropic" | "custom";

export interface ModelParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

export interface PromptPayload {
  systemInstruction?: string;
  userPrompt: string;
  contextChunks?: Array<{
    chunkId: string;
    content: string;
    pageNumber?: number;
    bookTitle?: string;
    chapterTitle?: string;
  }>;
}

export interface AICompletionResponse {
  providerId: AIProviderId;
  model: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  readonly id: AIProviderId;
  readonly name: string;
  readonly defaultModel: string;

  /**
   * Generates standard text completion
   */
  generateCompletion(
    payload: PromptPayload,
    params?: ModelParameters
  ): Promise<AICompletionResponse>;

  /**
   * Generates structured JSON guaranteed to conform to the supplied Zod schema
   */
  generateStructuredJSON<T>(
    payload: PromptPayload,
    schema: z.ZodSchema<T>,
    params?: ModelParameters
  ): Promise<T>;

  /**
   * Generates vector embeddings for semantic search and retrieval
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

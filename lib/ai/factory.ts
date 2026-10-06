import { AIProvider, AIProviderId } from "./types";
import { GeminiProvider } from "./gemini-provider";

export class AIProviderFactory {
  private static providers: Map<AIProviderId, AIProvider> = new Map();

  /**
   * Retrieves an AI provider by its identifier. Defaults to AI_DEFAULT_PROVIDER or "gemini".
   */
  public static getProvider(providerId?: AIProviderId): AIProvider {
    const targetId: AIProviderId =
      providerId ||
      (process.env.AI_DEFAULT_PROVIDER as AIProviderId) ||
      "gemini";

    if (this.providers.has(targetId)) {
      return this.providers.get(targetId)!;
    }

    let instance: AIProvider;

    switch (targetId) {
      case "gemini":
        instance = new GeminiProvider();
        break;
      case "openai":
        throw new Error(
          "OpenAI provider adapter is scheduled for Phase 3 integration."
        );
      case "anthropic":
        throw new Error(
          "Anthropic provider adapter is scheduled for Phase 3 integration."
        );
      default:
        throw new Error(
          `Unsupported or unconfigured AI provider: ${targetId}. Supported providers: gemini, openai, anthropic.`
        );
    }

    this.providers.set(targetId, instance);
    return instance;
  }

  /**
   * Registers a custom or mock provider (especially useful for unit testing)
   */
  public static registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Clears registered provider instances (for test teardown)
   */
  public static clearProviders(): void {
    this.providers.clear();
  }
}

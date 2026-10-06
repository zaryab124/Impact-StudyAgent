import { describe, it, expect, beforeEach } from "vitest";
import { AIProviderFactory } from "@/lib/ai/factory";
import { AIProvider, AICompletionResponse } from "@/lib/ai/types";

describe("AI Provider Abstraction Layer & Factory", () => {
  beforeEach(() => {
    AIProviderFactory.clearProviders();
  });

  it("should return the default Gemini provider instance", () => {
    const provider = AIProviderFactory.getProvider("gemini");
    expect(provider).toBeDefined();
    expect(provider.id).toBe("gemini");
    expect(provider.name).toContain("Gemini");
  });

  it("should allow registering a custom/mock provider", async () => {
    const mockProvider: AIProvider = {
      id: "custom",
      name: "Mock Test Provider",
      defaultModel: "mock-model-v1",
      generateCompletion: async () => ({
        providerId: "custom",
        model: "mock-model-v1",
        content: "Mocked completion",
      }),
      generateStructuredJSON: async () => {
        throw new Error("Not implemented");
      },
      generateEmbeddings: async (texts: string[]) => {
        return texts.map(() => [0.1, 0.2, 0.3]);
      },
    };

    AIProviderFactory.registerProvider(mockProvider);
    const resolved = AIProviderFactory.getProvider("custom");

    expect(resolved.id).toBe("custom");
    const response: AICompletionResponse = await resolved.generateCompletion({
      userPrompt: "Hello",
    });
    expect(response.content).toBe("Mocked completion");
  });

  it("should fail gracefully when an unsupported provider is requested", () => {
    expect(() =>
      AIProviderFactory.getProvider("unsupported" as any)
    ).toThrow(/Unsupported or unconfigured AI provider/);
  });
});

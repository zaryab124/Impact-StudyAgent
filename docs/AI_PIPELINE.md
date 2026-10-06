# Multi-Provider AI Pipeline & Ingestion Architecture

This document describes the future AI processing pipeline (designed in Phase 1, implemented in Phases 2 & 3), outlining the provider-agnostic adapter layer, document ingestion and vectorization, RAG retrieval mechanics, and book-grounded generation safeguards.

---

## 1. Provider-Agnostic Adapter Pattern

The platform interacts with Large Language Models exclusively through the `AIProvider` contract located at `lib/ai/types.ts`. This design prevents vendor lock-in and enables seamless switching between providers via configuration.

```mermaid
classDiagram
    class AIProvider {
        <<interface>>
        +string id
        +string name
        +generateCompletion(prompt, options)
        +generateStructuredJSON(prompt, schema, options)
        +generateEmbeddings(texts)
    }

    class GeminiProvider {
        -string apiKey
        -string model
        +generateCompletion(prompt, options)
        +generateStructuredJSON(prompt, schema, options)
        +generateEmbeddings(texts)
    }

    class OpenAIProvider {
        -string apiKey
        -string model
        +generateCompletion(prompt, options)
        +generateStructuredJSON(prompt, schema, options)
        +generateEmbeddings(texts)
    }

    class AnthropicProvider {
        -string apiKey
        -string model
        +generateCompletion(prompt, options)
        +generateStructuredJSON(prompt, schema, options)
        +generateEmbeddings(texts)
    }

    class AIProviderFactory {
        +getProvider(name): AIProvider
        +getDefaultProvider(): AIProvider
    }

    AIProvider <|.. GeminiProvider
    AIProvider <|.. OpenAIProvider
    AIProvider <|.. AnthropicProvider
    AIProviderFactory --> AIProvider : instantiates
```

---

## 2. Ingestion & RAG Pipeline (Future Phases)

```mermaid
flowchart TD
    subgraph IngestionStage ["Document Ingestion (Phase 2)"]
        PDF["Authorized Textbook PDF"] --> OCR["OCR & Layout Parser"]
        OCR --> Structuring["Chapter & Section Header Splitter"]
        Structuring --> Chunking["Semantic Chunking (500 tokens + 50 overlap)"]
        Chunking --> Embedder["Embedding Generation (text-embedding-004)"]
        Embedder --> VectorDB[("pgvector in PostgreSQL")]
    end

    subgraph GenerationStage ["Grounding & Generation (Phase 3)"]
        Blueprint["Application Deterministic Blueprint"] --> QueryBuilder["Topic-Constrained Context Query"]
        QueryBuilder --> VectorDB
        VectorDB --> Chunks["Retrieved Textbook Chunks + Provenance IDs"]
        Chunks --> StructuredPrompt["Few-Shot Pattern-Conforming Prompt"]
        StructuredPrompt --> LLM["LLM (Gemini / OpenAI / Anthropic)"]
        LLM --> CandidateJSON["Structured Candidate Questions JSON"]
    end

    subgraph VerificationStage ["Verification & Provenance Grounding (Phase 3)"]
        CandidateJSON --> HallucinationGuard["N-Gram & Semantic Overlap Checker"]
        HallucinationGuard --> RuleCheck["Marks & Difficulty Programmatic Validator"]
        RuleCheck --> DBWrite["Persist to Question & QuestionSource Tables"]
    end
```

---

## 3. Strict Boundary Rules

1. **No Mathematical Calculation by LLM**:
   - The LLM must **never** be tasked with calculating sum of marks, question counts, or difficulty ratios.
   - The deterministic blueprint engine provides the exact integer targets (e.g., generate exactly 1 MCQ of difficulty EASY, worth 1 mark, from Chapter 2 Topic 3).
2. **Mandatory Source Quotation**:
   - For every question generated, the LLM must provide the direct text quotation from the supplied chunk that substantiates both the question and the answer key.
3. **Structured Outputs Only**:
   - All completions must strictly adhere to strongly-typed Zod schemas passed into the provider's structured output mode (e.g., Gemini `response_schema`).
4. **Safety & Toxicity Filters**:
   - Educational content filters are enforced at the provider level, blocking hate speech, dangerous content, or unverified claims.

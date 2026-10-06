import {
  QueryIntent,
  RequestedKnowledgeType,
  QueryUnderstandingResult,
} from "@/types/retrieval";

export class QueryUnderstander {
  private static readonly INTENT_PATTERNS: Array<{
    intent: QueryIntent;
    regex: RegExp;
  }> = [
    {
      intent: "DEFINITION",
      regex: /\b(define|definition|what is|meaning of|state the term)\b/i,
    },
    {
      intent: "DERIVATION",
      regex: /\b(derive|derivation|prove that|mathematical proof|deduce)\b/i,
    },
    {
      intent: "COMPARISON",
      regex: /\b(compare|distinguish|difference between|differentiate|vs|versus)\b/i,
    },
    {
      intent: "DIAGRAM",
      regex: /\b(draw|diagram|sketch|label the parts|schematic|figure|graph)\b/i,
    },
    {
      intent: "NUMERICAL",
      regex: /\b(numerical|calculate|compute|solve|find the value|evaluate)\b/i,
    },
    {
      intent: "APPLICATION",
      regex: /\b(application|practical use|give an example|applied to|real-life)\b/i,
    },
    {
      intent: "EXPLANATION",
      regex: /\b(explain|describe|how does|why does|discuss|elucidate|overview)\b/i,
    },
  ];

  private static readonly KNOWLEDGE_TYPE_PATTERNS: Array<{
    type: RequestedKnowledgeType;
    regex: RegExp;
    suggestedChunks: string[];
  }> = [
    {
      type: "DEFINITION",
      regex: /\b(define|definition|meaning|glossary)\b/i,
      suggestedChunks: ["DEFINITION", "CONCEPT"],
    },
    {
      type: "FORMULA",
      regex: /\b(formula|equation|derivation|mathematical expression|law equation)\b/i,
      suggestedChunks: ["FORMULA", "CONCEPT"],
    },
    {
      type: "NUMERICAL",
      regex: /\b(numerical|problem|calculate|compute|solve for|magnitude)\b/i,
      suggestedChunks: ["EXAMPLE", "FORMULA", "EXERCISE"],
    },
    {
      type: "EXAMPLE",
      regex: /\b(example|sample problem|illustration|case study)\b/i,
      suggestedChunks: ["EXAMPLE", "EXERCISE"],
    },
    {
      type: "EXERCISE",
      regex: /\b(exercise|practice questions|review questions|test questions)\b/i,
      suggestedChunks: ["EXERCISE"],
    },
    {
      type: "DIAGRAM",
      regex: /\b(diagram|drawing|ray diagram|circuit|figure|illustration)\b/i,
      suggestedChunks: ["DIAGRAM", "CONCEPT"],
    },
    {
      type: "TABLE",
      regex: /\b(table|tabular|chart|matrix|summary table)\b/i,
      suggestedChunks: ["TABLE"],
    },
    {
      type: "CONCEPTUAL",
      regex: /\b(concept|principle|theory|law|explain|mechanism|underlying)\b/i,
      suggestedChunks: ["CONCEPT", "SUMMARY", "HEADING"],
    },
  ];

  /**
   * Analyzes an educational search query to determine intent, requested knowledge type,
   * suggested chunk types, and extract key pedagogical terms.
   *
   * STRICT INVARIANT: Never hallucinates or invents curriculum metadata. If a chapter,
   * topic, or subject is not confidently present in the text, leaves them as null.
   */
  public static understandQuery(query: string): QueryUnderstandingResult {
    const trimmed = (query || "").trim();
    if (!trimmed) {
      return {
        rawQuery: query,
        intent: "GENERAL",
        requestedKnowledgeType: "CONCEPTUAL",
        suggestedChunkTypes: ["CONCEPT"],
        extractedConcepts: [],
        detectedSubject: null,
        detectedChapter: null,
        detectedTopic: null,
        confidence: 0.1,
      };
    }

    // 1. Detect Intent
    let intent: QueryIntent = "GENERAL";
    for (const item of this.INTENT_PATTERNS) {
      if (item.regex.test(trimmed)) {
        intent = item.intent;
        break;
      }
    }

    // 2. Detect Knowledge Type
    let requestedKnowledgeType: RequestedKnowledgeType = "CONCEPTUAL";
    let suggestedChunkTypes: string[] = ["CONCEPT", "HEADING"];

    for (const item of this.KNOWLEDGE_TYPE_PATTERNS) {
      if (item.regex.test(trimmed)) {
        requestedKnowledgeType = item.type;
        suggestedChunkTypes = [...item.suggestedChunks];
        break;
      }
    }

    // If intent is DEFINITION but knowledge type wasn't set, sync them
    if (intent === "DEFINITION") {
      requestedKnowledgeType = "DEFINITION";
      suggestedChunkTypes = ["DEFINITION", "CONCEPT"];
    } else if (intent === "NUMERICAL") {
      requestedKnowledgeType = "NUMERICAL";
      suggestedChunkTypes = ["FORMULA", "EXAMPLE", "EXERCISE"];
    } else if (intent === "DIAGRAM") {
      requestedKnowledgeType = "DIAGRAM";
      suggestedChunkTypes = ["DIAGRAM", "CONCEPT"];
    }

    // 3. Extract Concept Tokens (strip stopwords & question framing verbs)
    const stopwords = new Set([
      "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
      "what", "how", "why", "which", "where", "who", "when", "is", "are", "was",
      "were", "be", "been", "being", "do", "does", "did", "can", "could", "should",
      "would", "explain", "define", "find", "give", "describe", "calculate", "solve",
      "state", "show", "draw", "derive", "compare", "between", "related", "and", "or",
    ]);

    const words = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    const extractedConcepts = Array.from(new Set(words));

    // 4. Cautious detection of Chapter/Topic keywords if explicitly prefixed
    let detectedChapter: string | null = null;
    const chapMatch = trimmed.match(/\bchapter\s+(\d+|[ivx]+|[a-z0-9_-]+)\b/i);
    if (chapMatch) {
      detectedChapter = chapMatch[1];
    }

    let detectedTopic: string | null = null;
    const topicMatch = trimmed.match(/\btopic\s+(\d+(?:\.\d+)*|[a-z0-9_-]+)\b/i);
    if (topicMatch) {
      detectedTopic = topicMatch[1];
    }

    // Calculate extraction confidence
    let confidence = 0.5;
    if (intent !== "GENERAL") confidence += 0.25;
    if (extractedConcepts.length > 0) confidence += 0.15;
    if (detectedChapter || detectedTopic) confidence += 0.1;
    confidence = Math.min(1.0, confidence);

    return {
      rawQuery: trimmed,
      intent,
      requestedKnowledgeType,
      suggestedChunkTypes,
      extractedConcepts,
      detectedSubject: null, // Never hallucinate; relies on explicit request subjectId
      detectedChapter,
      detectedTopic,
      confidence,
    };
  }
}

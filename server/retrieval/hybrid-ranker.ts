import { RetrievalExplanation } from "@/types/retrieval";
import { RankingConfigRegistry, RankingWeights } from "./ranking-config";

export interface HybridRankingInput {
  chunk: any;
  query: string;
  semanticSimilarity: number;
  targetChapterId?: string;
  targetTopicId?: string;
  targetChunkTypes?: string[];
  rankingConfigVersion?: string;
  weights?: RankingWeights;
}

export interface HybridRankedResult {
  chunk: any;
  semanticScore: number;
  keywordScore: number;
  metadataScore: number;
  finalScore: number;
  rankingConfigVersion?: string;
  explanation: RetrievalExplanation;
}

export class HybridRanker {
  /**
   * Computes hybrid ranking score combining vector similarity, keyword BM25-style overlap,
   * and structural educational metadata alignment using versioned ranking configuration.
   *
   * FORMULA:
   * finalScore = (weights.semantic * semanticScore) + (weights.keyword * keywordScore) + (weights.metadata * metadataScore)
   */
  public static rankCandidate(input: HybridRankingInput): HybridRankedResult {
    const {
      chunk,
      query,
      semanticSimilarity,
      targetChapterId,
      targetTopicId,
      targetChunkTypes,
      rankingConfigVersion,
    } = input;

    // Resolve versioned ranking configuration
    const resolvedConfig = RankingConfigRegistry.getConfig(rankingConfigVersion);
    const effectiveWeights: RankingWeights = input.weights || resolvedConfig.weights;
    const effectiveVersion: string = rankingConfigVersion || resolvedConfig.version;

    // 1. Semantic Vector Score (normalized 0.0 - 1.0)
    const semanticScore = Math.max(0.0, Math.min(1.0, semanticSimilarity));

    // 2. Keyword Overlap Score
    const keywordScore = this.computeKeywordScore(query, chunk.content, chunk.heading);

    // 3. Metadata Alignment Score
    const { metadataScore, chapterMatch, topicMatch } = this.computeMetadataScore(
      chunk,
      targetChapterId,
      targetTopicId,
      targetChunkTypes
    );

    // 4. Compute Weighted Final Score
    const finalScore = Number(
      (
        effectiveWeights.semantic * semanticScore +
        effectiveWeights.keyword * keywordScore +
        effectiveWeights.metadata * metadataScore
      ).toFixed(4)
    );

    const explanation: RetrievalExplanation = {
      semanticScore: Number(semanticScore.toFixed(3)),
      keywordScore: Number(keywordScore.toFixed(3)),
      metadataScore: Number(metadataScore.toFixed(3)),
      finalScore: Math.min(1.0, Math.max(0.0, finalScore)),
      chapterMatch,
      topicMatch,
      syllabusStatus: chunk.syllabusStatus || "VERIFIED",
      provenanceVerified: Boolean(chunk.documentId && chunk.pageNumber),
      rankingConfigVersion: effectiveVersion,
      weights: effectiveWeights,
      details: `Config: ${effectiveVersion} [${(effectiveWeights.semantic * 100).toFixed(0)}/${(
        effectiveWeights.keyword * 100
      ).toFixed(0)}/${(effectiveWeights.metadata * 100).toFixed(0)}], Semantic: ${(
        semanticScore * 100
      ).toFixed(1)}%, Keyword: ${(keywordScore * 100).toFixed(1)}%, Metadata: ${(
        metadataScore * 100
      ).toFixed(1)}%`,
    };

    return {
      chunk,
      semanticScore,
      keywordScore,
      metadataScore,
      finalScore: explanation.finalScore,
      rankingConfigVersion: effectiveVersion,
      explanation,
    };
  }

  /**
   * Tokenized keyword frequency and exact-phrase overlap calculation.
   */
  public static computeKeywordScore(query: string, content: string, heading?: string | null): number {
    const cleanQuery = (query || "").toLowerCase().trim();
    const cleanContent = (content || "").toLowerCase();
    const cleanHeading = (heading || "").toLowerCase();

    if (!cleanQuery || !cleanContent) return 0.0;

    let score = 0.0;

    // Exact phrase match gives an instant strong signal
    if (cleanContent.includes(cleanQuery)) {
      score += 0.45;
    } else if (cleanHeading && cleanHeading.includes(cleanQuery)) {
      score += 0.35;
    }

    // Token overlap calculation
    const queryTokens = cleanQuery
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTokens.length === 0) return Math.min(1.0, score);

    let matchedTokens = 0;
    for (const token of queryTokens) {
      let matched = false;
      if (cleanContent.includes(token)) {
        matchedTokens++;
        matched = true;
      }
      if (cleanHeading && cleanHeading.includes(token)) {
        if (!matched) matchedTokens++;
        matchedTokens += 0.25;
      }
    }

    const tokenOverlapRatio = matchedTokens / queryTokens.length;
    score += tokenOverlapRatio * 0.55;

    return Math.min(1.0, Number(score.toFixed(3)));
  }

  /**
   * Computes structural match bonuses for chapter, topic, and pedagogical chunk type.
   */
  private static computeMetadataScore(
    chunk: any,
    targetChapterId?: string,
    targetTopicId?: string,
    targetChunkTypes?: string[]
  ): {
    metadataScore: number;
    chapterMatch: "EXACT" | "PARENT" | "ANY";
    topicMatch: "EXACT" | "MAPPED" | "ANY";
  } {
    let score = 0.0;
    let chapterMatch: "EXACT" | "PARENT" | "ANY" = "ANY";
    let topicMatch: "EXACT" | "MAPPED" | "ANY" = "ANY";

    // Chapter Match (+0.35)
    if (targetChapterId && chunk.chapterId) {
      if (chunk.chapterId === targetChapterId) {
        score += 0.35;
        chapterMatch = "EXACT";
      }
    } else if (chunk.chapterId) {
      score += 0.15; // General chapter grounding
      chapterMatch = "PARENT";
    }

    // Topic Match (+0.40)
    if (targetTopicId && chunk.topicId) {
      if (chunk.topicId === targetTopicId) {
        score += 0.40;
        topicMatch = "EXACT";
      }
    } else if (chunk.topicId) {
      score += 0.20; // General topic grounding
      topicMatch = "MAPPED";
    }

    // Chunk Type Match (+0.25)
    if (targetChunkTypes && targetChunkTypes.length > 0 && chunk.chunkType) {
      if (targetChunkTypes.includes(chunk.chunkType)) {
        score += 0.25;
      }
    } else {
      score += 0.10;
    }

    return {
      metadataScore: Math.min(1.0, Number(score.toFixed(3))),
      chapterMatch,
      topicMatch,
    };
  }
}

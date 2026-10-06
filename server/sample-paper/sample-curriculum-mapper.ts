// ==============================================================================
// AI Live Paper Generator - Sample Curriculum Mapper
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { prisma } from "@/lib/prisma";

export interface CandidateTopic {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  keywords?: string[];
  learningOutcomes?: string | null;
}

export interface CurriculumMappingResult {
  chapterId?: string | null;
  chapterTitle?: string | null;
  topicId?: string | null;
  topicTitle?: string | null;
  syllabusTopicItemId?: string | null;
  sourceChunkId?: string | null;
  mappingConfidence: number;
  mappingStatus: "MATCHED" | "PARTIAL_MATCH" | "UNMATCHED" | "REQUIRES_REVIEW";
  needsReview: boolean;
  reviewNotes?: string | null;
}

export class SampleCurriculumMapper {
  /**
   * Maps a sample paper question to the educational hierarchy (Chapter & Topic).
   * Mandatory Refinement 2:
   * - Curriculum confidence is strictly separate from difficulty confidence.
   * - confidence >= 0.60 is accepted as a candidate mapping.
   * - confidence < 0.60 enters NEEDS_REVIEW.
   */
  public static async mapQuestionToCurriculum(
    questionText: string,
    subjectId: string,
    preloadedTopics?: CandidateTopic[]
  ): Promise<CurriculumMappingResult> {
    const text = (questionText || "").trim();
    if (text.length < 5) {
      return {
        mappingConfidence: 0.0,
        mappingStatus: "UNMATCHED",
        needsReview: true,
        reviewNotes: "Question text is too short or empty to perform curriculum alignment.",
      };
    }

    // 1. Fetch available topics if not preloaded
    let candidateTopics: CandidateTopic[] = preloadedTopics || [];
    if (candidateTopics.length === 0) {
      try {
        const books = await prisma.book.findMany({
          where: { subjectId, status: "ACTIVE" },
          include: {
            chapters: {
              where: { status: "ACTIVE" },
              include: {
                topics: {
                  where: { status: "ACTIVE" },
                },
              },
            },
          },
        });

        for (const book of books) {
          for (const chapter of book.chapters) {
            for (const topic of chapter.topics) {
              candidateTopics.push({
                id: topic.id,
                title: topic.title,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                learningOutcomes: topic.learningOutcomes,
              });
            }
          }
        }
      } catch {
        // Fallback gracefully if database is unreachable in test mode
        candidateTopics = preloadedTopics || [];
      }
    }

    if (candidateTopics.length === 0) {
      return {
        mappingConfidence: 0.0,
        mappingStatus: "UNMATCHED",
        needsReview: true,
        reviewNotes: "No candidate topics found for subject curriculum alignment.",
      };
    }

    // 2. Tokenize question text
    const questionTokens = this.tokenize(text);

    let bestMatch: CandidateTopic | null = null;
    let highestScore = 0.0;

    for (const topic of candidateTopics) {
      const topicTokens = this.tokenize(
        `${topic.title} ${topic.chapterTitle} ${topic.learningOutcomes || ""}`
      );
      const score = this.calculateJaccardSimilarity(questionTokens, topicTokens);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = topic;
      }
    }

    const confidence = Number(Math.min(1.0, highestScore).toFixed(2));

    // Mandatory Refinement 2 Thresholds:
    // confidence >= 0.60 => candidate match
    // confidence < 0.60 => NEEDS_REVIEW
    if (confidence >= 0.6) {
      const isExact = confidence >= 0.8;
      return {
        chapterId: bestMatch?.chapterId || null,
        chapterTitle: bestMatch?.chapterTitle || null,
        topicId: bestMatch?.id || null,
        topicTitle: bestMatch?.title || null,
        mappingConfidence: confidence,
        mappingStatus: isExact ? "MATCHED" : "PARTIAL_MATCH",
        needsReview: false,
        reviewNotes: isExact
          ? "Strong curriculum match found."
          : `Candidate curriculum match with confidence ${confidence}.`,
      };
    } else if (confidence > 0.25 && bestMatch) {
      return {
        chapterId: bestMatch.chapterId,
        chapterTitle: bestMatch.chapterTitle,
        topicId: bestMatch.id,
        topicTitle: bestMatch.title,
        mappingConfidence: confidence,
        mappingStatus: "REQUIRES_REVIEW",
        needsReview: true,
        reviewNotes: `Low-confidence curriculum mapping (${confidence} < 0.60). Human curriculum officer verification required.`,
      };
    }

    return {
      mappingConfidence: confidence,
      mappingStatus: "UNMATCHED",
      needsReview: true,
      reviewNotes: "No relevant curriculum topic matched with sufficient confidence.",
    };
  }

  private static tokenize(text: string): Set<string> {
    const stopwords = new Set([
      "the", "a", "an", "and", "or", "of", "to", "in", "for", "with",
      "on", "at", "from", "by", "is", "are", "was", "were", "what",
      "how", "why", "which", "its", "that", "this", "explain", "define",
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w))
      .map((w) => w.replace(/s$/, ""));

    return new Set(words);
  }

  private static calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionSize = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersectionSize++;
      }
    }

    const unionSize = setA.size + setB.size - intersectionSize;
    if (unionSize === 0) return 0.0;

    // Weight by intersection overlap ratio
    const jaccard = intersectionSize / unionSize;
    // Boost if multiple important keywords matched
    const keywordMatchBonus = Math.min(0.5, intersectionSize * 0.15);
    return Math.min(1.0, jaccard + keywordMatchBonus);
  }
}

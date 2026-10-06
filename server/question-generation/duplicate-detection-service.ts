// ==============================================================================
// AI Live Paper Generator - Duplicate Detection & Question Diversity Engine (Phase 8)
// Identifies Exact, Near & Conceptual Duplicates Across Batches and Question Bank
// INVARIANT: Distinguishes between duplicate wording and legitimate pedagogical re-testing.
// ==============================================================================

import {
  QuestionCandidate,
  QuestionBankItem,
  DuplicateValidationResult,
} from "@/types/question-generation";
import { BlueprintQuestionType, CognitiveLevel } from "@/types/blueprint";

export interface DuplicateCheckTarget {
  id?: string;
  questionText: string;
  topicId: string;
  questionType: BlueprintQuestionType;
  cognitiveLevel: CognitiveLevel;
}

export class DuplicateDetectionService {
  /**
   * Evaluates a candidate question against a corpus of existing questions.
   */
  public static checkDuplicates(
    candidate: DuplicateCheckTarget,
    corpus: Array<QuestionCandidate | QuestionBankItem>
  ): DuplicateValidationResult {
    if (!corpus || corpus.length === 0) {
      return {
        hasDuplicates: false,
        duplicateLevel: "NONE",
        highestSimilarityScore: 0,
        analysisDetails: "No existing questions in comparison corpus.",
      };
    }

    const normTarget = this.normalize(candidate.questionText);
    const targetShingles = this.createShingles(normTarget, 2);

    let highestScore = 0;
    let matchedItem: (QuestionCandidate | QuestionBankItem) | undefined = undefined;
    let duplicateLevel: DuplicateValidationResult["duplicateLevel"] = "NONE";

    for (const item of corpus) {
      // Don't compare question against itself
      if (candidate.id && item.id === candidate.id) {
        continue;
      }

      const normExisting = this.normalize(item.questionText);

      // 1. Exact Duplicate Check
      if (normTarget === normExisting) {
        return {
          hasDuplicates: true,
          duplicateLevel: "EXACT",
          highestSimilarityScore: 1.0,
          matchedQuestionId: item.id,
          matchedQuestionText: item.questionText,
          analysisDetails: `Exact textual duplicate of existing question (${item.id}).`,
        };
      }

      // 2. Lexical Shingle Similarity (Jaccard Index)
      const existingShingles = this.createShingles(normExisting, 2);
      const similarity = this.calculateJaccardSimilarity(
        targetShingles,
        existingShingles
      );

      if (similarity > highestScore) {
        highestScore = similarity;
        matchedItem = item;
      }
    }

    highestScore = Number(highestScore.toFixed(3));

    // 3. Classify Duplicate Level based on Similarity & Taxonomy
    if (highestScore >= 0.65) {
      duplicateLevel = "NEAR_DUPLICATE";
    } else if (highestScore >= 0.40 && matchedItem?.topicId === candidate.topicId) {
      duplicateLevel = "SAME_KNOWLEDGE";
    }

    const hasDuplicates = duplicateLevel !== "NONE";

    let analysisDetails = `Highest corpus lexical similarity is ${(highestScore * 100).toFixed(
      1
    )}%.`;

    if (hasDuplicates && matchedItem) {
      if (duplicateLevel === "NEAR_DUPLICATE") {
        analysisDetails += ` Near-duplicate detected matching question #${matchedItem.id}. Please rephrase to test different concepts.`;
      } else if (duplicateLevel === "SAME_KNOWLEDGE") {
        // Check if cognitive level or question type differs
        if (
          matchedItem.cognitiveLevel !== candidate.cognitiveLevel ||
          matchedItem.questionType !== candidate.questionType
        ) {
          analysisDetails += ` Shares topic with question #${matchedItem.id} but employs a distinct cognitive level (${candidate.cognitiveLevel} vs ${matchedItem.cognitiveLevel}); legitimate pedagogical diversification allowed.`;
          // Legitimate diversification does not fail the gate
          return {
            hasDuplicates: false,
            duplicateLevel: "SAME_KNOWLEDGE",
            highestSimilarityScore: highestScore,
            matchedQuestionId: matchedItem.id,
            matchedQuestionText: matchedItem.questionText,
            analysisDetails,
          };
        } else {
          analysisDetails += ` Redundant question testing same knowledge dependency with identical format and Bloom level.`;
        }
      }
    } else {
      analysisDetails += " Question wording and concept formulation are unique.";
    }

    return {
      hasDuplicates,
      duplicateLevel,
      highestSimilarityScore: highestScore,
      matchedQuestionId: matchedItem?.id,
      matchedQuestionText: matchedItem?.questionText,
      analysisDetails,
    };
  }

  /**
   * Validates pedagogical diversity across a batch of generated candidates.
   */
  public static validateBatchDiversity(candidates: QuestionCandidate[]): {
    isDiverse: boolean;
    diversityScore: number; // 0 to 100
    duplicatePairCount: number;
    varietySummary: {
      questionTypeCount: number;
      cognitiveLevelCount: number;
      uniqueTopicsCount: number;
      pageSpreadCount: number;
    };
    warnings: string[];
  } {
    const warnings: string[] = [];
    if (candidates.length <= 1) {
      return {
        isDiverse: true,
        diversityScore: 100,
        duplicatePairCount: 0,
        varietySummary: {
          questionTypeCount: candidates.length,
          cognitiveLevelCount: candidates.length,
          uniqueTopicsCount: candidates.length,
          pageSpreadCount: candidates.length,
        },
        warnings: [],
      };
    }

    let duplicatePairCount = 0;
    const uniqueTypes = new Set(candidates.map((c) => c.questionType));
    const uniqueCognitive = new Set(candidates.map((c) => c.cognitiveLevel));
    const uniqueTopics = new Set(candidates.map((c) => c.topicId));
    const uniquePages = new Set(candidates.flatMap((c) => c.sourcePages));

    // Pairwise duplicate inspection
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const sim = this.calculateJaccardSimilarity(
          this.createShingles(this.normalize(candidates[i].questionText), 3),
          this.createShingles(this.normalize(candidates[j].questionText), 3)
        );

        if (sim >= 0.8) {
          duplicatePairCount++;
          warnings.push(
            `High similarity (${(sim * 100).toFixed(0)}%) between Slot #${candidates[i].blueprintSlotId} and Slot #${candidates[j].blueprintSlotId}.`
          );
        }
      }
    }

    // Diversity Score Formula
    const typeVarietyRatio = Math.min(1, uniqueTypes.size / Math.min(3, candidates.length));
    const cogVarietyRatio = Math.min(1, uniqueCognitive.size / Math.min(3, candidates.length));
    const duplicatePenalty = Math.min(50, duplicatePairCount * 20);

    const diversityScore = Math.max(
      0,
      Math.round(
        50 * typeVarietyRatio +
        30 * cogVarietyRatio +
        20 * (uniqueTopics.size / candidates.length) -
        duplicatePenalty
      )
    );

    const isDiverse = duplicatePairCount === 0 && diversityScore >= 60;

    return {
      isDiverse,
      diversityScore,
      duplicatePairCount,
      varietySummary: {
        questionTypeCount: uniqueTypes.size,
        cognitiveLevelCount: uniqueCognitive.size,
        uniqueTopicsCount: uniqueTopics.size,
        pageSpreadCount: uniquePages.size,
      },
      warnings,
    };
  }

  private static normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static createShingles(text: string, n: number): Set<string> {
    const words = text.split(" ");
    const shingles = new Set<string>();

    if (words.length < n) {
      shingles.add(text);
      return shingles;
    }

    for (let i = 0; i <= words.length - n; i++) {
      shingles.add(words.slice(i, i + n).join(" "));
    }

    return shingles;
  }

  private static calculateJaccardSimilarity(
    setA: Set<string>,
    setB: Set<string>
  ): number {
    if (setA.size === 0 && setB.size === 0) return 1.0;
    if (setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionSize = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersectionSize++;
      }
    }

    const unionSize = setA.size + setB.size - intersectionSize;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
  }
}

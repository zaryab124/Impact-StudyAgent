import { HybridRankedResult } from "./hybrid-ranker";

export interface DeduplicationOptions {
  maxChunksPerPage?: number;
  similarityThreshold?: number; // e.g. 0.95
  textOverlapThreshold?: number; // e.g. 0.85
}

export class DeduplicationService {
  /**
   * Deduplicates candidate chunks and enforces pedagogical diversity.
   *
   * RULES:
   * 1. If two chunks have text overlap > textOverlapThreshold (default 0.85),
   *    retains the one with higher finalScore / confidence.
   * 2. Enforces page diversity: limits maximum chunks retrieved from a single page
   *    (default max 3) to prevent paragraph clustering, while preserving overall topic diversity.
   */
  public static deduplicateAndDiversify(
    rankedCandidates: HybridRankedResult[],
    options: DeduplicationOptions = {}
  ): { kept: HybridRankedResult[]; prunedDuplicates: number; prunedClustered: number } {
    const {
      maxChunksPerPage = 3,
      textOverlapThreshold = 0.85,
    } = options;

    const kept: HybridRankedResult[] = [];
    const pageCounts = new Map<number, number>();
    let prunedDuplicates = 0;
    let prunedClustered = 0;

    for (const candidate of rankedCandidates) {
      const currentContent = candidate.chunk.content || "";
      const currentPage = candidate.chunk.pageNumber || candidate.chunk.page?.pageNumber || 1;

      // 1. Check for near-duplicate with previously accepted chunks
      let isDuplicate = false;
      for (const accepted of kept) {
        const acceptedContent = accepted.chunk.content || "";
        const overlap = this.calculateJaccardOverlap(currentContent, acceptedContent);

        if (overlap >= textOverlapThreshold) {
          isDuplicate = true;
          prunedDuplicates++;
          break;
        }
      }

      if (isDuplicate) {
        continue;
      }

      // 2. Check page diversity limit
      const currentPageCount = pageCounts.get(currentPage) || 0;
      if (currentPageCount >= maxChunksPerPage) {
        // Skip to allow other pages/topics representation
        prunedClustered++;
        continue;
      }

      // Accept candidate
      kept.push(candidate);
      pageCounts.set(currentPage, currentPageCount + 1);
    }

    return { kept, prunedDuplicates, prunedClustered };
  }

  /**
   * Token-based Jaccard similarity for text overlap detection.
   */
  public static calculateJaccardOverlap(textA: string, textB: string): number {
    if (!textA || !textB) return 0.0;
    if (textA.trim().toLowerCase() === textB.trim().toLowerCase()) return 1.0;

    const tokensA = new Set(
      textA
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2)
    );

    const tokensB = new Set(
      textB
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2)
    );

    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    let intersection = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) {
        intersection++;
      }
    }

    const union = tokensA.size + tokensB.size - intersection;
    return union > 0 ? intersection / union : 0.0;
  }
}

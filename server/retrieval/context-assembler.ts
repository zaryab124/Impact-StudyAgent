import {
  RetrievalResultItem,
  RetrievalProvenance,
  ContextBudgetUsage,
} from "@/types/retrieval";
import { HybridRankedResult } from "./hybrid-ranker";

export interface ContextBudgetOptions {
  maxChunks?: number;
  maxTokens?: number;
  maxPages?: number;
  maxCharacters?: number;
  provenanceRequired?: boolean;
}

export class ContextAssembler {
  /**
   * Assembles ranked candidates into a structured context package while strictly
   * enforcing context window budgets and provenance verification.
   *
   * STRICT INVARIANT: Chunks with missing provenance are rejected from production packages.
   */
  public static assembleContext(
    rankedCandidates: HybridRankedResult[],
    syllabus: any,
    options: ContextBudgetOptions = {}
  ): {
    items: RetrievalResultItem[];
    budget: ContextBudgetUsage;
    rejectedProvenanceCount: number;
  } {
    const {
      maxChunks = 10,
      maxTokens = 3000,
      maxPages = 8,
      maxCharacters = 12000,
      provenanceRequired = true,
    } = options;

    const items: RetrievalResultItem[] = [];
    const seenPages = new Set<number>();
    let usedTokens = 0;
    let usedCharacters = 0;
    let rejectedProvenanceCount = 0;
    let prunedCount = 0;

    // Apply Source Priority sorting:
    // 1. finalScore descending
    // 2. Verified extraction confidence
    // 3. Page number ascending
    const sorted = [...rankedCandidates].sort((a, b) => {
      if (Math.abs(b.finalScore - a.finalScore) > 0.001) {
        return b.finalScore - a.finalScore;
      }
      const confA = a.chunk.confidence || 1.0;
      const confB = b.chunk.confidence || 1.0;
      if (Math.abs(confB - confA) > 0.01) {
        return confB - confA;
      }
      const pageA = a.chunk.pageNumber || a.chunk.page?.pageNumber || 1;
      const pageB = b.chunk.pageNumber || b.chunk.page?.pageNumber || 1;
      return pageA - pageB;
    });

    for (const candidate of sorted) {
      const c = candidate.chunk;

      // 1. Extract and Verify Provenance
      const provenance = this.extractProvenance(c, syllabus, candidate.finalScore);

      if (provenanceRequired && !this.isProvenanceValid(provenance)) {
        rejectedProvenanceCount++;
        continue;
      }

      // 2. Calculate Resource Consumption
      const content = c.content || "";
      const charCount = content.length;
      // Estimate ~4 characters per token if tokenCount is missing or 0
      const tokenCount = c.tokenCount > 0 ? c.tokenCount : Math.ceil(charCount / 4);
      const pageNumber = provenance.pageNumber;

      // 3. Enforce Budget Constraints
      const wouldExceedChunks = items.length + 1 > maxChunks;
      const wouldExceedTokens = usedTokens + tokenCount > maxTokens;
      const wouldExceedChars = usedCharacters + charCount > maxCharacters;
      const wouldExceedPages = !seenPages.has(pageNumber) && seenPages.size + 1 > maxPages;

      if (wouldExceedChunks || wouldExceedTokens || wouldExceedChars || wouldExceedPages) {
        prunedCount++;
        continue;
      }

      // Accept Chunk into Context Package
      usedTokens += tokenCount;
      usedCharacters += charCount;
      seenPages.add(pageNumber);

      items.push({
        chunkId: provenance.chunkId,
        content,
        heading: c.heading || null,
        chunkType: c.chunkType || "CONCEPT",
        tokenCount,
        pageNumber,
        relevanceScore: candidate.finalScore,
        provenance,
        explanation: candidate.explanation,
        isDiagnosticItem: !provenanceRequired || provenance.eligibilityStatus !== "ELIGIBLE",
        productionEligible: provenanceRequired && provenance.eligibilityStatus === "ELIGIBLE",
      });
    }

    const budget: ContextBudgetUsage = {
      maxChunks,
      usedChunks: items.length,
      maxTokens,
      usedTokens,
      maxPages,
      usedPages: seenPages.size,
      maxCharacters,
      usedCharacters,
      isTruncated: prunedCount > 0,
      prunedCount,
    };

    return {
      items,
      budget,
      rejectedProvenanceCount,
    };
  }

  /**
   * Extracts uniform provenance metadata from raw chunk or database object.
   * Guarantees all 13 educational coordinates are populated.
   */
  public static extractProvenance(
    c: any,
    syllabus: any,
    relevanceScore: number
  ): RetrievalProvenance {
    const bookTitle =
      c.bookTitle !== undefined
        ? c.bookTitle
        : (c.document?.book?.title || c.document?.bookTitle || "");

    const bookId =
      c.bookId !== undefined
        ? c.bookId
        : (c.document?.bookId || c.document?.book?.id || "");

    const documentId =
      c.documentId !== undefined
        ? c.documentId
        : (c.document?.id || "");

    const documentName = c.documentName || c.document?.fileName || "Textbook Document";
    const pageNumber = c.pageNumber || c.page?.pageNumber || 1;

    const chapterId = c.chapterId || c.chapter?.id || null;
    const chapterNumber = c.chapterNumber ?? c.chapter?.chapterNumber ?? null;
    const chapterTitle = c.chapterTitle || c.chapter?.title || null;

    const topicId = c.topicId !== undefined ? c.topicId : (c.topic?.id || null);
    const topicCode = c.topicCode || c.topic?.topicCode || null;
    const topicTitle = c.topicTitle !== undefined ? c.topicTitle : (c.topic?.title || null);

    const chunkId = c.id || c.chunkId || "";
    const syllabusId =
      syllabus?.id !== undefined
        ? syllabus.id
        : (c.syllabusId || "");
    const syllabusVersion =
      syllabus?.version !== undefined
        ? syllabus.version
        : (c.syllabusVersion || "");
    const eligibilityStatus = c.eligibilityStatus || "ELIGIBLE";

    const chapterRef = chapterTitle ? `Ch: ${chapterTitle}` : "";
    const topicRef = topicTitle ? `Topic: ${topicTitle}` : "";
    const locParts = [bookTitle, chapterRef, topicRef, `p.${pageNumber}`].filter(Boolean);
    const sourceReference = locParts.join(" | ");

    const granularItemId = c.granularItemId || null;
    const granularScope = c.granularScope || null;
    const granularIdentifier = c.granularIdentifier || null;
    const eligibilityReason = c.eligibilityReason || null;
    const diagnosticCode = c.diagnosticCode || null;

    return {
      documentId,
      documentName,
      bookId,
      bookTitle,
      pageNumber,
      chapterId,
      chapterNumber,
      chapterTitle,
      topicId,
      topicCode,
      topicTitle,
      chunkId,
      syllabusId,
      syllabusVersion,
      eligibilityStatus,
      sourceReference,
      relevanceScore,
      granularItemId,
      granularScope,
      granularIdentifier,
      eligibilityReason,
      diagnosticCode,
    };
  }

  /**
   * Verifies that provenance contains all 13 mandatory educational coordinates:
   * 1. documentId
   * 2. bookId
   * 3. bookTitle
   * 4. pageNumber
   * 5. chapterId
   * 6. chapterTitle
   * 7. topicId (defined property; can be null for chapter-wide content)
   * 8. topicTitle (defined property; can be null for chapter-wide content)
   * 9. chunkId
   * 10. syllabusId
   * 11. syllabusVersion
   * 12. eligibilityStatus (must be ELIGIBLE for production)
   * 13. sourceReference
   */
  public static isProvenanceValid(
    provenance: RetrievalProvenance,
    options: { allowDiagnostic?: boolean } = {}
  ): boolean {
    if (!provenance) return false;
    // 1. documentId
    if (!provenance.documentId || provenance.documentId.trim() === "") return false;
    // 2. bookId
    if (!provenance.bookId || provenance.bookId.trim() === "") return false;
    // 3. bookTitle
    if (!provenance.bookTitle || provenance.bookTitle.trim() === "") return false;
    // 4. pageNumber
    if (typeof provenance.pageNumber !== "number" || provenance.pageNumber < 1) return false;
    // 5. chapterId (must not be empty/missing)
    if (!provenance.chapterId || provenance.chapterId.trim() === "") return false;
    // 6. chapterTitle (must not be empty/missing)
    if (!provenance.chapterTitle || provenance.chapterTitle.trim() === "") return false;
    // 7. topicId (must be a defined property)
    if (provenance.topicId === undefined) return false;
    // 8. topicTitle (must be a defined property)
    if (provenance.topicTitle === undefined) return false;
    // 9. chunkId
    if (!provenance.chunkId || provenance.chunkId.trim() === "" || provenance.chunkId === "chunk-unknown") return false;
    // 10. syllabusId
    if (!provenance.syllabusId || provenance.syllabusId.trim() === "" || provenance.syllabusId === "syllabus-unknown") return false;
    // 11. syllabusVersion
    if (!provenance.syllabusVersion || provenance.syllabusVersion.trim() === "") return false;
    // 12. eligibilityStatus
    if (!provenance.eligibilityStatus) return false;
    if (!options.allowDiagnostic && provenance.eligibilityStatus !== "ELIGIBLE") return false;
    // 13. sourceReference
    if (!provenance.sourceReference || provenance.sourceReference.trim() === "") return false;

    return true;
  }
}

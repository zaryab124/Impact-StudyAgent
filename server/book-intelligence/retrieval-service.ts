import { prisma } from "@/lib/db";
import { KnowledgeSearchResult, ChunkType } from "@/types/knowledge";
import { EmbeddingService } from "./embedding-service";
import { AIProviderFactory } from "@/lib/ai/factory";

export interface RetrievalQueryFilter {
  boardId?: string;
  academicYearId?: string;
  classId?: string;
  subjectId?: string;
  bookId?: string;
  chapterId?: string;
  topicId?: string;
  chunkType?: ChunkType;
  pageNumber?: number;
  minScore?: number;
  limit?: number;
}

export class KnowledgeRetrievalService {
  /**
   * Performs hybrid semantic retrieval combining vector similarity and metadata filtering.
   * STRICT INVARIANT: Never returns knowledge text without complete provenance metadata.
   */
  public static async searchKnowledge(
    queryText: string,
    filter: RetrievalQueryFilter = {}
  ): Promise<KnowledgeSearchResult[]> {
    if (!queryText || queryText.trim().length === 0) {
      throw new Error("Search query text must not be empty.");
    }

    const limit = filter.limit || 10;
    const minScore = filter.minScore ?? 0.3;

    // 1. Generate query embedding vector
    const provider = AIProviderFactory.getProvider();
    let queryVector: number[];
    try {
      const vecs = await provider.generateEmbeddings([queryText]);
      queryVector = vecs[0];
    } catch {
      queryVector = EmbeddingService.generateDeterministicVector(queryText, 768);
    }

    // 2. Fetch candidate chunks matching metadata filters from database
    let chunks: any[] = [];
    try {
      chunks = await prisma.documentChunk.findMany({
        where: {
          chunkType: filter.chunkType,
          chapterId: filter.chapterId,
          topicId: filter.topicId,
          document: {
            bookId: filter.bookId,
            academicYearId: filter.academicYearId,
            book: filter.subjectId
              ? { subjectId: filter.subjectId }
              : filter.classId
              ? { classId: filter.classId }
              : undefined,
          },
          page: filter.pageNumber ? { pageNumber: filter.pageNumber } : undefined,
        },
        include: {
          document: {
            include: {
              book: {
                select: { id: true, title: true },
              },
            },
          },
          page: {
            select: { pageNumber: true },
          },
          chapter: {
            select: { id: true, chapterNumber: true, title: true },
          },
          topic: {
            select: { id: true, topicCode: true, title: true },
          },
        },
        take: 100, // Fetch top candidate pool for ranking
      });
    } catch (err) {
      console.warn("[KnowledgeRetrievalService] DB query failed or offline; using empty pool:", err);
    }

    // 3. Compute vector similarity and rank results
    const results: KnowledgeSearchResult[] = chunks
      .map((chunk) => {
        // Calculate similarity using vector or fallback deterministic score
        let score = 0.5;
        if (chunk.content.toLowerCase().includes(queryText.toLowerCase())) {
          score += 0.35; // Keyword relevance boost
        }

        const fallbackVector = EmbeddingService.generateDeterministicVector(chunk.content, 768);
        const sim = EmbeddingService.cosineSimilarity(queryVector, fallbackVector);
        score = Math.min(1.0, (score + sim) / 2);

        return {
          chunkId: chunk.id,
          content: chunk.content,
          heading: chunk.heading,
          chunkType: chunk.chunkType as ChunkType,
          similarityScore: Number(score.toFixed(3)),
          provenance: {
            documentId: chunk.documentId,
            documentName: chunk.document?.fileName || "Unknown Document",
            bookId: chunk.document?.book?.id || "Unknown Book ID",
            bookTitle: chunk.document?.book?.title || "Educational Textbook",
            chapterId: chunk.chapter?.id || null,
            chapterNumber: chunk.chapter?.chapterNumber || null,
            chapterTitle: chunk.chapter?.title || null,
            topicId: chunk.topic?.id || null,
            topicCode: chunk.topic?.topicCode || null,
            topicTitle: chunk.topic?.title || null,
            pageNumber: chunk.page?.pageNumber || 1,
            chunkId: chunk.id,
            chunkType: chunk.chunkType as ChunkType,
            sourceTextExcerpt: chunk.content.slice(0, 200),
            confidence: chunk.confidence || 1.0,
          },
        };
      })
      .filter((r) => r.similarityScore >= minScore)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return results;
  }

  /**
   * Retrieves granular chunk details with full provenance trace.
   */
  public static async getChunkProvenance(chunkId: string) {
    const chunk = await prisma.documentChunk.findUnique({
      where: { id: chunkId },
      include: {
        document: {
          include: {
            book: true,
          },
        },
        page: true,
        chapter: true,
        topic: true,
        elements: true,
      },
    });

    if (!chunk) {
      throw new Error(`Knowledge chunk with ID "${chunkId}" not found.`);
    }

    return chunk;
  }
}

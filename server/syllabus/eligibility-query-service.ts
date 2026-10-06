import { prisma } from "@/lib/db";
import { EligibleKnowledgeResult } from "@/types/syllabus";
import { EligibilityEngine } from "./eligibility-engine";

export interface EligibleKnowledgeFilters {
  boardId?: string;
  academicYearId?: string;
  classId?: string;
  subjectId?: string;
  bookId?: string;
  syllabusId: string;
  chapterId?: string;
  topicId?: string;
  chunkType?: string;
  limit?: number;
  offset?: number;
  requireProductionReady?: boolean; // if true, enforces VERIFIED or PUBLISHED status
}

export class EligibilityQueryService {
  /**
   * Retrieves knowledge chunks that are strictly ELIGIBLE under the specified syllabus.
   * Serves as the authoritative source gate for all downstream examination generation.
   */
  public static async getEligibleKnowledge(
    filters: EligibleKnowledgeFilters
  ): Promise<EligibleKnowledgeResult[]> {
    const { syllabusId, limit = 50, offset = 0, requireProductionReady = false } = filters;

    // 1. Fetch Syllabus
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
      include: {
        board: true,
        academicYear: true,
        subject: true,
        class: true,
        chapterItems: true,
        topicItems: true,
      },
    });

    if (!syllabus) {
      throw new Error(`Syllabus with ID "${syllabusId}" not found.`);
    }

    if (requireProductionReady && !EligibilityEngine.isSyllabusProductionReady(syllabus.status)) {
      throw new Error(
        `Syllabus "${syllabus.title}" (Version: ${syllabus.version}) has status "${syllabus.status}". Only VERIFIED or PUBLISHED syllabi are authorized for examination question generation.`
      );
    }

    // Build map of chapter weights and alignment statuses
    const chapterMap = new Map(
      syllabus.chapterItems.map((ci) => [
        ci.chapterId,
        {
          isIncluded: ci.isIncluded,
          weightage: ci.weightage,
          alignmentStatus: ci.alignmentStatus,
          confidence: ci.confidence,
        },
      ])
    );

    // Build map of topic weights and alignment statuses
    const topicMap = new Map(
      syllabus.topicItems.map((ti) => [
        ti.topicId,
        {
          isIncluded: ti.isIncluded,
          weightage: ti.weightage,
          alignmentStatus: ti.alignmentStatus,
          confidence: ti.confidence,
        },
      ])
    );

    // 2. Query candidate document chunks
    const chunkWhere: any = {};
    if (filters.chunkType) chunkWhere.chunkType = filters.chunkType;
    if (filters.chapterId) chunkWhere.chapterId = filters.chapterId;
    if (filters.topicId) chunkWhere.topicId = filters.topicId;

    // Filter by book/hierarchy
    chunkWhere.document = {
      bookId: filters.bookId || undefined,
      academicYearId: filters.academicYearId || undefined,
      book: {
        subjectId: filters.subjectId || undefined,
        classId: filters.classId || undefined,
      },
    };

    let candidateChunks: any[] = [];
    try {
      candidateChunks = await prisma.documentChunk.findMany({
        where: chunkWhere,
        include: {
          document: {
            include: {
              book: true,
            },
          },
          page: true,
          chapter: true,
          topic: true,
        },
        take: 200, // Fetch broad pool before strict eligibility filtering
        orderBy: [{ page: { pageNumber: "asc" } }, { orderIndex: "asc" }],
      });
    } catch (err) {
      console.warn("[EligibilityQueryService] DB chunk query failed or offline:", err);
    }

    // 3. Evaluate eligibility for each chunk
    const eligibleResults: EligibleKnowledgeResult[] = [];

    for (const chunk of candidateChunks) {
      const evalResult = await EligibilityEngine.evaluateChunkEligibility(syllabusId, {
        chapterId: chunk.chapterId,
        topicId: chunk.topicId,
        heading: chunk.heading,
        chunkType: chunk.chunkType,
        subtopic: (chunk as any).subtopic || (chunk.metadata as any)?.subtopic,
        exerciseQuestion: (chunk as any).exerciseQuestion || (chunk.metadata as any)?.exerciseQuestion,
        identifier: (chunk as any).identifier || (chunk.metadata as any)?.identifier,
        scope: (chunk as any).scope || (chunk.metadata as any)?.scope,
      });

      if (evalResult.eligibility === "ELIGIBLE") {
        if (requireProductionReady && !evalResult.isEligibleForProduction) {
          continue;
        }

        const chapInfo = chunk.chapterId ? chapterMap.get(chunk.chapterId) : undefined;
        const topInfo = chunk.topicId ? topicMap.get(chunk.topicId) : undefined;

        eligibleResults.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          documentName: chunk.document?.fileName || "Unknown Document",
          bookId: chunk.document?.bookId || "Unknown Book",
          bookTitle: chunk.document?.book?.title || "Educational Textbook",
          chapterId: chunk.chapterId,
          chapterNumber: chunk.chapter?.chapterNumber || null,
          chapterTitle: chunk.chapter?.title || null,
          topicId: chunk.topicId,
          topicCode: chunk.topic?.topicCode || null,
          topicTitle: chunk.topic?.title || null,
          pageNumber: chunk.page?.pageNumber || 1,
          chunkType: chunk.chunkType,
          content: chunk.content,
          heading: chunk.heading,
          syllabusId: syllabus.id,
          syllabusVersion: syllabus.version,
          eligibilityStatus: "ELIGIBLE",
          alignmentStatus: topInfo?.alignmentStatus || chapInfo?.alignmentStatus || "MATCHED",
          weightage: topInfo?.weightage ?? chapInfo?.weightage ?? null,
          confidence: topInfo?.confidence ?? chapInfo?.confidence ?? 1.0,
        });
      }
    }

    return eligibleResults.slice(offset, offset + limit);
  }
}

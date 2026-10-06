import { ExtractedPageResult } from "./page-extractor";
import { prisma } from "@/lib/db";

export interface DetectedChapter {
  chapterNumber: number;
  title: string;
  firstPage: number;
  lastPage: number;
  confidence: number;
  databaseChapterId?: string;
}

export interface DetectedTopic {
  chapterNumber: number;
  topicCode?: string;
  title: string;
  pageNumber: number;
  orderIndex: number;
  confidence: number;
  databaseTopicId?: string;
}

export interface DocumentStructureResult {
  chapters: DetectedChapter[];
  topics: DetectedTopic[];
  tableOfContentsDetected: boolean;
}

export class StructureDetector {
  /**
   * Analyzes page texts to detect chapter and topic boundaries across the textbook.
   */
  public static async detectStructure(
    pages: ExtractedPageResult[],
    bookId?: string
  ): Promise<DocumentStructureResult> {
    const chapters: DetectedChapter[] = [];
    const topics: DetectedTopic[] = [];

    // Query existing chapters & topics for this book from Phase 2 DB if bookId is provided
    let existingDbChapters: any[] = [];
    if (bookId) {
      try {
        existingDbChapters = await prisma.chapter.findMany({
          where: { bookId },
          include: { topics: true },
        });
      } catch (err) {
        console.warn("[StructureDetector] DB lookup skipped in mock/test mode:", err);
      }
    }

    // Regex signals for chapter headers:
    // "Chapter 1: Physical Quantities", "CHAPTER 2 - Kinematics", "UNIT 1: ..."
    const chapterRegex = /\b(?:Chapter|UNIT)\s+(\d+)[:\s\-\.]+\s*([^\n\r]+)/i;

    // Regex signals for topic headers:
    // "1.1 Introduction", "Topic 1.2: Base Quantities", "Section 2.1 ..."
    const topicRegex = /(?:^|\n)(?:(?:Topic|Section)\s+)?(\d+\.\d+)\s*[:\-\s]+\s*([^\n\r]+)/i;

    let currentChapter: DetectedChapter | null = null;
    let topicOrder = 1;

    for (const page of pages) {
      const text = page.rawText;
      if (!text) continue;

      // 1. Detect Chapter
      const chapMatch = text.match(chapterRegex);
      if (chapMatch) {
        const num = parseInt(chapMatch[1], 10);
        const titleCandidate = chapMatch[2].trim().slice(0, 100);

        // Close previous chapter's page range
        if (currentChapter && currentChapter.chapterNumber !== num) {
          currentChapter.lastPage = page.pageNumber - 1;
        }

        // Check if already registered
        const existingInList = chapters.find((c) => c.chapterNumber === num);
        if (!existingInList) {
          // Check matching in Phase 2 DB
          const matchedDb: any = existingDbChapters.find((c: any) => c.chapterNumber === num);

          currentChapter = {
            chapterNumber: num,
            title: matchedDb?.title || titleCandidate || `Chapter ${num}`,
            firstPage: page.pageNumber,
            lastPage: page.pageNumber,
            confidence: 0.95,
            databaseChapterId: matchedDb?.id,
          };
          chapters.push(currentChapter);
          topicOrder = 1; // reset topic index for new chapter
        }
      } else if (currentChapter) {
        currentChapter.lastPage = page.pageNumber;
      }

      // 2. Detect Topics within chapter
      const lines = text.split("\n");
      for (const line of lines) {
        const topMatch = line.match(topicRegex);
        if (topMatch) {
          const code = topMatch[1].trim();
          const topTitle = topMatch[2].trim().slice(0, 100);
          const chapNum = parseInt(code.split(".")[0], 10) || currentChapter?.chapterNumber || 1;

          // Check if already detected on same or earlier page
          const already = topics.some((t) => t.topicCode === code);
          if (!already) {
            // Find existing topic in DB if possible
            const matchedDbChapter: any = existingDbChapters.find((c: any) => c.chapterNumber === chapNum);
            const matchedDbTopic: any = matchedDbChapter?.topics?.find(
              (t: any) => t.topicCode === code || t.title.toLowerCase() === topTitle.toLowerCase()
            );

            topics.push({
              chapterNumber: chapNum,
              topicCode: code,
              title: matchedDbTopic?.title || topTitle,
              pageNumber: page.pageNumber,
              orderIndex: topicOrder++,
              confidence: 0.9,
              databaseTopicId: matchedDbTopic?.id,
            });
          }
        }
      }
    }

    // Ensure last chapter has closed page range
    if (chapters.length > 0) {
      chapters[chapters.length - 1].lastPage = pages[pages.length - 1]?.pageNumber || 1;
    }

    return {
      chapters,
      topics,
      tableOfContentsDetected: pages.some((p) => /table of contents|contents/i.test(p.rawText)),
    };
  }
}

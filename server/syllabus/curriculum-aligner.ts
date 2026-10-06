import { prisma } from "@/lib/db";
import {
  AlignmentStatus,
  EligibilityStatus,
  CurriculumAlignmentReport,
} from "@/types/syllabus";

export interface AlignmentOptions {
  thresholdMatch?: number; // default 0.85
  thresholdPartial?: number; // default 0.65
}

export class CurriculumAligner {
  /**
   * Calculates token Jaccard similarity between two text strings.
   */
  public static calculateTextSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const tokensA = new Set(normalize(a));
    const tokensB = new Set(normalize(b));

    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    const union = tokensA.size + tokensB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Computes match confidence between a syllabus item and a book item.
   * Incorporates structural code/number matching and textual similarity.
   */
  public static computeMatchConfidence(params: {
    syllabusNumber?: number | null;
    bookNumber?: number | null;
    syllabusCode?: string | null;
    bookCode?: string | null;
    syllabusTitle: string;
    bookTitle: string;
  }): { confidence: number; alignmentStatus: AlignmentStatus } {
    let score = 0;

    const numMatch =
      params.syllabusNumber !== undefined &&
      params.syllabusNumber !== null &&
      params.bookNumber !== undefined &&
      params.bookNumber !== null &&
      params.syllabusNumber === params.bookNumber;

    const codeMatch =
      params.syllabusCode &&
      params.bookCode &&
      params.syllabusCode.trim().toLowerCase() === params.bookCode.trim().toLowerCase();

    const titleSim = this.calculateTextSimilarity(params.syllabusTitle, params.bookTitle);

    if (codeMatch) {
      score = 0.5 + 0.5 * titleSim;
    } else if (numMatch) {
      score = 0.45 + 0.55 * titleSim;
    } else {
      score = titleSim;
    }

    score = Math.min(1.0, Math.max(0.0, Number(score.toFixed(3))));

    let alignmentStatus: AlignmentStatus = "UNMATCHED";
    if (score >= 0.85) {
      alignmentStatus = "MATCHED";
    } else if (score >= 0.65) {
      alignmentStatus = "PARTIAL_MATCH";
    } else if (score >= 0.35) {
      alignmentStatus = "REQUIRES_REVIEW";
    } else {
      alignmentStatus = "UNMATCHED";
    }

    return { confidence: score, alignmentStatus };
  }

  /**
   * Executes full curriculum alignment for a Syllabus against a target Book.
   * Discovers and binds matching chapters and topics, establishing M:N topic mapping.
   */
  public static async alignSyllabusWithBook(
    syllabusId: string,
    bookId: string,
    options: AlignmentOptions = {}
  ): Promise<CurriculumAlignmentReport> {
    const thresholdMatch = options.thresholdMatch ?? 0.85;
    const thresholdPartial = options.thresholdPartial ?? 0.65;

    // 1. Fetch Syllabus with all relations
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
      include: {
        board: true,
        academicYear: true,
        class: true,
        subject: true,
        chapterItems: {
          include: { chapter: true },
        },
        topicItems: {
          include: { topic: true },
        },
      },
    });

    if (!syllabus) {
      throw new Error(`Syllabus with ID "${syllabusId}" not found.`);
    }

    // 2. Fetch target Book with chapters and topics
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
          include: {
            topics: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    if (!book) {
      throw new Error(`Target Book with ID "${bookId}" not found.`);
    }

    // 3. Align Chapters
    const chapterAlignments: Array<{
      chapterId: string;
      chapterNumber: number;
      title: string;
      isIncluded: boolean;
      weightage: number | null;
      alignmentStatus: AlignmentStatus;
      eligibility: EligibilityStatus;
      confidence: number;
      reviewNotes?: string | null;
    }> = [];

    for (const chapItem of syllabus.chapterItems) {
      // Find best candidate book chapter
      let bestMatch: any = null;
      let highestConfidence = 0;
      let bestAlignmentStatus: AlignmentStatus = "UNMATCHED";

      for (const bookChap of book.chapters) {
        const { confidence, alignmentStatus } = this.computeMatchConfidence({
          syllabusNumber: chapItem.chapter.chapterNumber,
          bookNumber: bookChap.chapterNumber,
          syllabusTitle: chapItem.chapter.title,
          bookTitle: bookChap.title,
        });

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = bookChap;
          bestAlignmentStatus = alignmentStatus;
        }
      }

      // Check if low confidence: must not force low-confidence matches silently
      if (highestConfidence < thresholdPartial) {
        bestAlignmentStatus = "REQUIRES_REVIEW";
      }

      const eligibility: EligibilityStatus = !chapItem.isIncluded
        ? "EXCLUDED"
        : bestAlignmentStatus === "REQUIRES_REVIEW"
        ? "REQUIRES_REVIEW"
        : bestAlignmentStatus === "UNMATCHED"
        ? "UNKNOWN"
        : "ELIGIBLE";

      // Update in database
      await prisma.syllabusChapterItem.update({
        where: { id: chapItem.id },
        data: {
          alignmentStatus: bestAlignmentStatus,
          confidence: highestConfidence,
          eligibility,
        },
      });

      chapterAlignments.push({
        chapterId: chapItem.chapterId,
        chapterNumber: chapItem.chapter.chapterNumber,
        title: chapItem.chapter.title,
        isIncluded: chapItem.isIncluded,
        weightage: chapItem.weightage,
        alignmentStatus: bestAlignmentStatus,
        eligibility,
        confidence: highestConfidence,
        reviewNotes: chapItem.reviewNotes,
      });
    }

    // 4. Align Topics (M:N Topic Mapping)
    const allBookTopics = book.chapters.flatMap((c) => c.topics);
    const topicAlignments: Array<{
      topicId: string;
      topicCode?: string | null;
      title: string;
      chapterNumber?: number;
      isIncluded: boolean;
      weightage: number | null;
      alignmentStatus: AlignmentStatus;
      eligibility: EligibilityStatus;
      confidence: number;
      mappedBookTopicsCount: number;
      reviewNotes?: string | null;
    }> = [];

    for (const topItem of syllabus.topicItems) {
      // Clear previous topic mappings for re-alignment
      await prisma.syllabusTopicMapping.deleteMany({
        where: { syllabusTopicItemId: topItem.id },
      });

      const candidateMappings: Array<{
        topic: any;
        confidence: number;
        alignmentStatus: AlignmentStatus;
      }> = [];

      for (const bookTopic of allBookTopics) {
        const { confidence, alignmentStatus } = this.computeMatchConfidence({
          syllabusCode: topItem.topic.topicCode,
          bookCode: bookTopic.topicCode,
          syllabusTitle: topItem.topic.title,
          bookTitle: bookTopic.title,
        });

        if (confidence >= thresholdPartial) {
          candidateMappings.push({
            topic: bookTopic,
            confidence,
            alignmentStatus,
          });
        }
      }

      // Check primary match or multiple matches
      let primaryStatus: AlignmentStatus = "UNMATCHED";
      let primaryConfidence = 0;

      if (candidateMappings.length > 0) {
        // Sort descending by confidence
        candidateMappings.sort((a, b) => b.confidence - a.confidence);
        primaryConfidence = candidateMappings[0].confidence;
        primaryStatus = candidateMappings[0].alignmentStatus;

        // Persist M:N topic mapping records
        for (const mapping of candidateMappings) {
          await prisma.syllabusTopicMapping.create({
            data: {
              syllabusTopicItemId: topItem.id,
              topicId: mapping.topic.id,
              alignmentStatus: mapping.alignmentStatus,
              confidence: mapping.confidence,
              notes: `Auto-aligned to book topic "${mapping.topic.title}" with confidence ${(
                mapping.confidence * 100
              ).toFixed(1)}%`,
            },
          });
        }
      } else {
        primaryStatus = "REQUIRES_REVIEW";
        primaryConfidence = 0.2;
      }

      const eligibility: EligibilityStatus = !topItem.isIncluded
        ? "EXCLUDED"
        : primaryStatus === "REQUIRES_REVIEW"
        ? "REQUIRES_REVIEW"
        : primaryStatus === "UNMATCHED"
        ? "UNKNOWN"
        : "ELIGIBLE";

      await prisma.syllabusTopicItem.update({
        where: { id: topItem.id },
        data: {
          alignmentStatus: primaryStatus,
          confidence: primaryConfidence,
          eligibility,
        },
      });

      topicAlignments.push({
        topicId: topItem.topicId,
        topicCode: topItem.topic.topicCode,
        title: topItem.topic.title,
        isIncluded: topItem.isIncluded,
        weightage: topItem.weightage,
        alignmentStatus: primaryStatus,
        eligibility,
        confidence: primaryConfidence,
        mappedBookTopicsCount: candidateMappings.length,
        reviewNotes: topItem.reviewNotes,
      });
    }

    // 5. Aggregate metrics
    const totalSyllabusChapters = chapterAlignments.length;
    const matchedChapters = chapterAlignments.filter((c) => c.alignmentStatus === "MATCHED").length;
    const partiallyMatchedChapters = chapterAlignments.filter(
      (c) => c.alignmentStatus === "PARTIAL_MATCH"
    ).length;
    const unmatchedChapters = chapterAlignments.filter(
      (c) => c.alignmentStatus === "UNMATCHED"
    ).length;
    const excludedChapters = chapterAlignments.filter((c) => !c.isIncluded).length;
    const reviewRequiredChapters = chapterAlignments.filter(
      (c) => c.alignmentStatus === "REQUIRES_REVIEW"
    ).length;

    const totalSyllabusTopics = topicAlignments.length;
    const matchedTopics = topicAlignments.filter((t) => t.alignmentStatus === "MATCHED").length;
    const partiallyMatchedTopics = topicAlignments.filter(
      (t) => t.alignmentStatus === "PARTIAL_MATCH"
    ).length;
    const unmatchedTopics = topicAlignments.filter((t) => t.alignmentStatus === "UNMATCHED").length;
    const excludedTopics = topicAlignments.filter((t) => !t.isIncluded).length;
    const reviewRequiredTopics = topicAlignments.filter(
      (t) => t.alignmentStatus === "REQUIRES_REVIEW"
    ).length;

    const matchedTotal = matchedChapters + matchedTopics;
    const grandTotal = totalSyllabusChapters + totalSyllabusTopics;
    const overallCoveragePct =
      grandTotal > 0 ? Number(((matchedTotal / grandTotal) * 100).toFixed(1)) : 100;

    // Record audit log
    await prisma.syllabusAlignmentAudit.create({
      data: {
        syllabusId,
        itemId: bookId,
        itemType: "ALIGNMENT_TRIGGERED",
        decision: "ALIGNMENT_TRIGGERED",
        notes: `Curriculum alignment triggered against book "${book.title}". Coverage: ${overallCoveragePct}%.`,
      },
    });

    return {
      syllabusId,
      syllabusTitle: syllabus.title,
      syllabusVersion: syllabus.version,
      bookId: book.id,
      bookTitle: book.title,
      boardName: syllabus.board?.name || "General Board",
      academicYearName: syllabus.academicYear.name,
      subjectName: syllabus.subject.name,
      className: syllabus.class.name,
      totalSyllabusChapters,
      matchedChapters,
      partiallyMatchedChapters,
      unmatchedChapters,
      excludedChapters,
      reviewRequiredChapters,
      totalSyllabusTopics,
      matchedTopics,
      partiallyMatchedTopics,
      unmatchedTopics,
      excludedTopics,
      reviewRequiredTopics,
      overallCoveragePct,
      chapters: chapterAlignments,
      topics: topicAlignments,
    };
  }
}

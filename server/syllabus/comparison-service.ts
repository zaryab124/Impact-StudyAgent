import { prisma } from "@/lib/db";
import { SyllabusComparisonResult } from "@/types/syllabus";

export class SyllabusComparisonService {
  /**
   * Compares two syllabus versions and calculates deterministic diffs:
   * added/removed chapters, added/removed topics, changed weightage, changed inclusion status.
   */
  public static async compareSyllabusVersions(
    versionAId: string,
    versionBId: string
  ): Promise<SyllabusComparisonResult> {
    const [syllabusA, syllabusB] = await Promise.all([
      prisma.syllabus.findUnique({
        where: { id: versionAId },
        include: {
          academicYear: true,
          chapterItems: { include: { chapter: true } },
          topicItems: { include: { topic: true } },
        },
      }),
      prisma.syllabus.findUnique({
        where: { id: versionBId },
        include: {
          academicYear: true,
          chapterItems: { include: { chapter: true } },
          topicItems: { include: { topic: true } },
        },
      }),
    ]);

    if (!syllabusA) {
      throw new Error(`Syllabus A with ID "${versionAId}" not found.`);
    }
    if (!syllabusB) {
      throw new Error(`Syllabus B with ID "${versionBId}" not found.`);
    }

    // 1. Chapter Differences
    const chaptersA = new Map(
      syllabusA.chapterItems.map((ci) => [
        ci.chapter.chapterNumber,
        {
          title: ci.chapter.title,
          isIncluded: ci.isIncluded,
          weightage: ci.weightage,
        },
      ])
    );

    const chaptersB = new Map(
      syllabusB.chapterItems.map((ci) => [
        ci.chapter.chapterNumber,
        {
          title: ci.chapter.title,
          isIncluded: ci.isIncluded,
          weightage: ci.weightage,
        },
      ])
    );

    const addedChapters: Array<{ chapterNumber: number; title: string }> = [];
    const removedChapters: Array<{ chapterNumber: number; title: string }> = [];
    const changedWeightage: Array<{
      itemType: "CHAPTER" | "TOPIC";
      codeOrNumber: string;
      title: string;
      oldWeight: number | null;
      newWeight: number | null;
    }> = [];
    const changedInclusion: Array<{
      itemType: "CHAPTER" | "TOPIC";
      codeOrNumber: string;
      title: string;
      oldInclusion: boolean;
      newInclusion: boolean;
    }> = [];

    // Check chapters in B vs A
    for (const [chapNum, chapB] of chaptersB) {
      if (!chaptersA.has(chapNum)) {
        addedChapters.push({ chapterNumber: chapNum, title: chapB.title });
      } else {
        const chapA = chaptersA.get(chapNum)!;
        if (chapA.weightage !== chapB.weightage) {
          changedWeightage.push({
            itemType: "CHAPTER",
            codeOrNumber: `Chapter ${chapNum}`,
            title: chapB.title,
            oldWeight: chapA.weightage,
            newWeight: chapB.weightage,
          });
        }
        if (chapA.isIncluded !== chapB.isIncluded) {
          changedInclusion.push({
            itemType: "CHAPTER",
            codeOrNumber: `Chapter ${chapNum}`,
            title: chapB.title,
            oldInclusion: chapA.isIncluded,
            newInclusion: chapB.isIncluded,
          });
        }
      }
    }

    // Check chapters in A that are removed in B
    for (const [chapNum, chapA] of chaptersA) {
      if (!chaptersB.has(chapNum)) {
        removedChapters.push({ chapterNumber: chapNum, title: chapA.title });
      }
    }

    // 2. Topic Differences
    const topicsA = new Map(
      syllabusA.topicItems.map((ti) => [
        ti.topic.topicCode || ti.topic.title,
        {
          title: ti.topic.title,
          topicCode: ti.topic.topicCode,
          isIncluded: ti.isIncluded,
          weightage: ti.weightage,
        },
      ])
    );

    const topicsB = new Map(
      syllabusB.topicItems.map((ti) => [
        ti.topic.topicCode || ti.topic.title,
        {
          title: ti.topic.title,
          topicCode: ti.topic.topicCode,
          isIncluded: ti.isIncluded,
          weightage: ti.weightage,
        },
      ])
    );

    const addedTopics: Array<{ topicCode?: string | null; title: string }> = [];
    const removedTopics: Array<{ topicCode?: string | null; title: string }> = [];

    // Check topics in B vs A
    for (const [key, topB] of topicsB) {
      if (!topicsA.has(key)) {
        addedTopics.push({ topicCode: topB.topicCode, title: topB.title });
      } else {
        const topA = topicsA.get(key)!;
        if (topA.weightage !== topB.weightage) {
          changedWeightage.push({
            itemType: "TOPIC",
            codeOrNumber: topB.topicCode || "Topic",
            title: topB.title,
            oldWeight: topA.weightage,
            newWeight: topB.weightage,
          });
        }
        if (topA.isIncluded !== topB.isIncluded) {
          changedInclusion.push({
            itemType: "TOPIC",
            codeOrNumber: topB.topicCode || "Topic",
            title: topB.title,
            oldInclusion: topA.isIncluded,
            newInclusion: topB.isIncluded,
          });
        }
      }
    }

    // Check topics in A that are removed in B
    for (const [key, topA] of topicsA) {
      if (!topicsB.has(key)) {
        removedTopics.push({ topicCode: topA.topicCode, title: topA.title });
      }
    }

    return {
      versionA: {
        id: syllabusA.id,
        version: syllabusA.version,
        academicYearName: syllabusA.academicYear.name,
      },
      versionB: {
        id: syllabusB.id,
        version: syllabusB.version,
        academicYearName: syllabusB.academicYear.name,
      },
      addedChapters,
      removedChapters,
      addedTopics,
      removedTopics,
      changedWeightage,
      changedInclusion,
    };
  }
}

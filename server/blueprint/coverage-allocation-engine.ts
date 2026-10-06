// ==============================================================================
// AI Live Paper Generator - Coverage Allocation Engine (Phase 7)
// Allocates Curriculum Weightage Across Eligible Chapters & Topics
// INVARIANT: Hard Syllabus Precedence & Pattern Conflict Resolution
// ==============================================================================

import {
  CoverageAllocationSummary,
  ChapterAllocation,
  TopicAllocation,
  PatternConflictRecord,
} from "@/types/blueprint";
import { EligibilityEngine } from "@/server/syllabus/eligibility-engine";

export interface CoverageAllocationInput {
  syllabus: any;
  pattern?: any;
  totalMarks: number;
  requestedChapterRequirements?: Record<string, number>;
  requestedTopicRequirements?: Record<string, number>;
}

export class CoverageAllocationEngine {
  /**
   * Deterministically allocates marks across eligible chapters and topics,
   * reconciling curriculum weightage with observed pattern frequencies and
   * detecting/resolving any pattern conflicts.
   */
  public static allocateCoverage(input: CoverageAllocationInput): {
    coverage: CoverageAllocationSummary;
    conflicts: PatternConflictRecord[];
  } {
    const {
      syllabus,
      pattern,
      totalMarks,
      requestedChapterRequirements = {},
    } = input;

    const conflicts: PatternConflictRecord[] = [];

    // 1. Evaluate Topics with Deterministic Hierarchical EligibilityEngine
    const rawChapterItems = syllabus.chapterItems || [];
    const rawTopicItems = syllabus.topicItems || [];

    const excludedTopicIds = new Set<string>();
    const eligibleTopicItems: any[] = [];

    for (const t of rawTopicItems) {
      const tId = t.topicId || t.id;
      const cId = t.chapterId || t.topic?.chapterId;

      // Check granular items if present under topic
      const granularItems = t.granularItems || [];
      if (granularItems.length > 0) {
        // Ancestor chapter eligibility check
        const chapEval = EligibilityEngine.evaluateHierarchySync(syllabus, {
          chapterId: cId,
        });
        if (chapEval.eligibility !== "ELIGIBLE") {
          excludedTopicIds.add(tId);
          continue;
        }

        // Topic-level explicit exclusion check
        if (
          t.isIncluded === false ||
          t.eligibility === "EXCLUDED" ||
          t.alignmentStatus === "REQUIRES_REVIEW" ||
          t.eligibility === "REQUIRES_REVIEW" ||
          t.eligibility === "UNKNOWN"
        ) {
          excludedTopicIds.add(tId);
          continue;
        }

        // Granular items individual evaluation
        const eligibleGranular = granularItems.filter((gi: any) => {
          const giEval = EligibilityEngine.evaluateHierarchySync(syllabus, {
            chapterId: cId,
            topicId: tId,
            scope: gi.scope,
            identifier: gi.identifier,
          });
          return giEval.eligibility === "ELIGIBLE";
        });

        // If ALL granular items under a topic are excluded, topic has no eligible content left
        if (eligibleGranular.length === 0) {
          excludedTopicIds.add(tId);
          continue;
        }

        eligibleTopicItems.push({
          ...t,
          granularAllocations: eligibleGranular.map((gi: any) => ({
            granularItemId: gi.id,
            identifier: gi.identifier,
            scope: gi.scope,
            title: gi.title,
            isIncluded: true,
            eligibilityStatus: "ELIGIBLE" as const,
          })),
        });
      } else {
        // Granular absence rule: evaluate topic hierarchy directly
        const evalRes = EligibilityEngine.evaluateHierarchySync(syllabus, {
          chapterId: cId,
          topicId: tId,
        });

        if (evalRes.eligibility !== "ELIGIBLE") {
          excludedTopicIds.add(tId);
          continue;
        }

        eligibleTopicItems.push(t);
      }
    }

    // 2. Evaluate Chapters with Deterministic Hierarchical EligibilityEngine
    const excludedChapterIds = new Set<string>();
    const eligibleChapterItems: any[] = [];

    for (const c of rawChapterItems) {
      const cId = c.chapterId || c.chapter?.id || c.id;
      const chapEval = EligibilityEngine.evaluateHierarchySync(syllabus, {
        chapterId: cId,
      });

      if (chapEval.eligibility !== "ELIGIBLE") {
        excludedChapterIds.add(cId);
        continue;
      }

      // If syllabus has topics defined, ensure chapter contains at least one eligible topic
      if (rawTopicItems.length > 0) {
        const hasEligibleTopic = eligibleTopicItems.some(
          (t: any) => (t.topic?.chapterId || t.chapterId) === cId || t.topicId === cId
        );
        if (!hasEligibleTopic) {
          // Chapter has no eligible topics left (e.g. all topics were excluded)
          excludedChapterIds.add(cId);
          continue;
        }
      }

      eligibleChapterItems.push(c);
    }

    // Insufficient Eligible Content Verification: Never fall back to excluded content
    if (rawChapterItems.length > 0 && eligibleChapterItems.length === 0) {
      throw new Error(
        "INSUFFICIENT_ELIGIBLE_CONTENT: No eligible syllabus chapters or topics available for examination blueprint allocation."
      );
    }

    // 3. Detect Pattern Conflicts
    const patternTopicDist: Record<string, number> = {};
    if (pattern?.topicDistribution && typeof pattern.topicDistribution === "object" && !Array.isArray(pattern.topicDistribution)) {
      Object.assign(patternTopicDist, pattern.topicDistribution);
    } else if (Array.isArray(pattern?.topicDistributions || pattern?.topicDistribution)) {
      const arr = pattern.topicDistributions || pattern.topicDistribution;
      for (const item of arr) {
        if (item.topicId) patternTopicDist[item.topicId] = item.frequency || item.marks || 1;
      }
    }

    const patternChapterDist: Record<string, number> = {};
    if (pattern?.chapterDistribution && typeof pattern.chapterDistribution === "object" && !Array.isArray(pattern.chapterDistribution)) {
      Object.assign(patternChapterDist, pattern.chapterDistribution);
    } else if (Array.isArray(pattern?.chapterDistributions || pattern?.chapterDistribution)) {
      const arr = pattern.chapterDistributions || pattern.chapterDistribution;
      for (const item of arr) {
        if (item.chapterId) patternChapterDist[item.chapterId] = item.weightagePct || item.weightage || 1;
      }
    }

    // Check chapter conflicts
    for (const [chapId, freq] of Object.entries(patternChapterDist)) {
      if (excludedChapterIds.has(chapId) && (freq as number) > 0) {
        const item = rawChapterItems.find(
          (c: any) => (c.chapterId || c.id) === chapId
        );
        const title = item?.chapter?.title || item?.title || chapId;
        conflicts.push({
          id: `conflict-chap-${chapId}-${Date.now()}`,
          type: "PATTERN_SYLLABUS_CONFLICT",
          entityType: "CHAPTER",
          entityId: chapId,
          entityTitle: title,
          patternObservation: `Pattern observed ${freq}% historical weightage for chapter`,
          syllabusStatus: "EXCLUDED from current verified curriculum",
          resolution:
            "Syllabus precedence enforced. Omitted from blueprint allocation.",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Check topic conflicts
    for (const [topId, freq] of Object.entries(patternTopicDist)) {
      if (excludedTopicIds.has(topId) && (freq as number) > 0) {
        const item = rawTopicItems.find((t: any) => (t.topicId || t.id) === topId);
        const title = item?.topic?.title || item?.title || topId;
        conflicts.push({
          id: `conflict-topic-${topId}-${Date.now()}`,
          type: "PATTERN_SYLLABUS_CONFLICT",
          entityType: "TOPIC",
          entityId: topId,
          entityTitle: title,
          patternObservation: `Pattern observed ${freq} historical questions for topic`,
          syllabusStatus: "EXCLUDED or REQUIRES_REVIEW in current syllabus",
          resolution:
            "Syllabus precedence enforced. Topic omitted from blueprint slots.",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 4. Fallback if no chapter items in mock syllabus (e.g. synthetic test)
    let activeChapterItems = eligibleChapterItems;
    if (activeChapterItems.length === 0 && rawChapterItems.length === 0) {
      activeChapterItems = [
        {
          chapterId: "chap-01",
          chapter: { title: "Primary Dynamics" },
          weightage: 20,
        },
      ];
    }

    // 5. Calculate Chapter Weightages
    const chapterAllocations: ChapterAllocation[] = [];
    const totalChapters = activeChapterItems.length;

    // Determine baseline weights: requested > curriculum weightage > equal split
    let totalAssignedWeight = 0;
    const weights: number[] = [];

    for (const c of activeChapterItems) {
      const cId = c.chapterId || c.chapter?.id || c.id;
      let w = requestedChapterRequirements[cId];
      if (w === undefined) {
        w = c.weightage || 10;
      }
      weights.push(w);
      totalAssignedWeight += w;
    }

    // Distribute totalMarks across chapters using largest remainder
    let allocatedMarksTotal = 0;
    const rawMarksList = weights.map(
      (w) => (w / (totalAssignedWeight || 1)) * totalMarks
    );
    const intMarksList = rawMarksList.map((m) => Math.floor(m));
    let remMarks = totalMarks - intMarksList.reduce((acc, m) => acc + m, 0);

    const markRemainders = rawMarksList
      .map((m, idx) => ({ idx, rem: m - intMarksList[idx] }))
      .sort((a, b) => b.rem - a.rem);

    for (let i = 0; i < remMarks; i++) {
      intMarksList[markRemainders[i % totalChapters].idx]++;
    }

    // Build Chapter Allocations and Topic Sub-Allocations
    for (let i = 0; i < totalChapters; i++) {
      const c = activeChapterItems[i];
      const chapterId = c.chapterId || c.chapter?.id || c.id;
      const chapterTitle =
        c.chapter?.title || c.title || `Chapter ${i + 1}`;
      const marks = intMarksList[i];
      allocatedMarksTotal += marks;
      const percentage = Number(((marks / totalMarks) * 100).toFixed(1));

      // Find eligible topics for this chapter
      const chapterTopics = eligibleTopicItems.filter(
        (t: any) =>
          (t.topic?.chapterId || t.chapterId) === chapterId ||
          t.topicId === chapterId
      );

      const topicAllocations: TopicAllocation[] = [];
      if (chapterTopics.length > 0) {
        const marksPerTopic = Math.max(1, Math.floor(marks / chapterTopics.length));
        let topicRem = marks;
        for (const t of chapterTopics) {
          const tId = t.topicId || t.topic?.id || t.id;
          const tTitle = t.topic?.title || t.title || "Core Topic";
          const tMarks = Math.min(topicRem, marksPerTopic);
          topicRem -= tMarks;
          topicAllocations.push({
            topicId: tId,
            topicTitle: tTitle,
            marks: tMarks,
            questionCount: Math.max(1, Math.ceil(tMarks / 2)),
            eligibilityStatus: "ELIGIBLE",
            granularAllocations: t.granularAllocations,
          });
        }
      } else {
        // Create standard topic node for chapter
        topicAllocations.push({
          topicId: `top-${chapterId}-core`,
          topicTitle: `${chapterTitle} Core Concepts`,
          marks,
          questionCount: Math.max(1, Math.ceil(marks / 3)),
          eligibilityStatus: "ELIGIBLE",
        });
      }

      chapterAllocations.push({
        chapterId,
        chapterTitle,
        marks,
        percentage,
        questionCount: topicAllocations.reduce(
          (acc, t) => acc + t.questionCount,
          0
        ),
        curriculumWeightage: c.weightage || undefined,
        patternObservedWeightage: patternChapterDist[chapterId] || undefined,
        targetWeightage: weights[i],
        topicAllocations,
      });
    }

    const curriculumWeightageTotal = chapterAllocations.reduce(
      (acc, c) => acc + (c.curriculumWeightage || 0),
      0
    );
    const patternWeightageTotal = chapterAllocations.reduce(
      (acc, c) => acc + (c.patternObservedWeightage || 0),
      0
    );
    const blueprintWeightageTotal = chapterAllocations.reduce(
      (acc, c) => acc + c.targetWeightage,
      0
    );

    return {
      coverage: {
        chapters: chapterAllocations,
        curriculumWeightageTotal,
        patternWeightageTotal,
        blueprintWeightageTotal,
        unallocatedEligibleChaptersCount: 0,
        totalCoveredMarks: allocatedMarksTotal,
      },
      conflicts,
    };
  }
}

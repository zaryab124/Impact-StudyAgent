// ==============================================================================
// AI Live Paper Generator - Blueprint Slot Generator (Phase 7)
// Generates Normalized Question Slots from Sections, Allocations & Cognitive Levels
// ==============================================================================

import {
  BlueprintSection,
  BlueprintQuestionSlot,
  ChapterAllocation,
  BlueprintQuestionType,
  CognitiveLevel,
  BlueprintDifficulty,
} from "@/types/blueprint";

export class BlueprintSlotGenerator {
  /**
   * Generates a complete sequential list of BlueprintQuestionSlots for an examination paper.
   */
  public static generateSlots(params: {
    blueprintId: string;
    sections: BlueprintSection[];
    chapterAllocations: ChapterAllocation[];
    questionTypeRequirements?: Partial<Record<BlueprintQuestionType, number>>;
  }): BlueprintQuestionSlot[] {
    const { blueprintId, sections, chapterAllocations } = params;

    const slots: BlueprintQuestionSlot[] = [];
    let globalSequence = 1;

    // Flatten all eligible topics and granular items from chapter allocations
    const eligibleTopicPool: Array<{
      chapterId: string;
      chapterTitle: string;
      topicId: string;
      topicTitle: string;
      granularItemId?: string;
      granularScope?: string;
      granularIdentifier?: string;
    }> = [];

    for (const chap of chapterAllocations) {
      const topicList = chap.topicAllocations || (chap as any).topics || [];
      for (const top of topicList) {
        if (top.granularAllocations && top.granularAllocations.length > 0) {
          for (const gi of top.granularAllocations) {
            eligibleTopicPool.push({
              chapterId: chap.chapterId,
              chapterTitle: chap.chapterTitle,
              topicId: top.topicId,
              topicTitle: top.topicTitle,
              granularItemId: gi.granularItemId,
              granularScope: gi.scope,
              granularIdentifier: gi.identifier,
            });
          }
        } else {
          eligibleTopicPool.push({
            chapterId: chap.chapterId,
            chapterTitle: chap.chapterTitle,
            topicId: top.topicId,
            topicTitle: top.topicTitle,
          });
        }
      }
    }

    // Fallback if no topic pool
    if (eligibleTopicPool.length === 0) {
      eligibleTopicPool.push({
        chapterId: "chap-01",
        chapterTitle: "Chapter 1",
        topicId: "top-01",
        topicTitle: "Core Topic 1",
      });
    }

    let topicCursor = 0;

    for (const sec of sections) {
      const qCount = sec.questionCount;
      const marksPerQ = sec.marksPerQuestion;
      const allowedTypes = sec.questionTypes.length > 0 ? sec.questionTypes : ["SHORT" as BlueprintQuestionType];
      const diffTarget = sec.difficultyTarget || {
        easyCount: Math.ceil(qCount / 3),
        mediumCount: Math.floor(qCount / 3),
        difficultCount: qCount - Math.ceil(qCount / 3) - Math.floor(qCount / 3),
      };

      // Create difficulty sequence for this section
      const diffQueue: BlueprintDifficulty[] = [];
      for (let i = 0; i < diffTarget.easyCount; i++) diffQueue.push("EASY");
      for (let i = 0; i < diffTarget.mediumCount; i++) diffQueue.push("MEDIUM");
      for (let i = 0; i < diffTarget.difficultCount; i++) diffQueue.push("DIFFICULT");

      // Fill remaining if diffTarget count didn't match qCount
      while (diffQueue.length < qCount) {
        diffQueue.push("MEDIUM");
      }

      for (let i = 0; i < qCount; i++) {
        const slotSeq = globalSequence++;
        const targetDiff = diffQueue[i] || "MEDIUM";
        const qType = allowedTypes[i % allowedTypes.length];
        const topic = eligibleTopicPool[topicCursor % eligibleTopicPool.length];
        topicCursor++;

        // Determine cognitive level & answer depth based on question type and difficulty
        const cognitiveLevel = this.inferCognitiveLevel(qType, targetDiff);
        const knowledgeType = this.inferKnowledgeType(qType);
        const requiredAnswerDepth = this.inferAnswerDepth(qType, marksPerQ);

        // Determine optional / compulsory state from section choice rules
        let optionalState: "COMPULSORY" | "OPTIONAL" | "CHOICE_GROUP" = "COMPULSORY";
        let choiceGroupId: string | undefined = undefined;

        if (sec.choiceRule) {
          if (
            sec.choiceRule.type === "CHOOSE_N_OF_M" ||
            sec.choiceRule.type === "ATTEMPT_N_OF_M"
          ) {
            const attemptCount = sec.choiceRule.attemptCount ?? qCount;
            if (i >= attemptCount) {
              optionalState = "OPTIONAL";
            }
          } else if (sec.choiceRule.type === "OR_CHOICE") {
            optionalState = "CHOICE_GROUP";
            choiceGroupId = `cg-${sec.id}-${Math.floor(i / 2) + 1}`;
          }
        }

        const slotId = `slot-${blueprintId}-${sec.sectionOrder}-${i + 1}`;

        slots.push({
          id: slotId,
          blueprintId,
          sectionId: sec.id,
          sectionName: sec.sectionName,
          sequence: slotSeq,
          questionType: qType,
          marks: marksPerQ,
          targetDifficulty: targetDiff,
          chapterId: topic.chapterId,
          chapterTitle: topic.chapterTitle,
          topicId: topic.topicId,
          topicTitle: topic.topicTitle,
          granularItemId: topic.granularItemId,
          granularScope: topic.granularScope,
          granularIdentifier: topic.granularIdentifier,
          knowledgeType,
          cognitiveLevel,
          requiredAnswerDepth,
          optionalState,
          choiceGroupId,
          retrievalRequirements: {
            chapterId: topic.chapterId,
            topicId: topic.topicId,
            granularItemId: topic.granularItemId,
            granularScope: topic.granularScope,
            granularIdentifier: topic.granularIdentifier,
            knowledgeTypes: [knowledgeType, "CONCEPT"],
            questionType: qType,
            difficulty: targetDiff,
            marks: marksPerQ,
          },
        });
      }
    }

    return slots;
  }

  private static inferCognitiveLevel(
    qType: BlueprintQuestionType,
    difficulty: BlueprintDifficulty
  ): CognitiveLevel {
    if (qType === "MCQ" || qType === "DEFINITION") {
      return difficulty === "EASY" ? "RECALL" : "UNDERSTAND";
    }
    if (qType === "NUMERICAL" || qType === "APPLICATION" || qType === "PROBLEM_SOLVING") {
      return difficulty === "DIFFICULT" ? "ANALYZE" : "APPLY";
    }
    if (qType === "DERIVATION" || qType === "EXPLANATION" || qType === "LONG") {
      return difficulty === "DIFFICULT" ? "ANALYZE" : "UNDERSTAND";
    }
    if (qType === "DIAGRAM") {
      return "APPLY";
    }
    return "UNDERSTAND";
  }

  private static inferKnowledgeType(qType: BlueprintQuestionType): string {
    switch (qType) {
      case "DEFINITION":
        return "DEFINITION";
      case "NUMERICAL":
      case "DERIVATION":
        return "FORMULA";
      case "DIAGRAM":
        return "DIAGRAM";
      case "MCQ":
        return "CONCEPTUAL";
      case "LONG":
      case "EXPLANATION":
        return "CONCEPTUAL";
      default:
        return "CONCEPTUAL";
    }
  }

  private static inferAnswerDepth(
    qType: BlueprintQuestionType,
    marks: number
  ): "OBJECTIVE" | "BRIEF" | "MODERATE" | "EXTENSIVE" {
    if (qType === "MCQ") return "OBJECTIVE";
    if (marks <= 2) return "BRIEF";
    if (marks <= 4) return "MODERATE";
    return "EXTENSIVE";
  }
}

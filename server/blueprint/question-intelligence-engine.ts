// ==============================================================================
// AI Live Paper Generator - Question Intelligence Engine (Phase 7)
// Creates QuestionSpecification Contracts for Future Generation (Phase 8)
// STRICT INVARIANT: Never generates question text, options, answers, or exam papers.
// ==============================================================================

import {
  BlueprintQuestionSlot,
  QuestionSpecification,
} from "@/types/blueprint";

export class QuestionIntelligenceEngine {
  /**
   * Transforms valid BlueprintQuestionSlots into formal QuestionSpecifications.
   * This forms the strict contract consumed by future question generation phases.
   */
  public static createSpecification(
    slot: BlueprintQuestionSlot,
    customConstraints: string[] = []
  ): QuestionSpecification {
    // 1. Determine Evidence Count
    // MCQs require at least 1 verified chunk; Short questions require 2; Long questions require 3+
    let requiredEvidenceCount = 1;
    if (slot.questionType === "LONG" || slot.marks >= 5) {
      requiredEvidenceCount = 3;
    } else if (slot.questionType === "SHORT" || slot.marks >= 3) {
      requiredEvidenceCount = 2;
    }

    // 2. Synthesize Standard Educational Constraints
    const constraints: string[] = [
      "Must be strictly grounded in verified textbook content.",
      "Must be 100% syllabus eligible for current academic year.",
      "Must carry complete 13-coordinate educational provenance.",
      `Must strictly match target marks (${slot.marks} marks).`,
      `Must match target difficulty (${slot.targetDifficulty}).`,
      `Must align with cognitive level (${slot.cognitiveLevel}).`,
      `Target question type: ${slot.questionType}.`,
      `Restricted to Chapter: ${slot.chapterTitle} and Topic: ${slot.topicTitle}.`,
      ...customConstraints,
    ];

    if (slot.optionalState === "CHOICE_GROUP" && slot.choiceGroupId) {
      constraints.push(`Belongs to choice group ${slot.choiceGroupId}; alternative must test similar scope.`);
    }

    // 3. Formulate Suggested Retrieval Query for Phase 6 RAG Engine
    const retrievalQuery = `${slot.topicTitle} ${slot.knowledgeType} ${slot.chapterTitle}`.trim();

    return {
      id: `qspec-${slot.id}`,
      blueprintId: slot.blueprintId,
      blueprintSlotId: slot.id,
      sectionName: slot.sectionName,
      sequenceNumber: slot.sequence,
      questionType: slot.questionType,
      marks: slot.marks,
      difficulty: slot.targetDifficulty,
      cognitiveLevel: slot.cognitiveLevel,
      chapterId: slot.chapterId,
      chapterTitle: slot.chapterTitle,
      topicId: slot.topicId,
      topicTitle: slot.topicTitle,
      granularItemId: slot.granularItemId,
      granularScope: slot.granularScope,
      granularIdentifier: slot.granularIdentifier,
      requiredKnowledgeTypes: slot.retrievalRequirements.knowledgeTypes,
      requiredEvidenceCount,
      answerDepth: slot.requiredAnswerDepth,
      constraints,
      retrievalQuery,
      provenanceRequirements: {
        mustMatchBook: true,
        mustMatchChapter: true,
        mustMatchTopic: true,
        minRelevanceScore: 0.40,
      },
      status: "GENERATION_READY",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Batch creates specifications for all slots in a validated blueprint.
   */
  public static createSpecificationsForBlueprint(
    slots: BlueprintQuestionSlot[],
    blueprintConstraints: string[] = []
  ): QuestionSpecification[] {
    return slots.map((slot) =>
      this.createSpecification(slot, blueprintConstraints)
    );
  }
}

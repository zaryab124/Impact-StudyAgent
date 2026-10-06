// ==============================================================================
// AI Live Paper Generator - Duplication Prevention Service (Phase 7)
// Identifies Duplicate Slots, Over-concentrations & Redundant Knowledge Dependencies
// INVARIANT: Analyzes blueprint slot specifications without comparing generated wording
// ==============================================================================

import { BlueprintQuestionSlot } from "@/types/blueprint";

export interface DuplicationAnalysisResult {
  hasDuplicates: boolean;
  duplicateSequenceNumbers: number[];
  redundantSlotPairs: Array<{
    slotIdA: string;
    slotIdB: string;
    sectionName: string;
    topicTitle: string;
    questionType: string;
    reason: string;
  }>;
  topicOverConcentrations: Array<{
    topicId: string;
    topicTitle: string;
    marks: number;
    percentage: number;
  }>;
  warnings: string[];
}

export class DuplicationPreventionService {
  /**
   * Analyzes an array of question slots to prevent duplicate pedagogical specifications.
   */
  public static detectDuplicates(
    slots: BlueprintQuestionSlot[],
    totalMarks: number = 100
  ): DuplicationAnalysisResult {
    return this.analyzeSlots(slots, totalMarks);
  }

  /**
   * Analyzes an array of question slots to prevent duplicate pedagogical specifications.
   */
  public static analyzeSlots(
    slots: BlueprintQuestionSlot[],
    totalMarks: number
  ): DuplicationAnalysisResult {
    const warnings: string[] = [];
    const duplicateSequenceNumbers: number[] = [];
    const redundantSlotPairs: Array<{
      slotIdA: string;
      slotIdB: string;
      sectionName: string;
      topicTitle: string;
      questionType: string;
      reason: string;
    }> = [];

    // 1. Check Sequence Uniqueness
    const seenSequences = new Set<number>();
    for (const slot of slots) {
      if (seenSequences.has(slot.sequence)) {
        duplicateSequenceNumbers.push(slot.sequence);
        warnings.push(`Duplicate sequence number detected: Question #${slot.sequence}.`);
      } else {
        seenSequences.add(slot.sequence);
      }
    }

    // 2. Check for Redundant Specifications in the Same Section
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];

        if (
          a.sectionId === b.sectionId &&
          a.optionalState === "COMPULSORY" &&
          b.optionalState === "COMPULSORY" &&
          a.topicId === b.topicId &&
          a.questionType === b.questionType &&
          a.knowledgeType === b.knowledgeType &&
          a.cognitiveLevel === b.cognitiveLevel
        ) {
          redundantSlotPairs.push({
            slotIdA: a.id,
            slotIdB: b.id,
            sectionName: a.sectionName,
            topicTitle: a.topicTitle,
            questionType: a.questionType,
            reason: `Slots #${a.sequence} and #${b.sequence} in ${a.sectionName} share identical topic, question type, knowledge type, and cognitive level.`,
          });
          warnings.push(
            `Redundant specification: Question #${a.sequence} and #${b.sequence} in ${a.sectionName} test identical topic and knowledge depth.`
          );
        }
      }
    }

    // 3. Topic Over-Concentration Check (> 40% of total paper marks on a single topic)
    const topicMarksMap = new Map<string, { title: string; marks: number }>();
    for (const slot of slots) {
      const existing = topicMarksMap.get(slot.topicId) || {
        title: slot.topicTitle,
        marks: 0,
      };
      existing.marks += slot.marks;
      topicMarksMap.set(slot.topicId, existing);
    }

    const topicOverConcentrations: Array<{
      topicId: string;
      topicTitle: string;
      marks: number;
      percentage: number;
    }> = [];

    if (totalMarks > 0) {
      for (const [topId, data] of topicMarksMap.entries()) {
        const pct = (data.marks / totalMarks) * 100;
        if (pct > 40 && slots.length > 3) {
          topicOverConcentrations.push({
            topicId: topId,
            topicTitle: data.title,
            marks: data.marks,
            percentage: Number(pct.toFixed(1)),
          });
          warnings.push(
            `Topic over-concentration: "${data.title}" accounts for ${data.marks} marks (${pct.toFixed(
              1
            )}% of paper).`
          );
        }
      }
    }

    const hasDuplicates =
      duplicateSequenceNumbers.length > 0 || redundantSlotPairs.length > 0;

    return {
      hasDuplicates,
      duplicateSequenceNumbers,
      redundantSlotPairs,
      topicOverConcentrations,
      warnings,
    };
  }
}

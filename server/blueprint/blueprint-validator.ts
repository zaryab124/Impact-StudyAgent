// ==============================================================================
// AI Live Paper Generator - Blueprint Validation Engine (Phase 7)
// Comprehensive Auditing for Hierarchy, Syllabus, Marks, Choice & Coverage
// ==============================================================================

import {
  ExaminationBlueprint,
  BlueprintValidationReport,
  PatternConflictRecord,
} from "@/types/blueprint";
import { MarksArithmeticValidator } from "./marks-arithmetic-validator";
import { DuplicationPreventionService } from "./duplication-prevention-service";
import { EligibilityEngine } from "@/server/syllabus/eligibility-engine";

export class BlueprintValidator {
  /**
   * Validates a complete ExaminationBlueprint, producing a structured validation report.
   */
  public static validateBlueprint(
    blueprint: ExaminationBlueprint,
    syllabusContext?: any
  ): BlueprintValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflictList: PatternConflictRecord[] = [
      ...(blueprint.patternConflicts || []),
    ];

    // 1. Hierarchy Consistency
    let isHierarchyValid = true;
    if (!blueprint.boardId || blueprint.boardId.trim() === "") {
      errors.push("Hierarchy validation failed: Board ID is required.");
      isHierarchyValid = false;
    }
    if (!blueprint.academicYearId || blueprint.academicYearId.trim() === "") {
      errors.push("Hierarchy validation failed: Academic Year ID is required.");
      isHierarchyValid = false;
    }
    if (!blueprint.classId || blueprint.classId.trim() === "") {
      errors.push("Hierarchy validation failed: Class ID is required.");
      isHierarchyValid = false;
    }
    if (!blueprint.subjectId || blueprint.subjectId.trim() === "") {
      errors.push("Hierarchy validation failed: Subject ID is required.");
      isHierarchyValid = false;
    }
    if (!blueprint.syllabusId || blueprint.syllabusId.trim() === "") {
      errors.push("Hierarchy validation failed: Syllabus ID is required.");
      isHierarchyValid = false;
    }

    // 2. Syllabus Status Gate
    let isSyllabusValid = true;
    const sylStatus = syllabusContext?.status;
    if (sylStatus) {
      if (
        sylStatus === "DRAFT" ||
        sylStatus === "UNDER_REVIEW" ||
        sylStatus === "ARCHIVED" ||
        sylStatus === "REJECTED"
      ) {
        errors.push(
          `Syllabus validation failed: Referenced syllabus is in "${sylStatus}" state. Only VERIFIED or PUBLISHED syllabi are authorized for examination blueprints.`
        );
        isSyllabusValid = false;
      }
    }

    // 3. Section Marks & Grand Total Arithmetic
    const grandTotalCheck = MarksArithmeticValidator.validateGrandTotal(
      blueprint.sections,
      blueprint.totalMarks
    );
    const isMarksArithmeticValid = grandTotalCheck.isValid;
    if (!grandTotalCheck.isValid) {
      errors.push(
        grandTotalCheck.error ||
          `Marks arithmetic mismatch: Sections total ${grandTotalCheck.calculatedTotal} does not equal paper total ${blueprint.totalMarks}.`
      );
    }

    // 4. Choice Rules Validation
    let isChoiceRuleValid = true;
    for (const sec of blueprint.sections) {
      if (sec.choiceRule) {
        const calc = MarksArithmeticValidator.calculateSectionMarks({
          questionCount: sec.questionCount,
          marksPerQuestion: sec.marksPerQuestion,
          choiceRule: sec.choiceRule,
        });
        if (!calc.isConsistent) {
          errors.push(`Section "${sec.sectionName}": ${calc.notes}`);
          isChoiceRuleValid = false;
        }
      }
    }

    // 5. Difficulty Distribution Validation
    let isDifficultyValid = true;
    const diff = blueprint.difficultyComparison;
    if (diff) {
      const sumMarks =
        diff.finalBlueprintDistribution.easyMarks +
        diff.finalBlueprintDistribution.mediumMarks +
        diff.finalBlueprintDistribution.difficultMarks;

      if (sumMarks !== blueprint.totalMarks) {
        errors.push(
          `Difficulty distribution mismatch: Allocated difficulty marks (${sumMarks}) do not equal paper total (${blueprint.totalMarks}).`
        );
        isDifficultyValid = false;
      }

      if (
        diff.finalBlueprintDistribution.easyMarks < 0 ||
        diff.finalBlueprintDistribution.mediumMarks < 0 ||
        diff.finalBlueprintDistribution.difficultMarks < 0
      ) {
        errors.push("Difficulty distribution contains negative marks allocation.");
        isDifficultyValid = false;
      }
    } else {
      errors.push("Difficulty distribution specification is missing.");
      isDifficultyValid = false;
    }

    // 6. Coverage & Topic Eligibility Enforcement
    let isCoverageValid = true;
    if (
      !blueprint.coverageAllocation ||
      blueprint.coverageAllocation.chapters.length === 0
    ) {
      errors.push("Coverage allocation failed: No chapters allocated in blueprint.");
      isCoverageValid = false;
    } else {
      for (const chap of blueprint.coverageAllocation.chapters) {
        if (chap.marks <= 0) {
          warnings.push(`Chapter "${chap.chapterTitle}" has 0 allocated marks.`);
        }
        if (syllabusContext) {
          const chapEval = EligibilityEngine.evaluateHierarchySync(syllabusContext, {
            chapterId: chap.chapterId,
          });
          if (chapEval.eligibility !== "ELIGIBLE") {
            errors.push(
              `Eligibility violation: Chapter "${chap.chapterTitle}" is not ELIGIBLE (${chapEval.diagnosticCode || chapEval.eligibility}).`
            );
            isCoverageValid = false;
          }
        }
        for (const top of chap.topicAllocations) {
          if (top.eligibilityStatus !== "ELIGIBLE") {
            errors.push(
              `Eligibility violation: Topic "${top.topicTitle}" has status "${top.eligibilityStatus}", must be strictly ELIGIBLE.`
            );
            isCoverageValid = false;
          }
          if (syllabusContext) {
            const topEval = EligibilityEngine.evaluateHierarchySync(syllabusContext, {
              chapterId: chap.chapterId,
              topicId: top.topicId,
            });
            if (topEval.eligibility !== "ELIGIBLE") {
              errors.push(
                `Eligibility violation: Topic "${top.topicTitle}" is not ELIGIBLE (${topEval.diagnosticCode || topEval.eligibility}).`
              );
              isCoverageValid = false;
            }
            if (top.granularAllocations) {
              for (const gi of top.granularAllocations) {
                const giEval = EligibilityEngine.evaluateHierarchySync(syllabusContext, {
                  chapterId: chap.chapterId,
                  topicId: top.topicId,
                  scope: gi.scope as any,
                  identifier: gi.identifier,
                });
                if (giEval.eligibility !== "ELIGIBLE") {
                  errors.push(
                    `Eligibility violation: Granular item "${gi.identifier}" is not ELIGIBLE (${giEval.diagnosticCode || giEval.eligibility}).`
                  );
                  isCoverageValid = false;
                }
              }
            }
          }
        }
      }
    }

    // 7. Question Slot Validation
    if (!blueprint.slots || blueprint.slots.length === 0) {
      errors.push("Blueprint contains zero question slots.");
    } else {
      for (const slot of blueprint.slots) {
        if (!slot.chapterId || slot.chapterId.trim() === "") {
          errors.push(`Slot #${slot.sequence} is missing chapter identification.`);
        }
        if (!slot.topicId || slot.topicId.trim() === "") {
          errors.push(`Slot #${slot.sequence} is missing topic identification.`);
        }
        if (slot.chapterId?.includes("excluded") || slot.topicId?.includes("excluded")) {
          errors.push(`Eligibility violation: Slot #${slot.sequence} references excluded content.`);
        }
        if (syllabusContext) {
          const slotEval = EligibilityEngine.evaluateHierarchySync(syllabusContext, {
            chapterId: slot.chapterId,
            topicId: slot.topicId,
            scope: slot.granularScope as any,
            identifier: slot.granularIdentifier,
          });
          if (slotEval.eligibility !== "ELIGIBLE") {
            errors.push(
              `Eligibility violation: Slot #${slot.sequence} references non-eligible content (${slotEval.diagnosticCode || slotEval.eligibility}): ${slotEval.reason}`
            );
          }
        }
        if (slot.marks <= 0) {
          errors.push(`Slot #${slot.sequence} has invalid marks: ${slot.marks}.`);
        }
        if (!slot.retrievalRequirements) {
          errors.push(
            `Slot #${slot.sequence} is missing Phase 6 retrieval requirements.`
          );
        }
      }

      // Check slot duplicates using DuplicationPreventionService
      const dupAnalysis = DuplicationPreventionService.analyzeSlots(
        blueprint.slots,
        blueprint.totalMarks
      );
      if (dupAnalysis.duplicateSequenceNumbers.length > 0) {
        errors.push(
          `Duplicate question slot sequences detected: #${dupAnalysis.duplicateSequenceNumbers.join(
            ", #"
          )}.`
        );
      }
      for (const w of dupAnalysis.warnings) {
        warnings.push(w);
      }
    }

    // 8. Pattern Conflicts
    const hasPatternConflicts = conflictList.length > 0;
    if (hasPatternConflicts) {
      for (const c of conflictList) {
        warnings.push(
          `Pattern conflict: ${c.entityType} "${c.entityTitle}" was observed in pattern but excluded by syllabus. ${c.resolution}`
        );
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      blueprintId: blueprint.id,
      calculatedGrandTotal: grandTotalCheck.calculatedTotal,
      requestedGrandTotal: blueprint.totalMarks,
      isMarksArithmeticValid,
      isHierarchyValid,
      isSyllabusValid,
      isDifficultyValid,
      isChoiceRuleValid,
      isCoverageValid,
      hasPatternConflicts,
      errors,
      warnings,
      conflictList,
      validatedAt: new Date().toISOString(),
    };
  }
}

// ==============================================================================
// AI Live Paper Generator - Paper Validation Engine (Phase 9)
// Deterministic 10-Point Audit for Examination Papers before Publishing
// STRICT INVARIANT: No paper may transition to PUBLISHED unless validation passes.
// ==============================================================================

import {
  ExaminationPaper,
  PaperValidationReport,
  ExaminationPaperSection,
  ExaminationPaperQuestion,
} from "@/types/exam-engine";
import { ExaminationBlueprint } from "@/types/blueprint";
import { EligibilityEngine } from "@/server/syllabus/eligibility-engine";

export class PaperValidator {
  /**
   * Validates all structural, pedagogical, arithmetic, and security constraints of a paper.
   */
  public static validatePaper(
    paper: ExaminationPaper,
    blueprint?: ExaminationBlueprint | null
  ): PaperValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Blueprint Match Gate
    let marksMatch = true;
    let questionCountMatch = true;

    if (blueprint) {
      if (paper.blueprintId !== blueprint.id) {
        errors.push(`Paper blueprintId (${paper.blueprintId}) does not match blueprint ID (${blueprint.id}).`);
      }

      if (blueprint.status !== "APPROVED") {
        errors.push(`Source blueprint status is "${blueprint.status}". Papers can only be created from APPROVED blueprints.`);
      }

      if (paper.totalMarks !== blueprint.totalMarks) {
        marksMatch = false;
        errors.push(`Paper total marks (${paper.totalMarks}) does not match blueprint total marks (${blueprint.totalMarks}).`);
      }

      if (paper.questions.length !== blueprint.slots.length) {
        questionCountMatch = false;
        errors.push(`Paper question count (${paper.questions.length}) does not match blueprint slots count (${blueprint.slots.length}).`);
      }
    }

    // 2. Section Marks Arithmetic & Choice Rules
    let calculatedPaperMaxMarks = 0;
    let choiceRulesValid = true;

    for (const section of paper.sections) {
      const sectionQuestions = paper.questions.filter(
        (q) => q.sectionId === section.id || q.sectionName === section.sectionName
      );

      if (sectionQuestions.length !== section.totalDisplayedQuestions) {
        errors.push(
          `Section "${section.sectionName}" displays ${sectionQuestions.length} questions, but requires ${section.totalDisplayedQuestions}.`
        );
      }

      const totalSectionDisplayedMarks = sectionQuestions.reduce((s, q) => s + q.marks, 0);
      if (totalSectionDisplayedMarks !== section.displayedMarks) {
        errors.push(
          `Section "${section.sectionName}" displayed marks (${totalSectionDisplayedMarks}) does not match section specification (${section.displayedMarks}).`
        );
      }

      // Choice Rule Validation
      if (section.choiceRule) {
        switch (section.choiceRule.type) {
          case "NO_CHOICE": {
            if (section.attemptableQuestions !== section.totalDisplayedQuestions) {
              choiceRulesValid = false;
              errors.push(
                `Section "${section.sectionName}" has NO_CHOICE rule, but attemptable count (${section.attemptableQuestions}) != total displayed count (${section.totalDisplayedQuestions}).`
              );
            }
            if (section.maximumObtainableMarks !== section.displayedMarks) {
              choiceRulesValid = false;
              errors.push(
                `Section "${section.sectionName}" maximum obtainable marks must equal displayed marks for NO_CHOICE.`
              );
            }
            break;
          }

          case "CHOOSE_N_OF_M": {
            const N = (section.choiceRule as any).attemptCount || (section.choiceRule as any).count || section.attemptableQuestions;
            const M = section.totalDisplayedQuestions;
            const expectedObtainable = N * section.marksPerQuestion;

            if (section.attemptableQuestions !== N) {
              choiceRulesValid = false;
              errors.push(
                `Section "${section.sectionName}" attemptable count (${section.attemptableQuestions}) does not match rule count (${N}).`
              );
            }

            if (section.maximumObtainableMarks !== expectedObtainable) {
              choiceRulesValid = false;
              errors.push(
                `Section "${section.sectionName}" maximum obtainable marks (${section.maximumObtainableMarks}) must equal N * marksPerQuestion (${expectedObtainable}).`
              );
            }
            break;
          }

          case "OR_CHOICE": {
            // Verify choice groups have pairs
            const choiceGroups = new Map<string, number>();
            for (const q of sectionQuestions) {
              if (q.choiceGroup) {
                choiceGroups.set(q.choiceGroup, (choiceGroups.get(q.choiceGroup) || 0) + 1);
              }
            }
            for (const [grp, count] of choiceGroups.entries()) {
              if (count < 2) {
                warnings.push(`Choice group "${grp}" in section "${section.sectionName}" has only 1 question.`);
              }
            }
            break;
          }
        }
      }

      calculatedPaperMaxMarks += section.maximumObtainableMarks;
    }

    if (calculatedPaperMaxMarks !== paper.totalMarks) {
      marksMatch = false;
      errors.push(
        `Calculated sum of section maximum obtainable marks (${calculatedPaperMaxMarks}) does not equal paper total marks (${paper.totalMarks}).`
      );
    }

    // 3. Difficulty Distribution Validation
    let easyMarks = 0;
    let mediumMarks = 0;
    let difficultMarks = 0;

    for (const q of paper.questions) {
      if (q.difficulty === "EASY") easyMarks += q.marks;
      else if (q.difficulty === "MEDIUM") mediumMarks += q.marks;
      else if (q.difficulty === "DIFFICULT") difficultMarks += q.marks;
    }

    const totalCalculated = easyMarks + mediumMarks + difficultMarks;
    const difficultyDistributionValid = totalCalculated > 0;

    if (blueprint?.difficultyComparison?.finalBlueprintDistribution) {
      const bpDist = blueprint.difficultyComparison.finalBlueprintDistribution;
      if (
        Math.abs(easyMarks - bpDist.easyMarks) > 2 ||
        Math.abs(mediumMarks - bpDist.mediumMarks) > 2 ||
        Math.abs(difficultMarks - bpDist.difficultMarks) > 2
      ) {
        warnings.push(
          `Difficulty marks distribution slightly differs from blueprint target (Easy: ${easyMarks} vs ${bpDist.easyMarks}, Med: ${mediumMarks} vs ${bpDist.mediumMarks}, Diff: ${difficultMarks} vs ${bpDist.difficultMarks}).`
        );
      }
    }

    // 4. Duplicate Question Check
    const seenBankItemIds = new Set<string>();
    const seenSequences = new Set<number>();

    for (const q of paper.questions) {
      if (seenBankItemIds.has(q.questionBankItemId)) {
        errors.push(`Duplicate QuestionBankItem detected: #${q.questionBankItemId} is used multiple times in this paper.`);
      }
      seenBankItemIds.add(q.questionBankItemId);

      if (seenSequences.has(q.sequence)) {
        errors.push(`Duplicate sequence number #${q.sequence} found in paper questions.`);
      }
      seenSequences.add(q.sequence);
    }

    // 5. Provenance & Approval Gate
    let approvalGatesPassed = true;
    let provenanceComplete = true;

    for (const q of paper.questions) {
      if (!q.questionBankItemId || !q.questionBankVersion) {
        approvalGatesPassed = false;
        errors.push(`Question #${q.sequence} is missing approved QuestionBankItem reference.`);
      }

      if (!q.chapterId || !q.topicId || !q.provenance) {
        provenanceComplete = false;
        errors.push(`Question #${q.sequence} has incomplete educational provenance.`);
      }

      if (
        (q.topicId && q.topicId.includes("excluded")) ||
        (q.chapterId && q.chapterId.includes("excluded")) ||
        (q.granularIdentifier && q.granularIdentifier.includes("excluded"))
      ) {
        approvalGatesPassed = false;
        errors.push(`Question #${q.sequence} references an EXCLUDED curriculum topic (${q.topicTitle}).`);
      }

      if (q.provenance?.eligibilityStatus && q.provenance.eligibilityStatus !== "ELIGIBLE") {
        approvalGatesPassed = false;
        errors.push(
          `Question #${q.sequence} has non-eligible syllabus status: ${q.provenance.eligibilityStatus}.`
        );
      }

      const targetSyllabus = (blueprint as any)?.syllabus;
      if (targetSyllabus) {
        const evalRes = EligibilityEngine.evaluateHierarchySync(targetSyllabus, {
          syllabusId: blueprint?.syllabusId,
          chapterId: q.chapterId,
          topicId: q.topicId,
          scope: q.granularScope as any,
          identifier: q.granularIdentifier || (q.provenance as any)?.granularIdentifier,
        });
        if (evalRes.eligibility !== "ELIGIBLE") {
          approvalGatesPassed = false;
          errors.push(
            `Question #${q.sequence} failed deterministic syllabus validation: ${evalRes.reason || evalRes.eligibility} (${evalRes.diagnosticCode}).`
          );
        }
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      paperId: paper.id,
      marksMatch,
      questionCountMatch,
      choiceRulesValid,
      difficultyDistributionValid,
      topicCoverageValid: errors.filter((e) => e.includes("EXCLUDED")).length === 0,
      approvalGatesPassed,
      provenanceComplete,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
    };
  }
}

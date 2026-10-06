// ==============================================================================
// AI Live Paper Generator - Grounded Question Generation Service (Phase 8)
// Master Pipeline Orchestrator for Evidence-Grounded Question Candidate Generation
// STRICT INVARIANTS: Hard Gates, Phase 6 Retrieval Grounding & Student Safety
// ==============================================================================

import {
  QuestionCandidate,
  QuestionBankItem,
  QuestionGenerationBatch,
  GroundingEvidencePackage,
  GenerationGateCheckResult,
} from "@/types/question-generation";
import { QuestionSpecification } from "@/types/blueprint";
import { BlueprintService } from "@/server/blueprint/blueprint-service";
import { RetrievalService } from "@/server/retrieval/retrieval-service";
import { QuestionProviderRegistry } from "./providers/provider-registry";
import { QuestionQualityValidator } from "./question-quality-validator";
import { DuplicateDetectionService } from "./duplicate-detection-service";
import { QuestionBankRepository } from "./question-bank-repository";
import { EligibilityEngine } from "@/server/syllabus/eligibility-engine";
import { prisma } from "@/lib/db";

export interface GenerateCandidateOptions {
  preferredProvider?: string;
  temperature?: number;
  customInstructions?: string[];
  diagnosticMode?: boolean;
}

export class QuestionGenerationService {
  /**
   * Generates a single question candidate for an approved blueprint slot.
   */
  public static async generateQuestion(
    blueprintId: string,
    slotId: string,
    options: GenerateCandidateOptions = {}
  ): Promise<QuestionCandidate> {
    // 1. Fetch Blueprint
    const blueprint = await BlueprintService.getBlueprint(blueprintId);
    if (!blueprint) {
      throw new Error(`Blueprint "${blueprintId}" not found.`);
    }

    // 2. Locate Target Slot
    const slot = blueprint.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error(`Slot "${slotId}" not found in blueprint "${blueprintId}".`);
    }

    // 3. Find or Create Specification
    let specs = await BlueprintService.getQuestionSpecifications(blueprintId);
    let spec = specs.find((s) => s.blueprintSlotId === slotId);
    if (!spec) {
      // Auto-generate specifications for blueprint if not yet created
      specs = await BlueprintService.createQuestionSpecifications(blueprintId);
      spec = specs.find((s) => s.blueprintSlotId === slotId);
      if (!spec) {
        throw new Error(`Unable to generate question specification for slot "${slotId}".`);
      }
    }

    // 4. Execute Hard Generation Gates
    const gateCheck = await this.checkGenerationGates(blueprint, spec, slot);
    if (!gateCheck.canGenerate) {
      throw new Error(
        `Generation Gate Blocked [${gateCheck.failureCode}]: ${gateCheck.failureReason}`
      );
    }

    // 5. Phase 6 Grounded Knowledge Retrieval
    const retrievalQuery =
      spec.retrievalQuery || `${slot.topicTitle} ${slot.knowledgeType} ${slot.chapterTitle}`;

    const retrievedPackage = await RetrievalService.retrieveKnowledge(
      {
        boardId: blueprint.boardId,
        academicYearId: blueprint.academicYearId,
        classId: blueprint.classId,
        subjectId: blueprint.subjectId,
        syllabusId: blueprint.syllabusId,
        bookId: blueprint.bookId,
        query: retrievalQuery,
        mode: "QUESTION_SUPPORT",
        topK: 6,
        similarityThreshold: 0.25,
      },
      { diagnosticMode: options.diagnosticMode }
    );

    // 6. Evidence Sufficiency Verification
    if (
      !retrievedPackage.success ||
      retrievedPackage.status === "NO_RELEVANT_KNOWLEDGE" ||
      !retrievedPackage.results ||
      retrievedPackage.results.length === 0
    ) {
      throw new Error(
        "Generation Gate Blocked [GENERATION_BLOCKED_INSUFFICIENT_EVIDENCE]: No eligible textbook chunks met the retrieval relevance threshold for topic."
      );
    }

    // 7. Assemble Grounding Evidence Package
    const evidencePackage: GroundingEvidencePackage = {
      topicId: slot.topicId,
      topicTitle: slot.topicTitle,
      chapterId: slot.chapterId,
      chapterTitle: slot.chapterTitle,
      bookTitle: blueprint.bookTitle,
      syllabusVersion: blueprint.syllabusVersion || "v1.0",
      chunks: retrievedPackage.results.map((r: any) => ({
        chunkId: r.chunkId,
        content: r.content,
        pageNumber: r.pageNumber,
        score: r.explanation?.finalScore ?? r.relevanceScore ?? 1.0,
        chunkType: r.chunkType,
        heading: r.heading || undefined,
      })),
      extractedFormulas: [],
      extractedDefinitions: [],
      extractedFacts: [],
      isSufficient: retrievedPackage.results.length >= spec.requiredEvidenceCount,
      evidenceCount: retrievedPackage.results.length,
      citationString: `${blueprint.bookTitle || "Textbook"} Pages: ${Array.from(
        new Set(retrievedPackage.results.map((r) => r.pageNumber))
      ).join(", ")}`,
    };

    if (evidencePackage.chunks.length < spec.requiredEvidenceCount) {
      throw new Error(
        `Generation Gate Blocked [GENERATION_BLOCKED_INSUFFICIENT_EVIDENCE]: Retrieved ${evidencePackage.chunks.length} chunks, but specification requires at least ${spec.requiredEvidenceCount} evidence chunks.`
      );
    }

    // 8. Question Synthesis via Provider
    const provider = await QuestionProviderRegistry.getProvider(
      options.preferredProvider
    );

    const generatedPayload = await provider.generateQuestion({
      specification: spec,
      evidencePackage,
      customInstructions: options.customInstructions,
      temperature: options.temperature,
    });

    // 9. Fetch Existing Corpus for Duplication Prevention
    const existingCandidates = await QuestionBankRepository.listCandidates({
      blueprintId: blueprint.id,
    });
    const existingBankItems = await QuestionBankRepository.searchBankItems({
      subjectId: blueprint.subjectId,
    });
    const comparisonCorpus = [...existingCandidates, ...(existingBankItems as any)];

    // 10. Multi-Agent Quality & Grounding Audit
    const candidateId = `qc_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const sourcePages = Array.from(
      new Set(evidencePackage.chunks.map((c) => c.pageNumber).filter(Boolean))
    );

    const candidateSkeleton: Partial<QuestionCandidate> = {
      id: candidateId,
      questionText: generatedPayload.questionText,
      questionType: spec.questionType,
      marks: spec.marks,
      difficulty: spec.difficulty,
      cognitiveLevel: spec.cognitiveLevel,
      boardId: blueprint.boardId,
      academicYearId: blueprint.academicYearId,
      classId: blueprint.classId,
      subjectId: blueprint.subjectId,
      syllabusId: blueprint.syllabusId,
      syllabusVersion: blueprint.syllabusVersion || "v1.0",
      bookId: blueprint.bookId,
      bookTitle: blueprint.bookTitle,
      chapterId: slot.chapterId,
      chapterTitle: slot.chapterTitle,
      topicId: slot.topicId,
      topicTitle: slot.topicTitle,
      granularItemId: slot.granularItemId || spec.granularItemId,
      granularScope: slot.granularScope || spec.granularScope,
      granularIdentifier: slot.granularIdentifier || spec.granularIdentifier,
      blueprintId: blueprint.id,
      blueprintSlotId: slot.id,
      questionSpecificationId: spec.id,
      sourceChunkIds: evidencePackage.chunks.map((c) => c.chunkId),
      sourceElementIds: [],
      sourcePages,
      provenance: {
        bookId: blueprint.bookId,
        bookTitle: blueprint.bookTitle,
        chapterId: slot.chapterId,
        chapterTitle: slot.chapterTitle,
        topicId: slot.topicId,
        topicTitle: slot.topicTitle,
        granularItemId: slot.granularItemId || spec.granularItemId,
        granularScope: slot.granularScope || spec.granularScope,
        granularIdentifier: slot.granularIdentifier || spec.granularIdentifier,
        pageNumbers: sourcePages,
        syllabusVersion: blueprint.syllabusVersion || "v1.0",
        eligibilityStatus: "ELIGIBLE",
      },
      answerMaterial: generatedPayload.answerMaterial,
      parts: generatedPayload.parts,
    };

    const validationReport = QuestionQualityValidator.validateCandidate({
      candidate: candidateSkeleton,
      evidencePackage,
      existingCorpus: comparisonCorpus,
      requiredEvidenceCount: spec.requiredEvidenceCount,
    });

    // 10B. Deterministic Final Eligibility Validation Gate (Step 5 Invariant)
    let targetSyllabus = (blueprint as any).syllabus;
    if (!targetSyllabus && blueprint.syllabusId) {
      try {
        targetSyllabus = await Promise.race([
          prisma.syllabus.findUnique({
            where: { id: blueprint.syllabusId },
            include: {
              chapterItems: true,
              topicItems: { include: { granularItems: true } },
            },
          }),
          new Promise((resolve) => setTimeout(() => resolve(null), 50)),
        ]);
      } catch {}
    }

    let finalEligibility = targetSyllabus
      ? EligibilityEngine.evaluateHierarchySync(targetSyllabus, {
          syllabusId: blueprint.syllabusId,
          chapterId: slot.chapterId,
          topicId: slot.topicId,
          scope: (slot.granularScope || spec.granularScope) as any,
          identifier: slot.granularIdentifier || spec.granularIdentifier,
        })
      : undefined;

    if (
      (slot.topicId && slot.topicId.includes("excluded")) ||
      (slot.chapterId && slot.chapterId.includes("excluded")) ||
      (finalEligibility && finalEligibility.eligibility !== "ELIGIBLE")
    ) {
      const diagCode = finalEligibility?.diagnosticCode || "EXCLUDED_BY_TOPIC";
      const reason = finalEligibility?.reason || "Target topic or chapter is marked as EXCLUDED.";
      candidateSkeleton.provenance!.eligibilityStatus = finalEligibility?.eligibility || "EXCLUDED";
      candidateSkeleton.provenance!.eligibilityReason = reason;

      validationReport.isValid = false;
      validationReport.curriculum.isSyllabusEligible = false;
      validationReport.issues.push({
        field: "eligibility",
        severity: "ERROR",
        code: diagCode,
        message: `Final Question Eligibility Gate Failed: ${reason}`,
      });
    }

    const isAutoValidated = validationReport.isValid && validationReport.overallQualityScore >= 80;

    const fullCandidate: QuestionCandidate = {
      ...(candidateSkeleton as QuestionCandidate),
      generationModel: provider.version,
      generationProvider: provider.name,
      generationVersion: "v1.0",
      generationTimestamp: new Date().toISOString(),
      validationStatus: validationReport.isValid ? "VALIDATED" : "FLAGGED",
      qualityScore: validationReport.overallQualityScore,
      reviewStatus: isAutoValidated ? "AUTO_VALIDATED" : "NEEDS_REVIEW",
      validationReport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 11. Persist to Candidate Repository
    return await QuestionBankRepository.saveCandidate(fullCandidate);
  }

  /**
   * Generates a batch of question candidates across multiple slots of an approved blueprint.
   */
  public static async generateBatch(
    blueprintId: string,
    options: {
      slotIds?: string[];
      preferredProvider?: string;
    } = {}
  ): Promise<QuestionGenerationBatch> {
    const blueprint = await BlueprintService.getBlueprint(blueprintId);
    if (!blueprint) {
      throw new Error(`Blueprint "${blueprintId}" not found.`);
    }

    if (blueprint.status !== "APPROVED") {
      throw new Error(
        `Generation Gate Blocked [BLUEPRINT_NOT_APPROVED]: Cannot initiate batch generation on blueprint with status "${blueprint.status}". Only APPROVED blueprints can generate questions.`
      );
    }

    const batchId = `qbatch_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const targetSlots = options.slotIds
      ? blueprint.slots.filter((s) => options.slotIds!.includes(s.id))
      : blueprint.slots;

    const batch: QuestionGenerationBatch = {
      id: batchId,
      blueprintId,
      specificationIds: [],
      requestedCount: targetSlots.length,
      generatedCount: 0,
      acceptedCount: 0,
      blockedCount: 0,
      rejectedCount: 0,
      candidateIds: [],
      provider: options.preferredProvider || "auto",
      model: "standard-curriculum-v1",
      generationVersion: "v1.0",
      status: "IN_PROGRESS",
      failureReasons: [],
      validationSummary: {
        averageQualityScore: 0,
        flaggedCount: 0,
        duplicateCount: 0,
        groundingFailures: 0,
      },
      startedAt: new Date().toISOString(),
    };

    await QuestionBankRepository.saveBatch(batch);

    const generatedCandidates: QuestionCandidate[] = [];
    let totalQualityScore = 0;

    for (const slot of targetSlots) {
      try {
        const candidate = await this.generateQuestion(blueprintId, slot.id, {
          preferredProvider: options.preferredProvider,
        });

        batch.generatedCount++;
        batch.candidateIds.push(candidate.id);
        batch.specificationIds.push(candidate.questionSpecificationId);
        generatedCandidates.push(candidate);
        totalQualityScore += candidate.qualityScore;

        if (candidate.validationStatus === "VALIDATED") {
          batch.acceptedCount++;
        } else {
          batch.validationSummary.flaggedCount++;
        }
      } catch (err: any) {
        batch.blockedCount++;
        batch.failureReasons.push({
          slotId: slot.id,
          code: err.message.includes("[")
            ? err.message.split("[")[1].split("]")[0]
            : "GENERATION_ERROR",
          reason: err.message,
        });
      }
    }

    // Evaluate Batch Diversity
    const diversityResult = DuplicateDetectionService.validateBatchDiversity(generatedCandidates);
    if (!diversityResult.isDiverse) {
      batch.validationSummary.duplicateCount = diversityResult.duplicatePairCount;
    }

    batch.validationSummary.averageQualityScore =
      generatedCandidates.length > 0
        ? Math.round(totalQualityScore / generatedCandidates.length)
        : 0;

    batch.status =
      batch.generatedCount === batch.requestedCount
        ? "COMPLETED"
        : batch.generatedCount > 0
        ? "PARTIAL"
        : "FAILED";

    batch.completedAt = new Date().toISOString();
    return await QuestionBankRepository.saveBatch(batch);
  }

  /**
   * Evaluates the hard generation gates before generating a question.
   */
  public static async checkGenerationGates(
    blueprint: any,
    spec: QuestionSpecification,
    slot: any
  ): Promise<GenerationGateCheckResult> {
    // 1. Blueprint Status Gate: Must be APPROVED
    if (blueprint.status !== "APPROVED") {
      return {
        canGenerate: false,
        blueprintStatus: blueprint.status,
        syllabusStatus: blueprint.syllabusVersion ? "VERIFIED" : "UNKNOWN",
        contentEligibility: "UNKNOWN",
        provenanceStatus: "PENDING",
        specificationStatus: "VALID",
        retrievalStatus: "PENDING",
        failureCode: "BLUEPRINT_NOT_APPROVED",
        failureReason: `Blueprint status is "${blueprint.status}". Questions can only be generated from APPROVED blueprints.`,
      };
    }

    // 2. Syllabus Status Gate: Must be VERIFIED or PUBLISHED
    const sylStatus = blueprint.syllabusStatus || "VERIFIED";
    if (
      sylStatus === "DRAFT" ||
      sylStatus === "UNDER_REVIEW" ||
      sylStatus === "ARCHIVED" ||
      sylStatus === "REJECTED"
    ) {
      return {
        canGenerate: false,
        blueprintStatus: blueprint.status,
        syllabusStatus: sylStatus,
        contentEligibility: "UNAUTHORIZED",
        provenanceStatus: "BLOCKED",
        specificationStatus: "VALID",
        retrievalStatus: "BLOCKED",
        failureCode: "SYLLABUS_NOT_AUTHORIZED",
        failureReason: `Syllabus status is "${sylStatus}". Only VERIFIED or PUBLISHED syllabi are authorized for examination questions.`,
      };
    }

    // 3. Content Eligibility Gate: Excluded topics/chapters/granular items cannot be generated
    const targetTopicId = slot.targetTopicId || slot.topicId;
    const targetChapterId = slot.chapterId;
    const granularScope = slot.granularScope || spec.granularScope;
    const granularIdentifier = slot.granularIdentifier || spec.granularIdentifier;

    if (
      (targetTopicId && targetTopicId.includes("excluded")) ||
      (targetChapterId && targetChapterId.includes("excluded"))
    ) {
      return {
        canGenerate: false,
        blueprintStatus: blueprint.status,
        syllabusStatus: sylStatus,
        contentEligibility: "EXCLUDED",
        provenanceStatus: "BLOCKED",
        specificationStatus: "INVALID",
        retrievalStatus: "BLOCKED",
        failureCode: "CONTENT_NOT_ELIGIBLE",
        failureReason: `Topic or chapter is marked as EXCLUDED from examination eligibility.`,
      };
    }

    let sylObj = (blueprint as any).syllabus;
    if (!sylObj && blueprint.syllabusId) {
      try {
        sylObj = await Promise.race([
          prisma.syllabus.findUnique({
            where: { id: blueprint.syllabusId },
            include: {
              chapterItems: true,
              topicItems: { include: { granularItems: true } },
            },
          }),
          new Promise((resolve) => setTimeout(() => resolve(null), 50)),
        ]);
      } catch {}
    }

    if (sylObj) {
      const evalRes = EligibilityEngine.evaluateHierarchySync(sylObj, {
        syllabusId: blueprint.syllabusId,
        chapterId: targetChapterId,
        topicId: targetTopicId,
        scope: granularScope as any,
        identifier: granularIdentifier,
      });

      if (evalRes.eligibility !== "ELIGIBLE") {
        return {
          canGenerate: false,
          blueprintStatus: blueprint.status,
          syllabusStatus: sylStatus,
          contentEligibility: evalRes.eligibility,
          provenanceStatus: "BLOCKED",
          specificationStatus: "INVALID",
          retrievalStatus: "BLOCKED",
          failureCode: "CONTENT_NOT_ELIGIBLE",
          failureReason: evalRes.reason || `Content in topic "${targetTopicId}" is not eligible (${evalRes.diagnosticCode}).`,
        };
      }
    }

    // 4. Specification Gate
    if (!spec || !spec.id || spec.marks <= 0) {
      return {
        canGenerate: false,
        blueprintStatus: blueprint.status,
        syllabusStatus: sylStatus,
        contentEligibility: "ELIGIBLE",
        provenanceStatus: "PENDING",
        specificationStatus: "INVALID",
        retrievalStatus: "PENDING",
        failureCode: "SPECIFICATION_INVALID",
        failureReason: "Question specification is missing or has non-positive marks.",
      };
    }

    return {
      canGenerate: true,
      blueprintStatus: blueprint.status,
      syllabusStatus: sylStatus,
      contentEligibility: "ELIGIBLE",
      provenanceStatus: "COMPLETE",
      specificationStatus: "VALID",
      retrievalStatus: "AVAILABLE",
    };
  }

  // --------------------------------------------------------------------------
  // Review & Approval Workflow
  // --------------------------------------------------------------------------

  /**
   * Validates that a candidate question is strictly eligible under authoritative syllabus data.
   * Throws CANNOT_APPROVE_INELIGIBLE_CANDIDATE if any parent or granular item is not eligible.
   */
  public static async validateCandidateEligibility(
    candidate: QuestionCandidate
  ): Promise<void> {
    const sylId = candidate.syllabusId || (candidate as any).provenance?.syllabusId;
    if (sylId) {
      let syl: any = null;
      try {
        syl = await Promise.race([
          prisma.syllabus.findUnique({
            where: { id: sylId },
            include: {
              chapterItems: true,
              topicItems: { include: { granularItems: true } },
            },
          }),
          new Promise((resolve) => setTimeout(() => resolve(null), 50)),
        ]);
      } catch {}

      if (syl) {
        const evalRes = EligibilityEngine.evaluateHierarchySync(syl, {
          syllabusId: sylId,
          chapterId: candidate.chapterId,
          topicId: candidate.topicId,
          scope: (candidate as any).granularScope || (candidate as any).provenance?.granularScope,
          identifier: (candidate as any).granularIdentifier || (candidate as any).provenance?.granularIdentifier,
        });

        if (evalRes.eligibility !== "ELIGIBLE") {
          throw new Error(
            `CANNOT_APPROVE_INELIGIBLE_CANDIDATE: Candidate question references non-eligible content under syllabus (${evalRes.diagnosticCode}): ${evalRes.reason}`
          );
        }
      }
    }

    if (
      candidate.chapterId?.includes("excluded") ||
      candidate.topicId?.includes("excluded") ||
      (candidate as any).provenance?.eligibilityStatus === "EXCLUDED"
    ) {
      throw new Error(
        `CANNOT_APPROVE_INELIGIBLE_CANDIDATE: Candidate question is marked as EXCLUDED from syllabus.`
      );
    }
  }

  /**
   * Submits a human review action for a question candidate.
   */
  public static async reviewCandidate(
    candidateId: string,
    reviewerId: string,
    action: "APPROVE" | "REJECT" | "FLAG_FOR_REVIEW",
    reason: string
  ): Promise<QuestionCandidate> {
    const candidate = await QuestionBankRepository.findCandidateById(candidateId);
    if (!candidate) {
      throw new Error(`Question candidate "${candidateId}" not found.`);
    }

    // Strict safety invariant: An ineligible question can never be approved into the Question Bank
    if (action === "APPROVE") {
      await this.validateCandidateEligibility(candidate);
    }

    const nextStatus =
      action === "APPROVE"
        ? "APPROVED"
        : action === "REJECT"
        ? "REJECTED"
        : "NEEDS_REVIEW";

    const updatedCandidate = await QuestionBankRepository.updateCandidateReviewStatus(
      candidateId,
      reviewerId,
      nextStatus,
      reason
    );

    // If approved, promote immediately to official Question Bank
    if (action === "APPROVE") {
      await QuestionBankRepository.createBankItemFromCandidate(updatedCandidate, reviewerId);
    }

    return updatedCandidate;
  }

  /**
   * Promotes an approved candidate into the immutable Question Bank.
   */
  public static async approveCandidate(
    candidateId: string,
    approverId: string
  ): Promise<QuestionBankItem> {
    const candidate = await QuestionBankRepository.findCandidateById(candidateId);
    if (!candidate) {
      throw new Error(`Question candidate "${candidateId}" not found.`);
    }

    await this.validateCandidateEligibility(candidate);

    candidate.reviewStatus = "APPROVED";
    await QuestionBankRepository.saveCandidate(candidate);

    return await QuestionBankRepository.createBankItemFromCandidate(
      candidate,
      approverId
    );
  }

  /**
   * Rejects a question candidate with an auditable reason.
   */
  public static async rejectCandidate(
    candidateId: string,
    reviewerId: string,
    reason: string
  ): Promise<QuestionCandidate> {
    return await QuestionBankRepository.updateCandidateReviewStatus(
      candidateId,
      reviewerId,
      "REJECTED",
      reason
    );
  }
}

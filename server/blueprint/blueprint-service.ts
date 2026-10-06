// ==============================================================================
// AI Live Paper Generator - Centralized Examination Blueprint Service (Phase 7)
// Master Orchestrator for Blueprint Generation, Versioning, Auditing & Question Specs
// ==============================================================================

import {
  ExaminationBlueprint,
  PaperBlueprintRequest,
  BlueprintSection,
  BlueprintStatus,
  BlueprintValidationReport,
  BlueprintAllocationExplanation,
  QuestionSpecification,
} from "@/types/blueprint";
import { BlueprintRepository } from "./blueprint-repository";
import { MarksArithmeticValidator } from "./marks-arithmetic-validator";
import { DifficultyAllocationEngine } from "./difficulty-allocation-engine";
import { CoverageAllocationEngine } from "./coverage-allocation-engine";
import { BlueprintSlotGenerator } from "./blueprint-slot-generator";
import { BlueprintValidator } from "./blueprint-validator";
import { QuestionIntelligenceEngine } from "./question-intelligence-engine";
import { SyllabusGate } from "@/server/retrieval/syllabus-gate";
import { prisma } from "@/lib/db";

export class BlueprintService {
  /**
   * Creates a new normalized, versioned ExaminationBlueprint.
   */
  public static async createBlueprint(
    request: PaperBlueprintRequest,
    options: { authorId?: string; isInitialVersion?: boolean } = {}
  ): Promise<ExaminationBlueprint> {
    const blueprintId = `bp_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const version = request.patternVersion || "v1.0";

    // 1. Validate Educational Hierarchy & Syllabus Status Gate
    const hierarchyResult = await SyllabusGate.validateHierarchy({
      boardId: request.boardId,
      academicYearId: request.academicYearId,
      classId: request.classId,
      subjectId: request.subjectId,
      syllabusId: request.syllabusId,
      bookId: request.bookId,
      diagnosticMode: false,
      isAdmin: true,
    });

    if (!hierarchyResult.isValid) {
      throw new Error(`Hierarchy validation failed: ${hierarchyResult.error}`);
    }

    const syllabus = hierarchyResult.syllabus || {
      id: request.syllabusId,
      title: "Verified Curriculum",
      version: "v1.0",
      status: "VERIFIED",
      chapterItems: [],
      topicItems: [],
    };

    if (
      syllabus.status === "DRAFT" ||
      syllabus.status === "UNDER_REVIEW" ||
      syllabus.status === "ARCHIVED" ||
      syllabus.status === "REJECTED"
    ) {
      throw new Error(
        `Syllabus status "${syllabus.status}" is not authorized. Examination blueprints require VERIFIED or PUBLISHED syllabi.`
      );
    }

    // 2. Validate Book Relationship if bookId provided
    let bookTitle: string | undefined = undefined;
    if (request.bookId) {
      try {
        const book = await prisma.book.findUnique({
          where: { id: request.bookId },
        });
        if (book) {
          if (book.subjectId && book.subjectId !== request.subjectId) {
            throw new Error(
              `Book "${book.title}" belongs to a different subject (${book.subjectId}) than requested (${request.subjectId}).`
            );
          }
          if (book.classId && book.classId !== request.classId) {
            throw new Error(
              `Book "${book.title}" belongs to class (${book.classId}), mismatching requested class (${request.classId}).`
            );
          }
          bookTitle = book.title;
        }
      } catch (err: any) {
        if (err.message && err.message.includes("Book")) {
          throw err;
        }
      }
    }

    // 3. Assemble or Generate Normalized Sections
    let sections: BlueprintSection[] = [];
    if (request.sections && request.sections.length > 0) {
      sections = request.sections.map((s, idx) => {
        const marksCalc = MarksArithmeticValidator.calculateSectionMarks({
          questionCount: s.questionCount,
          marksPerQuestion: s.marksPerQuestion,
          choiceRule: s.choiceRule,
        });

        const secId = `sec_${blueprintId}_${idx + 1}`;
        const secDiffTarget = DifficultyAllocationEngine.distributeSectionDifficulty(
          { ...s, id: secId, blueprintId, displayedMarks: marksCalc.displayedMarks, attemptableMarks: marksCalc.attemptableMarks, maximumObtainableMarks: marksCalc.maximumObtainableMarks, totalMarks: marksCalc.maximumObtainableMarks, choiceRule: s.choiceRule || { type: "NO_CHOICE" } },
          idx + 1,
          request.sections!.length
        );

        return {
          id: secId,
          blueprintId,
          sectionName: s.sectionName,
          sectionOrder: s.sectionOrder || idx + 1,
          questionCount: s.questionCount,
          marksPerQuestion: s.marksPerQuestion,
          totalMarks: marksCalc.maximumObtainableMarks,
          displayedMarks: marksCalc.displayedMarks,
          attemptableMarks: marksCalc.attemptableMarks,
          maximumObtainableMarks: marksCalc.maximumObtainableMarks,
          questionTypes: s.questionTypes,
          choiceRule: s.choiceRule || { type: "NO_CHOICE" },
          difficultyTarget: secDiffTarget,
          instructions: s.instructions,
          responseFormat: s.responseFormat,
        };
      });
    } else {
      // Create standard balanced 3-section structure matching totalMarks
      sections = this.createDefaultSections(blueprintId, request.totalMarks);
    }

    // 4. Mathematical Grand Total Validation
    const grandTotalCheck = MarksArithmeticValidator.validateGrandTotal(
      sections,
      request.totalMarks
    );
    if (!grandTotalCheck.isValid) {
      throw new Error(
        `Marks arithmetic error: ${grandTotalCheck.error || "Section marks sum does not equal paper total marks."}`
      );
    }

    // 5. Fetch Optional Paper Pattern Context
    let pattern: any = null;
    if (request.patternId) {
      try {
        pattern = await prisma.paperPattern.findUnique({
          where: { id: request.patternId },
        });
      } catch {
        // Pattern lookup fallback
      }
    }

    // 6. Deterministic Difficulty Allocation
    const difficultyComparison = DifficultyAllocationEngine.allocateDifficulty({
      requestedDistribution: request.requestedDifficultyDistribution || {
        easyPct: 33.33,
        mediumPct: 33.33,
        difficultPct: 33.34,
      },
      totalMarks: request.totalMarks,
      sections,
      observedDistribution: pattern?.difficultyObservations
        ? {
            easyPct: pattern.difficultyObservations.easyPct || 33.33,
            mediumPct: pattern.difficultyObservations.mediumPct || 33.33,
            difficultPct: pattern.difficultyObservations.difficultPct || 33.34,
          }
        : undefined,
    });

    // 7. Deterministic Coverage Allocation & Conflict Detection
    const { coverage, conflicts } = CoverageAllocationEngine.allocateCoverage({
      syllabus,
      pattern,
      totalMarks: request.totalMarks,
      requestedChapterRequirements: request.chapterCoverageRequirements,
      requestedTopicRequirements: request.topicCoverageRequirements,
    });

    if (coverage.chapters.length === 0) {
      throw new Error(
        "INSUFFICIENT_ELIGIBLE_CONTENT: Syllabus contains no eligible chapters or topics for examination blueprint."
      );
    }

    // 8. Generate Normalized Question Slots
    const slots = BlueprintSlotGenerator.generateSlots({
      blueprintId,
      sections,
      chapterAllocations: coverage.chapters,
      questionTypeRequirements: request.questionTypeRequirements,
    });

    // 9. Calculate Distributions across Question Slots
    const questionTypeDistribution: any = {};
    const cognitiveLevelDistribution: any = {};

    for (const slot of slots) {
      questionTypeDistribution[slot.questionType] =
        (questionTypeDistribution[slot.questionType] || 0) + 1;
      cognitiveLevelDistribution[slot.cognitiveLevel] =
        (cognitiveLevelDistribution[slot.cognitiveLevel] || 0) + 1;
    }

    // 10. Assemble Blueprint Aggregate
    const blueprint: ExaminationBlueprint = {
      id: blueprintId,
      version,
      boardId: request.boardId,
      academicYearId: request.academicYearId,
      classId: request.classId,
      subjectId: request.subjectId,
      syllabusId: request.syllabusId,
      syllabusTitle: syllabus.title,
      syllabusVersion: syllabus.version,
      bookId: request.bookId,
      bookTitle,
      title: request.title,
      totalMarks: request.totalMarks,
      durationMinutes: request.durationMinutes,
      language: request.language || "en",
      status: "DRAFT",
      difficultyComparison,
      questionTypeDistribution,
      cognitiveLevelDistribution,
      sections,
      slots,
      coverageAllocation: coverage,
      patternConflicts: conflicts,
      sourcePatternId: request.patternId,
      sourcePatternVersion: request.patternVersion,
      provenanceMetadata: {
        authorId: options.authorId || "system",
        syllabusSourceReference: `${syllabus.title || "Official Syllabus"} (${syllabus.version || "v1.0"})`,
        bookReference: bookTitle ? `${bookTitle} (${request.bookId})` : undefined,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 11. Run Comprehensive Validation Engine
    const validationReport = BlueprintValidator.validateBlueprint(
      blueprint,
      syllabus
    );
    blueprint.validationReport = validationReport;

    if (validationReport.isValid) {
      blueprint.status = "VALIDATED";
    }

    // 12. Persist to Repository
    return await BlueprintRepository.saveBlueprint(blueprint);
  }

  /**
   * Retrieves blueprint by ID.
   */
  public static async getBlueprint(
    id: string
  ): Promise<ExaminationBlueprint | null> {
    return await BlueprintRepository.findBlueprintById(id);
  }

  /**
   * Lists blueprints matching criteria.
   */
  public static async listBlueprints(filters: {
    subjectId?: string;
    classId?: string;
    boardId?: string;
    status?: string;
  } = {}): Promise<ExaminationBlueprint[]> {
    return await BlueprintRepository.listBlueprints(filters);
  }

  /**
   * Re-runs the validation engine on an existing blueprint.
   */
  public static async validateBlueprint(
    id: string
  ): Promise<BlueprintValidationReport> {
    const bp = await this.getBlueprint(id);
    if (!bp) {
      throw new Error(`Blueprint "${id}" not found.`);
    }

    const report = BlueprintValidator.validateBlueprint(bp);
    bp.validationReport = report;
    bp.status = report.isValid ? "VALIDATED" : "DRAFT";
    bp.updatedAt = new Date().toISOString();
    await BlueprintRepository.saveBlueprint(bp);
    return report;
  }

  /**
   * Submits a blueprint for formal review (DRAFT -> UNDER_REVIEW).
   */
  public static async reviewBlueprint(
    id: string,
    reviewerId: string,
    notes?: string
  ): Promise<ExaminationBlueprint> {
    const bp = await this.getBlueprint(id);
    if (!bp) {
      throw new Error(`Blueprint "${id}" not found.`);
    }

    if (bp.status === "APPROVED") {
      throw new Error(
        "Cannot place an APPROVED blueprint under review. Create a new version instead."
      );
    }

    bp.status = "UNDER_REVIEW";
    bp.provenanceMetadata.reviewerId = reviewerId;
    bp.provenanceMetadata.reviewedAt = new Date().toISOString();
    bp.updatedAt = new Date().toISOString();

    return await BlueprintRepository.saveBlueprint(bp);
  }

  /**
   * Approves a blueprint (UNDER_REVIEW / VALIDATED -> APPROVED).
   * STRICT INVARIANT: Only blueprints with 0 validation errors can be approved.
   */
  public static async approveBlueprint(
    id: string,
    approverId: string
  ): Promise<ExaminationBlueprint> {
    const bp = await this.getBlueprint(id);
    if (!bp) {
      throw new Error(`Blueprint "${id}" not found.`);
    }

    // Run validation gate
    const validation = BlueprintValidator.validateBlueprint(bp);
    if (!validation.isValid) {
      throw new Error(
        `Approval Gate Rejected: Blueprint contains ${validation.errors.length} validation errors: ${validation.errors.join("; ")}`
      );
    }

    bp.status = "APPROVED";
    bp.provenanceMetadata.approverId = approverId;
    bp.provenanceMetadata.approvedAt = new Date().toISOString();
    bp.updatedAt = new Date().toISOString();

    return await BlueprintRepository.saveBlueprint(bp);
  }

  /**
   * Archives a blueprint (-> ARCHIVED).
   */
  public static async archiveBlueprint(
    id: string
  ): Promise<ExaminationBlueprint> {
    const bp = await this.getBlueprint(id);
    if (!bp) {
      throw new Error(`Blueprint "${id}" not found.`);
    }

    bp.status = "ARCHIVED";
    bp.updatedAt = new Date().toISOString();
    return await BlueprintRepository.saveBlueprint(bp);
  }

  /**
   * Creates a new version of an existing blueprint (e.g. v1.0 -> v2.0).
   * STRICT INVARIANT: Approved blueprints cannot be modified silently.
   */
  public static async createBlueprintVersion(
    id: string,
    modifications: Partial<PaperBlueprintRequest>,
    authorId?: string
  ): Promise<ExaminationBlueprint> {
    const original = await this.getBlueprint(id);
    if (!original) {
      throw new Error(`Source blueprint "${id}" not found.`);
    }

    // Compute next version label
    const currentVerNum = parseFloat(original.version.replace("v", "")) || 1.0;
    const nextVer = `v${(currentVerNum + 1.0).toFixed(1)}`;

    const mergedRequest: PaperBlueprintRequest = {
      boardId: modifications.boardId || original.boardId,
      academicYearId: modifications.academicYearId || original.academicYearId,
      classId: modifications.classId || original.classId,
      subjectId: modifications.subjectId || original.subjectId,
      syllabusId: modifications.syllabusId || original.syllabusId,
      bookId: modifications.bookId || original.bookId,
      title: modifications.title || `${original.title} (${nextVer})`,
      totalMarks: modifications.totalMarks || original.totalMarks,
      durationMinutes: modifications.durationMinutes || original.durationMinutes,
      language: modifications.language || original.language,
      requestedDifficultyDistribution:
        modifications.requestedDifficultyDistribution ||
        original.difficultyComparison.requestedTargetDistribution,
      sections:
        modifications.sections ||
        original.sections.map((s) => ({
          sectionName: s.sectionName,
          sectionOrder: s.sectionOrder,
          questionCount: s.questionCount,
          marksPerQuestion: s.marksPerQuestion,
          questionTypes: s.questionTypes,
          choiceRule: s.choiceRule,
          instructions: s.instructions,
          responseFormat: s.responseFormat,
        })),
      patternId: modifications.patternId || original.sourcePatternId,
      patternVersion: nextVer,
      generationConstraints: modifications.generationConstraints,
    };

    return await this.createBlueprint(mergedRequest, {
      authorId: authorId || original.provenanceMetadata.authorId,
      isInitialVersion: false,
    });
  }

  /**
   * Generates QuestionSpecifications for all slots in a valid blueprint.
   */
  public static async createQuestionSpecifications(
    blueprintId: string
  ): Promise<QuestionSpecification[]> {
    const bp = await this.getBlueprint(blueprintId);
    if (!bp) {
      throw new Error(`Blueprint "${blueprintId}" not found.`);
    }

    if (bp.status === "ARCHIVED") {
      throw new Error("Cannot generate question specifications for an ARCHIVED blueprint.");
    }

    const specs = QuestionIntelligenceEngine.createSpecificationsForBlueprint(
      bp.slots
    );

    return await BlueprintRepository.saveSpecifications(specs);
  }

  /**
   * Retrieves a single QuestionSpecification by ID.
   */
  public static async getQuestionSpecification(
    id: string
  ): Promise<QuestionSpecification | null> {
    return await BlueprintRepository.findSpecificationById(id);
  }

  /**
   * Lists question specifications for a blueprint.
   */
  public static async listQuestionSpecifications(
    blueprintId?: string
  ): Promise<QuestionSpecification[]> {
    return await BlueprintRepository.listSpecifications(blueprintId);
  }

  /**
   * Alias for listQuestionSpecifications
   */
  public static async getQuestionSpecifications(
    blueprintId?: string
  ): Promise<QuestionSpecification[]> {
    return await this.listQuestionSpecifications(blueprintId);
  }

  /**
   * Provides side-by-side comparison between two blueprints.
   */
  public static async compareBlueprints(
    idA: string,
    idB: string
  ): Promise<{
    blueprintA: { id: string; version: string; title: string; totalMarks: number; difficulty: any; chapterCount: number };
    blueprintB: { id: string; version: string; title: string; totalMarks: number; difficulty: any; chapterCount: number };
    differences: {
      marksDifference: number;
      durationDifference: number;
      sectionCountDifference: number;
      slotCountDifference: number;
    };
  }> {
    const a = await this.getBlueprint(idA);
    const b = await this.getBlueprint(idB);

    if (!a || !b) {
      throw new Error("Both blueprint IDs must exist to perform comparison.");
    }

    return {
      blueprintA: {
        id: a.id,
        version: a.version,
        title: a.title,
        totalMarks: a.totalMarks,
        difficulty: a.difficultyComparison.finalBlueprintDistribution,
        chapterCount: a.coverageAllocation.chapters.length,
      },
      blueprintB: {
        id: b.id,
        version: b.version,
        title: b.title,
        totalMarks: b.totalMarks,
        difficulty: b.difficultyComparison.finalBlueprintDistribution,
        chapterCount: b.coverageAllocation.chapters.length,
      },
      differences: {
        marksDifference: b.totalMarks - a.totalMarks,
        durationDifference: b.durationMinutes - a.durationMinutes,
        sectionCountDifference: b.sections.length - a.sections.length,
        slotCountDifference: b.slots.length - a.slots.length,
      },
    };
  }

  /**
   * Generates a factual explanation for why a specific slot was allocated.
   */
  public static explainAllocation(
    blueprint: ExaminationBlueprint,
    slotSequence: number
  ): BlueprintAllocationExplanation {
    const slot = blueprint.slots.find((s) => s.sequence === slotSequence);
    if (!slot) {
      throw new Error(`Slot #${slotSequence} not found in blueprint "${blueprint.id}".`);
    }

    const chapAlloc = blueprint.coverageAllocation.chapters.find(
      (c) => c.chapterId === slot.chapterId
    );
    const topAlloc = chapAlloc?.topicAllocations.find(
      (t) => t.topicId === slot.topicId
    );

    return {
      slotSequence: slot.sequence,
      sectionName: slot.sectionName,
      marks: slot.marks,
      questionType: slot.questionType,
      difficulty: slot.targetDifficulty,
      cognitiveLevel: slot.cognitiveLevel,
      chapter: {
        id: slot.chapterId,
        title: slot.chapterTitle,
        reason: `Allocated based on ${chapAlloc?.targetWeightage || 10}% curriculum weightage in ${blueprint.syllabusTitle || "syllabus"}.`,
      },
      topic: {
        id: slot.topicId,
        title: slot.topicTitle,
        reason: `Selected as verified ELIGIBLE content under ${slot.chapterTitle}.`,
      },
      weightageEvidence: {
        curriculumWeightage: chapAlloc?.curriculumWeightage,
        patternFrequency: chapAlloc?.patternObservedWeightage,
        targetAllocationMarks: chapAlloc?.marks || slot.marks,
      },
      retrievalExpectation: `Retrieval query: "${slot.retrievalRequirements.topicId}" seeking [${slot.retrievalRequirements.knowledgeTypes.join(
        ", "
      )}] chunk types.`,
    };
  }

  /**
   * Generates default balanced 3-section structure for total marks.
   */
  private static createDefaultSections(
    blueprintId: string,
    totalMarks: number
  ): BlueprintSection[] {
    // Standard Board Pattern:
    // Section A: MCQs (approx 20% of marks, 1 mark each)
    // Section B: Short Questions (approx 50% of marks, 2-3 marks each)
    // Section C: Long Questions (approx 30% of marks, 5 marks each)

    const secAMarks = Math.max(5, Math.round(totalMarks * 0.20));
    const secCMarks = Math.max(5, Math.round(totalMarks * 0.30));
    const secBMarks = totalMarks - (secAMarks + secCMarks);

    const sec1: BlueprintSection = {
      id: `sec_${blueprintId}_1`,
      blueprintId,
      sectionName: "Section A (Objective)",
      sectionOrder: 1,
      questionCount: secAMarks,
      marksPerQuestion: 1,
      totalMarks: secAMarks,
      displayedMarks: secAMarks,
      attemptableMarks: secAMarks,
      maximumObtainableMarks: secAMarks,
      questionTypes: ["MCQ"],
      choiceRule: { type: "NO_CHOICE" },
      difficultyTarget: {
        easyCount: Math.ceil(secAMarks * 0.5),
        mediumCount: Math.floor(secAMarks * 0.35),
        difficultCount: secAMarks - Math.ceil(secAMarks * 0.5) - Math.floor(secAMarks * 0.35),
      },
      instructions: "Attempt all questions. Each carries 1 mark.",
      responseFormat: "OMR / Single Answer",
    };

    const qCountB = Math.max(2, Math.floor(secBMarks / 2));
    const marksPerQB = Number((secBMarks / qCountB).toFixed(0)) || 2;
    const actualTotalB = qCountB * marksPerQB;

    const sec2: BlueprintSection = {
      id: `sec_${blueprintId}_2`,
      blueprintId,
      sectionName: "Section B (Short Answer Questions)",
      sectionOrder: 2,
      questionCount: qCountB,
      marksPerQuestion: marksPerQB,
      totalMarks: actualTotalB,
      displayedMarks: actualTotalB,
      attemptableMarks: actualTotalB,
      maximumObtainableMarks: actualTotalB,
      questionTypes: ["SHORT", "CONCEPTUAL"],
      choiceRule: { type: "NO_CHOICE" },
      difficultyTarget: {
        easyCount: Math.floor(qCountB * 0.33),
        mediumCount: Math.ceil(qCountB * 0.34),
        difficultCount: qCountB - Math.floor(qCountB * 0.33) - Math.ceil(qCountB * 0.34),
      },
      instructions: "Answer concisely in 3-5 lines.",
      responseFormat: "Brief Written Response",
    };

    const remainingForC = totalMarks - (secAMarks + actualTotalB);
    const marksPerQC = 5;
    const qCountC = Math.max(1, Math.round(remainingForC / marksPerQC));
    const actualTotalC = remainingForC; // Adjust to guarantee exact sum

    const sec3: BlueprintSection = {
      id: `sec_${blueprintId}_3`,
      blueprintId,
      sectionName: "Section C (Long / Descriptive Questions)",
      sectionOrder: 3,
      questionCount: qCountC,
      marksPerQuestion: Math.max(1, Math.floor(actualTotalC / qCountC)),
      totalMarks: actualTotalC,
      displayedMarks: actualTotalC,
      attemptableMarks: actualTotalC,
      maximumObtainableMarks: actualTotalC,
      questionTypes: ["LONG", "NUMERICAL", "DERIVATION"],
      choiceRule: { type: "NO_CHOICE" },
      difficultyTarget: {
        easyCount: Math.floor(qCountC * 0.2),
        mediumCount: Math.ceil(qCountC * 0.4),
        difficultCount: qCountC - Math.floor(qCountC * 0.2) - Math.ceil(qCountC * 0.4),
      },
      instructions: "Detailed step-by-step mathematical answers required.",
      responseFormat: "Extended Solution",
    };

    return [sec1, sec2, sec3];
  }
}

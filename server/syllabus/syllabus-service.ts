import { prisma } from "@/lib/db";
import {
  SyllabusDTO,
  SyllabusValidationReport,
  SyllabusStatus,
  AlignmentStatus,
  EligibilityStatus,
  VerificationStatus,
  SyllabusGranularItemDTO,
} from "@/types/syllabus";
import {
  CreateSyllabusInput,
  AlignmentReviewInput,
  SyllabusGranularItemInput,
} from "@/lib/validations/syllabus";
import { AuditLogger } from "@/server/audit-logger";

export class SyllabusService {
  /**
   * Creates a new Syllabus version.
   * Guarantees that existing syllabus versions are never silently overwritten.
   */
  public static async createSyllabus(data: CreateSyllabusInput): Promise<SyllabusDTO> {
    // 1. Check for duplicate version to prevent silent overwriting
    const existing = await prisma.syllabus.findUnique({
      where: {
        subjectId_academicYearId_version: {
          subjectId: data.subjectId,
          academicYearId: data.academicYearId,
          version: data.version,
        },
      },
    });

    if (existing) {
      throw new Error(
        `Duplicate Syllabus Version: Version "${data.version}" already exists for this subject and academic year (ID: ${existing.id}). Existing versions cannot be overwritten.`
      );
    }

    // 2. Prevent labeling admin-entered information as officially verified without explicit verification
    let verificationStatus = data.verificationStatus || "UNVERIFIED";
    if (data.sourceType === "ADMIN_ENTRY" && verificationStatus === "VERIFIED" && !data.verifiedBy) {
      verificationStatus = "UNVERIFIED";
    }

    const syllabus = await prisma.syllabus.create({
      data: {
        title: data.title,
        version: data.version,
        description: data.description,
        boardId: data.boardId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        subjectId: data.subjectId,
        status: data.status || "DRAFT",
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        sourceTitle: data.sourceTitle,
        sourceReference: data.sourceReference,
        sourcePage: data.sourcePage,
        sourceUrl: data.sourceUrl,
        sourceType: data.sourceType || "ADMIN_ENTRY",
        verificationStatus,
        verifiedBy: data.verifiedBy,
        verifiedAt: verificationStatus === "VERIFIED" ? new Date() : null,
        verificationNotes: data.verificationNotes,
        chapterItems: data.chapterItems
          ? {
              create: data.chapterItems.map((ci) => ({
                chapterId: ci.chapterId,
                isIncluded: ci.isIncluded ?? true,
                weightage: ci.weightage,
                examinationRelevance: ci.examinationRelevance || "HIGH",
                alignmentStatus: ci.alignmentStatus || "UNMATCHED",
                confidence: ci.confidence ?? 1.0,
                eligibility: ci.eligibility || "ELIGIBLE",
                notes: ci.notes,
              })),
            }
          : undefined,
        topicItems: data.topicItems
          ? {
              create: data.topicItems.map((ti) => {
                if (ti.granularItems && ti.granularItems.length > 0) {
                  const seenCoordinates = new Set<string>();
                  for (const gi of ti.granularItems) {
                    const coordKey = `${gi.scope}:${gi.identifier.trim().toLowerCase()}`;
                    if (seenCoordinates.has(coordKey)) {
                      throw new Error(
                        `Duplicate Granular Item: Scope "${gi.scope}" with identifier "${gi.identifier}" is repeated under topic "${ti.topicId}".`
                      );
                    }
                    seenCoordinates.add(coordKey);
                  }
                }

                return {
                  topicId: ti.topicId,
                  isIncluded: ti.isIncluded ?? true,
                  weightage: ti.weightage,
                  examinationRelevance: ti.examinationRelevance || "HIGH",
                  alignmentStatus: ti.alignmentStatus || "UNMATCHED",
                  confidence: ti.confidence ?? 1.0,
                  eligibility: ti.eligibility || "ELIGIBLE",
                  notes: ti.notes,
                  granularItems:
                    ti.granularItems && ti.granularItems.length > 0
                      ? {
                          create: ti.granularItems.map((gi) => {
                            let granularVerification: VerificationStatus =
                              (gi.verificationStatus as VerificationStatus) || "UNVERIFIED";
                            if (granularVerification === "VERIFIED") {
                              const hasEvidence = Boolean(
                                (gi.verifiedBy || data.verifiedBy) &&
                                (gi.sourceDocument || gi.sourceReference || gi.sourcePage)
                              );
                              if (!hasEvidence) {
                                granularVerification = "UNVERIFIED";
                              }
                            }

                            const eligibility =
                              gi.eligibility || (gi.isIncluded ? "ELIGIBLE" : "EXCLUDED");

                            return {
                              scope: gi.scope,
                              identifier: gi.identifier,
                              title: gi.title || null,
                              isIncluded: gi.isIncluded,
                              eligibility,
                              sourceDocument: gi.sourceDocument || null,
                              sourcePage: gi.sourcePage || null,
                              sourceReference: gi.sourceReference || null,
                              effectiveDate: gi.effectiveDate ? new Date(gi.effectiveDate) : null,
                              verificationStatus: granularVerification,
                              verifiedBy:
                                granularVerification === "VERIFIED"
                                  ? gi.verifiedBy || data.verifiedBy || null
                                  : null,
                              verificationNotes: gi.verificationNotes || gi.notes || null,
                            };
                          }),
                        }
                      : undefined,
                };
              }),
            }
          : undefined,
      },
      include: {
        board: true,
        academicYear: true,
        class: true,
        subject: true,
        _count: {
          select: {
            chapterItems: true,
            topicItems: true,
          },
        },
      },
    });

    return this.mapToDTO(syllabus);
  }

  /**
   * Retrieves syllabus details by ID.
   */
  public static async getSyllabusById(id: string): Promise<SyllabusDTO> {
    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      include: {
        board: true,
        academicYear: true,
        class: true,
        subject: true,
        _count: {
          select: {
            chapterItems: true,
            topicItems: true,
          },
        },
      },
    });

    if (!syllabus) {
      throw new Error(`Syllabus with ID "${id}" was not found.`);
    }

    return this.mapToDTO(syllabus);
  }

  /**
   * Publishes a syllabus. Only administrators may publish.
   */
  public static async publishSyllabus(
    id: string,
    userRole: string,
    actorId?: string
  ): Promise<SyllabusDTO> {
    if (userRole !== "ADMIN") {
      throw new Error("Unauthorized: Only administrators can publish syllabus versions.");
    }

    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      include: {
        chapterItems: true,
        topicItems: true,
      },
    });

    if (!syllabus) {
      throw new Error(`Syllabus with ID "${id}" not found.`);
    }

    if (syllabus.status === "ARCHIVED") {
      throw new Error("Cannot publish an ARCHIVED syllabus. Restore or create a new version.");
    }

    if (syllabus.verificationStatus === "REJECTED") {
      throw new Error("Cannot publish a REJECTED syllabus.");
    }

    // Meaningful official provenance check before publishing
    const hasSource = Boolean(
      (syllabus.sourceTitle && syllabus.sourceTitle.trim().length > 0) ||
      (syllabus.sourceReference && syllabus.sourceReference.trim().length > 0) ||
      (syllabus.sourceUrl && syllabus.sourceUrl.trim().length > 0)
    );

    if (!hasSource) {
      throw new Error(
        "Cannot publish syllabus: Official source provenance is strictly required. A source-less syllabus cannot become PUBLISHED or VERIFIED. Provide sourceTitle, sourceReference, or sourceUrl."
      );
    }

    const updated = await prisma.syllabus.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: actorId || "ADMIN",
      },
      include: {
        board: true,
        academicYear: true,
        class: true,
        subject: true,
        _count: {
          select: {
            chapterItems: true,
            topicItems: true,
          },
        },
      },
    });

    // Record audit entry
    await prisma.syllabusAlignmentAudit.create({
      data: {
        syllabusId: id,
        itemId: id,
        itemType: "SYLLABUS",
        reviewerId: actorId,
        decision: "PUBLISHED",
        previousState: { status: syllabus.status },
        newState: { status: "PUBLISHED" },
        notes: `Syllabus version "${syllabus.version}" officially published.`,
      },
    });

    return this.mapToDTO(updated);
  }

  /**
   * Archives a syllabus. Only administrators may archive.
   */
  public static async archiveSyllabus(
    id: string,
    userRole: string,
    actorId?: string
  ): Promise<SyllabusDTO> {
    if (userRole !== "ADMIN") {
      throw new Error("Unauthorized: Only administrators can archive syllabus versions.");
    }

    const syllabus = await prisma.syllabus.findUnique({ where: { id } });
    if (!syllabus) {
      throw new Error(`Syllabus with ID "${id}" not found.`);
    }

    const updated = await prisma.syllabus.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: {
        board: true,
        academicYear: true,
        class: true,
        subject: true,
        _count: {
          select: {
            chapterItems: true,
            topicItems: true,
          },
        },
      },
    });

    await prisma.syllabusAlignmentAudit.create({
      data: {
        syllabusId: id,
        itemId: id,
        itemType: "SYLLABUS",
        reviewerId: actorId,
        decision: "ARCHIVED",
        previousState: { status: syllabus.status },
        newState: { status: "ARCHIVED" },
        notes: `Syllabus version "${syllabus.version}" archived.`,
      },
    });

    return this.mapToDTO(updated);
  }

  /**
   * Reviews and confirms, rejects, or modifies an alignment decision.
   */
  public static async reviewAlignment(
    syllabusId: string,
    input: AlignmentReviewInput,
    userRole: string
  ) {
    if (userRole !== "ADMIN" && userRole !== "TEACHER") {
      throw new Error("Unauthorized: Reviewing curriculum alignments requires ADMIN or TEACHER role.");
    }

    let previousState: any = null;
    let newState: any = null;

    if (input.itemType === "CHAPTER") {
      const item = await prisma.syllabusChapterItem.findUnique({
        where: { id: input.itemId },
      });
      if (!item) throw new Error(`Syllabus chapter item "${input.itemId}" not found.`);

      previousState = {
        alignmentStatus: item.alignmentStatus,
        isIncluded: item.isIncluded,
        weightage: item.weightage,
        eligibility: item.eligibility,
      };

      let newAlignmentStatus: AlignmentStatus = item.alignmentStatus;
      let newEligibility: EligibilityStatus = item.eligibility;

      if (input.decision === "CONFIRMED") {
        newAlignmentStatus = "MATCHED";
        newEligibility = (input.isIncluded ?? item.isIncluded) ? "ELIGIBLE" : "EXCLUDED";
      } else if (input.decision === "REJECTED") {
        newAlignmentStatus = "UNMATCHED";
        newEligibility = "EXCLUDED";
      } else if (input.decision === "MODIFIED") {
        newAlignmentStatus = "MATCHED";
        newEligibility = (input.isIncluded ?? item.isIncluded) ? "ELIGIBLE" : "EXCLUDED";
      }

      await prisma.syllabusChapterItem.update({
        where: { id: input.itemId },
        data: {
          alignmentStatus: newAlignmentStatus,
          isIncluded: input.isIncluded !== undefined ? input.isIncluded : item.isIncluded,
          weightage: input.weightage !== undefined ? input.weightage : item.weightage,
          eligibility: newEligibility,
          confidence: input.decision === "CONFIRMED" ? 1.0 : item.confidence,
          reviewNotes: input.notes,
          reviewedBy: input.reviewerId || input.reviewerName || "ADMIN",
          reviewedAt: new Date(),
        },
      });

      newState = {
        alignmentStatus: newAlignmentStatus,
        isIncluded: input.isIncluded ?? item.isIncluded,
        weightage: input.weightage ?? item.weightage,
        eligibility: newEligibility,
      };
    } else {
      // TOPIC
      const item = await prisma.syllabusTopicItem.findUnique({
        where: { id: input.itemId },
      });
      if (!item) throw new Error(`Syllabus topic item "${input.itemId}" not found.`);

      previousState = {
        alignmentStatus: item.alignmentStatus,
        isIncluded: item.isIncluded,
        weightage: item.weightage,
        eligibility: item.eligibility,
      };

      let newAlignmentStatus: AlignmentStatus = item.alignmentStatus;
      let newEligibility: EligibilityStatus = item.eligibility;

      if (input.decision === "CONFIRMED") {
        newAlignmentStatus = "MATCHED";
        newEligibility = (input.isIncluded ?? item.isIncluded) ? "ELIGIBLE" : "EXCLUDED";
      } else if (input.decision === "REJECTED") {
        newAlignmentStatus = "UNMATCHED";
        newEligibility = "EXCLUDED";
      } else if (input.decision === "MODIFIED") {
        newAlignmentStatus = "MATCHED";
        newEligibility = (input.isIncluded ?? item.isIncluded) ? "ELIGIBLE" : "EXCLUDED";
      }

      await prisma.syllabusTopicItem.update({
        where: { id: input.itemId },
        data: {
          alignmentStatus: newAlignmentStatus,
          isIncluded: input.isIncluded !== undefined ? input.isIncluded : item.isIncluded,
          weightage: input.weightage !== undefined ? input.weightage : item.weightage,
          eligibility: newEligibility,
          confidence: input.decision === "CONFIRMED" ? 1.0 : item.confidence,
          reviewNotes: input.notes,
          reviewedBy: input.reviewerId || input.reviewerName || "ADMIN",
          reviewedAt: new Date(),
        },
      });

      newState = {
        alignmentStatus: newAlignmentStatus,
        isIncluded: input.isIncluded ?? item.isIncluded,
        weightage: input.weightage ?? item.weightage,
        eligibility: newEligibility,
      };
    }

    // Persist audit trail
    await prisma.syllabusAlignmentAudit.create({
      data: {
        syllabusId,
        itemId: input.itemId,
        itemType: input.itemType,
        reviewerId: input.reviewerId,
        reviewerName: input.reviewerName || "Reviewer",
        decision: input.decision,
        previousState,
        newState,
        notes: input.notes,
      },
    });

    return { success: true, itemId: input.itemId, decision: input.decision, newState };
  }

  /**
   * Generates a comprehensive validation report for a syllabus version based on actual stored records.
   */
  public static async getValidationReport(id: string): Promise<SyllabusValidationReport> {
    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      include: {
        chapterItems: true,
        topicItems: true,
      },
    });

    if (!syllabus) {
      throw new Error(`Syllabus with ID "${id}" was not found.`);
    }

    const totalChapters = syllabus.chapterItems.length;
    const matchedChapters = syllabus.chapterItems.filter((c) => c.alignmentStatus === "MATCHED").length;
    const unmatchedChapters = syllabus.chapterItems.filter((c) => c.alignmentStatus === "UNMATCHED").length;
    const excludedChapters = syllabus.chapterItems.filter((c) => !c.isIncluded).length;
    const reviewRequiredChapters = syllabus.chapterItems.filter(
      (c) => c.alignmentStatus === "REQUIRES_REVIEW"
    ).length;

    const totalTopics = syllabus.topicItems.length;
    const matchedTopics = syllabus.topicItems.filter((t) => t.alignmentStatus === "MATCHED").length;
    const unmatchedTopics = syllabus.topicItems.filter((t) => t.alignmentStatus === "UNMATCHED").length;
    const excludedTopics = syllabus.topicItems.filter((t) => !t.isIncluded).length;
    const reviewRequiredTopics = syllabus.topicItems.filter(
      (t) => t.alignmentStatus === "REQUIRES_REVIEW"
    ).length;

    const matchedTotal = matchedChapters + matchedTopics;
    const grandTotal = totalChapters + totalTopics;
    const coveragePct =
      grandTotal > 0 ? Number(((matchedTotal / grandTotal) * 100).toFixed(1)) : 100;

    const issues: string[] = [];
    if (syllabus.status !== "PUBLISHED" && syllabus.status !== "VERIFIED") {
      issues.push(
        `Syllabus is in status "${syllabus.status}". Must be VERIFIED or PUBLISHED for production examination generation.`
      );
    }
    if (reviewRequiredChapters > 0 || reviewRequiredTopics > 0) {
      issues.push(
        `${reviewRequiredChapters} chapter(s) and ${reviewRequiredTopics} topic(s) require manual administrator review.`
      );
    }
    if (unmatchedChapters > 0 || unmatchedTopics > 0) {
      issues.push(
        `${unmatchedChapters} chapter(s) and ${unmatchedTopics} topic(s) remain unmatched to textbook content.`
      );
    }

    const isValidForExamGeneration =
      (syllabus.status === "VERIFIED" || syllabus.status === "PUBLISHED") &&
      reviewRequiredChapters === 0 &&
      reviewRequiredTopics === 0 &&
      coveragePct >= 75;

    return {
      syllabusId: syllabus.id,
      title: syllabus.title,
      version: syllabus.version,
      status: syllabus.status,
      isValidForExamGeneration,
      totalChapters,
      matchedChapters,
      unmatchedChapters,
      excludedChapters,
      reviewRequiredChapters,
      totalTopics,
      matchedTopics,
      unmatchedTopics,
      excludedTopics,
      reviewRequiredTopics,
      coveragePct,
      issues,
    };
  }

  /**
   * Adds an official granular item (SUBTOPIC, HEADING, EXERCISE_QUESTION) under a topic item.
   * Enforces administrative authorization, provenance preservation, and audit logging.
   */
  public static async addGranularItem(
    syllabusId: string,
    topicItemId: string,
    input: SyllabusGranularItemInput,
    userRole: string,
    actorId?: string,
    actorName?: string
  ): Promise<SyllabusGranularItemDTO> {
    if (userRole !== "ADMIN" && userRole !== "CURRICULUM_OFFICER") {
      throw new Error("Unauthorized: Adding granular syllabus items requires ADMIN or CURRICULUM_OFFICER role.");
    }

    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
    });
    if (!syllabus) {
      throw new Error(`Syllabus with ID "${syllabusId}" not found.`);
    }

    const topicItem = await prisma.syllabusTopicItem.findUnique({
      where: { id: topicItemId },
    });
    if (!topicItem) {
      throw new Error(`Syllabus topic item with ID "${topicItemId}" not found.`);
    }

    if (topicItem.syllabusId !== syllabusId) {
      throw new Error(`Topic item "${topicItemId}" does not belong to syllabus "${syllabusId}".`);
    }

    // Check for duplicate (syllabusTopicItemId, scope, identifier)
    const existing = await prisma.syllabusGranularItem.findUnique({
      where: {
        syllabusTopicItemId_scope_identifier: {
          syllabusTopicItemId: topicItemId,
          scope: input.scope,
          identifier: input.identifier,
        },
      },
    });

    if (existing) {
      throw new Error(
        `Duplicate Granular Item: A granular item with scope "${input.scope}" and identifier "${input.identifier}" already exists under topic item "${topicItemId}".`
      );
    }

    // Enforce provenance requirements for verification status
    let verificationStatus: VerificationStatus =
      (input.verificationStatus as VerificationStatus) || "UNVERIFIED";
    if (verificationStatus === "VERIFIED") {
      const hasEvidence = Boolean(
        (input.verifiedBy || actorId) &&
        (input.sourceDocument || input.sourceReference || input.sourcePage)
      );
      if (!hasEvidence) {
        verificationStatus = "UNVERIFIED";
      }
    }

    const eligibility: EligibilityStatus =
      input.eligibility || (input.isIncluded ? "ELIGIBLE" : "EXCLUDED");

    const granularItem = await prisma.syllabusGranularItem.create({
      data: {
        syllabusTopicItemId: topicItemId,
        scope: input.scope,
        identifier: input.identifier,
        title: input.title || null,
        isIncluded: input.isIncluded,
        eligibility,
        sourceDocument: input.sourceDocument || null,
        sourcePage: input.sourcePage || null,
        sourceReference: input.sourceReference || null,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        verificationStatus,
        verifiedBy: verificationStatus === "VERIFIED" ? (input.verifiedBy || actorId || null) : null,
        verificationNotes: input.verificationNotes || input.notes || null,
      },
    });

    // Record audit entry in SyllabusAlignmentAudit
    await prisma.syllabusAlignmentAudit.create({
      data: {
        syllabusId,
        itemId: granularItem.id,
        itemType: "GRANULAR_ITEM",
        reviewerId: actorId,
        reviewerName: actorName || "Curriculum Administrator",
        decision: input.isIncluded ? "GRANULAR_INCLUDED" : "GRANULAR_EXCLUDED",
        previousState: undefined,
        newState: {
          id: granularItem.id,
          syllabusTopicItemId: topicItemId,
          scope: granularItem.scope,
          identifier: granularItem.identifier,
          title: granularItem.title,
          isIncluded: granularItem.isIncluded,
          eligibility: granularItem.eligibility,
          verificationStatus: granularItem.verificationStatus,
          sourceDocument: granularItem.sourceDocument,
          sourceReference: granularItem.sourceReference,
        },
        notes:
          input.verificationNotes ||
          input.notes ||
          `Granular ${granularItem.scope} "${granularItem.identifier}" created (${granularItem.isIncluded ? "INCLUDED" : "EXCLUDED"}).`,
      },
    });

    // Also record in general AuditLogger
    await AuditLogger.log({
      userId: actorId,
      action: "GRANULAR_SYLLABUS_ITEM_CREATED",
      resource: "SyllabusGranularItem",
      resourceId: granularItem.id,
      metadata: {
        syllabusId,
        topicItemId,
        scope: granularItem.scope,
        identifier: granularItem.identifier,
        isIncluded: granularItem.isIncluded,
        eligibility: granularItem.eligibility,
        verificationStatus: granularItem.verificationStatus,
      },
    });

    return {
      id: granularItem.id,
      syllabusTopicItemId: granularItem.syllabusTopicItemId,
      scope: granularItem.scope,
      identifier: granularItem.identifier,
      title: granularItem.title,
      isIncluded: granularItem.isIncluded,
      eligibility: granularItem.eligibility,
      sourceDocument: granularItem.sourceDocument,
      sourcePage: granularItem.sourcePage,
      sourceReference: granularItem.sourceReference,
      effectiveDate: granularItem.effectiveDate?.toISOString() || null,
      verificationStatus: granularItem.verificationStatus,
      verifiedBy: granularItem.verifiedBy,
      verificationNotes: granularItem.verificationNotes,
      createdAt: granularItem.createdAt ? new Date(granularItem.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Retrieves granular items registered under a topic item.
   */
  public static async getGranularItemsByTopic(
    syllabusId: string,
    topicItemId: string
  ): Promise<SyllabusGranularItemDTO[]> {
    const topicItem = await prisma.syllabusTopicItem.findUnique({
      where: { id: topicItemId },
    });
    if (!topicItem) {
      throw new Error(`Syllabus topic item with ID "${topicItemId}" not found.`);
    }
    if (topicItem.syllabusId !== syllabusId) {
      throw new Error(`Topic item "${topicItemId}" does not belong to syllabus "${syllabusId}".`);
    }

    const items = await prisma.syllabusGranularItem.findMany({
      where: { syllabusTopicItemId: topicItemId },
      orderBy: [{ scope: "asc" }, { identifier: "asc" }],
    });

    return items.map((g) => ({
      id: g.id,
      syllabusTopicItemId: g.syllabusTopicItemId,
      scope: g.scope,
      identifier: g.identifier,
      title: g.title,
      isIncluded: g.isIncluded,
      eligibility: g.eligibility,
      sourceDocument: g.sourceDocument,
      sourcePage: g.sourcePage,
      sourceReference: g.sourceReference,
      effectiveDate: g.effectiveDate ? new Date(g.effectiveDate).toISOString() : null,
      verificationStatus: g.verificationStatus,
      verifiedBy: g.verifiedBy,
      verificationNotes: g.verificationNotes,
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : new Date().toISOString(),
    }));
  }

  private static mapToDTO(s: any): SyllabusDTO {
    return {
      id: s.id,
      title: s.title,
      version: s.version,
      description: s.description,
      boardId: s.boardId,
      boardName: s.board?.name || null,
      academicYearId: s.academicYearId,
      academicYearName: s.academicYear?.name || null,
      classId: s.classId,
      className: s.class?.name || null,
      subjectId: s.subjectId,
      subjectName: s.subject?.name || null,
      status: s.status as SyllabusStatus,
      effectiveDate: s.effectiveDate?.toISOString() || null,
      provenance: {
        sourceTitle: s.sourceTitle,
        sourceReference: s.sourceReference,
        sourcePage: s.sourcePage,
        sourceUrl: s.sourceUrl,
        sourceType: s.sourceType,
        verificationStatus: s.verificationStatus,
        verifiedAt: s.verifiedAt?.toISOString() || null,
        verifiedBy: s.verifiedBy,
        verificationNotes: s.verificationNotes,
      },
      chapterCount: s._count?.chapterItems || 0,
      topicCount: s._count?.topicItems || 0,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}

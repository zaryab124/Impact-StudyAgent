import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SyllabusService } from "@/server/syllabus/syllabus-service";
import { POST as postGranular, GET as getGranular } from "@/app/api/syllabus/[id]/topics/[topicItemId]/granular/route";
import { POST as publishSyllabus } from "@/app/api/syllabus/[id]/publish/route";
import { AuditLogger } from "@/server/audit-logger";

describe("Granular Syllabus Item Onboarding & Persistence (Step 9 Requirements A–L)", () => {
  const mockSyllabusId = "syl-00000000-0000-0000-0000-000000000001";
  const mockTopicItemId = "topitem-0000-0000-0000-000000000001";
  const mockTopicId = "topic-0000-0000-0000-000000000001";
  const mockSubjectId = "sub-0000-0000-0000-000000000001";
  const mockYearId = "yr-0000-0000-0000-000000000001";
  const mockClassId = "cls-0000-0000-0000-000000000001";

  beforeEach(() => {
    vi.restoreAllMocks();
    AuditLogger.resetMemory();
  });

  // --------------------------------------------------------------------------
  // A. createSyllabus with nested granularItems persists them
  // --------------------------------------------------------------------------
  it("A. createSyllabus with nested granularItems persists them into database", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue(null);
    let capturedCreateData: any = null;

    vi.spyOn(prisma.syllabus, "create").mockImplementation(((args: any) => {
      capturedCreateData = args.data;
      return Promise.resolve({
        id: mockSyllabusId,
        title: "Grade 9 Physics with Granular ALP",
        version: "2025-v1",
        academicYearId: mockYearId,
        classId: mockClassId,
        subjectId: mockSubjectId,
        status: "DRAFT",
        sourceType: "OFFICIAL_PDF",
        sourceTitle: "PCTB Accelerated Learning Program 2025",
        verificationStatus: "UNVERIFIED",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { chapterItems: 1, topicItems: 1 },
      } as any);
    }) as any);

    const result = await SyllabusService.createSyllabus({
      title: "Grade 9 Physics with Granular ALP",
      version: "2025-v1",
      academicYearId: mockYearId,
      classId: mockClassId,
      subjectId: mockSubjectId,
      sourceTitle: "PCTB Accelerated Learning Program 2025",
      sourceType: "OFFICIAL_PDF",
      topicItems: [
        {
          topicId: mockTopicId,
          isIncluded: true,
          granularItems: [
            {
              scope: "SUBTOPIC",
              identifier: "3.1.2",
              title: "Atwood Machine Derivation",
              isIncluded: false,
              eligibility: "EXCLUDED",
              sourceDocument: "ALP_Physics_2025.pdf",
              sourcePage: 14,
              sourceReference: "Notification No. 892-PCTB",
              verificationStatus: "VERIFIED",
              verifiedBy: "curriculum-officer-1",
            },
            {
              scope: "EXERCISE_QUESTION",
              identifier: "Problem 3.4",
              title: "Numerical on Friction",
              isIncluded: false,
              eligibility: "EXCLUDED",
              sourceDocument: "ALP_Physics_2025.pdf",
              sourcePage: 16,
              sourceReference: "Notification No. 892-PCTB",
            },
          ],
        },
      ],
    });

    expect(result.id).toBe(mockSyllabusId);
    expect(capturedCreateData).toBeDefined();
    expect(capturedCreateData.topicItems.create).toHaveLength(1);

    const createdTopicItem = capturedCreateData.topicItems.create[0];
    expect(createdTopicItem.granularItems).toBeDefined();
    expect(createdTopicItem.granularItems.create).toHaveLength(2);

    const item1 = createdTopicItem.granularItems.create[0];
    expect(item1.scope).toBe("SUBTOPIC");
    expect(item1.identifier).toBe("3.1.2");
    expect(item1.isIncluded).toBe(false);
    expect(item1.eligibility).toBe("EXCLUDED");
    expect(item1.sourceDocument).toBe("ALP_Physics_2025.pdf");
    expect(item1.sourcePage).toBe(14);
    expect(item1.sourceReference).toBe("Notification No. 892-PCTB");
    expect(item1.verificationStatus).toBe("VERIFIED");
    expect(item1.verifiedBy).toBe("curriculum-officer-1");

    const item2 = createdTopicItem.granularItems.create[1];
    expect(item2.scope).toBe("EXERCISE_QUESTION");
    expect(item2.identifier).toBe("Problem 3.4");
    expect(item2.isIncluded).toBe(false);
    expect(item2.eligibility).toBe("EXCLUDED");
    expect(item2.verificationStatus).toBe("UNVERIFIED");
  });

  // --------------------------------------------------------------------------
  // B. missing granularItems preserves legacy behavior
  // --------------------------------------------------------------------------
  it("B. createSyllabus with missing granularItems preserves legacy behavior", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue(null);
    let capturedCreateData: any = null;

    vi.spyOn(prisma.syllabus, "create").mockImplementation(((args: any) => {
      capturedCreateData = args.data;
      return Promise.resolve({
        id: mockSyllabusId,
        title: "Standard Syllabus",
        version: "2025-standard",
        academicYearId: mockYearId,
        classId: mockClassId,
        subjectId: mockSubjectId,
        status: "DRAFT",
        sourceType: "ADMIN_ENTRY",
        verificationStatus: "UNVERIFIED",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { chapterItems: 1, topicItems: 1 },
      } as any);
    }) as any);

    const result = await SyllabusService.createSyllabus({
      title: "Standard Syllabus",
      version: "2025-standard",
      academicYearId: mockYearId,
      classId: mockClassId,
      subjectId: mockSubjectId,
      topicItems: [
        {
          topicId: mockTopicId,
          isIncluded: true,
          // No granularItems supplied
        },
      ],
    });

    expect(result.id).toBe(mockSyllabusId);
    expect(capturedCreateData.topicItems.create[0].granularItems).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // C. valid granular item can be created through the new admin endpoint
  // --------------------------------------------------------------------------
  it("C. valid granular item can be created through POST /api/syllabus/[id]/topics/[topicItemId]/granular", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({ id: mockSyllabusId } as any);
    vi.spyOn(prisma.syllabusTopicItem, "findUnique").mockResolvedValue({
      id: mockTopicItemId,
      syllabusId: mockSyllabusId,
    } as any);
    vi.spyOn(prisma.syllabusGranularItem, "findUnique").mockResolvedValue(null);

    const mockCreated = {
      id: "gran-001",
      syllabusTopicItemId: mockTopicItemId,
      scope: "HEADING" as const,
      identifier: "3.2.1",
      title: "Uniform Circular Motion",
      isIncluded: false,
      eligibility: "EXCLUDED" as const,
      sourceDocument: "Federal_Notification_2025.pdf",
      sourcePage: 12,
      sourceReference: "F.2-1/2025",
      effectiveDate: new Date("2025-04-01T00:00:00.000Z"),
      verificationStatus: "VERIFIED" as const,
      verifiedBy: "curriculum-admin",
      verificationNotes: "Explicitly deleted per federal notification.",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.spyOn(prisma.syllabusGranularItem, "create").mockResolvedValue(mockCreated as any);
    vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockResolvedValue({} as any);

    const req = new NextRequest(
      `http://localhost:3000/api/syllabus/${mockSyllabusId}/topics/${mockTopicItemId}/granular`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-role": "ADMIN",
          "x-user-id": "curriculum-admin",
        },
        body: JSON.stringify({
          scope: "HEADING",
          identifier: "3.2.1",
          title: "Uniform Circular Motion",
          isIncluded: false,
          eligibility: "EXCLUDED",
          sourceDocument: "Federal_Notification_2025.pdf",
          sourcePage: 12,
          sourceReference: "F.2-1/2025",
          effectiveDate: "2025-04-01T00:00:00.000Z",
          verificationStatus: "VERIFIED",
          verifiedBy: "curriculum-admin",
          verificationNotes: "Explicitly deleted per federal notification.",
        }),
      }
    );

    const res = await postGranular(req, {
      params: Promise.resolve({ id: mockSyllabusId, topicItemId: mockTopicItemId }),
    });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("gran-001");
    expect(json.data.scope).toBe("HEADING");
    expect(json.data.identifier).toBe("3.2.1");
    expect(json.data.isIncluded).toBe(false);
    expect(json.data.eligibility).toBe("EXCLUDED");
  });

  // --------------------------------------------------------------------------
  // D. invalid scope is rejected
  // --------------------------------------------------------------------------
  it("D. invalid scope is rejected with 400 VALIDATION_ERROR", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/syllabus/${mockSyllabusId}/topics/${mockTopicItemId}/granular`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify({
          scope: "PAGE_RANGE", // Not allowed; approved scopes are SUBTOPIC, HEADING, EXERCISE_QUESTION
          identifier: "pages 40-45",
          isIncluded: false,
        }),
      }
    );

    const res = await postGranular(req, {
      params: Promise.resolve({ id: mockSyllabusId, topicItemId: mockTopicItemId }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  // --------------------------------------------------------------------------
  // E. missing required granular fields are rejected
  // --------------------------------------------------------------------------
  it("E. missing required granular fields are rejected with 400 VALIDATION_ERROR", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/syllabus/${mockSyllabusId}/topics/${mockTopicItemId}/granular`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify({
          scope: "SUBTOPIC",
          // identifier and isIncluded omitted
        }),
      }
    );

    const res = await postGranular(req, {
      params: Promise.resolve({ id: mockSyllabusId, topicItemId: mockTopicItemId }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  // --------------------------------------------------------------------------
  // F. topicItemId belonging to another syllabus is rejected
  // --------------------------------------------------------------------------
  it("F. topicItemId belonging to another syllabus is rejected with 400 INVALID_HIERARCHY", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({ id: mockSyllabusId } as any);
    vi.spyOn(prisma.syllabusTopicItem, "findUnique").mockResolvedValue({
      id: mockTopicItemId,
      syllabusId: "another-different-syllabus-id", // Mismatch!
    } as any);

    const req = new NextRequest(
      `http://localhost:3000/api/syllabus/${mockSyllabusId}/topics/${mockTopicItemId}/granular`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify({
          scope: "SUBTOPIC",
          identifier: "1.1.1",
          isIncluded: false,
        }),
      }
    );

    const res = await postGranular(req, {
      params: Promise.resolve({ id: mockSyllabusId, topicItemId: mockTopicItemId }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_HIERARCHY");
    expect(json.error.message).toContain("does not belong to syllabus");
  });

  // --------------------------------------------------------------------------
  // G. duplicate granular coordinate is rejected
  // --------------------------------------------------------------------------
  it("G. duplicate granular coordinate is rejected with 409 DUPLICATE_ITEM", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({ id: mockSyllabusId } as any);
    vi.spyOn(prisma.syllabusTopicItem, "findUnique").mockResolvedValue({
      id: mockTopicItemId,
      syllabusId: mockSyllabusId,
    } as any);
    vi.spyOn(prisma.syllabusGranularItem, "findUnique").mockResolvedValue({
      id: "existing-gran-item",
      scope: "SUBTOPIC",
      identifier: "1.2.3",
    } as any);

    const req = new NextRequest(
      `http://localhost:3000/api/syllabus/${mockSyllabusId}/topics/${mockTopicItemId}/granular`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify({
          scope: "SUBTOPIC",
          identifier: "1.2.3",
          isIncluded: false,
        }),
      }
    );

    const res = await postGranular(req, {
      params: Promise.resolve({ id: mockSyllabusId, topicItemId: mockTopicItemId }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("DUPLICATE_ITEM");
    expect(json.error.message).toContain("already exists");
  });

  // --------------------------------------------------------------------------
  // H. provenance is preserved
  // --------------------------------------------------------------------------
  it("H. provenance fields are completely preserved in database and response", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({ id: mockSyllabusId } as any);
    vi.spyOn(prisma.syllabusTopicItem, "findUnique").mockResolvedValue({
      id: mockTopicItemId,
      syllabusId: mockSyllabusId,
    } as any);
    vi.spyOn(prisma.syllabusGranularItem, "findUnique").mockResolvedValue(null);

    let capturedCreateData: any = null;
    vi.spyOn(prisma.syllabusGranularItem, "create").mockImplementation(((args: any) => {
      capturedCreateData = args.data;
      return Promise.resolve({
        id: "gran-provenance-test",
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }) as any);
    vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockResolvedValue({} as any);

    const result = await SyllabusService.addGranularItem(
      mockSyllabusId,
      mockTopicItemId,
      {
        scope: "EXERCISE_QUESTION",
        identifier: "Q4(b)",
        title: "Calculations on Centripetal Acceleration",
        isIncluded: false,
        eligibility: "EXCLUDED",
        sourceDocument: "Notification_2025_Gazette.pdf",
        sourcePage: 28,
        sourceReference: "Gazette Notification 2025-BISE-GRW",
        effectiveDate: "2025-05-15T00:00:00.000Z",
        verificationStatus: "VERIFIED",
        verifiedBy: "director-curriculum",
        verificationNotes: "Gazette page 28 item 4(b) confirmed deleted.",
      },
      "ADMIN",
      "director-curriculum",
      "Curriculum Director"
    );

    expect(result.sourceDocument).toBe("Notification_2025_Gazette.pdf");
    expect(result.sourcePage).toBe(28);
    expect(result.sourceReference).toBe("Gazette Notification 2025-BISE-GRW");
    expect(result.verificationStatus).toBe("VERIFIED");
    expect(result.verifiedBy).toBe("director-curriculum");
    expect(result.verificationNotes).toBe("Gazette page 28 item 4(b) confirmed deleted.");

    expect(capturedCreateData.sourceDocument).toBe("Notification_2025_Gazette.pdf");
    expect(capturedCreateData.sourcePage).toBe(28);
    expect(capturedCreateData.sourceReference).toBe("Gazette Notification 2025-BISE-GRW");
  });

  // --------------------------------------------------------------------------
  // I. unverified/invalid verification claims cannot silently become production verified
  // --------------------------------------------------------------------------
  it("I. unverified claims without evidence cannot silently become production VERIFIED", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({ id: mockSyllabusId } as any);
    vi.spyOn(prisma.syllabusTopicItem, "findUnique").mockResolvedValue({
      id: mockTopicItemId,
      syllabusId: mockSyllabusId,
    } as any);
    vi.spyOn(prisma.syllabusGranularItem, "findUnique").mockResolvedValue(null);

    let capturedCreateData: any = null;
    vi.spyOn(prisma.syllabusGranularItem, "create").mockImplementation(((args: any) => {
      capturedCreateData = args.data;
      return Promise.resolve({
        id: "gran-unverified-test",
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }) as any);
    vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockResolvedValue({} as any);

    // Caller claims VERIFIED, but provides NO verifiedBy and NO sourceDocument, NO sourceReference, NO sourcePage
    const result = await SyllabusService.addGranularItem(
      mockSyllabusId,
      mockTopicItemId,
      {
        scope: "SUBTOPIC",
        identifier: "Fake Topic Claim",
        isIncluded: true,
        verificationStatus: "VERIFIED", // Unsubstantiated claim!
      },
      "ADMIN"
      // actorId not passed, no evidence
    );

    // Must be demoted to UNVERIFIED
    expect(result.verificationStatus).toBe("UNVERIFIED");
    expect(capturedCreateData.verificationStatus).toBe("UNVERIFIED");
    expect(capturedCreateData.verifiedBy).toBeNull();
  });

  // --------------------------------------------------------------------------
  // J. source-less syllabus cannot be published
  // --------------------------------------------------------------------------
  it("J. source-less syllabus cannot be published and is rejected with deterministic error", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
      id: mockSyllabusId,
      version: "2025-v1",
      status: "DRAFT",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null, // Zero source provenance!
      chapterItems: [],
      topicItems: [],
    } as any);

    await expect(
      SyllabusService.publishSyllabus(mockSyllabusId, "ADMIN", "admin-user")
    ).rejects.toThrow(/Official source provenance is strictly required/);
  });

  // --------------------------------------------------------------------------
  // K. valid verified syllabus can still be published
  // --------------------------------------------------------------------------
  it("K. valid verified syllabus with official provenance can be published successfully", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
      id: mockSyllabusId,
      version: "2025-v1",
      status: "UNDER_REVIEW",
      sourceTitle: "Official Grade 9 Curriculum 2025",
      sourceReference: "Gazette Notification No. 101/2025",
      sourceType: "OFFICIAL_DOCUMENT",
      chapterItems: [],
      topicItems: [],
    } as any);

    vi.spyOn(prisma.syllabus, "update").mockResolvedValue({
      id: mockSyllabusId,
      title: "Official Grade 9 Curriculum",
      version: "2025-v1",
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      verifiedBy: "admin-publisher",
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceTitle: "Official Grade 9 Curriculum 2025",
      sourceReference: "Gazette Notification No. 101/2025",
      sourceType: "OFFICIAL_DOCUMENT",
    } as any);

    vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockResolvedValue({} as any);

    const published = await SyllabusService.publishSyllabus(mockSyllabusId, "ADMIN", "admin-publisher");
    expect(published.status).toBe("PUBLISHED");
    expect(published.provenance.verificationStatus).toBe("VERIFIED");
  });

  // --------------------------------------------------------------------------
  // L. granular modification creates an audit record
  // --------------------------------------------------------------------------
  it("L. granular modification creates an audit record in SyllabusAlignmentAudit and AuditLogger", async () => {
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({ id: mockSyllabusId } as any);
    vi.spyOn(prisma.syllabusTopicItem, "findUnique").mockResolvedValue({
      id: mockTopicItemId,
      syllabusId: mockSyllabusId,
    } as any);
    vi.spyOn(prisma.syllabusGranularItem, "findUnique").mockResolvedValue(null);

    vi.spyOn(prisma.syllabusGranularItem, "create").mockResolvedValue({
      id: "gran-audit-target-id",
      syllabusTopicItemId: mockTopicItemId,
      scope: "SUBTOPIC",
      identifier: "3.4.1",
      title: "Banking of Roads",
      isIncluded: false,
      eligibility: "EXCLUDED",
      verificationStatus: "VERIFIED",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    let auditCreated: any = null;
    vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockImplementation(((args: any) => {
      auditCreated = args.data;
      return Promise.resolve({ id: "audit-1", ...args.data });
    }) as any);

    await SyllabusService.addGranularItem(
      mockSyllabusId,
      mockTopicItemId,
      {
        scope: "SUBTOPIC",
        identifier: "3.4.1",
        title: "Banking of Roads",
        isIncluded: false,
        eligibility: "EXCLUDED",
        sourceDocument: "Gazette_2025.pdf",
        verificationStatus: "VERIFIED",
        verifiedBy: "lead-curriculum-officer",
        verificationNotes: "Topic excluded in 2025 gazette.",
      },
      "CURRICULUM_OFFICER",
      "lead-curriculum-officer",
      "Lead Curriculum Officer"
    );

    // Verify SyllabusAlignmentAudit entry
    expect(auditCreated).toBeDefined();
    expect(auditCreated.syllabusId).toBe(mockSyllabusId);
    expect(auditCreated.itemId).toBe("gran-audit-target-id");
    expect(auditCreated.itemType).toBe("GRANULAR_ITEM");
    expect(auditCreated.decision).toBe("GRANULAR_EXCLUDED");
    expect(auditCreated.reviewerId).toBe("lead-curriculum-officer");
    expect(auditCreated.newState).toBeDefined();
    expect(auditCreated.newState.identifier).toBe("3.4.1");
    expect(auditCreated.newState.isIncluded).toBe(false);

    // Verify AuditLogger memory logs
    const memoryLogs = AuditLogger.getMemoryLogs();
    expect(memoryLogs.some((l) => l.action === "GRANULAR_SYLLABUS_ITEM_CREATED")).toBe(true);
  });
});

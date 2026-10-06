import { describe, it, expect, vi } from "vitest";
import { GET as getSyllabi, POST as postSyllabus } from "@/app/api/syllabus/route";
import { GET as getSyllabusById } from "@/app/api/syllabus/[id]/route";
import { POST as alignSyllabus } from "@/app/api/syllabus/[id]/align/route";
import { GET as getEligibleContent } from "@/app/api/syllabus/[id]/eligible-content/route";
import { GET as getValidationReport } from "@/app/api/syllabus/[id]/validation/route";
import { POST as publishSyllabus } from "@/app/api/syllabus/[id]/publish/route";
import { POST as reviewAlignment } from "@/app/api/syllabus/[id]/review/route";
import { GET as compareSyllabus } from "@/app/api/syllabus/compare/route";
import { SyllabusService } from "@/server/syllabus/syllabus-service";
import { CurriculumAligner } from "@/server/syllabus/curriculum-aligner";
import { EligibilityQueryService } from "@/server/syllabus/eligibility-query-service";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

describe("Phase 4: Syllabus Intelligence API Routes Integration", () => {
  it("GET /api/syllabus should return list of syllabi", async () => {
    vi.spyOn(prisma.syllabus, "findMany").mockResolvedValue([
      {
        id: "syl-1",
        title: "Physics 2025",
        version: "2025-v1",
        status: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
        board: { name: "Federal Board" },
        academicYear: { name: "2024-2025" },
        class: { name: "Class 9" },
        subject: { name: "Physics" },
        _count: { chapterItems: 2, topicItems: 4 },
      } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/syllabus");
    const res = await getSyllabi(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.syllabi[0].title).toBe("Physics 2025");
  });

  it("POST /api/syllabus should reject duplicate version with 409", async () => {
    vi.spyOn(SyllabusService, "createSyllabus").mockRejectedValue(
      new Error("Duplicate Syllabus Version: Version already exists.")
    );

    const req = new NextRequest("http://localhost:3000/api/syllabus", {
      method: "POST",
      body: JSON.stringify({
        title: "Physics 2025",
        version: "2025-v1",
        academicYearId: "11111111-1111-1111-1111-111111111111",
        classId: "22222222-2222-2222-2222-222222222222",
        subjectId: "33333333-3333-3333-3333-333333333333",
      }),
    });

    const res = await postSyllabus(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("SYLLABUS_ERROR");
  });

  it("GET /api/syllabus/[id] should return 404 for unknown syllabus", async () => {
    vi.spyOn(SyllabusService, "getSyllabusById").mockRejectedValue(
      new Error("Syllabus with ID \"unknown-id\" was not found.")
    );

    const req = new NextRequest("http://localhost:3000/api/syllabus/unknown-id");
    const res = await getSyllabusById(req, { params: Promise.resolve({ id: "unknown-id" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it("POST /api/syllabus/[id]/align should reject invalid payload with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/syllabus/syl-1/align", {
      method: "POST",
      body: JSON.stringify({ bookId: "not-a-valid-uuid" }),
    });

    const res = await alignSyllabus(req, { params: Promise.resolve({ id: "syl-1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/syllabus/[id]/eligible-content should return eligible knowledge pool", async () => {
    vi.spyOn(EligibilityQueryService, "getEligibleKnowledge").mockResolvedValue([
      {
        chunkId: "chk-1",
        documentId: "doc-1",
        documentName: "Physics_Grade9.pdf",
        bookId: "bk-1",
        bookTitle: "Physics Textbook Grade 9",
        chapterId: "ch-1",
        chapterNumber: 1,
        chapterTitle: "Kinematics",
        topicId: "top-1",
        topicCode: "1.1",
        topicTitle: "Rest and Motion",
        pageNumber: 4,
        chunkType: "DEFINITION",
        content: "Velocity is the rate of change of displacement.",
        syllabusId: "syl-1",
        syllabusVersion: "2025-v1",
        eligibilityStatus: "ELIGIBLE",
        alignmentStatus: "MATCHED",
        weightage: 15,
        confidence: 0.95,
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/syllabus/syl-1/eligible-content");
    const res = await getEligibleContent(req, { params: Promise.resolve({ id: "syl-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.results.length).toBe(1);
    expect(json.data.results[0].eligibilityStatus).toBe("ELIGIBLE");
    expect(json.data.results[0].documentName).toBe("Physics_Grade9.pdf");
  });

  it("GET /api/syllabus/[id]/validation should return validation report", async () => {
    vi.spyOn(SyllabusService, "getValidationReport").mockResolvedValue({
      syllabusId: "syl-1",
      title: "Physics 2025",
      version: "2025-v1",
      status: "PUBLISHED",
      isValidForExamGeneration: true,
      totalChapters: 2,
      matchedChapters: 2,
      unmatchedChapters: 0,
      excludedChapters: 0,
      reviewRequiredChapters: 0,
      totalTopics: 4,
      matchedTopics: 4,
      unmatchedTopics: 0,
      excludedTopics: 0,
      reviewRequiredTopics: 0,
      coveragePct: 100,
      issues: [],
    });

    const req = new NextRequest("http://localhost:3000/api/syllabus/syl-1/validation");
    const res = await getValidationReport(req, { params: Promise.resolve({ id: "syl-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.isValidForExamGeneration).toBe(true);
    expect(json.data.coveragePct).toBe(100);
  });

  it("POST /api/syllabus/[id]/publish should reject non-admin request with 403", async () => {
    const req = new NextRequest("http://localhost:3000/api/syllabus/syl-1/publish", {
      method: "POST",
      headers: { "x-user-role": "STUDENT" },
    });

    const res = await publishSyllabus(req, { params: Promise.resolve({ id: "syl-1" }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/syllabus/[id]/review should submit reviewer decision", async () => {
    vi.spyOn(SyllabusService, "reviewAlignment").mockResolvedValue({
      success: true,
      itemId: "11111111-1111-1111-1111-111111111111",
      decision: "CONFIRMED",
      newState: { alignmentStatus: "MATCHED", eligibility: "ELIGIBLE" },
    } as any);

    const req = new NextRequest("http://localhost:3000/api/syllabus/syl-1/review", {
      method: "POST",
      body: JSON.stringify({
        itemId: "11111111-1111-1111-1111-111111111111",
        itemType: "CHAPTER",
        decision: "CONFIRMED",
        notes: "Approved manually",
      }),
      headers: { "x-user-role": "ADMIN" },
    });

    const res = await reviewAlignment(req, { params: Promise.resolve({ id: "syl-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.decision).toBe("CONFIRMED");
  });

  it("GET /api/syllabus/compare should reject missing version query parameters with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/syllabus/compare");
    const res = await compareSyllabus(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MISSING_PARAMETERS");
  });
});

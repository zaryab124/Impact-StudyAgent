import { describe, it, expect, vi } from "vitest";
import { GET as getBoards, POST as postBoard } from "@/app/api/boards/route";
import { GET as getAcademicYears } from "@/app/api/academic-years/route";
import { GET as getClasses } from "@/app/api/classes/route";
import { GET as getSubjects } from "@/app/api/subjects/route";
import { GET as getBooks } from "@/app/api/books/route";
import { GET as getSyllabus } from "@/app/api/syllabus/route";
import { EducationService } from "@/server/education-service";
import { NextRequest } from "next/server";

describe("Phase 2 Education API Routes Integration", () => {
  it("GET /api/boards should return success with list of boards", async () => {
    vi.spyOn(EducationService, "getBoards").mockResolvedValue([
      { id: "b1", code: "DEMO_BOARD", name: "Demo Board", country: "Pakistan", status: "ACTIVE" } as any,
    ]);

    const res = await getBoards();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.boards.length).toBe(1);
    expect(json.data.boards[0].code).toBe("DEMO_BOARD");
  });

  it("POST /api/boards should reject invalid board payload with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/boards", {
      method: "POST",
      body: JSON.stringify({ code: "invalid code with spaces", name: "B" }),
    });

    const res = await postBoard(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/academic-years should handle filtering by boardId", async () => {
    vi.spyOn(EducationService, "getAcademicYears").mockResolvedValue([
      { id: "y1", code: "2024-2025", name: "Session 2024-2025", status: "ACTIVE" } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/academic-years?boardId=b1");
    const res = await getAcademicYears(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.academicYears[0].code).toBe("2024-2025");
  });

  it("GET /api/classes should handle filtering by academicYearId", async () => {
    vi.spyOn(EducationService, "getClasses").mockResolvedValue([
      { id: "c1", name: "Class 9", numericLevel: 9, status: "ACTIVE" } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/classes?academicYearId=y1");
    const res = await getClasses(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.classes[0].numericLevel).toBe(9);
  });

  it("GET /api/subjects should handle filtering by classId", async () => {
    vi.spyOn(EducationService, "getSubjects").mockResolvedValue([
      { id: "s1", name: "Science", code: "SCI-09", status: "ACTIVE" } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/subjects?classId=c1");
    const res = await getSubjects(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.subjects[0].code).toBe("SCI-09");
  });

  it("GET /api/books should return books with versioning info", async () => {
    vi.spyOn(EducationService, "getBooks").mockResolvedValue([
      { id: "bk1", title: "General Science", version: "2025.1", publisher: "Publisher", status: "ACTIVE" } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/books?subjectId=s1");
    const res = await getBooks(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.books[0].version).toBe("2025.1");
  });

  it("GET /api/syllabus should return syllabus versions with inclusions and weightages", async () => {
    vi.spyOn(EducationService, "getSyllabi").mockResolvedValue([
      { id: "syl1", title: "Syllabus 2025", version: "2025-v1", status: "PUBLISHED" } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/syllabus?subjectId=s1");
    const res = await getSyllabus(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.syllabi[0].version).toBe("2025-v1");
  });
});

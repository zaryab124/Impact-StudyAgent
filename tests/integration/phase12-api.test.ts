// ==============================================================================
// AI Live Paper Generator - Phase 12 Comprehensive API Architecture Tests
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as authGet, POST as authPost } from "@/app/api/auth/route";
import { GET as boardsGet, POST as boardsPost } from "@/app/api/boards/route";
import { GET as classesGet, POST as classesPost } from "@/app/api/classes/route";
import { GET as subjectsGet, POST as subjectsPost } from "@/app/api/subjects/route";
import { GET as booksGet, POST as booksPost } from "@/app/api/books/route";
import { POST as booksUploadPost } from "@/app/api/books/upload/route";
import { POST as booksProcessPost } from "@/app/api/books/process/route";
import { GET as booksStatusGet } from "@/app/api/books/status/route";
import { GET as syllabusGet, POST as syllabusPost } from "@/app/api/syllabus/route";
import { GET as samplePapersGet, POST as samplePapersPost } from "@/app/api/sample-papers/route";
import { POST as samplePapersAnalyzePost } from "@/app/api/sample-papers/analyze/route";
import { GET as patternsGet, POST as patternsPost } from "@/app/api/patterns/route";
import { GET as patternByIdGet } from "@/app/api/patterns/[id]/route";
import { GET as questionsGet, POST as questionsPost } from "@/app/api/questions/route";
import { POST as questionsGeneratePost } from "@/app/api/questions/generate/route";
import { POST as questionsValidatePost } from "@/app/api/questions/validate/route";
import { GET as papersGet, POST as papersPost } from "@/app/api/papers/route";
import { POST as papersGeneratePost } from "@/app/api/papers/generate/route";
import { GET as paperByIdGet } from "@/app/api/papers/[id]/route";
import { GET as examsGet, POST as examsPost } from "@/app/api/exams/route";
import { POST as examStartPost } from "@/app/api/exams/[id]/start/route";
import { POST as examAnswerPost } from "@/app/api/exams/[id]/answer/route";
import { POST as examSubmitPost } from "@/app/api/exams/[id]/submit/route";
import { GET as resultsGet } from "@/app/api/results/route";
import { GET as resultByIdGet } from "@/app/api/results/[id]/route";
import { GET as adminGet } from "@/app/api/admin/route";
import { ServerAuthService } from "@/server/auth/auth-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { EducationService } from "@/server/education-service";
import { prisma } from "@/lib/db";

describe("Phase 12: Unified API Architecture Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    ExamRepository.resetMemory();
  });

  // --------------------------------------------------------------------------
  // 1. AUTH API
  // --------------------------------------------------------------------------
  describe("Auth API (/api/auth)", () => {
    it("POST /api/auth should authenticate user and return session token", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          email: "student@candidate.edu.pk",
          password: "SecurePassword123!",
        }),
      });

      const res = await authPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.token).toMatch(/^sat_/);
      expect(json.data.user.email).toBe("student@candidate.edu.pk");
    });

    it("GET /api/auth should validate active session token", async () => {
      const token = ServerAuthService.createSession({
        id: "student-user-id",
        email: "student@candidate.edu.pk",
        name: "Student Candidate",
        role: "STUDENT",
        isActive: true,
      });

      const req = new NextRequest("http://localhost:3000/api/auth", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await authGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.user.role).toBe("STUDENT");
    });

    it("GET /api/auth should reject invalid session token with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth", {
        method: "GET",
        headers: { authorization: "Bearer invalid_token" },
      });

      const res = await authGet(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });

  // --------------------------------------------------------------------------
  // 2. EDUCATION HIERARCHY APIs
  // --------------------------------------------------------------------------
  describe("Education Hierarchy APIs", () => {
    it("GET /api/boards should return boards list", async () => {
      vi.spyOn(EducationService, "getBoards").mockResolvedValue([
        { id: "b1", code: "DEMO_BOARD", name: "Demo Board", country: "Pakistan", status: "ACTIVE" } as any,
      ]);
      const res = await boardsGet();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.boards)).toBe(true);
    });

    it("GET /api/classes should return classes list", async () => {
      vi.spyOn(EducationService, "getClasses").mockResolvedValue([
        { id: "c1", name: "Class 9", numericLevel: 9, status: "ACTIVE" } as any,
      ]);
      const req = new NextRequest("http://localhost:3000/api/classes");
      const res = await classesGet(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it("GET /api/subjects should return subjects list", async () => {
      vi.spyOn(EducationService, "getSubjects").mockResolvedValue([
        { id: "s1", name: "Physics", code: "PHY-9", status: "ACTIVE" } as any,
      ]);
      const req = new NextRequest("http://localhost:3000/api/subjects");
      const res = await subjectsGet(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it("GET /api/books should return books list", async () => {
      vi.spyOn(EducationService, "getBooks").mockResolvedValue([
        { id: "bk1", title: "Physics 9", status: "ACTIVE" } as any,
      ]);
      const req = new NextRequest("http://localhost:3000/api/books");
      const res = await booksGet(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. BOOK PROCESSING APIs
  // --------------------------------------------------------------------------
  describe("Book Processing APIs", () => {
    it("POST /api/books/upload should reject missing file with 400", async () => {
      const formData = new FormData();
      formData.append("bookId", "book-123");

      const req = new NextRequest("http://localhost:3000/api/books/upload", {
        method: "POST",
        body: formData,
      });

      const res = await booksUploadPost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("MISSING_FILE");
    });

    it("POST /api/books/process should reject missing documentId/bookId with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/books/process", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const res = await booksProcessPost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("MISSING_IDENTIFIER");
    });

    it("GET /api/books/status should reject missing identifier with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/books/status");
      const res = await booksStatusGet(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("MISSING_IDENTIFIER");
    });
  });

  // --------------------------------------------------------------------------
  // 4. SYLLABUS APIs
  // --------------------------------------------------------------------------
  describe("Syllabus APIs", () => {
    it("GET /api/syllabus should retrieve published and verified syllabi", async () => {
      vi.spyOn(EducationService, "getSyllabi").mockResolvedValue([
        {
          id: "syl-1",
          title: "Grade 9 Syllabus",
          status: "PUBLISHED",
          version: "v1.0",
          effectiveDate: new Date(),
          chapterItems: [],
          topicItems: [],
        } as any,
      ]);
      const req = new NextRequest("http://localhost:3000/api/syllabus");
      const res = await syllabusGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.syllabi)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. SAMPLE PAPER & PATTERN APIs
  // --------------------------------------------------------------------------
  describe("Sample Papers & Pattern APIs", () => {
    it("GET /api/patterns should list paper patterns", async () => {
      vi.spyOn(prisma.paperPattern, "findMany").mockResolvedValue([
        {
          id: "pat-1",
          title: "Grade 9 Biology Pattern 2025",
          version: "v1.0",
          totalMarks: 60,
          durationMinutes: 60,
          status: "ACTIVE",
          subject: { name: "Biology" },
          board: { name: "Federal" },
          academicYear: { name: "2024-25" },
          class: { name: "Grade 9" },
          samplePaperLinks: [],
        } as any,
      ]);
      const req = new NextRequest("http://localhost:3000/api/patterns");
      const res = await patternsGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.patterns)).toBe(true);
    });

    it("POST /api/patterns should register a valid examination pattern", async () => {
      const req = new NextRequest("http://localhost:3000/api/patterns", {
        method: "POST",
        body: JSON.stringify({
          title: "Grade 9 Biology Pattern 2025",
          subjectId: "subj-bio-9",
          totalMarks: 60,
          durationMinutes: 60,
        }),
      });

      const res = await patternsPost(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.pattern.title).toBe("Grade 9 Biology Pattern 2025");
    });

    it("POST /api/sample-papers/analyze should reject unauthorized student requests", async () => {
      const req = new NextRequest("http://localhost:3000/api/sample-papers/analyze", {
        method: "POST",
        headers: { "x-user-role": "STUDENT" },
        body: JSON.stringify({
          subjectId: "subj-1",
          samplePaperIds: ["sp-1"],
        }),
      });

      const res = await samplePapersAnalyzePost(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  // --------------------------------------------------------------------------
  // 6. QUESTION APIs
  // --------------------------------------------------------------------------
  describe("Question APIs", () => {
    it("GET /api/questions should sanitize correct answers for students", async () => {
      const req = new NextRequest("http://localhost:3000/api/questions", {
        headers: { "x-user-role": "STUDENT" },
      });

      const res = await questionsGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      // Candidates must not expose answerMaterial to students
      if (json.data.candidates.length > 0) {
        expect(json.data.candidates[0].answerMaterial).toBeUndefined();
      }
    });

    it("POST /api/questions/validate should evaluate candidate quality", async () => {
      const req = new NextRequest("http://localhost:3000/api/questions/validate", {
        method: "POST",
        body: JSON.stringify({
          candidate: {
            id: "cand-1",
            questionType: "SHORT",
            difficulty: "MEDIUM",
            questionText: "Explain the definition of force and state its SI unit according to textbook principles.",
            marks: 2,
            topicId: "top-1",
            topicTitle: "Dynamics",
            chapterId: "ch-1",
            chapterTitle: "Laws of Motion",
            syllabusVersion: "v1.0",
            sourceChunkIds: ["chk-1"],
            sourcePages: [12],
            answerMaterial: {
              expectedKeyPoints: ["Definition of force", "Newton SI unit"],
              rubricBreakdown: [{ criterion: "Accuracy", marks: 2, description: "Full marks" }],
            },
          },
        }),
      });

      const res = await questionsValidatePost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(typeof json.data.overallQualityScore).toBe("number");
    });
  });

  // --------------------------------------------------------------------------
  // 7. PAPER APIs
  // --------------------------------------------------------------------------
  describe("Paper APIs", () => {
    it("POST /api/papers/generate should generate balanced paper from hierarchy", async () => {
      const req = new NextRequest("http://localhost:3000/api/papers/generate", {
        method: "POST",
        body: JSON.stringify({
          boardId: "board-fed-01",
          classId: "class-9",
          subjectId: "subj-physics",
          bookId: "book-phys-9",
          totalQuestions: 15,
          title: "Model Physics Paper 2025",
        }),
      });

      const res = await papersGeneratePost(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.paper.questions.length).toBe(15);
      expect(json.data.paper.status).toBe("ACTIVE");
    });

    it("GET /api/papers should list generated papers", async () => {
      const req = new NextRequest("http://localhost:3000/api/papers");
      const res = await papersGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.papers.length).toBeGreaterThan(0);
    });

    it("GET /api/papers/:id should sanitize answer keys for student requests", async () => {
      // First generate a paper
      const genReq = new NextRequest("http://localhost:3000/api/papers/generate", {
        method: "POST",
        body: JSON.stringify({
          boardId: "board-fed-01",
          subjectId: "subj-chem",
          totalQuestions: 10,
          title: "Chemistry Paper",
        }),
      });
      const genRes = await papersGeneratePost(genReq);
      const genJson = await genRes.json();
      const paperId = genJson.data.paper.id;

      // Query paper as student
      const req = new NextRequest(`http://localhost:3000/api/papers/${paperId}?forStudent=true`, {
        headers: { "x-user-role": "STUDENT" },
      });
      const res = await paperByIdGet(req, { params: Promise.resolve({ id: paperId }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      // Student view must not leak answerKey
      if (json.data.questions?.length > 0) {
        expect(json.data.questions[0].answerKey).toBeUndefined();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 8. EXAM APIs
  // --------------------------------------------------------------------------
  describe("Exam APIs (/api/exams)", () => {
    it("Full Exam Lifecycle: start attempt -> save answer -> submit attempt", async () => {
      // 1. Generate paper
      const genReq = new NextRequest("http://localhost:3000/api/papers/generate", {
        method: "POST",
        body: JSON.stringify({
          boardId: "board-fed-01",
          subjectId: "subj-bio",
          totalQuestions: 10,
          title: "Biology Term Paper",
        }),
      });
      const genRes = await papersGeneratePost(genReq);
      const genJson = await genRes.json();
      const paperId = genJson.data.paper.id;

      // 2. Start attempt
      const startReq = new NextRequest(`http://localhost:3000/api/exams/${paperId}/start`, {
        method: "POST",
        body: JSON.stringify({
          studentId: "student-101",
          studentName: "Fatima Zahra",
        }),
      });
      const startRes = await examStartPost(startReq, { params: Promise.resolve({ id: paperId }) });
      const startJson = await startRes.json();

      expect(startRes.status).toBe(201);
      expect(startJson.data.attempt.status).toBe("IN_PROGRESS");
      const attemptId = startJson.data.attempt.id;
      const firstQId = startJson.data.paper.questions[0].id;

      // 3. Save answer via /api/exams/:id/answer
      const ansReq = new NextRequest(`http://localhost:3000/api/exams/${attemptId}/answer`, {
        method: "POST",
        body: JSON.stringify({
          paperQuestionId: firstQId,
          selectedOption: "A",
        }),
      });
      const ansRes = await examAnswerPost(ansReq, { params: Promise.resolve({ id: attemptId }) });
      const ansJson = await ansRes.json();

      expect(ansRes.status).toBe(200);
      expect(ansJson.data.answer.selectedOption).toBe("A");

      // 4. Submit attempt
      const subReq = new NextRequest(`http://localhost:3000/api/exams/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ confirmSubmission: true }),
      });
      const subRes = await examSubmitPost(subReq, { params: Promise.resolve({ id: attemptId }) });
      const subJson = await subRes.json();

      expect(subRes.status).toBe(200);
      expect(["SUBMITTED", "EVALUATED"]).toContain(subJson.data.attempt.status);
      expect(subJson.data.result).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 9. RESULT APIs
  // --------------------------------------------------------------------------
  describe("Result APIs (/api/results)", () => {
    it("GET /api/results should return student results list", async () => {
      const req = new NextRequest("http://localhost:3000/api/results");
      const res = await resultsGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.results)).toBe(true);
    });

    it("GET /api/results/:id should return 404 for non-existent result", async () => {
      const req = new NextRequest("http://localhost:3000/api/results/att_non_existent");
      const res = await resultByIdGet(req, { params: Promise.resolve({ id: "att_non_existent" }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error.code).toBe("RESULT_NOT_FOUND");
    });
  });

  // --------------------------------------------------------------------------
  // 10. ADMIN RBAC APIs
  // --------------------------------------------------------------------------
  describe("Admin APIs (/api/admin/*)", () => {
    it("GET /api/admin should reject ordinary students with 403 Forbidden", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin", {
        headers: { "x-user-role": "STUDENT" },
      });

      const res = await adminGet(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("GET /api/admin should allow authorized ADMIN role", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin", {
        headers: { "x-user-role": "ADMIN" },
      });

      const res = await adminGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.platform).toBe("AI Live Paper Generator");
    });
  });
});

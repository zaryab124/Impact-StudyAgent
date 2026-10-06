import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getSamplePapers, POST as postSamplePaper } from "@/app/api/sample-papers/route";
import { GET as getSamplePaperById } from "@/app/api/sample-papers/[id]/route";
import { POST as processSamplePaper } from "@/app/api/sample-papers/[id]/process/route";
import { GET as getPaperQuestions } from "@/app/api/sample-papers/[id]/questions/route";
import { POST as reviewQuestion } from "@/app/api/sample-papers/[id]/review/route";
import { GET as getPatterns } from "@/app/api/patterns/route";
import { POST as analyzePattern } from "@/app/api/patterns/analyze/route";
import { GET as getPatternById } from "@/app/api/patterns/[id]/route";
import { GET as getPatternValidation } from "@/app/api/patterns/[id]/validation/route";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";
import { prisma } from "@/lib/db";

describe("Phase 5: Sample Paper & Examination Pattern API Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/sample-papers returns list of sample papers", async () => {
    vi.spyOn(SamplePaperService, "listSamplePapers").mockResolvedValue([
      {
        id: "sp-1",
        title: "Model Paper Physics 2024",
        year: 2024,
        totalMarks: 60,
        durationMinutes: 180,
        subjectId: "sub-1",
        sourceType: "SAMPLE_PAPER",
        status: "COMPLETED",
        pageCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/sample-papers");
    const res = await getSamplePapers(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.samplePapers[0].title).toBe("Model Paper Physics 2024");
  });

  it("POST /api/sample-papers rejects students with 403 FORBIDDEN", async () => {
    const req = new NextRequest("http://localhost:3000/api/sample-papers", {
      method: "POST",
      headers: { "x-user-role": "STUDENT" },
      body: JSON.stringify({
        title: "Unauthorized Paper",
        subjectId: "11111111-1111-1111-1111-111111111111",
      }),
    });

    const res = await postSamplePaper(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("GET /api/sample-papers/[id] returns paper details", async () => {
    vi.spyOn(SamplePaperService, "getSamplePaperById").mockResolvedValue({
      id: "sp-1",
      title: "Model Paper Physics 2024",
      year: 2024,
      totalMarks: 60,
      durationMinutes: 180,
      subjectId: "sub-1",
      sourceType: "SAMPLE_PAPER",
      status: "COMPLETED",
      pageCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/sample-papers/sp-1");
    const res = await getSamplePaperById(req, { params: Promise.resolve({ id: "sp-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("sp-1");
  });

  it("POST /api/sample-papers/[id]/process triggers analysis pipeline", async () => {
    vi.spyOn(SamplePaperService, "processSamplePaper").mockResolvedValue({
      id: "sp-1",
      title: "Model Paper Physics 2024",
      year: 2024,
      totalMarks: 60,
      durationMinutes: 180,
      subjectId: "sub-1",
      sourceType: "SAMPLE_PAPER",
      status: "COMPLETED",
      pageCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/sample-papers/sp-1/process", {
      method: "POST",
      headers: { "x-user-role": "EXAMINER" },
    });

    const res = await processSamplePaper(req, { params: Promise.resolve({ id: "sp-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.samplePaper.status).toBe("COMPLETED");
  });

  it("GET /api/sample-papers/[id]/questions returns extracted questions", async () => {
    vi.spyOn(SamplePaperService, "getQuestionsForPaper").mockResolvedValue([
      {
        id: "q-1",
        samplePaperId: "sp-1",
        pageNumber: 1,
        originalNumber: "Q1",
        normalizedNumber: "1",
        sectionName: "Section A",
        questionOrder: 1,
        text: "What is inertia?",
        primaryType: "DEFINITION",
        secondaryTypes: [],
        marks: 2,
        isCompulsory: true,
        difficulty: "EASY",
        difficultyConfidence: 0.9,
        difficultyEvidence: {
          cognitiveComplexity: "RECALL",
          reasoningSteps: 1,
          calculationComplexity: "NONE",
          abstractionLevel: "CONCRETE",
          expectedSolutionDepth: "SHORT_PHRASE",
          prerequisiteKnowledge: [],
        },
        difficultyMethod: "MULTI_SIGNAL_HEURISTIC",
        mappingConfidence: 0.8,
        mappingStatus: "MATCHED",
        needsReview: false,
        verificationStatus: "VERIFIED",
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/sample-papers/sp-1/questions");
    const res = await getPaperQuestions(req, { params: Promise.resolve({ id: "sp-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.questions[0].primaryType).toBe("DEFINITION");
  });

  it("POST /api/sample-papers/[id]/review records human override and creates audit entry", async () => {
    vi.spyOn(SamplePaperService, "recordHumanReview").mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      samplePaperId: "sp-1",
      pageNumber: 1,
      originalNumber: "Q2",
      normalizedNumber: "2",
      sectionName: "Section B",
      questionOrder: 2,
      text: "Calculate force.",
      primaryType: "NUMERICAL",
      secondaryTypes: ["APPLICATION"],
      marks: 3,
      isCompulsory: true,
      difficulty: "DIFFICULT",
      difficultyConfidence: 0.95,
      difficultyEvidence: {
        cognitiveComplexity: "APPLICATION",
        reasoningSteps: 3,
        calculationComplexity: "MEDIUM",
        abstractionLevel: "MODERATE",
        expectedSolutionDepth: "PARAGRAPH",
        prerequisiteKnowledge: [],
      },
      difficultyMethod: "MULTI_SIGNAL_HEURISTIC",
      mappingConfidence: 0.8,
      mappingStatus: "MATCHED",
      needsReview: false,
      verificationStatus: "VERIFIED",
    });

    const req = new NextRequest("http://localhost:3000/api/sample-papers/sp-1/review", {
      method: "POST",
      headers: { "x-user-role": "EXAMINER", "x-user-id": "examiner-1" },
      body: JSON.stringify({
        questionId: "11111111-1111-1111-1111-111111111111",
        action: "CONFIRM_DIFFICULTY",
        difficulty: "DIFFICULT",
        reason: "Multi-step calculation requires difficult tag.",
      }),
    });

    const res = await reviewQuestion(req, { params: Promise.resolve({ id: "sp-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.question.difficulty).toBe("DIFFICULT");
  });

  it("GET /api/patterns returns learned examination patterns", async () => {
    vi.spyOn(prisma.paperPattern, "findMany").mockResolvedValue([
      {
        id: "pat-1",
        title: "Standard SSC-I Physics Pattern",
        version: "v1",
        subjectId: "sub-1",
        totalMarks: 60,
        durationMinutes: 180,
        status: "ACTIVE",
        patternConfidence: 0.92,
        supportingSampleCount: 3,
        aggregationLevel: "COMMON_PATTERN",
        sectionStructure: [],
        questionDistribution: {},
        marksDistribution: {},
        difficultyObservations: {},
        targetDifficulty: { easyPct: 33, mediumPct: 33, difficultPct: 34, note: "" },
        wordingCharacteristics: {},
        validationReport: { isConsistent: true, issues: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { name: "Physics" },
        board: { name: "Federal Board" },
        academicYear: { name: "2024-2025" },
        class: { name: "Class 9" },
        samplePaperLinks: [],
      } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/patterns");
    const res = await getPatterns(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.patterns[0].version).toBe("v1");
  });

  it("POST /api/patterns/analyze learns pattern and increments version", async () => {
    vi.spyOn(SamplePaperService, "getSamplePaperById").mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      title: "Model Paper Physics 2024",
      year: 2024,
      totalMarks: 60,
      durationMinutes: 180,
      subjectId: "22222222-2222-2222-2222-222222222222",
      sourceType: "SAMPLE_PAPER",
      status: "COMPLETED",
      pageCount: 2,
      extractedStructure: {
        sections: [
          {
            name: "Section A (Objective)",
            order: 1,
            totalMarks: 60,
            questionCount: 1,
            compulsoryCount: 1,
            optionalCount: 0,
            questionTypes: ["SHORT"],
            marksPerQuestion: [60],
          },
        ],
        totalQuestions: 1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    vi.spyOn(SamplePaperService, "getQuestionsForPaper").mockResolvedValue([]);
    vi.spyOn(prisma.paperPattern, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.paperPattern, "create").mockResolvedValue({
      id: "pat-new",
      title: "Physics Pattern v1",
      version: "v1",
      subjectId: "22222222-2222-2222-2222-222222222222",
      totalMarks: 60,
      durationMinutes: 180,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.spyOn(prisma.patternSamplePaperLink, "create").mockResolvedValue({} as any);

    const req = new NextRequest("http://localhost:3000/api/patterns/analyze", {
      method: "POST",
      headers: { "x-user-role": "EXAMINER" },
      body: JSON.stringify({
        subjectId: "22222222-2222-2222-2222-222222222222",
        samplePaperIds: ["11111111-1111-1111-1111-111111111111"],
      }),
    });

    const res = await analyzePattern(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.pattern.version).toBe("v1");
  });

  it("GET /api/patterns/[id]/validation performs deterministic consistency check", async () => {
    vi.spyOn(prisma.paperPattern, "findUnique").mockResolvedValue({
      id: "pat-1",
      title: "Physics Pattern v1",
      version: "v1",
      subjectId: "sub-1",
      totalMarks: 60,
      durationMinutes: 180,
      status: "ACTIVE",
      patternConfidence: 0.9,
      supportingSampleCount: 1,
      aggregationLevel: "SINGLE_PAPER",
      sectionStructure: [
        {
          name: "Section A",
          order: 1,
          totalMarks: 60,
          questionCount: 10,
          compulsoryCount: 10,
          optionalCount: 0,
          questionTypes: ["MCQ"],
          marksPerQuestion: [6],
        },
      ],
      questionDistribution: {},
      marksDistribution: {},
      difficultyObservations: {},
      targetDifficulty: {},
      choiceRules: [],
      wordingCharacteristics: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/patterns/pat-1/validation");
    const res = await getPatternValidation(req, { params: Promise.resolve({ id: "pat-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.validation.isConsistent).toBe(true);
  });
});

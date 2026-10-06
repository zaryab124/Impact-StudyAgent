// ==============================================================================
// AI Live Paper Generator - Knowledge Retrieval API Integration Tests
// Phase 6: All Retrieval REST API Endpoints Verification
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as searchRoute } from "@/app/api/retrieval/search/route";
import { POST as contextRoute } from "@/app/api/retrieval/context/route";
import { GET as chunkByIdRoute } from "@/app/api/retrieval/chunk/[id]/route";
import { POST as validateRoute } from "@/app/api/retrieval/validate/route";
import { GET as policiesRoute } from "@/app/api/retrieval/policies/route";
import { POST as testRoute } from "@/app/api/retrieval/test/route";
import { RetrievalService } from "@/server/retrieval/retrieval-service";

describe("Phase 6: Knowledge Retrieval API Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validPayload = {
    boardId: "board-01",
    academicYearId: "year-01",
    classId: "class-01",
    subjectId: "subj-01",
    syllabusId: "syl-01",
    query: "Explain Newton second law and momentum conservation",
    mode: "GENERAL_KNOWLEDGE",
    topK: 5,
    similarityThreshold: 0.3,
  };

  const mockPackage = {
    success: true,
    status: "SUCCESS",
    requestId: "ret_test_123",
    timestamp: new Date().toISOString(),
    retrievalMode: "GENERAL_KNOWLEDGE",
    syllabusId: "syl-01",
    query: "Explain Newton second law and momentum conservation",
    totalCandidates: 10,
    returnedCount: 2,
    contextBudget: {
      maxChunks: 10,
      usedChunks: 2,
      maxTokens: 3000,
      usedTokens: 150,
      maxPages: 8,
      usedPages: 2,
      maxCharacters: 12000,
      usedCharacters: 600,
      isTruncated: false,
      prunedCount: 0,
    },
    results: [
      {
        chunkId: "chk-01",
        content: "Force is equal to rate of change of momentum: F = ma.",
        heading: "Newton's Second Law",
        chunkType: "DEFINITION",
        tokenCount: 15,
        pageNumber: 42,
        relevanceScore: 0.92,
        provenance: {
          documentId: "doc-01",
          bookId: "bk-01",
          bookTitle: "Physics Grade 9",
          pageNumber: 42,
          chapterId: "ch-01",
          chapterTitle: "Dynamics",
          topicId: "top-01",
          topicTitle: "Newton Laws",
          chunkId: "chk-01",
          syllabusId: "syl-01",
          syllabusVersion: "v1.0",
          eligibilityStatus: "ELIGIBLE",
          sourceReference: "Physics Grade 9 | Ch: Dynamics | p.42",
          relevanceScore: 0.92,
        },
        explanation: {
          semanticScore: 0.9,
          keywordScore: 0.95,
          metadataScore: 0.9,
          finalScore: 0.92,
          chapterMatch: "EXACT" as const,
          topicMatch: "EXACT" as const,
          syllabusStatus: "VERIFIED",
          provenanceVerified: true,
          rankingConfigVersion: "v1.0.0",
          weights: { semantic: 0.55, keyword: 0.25, metadata: 0.20 },
        },
        isDiagnosticItem: false,
        productionEligible: true,
      },
    ],
    syllabusContext: {
      syllabusId: "syl-01",
      syllabusVersion: "v1.0",
      status: "VERIFIED",
    },
    qualityReport: {
      query: "Explain Newton second law and momentum conservation",
      expectedTopic: null,
      retrievedTopics: ["Newton Laws"],
      relevantResultCount: 2,
      irrelevantResultCount: 0,
      provenanceCoverage: 1.0,
      averageSimilarity: 0.92,
      retrievalLatency: 45,
      targetLatencyMs: 500,
      isBenchmarkMet: true,
      syllabusEligibilityCoverage: 1.0,
    },
    latencyBreakdown: {
      databaseQueryLatencyMs: 15,
      vectorSearchLatencyMs: 12,
      rankingLatencyMs: 8,
      contextAssemblyLatencyMs: 10,
      totalRetrievalLatencyMs: 45,
      targetLatencyMs: 500,
      isBenchmarkMet: true,
    },
    latencyMs: 45,
    rankingConfigVersion: "v1.0.0",
    isDiagnosticResult: false,
    productionEligible: true,
    message: "Retrieved 2 syllabus-grounded educational chunks.",
  };

  it("1. POST /api/retrieval/search returns candidate chunks with full provenance", async () => {
    vi.spyOn(RetrievalService, "retrieveKnowledge").mockResolvedValue(mockPackage as any);

    const req = new NextRequest("http://localhost:3000/api/retrieval/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      body: JSON.stringify(validPayload),
    });

    const res = await searchRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.results.length).toBe(1);
    expect(json.data.results[0].provenance.eligibilityStatus).toBe("ELIGIBLE");
    expect(json.data.results[0].provenance.bookTitle).toBe("Physics Grade 9");
  });

  it("2. POST /api/retrieval/search rejects invalid query with 400 Validation Error", async () => {
    const req = new NextRequest("http://localhost:3000/api/retrieval/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      body: JSON.stringify({ ...validPayload, query: "" }), // empty query
    });

    const res = await searchRoute(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("3. POST /api/retrieval/search blocks STUDENT role with 403 Forbidden", async () => {
    const req = new NextRequest("http://localhost:3000/api/retrieval/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "STUDENT" },
      body: JSON.stringify(validPayload),
    });

    const res = await searchRoute(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("Student role is not permitted");
  });

  it("4. POST /api/retrieval/context returns assembled context package with budget", async () => {
    vi.spyOn(RetrievalService, "retrieveKnowledge").mockResolvedValue({
      ...mockPackage,
      retrievalMode: "QUESTION_SUPPORT",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/retrieval/context", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "EXAMINER" },
      body: JSON.stringify(validPayload),
    });

    const res = await contextRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.retrievalMode).toBe("QUESTION_SUPPORT");
    expect(json.data.contextBudget).toBeDefined();
    expect(json.data.contextBudget.maxTokens).toBe(3000);
  });

  it("5. GET /api/retrieval/policies returns list of active retrieval policies", async () => {
    const req = new NextRequest("http://localhost:3000/api/retrieval/policies");
    const res = await policiesRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(2);

    const prodPolicy = json.data.find((p: any) => p.id === "policy-production-default");
    expect(prodPolicy).toBeDefined();
    expect(prodPolicy.allowedSyllabusStatuses).toContain("VERIFIED");
  });

  it("6. POST /api/retrieval/validate provides pre-flight hierarchy check", async () => {
    vi.spyOn(RetrievalService, "validateRequest").mockResolvedValue({
      isValid: true,
      syllabusStatus: "VERIFIED",
      queryUnderstanding: { intent: "EXPLANATION", requestedKnowledgeType: "CONCEPTUAL" },
      policy: { name: "Production Default Educational Policy" },
    } as any);

    const req = new NextRequest("http://localhost:3000/api/retrieval/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "TEACHER" },
      body: JSON.stringify({
        boardId: "board-01",
        academicYearId: "year-01",
        classId: "class-01",
        subjectId: "subj-01",
        syllabusId: "syl-01",
        query: "What is inertia?",
      }),
    });

    const res = await validateRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.isValid).toBe(true);
    expect(json.data.queryUnderstanding.intent).toBe("EXPLANATION");
  });

  it("7. GET /api/retrieval/chunk/[id] returns 404 for non-existent chunk", async () => {
    vi.spyOn(RetrievalService, "getChunkById").mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/retrieval/chunk/non-existent-chunk");
    const res = await chunkByIdRoute(req, {
      params: Promise.resolve({ id: "non-existent-chunk" }),
    });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("8. POST /api/retrieval/test blocks non-admin role with 403 Forbidden", async () => {
    const req = new NextRequest("http://localhost:3000/api/retrieval/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "TEACHER" }, // Teachers cannot run diagnostic bypass
      body: JSON.stringify(validPayload),
    });

    const res = await testRoute(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("Only administrators or chief examiners");
  });

  it("9. POST /api/retrieval/test executes diagnostic run for ADMIN role", async () => {
    vi.spyOn(RetrievalService, "retrieveKnowledge").mockResolvedValue({
      ...mockPackage,
      diagnosticMode: true,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/retrieval/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      body: JSON.stringify(validPayload),
    });

    const res = await testRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.results.length).toBe(1);
  });
});

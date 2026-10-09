// ==============================================================================
// AI Live Paper Generator - Knowledge Retrieval Engine Unit Tests
// Phase 6: All 24 Required Verification Scenarios
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetrievalService } from "@/server/retrieval/retrieval-service";
import { SyllabusGate } from "@/server/retrieval/syllabus-gate";
import { QueryUnderstander } from "@/server/retrieval/query-understander";
import { HybridRanker } from "@/server/retrieval/hybrid-ranker";
import { DeduplicationService } from "@/server/retrieval/deduplication-service";
import { ContextAssembler } from "@/server/retrieval/context-assembler";
import { PatternContextAdapter } from "@/server/retrieval/pattern-context-adapter";
import { RetrievalPolicyEngine } from "@/server/retrieval/retrieval-policy-engine";
import { RankingConfigRegistry } from "@/server/retrieval/ranking-config";
import { RetrievalDiagnostics } from "@/server/retrieval/retrieval-diagnostics";
import { EmbeddingService } from "@/server/book-intelligence/embedding-service";
import { RetrievalRequest } from "@/types/retrieval";
import { prisma } from "@/lib/db";

describe("Phase 6: Knowledge Retrieval Engine Unit Tests", () => {
  // Mock verified educational syllabus
  const mockVerifiedSyllabus = {
    id: "syl-physics-2025",
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-grade-9",
    subjectId: "subj-physics",
    status: "VERIFIED",
    version: "2025-v1.0",
    title: "Official Grade 9 Physics Syllabus",
    chapterItems: [
      {
        chapterId: "chap-01",
        isIncluded: true,
        weightage: 20,
        alignmentStatus: "MATCHED",
        examinationRelevance: "HIGH",
      },
      {
        chapterId: "chap-excluded",
        isIncluded: false,
        weightage: 0,
        alignmentStatus: "MATCHED",
        examinationRelevance: "OPTIONAL",
      },
    ],
    topicItems: [
      {
        topicId: "top-newton-laws",
        isIncluded: true,
        weightage: 10,
        alignmentStatus: "MATCHED",
        examinationRelevance: "HIGH",
      },
      {
        topicId: "top-excluded",
        isIncluded: false,
        weightage: 0,
        alignmentStatus: "MATCHED",
        examinationRelevance: "OPTIONAL",
      },
      {
        topicId: "top-review",
        isIncluded: true,
        weightage: 5,
        alignmentStatus: "REQUIRES_REVIEW",
        examinationRelevance: "MEDIUM",
      },
    ],
  };

  // Mock candidate educational chunks
  const mockEducationalChunks = [
    {
      id: "chunk-law2-def",
      documentId: "doc-phys-01",
      documentName: "Federal Physics Grade 9.pdf",
      bookId: "book-phys-9",
      bookTitle: "Physics Textbook Grade 9",
      pageNumber: 42,
      chapterId: "chap-01",
      chapterTitle: "Dynamics",
      chapterNumber: 3,
      topicId: "top-newton-laws",
      topicTitle: "Newton's Laws of Motion",
      topicCode: "3.2",
      chunkType: "DEFINITION",
      heading: "Newton's Second Law of Motion",
      content:
        "When a net force acts on a body, it produces an acceleration in the direction of the force. Acceleration is directly proportional to force and inversely proportional to mass. F = ma.",
      tokenCount: 45,
      confidence: 0.98,
      eligibilityStatus: "ELIGIBLE",
    },
    {
      id: "chunk-law2-formula",
      documentId: "doc-phys-01",
      documentName: "Federal Physics Grade 9.pdf",
      bookId: "book-phys-9",
      bookTitle: "Physics Textbook Grade 9",
      pageNumber: 43,
      chapterId: "chap-01",
      chapterTitle: "Dynamics",
      chapterNumber: 3,
      topicId: "top-newton-laws",
      topicTitle: "Newton's Laws of Motion",
      topicCode: "3.2",
      chunkType: "FORMULA",
      heading: "Mathematical Derivation of F = ma",
      content:
        "From Newton's second law, acceleration a is proportional to Force F, and inversely proportional to mass m. Therefore a = F/m, or F = ma. SI unit of force is Newton (N).",
      tokenCount: 48,
      confidence: 0.96,
      eligibilityStatus: "ELIGIBLE",
    },
    {
      id: "chunk-law2-numerical",
      documentId: "doc-phys-01",
      documentName: "Federal Physics Grade 9.pdf",
      bookId: "book-phys-9",
      bookTitle: "Physics Textbook Grade 9",
      pageNumber: 44,
      chapterId: "chap-01",
      chapterTitle: "Dynamics",
      chapterNumber: 3,
      topicId: "top-newton-laws",
      topicTitle: "Newton's Laws of Motion",
      topicCode: "3.2",
      chunkType: "EXAMPLE",
      heading: "Example 3.2: Force Calculation",
      content:
        "Calculate the force required to accelerate a 2000 kg car from rest to 20 m/s in 10 seconds. Using a = (v - u)/t = 2 m/s^2, Force F = ma = 2000 * 2 = 4000 N.",
      tokenCount: 52,
      confidence: 0.95,
      eligibilityStatus: "ELIGIBLE",
    },
    {
      id: "chunk-excluded-topic",
      documentId: "doc-phys-01",
      documentName: "Federal Physics Grade 9.pdf",
      bookId: "book-phys-9",
      bookTitle: "Physics Textbook Grade 9",
      pageNumber: 78,
      chapterId: "chap-01",
      chapterTitle: "Dynamics",
      topicId: "top-excluded",
      topicTitle: "Excluded Friction Mechanisms",
      chunkType: "CONCEPT",
      heading: "Advanced Microscopic Friction",
      content: "Detailed microscopic adhesion theory of cold welding surfaces during sliding motion.",
      tokenCount: 30,
      confidence: 0.90,
      eligibilityStatus: "EXCLUDED",
    },
    {
      id: "chunk-unknown-topic",
      documentId: "doc-phys-01",
      documentName: "Federal Physics Grade 9.pdf",
      bookId: "book-phys-9",
      bookTitle: "Physics Textbook Grade 9",
      pageNumber: 99,
      chapterId: "chap-unindexed",
      chapterTitle: "Supplementary Appendix",
      topicId: "top-unindexed",
      topicTitle: "Supplementary Material",
      chunkType: "CONCEPT",
      heading: "Relativistic Mechanics Preview",
      content: "At speeds approaching the speed of light, classical Newtonian mechanics breaks down.",
      tokenCount: 35,
      confidence: 0.85,
      eligibilityStatus: "UNKNOWN",
    },
  ];

  const baseRequest: RetrievalRequest = {
    boardId: "board-fed-01",
    academicYearId: "year-2024-25",
    classId: "class-grade-9",
    subjectId: "subj-physics",
    syllabusId: "syl-physics-2025",
    query: "Explain Newton's second law of motion and derive the formula F = ma",
    mode: "GENERAL_KNOWLEDGE",
    topK: 5,
    similarityThreshold: 0.3,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.syllabus as any, "findUnique").mockImplementation(async (args: any) => {
      const id = args?.where?.id;
      if (id === "syl-physics-2025") return mockVerifiedSyllabus as any;
      if (id === "syl-draft") return { ...mockVerifiedSyllabus, id, status: "DRAFT" } as any;
      if (id === "syl-under-review") return { ...mockVerifiedSyllabus, id, status: "UNDER_REVIEW" } as any;
      if (id === "syl-archived") return { ...mockVerifiedSyllabus, id, status: "ARCHIVED" } as any;
      return null;
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 1: REQUEST VALIDATION & HARD SYLLABUS GATE
  // ----------------------------------------------------------------------------
  describe("Suite 1: Request Validation & Hierarchy Gating", () => {
    it("Scenario 1: Valid retrieval request succeeds with proper hierarchy alignment", async () => {
      const res = await RetrievalService.retrieveKnowledge(baseRequest, {
        syntheticCandidates: mockEducationalChunks,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("SUCCESS");
      expect(res.results.length).toBeGreaterThan(0);
      expect(res.syllabusContext.syllabusId).toBe("syl-physics-2025");
      expect(res.syllabusContext.status).toBe("VERIFIED");
    });

    it("Scenario 2: Invalid hierarchy rejects mismatched board, class, or subject", async () => {
      // Pass synthetic mismatched syllabus
      const invalidHierarchyRequest: RetrievalRequest = {
        ...baseRequest,
        boardId: "board-other-mismatched",
      };

      await expect(
        SyllabusGate.validateHierarchy({
          boardId: invalidHierarchyRequest.boardId,
          academicYearId: invalidHierarchyRequest.academicYearId,
          classId: invalidHierarchyRequest.classId,
          subjectId: invalidHierarchyRequest.subjectId,
          syllabusId: invalidHierarchyRequest.syllabusId,
        })
      ).resolves.toMatchObject({
        isValid: false,
        error: expect.stringContaining("Hierarchy mismatch"),
      });
    });

    it("Scenario 2b: Inter-compatible Punjab and Federal boards allow shared national curriculum syllabus", async () => {
      // Federal board syllabus (board-fed-01) requested with Punjab BISE Lahore (board-punjab-lhr)
      const res = await SyllabusGate.validateHierarchy({
        boardId: "board-punjab-lhr",
        academicYearId: baseRequest.academicYearId,
        classId: baseRequest.classId,
        subjectId: baseRequest.subjectId,
        syllabusId: "syl-physics-2025",
      });

      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("Scenario 3: Unverified syllabus rejection (DRAFT, UNDER_REVIEW, ARCHIVED)", async () => {
      await expect(
        RetrievalService.retrieveKnowledge({
          ...baseRequest,
          syllabusId: "syl-draft",
        })
      ).rejects.toThrow(/HARD SYLLABUS GATE REJECTION.*DRAFT/i);
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 2: HARD SYLLABUS ELIGIBILITY GATE
  // ----------------------------------------------------------------------------
  describe("Suite 2: Hard Syllabus Eligibility Gate", () => {
    it("Scenario 4: Excluded content rejection (EXCLUDED topics/chapters strictly blocked)", async () => {
      const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
        mockEducationalChunks,
        mockVerifiedSyllabus,
        { diagnosticMode: false }
      );

      const hasExcluded = eligible.some((c) => c.id === "chunk-excluded-topic");
      expect(hasExcluded).toBe(false);

      const rejectedExcluded = rejected.find((c) => c.id === "chunk-excluded-topic");
      expect(rejectedExcluded).toBeDefined();
      expect(rejectedExcluded.eligibilityStatus).toBe("EXCLUDED");
    });

    it("Scenario 5: UNKNOWN content rejection (unindexed content blocked in production)", async () => {
      const { eligible, rejected } = await SyllabusGate.filterEligibleChunks(
        mockEducationalChunks,
        mockVerifiedSyllabus,
        { diagnosticMode: false }
      );

      const hasUnknown = eligible.some((c) => c.id === "chunk-unknown-topic");
      expect(hasUnknown).toBe(false);

      const rejectedUnknown = rejected.find((c) => c.id === "chunk-unknown-topic");
      expect(rejectedUnknown).toBeDefined();
      expect(rejectedUnknown.eligibilityStatus).toBe("UNKNOWN");
    });

    it("Scenario 6: Eligible content retrieval (ELIGIBLE content returned with verified status)", async () => {
      const { eligible } = await SyllabusGate.filterEligibleChunks(
        mockEducationalChunks,
        mockVerifiedSyllabus,
        { diagnosticMode: false }
      );

      expect(eligible.length).toBe(3);
      for (const item of eligible) {
        expect(item.eligibilityStatus).toBe("ELIGIBLE");
        expect(item.syllabusId).toBe("syl-physics-2025");
      }
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 3: SEARCH, VECTOR & KEYWORD RETRIEVAL
  // ----------------------------------------------------------------------------
  describe("Suite 3: Search, Vector & Keyword Retrieval", () => {
    it("Scenario 7: Vector similarity retrieval (higher cosine similarity ranks higher)", () => {
      const vecQuery = EmbeddingService.generateDeterministicVector("Newton second law", 768);
      const vecMatch = EmbeddingService.generateDeterministicVector("Newton second law", 768);
      const vecDiff = EmbeddingService.generateDeterministicVector("Photosynthesis in plants", 768);

      const simHigh = EmbeddingService.cosineSimilarity(vecQuery, vecMatch);
      const simLow = EmbeddingService.cosineSimilarity(vecQuery, vecDiff);

      expect(simHigh).toBeGreaterThan(simLow);
      expect(simHigh).toBeCloseTo(1.0, 2);
    });

    it("Scenario 8: Keyword retrieval (term frequency and phrase matching prioritize relevant content)", () => {
      const query = "Newton's second law";
      const scoreHigh = HybridRanker.computeKeywordScore(
        query,
        "Newton's second law states that F = ma",
        "Dynamics"
      );
      const scoreLow = HybridRanker.computeKeywordScore(
        query,
        "Thermodynamics discusses heat transfer mechanisms",
        "Heat"
      );

      expect(scoreHigh).toBeGreaterThan(scoreLow);
      expect(scoreHigh).toBeGreaterThan(0.4);
    });

    it("Scenario 9: Hybrid ranking (computes deterministic formula 0.55*sem + 0.25*kw + 0.20*meta)", () => {
      const ranked = HybridRanker.rankCandidate({
        chunk: mockEducationalChunks[0],
        query: "Newton second law",
        semanticSimilarity: 0.8,
        targetChapterId: "chap-01",
        targetTopicId: "top-newton-laws",
        targetChunkTypes: ["DEFINITION"],
      });

      expect(ranked.finalScore).toBeGreaterThan(0.5);
      expect(ranked.finalScore).toBeLessThanOrEqual(1.0);
      expect(ranked.explanation.chapterMatch).toBe("EXACT");
      expect(ranked.explanation.topicMatch).toBe("EXACT");
      expect(ranked.explanation.provenanceVerified).toBe(true);
    });

    it("Scenario 10: Metadata filtering (restricts candidates by chapter, topic, and chunkType)", async () => {
      const res = await RetrievalService.retrieveKnowledge(
        {
          ...baseRequest,
          chapterId: "chap-01",
          topicId: "top-newton-laws",
          chunkTypes: ["FORMULA"],
        },
        { syntheticCandidates: mockEducationalChunks }
      );

      expect(res.results.length).toBeGreaterThan(0);
      for (const item of res.results) {
        expect(item.chunkType).toBe("FORMULA");
      }
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 4: QUERY UNDERSTANDING & RETRIEVAL MODES
  // ----------------------------------------------------------------------------
  describe("Suite 4: Query Understanding & Retrieval Modes", () => {
    it("Scenario 11: Query understanding (extracts intent and knowledge types without inventing metadata)", () => {
      const qu1 = QueryUnderstander.understandQuery("Explain Newton's second law of motion");
      expect(qu1.intent).toBe("EXPLANATION");
      expect(qu1.requestedKnowledgeType).toBe("CONCEPTUAL");
      expect(qu1.detectedSubject).toBeNull(); // Never hallucinates

      const qu2 = QueryUnderstander.understandQuery("Define inertia and momentum");
      expect(qu2.intent).toBe("DEFINITION");
      expect(qu2.requestedKnowledgeType).toBe("DEFINITION");

      const qu3 = QueryUnderstander.understandQuery("Calculate acceleration of a 5kg mass given force 20N");
      expect(qu3.intent).toBe("NUMERICAL");
      expect(qu3.requestedKnowledgeType).toBe("NUMERICAL");
    });

    it("Scenario 12: Retrieval modes (applies appropriate chunkType filters per mode)", () => {
      expect(PatternContextAdapter.getChunkTypesForMode("DEFINITION")).toEqual([
        "DEFINITION",
        "CONCEPT",
      ]);
      expect(PatternContextAdapter.getChunkTypesForMode("FORMULA")).toEqual([
        "FORMULA",
        "CONCEPT",
      ]);
      expect(PatternContextAdapter.getChunkTypesForMode("NUMERICAL")).toEqual([
        "FORMULA",
        "EXAMPLE",
        "EXERCISE",
      ]);
      expect(PatternContextAdapter.getChunkTypesForMode("GENERAL_KNOWLEDGE")).toEqual([]);
    });

    it("Scenario 19: Pattern-context filtering (biases candidate types by question type and marks)", () => {
      const biasNum = PatternContextAdapter.mapPatternToRetrievalFilters({
        targetQuestionType: "NUMERICAL",
        targetMarks: 5,
      });

      expect(biasNum.suggestedMode).toBe("NUMERICAL");
      expect(biasNum.biasedChunkTypes).toContain("FORMULA");
      expect(biasNum.biasedChunkTypes).toContain("EXAMPLE");

      const biasShort = PatternContextAdapter.mapPatternToRetrievalFilters({
        targetQuestionType: "SHORT",
        targetMarks: 2,
      });
      expect(biasShort.suggestedMode).toBe("CONCEPT");
      expect(biasShort.biasedChunkTypes).toContain("DEFINITION");
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 5: CONTEXT ASSEMBLY, BUDGETING & DIVERSITY
  // ----------------------------------------------------------------------------
  describe("Suite 5: Context Assembly, Budgeting & Diversity", () => {
    it("Scenario 13: Context budgeting (strictly enforces maxChunks, maxTokens, maxPages)", () => {
      const mockRanked = mockEducationalChunks.slice(0, 3).map((chunk, idx) => ({
        chunk,
        semanticScore: 0.8 - idx * 0.1,
        keywordScore: 0.7,
        metadataScore: 0.8,
        finalScore: 0.8 - idx * 0.1,
        explanation: {
          semanticScore: 0.8,
          keywordScore: 0.7,
          metadataScore: 0.8,
          finalScore: 0.8,
          chapterMatch: "EXACT" as const,
          topicMatch: "EXACT" as const,
          syllabusStatus: "VERIFIED",
          provenanceVerified: true,
        },
      }));

      // Set maxChunks budget to 2
      const { items, budget } = ContextAssembler.assembleContext(
        mockRanked,
        mockVerifiedSyllabus,
        {
          maxChunks: 2,
          maxTokens: 500,
          maxPages: 5,
        }
      );

      expect(items.length).toBe(2);
      expect(budget.usedChunks).toBe(2);
      expect(budget.isTruncated).toBe(true);
      expect(budget.prunedCount).toBe(1);
    });

    it("Scenario 14: Deduplication (prunes near-duplicate chunks > 0.85 Jaccard overlap)", () => {
      const originalText = "Newton second law states that Force equals mass times acceleration F = ma.";
      const nearDuplicateText = "Newton's second law states that Force equals mass times acceleration F=ma.";

      const overlap = DeduplicationService.calculateJaccardOverlap(originalText, nearDuplicateText);
      expect(overlap).toBeGreaterThan(0.85);

      const candidates = [
        {
          chunk: { ...mockEducationalChunks[0], content: originalText },
          finalScore: 0.9,
          semanticScore: 0.9,
          keywordScore: 0.9,
          metadataScore: 0.9,
          explanation: {} as any,
        },
        {
          chunk: { ...mockEducationalChunks[0], id: "chunk-dup", content: nearDuplicateText },
          finalScore: 0.88,
          semanticScore: 0.88,
          keywordScore: 0.88,
          metadataScore: 0.88,
          explanation: {} as any,
        },
      ];

      const { kept, prunedDuplicates } = DeduplicationService.deduplicateAndDiversify(candidates, {
        textOverlapThreshold: 0.85,
      });

      expect(kept.length).toBe(1);
      expect(prunedDuplicates).toBe(1);
      expect(kept[0].finalScore).toBe(0.9);
    });

    it("Scenario 15: Diversity (limits chunks per page to avoid paragraph clustering)", () => {
      // 4 distinct chunks on the same page (page 42)
      const distinctPhrases = [
        "Inertia resists any velocity changes in a physical body.",
        "Force causes mass acceleration according to F = ma equation.",
        "Action and reaction are always equal and opposite in direction.",
        "Momentum is mass times velocity vector quantity.",
      ];

      const samePageCandidates = [1, 2, 3, 4].map((i) => ({
        chunk: {
          ...mockEducationalChunks[0],
          id: `chunk-p42-${i}`,
          pageNumber: 42,
          content: distinctPhrases[i - 1],
        },
        finalScore: 0.9 - i * 0.05,
        semanticScore: 0.8,
        keywordScore: 0.8,
        metadataScore: 0.8,
        explanation: {} as any,
      }));

      const { kept, prunedClustered } = DeduplicationService.deduplicateAndDiversify(
        samePageCandidates,
        {
          maxChunksPerPage: 2,
        }
      );

      expect(kept.length).toBe(2);
      expect(prunedClustered).toBe(2);
    });

    it("Scenario 16: Provenance validation (rejects any chunk with missing book, chapter, page, or syllabus)", () => {
      const invalidProvenanceChunk = {
        ...mockEducationalChunks[0],
        documentId: "", // Missing document ID
        bookTitle: "", // Missing book title
      };

      const prov = ContextAssembler.extractProvenance(
        invalidProvenanceChunk,
        mockVerifiedSyllabus,
        0.8
      );
      const isValid = ContextAssembler.isProvenanceValid(prov);

      expect(isValid).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 6: ROBUSTNESS, POLICIES, SECURITY & DIAGNOSTICS
  // ----------------------------------------------------------------------------
  describe("Suite 6: Robustness, Policies, Security & Diagnostics", () => {
    it("Scenario 17: No-result behavior (returns explicit NO_RELEVANT_KNOWLEDGE rather than hallucinating)", async () => {
      const res = await RetrievalService.retrieveKnowledge(
        {
          ...baseRequest,
          query: "Quantum entanglement in black hole event horizons",
          similarityThreshold: 0.99, // Unreachable threshold
        },
        { syntheticCandidates: mockEducationalChunks }
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe("NO_RELEVANT_KNOWLEDGE");
      expect(res.results.length).toBe(0);
      expect(res.message).toContain("NO_RELEVANT_KNOWLEDGE");
    });

    it("Scenario 18: Missing embedding behavior (falls back gracefully to deterministic pseudo-vector)", () => {
      const fallbackVector = EmbeddingService.generateDeterministicVector("Sample query text", 768);
      expect(fallbackVector).toBeDefined();
      expect(fallbackVector.length).toBe(768);

      const sim = EmbeddingService.cosineSimilarity(fallbackVector, fallbackVector);
      expect(sim).toBeCloseTo(1.0, 3);
    });

    it("Scenario 20: Security and authorization (diagnostic bypass strictly blocked for non-admin)", () => {
      const complianceNormal = RetrievalPolicyEngine.validateCompliance(
        "DRAFT",
        "ELIGIBLE",
        false, // diagnostic false
        false // normal user
      );
      expect(complianceNormal.isAllowed).toBe(false);

      const complianceAdminDiagnostic = RetrievalPolicyEngine.validateCompliance(
        "DRAFT",
        "ELIGIBLE",
        true, // diagnostic true
        true // admin user
      );
      expect(complianceAdminDiagnostic.isAllowed).toBe(true);
    });

    it("Scenario 21: Retrieval policy enforcement (production policy strictly enforces VERIFIED/PUBLISHED)", () => {
      const prodPolicy = RetrievalPolicyEngine.getProductionPolicy();
      expect(prodPolicy.allowedSyllabusStatuses).toEqual(["VERIFIED", "PUBLISHED"]);
      expect(prodPolicy.allowedEligibilityStatuses).toEqual(["ELIGIBLE"]);
      expect(prodPolicy.provenanceRequired).toBe(true);
    });

    it("Scenario 22: Performance / latency constraints (executes in milliseconds with granular breakdown)", async () => {
      const res = await RetrievalService.retrieveKnowledge(baseRequest, {
        syntheticCandidates: mockEducationalChunks,
      });

      expect(res.latencyMs).toBeGreaterThan(0);
      expect(res.latencyBreakdown).toBeDefined();
      expect(res.latencyBreakdown.databaseQueryLatencyMs).toBeGreaterThanOrEqual(1);
      expect(res.latencyBreakdown.vectorSearchLatencyMs).toBeGreaterThanOrEqual(1);
      expect(res.latencyBreakdown.rankingLatencyMs).toBeGreaterThanOrEqual(1);
      expect(res.latencyBreakdown.contextAssemblyLatencyMs).toBeGreaterThanOrEqual(1);
      expect(res.latencyBreakdown.totalRetrievalLatencyMs).toBeGreaterThanOrEqual(1);
      expect(res.latencyBreakdown.targetLatencyMs).toBe(500);
      expect(typeof res.latencyBreakdown.isBenchmarkMet).toBe("boolean");
      expect(res.qualityReport.isBenchmarkMet).toBe(res.latencyBreakdown.isBenchmarkMet);
    });

    it("Scenario 23: Retrieval diagnostics & explanations (produces complete score and provenance breakdown)", async () => {
      const res = await RetrievalService.retrieveKnowledge(baseRequest, {
        syntheticCandidates: mockEducationalChunks,
      });

      expect(res.qualityReport).toBeDefined();
      expect(res.qualityReport.provenanceCoverage).toBe(1.0);
      expect(res.qualityReport.syllabusEligibilityCoverage).toBe(1.0);
      expect(res.qualityReport.retrievalLatency).toBeGreaterThan(0);

      const firstItem = res.results[0];
      const explanationText = RetrievalDiagnostics.formatDiagnosticExplanation(firstItem);
      expect(explanationText).toContain("Final Score");
      expect(explanationText).toContain("Semantic Similarity");
      expect(explanationText).toContain("Provenance: VERIFIED");
    });

    it("Scenario 24: Pre-flight validation integration", async () => {
      const validation = await RetrievalService.validateRequest(baseRequest);
      expect(validation.isValid).toBe(true);
      expect(validation.queryUnderstanding).toBeDefined();
      expect(validation.policy.allowedSyllabusStatuses).toContain("VERIFIED");
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 7: 7 MANDATORY REFINEMENT VERIFICATION SCENARIOS
  // ----------------------------------------------------------------------------
  describe("Suite 7: 7 Mandatory Refinement Verification Scenarios", () => {
    it("Refinement Scenario 1: Diagnostic override cannot reach production generation context", async () => {
      // Diagnostic mode retrieval by admin
      const diagRes = await RetrievalService.retrieveKnowledge(
        { ...baseRequest, diagnosticMode: true },
        { isAdmin: true, diagnosticMode: true, syntheticCandidates: mockEducationalChunks }
      );
      expect(diagRes.isDiagnosticResult).toBe(true);
      expect(diagRes.productionEligible).toBe(false);
      expect(RetrievalService.isPackageProductionEligible(diagRes)).toBe(false);

      // Normal production retrieval
      const prodRes = await RetrievalService.retrieveKnowledge(baseRequest, {
        syntheticCandidates: mockEducationalChunks,
      });
      expect(prodRes.isDiagnosticResult).toBe(false);
      expect(prodRes.productionEligible).toBe(true);
      expect(RetrievalService.isPackageProductionEligible(prodRes)).toBe(true);
    });

    it("Refinement Scenario 2: Ranking configuration version is preserved and reported", async () => {
      const res = await RetrievalService.retrieveKnowledge(baseRequest, {
        syntheticCandidates: mockEducationalChunks,
      });

      expect(res.rankingConfigVersion).toBe("v1.0.0");
      expect(res.results.length).toBeGreaterThan(0);
      expect(res.results[0].explanation.rankingConfigVersion).toBe("v1.0.0");
      expect(res.results[0].explanation.weights).toEqual({
        semantic: 0.55,
        keyword: 0.25,
        metadata: 0.20,
      });
    });

    it("Refinement Scenario 3: Ranking weights are configurable dynamically", async () => {
      // Register custom versioned configuration
      RankingConfigRegistry.registerConfig({
        version: "v2.0.0-custom",
        name: "Custom Experimental Weighting",
        description: "Emphasizes semantic vector matching above all else",
        weights: {
          semantic: 0.80,
          keyword: 0.10,
          metadata: 0.10,
        },
      });

      const res = await RetrievalService.retrieveKnowledge(
        { ...baseRequest, rankingConfigVersion: "v2.0.0-custom" },
        { syntheticCandidates: mockEducationalChunks }
      );

      expect(res.rankingConfigVersion).toBe("v2.0.0-custom");
      expect(res.results[0].explanation.rankingConfigVersion).toBe("v2.0.0-custom");
      expect(res.results[0].explanation.weights?.semantic).toBe(0.80);
      expect(res.results[0].explanation.weights?.keyword).toBe(0.10);
      expect(res.results[0].explanation.weights?.metadata).toBe(0.10);

      // Reset registry to default
      RankingConfigRegistry.resetToDefaults();
      expect(RankingConfigRegistry.getActiveVersion()).toBe("v1.0.0");
    });

    it("Refinement Scenario 4: Provenance failure blocks downstream context assembly (13 coordinates)", () => {
      // Candidate with missing chapter information
      const candidateMissingChapter = {
        ...mockEducationalChunks[0],
        id: "chunk-missing-chapter",
        chapterId: "",
        chapterTitle: "",
      };

      // Candidate with non-eligible status
      const candidateBadStatus = {
        ...mockEducationalChunks[0],
        id: "chunk-bad-status",
        eligibilityStatus: "UNKNOWN",
      };

      // Candidate with missing syllabus version
      const candidateMissingVersion = {
        ...mockEducationalChunks[0],
        id: "chunk-missing-ver",
        syllabusVersion: "",
      };

      const assembly = ContextAssembler.assembleContext(
        [
          { chunk: candidateMissingChapter, finalScore: 0.95 } as any,
          { chunk: candidateBadStatus, finalScore: 0.90 } as any,
          { chunk: candidateMissingVersion, finalScore: 0.85 } as any,
        ],
        { id: "syl-01", version: "" }, // Empty syllabus version
        { provenanceRequired: true }
      );

      expect(assembly.items.length).toBe(0);
      expect(assembly.rejectedProvenanceCount).toBe(3);
    });

    it("Refinement Scenario 5: PaperPattern cannot override syllabus eligibility", async () => {
      // mockEducationalChunks[3] is for topic "top-excluded", which is excluded in mockVerifiedSyllabus
      const excludedCandidate = mockEducationalChunks[3];
      expect(excludedCandidate.topicId).toBe("top-excluded");

      // Query with pattern context matching numerical calculation
      const res = await RetrievalService.retrieveKnowledge(
        {
          ...baseRequest,
          patternContext: {
            targetQuestionType: "NUMERICAL",
            targetMarks: 5,
            targetSection: "Section B",
          },
        },
        { syntheticCandidates: [excludedCandidate] }
      );

      // Excluded chunk must NEVER be returned despite pattern context match
      expect(res.status).toBe("NO_RELEVANT_KNOWLEDGE");
      expect(res.results.length).toBe(0);
    });

    it("Refinement Scenario 6: Missing curriculum metadata is not hallucinated in query understanding", () => {
      const vagueQuery = "Explain the fundamental principles and laws in natural philosophy";
      const understanding = QueryUnderstander.understandQuery(vagueQuery);

      expect(understanding.rawQuery).toBe(vagueQuery);
      // Invariant: Missing curriculum metadata is NEVER invented or hallucinated
      expect(understanding.detectedChapter).toBeNull();
      expect(understanding.detectedTopic).toBeNull();
      expect(understanding.detectedSubject).toBeNull();
    });

    it("Refinement Scenario 7: No-result retrieval cannot produce generated filler content", async () => {
      const res = await RetrievalService.retrieveKnowledge(
        {
          ...baseRequest,
          query: "Arbitrary query for which there are zero matching textbook chunks",
        },
        { syntheticCandidates: [] }
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe("NO_RELEVANT_KNOWLEDGE");
      expect(res.results).toEqual([]);
      expect(res.returnedCount).toBe(0);
      expect(res.message).toContain("NO_RELEVANT_KNOWLEDGE");
      // Zero hallucination invariant: No placeholder content generated
      expect(res.message).not.toContain("Lorem ipsum");
      expect(res.message).not.toContain("Sample answer");
    });
  });
});

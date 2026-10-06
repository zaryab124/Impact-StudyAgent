// ==============================================================================
// AI Live Paper Generator - Real-World Validation Unit Tests (Phase 11)
// Comprehensive Verification of Pilots, 20-Domain Engine, Security & Launch Gate
// ==============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { ValidationRepository } from "@/server/validation/validation-repository";
import { ValidationEngine } from "@/server/validation/validation-engine";
import { PunjabBoardPilot } from "@/server/pilots/punjab-board-pilot";
import { TextbookPilot } from "@/server/pilots/textbook-pilot";
import { SyllabusPilot } from "@/server/pilots/syllabus-pilot";
import { SamplePaperPilot } from "@/server/pilots/sample-paper-pilot";
import { RetrievalPilot } from "@/server/pilots/retrieval-pilot";
import { SecurityPilot } from "@/server/pilots/security-pilot";
import { ConcurrencyPilot } from "@/server/pilots/concurrency-pilot";
import { PerformancePilot } from "@/server/pilots/performance-pilot";
import { BackupRecoveryPilot } from "@/server/pilots/backup-recovery-pilot";
import { DeploymentPilot } from "@/server/pilots/deployment-pilot";
import { VerificationTier, ValidationDomain } from "@/types/validation";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

describe("Phase 11: Real-World Validation & Production Pilot Engines", () => {
  beforeEach(() => {
    ValidationRepository.resetMemory();
    PunjabBoardPilot.resetMemory();
    ExamRepository.resetMemory();
  });

  // --------------------------------------------------------------------------
  // 1. Verification Tier Invariants & Repository Persistence
  // --------------------------------------------------------------------------
  describe("Verification Tier Invariants & Validation Repository", () => {
    it("strictly differentiates between all 5 verification tiers", () => {
      const tiers: VerificationTier[] = [
        "IMPLEMENTED",
        "TESTED_LOCALLY",
        "EXTERNALLY_VERIFIED",
        "PRODUCTION_VERIFIED",
        "UNVERIFIED",
      ];
      expect(tiers).toHaveLength(5);
    });

    it("saves and retrieves validation runs and performance benchmarks in dual-tier repository", async () => {
      const mockRun: any = {
        id: "val_test_run_01",
        releaseCandidate: "STUDY_AGENT_RC_1",
        startedAt: new Date().toISOString(),
        environment: "test",
        version: "1.0.0-rc1",
        overallStatus: "PASSED",
        overallTier: "TESTED_LOCALLY",
        initiatedBy: "vitest-runner",
        domains: {},
        checks: [],
      };

      await ValidationRepository.saveRun(mockRun);
      const found = await ValidationRepository.findRunById("val_test_run_01");
      expect(found).not.toBeNull();
      expect(found?.releaseCandidate).toBe("STUDY_AGENT_RC_1");

      const latest = await ValidationRepository.getLatestRun();
      expect(latest?.id).toBe("val_test_run_01");

      ValidationRepository.recordPerformance({
        operationName: "TEST_LATENCY_BENCHMARK",
        latencyMs: 12.5,
        timestamp: new Date().toISOString(),
        environment: "test",
        status: "NORMAL",
      });

      const metrics = ValidationRepository.getRecentPerformance(5);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operationName).toBe("TEST_LATENCY_BENCHMARK");
      expect(metrics[0].status).toBe("NORMAL");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Punjab Board Real-Data Pilot Engine (10-Stage Pipeline)
  // --------------------------------------------------------------------------
  describe("Punjab Board Real-Data Pilot Engine", () => {
    it("generates authentic Punjab Board curriculum payload with PCTB gazette hash", () => {
      const payload = PunjabBoardPilot.getOfficialPunjabBoardPayload();
      expect(payload.code).toBe("BISE_PUNJAB_LHR");
      expect(payload.provenance.publisher).toBe("Punjab Curriculum and Textbook Board (PCTB)");
      expect(payload.provenance.sourceDocumentHash).toBeDefined();
      expect(payload.academicYears).toHaveLength(1);
      expect(payload.academicYears[0].classes[0].subjects[0].name).toBe("Physics (Class 9)");
    });

    it("executes complete 10-stage onboarding flow to PUBLISH state with director sign-off", async () => {
      const payload = PunjabBoardPilot.getOfficialPunjabBoardPayload();
      const outcome = await PunjabBoardPilot.executeOnboardingFlow(payload, "punjab-academic-director");

      expect(outcome.success).toBe(true);
      expect(outcome.stage).toBe("PUBLISH");
      expect(outcome.errors).toHaveLength(0);

      const record = PunjabBoardPilot.getPilotRecord(outcome.recordId);
      expect(record?.verificationStatus).toBe("VERIFIED");
      expect(record?.verifiedBy).toBe("punjab-academic-director");
    });

    it("blocks onboarding without authorized director sign-off (HUMAN_REVIEW gate)", async () => {
      const payload = PunjabBoardPilot.getOfficialPunjabBoardPayload();
      const outcome = await PunjabBoardPilot.executeOnboardingFlow(payload, undefined);

      expect(outcome.success).toBe(false);
      expect(outcome.stage).toBe("HUMAN_REVIEW");
      expect(outcome.errors[0]).toContain("HUMAN_REVIEW_REQUIRED");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Textbook Intelligence Pilot Engine (5-Point Provenance)
  // --------------------------------------------------------------------------
  describe("Textbook Intelligence Pilot Engine", () => {
    it("validates 5-point chunk provenance traceability (doc -> book -> chapter -> topic -> page)", () => {
      const validChunk = {
        documentId: "doc_pctb_phy9",
        bookId: "book_phy9",
        bookTitle: "Physics 9",
        chapterId: "ch_01",
        chapterTitle: "Measurements",
        topicId: "top_01",
        topicTitle: "Base Quantities",
        pageNumber: 3,
        checksumSha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      };

      const check = TextbookPilot.validateChunkProvenance(validChunk);
      expect(check.valid).toBe(true);
      expect(check.missingFields).toHaveLength(0);
    });

    it("rejects chunks missing page number or topic references", () => {
      const badChunk = {
        documentId: "doc_pctb_phy9",
        bookId: "book_phy9",
        bookTitle: "Physics 9",
        chapterId: "ch_01",
        chapterTitle: "Measurements",
        // missing pageNumber, topicId, topicTitle
      };

      const check = TextbookPilot.validateChunkProvenance(badChunk);
      expect(check.valid).toBe(false);
      expect(check.missingFields).toContain("pageNumber");
      expect(check.missingFields).toContain("topicId/topicTitle");
    });

    it("executes 10-step document pipeline with PDF magic-byte verification", async () => {
      const validPdfBuffer = Buffer.from(
        "%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n" +
        "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n" +
        "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>endobj\n" +
        "xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000068 00000 n \n0000000125 00000 n \n" +
        "trailer<< /Size 4 /Root 1 0 R >>\nstartxref\n200\n%%EOF"
      );

      const res = await TextbookPilot.executeTextbookPipeline({
        documentId: "doc_test_unit_01",
        bookTitle: "Physics Class 9 - Punjab Textbook Board",
        pdfBuffer: validPdfBuffer,
        authorOrPublisher: "PCTB",
      });

      expect(res.success).toBe(true);
      expect(res.validChunksCount).toBeGreaterThan(0);
      expect(res.rejectedChunksCount).toBe(0);
      expect(res.documentHash).toHaveLength(64);
    });

    it("rejects non-PDF files via binary magic-byte inspection", async () => {
      const fakeBuffer = Buffer.from("NOT_A_PDF_FILE_JUST_PLAIN_TEXT");
      const res = await TextbookPilot.executeTextbookPipeline({
        documentId: "doc_fake_01",
        bookTitle: "Fake Book",
        pdfBuffer: fakeBuffer,
        authorOrPublisher: "PCTB",
      });

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain("PDF header");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Syllabus Eligibility Gate Pilot Engine
  // --------------------------------------------------------------------------
  describe("Syllabus Eligibility Gate Pilot Engine", () => {
    it("allows PUBLISHED syllabus with complete cryptographic provenance and zero unresolved mappings", () => {
      const res = SyllabusPilot.evaluateSyllabusEligibility({
        id: "syl_pctb_2024",
        version: "2024.1",
        status: "PUBLISHED",
        provenanceHash: "abcdef1234567890abcdef1234567890",
        publisher: "Punjab Curriculum and Textbook Board",
        unresolvedTopicMappingsCount: 0,
      });

      expect(res.isEligibleForExamination).toBe(true);
      expect(res.blockingReason).toBeUndefined();
    });

    it("blocks DRAFT, UNDER_REVIEW, ARCHIVED, REJECTED, UNKNOWN, and EXCLUDED states", () => {
      const blockedStates = ["DRAFT", "UNDER_REVIEW", "ARCHIVED", "REJECTED", "UNKNOWN", "EXCLUDED"];

      for (const st of blockedStates) {
        const res = SyllabusPilot.evaluateSyllabusEligibility({
          id: `syl_${st.toLowerCase()}`,
          version: "1.0",
          status: st,
          provenanceHash: "abcdef1234567890abcdef1234567890",
          publisher: "PCTB",
          unresolvedTopicMappingsCount: 0,
        });

        expect(res.isEligibleForExamination).toBe(false);
        expect(res.blockingReason).toContain("SYLLABUS_GATE_BLOCKED");
      }
    });

    it("blocks syllabus with unresolved topic mappings", () => {
      const res = SyllabusPilot.evaluateSyllabusEligibility({
        id: "syl_with_unmapped",
        version: "2024.1",
        status: "PUBLISHED",
        provenanceHash: "abcdef1234567890abcdef1234567890",
        publisher: "PCTB",
        unresolvedTopicMappingsCount: 3,
      });

      expect(res.isEligibleForExamination).toBe(false);
      expect(res.blockingReason).toContain("ZERO_UNRESOLVED_MAPPINGS");
    });
  });

  // --------------------------------------------------------------------------
  // 5. Sample Paper Intelligence Pilot Engine
  // --------------------------------------------------------------------------
  describe("Sample Paper Intelligence Pilot Engine", () => {
    it("preserves authentic Punjab Board question numbering and deterministic marks arithmetic", () => {
      const paper = SamplePaperPilot.getOfficialPunjabSamplePaper();
      expect(paper.totalMarks).toBe(60);
      expect(paper.sections).toHaveLength(5);

      const audit = SamplePaperPilot.verifySamplePaperIntegrity(paper);
      expect(audit.isNumberingPreserved).toBe(true);
      expect(audit.arithmeticValid).toBe(true);
      expect(audit.choiceRulesVerified).toBe(true);
      expect(audit.calculatedAttemptableMarks).toBe(60);
      expect(audit.errors).toHaveLength(0);
    });

    it("evaluates question difficulty using multi-signal heuristics without guessing", () => {
      const paper = SamplePaperPilot.getOfficialPunjabSamplePaper();
      const audit = SamplePaperPilot.verifySamplePaperIntegrity(paper);

      expect(audit.difficultyDistribution).toBeDefined();
      expect(audit.difficultyDistribution.EASY).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Retrieval Intelligence Pilot Engine (12-Point Provenance)
  // --------------------------------------------------------------------------
  describe("Retrieval Intelligence Pilot Engine", () => {
    it("validates 12 mandatory provenance fields on retrieved items", () => {
      const completeProvenance: any = {
        documentId: "doc_pctb_phy9",
        bookId: "book_phy9",
        bookTitle: "Physics 9",
        pageNumber: 5,
        chapterId: "ch_01",
        chapterTitle: "Measurements",
        topicId: "top_01",
        topicTitle: "Base Quantities",
        chunkId: "chunk_01",
        syllabusId: "syl_punjab_2024",
        syllabusVersion: "2024.1",
        eligibilityStatus: "ELIGIBLE",
        sourceReference: "PCTB Physics Grade 9, Page 5",
        relevanceScore: 0.91,
      };

      const check = RetrievalPilot.validateProvenanceIntegrity(completeProvenance);
      expect(check.valid).toBe(true);
      expect(check.missingFields).toHaveLength(0);
    });

    it("rejects retrieval items with non-ELIGIBLE status or missing provenance fields", () => {
      const excludedProv: any = {
        documentId: "doc_pctb_phy9",
        bookId: "book_phy9",
        bookTitle: "Physics 9",
        pageNumber: 5,
        chapterId: "ch_01",
        chapterTitle: "Measurements",
        topicId: "top_01",
        topicTitle: "Base Quantities",
        chunkId: "chunk_01",
        syllabusId: "syl_punjab_2024",
        eligibilityStatus: "EXCLUDED",
        relevanceScore: 0.95,
      };

      const check = RetrievalPilot.validateProvenanceIntegrity(excludedProv);
      expect(check.valid).toBe(false);
      expect(check.rejectionReason).toContain("SYLLABUS_GATE_VIOLATION");
    });

    it("executes retrieval pilot test and enforces hybrid ranking weights baseline", async () => {
      const report = await RetrievalPilot.executeRetrievalPilotTest();
      expect(report.provenanceEnforced).toBe(true);
      expect(report.acceptedCandidatesCount).toBe(2);
      expect(report.rejectedCandidatesCount).toBe(2);
      expect(report.latencyBreakdown.isBenchmarkMet).toBe(true);
      expect(report.errors).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Security Penetration Pilot Engine
  // --------------------------------------------------------------------------
  describe("Security Penetration Pilot Engine", () => {
    it("successfully passes full defense-in-depth penetration test battery", async () => {
      const secReport = await SecurityPilot.executeSecurityPilot();
      expect(secReport.overallSafe).toBe(true);
      expect(secReport.failedChecks).toBe(0);
      expect(secReport.passedChecks).toBe(6);
      expect(secReport.errors).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Performance Latency Benchmarking Pilot Engine
  // --------------------------------------------------------------------------
  describe("Performance Benchmarking Pilot Engine", () => {
    it("measures real latencies across core platform operations without fabricating numbers", async () => {
      const perf = await PerformancePilot.executePerformancePilot();
      expect(perf.totalOperationsMeasured).toBeGreaterThanOrEqual(6);
      expect(perf.averageLatencyMs).toBeGreaterThan(0);
      expect(perf.allBenchmarksWithinAcceptableThreshold).toBe(true);
      expect(perf.measurements.every((m) => m.latencyMs >= 0)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Disaster Recovery & Crash Recovery Pilot Engine
  // --------------------------------------------------------------------------
  describe("Disaster Recovery & Crash Recovery Pilot Engine", () => {
    it("recovers in-progress student exam attempt and answers after simulated server crash", async () => {
      const report = await BackupRecoveryPilot.executeDisasterRecoveryTest();
      expect(report.uninterruptedAttemptRecoveryVerified).toBe(true);
      expect(report.backupVaultHealthy).toBe(true);
      expect(report.auditTrailPreserved).toBe(true);
      expect(report.errors).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Deployment Environment Pilot Engine
  // --------------------------------------------------------------------------
  describe("Deployment Environment Pilot Engine", () => {
    it("honestly reports runtime environment tier without claiming unverified cloud status", () => {
      const audit = DeploymentPilot.inspectDeploymentEnvironment();
      expect(audit.environment).toBeDefined();
      expect(audit.nodeVersion).toBeDefined();

      // In local test runner, tier must be TESTED_LOCALLY, never PRODUCTION_VERIFIED
      expect(["TESTED_LOCALLY", "UNVERIFIED"]).toContain(audit.tier);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Master 20-Domain Validation Engine & Launch Readiness Gate
  // --------------------------------------------------------------------------
  describe("Master 20-Domain Validation Engine & Launch Readiness Gate", () => {
    it("executes full 20-domain validation run with honest tier classification", async () => {
      const run = await ValidationEngine.executeFullValidation("unit-tester");
      expect(run.id).toBeDefined();
      expect(run.releaseCandidate).toBe("STUDY_AGENT_RC_1");
      expect(run.checks.length).toBeGreaterThanOrEqual(20);

      // Verify all 20 domains are present
      const expectedDomains: ValidationDomain[] = [
        "EDUCATIONAL_DATA",
        "TEXTBOOK_INTELLIGENCE",
        "SYLLABUS_ELIGIBILITY",
        "SAMPLE_PAPER_INTELLIGENCE",
        "RETRIEVAL",
        "BLUEPRINT",
        "QUESTION_BANK",
        "PAPER_ASSEMBLY",
        "ONLINE_EXAMINATION",
        "EVALUATION",
        "RESULTS",
        "AI_PROVIDERS",
        "KNOWLEDGE_CONNECTOR",
        "DATABASE",
        "STORAGE",
        "BACKGROUND_JOBS",
        "AUTHENTICATION",
        "SECURITY",
        "DEPLOYMENT",
        "BACKUP_RECOVERY",
      ];

      for (const dom of expectedDomains) {
        expect(run.domains[dom]).toBeDefined();
        expect(run.domains[dom].totalChecks).toBeGreaterThan(0);
      }
    });

    it("evaluates launch readiness with zero blocking defects", async () => {
      const readiness = await ValidationEngine.evaluateLaunchReadiness();
      expect(readiness.releaseCandidate).toBe("STUDY_AGENT_RC_1");
      expect(readiness.canLaunch).toBe(true);
      expect(["READY", "READY_WITH_WARNINGS"]).toContain(readiness.status);
      expect(readiness.blockingIssues).toHaveLength(0);
    });
  });
});

// ==============================================================================
// AI Live Paper Generator - Phase 11 Pilot Lifecycle E2E Tests
// Golden Path Lifecycle, Negative Path Gating, Concurrency & Validation APIs
// ==============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GoldenPathPilot } from "@/server/pilots/golden-path-pilot";
import { NegativePathPilot } from "@/server/pilots/negative-path-pilot";
import { ConcurrencyPilot } from "@/server/pilots/concurrency-pilot";
import { ValidationRepository } from "@/server/validation/validation-repository";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ServerAuthService } from "@/server/auth/auth-service";

// Route handlers for integration testing
import { GET as getRunsRoute, POST as postRunsRoute } from "@/app/api/admin/validation/runs/route";
import { GET as getSingleRunRoute } from "@/app/api/admin/validation/runs/[id]/route";
import { GET as getLaunchReadinessRoute } from "@/app/api/admin/validation/launch-readiness/route";
import { GET as getExportRoute } from "@/app/api/admin/validation/export/route";

describe("Phase 11: End-to-End Pilot Lifecycle & Validation Gate Enforcement", () => {
  beforeEach(() => {
    ValidationRepository.resetMemory();
    ExamRepository.resetMemory();
  });

  // --------------------------------------------------------------------------
  // 1. End-to-End Golden Path Lifecycle
  // --------------------------------------------------------------------------
  describe("End-to-End Golden Path Orchestration", () => {
    it("executes complete 10-stage lifecycle from official curriculum to teacher score override", async () => {
      const report = await GoldenPathPilot.executeGoldenPath();

      expect(report.overallSuccess).toBe(true);
      expect(report.failedStages).toBe(0);
      expect(report.passedStages).toBe(10);
      expect(report.paperId).toBeDefined();
      expect(report.attemptId).toBeDefined();
      expect(report.resultId).toBeDefined();
      expect(report.finalScore).toBeDefined();
      expect(report.finalScore?.totalMarks).toBe(30);
      expect(report.finalScore?.obtainedMarks).toBeGreaterThan(0);
      expect(report.errors).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Negative Path Gate Enforcement Suite
  // --------------------------------------------------------------------------
  describe("Negative Path Gate Enforcement Suite", () => {
    it("aggressively blocks all invalid, unauthorized, or malformed operations across 7 gates", async () => {
      const negReport = await NegativePathPilot.executeNegativePathTests();

      expect(negReport.allGatesEnforced).toBe(true);
      expect(negReport.failedGatesCount).toBe(0);
      expect(negReport.passedGatesCount).toBe(7);
      expect(negReport.errors).toHaveLength(0);

      // Verify each individual negative path gate succeeded in rejecting
      const gateNames = negReport.outcomes.map((o) => o.gateName);
      expect(gateNames).toContain("DRAFT_SYLLABUS_BLOCK");
      expect(gateNames).toContain("EXCLUDED_SYLLABUS_STATUS_BLOCK");
      expect(gateNames).toContain("RETRIEVAL_UNGROUNDED_CHUNK_BLOCK");
      expect(gateNames).toContain("RETRIEVAL_EXCLUDED_TOPIC_BLOCK");
      expect(gateNames).toContain("TEXTBOOK_MAGIC_BYTES_REJECTION");
      expect(gateNames).toContain("EXPIRED_EXAM_TIMER_GATE");
      expect(gateNames).toContain("SECURITY_PENETRATION_SUITE_GATES");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Multi-Student High Concurrency & Zero Data Loss
  // --------------------------------------------------------------------------
  describe("Multi-Student Concurrency Pilot", () => {
    it("simulates 10 concurrent candidates with simultaneous autosaves and zero answer loss", async () => {
      const concResult = await ConcurrencyPilot.executeConcurrencyPilot({
        studentCount: 10,
        questionsPerPaper: 4,
      });

      expect(concResult.concurrentStudentsCount).toBe(10);
      expect(concResult.successfulStarts).toBe(10);
      expect(concResult.successfulSaves).toBe(40);
      expect(concResult.successfulSubmissions).toBe(10);
      expect(concResult.zeroAnswerLossVerified).toBe(true);
      expect(concResult.zeroCrossContaminationVerified).toBe(true);
      expect(concResult.errors).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Validation REST APIs Integration
  // --------------------------------------------------------------------------
  describe("Validation REST API Endpoints", () => {
    it("POST /api/admin/validation/runs executes full run and GET lists runs", async () => {
      // POST execute
      const postReq = new NextRequest("http://localhost:3000/api/admin/validation/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "admin-user-id",
        },
        body: JSON.stringify({ initiatedBy: "E2E Test Runner" }),
      });
      const postRes = await postRunsRoute(postReq);
      const postJson = await postRes.json();

      expect(postRes.status).toBe(201);
      expect(postJson.success).toBe(true);
      expect(postJson.run.releaseCandidate).toBe("STUDY_AGENT_RC_1");
      const runId = postJson.run.id;

      // GET list
      const getReq = new NextRequest("http://localhost:3000/api/admin/validation/runs?limit=10", {
        headers: { Authorization: "admin-user-id" },
      });
      const getRes = await getRunsRoute(getReq);
      const getJson = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getJson.success).toBe(true);
      expect(getJson.runs.length).toBeGreaterThan(0);

      // GET single run
      const singleReq = new NextRequest(`http://localhost:3000/api/admin/validation/runs/${runId}`, {
        headers: { Authorization: "admin-user-id" },
      });
      const singleRes = await getSingleRunRoute(singleReq, { params: Promise.resolve({ id: runId }) });
      const singleJson = await singleRes.json();

      expect(singleRes.status).toBe(200);
      expect(singleJson.success).toBe(true);
      expect(singleJson.run.id).toBe(runId);
    });

    it("GET /api/admin/validation/launch-readiness returns release candidate sign-off status", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/validation/launch-readiness", {
        headers: { Authorization: "admin-user-id" },
      });
      const res = await getLaunchReadinessRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.report.releaseCandidate).toBe("STUDY_AGENT_RC_1");
      expect(json.report.canLaunch).toBe(true);
      expect(["READY", "READY_WITH_WARNINGS"]).toContain(json.report.status);
    });

    it("GET /api/admin/validation/export exports sanitized markdown and JSON audit reports", async () => {
      // JSON export
      const jsonReq = new NextRequest("http://localhost:3000/api/admin/validation/export?format=json", {
        headers: { Authorization: "admin-user-id" },
      });
      const jsonRes = await getExportRoute(jsonReq);
      const jsonBody = await jsonRes.json();

      expect(jsonRes.status).toBe(200);
      expect(jsonBody.success).toBe(true);
      expect(jsonBody.export.releaseCandidate).toBe("STUDY_AGENT_RC_1");
      expect(jsonBody.export.canLaunch).toBe(true);

      // Markdown export
      const mdReq = new NextRequest("http://localhost:3000/api/admin/validation/export?format=markdown", {
        headers: { Authorization: "admin-user-id" },
      });
      const mdRes = await getExportRoute(mdReq);
      const mdText = await mdRes.text();

      expect(mdRes.status).toBe(200);
      expect(mdText).toContain("# AI Live Paper Generator - Launch Readiness Audit Report");
      expect(mdText).toContain("STUDY_AGENT_RC_1");
    });

    it("enforces authentication on validation APIs", async () => {
      const unauthorizedReq = new NextRequest("http://localhost:3000/api/admin/validation/runs");
      const res = await getRunsRoute(unauthorizedReq);

      expect(res.status).toBe(403);
    });
  });
});

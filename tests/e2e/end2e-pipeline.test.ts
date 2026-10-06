// ==============================================================================
// AI Live Paper Generator - End-to-End Pipeline Integration Test (Phase 10)
// Complete Lifecycle: Ingestion -> Retrieval -> Consensus -> Blueprint -> Live Exam -> Scoring
// ==============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { DataImportService } from "@/server/data-import/data-import-service";
import { DocumentSourceAdapter } from "@/server/connectors/knowledge/document-source-adapter";
import { SourceSyncService } from "@/server/connectors/knowledge/source-sync-service";
import { AIOrchestrator } from "@/server/ai/orchestration/ai-orchestrator";
import { ConsensusEngine } from "@/server/ai/orchestration/consensus-engine";
import { AIUsageLogger } from "@/server/ai/usage-logger";
import { ExamService } from "@/server/exam-engine/exam-service";
import { PaperAssemblyService } from "@/server/exam-engine/paper-assembly-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ExaminationPaper, ExaminationPaperSection, ExaminationPaperQuestion } from "@/types/exam-engine";
import { RateLimiter } from "@/server/security/rate-limiter";
import { PromptGuard } from "@/server/security/prompt-guard";
import { HealthService } from "@/server/observability/health-service";

describe("Phase 10: Complete End-to-End Educational Examination Pipeline", () => {
  beforeEach(() => {
    DataImportService.resetMemoryCache();
    SourceSyncService.resetMemory();
    ExamRepository.resetMemory();
    AIUsageLogger.resetMemory();
    RateLimiter.reset();
  });

  it("should successfully execute the complete educational examination lifecycle from data onboarding to student attempt and grading", async () => {
    // --------------------------------------------------------------------------
    // Step 1: Onboard Official Curriculum Data with Provenance
    // --------------------------------------------------------------------------
    const importPayload: any = {
      code: "FBISE_SSC1_2025",
      name: "Federal Board of Intermediate and Secondary Education",
      country: "Pakistan",
      region: "Islamabad",
      provenance: {
        sourceName: "FBISE Official SSC-I Physics Curriculum 2024-2025",
        sourceUrl: "https://fbise.edu.pk/curriculum/physics-grade-9-2025.pdf",
        sourceDocumentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        officialPublicationDate: "2024-06-15",
        publisher: "National Book Foundation",
        importedBy: "federal-curriculum-officer",
        verificationStatus: "VERIFIED",
      },
      academicYears: [
        {
          code: "2024-2025",
          name: "Session 2024-2025",
          classes: [
            {
              numericLevel: 9,
              name: "Class 9",
              subjects: [
                {
                  code: "PHY-09",
                  name: "Physics",
                  books: [
                    {
                      title: "Physics Grade 9 National Textbook",
                      publisher: "National Book Foundation",
                      version: "2025.1",
                      provenance: {
                        sourceName: "Physics 9 Textbook ISBN 978-969-37-0001-2",
                        publisher: "National Book Foundation",
                        importedBy: "officer",
                        verificationStatus: "VERIFIED",
                      },
                      chapters: [
                        {
                          chapterNumber: 1,
                          title: "Physical Quantities and Measurement",
                          orderIndex: 1,
                          topics: [
                            {
                              orderIndex: 1,
                              title: "Base and Derived Physical Quantities",
                              learningOutcomes: ["Distinguish between base and derived physical quantities"],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const commitResult = await DataImportService.commitImport(importPayload, "curriculum-officer");
    expect(commitResult.success).toBe(true);
    expect(commitResult.importedCounts.boards).toBe(1);

    // --------------------------------------------------------------------------
    // Step 2: Ingest & Sync Authentic Textbook Content
    // --------------------------------------------------------------------------
    const adapter = new DocumentSourceAdapter();
    await adapter.connect({ sourceType: "LOCAL_DOCUMENT" });

    adapter.registerDocument({
      id: "book-phy9-ch1",
      title: "Physics Grade 9 - Chapter 1 Official Text",
      subject: "Physics",
      classLevel: 9,
      content: `Physical quantities that form the foundation for other quantities are called base quantities.\n\nThere are seven base quantities: length, mass, time, electric current, thermodynamic temperature, amount of substance, and luminous intensity.`,
    });

    SourceSyncService.registerConnector(adapter);
    const syncOutcome = await SourceSyncService.syncDocument(adapter.connectorId, "book-phy9-ch1");
    expect(syncOutcome.success).toBe(true);
    expect(syncOutcome.chunksCount).toBeGreaterThan(0);

    // --------------------------------------------------------------------------
    // Step 3: Multi-LLM Consensus on Question Candidate
    // --------------------------------------------------------------------------
    const consensusResult = ConsensusEngine.evaluateConsensus<string>(
      [
        { providerId: "openai", modelName: "gpt-4o", value: "B", confidence: 0.95 },
        { providerId: "gemini", modelName: "gemini-1.5-pro", value: "B", confidence: 0.92 },
        { providerId: "anthropic", modelName: "claude-3-5-sonnet", value: "B", confidence: 0.96 },
      ],
      { fieldLabel: "Correct Option Key" }
    );
    expect(consensusResult.verdict).toBe("CONSENSUS_REACHED");
    expect(consensusResult.consensusValue).toBe("B");

    // Context Isolation Envelope check
    const rawChunk = SourceSyncService.getSyncedChunks("book-phy9-ch1")[0].text;
    const guardedContext = PromptGuard.wrapInContextEnvelope(rawChunk, "NBF Textbook Ch 1");
    expect(guardedContext).toContain("<<<BEGIN_UNTRUSTED_EDUCATIONAL_CONTEXT");

    // --------------------------------------------------------------------------
    // Step 4: Assemble & Publish Live Examination Paper
    // --------------------------------------------------------------------------
    const mockSectionA: ExaminationPaperSection = {
      id: "sec-mcq",
      paperId: "paper-e2e-live-01",
      sectionName: "Section A (Objective)",
      sectionOrder: 1,
      totalDisplayedQuestions: 2,
      attemptableQuestions: 2,
      marksPerQuestion: 1,
      displayedMarks: 2,
      attemptableMarks: 2,
      maximumObtainableMarks: 2,
      choiceRule: { type: "NO_CHOICE" },
      questionIds: ["pq-001", "pq-002"],
    };

    const mockSectionB: ExaminationPaperSection = {
      id: "sec-subjective",
      paperId: "paper-e2e-live-01",
      sectionName: "Section B (Short Questions)",
      sectionOrder: 2,
      totalDisplayedQuestions: 1,
      attemptableQuestions: 1,
      marksPerQuestion: 3,
      displayedMarks: 3,
      attemptableMarks: 3,
      maximumObtainableMarks: 3,
      choiceRule: { type: "NO_CHOICE" },
      questionIds: ["pq-003"],
    };

    const q1: any = {
      id: "pq-001",
      paperId: "paper-e2e-live-01",
      blueprintSlotId: "slot-01",
      questionBankItemId: "qbank-01",
      questionBankVersion: "1.0",
      sequence: 1,
      sectionId: "sec-mcq",
      sectionName: "Section A (Objective)",
      marks: 1,
      questionType: "MCQ",
      difficulty: "EASY",
      cognitiveLevel: "RECALL",
      isCompulsory: true,
      displayOrder: 1,
      questionText: "Which of the following is a base SI quantity?",
      options: [
        { key: "A", text: "Velocity" },
        { key: "B", text: "Electric Current" },
        { key: "C", text: "Acceleration" },
        { key: "D", text: "Force" },
      ],
      chapterId: "ch-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-01",
      topicTitle: "Base Quantities",
      sourcePages: [1],
      provenance: {},
      answerMaterial: {
        correctOptionKey: "B",
      },
    };

    const q2: any = {
      id: "pq-002",
      paperId: "paper-e2e-live-01",
      blueprintSlotId: "slot-02",
      questionBankItemId: "qbank-02",
      questionBankVersion: "1.0",
      sequence: 2,
      sectionId: "sec-mcq",
      sectionName: "Section A (Objective)",
      marks: 1,
      questionType: "MCQ",
      difficulty: "MEDIUM",
      cognitiveLevel: "UNDERSTAND",
      isCompulsory: true,
      displayOrder: 2,
      questionText: "How many base physical quantities exist in the SI system?",
      options: [
        { key: "A", text: "5" },
        { key: "B", text: "7" },
        { key: "C", text: "9" },
        { key: "D", text: "3" },
      ],
      chapterId: "ch-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-01",
      topicTitle: "Base Quantities",
      sourcePages: [2],
      provenance: {},
      answerMaterial: {
        correctOptionKey: "B",
      },
    };

    const q3: any = {
      id: "pq-003",
      paperId: "paper-e2e-live-01",
      blueprintSlotId: "slot-03",
      questionBankItemId: "qbank-03",
      questionBankVersion: "1.0",
      sequence: 3,
      sectionId: "sec-subjective",
      sectionName: "Section B (Short Questions)",
      marks: 3,
      questionType: "SHORT",
      difficulty: "EASY",
      cognitiveLevel: "UNDERSTAND",
      isCompulsory: true,
      displayOrder: 3,
      questionText: "Differentiate between base and derived physical quantities with one example each.",
      chapterId: "ch-01",
      chapterTitle: "Physical Quantities",
      topicId: "top-01",
      topicTitle: "Base Quantities",
      sourcePages: [3],
      provenance: {},
      answerMaterial: {
        expectedKeyPoints: ["Base quantities form foundation (e.g. length)", "Derived quantities derived from base (e.g. speed)"],
        modelAnswer: "Base quantities are foundation; derived quantities are defined in terms of base quantities.",
      },
    };

    const livePaper: any = {
      id: "paper-e2e-live-01",
      blueprintId: "bp-e2e-01",
      paperCode: "PAP-PHY-MIDTERM",
      title: "Federal Board SSC-I Physics Midterm 2025",
      academicYear: "2024-2025",
      classLevel: 9,
      subjectCode: "PHY-09",
      subjectName: "Physics",
      version: "1.0",
      status: "PUBLISHED",
      totalMarks: 5,
      totalQuestions: 3,
      durationMinutes: 45,
      sections: [mockSectionA, mockSectionB],
      questions: [q1, q2, q3],
      snapshot: {
        snapshotId: "snap-e2e-01",
        paperId: "paper-e2e-live-01",
        paperCode: "PAP-PHY-MIDTERM",
        paperVersion: "1.0",
        frozenAt: new Date().toISOString(),
        blueprintId: "bp-e2e-01",
        blueprintVersion: "1.0",
        syllabusId: "syl-phy-2025",
        syllabusVersion: "2025.1",
        instructions: "Read questions carefully.",
        durationMinutes: 45,
        totalMarks: 5,
        sections: [mockSectionA, mockSectionB],
        questions: [q1, q2, q3] as any,
        difficultyDistribution: {
          easyMarks: 3,
          mediumMarks: 2,
          difficultMarks: 0,
          easyCount: 1,
          mediumCount: 2,
          difficultCount: 0,
        },
      },
      validationReport: {
        isValid: true,
        paperId: "paper-e2e-live-01",
        marksMatch: true,
        questionCountMatch: true,
        choiceRulesValid: true,
        difficultyDistributionValid: true,
        topicCoverageValid: true,
        approvalGatesPassed: true,
        provenanceComplete: true,
        errors: [],
        warnings: [],
        validatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ExamRepository.savePaper(livePaper);
    await ExamService.activatePaper(livePaper.id);

    // --------------------------------------------------------------------------
    // Step 5: Student Secure Online Attempt (Quarantine Verified)
    // --------------------------------------------------------------------------
    const studentView = ExamService.getStudentPaperView(livePaper);
    // Student must NEVER see correctOptionKey or answerMaterial
    expect(studentView.questions[0].answerMaterial).toBeUndefined();
    expect((studentView.questions[0].options![0] as any).isCorrect).toBeUndefined();

    // Start Attempt
    const startOutcome = await ExamService.startAttempt(livePaper.id, "candidate-e2e-01", "Amina Khan");
    const attempt = startOutcome.attempt;
    expect(attempt.status).toBe("IN_PROGRESS");
    expect(attempt.expiresAt).toBeDefined();

    // --------------------------------------------------------------------------
    // Step 6: Burst-Safe Autosave Answers
    // --------------------------------------------------------------------------
    const rateLimitCheck = RateLimiter.checkLimit(attempt.studentId, "STUDENT_EXAM_AUTOSAVE");
    expect(rateLimitCheck.allowed).toBe(true);

    await ExamService.saveAnswer(attempt.id, {
      paperQuestionId: q1.id,
      selectedOption: "B", // Correct
    });

    await ExamService.saveAnswer(attempt.id, {
      paperQuestionId: q2.id,
      selectedOption: "B", // Correct
    });

    await ExamService.saveAnswer(attempt.id, {
      paperQuestionId: q3.id,
      answerText: "Base quantities form foundation (e.g. length). Derived quantities derived from base (e.g. speed).",
    });

    // --------------------------------------------------------------------------
    // Step 7: Submit Attempt & Deterministic Scoring
    // --------------------------------------------------------------------------
    const submitOutcome = await ExamService.submitAttempt(attempt.id);
    const result = submitOutcome.result;
    expect(result.attemptId).toBe(attempt.id);
    expect(result.obtainedMarks).toBeGreaterThanOrEqual(2);
    expect(result.totalMarks).toBe(5);

    // Section-wise analysis
    expect(result.sectionBreakdown).toHaveLength(2);
    expect(result.sectionBreakdown[0].marksObtained).toBe(2); // Both MCQs correct

    // Chapter breakdown
    expect(result.chapterBreakdown.some((c) => c.chapterTitle === "Physical Quantities")).toBe(true);

    // --------------------------------------------------------------------------
    // Step 8: Teacher Score Override with Audit
    // --------------------------------------------------------------------------
    const overriddenResult = await ExamService.overrideScore(
      attempt.id,
      q3.id,
      3,
      "Teacher confirmed complete explanation and SI unit examples.",
      "teacher-senior-physics"
    );

    expect(overriddenResult.obtainedMarks).toBe(5);
    expect(overriddenResult.percentage).toBe(100);
    expect(overriddenResult.grade).toBe("A+");

    // --------------------------------------------------------------------------
    // Step 9: Final System Health & Readiness Confirmation
    // --------------------------------------------------------------------------
    const health = await HealthService.getSystemHealth();
    expect(health.readinessChecks).toHaveLength(15);
    expect(["PRODUCTION_READY", "DEGRADED"]).toContain(health.overallStatus);
  });
});

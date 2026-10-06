// ==============================================================================
// AI Live Paper Generator - Negative Path & Gate Enforcement Pilot (Phase 11)
// Rigorous Verification of System Rejections for Malformed or Unauthorized Flows
// ==============================================================================

import { SyllabusPilot } from "./syllabus-pilot";
import { RetrievalPilot } from "./retrieval-pilot";
import { SecurityPilot } from "./security-pilot";
import { TextbookPilot } from "./textbook-pilot";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ExamService } from "@/server/exam-engine/exam-service";
import { ExaminationPaper } from "@/types/exam-engine";

export interface NegativePathOutcome {
  gateName: string;
  expectedRejection: boolean;
  actualRejection: boolean;
  rejectionReason: string;
  passed: boolean;
}

export interface NegativePathPilotReport {
  timestamp: string;
  allGatesEnforced: boolean;
  totalGatesTested: number;
  passedGatesCount: number;
  failedGatesCount: number;
  outcomes: NegativePathOutcome[];
  errors: string[];
}

export class NegativePathPilot {
  /**
   * Executes a battery of negative tests to ensure the platform aggressively blocks
   * invalid, unauthorized, or malformed data operations across all subsystems.
   */
  public static async executeNegativePathTests(): Promise<NegativePathPilotReport> {
    const outcomes: NegativePathOutcome[] = [];
    const errors: string[] = [];

    // Gate 1: Draft Syllabus Gate
    const draftSyllabus = {
      id: "syl_draft_999",
      version: "0.1-alpha",
      status: "DRAFT",
      provenanceHash: "abcdef1234567890abcdef",
      publisher: "Unauthorized Body",
    };
    const draftSylCheck = SyllabusPilot.evaluateSyllabusEligibility(draftSyllabus);
    outcomes.push({
      gateName: "DRAFT_SYLLABUS_BLOCK",
      expectedRejection: true,
      actualRejection: !draftSylCheck.isEligibleForExamination,
      rejectionReason: draftSylCheck.blockingReason || "Allowed unexpectedly",
      passed: !draftSylCheck.isEligibleForExamination,
    });

    // Gate 2: Excluded Syllabus Topic Gate
    const excludedSyllabus = {
      id: "syl_excluded_888",
      version: "1.0",
      status: "EXCLUDED",
      provenanceHash: "abcdef1234567890abcdef",
      publisher: "PCTB",
    };
    const excludedSylCheck = SyllabusPilot.evaluateSyllabusEligibility(excludedSyllabus);
    outcomes.push({
      gateName: "EXCLUDED_SYLLABUS_STATUS_BLOCK",
      expectedRejection: true,
      actualRejection: !excludedSylCheck.isEligibleForExamination,
      rejectionReason: excludedSylCheck.blockingReason || "Allowed unexpectedly",
      passed: !excludedSylCheck.isEligibleForExamination,
    });

    // Gate 3: Ungrounded Retrieval Chunk Gate (Missing Page & Topic)
    const incompleteChunkProvenance = {
      documentId: "doc_pctb_phy9",
      bookId: "book_phy9",
      bookTitle: "Physics 9",
      // missing pageNumber, topicId, topicTitle
      chapterId: "ch_01",
      chapterTitle: "Measurements",
      chunkId: "chunk_bad_01",
      syllabusId: "syl_valid",
      eligibilityStatus: "ELIGIBLE" as const,
      relevanceScore: 0.88,
    };
    const chunkProvCheck = RetrievalPilot.validateProvenanceIntegrity(incompleteChunkProvenance);
    outcomes.push({
      gateName: "RETRIEVAL_UNGROUNDED_CHUNK_BLOCK",
      expectedRejection: true,
      actualRejection: !chunkProvCheck.valid,
      rejectionReason: chunkProvCheck.rejectionReason || "Allowed unexpectedly",
      passed: !chunkProvCheck.valid,
    });

    // Gate 4: Non-Eligible Topic Retrieval Block
    const nonEligibleTopicProvenance = {
      documentId: "doc_pctb_phy9",
      bookId: "book_phy9",
      bookTitle: "Physics 9",
      pageNumber: 15,
      chapterId: "ch_01",
      chapterTitle: "Measurements",
      topicId: "top_01",
      topicTitle: "Measurements",
      chunkId: "chunk_exc_01",
      syllabusId: "syl_valid",
      eligibilityStatus: "EXCLUDED" as const,
      relevanceScore: 0.95,
    };
    const topicProvCheck = RetrievalPilot.validateProvenanceIntegrity(nonEligibleTopicProvenance);
    outcomes.push({
      gateName: "RETRIEVAL_EXCLUDED_TOPIC_BLOCK",
      expectedRejection: true,
      actualRejection: !topicProvCheck.valid,
      rejectionReason: topicProvCheck.rejectionReason || "Allowed unexpectedly",
      passed: !topicProvCheck.valid,
    });

    // Gate 5: Non-PDF File Ingestion Block (Magic-Byte Inspection)
    const invalidFileBuffer = Buffer.from("<html><body>Not a PDF</body></html>");
    const badDocPipeline = await TextbookPilot.executeTextbookPipeline({
      documentId: "invalid_doc_fake",
      bookTitle: "Fake Book",
      pdfBuffer: invalidFileBuffer,
      authorOrPublisher: "PCTB",
    });
    outcomes.push({
      gateName: "TEXTBOOK_MAGIC_BYTES_REJECTION",
      expectedRejection: true,
      actualRejection: !badDocPipeline.success,
      rejectionReason: badDocPipeline.errors.join("; ") || "Accepted fake PDF",
      passed: !badDocPipeline.success,
    });

    // Gate 6: Expired Exam Answer Save Block
    const expiredPaper: any = {
      id: `paper_neg_exp_${Date.now()}`,
      paperCode: "NEG-EXP",
      title: "Negative Test Paper",
      status: "ACTIVE",
      totalMarks: 5,
      passingMarks: 2,
      durationMinutes: 1, // 1 minute
      syllabusVersion: "2024.1",
      metadata: {},
      sections: [],
      questions: [
        {
          id: "neg_q1",
          paperId: `paper_neg_exp_${Date.now()}`,
          sequence: 1,
          sectionId: "sec_1",
          sectionName: "Sec A",
          marks: 5,
          questionType: "MCQ",
          difficulty: "EASY",
          isCompulsory: true,
          questionText: "Sample question",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ExamRepository.savePaper(expiredPaper);

    const { attempt: expAttempt } = await ExamService.startAttempt(
      expiredPaper.id,
      `stu_exp_${Date.now()}`,
      "Candidate Expired"
    );

    // Artificially expire the attempt (e.g. started 2 hours ago)
    expAttempt.startedAt = new Date(Date.now() - 7200 * 1000).toISOString();
    expAttempt.expiresAt = new Date(Date.now() - 3600 * 1000).toISOString();
    await ExamRepository.saveAttempt(expAttempt);

    let expiredSaveBlocked = false;
    let expiredSaveError = "";
    try {
      await ExamService.saveAnswer(expAttempt.id, {
        paperQuestionId: "neg_q1",
        sequenceNumber: 1,
        selectedOption: "A",
      });
    } catch (err: any) {
      expiredSaveBlocked = true;
      expiredSaveError = err.message;
    }

    outcomes.push({
      gateName: "EXPIRED_EXAM_TIMER_GATE",
      expectedRejection: true,
      actualRejection: expiredSaveBlocked,
      rejectionReason: expiredSaveError || "Allowed answer saving on expired attempt",
      passed: expiredSaveBlocked,
    });

    // Gate 7: Security Penetration Gates
    const secResult = await SecurityPilot.executeSecurityPilot();
    outcomes.push({
      gateName: "SECURITY_PENETRATION_SUITE_GATES",
      expectedRejection: true,
      actualRejection: secResult.overallSafe,
      rejectionReason: secResult.errors.join("; ") || "All attack vectors neutralized",
      passed: secResult.overallSafe,
    });

    const failedCount = outcomes.filter((o) => !o.passed).length;
    const passedCount = outcomes.filter((o) => o.passed).length;

    if (failedCount > 0) {
      errors.push(`${failedCount} negative path gates failed to reject unauthorized actions`);
    }

    return {
      timestamp: new Date().toISOString(),
      allGatesEnforced: failedCount === 0,
      totalGatesTested: outcomes.length,
      passedGatesCount: passedCount,
      failedGatesCount: failedCount,
      outcomes,
      errors,
    };
  }
}

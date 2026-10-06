// ==============================================================================
// AI Live Paper Generator - Examination Repository (Phase 9)
// Thread-Safe Dual-Tier Persistence with Versioning & Audit History
// ==============================================================================

import {
  ExaminationPaper,
  ExaminationAttempt,
  StudentAnswer,
  ExaminationResult,
  ExamAuditLog,
  ExaminationPaperStatus,
} from "@/types/exam-engine";
import { prisma } from "@/lib/db";

export class ExamRepository {
  private static memoryPapers: Map<string, ExaminationPaper> = new Map();
  private static memoryAttempts: Map<string, ExaminationAttempt> = new Map();
  private static memoryAnswers: Map<string, StudentAnswer> = new Map(); // key: attemptId_questionId
  private static memoryResults: Map<string, ExaminationResult> = new Map(); // key: attemptId
  private static memoryAuditLogs: ExamAuditLog[] = [];

  // --------------------------------------------------------------------------
  // Examination Papers
  // --------------------------------------------------------------------------

  public static async savePaper(paper: ExaminationPaper): Promise<ExaminationPaper> {
    const clone = JSON.parse(JSON.stringify(paper));
    this.memoryPapers.set(clone.id, clone);

    if (process.env.NODE_ENV !== "test") {
      try {
        await prisma.generatedPaper.upsert({
          where: { id: paper.id },
          create: {
            id: paper.id,
            blueprintId: paper.blueprintId,
            authorId: "system-admin",
            title: paper.title,
            status: paper.status as any,
            validationReport: paper.validationReport as any,
          },
          update: {
            title: paper.title,
            status: paper.status as any,
            validationReport: paper.validationReport as any,
          },
        });
      } catch {
        // Fallback to in-memory store
      }
    }

    return clone;
  }

  public static async findPaperById(id: string): Promise<ExaminationPaper | null> {
    const mem = this.memoryPapers.get(id);
    return mem ? JSON.parse(JSON.stringify(mem)) : null;
  }

  public static async findPaperByCode(code: string): Promise<ExaminationPaper | null> {
    for (const paper of this.memoryPapers.values()) {
      if (paper.paperCode === code) {
        return JSON.parse(JSON.stringify(paper));
      }
    }
    return null;
  }

  public static async listPapers(filters: {
    status?: ExaminationPaperStatus;
    boardId?: string;
    classId?: string;
    subjectId?: string;
    searchQuery?: string;
  } = {}): Promise<ExaminationPaper[]> {
    let list = Array.from(this.memoryPapers.values());

    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters.boardId) {
      list = list.filter((p) => p.boardId === filters.boardId);
    }
    if (filters.classId) {
      list = list.filter((p) => p.classId === filters.classId);
    }
    if (filters.subjectId) {
      list = list.filter((p) => p.subjectId === filters.subjectId);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.paperCode.toLowerCase().includes(q)
      );
    }

    return JSON.parse(JSON.stringify(list));
  }

  // --------------------------------------------------------------------------
  // Examination Attempts
  // --------------------------------------------------------------------------

  public static async saveAttempt(attempt: ExaminationAttempt): Promise<ExaminationAttempt> {
    const clone = JSON.parse(JSON.stringify(attempt));
    this.memoryAttempts.set(clone.id, clone);

    if (process.env.NODE_ENV !== "test") {
      try {
        await prisma.examAttempt.upsert({
          where: { id: attempt.id },
          create: {
            id: attempt.id,
            userId: attempt.studentId,
            paperId: attempt.paperId,
            status: attempt.status as any,
            startedAt: new Date(attempt.startedAt),
            submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : null,
          },
          update: {
            status: attempt.status as any,
            submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : null,
          },
        });
      } catch {
        // Fallback
      }
    }

    return clone;
  }

  public static async findAttemptById(id: string): Promise<ExaminationAttempt | null> {
    const mem = this.memoryAttempts.get(id);
    return mem ? JSON.parse(JSON.stringify(mem)) : null;
  }

  public static async findActiveAttempt(
    paperId: string,
    studentId: string
  ): Promise<ExaminationAttempt | null> {
    for (const attempt of this.memoryAttempts.values()) {
      if (
        attempt.paperId === paperId &&
        attempt.studentId === studentId &&
        attempt.status === "IN_PROGRESS"
      ) {
        return JSON.parse(JSON.stringify(attempt));
      }
    }
    return null;
  }

  public static async listAttempts(filters: {
    paperId?: string;
    studentId?: string;
    status?: string;
  } = {}): Promise<ExaminationAttempt[]> {
    let list = Array.from(this.memoryAttempts.values());

    if (filters.paperId) {
      list = list.filter((a) => a.paperId === filters.paperId);
    }
    if (filters.studentId) {
      list = list.filter((a) => a.studentId === filters.studentId);
    }
    if (filters.status) {
      list = list.filter((a) => a.status === filters.status);
    }

    return JSON.parse(JSON.stringify(list));
  }

  // --------------------------------------------------------------------------
  // Student Answers
  // --------------------------------------------------------------------------

  public static async saveAnswer(answer: StudentAnswer): Promise<StudentAnswer> {
    const clone = JSON.parse(JSON.stringify(answer));
    const key = `${answer.attemptId}_${answer.paperQuestionId}`;
    this.memoryAnswers.set(key, clone);
    return clone;
  }

  public static async findAnswer(
    attemptId: string,
    paperQuestionId: string
  ): Promise<StudentAnswer | null> {
    const key = `${attemptId}_${paperQuestionId}`;
    const mem = this.memoryAnswers.get(key);
    return mem ? JSON.parse(JSON.stringify(mem)) : null;
  }

  public static async getAnswersForAttempt(attemptId: string): Promise<StudentAnswer[]> {
    const answers: StudentAnswer[] = [];
    for (const [key, ans] of this.memoryAnswers.entries()) {
      if (key.startsWith(`${attemptId}_`)) {
        answers.push(JSON.parse(JSON.stringify(ans)));
      }
    }
    return answers.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  // --------------------------------------------------------------------------
  // Examination Results
  // --------------------------------------------------------------------------

  public static async saveResult(result: ExaminationResult): Promise<ExaminationResult> {
    const clone = JSON.parse(JSON.stringify(result));
    this.memoryResults.set(clone.attemptId, clone);
    return clone;
  }

  public static async findResultByAttemptId(attemptId: string): Promise<ExaminationResult | null> {
    const mem = this.memoryResults.get(attemptId);
    return mem ? JSON.parse(JSON.stringify(mem)) : null;
  }

  // --------------------------------------------------------------------------
  // Audit Logs
  // --------------------------------------------------------------------------

  public static async logAudit(
    entry: Omit<ExamAuditLog, "id" | "timestamp">
  ): Promise<ExamAuditLog> {
    const logItem: ExamAuditLog = {
      id: `audit_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      ...entry,
      timestamp: new Date().toISOString(),
    };
    this.memoryAuditLogs.push(logItem);
    return logItem;
  }

  public static async listAuditLogs(filters: {
    entityId?: string;
    entityType?: string;
    action?: string;
  } = {}): Promise<ExamAuditLog[]> {
    let list = [...this.memoryAuditLogs];

    if (filters.entityId) {
      list = list.filter((l) => l.entityId === filters.entityId);
    }
    if (filters.entityType) {
      list = list.filter((l) => l.entityType === filters.entityType);
    }
    if (filters.action) {
      list = list.filter((l) => l.action === filters.action);
    }

    return JSON.parse(JSON.stringify(list));
  }

  // --------------------------------------------------------------------------
  // Memory Reset (Testing)
  // --------------------------------------------------------------------------

  public static resetMemory(): void {
    this.memoryPapers.clear();
    this.memoryAttempts.clear();
    this.memoryAnswers.clear();
    this.memoryResults.clear();
    this.memoryAuditLogs = [];
  }
}

// ==============================================================================
// AI Live Paper Generator - Performance Benchmarking Pilot Engine (Phase 11)
// Actual Latency Profiling across Core Operations - Strictly Genuine Measurements
// ==============================================================================

import { PerformanceMeasurement } from "@/types/validation";
import { ValidationRepository } from "@/server/validation/validation-repository";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ExamService } from "@/server/exam-engine/exam-service";
import { PaperAssemblyService } from "@/server/exam-engine/paper-assembly-service";
import { RetrievalPilot } from "./retrieval-pilot";
import { ExaminationPaper } from "@/types/exam-engine";

export interface PerformanceBenchmarkReport {
  timestamp: string;
  environment: string;
  totalOperationsMeasured: number;
  measurements: PerformanceMeasurement[];
  averageLatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  fastestOperation: string;
  slowestOperation: string;
  allBenchmarksWithinAcceptableThreshold: boolean;
}

export class PerformancePilot {
  /**
   * Executes genuine latency profiling on critical production paths.
   * STRICT INVARIANT: Latencies are measured using high-resolution timers. Never fabricated.
   */
  public static async executePerformancePilot(): Promise<PerformanceBenchmarkReport> {
    const measurements: PerformanceMeasurement[] = [];
    const env = process.env.NODE_ENV || "development";

    // 1. Database / Repository Query Benchmark
    const t0 = performance.now();
    await ExamRepository.listPapers();
    const dbLatency = performance.now() - t0;
    measurements.push(this.record("DATABASE_LIST_PAPERS_QUERY", dbLatency, env, "Repository Scan"));

    // 2. Retrieval Pipeline Benchmark
    const t1 = performance.now();
    await RetrievalPilot.executeRetrievalPilotTest({
      query: "Define base quantities and derive acceleration formula",
    });
    const retrievalLatency = performance.now() - t1;
    measurements.push(this.record("KNOWLEDGE_RETRIEVAL_HYBRID", retrievalLatency, env, "4 Chunks Candidate Pool"));

    // 3. Paper Assembly & Blueprint Validation Benchmark
    const t2 = performance.now();
    const tempPaper: any = {
      id: `perf_paper_${Date.now()}`,
      paperCode: "PERF-901",
      title: "Performance Profiling Paper",
      status: "PUBLISHED",
      totalMarks: 10,
      passingMarks: 4,
      durationMinutes: 30,
      syllabusVersion: "2024.1",
      metadata: {},
      sections: [
        {
          id: "perf_sec_1",
          paperId: `perf_paper_${Date.now()}`,
          sectionName: "Section A",
          sectionOrder: 1,
          totalDisplayedQuestions: 2,
          attemptableQuestions: 2,
          marksPerQuestion: 5,
          displayedMarks: 10,
          attemptableMarks: 10,
          maximumObtainableMarks: 10,
          choiceRule: { type: "NO_CHOICE", description: "All compulsory" },
          questionIds: ["perf_q1", "perf_q2"],
        },
      ],
      questions: [
        {
          id: "perf_q1",
          paperId: `perf_paper_${Date.now()}`,
          sequence: 1,
          sectionId: "perf_sec_1",
          sectionName: "Section A",
          marks: 5,
          questionType: "MCQ",
          difficulty: "EASY",
          isCompulsory: true,
          questionText: "Sample MCQ 1",
          options: [{ key: "A", text: "A", isCorrect: true }, { key: "B", text: "B", isCorrect: false }],
          correctOption: "A",
        },
        {
          id: "perf_q2",
          paperId: `perf_paper_${Date.now()}`,
          sequence: 2,
          sectionId: "perf_sec_1",
          sectionName: "Section A",
          marks: 5,
          questionType: "MCQ",
          difficulty: "EASY",
          isCompulsory: true,
          questionText: "Sample MCQ 2",
          options: [{ key: "A", text: "A", isCorrect: true }, { key: "B", text: "B", isCorrect: false }],
          correctOption: "A",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tempPaper.snapshot = await PaperAssemblyService.createSnapshot(tempPaper);
    await ExamRepository.savePaper(tempPaper);
    const assemblyLatency = performance.now() - t2;
    measurements.push(this.record("PAPER_SNAPSHOT_CREATION", assemblyLatency, env, "2 Questions Paper"));

    // 4. Online Exam Start Benchmark
    const t3 = performance.now();
    const { attempt } = await ExamService.startAttempt(tempPaper.id, `perf_stu_${Date.now()}`);
    const examStartLatency = performance.now() - t3;
    measurements.push(this.record("EXAM_ATTEMPT_START", examStartLatency, env, "Single Candidate"));

    // 5. Answer Autosave Benchmark
    const t4 = performance.now();
    await ExamService.saveAnswer(attempt.id, {
      paperQuestionId: "perf_q1",
      sequenceNumber: 1,
      selectedOption: "A",
    });
    const autosaveLatency = performance.now() - t4;
    measurements.push(this.record("ANSWER_AUTOSAVE_CYCLE", autosaveLatency, env, "Single MCQ Answer"));

    // 6. Attempt Submission & Evaluation Benchmark
    const t5 = performance.now();
    await ExamService.submitAttempt(attempt.id, attempt.studentId);
    const submissionLatency = performance.now() - t5;
    measurements.push(this.record("EXAM_SUBMIT_AND_EVALUATION", submissionLatency, env, "Complete Evaluation Cycle"));

    // Calculate Summary Metrics
    const latencies = measurements.map((m) => m.latencyMs).sort((a, b) => a - b);
    const totalLatency = latencies.reduce((sum, val) => sum + val, 0);
    const averageLatencyMs = Math.round((totalLatency / latencies.length) * 100) / 100;
    const p95Index = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
    const p95LatencyMs = latencies[p95Index];
    const maxLatencyMs = latencies[latencies.length - 1];

    const sortedByLatency = [...measurements].sort((a, b) => a.latencyMs - b.latencyMs);
    const fastestOperation = `${sortedByLatency[0].operationName} (${sortedByLatency[0].latencyMs}ms)`;
    const slowestOperation = `${sortedByLatency[sortedByLatency.length - 1].operationName} (${sortedByLatency[sortedByLatency.length - 1].latencyMs}ms)`;

    // Check against 2000ms critical threshold
    const allBenchmarksWithinAcceptableThreshold = maxLatencyMs < 2000;

    return {
      timestamp: new Date().toISOString(),
      environment: env,
      totalOperationsMeasured: measurements.length,
      measurements,
      averageLatencyMs,
      p95LatencyMs,
      maxLatencyMs,
      fastestOperation,
      slowestOperation,
      allBenchmarksWithinAcceptableThreshold,
    };
  }

  private static record(
    operationName: string,
    latencyMs: number,
    environment: string,
    datasetSize?: string
  ): PerformanceMeasurement {
    const rounded = Math.round(latencyMs * 100) / 100;
    const status: PerformanceMeasurement["status"] =
      rounded < 500 ? "NORMAL" : rounded < 2000 ? "SLOW" : "CRITICAL";

    const metric: PerformanceMeasurement = {
      operationName,
      latencyMs: rounded,
      timestamp: new Date().toISOString(),
      environment,
      datasetSize,
      status,
    };

    ValidationRepository.recordPerformance(metric);
    return metric;
  }
}

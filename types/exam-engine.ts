// ==============================================================================
// AI Live Paper Generator - Live Examination Engine Domain Models (Phase 9)
// Paper Assembly, Secure Delivery, Student Attempts, Autosave & Evaluation Types
// ==============================================================================

import {
  BlueprintQuestionType,
  CognitiveLevel,
  BlueprintDifficulty,
  ChoiceRule,
  BlueprintSection,
} from "./blueprint";
import { QuestionBankItem } from "./question-generation";

export type ExaminationPaperStatus =
  | "DRAFT"
  | "VALIDATING"
  | "VALIDATED"
  | "PUBLISHED"
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED";

export type ExamAttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EVALUATING"
  | "EVALUATED"
  | "EXPIRED"
  | "CANCELLED";

export type EvaluationState =
  | "PENDING"
  | "EVALUATED"
  | "PROVISIONAL"
  | "MANUAL_OVERRIDE";

export type EvaluatorType =
  | "AUTOMATIC_DETERMINISTIC"
  | "AI_ASSISTED"
  | "MANUAL_HUMAN";

export interface ExaminationPaperSection {
  id: string;
  paperId: string;
  sectionName: string;
  sectionOrder: number;
  totalDisplayedQuestions: number;
  attemptableQuestions: number;
  marksPerQuestion: number;
  displayedMarks: number;
  attemptableMarks: number;
  maximumObtainableMarks: number;
  choiceRule: ChoiceRule;
  instructions?: string;
  questionIds: string[];
}

export interface ExaminationPaperQuestion {
  id: string;
  paperId: string;
  blueprintSlotId: string;
  questionBankItemId: string;
  questionBankVersion: string;
  sequence: number;
  sectionId: string;
  sectionName: string;
  marks: number;
  questionType: BlueprintQuestionType;
  difficulty: BlueprintDifficulty;
  cognitiveLevel: CognitiveLevel;
  choiceGroup?: string;
  isCompulsory: boolean;
  displayOrder: number;

  // Content for presentation
  questionText: string;
  options?: Array<{ key: "A" | "B" | "C" | "D"; text: string }>; // Clean student options (no isCorrect indicator)

  // Taxonomy & Provenance
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  granularItemId?: string;
  granularScope?: string;
  granularIdentifier?: string;
  sourcePages: number[];
  provenance: any;
}

export interface PaperValidationReport {
  isValid: boolean;
  paperId: string;
  marksMatch: boolean;
  questionCountMatch: boolean;
  choiceRulesValid: boolean;
  difficultyDistributionValid: boolean;
  topicCoverageValid: boolean;
  approvalGatesPassed: boolean;
  provenanceComplete: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
}

export interface ExaminationPaperSnapshot {
  snapshotId: string;
  paperId: string;
  paperCode: string;
  paperVersion: string;
  frozenAt: string;
  blueprintId: string;
  blueprintVersion: string;
  syllabusId: string;
  syllabusVersion: string;
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  sections: ExaminationPaperSection[];
  questions: Array<
    ExaminationPaperQuestion & {
      // Secure internal snapshot keeps answerMaterial for server-side evaluation only
      answerMaterial?: any;
    }
  >;
  difficultyDistribution: {
    easyMarks: number;
    mediumMarks: number;
    difficultMarks: number;
    easyCount: number;
    mediumCount: number;
    difficultCount: number;
  };
}

export interface ExaminationPaper {
  id: string;
  paperCode: string; // e.g. PAP-PHY9-2025-001
  version: string; // e.g. v1.0
  blueprintId: string;
  boardId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  syllabusId: string;
  bookId?: string;
  title: string;
  instructions: string;
  totalMarks: number;
  durationMinutes: number;
  questionCount: number;
  status: ExaminationPaperStatus;
  assemblyVersion: string;

  sections: ExaminationPaperSection[];
  questions: ExaminationPaperQuestion[];
  validationReport?: PaperValidationReport;
  snapshot?: ExaminationPaperSnapshot;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface StudentAnswer {
  id: string;
  attemptId: string;
  paperQuestionId: string;
  sequenceNumber: number;
  selectedOption?: string; // For MCQ: "A", "B", "C", "D"
  answerText?: string; // For short / long questions
  numericAnswer?: number; // For numerical questions
  isAnswered: boolean;
  isMarkedForReview: boolean;
  savedAt: string;
  submittedAt?: string;

  // Evaluation Details (Server internal / Result only)
  evaluationStatus: EvaluationState;
  marksAwarded: number;
  maxMarks: number;
  evaluatorType: EvaluatorType;
  evaluationReason?: string;
  feedback?: string;
  evaluationConfidence?: number;

  // Manual Review & Audit
  originalEvaluatedMarks?: number;
  overriddenBy?: string;
  overrideReason?: string;
  overrideTimestamp?: string;
}

export interface ExaminationAttempt {
  id: string;
  paperId: string;
  paperCode: string;
  paperTitle: string;
  studentId: string;
  studentName?: string;
  attemptNumber: number;
  status: ExamAttemptStatus;
  startedAt: string;
  expiresAt: string; // Server authoritative timestamp: startedAt + durationMinutes
  submittedAt?: string;
  durationMinutes: number;

  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;

  createdAt: string;
  updatedAt: string;
}

export interface ExaminationResult {
  id: string;
  attemptId: string;
  paperId: string;
  paperCode: string;
  paperTitle: string;
  studentId: string;
  studentName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  status: "PROVISIONAL" | "FINAL";

  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;

  sectionBreakdown: Array<{
    sectionId: string;
    sectionName: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    questionCount: number;
    attemptedCount: number;
  }>;

  difficultyBreakdown: {
    easy: { marksObtained: number; maxMarks: number; percentage: number; questionCount: number };
    medium: { marksObtained: number; maxMarks: number; percentage: number; questionCount: number };
    difficult: { marksObtained: number; maxMarks: number; percentage: number; questionCount: number };
  };

  chapterBreakdown: Array<{
    chapterId: string;
    chapterTitle: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    questionCount: number;
  }>;

  topicBreakdown: Array<{
    topicId: string;
    topicTitle: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    questionCount: number;
  }>;

  questionTypeBreakdown: Array<{
    questionType: BlueprintQuestionType;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    questionCount: number;
  }>;

  answersSummary: Array<{
    paperQuestionId: string;
    sequence: number;
    questionType: BlueprintQuestionType;
    marks: number;
    marksAwarded: number;
    isCorrect: boolean;
    isAnswered: boolean;
    isMarkedForReview: boolean;
    evaluatorType: EvaluatorType;
    evaluationStatus: EvaluationState;
  }>;

  evaluatedAt: string;
  resultVersion: string;
}

export interface ExamAuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action:
    | "PAPER_CREATED"
    | "PAPER_VALIDATED"
    | "PAPER_PUBLISHED"
    | "PAPER_ACTIVATED"
    | "PAPER_CLOSED"
    | "PAPER_ARCHIVED"
    | "ATTEMPT_STARTED"
    | "ANSWER_SAVED"
    | "ATTEMPT_SUBMITTED"
    | "EXAM_EVALUATED"
    | "RESULT_GENERATED"
    | "SCORE_OVERRIDDEN";
  entityId: string;
  entityType: "PAPER" | "ATTEMPT" | "ANSWER" | "RESULT";
  timestamp: string;
  details: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
}

// ==============================================================================
// AI Live Paper Generator - Grounded Question Generation Domain Types (Phase 8)
// Models for QuestionCandidate, QuestionBankItem, GenerationBatch & Validation
// ==============================================================================

import {
  BlueprintQuestionType,
  CognitiveLevel,
  BlueprintDifficulty,
  QuestionSpecification,
} from "./blueprint";

export type QuestionValidationStatus =
  | "PENDING"
  | "VALIDATED"
  | "FAILED"
  | "FLAGGED";

export type QuestionReviewStatus =
  | "GENERATED"
  | "AUTO_VALIDATED"
  | "NEEDS_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface MCQOption {
  key: "A" | "B" | "C" | "D";
  text: string;
  isCorrect: boolean;
  distractorRationale?: string;
}

export interface AnswerMaterial {
  // MCQ specific
  options?: MCQOption[];
  correctOptionKey?: "A" | "B" | "C" | "D";
  mcqExplanation?: string;

  // Short question specific
  expectedKeyPoints?: string[];
  partialCreditGuidelines?: string;

  // Long / Essay question specific
  rubricBreakdown?: Array<{
    criterion: string;
    marks: number;
    description: string;
  }>;
  sampleExemplar?: string;

  // Numerical question specific
  numericalData?: {
    givens: Record<string, string | number>;
    requiredQuantity: string;
    formula: string;
    calculationSteps: string[];
    finalValue: number | string;
    unit: string;
    tolerance?: number;
  };

  // Diagram question specific
  diagramData?: {
    requiredLabels: string[];
    visualComponents: string[];
    description: string;
    sourceFigureReference?: string;
  };
}

export interface QuestionPart {
  partLabel: string; // e.g. "a", "b", "i", "ii"
  text: string;
  marks: number;
  cognitiveLevel?: CognitiveLevel;
}

export interface GroundingValidationResult {
  isGrounded: boolean;
  groundingScore: number; // 0.00 to 1.00
  supportedFacts: string[];
  unsupportedFacts: string[];
  provenanceComplete: boolean;
  evidenceChunkCount: number;
  verificationNotes: string;
}

export interface DifficultyValidationResult {
  targetDifficulty: BlueprintDifficulty;
  evaluatedDifficulty: BlueprintDifficulty;
  isAligned: boolean;
  cognitiveComplexityScore: number; // 1 to 5
  reasoningStepsCount: number;
  abstractionLevel: "CONCRETE" | "INTERMEDIATE" | "ABSTRACT";
  responseDepthLevel: "OBJECTIVE" | "BRIEF" | "MODERATE" | "EXTENSIVE";
  varianceFlagged: boolean;
  reconciliationNotes: string;
}

export interface DuplicateValidationResult {
  hasDuplicates: boolean;
  duplicateLevel: "NONE" | "EXACT" | "NEAR_DUPLICATE" | "SAME_KNOWLEDGE";
  highestSimilarityScore: number; // 0.00 to 1.00
  matchedQuestionId?: string;
  matchedQuestionText?: string;
  analysisDetails: string;
}

export interface NumericalValidationResult {
  isConsistent: boolean;
  givensValid: boolean;
  formulaIdentified: string;
  calculatedResult: number | string;
  expectedResult: number | string;
  unitsMatch: boolean;
  deterministicCalculationMatch: boolean;
  discrepancyNote?: string;
}

export interface CurriculumValidationResult {
  isSyllabusEligible: boolean;
  chapterMatch: boolean;
  topicMatch: boolean;
  learningObjectiveCovered: boolean;
  notes?: string;
}

export interface QuestionValidationIssue {
  field: string;
  severity: "ERROR" | "WARNING" | "INFO";
  code: string;
  message: string;
}

export interface QuestionValidationReport {
  isValid: boolean;
  overallQualityScore: number; // 0 to 100
  grounding: GroundingValidationResult;
  difficulty: DifficultyValidationResult;
  duplication: DuplicateValidationResult;
  curriculum: CurriculumValidationResult;
  mathematical?: NumericalValidationResult;
  issues: QuestionValidationIssue[];
  validatedAt: string;
}

export interface QuestionCandidate {
  id: string;
  questionText: string;
  questionType: BlueprintQuestionType;
  marks: number;
  difficulty: BlueprintDifficulty;
  cognitiveLevel: CognitiveLevel;

  // Educational Hierarchy & Provenance
  boardId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  syllabusId: string;
  syllabusVersion: string;
  bookId?: string;
  bookTitle?: string;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  granularItemId?: string;
  granularScope?: string;
  granularIdentifier?: string;

  // Blueprint & Specification Linkage
  blueprintId: string;
  blueprintSlotId: string;
  questionSpecificationId: string;

  // Source Evidence & Provenance
  sourceChunkIds: string[];
  sourceElementIds: string[];
  sourcePages: number[];
  provenance: {
    bookId?: string;
    bookTitle?: string;
    chapterId: string;
    chapterTitle: string;
    topicId: string;
    topicTitle: string;
    granularItemId?: string;
    granularScope?: string;
    granularIdentifier?: string;
    pageNumbers: number[];
    syllabusVersion: string;
    documentId?: string;
    eligibilityStatus?: string;
    eligibilityReason?: string;
  };

  // Structured Answer Key (Internal / Examiner Facing Only)
  answerMaterial: AnswerMaterial;

  // Multi-part breakdown for extended/long questions
  parts?: QuestionPart[];

  // Generation Metadata
  generationModel: string;
  generationProvider: string;
  generationVersion: string;
  generationTimestamp: string;

  // Validation & Review
  validationStatus: QuestionValidationStatus;
  qualityScore: number;
  reviewStatus: QuestionReviewStatus;
  validationReport: QuestionValidationReport;

  // Review Audit Trail
  reviewAuditTrail?: Array<{
    reviewerId: string;
    previousStatus: QuestionReviewStatus;
    newStatus: QuestionReviewStatus;
    reason: string;
    timestamp: string;
  }>;

  createdAt: string;
  updatedAt: string;
}

export interface HistoricalQuestionVersion {
  version: string;
  questionText: string;
  answerMaterial: AnswerMaterial;
  marks: number;
  difficulty: BlueprintDifficulty;
  qualityScore: number;
  approvedAt: string;
  approverId: string;
}

export interface QuestionBankItem {
  id: string;
  candidateId: string;
  version: string; // e.g. "1.0", "1.1", "2.0"
  parentQuestionId?: string;
  historicalVersions: HistoricalQuestionVersion[];

  // Taxonomy & Curriculum
  boardId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  syllabusId: string;
  syllabusVersion: string;
  bookId?: string;
  bookTitle?: string;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  granularItemId?: string;
  granularScope?: string;
  granularIdentifier?: string;

  // Pedagogical Metadata
  questionType: BlueprintQuestionType;
  marks: number;
  difficulty: BlueprintDifficulty;
  cognitiveLevel: CognitiveLevel;

  // Content
  questionText: string;
  answerMaterial: AnswerMaterial;
  parts?: QuestionPart[];

  // Provenance & Evidence
  sourceChunkIds: string[];
  sourcePages: number[];
  sourceProvenance: any;

  // Quality & Status
  validationState: QuestionValidationStatus;
  reviewState: "APPROVED" | "ARCHIVED" | "DEPRECATED";
  qualityScore: number;
  validationReport: QuestionValidationReport;

  tags: string[];
  usageCount: number;

  approvedBy: string;
  approvedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionGenerationBatch {
  id: string;
  blueprintId: string;
  specificationIds: string[];
  requestedCount: number;
  generatedCount: number;
  acceptedCount: number;
  blockedCount: number;
  rejectedCount: number;
  candidateIds: string[];
  provider: string;
  model: string;
  generationVersion: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIAL";
  failureReasons: Array<{
    slotId: string;
    code: string;
    reason: string;
  }>;
  validationSummary: {
    averageQualityScore: number;
    flaggedCount: number;
    duplicateCount: number;
    groundingFailures: number;
  };
  startedAt: string;
  completedAt?: string;
}

export interface GenerationGateCheckResult {
  canGenerate: boolean;
  blueprintStatus: string;
  syllabusStatus: string;
  contentEligibility: string;
  provenanceStatus: string;
  specificationStatus: string;
  retrievalStatus: string;
  failureCode?:
    | "BLUEPRINT_NOT_APPROVED"
    | "SYLLABUS_NOT_AUTHORIZED"
    | "CONTENT_NOT_ELIGIBLE"
    | "PROVENANCE_INCOMPLETE"
    | "SPECIFICATION_INVALID"
    | "GENERATION_BLOCKED_INSUFFICIENT_EVIDENCE"
    | "GATE_CHECK_FAILED";
  failureReason?: string;
}

export interface GroundingEvidencePackage {
  topicId: string;
  topicTitle: string;
  chapterId: string;
  chapterTitle: string;
  bookTitle?: string;
  syllabusVersion: string;
  chunks: Array<{
    chunkId: string;
    content: string;
    pageNumber: number;
    score: number;
    chunkType?: string;
    heading?: string;
  }>;
  extractedFormulas: string[];
  extractedDefinitions: string[];
  extractedFacts: string[];
  isSufficient: boolean;
  evidenceCount: number;
  citationString: string;
}

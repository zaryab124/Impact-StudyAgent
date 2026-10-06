// ==============================================================================
// AI Live Paper Generator - Sample Paper & Examination Pattern Types
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

export type SamplePaperStatus =
  | "UPLOADED"
  | "EXTRACTING"
  | "ANALYZING"
  | "COMPLETED"
  | "COMPLETED_WITH_WARNINGS"
  | "FAILED"
  | "NEEDS_REVIEW";

export type SamplePaperSourceType =
  | "SAMPLE_PAPER"
  | "MODEL_PAPER"
  | "PAST_PAPER"
  | "PRACTICE_PAPER";

export type SampleQuestionType =
  | "MCQ"
  | "SHORT"
  | "LONG"
  | "NUMERICAL"
  | "CONCEPTUAL"
  | "DEFINITION"
  | "EXPLANATION"
  | "COMPARISON"
  | "APPLICATION"
  | "DIAGRAM"
  | "DERIVATION"
  | "PROBLEM_SOLVING"
  | "OTHER";

export type SampleDifficultyLevel = "EASY" | "MEDIUM" | "DIFFICULT" | "UNKNOWN";

export type PatternAggregationLevel =
  | "SINGLE_PAPER"
  | "COMMON_PATTERN"
  | "OCCASIONAL_PATTERN"
  | "AGGREGATED";

export type CognitiveComplexity =
  | "RECALL"
  | "UNDERSTANDING"
  | "APPLICATION"
  | "ANALYSIS"
  | "SYNTHESIS"
  | "EVALUATION";

export type CalculationComplexity = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type AbstractionLevel = "CONCRETE" | "MODERATE" | "ABSTRACT";

export type ExpectedSolutionDepth =
  | "SHORT_PHRASE"
  | "SINGLE_VALUE"
  | "PARAGRAPH"
  | "MULTI_STEP_DERIVATION"
  | "DETAILED_EXPLANATION";

/**
 * Explicit multi-signal difficulty evidence
 * Mandatory Refinement 1
 */
export interface DifficultyEvidence {
  cognitiveComplexity: CognitiveComplexity;
  reasoningSteps: number;
  calculationComplexity: CalculationComplexity;
  abstractionLevel: AbstractionLevel;
  expectedSolutionDepth: ExpectedSolutionDepth;
  prerequisiteKnowledge: string[];
  rationale?: string;
}

export interface ChoiceRuleDTO {
  selectionType: "CHOOSE_N" | "OR_CHOICE" | "ALL_COMPULSORY" | "INTERNAL_CHOICE";
  available: number;
  required: number;
  groupName?: string;
  orWith?: string;
  description?: string;
}

export interface SectionStructureDTO {
  name: string;
  order: number;
  totalMarks: number;
  questionCount: number;
  compulsoryCount: number;
  optionalCount: number;
  choiceRule?: ChoiceRuleDTO | null;
  questionTypes: SampleQuestionType[];
  marksPerQuestion: number[];
  instructions?: string | null;
}

export interface DeterministicMarksArithmeticDTO {
  reportedTotalMarks: number;
  calculatedTotalMarks: number;
  calculatedCompulsoryMarks: number;
  calculatedOptionalMarks: number;
  sectionTotals: {
    sectionName: string;
    calculatedMarks: number;
    reportedMarks?: number;
    isMatch: boolean;
  }[];
  isConsistent: boolean;
  discrepancyFlags: string[];
}

export interface DifficultyDistributionDTO {
  easyCount: number;
  mediumCount: number;
  difficultCount: number;
  unknownCount: number;
  total: number;
  easyPercentage: number;
  mediumPercentage: number;
  difficultPercentage: number;
  unknownPercentage: number;
}

export interface SamplePaperQuestionDTO {
  id: string;
  samplePaperId: string;
  pageNumber: number;
  originalNumber: string;
  normalizedNumber: string;
  sectionName: string;
  questionOrder: number;
  text: string;
  abstractRepresentation?: string | null;
  primaryType: SampleQuestionType;
  secondaryTypes: SampleQuestionType[];
  marks: number;
  isCompulsory: boolean;
  choiceRule?: ChoiceRuleDTO | null;
  
  // Multi-signal difficulty
  difficulty: SampleDifficultyLevel;
  difficultyConfidence: number;
  difficultyEvidence: DifficultyEvidence;
  difficultyMethod: string;
  
  // Linguistics & command verbs
  commandVerb?: string | null;
  questionStem?: string | null;
  expectedResponseDepth?: string | null;
  
  // Curriculum Mapping (Confidence separate from difficulty - Mandatory Refinement 2)
  chapterId?: string | null;
  topicId?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string | null;
  syllabusTopicItemId?: string | null;
  sourceChunkId?: string | null;
  mappingConfidence: number;
  mappingStatus: "MATCHED" | "PARTIAL_MATCH" | "UNMATCHED" | "REQUIRES_REVIEW";
  
  // Verification & Review
  needsReview: boolean;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
}

export interface SamplePaperDTO {
  id: string;
  title: string;
  year: number;
  totalMarks: number;
  durationMinutes: number;
  subjectId: string;
  subjectName?: string | null;
  boardId?: string | null;
  boardName?: string | null;
  academicYearId?: string | null;
  academicYearName?: string | null;
  classId?: string | null;
  className?: string | null;
  syllabusId?: string | null;
  sourceType: SamplePaperSourceType;
  sourceReference?: string | null;
  sourceUrl?: string | null;
  fileName?: string | null;
  checksum?: string | null;
  status: SamplePaperStatus;
  pageCount: number;
  instructions?: { generalInstructions?: string[]; sectionInstructions?: Record<string, string> } | null;
  extractedStructure?: {
    sections: SectionStructureDTO[];
    totalQuestions: number;
  } | null;
  arithmeticValidation?: DeterministicMarksArithmeticDTO | null;
  qualityReport?: SamplePaperQualityReportDTO | null;
  processingLogs?: { timestamp: string; step: string; message: string }[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SamplePaperQualityReportDTO {
  samplePaperId: string;
  title: string;
  totalMarks: number;
  durationMinutes: number;
  sectionsCount: number;
  questionsCount: number;
  mcqCount: number;
  shortCount: number;
  longCount: number;
  numericalCount: number;
  optionalCount: number;
  observedDifficulty: DifficultyDistributionDTO;
  targetDifficultyPlaceholder: {
    easyPercentage: number;
    mediumPercentage: number;
    difficultPercentage: number;
    note: string;
  };
  chapterCoverageCount: number;
  topicCoverageCount: number;
  reviewRequiredCount: number;
  provenanceCoverage: number; // Percentage (0-100)
  isArithmeticallyConsistent: boolean;
  arithmeticFlags: string[];
}

export interface PaperPatternSpecificationDTO {
  id: string;
  title: string;
  version: string; // "v1", "v2"
  subjectId: string;
  subjectName?: string | null;
  boardId?: string | null;
  boardName?: string | null;
  academicYearId?: string | null;
  academicYearName?: string | null;
  classId?: string | null;
  className?: string | null;
  syllabusId?: string | null;
  totalMarks: number;
  durationMinutes: number;
  status: string;
  patternConfidence: number;
  supportingSampleCount: number;
  aggregationLevel: PatternAggregationLevel;
  sectionStructure: SectionStructureDTO[];
  questionDistribution: Record<string, number>;
  marksDistribution: {
    total: number;
    compulsory: number;
    optional: number;
    byType: Record<string, number>;
  };
  difficultyObservations: DifficultyDistributionDTO;
  targetDifficulty: {
    easyPct: number;
    mediumPct: number;
    difficultPct: number;
    note: string;
  };
  choiceRules: ChoiceRuleDTO[];
  wordingCharacteristics: {
    commonCommandVerbs: { verb: string; count: number; frequency: number }[];
    commonStems: string[];
    averageQuestionLengthChars: number;
    expectedResponseDepths: Record<string, number>;
    numericalFrequency: number;
    conceptualFrequency: number;
    diagramFrequency: number;
    definitionFrequency: number;
    applicationFrequency: number;
    choiceFrequency: number;
  };
  contributingPapers: {
    samplePaperId: string;
    title: string;
    year: number;
    isOutlier: boolean;
    outlierReason?: string | null;
  }[];
  validationReport: {
    isConsistent: boolean;
    issues: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaperComparisonDTO {
  papers: {
    id: string;
    title: string;
    year: number;
    status: string;
  }[];
  marksComparison: {
    paperId: string;
    totalMarks: number;
    compulsoryMarks: number;
    optionalMarks: number;
  }[];
  durationComparison: {
    paperId: string;
    durationMinutes: number;
  }[];
  sectionComparison: {
    paperId: string;
    sectionCount: number;
    sections: { name: string; questionCount: number; marks: number }[];
  }[];
  questionTypeComparison: {
    type: SampleQuestionType;
    counts: Record<string, number>;
  }[];
  difficultyComparison: {
    paperId: string;
    observedDifficulty: DifficultyDistributionDTO;
  }[];
  choiceRulesComparison: {
    paperId: string;
    choiceRules: ChoiceRuleDTO[];
  }[];
  curriculumCoverageComparison: {
    paperId: string;
    mappedChaptersCount: number;
    mappedTopicsCount: number;
  }[];
}

export interface SamplePaperAuditDTO {
  id: string;
  samplePaperId: string;
  questionId?: string | null;
  reviewerId?: string | null;
  reviewerName?: string | null;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason: string;
  timestamp: string;
}

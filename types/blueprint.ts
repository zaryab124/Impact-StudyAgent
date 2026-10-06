// ==============================================================================
// AI Live Paper Generator - Examination Blueprint Domain Types (Phase 7)
// Structured Models for Blueprints, Sections, Question Slots, Allocations & Conflicts
// ==============================================================================

export type BlueprintStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "VALIDATED"
  | "APPROVED"
  | "ARCHIVED";

export type BlueprintQuestionType =
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

export type CognitiveLevel =
  | "RECALL"
  | "UNDERSTAND"
  | "APPLY"
  | "ANALYZE"
  | "EVALUATE"
  | "CREATE";

export type BlueprintDifficulty = "EASY" | "MEDIUM" | "DIFFICULT";

export type ChoiceRuleType =
  | "NO_CHOICE"
  | "CHOOSE_N_OF_M"
  | "OR_CHOICE"
  | "ATTEMPT_N_OF_M";

export interface ChoiceRule {
  type: ChoiceRuleType;
  attemptCount?: number;
  totalCount?: number;
  orGroupCount?: number;
  description?: string;
}

export interface SectionMarksCalculation {
  displayedMarks: number;
  attemptableMarks: number;
  maximumObtainableMarks: number;
  isConsistent: boolean;
  notes?: string;
}

export interface BlueprintSection {
  id: string;
  blueprintId: string;
  sectionName: string;
  sectionOrder: number;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  displayedMarks: number;
  attemptableMarks: number;
  maximumObtainableMarks: number;
  questionTypes: BlueprintQuestionType[];
  choiceRule: ChoiceRule;
  difficultyTarget?: {
    easyCount: number;
    mediumCount: number;
    difficultCount: number;
  };
  instructions?: string;
  responseFormat?: string;
}

export interface BlueprintQuestionSlot {
  id: string;
  blueprintId: string;
  sectionId: string;
  sectionName: string;
  sequence: number;
  questionType: BlueprintQuestionType;
  marks: number;
  targetDifficulty: BlueprintDifficulty;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  granularItemId?: string;
  granularScope?: string;
  granularIdentifier?: string;
  knowledgeType: string;
  cognitiveLevel: CognitiveLevel;
  requiredAnswerDepth: "OBJECTIVE" | "BRIEF" | "MODERATE" | "EXTENSIVE";
  optionalState: "COMPULSORY" | "OPTIONAL" | "CHOICE_GROUP";
  choiceGroupId?: string;
  retrievalRequirements: {
    chapterId: string;
    topicId: string;
    granularItemId?: string;
    granularScope?: string;
    granularIdentifier?: string;
    knowledgeTypes: string[];
    questionType: BlueprintQuestionType;
    difficulty: BlueprintDifficulty;
    marks: number;
  };
}

export interface QuestionSpecification {
  id: string;
  blueprintId: string;
  blueprintSlotId: string;
  sectionName: string;
  sequenceNumber: number;
  questionType: BlueprintQuestionType;
  marks: number;
  difficulty: BlueprintDifficulty;
  cognitiveLevel: CognitiveLevel;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  granularItemId?: string;
  granularScope?: string;
  granularIdentifier?: string;
  requiredKnowledgeTypes: string[];
  requiredEvidenceCount: number;
  answerDepth: "OBJECTIVE" | "BRIEF" | "MODERATE" | "EXTENSIVE";
  constraints: string[];
  retrievalQuery: string;
  provenanceRequirements: {
    mustMatchBook: boolean;
    mustMatchChapter: boolean;
    mustMatchTopic: boolean;
    minRelevanceScore: number;
  };
  status: "PENDING_GENERATION" | "GENERATION_READY";
  createdAt: string;
}

export interface DifficultyDistributionTarget {
  easyPct: number;
  mediumPct: number;
  difficultPct: number;
}

export interface DifficultyComparison {
  observedSampleDistribution?: DifficultyDistributionTarget;
  requestedTargetDistribution: DifficultyDistributionTarget;
  finalBlueprintDistribution: {
    easyCount: number;
    mediumCount: number;
    difficultCount: number;
    easyMarks: number;
    mediumMarks: number;
    difficultMarks: number;
    easyPct: number;
    mediumPct: number;
    difficultPct: number;
    totalMarks: number;
  };
  reconciliationExplanation: string;
  roundingMethod: "largest_remainder_hare_niemeyer";
}

export interface TopicAllocation {
  topicId: string;
  topicTitle: string;
  marks: number;
  questionCount: number;
  eligibilityStatus: "ELIGIBLE";
  granularAllocations?: Array<{
    granularItemId: string;
    identifier: string;
    scope: string;
    title?: string;
    isIncluded: boolean;
    eligibilityStatus: "ELIGIBLE";
  }>;
}

export interface ChapterAllocation {
  chapterId: string;
  chapterTitle: string;
  marks: number;
  percentage: number;
  questionCount: number;
  curriculumWeightage?: number;
  patternObservedWeightage?: number;
  targetWeightage: number;
  topicAllocations: TopicAllocation[];
}

export interface CoverageAllocationSummary {
  chapters: ChapterAllocation[];
  curriculumWeightageTotal: number;
  patternWeightageTotal: number;
  blueprintWeightageTotal: number;
  unallocatedEligibleChaptersCount: number;
  totalCoveredMarks?: number;
}

export interface PatternConflictRecord {
  id: string;
  type: "PATTERN_SYLLABUS_CONFLICT";
  entityType: "CHAPTER" | "TOPIC";
  entityId: string;
  entityTitle: string;
  patternObservation: string;
  syllabusStatus: string;
  resolution: string;
  detectedAt: string;
}

export interface BlueprintValidationReport {
  isValid: boolean;
  blueprintId: string;
  calculatedGrandTotal: number;
  requestedGrandTotal: number;
  isMarksArithmeticValid: boolean;
  isHierarchyValid: boolean;
  isSyllabusValid: boolean;
  isDifficultyValid: boolean;
  isChoiceRuleValid: boolean;
  isCoverageValid: boolean;
  hasPatternConflicts: boolean;
  errors: string[];
  warnings: string[];
  conflictList: PatternConflictRecord[];
  validatedAt: string;
}

export interface PaperBlueprintRequest {
  boardId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  syllabusId: string;
  bookId?: string;
  title: string;
  totalMarks: number;
  durationMinutes: number;
  language?: string;
  requestedDifficultyDistribution?: DifficultyDistributionTarget;
  sections?: Array<{
    sectionName: string;
    sectionOrder: number;
    questionCount: number;
    marksPerQuestion: number;
    questionTypes: BlueprintQuestionType[];
    choiceRule?: ChoiceRule;
    instructions?: string;
    responseFormat?: string;
  }>;
  questionTypeRequirements?: Partial<Record<BlueprintQuestionType, number>>;
  chapterCoverageRequirements?: Record<string, number>;
  topicCoverageRequirements?: Record<string, number>;
  patternId?: string;
  patternVersion?: string;
  generationConstraints?: string[];
}

export interface ExaminationBlueprint {
  id: string;
  version: string; // e.g. "v1.0" or "v2.0"
  boardId: string;
  boardName?: string;
  academicYearId: string;
  academicYearName?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  syllabusId: string;
  syllabusTitle?: string;
  syllabusVersion?: string;
  syllabusStatus?: string;
  bookId?: string;
  bookTitle?: string;
  title: string;
  totalMarks: number;
  durationMinutes: number;
  language: string;
  status: BlueprintStatus;
  difficultyComparison: DifficultyComparison;
  questionTypeDistribution: Record<BlueprintQuestionType, number>;
  cognitiveLevelDistribution: Record<CognitiveLevel, number>;
  sections: BlueprintSection[];
  slots: BlueprintQuestionSlot[];
  coverageAllocation: CoverageAllocationSummary;
  patternConflicts: PatternConflictRecord[];
  sourcePatternId?: string;
  sourcePatternVersion?: string;
  validationReport?: BlueprintValidationReport;
  provenanceMetadata: {
    authorId?: string;
    reviewerId?: string;
    approverId?: string;
    approvedAt?: string;
    reviewedAt?: string;
    syllabusSourceReference: string;
    bookReference?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintAllocationExplanation {
  slotSequence: number;
  sectionName: string;
  marks: number;
  questionType: BlueprintQuestionType;
  difficulty: BlueprintDifficulty;
  cognitiveLevel: CognitiveLevel;
  chapter: {
    id: string;
    title: string;
    reason: string;
  };
  topic: {
    id: string;
    title: string;
    reason: string;
  };
  weightageEvidence: {
    curriculumWeightage?: number;
    patternFrequency?: number;
    targetAllocationMarks: number;
  };
  retrievalExpectation: string;
}

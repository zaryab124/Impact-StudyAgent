export type SyllabusStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "PUBLISHED"
  | "ARCHIVED"
  | "DEPRECATED";

export type SyllabusSourceType =
  | "OFFICIAL_DOCUMENT"
  | "OFFICIAL_PDF"
  | "OFFICIAL_WEBPAGE"
  | "ADMIN_ENTRY"
  | "IMPORTED_STRUCTURED";

export type AlignmentStatus =
  | "MATCHED"
  | "PARTIAL_MATCH"
  | "UNMATCHED"
  | "REQUIRES_REVIEW";

export type EligibilityStatus =
  | "ELIGIBLE"
  | "EXCLUDED"
  | "UNKNOWN"
  | "REQUIRES_REVIEW";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export type ExaminationRelevance = "HIGH" | "MEDIUM" | "LOW" | "OPTIONAL";

export type GranularScope =
  | "SUBTOPIC"
  | "HEADING"
  | "EXERCISE_QUESTION";

export interface SyllabusProvenance {
  sourceTitle?: string | null;
  sourceReference?: string | null;
  sourcePage?: number | null;
  sourceUrl?: string | null;
  sourceType: SyllabusSourceType;
  verificationStatus: VerificationStatus;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
}

export interface SyllabusDTO {
  id: string;
  title: string;
  version: string;
  description?: string | null;
  boardId?: string | null;
  boardName?: string | null;
  academicYearId: string;
  academicYearName?: string | null;
  classId: string;
  className?: string | null;
  subjectId: string;
  subjectName?: string | null;
  status: SyllabusStatus;
  effectiveDate?: string | null;
  provenance: SyllabusProvenance;
  chapterCount?: number;
  topicCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusTopicMappingDTO {
  id: string;
  syllabusTopicItemId: string;
  topicId: string;
  topicCode?: string | null;
  topicTitle: string;
  alignmentStatus: AlignmentStatus;
  confidence: number;
  notes?: string | null;
}

export interface SyllabusChapterItemDTO {
  id: string;
  syllabusId: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  isIncluded: boolean;
  weightage?: number | null;
  examinationRelevance: ExaminationRelevance;
  alignmentStatus: AlignmentStatus;
  confidence: number;
  eligibility: EligibilityStatus;
  notes?: string | null;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface SyllabusTopicItemDTO {
  id: string;
  syllabusId: string;
  topicId: string;
  topicCode?: string | null;
  topicTitle: string;
  chapterNumber?: number;
  isIncluded: boolean;
  weightage?: number | null;
  examinationRelevance: ExaminationRelevance;
  alignmentStatus: AlignmentStatus;
  confidence: number;
  eligibility: EligibilityStatus;
  notes?: string | null;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  mappings?: SyllabusTopicMappingDTO[];
  granularItems?: SyllabusGranularItemDTO[];
}

export interface SyllabusGranularItemDTO {
  id?: string;
  syllabusTopicItemId?: string;
  scope: GranularScope;
  identifier: string;
  title?: string | null;
  isIncluded: boolean;
  eligibility: EligibilityStatus;
  sourceDocument?: string | null;
  sourcePage?: number | null;
  sourceReference?: string | null;
  effectiveDate?: string | null;
  verificationStatus: VerificationStatus;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumAlignmentReport {
  syllabusId: string;
  syllabusTitle: string;
  syllabusVersion: string;
  bookId: string;
  bookTitle: string;
  boardName: string;
  academicYearName: string;
  subjectName: string;
  className: string;
  totalSyllabusChapters: number;
  matchedChapters: number;
  partiallyMatchedChapters: number;
  unmatchedChapters: number;
  excludedChapters: number;
  reviewRequiredChapters: number;
  totalSyllabusTopics: number;
  matchedTopics: number;
  partiallyMatchedTopics: number;
  unmatchedTopics: number;
  excludedTopics: number;
  reviewRequiredTopics: number;
  overallCoveragePct: number;
  chapters: Array<{
    chapterId: string;
    chapterNumber: number;
    title: string;
    isIncluded: boolean;
    weightage: number | null;
    alignmentStatus: AlignmentStatus;
    eligibility: EligibilityStatus;
    confidence: number;
    reviewNotes?: string | null;
  }>;
  topics: Array<{
    topicId: string;
    topicCode?: string | null;
    title: string;
    chapterNumber?: number;
    isIncluded: boolean;
    weightage: number | null;
    alignmentStatus: AlignmentStatus;
    eligibility: EligibilityStatus;
    confidence: number;
    mappedBookTopicsCount: number;
    reviewNotes?: string | null;
  }>;
}

export interface SyllabusValidationReport {
  syllabusId: string;
  title: string;
  version: string;
  status: SyllabusStatus;
  isValidForExamGeneration: boolean;
  totalChapters: number;
  matchedChapters: number;
  unmatchedChapters: number;
  excludedChapters: number;
  reviewRequiredChapters: number;
  totalTopics: number;
  matchedTopics: number;
  unmatchedTopics: number;
  excludedTopics: number;
  reviewRequiredTopics: number;
  coveragePct: number;
  issues: string[];
}

export interface SyllabusComparisonResult {
  versionA: {
    id: string;
    version: string;
    academicYearName: string;
  };
  versionB: {
    id: string;
    version: string;
    academicYearName: string;
  };
  addedChapters: Array<{ chapterNumber: number; title: string }>;
  removedChapters: Array<{ chapterNumber: number; title: string }>;
  addedTopics: Array<{ topicCode?: string | null; title: string }>;
  removedTopics: Array<{ topicCode?: string | null; title: string }>;
  changedWeightage: Array<{
    itemType: "CHAPTER" | "TOPIC";
    codeOrNumber: string;
    title: string;
    oldWeight: number | null;
    newWeight: number | null;
  }>;
  changedInclusion: Array<{
    itemType: "CHAPTER" | "TOPIC";
    codeOrNumber: string;
    title: string;
    oldInclusion: boolean;
    newInclusion: boolean;
  }>;
}

export interface EligibleKnowledgeResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  bookId: string;
  bookTitle: string;
  chapterId: string | null;
  chapterNumber: number | null;
  chapterTitle: string | null;
  topicId: string | null;
  topicCode: string | null;
  topicTitle: string | null;
  pageNumber: number;
  chunkType: string;
  content: string;
  heading?: string | null;
  syllabusId: string;
  syllabusVersion: string;
  eligibilityStatus: EligibilityStatus;
  alignmentStatus: AlignmentStatus;
  weightage?: number | null;
  confidence: number;
}

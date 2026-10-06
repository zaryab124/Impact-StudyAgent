// ==============================================================================
// AI Live Paper Generator - Educational Data Import & Governance Types (Phase 10)
// Production-Ready Provenance, Hierarchy Verification & Ingestion Schemas
// ==============================================================================

export type VerificationState =
  | "VERIFIED"
  | "UNVERIFIED"
  | "DATA_SOURCE_REQUIRED"
  | "NEEDS_VERIFICATION"
  | "REJECTED";

export interface ProvenanceMetadata {
  sourceName: string;
  sourceUrl?: string;
  sourceDocumentHash?: string; // SHA-256
  officialPublicationDate?: string; // ISO date string
  publisher: string;
  importedBy: string;
  verifiedBy?: string;
  verificationStatus: VerificationState;
  provenanceNotes?: string;
}

export interface ImportTopicInput {
  title: string;
  orderIndex: number;
  topicCode?: string;
  description?: string;
  learningOutcomes?: string[]; // SLOs
}

export interface ImportChapterInput {
  chapterNumber: number;
  title: string;
  orderIndex: number;
  description?: string;
  topics: ImportTopicInput[];
}

export interface ImportBookInput {
  title: string;
  publisher: string;
  version?: string;
  edition?: string;
  author?: string;
  isbn?: string;
  provenance: ProvenanceMetadata;
  chapters: ImportChapterInput[];
}

export interface ImportSubjectInput {
  code: string;
  name: string;
  books?: ImportBookInput[];
}

export interface ImportClassInput {
  name: string;
  numericLevel: number;
  subjects: ImportSubjectInput[];
}

export interface ImportAcademicYearInput {
  code: string; // e.g. "2024-2025"
  name: string; // e.g. "Academic Session 2024-2025"
  startDate?: string;
  endDate?: string;
  classes: ImportClassInput[];
}

export interface ImportBoardPayload {
  code: string; // e.g. "BISE_LHR", "FEDERAL_BOARD"
  name: string;
  country?: string;
  region?: string;
  provenance: ProvenanceMetadata;
  academicYears: ImportAcademicYearInput[];
}

export interface ImportValidationError {
  path: string;
  message: string;
  code: "INVALID_FIELD" | "MISSING_PROVENANCE" | "INVALID_HIERARCHY" | "DUPLICATE_CODE" | "DATA_SOURCE_REQUIRED";
}

export interface ImportValidationWarning {
  path: string;
  message: string;
  code: "MISSING_RECOMMENDED_FIELD" | "EXISTING_ENTITY_OVERWRITE" | "UNVERIFIED_SOURCE";
}

export interface HierarchyEntitySummary {
  boards: number;
  academicYears: number;
  classes: number;
  subjects: number;
  books: number;
  chapters: number;
  topics: number;
  learningOutcomes: number;
}

export interface DataImportPreviewResult {
  valid: boolean;
  provenanceComplete: boolean;
  verificationStatus: VerificationState;
  hierarchySummary: HierarchyEntitySummary;
  hierarchyTree: {
    boardCode: string;
    boardName: string;
    academicYears: Array<{
      code: string;
      classes: Array<{
        numericLevel: number;
        name: string;
        subjects: Array<{
          code: string;
          name: string;
          booksCount: number;
          chaptersCount: number;
        }>;
      }>;
    }>;
  };
  duplicates: Array<{
    entityType: "BOARD" | "YEAR" | "CLASS" | "SUBJECT" | "BOOK" | "CHAPTER" | "TOPIC";
    identifier: string;
    existingName: string;
  }>;
  warnings: ImportValidationWarning[];
  errors: ImportValidationError[];
}

export interface DataImportCommitResult {
  success: boolean;
  committedAt: string;
  batchId: string;
  importedCounts: HierarchyEntitySummary;
  createdEntityIds: {
    boardIds: string[];
    academicYearIds: string[];
    classIds: string[];
    subjectIds: string[];
    bookIds: string[];
    chapterIds: string[];
    topicIds: string[];
  };
  auditLogId?: string;
  errors?: string[];
}

export interface ImportBatchRecord {
  id: string;
  sourceName: string;
  verificationStatus: VerificationState;
  importedBy: string;
  createdAt: string;
  summary: HierarchyEntitySummary;
}

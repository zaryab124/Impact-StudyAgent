export type DocumentStatus =
  | "UPLOADED"
  | "VALIDATING"
  | "PROCESSING"
  | "EXTRACTING"
  | "STRUCTURING"
  | "CHUNKING"
  | "EMBEDDING"
  | "COMPLETED"
  | "COMPLETED_WITH_WARNINGS"
  | "FAILED";

export type PageExtractionStatus =
  | "PENDING"
  | "EXTRACTED"
  | "OCR_FALLBACK"
  | "FLAGGED_FOR_REVIEW"
  | "FAILED";

export type ExtractionMethod = "NATIVE_PDF" | "OCR_VISION" | "SYNTHETIC";

export type ChunkType =
  | "HEADING"
  | "CONCEPT"
  | "DEFINITION"
  | "FORMULA"
  | "EXAMPLE"
  | "EXERCISE"
  | "TABLE"
  | "DIAGRAM"
  | "SUMMARY"
  | "SLO";

export type ElementType =
  | "DEFINITION"
  | "FORMULA"
  | "EXAMPLE"
  | "EXERCISE"
  | "TABLE"
  | "DIAGRAM"
  | "SLO";

export type EmbeddingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface DocumentQualityReport {
  documentId: string;
  documentTitle: string;
  totalPages: number;
  pagesSuccessfullyProcessed: number;
  pagesRequiringReview: number;
  chaptersDetected: number;
  topicsDetected: number;
  elements: {
    definitions: number;
    formulas: number;
    examples: number;
    exercises: number;
    tables: number;
    diagrams: number;
    learningOutcomes: number;
  };
  totalChunks: number;
  totalEmbeddings: number;
  provenanceCoveragePct: number;
  processingDurationSeconds: number;
  status: DocumentStatus;
  warnings: string[];
}

export interface DocumentDTO {
  id: string;
  bookId: string;
  academicYearId?: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  status: DocumentStatus;
  pageCount: number;
  qualityReport?: DocumentQualityReport | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentPageDTO {
  id: string;
  documentId: string;
  pageNumber: number;
  rawText?: string | null;
  status: PageExtractionStatus;
  extractionMethod: ExtractionMethod;
  confidence: number;
  contentType?: string | null;
  hasTables: boolean;
  hasDiagrams: boolean;
  hasFormulas: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface DocumentChunkDTO {
  id: string;
  documentId: string;
  pageId: string;
  pageNumber: number;
  chapterId?: string | null;
  topicId?: string | null;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  chunkType: ChunkType;
  heading?: string | null;
  orderIndex: number;
  confidence: number;
  extractionMethod: ExtractionMethod;
  embeddingStatus: EmbeddingStatus;
  embeddingModel?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface EducationalElementDTO {
  id: string;
  documentId: string;
  pageNumber: number;
  chapterId?: string | null;
  topicId?: string | null;
  chunkId?: string | null;
  type: ElementType;
  title?: string | null;
  content: Record<string, unknown>;
  sourceText: string;
  isAiDerived: boolean;
  confidence: number;
  createdAt: string;
}

export interface ProvenanceTrace {
  documentId: string;
  documentName: string;
  bookId: string;
  bookTitle: string;
  chapterId?: string | null;
  chapterNumber?: number | null;
  chapterTitle?: string | null;
  topicId?: string | null;
  topicCode?: string | null;
  topicTitle?: string | null;
  pageNumber: number;
  chunkId: string;
  chunkType: ChunkType;
  sourceTextExcerpt: string;
  confidence: number;
}

export interface KnowledgeSearchResult {
  chunkId: string;
  content: string;
  heading?: string | null;
  chunkType: ChunkType;
  similarityScore: number;
  provenance: ProvenanceTrace;
}

// ==============================================================================
// AI Live Paper Generator - Retrieval Augmented Generation (Phase 6 Types)
// Unified Domain Types for Knowledge Retrieval, Hard Syllabus Gating & Provenance
// ==============================================================================

export type RetrievalMode =
  | "GENERAL_KNOWLEDGE"
  | "DEFINITION"
  | "FORMULA"
  | "EXAMPLE"
  | "EXERCISE"
  | "CONCEPT"
  | "NUMERICAL"
  | "DIAGRAM"
  | "TABLE"
  | "TOPIC_SUMMARY"
  | "QUESTION_SUPPORT";

export type QueryIntent =
  | "EXPLANATION"
  | "DEFINITION"
  | "APPLICATION"
  | "DERIVATION"
  | "COMPARISON"
  | "DIAGRAM"
  | "NUMERICAL"
  | "GENERAL";

export type RequestedKnowledgeType =
  | "CONCEPTUAL"
  | "DEFINITION"
  | "FORMULA"
  | "EXAMPLE"
  | "EXERCISE"
  | "NUMERICAL"
  | "DIAGRAM"
  | "TABLE"
  | "MIXED";

export interface PatternContext {
  targetQuestionType?: string;
  targetMarks?: number;
  targetDifficulty?: "EASY" | "MEDIUM" | "DIFFICULT" | "UNKNOWN";
  targetSection?: string;
  targetChapterId?: string;
  targetTopicId?: string;
  targetChapterDistribution?: Record<string, number>;
}

export interface RetrievalLatencyBreakdown {
  databaseQueryLatencyMs: number;
  vectorSearchLatencyMs: number;
  rankingLatencyMs: number;
  contextAssemblyLatencyMs: number;
  totalRetrievalLatencyMs: number;
  targetLatencyMs: number;
  isBenchmarkMet: boolean;
}

export interface RetrievalRequest {
  boardId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  syllabusId: string;
  bookId?: string;
  chapterId?: string;
  topicId?: string;
  query: string;
  chunkTypes?: string[];
  mode?: RetrievalMode;
  topK?: number;
  similarityThreshold?: number;
  requiredDifficultyContext?: "EASY" | "MEDIUM" | "DIFFICULT" | "UNKNOWN" | null;
  language?: string;
  patternContext?: PatternContext;
  maxChunks?: number;
  maxTokens?: number;
  maxPages?: number;
  maxCharacters?: number;
  diagnosticMode?: boolean;
  rankingConfigVersion?: string;
  targetLatencyMs?: number;
  deduplicationSimilarityThreshold?: number;
  deduplicationTextOverlap?: number;
  maxChunksPerPage?: number;
}

export interface RetrievalProvenance {
  documentId: string;
  documentName?: string;
  bookId: string;
  bookTitle: string;
  pageNumber: number;
  chapterId: string | null;
  chapterNumber?: number | null;
  chapterTitle: string | null;
  topicId: string | null;
  topicCode?: string | null;
  topicTitle: string | null;
  chunkId: string;
  syllabusId: string;
  syllabusVersion: string;
  eligibilityStatus: "ELIGIBLE" | "EXCLUDED" | "UNKNOWN" | "REQUIRES_REVIEW";
  sourceReference: string;
  relevanceScore: number;
  granularItemId?: string | null;
  granularScope?: string | null;
  granularIdentifier?: string | null;
  eligibilityReason?: string | null;
  diagnosticCode?: string | null;
}

export interface RetrievalExplanation {
  semanticScore: number;
  keywordScore: number;
  metadataScore: number;
  finalScore: number;
  chapterMatch: "EXACT" | "PARENT" | "ANY";
  topicMatch: "EXACT" | "MAPPED" | "ANY";
  syllabusStatus: string;
  provenanceVerified: boolean;
  rankingConfigVersion?: string;
  weights?: {
    semantic: number;
    keyword: number;
    metadata: number;
  };
  details?: string;
}

export interface RetrievalResultItem {
  chunkId: string;
  content: string;
  heading: string | null;
  chunkType: string;
  tokenCount: number;
  pageNumber: number;
  relevanceScore: number;
  provenance: RetrievalProvenance;
  explanation: RetrievalExplanation;
  isDiagnosticItem?: boolean;
  productionEligible?: boolean;
}

export interface ContextBudgetUsage {
  maxChunks: number;
  usedChunks: number;
  maxTokens: number;
  usedTokens: number;
  maxPages: number;
  usedPages: number;
  maxCharacters: number;
  usedCharacters: number;
  isTruncated: boolean;
  prunedCount: number;
}

export interface QueryUnderstandingResult {
  rawQuery: string;
  intent: QueryIntent;
  requestedKnowledgeType: RequestedKnowledgeType;
  suggestedChunkTypes: string[];
  extractedConcepts: string[];
  detectedSubject?: string | null;
  detectedChapter?: string | null;
  detectedTopic?: string | null;
  confidence: number;
}

export interface RetrievalQualityReport {
  query: string;
  expectedTopic: string | null;
  retrievedTopics: string[];
  relevantResultCount: number;
  irrelevantResultCount: number;
  provenanceCoverage: number; // 0.0 to 1.0 (1.0 = 100%)
  averageSimilarity: number;
  retrievalLatency: number; // in milliseconds
  targetLatencyMs: number;
  isBenchmarkMet: boolean;
  syllabusEligibilityCoverage: number; // 0.0 to 1.0 (1.0 = 100% eligible)
}

export interface RetrievedKnowledgePackage {
  success: boolean;
  status: "SUCCESS" | "NO_RELEVANT_KNOWLEDGE" | "FAILED";
  requestId: string;
  timestamp: string;
  retrievalMode: RetrievalMode;
  syllabusId: string;
  query: string;
  queryUnderstanding?: QueryUnderstandingResult;
  totalCandidates: number;
  returnedCount: number;
  contextBudget: ContextBudgetUsage;
  results: RetrievalResultItem[];
  syllabusContext: {
    syllabusId: string;
    syllabusTitle?: string;
    syllabusVersion: string;
    status: string;
    boardCode?: string;
    className?: string;
    subjectName?: string;
  };
  qualityReport: RetrievalQualityReport;
  latencyBreakdown: RetrievalLatencyBreakdown;
  latencyMs: number;
  rankingConfigVersion: string;
  isDiagnosticResult: boolean;
  productionEligible: boolean;
  message?: string;
}

export interface RetrievalPolicy {
  id: string;
  name: string;
  allowedSyllabusStatuses: string[];
  allowedEligibilityStatuses: string[];
  defaultTopK: number;
  defaultSimilarityThreshold: number;
  maxChunks: number;
  maxTokens: number;
  maxPages: number;
  maxCharacters: number;
  provenanceRequired: boolean;
  allowDiagnosticBypass: boolean;
  rankingConfigVersion: string;
  targetLatencyMs: number;
  weights: {
    semantic: number;
    keyword: number;
    metadata: number;
  };
  diversity: {
    maxChunksPerPage: number;
    deduplicationSimilarityThreshold: number;
    deduplicationTextOverlap: number;
  };
}

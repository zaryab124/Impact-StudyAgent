import { z } from "zod";

export const RetrievalModeEnum = z.enum([
  "GENERAL_KNOWLEDGE",
  "DEFINITION",
  "FORMULA",
  "EXAMPLE",
  "EXERCISE",
  "CONCEPT",
  "NUMERICAL",
  "DIAGRAM",
  "TABLE",
  "TOPIC_SUMMARY",
  "QUESTION_SUPPORT",
]);

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "DIFFICULT", "UNKNOWN"]);

export const PatternContextSchema = z.object({
  targetQuestionType: z.string().optional(),
  targetMarks: z.number().int().min(1).max(100).optional(),
  targetDifficulty: DifficultyEnum.optional(),
  targetSection: z.string().optional(),
  targetChapterId: z.string().uuid().optional().or(z.string().min(1).optional()),
  targetTopicId: z.string().uuid().optional().or(z.string().min(1).optional()),
  targetChapterDistribution: z.record(z.string(), z.number()).optional(),
});

export const RetrievalRequestSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  academicYearId: z.string().min(1, "Academic Year ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  syllabusId: z.string().min(1, "Syllabus ID is required"),
  bookId: z.string().optional(),
  chapterId: z.string().optional(),
  topicId: z.string().optional(),
  query: z.string().min(2, "Query must be at least 2 characters long"),
  chunkTypes: z.array(z.string()).optional(),
  mode: RetrievalModeEnum.optional().default("GENERAL_KNOWLEDGE"),
  topK: z.number().int().min(1).max(50).optional().default(10),
  similarityThreshold: z.number().min(0.0).max(1.0).optional().default(0.3),
  requiredDifficultyContext: DifficultyEnum.nullable().optional(),
  language: z.string().optional().default("en"),
  patternContext: PatternContextSchema.optional(),
  maxChunks: z.number().int().min(1).max(50).optional().default(10),
  maxTokens: z.number().int().min(100).max(10000).optional().default(3000),
  maxPages: z.number().int().min(1).max(100).optional().default(10),
  maxCharacters: z.number().int().min(500).max(50000).optional().default(12000),
  diagnosticMode: z.boolean().optional().default(false),
  rankingConfigVersion: z.string().optional(),
  targetLatencyMs: z.number().int().min(50).max(10000).optional().default(500),
  deduplicationSimilarityThreshold: z.number().min(0.5).max(1.0).optional(),
  deduplicationTextOverlap: z.number().min(0.5).max(1.0).optional(),
  maxChunksPerPage: z.number().int().min(1).max(20).optional(),
});

export const RetrievalPolicySchema = z.object({
  allowedSyllabusStatuses: z.array(z.string()).min(1),
  allowedEligibilityStatuses: z.array(z.string()).min(1),
  defaultTopK: z.number().int().min(1).max(50),
  defaultSimilarityThreshold: z.number().min(0.0).max(1.0),
  maxChunks: z.number().int().min(1).max(50),
  maxTokens: z.number().int().min(100).max(20000),
  maxPages: z.number().int().min(1).max(100),
  maxCharacters: z.number().int().min(500).max(100000),
  provenanceRequired: z.boolean(),
  allowDiagnosticBypass: z.boolean().optional().default(false),
  weights: z.object({
    semantic: z.number().min(0).max(1),
    keyword: z.number().min(0).max(1),
    metadata: z.number().min(0).max(1),
  }),
  diversity: z.object({
    maxChunksPerPage: z.number().int().min(1),
    deduplicationSimilarityThreshold: z.number().min(0.5).max(1.0),
    deduplicationTextOverlap: z.number().min(0.5).max(1.0),
  }),
});

export const ValidateQuerySchema = z.object({
  boardId: z.string().min(1),
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  syllabusId: z.string().min(1),
  bookId: z.string().optional(),
  chapterId: z.string().optional(),
  topicId: z.string().optional(),
  query: z.string().min(1),
});

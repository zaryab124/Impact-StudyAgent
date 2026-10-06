import { z } from "zod";

export const ChunkTypeSchema = z.enum([
  "HEADING",
  "CONCEPT",
  "DEFINITION",
  "FORMULA",
  "EXAMPLE",
  "EXERCISE",
  "TABLE",
  "DIAGRAM",
  "SUMMARY",
  "SLO",
]);

export const ElementTypeSchema = z.enum([
  "DEFINITION",
  "FORMULA",
  "EXAMPLE",
  "EXERCISE",
  "TABLE",
  "DIAGRAM",
  "SLO",
]);

export const DocumentStatusSchema = z.enum([
  "UPLOADED",
  "VALIDATING",
  "PROCESSING",
  "EXTRACTING",
  "STRUCTURING",
  "CHUNKING",
  "EMBEDDING",
  "COMPLETED",
  "COMPLETED_WITH_WARNINGS",
  "FAILED",
]);

export const KnowledgeSearchSchema = z.object({
  queryText: z
    .string()
    .min(1, "Search query text cannot be empty")
    .max(1000, "Search query text cannot exceed 1000 characters"),
  boardId: z.string().uuid("Invalid board UUID").optional().nullable(),
  academicYearId: z.string().uuid("Invalid academic year UUID").optional().nullable(),
  classId: z.string().uuid("Invalid class UUID").optional().nullable(),
  subjectId: z.string().uuid("Invalid subject UUID").optional().nullable(),
  bookId: z.string().uuid("Invalid book UUID").optional().nullable(),
  chapterId: z.string().uuid("Invalid chapter UUID").optional().nullable(),
  topicId: z.string().uuid("Invalid topic UUID").optional().nullable(),
  chunkType: ChunkTypeSchema.optional().nullable(),
  pageNumber: z.coerce.number().int().min(1).optional().nullable(),
  minScore: z.coerce.number().min(0).max(1).default(0.3),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type KnowledgeSearchInput = z.infer<typeof KnowledgeSearchSchema>;

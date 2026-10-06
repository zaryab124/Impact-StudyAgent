import { z } from "zod";

export const SyllabusStatusSchema = z.enum([
  "DRAFT",
  "UNDER_REVIEW",
  "VERIFIED",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
]);

export const SyllabusSourceTypeSchema = z.enum([
  "OFFICIAL_DOCUMENT",
  "OFFICIAL_PDF",
  "OFFICIAL_WEBPAGE",
  "ADMIN_ENTRY",
  "IMPORTED_STRUCTURED",
]);

export const AlignmentStatusSchema = z.enum([
  "MATCHED",
  "PARTIAL_MATCH",
  "UNMATCHED",
  "REQUIRES_REVIEW",
]);

export const EligibilityStatusSchema = z.enum([
  "ELIGIBLE",
  "EXCLUDED",
  "UNKNOWN",
  "REQUIRES_REVIEW",
]);

export const VerificationStatusSchema = z.enum([
  "UNVERIFIED",
  "PENDING_REVIEW",
  "VERIFIED",
  "REJECTED",
]);

export const ExaminationRelevanceSchema = z.enum(["HIGH", "MEDIUM", "LOW", "OPTIONAL"]);

export const GranularScopeSchema = z.enum([
  "SUBTOPIC",
  "HEADING",
  "EXERCISE_QUESTION",
]);

export const SyllabusGranularItemInputSchema = z.object({
  scope: GranularScopeSchema,
  identifier: z.string().min(1, "Identifier is required").max(255),
  title: z.string().max(255).optional().nullable(),
  isIncluded: z.boolean(),
  eligibility: EligibilityStatusSchema.optional(),
  sourceDocument: z.string().max(255).optional().nullable(),
  sourcePage: z.number().int().min(1).optional().nullable(),
  sourceReference: z.string().max(255).optional().nullable(),
  effectiveDate: z.string().datetime().optional().nullable(),
  verificationStatus: VerificationStatusSchema.default("UNVERIFIED"),
  verifiedBy: z.string().optional().nullable(),
  verificationNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const SyllabusChapterItemInputSchema = z.object({
  chapterId: z.string().uuid("Valid chapter UUID is required"),
  isIncluded: z.boolean().default(true),
  weightage: z.number().min(0).max(100).optional().nullable(),
  examinationRelevance: ExaminationRelevanceSchema.default("HIGH"),
  alignmentStatus: AlignmentStatusSchema.optional().default("UNMATCHED"),
  confidence: z.number().min(0).max(1).optional().default(1.0),
  eligibility: EligibilityStatusSchema.optional().default("ELIGIBLE"),
  notes: z.string().optional().nullable(),
});

export const SyllabusTopicItemInputSchema = z.object({
  topicId: z.string().uuid("Valid topic UUID is required"),
  isIncluded: z.boolean().default(true),
  weightage: z.number().min(0).max(100).optional().nullable(),
  examinationRelevance: ExaminationRelevanceSchema.default("HIGH"),
  alignmentStatus: AlignmentStatusSchema.optional().default("UNMATCHED"),
  confidence: z.number().min(0).max(1).optional().default(1.0),
  eligibility: EligibilityStatusSchema.optional().default("ELIGIBLE"),
  notes: z.string().optional().nullable(),
  granularItems: z.array(SyllabusGranularItemInputSchema).optional(),
});

export const CreateSyllabusSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  version: z
    .string()
    .min(1, "Version is required")
    .regex(/^[A-Za-z0-9_.-]+$/, "Version format must be valid (e.g., 2025-v1)"),
  description: z.string().optional().nullable(),
  boardId: z.string().uuid().optional().nullable(),
  academicYearId: z.string().uuid("Valid academic year UUID is required"),
  classId: z.string().uuid("Valid class UUID is required"),
  subjectId: z.string().uuid("Valid subject UUID is required"),
  status: SyllabusStatusSchema.default("DRAFT"),
  effectiveDate: z.string().datetime().optional().nullable(),
  
  // Provenance fields
  sourceTitle: z.string().max(255).optional().nullable(),
  sourceReference: z.string().max(255).optional().nullable(),
  sourcePage: z.number().int().min(1).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  sourceType: SyllabusSourceTypeSchema.default("ADMIN_ENTRY"),
  verificationStatus: VerificationStatusSchema.default("UNVERIFIED"),
  verifiedBy: z.string().optional().nullable(),
  verificationNotes: z.string().optional().nullable(),

  chapterItems: z.array(SyllabusChapterItemInputSchema).optional(),
  topicItems: z.array(SyllabusTopicItemInputSchema).optional(),
});

export const AlignCurriculumInputSchema = z.object({
  bookId: z.string().uuid("Valid book UUID is required for alignment"),
  thresholdMatch: z.number().min(0).max(1).default(0.85),
  thresholdPartial: z.number().min(0).max(1).default(0.65),
});

export const AlignmentReviewInputSchema = z.object({
  itemId: z.string().uuid("Valid item UUID is required"),
  itemType: z.enum(["CHAPTER", "TOPIC"]),
  decision: z.enum(["CONFIRMED", "REJECTED", "MODIFIED"]),
  isIncluded: z.boolean().optional(),
  weightage: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  reviewerId: z.string().optional().nullable(),
  reviewerName: z.string().optional().nullable(),
});

export const EligibleContentFilterSchema = z.object({
  boardId: z.string().uuid().optional().nullable(),
  academicYearId: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  bookId: z.string().uuid().optional().nullable(),
  chapterId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  chunkType: z.string().optional().nullable(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateSyllabusInput = z.input<typeof CreateSyllabusSchema>;
export type SyllabusChapterItemInput = z.input<typeof SyllabusChapterItemInputSchema>;
export type SyllabusTopicItemInput = z.input<typeof SyllabusTopicItemInputSchema>;
export type SyllabusGranularItemInput = z.input<typeof SyllabusGranularItemInputSchema>;
export type AlignCurriculumInput = z.input<typeof AlignCurriculumInputSchema>;
export type AlignmentReviewInput = z.input<typeof AlignmentReviewInputSchema>;
export type EligibleContentFilter = z.infer<typeof EligibleContentFilterSchema>;

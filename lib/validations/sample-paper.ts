// ==============================================================================
// AI Live Paper Generator - Zod Validation Schemas
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { z } from "zod";

export const SamplePaperSourceTypeSchema = z.enum([
  "SAMPLE_PAPER",
  "MODEL_PAPER",
  "PAST_PAPER",
  "PRACTICE_PAPER",
]);

export const SampleQuestionTypeSchema = z.enum([
  "MCQ",
  "SHORT",
  "LONG",
  "NUMERICAL",
  "CONCEPTUAL",
  "DEFINITION",
  "EXPLANATION",
  "COMPARISON",
  "APPLICATION",
  "DIAGRAM",
  "DERIVATION",
  "PROBLEM_SOLVING",
  "OTHER",
]);

export const SampleDifficultyLevelSchema = z.enum([
  "EASY",
  "MEDIUM",
  "DIFFICULT",
  "UNKNOWN",
]);

export const ChoiceRuleSchema = z.object({
  selectionType: z.enum(["CHOOSE_N", "OR_CHOICE", "ALL_COMPULSORY", "INTERNAL_CHOICE"]),
  available: z.number().int().min(1),
  required: z.number().int().min(1),
  groupName: z.string().optional(),
  orWith: z.string().optional(),
  description: z.string().optional(),
});

export const UploadSamplePaperSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  subjectId: z.string().uuid("Invalid subject UUID"),
  year: z.coerce.number().int().min(1990).max(2050).default(2025),
  totalMarks: z.coerce.number().int().min(0).default(0),
  durationMinutes: z.coerce.number().int().min(10).max(360).default(180),
  boardId: z.string().uuid().optional().nullable(),
  academicYearId: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  syllabusId: z.string().uuid().optional().nullable(),
  sourceType: SamplePaperSourceTypeSchema.default("SAMPLE_PAPER"),
  sourceReference: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
});

export const ProcessSamplePaperSchema = z.object({
  forceReprocess: z.boolean().default(false),
  ocrFallback: z.boolean().default(false),
});

export const ReviewQuestionSchema = z.object({
  questionId: z.string().uuid("Invalid question UUID"),
  action: z.enum([
    "CONFIRM_TYPE",
    "CONFIRM_DIFFICULTY",
    "CONFIRM_MAPPING",
    "CONFIRM_MARKS",
    "OVERRIDE_CHOICE",
    "REJECT_EXTRACTION",
    "GENERAL_OVERRIDE",
  ]),
  primaryType: SampleQuestionTypeSchema.optional(),
  secondaryTypes: z.array(SampleQuestionTypeSchema).optional(),
  difficulty: SampleDifficultyLevelSchema.optional(),
  marks: z.number().int().min(0).max(100).optional(),
  choiceRule: ChoiceRuleSchema.optional().nullable(),
  chapterId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3, "Review rationale must be provided for audit tracking"),
});

export const AnalyzePatternSchema = z.object({
  subjectId: z.string().uuid("Invalid subject UUID"),
  samplePaperIds: z.array(z.string().uuid()).min(1, "At least one sample paper ID is required"),
  versionTitle: z.string().min(2).optional(),
  boardId: z.string().uuid().optional().nullable(),
  academicYearId: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  syllabusId: z.string().uuid().optional().nullable(),
});

export const CompareSamplePapersSchema = z.object({
  paperIds: z.array(z.string().uuid()).min(2, "At least two paper IDs are required for comparison"),
});

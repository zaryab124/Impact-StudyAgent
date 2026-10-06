// ==============================================================================
// AI Live Paper Generator - Examination Engine Validation Schemas (Phase 9)
// Runtime Zod Schemas for Paper Assembly, Student Autosave & Evaluation
// ==============================================================================

import { z } from "zod";

export const CreatePaperRequestSchema = z.object({
  blueprintId: z.string().min(1, "Blueprint ID is required."),
  paperCode: z.string().optional(),
  title: z.string().min(3, "Paper title must be at least 3 characters.").optional(),
  instructions: z.string().optional(),
});

export const SaveAnswerRequestSchema = z.object({
  paperQuestionId: z.string().min(1, "Paper question ID is required."),
  sequenceNumber: z.number().int().positive().optional(),
  selectedOption: z.enum(["A", "B", "C", "D"]).optional().nullable(),
  answerText: z.string().optional().nullable(),
  numericAnswer: z.number().optional().nullable(),
  isMarkedForReview: z.boolean().optional().default(false),
});

export const SubmitAttemptRequestSchema = z.object({
  confirmSubmission: z.boolean().refine((val) => val === true, {
    message: "Submission must be explicitly confirmed.",
  }),
});

export const ScoreOverrideRequestSchema = z.object({
  paperQuestionId: z.string().min(1, "Paper question ID is required."),
  newMarks: z.number().min(0, "Overridden marks must be non-negative."),
  reason: z.string().min(5, "Override reason must be at least 5 characters long."),
});

export const PaperSearchFiltersSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "VALIDATING",
      "VALIDATED",
      "PUBLISHED",
      "ACTIVE",
      "CLOSED",
      "ARCHIVED",
    ])
    .optional(),
  boardId: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  searchQuery: z.string().optional(),
});

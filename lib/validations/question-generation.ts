// ==============================================================================
// AI Live Paper Generator - Question Generation Validation Schemas (Phase 8)
// Zod schemas for generation requests, batches, review actions, and search filters
// ==============================================================================

import { z } from "zod";
import {
  BlueprintQuestionTypeEnum,
  CognitiveLevelEnum,
  BlueprintDifficultyEnum,
} from "./blueprint";

export const GenerateQuestionRequestSchema = z.object({
  blueprintId: z.string().min(1, "Blueprint ID is required"),
  blueprintSlotId: z.string().min(1, "Blueprint slot ID is required"),
  specificationId: z.string().optional(),
  preferredProvider: z.string().optional().default("auto"),
  temperature: z.number().min(0).max(1).optional().default(0.2),
  customPromptInstructions: z.array(z.string()).optional(),
});

export const GenerateBatchRequestSchema = z.object({
  blueprintId: z.string().min(1, "Blueprint ID is required"),
  slotIds: z.array(z.string()).optional(),
  preferredProvider: z.string().optional().default("auto"),
  maxConcurrency: z.number().int().min(1).max(10).optional().default(3),
});

export const ReviewQuestionRequestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "FLAG_FOR_REVIEW"]),
  reason: z.string().min(3, "A descriptive reason is required for review actions"),
  feedbackNotes: z.string().optional(),
  updatedQuestionText: z.string().optional(),
});

export const QuestionBankSearchSchema = z.object({
  boardId: z.string().optional(),
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  syllabusId: z.string().optional(),
  chapterId: z.string().optional(),
  topicId: z.string().optional(),
  questionType: BlueprintQuestionTypeEnum.optional(),
  difficulty: BlueprintDifficultyEnum.optional(),
  cognitiveLevel: CognitiveLevelEnum.optional(),
  validationStatus: z.enum(["PENDING", "VALIDATED", "FAILED", "FLAGGED"]).optional(),
  reviewStatus: z.enum(["GENERATED", "AUTO_VALIDATED", "NEEDS_REVIEW", "APPROVED", "REJECTED"]).optional(),
  minQualityScore: z.number().min(0).max(100).optional(),
  searchQuery: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

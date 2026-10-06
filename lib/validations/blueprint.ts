// ==============================================================================
// AI Live Paper Generator - Blueprint Validation Schemas (Phase 7)
// Zod schemas for validating blueprint requests, sections, choice rules & slots
// ==============================================================================

import { z } from "zod";

export const BlueprintStatusEnum = z.enum([
  "DRAFT",
  "UNDER_REVIEW",
  "VALIDATED",
  "APPROVED",
  "ARCHIVED",
]);

export const BlueprintQuestionTypeEnum = z.enum([
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

export const CognitiveLevelEnum = z.enum([
  "RECALL",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE",
]);

export const BlueprintDifficultyEnum = z.enum(["EASY", "MEDIUM", "DIFFICULT"]);

export const ChoiceRuleTypeEnum = z.enum([
  "NO_CHOICE",
  "CHOOSE_N_OF_M",
  "OR_CHOICE",
  "ATTEMPT_N_OF_M",
]);

export const ChoiceRuleSchema = z.object({
  type: ChoiceRuleTypeEnum,
  attemptCount: z.number().int().min(1).optional(),
  totalCount: z.number().int().min(1).optional(),
  orGroupCount: z.number().int().min(1).optional(),
  description: z.string().optional(),
});

export const DifficultyDistributionSchema = z.object({
  easyPct: z.number().min(0).max(100),
  mediumPct: z.number().min(0).max(100),
  difficultPct: z.number().min(0).max(100),
}).refine(
  (data) => Math.abs(data.easyPct + data.mediumPct + data.difficultPct - 100) < 1.0,
  { message: "Difficulty percentages must sum to 100%" }
);

export const SectionInputSchema = z.object({
  sectionName: z.string().min(1, "Section name is required"),
  sectionOrder: z.number().int().min(1),
  questionCount: z.number().int().min(1, "Question count must be at least 1"),
  marksPerQuestion: z.number().int().min(1, "Marks per question must be at least 1"),
  questionTypes: z.array(BlueprintQuestionTypeEnum).min(1, "At least one question type is required"),
  choiceRule: ChoiceRuleSchema.optional(),
  instructions: z.string().optional(),
  responseFormat: z.string().optional(),
});

export const PaperBlueprintRequestSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  academicYearId: z.string().min(1, "Academic Year ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  syllabusId: z.string().min(1, "Syllabus ID is required"),
  bookId: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  totalMarks: z.number().int().min(5).max(300, "Total marks must be between 5 and 300"),
  durationMinutes: z.number().int().min(15).max(360, "Duration must be between 15 and 360 minutes"),
  language: z.string().optional().default("en"),
  requestedDifficultyDistribution: DifficultyDistributionSchema.optional().default({
    easyPct: 33.33,
    mediumPct: 33.33,
    difficultPct: 33.34,
  }),
  sections: z.array(SectionInputSchema).optional(),
  questionTypeRequirements: z.record(z.string(), z.number().int().min(0)).optional(),
  chapterCoverageRequirements: z.record(z.string(), z.number().int().min(0)).optional(),
  topicCoverageRequirements: z.record(z.string(), z.number().int().min(0)).optional(),
  patternId: z.string().optional(),
  patternVersion: z.string().optional(),
  generationConstraints: z.array(z.string()).optional(),
});

export const UpdateBlueprintRequestSchema = z.object({
  title: z.string().min(3).optional(),
  durationMinutes: z.number().int().min(15).max(360).optional(),
  language: z.string().optional(),
  requestedDifficultyDistribution: DifficultyDistributionSchema.optional(),
  sections: z.array(SectionInputSchema).optional(),
  generationConstraints: z.array(z.string()).optional(),
});

export const ReviewBlueprintSchema = z.object({
  notes: z.string().optional(),
});

export const QuestionSpecificationRequestSchema = z.object({
  blueprintId: z.string().min(1, "Blueprint ID is required"),
  blueprintSlotId: z.string().min(1, "Blueprint slot ID is required"),
  constraints: z.array(z.string()).optional(),
});

// Backwards-compatible aliases for Phase 1 legacy consumers
export const DifficultySchema = BlueprintDifficultyEnum;
export const QuestionTypeSchema = BlueprintQuestionTypeEnum;
export const CreateBlueprintSchema = z.object({
  patternId: z.string().uuid().or(z.string().min(1)),
  name: z.string().min(3),
  durationMinutes: z.number().int().min(15).max(360),
  targetTotalMarks: z.number().int().positive().optional(),
  sections: z.array(z.object({
    sectionId: z.string().optional().default("sec_1"),
    name: z.string().min(1),
    questionType: z.enum(["MCQ", "SHORT", "LONG", "NUMERICAL", "ESSAY", "DESCRIPTIVE"]).or(z.string()).default("MCQ") as any,
    questionCount: z.number().int().min(1),
    marksPerQuestion: z.number().int().min(1),
  })).min(1, "Sections cannot be empty"),
});

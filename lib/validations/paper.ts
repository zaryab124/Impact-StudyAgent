import { z } from "zod";
import { DifficultySchema, QuestionTypeSchema } from "./blueprint";

export const CreateQuestionSchema = z.object({
  type: QuestionTypeSchema,
  difficulty: DifficultySchema,
  text: z.string().min(5, "Question text must have at least 5 characters"),
  options: z.array(z.string()).optional(),
  defaultMarks: z.number().int().positive("Marks must be at least 1"),
  expectedAnswer: z.string().optional(),
  rubricCriteria: z.record(z.unknown()).optional(),
  source: z.object({
    documentId: z.string().uuid().optional(),
    bookId: z.string().uuid().optional(),
    chapterId: z.string().uuid().optional(),
    topicId: z.string().uuid().optional(),
    pageNumber: z.number().int().positive().optional(),
    sourceChunkIds: z.array(z.string()).default([]),
    generationModel: z.string().optional(),
  }),
});

export const GeneratePaperRequestSchema = z.object({
  blueprintId: z.string().uuid("Invalid blueprint ID"),
  title: z.string().min(3, "Paper title must be at least 3 characters"),
  seed: z.string().optional(),
});

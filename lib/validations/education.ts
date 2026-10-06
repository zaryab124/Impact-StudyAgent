import { z } from "zod";

export const EntityStatusSchema = z.enum(["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"]);

export const CreateBoardSchema = z.object({
  code: z
    .string()
    .min(2, "Board code must be at least 2 characters")
    .max(50, "Board code must not exceed 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase alphanumeric with underscores (e.g., DEMO_BOARD, BISE_LHR)"),
  name: z.string().min(3, "Board name must be at least 3 characters").max(255),
  country: z.string().min(2).default("Pakistan"),
  region: z.string().max(100).optional().nullable(),
  status: EntityStatusSchema.default("ACTIVE"),
});

export const CreateAcademicYearSchema = z.object({
  boardId: z.string().uuid("Valid board UUID is required"),
  name: z.string().min(3, "Academic year name must be at least 3 characters"),
  code: z
    .string()
    .min(4, "Year code must be at least 4 characters")
    .regex(/^(\d{4}|\d{4}-\d{4})$/, "Code must be YYYY or YYYY-YYYY format (e.g., 2025 or 2024-2025)"),
  startDate: z.string().datetime({ message: "Invalid start date ISO format" }).optional().nullable(),
  endDate: z.string().datetime({ message: "Invalid end date ISO format" }).optional().nullable(),
  status: EntityStatusSchema.default("ACTIVE"),
});

export const CreateClassSchema = z.object({
  academicYearId: z.string().uuid("Valid academic year UUID is required"),
  name: z.string().min(2, "Class name must be at least 2 characters").max(100),
  numericLevel: z
    .number()
    .int("Numeric level must be an integer")
    .min(1, "Numeric level must be between 1 and 16")
    .max(16, "Numeric level must be between 1 and 16"),
  status: EntityStatusSchema.default("ACTIVE"),
});

export const CreateSubjectSchema = z.object({
  classId: z.string().uuid("Valid class UUID is required"),
  name: z.string().min(2, "Subject name must be at least 2 characters").max(255),
  code: z
    .string()
    .min(2, "Subject code must be at least 2 characters")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Subject code must be uppercase alphanumeric (e.g. SCI-09, PHY-09)"),
  status: EntityStatusSchema.default("ACTIVE"),
});

export const CreateBookSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  edition: z.string().max(50).optional().nullable(),
  publisher: z.string().min(2, "Publisher must be at least 2 characters").max(255),
  author: z.string().max(255).optional().nullable(),
  isbn: z.string().max(50).optional().nullable(),
  boardId: z.string().uuid().optional().nullable(),
  academicYearId: z.string().uuid().optional().nullable(),
  classId: z.string().uuid("Valid class UUID is required"),
  subjectId: z.string().uuid("Valid subject UUID is required"),
  version: z
    .string()
    .min(1, "Version is required")
    .regex(/^[A-Za-z0-9_.-]+$/, "Version format must be valid (e.g., 2025.1, v1.0)"),
  status: EntityStatusSchema.default("ACTIVE"),
});

export const CreateChapterSchema = z.object({
  bookId: z.string().uuid("Valid book UUID is required"),
  chapterNumber: z.number().int().min(1, "Chapter number must be an integer >= 1"),
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z.string().optional().nullable(),
  orderIndex: z.number().int().min(1, "Order index must be >= 1"),
  status: EntityStatusSchema.default("ACTIVE"),
});

export const CreateTopicSchema = z.object({
  chapterId: z.string().uuid("Valid chapter UUID is required"),
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z.string().optional().nullable(),
  orderIndex: z.number().int().min(1, "Order index must be >= 1"),
  topicCode: z.string().max(50).optional().nullable(),
  learningOutcomes: z.string().optional().nullable(),
  status: EntityStatusSchema.default("ACTIVE"),
});

export type CreateBoardInput = z.input<typeof CreateBoardSchema>;
export type CreateAcademicYearInput = z.input<typeof CreateAcademicYearSchema>;
export type CreateClassInput = z.input<typeof CreateClassSchema>;
export type CreateSubjectInput = z.input<typeof CreateSubjectSchema>;
export type CreateBookInput = z.input<typeof CreateBookSchema>;
export type CreateChapterInput = z.input<typeof CreateChapterSchema>;
export type CreateTopicInput = z.input<typeof CreateTopicSchema>;

export type QuestionType =
  | "MCQ"
  | "SHORT_QUESTION"
  | "LONG_QUESTION"
  | "NUMERICAL"
  | "CONCEPTUAL"
  | "DEFINITION"
  | "EXPLANATION"
  | "COMPARISON"
  | "APPLICATION_BASED"
  | "DIAGRAM_BASED";

export type Difficulty = "EASY" | "MEDIUM" | "DIFFICULT";

export interface SamplePaperDTO {
  id: string;
  subjectId: string;
  title: string;
  year: number;
  totalMarks: number;
  durationMinutes: number;
  sourceUrl?: string | null;
}

export interface PaperPatternDTO {
  id: string;
  subjectId: string;
  title: string;
  totalMarks: number;
  choiceRules?: Record<string, unknown> | null;
}

export interface PaperSectionDTO {
  id: string;
  patternId: string;
  name: string;
  sectionOrder: number;
  totalMarks: number;
  allowedTimeMinutes?: number | null;
  instructions?: string | null;
}

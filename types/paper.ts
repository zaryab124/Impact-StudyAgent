import { Difficulty, QuestionType } from "./examination";

export interface DeterministicDifficultyDistribution {
  easy: number;
  medium: number;
  difficult: number;
  total: number;
  percentageSummary: {
    easyPct: number;
    mediumPct: number;
    difficultPct: number;
  };
  roundingMethod: "largest_remainder_hare_niemeyer";
}

export interface SectionCalculationSpec {
  sectionId: string;
  name: string;
  questionType: QuestionType;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
}

export interface DeterministicBlueprintResult {
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: DeterministicDifficultyDistribution;
  sections: SectionCalculationSpec[];
  calculatedAt: string;
}

export interface QuestionProvenanceDTO {
  questionId: string;
  sourceDocumentId?: string | null;
  bookId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  pageNumber?: number | null;
  sourceChunkIds: string[];
  generationModel: string;
  generationTimestamp: string;
  difficulty: Difficulty;
  validationStatus: "PENDING" | "VERIFIED" | "REJECTED";
}

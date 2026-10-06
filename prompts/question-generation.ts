/**
 * Future Phase 3 Prompt Template: Book-Grounded Question Generation.
 *
 * Rules strictly enforced:
 * 1. The LLM must NEVER calculate overall paper totals or question allocations.
 * 2. Every generated question MUST include direct textual citations from supplied chunks.
 */

export interface QuestionGenerationPromptInput {
  questionType: string;
  difficulty: "EASY" | "MEDIUM" | "DIFFICULT";
  targetMarks: number;
  topicTitle: string;
  learningOutcomes?: string;
  contextText: string;
}

export function buildQuestionGenerationPrompt(input: QuestionGenerationPromptInput): string {
  return `You are a senior curriculum exam author for a national educational board.
Your task is to generate ONE ${input.difficulty} ${input.questionType} worth exactly ${input.targetMarks} marks.

CURRICULUM TOPIC: ${input.topicTitle}
${input.learningOutcomes ? `LEARNING OUTCOMES: ${input.learningOutcomes}` : ""}

AUTHORITATIVE TEXTBOOK CONTEXT:
"""
${input.contextText}
"""

INSTRUCTIONS:
1. Ground the question strictly in the provided textbook context. Do NOT introduce external concepts not mentioned in the source material.
2. Provide a definitive answer key and exact marking criteria matching the ${input.targetMarks} marks allocation.
3. Cite the exact sentence(s) from the text that validate this question and answer.

Output must strictly adhere to the requested JSON schema.`;
}

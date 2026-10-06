import { describe, it, expect } from "vitest";
import {
  calculateDifficultyDistribution,
  calculateBlueprint,
} from "@/lib/blueprint/calculator";

describe("Deterministic Blueprint Difficulty Engine", () => {
  it("should perfectly divide evenly divisible question counts into exact 33.33% thirds", () => {
    // 3 questions -> 1, 1, 1
    const dist3 = calculateDifficultyDistribution(3);
    expect(dist3.easy).toBe(1);
    expect(dist3.medium).toBe(1);
    expect(dist3.difficult).toBe(1);
    expect(dist3.easy + dist3.medium + dist3.difficult).toBe(3);

    // 9 questions -> 3, 3, 3
    const dist9 = calculateDifficultyDistribution(9);
    expect(dist9.easy).toBe(3);
    expect(dist9.medium).toBe(3);
    expect(dist9.difficult).toBe(3);
    expect(dist9.easy + dist9.medium + dist9.difficult).toBe(9);

    // 30 questions -> 10, 10, 10
    const dist30 = calculateDifficultyDistribution(30);
    expect(dist30.easy).toBe(10);
    expect(dist30.medium).toBe(10);
    expect(dist30.difficult).toBe(10);
    expect(dist30.easy + dist30.medium + dist30.difficult).toBe(30);
  });

  it("should handle remainder 1 deterministically by allocating remainder to Medium difficulty", () => {
    // 10 questions: 10 / 3 = 3 remainder 1 -> Easy: 3, Medium: 4, Difficult: 3
    const dist10 = calculateDifficultyDistribution(10);
    expect(dist10.easy).toBe(3);
    expect(dist10.medium).toBe(4);
    expect(dist10.difficult).toBe(3);
    expect(dist10.easy + dist10.medium + dist10.difficult).toBe(10);

    // 19 questions: 19 / 3 = 6 remainder 1 -> Easy: 6, Medium: 7, Difficult: 6
    const dist19 = calculateDifficultyDistribution(19);
    expect(dist19.easy).toBe(6);
    expect(dist19.medium).toBe(7);
    expect(dist19.difficult).toBe(6);
    expect(dist19.easy + dist19.medium + dist19.difficult).toBe(19);
  });

  it("should handle remainder 2 deterministically by allocating 1 to Medium and 1 to Easy", () => {
    // 11 questions: 11 / 3 = 3 remainder 2 -> Easy: 4, Medium: 4, Difficult: 3
    const dist11 = calculateDifficultyDistribution(11);
    expect(dist11.easy).toBe(4);
    expect(dist11.medium).toBe(4);
    expect(dist11.difficult).toBe(3);
    expect(dist11.easy + dist11.medium + dist11.difficult).toBe(11);

    // 20 questions: 20 / 3 = 6 remainder 2 -> Easy: 7, Medium: 7, Difficult: 6
    const dist20 = calculateDifficultyDistribution(20);
    expect(dist20.easy).toBe(7);
    expect(dist20.medium).toBe(7);
    expect(dist20.difficult).toBe(6);
    expect(dist20.easy + dist20.medium + dist20.difficult).toBe(20);
  });

  it("should strictly guarantee sum invariant: easy + medium + difficult === total for all N from 1 to 100", () => {
    for (let n = 1; n <= 100; n++) {
      const dist = calculateDifficultyDistribution(n);
      const sum = dist.easy + dist.medium + dist.difficult;
      expect(sum).toBe(n);

      // Verify that difference between any two categories never exceeds 1
      const counts = [dist.easy, dist.medium, dist.difficult];
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      expect(max - min).toBeLessThanOrEqual(1);
    }
  });

  it("should reject non-positive integers", () => {
    expect(() => calculateDifficultyDistribution(0)).toThrow();
    expect(() => calculateDifficultyDistribution(-5)).toThrow();
    expect(() => calculateDifficultyDistribution(10.5)).toThrow();
  });
});

describe("Deterministic Blueprint Multi-Section Calculation Engine", () => {
  it("should calculate total questions and marks programmatically without LLM dependency", () => {
    const blueprintInput = {
      sections: [
        {
          sectionId: "sec_a",
          name: "Section A: Multiple Choice",
          questionType: "MCQ" as const,
          questionCount: 12,
          marksPerQuestion: 1,
        },
        {
          sectionId: "sec_b",
          name: "Section B: Short Questions",
          questionType: "SHORT_QUESTION" as const,
          questionCount: 15,
          marksPerQuestion: 2,
        },
        {
          sectionId: "sec_c",
          name: "Section C: Long Questions",
          questionType: "LONG_QUESTION" as const,
          questionCount: 2,
          marksPerQuestion: 9,
        },
      ],
    };

    const result = calculateBlueprint(blueprintInput);

    // Programmatic verification:
    // Total Questions = 12 + 15 + 2 = 29
    // Total Marks = (12*1) + (15*2) + (2*9) = 12 + 30 + 18 = 60
    expect(result.totalQuestions).toBe(29);
    expect(result.totalMarks).toBe(60);

    // Check difficulty distribution for N=29:
    // 29 / 3 = 9 remainder 2 -> Easy: 10, Medium: 10, Difficult: 9 (Sum = 29)
    expect(result.difficultyDistribution.easy).toBe(10);
    expect(result.difficultyDistribution.medium).toBe(10);
    expect(result.difficultyDistribution.difficult).toBe(9);
    expect(result.difficultyDistribution.total).toBe(29);

    // Section calculations verified
    expect(result.sections[0].totalMarks).toBe(12);
    expect(result.sections[1].totalMarks).toBe(30);
    expect(result.sections[2].totalMarks).toBe(18);
  });
});

import { describe, it, expect } from "vitest";
import { CreateBlueprintSchema } from "@/lib/validations/blueprint";
import { CreateBoardSchema } from "@/lib/validations/education";
import { CreateQuestionSchema } from "@/lib/validations/paper";

describe("Domain Validation Schemas (Zod)", () => {
  it("should validate a valid blueprint input schema", () => {
    const validPayload = {
      patternId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      name: "Midterm Examination 2025",
      durationMinutes: 120,
      sections: [
        {
          sectionId: "sec_1",
          name: "Section A",
          questionType: "MCQ",
          questionCount: 10,
          marksPerQuestion: 1,
        },
      ],
    };

    const result = CreateBlueprintSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("should reject blueprint with invalid duration or empty sections", () => {
    const invalidPayload = {
      patternId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      name: "Midterm",
      durationMinutes: 5, // Below 15 min threshold
      sections: [], // Empty sections
    };

    const result = CreateBlueprintSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it("should validate educational Board creation schema", () => {
    const validBoard = {
      code: "BISE_LAHORE",
      name: "Board of Intermediate and Secondary Education Lahore",
      country: "Pakistan",
      region: "Punjab",
    };

    const result = CreateBoardSchema.safeParse(validBoard);
    expect(result.success).toBe(true);

    const invalidBoard = {
      code: "bise lahore with spaces", // Invalid uppercase alphanumeric pattern
      name: "B", // Too short
    };
    const failResult = CreateBoardSchema.safeParse(invalidBoard);
    expect(failResult.success).toBe(false);
  });

  it("should validate question with provenance metadata", () => {
    const validQuestion = {
      type: "MCQ",
      difficulty: "MEDIUM",
      text: "Which of the following is a vector quantity?",
      options: ["Speed", "Velocity", "Distance", "Mass"],
      defaultMarks: 1,
      source: {
        pageNumber: 15,
        sourceChunkIds: ["chk_abc_1"],
        generationModel: "gemini-1.5-pro",
      },
    };

    const result = CreateQuestionSchema.safeParse(validQuestion);
    expect(result.success).toBe(true);
  });
});

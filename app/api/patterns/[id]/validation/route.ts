// ==============================================================================
// AI Live Paper Generator - Pattern Consistency Validation API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { PatternValidator } from "@/server/sample-paper/pattern-validator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pattern = await prisma.paperPattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      return apiError(`Pattern not found with ID: ${id}`, "NOT_FOUND", 404);
    }

    const validationResult = PatternValidator.validatePattern({
      id: pattern.id,
      title: pattern.title,
      version: pattern.version,
      subjectId: pattern.subjectId,
      totalMarks: pattern.totalMarks,
      durationMinutes: pattern.durationMinutes,
      status: pattern.status,
      patternConfidence: pattern.patternConfidence,
      supportingSampleCount: pattern.supportingSampleCount,
      aggregationLevel: pattern.aggregationLevel as any,
      sectionStructure: (pattern.sectionStructure as any) || [],
      questionDistribution: (pattern.questionDistribution as any) || {},
      marksDistribution: (pattern.marksDistribution as any) || { total: pattern.totalMarks, compulsory: pattern.totalMarks, optional: 0, byType: {} },
      difficultyObservations: (pattern.difficultyObservations as any) || {
        easyCount: 0,
        mediumCount: 0,
        difficultCount: 0,
        unknownCount: 0,
        total: 0,
        easyPercentage: 0,
        mediumPercentage: 0,
        difficultPercentage: 0,
        unknownPercentage: 0,
      },
      targetDifficulty: (pattern.targetDifficulty as any) || { easyPct: 33, mediumPct: 33, difficultPct: 34, note: "" },
      choiceRules: (pattern.choiceRules as any) || [],
      wordingCharacteristics: (pattern.wordingCharacteristics as any) || {
        commonCommandVerbs: [],
        commonStems: [],
        averageQuestionLengthChars: 0,
        expectedResponseDepths: {},
        numericalFrequency: 0,
        conceptualFrequency: 0,
        diagramFrequency: 0,
        definitionFrequency: 0,
        applicationFrequency: 0,
        choiceFrequency: 0,
      },
      contributingPapers: [],
      validationReport: { isConsistent: true, issues: [] },
      createdAt: pattern.createdAt.toISOString(),
      updatedAt: pattern.updatedAt.toISOString(),
    });

    return apiSuccess({
      patternId: pattern.id,
      title: pattern.title,
      version: pattern.version,
      validation: validationResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to validate pattern";
    return apiError(message, "VALIDATION_FETCH_ERROR", 500);
  }
}

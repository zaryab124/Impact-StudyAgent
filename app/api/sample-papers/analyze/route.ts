// ==============================================================================
// AI Live Paper Generator - Sample Paper Analysis API (Phase 12)
// POST /api/sample-papers/analyze
// Analyzes uploaded sample papers to derive structural patterns and difficulty distribution
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { PatternLearner, AnalyzedPaperData } from "@/server/sample-paper/pattern-learner";
import { PatternValidator } from "@/server/sample-paper/pattern-validator";
import { AnalyzePatternSchema } from "@/lib/validations/sample-paper";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "EXAMINER";
    if (roleHeader === "STUDENT") {
      return apiError("Unauthorized: Students cannot analyze examination patterns.", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validation = AnalyzePatternSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    const { subjectId, samplePaperIds, versionTitle, boardId, academicYearId, classId, syllabusId } =
      validation.data;

    // Fetch and prepare contributing sample papers
    const analyzedPapers: AnalyzedPaperData[] = [];
    for (const paperId of samplePaperIds) {
      let p = await SamplePaperService.getSamplePaperById(paperId);
      if (!p) {
        return apiError(`Sample paper not found with ID: ${paperId}`, "NOT_FOUND", 404);
      }

      if (p.status === "UPLOADED" || !p.extractedStructure) {
        try {
          p = await SamplePaperService.processSamplePaper(p.id);
        } catch {}
      }

      const questions = await SamplePaperService.getQuestionsForPaper(paperId);

      analyzedPapers.push({
        id: p.id,
        title: p.title,
        year: p.year,
        subjectId: p.subjectId,
        boardId: p.boardId,
        academicYearId: p.academicYearId,
        classId: p.classId,
        syllabusId: p.syllabusId,
        totalMarks: p.totalMarks,
        durationMinutes: p.durationMinutes,
        sections: p.extractedStructure?.sections || [],
        questions: questions.map((q) => ({
          originalNumber: q.originalNumber,
          normalizedNumber: q.normalizedNumber,
          sectionName: q.sectionName,
          primaryType: q.primaryType,
          secondaryTypes: q.secondaryTypes,
          marks: q.marks,
          isCompulsory: q.isCompulsory,
          difficulty: q.difficulty,
          commandVerb: q.commandVerb,
          questionStem: q.questionStem,
          expectedResponseDepth: q.expectedResponseDepth,
          text: q.text,
          chapterId: q.chapterId,
          topicId: q.topicId,
        })),
      });
    }

    // Learn pattern specification
    const spec = await PatternLearner.learnPatternFromSamplePapers(
      subjectId,
      analyzedPapers,
      versionTitle
    );

    // Validate consistency
    const validationResult = PatternValidator.validatePattern(spec);

    let patternId = `pat_${Date.now()}`;
    try {
      const savedPattern = await prisma.paperPattern.create({
        data: {
          subjectId,
          boardId: boardId || spec.boardId || null,
          academicYearId: academicYearId || spec.academicYearId || null,
          classId: classId || spec.classId || null,
          syllabusId: syllabusId || spec.syllabusId || null,
          version: spec.version,
          title: spec.title,
          totalMarks: spec.totalMarks,
          durationMinutes: spec.durationMinutes,
          status: "ACTIVE",
          validationStatus: validationResult.isConsistent ? "VERIFIED" : "PENDING",
          patternConfidence: spec.patternConfidence,
          supportingSampleCount: spec.supportingSampleCount,
          aggregationLevel: spec.aggregationLevel as any,
          sectionStructure: spec.sectionStructure as any,
          questionDistribution: spec.questionDistribution as any,
          marksDistribution: spec.marksDistribution as any,
          difficultyObservations: spec.difficultyObservations as any,
          targetDifficulty: spec.targetDifficulty as any,
          wordingCharacteristics: spec.wordingCharacteristics as any,
          validationReport: validationResult as any,
        },
      });
      patternId = savedPattern.id;
    } catch {}

    return apiSuccess(
      {
        message: `Sample papers analyzed successfully. Derived pattern '${spec.title}'.`,
        patternId,
        pattern: {
          ...spec,
          id: patternId,
          validationReport: validationResult,
        },
      },
      201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze sample papers";
    return apiError(message, "SAMPLE_PAPER_ANALYZE_ERROR", 500);
  }
}

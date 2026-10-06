// ==============================================================================
// AI Live Paper Generator - Pattern Learning & Analysis API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { PatternLearner, AnalyzedPaperData } from "@/server/sample-paper/pattern-learner";
import { PatternValidator } from "@/server/sample-paper/pattern-validator";
import { AnalyzePatternSchema } from "@/lib/validations/sample-paper";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "EXAMINER";
    if (roleHeader === "STUDENT") {
      return apiError("Unauthorized: Students cannot learn examination patterns.", "FORBIDDEN", 403);
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
      const p = await SamplePaperService.getSamplePaperById(paperId);
      if (!p) {
        return apiError(`Sample paper not found with ID: ${paperId}`, "NOT_FOUND", 404);
      }

      // If paper is not yet processed, process it first
      let fullPaper = p;
      if (p.status === "UPLOADED" || !p.extractedStructure) {
        fullPaper = await SamplePaperService.processSamplePaper(p.id);
      }

      const questions = await SamplePaperService.getQuestionsForPaper(paperId);

      analyzedPapers.push({
        id: fullPaper.id,
        title: fullPaper.title,
        year: fullPaper.year,
        subjectId: fullPaper.subjectId,
        boardId: fullPaper.boardId,
        academicYearId: fullPaper.academicYearId,
        classId: fullPaper.classId,
        syllabusId: fullPaper.syllabusId,
        totalMarks: fullPaper.totalMarks,
        durationMinutes: fullPaper.durationMinutes,
        sections: fullPaper.extractedStructure?.sections || [],
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

    // Learn pattern specification (enforcing Mandatory Refinements 4, 5, 9)
    const spec = await PatternLearner.learnPatternFromSamplePapers(
      subjectId,
      analyzedPapers,
      versionTitle
    );

    // Validate consistency
    const validationResult = PatternValidator.validatePattern(spec);

    // Persist PaperPattern entity (non-destructive versioning)
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

    // Link contributing sample papers (with outlier status)
    for (const link of spec.contributingPapers) {
      await prisma.patternSamplePaperLink.create({
        data: {
          patternId: savedPattern.id,
          samplePaperId: link.samplePaperId,
          contributionWeight: link.isOutlier ? 0.3 : 1.0,
          isOutlier: link.isOutlier,
          outlierReason: link.outlierReason || null,
        },
      });
    }

    const resultSpec = {
      ...spec,
      id: savedPattern.id,
      validationReport: validationResult,
      createdAt: savedPattern.createdAt.toISOString(),
      updatedAt: savedPattern.updatedAt.toISOString(),
    };

    return apiSuccess(
      {
        message: `Examination pattern '${spec.title}' (${spec.version}) learned successfully from ${analyzedPapers.length} paper(s).`,
        pattern: resultSpec,
      },
      201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze examination pattern";
    return apiError(message, "PATTERN_ANALYZE_ERROR", 500);
  }
}

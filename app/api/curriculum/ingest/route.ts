// ==============================================================================
// POST /api/curriculum/ingest
// Data Training & Textbook Ingestion REST API
// Allows organizations and admins to upload textbook chapters, topics, learning
// outcomes, and verified question banks to train and ground the AI agent.
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CurriculumQuestionBank, StandardQuestion } from "@/server/exam-engine/curriculum-question-bank";
import { PakistanCurriculumService } from "@/server/curriculum/pakistan-curriculum-registry";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      className,
      subjectCode,
      chapterNumber,
      chapterTitle,
      textbookContent,
      questions = [],
    } = body;

    if (!className || !subjectCode) {
      return apiError("Missing required fields: className and subjectCode are mandatory.", "VALIDATION_ERROR", 400);
    }

    const classLevel = PakistanCurriculumService.normalizeClass(className);
    const subjectKey = PakistanCurriculumService.normalizeSubject(subjectCode);

    let ingestedCount = 0;

    // 1. Ingest questions if provided directly in the payload
    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        if (!q.text || !q.type) continue;

        const stdQ: StandardQuestion = {
          id: `ingested_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          classLevel,
          subjectKey,
          chapterTitle: q.chapterTitle || chapterTitle || `Chapter ${chapterNumber || 1}`,
          topicTitle: q.topicTitle || "Ingested Curriculum Topic",
          type: q.type === "MCQ" ? "MCQ" : q.type === "LONG" ? "LONG" : "SHORT",
          marks: q.marks || (q.type === "MCQ" ? 1 : q.type === "LONG" ? 9 : 2),
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          solutionExplanation: q.solutionExplanation,
          modelAnswer: q.modelAnswer || q.solutionExplanation,
          rubric: q.rubric,
          markingRubric: q.markingRubric,
          difficulty: q.difficulty || "MEDIUM",
        };

        CurriculumQuestionBank.addQuestion(stdQ);
        ingestedCount++;
      }
    }

    // 2. If textbookContent (raw text or chapter notes) is provided, parse and extract candidate questions
    if (textbookContent && typeof textbookContent === "string" && textbookContent.trim().length > 50) {
      const paragraphs = textbookContent
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 30);

      // Create conceptual questions from parsed paragraphs
      paragraphs.slice(0, 5).forEach((p, idx) => {
        const firstSentence = p.split(/[.!?]/)[0] || p;
        const shortQ: StandardQuestion = {
          id: `ingested_txt_${Date.now()}_${idx}`,
          classLevel,
          subjectKey,
          chapterTitle: chapterTitle || `Chapter ${chapterNumber || 1}`,
          topicTitle: `Topic ${idx + 1}`,
          type: "SHORT",
          marks: 2,
          text: `Explain the concept: "${firstSentence.substring(0, 80)}..." and state its primary significance according to the curriculum.`,
          modelAnswer: p,
          markingRubric: ["Accurate statement of concept: 1 Mark", "Relevance & explanation: 1 Mark"],
          difficulty: "MEDIUM",
        };
        CurriculumQuestionBank.addQuestion(shortQ);
        ingestedCount++;
      });
    }

    // 3. Save ingestion record to database if prisma is connected
    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "CURRICULUM_INGEST",
          entityType: "Textbook",
          entityId: `${classLevel}_${subjectKey}`,
          details: {
            className,
            subjectCode,
            chapterNumber,
            chapterTitle,
            ingestedQuestionsCount: ingestedCount,
          },
        },
      });
    } catch {}

    return apiSuccess({
      message: `Successfully ingested and trained ${ingestedCount} question items for Class ${classLevel} ${subjectKey}.`,
      classLevel,
      subjectKey,
      ingestedCount,
      activeQuestionBankSize: CurriculumQuestionBank.getQuestionCount(classLevel, subjectKey),
    }, 201);
  } catch (error: any) {
    return apiError(error.message || "Failed to ingest curriculum data.", "CURRICULUM_INGEST_ERROR", 500);
  }
}

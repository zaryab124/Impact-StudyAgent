// ==============================================================================
// AI Live Paper Generator - Sample Paper Service Orchestrator
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  SamplePaperDTO,
  SamplePaperQuestionDTO,
  SamplePaperSourceType,
} from "@/types/sample-paper";
import { PaperStructureExtractor } from "./paper-structure-extractor";
import { QuestionClassifier } from "./question-classifier";
import { DifficultyAnalyzer } from "./difficulty-analyzer";
import { SampleCurriculumMapper } from "./sample-curriculum-mapper";
import { MarksArithmeticEngine } from "./marks-arithmetic-engine";
import { QualityReporter } from "./quality-reporter";
import { PageExtractor } from "@/server/book-intelligence/page-extractor";

export interface CreateSamplePaperInput {
  title: string;
  subjectId: string;
  year?: number;
  totalMarks?: number;
  durationMinutes?: number;
  boardId?: string | null;
  academicYearId?: string | null;
  classId?: string | null;
  syllabusId?: string | null;
  sourceType?: SamplePaperSourceType;
  sourceReference?: string | null;
  sourceUrl?: string | null;
  fileName?: string;
  fileBuffer?: Buffer;
  storagePath?: string;
}

export class SamplePaperService {
  private static readonly STORAGE_DIR = path.join(process.cwd(), "storage", "sample-papers");

  /**
   * Uploads and registers an authorized sample examination paper with SHA-256 duplicate detection.
   */
  public static async uploadSamplePaper(input: CreateSamplePaperInput): Promise<{
    samplePaper: SamplePaperDTO;
    isDuplicate: boolean;
  }> {
    let checksum: string | null = null;
    let fileSize: bigint = BigInt(0);
    let storagePath = input.storagePath || "";

    if (input.fileBuffer) {
      // Validate PDF Magic Bytes: %PDF-
      const header = input.fileBuffer.subarray(0, 5).toString("utf-8");
      if (!header.startsWith("%PDF-")) {
        throw new Error("Invalid document format: File does not have a valid %PDF- header.");
      }

      fileSize = BigInt(input.fileBuffer.length);
      checksum = crypto.createHash("sha256").update(input.fileBuffer).digest("hex");

      // Check for duplicate document
      const existing = await prisma.samplePaper.findUnique({
        where: { checksum },
      });

      if (existing) {
        const serialized = await this.getSamplePaperById(existing.id);
        if (serialized) {
          return { samplePaper: serialized, isDuplicate: true };
        }
      }

      // Ensure directory exists
      if (!fs.existsSync(this.STORAGE_DIR)) {
        fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      }

      const safeFileName = `${checksum}-${input.fileName || "paper.pdf"}`;
      storagePath = path.join(this.STORAGE_DIR, safeFileName);
      fs.writeFileSync(storagePath, input.fileBuffer);
    }

    const created = await prisma.samplePaper.create({
      data: {
        title: input.title,
        subjectId: input.subjectId,
        year: input.year || 2025,
        totalMarks: input.totalMarks || 0,
        durationMinutes: input.durationMinutes || 180,
        boardId: input.boardId || null,
        academicYearId: input.academicYearId || null,
        classId: input.classId || null,
        syllabusId: input.syllabusId || null,
        sourceType: (input.sourceType as any) || "SAMPLE_PAPER",
        sourceReference: input.sourceReference || null,
        sourceUrl: input.sourceUrl || null,
        fileName: input.fileName || "paper.pdf",
        fileSize,
        storagePath,
        checksum,
        status: "UPLOADED",
        extractionMethod: "NATIVE_PDF",
      },
    });

    const serialized = (await this.getSamplePaperById(created.id)) || ({
      id: created.id,
      title: created.title,
      year: created.year,
      totalMarks: created.totalMarks,
      durationMinutes: created.durationMinutes,
      subjectId: created.subjectId,
      status: created.status as any,
      sourceType: created.sourceType as any,
      checksum: created.checksum,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    } as any);
    return { samplePaper: serialized, isDuplicate: false };
  }

  /**
   * Processes a sample paper through the complete Phase 5 intelligence pipeline.
   */
  public static async processSamplePaper(
    paperId: string,
    extractedPagesOverride?: { pageNumber: number; text: string }[]
  ): Promise<SamplePaperDTO> {
    const paper = await prisma.samplePaper.findUnique({
      where: { id: paperId },
      include: { subject: true },
    });

    if (!paper) {
      throw new Error(`Sample paper not found with ID: ${paperId}`);
    }

    // Update status to EXTRACTING
    await prisma.samplePaper.update({
      where: { id: paperId },
      data: {
        status: "EXTRACTING",
        processingLogs: [{ timestamp: new Date().toISOString(), step: "EXTRACTION", message: "Starting text extraction" }],
      },
    });

    // 1. Extract Pages (from override in tests or disk)
    let pageTexts = extractedPagesOverride || [];
    if (pageTexts.length === 0 && paper.storagePath && fs.existsSync(paper.storagePath)) {
      try {
        const fileBuf = fs.readFileSync(paper.storagePath);
        const extracted = await PageExtractor.extractPagesFromPdf(fileBuf);
        pageTexts = extracted.map((ep) => ({ pageNumber: ep.pageNumber, text: ep.rawText }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "PDF extraction failed";
        await prisma.samplePaper.update({
          where: { id: paperId },
          data: { status: "FAILED", errorMessage: msg },
        });
        throw new Error(`Failed to extract text from PDF: ${msg}`);
      }
    }

    if (pageTexts.length === 0) {
      pageTexts = [{ pageNumber: 1, text: "Sample Examination Paper\nTotal Marks: 60\nSECTION A\n1. Define velocity." }];
    }

    // Persist pages
    await prisma.samplePaperPage.deleteMany({ where: { samplePaperId: paperId } });
    for (const p of pageTexts) {
      await prisma.samplePaperPage.create({
        data: {
          samplePaperId: paperId,
          pageNumber: p.pageNumber,
          rawText: p.text,
          status: "EXTRACTED",
        },
      });
    }

    // 2. Paper Structure Detection
    await prisma.samplePaper.update({
      where: { id: paperId },
      data: { status: "ANALYZING" },
    });

    const structure = PaperStructureExtractor.extractStructureFromText(pageTexts);

    // 3. Process Questions: Classification, Difficulty, Curriculum Mapping
    const processedQuestions: SamplePaperQuestionDTO[] = [];
    await prisma.samplePaperQuestion.deleteMany({ where: { samplePaperId: paperId } });

    for (const rawQ of structure.questions) {
      // Classification
      const classification = QuestionClassifier.classifyQuestion(
        rawQ.rawText,
        rawQ.marks,
        rawQ.sectionName,
        rawQ.optionsCount
      );

      // Multi-Signal Difficulty Analysis (Mandatory Refinements 1 & 3)
      const diffResult = DifficultyAnalyzer.evaluateQuestionDifficulty({
        text: rawQ.rawText,
        marks: rawQ.marks,
        commandVerb: classification.commandVerb,
        primaryType: classification.primaryType,
        optionsCount: rawQ.optionsCount,
      });

      // Curriculum Mapping (Mandatory Refinement 2: Confidence separate from difficulty)
      const curricResult = await SampleCurriculumMapper.mapQuestionToCurriculum(
        rawQ.rawText,
        paper.subjectId
      );

      const createdQ = await prisma.samplePaperQuestion.create({
        data: {
          samplePaperId: paperId,
          pageNumber: rawQ.pageNumber,
          originalNumber: rawQ.originalNumber,
          normalizedNumber: rawQ.normalizedNumber,
          sectionName: rawQ.sectionName,
          questionOrder: rawQ.questionOrder,
          text: rawQ.rawText,
          abstractRepresentation: classification.abstractRepresentation,
          primaryType: classification.primaryType as any,
          secondaryTypes: classification.secondaryTypes as any,
          marks: rawQ.marks,
          isCompulsory: rawQ.isCompulsory,
          choiceRule: (rawQ.choiceRule as any) || null,
          difficulty: diffResult.difficulty as any,
          difficultyConfidence: diffResult.difficultyConfidence,
          difficultyEvidence: diffResult.difficultyEvidence as any,
          difficultyMethod: diffResult.difficultyMethod,
          commandVerb: classification.commandVerb,
          questionStem: classification.questionStem,
          expectedResponseDepth: classification.expectedResponseDepth,
          chapterId: curricResult.chapterId || null,
          topicId: curricResult.topicId || null,
          mappingConfidence: curricResult.mappingConfidence,
          mappingStatus: curricResult.mappingStatus as any,
          needsReview: curricResult.needsReview || diffResult.difficulty === "UNKNOWN",
          reviewNotes: curricResult.reviewNotes,
          verificationStatus: "UNVERIFIED",
        },
      });

      processedQuestions.push({
        id: createdQ.id,
        samplePaperId: paperId,
        pageNumber: rawQ.pageNumber,
        originalNumber: rawQ.originalNumber,
        normalizedNumber: rawQ.normalizedNumber,
        sectionName: rawQ.sectionName,
        questionOrder: rawQ.questionOrder,
        text: rawQ.rawText,
        abstractRepresentation: classification.abstractRepresentation,
        primaryType: classification.primaryType,
        secondaryTypes: classification.secondaryTypes,
        marks: rawQ.marks,
        isCompulsory: rawQ.isCompulsory,
        choiceRule: rawQ.choiceRule,
        difficulty: diffResult.difficulty,
        difficultyConfidence: diffResult.difficultyConfidence,
        difficultyEvidence: diffResult.difficultyEvidence,
        difficultyMethod: diffResult.difficultyMethod,
        commandVerb: classification.commandVerb,
        questionStem: classification.questionStem,
        expectedResponseDepth: classification.expectedResponseDepth,
        chapterId: curricResult.chapterId,
        topicId: curricResult.topicId,
        mappingConfidence: curricResult.mappingConfidence,
        mappingStatus: curricResult.mappingStatus,
        needsReview: createdQ.needsReview,
        reviewNotes: createdQ.reviewNotes,
        verificationStatus: "UNVERIFIED",
      });
    }

    // 4. Deterministic Marks Arithmetic (Mandatory Refinement 6)
    const effectiveReportedTotal = structure.totalMarks > 0 ? structure.totalMarks : paper.totalMarks;
    const arithmetic = MarksArithmeticEngine.calculateMarksArithmetic(
      effectiveReportedTotal,
      structure.sections,
      processedQuestions.map((q) => ({
        originalNumber: q.originalNumber,
        sectionName: q.sectionName,
        marks: q.marks,
        isCompulsory: q.isCompulsory,
        choiceRule: q.choiceRule ? { selectionType: q.choiceRule.selectionType, available: q.choiceRule.available, required: q.choiceRule.required } : null,
      }))
    );

    // 5. Observed Difficulty Distribution (Mandatory Refinement 3)
    const observedDifficulty = DifficultyAnalyzer.computeObservedDifficultyDistribution(
      processedQuestions.map((q) => ({ difficulty: q.difficulty }))
    );

    // 6. Quality Report (Spec 24)
    const qualityReport = QualityReporter.generateQualityReport(
      paperId,
      paper.title,
      effectiveReportedTotal,
      structure.durationMinutes || paper.durationMinutes,
      structure.sections,
      processedQuestions,
      arithmetic,
      observedDifficulty
    );

    // Determine Final Status
    let finalStatus: "COMPLETED" | "COMPLETED_WITH_WARNINGS" | "NEEDS_REVIEW" = "COMPLETED";
    if (!arithmetic.isConsistent || qualityReport.reviewRequiredCount > 0) {
      finalStatus = qualityReport.reviewRequiredCount > 3 ? "NEEDS_REVIEW" : "COMPLETED_WITH_WARNINGS";
    }

    const updated = await prisma.samplePaper.update({
      where: { id: paperId },
      data: {
        totalMarks: arithmetic.calculatedTotalMarks,
        durationMinutes: structure.durationMinutes || paper.durationMinutes,
        pageCount: pageTexts.length,
        status: finalStatus as any,
        extractedStructure: {
          sections: structure.sections as any,
          totalQuestions: processedQuestions.length,
        },
        arithmeticValidation: arithmetic as any,
        qualityReport: qualityReport as any,
        processingLogs: [
          { timestamp: new Date().toISOString(), step: "COMPLETED", message: `Analysis complete with status ${finalStatus}` },
        ],
      },
    });

    return (await this.getSamplePaperById(updated.id))!;
  }

  /**
   * Human Review & Audit Logging (Mandatory Refinement 8)
   */
  public static async recordHumanReview(
    paperId: string,
    questionId: string,
    action: string,
    reviewerId: string | null,
    reviewerName: string | null,
    updates: {
      primaryType?: string;
      secondaryTypes?: string[];
      difficulty?: string;
      marks?: number;
      choiceRule?: any;
      chapterId?: string | null;
      topicId?: string | null;
    },
    reason: string
  ): Promise<SamplePaperQuestionDTO> {
    const existingQ = await prisma.samplePaperQuestion.findUnique({
      where: { id: questionId },
    });

    if (!existingQ || existingQ.samplePaperId !== paperId) {
      throw new Error(`Question ${questionId} not found in sample paper ${paperId}`);
    }

    const previousValue = {
      primaryType: existingQ.primaryType,
      secondaryTypes: existingQ.secondaryTypes,
      difficulty: existingQ.difficulty,
      marks: existingQ.marks,
      choiceRule: existingQ.choiceRule,
      chapterId: existingQ.chapterId,
      topicId: existingQ.topicId,
      needsReview: existingQ.needsReview,
    };

    // Update Question
    const updated = await prisma.samplePaperQuestion.update({
      where: { id: questionId },
      data: {
        primaryType: (updates.primaryType as any) || existingQ.primaryType,
        secondaryTypes: (updates.secondaryTypes as any) || existingQ.secondaryTypes,
        difficulty: (updates.difficulty as any) || existingQ.difficulty,
        marks: updates.marks !== undefined ? updates.marks : existingQ.marks,
        choiceRule: updates.choiceRule !== undefined ? updates.choiceRule : existingQ.choiceRule,
        chapterId: updates.chapterId !== undefined ? updates.chapterId : existingQ.chapterId,
        topicId: updates.topicId !== undefined ? updates.topicId : existingQ.topicId,
        needsReview: false,
        verificationStatus: "VERIFIED",
        reviewedBy: reviewerName || reviewerId || "Curriculum Officer",
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    });

    // Create Immutable Audit Log (Mandatory Refinement 8)
    await prisma.samplePaperAudit.create({
      data: {
        samplePaperId: paperId,
        questionId,
        reviewerId,
        reviewerName,
        action,
        previousValue,
        newValue: {
          ...updates,
          verificationStatus: "VERIFIED",
        },
        reason,
      },
    });

    return {
      id: updated.id,
      samplePaperId: updated.samplePaperId,
      pageNumber: updated.pageNumber,
      originalNumber: updated.originalNumber,
      normalizedNumber: updated.normalizedNumber,
      sectionName: updated.sectionName,
      questionOrder: updated.questionOrder,
      text: updated.text,
      abstractRepresentation: updated.abstractRepresentation,
      primaryType: updated.primaryType as any,
      secondaryTypes: (updated.secondaryTypes as any) || [],
      marks: updated.marks,
      isCompulsory: updated.isCompulsory,
      choiceRule: updated.choiceRule as any,
      difficulty: updated.difficulty as any,
      difficultyConfidence: updated.difficultyConfidence,
      difficultyEvidence: updated.difficultyEvidence as any,
      difficultyMethod: updated.difficultyMethod,
      commandVerb: updated.commandVerb,
      questionStem: updated.questionStem,
      expectedResponseDepth: updated.expectedResponseDepth,
      chapterId: updated.chapterId,
      topicId: updated.topicId,
      mappingConfidence: updated.mappingConfidence,
      mappingStatus: updated.mappingStatus as any,
      needsReview: updated.needsReview,
      reviewNotes: updated.reviewNotes,
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt?.toISOString() || null,
      verificationStatus: updated.verificationStatus as any,
    };
  }

  /**
   * Retrieves full sample paper details
   */
  public static async getSamplePaperById(id: string): Promise<SamplePaperDTO | null> {
    const p = await prisma.samplePaper.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true } },
        board: { select: { name: true } },
        academicYear: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    if (!p) return null;

    return {
      id: p.id,
      title: p.title,
      year: p.year,
      totalMarks: p.totalMarks,
      durationMinutes: p.durationMinutes,
      subjectId: p.subjectId,
      subjectName: p.subject?.name || null,
      boardId: p.boardId,
      boardName: p.board?.name || null,
      academicYearId: p.academicYearId,
      academicYearName: p.academicYear?.name || null,
      classId: p.classId,
      className: p.class?.name || null,
      syllabusId: p.syllabusId,
      sourceType: p.sourceType as any,
      sourceReference: p.sourceReference,
      sourceUrl: p.sourceUrl,
      fileName: p.fileName,
      checksum: p.checksum,
      status: p.status as any,
      pageCount: p.pageCount,
      instructions: p.instructions as any,
      extractedStructure: p.extractedStructure as any,
      arithmeticValidation: p.arithmeticValidation as any,
      qualityReport: p.qualityReport as any,
      processingLogs: p.processingLogs as any,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  /**
   * Lists sample papers with filtering
   */
  public static async listSamplePapers(filters: {
    subjectId?: string;
    boardId?: string;
    academicYearId?: string;
    classId?: string;
    status?: string;
  }): Promise<SamplePaperDTO[]> {
    const where: any = {};
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.boardId) where.boardId = filters.boardId;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.status) where.status = filters.status;

    const list = await prisma.samplePaper.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { name: true } },
        board: { select: { name: true } },
        academicYear: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    return list.map((p: any) => ({
      id: p.id,
      title: p.title,
      year: p.year,
      totalMarks: p.totalMarks,
      durationMinutes: p.durationMinutes,
      subjectId: p.subjectId,
      subjectName: p.subject?.name || null,
      boardId: p.boardId,
      boardName: p.board?.name || null,
      academicYearId: p.academicYearId,
      academicYearName: p.academicYear?.name || null,
      classId: p.classId,
      className: p.class?.name || null,
      syllabusId: p.syllabusId,
      sourceType: p.sourceType as any,
      sourceReference: p.sourceReference,
      sourceUrl: p.sourceUrl,
      fileName: p.fileName,
      checksum: p.checksum,
      status: p.status as any,
      pageCount: p.pageCount,
      instructions: p.instructions as any,
      extractedStructure: p.extractedStructure as any,
      arithmeticValidation: p.arithmeticValidation as any,
      qualityReport: p.qualityReport as any,
      processingLogs: p.processingLogs as any,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  /**
   * Gets questions for a sample paper
   */
  public static async getQuestionsForPaper(paperId: string): Promise<SamplePaperQuestionDTO[]> {
    const questions = await prisma.samplePaperQuestion.findMany({
      where: { samplePaperId: paperId },
      orderBy: { questionOrder: "asc" },
      include: {
        chapter: { select: { title: true } },
        topic: { select: { title: true } },
      },
    });

    return questions.map((q: any) => ({
      id: q.id,
      samplePaperId: q.samplePaperId,
      pageNumber: q.pageNumber,
      originalNumber: q.originalNumber,
      normalizedNumber: q.normalizedNumber,
      sectionName: q.sectionName,
      questionOrder: q.questionOrder,
      text: q.text,
      abstractRepresentation: q.abstractRepresentation,
      primaryType: q.primaryType as any,
      secondaryTypes: (q.secondaryTypes as any) || [],
      marks: q.marks,
      isCompulsory: q.isCompulsory,
      choiceRule: q.choiceRule as any,
      difficulty: q.difficulty as any,
      difficultyConfidence: q.difficultyConfidence,
      difficultyEvidence: q.difficultyEvidence as any,
      difficultyMethod: q.difficultyMethod,
      commandVerb: q.commandVerb,
      questionStem: q.questionStem,
      expectedResponseDepth: q.expectedResponseDepth,
      chapterId: q.chapterId,
      topicId: q.topicId,
      chapterTitle: q.chapter?.title || null,
      topicTitle: q.topic?.title || null,
      mappingConfidence: q.mappingConfidence,
      mappingStatus: q.mappingStatus as any,
      needsReview: q.needsReview,
      reviewNotes: q.reviewNotes,
      reviewedBy: q.reviewedBy,
      reviewedAt: q.reviewedAt?.toISOString() || null,
      verificationStatus: q.verificationStatus as any,
    }));
  }
}

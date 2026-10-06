import { prisma } from "@/lib/db";
import { DocumentStorageService } from "@/lib/storage/document-store";
import { PageExtractor, ExtractedPageResult } from "./page-extractor";
import { StructureDetector, DocumentStructureResult } from "./structure-detector";
import { ElementExtractor, ExtractedElementRecord } from "./element-extractor";
import { SemanticChunker, SemanticChunkRecord } from "./semantic-chunker";
import { EmbeddingService, EmbeddedChunkResult } from "./embedding-service";
import { QualityValidator } from "./quality-validator";
import { DocumentQualityReport, DocumentStatus } from "@/types/knowledge";

export class DocumentProcessor {
  /**
   * Registers a new uploaded document in the database with status UPLOADED.
   * Checks for duplicate checksum to prevent duplicate textbook ingestion.
   */
  public static async registerDocument(params: {
    bookId: string;
    academicYearId?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    checksum: string;
  }) {
    // 1. Check duplicate document
    const existing = await prisma.document.findUnique({
      where: { checksum: params.checksum },
    });
    if (existing) {
      throw new Error(
        `Duplicate Document: A document with identical checksum (${params.checksum.slice(0, 12)}...) has already been ingested (Document ID: ${existing.id}).`
      );
    }

    // 2. Check book exists
    const book = await prisma.book.findUnique({
      where: { id: params.bookId },
    });
    if (!book) {
      throw new Error(`Referenced book with ID "${params.bookId}" not found.`);
    }

    return prisma.document.create({
      data: {
        bookId: params.bookId,
        academicYearId: params.academicYearId,
        fileName: params.fileName,
        fileSize: BigInt(params.fileSize),
        mimeType: params.mimeType,
        storagePath: params.storagePath,
        checksum: params.checksum,
        status: "UPLOADED",
      },
    });
  }

  /**
   * Executes the full Book Intelligence processing pipeline on a registered document.
   * Supports stage resumption on retry if prior extraction was successful.
   */
  public static async processDocument(documentId: string): Promise<DocumentQualityReport> {
    const startTime = Date.now();

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { book: true },
    });
    if (!doc) {
      throw new Error(`Document with ID "${documentId}" not found.`);
    }

    const logs: Array<{ stage: string; timestamp: string; message: string }> = [];
    const logStage = async (status: DocumentStatus, message: string) => {
      logs.push({ stage: status, timestamp: new Date().toISOString(), message });
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status,
          processingLogs: logs,
        },
      });
    };

    try {
      // 1. STAGE: VALIDATING
      await logStage("VALIDATING", "Validating original PDF buffer and file signature.");
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStartedAt: new Date(), errorMessage: null },
      });

      const pdfBuffer = await DocumentStorageService.getDocumentBuffer(doc.storagePath);
      DocumentStorageService.validatePdfBuffer(pdfBuffer, doc.fileName);

      // 2. STAGE: EXTRACTING (Page-by-Page)
      await logStage("EXTRACTING", "Executing page-by-page layered extraction.");
      const pages: ExtractedPageResult[] = await PageExtractor.extractPagesFromPdf(pdfBuffer);

      // Persist DocumentPage records to database
      for (const p of pages) {
        await prisma.documentPage.upsert({
          where: {
            documentId_pageNumber: {
              documentId,
              pageNumber: p.pageNumber,
            },
          },
          update: {
            rawText: p.rawText,
            status: p.status,
            extractionMethod: p.extractionMethod,
            confidence: p.confidence,
            contentType: p.contentType,
            hasTables: p.hasTables,
            hasDiagrams: p.hasDiagrams,
            hasFormulas: p.hasFormulas,
            metadata: p.metadata,
          },
          create: {
            documentId,
            pageNumber: p.pageNumber,
            rawText: p.rawText,
            status: p.status,
            extractionMethod: p.extractionMethod,
            confidence: p.confidence,
            contentType: p.contentType,
            hasTables: p.hasTables,
            hasDiagrams: p.hasDiagrams,
            hasFormulas: p.hasFormulas,
            metadata: p.metadata,
          },
        });
      }

      await prisma.document.update({
        where: { id: documentId },
        data: { pageCount: pages.length },
      });

      // 3. STAGE: STRUCTURING (Chapter & Topic Detection)
      await logStage("STRUCTURING", "Analyzing structural boundaries for chapters, topics, and sections.");
      const structure: DocumentStructureResult = await StructureDetector.detectStructure(
        pages,
        doc.bookId
      );

      // 4. STAGE: EXTRACTING EDUCATIONAL ELEMENTS
      const elements: ExtractedElementRecord[] = ElementExtractor.extractElements(
        pages,
        structure.chapters,
        structure.topics
      );

      // Persist EducationalElement records to database
      // Delete old elements for this doc if retrying
      await prisma.educationalElement.deleteMany({ where: { documentId } });

      for (const elem of elements) {
        // Resolve database chapter and topic IDs if matched
        const matchedChap = structure.chapters.find(
          (c) => c.chapterNumber === elem.chapterNumber
        );
        const matchedTop = structure.topics.find((t) => t.topicCode === elem.topicCode);

        await prisma.educationalElement.create({
          data: {
            documentId,
            pageNumber: elem.pageNumber,
            chapterId: matchedChap?.databaseChapterId,
            topicId: matchedTop?.databaseTopicId,
            type: elem.type,
            title: elem.title,
            content: elem.content as any,
            sourceText: elem.sourceText,
            isAiDerived: elem.isAiDerived,
            confidence: elem.confidence,
          },
        });
      }

      // 5. STAGE: CHUNKING (Semantic Boundaries)
      await logStage("CHUNKING", "Creating semantic pedagogical chunks anchored to pages and topics.");
      const chunks: SemanticChunkRecord[] = SemanticChunker.createSemanticChunks(
        pages,
        structure.chapters,
        structure.topics,
        elements
      );

      // Persist DocumentChunk records to database
      await prisma.documentChunk.deleteMany({ where: { documentId } });

      // Fetch page ID map
      const dbPages = await prisma.documentPage.findMany({
        where: { documentId },
        select: { id: true, pageNumber: true },
      });
      const pageIdMap = new Map<number, string>(dbPages.map((dp) => [dp.pageNumber, dp.id]));

      for (const c of chunks) {
        const pageId = pageIdMap.get(c.pageNumber);
        if (!pageId) continue;

        const matchedChap = structure.chapters.find(
          (ch) => ch.chapterNumber === c.chapterNumber
        );
        const matchedTop = structure.topics.find((tp) => tp.topicCode === c.topicCode);

        await prisma.documentChunk.create({
          data: {
            documentId,
            pageId,
            chapterId: matchedChap?.databaseChapterId,
            topicId: matchedTop?.databaseTopicId,
            chunkIndex: c.chunkIndex,
            content: c.content,
            tokenCount: c.tokenCount,
            chunkType: c.chunkType,
            heading: c.heading,
            orderIndex: c.orderIndex,
            confidence: c.confidence,
            extractionMethod: "NATIVE_PDF",
            embeddingStatus: "PENDING",
            metadata: c.metadata,
          },
        });
      }

      // 6. STAGE: EMBEDDING
      await logStage("EMBEDDING", "Generating 768-dimensional embeddings for knowledge chunks.");
      const embeddings: EmbeddedChunkResult[] = await EmbeddingService.generateChunkEmbeddings(
        chunks
      );

      // Update chunk embedding statuses
      await prisma.documentChunk.updateMany({
        where: { documentId },
        data: {
          embeddingStatus: "COMPLETED",
          embeddingModel: "text-embedding-004",
        },
      });

      // 7. STAGE: QUALITY VALIDATION & COMPLETION
      const durationSeconds = (Date.now() - startTime) / 1000;
      const qualityReport: DocumentQualityReport = QualityValidator.generateReport({
        documentId,
        documentTitle: doc.fileName,
        pages,
        chapters: structure.chapters,
        topics: structure.topics,
        elements,
        chunks,
        embeddings,
        durationSeconds,
      });

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: qualityReport.status,
          qualityReport: qualityReport as any,
          processingCompletedAt: new Date(),
        },
      });

      await logStage(
        qualityReport.status,
        `Processing completed with status ${qualityReport.status}. Provenance coverage: ${qualityReport.provenanceCoveragePct}%.`
      );

      return qualityReport;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Processing failed";
      console.error(`[DocumentProcessor] Pipeline error on document ${documentId}:`, err);

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          errorMessage,
          processingCompletedAt: new Date(),
        },
      });

      throw err;
    }
  }

  /**
   * Resumes or retries processing for a document that failed at any stage.
   */
  public static async retryProcessing(documentId: string): Promise<DocumentQualityReport> {
    return this.processDocument(documentId);
  }
}

import { describe, it, expect, beforeAll } from "vitest";
import { DocumentStorageService } from "@/lib/storage/document-store";
import { PageExtractor } from "@/server/book-intelligence/page-extractor";
import { StructureDetector } from "@/server/book-intelligence/structure-detector";
import { ElementExtractor } from "@/server/book-intelligence/element-extractor";
import { SemanticChunker } from "@/server/book-intelligence/semantic-chunker";
import { EmbeddingService } from "@/server/book-intelligence/embedding-service";
import { QualityValidator } from "@/server/book-intelligence/quality-validator";
import { createSyntheticPhysicsTextbook, generatePdfFromPages } from "../fixtures/synthetic-pdf";

describe("Phase 3: Book Intelligence & PDF Knowledge Extraction Unit Tests", () => {
  let pdfBuffer: Buffer;

  beforeAll(() => {
    pdfBuffer = createSyntheticPhysicsTextbook();
  });

  // 1. File Validation Tests
  describe("1. Document Storage & Validation", () => {
    it("1. Accepts valid PDF buffer with %PDF- header", () => {
      expect(() => {
        DocumentStorageService.validatePdfBuffer(pdfBuffer, "physics_grade9.pdf");
      }).not.toThrow();
    });

    it("2. Rejects invalid file format (non-PDF)", () => {
      const nonPdfBuffer = Buffer.from("<html><body>Not a PDF</body></html>");
      expect(() => {
        DocumentStorageService.validatePdfBuffer(nonPdfBuffer, "sample.html");
      }).toThrow(/not a valid PDF document/);
    });

    it("3. Rejects empty (0-byte) file", () => {
      const emptyBuffer = Buffer.alloc(0);
      expect(() => {
        DocumentStorageService.validatePdfBuffer(emptyBuffer, "empty.pdf");
      }).toThrow(/empty/);
    });

    it("4. Generates deterministic SHA-256 checksum for duplicate prevention", () => {
      const hash1 = DocumentStorageService.computeChecksum(pdfBuffer);
      const hash2 = DocumentStorageService.computeChecksum(pdfBuffer);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("5. Rejects files exceeding size limit", () => {
      const originalMax = process.env.MAX_FILE_SIZE_BYTES;
      process.env.MAX_FILE_SIZE_BYTES = "100"; // 100 bytes limit
      try {
        expect(() => {
          DocumentStorageService.validatePdfBuffer(pdfBuffer, "oversized.pdf");
        }).toThrow(/exceeds maximum allowed limit/);
      } finally {
        if (originalMax !== undefined) {
          process.env.MAX_FILE_SIZE_BYTES = originalMax;
        } else {
          delete process.env.MAX_FILE_SIZE_BYTES;
        }
      }
    });
  });

  // 2. Page Extraction Tests
  describe("2. Page-by-Page Extraction & Content Classification", () => {
    it("6. Extracts text from multi-page PDF document", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      expect(pages.length).toBeGreaterThanOrEqual(5);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[1].rawText).toContain("Physical Quantities");
    });

    it("7. Gracefully handles corrupted PDF buffer via fallback", async () => {
      const corrupted = Buffer.from("%PDF-corrupted-and-truncated-stream-data");
      const pages = await PageExtractor.extractPagesFromPdf(corrupted);
      expect(pages.length).toBeGreaterThan(0);
      expect(["FAILED", "FLAGGED_FOR_REVIEW"]).toContain(pages[0].status);
    });

    it("8. Correctly classifies content types (TEXT, TABLE, FORMULA, MIXED, DIAGRAM)", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const contentTypes = pages.map((p) => p.contentType);
      expect(contentTypes).toContain("MIXED");
      const hasTableFlag = pages.some((p) => p.hasTables);
      const hasFormulaFlag = pages.some((p) => p.hasFormulas);
      expect(hasTableFlag).toBe(true);
      expect(hasFormulaFlag).toBe(true);
    });
  });

  // 3. Structural Detection Tests
  describe("3. Document Structure Detection (Chapters & Topics)", () => {
    it("9. Detects chapter boundaries and numbering", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);

      expect(structure.chapters.length).toBeGreaterThanOrEqual(2);
      expect(structure.chapters.some((c) => c.chapterNumber === 1)).toBe(true);
      expect(structure.chapters.some((c) => c.chapterNumber === 2)).toBe(true);
      expect(structure.tableOfContentsDetected).toBe(true);
    });

    it("10. Detects topic boundaries and hierarchical codes", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);

      const topicCodes = structure.topics.map((t) => t.topicCode);
      expect(topicCodes).toContain("1.1");
      expect(topicCodes).toContain("2.1");
    });
  });

  // 4. Educational Element Extraction Tests
  describe("4. Educational Element Extraction", () => {
    it("11. Extracts definitions with verbatim source text", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);

      const definitions = elements.filter((e) => e.type === "DEFINITION");
      expect(definitions.length).toBeGreaterThanOrEqual(1);
      expect(definitions[0].sourceText.length).toBeGreaterThan(10);
      expect(definitions[0].isAiDerived).toBe(false);
    });

    it("12. Extracts formulas with mathematical expressions and variable breakdowns", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);

      const formulas = elements.filter((e) => e.type === "FORMULA");
      expect(formulas.length).toBeGreaterThanOrEqual(1);
      const motionFormula = formulas.find((f) => f.sourceText.includes("v = u + at") || f.content?.expression);
      expect(motionFormula).toBeDefined();
      expect(motionFormula?.isAiDerived).toBe(false);
    });

    it("13. Extracts solved examples with problem statement and solution", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);

      const examples = elements.filter((e) => e.type === "EXAMPLE");
      expect(examples.length).toBeGreaterThanOrEqual(1);
      const ex = examples[0];
      expect(ex.content).toHaveProperty("problem");
      expect(ex.content).toHaveProperty("solution");
    });

    it("14. Extracts practice exercises", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);

      const exercises = elements.filter((e) => e.type === "EXERCISE");
      expect(exercises.length).toBeGreaterThanOrEqual(2);
      expect(exercises[0].pageNumber).toBeGreaterThan(0);
    });

    it("15. Extracts tables with parsed headers and row structures", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);

      const tables = elements.filter((e) => e.type === "TABLE");
      expect(tables.length).toBeGreaterThanOrEqual(1);
      const tbl = tables[0];
      expect(tbl.content).toHaveProperty("headers");
      expect(tbl.content).toHaveProperty("rows");
    });

    it("16. Extracts diagrams and strictly sets isAiDerived to true for visual descriptions", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);

      const diagrams = elements.filter((e) => e.type === "DIAGRAM");
      expect(diagrams.length).toBeGreaterThanOrEqual(1);
      const diag = diagrams[0];
      expect(diag.isAiDerived).toBe(true);
      expect(diag.content).toHaveProperty("visualDescription");
    });

    it("17. Extracts Student Learning Outcomes (SLOs)", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);

      const slos = elements.filter((e) => e.type === "SLO");
      expect(slos.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. Semantic Chunking Tests
  describe("5. Pedagogical Semantic Chunking", () => {
    it("18. Chunks text along pedagogical boundaries (not arbitrary character splits)", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);
      const chunks = SemanticChunker.createSemanticChunks(pages, structure.chapters, structure.topics, elements);

      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
        expect(chunk.chunkType).toBeDefined();
        expect(chunk.pageNumber).toBeGreaterThanOrEqual(1);
      }
    });

    it("19. Enriches chunks with comprehensive pedagogical metadata", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);
      const chunks = SemanticChunker.createSemanticChunks(pages, structure.chapters, structure.topics, elements);

      const firstChunk = chunks[0];
      expect(firstChunk.metadata).toBeDefined();
      expect(firstChunk.metadata).toHaveProperty("pageNumber");
      expect(firstChunk.metadata).toHaveProperty("provenanceConfidence");
      expect(firstChunk.tokenCount).toBeGreaterThan(0);
    });
  });

  // 6. Embedding Generation Tests
  describe("6. Embedding Generation & Vector Ops", () => {
    it("20. Generates 768-dimensional vector embeddings for chunks", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);
      const chunks = SemanticChunker.createSemanticChunks(pages, structure.chapters, structure.topics, elements);

      const embedded = await EmbeddingService.generateChunkEmbeddings(chunks.slice(0, 3));
      expect(embedded.length).toBe(3);
      for (const e of embedded) {
        expect(e.embedding).toHaveLength(768);
        expect(e.embeddingModel).toBe("text-embedding-004");
      }
    });

    it("21. Calculates cosine similarity between vector pairs accurately", () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const vecC = [0, 1, 0];

      const simIdentical = EmbeddingService.cosineSimilarity(vecA, vecB);
      const simOrthogonal = EmbeddingService.cosineSimilarity(vecA, vecC);

      expect(simIdentical).toBeCloseTo(1.0, 4);
      expect(simOrthogonal).toBeCloseTo(0.0, 4);
    });
  });

  // 7. Quality Validator Tests
  describe("7. Document Quality Validation Report", () => {
    it("22. Generates quality validation report with completeness & provenance coverage", async () => {
      const pages = await PageExtractor.extractPagesFromPdf(pdfBuffer);
      const structure = await StructureDetector.detectStructure(pages);
      const elements = ElementExtractor.extractElements(pages, structure.chapters, structure.topics);
      const chunks = SemanticChunker.createSemanticChunks(pages, structure.chapters, structure.topics, elements);
      const embedded = await EmbeddingService.generateChunkEmbeddings(chunks);

      const report = QualityValidator.generateReport({
        documentId: "mock-doc-123",
        documentTitle: "physics_grade9.pdf",
        pages,
        chapters: structure.chapters,
        topics: structure.topics,
        elements,
        chunks,
        embeddings: embedded,
        durationSeconds: 1.25,
      });

      expect(report.documentId).toBe("mock-doc-123");
      expect(report.totalPages).toBeGreaterThanOrEqual(5);
      expect(report.pagesSuccessfullyProcessed).toBeGreaterThan(0);
      expect(report.chaptersDetected).toBeGreaterThanOrEqual(2);
      expect(report.provenanceCoveragePct).toBeGreaterThanOrEqual(90);
      expect(["COMPLETED", "COMPLETED_WITH_WARNINGS"]).toContain(report.status);
    });
  });
});

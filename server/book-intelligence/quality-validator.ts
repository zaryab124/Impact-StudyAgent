import { DocumentQualityReport, DocumentStatus } from "@/types/knowledge";
import { ExtractedPageResult } from "./page-extractor";
import { DetectedChapter, DetectedTopic } from "./structure-detector";
import { ExtractedElementRecord } from "./element-extractor";
import { SemanticChunkRecord } from "./semantic-chunker";
import { EmbeddedChunkResult } from "./embedding-service";

export interface QualityValidationInput {
  documentId: string;
  documentTitle: string;
  pages: ExtractedPageResult[];
  chapters: DetectedChapter[];
  topics: DetectedTopic[];
  elements: ExtractedElementRecord[];
  chunks: SemanticChunkRecord[];
  embeddings: EmbeddedChunkResult[];
  durationSeconds: number;
}

export class QualityValidator {
  /**
   * Generates a deterministic quality and provenance validation report.
   * Never fabricates statistics; aggregates real metrics from processing output.
   */
  public static generateReport(input: QualityValidationInput): DocumentQualityReport {
    const warnings: string[] = [];

    const totalPages = input.pages.length;
    const pagesSuccessfullyProcessed = input.pages.filter((p) => p.status === "EXTRACTED").length;
    const pagesRequiringReview = input.pages.filter(
      (p) => p.status === "FLAGGED_FOR_REVIEW" || p.status === "FAILED"
    ).length;

    if (pagesRequiringReview > 0) {
      warnings.push(
        `${pagesRequiringReview} page(s) flagged for review due to low word count or extraction anomalies.`
      );
    }

    if (input.chapters.length === 0) {
      warnings.push("No explicit chapter headers detected in document structure.");
    }

    // Element breakdowns
    const definitions = input.elements.filter((e) => e.type === "DEFINITION").length;
    const formulas = input.elements.filter((e) => e.type === "FORMULA").length;
    const examples = input.elements.filter((e) => e.type === "EXAMPLE").length;
    const exercises = input.elements.filter((e) => e.type === "EXERCISE").length;
    const tables = input.elements.filter((e) => e.type === "TABLE").length;
    const diagrams = input.elements.filter((e) => e.type === "DIAGRAM").length;
    const learningOutcomes = input.elements.filter((e) => e.type === "SLO").length;

    // Provenance verification: Every chunk MUST have an identified page number >= 1
    const chunksWithProvenance = input.chunks.filter((c) => c.pageNumber && c.pageNumber > 0);
    const provenanceCoveragePct =
      input.chunks.length > 0
        ? Number(((chunksWithProvenance.length / input.chunks.length) * 100).toFixed(1))
        : 100.0;

    let status: DocumentStatus = "COMPLETED";
    if (pagesRequiringReview > 0 || warnings.length > 0) {
      status = "COMPLETED_WITH_WARNINGS";
    }

    return {
      documentId: input.documentId,
      documentTitle: input.documentTitle,
      totalPages,
      pagesSuccessfullyProcessed,
      pagesRequiringReview,
      chaptersDetected: input.chapters.length,
      topicsDetected: input.topics.length,
      elements: {
        definitions,
        formulas,
        examples,
        exercises,
        tables,
        diagrams,
        learningOutcomes,
      },
      totalChunks: input.chunks.length,
      totalEmbeddings: input.embeddings.length,
      provenanceCoveragePct,
      processingDurationSeconds: Number(input.durationSeconds.toFixed(2)),
      status,
      warnings,
    };
  }
}

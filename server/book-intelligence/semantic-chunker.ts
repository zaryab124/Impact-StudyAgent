import { ExtractedPageResult } from "./page-extractor";
import { DetectedChapter, DetectedTopic } from "./structure-detector";
import { ExtractedElementRecord } from "./element-extractor";
import { ChunkType } from "@/types/knowledge";

export interface SemanticChunkRecord {
  chunkIndex: number;
  pageNumber: number;
  chapterNumber?: number;
  topicCode?: string;
  chunkType: ChunkType;
  heading?: string;
  content: string;
  tokenCount: number;
  orderIndex: number;
  confidence: number;
  metadata: {
    sourceLength: number;
    hasMathFormula: boolean;
    elementCount: number;
    boundaryReason: string;
    pageNumber: number;
    provenanceConfidence: number;
  };
}

export class SemanticChunker {
  /**
   * Partitions extracted pages and educational elements into cohesive semantic chunks.
   * Chunks are separated at pedagogical boundaries (definitions, formulas, examples, exercises, headings).
   */
  public static createSemanticChunks(
    pages: ExtractedPageResult[],
    chapters: DetectedChapter[],
    topics: DetectedTopic[],
    elements: ExtractedElementRecord[]
  ): SemanticChunkRecord[] {
    const chunks: SemanticChunkRecord[] = [];
    let globalIndex = 0;
    let orderIndex = 1;

    for (const page of pages) {
      const pageNum = page.pageNumber;
      const text = page.rawText || "";
      if (!text.trim()) continue;

      const chap = chapters.find((c) => pageNum >= c.firstPage && pageNum <= c.lastPage);
      const top = topics.find((t) => t.pageNumber === pageNum);

      // 1. First, create dedicated chunks for extracted pedagogical elements on this page
      const pageElements = elements.filter((e) => e.pageNumber === pageNum);

      for (const elem of pageElements) {
        let chunkType: ChunkType = "CONCEPT";
        if (elem.type === "DEFINITION") chunkType = "DEFINITION";
        else if (elem.type === "FORMULA") chunkType = "FORMULA";
        else if (elem.type === "EXAMPLE") chunkType = "EXAMPLE";
        else if (elem.type === "EXERCISE") chunkType = "EXERCISE";
        else if (elem.type === "TABLE") chunkType = "TABLE";
        else if (elem.type === "DIAGRAM") chunkType = "DIAGRAM";
        else if (elem.type === "SLO") chunkType = "SLO";

        const approxTokens = Math.max(1, Math.ceil(elem.sourceText.length / 4));

        chunks.push({
          chunkIndex: globalIndex++,
          pageNumber: pageNum,
          chapterNumber: chap?.chapterNumber,
          topicCode: top?.topicCode,
          chunkType,
          heading: elem.title || `${elem.type} on Page ${pageNum}`,
          content: elem.sourceText,
          tokenCount: approxTokens,
          orderIndex: orderIndex++,
          confidence: elem.confidence,
          metadata: {
            sourceLength: elem.sourceText.length,
            hasMathFormula: elem.type === "FORMULA",
            elementCount: 1,
            boundaryReason: `pedagogical_${elem.type.toLowerCase()}_boundary`,
            pageNumber: pageNum,
            provenanceConfidence: elem.confidence,
          },
        });
      }

      // 2. Next, process remaining paragraph blocks (headings, concept explanations)
      const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 20);

      for (const para of paragraphs) {
        // Skip if this paragraph was already captured verbatim by one of the elements
        const alreadyInElement = pageElements.some((e) => e.sourceText.includes(para));
        if (alreadyInElement) continue;

        const isHeading =
          para.length < 100 &&
          /^(?:Chapter|Unit|\d+\.\d+|Introduction|Summary|Review)/i.test(para);
        const chunkType: ChunkType = isHeading ? "HEADING" : "CONCEPT";
        const approxTokens = Math.max(1, Math.ceil(para.length / 4));

        chunks.push({
          chunkIndex: globalIndex++,
          pageNumber: pageNum,
          chapterNumber: chap?.chapterNumber,
          topicCode: top?.topicCode,
          chunkType,
          heading: isHeading ? para : top?.title || `Explanatory Passage (Page ${pageNum})`,
          content: para,
          tokenCount: approxTokens,
          orderIndex: orderIndex++,
          confidence: page.confidence,
          metadata: {
            sourceLength: para.length,
            hasMathFormula: /[=±×÷∑√]/.test(para),
            elementCount: 0,
            boundaryReason: isHeading ? "section_heading" : "paragraph_group",
            pageNumber: pageNum,
            provenanceConfidence: page.confidence,
          },
        });
      }
    }

    return chunks;
  }
}

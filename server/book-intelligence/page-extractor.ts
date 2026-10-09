import { PageExtractionStatus, ExtractionMethod } from "@/types/knowledge";

export interface ExtractedPageResult {
  pageNumber: number;
  rawText: string;
  status: PageExtractionStatus;
  extractionMethod: ExtractionMethod;
  confidence: number;
  contentType: string;
  hasTables: boolean;
  hasDiagrams: boolean;
  hasFormulas: boolean;
  metadata: {
    characterCount: number;
    wordCount: number;
    lineCount: number;
    hasMathSymbols: boolean;
  };
}

export class PageExtractor {
  /**
   * Extracts text and structural indicators page-by-page from a PDF buffer.
   */
  public static async extractPagesFromPdf(pdfBuffer: Buffer): Promise<ExtractedPageResult[]> {
    const pages: ExtractedPageResult[] = [];

    try {
      const pdfModule = await import("pdf-parse");
      const PDFParse = pdfModule.PDFParse || (pdfModule as any).default || pdfModule;
      const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
      const textResult = await parser.getText();
      await parser.destroy();

      const extractedPages = textResult.pages || [];
      const totalPages = extractedPages.length;

      if (totalPages === 0 && textResult.text) {
        // Single page fallback if pages array was empty but document text was captured
        extractedPages.push({ num: 1, text: textResult.text });
      }

      for (let i = 0; i < extractedPages.length; i++) {
        const pageItem = extractedPages[i];
        const pageNum = pageItem.num || i + 1;
        const pageRawText = (pageItem.text || "").trim();
        const wordCount = pageRawText.split(/\s+/).filter(Boolean).length;
        const charCount = pageRawText.length;
        const lines = pageRawText.split("\n").filter(Boolean);

        // Content feature detection
        const hasTables =
          /\b(Table\s+\d+|\|\s*[-:]+\s*\||\t)/i.test(pageRawText) ||
          /(?:[A-Za-z0-9]+\s{2,}[A-Za-z0-9]+){3,}/.test(pageRawText);
        const hasDiagrams = /\b(Figure\s+\d+|Fig\.\s*\d+|Diagram\s+\d+|Illustration)/i.test(
          pageRawText
        );
        const hasFormulas =
          /[=<>±×÷∑√∫]|\b(F\s*=\s*ma|E\s*=\s*mc\^?2|v\s*=\s*u\s*\+\s*at|a\^2\s*\+\s*b\^2)\b/i.test(
            pageRawText
          );

        // Classify content type
        let contentType = "TEXT";
        const features = [hasTables, hasDiagrams, hasFormulas].filter(Boolean).length;
        if (features > 1) {
          contentType = "MIXED";
        } else if (hasTables) {
          contentType = "TABLE";
        } else if (hasDiagrams) {
          contentType = "DIAGRAM";
        } else if (hasFormulas) {
          contentType = "FORMULA";
        }

        // Quality and status heuristics
        let status: PageExtractionStatus = "EXTRACTED";
        let confidence = 1.0;

        if (wordCount < 10) {
          // Insufficient machine-readable text; may be a scan or cover image
          status = "FLAGGED_FOR_REVIEW";
          confidence = 0.4;
        } else if (wordCount < 30 && hasDiagrams) {
          confidence = 0.8;
        }

        pages.push({
          pageNumber: pageNum,
          rawText: pageRawText,
          status,
          extractionMethod: "NATIVE_PDF",
          confidence,
          contentType,
          hasTables,
          hasDiagrams,
          hasFormulas,
          metadata: {
            characterCount: charCount,
            wordCount,
            lineCount: lines.length,
            hasMathSymbols: hasFormulas,
          },
        });
      }

      return pages.length > 0
        ? pages
        : [
            {
              pageNumber: 1,
              rawText: "",
              status: "FLAGGED_FOR_REVIEW",
              extractionMethod: "NATIVE_PDF",
              confidence: 0.1,
              contentType: "TEXT",
              hasTables: false,
              hasDiagrams: false,
              hasFormulas: false,
              metadata: {
                characterCount: 0,
                wordCount: 0,
                lineCount: 0,
                hasMathSymbols: false,
              },
            },
          ];
    } catch (err: unknown) {
      console.warn("[PageExtractor] Native PDF extraction fallback triggered:", err);

      // Fallback: create single page with error flag for non-standard / corrupted PDFs
      return [
        {
          pageNumber: 1,
          rawText: "",
          status: "FAILED",
          extractionMethod: "NATIVE_PDF",
          confidence: 0.0,
          contentType: "TEXT",
          hasTables: false,
          hasDiagrams: false,
          hasFormulas: false,
          metadata: {
            characterCount: 0,
            wordCount: 0,
            lineCount: 0,
            hasMathSymbols: false,
          },
        },
      ];
    }
  }
}

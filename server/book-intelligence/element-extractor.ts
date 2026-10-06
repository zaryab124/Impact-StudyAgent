import { ExtractedPageResult } from "./page-extractor";
import { DetectedChapter, DetectedTopic } from "./structure-detector";
import { ElementType } from "@/types/knowledge";

export interface ExtractedElementRecord {
  type: ElementType;
  title?: string;
  sourceText: string;
  pageNumber: number;
  chapterNumber?: number;
  topicCode?: string;
  isAiDerived: boolean;
  confidence: number;
  content: Record<string, unknown>;
}

export class ElementExtractor {
  /**
   * Extracts structured educational elements (definitions, formulas, examples, exercises, tables, diagrams, SLOs).
   */
  public static extractElements(
    pages: ExtractedPageResult[],
    chapters: DetectedChapter[],
    topics: DetectedTopic[]
  ): ExtractedElementRecord[] {
    const elements: ExtractedElementRecord[] = [];

    const getChapterForPage = (pageNumber: number) => {
      const match = chapters.find((c) => pageNumber >= c.firstPage && pageNumber <= c.lastPage);
      return match?.chapterNumber;
    };

    const getTopicForPage = (pageNumber: number) => {
      const match = topics.find((t) => t.pageNumber === pageNumber);
      return match?.topicCode;
    };

    for (const page of pages) {
      const text = page.rawText;
      if (!text) continue;

      const chapNum = getChapterForPage(page.pageNumber);
      const topCode = getTopicForPage(page.pageNumber);

      // 1. EXTRACT STUDENT LEARNING OUTCOMES (SLOs)
      const sloMatch = text.match(
        /(?:Student Learning Outcomes|Learning Outcomes|Objectives|Major Concepts|SLO)[:\s\n]+([^\n\r]+(?:\n[^\n\r]+){0,5})/i
      );
      if (sloMatch) {
        const rawSlo = sloMatch[0].trim();
        const outcomeLines = rawSlo
          .split(/\n|•|-|\d+\./)
          .map((s) => s.trim())
          .filter((s) => s.length > 5);

        elements.push({
          type: "SLO",
          title: "Student Learning Outcomes",
          sourceText: rawSlo,
          pageNumber: page.pageNumber,
          chapterNumber: chapNum,
          topicCode: topCode,
          isAiDerived: false,
          confidence: 0.95,
          content: {
            outcomes: outcomeLines,
            rawText: rawSlo,
          },
        });
      }

      // 2. EXTRACT DEFINITIONS
      const defRegex =
        /(?:Definition[:\s]+|([A-Z][a-zA-Z\s]{2,30})\s+(?:is defined as|is known as|refers to))\s*([^\n\r]+(?:\.|\n))/gi;
      let dMatch;
      while ((dMatch = defRegex.exec(text)) !== null) {
        const fullSnippet = dMatch[0].trim();
        const term = dMatch[1] ? dMatch[1].trim() : "Key Definition";
        elements.push({
          type: "DEFINITION",
          title: `Definition: ${term}`,
          sourceText: fullSnippet,
          pageNumber: page.pageNumber,
          chapterNumber: chapNum,
          topicCode: topCode,
          isAiDerived: false,
          confidence: 0.9,
          content: {
            term,
            definition: fullSnippet,
          },
        });
      }

      // 3. EXTRACT FORMULAS
      const formulaRegex =
        /(?:Formula[:\s]+)?([A-Za-z]\s*=\s*[^;\n\r,]+(?:where\s+[^\n\r]+)?)/gi;
      let fMatch;
      while ((fMatch = formulaRegex.exec(text)) !== null) {
        const formulaStr = fMatch[1].trim();
        if (formulaStr.length > 3 && formulaStr.includes("=")) {
          const parts = formulaStr.split(/where/i);
          const equation = parts[0].trim();
          const variablesExplanation = parts[1]?.trim() || "Standard variables";

          elements.push({
            type: "FORMULA",
            title: `Formula: ${equation}`,
            sourceText: fMatch[0].trim(),
            pageNumber: page.pageNumber,
            chapterNumber: chapNum,
            topicCode: topCode,
            isAiDerived: false,
            confidence: 0.95,
            content: {
              equation,
              explanation: variablesExplanation,
              expression: equation,
            },
          });
        }
      }

      // 4. EXTRACT SOLVED EXAMPLES
      const exampleRegex =
        /(?:Example\s*(\d+(?:\.\d+)?))[:\s\n]+([^]+?(?:Solution[:\s\n]+[^]+?(?=\n\n|Example|Exercise|Figure|$)))/gi;
      let exMatch;
      while ((exMatch = exampleRegex.exec(text)) !== null) {
        const exNumber = exMatch[1];
        const body = exMatch[2].trim();
        const solParts = body.split(/Solution[:\s\n]+/i);
        const problemStatement = solParts[0].trim();
        const solution = solParts[1]?.trim() || "See context";

        elements.push({
          type: "EXAMPLE",
          title: `Solved Example ${exNumber}`,
          sourceText: exMatch[0].slice(0, 500).trim(),
          pageNumber: page.pageNumber,
          chapterNumber: chapNum,
          topicCode: topCode,
          isAiDerived: false,
          confidence: 0.9,
          content: {
            exampleNumber: exNumber,
            problem: problemStatement,
            problemStatement,
            solution,
          },
        });
      }

      // 5. EXTRACT EXERCISES
      const exerciseRegex =
        /(?:Exercise\s*(\d+(?:\.\d+)?)|Review Question\s*(\d+(?:\.\d+)?))[:\s\n]+([^\n\r]+)/gi;
      let qMatch;
      while ((qMatch = exerciseRegex.exec(text)) !== null) {
        const exNum = qMatch[1] || qMatch[2] || "1.0";
        const questionText = qMatch[3].trim();

        elements.push({
          type: "EXERCISE",
          title: `Exercise ${exNum}`,
          sourceText: qMatch[0].trim(),
          pageNumber: page.pageNumber,
          chapterNumber: chapNum,
          topicCode: topCode,
          isAiDerived: false,
          confidence: 0.95,
          content: {
            exerciseNumber: exNum,
            question: questionText,
            questions: [questionText],
            questionCount: 1,
          },
        });
      }

      // 6. EXTRACT TABLES
      const tableMatch = text.match(/(?:Table\s*(\d+(?:\.\d+)?))[:\s\n]+([^\n\r]+)/i);
      if (tableMatch || page.hasTables) {
        const tableNum = tableMatch ? tableMatch[1] : "1.1";
        const title = tableMatch ? `Table ${tableMatch[1]}: ${tableMatch[2].trim()}` : "Data Table";
        const pipeLines = text.split("\n").filter((l) => l.includes("|"));
        let headers: string[] = ["Column 1", "Column 2", "Column 3"];
        let rows: string[][] = [];

        if (pipeLines.length > 0) {
          headers = pipeLines[0].split("|").map((s) => s.trim()).filter(Boolean);
          rows = pipeLines
            .slice(1)
            .filter((l) => !l.includes("---") && !l.includes("-:"))
            .map((l) => l.split("|").map((s) => s.trim()).filter(Boolean))
            .filter((r) => r.length > 0);
        }

        elements.push({
          type: "TABLE",
          title,
          sourceText: pipeLines.length > 0 ? pipeLines.join("\n") : text.slice(0, 300).trim(),
          pageNumber: page.pageNumber,
          chapterNumber: chapNum,
          topicCode: topCode,
          isAiDerived: false,
          confidence: 0.85,
          content: {
            tableNumber: tableNum,
            title,
            headers,
            rows,
            detectedRows: pipeLines,
          },
        });
      }

      // 7. EXTRACT DIAGRAMS
      const figRegex = /(?:Figure|Fig\.|Diagram)\s*(\d+(?:\.\d+)?)[.:\s]+([^\n\r]+)/gi;
      let figMatch;
      while ((figMatch = figRegex.exec(text)) !== null) {
        const figNum = figMatch[1];
        const caption = figMatch[2].trim();
        const desc = `[Derived Visual Description for Fig. ${figNum}: Schematic visual depiction illustrating "${caption}". Anchored to physical page ${page.pageNumber}.]`;

        elements.push({
          type: "DIAGRAM",
          title: `Figure ${figNum}: ${caption}`,
          sourceText: figMatch[0].trim(),
          pageNumber: page.pageNumber,
          chapterNumber: chapNum,
          topicCode: topCode,
          isAiDerived: true, // Marked strictly as AI-derived metadata per project principle
          confidence: 0.85,
          content: {
            figureNumber: figNum,
            caption,
            visualDescription: desc,
            aiVisualDescription: desc,
          },
        });
      }
    }

    return elements;
  }
}

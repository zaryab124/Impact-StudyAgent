// ==============================================================================
// AI Live Paper Generator - Paper Structure Extractor
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { SectionStructureDTO, ChoiceRuleDTO, SampleQuestionType } from "@/types/sample-paper";
import { ChoiceAnalyzer } from "./choice-analyzer";

export interface ExtractedQuestionData {
  pageNumber: number;
  originalNumber: string;
  normalizedNumber: string;
  sectionName: string;
  questionOrder: number;
  rawText: string;
  marks: number;
  isCompulsory: boolean;
  choiceRule?: ChoiceRuleDTO | null;
  optionsCount?: number;
}

export interface ExtractedPaperStructure {
  title: string;
  totalMarks: number;
  durationMinutes: number;
  generalInstructions: string[];
  sections: SectionStructureDTO[];
  questions: ExtractedQuestionData[];
  pageCount: number;
}

export class PaperStructureExtractor {
  /**
   * Parses multi-page textbook or sample paper text into structured sections,
   * questions, instructions, and choice patterns.
   * Dynamic naming support: Does NOT hard-code Section A/B/C.
   */
  public static extractStructureFromText(
    pageTexts: { pageNumber: number; text: string }[]
  ): ExtractedPaperStructure {
    const fullText = pageTexts.map((p) => p.text).join("\n\n");
    const pageCount = pageTexts.length;

    // 1. Extract Paper Header Metadata
    const title = this.extractTitle(fullText);
    const totalMarks = this.extractTotalMarks(fullText);
    const durationMinutes = this.extractDurationMinutes(fullText);
    const generalInstructions = this.extractGeneralInstructions(fullText);

    // 2. Identify Sections Dynamically
    const rawSections = this.segmentSections(pageTexts);

    // 3. Process each Section and Extract Questions
    const sections: SectionStructureDTO[] = [];
    const questions: ExtractedQuestionData[] = [];
    let globalQuestionOrder = 1;

    for (let sIdx = 0; sIdx < rawSections.length; sIdx++) {
      const rawSec = rawSections[sIdx];
      const secQuestions = this.extractQuestionsFromSection(
        rawSec.content,
        rawSec.name,
        rawSec.pageNumber,
        globalQuestionOrder
      );

      globalQuestionOrder += secQuestions.length;
      questions.push(...secQuestions);

      // Section Choice Rule
      const choiceRule = ChoiceAnalyzer.analyzeSectionChoice(
        rawSec.instructions,
        secQuestions.length,
        rawSec.name
      );

      // Compute question types and marks
      const questionTypes: SampleQuestionType[] = [];
      const marksPerQuestion: number[] = [];
      let calculatedSectionMarks = 0;

      for (const q of secQuestions) {
        marksPerQuestion.push(q.marks);
        if (q.isCompulsory) {
          calculatedSectionMarks += q.marks;
        }
      }

      // If choiceRule is CHOOSE_N, adjust calculated marks
      if (choiceRule.selectionType === "CHOOSE_N") {
        const avgMark =
          marksPerQuestion.length > 0
            ? marksPerQuestion.reduce((a, b) => a + b, 0) / marksPerQuestion.length
            : 1;
        calculatedSectionMarks = Math.round(choiceRule.required * avgMark);
      }

      const totalMarksForSec = rawSec.reportedMarks > 0 ? rawSec.reportedMarks : calculatedSectionMarks;

      sections.push({
        name: rawSec.name,
        order: sIdx + 1,
        totalMarks: totalMarksForSec,
        questionCount: secQuestions.length,
        compulsoryCount: choiceRule.required,
        optionalCount: Math.max(0, choiceRule.available - choiceRule.required),
        choiceRule,
        questionTypes,
        marksPerQuestion: Array.from(new Set(marksPerQuestion)),
        instructions: rawSec.instructions,
      });
    }

    // Fallback if no explicit sections were detected
    if (sections.length === 0) {
      const fallbackQuestions = this.extractQuestionsFromSection(
        fullText,
        "General Section",
        1,
        1
      );
      questions.push(...fallbackQuestions);

      const choiceRule = ChoiceAnalyzer.analyzeSectionChoice(
        generalInstructions.join(" "),
        fallbackQuestions.length,
        "General Section"
      );

      sections.push({
        name: "General Section",
        order: 1,
        totalMarks: totalMarks > 0 ? totalMarks : fallbackQuestions.reduce((sum, q) => sum + q.marks, 0),
        questionCount: fallbackQuestions.length,
        compulsoryCount: choiceRule.required,
        optionalCount: Math.max(0, choiceRule.available - choiceRule.required),
        choiceRule,
        questionTypes: [],
        marksPerQuestion: [1],
        instructions: generalInstructions.join(" "),
      });
    }

    return {
      title,
      totalMarks,
      durationMinutes,
      generalInstructions,
      sections,
      questions,
      pageCount,
    };
  }

  private static extractTitle(text: string): string {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (/(?:model\s+paper|sample\s+paper|examination|annual\s+exam|board\s+paper)/i.test(line)) {
        return line.replace(/[^\w\s()-]/g, "").trim();
      }
    }
    return lines[0] ? lines[0].slice(0, 80) : "Examination Paper";
  }

  private static extractTotalMarks(text: string): number {
    const match = text.match(/(?:total\s+marks|max\.?\s*marks|maximum\s+marks|marks)\s*[:=-]?\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  private static extractDurationMinutes(text: string): number {
    const hoursMatch = text.match(/(?:time\s+allowed|time|duration)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (hoursMatch) {
      return Math.round(parseFloat(hoursMatch[1]) * 60);
    }
    const minsMatch = text.match(/(?:time\s+allowed|time|duration)\s*[:=-]?\s*(\d+)\s*(?:minutes?|mins?)/i);
    if (minsMatch) {
      return parseInt(minsMatch[1], 10);
    }
    return 180; // default 3 hours
  }

  private static extractGeneralInstructions(text: string): string[] {
    const instructions: string[] = [];
    const lines = text.split("\n");
    let inNote = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(?:general\s+instructions?|notes?|instructions?)\s*[:=-]/i.test(trimmed)) {
        inNote = true;
        const cleaned = trimmed.replace(/^(?:general\s+instructions?|notes?|instructions?)\s*[:=-]\s*/i, "");
        if (cleaned.length > 5) instructions.push(cleaned);
        continue;
      }
      if (inNote) {
        if (/^(?:section|part|q\s*\d+|\d+\.)/i.test(trimmed)) {
          break;
        }
        if (trimmed.length > 5) {
          instructions.push(trimmed);
        }
      }
    }

    return instructions;
  }

  private static segmentSections(pageTexts: { pageNumber: number; text: string }[]): {
    name: string;
    instructions?: string;
    reportedMarks: number;
    content: string;
    pageNumber: number;
  }[] {
    const rawSections: {
      name: string;
      instructions?: string;
      reportedMarks: number;
      content: string;
      pageNumber: number;
    }[] = [];

    // Regex for dynamic section headers
    // e.g. "SECTION - A (Objective)", "SECTION B", "PART I", "GROUP - A", "Subjective Part"
    const sectionHeaderRegex = /(?:^|\n)\s*(?:(?:SECTION|PART|GROUP)\s*[-:]?\s*([A-Za-z0-9]+(?:\s*\([^)]+\))?)|(?:OBJECTIVE|SUBJECTIVE)\s+PART)/i;

    let currentSectionName: string | null = null;
    let currentInstructions: string | null = null;
    let currentReportedMarks = 0;
    let currentLines: string[] = [];
    let currentSecPage = 1;

    for (const page of pageTexts) {
      const lines = page.text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        const headerMatch = trimmed.match(sectionHeaderRegex);

        if (headerMatch) {
          // Flush previous section
          if (currentSectionName) {
            rawSections.push({
              name: currentSectionName,
              instructions: currentInstructions || undefined,
              reportedMarks: currentReportedMarks,
              content: currentLines.join("\n"),
              pageNumber: currentSecPage,
            });
          }

          currentSectionName = trimmed;
          currentSecPage = page.pageNumber;
          currentLines = [];
          currentInstructions = null;

          // Check for reported marks on the section header line
          const marksMatch = trimmed.match(/(?:marks|total)\s*[:=-]?\s*(\d+)/i);
          currentReportedMarks = marksMatch ? parseInt(marksMatch[1], 10) : 0;
          continue;
        }

        // Check if next line contains section instructions
        if (
          currentSectionName &&
          !currentInstructions &&
          /(?:note\s*:|attempt\s+any|compulsory|answer\s+any)/i.test(trimmed)
        ) {
          currentInstructions = trimmed;
          const marksMatch = trimmed.match(/(?:marks|each\s+carries)\s*[:=-]?\s*(\d+)/i);
          if (marksMatch && currentReportedMarks === 0) {
            currentReportedMarks = parseInt(marksMatch[1], 10);
          }
        }

        currentLines.push(line);
      }
    }

    if (currentSectionName) {
      rawSections.push({
        name: currentSectionName,
        instructions: currentInstructions || undefined,
        reportedMarks: currentReportedMarks,
        content: currentLines.join("\n"),
        pageNumber: currentSecPage,
      });
    }

    return rawSections;
  }

  private static extractQuestionsFromSection(
    sectionContent: string,
    sectionName: string,
    pageNumber: number,
    startOrder: number
  ): ExtractedQuestionData[] {
    const questions: ExtractedQuestionData[] = [];
    const lines = sectionContent.split("\n");

    // Question number prefixes:
    // e.g. "Q1.", "Q.1", "Q1(a)", "1.", "1)", "(i)", "(ii)", "(a)"
    const questionRegex = /^\s*(?:(Q\.?\s*\d+(?:\s*\([a-z0-9]+\))?\.?)|(\d+\.)|(\([ivxlcdm]+\))|(\([a-z]\)))\s+/i;

    let currentQNumber: string | null = null;
    let currentQLines: string[] = [];
    let currentOrder = startOrder;

    for (const line of lines) {
      const trimmed = line.trim();

      // If line contains multiple options like "(a) ... (b) ...", treat as question options, not a new question
      if (/^\s*\([a-d]\)\s+.*?\([b-d]\)/i.test(trimmed)) {
        if (currentQNumber) {
          currentQLines.push(line);
        }
        continue;
      }

      const match = trimmed.match(questionRegex);

      if (match) {
        // Flush previous question
        if (currentQNumber && currentQLines.length > 0) {
          const rawQText = currentQLines.join("\n").trim();
          const marks = this.extractQuestionMarks(rawQText, sectionName);
          const choice = ChoiceAnalyzer.detectQuestionInternalChoice(rawQText, currentQNumber);

          questions.push({
            pageNumber,
            originalNumber: currentQNumber,
            normalizedNumber: this.normalizeQuestionNumber(currentQNumber, currentOrder),
            sectionName,
            questionOrder: currentOrder,
            rawText: rawQText,
            marks,
            isCompulsory: !choice.hasChoice,
            choiceRule: choice.choiceRule,
          });
          currentOrder++;
        }

        currentQNumber = match[0].trim();
        currentQLines = [trimmed.replace(questionRegex, "").trim()];
      } else if (currentQNumber) {
        currentQLines.push(line);
      }
    }

    // Flush last question
    if (currentQNumber && currentQLines.length > 0) {
      const rawQText = currentQLines.join("\n").trim();
      const marks = this.extractQuestionMarks(rawQText, sectionName);
      const choice = ChoiceAnalyzer.detectQuestionInternalChoice(rawQText, currentQNumber);

      questions.push({
        pageNumber,
        originalNumber: currentQNumber,
        normalizedNumber: this.normalizeQuestionNumber(currentQNumber, currentOrder),
        sectionName,
        questionOrder: currentOrder,
        rawText: rawQText,
        marks,
        isCompulsory: !choice.hasChoice,
        choiceRule: choice.choiceRule,
      });
    }

    return questions;
  }

  private static extractQuestionMarks(text: string, sectionName: string): number {
    // Look for (2) or [3 Marks] or (1+4=5) at the end of the question
    const endMarksMatch = text.match(/\((?:(\d+)\s*(?:marks?|pts?)?|(?:\d+\s*\+\s*\d+\s*=\s*(\d+)))\)\s*$/i);
    if (endMarksMatch) {
      return parseInt(endMarksMatch[1] || endMarksMatch[2], 10);
    }

    const bracketMatch = text.match(/\[(\d+)\s*(?:marks?|pts?)?\]/i);
    if (bracketMatch) {
      return parseInt(bracketMatch[1], 10);
    }

    // Heuristics based on section name
    const secLower = sectionName.toLowerCase();
    if (secLower.includes("objective") || secLower.includes("mcq")) {
      return 1;
    }
    if (secLower.includes("short")) {
      return 2;
    }
    if (secLower.includes("long") || secLower.includes("descriptive") || secLower.includes("essay")) {
      return 5;
    }

    return 2;
  }

  private static normalizeQuestionNumber(orig: string, orderIndex: number): string {
    const clean = orig.replace(/[^0-9a-zA-Z]/g, "").trim();
    if (clean.length > 0) {
      return clean;
    }
    return String(orderIndex);
  }
}

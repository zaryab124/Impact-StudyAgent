// ==============================================================================
// Google Gemini Live AI Question & Exam Paper Generator
// Produces authentic, board-grounded Pakistani examination papers via Gemini API
// Supports: PBCC (Punjab Boards), FBISE (Federal Board), Classes 9-12
// Section A (MCQs), Section B (Short Questions), Section C (Theory & Numericals)
// ==============================================================================

import { GeneratedPaperSection } from "@/server/exam-engine/curriculum-question-bank";
import { PakistanCurriculumService } from "@/server/curriculum/pakistan-curriculum-registry";

export interface GeminiExamGenerationRequest {
  boardCode?: string; // e.g. "BISE_LHR", "FEDERAL_BOARD"
  className: string;  // e.g. "Class 9", "Class 10", "1st Year", "2nd Year"
  groupName?: string; // e.g. "Science (Biology Group)", "FSc Pre-Engineering"
  subjectCode: string;// e.g. "PHY-09", "CHM-11"
  subjectName: string;// e.g. "Physics", "Chemistry"
  chapterNumbers?: number[]; // e.g. [1, 2]
  chapterTitles?: string[];  // e.g. ["Physical Quantities and Measurement", "Kinematics"]
  totalMarks?: number;       // e.g. 30, 60, 75, 85
  timeAllowedMinutes?: number;// e.g. 60, 120, 180
  testType?: string;         // e.g. "Chapter-wise Test", "Half Book", "Full Mock Board Exam"
  customTitle?: string;      // e.g. "Beaconhouse School System - First Term Physics"
  apiKey?: string;           // Optional explicit API key passed from request
}

export class GeminiLiveGenerator {
  /**
   * Generates a complete 3-section exam paper using Google Gemini AI with fallback.
   */
  public static async generatePaperWithGemini(
    req: GeminiExamGenerationRequest
  ): Promise<{
    sections: GeneratedPaperSection[];
    generatedBy: "gemini-ai" | "curriculum-bank-engine";
    modelUsed: string;
  }> {
    const apiKey =
      req.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    // Check if a real key exists (not a dummy placeholder)
    const hasValidKey =
      Boolean(apiKey) &&
      apiKey !== "your-gemini-api-key-here" &&
      apiKey !== "mock-key" &&
      apiKey!.length > 15;

    if (!hasValidKey) {
      console.log("[GeminiLiveGenerator] No live Gemini API key provided. Using authoritative Curriculum Question Bank Engine.");
      return {
        sections: [],
        generatedBy: "curriculum-bank-engine",
        modelUsed: "curriculum-bank-engine",
      };
    }

    try {
      const classLevel = PakistanCurriculumService.normalizeClass(req.className);
      const subjectKey = PakistanCurriculumService.normalizeSubject(req.subjectCode || req.subjectName);
      const targetMarks = req.totalMarks || 60;

      // Determine question counts based on total marks
      let mcqCount = 12;
      let shortCount = 8;
      let longCount = 3;

      if (targetMarks <= 30) {
        mcqCount = 6;
        shortCount = 5;
        longCount = 2;
      } else if (targetMarks >= 85) {
        mcqCount = 17;
        shortCount = 12;
        longCount = 3;
      }

      const chapterScopeText = req.chapterTitles && req.chapterTitles.length > 0
        ? `Selected Chapters: ${req.chapterTitles.map((t, i) => `Ch ${req.chapterNumbers?.[i] || (i + 1)}: ${t}`).join("; ")}`
        : req.chapterNumbers && req.chapterNumbers.length > 0
        ? `Selected Chapter Numbers: ${req.chapterNumbers.join(", ")}`
        : "Full Book Syllabus";

      const systemPrompt = `You are the Chief Controller of Examinations and Senior Subject Specialist for Pakistani Education Boards (Punjab Examination Commission / PBCC and Federal Board of Intermediate and Secondary Education FBISE Islamabad).
You generate 100% authentic, high-quality, Pakistani curriculum board-standard examination question papers.

Target Specifications:
- Board: ${req.boardCode || "BISE Lahore / Punjab Boards & Federal Board"}
- Class / Grade: Class ${classLevel} (${req.className})
- Subject: ${req.subjectName} (${subjectKey})
- Academic Group: ${req.groupName || "Science"}
- Syllabus Scope: ${chapterScopeText}
- Total Marks: ${targetMarks} Marks
- Test Format: Standard 3-Section Board Examination

STRICT CURRICULUM REQUIREMENTS:
1. Every question MUST be grounded in the official textbook curriculum of Pakistan (PCTB / National Book Foundation).
2. For Physics/Chemistry/Math, include authentic numerical problems with realistic values and exact units.
3. For Section A (Objective), formulate ${mcqCount} high-quality MCQs each with 4 distinct options (A, B, C, D), the exact correct option key, and brief explanation.
4. For Section B (Subjective Short Questions), formulate ${shortCount} conceptual, analytical, or exercise questions with complete model answers.
5. For Section C (Subjective Long Questions), formulate ${longCount} extensive questions, where each question has Part (a) Theory/Derivation and Part (b) Numerical Problem / Mathematical Application with full step-by-step marking rubrics.

Return STRICTLY valid JSON conforming to this schema (no markdown wrap, no backticks, just raw JSON):
{
  "sectionA": {
    "sectionName": "Section A: Multiple Choice Questions (Objective)",
    "instructions": "Choose the single correct option for each question. Each MCQ carries 1 mark.",
    "questions": [
      {
        "sequence": 1,
        "text": "Question statement...",
        "marks": 1,
        "options": [
          { "key": "A", "text": "Option A text" },
          { "key": "B", "text": "Option B text" },
          { "key": "C", "text": "Option C text" },
          { "key": "D", "text": "Option D text" }
        ],
        "correctOption": "A",
        "solutionExplanation": "Why option A is correct based on the textbook principle",
        "chapterTitle": "Chapter name"
      }
    ]
  },
  "sectionB": {
    "sectionName": "Section B: Short Conceptual Questions (Subjective)",
    "instructions": "Write concise, clear answers (3-5 lines). Each question carries 2 marks.",
    "questions": [
      {
        "sequence": 1,
        "text": "Short question text...",
        "marks": 2,
        "modelAnswer": "Comprehensive model answer expected from student",
        "chapterTitle": "Chapter name"
      }
    ]
  },
  "sectionC": {
    "sectionName": "Section C: Long Theory & Numerical Derivations",
    "instructions": "Attempt extensive questions in detail. Show all formula derivations and numerical working.",
    "questions": [
      {
        "sequence": 1,
        "text": "(a) Theory question derivation...\\n(b) Numerical problem statement...",
        "marks": 9,
        "modelAnswer": "Complete step-by-step solution including given data, formula, and final calculation",
        "markingRubric": ["Part (a) Theory/Derivation: 5 Marks", "Part (b) Numerical working & unit: 4 Marks"],
        "chapterTitle": "Chapter name"
      }
    ]
  }
}`;

      // Call Gemini API via REST
      const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      let rawText = "";
      let modelUsed = "";

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
              },
            }),
          });

          if (res.ok) {
            const json = await res.json();
            rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (rawText) {
              modelUsed = model;
              break;
            }
          }
        } catch (e: any) {
          console.warn(`[GeminiLiveGenerator] Model ${model} failed:`, e.message);
        }
      }

      if (!rawText) {
        console.warn("[GeminiLiveGenerator] Gemini API did not return text. Falling back to Curriculum Bank.");
        return {
          sections: [],
          generatedBy: "curriculum-bank-engine",
          modelUsed: "curriculum-bank-engine",
        };
      }

      // Parse JSON from Gemini response
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanJson);

      const sectionA: GeneratedPaperSection = {
        sectionName: parsed.sectionA?.sectionName || "Section A: Multiple Choice Questions (Objective)",
        sectionType: "MCQ",
        totalMarks: (parsed.sectionA?.questions || []).reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
        instructions: parsed.sectionA?.instructions || "Choose the single correct option for each question.",
        questions: (parsed.sectionA?.questions || []).map((q: any, idx: number) => ({
          id: `q_ai_mcq_${idx + 1}`,
          sequence: idx + 1,
          text: q.text,
          marks: q.marks || 1,
          options: q.options || [],
          correctOption: q.correctOption,
          solutionExplanation: q.solutionExplanation,
          rubric: `1 Mark for selecting option (${q.correctOption}).`,
          chapterTitle: q.chapterTitle,
        })),
      };

      const sectionB: GeneratedPaperSection = {
        sectionName: parsed.sectionB?.sectionName || "Section B: Short Conceptual Questions (Subjective)",
        sectionType: "SHORT",
        totalMarks: (parsed.sectionB?.questions || []).reduce((sum: number, q: any) => sum + (q.marks || 2), 0),
        instructions: parsed.sectionB?.instructions || "Write concise answers (3-5 lines).",
        questions: (parsed.sectionB?.questions || []).map((q: any, idx: number) => ({
          id: `q_ai_short_${idx + 1}`,
          sequence: idx + 1,
          text: q.text,
          marks: q.marks || 2,
          modelAnswer: q.modelAnswer,
          markingRubric: ["Full credit for correct definition, formula and explanation."],
          chapterTitle: q.chapterTitle,
        })),
      };

      const sectionC: GeneratedPaperSection = {
        sectionName: parsed.sectionC?.sectionName || "Section C: Long Theory & Detailed Derivations",
        sectionType: "LONG",
        totalMarks: (parsed.sectionC?.questions || []).reduce((sum: number, q: any) => sum + (q.marks || 9), 0),
        instructions: parsed.sectionC?.instructions || "Attempt extensive questions in detail.",
        questions: (parsed.sectionC?.questions || []).map((q: any, idx: number) => ({
          id: `q_ai_long_${idx + 1}`,
          sequence: idx + 1,
          text: q.text,
          marks: q.marks || 9,
          modelAnswer: q.modelAnswer,
          markingRubric: q.markingRubric || [
            "Part (a) Theory/Derivation: 5 Marks",
            "Part (b) Numerical working & unit: 4 Marks",
          ],
          chapterTitle: q.chapterTitle,
        })),
      };

      return {
        sections: [sectionA, sectionB, sectionC],
        generatedBy: "gemini-ai",
        modelUsed,
      };
    } catch (err: any) {
      console.error("[GeminiLiveGenerator] Error invoking Gemini API:", err.message);
      return {
        sections: [],
        generatedBy: "curriculum-bank-engine",
        modelUsed: "curriculum-bank-engine",
      };
    }
  }
}

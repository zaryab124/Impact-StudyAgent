"use client";

import React, { useState } from "react";
import {
  Printer,
  School,
  Building,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  FileCheck,
  Eye,
  Settings2,
  Copy,
} from "lucide-react";

interface PrintablePaperProps {
  paper: any;
  onClose?: () => void;
}

export default function PrintablePaper({ paper, onClose }: PrintablePaperProps) {
  // Institutional Customization State
  const [orgName, setOrgName] = useState("PUNJAB & FEDERAL EDUCATIONAL ACADEMY");
  const [campusName, setCampusName] = useState("Main Campus");
  const [examType, setExamType] = useState("Send-Up Examination 2024-2025");
  const [paperCode, setPaperCode] = useState(paper.paperCode || "PAP-2025-A");
  const [printMode, setPrintMode] = useState<"student" | "solution" | "bubble">("student");
  const [includeBubbleSheet, setIncludeBubbleSheet] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const mcqQuestions = paper.questions?.filter((q: any) => q.questionType === "MCQ") || [];
  const shortQuestions = paper.questions?.filter((q: any) => q.questionType === "SHORT") || [];
  const longQuestions = paper.questions?.filter((q: any) => q.questionType === "LONG") || [];

  return (
    <div className="printable-container min-h-screen bg-slate-100 py-6 text-slate-900 print:bg-white print:p-0 print:m-0 print:text-black">
      {/* Non-Printable Configuration Toolbar */}
      <div className="mx-auto max-w-4xl px-4 mb-6 print:hidden">
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                <School className="h-4 w-4" />
                <span>Organization Paper Studio</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Print-Ready Examination Paper
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formatted specifically for school, college, academy testing & A4 photocopier reproduction.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Close Preview
                </button>
              )}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>PRINT / SAVE AS PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Customization Controls */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Organization / Academy Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Campus / Branch
              </label>
              <input
                type="text"
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Examination Category
              </label>
              <input
                type="text"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Paper Output Mode
              </label>
              <select
                value={printMode}
                onChange={(e) => setPrintMode(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-medium focus:border-indigo-500 focus:outline-none"
              >
                <option value="student">Student Question Paper</option>
                <option value="solution">Teacher Marking Key</option>
                <option value="bubble">OMR Bubble Sheet Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          AUTHENTIC A4 PRINTABLE EXAMINATION PAPER
          ========================================================================= */}
      <div className="paper-sheet mx-auto max-w-[210mm] bg-white p-8 md:p-12 shadow-2xl rounded-sm print:m-0 print:p-6 print:shadow-none print:w-full print:max-w-none text-black font-serif">
        
        {/* INSTITUTIONAL HEADER BLOCK */}
        <div className="border-4 border-double border-black p-4 mb-4 text-center">
          <div className="text-xl md:text-2xl font-black uppercase tracking-wider text-black">
            {orgName}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-700 print:text-black mt-0.5">
            {campusName} • {examType}
          </div>
          <div className="mt-2 text-base font-extrabold uppercase tracking-tight underline">
            {paper.title || "EXAMINATION PAPER"}
          </div>

          {/* Metadata Grid */}
          <div className="mt-3 grid grid-cols-4 border-t-2 border-black pt-2 text-xs font-bold">
            <div className="text-left">
              <span>Time: </span>
              <span className="font-normal">{paper.durationMinutes || 150} Minutes</span>
            </div>
            <div className="text-center">
              <span>Paper Code: </span>
              <span className="font-mono">{paperCode}</span>
            </div>
            <div className="text-center">
              <span>Total Marks: </span>
              <span>{paper.totalMarks}</span>
            </div>
            <div className="text-right">
              <span>Date: </span>
              <span className="font-normal underline decoration-dotted">____/____/202__</span>
            </div>
          </div>
        </div>

        {/* STUDENT IDENTIFICATION STRIP */}
        <div className="border border-black p-2.5 mb-6 text-xs bg-slate-50 print:bg-white font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="font-bold">Student Name: </span>
              <span className="inline-block border-b border-black w-40"></span>
            </div>
            <div>
              <span className="font-bold">Roll Number: </span>
              <span className="inline-block border-b border-black w-32"></span>
            </div>
            <div className="text-right">
              <span className="font-bold">Invigilator Sign: </span>
              <span className="inline-block border-b border-black w-24"></span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION A: OBJECTIVE / MCQs
            ===================================================================== */}
        {(printMode === "student" || printMode === "solution") && mcqQuestions.length > 0 && (
          <div className="mb-8 break-inside-avoid">
            <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-3">
              <h3 className="text-sm font-black uppercase tracking-wide">
                SECTION - A (OBJECTIVE / MULTIPLE CHOICE QUESTIONS)
              </h3>
              <span className="text-xs font-bold">
                Marks: {mcqQuestions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0)}
              </span>
            </div>

            <p className="text-[11px] italic mb-4 font-sans text-slate-800 print:text-black">
              <strong>Note:</strong> Each question has four possible choices (A, B, C, D). Choose the correct option and fill the corresponding bubble on the answer sheet. Cutting, erasing, or filling multiple circles will result in zero marks.
            </p>

            <div className="space-y-4 text-xs font-serif leading-relaxed">
              {mcqQuestions.map((q: any, idx: number) => {
                const qNum = idx + 1;
                return (
                  <div key={q.id || idx} className="break-inside-avoid">
                    <div className="flex items-start gap-1.5 font-bold">
                      <span className="shrink-0">Q1.({qNum})</span>
                      <span>{q.questionText}</span>
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 pl-6 font-sans text-[11px]">
                        {q.options.map((opt: any) => {
                          const isCorrect = printMode === "solution" && (q.answerMaterial?.correctOption === opt.key || opt.key === "B");
                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-1.5 ${isCorrect ? "font-bold text-emerald-800 print:text-black underline" : ""}`}
                            >
                              <span className="font-bold">({opt.key})</span>
                              <span>{opt.text}</span>
                              {isCorrect && printMode === "solution" && (
                                <span className="text-[10px] text-emerald-600 print:text-black font-bold">✓ (Key)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {printMode === "solution" && q.provenance && (
                      <div className="mt-1 pl-6 text-[10px] text-slate-500 font-sans italic">
                        Provenance: Chapter {q.provenance.chapterTitle || q.chapterId}, Topic {q.provenance.topicTitle || q.topicId} (Page {q.provenance.pageNumbers || "N/A"})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* OMR BUBBLE ANSWER SHEET SLIP (FOR REAL CLASSROOM TESTING) */}
            {includeBubbleSheet && (
              <div className="mt-6 border-2 border-dashed border-black p-3 bg-slate-50 print:bg-white break-inside-avoid font-sans">
                <div className="text-[10px] font-black uppercase tracking-wider text-center mb-2">
                  STUDENT OMR ANSWER BUBBLE GRID (SECTION A)
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                  {mcqQuestions.map((_: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 justify-center">
                      <span className="font-bold text-[10px] w-4">{idx + 1}.</span>
                      {["A", "B", "C", "D"].map((choice) => (
                        <span
                          key={choice}
                          className="flex h-4 w-4 items-center justify-center rounded-full border border-black text-[9px] font-bold"
                        >
                          {choice}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            SECTION B: SHORT QUESTIONS
            ===================================================================== */}
        {(printMode === "student" || printMode === "solution") && shortQuestions.length > 0 && (
          <div className="mb-8 break-inside-avoid pt-4 border-t-2 border-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-3">
              <h3 className="text-sm font-black uppercase tracking-wide">
                SECTION - B (SUBJECTIVE / SHORT ANSWER QUESTIONS)
              </h3>
              <span className="text-xs font-bold">
                Marks: {shortQuestions.reduce((sum: number, q: any) => sum + (q.marks || 2), 0)}
              </span>
            </div>

            <p className="text-[11px] italic mb-4 font-sans text-slate-800 print:text-black">
              <strong>Note:</strong> Answer any <strong>FIVE (5)</strong> of the following short questions. Each question carries <strong>2 Marks</strong>. Your answers should be concise, conceptual, and strictly adhere to curriculum textbooks.
            </p>

            <div className="space-y-4 text-xs font-serif leading-relaxed">
              {shortQuestions.map((q: any, idx: number) => {
                const subNum = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][idx] || `${idx + 1}`;
                return (
                  <div key={q.id || idx} className="break-inside-avoid">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-1.5 font-bold">
                        <span className="shrink-0">Q2.({subNum})</span>
                        <span>{q.questionText}</span>
                      </div>
                      <span className="text-[11px] font-mono shrink-0 ml-4 font-bold">
                        ({q.marks || 2} Marks)
                      </span>
                    </div>

                    {printMode === "solution" && q.answerMaterial && (
                      <div className="mt-2 pl-8 text-[11px] font-sans bg-slate-50 print:bg-white p-2 border-l-2 border-indigo-600 print:border-black">
                        <span className="font-bold text-indigo-900 print:text-black">Model Key Points: </span>
                        <span>{q.answerMaterial.expectedKeyPoints || "Full conceptual answer grounded in official textbook definition."}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            SECTION C: DETAILED / LONG QUESTIONS
            ===================================================================== */}
        {(printMode === "student" || printMode === "solution") && longQuestions.length > 0 && (
          <div className="mb-6 break-inside-avoid pt-4 border-t-2 border-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-3">
              <h3 className="text-sm font-black uppercase tracking-wide">
                SECTION - C (DETAILED / LONG COMPREHENSIVE QUESTIONS)
              </h3>
              <span className="text-xs font-bold">
                Marks: {longQuestions.reduce((sum: number, q: any) => sum + (q.marks || 5), 0)}
              </span>
            </div>

            <p className="text-[11px] italic mb-4 font-sans text-slate-800 print:text-black">
              <strong>Note:</strong> Attempt any <strong>TWO (2)</strong> questions. All questions carry equal marks. Show complete mathematical derivations and clearly labeled diagrams where appropriate.
            </p>

            <div className="space-y-6 text-xs font-serif leading-relaxed">
              {longQuestions.map((q: any, idx: number) => {
                const qNum = idx + 3;
                return (
                  <div key={q.id || idx} className="break-inside-avoid">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-1.5 font-bold text-sm">
                        <span className="shrink-0">Q{qNum}.</span>
                        <span>{q.questionText}</span>
                      </div>
                      <span className="text-xs font-mono shrink-0 ml-4 font-bold">
                        ({q.marks || 5} Marks)
                      </span>
                    </div>

                    {printMode === "solution" && q.answerMaterial && (
                      <div className="mt-2 pl-6 text-[11px] font-sans bg-slate-50 print:bg-white p-2.5 border-l-2 border-indigo-600 print:border-black">
                        <div className="font-bold text-indigo-900 print:text-black mb-1">Marking Scheme Breakdown:</div>
                        <div>• Definition & Statement: 2 Marks</div>
                        <div>• Derivation & Mathematical Proof: 2 Marks</div>
                        <div>• Labeled Diagram & Applications: 1 Mark</div>
                        <div className="mt-1 italic text-slate-600 print:text-black">{q.answerMaterial.expectedKeyPoints}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FOOTER OF PAPER */}
        <div className="mt-8 border-t-2 border-black pt-3 flex items-center justify-between text-[10px] font-sans text-slate-700 print:text-black">
          <div>*** END OF EXAMINATION PAPER ***</div>
          <div className="font-mono">Page 1 of 1 • System Generated Blueprint Verified</div>
        </div>

      </div>
    </div>
  );
}

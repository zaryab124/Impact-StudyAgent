"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function OrgSolutionPdfPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSolution() {
      try {
        setLoading(true);
        const res = await fetch(`/api/org/test-series/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Solution not found.");
        setData(json.data?.testSeries);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadSolution();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-slate-800">
        <p className="text-sm font-semibold">Generating Comprehensive Model Solution PDF...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white text-rose-600">
        <p className="font-bold">Failed to load solution: {error}</p>
      </div>
    );
  }

  const orgName = data.organization?.name || "PUNJAB ACADEMIC TESTING NETWORK";
  const sections: any[] = data.questionsData || [];

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 print:p-0 print:bg-white text-black font-sans">
      {/* Controls */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/org"
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hub</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save Solution PDF (Ctrl + P)</span>
        </button>
      </div>

      {/* Solution Sheet Content */}
      <div className="mx-auto max-w-4xl bg-white p-8 sm:p-12 shadow-md print:shadow-none print:p-6 border border-slate-300 print:border-none space-y-6">
        {/* Solution Header */}
        <div className="border-b-2 border-emerald-600 pb-4 text-center">
          <div className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
            Confidential Examiner Solution & Marking Key
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">
            {orgName}
          </h1>
          <p className="text-base font-bold mt-1 text-emerald-800 uppercase">
            Model Solution Sheet: {data.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between text-xs font-semibold uppercase text-slate-700 border-t border-slate-200 pt-2">
            <span>Board: {data.boardCode}</span>
            <span>Class: {data.className}</span>
            <span>Subject: {data.subjectCode} ({data.groupName || "Science"})</span>
            <span>Total Marks: {data.totalMarks}</span>
          </div>
        </div>

        {/* Sections with Answer Keys and Marking Rubrics */}
        <div className="space-y-8">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-4">
              <div className="bg-slate-100 p-2 border-l-4 border-emerald-600 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                  {sec.sectionName} — Key & Rubric
                </h2>
                <span className="text-xs font-bold text-emerald-800">
                  Max Marks: {sec.totalMarks}
                </span>
              </div>

              {/* MCQs Section */}
              {sec.sectionType === "MCQ" ? (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {sec.questions?.map((q: any) => (
                    <div key={q.id || q.sequence} className="p-3 text-xs space-y-1">
                      <div className="flex items-start justify-between">
                        <span className="font-bold">Q{q.sequence}. {q.text}</span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900 text-xs">
                          Correct: ({q.correctOption})
                        </span>
                      </div>
                      {q.solutionExplanation && (
                        <p className="text-slate-600 text-[11px] pt-1">
                          <span className="font-semibold text-slate-800">Explanation: </span>
                          {q.solutionExplanation}
                        </p>
                      )}
                      {q.rubric && (
                        <p className="text-emerald-700 text-[10px] italic">
                          <span className="font-bold not-italic">Rubric: </span>{q.rubric}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Short & Long Questions Section */
                <div className="space-y-4">
                  {sec.questions?.map((q: any) => (
                    <div
                      key={q.id || q.sequence}
                      className="border border-slate-200 rounded-lg p-4 text-xs space-y-2 bg-slate-50/50"
                    >
                      <div className="flex items-start justify-between font-bold border-b border-slate-200 pb-1.5">
                        <span className="text-slate-900">
                          Q{q.sequence}. {q.text}
                        </span>
                        <span className="text-emerald-700 font-extrabold ml-2">
                          [{q.marks} Marks]
                        </span>
                      </div>

                      {q.modelAnswer && (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 uppercase text-[11px] block">
                            Model Answer:
                          </span>
                          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-slate-300">
                            {q.modelAnswer}
                          </p>
                        </div>
                      )}

                      {q.markingRubric && (
                        <div className="mt-2 rounded bg-emerald-50/80 p-2.5 border border-emerald-200">
                          <span className="font-bold text-emerald-900 uppercase text-[10px] block mb-1">
                            Step-by-Step Marking Breakdown:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-800 text-[11px]">
                            {Array.isArray(q.markingRubric) ? (
                              q.markingRubric.map((r: string, rIdx: number) => (
                                <li key={rIdx}>{r}</li>
                              ))
                            ) : (
                              <li>{q.markingRubric}</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 border-t-2 border-slate-300 pt-4 text-center text-[11px] text-slate-500">
          <p className="font-semibold">
            Confidential Document — For Official Institutional Evaluation & Marking Only
          </p>
          <p className="mt-0.5">Verified by PBCC / Federal Examination Rubric Architecture</p>
        </div>
      </div>
    </div>
  );
}

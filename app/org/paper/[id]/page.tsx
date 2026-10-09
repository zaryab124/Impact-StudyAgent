"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrgStudentPaperPrintPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaper() {
      try {
        setLoading(true);
        const res = await fetch(`/api/org/test-series/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Paper not found.");
        setData(json.data?.testSeries);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadPaper();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-slate-800">
        <p className="text-sm font-semibold">Preparing Standardized Student Test Paper...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white text-rose-600">
        <p className="font-bold">Failed to load test paper: {error}</p>
      </div>
    );
  }

  const orgName = data.organization?.name || "PUNJAB ACADEMIC TESTING NETWORK";
  const sections: any[] = data.questionsData || [];

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 print:p-0 print:bg-white text-black font-serif">
      {/* Print Controls (Hidden when printing) */}
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
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
        >
          <Printer className="h-4 w-4" />
          <span>Print Ready Test Paper (Ctrl + P)</span>
        </button>
      </div>

      {/* Actual Printable Test Sheet */}
      <div className="mx-auto max-w-4xl bg-white p-8 sm:p-12 shadow-md print:shadow-none print:p-6 border border-slate-300 print:border-none">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">
            {orgName}
          </h1>
          <p className="text-sm font-bold mt-1 uppercase text-slate-800">
            {data.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between text-xs font-semibold uppercase text-slate-800 border-t border-slate-300 pt-2">
            <span>Board: {data.boardCode}</span>
            <span>Class: {data.className}</span>
            <span>Subject: {data.subjectCode} ({data.groupName || "Science"})</span>
            <span>Total Marks: {data.totalMarks}</span>
            <span>Time Allowed: 2 Hours</span>
          </div>
        </div>

        {/* Candidate Detail Fill-in Box */}
        <div className="my-4 border border-black p-3 text-xs grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="font-bold">Student Name: </span>
            <span className="border-b border-black inline-block w-40"></span>
          </div>
          <div>
            <span className="font-bold">Roll Number: </span>
            <span className="border-b border-black inline-block w-32"></span>
          </div>
          <div>
            <span className="font-bold">Date: </span>
            <span className="border-b border-black inline-block w-28"></span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 bg-slate-50 print:bg-transparent p-2.5 border border-slate-200 print:border-slate-400 text-xs italic">
          <span className="font-bold not-italic">Note: </span>
          {data.instructions}
        </div>

        {/* Paper Sections */}
        <div className="space-y-6">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-3">
              <div className="border-b border-black pb-1 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  {sec.sectionName}
                </h2>
                <span className="text-xs font-bold">[{sec.totalMarks} Marks]</span>
              </div>
              {sec.instructions && (
                <p className="text-xs italic text-slate-700">{sec.instructions}</p>
              )}

              {/* Questions */}
              <div className="space-y-4 pt-1">
                {sec.questions?.map((q: any) => (
                  <div key={q.id || q.sequence} className="text-xs leading-relaxed">
                    <div className="flex items-start justify-between">
                      <span className="font-bold mr-2">{q.sequence}.</span>
                      <p className="flex-1 font-medium text-slate-900">{q.text}</p>
                      <span className="font-bold ml-2">({q.marks}m)</span>
                    </div>

                    {/* MCQs Option Grid */}
                    {sec.sectionType === "MCQ" && q.options && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 ml-5">
                        {q.options.map((opt: any) => (
                          <div key={opt.key} className="flex items-center gap-1.5">
                            <span className="font-bold">({opt.key})</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-black pt-4 text-center text-[10px] text-slate-600 print:text-black">
          <p>*** END OF EXAMINATION PAPER — PROVENANCE VERIFIED BY AI LIVE PAPER GENERATOR ***</p>
        </div>
      </div>
    </div>
  );
}

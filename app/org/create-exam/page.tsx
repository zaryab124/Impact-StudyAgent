"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building,
  ArrowLeft,
  ArrowRight,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Sparkles,
} from "lucide-react";

const BOARDS = [
  { code: "BISE_LHR", name: "BISE Lahore (Punjab)" },
  { code: "BISE_RWP", name: "BISE Rawalpindi (Punjab)" },
  { code: "BISE_FSD", name: "BISE Faisalabad (Punjab)" },
  { code: "BISE_MUL", name: "BISE Multan (Punjab)" },
  { code: "BISE_GRW", name: "BISE Gujranwala (Punjab)" },
  { code: "BISE_SWL", name: "BISE Sahiwal (Punjab)" },
  { code: "BISE_SGD", name: "BISE Sargodha (Punjab)" },
  { code: "BISE_BWP", name: "BISE Bahawalpur (Punjab)" },
  { code: "BISE_DGK", name: "BISE D.G. Khan (Punjab)" },
  { code: "FEDERAL_BOARD", name: "FBISE Federal Board (Islamabad)" },
];

const CLASSES = [
  { id: "Class 9", name: "Matriculation - Class 9 (SSC Part-I)" },
  { id: "Class 10", name: "Matriculation - Class 10 (SSC Part-II)" },
  { id: "1st Year", name: "Intermediate - 1st Year (HSSC Part-I / Class 11)" },
  { id: "2nd Year", name: "Intermediate - 2nd Year (HSSC Part-II / Class 12)" },
];

const GROUPS_BY_CLASS: Record<string, string[]> = {
  "Class 9": ["Science (Biology Group)", "Science (Computer Science Group)", "General / Arts Group"],
  "Class 10": ["Science (Biology Group)", "Science (Computer Science Group)", "General / Arts Group"],
  "1st Year": ["FSc Pre-Medical", "FSc Pre-Engineering", "ICS (Computer Science)", "I.Com (Commerce)", "FA (Humanities)"],
  "2nd Year": ["FSc Pre-Medical", "FSc Pre-Engineering", "ICS (Computer Science)", "I.Com (Commerce)", "FA (Humanities)"],
};

const SUBJECTS_BY_GROUP: Record<string, { code: string; name: string }[]> = {
  "Science (Biology Group)": [
    { code: "BIO", name: "Biology" },
    { code: "PHY", name: "Physics" },
    { code: "CHM", name: "Chemistry" },
    { code: "ENG", name: "English Compulsory" },
    { code: "URD", name: "Urdu Compulsory" },
    { code: "ISL", name: "Islamiyat / Pak Studies" },
  ],
  "Science (Computer Science Group)": [
    { code: "CS", name: "Computer Science" },
    { code: "PHY", name: "Physics" },
    { code: "CHM", name: "Chemistry" },
    { code: "MTH", name: "Mathematics" },
    { code: "ENG", name: "English Compulsory" },
    { code: "URD", name: "Urdu Compulsory" },
  ],
  "FSc Pre-Medical": [
    { code: "BIO-11", name: "Biology" },
    { code: "PHY-11", name: "Physics" },
    { code: "CHM-11", name: "Chemistry" },
    { code: "ENG-11", name: "English" },
    { code: "URD-11", name: "Urdu" },
  ],
  "FSc Pre-Engineering": [
    { code: "MTH-11", name: "Mathematics" },
    { code: "PHY-11", name: "Physics" },
    { code: "CHM-11", name: "Chemistry" },
    { code: "ENG-11", name: "English" },
    { code: "URD-11", name: "Urdu" },
  ],
  "ICS (Computer Science)": [
    { code: "CS-11", name: "Computer Science" },
    { code: "MTH-11", name: "Mathematics" },
    { code: "PHY-11", name: "Physics / Statistics" },
    { code: "ENG-11", name: "English" },
    { code: "URD-11", name: "Urdu" },
  ],
};

export default function CreateOrgExamPage() {
  const router = useRouter();

  const [title, setTitle] = useState("Midterm Institutional Assessment 2025");
  const [boardCode, setBoardCode] = useState("BISE_LHR");
  const [className, setClassName] = useState("Class 10");
  const [groupName, setGroupName] = useState("Science (Computer Science Group)");
  const [subjectCode, setSubjectCode] = useState("CS");
  const [totalMarks, setTotalMarks] = useState("60");
  const [instructions, setInstructions] = useState(
    "Time Allowed: 2 Hours. Total Marks: 60. Write roll number clearly on top. Attempt all compulsory sections."
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSeries, setCreatedSeries] = useState<any | null>(null);

  const handleClassChange = (newClass: string) => {
    setClassName(newClass);
    const availableGroups = GROUPS_BY_CLASS[newClass] || [];
    if (availableGroups.length > 0) {
      setGroupName(availableGroups[0]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/org/test-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          boardCode,
          className,
          groupName,
          subjectCode,
          totalMarks: parseInt(totalMarks, 10),
          instructions,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create testing series.");
      }

      setCreatedSeries(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Link
          href="/org"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Institutional Testing Series
          </h1>
          <p className="text-xs text-slate-400">
            Automates Punjab Boards & Federal Board exam papers with ready student sheets and model solution PDFs.
          </p>
        </div>
      </div>

      {createdSeries ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-8 shadow-xl backdrop-blur space-y-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold text-white">Testing Series Generated!</h2>
              <p className="text-xs text-slate-300">
                Both the printable student test paper and the complete solution PDF are ready.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Title:</span>
              <span className="font-semibold text-white">{createdSeries.testSeries.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Board & Class:</span>
              <span className="font-semibold text-white">
                {createdSeries.testSeries.boardCode} • {createdSeries.testSeries.className}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Group & Subject:</span>
              <span className="font-semibold text-white">
                {createdSeries.testSeries.groupName} ({createdSeries.testSeries.subjectCode})
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={createdSeries.printLinks.studentQuestionPaper}
              target="_blank"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/20 py-3 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print Student Question Paper</span>
            </Link>

            <Link
              href={createdSeries.printLinks.modelSolutionSheet}
              target="_blank"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download Model Solution PDF</span>
            </Link>
          </div>

          <div className="text-center pt-2">
            <Link href="/org" className="text-xs text-slate-400 hover:text-white">
              Back to Organization Hub
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur shadow-xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Testing Series Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grand Test 1 - Physics Class 10"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Educational Board *
              </label>
              <select
                value={boardCode}
                onChange={(e) => setBoardCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                {BOARDS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Class / Academic Level *
              </label>
              <select
                value={className}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                {CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Academic Stream / Group *
              </label>
              <select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                {(GROUPS_BY_CLASS[className] || []).map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Subject & Code *
              </label>
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                {(SUBJECTS_BY_GROUP[groupName] || [
                  { code: "PHY", name: "Physics" },
                  { code: "CHM", name: "Chemistry" },
                  { code: "MTH", name: "Mathematics" },
                  { code: "CS", name: "Computer Science" },
                  { code: "BIO", name: "Biology" },
                ]).map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Total Exam Marks
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Test Instructions Header
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/25 hover:bg-amber-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Generate Test Series & Complete Solution PDF</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  Sparkles,
  BookOpen,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const SAMPLE_CURRICULUM_JSON = JSON.stringify(
  {
    code: "FEDERAL_BOARD_2025",
    name: "Federal Board of Intermediate and Secondary Education",
    country: "Pakistan",
    region: "Islamabad Capital Territory",
    provenance: {
      sourceName: "National Curriculum for Physics (Grades IX-X) 2024-2025",
      sourceUrl: "https://fbise.edu.pk/curriculum/physics-grade-9-2025.pdf",
      sourceDocumentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      officialPublicationDate: "2024-06-15",
      publisher: "National Book Foundation / Federal Ministry of Education",
      importedBy: "admin-curriculum-officer",
      verificationStatus: "VERIFIED",
      provenanceNotes: "Official authenticated syllabus gazette document for session 2024-2025.",
    },
    academicYears: [
      {
        code: "2024-2025",
        name: "Academic Session 2024-2025",
        classes: [
          {
            name: "Class 9 (SSC-I)",
            numericLevel: 9,
            subjects: [
              {
                code: "PHY-09",
                name: "Physics (SSC Part 1)",
                books: [
                  {
                    title: "Physics Class 9 - Authorized National Textbook",
                    publisher: "National Book Foundation",
                    version: "2025.1",
                    provenance: {
                      sourceName: "Physics IX Textbook ISBN 978-969-37-1234-5",
                      publisher: "National Book Foundation",
                      importedBy: "curriculum-officer",
                      verificationStatus: "VERIFIED",
                    },
                    chapters: [
                      {
                        chapterNumber: 1,
                        title: "Physical Quantities and Measurement",
                        orderIndex: 1,
                        topics: [
                          {
                            orderIndex: 1,
                            title: "Introduction to Physics & Base SI Units",
                            topicCode: "1.1",
                            learningOutcomes: [
                              "Define base and derived SI units",
                              "Express quantities using standard scientific notation",
                            ],
                          },
                          {
                            orderIndex: 2,
                            title: "Measuring Instruments & Vernier Callipers",
                            topicCode: "1.2",
                            learningOutcomes: [
                              "Explain zero error in Vernier Callipers and Screw Gauge",
                              "Calculate volume with proper significant figures",
                            ],
                          },
                        ],
                      },
                      {
                        chapterNumber: 2,
                        title: "Kinematics & Motion",
                        orderIndex: 2,
                        topics: [
                          {
                            orderIndex: 1,
                            title: "Translatory, Rotational, and Vibratory Motion",
                            topicCode: "2.1",
                            learningOutcomes: ["Differentiate scalar speed and vector velocity"],
                          },
                          {
                            orderIndex: 2,
                            title: "Equations of Uniformly Accelerated Motion",
                            topicCode: "2.2",
                            learningOutcomes: [
                              "Derive kinematic equations using speed-time graph",
                              "Solve numericals for free-fall under gravity",
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  null,
  2
);

export default function DataImportPage() {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [payloadText, setPayloadText] = useState(SAMPLE_CURRICULUM_JSON);
  const [preview, setPreview] = useState<any>(null);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoadingPreview(true);
    setErrorMsg(null);
    setCommitResult(null);

    try {
      const res = await fetch("/api/admin/data-import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payloadText, format }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate import preview");
      }
      setPreview(data.data);
    } catch (err: any) {
      setErrorMsg(err.message);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (!preview || !preview.valid) return;
    setLoadingCommit(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/data-import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payloadText, format, userId: "curriculum-admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to commit import");
      }
      setCommitResult(data.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingCommit(false);
    }
  };

  const loadSample = () => {
    setFormat("json");
    setPayloadText(SAMPLE_CURRICULUM_JSON);
    setPreview(null);
    setCommitResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Top Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Admin Control Center</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400">Curriculum Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-400" />
            <span>Educational Data Ingestion & Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Onboard official board syllabi, textbooks, and SLOs with cryptographic provenance verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSample}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Load Federal Board Sample</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg border border-rose-800 bg-rose-950/60 p-4 text-xs text-rose-300 flex items-start gap-2.5">
          <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-200">Import Validation Error</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {commitResult && (
        <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/60 p-4 text-xs text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-emerald-200">Curriculum Data Committed Successfully</div>
            <div>Batch ID: <span className="font-mono text-emerald-100">{commitResult.batchId}</span></div>
            <div>
              Committed {commitResult.importedCounts.boards} Board, {commitResult.importedCounts.books} Book,{" "}
              {commitResult.importedCounts.chapters} Chapters, and {commitResult.importedCounts.topics} Topics with verified provenance.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-indigo-400" />
                <span>Curriculum Payload (JSON or CSV)</span>
              </label>
              <div className="flex rounded-md border border-slate-700 bg-slate-950 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFormat("json")}
                  className={`px-2.5 py-1 rounded ${
                    format === "json" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`px-2.5 py-1 rounded ${
                    format === "csv" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            <textarea
              rows={18}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder={format === "json" ? "Paste curriculum JSON..." : "Paste CSV text..."}
            />

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handlePreview}
                disabled={loadingPreview}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                <FileCheck2 className={`h-4 w-4 ${loadingPreview ? "animate-spin" : ""}`} />
                <span>{loadingPreview ? "Validating Hierarchy..." : "Inspect & Preview Import"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Provenance */}
        <div className="lg:col-span-6 space-y-4">
          {!preview ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
              <Layers className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <div className="text-sm font-medium text-slate-400">No Preview Generated</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Paste your educational hierarchy payload on the left and click &quot;Inspect &amp; Preview Import&quot; to verify structural integrity and provenance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Provenance Badge Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Curriculum Provenance Verification</span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      preview.verificationStatus === "VERIFIED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : preview.verificationStatus === "NEEDS_VERIFICATION"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-rose-950 text-rose-300 border border-rose-800"
                    }`}
                  >
                    {preview.verificationStatus}
                  </span>
                </div>

                {/* Counts Grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                    <div className="text-slate-400 text-[10px]">Board</div>
                    <div className="text-base font-bold text-indigo-300">{preview.hierarchySummary.boards}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                    <div className="text-slate-400 text-[10px]">Classes</div>
                    <div className="text-base font-bold text-cyan-300">{preview.hierarchySummary.classes}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                    <div className="text-slate-400 text-[10px]">Chapters</div>
                    <div className="text-base font-bold text-amber-300">{preview.hierarchySummary.chapters}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                    <div className="text-slate-400 text-[10px]">Topics / SLOs</div>
                    <div className="text-base font-bold text-emerald-300">
                      {preview.hierarchySummary.topics} / {preview.hierarchySummary.learningOutcomes}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hierarchy Tree Preview */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 max-h-72 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <span>Detected Educational Structure</span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1">
                  <div className="text-indigo-400 font-semibold">
                    Board: {preview.hierarchyTree.boardName} ({preview.hierarchyTree.boardCode})
                  </div>
                  {preview.hierarchyTree.academicYears.map((y: any) => (
                    <div key={y.code} className="ml-3 border-l border-slate-800 pl-2">
                      <div className="text-slate-400">Session: {y.code}</div>
                      {y.classes.map((c: any) => (
                        <div key={c.numericLevel} className="ml-3 border-l border-slate-800 pl-2">
                          <div className="text-slate-300">Grade {c.numericLevel}: {c.name}</div>
                          {c.subjects.map((s: any) => (
                            <div key={s.code} className="ml-3 border-l border-slate-800 pl-2 text-emerald-400">
                              Subject: {s.name} ({s.code}) - {s.booksCount} books, {s.chaptersCount} chapters
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings / Errors */}
              {preview.errors.length > 0 && (
                <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-xs text-rose-300">
                  <div className="font-semibold text-rose-200 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span>{preview.errors.length} Blocking Validation Errors</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {preview.errors.map((e: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-mono text-rose-400">[{e.path}]</span>: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Commit Action */}
              <div className="pt-2">
                <button
                  onClick={handleCommit}
                  disabled={!preview.valid || loadingCommit}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Database className={`h-4 w-4 ${loadingCommit ? "animate-spin" : ""}`} />
                  <span>{loadingCommit ? "Persisting Curriculum Data..." : "Commit Verified Data to System"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  FileCheck,
  Search,
  BookOpen,
  Filter,
} from "lucide-react";

export default function DataQualityPage() {
  const [filter, setFilter] = useState<"ALL" | "UNVERIFIED" | "DATA_SOURCE_REQUIRED">("ALL");

  // Sample data quality audit items
  const auditItems = [
    {
      id: "DQ-001",
      entityType: "Syllabus",
      title: "Class 9 General Science 2025 Syllabus",
      provenanceStatus: "DATA_SOURCE_REQUIRED",
      issueDescription: "No official syllabus gazette document or SHA-256 hash attached.",
      remedy: "Upload verified PDF curriculum gazette from Federal / Punjab Board.",
      flaggedDate: "2026-09-26",
    },
    {
      id: "DQ-002",
      entityType: "Book",
      title: "Physics Class 9 Supplementary Exercises",
      provenanceStatus: "NEEDS_VERIFICATION",
      issueDescription: "Publisher specified without ISBN or ministry approval reference.",
      remedy: "Provide ISBN or official curriculum textbook notification number.",
      flaggedDate: "2026-09-25",
    },
    {
      id: "DQ-003",
      entityType: "Chapter",
      title: "Unit 3: Dynamics (Forces and Friction)",
      provenanceStatus: "VERIFIED",
      issueDescription: "Verified against National Book Foundation Textbook ISBN 978-969-37-1234-5.",
      remedy: "None required. Meets all verification requirements.",
      flaggedDate: "2026-09-24",
    },
  ];

  const filteredItems = auditItems.filter((item) => {
    if (filter === "ALL") return true;
    return item.provenanceStatus === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Header */}
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
            <span className="text-xs text-slate-400">Data Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            <span>Curriculum Quality &amp; Provenance Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit unverified curriculum records, missing learning outcomes (SLOs), and enforce anti-fabrication gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/data-import"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Import Verified Data</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400 mb-1">Verified Curriculum Records</div>
          <div className="text-2xl font-bold text-emerald-400">94.2%</div>
          <div className="text-[11px] text-slate-500 mt-1">Grounded with authentic textbook provenance</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400 mb-1">Needs Secondary Verification</div>
          <div className="text-2xl font-bold text-amber-400">1 Item</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending official gazette cross-check</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400 mb-1">Data Source Required (Blocked)</div>
          <div className="text-2xl font-bold text-rose-400">1 Item</div>
          <div className="text-[11px] text-slate-500 mt-1">Blocked from examination blueprint generator</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Filter className="h-4 w-4 text-indigo-400" />
            <span>Audit Findings</span>
          </div>

          <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded ${filter === "ALL" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter("DATA_SOURCE_REQUIRED")}
              className={`px-3 py-1 rounded ${filter === "DATA_SOURCE_REQUIRED" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
            >
              Blocked
            </button>
            <button
              onClick={() => setFilter("UNVERIFIED")}
              className={`px-3 py-1 rounded ${filter === "UNVERIFIED" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
            >
              Unverified
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-800 bg-slate-950 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500">{item.id}</span>
                  <span className="font-semibold text-slate-200">{item.title}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                    {item.entityType}
                  </span>
                </div>
                <div className="text-slate-400">{item.issueDescription}</div>
                <div className="text-[11px] text-slate-500">
                  <span className="text-indigo-400">Recommended Action:</span> {item.remedy}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    item.provenanceStatus === "VERIFIED"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : item.provenanceStatus === "NEEDS_VERIFICATION"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}
                >
                  {item.provenanceStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

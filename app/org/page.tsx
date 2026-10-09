"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building,
  PlusCircle,
  Printer,
  FileCheck2,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  ShieldCheck,
  Download,
  BookOpen,
} from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";

function OrganizationDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTestSeries() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/org/test-series");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to load test series.");
        }
        setTestSeries(json.data?.testSeries || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTestSeries();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 mb-2">
            <Building className="h-3.5 w-3.5" />
            <span>Institutional Testing Series & Examination Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Organization Examination Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build standardized institution test series, generate printable student test papers & complete teacher solution PDFs.
          </p>
        </div>

        <Link
          href="/org/create-exam"
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-600/25 hover:bg-amber-500 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create New Test Series</span>
        </Link>
      </div>

      {/* Plan Status Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Organization Subscription Active</h3>
            <p className="text-xs text-slate-300">
              Testing Series Tier: Unlimited Institutional Paper Generation & Solution Sheets
            </p>
          </div>
        </div>
        <div className="text-xs text-amber-300 font-medium">
          Pricing: <span className="font-bold text-white">Rs. 500/month</span> or <span className="font-bold text-emerald-300">Rs. 5,000/year (Rs. 1,000 Discount)</span>
        </div>
      </div>

      {/* Active Testing Series Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Testing Series</h2>
          <span className="text-xs text-slate-400">{testSeries.length} Total Series</span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : testSeries.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
            <Building className="mx-auto h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Testing Series Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
              Launch your first institutional test series for Class 9, 10, 1st Year or 2nd Year with automated printable test sheets and model solution PDFs.
            </p>
            <Link
              href="/org/create-exam"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create First Testing Series</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testSeries.map((series: any) => (
              <div
                key={series.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur flex flex-col justify-between hover:border-amber-500/40 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono text-[11px] text-amber-400">{series.boardCode}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      {series.className}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white line-clamp-2">{series.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{series.subjectCode}</span>
                    <span>•</span>
                    <span>{series.groupName || "Science"}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-400">{series.totalMarks} Marks</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
                  <Link
                    href={`/org/paper/${series.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-750 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Print Paper</span>
                  </Link>

                  <Link
                    href={`/org/solution/${series.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600/90 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Solution PDF</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizationDashboardPage() {
  return (
    <RouteGuard allowedRoles={["ORGANIZATION", "ADMIN"]} portalName="Organization Portal">
      <OrganizationDashboardContent />
    </RouteGuard>
  );
}

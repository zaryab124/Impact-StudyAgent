"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import PrintablePaper from "@/components/printable-paper";

export default function PrintPaperPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<any>(null);

  useEffect(() => {
    async function fetchPaper() {
      try {
        setLoading(true);
        setError(null);

        // Fetch paper details with teacher/exam solution content if available
        const res = await fetch(`/api/papers/${paperId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to load examination paper.");
        }

        setPaper(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load examination paper.");
      } finally {
        setLoading(false);
      }
    }

    if (paperId) {
      fetchPaper();
    }
  }, [paperId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <span>Generating organization test paper layout...</span>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-rose-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Paper Not Found</h2>
        <p className="mt-1 text-xs text-rose-300">{error || "Could not retrieve the specified paper."}</p>
        <Link
          href={`/student/paper/${paperId}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Paper Preview</span>
        </Link>
      </div>
    );
  }

  return (
    <PrintablePaper
      paper={paper}
      onClose={() => router.push(`/student/paper/${paperId}`)}
    />
  );
}

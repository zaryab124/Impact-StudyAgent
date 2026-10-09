"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  GraduationCap,
  Users,
  Eye,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";

export default function AdminApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/approvals", {
        headers: {
          "x-user-role": "ADMIN",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to load pending registrations.");
      }
      setApprovals(data.data?.pendingApprovals || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (subscriptionId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(subscriptionId);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify({ subscriptionId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Action failed.");
      }

      // Refresh list
      await fetchApprovals();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Administrator Security Gate & Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Subscription & Registration Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verify payment slips, approve Student (Rs. 500/yr) & Organization accounts, and release portal credentials.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <p>{error}</p>
        </div>
      )}

      {/* Approvals Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Pending Approval Queue</h2>
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
            {approvals.length} Pending Verification
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-3" />
            <p className="text-sm font-semibold text-slate-200">No Pending Registrations</p>
            <p className="text-xs text-slate-500 mt-1">
              All student and organization registration receipts have been reviewed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Applicant / Institution</th>
                  <th className="py-3 px-4">Plan & Amount</th>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Parent Account (For Student)</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {approvals.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-850/40">
                    <td className="py-4 px-4">
                      {sub.role === "STUDENT" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-300 border border-indigo-500/30">
                          <GraduationCap className="h-3 w-3" />
                          <span>Student</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                          <Building className="h-3 w-3" />
                          <span>Organization</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-sm">
                          {sub.user?.name || sub.organization?.name || "Candidate"}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {sub.user?.email || sub.organization?.contactEmail}
                        </div>
                        {sub.organization && (
                          <div className="text-amber-400 text-[10px] font-semibold">
                            Org: {sub.organization.name} ({sub.organization.code})
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-emerald-400 text-sm">
                          Rs. {sub.amount}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Plan: {sub.plan}
                        </div>
                        {sub.discountApplied > 0 && (
                          <span className="text-[10px] text-emerald-300 block font-semibold">
                            Discount: -Rs. {sub.discountApplied}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {sub.receiptUrl ? (
                        <button
                          onClick={() => setSelectedReceipt(sub.receiptUrl)}
                          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-400" />
                          <span>View Slip</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No file</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {sub.parentAccount ? (
                        <div className="rounded bg-slate-950/70 p-2 border border-slate-800 text-[11px] space-y-0.5">
                          <div className="text-slate-400">
                            Username: <span className="font-mono text-white font-semibold">{sub.parentAccount.parentUsername}</span>
                          </div>
                          <div className="text-slate-400">
                            Password: <span className="font-mono text-emerald-400">{sub.parentAccount.temporaryPassword}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">N/A (Organization)</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(sub.id, "APPROVE")}
                          disabled={actionLoading === sub.id}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 text-xs transition-all"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleAction(sub.id, "REJECT")}
                          disabled={actionLoading === sub.id}
                          className="flex items-center gap-1 rounded-lg border border-rose-900 bg-rose-950/50 px-2.5 py-1.5 font-semibold text-rose-300 hover:bg-rose-900/60 disabled:opacity-50 text-xs transition-all"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white">Payment Deposit Receipt</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-lg bg-slate-950 p-4 border border-slate-800 flex items-center justify-center">
              {selectedReceipt.startsWith("data:image") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedReceipt}
                  alt="Payment Receipt Slip"
                  className="max-h-[50vh] object-contain rounded"
                />
              ) : (
                <div className="text-center p-8 text-xs text-slate-300 space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-indigo-400" />
                  <p className="font-semibold">Document / Receipt Slip Record</p>
                  <p className="font-mono text-slate-500 break-all">{selectedReceipt}</p>
                </div>
              )}
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

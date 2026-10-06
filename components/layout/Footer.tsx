import React from "react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-200">
              AI Live Paper Generator — Phase 1 Foundation & Architecture
            </p>
            <p className="text-xs text-slate-500">
              PostgreSQL • pgvector • Prisma • TypeScript • Next.js App Router • Provider Abstraction
            </p>
          </div>
          <div className="text-xs text-slate-500 text-center sm:text-right">
            <span>Deterministic 33% Difficulty Engine • Zero LLM Hallucinations</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

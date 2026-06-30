"use client";

import { useState } from "react";
import type { PreflightResult } from "@/lib/brand-kit";

const STATUS_STYLES = {
  pass: { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-400", label: "Pass" },
  review: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400", label: "Review" },
  blocked: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400", label: "Blocked" },
};

export function PreflightCard({ results }: { results: PreflightResult[] }) {
  const [filter, setFilter] = useState<"all" | "review" | "blocked">("all");

  const issueResults = results.filter(r => r.status !== "pass");
  const filtered = filter === "all" ? issueResults : issueResults.filter(r => r.status === filter);
  const counts = {
    pass: results.filter(r => r.status === "pass").length,
    review: results.filter(r => r.status === "review").length,
    blocked: results.filter(r => r.status === "blocked").length,
  };

  if (counts.review === 0 && counts.blocked === 0) {
    return (
      <div className="mt-8 border border-emerald-500/40 bg-emerald-500/10 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#10003;</span>
          <div>
            <h2 className="text-lg font-bold text-emerald-400">Brand Preflight Passed</h2>
            <p className="text-sm text-slate-400">All {counts.pass} creatives clear brand guardrails. Ready to launch.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border border-slate-700 bg-slate-800/80 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Brand Preflight</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-400 font-semibold">{counts.pass} pass</span>
          {counts.review > 0 && (
            <>
              <span className="text-slate-500">&#183;</span>
              <span className="text-amber-400 font-semibold">{counts.review} review</span>
            </>
          )}
          {counts.blocked > 0 && (
            <>
              <span className="text-slate-500">&#183;</span>
              <span className="text-red-400 font-semibold">{counts.blocked} blocked</span>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-4">Flagged creatives based on your Brand Kit rules.</p>

      <div className="flex gap-2 mb-4">
        {(["all", "review", "blocked"] as const).map((f) => {
          const count = f === "all" ? issueResults.length : counts[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {f === "all" ? `Issues (${count})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${count})`}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.map((item, i) => {
          const style = STATUS_STYLES[item.status];
          return (
            <div key={i} className={`p-3 rounded-lg border ${style.border} ${style.bg}`}>
              <div className="flex items-start gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${style.text} bg-slate-900/50`}>
                  {style.label}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-white">{item.text}</p>
                  <span className="text-xs text-slate-500">{item.angle} &#183; {item.type}</span>
                  {item.issues.map((issue, j) => (
                    <p key={j} className="text-xs text-slate-400 mt-1 italic">&#9888; {issue}</p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

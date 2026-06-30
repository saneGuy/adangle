"use client";

import { useState } from "react";
import type { ScoredCreative } from "@/lib/shortlist";
import { CopyButton } from "./CopyButton";

const VERDICT_STYLES = {
  launch: { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-400", label: "Launch" },
  edit: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400", label: "Needs Edit" },
  skip: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400", label: "Skip" },
};

export function ShortlistCard({ scored }: { scored: ScoredCreative[] }) {
  const [filter, setFilter] = useState<"all" | "launch" | "edit" | "skip">("all");

  const filtered = filter === "all" ? scored : scored.filter(s => s.verdict === filter);
  const counts = {
    all: scored.length,
    launch: scored.filter(s => s.verdict === "launch").length,
    edit: scored.filter(s => s.verdict === "edit").length,
    skip: scored.filter(s => s.verdict === "skip").length,
  };

  return (
    <div className="mt-8 border border-slate-700 bg-slate-800/80 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Launch Shortlist</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-400 font-semibold">{counts.launch} ready</span>
          <span className="text-slate-500">·</span>
          <span className="text-amber-400 font-semibold">{counts.edit} need edits</span>
          {counts.skip > 0 && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-red-400 font-semibold">{counts.skip} skip</span>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-4">Creatives ranked by launch-readiness. Focus on the green ones first.</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["all", "launch", "edit", "skip"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            {f === "all" ? `All (${counts.all})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Scored creatives list */}
      <div className="space-y-2">
        {filtered.map((item, i) => {
          const style = VERDICT_STYLES[item.verdict];
          return (
            <div key={`${item.angle}-${item.type}-${item.index}-${i}`} className={`flex items-start gap-3 p-3 rounded-lg border ${style.border} ${style.bg}`}>
              <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${style.text} bg-slate-900/50`}>
                {style.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{item.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{item.angle}</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{item.platformSlot}</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className={`text-xs font-mono ${item.overLimit ? "text-red-400" : "text-green-400"}`}>
                    {item.charCount}/{item.charLimit}
                  </span>
                  {item.groundedIn.length > 0 && (
                    <>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{item.groundedIn.join(", ")}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 italic">{item.reason}</p>
              </div>
              <CopyButton text={item.text} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

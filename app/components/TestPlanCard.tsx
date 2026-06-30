"use client";

import type { TestPlan } from "@/lib/test-plan";

export function TestPlanCard({ plan }: { plan: TestPlan }) {
  return (
    <div className="mt-8 border border-slate-700 bg-slate-800/80 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Launch Test Plan</h2>
      <p className="text-sm text-slate-400 mb-5">{plan.timeline}</p>

      {/* Campaign Structure */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Campaign Structure</h3>
        <p className="text-xs text-slate-500 mb-3 font-mono">{plan.campaignName}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plan.adSets.map((adSet) => (
            <div key={adSet.angle} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{adSet.angle}</span>
                <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded">{adSet.budgetPercent}% budget</span>
              </div>
              <p className="text-xs text-slate-400 mb-2 italic">{adSet.hypothesis}</p>
              <div className="text-xs text-slate-500">
                <span>{adSet.headlines.length} headlines · {adSet.bodyCopy.length} body · CTA: {adSet.cta}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">{plan.totalBudgetNote}</p>
      </div>

      {/* KPIs */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">KPI Guardrails</h3>
        <div className="flex flex-wrap gap-3">
          {plan.kpis.map((kpi) => (
            <div key={kpi.metric} className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-400">{kpi.metric}</span>
              <span className="text-sm font-semibold text-emerald-400 ml-2">{kpi.target}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Rules */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">7-Day Decision Rules</h3>
        <div className="space-y-2">
          {plan.decisionRules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-mono text-blue-400 mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-sm text-slate-300">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

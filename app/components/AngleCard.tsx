"use client";

import type { Angle, Claim } from "@/lib/schemas";
import { CopyButton } from "./CopyButton";

function CharBadge({ text, max }: { text: string; max: number }) {
  const len = text.length;
  const ok = len <= max;
  return (
    <span className={`text-xs font-mono ${ok ? "text-green-400" : "text-red-400"}`}>
      {len}/{max}
    </span>
  );
}

const ANGLE_COLORS: Record<string, { border: string; accent: string; badge: string }> = {
  Urgency: { border: "border-red-500/60", accent: "text-red-400", badge: "bg-red-500/20" },
  "Social Proof": { border: "border-blue-500/60", accent: "text-blue-400", badge: "bg-blue-500/20" },
  Curiosity: { border: "border-purple-500/60", accent: "text-purple-400", badge: "bg-purple-500/20" },
  "Pain/Solution": { border: "border-orange-500/60", accent: "text-orange-400", badge: "bg-orange-500/20" },
  Authority: { border: "border-emerald-500/60", accent: "text-emerald-400", badge: "bg-emerald-500/20" },
  FOMO: { border: "border-yellow-500/60", accent: "text-yellow-400", badge: "bg-yellow-500/20" },
};

const DEFAULT_COLORS = { border: "border-slate-600", accent: "text-slate-400", badge: "bg-slate-700" };

export function AngleCard({
  angle,
  claims,
}: {
  angle: Angle;
  claims: Claim[];
}) {
  const colors = ANGLE_COLORS[angle.name] || DEFAULT_COLORS;
  const claimMap = Object.fromEntries(claims.map((c) => [c.id, c.text]));

  return (
    <div className={`border ${colors.border} bg-slate-800/80 rounded-xl p-5`}>
      <h3 className={`text-lg font-bold mb-4 ${colors.accent}`}>{angle.name}</h3>

      {/* Headlines */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Headlines</h4>
        {angle.headlines.map((h, i) => (
          <div key={i} className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{h.text}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-500">{h.platformSlot}</span>
                <span className="text-xs text-slate-600">·</span>
                <CharBadge text={h.text} max={40} />
              </div>
              {h.groundedIn.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {h.groundedIn.map((id) => (
                    <span key={id} className={`text-xs ${colors.badge} ${colors.accent} px-1.5 py-0.5 rounded`} title={claimMap[id]}>
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <CopyButton text={h.text} />
          </div>
        ))}
      </div>

      {/* Body Copy */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Body Copy</h4>
        {angle.bodyCopy.map((b, i) => (
          <div key={i} className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <p className="text-sm text-slate-200">{b.text}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-500">{b.platformSlot}</span>
                <span className="text-xs text-slate-600">·</span>
                <CharBadge text={b.text} max={125} />
              </div>
              {b.groundedIn.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {b.groundedIn.map((id) => (
                    <span key={id} className={`text-xs ${colors.badge} ${colors.accent} px-1.5 py-0.5 rounded`} title={claimMap[id]}>
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <CopyButton text={b.text} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between border-t border-slate-700 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase">CTA:</span>
          <span className="text-sm font-semibold text-white">{angle.cta}</span>
          <span className="text-xs text-slate-600">·</span>
          <CharBadge text={angle.cta} max={25} />
        </div>
        <CopyButton text={angle.cta} />
      </div>
    </div>
  );
}

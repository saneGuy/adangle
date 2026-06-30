"use client";

import type { Angle, Claim } from "@/lib/schemas";
import { CopyButton } from "./CopyButton";

const ANGLE_COLORS: Record<string, string> = {
  Urgency: "border-red-400 bg-red-50",
  "Social Proof": "border-blue-400 bg-blue-50",
  Curiosity: "border-purple-400 bg-purple-50",
  "Pain/Solution": "border-orange-400 bg-orange-50",
  Authority: "border-green-400 bg-green-50",
  FOMO: "border-yellow-400 bg-yellow-50",
};

export function AngleCard({
  angle,
  claims,
}: {
  angle: Angle;
  claims: Claim[];
}) {
  const colorClass = ANGLE_COLORS[angle.name] || "border-gray-400 bg-gray-50";
  const claimMap = Object.fromEntries(claims.map((c) => [c.id, c.text]));

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClass}`}>
      <h3 className="text-lg font-bold mb-3">{angle.name}</h3>

      {/* Headlines */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Headlines</h4>
        {angle.headlines.map((h, i) => (
          <div key={i} className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <p className="text-sm font-medium">{h.text}</p>
              <span className="text-xs text-gray-400">{h.platformSlot}</span>
              {h.groundedIn.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {h.groundedIn.map((id) => (
                    <span key={id} className="text-xs bg-white/60 px-1 rounded" title={claimMap[id]}>
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
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Body Copy</h4>
        {angle.bodyCopy.map((b, i) => (
          <div key={i} className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <p className="text-sm">{b.text}</p>
              <span className="text-xs text-gray-400">{b.platformSlot}</span>
              {b.groundedIn.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {b.groundedIn.map((id) => (
                    <span key={id} className="text-xs bg-white/60 px-1 rounded" title={claimMap[id]}>
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
      <div className="flex items-center justify-between border-t pt-2">
        <div>
          <span className="text-xs text-gray-500 uppercase">CTA: </span>
          <span className="text-sm font-semibold">{angle.cta}</span>
        </div>
        <CopyButton text={angle.cta} />
      </div>
    </div>
  );
}

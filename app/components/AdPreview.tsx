"use client";

import { useState } from "react";
import type { Angle } from "@/lib/schemas";

function MetaFeedPreview({ angle, productName }: { angle: Angle; productName: string }) {
  const headline = angle.headlines[0]?.text || "";
  const body = angle.bodyCopy[0]?.text || "";
  const cta = angle.cta;

  return (
    <div className="bg-white rounded-lg overflow-hidden w-full max-w-[320px] shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {productName.charAt(0)}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">{productName}</p>
          <p className="text-[10px] text-gray-500">Sponsored · 🌐</p>
        </div>
      </div>
      {/* Body text */}
      <div className="px-3 pb-2">
        <p className="text-xs text-gray-800 leading-relaxed">{body}</p>
      </div>
      {/* Image placeholder */}
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 h-40 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Your creative image</span>
      </div>
      {/* Link preview */}
      <div className="bg-gray-100 px-3 py-2 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500 uppercase truncate">{productName.toLowerCase()}.com</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{headline}</p>
        </div>
        <button className="ml-2 px-3 py-1.5 bg-gray-200 text-gray-800 text-xs font-semibold rounded shrink-0">
          {cta}
        </button>
      </div>
      {/* Engagement bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-200 text-[10px] text-gray-500">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗ Share</span>
      </div>
    </div>
  );
}

function GoogleRSAPreview({ angle, productName }: { angle: Angle; productName: string }) {
  const h1 = angle.headlines[0]?.text || "";
  const h2 = angle.headlines[1]?.text || "";
  const body = angle.bodyCopy[0]?.text || "";

  return (
    <div className="w-full max-w-[400px] font-sans">
      <div className="space-y-0.5">
        <p className="text-[11px] text-slate-400">Ad · {productName.toLowerCase()}.com</p>
        <p className="text-blue-400 text-base font-medium leading-tight hover:underline cursor-pointer">
          {h1} | {h2}
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export function AdPreviewSection({ angles, productName }: { angles: Angle[]; productName: string }) {
  const [selectedAngle, setSelectedAngle] = useState(0);
  const angle = angles[selectedAngle];
  if (!angle) return null;

  return (
    <div className="mt-8 border border-slate-700 bg-slate-800/80 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Ad Previews</h2>
      <p className="text-sm text-slate-400 mb-4">See how your creatives look in real ad formats.</p>

      {/* Angle selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {angles.map((a, i) => (
          <button
            key={a.name}
            onClick={() => setSelectedAngle(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === selectedAngle
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Meta Feed Ad</h3>
          <MetaFeedPreview angle={angle} productName={productName} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Google Search Ad (RSA)</h3>
          <GoogleRSAPreview angle={angle} productName={productName} />
        </div>
      </div>
    </div>
  );
}

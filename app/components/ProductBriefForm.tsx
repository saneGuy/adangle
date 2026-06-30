"use client";

import { useState, useEffect } from "react";
import type { ProductBrief, Claim } from "@/lib/schemas";

export function ProductBriefForm({
  initial,
  onGenerate,
  loading,
}: {
  initial?: ProductBrief;
  onGenerate: (brief: ProductBrief) => void;
  loading: boolean;
}) {
  const [productName, setProductName] = useState(initial?.productName || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [features, setFeatures] = useState(initial?.features?.join("\n") || "");
  const [pricing, setPricing] = useState(initial?.pricing || "");
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience || "");
  const [claimsText, setClaimsText] = useState(
    initial?.claims?.map((c) => c.text).join("\n") || ""
  );

  useEffect(() => {
    if (initial) {
      setProductName(initial.productName || "");
      setDescription(initial.description || "");
      setFeatures(initial.features?.join("\n") || "");
      setPricing(initial.pricing || "");
      setTargetAudience(initial.targetAudience || "");
      setClaimsText(initial.claims?.map((c) => c.text).join("\n") || "");
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const claimLines = claimsText.split("\n").filter((l) => l.trim());
    const claims: Claim[] = claimLines.map((text, i) => ({
      id: `c${i + 1}`,
      text: text.trim(),
    }));

    onGenerate({
      productName,
      description,
      features: features.split("\n").filter((f) => f.trim()),
      pricing,
      targetAudience: targetAudience || "general",
      claims,
    });
  };

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div>
        <h2 className="text-xl font-bold text-white">Product Brief</h2>
        <p className="text-sm text-slate-400 mt-1">Review and edit the extracted information before generating creatives.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1.5">
          Product Name <span className="text-red-400">*</span>
        </label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1.5">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1.5">Features (one per line)</label>
        <textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          className={inputClass}
          rows={4}
          placeholder={"Fast processing\nEasy integration\n24/7 support"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1.5">Pricing</label>
          <input
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
            className={inputClass}
            placeholder="$49/month"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1.5">Target Audience</label>
          <input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className={inputClass}
            placeholder="Small business owners"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1.5">Claims (one per line)</label>
        <textarea
          value={claimsText}
          onChange={(e) => setClaimsText(e.target.value)}
          className={inputClass}
          rows={4}
          placeholder={"Saves 10 hours per week\nUsed by 5000+ companies\n99.9% uptime"}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !productName.trim() || !description.trim()}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating Creatives...
          </span>
        ) : "Generate Creatives"}
      </button>
    </form>
  );
}

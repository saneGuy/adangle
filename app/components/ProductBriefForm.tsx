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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold">Product Brief</h2>
      <p className="text-sm text-gray-500">Review and edit the extracted information before generating creatives.</p>

      <div>
        <label className="block text-sm font-medium mb-1">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Features (one per line)</label>
        <textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          rows={3}
          placeholder={"Fast processing\nEasy integration\n24/7 support"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pricing</label>
          <input
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="$49/month"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Audience</label>
          <input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Small business owners"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Claims (one per line)</label>
        <textarea
          value={claimsText}
          onChange={(e) => setClaimsText(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          rows={3}
          placeholder={"Saves 10 hours per week\nUsed by 5000+ companies\n99.9% uptime"}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !productName.trim() || !description.trim()}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating Creatives..." : "Generate Creatives"}
      </button>
    </form>
  );
}

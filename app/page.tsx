"use client";

import { useState } from "react";
import type { ProductBrief, Angle, Claim } from "@/lib/schemas";
import { DEMO_BRIEF, DEMO_ANGLES } from "@/lib/demo-data";
import { UrlInput } from "./components/UrlInput";
import { ProductBriefForm } from "./components/ProductBriefForm";
import { AngleCard } from "./components/AngleCard";
import { ExportButtons } from "./components/ExportButtons";

type Step = "input" | "brief" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [brief, setBrief] = useState<ProductBrief | undefined>();
  const [angles, setAngles] = useState<Angle[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState(false);

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setError("");
    setScrapeError(false);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        setScrapeError(true);
        setStep("brief");
      } else {
        setBrief(data as ProductBrief);
        setStep("brief");
      }
    } catch {
      setScrapeError(true);
      setStep("brief");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (editedBrief: ProductBrief) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productBrief: editedBrief }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.message || "Generation failed");
      } else {
        setBrief(editedBrief);
        setAngles(data.angles);
        setStep("results");
      }
    } catch {
      setError("Failed to generate creatives. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("input");
    setBrief(undefined);
    setAngles([]);
    setError("");
    setScrapeError(false);
  };

  const claims: Claim[] = brief?.claims || [];

  return (
    <main className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Ad<span className="text-blue-400">Angle</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Paste a product URL. Get ad creatives across 6 psychological angles.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: URL Input */}
        {step === "input" && (
          <div className="flex flex-col items-center gap-5">
            <UrlInput onAnalyze={handleAnalyze} loading={loading} />
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setBrief(DEMO_BRIEF);
                  setAngles(DEMO_ANGLES);
                  setStep("results");
                }}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 text-sm transition-colors"
              >
                Try Demo
              </button>
              <button
                onClick={() => setStep("brief")}
                className="text-sm text-slate-400 underline hover:text-slate-200 transition-colors"
              >
                Or enter manually
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Product Brief */}
        {step === "brief" && (
          <div className="flex flex-col items-center gap-4">
            {scrapeError && (
              <div className="max-w-2xl w-full p-4 bg-yellow-900/40 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                Could not scrape the URL. Please enter product details manually.
              </div>
            )}
            <ProductBriefForm
              initial={brief}
              onGenerate={handleGenerate}
              loading={loading}
            />
            <button
              onClick={handleReset}
              className="text-sm text-slate-400 underline hover:text-slate-200 transition-colors"
            >
              Start over
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Creatives for {brief?.productName}
                </h2>
                {claims.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {claims.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded"
                        title={c.text}
                      >
                        {c.id}: {c.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 items-center">
                <ExportButtons angles={angles} />
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                >
                  New Analysis
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {angles.map((angle) => (
                <AngleCard key={angle.name} angle={angle} claims={claims} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

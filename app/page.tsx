"use client";

import { useState } from "react";
import type { ProductBrief, Angle, Claim } from "@/lib/schemas";
import { DEMO_BRIEF, DEMO_ANGLES } from "@/lib/demo-data";
import { UrlInput } from "./components/UrlInput";
import { ProductBriefForm } from "./components/ProductBriefForm";
import { AngleCard } from "./components/AngleCard";
import { ExportButtons } from "./components/ExportButtons";
import { generateTestPlan } from "@/lib/test-plan";
import { TestPlanCard } from "./components/TestPlanCard";
import { AdPreviewSection } from "./components/AdPreview";

type Step = "input" | "brief" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [brief, setBrief] = useState<ProductBrief | undefined>();
  const [angles, setAngles] = useState<Angle[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [scrapeError, setScrapeError] = useState(false);
  const [model, setModel] = useState("claude-haiku-4-5-20251001");

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setLoadingStatus("Fetching page...");
    setError("");
    setScrapeError(false);
    try {
      setLoadingStatus("Scraping and extracting product info...");
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, model }),
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
    setLoadingStatus("Generating creatives across 6 angles...");
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productBrief: editedBrief, model }),
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
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center gap-5 mb-16">
              <UrlInput onAnalyze={handleAnalyze} loading={loading} />
              {loading && loadingStatus && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {loadingStatus}
                </div>
              )}
              {/* Model selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Model:</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="claude-haiku-4-5-20251001">Haiku 4.5 (fast)</option>
                  <option value="claude-sonnet-4-6">Sonnet 4.6 (balanced)</option>
                  <option value="claude-opus-4-6">Opus 4.6 (best quality)</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setBrief(DEMO_BRIEF);
                    setAngles(DEMO_ANGLES);
                    setStep("results");
                  }}
                  className="px-5 py-2.5 border border-blue-500 text-blue-400 rounded-lg font-medium hover:bg-blue-500/10 text-sm transition-colors"
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

            {/* How it works */}
            <div className="w-full max-w-4xl">
              <h2 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Paste a URL", desc: "Drop any product or landing page URL. We scrape and extract claims, features, and audience." },
                  { step: "2", title: "Generate creatives", desc: "AI creates 30 ad variants across 6 psychological angles with platform-ready formatting." },
                  { step: "3", title: "Launch with a plan", desc: "Get a test plan with campaign structure, KPIs, and 7-day decision rules. Export as CSV." },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500/50 text-blue-400 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                      {item.step}
                    </div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Creatives for {brief?.productName}
                {claims.length > 0 && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({claims.length} source claims)
                  </span>
                )}
              </h2>
              <div className="flex gap-2 items-center">
                <ExportButtons angles={angles} />
                <button
                  onClick={handleReset}
                  className="px-3 py-2 border border-slate-600 text-slate-300 rounded-lg text-xs hover:bg-slate-800 transition-colors"
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
            {angles.length > 0 && brief && (
              <TestPlanCard plan={generateTestPlan(brief, angles)} />
            )}
            {angles.length > 0 && brief && (
              <AdPreviewSection angles={angles} productName={brief.productName} />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 py-6 text-center">
        <p className="text-slate-500 text-xs">
          Built for the It's Today Media Build Challenge. Powered by Claude API.
        </p>
      </footer>
    </main>
  );
}

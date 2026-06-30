"use client";

import { useState } from "react";
import type { ProductBrief, Angle, Claim } from "@/lib/schemas";
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
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AdAngle</h1>
          <p className="text-gray-500">
            Paste a product URL. Get ad creatives across 6 psychological angles.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: URL Input */}
        {step === "input" && (
          <div className="flex flex-col items-center gap-4">
            <UrlInput onAnalyze={handleAnalyze} loading={loading} />
            <button
              onClick={() => setStep("brief")}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Or enter product details manually
            </button>
          </div>
        )}

        {/* Step 2: Product Brief */}
        {step === "brief" && (
          <div className="flex flex-col items-center gap-4">
            {scrapeError && (
              <div className="max-w-2xl w-full p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
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
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Start over
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Creatives for {brief?.productName}
                </h2>
                {claims.length > 0 && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {claims.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs bg-gray-100 px-2 py-0.5 rounded"
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
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  New Analysis
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

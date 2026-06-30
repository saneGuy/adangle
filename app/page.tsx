"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ProductBrief, Angle, Claim } from "@/lib/schemas";
import { DEMO_BRIEF, DEMO_ANGLES } from "@/lib/demo-data";
import { UrlInput } from "./components/UrlInput";
import { ProductBriefForm } from "./components/ProductBriefForm";
import { AngleCard } from "./components/AngleCard";
import { ExportButtons } from "./components/ExportButtons";
import { generateTestPlan } from "@/lib/test-plan";
import { TestPlanCard } from "./components/TestPlanCard";
import { AdPreviewSection } from "./components/AdPreview";
import { scoreCreatives } from "@/lib/shortlist";
import { ShortlistCard } from "./components/ShortlistCard";
import { type AdAngleProject } from "@/lib/db";
import { saveProject, loadProject, getLastProjectId, createNewProject } from "@/lib/project-store";
import { ProjectSidebar } from "./components/ProjectSidebar";

type Step = "input" | "brief" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [brief, setBrief] = useState<ProductBrief | undefined>();
  const [angles, setAngles] = useState<Angle[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [scrapeError, setScrapeError] = useState(false);
  const [extractModel, setExtractModel] = useState("claude-haiku-4-5-20251001");
  const [generateModel, setGenerateModel] = useState("gpt-4o");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "">("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRestored = useRef(false);

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    if (!currentProjectId) {
      const newProject = createNewProject();
      setCurrentProjectId(newProject.id);
    }
    setLoadingStatus("Fetching page...");
    setError("");
    setScrapeError(false);
    try {
      setLoadingStatus("Scraping and extracting product info...");
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, model: extractModel }),
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
    if (!currentProjectId) {
      const newProject = createNewProject();
      setCurrentProjectId(newProject.id);
    }
    setLoadingStatus("Generating creatives across 6 angles...");
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productBrief: editedBrief, model: generateModel }),
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
    setCurrentProjectId(null);
    setSaveStatus("");
  };

  const handleLoadProject = (project: AdAngleProject) => {
    setCurrentProjectId(project.id);
    setBrief(project.brief || undefined);
    setAngles(project.angles);
    setExtractModel(project.extractModel);
    setGenerateModel(project.generateModel);
    setStep(project.step);
    setError("");
    setScrapeError(false);
    isRestored.current = true;
  };

  const handleNewProject = () => {
    handleReset();
    const newProject = createNewProject();
    setCurrentProjectId(newProject.id);
  };

  // Autosave
  const doSave = useCallback(async () => {
    if (!isRestored.current || !currentProjectId) return;
    setSaveStatus("saving");
    try {
      await saveProject({
        id: currentProjectId,
        name: brief?.productName || "Untitled Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        brief: brief || null,
        angles,
        extractModel,
        generateModel,
        step,
        schemaVersion: 1,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [currentProjectId, brief, angles, extractModel, generateModel, step]);

  useEffect(() => {
    if (!isRestored.current) return;
    const timer = setTimeout(doSave, 750);
    return () => clearTimeout(timer);
  }, [doSave]);

  // Restore last project on mount
  useEffect(() => {
    const restore = async () => {
      const lastId = getLastProjectId();
      if (lastId) {
        const project = await loadProject(lastId);
        if (project) {
          setCurrentProjectId(project.id);
          setBrief(project.brief || undefined);
          setAngles(project.angles);
          setExtractModel(project.extractModel);
          setGenerateModel(project.generateModel);
          setStep(project.step);
        }
      }
      isRestored.current = true;
    };
    restore();
  }, []);

  const claims: Claim[] = brief?.claims || [];

  return (
    <main className="min-h-screen bg-slate-900">
      <ProjectSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentProjectId={currentProjectId}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
      />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            title="Projects"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
              Ad<span className="text-blue-400">Angle</span>
            </h1>
            <p className="text-slate-300 text-lg">
              Paste a product URL. Get ad creatives across 6 psychological angles.
            </p>
          </div>
          <div className="w-9 flex justify-end">
            {saveStatus === "saving" && <span className="text-xs text-slate-500">Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs text-green-500">Saved</span>}
            {saveStatus === "error" && <span className="text-xs text-red-500">Save failed</span>}
          </div>
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
              {/* Model selectors */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">Extract:</label>
                  <select
                    value={extractModel}
                    onChange={(e) => setExtractModel(e.target.value)}
                    className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <optgroup label="Claude">
                      <option value="claude-haiku-4-5-20251001">Haiku 4.5 (fast)</option>
                      <option value="claude-sonnet-4-6">Sonnet 4.6</option>
                      <option value="claude-opus-4-6">Opus 4.6</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option value="gpt-4o-mini">GPT-4o Mini (fast)</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="o3-mini">o3-mini</option>
                    </optgroup>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">Generate:</label>
                  <select
                    value={generateModel}
                    onChange={(e) => setGenerateModel(e.target.value)}
                    className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <optgroup label="Claude">
                      <option value="claude-haiku-4-5-20251001">Haiku 4.5 (fast)</option>
                      <option value="claude-sonnet-4-6">Sonnet 4.6</option>
                      <option value="claude-opus-4-6">Opus 4.6</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option value="gpt-4o-mini">GPT-4o Mini (fast)</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="o3-mini">o3-mini</option>
                    </optgroup>
                  </select>
                </div>
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
              <ShortlistCard scored={scoreCreatives(angles, brief)} />
            )}
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

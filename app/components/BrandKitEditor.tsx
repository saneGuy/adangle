"use client";

import { useState } from "react";
import type { BrandKit } from "@/lib/brand-kit";

export function BrandKitEditor({
  brandKit,
  onSave,
  onClose,
}: {
  brandKit: BrandKit;
  onSave: (kit: BrandKit) => void;
  onClose: () => void;
}) {
  const [brandVoice, setBrandVoice] = useState(brandKit.brandVoice);
  const [targetAudience, setTargetAudience] = useState(brandKit.targetAudience);
  const [bannedWords, setBannedWords] = useState(brandKit.bannedWords.join("\n"));
  const [requiredDisclaimers, setRequiredDisclaimers] = useState(brandKit.requiredDisclaimers.join("\n"));
  const [approvedCTAs, setApprovedCTAs] = useState(brandKit.approvedCTAs.join("\n"));
  const [complianceNotes, setComplianceNotes] = useState(brandKit.complianceNotes);

  const handleSave = () => {
    onSave({
      brandVoice,
      targetAudience,
      bannedWords: bannedWords.split("\n").map(s => s.trim()).filter(Boolean),
      requiredDisclaimers: requiredDisclaimers.split("\n").map(s => s.trim()).filter(Boolean),
      approvedCTAs: approvedCTAs.split("\n").map(s => s.trim()).filter(Boolean),
      complianceNotes,
    });
    onClose();
  };

  const inputClass = "w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-96 bg-slate-800 border-l border-slate-700 z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Brand Kit</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Brand Voice</label>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Professional, confident, no jargon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Target Audience</label>
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className={inputClass}
              placeholder="SaaS founders, 25-45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Banned Words <span className="text-slate-500 font-normal">(one per line)</span>
            </label>
            <textarea
              value={bannedWords}
              onChange={(e) => setBannedWords(e.target.value)}
              className={inputClass}
              rows={3}
              placeholder={"cheap\nhack\nrevolutionary"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Required Disclaimers <span className="text-slate-500 font-normal">(one per line)</span>
            </label>
            <textarea
              value={requiredDisclaimers}
              onChange={(e) => setRequiredDisclaimers(e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Results may vary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Approved CTAs <span className="text-slate-500 font-normal">(one per line, leave empty for any)</span>
            </label>
            <textarea
              value={approvedCTAs}
              onChange={(e) => setApprovedCTAs(e.target.value)}
              className={inputClass}
              rows={3}
              placeholder={"Get Started\nLearn More\nStart Free Trial"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Compliance Notes</label>
            <textarea
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="No health claims. FTC disclosure required on endorsements."
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
          >
            Save Brand Kit
          </button>
        </div>
      </div>
    </>
  );
}

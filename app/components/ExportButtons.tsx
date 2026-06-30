"use client";

import type { Angle } from "@/lib/schemas";
import { anglesToCsv, anglesToJson } from "@/lib/export";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ angles }: { angles: Angle[] }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => downloadFile(anglesToCsv(angles), "adangle-creatives.csv", "text/csv")}
        className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium transition-colors"
      >
        CSV
      </button>
      <button
        onClick={() => downloadFile(anglesToJson(angles), "adangle-creatives.json", "application/json")}
        className="px-3 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 text-sm font-medium transition-colors"
      >
        JSON
      </button>
    </div>
  );
}

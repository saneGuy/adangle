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
    <div className="flex gap-3">
      <button
        onClick={() => downloadFile(anglesToCsv(angles), "adangle-creatives.csv", "text/csv")}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
      >
        Download CSV
      </button>
      <button
        onClick={() => downloadFile(anglesToJson(angles), "adangle-creatives.json", "application/json")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
      >
        Download JSON
      </button>
    </div>
  );
}

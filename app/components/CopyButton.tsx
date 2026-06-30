"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded transition-colors ${
        copied
          ? "bg-green-600/30 text-green-400"
          : "bg-slate-700 hover:bg-slate-600 text-slate-400"
      }`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

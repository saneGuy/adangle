"use client";

import { useState, useEffect } from "react";
import type { ProjectMeta } from "@/lib/project-store";
import { listProjects, deleteProject, importProject, saveProject, exportProject, loadProject } from "@/lib/project-store";
import type { AdAngleProject } from "@/lib/db";

export function ProjectSidebar({
  open,
  onClose,
  currentProjectId,
  onLoadProject,
  onNewProject,
}: {
  open: boolean;
  onClose: () => void;
  currentProjectId: string | null;
  onLoadProject: (project: AdAngleProject) => void;
  onNewProject: () => void;
}) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  useEffect(() => {
    if (open) {
      listProjects().then(setProjects);
    }
  }, [open]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLoad = async (id: string) => {
    const project = await loadProject(id);
    if (project) {
      onLoadProject(project);
      onClose();
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = importProject(text);
        await saveProject(project);
        onLoadProject(project);
        onClose();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Invalid project file");
      }
    };
    input.click();
  };

  const handleExport = async (id: string) => {
    const project = await loadProject(id);
    if (!project) return;
    const json = exportProject(project);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 bg-slate-800 border-r border-slate-700 z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Projects</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-3 flex gap-2 border-b border-slate-700">
          <button
            onClick={() => { onNewProject(); onClose(); }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            New Project
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            Import
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {projects.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No saved projects yet</p>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                p.id === currentProjectId
                  ? "bg-blue-600/20 border border-blue-500/40"
                  : "hover:bg-slate-700/50"
              }`}
              onClick={() => handleLoad(p.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(p.updatedAt).toLocaleDateString()} {new Date(p.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleExport(p.id); }}
                  className="p-1 text-slate-400 hover:text-blue-400 text-xs"
                  title="Export"
                >
                  ↓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                  className="p-1 text-slate-400 hover:text-red-400 text-xs"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

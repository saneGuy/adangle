import { db, type AdAngleProject } from "./db";
import { z } from "zod";

const LAST_PROJECT_KEY = "adangle-last-project-id";

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
}

export async function listProjects(): Promise<ProjectMeta[]> {
  const all = await db.projects.orderBy("updatedAt").reverse().toArray();
  return all.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
}

export async function saveProject(project: AdAngleProject): Promise<void> {
  await db.projects.put({ ...project, updatedAt: new Date().toISOString() });
  localStorage.setItem(LAST_PROJECT_KEY, project.id);
}

export async function loadProject(id: string): Promise<AdAngleProject | null> {
  const project = await db.projects.get(id);
  return project ?? null;
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
  const lastId = localStorage.getItem(LAST_PROJECT_KEY);
  if (lastId === id) {
    localStorage.removeItem(LAST_PROJECT_KEY);
  }
}

export function getLastProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_PROJECT_KEY);
}

export function exportProject(project: AdAngleProject): string {
  return JSON.stringify(project, null, 2);
}

const ImportSchema = z.object({
  name: z.string(),
  brief: z.any().nullable(),
  angles: z.array(z.any()).optional().default([]),
  extractModel: z.string().optional().default("claude-haiku-4-5-20251001"),
  generateModel: z.string().optional().default("gpt-4o"),
  step: z.enum(["input", "brief", "results"]).optional().default("input"),
  schemaVersion: z.number(),
});

export function importProject(json: string): AdAngleProject {
  const raw = JSON.parse(json);
  const validated = ImportSchema.parse(raw);
  if (validated.schemaVersion > 1) {
    throw new Error("Unsupported project version. Please update AdAngle.");
  }
  return {
    id: crypto.randomUUID(),
    name: validated.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    brief: validated.brief,
    angles: validated.angles,
    extractModel: validated.extractModel,
    generateModel: validated.generateModel,
    brandKit: null,
    step: validated.step,
    schemaVersion: 1,
  };
}

export function createNewProject(name = "Untitled Project"): AdAngleProject {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    brief: null,
    angles: [],
    extractModel: "claude-haiku-4-5-20251001",
    generateModel: "gpt-4o",
    brandKit: null,
    step: "input",
    schemaVersion: 1,
  };
}

import Dexie, { type EntityTable } from "dexie";
import type { ProductBrief, Angle } from "./schemas";
import type { BrandKit } from "./brand-kit";

export interface AdAngleProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  brief: ProductBrief | null;
  angles: Angle[];
  extractModel: string;
  generateModel: string;
  brandKit: BrandKit | null;
  step: "input" | "brief" | "results";
  schemaVersion: number;
}

class AdAngleDB extends Dexie {
  projects!: EntityTable<AdAngleProject, "id">;

  constructor() {
    super("adangle");
    this.version(1).stores({
      projects: "id, updatedAt",
    });
  }
}

export const db = new AdAngleDB();

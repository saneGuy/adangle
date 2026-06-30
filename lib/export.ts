import type { Angle } from "./schemas";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function anglesToCsv(angles: Angle[]): string {
  const header = "angle,platform_slot,variant_index,text,cta,grounded_in";
  const rows: string[] = [];

  for (const angle of angles) {
    for (let i = 0; i < angle.headlines.length; i++) {
      const h = angle.headlines[i];
      rows.push(
        [
          escapeCsv(angle.name),
          escapeCsv(h.platformSlot),
          `headline_${i + 1}`,
          escapeCsv(h.text),
          escapeCsv(angle.cta),
          escapeCsv(h.groundedIn.join(";")),
        ].join(",")
      );
    }
    for (let i = 0; i < angle.bodyCopy.length; i++) {
      const b = angle.bodyCopy[i];
      rows.push(
        [
          escapeCsv(angle.name),
          escapeCsv(b.platformSlot),
          `body_${i + 1}`,
          escapeCsv(b.text),
          escapeCsv(angle.cta),
          escapeCsv(b.groundedIn.join(";")),
        ].join(",")
      );
    }
  }

  return [header, ...rows].join("\n");
}

export function anglesToJson(angles: Angle[]): string {
  return JSON.stringify({ angles }, null, 2);
}

import * as XLSX from "xlsx";
import type { SeedLead } from "@/data/seed";

/**
 * Parses an uploaded CSV or Excel (.xlsx/.xls) file into leads. Column headers
 * are matched flexibly (EN/FR) so users can drop their own export. Missing
 * fields degrade gracefully; rows without a company name are skipped.
 */

const COLS: Record<keyof Omit<SeedLead, "extId">, string[]> = {
  company: ["company", "companie", "entreprise", "société", "societe", "name", "account", "compte", "raison sociale"],
  domain: ["domain", "domaine", "website", "site", "url", "web"],
  industry: ["industry", "industrie", "secteur", "sector", "vertical"],
  sizeBand: ["size", "sizeband", "size band", "effectif", "employees", "employés", "headcount", "taille"],
  region: ["region", "région", "country", "pays", "geo", "location", "zone"],
  signal: ["signal", "intent", "note", "notes", "comment", "commentaire", "remarque"],
};

function pick(row: Record<string, unknown>, keys: string[]): string {
  const lower = new Map(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v])
  );
  for (const k of keys) {
    const v = lower.get(k);
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return "";
}

export async function parseLeads(file: File): Promise<SeedLead[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const ws = wb.Sheets[first];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  const leads: SeedLead[] = [];
  rows.forEach((row, i) => {
    const company = pick(row, COLS.company);
    if (!company) return;
    leads.push({
      extId: `U-${String(i + 1).padStart(3, "0")}`,
      company,
      domain: pick(row, COLS.domain) || "—",
      industry: pick(row, COLS.industry) || "—",
      sizeBand: pick(row, COLS.sizeBand) || "—",
      region: pick(row, COLS.region) || "—",
      signal: pick(row, COLS.signal) || "no signal provided",
    });
  });
  return leads;
}

import * as XLSX from "xlsx";
import type { SeedLead } from "@/data/seed";

/**
 * Parses an uploaded CSV or Excel (.xlsx/.xls) into leads. Headers are matched
 * flexibly (EN/FR, snake_case, "contains") so real exports drop in — e.g.
 * `company_name`, `staff`, `city`, `sector`. Missing fields degrade gracefully;
 * rows without a company name are skipped. Domain is derived from email when
 * no domain column exists, and a signal is composed from common intent columns.
 */

const norm = (s: string) => s.trim().toLowerCase().replace(/[_-]+/g, " ");

/** Return the value of the first header that CONTAINS any of the tokens. */
function pick(row: Map<string, unknown>, tokens: string[]): string {
  for (const [key, val] of row) {
    if (val === undefined || val === null || String(val).trim() === "") continue;
    if (tokens.some((t) => key.includes(t))) return String(val).trim();
  }
  return "";
}

function domainFromEmail(email: string): string {
  const at = email.indexOf("@");
  return at > -1 ? email.slice(at + 1).trim().toLowerCase() : "";
}

function truthy(v: string): boolean {
  return /^(true|1|oui|yes|vrai|x)$/i.test(v.trim());
}

export async function parseLeads(file: File): Promise<SeedLead[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const ws = wb.Sheets[first];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const leads: SeedLead[] = [];
  rows.forEach((raw, i) => {
    // normalized header → value
    const row = new Map<string, unknown>(
      Object.entries(raw).map(([k, v]) => [norm(k), v])
    );

    const company = pick(row, ["company", "entreprise", "societe", "société", "raison sociale", "account", "compte"]) || pick(row, ["name", "nom"]);
    if (!company) return;

    const email = pick(row, ["email", "mail", "courriel"]);
    const domain =
      pick(row, ["domain", "domaine", "website", "site", "url", "web"]) ||
      domainFromEmail(email) ||
      "—";

    const industry = pick(row, ["industry", "industrie", "secteur", "sector", "naf", "vertical"]) || "—";
    const sizeBand = pick(row, ["size", "effectif", "employe", "employé", "headcount", "staff", "taille"]) || "—";
    const region = pick(row, ["region", "région", "country", "pays", "city", "ville", "location", "zone"]) || "—";

    // explicit signal column, else compose one from common intent fields
    let signal = pick(row, ["signal", "intent", "note", "comment", "remarque"]);
    if (!signal) {
      const parts: string[] = [];
      const demo = pick(row, ["requested demo", "demo", "demande demo"]);
      if (demo && truthy(demo)) parts.push("demo requested");
      const sov = pick(row, ["sovereignty", "souverain", "sovereignt"]);
      if (sov && truthy(sov)) parts.push("sovereignty");
      const founder = pick(row, ["is founder", "founder", "fondateur"]);
      if (founder && truthy(founder)) parts.push("founder-led");
      const role = pick(row, ["role", "contact role", "poste", "fonction", "title"]);
      if (role) parts.push(role);
      const chan = pick(row, ["source channel", "channel", "canal", "source"]);
      if (chan) parts.push(`via ${chan}`);
      signal = parts.join(" · ") || "no signal provided";
    }

    leads.push({
      extId: `U-${String(i + 1).padStart(3, "0")}`,
      company,
      domain,
      industry,
      sizeBand,
      region,
      signal,
    });
  });
  return leads;
}

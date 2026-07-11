/**
 * Input data only (anonymised leads + the seed rule set). These are INPUTS the
 * agent reasons over — not fabricated result metrics. Every score, latency and
 * cost shown in the UI is computed at runtime, never taken from here.
 */

export type SeedLead = {
  extId: string;
  company: string;
  domain: string;
  industry: string;
  sizeBand: string;
  region: string;
  signal: string;
};

/** ~20 anonymised leads ingested at boot to infer company-brain v1. */
export const SEED_LEADS: SeedLead[] = [
  { extId: "L-001", company: "Northwind Data", domain: "northwind-data.io", industry: "Data Infra SaaS", sizeBand: "50-200", region: "UK", signal: "Hiring 4 AEs; Series B 8mo ago" },
  { extId: "L-002", company: "Volta Metrics", domain: "voltametrics.com", industry: "Analytics SaaS", sizeBand: "200-500", region: "US", signal: "New VP Sales; expanding EMEA" },
  { extId: "L-003", company: "R?ne Logistics", domain: "rene-logistics.fr", industry: "Logistics", sizeBand: "500-1000", region: "EU", signal: "RFP for ops platform" },
  { extId: "L-004", company: "Pébble Health", domain: "pebblehealth.io", industry: "HealthTech SaaS", sizeBand: "50-200", region: "EU", signal: "Migrating off spreadsheets" },
  { extId: "L-005", company: "Kestrel Security", domain: "kestrelsec.com", industry: "Security SaaS", sizeBand: "200-500", region: "US", signal: "Series C 3mo ago" },
  { extId: "L-006", company: "Maple Ledger", domain: "mapleledger.ca", industry: "FinTech SaaS", sizeBand: "50-200", region: "US", signal: "Hiring RevOps lead" },
  { extId: "L-007", company: "Tinos Freight", domain: "tinosfreight.gr", industry: "Logistics", sizeBand: "20-50", region: "EU", signal: "No recent signal" },
  { extId: "L-008", company: "Cobalt Studio", domain: "cobalt.studio", industry: "Design Agency", sizeBand: "10-50", region: "EU", signal: "Website refresh only" },
  { extId: "L-009", company: "Aster Robotics", domain: "asterrobotics.de", industry: "Robotics", sizeBand: "200-500", region: "EU", signal: "New funding; scaling GTM" },
  { extId: "L-010", company: "Lumen Payroll", domain: "lumenpayroll.com", industry: "HR SaaS", sizeBand: "50-200", region: "UK", signal: "Replacing legacy vendor" },
  { extId: "L-011", company: "Drift & Co", domain: "driftandco.com", industry: "Marketing Agency", sizeBand: "10-50", region: "US", signal: "Founder inbound, no budget stated" },
  { extId: "L-012", company: "Halcyon Grid", domain: "halcyongrid.io", industry: "Energy SaaS", sizeBand: "200-500", region: "EU", signal: "Grid expansion; hiring" },
  { extId: "L-013", company: "Baral Textiles", domain: "baraltextiles.in", industry: "Manufacturing", sizeBand: "1000+", region: "APAC", signal: "No SaaS intent" },
  { extId: "L-014", company: "Perch Analytics", domain: "perch.dev", industry: "Analytics SaaS", sizeBand: "50-200", region: "US", signal: "Trial of competitor tool" },
  { extId: "L-015", company: "Quill Legal", domain: "quill-legal.co.uk", industry: "LegalTech SaaS", sizeBand: "50-200", region: "UK", signal: "New GC; process overhaul" },
  { extId: "L-016", company: "Nova Freight", domain: "novafreight.io", industry: "Logistics SaaS", sizeBand: "200-500", region: "US", signal: "Series B; hiring AEs" },
  { extId: "L-017", company: "Sable Retail", domain: "sableretail.com", industry: "Retail", sizeBand: "500-1000", region: "US", signal: "Seasonal only" },
  { extId: "L-018", company: "Fjord Systems", domain: "fjordsystems.no", industry: "IoT SaaS", sizeBand: "50-200", region: "EU", signal: "Expansion to UK market" },
  { extId: "L-019", company: "Cirrus Mail", domain: "cirrusmail.com", industry: "DevTools SaaS", sizeBand: "20-50", region: "US", signal: "Open-source traction" },
  { extId: "L-020", company: "Onda Fitness", domain: "ondafitness.es", industry: "Consumer", sizeBand: "10-50", region: "EU", signal: "B2C, no fit" },
];

/**
 * The deliberately-missed lead. v1's Règle 3 (blanket reject of advisory /
 * founder-led firms) wrongly rejects it despite a strong buying signal and a
 * senior decision-maker founder. The voice correction fixes R3 in v2.
 */
export const MISSED_LEAD: SeedLead = {
  extId: "L-021",
  company: "Atelier Nord",
  domain: "ateliernord.co",
  industry: "Revenue Advisory",
  sizeBand: "1-10",
  region: "EU",
  signal:
    "Founder is ex-VP Revenue (Series-C SaaS). Explicit buying signal: booked a scoping call, stated budget, evaluating now.",
};

export type SeedRule = { id: string; text: string; origin: string };

/** v1 rules — R3 is the flawed one. */
export const SEED_RULES_V1: SeedRule[] = [
  { id: "R1", text: "Prioriser les comptes montrant un signal d'expansion récent (recrutement commercial, levée, ouverture de marché).", origin: "inféré@ingest" },
  { id: "R2", text: "Qualifier quand l'effectif est dans la bande 50–500 et la région EU/UK/US.", origin: "inféré@ingest" },
  { id: "R3", text: "Rejeter automatiquement les cabinets de conseil / advisory et les structures fondateur-unique (<10) : hors-ICP par défaut, quel que soit le signal.", origin: "inféré@ingest" },
  { id: "R4", text: "Exiger un signal d'intention daté de moins de 30 jours.", origin: "inféré@ingest" },
];

/** The corrected R3 applied in v2 after the voice correction. */
export const CORRECTED_R3: SeedRule = {
  id: "R3",
  text: "Ne rejeter les structures conseil / fondateur-unique QUE si elles n'ont ni signal d'achat explicite ni fondateur décisionnaire senior. Un cabinet conseil avec budget déclaré et fondateur ex-dirigeant Revenue est un lead qualifié.",
  origin: "corrigé@voix (Wispr) → v2",
};

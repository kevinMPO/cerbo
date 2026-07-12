/**
 * One-click example companies — so a visitor with NO CSV can still run the
 * workflow. Each chip carries a SIREN + domain that Linkup resolves live; the
 * agent then qualifies the company against the current Company Brain rules.
 * (SIRENs are public identifiers, best-effort; Linkup resolves by name+domain
 * as well, so the enrichment is real even if a SIREN drifts.)
 */
export type ExampleLead = {
  name: string;
  domain: string;
  siren: string;
  industry: string;
  region: string;
};

export const EXAMPLE_LEADS: ExampleLead[] = [
  { name: "Doctolib", domain: "doctolib.fr", siren: "794598813", industry: "HealthTech SaaS", region: "EU" },
  { name: "Qonto", domain: "qonto.com", siren: "819489626", industry: "FinTech SaaS", region: "EU" },
  { name: "Spendesk", domain: "spendesk.com", siren: "821893286", industry: "FinTech SaaS", region: "EU" },
  { name: "BlaBlaCar", domain: "blablacar.fr", siren: "491904546", industry: "Mobility marketplace", region: "EU" },
  { name: "Back Market", domain: "backmarket.fr", siren: "807648488", industry: "Marketplace", region: "EU" },
  { name: "TotalEnergies", domain: "totalenergies.com", siren: "542051180", industry: "Énergie", region: "EU" },
  { name: "Franprix", domain: "franprix.fr", siren: "305131059", industry: "Retail", region: "EU" },
];

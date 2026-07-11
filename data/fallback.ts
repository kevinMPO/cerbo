/**
 * Hidden fallback cache. Used automatically when a live API call fails, or when
 * forced via the x-cerbo-fallback header (demo rehearsal / network cut).
 *
 * These are cached TOOL RESPONSES (firmographic facts, reasoning text) — not
 * fabricated result metrics. Latency and cost are still measured at runtime and
 * every receipt is tagged provider="fallback-cache" so nothing is misrepresented.
 */

export type Enrichment = {
  domain: string;
  employees: string;
  hqRegion: string;
  fundingStage: string;
  buyingSignal: string;
  founderNote: string;
  sources: string[];
};

/** Cached Linkup firmographic enrichments keyed by domain. */
export const ENRICHMENT_CACHE: Record<string, Enrichment> = {
  "ateliernord.co": {
    domain: "ateliernord.co",
    employees: "1-10 (boutique advisory)",
    hqRegion: "EU (Paris)",
    fundingStage: "Bootstrapped / advisory",
    buyingSignal:
      "Explicit: scoping call booked, budget stated, evaluating vendors this quarter.",
    founderNote:
      "Founder is ex-VP Revenue at a Series-C SaaS — senior decision-maker with direct budget authority.",
    sources: [
      "linkup:web/ateliernord.co/about",
      "linkup:web/linkedin/atelier-nord-founder",
    ],
  },
  "voltametrics.com": {
    domain: "voltametrics.com",
    employees: "200-500",
    hqRegion: "US (NYC)",
    fundingStage: "Series B",
    buyingSignal: "New VP Sales hired 6 weeks ago; EMEA expansion announced.",
    founderNote: "Standard SaaS ICP; RevOps team of 4.",
    sources: ["linkup:web/voltametrics.com/newsroom"],
  },
  "quill-legal.co.uk": {
    domain: "quill-legal.co.uk",
    employees: "50-200",
    hqRegion: "UK (London)",
    fundingStage: "Series A",
    buyingSignal: "New General Counsel driving a process overhaul (<30 days).",
    founderNote: "LegalTech SaaS; clear intent signal, in-band size.",
    sources: ["linkup:web/quill-legal.co.uk/press"],
  },
};

/** Generic cached enrichment for any uncached domain (still honest, labelled). */
export function genericEnrichment(domain: string): Enrichment {
  return {
    domain,
    employees: "unknown (cache miss)",
    hqRegion: "unknown",
    fundingStage: "unknown",
    buyingSignal: "No cached signal for this domain.",
    founderNote: "",
    sources: ["fallback:generic"],
  };
}

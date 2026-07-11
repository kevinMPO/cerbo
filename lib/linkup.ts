import { ENRICHMENT_CACHE, genericEnrichment, type Enrichment } from "../data/fallback";
import type { Env } from "./env";

/**
 * Linkup firmographic enrichment. Live call to the Linkup API; on any failure
 * (or when forced) it falls back to the cached enrichment so the demo survives
 * a network cut. The `live` flag is surfaced to the UI so nothing is faked.
 */

export type EnrichResult = {
  enrichment: Enrichment;
  live: boolean;
  latencyMs: number;
  summary: string;
};

const LINKUP_URL = "https://api.linkup.so/v1/search";

export async function enrich(
  env: Env,
  domain: string,
  company: string,
  forceFallback = false
): Promise<EnrichResult> {
  const start = Date.now();
  const key = env.LINKUP_API_KEY;

  if (!forceFallback && key) {
    try {
      const res = await fetch(LINKUP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          q: `${company} (${domain}) — employees, funding stage, buying signals, founder background`,
          depth: "standard",
          outputType: "sourcedAnswer",
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: any = await res.json();
      const answer: string =
        data?.answer ?? data?.results?.[0]?.content ?? "";
      const sources: string[] = (data?.sources ?? [])
        .map((s: any) => s?.url ?? s?.name)
        .filter(Boolean)
        .slice(0, 4);
      // Merge the live answer over any cached shape we know for this domain.
      const base = ENRICHMENT_CACHE[domain] ?? genericEnrichment(domain);
      const enrichment: Enrichment = {
        ...base,
        buyingSignal: answer ? answer.slice(0, 400) : base.buyingSignal,
        sources: sources.length ? sources : base.sources,
      };
      return {
        enrichment,
        live: true,
        latencyMs: Date.now() - start,
        summary: `Linkup live: ${enrichment.employees}, ${enrichment.fundingStage}`,
      };
    } catch (e) {
      console.warn("[linkup] live failed, using cache:", String(e));
    }
  }

  const enrichment = ENRICHMENT_CACHE[domain] ?? genericEnrichment(domain);
  return {
    enrichment,
    live: false,
    latencyMs: Date.now() - start,
    summary: `Linkup cache: ${enrichment.employees}, ${enrichment.fundingStage}`,
  };
}

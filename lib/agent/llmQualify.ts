import type { Env } from "../env";
import type { Enrichment } from "../../data/fallback";
import type { SeedLead, SeedRule } from "../../data/seed";
import { llm, type LlmResult } from "../llm";
import { evaluate } from "./rules";

/**
 * REAL qualification: the LLM applies the company-brain rules to the lead +
 * live enrichment and returns a structured verdict WITH a confidence score.
 * The deterministic rule engine (rules.ts) is the honest FALLBACK when the LLM
 * is unavailable, offline, or returns something unparseable — so the demo peak
 * (Atelier Nord: reject under v1 R3, qualify under v2 R3) stays bulletproof.
 */

export type Qualification = {
  verdict: "qualified" | "rejected";
  score: number; // 0-100
  ruleCited: string;
  confidence: number; // 0-100
  rationale: string;
  engine: "llm" | "fallback";
  llm: LlmResult;
};

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

export async function llmQualify(
  env: Env,
  lead: SeedLead,
  enrichment: Enrichment,
  rules: SeedRule[],
  brainVersion: number,
  fallback: boolean
): Promise<Qualification> {
  // Deterministic baseline — used as the cached completion AND the fallback.
  const base = evaluate(lead, enrichment, brainVersion, rules);
  const cached = JSON.stringify({
    verdict: base.verdict,
    ruleCited: base.ruleCited,
    score: base.score,
    confidence: 72,
    rationale: base.rationale,
  });

  const system =
    "You are CERBO's lead-qualification engine. Decide using ONLY the company-brain rules provided — no outside criteria. Return STRICT JSON: " +
    '{"verdict":"qualified"|"rejected","ruleCited":"<the single decisive rule id, e.g. R3>","score":<int 0-100>,"confidence":<int 0-100 how sure you are>,"rationale":"<one factual sentence in French>"}. ' +
    "Cite the ONE rule that decides. Be deterministic: the same lead + same rules must always give the same verdict. " +
    "HONEST CONFIDENCE — this is critical: if the enrichment is thin, ambiguous, or the rules don't clearly apply to this lead, set confidence BELOW 50 and state precisely what's missing in the rationale. NEVER be falsely confident. High confidence (80+) is only for cases where the enrichment clearly triggers a specific rule.";

  const user =
    `Règles du company-brain (v${brainVersion}) :\n` +
    rules.map((r) => `${r.id}: ${r.text}`).join("\n") +
    `\n\nLead :\n- Société : ${lead.company}\n- Secteur : ${lead.industry}\n- Effectif : ${lead.sizeBand}\n- Région : ${lead.region}\n- Signal : ${lead.signal}` +
    `\n\nEnrichissement live (Linkup) :\n- ${enrichment.employees}, ${enrichment.fundingStage}\n- Signal d'achat : ${enrichment.buyingSignal}\n- Fondateur : ${enrichment.founderNote || "—"}` +
    `\n\nDécide maintenant. Renvoie UNIQUEMENT le JSON.`;

  const result = await llm(env, { forceFallback: fallback, cached, json: true, system, user });

  try {
    const parsed = JSON.parse(stripFences(result.text || cached));
    const verdict = parsed.verdict === "qualified" ? "qualified" : parsed.verdict === "rejected" ? "rejected" : null;
    if (verdict) {
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || base.score)));
      const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 72)));
      return {
        verdict,
        score,
        ruleCited: String(parsed.ruleCited || base.ruleCited),
        confidence,
        rationale: String(parsed.rationale || base.rationale),
        engine: result.provider === "fallback-cache" ? "fallback" : "llm",
        llm: result,
      };
    }
  } catch {
    /* fall through to deterministic */
  }

  // Honest fallback: the deterministic engine decides, flagged as such.
  return {
    verdict: base.verdict,
    score: base.score,
    ruleCited: base.ruleCited,
    confidence: 72,
    rationale: base.rationale,
    engine: "fallback",
    llm: result,
  };
}

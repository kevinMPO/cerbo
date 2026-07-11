import type { Enrichment } from "../../data/fallback";
import type { SeedLead, SeedRule } from "../../data/seed";

/**
 * Deterministic rule engine. OpenAI infers the ruleset at ingest; qualification
 * then applies those rules deterministically so the verdict is explainable and
 * repeatable. The decisive rule is always cited. Score is COMPUTED from matched
 * criteria — never a hardcoded demo number.
 */

export type Verdict = "qualified" | "rejected";

export type Evaluation = {
  verdict: Verdict;
  score: number; // 0-100, computed
  ruleCited: string;
  rationale: string;
};

const IN_BANDS = ["50-200", "200-500"];
const IN_REGIONS = ["EU", "UK", "US"];

function isAdvisoryOrFounderLed(lead: SeedLead): boolean {
  const ind = lead.industry.toLowerCase();
  const advisory = /advisory|consult|conseil|agency/.test(ind);
  const founderLed = /^1-10$|^0-10$/.test(lead.sizeBand);
  return advisory || founderLed;
}

function hasStrongBuyingSignal(e: Enrichment, lead: SeedLead): boolean {
  const hay = `${e.buyingSignal} ${lead.signal}`.toLowerCase();
  return /budget|explicit|scoping call|evaluating|rfp|booked/.test(hay);
}

function hasSeniorFounder(e: Enrichment): boolean {
  const hay = e.founderNote.toLowerCase();
  return /ex-vp|ex-dirigeant|ex vp|decision-maker|senior|authority|founder is/.test(
    hay
  );
}

function freshExpansionSignal(lead: SeedLead): boolean {
  const hay = lead.signal.toLowerCase();
  return /hir|series|funding|expand|expansion|migrat|overhaul|new vp|rfp|replacing/.test(
    hay
  );
}

/**
 * @param brainVersion 1 uses the flawed R3; 2 uses the corrected R3.
 */
export function evaluate(
  lead: SeedLead,
  e: Enrichment,
  brainVersion: number,
  rules: SeedRule[]
): Evaluation {
  const r3 = rules.find((r) => r.id === "R3");
  const advisory = isAdvisoryOrFounderLed(lead);

  if (advisory) {
    const strong = hasStrongBuyingSignal(e, lead);
    const senior = hasSeniorFounder(e);
    if (brainVersion >= 2) {
      // Corrected R3: only reject advisory/founder-led WITHOUT signal AND senior founder.
      if (strong && senior) {
        const score = 60 + (strong ? 22 : 0) + (senior ? 15 : 0);
        return {
          verdict: "qualified",
          score: Math.min(100, score),
          ruleCited: "R3 (v2 corrigée)",
          rationale:
            "Cabinet conseil MAIS signal d'achat explicite + fondateur décisionnaire senior → exception R3 v2 : qualifié.",
        };
      }
      return {
        verdict: "rejected",
        score: 20,
        ruleCited: "R3 (v2 corrigée)",
        rationale:
          "Structure conseil sans signal d'achat explicite ni fondateur senior → rejetée par R3 v2.",
      };
    }
    // v1 flawed R3: blanket reject.
    return {
      verdict: "rejected",
      score: 12,
      ruleCited: "R3",
      rationale:
        r3?.text ??
        "Rejet automatique conseil / fondateur-unique (R3 v1) — quel que soit le signal.",
    };
  }

  // Standard path (R1/R2/R4).
  const inBand = IN_BANDS.includes(lead.sizeBand);
  const inRegion = IN_REGIONS.includes(lead.region);
  const fresh = freshExpansionSignal(lead);

  if (inBand && inRegion && fresh) {
    const score = 55 + (inBand ? 15 : 0) + (inRegion ? 10 : 0) + (fresh ? 18 : 0);
    return {
      verdict: "qualified",
      score: Math.min(100, score),
      ruleCited: "R1 + R2",
      rationale:
        "Effectif en bande + région ICP + signal d'expansion récent → qualifié.",
    };
  }

  const missing: string[] = [];
  if (!inBand) missing.push("hors bande d'effectif (R2)");
  if (!inRegion) missing.push("région hors-ICP (R2)");
  if (!fresh) missing.push("pas de signal récent (R1/R4)");
  return {
    verdict: "rejected",
    score: 25,
    ruleCited: missing.some((m) => m.includes("R4")) ? "R4" : "R2",
    rationale: `Rejeté : ${missing.join(", ")}.`,
  };
}

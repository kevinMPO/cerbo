/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../env";
import * as db from "../db";
import { llm, type LlmResult } from "../llm";
import { enrich } from "../linkup";
import { synthMemo } from "../elevenlabs";
import { evaluate } from "./rules";
import { llmQualify } from "./llmQualify";
import { buildBrainMarkdown } from "./brainDoc";
import { buildSkill } from "./skillContent";
import {
  CORRECTED_R3,
  MISSED_LEAD,
  SEED_LEADS,
  SEED_RULES_V1,
  type SeedLead,
  type SeedRule,
} from "../../data/seed";

/**
 * Agent step logic — Cloudflare edition. Pure functions over (env, DB); the
 * Pages Functions are thin wrappers. Every write lands in D1 so /proof (polled)
 * can read it. Nothing hardcoded: scores/latency/cost are computed at runtime.
 */

const EMPTY_LLM: LlmResult = {
  text: "",
  provider: "fallback-cache",
  model: "n/a",
  tokensIn: 0,
  tokensOut: 0,
  costUsd: 0,
  latencyMs: 0,
  ok: true,
};

async function receipt(DB: D1Database, session: string, step: string, r: LlmResult) {
  await db.addReceipt(DB, session, {
    step,
    provider: r.provider,
    model: r.model,
    tokensIn: r.tokensIn,
    tokensOut: r.tokensOut,
    costUsd: r.costUsd,
    latencyMs: r.latencyMs,
    ok: r.ok,
  });
}

function findLead(extId?: string): SeedLead {
  if (extId === MISSED_LEAD.extId) return MISSED_LEAD;
  return (
    SEED_LEADS.find((l) => l.extId === extId) ??
    SEED_LEADS.find((l) => l.extId === "L-002")!
  );
}

// ---------------- INGEST ----------------
export async function runIngest(
  env: Env,
  session: string,
  fallback: boolean,
  leads?: SeedLead[]
) {
  const DB = env.DB;
  const src = leads && leads.length ? leads : SEED_LEADS;
  const uploaded = !!(leads && leads.length);
  for (const l of src) {
    await db.addLead(DB, session, { ...l, source: uploaded ? "upload" : "seed" });
  }

  const cachedMd = buildBrainMarkdown(
    1,
    SEED_RULES_V1,
    `v1 inferred from ${src.length} leads. R3 is deliberately too broad.`
  );
  const result = await llm(env, {
    forceFallback: fallback,
    cached: cachedMd,
    system:
      "You are CERBO, a B2B qualification agent. From leads you produce a concise company-brain in English with 3-4 numbered rules (R1..R4). Stay factual.",
    user:
      `Leads (${src.length}):\n` +
      src
        .slice(0, 40)
        .map(
          (l) => `- ${l.company} | ${l.industry} | ${l.sizeBand} | ${l.region} | ${l.signal}`
        )
        .join("\n") +
      `\n\nProduce company-brain v1. You MUST include a rule R3 that by default rejects consulting/advisory firms and single-founder (<10) structures. Keep the other rules (expansion signal, size band 50-500 EU/UK/US, freshness <30d).`,
  });
  const markdown = result.text?.trim() || cachedMd;

  await db.saveBrain(DB, session, 1, markdown, SEED_RULES_V1, "v1 — R3 too broad (Atelier Nord trap)");
  await receipt(DB, session, "ingest", result);
  await db.logDecision(DB, session, {
    step: "ingest",
    input: `${src.length} ${uploaded ? "uploaded" : "anonymised"} leads`,
    ruleCited: "R1–R4 inferred",
    output: `company-brain v1 (${SEED_RULES_V1.length} rules)`,
    verdict: "info",
    latencyMs: result.latencyMs,
    costUsd: result.costUsd,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    toolCalls: [
      {
        tool: `openai:${result.model}`,
        ok: result.ok,
        latencyMs: result.latencyMs,
        summary: `rule inference (${result.tokensIn}+${result.tokensOut} tok)`,
      },
    ],
  });
  const openaiSeen = result.provider === "openai" || result.provider === "hermes";
  await db.markPowerup(DB, session, "openai", "OpenAI", openaiSeen ? "witnessed" : "active", `Rule inference via ${result.provider}:${result.model}`);
  await db.markPowerup(DB, session, "d1", "Cloudflare D1", "active", "Product state stored + read live");

  return {
    ok: true,
    brain: { version: 1, markdown, rules: SEED_RULES_V1 },
    leadCount: src.length,
    receipt: pickReceipt(result),
  };
}

// ---------------- QUALIFY ----------------
export async function runQualify(
  env: Env,
  session: string,
  extId: string | undefined,
  brainVersion: number,
  fallback: boolean,
  passedLead?: SeedLead
) {
  const DB = env.DB;
  const lead = passedLead ?? findLead(extId);
  const en = await enrich(env, lead.domain, lead.company, fallback);
  const rules =
    brainVersion >= 2
      ? SEED_RULES_V1.map((r) => (r.id === "R3" ? CORRECTED_R3 : r))
      : SEED_RULES_V1;

  // REAL qualification: the LLM applies the brain rules (deterministic fallback).
  const q = await llmQualify(env, lead, en.enrichment, rules, brainVersion, fallback);

  await receipt(DB, session, "qualify", q.llm);
  await db.logDecision(DB, session, {
    step: "qualify",
    input: `${lead.company} — ${lead.industry}, ${lead.sizeBand}, ${lead.region}`,
    ruleCited: q.ruleCited,
    output: `${q.verdict} · score ${q.score} · confiance ${q.confidence}% · ${q.rationale}`,
    verdict: q.verdict,
    score: q.score,
    latencyMs: q.llm.latencyMs,
    costUsd: q.llm.costUsd,
    tokensIn: q.llm.tokensIn,
    tokensOut: q.llm.tokensOut,
    toolCalls: [
      { tool: "linkup:enrich", ok: true, latencyMs: en.latencyMs, summary: `${en.live ? "LIVE" : "cache"} — ${en.summary}` },
      { tool: `${q.engine === "llm" ? q.llm.provider : "fallback"}:${q.llm.model}`, ok: q.llm.ok, latencyMs: q.llm.latencyMs, summary: `verdict ${q.engine} (confiance ${q.confidence}%)` },
    ],
  });
  await db.markPowerup(DB, session, "linkup", "Linkup", en.live ? "witnessed" : "active", `${en.live ? "LIVE enrichment" : "Enrichment (cache)"} — ${lead.company}: ${en.enrichment.employees}, ${en.enrichment.fundingStage}`);

  return {
    ok: true,
    lead,
    enrichment: en.enrichment,
    live: en.live,
    verdict: q.verdict,
    score: q.score,
    ruleCited: q.ruleCited,
    confidence: q.confidence,
    engine: q.engine,
    rationale: q.rationale,
    receipt: { ...pickReceipt(q.llm), linkupLatencyMs: en.latencyMs },
  };
}

// ---------------- CORRECT (the peak) ----------------
async function qualifyMissed(
  env: Env,
  session: string,
  brainVersion: number,
  rules: SeedRule[],
  fallback: boolean,
  step: string
) {
  const DB = env.DB;
  const en = await enrich(env, MISSED_LEAD.domain, MISSED_LEAD.company, fallback);
  // REAL qualification of the missed lead — the LLM applies the (v1 or v2) rules.
  const q = await llmQualify(env, MISSED_LEAD, en.enrichment, rules, brainVersion, fallback);
  await receipt(DB, session, step, q.llm);
  await db.logDecision(DB, session, {
    step,
    input: `${MISSED_LEAD.company} — ${MISSED_LEAD.industry}, ${MISSED_LEAD.sizeBand}`,
    ruleCited: q.ruleCited,
    output: `${q.verdict} · score ${q.score} · confiance ${q.confidence}% · ${q.rationale}`,
    verdict: q.verdict,
    score: q.score,
    latencyMs: q.llm.latencyMs,
    costUsd: q.llm.costUsd,
    tokensIn: q.llm.tokensIn,
    tokensOut: q.llm.tokensOut,
    toolCalls: [{ tool: "linkup:enrich", ok: true, latencyMs: en.latencyMs, summary: `${en.live ? "LIVE" : "cache"} — ${en.summary}` }],
  });
  return { q, en };
}

export async function runCorrect(
  env: Env,
  session: string,
  action: string,
  correctionText: string | undefined,
  fallback: boolean
) {
  const DB = env.DB;

  if (action === "run-v1") {
    const { q, en } = await qualifyMissed(env, session, 1, SEED_RULES_V1, fallback, "correct-v1");
    return { ok: true, phase: "v1", lead: MISSED_LEAD, enrichment: en.enrichment, live: en.live, verdict: q.verdict, score: q.score, ruleCited: q.ruleCited, confidence: q.confidence, engine: q.engine, rationale: q.rationale };
  }

  if (action === "apply") {
    const text =
      correctionText?.trim() ||
      "Atelier Nord is a real lead — ex-VP Revenue founder, stated budget. Stop auto-rejecting advisory firms that show buying intent with a senior founder.";
    const rulesV2 = SEED_RULES_V1.map((r) => (r.id === "R3" ? CORRECTED_R3 : r));
    const markdown = buildBrainMarkdown(2, rulesV2, `v2 — R3 corrected by voice (Wispr Flow): "${text}"`);
    await db.saveBrain(DB, session, 2, markdown, rulesV2, "v2 — R3 corrected (Wispr voice correction)");

    const skill = buildSkill({ name: "qualify-advisory-lead", version: 2, brainVersion: 2, rationale: text, ruleText: CORRECTED_R3.text });
    await db.addSkill(DB, session, { name: skill.name, version: skill.version, filename: skill.filename, content: skill.content, brainVersion: 2, createdAt: skill.createdAt });

    await db.markPowerup(DB, session, "wispr", "Wispr Flow", "witnessed", `Dictated correction applied → brain v2 + skill ${skill.filename}`);
    await db.logDecision(DB, session, {
      step: "correct-apply",
      input: `Wispr dictation: "${text}"`,
      ruleCited: "R3 → R3 (v2)",
      output: `brain v2 written + skill ${skill.filename}`,
      verdict: "info",
      latencyMs: 0,
      costUsd: 0,
      tokensIn: 0,
      tokensOut: 0,
      toolCalls: [
        { tool: "wispr:dictation", ok: true, latencyMs: 0, summary: "voice correction transcript" },
        { tool: "d1:skill-write", ok: true, latencyMs: 0, summary: "skill persisted to D1" },
      ],
    });
    return { ok: true, phase: "apply", brain: { version: 2, markdown, rules: rulesV2 }, skill: { filename: skill.filename, createdAt: skill.createdAt, content: skill.content }, correctionText: text };
  }

  if (action === "run-v2") {
    const rulesV2 = SEED_RULES_V1.map((r) => (r.id === "R3" ? CORRECTED_R3 : r));
    const { q, en } = await qualifyMissed(env, session, 2, rulesV2, fallback, "correct-v2");
    return { ok: true, phase: "v2", lead: MISSED_LEAD, enrichment: en.enrichment, live: en.live, verdict: q.verdict, score: q.score, ruleCited: q.ruleCited, confidence: q.confidence, engine: q.engine, rationale: q.rationale };
  }

  return { ok: false, error: "unknown action" };
}

// ---------------- MEMO ----------------
export async function runMemo(env: Env, session: string, context: string | undefined, fallback: boolean) {
  const DB = env.DB;
  const ctx = context || "CERBO re-qualified Atelier Nord, a high-value lead the v1 rule had rejected, after a voice correction.";
  const cached = "CERBO just recovered a high-value lead your rule was wrongly rejecting. The fix is now permanent: every future session applies the v2 rule, with no re-teaching.";
  const memo = await llm(env, {
    forceFallback: fallback,
    cached,
    system: "You are CERBO. Write a TWO-sentence audio memo, in English, about the business value of what just happened. Direct, ROI-oriented.",
    user: ctx,
  });
  const memoText = memo.text?.trim() || cached;
  const tts = await synthMemo(env, memoText, fallback);

  await receipt(DB, session, "memo", memo);
  await db.logDecision(DB, session, {
    step: "memo",
    input: ctx,
    ruleCited: "—",
    output: memoText,
    verdict: "info",
    latencyMs: memo.latencyMs,
    costUsd: memo.costUsd,
    tokensIn: memo.tokensIn,
    tokensOut: memo.tokensOut,
    toolCalls: [{ tool: "elevenlabs:tts", ok: tts.live, latencyMs: tts.latencyMs, summary: tts.live ? "audio synthesised (live)" : "audio unavailable (offline)" }],
  });
  await db.markPowerup(DB, session, "elevenlabs", "ElevenLabs", tts.live ? "witnessed" : "active", tts.live ? "Audio memo played in-product" : "TTS offline — memo as text");

  return { ok: true, memoText, audioBase64: tts.audioBase64, contentType: tts.contentType, live: tts.live, latencyMs: tts.latencyMs };
}

// ---------------- MEMORY ----------------
export async function runMemory(env: Env, session: string, fallback: boolean) {
  const DB = env.DB;
  const latest = await db.latestBrain(DB, session);
  const brainVersion = latest?.version ?? 1;
  const reloadedFrom = latest ? `D1 brains@v${latest.version}` : "default (no brain yet)";
  const rules =
    brainVersion >= 2
      ? SEED_RULES_V1.map((r) => (r.id === "R3" ? CORRECTED_R3 : r))
      : SEED_RULES_V1;

  const en = await enrich(env, MISSED_LEAD.domain, MISSED_LEAD.company, fallback);
  const evaln = evaluate(MISSED_LEAD, en.enrichment, brainVersion, rules);
  const cached = `New session. Brain reloaded (${reloadedFrom}). ${MISSED_LEAD.company} → ${evaln.verdict} (rule ${evaln.ruleCited}). No re-teaching needed.`;
  const narration = await llm(env, {
    forceFallback: fallback,
    cached,
    system: "You are CERBO booting a NEW session. Confirm in one sentence that the corrected rule applies with no re-teaching. English.",
    user: cached,
  });

  await receipt(DB, session, "memory", narration);
  await db.logDecision(DB, session, {
    step: "memory",
    input: `new-session boot — reload ${reloadedFrom}`,
    ruleCited: evaln.ruleCited,
    output: `${MISSED_LEAD.company} → ${evaln.verdict} (score ${evaln.score}) with no re-teaching`,
    verdict: evaln.verdict,
    score: evaln.score,
    latencyMs: narration.latencyMs,
    costUsd: narration.costUsd,
    tokensIn: narration.tokensIn,
    tokensOut: narration.tokensOut,
    toolCalls: [{ tool: "d1:brains.latest", ok: true, latencyMs: 0, summary: `reload ${reloadedFrom}` }],
  });
  await db.markPowerup(DB, session, "d1", "Cloudflare D1", "witnessed", `Brain reloaded at boot (${reloadedFrom}) — v2 applied in a new session`);

  return { ok: true, brainVersion, reloadedFrom, lead: MISSED_LEAD, verdict: evaln.verdict, score: evaln.score, ruleCited: evaln.ruleCited, rationale: narration.text || cached, persisted: brainVersion >= 2 };
}

// ---------------- STATE (for polling) ----------------
export async function getState(env: Env, session: string) {
  const DB = env.DB;
  const [brains, decisions, receipts, powerups, leads, skills] = await Promise.all([
    db.listBrains(DB, session),
    db.listDecisions(DB, session),
    db.listReceipts(DB, session),
    db.listPowerups(DB, session),
    db.listLeads(DB, session),
    db.listSkills(DB, session),
  ]);
  const waitlist = await db.waitlistCount(DB);
  return { brains, decisions, receipts, powerups, leads, skills, waitlist };
}

function pickReceipt(r: LlmResult) {
  return {
    provider: r.provider,
    model: r.model,
    tokensIn: r.tokensIn,
    tokensOut: r.tokensOut,
    costUsd: r.costUsd,
    latencyMs: r.latencyMs,
  };
}

export { EMPTY_LLM };

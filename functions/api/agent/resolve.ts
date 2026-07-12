/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { resolveEscalation, logDecision } from "../../../lib/db";

/** Resolve an escalated lead — the human decides. This is the correction loop:
 *  a human call on a case the agent wasn't sure about, logged as a decision. */
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as {
      sessionId?: string;
      id?: number;
      resolution?: string;
      company?: string;
    };
    if (!body.sessionId || !body.id || !body.resolution)
      return json({ ok: false, error: "sessionId, id, resolution requis" }, 400);
    const resolution = body.resolution === "qualified" ? "qualified" : "rejected";

    await resolveEscalation(ctx.env.DB, body.id, resolution);
    await logDecision(ctx.env.DB, body.sessionId, {
      step: "resolve",
      input: `${body.company || "lead"} — escaladé (agent incertain)`,
      ruleCited: "décision humaine",
      output: `${body.company || "lead"} → ${resolution} · tranché par l'humain`,
      verdict: resolution,
      latencyMs: 0,
      costUsd: 0,
      tokensIn: 0,
      tokensOut: 0,
      toolCalls: [{ tool: "human:resolve", ok: true, latencyMs: 0, summary: "décision humaine (loop)" }],
    });
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

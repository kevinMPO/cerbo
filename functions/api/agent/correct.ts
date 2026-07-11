/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { runCorrect } from "../../../lib/agent/steps";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as {
      sessionId?: string;
      action?: string;
      correctionText?: string;
    };
    if (!body.sessionId) return json({ error: "sessionId required" }, 400);
    const fallback = ctx.request.headers.get("x-cerbo-fallback") === "1";
    const r = await runCorrect(ctx.env, body.sessionId, body.action ?? "", body.correctionText, fallback);
    return json(r, r.ok ? 200 : 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

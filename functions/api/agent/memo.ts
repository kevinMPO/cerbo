/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { runMemo } from "../../../lib/agent/steps";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as { sessionId?: string; context?: string };
    if (!body.sessionId) return json({ error: "sessionId required" }, 400);
    const fallback = ctx.request.headers.get("x-cerbo-fallback") === "1";
    return json(await runMemo(ctx.env, body.sessionId, body.context, fallback));
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { runIngest } from "../../../lib/agent/steps";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as { sessionId?: string; leads?: any[] };
    if (!body.sessionId) return json({ error: "sessionId required" }, 400);
    const fallback = ctx.request.headers.get("x-cerbo-fallback") === "1";
    const leads = Array.isArray(body.leads) ? body.leads.slice(0, 200) : undefined;
    return json(await runIngest(ctx.env, body.sessionId, fallback, leads));
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

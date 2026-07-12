/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { runQualify } from "../../../lib/agent/steps";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as {
      sessionId?: string;
      extId?: string;
      brainVersion?: number;
      lead?: any;
    };
    if (!body.sessionId) return json({ error: "sessionId required" }, 400);
    const fallback = ctx.request.headers.get("x-cerbo-fallback") === "1";
    return json(
      await runQualify(ctx.env, body.sessionId, body.extId, body.brainVersion ?? 1, fallback, body.lead)
    );
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { resetSession } from "../../../lib/db";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as { sessionId?: string };
    if (!body.sessionId) return json({ error: "sessionId required" }, 400);
    await resetSession(ctx.env.DB, body.sessionId);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

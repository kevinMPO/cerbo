/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { runQualify } from "../../../lib/agent/steps";
import { spendCredit } from "../../../lib/db";
import { emailFromCookie, DEMO_EMAIL } from "../../../lib/authServer";

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

    // Credits: 1 per qualified lead. The demo account is unlimited; a signed-in
    // real account is charged and blocked at 0. (Unauthenticated direct calls
    // pass through — the UI always carries the cookie.)
    const email = emailFromCookie(ctx.request);
    let credits: number | null = null;
    if (email && email !== DEMO_EMAIL) {
      const remaining = await spendCredit(ctx.env.DB, email);
      if (remaining < 0) return json({ ok: false, error: "no_credits", credits: 0 }, 402);
      credits = remaining;
    }

    const result = await runQualify(ctx.env, body.sessionId, body.extId, body.brainVersion ?? 1, fallback, body.lead);
    return json({ ...result, credits });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

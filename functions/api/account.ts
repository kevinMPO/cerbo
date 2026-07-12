/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../lib/env";
import { json } from "../../lib/http";
import { getAccount } from "../../lib/db";
import { emailFromCookie, DEMO_EMAIL } from "../../lib/authServer";

// Current signed-in account's credit balance (read from the cookie).
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const email = emailFromCookie(ctx.request);
    if (!email) return json({ ok: false, error: "not signed in" }, 401);
    if (email === DEMO_EMAIL) return json({ ok: true, email, credits: null, unlimited: true });
    const a = await getAccount(ctx.env.DB, email);
    if (!a) return json({ ok: true, email, credits: 0, unlimited: false });
    return json({ ok: true, email, credits: a.credits, unlimited: false });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

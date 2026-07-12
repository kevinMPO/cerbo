/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { consumeAuthCode, getOrCreateAccount } from "../../../lib/db";
import { freeCredits, sessionCookieHeaders } from "../../../lib/authServer";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const { email, code } = (await ctx.request.json()) as { email?: string; code?: string };
    if (!email || !code) return json({ ok: false, error: "email et code requis" }, 400);
    const clean = email.trim().toLowerCase();
    const ok = await consumeAuthCode(ctx.env.DB, clean, code, Date.now());
    if (!ok) return json({ ok: false, error: "code invalide ou expiré" }, 401);
    const { account, isNew } = await getOrCreateAccount(ctx.env.DB, clean, freeCredits(ctx.env));
    const headers = sessionCookieHeaders(account.email);
    return new Response(
      JSON.stringify({ ok: true, email: account.email, credits: account.credits, isNew }),
      { headers }
    );
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

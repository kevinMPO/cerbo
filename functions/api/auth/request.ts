/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../lib/env";
import { json } from "../../../lib/http";
import { setAuthCode } from "../../../lib/db";
import { genCode, sendCodeEmail } from "../../../lib/authServer";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const { email } = (await ctx.request.json()) as { email?: string };
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return json({ ok: false, error: "email invalide" }, 400);
    const clean = email.trim().toLowerCase();
    const code = genCode();
    await setAuthCode(ctx.env.DB, clean, code, Date.now() + 10 * 60 * 1000);
    const r = await sendCodeEmail(ctx.env, clean, code);
    return json({
      ok: true,
      sent: r.sent,
      hint: r.sent
        ? undefined
        : "Email non délivré à cette adresse (domaine Resend non encore vérifié). Vérifie getcerbo.com dans Resend pour ouvrir à tous.",
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

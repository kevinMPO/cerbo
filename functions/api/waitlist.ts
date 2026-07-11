/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../lib/env";
import { json } from "../../lib/http";
import { joinWaitlist, waitlistCount } from "../../lib/db";

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    return json({ ok: true, count: await waitlistCount(ctx.env.DB) });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

/** Best-effort email notification via Resend (skipped if no key configured). */
async function notify(env: Env, email: string, count: number) {
  if (!env.RESEND_API_KEY) return;
  const to = env.NOTIFY_EMAIL || "mameri.kevin@gmail.com";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CERBO <onboarding@resend.dev>",
        to: [to],
        subject: `🎯 Nouvelle inscription waitlist CERBO — ${email}`,
        html: `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#111">
          <h2 style="margin:0 0 8px">Nouvelle inscription waitlist</h2>
          <p><b>Email :</b> ${email}</p>
          <p><b>Total waitlist :</b> ${count}</p>
          <p style="color:#888;font-size:12px">— CERBO · cerbo.pages.dev</p>
        </div>`,
      }),
    });
  } catch (e) {
    console.warn("[waitlist] notify failed:", String(e));
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as { email?: string };
    if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
      return json({ ok: false, error: "invalid email" }, 400);
    await joinWaitlist(ctx.env.DB, body.email);
    const count = await waitlistCount(ctx.env.DB);
    // Send the notification after responding (doesn't delay the user).
    ctx.waitUntil(notify(ctx.env, body.email.trim().toLowerCase(), count));
    return json({ ok: true, count });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

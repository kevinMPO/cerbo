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

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as { email?: string };
    if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
      return json({ ok: false, error: "invalid email" }, 400);
    await joinWaitlist(ctx.env.DB, body.email);
    return json({ ok: true, count: await waitlistCount(ctx.env.DB) });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

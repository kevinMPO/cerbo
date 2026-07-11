/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../lib/env";
import { json } from "../../lib/http";
import { getState } from "../../lib/agent/steps";

// Polled by /product and /proof for live state.
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const session = url.searchParams.get("session");
    if (!session) return json({ error: "session required" }, 400);
    return json(await getState(ctx.env, session));
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../lib/env";
import { json } from "../../lib/http";

/**
 * Company search via Apollo.io — so a user with no CSV can just TYPE a company
 * name and find it. Apollo does discovery (name → domain + logo); Linkup then
 * enriches and the LLM qualifies on selection. The Apollo key stays a secret.
 */

function cleanDomain(url?: string | null): string {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]!
    .trim()
    .toLowerCase();
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const q = new URL(ctx.request.url).searchParams.get("q")?.trim() || "";
    if (q.length < 2) return json({ ok: true, results: [] });
    if (!ctx.env.APOLLO_API_KEY) return json({ ok: false, error: "search not configured" }, 503);

    const res = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": ctx.env.APOLLO_API_KEY,
      },
      body: JSON.stringify({ q_organization_name: q, page: 1, per_page: 8 }),
    });
    if (!res.ok) return json({ ok: false, error: `apollo ${res.status}` }, 502);
    const data: any = await res.json();

    const seen = new Set<string>();
    const results = (data.organizations || [])
      .map((o: any) => ({
        name: String(o.name || "").trim(),
        domain: cleanDomain(o.primary_domain || o.website_url),
        logo: o.logo_url || null,
      }))
      .filter((r: any) => {
        if (!r.name) return false;
        const key = (r.domain || r.name).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);

    return json({ ok: true, results });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

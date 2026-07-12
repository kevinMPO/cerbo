/// <reference types="@cloudflare/workers-types" />
import type { Env } from "./env";

/** Free credits granted on signup (env override, default 20). */
export function freeCredits(env: Env): number {
  const n = Number(env.FREE_CREDITS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
}

/** From address. Default is Resend's shared sender (only delivers to the
 *  account owner until getcerbo.com is verified — then set MAIL_FROM). */
export function mailFrom(env: Env): string {
  return env.MAIL_FROM || "CERBO <onboarding@resend.dev>";
}

/** The demo bypass account — unlimited, so live demos never hit the paywall. */
export const DEMO_EMAIL = "demo@cerbo.dev";

export function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Read the signed-in email from the cookie. */
export function emailFromCookie(request: Request): string | null {
  const raw = request.headers.get("cookie") || "";
  const m = raw.match(/(?:^|;\s*)cerbo_email=([^;]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1] ?? "").trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Set-Cookie headers for a signed-in session (30 days). */
export function sessionCookieHeaders(email: string): Headers {
  const h = new Headers({ "content-type": "application/json; charset=utf-8" });
  const opts = "Path=/; Max-Age=2592000; SameSite=Lax";
  h.append("Set-Cookie", `cerbo_auth=1; ${opts}`);
  h.append("Set-Cookie", `cerbo_email=${encodeURIComponent(email)}; ${opts}`);
  return h;
}

/** Send the magic code via Resend. Returns whether it was delivered. */
export async function sendCodeEmail(env: Env, email: string, code: string): Promise<{ sent: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) return { sent: false, error: "email not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: mailFrom(env),
        to: [email],
        subject: `Ton code CERBO : ${code}`,
        html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111">
          <h2 style="margin:0 0 8px">Connexion à CERBO</h2>
          <p>Ton code de connexion :</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px;font-family:ui-monospace,monospace">${code}</p>
          <p style="color:#888;font-size:12px">Valable 10 minutes. Si tu n'as rien demandé, ignore ce mail.</p>
        </div>`,
      }),
    });
    if (!res.ok) return { sent: false, error: `resend ${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: String(e) };
  }
}

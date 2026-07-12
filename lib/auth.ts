"use client";

/**
 * Client-side session for the console. Two paths sign in:
 *  - magic code (email → code): the /api/auth/verify endpoint sets the cookies
 *    server-side; the client just mirrors the email into localStorage.
 *  - demo access code ("demo"): no server call, cookies set here as demo user.
 * `cerbo_email` identifies the credit account; `cerbo_auth` gates the routes.
 */
const AUTH_COOKIE = "cerbo_auth";
const EMAIL_COOKIE = "cerbo_email";
const KEY = "cerbo:auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Demo access codes → sign in as the unlimited demo account. */
const CODES = ["demo", "cerbo", "hermes"];
export const DEMO_EMAIL = "demo@cerbo.dev";

export function isValidCode(code: string): boolean {
  return CODES.includes(code.trim().toLowerCase());
}

/** Sign in as `email`. Sets both cookies (so credit gating can read the account). */
export function signIn(email: string): void {
  if (typeof document === "undefined") return;
  const e = (email || DEMO_EMAIL).trim().toLowerCase();
  const opts = `path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  document.cookie = `${AUTH_COOKIE}=1; ${opts}`;
  document.cookie = `${EMAIL_COOKIE}=${encodeURIComponent(e)}; ${opts}`;
  window.localStorage.setItem(KEY, e);
}

export function signOut(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${EMAIL_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.localStorage.removeItem(KEY);
}

export function currentUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

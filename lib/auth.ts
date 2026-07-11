"use client";

/**
 * Lightweight client-side gate for the console (/product, /proof). Not real
 * identity — a demo access wall. The cookie is read by middleware to protect
 * the routes; localStorage mirrors it for UI state.
 */
const COOKIE = "cerbo_auth";
const KEY = "cerbo:auth";

/** Access codes accepted at the login wall. */
const CODES = ["demo", "cerbo", "hermes"];

export function isValidCode(code: string): boolean {
  return CODES.includes(code.trim().toLowerCase());
}

export function signIn(email: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=1; path=/; max-age=86400; SameSite=Lax`;
  window.localStorage.setItem(KEY, email || "guest");
}

export function signOut(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.localStorage.removeItem(KEY);
}

export function currentUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

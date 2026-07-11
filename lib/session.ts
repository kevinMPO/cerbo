"use client";

/** Stable per-browser session id so a demo run's state is isolated. */
const KEY = "cerbo:sessionId";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function newSessionId(): string {
  const id = `s_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, id);
  return id;
}

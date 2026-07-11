"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/** Thin client for the agent API with per-step loading + fallback header. */
export function useAgent(sessionId: string, fallback: boolean) {
  const [busy, setBusy] = useState<string | null>(null);

  const call = useCallback(
    async (path: string, body: Record<string, unknown> = {}) => {
      setBusy(path);
      try {
        const res = await fetch(`/api/agent/${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(fallback ? { "x-cerbo-fallback": "1" } : {}),
          },
          body: JSON.stringify({ sessionId, ...body }),
        });
        const data: any = await res.json();
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        return data;
      } catch (e) {
        toast.error(`Échec ${path}`, { description: String(e) });
        throw e;
      } finally {
        setBusy(null);
      }
    },
    [sessionId, fallback]
  );

  return { call, busy };
}

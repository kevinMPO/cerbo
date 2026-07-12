"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/** Thin client for the agent API — per-step loading, fallback header, credits. */
export function useAgent(sessionId: string, fallback: boolean) {
  const [busy, setBusy] = useState<string | null>(null);

  const call = useCallback(
    async (path: string, body: Record<string, unknown> = {}) => {
      setBusy(path);
      let toasted = false;
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
          const err = data?.error || `HTTP ${res.status}`;
          if (err === "no_credits") {
            toast.error("Plus de crédits", {
              description: "1 crédit par lead qualifié — recharge bientôt.",
            });
            emitCredits(0);
          } else {
            toast.error(`Échec ${path}`, { description: err });
          }
          toasted = true;
          throw new Error(err);
        }
        // Keep the credit balance live in the nav.
        if (typeof data?.credits === "number") emitCredits(data.credits);
        return data;
      } catch (e) {
        if (!toasted) toast.error(`Échec ${path}`, { description: String(e) });
        throw e;
      } finally {
        setBusy(null);
      }
    },
    [sessionId, fallback]
  );

  return { call, busy };
}

function emitCredits(n: number) {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("cerbo:credits", { detail: n }));
}

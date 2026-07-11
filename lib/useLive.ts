"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live state via polling — replaces Convex live queries. Polls /api/state every
 * `intervalMs` (default 1200) so /product and /proof update on their own as the
 * agent writes to D1.
 */
export type LiveState = {
  brains: any[];
  decisions: any[];
  receipts: any[];
  powerups: any[];
  leads: any[];
  skills: any[];
  waitlist: number;
  ready: boolean;
  refresh: () => void;
};

const EMPTY = {
  brains: [],
  decisions: [],
  receipts: [],
  powerups: [],
  leads: [],
  skills: [],
  waitlist: 0,
};

export function useLive(session: string, intervalMs = 1200): LiveState {
  const [data, setData] = useState<typeof EMPTY>(EMPTY);
  const [ready, setReady] = useState(false);
  const tick = useRef(0);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(`/api/state?session=${encodeURIComponent(session)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const j: any = await res.json();
        if (!alive) return;
        setData({
          brains: j.brains ?? [],
          decisions: j.decisions ?? [],
          receipts: j.receipts ?? [],
          powerups: j.powerups ?? [],
          leads: j.leads ?? [],
          skills: j.skills ?? [],
          waitlist: j.waitlist ?? 0,
        });
        setReady(true);
      } catch {
        /* keep last state; poll again */
      }
    }
    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [session, intervalMs, tick.current]);

  return { ...data, ready, refresh: () => (tick.current += 1) };
}

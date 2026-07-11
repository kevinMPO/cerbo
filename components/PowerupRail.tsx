"use client";

import { Panel, LiveDot, Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type PowerupRow = {
  key: string;
  label: string;
  status: string; // idle | active | witnessed | error
  detail: string;
  lastEventAt?: number;
};

// The 4 scored partner power-ups. OpenAI is the reasoning ENGINE, not a scored
// power-up (the provider isn't scored) — it lives in the agent graph, not here.
export const POWERUPS: { key: string; label: string; role: string }[] = [
  { key: "linkup", label: "Linkup", role: "Enrichissement firmographique live" },
  { key: "wispr", label: "Wispr Flow", role: "Dictée vocale de la correction" },
  { key: "elevenlabs", label: "ElevenLabs", role: "Memo audio business-value" },
  { key: "d1", label: "Cloudflare D1", role: "État + preuve live" },
];

function toneFor(status: string) {
  if (status === "witnessed") return "ok" as const;
  if (status === "active") return "accent" as const;
  if (status === "error") return "bad" as const;
  return "muted" as const;
}

export function PowerupRail({
  rows,
  loading,
}: {
  rows: PowerupRow[] | undefined;
  loading?: boolean;
}) {
  const byKey = new Map((rows ?? []).map((r) => [r.key, r]));
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {POWERUPS.map((p) => {
        const row = byKey.get(p.key);
        const status = row?.status ?? "idle";
        const tone = toneFor(status);
        return (
          <Panel
            key={p.key}
            className={cn(
              "flex flex-col gap-2 px-3 py-3 transition-colors",
              status === "witnessed" && "border-ok/25",
              status === "active" && "border-accent-line"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-offwhite">
                {p.label}
              </span>
              <LiveDot tone={tone} />
            </div>
            <div className="text-[11px] leading-tight text-faint">{p.role}</div>
            <div>
              <Badge tone={tone === "muted" ? "neutral" : tone}>
                {loading && !row ? "…" : status}
              </Badge>
            </div>
            {row?.detail ? (
              <div className="line-clamp-2 text-[11px] leading-tight text-muted">
                {row.detail}
              </div>
            ) : null}
          </Panel>
        );
      })}
    </div>
  );
}

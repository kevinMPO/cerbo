"use client";

import { Panel, Badge, Mono, Skeleton } from "@/components/ui/primitives";
import { fmtMs, fmtUsd, fmtClock } from "@/lib/utils";
import { ChevronRight, Wrench } from "lucide-react";
import { motion } from "framer-motion";

export type ToolCall = {
  tool: string;
  ok: boolean;
  latencyMs: number;
  summary: string;
};

export type Decision = {
  _id?: string;
  step: string;
  input: string;
  ruleCited: string;
  output: string;
  verdict: string;
  score?: number;
  latencyMs: number;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  toolCalls: ToolCall[];
  createdAt: number;
};

function verdictTone(v: string) {
  if (v === "qualified") return "ok" as const;
  if (v === "rejected") return "bad" as const;
  return "neutral" as const;
}

export function DecisionLog({
  decisions,
  loading,
}: {
  decisions: Decision[] | undefined;
  loading?: boolean;
}) {
  if (loading && !decisions) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Panel key={i} className="p-4">
            <Skeleton className="mb-2 h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </Panel>
        ))}
      </div>
    );
  }
  if (!decisions || decisions.length === 0) {
    return (
      <Panel className="p-6 text-center text-sm text-faint">
        Aucune décision encore. Lance le pipeline sur l'instrument.
      </Panel>
    );
  }
  return (
    <div className="space-y-2">
      {decisions.map((d, i) => (
        <motion.div
          key={d._id ?? i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Panel className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{d.step}</Badge>
              {d.verdict !== "info" && (
                <Badge tone={verdictTone(d.verdict)}>{d.verdict}</Badge>
              )}
              {typeof d.score === "number" && (
                <Mono className="text-xs text-muted">score {d.score}</Mono>
              )}
              <span className="ml-auto flex items-center gap-3 text-[11px] text-faint">
                <Mono>{fmtMs(d.latencyMs)}</Mono>
                <Mono>{fmtUsd(d.costUsd)}</Mono>
                <Mono>
                  {d.tokensIn}+{d.tokensOut} tok
                </Mono>
                <Mono>{fmtClock(d.createdAt)}</Mono>
              </span>
            </div>

            <div className="mt-3 grid gap-1 text-[13px]">
              <div className="flex gap-2">
                <span className="w-16 shrink-0 text-faint">input</span>
                <span className="text-muted">{d.input}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-16 shrink-0 text-faint">règle</span>
                <span className="text-accent">{d.ruleCited}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-16 shrink-0 text-faint">output</span>
                <span className="text-offwhite">{d.output}</span>
              </div>
            </div>

            {d.toolCalls.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-border pt-2">
                {d.toolCalls.map((t, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-2 text-[11px] text-muted"
                  >
                    <ChevronRight className="h-3 w-3 text-faint" />
                    <Wrench className="h-3 w-3 text-faint" />
                    <Mono className="text-offwhite">{t.tool}</Mono>
                    <Badge tone={t.ok ? "ok" : "bad"}>
                      {t.ok ? "ok" : "err"}
                    </Badge>
                    <span className="text-faint">{t.summary}</span>
                    <Mono className="ml-auto text-faint">
                      {fmtMs(t.latencyMs)}
                    </Mono>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>
      ))}
    </div>
  );
}

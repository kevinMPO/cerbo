"use client";

import { Panel, Badge, Mono } from "@/components/ui/primitives";
import { fmtClock } from "@/lib/utils";
import { motion } from "framer-motion";

export type Rule = { id: string; text: string; origin: string };
export type Brain = {
  version: number;
  rules: Rule[];
  createdAt?: number;
  note?: string;
};

function ruleChanged(v1: Brain, v2: Brain, id: string): boolean {
  const a = v1.rules.find((r) => r.id === id)?.text;
  const b = v2.rules.find((r) => r.id === id)?.text;
  return !!a && !!b && a !== b;
}

function Column({
  brain,
  other,
  side,
}: {
  brain: Brain;
  other?: Brain;
  side: "v1" | "v2";
}) {
  return (
    <Panel className="flex-1 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone={side === "v2" ? "ok" : "neutral"}>
            company-brain v{brain.version}
          </Badge>
          {brain.createdAt ? (
            <Mono className="text-[11px] text-faint">
              {fmtClock(brain.createdAt)}
            </Mono>
          ) : null}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {brain.rules.map((r) => {
          const changed = other ? ruleChanged(
            side === "v1" ? brain : other,
            side === "v1" ? other : brain,
            r.id
          ) : false;
          return (
            <motion.div
              key={r.id}
              initial={changed ? { backgroundColor: "rgba(94,230,208,0.18)" } : false}
              animate={{ backgroundColor: "rgba(255,255,255,0)" }}
              transition={{ duration: 1.4 }}
              className={
                "rounded-lg border p-2.5 text-[13px] " +
                (changed
                  ? side === "v2"
                    ? "border-ok/40 bg-ok/5"
                    : "border-bad/30 bg-bad/5"
                  : "border-border")
              }
            >
              <div className="flex items-center gap-2">
                <Mono className="text-accent">{r.id}</Mono>
                {changed && (
                  <Badge tone={side === "v2" ? "ok" : "bad"}>
                    {side === "v2" ? "corrigée" : "défaillante"}
                  </Badge>
                )}
              </div>
              <p className="mt-1 leading-snug text-muted">{r.text}</p>
              <p className="mt-1 text-[11px] text-faint">{r.origin}</p>
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}

export function BrainDiff({ v1, v2 }: { v1?: Brain; v2?: Brain }) {
  if (!v1) {
    return (
      <Panel className="p-6 text-center text-sm text-faint">
        Le brain v1 apparaîtra ici après l'ingest.
      </Panel>
    );
  }
  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <Column brain={v1} other={v2} side="v1" />
      {v2 ? (
        <Column brain={v2} other={v1} side="v2" />
      ) : (
        <Panel className="flex-1 border-dashed p-6 text-center text-sm text-faint">
          La v2 s'écrira ici après la correction vocale.
        </Panel>
      )}
    </div>
  );
}

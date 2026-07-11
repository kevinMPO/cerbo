"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Check, X, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Self-contained, presentational hero visual. Loops the product's defining
 * moment: a high-value lead rejected by v1, corrected by one spoken sentence,
 * then qualified by v2 — mirroring the real /product flow. No network.
 */

const CORRECTION =
  "Atelier Nord is a real lead — ex-VP Revenue founder, stated budget. Stop rejecting advisory firms that show buying intent.";

const PHASES = 4; // 0 evaluating · 1 rejected v1 · 2 voice correction · 3 qualified v2

function Waveform({ active }: { active: boolean }) {
  const bars = [8, 16, 11, 22, 14, 26, 12, 19, 9, 24, 15, 20, 10, 17];
  return (
    <div className="flex h-7 items-center gap-[3px]">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-accent"
          animate={
            active
              ? { height: [h * 0.4, h, h * 0.5, h * 0.9, h * 0.4] }
              : { height: 3 }
          }
          transition={{
            duration: 0.9,
            repeat: active ? Infinity : 0,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

export function ConsolePreview() {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState("");

  // phase clock
  useEffect(() => {
    const durations = [1400, 2200, 2600, 3200];
    const t = setTimeout(
      () => setPhase((p) => (p + 1) % PHASES),
      durations[phase]
    );
    return () => clearTimeout(t);
  }, [phase]);

  // typewriter for the dictated correction during phase 2
  useEffect(() => {
    if (phase !== 2) {
      setTyped("");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTyped(CORRECTION.slice(0, i));
      if (i >= CORRECTION.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [phase]);

  const version = phase >= 3 ? 2 : 1;

  return (
    <div className="glow relative">
      <div className="panel relative z-10 overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="num text-[12px] font-medium text-offwhite">
              cerbo
            </span>
            <span className="text-[11px] text-faint">/ console</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              key={version}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "num rounded-md border px-2 py-0.5 text-[11px]",
                version === 2
                  ? "border-ok/40 bg-ok/5 text-ok"
                  : "border-border text-muted"
              )}
            >
              company-brain v{version}
            </motion.span>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {/* lead card */}
          <div className="rounded-lg border border-border bg-canvas/60 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-offwhite">
                  Atelier Nord
                </div>
                <div className="num text-[11px] text-faint">
                  Revenue Advisory · 1–10 · EU
                </div>
              </div>
              <VerdictBadge phase={phase} />
            </div>

            {/* rule cited */}
            <div className="mt-3 flex items-start gap-2 border-t border-border pt-2.5 text-[12px]">
              <span className="w-12 shrink-0 text-faint">rule</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase >= 3 ? "v2" : "v1"}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.25 }}
                  className={phase >= 3 ? "text-accent" : "text-muted"}
                >
                  {phase >= 3
                    ? "R3 (v2) — advisory + buying signal + senior founder → qualify"
                    : "R3 (v1) — auto-reject advisory / founder-led"}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* voice correction row */}
          <div
            className={cn(
              "rounded-lg border p-3 transition-colors",
              phase === 2
                ? "border-accent-line bg-accent-dim"
                : "border-border bg-canvas/40"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  phase === 2 ? "bg-accent text-[#04120f]" : "bg-surface-2 text-faint"
                )}
              >
                <Mic className="h-4 w-4" />
              </span>
              {phase === 2 ? (
                <Waveform active />
              ) : (
                <span className="text-[12px] text-faint">
                  Voice correction (Wispr Flow)
                </span>
              )}
            </div>
            <div className="mt-2 min-h-[32px] text-[12px] leading-snug text-muted">
              {phase === 2 ? (
                <span>
                  “{typed}
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-accent align-middle" />
                  ”
                </span>
              ) : phase >= 3 ? (
                <span className="flex items-center gap-1.5 text-ok">
                  <FileCheck className="h-3.5 w-3.5" /> skill written · brain v1 → v2
                </span>
              ) : (
                <span className="text-faint">Say one sentence to correct it.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* progress ticks */}
      <div className="relative z-10 mt-3 flex justify-center gap-1.5">
        {Array.from({ length: PHASES }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === phase ? "w-6 bg-accent" : "w-1.5 bg-white/15"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function VerdictBadge({ phase }: { phase: number }) {
  if (phase === 0) {
    return (
      <span className="num flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-faint">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-faint" />
        evaluating
      </span>
    );
  }
  const qualified = phase >= 3;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={qualified ? "q" : "r"}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "num flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium uppercase",
          qualified
            ? "border-ok/40 bg-ok/10 text-ok"
            : "border-bad/40 bg-bad/10 text-bad"
        )}
      >
        {qualified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {qualified ? "qualified · 97" : "rejected · 12"}
      </motion.span>
    </AnimatePresence>
  );
}

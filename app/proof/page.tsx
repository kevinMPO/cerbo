"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCheck, Clock, Boxes, ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import {
  Panel,
  Badge,
  Button,
  Mono,
  LiveDot,
  StatTile,
  SectionTitle,
} from "@/components/ui/primitives";
import { PowerupRail, POWERUPS, type PowerupRow } from "@/components/PowerupRail";
import { DecisionLog, type Decision } from "@/components/DecisionLog";
import { ReceiptTable, type Receipt } from "@/components/ReceiptTable";
import { getSessionId } from "@/lib/session";
import { useLive } from "@/lib/useLive";
import { AuthGate } from "@/components/AuthGate";
import { fmtUsd, fmtDate } from "@/lib/utils";

export default function ProofPage() {
  const [sessionId, setSessionId] = useState("");
  useEffect(() => setSessionId(getSessionId()), []);
  const live = useLive(sessionId);

  const receipts = live.receipts as Receipt[];
  const skills = live.skills as any[];
  const powerups = live.powerups as PowerupRow[];
  const decisions = live.decisions as Decision[];
  const waitlist = live.waitlist;

  const ready = live.ready;
  const totalCost = (receipts ?? []).reduce((s, r) => s + (r.costUsd || 0), 0);
  // Count only the 4 scored power-ups (OpenAI is the engine, not scored).
  const scoredKeys = new Set(POWERUPS.map((p) => p.key));
  const witnessed = (powerups ?? []).filter(
    (p) => scoredKeys.has(p.key) && p.status === "witnessed"
  ).length;
  // Business-first outcomes — all computed live from D1, nothing hardcoded.
  const qualified = (decisions ?? []).filter((d) => d.verdict === "qualified").length;
  const rulesLearned = (skills ?? []).length;
  const decisionsCount = (decisions ?? []).length;

  return (
    <AuthGate>
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-faint">
            <span className="num">08 / PREUVE</span>
            <span className="flex items-center gap-1.5">
              <LiveDot tone={ready ? "accent" : "muted"} />
              {ready ? "Cloudflare D1 live" : "connexion…"}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-offwhite">
            Preuve — sourcée Cloudflare D1, en direct
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Tout ce que l'agent a fait, lu depuis la base temps réel. Rien n'est
            codé en dur : chaque chiffre vient d'un run.
          </p>
        </div>

        {ready && decisionsCount === 0 && (
          <Panel className="mb-6 flex flex-col items-center gap-3 p-8 text-center">
            <Boxes className="h-6 w-6 text-faint" />
            <div>
              <h3 className="text-sm font-medium text-offwhite">Aucun run pour l'instant</h3>
              <p className="mt-1 max-w-md text-[13px] text-muted">
                Ouvre la Console et clique <b className="text-offwhite">Run</b> — receipts, skills et décisions apparaîtront ici en direct, sourcés depuis Cloudflare D1.
              </p>
            </div>
            <Link href="/product">
              <Button variant="primary">
                Ouvrir la Console <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Panel>
        )}

        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Leads qualifiés" value={<Mono>{qualified}</Mono>} tone="accent" sub="décisions sourcées" />
          <StatTile label="Règles apprises" value={<Mono>{rulesLearned}</Mono>} sub="corrections → skills" />
          <StatTile label="Décisions tracées" value={<Mono>{decisionsCount}</Mono>} sub={`${witnessed}/${POWERUPS.length} power-ups · ${receipts?.length ?? 0} receipts`} />
          <StatTile label="Coût réel cumulé" value={<Mono>{fmtUsd(totalCost)}</Mono>} sub="usage × tarif" />
        </div>

        <div className="mb-6">
          <SectionTitle index="—" title="Statut live des power-ups" />
          <div className="mt-3">
            <PowerupRail rows={powerups} loading={!ready} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <SectionTitle index="—" title="Skills horodatés (v1 → v2)" right={<Boxes className="h-4 w-4 text-faint" />} />
            {!skills || skills.length === 0 ? (
              <Panel className="p-6 text-center text-sm text-faint">
                Le skill v2 apparaîtra après la correction vocale.
              </Panel>
            ) : (
              <div className="space-y-2">
                {skills.map((s: any) => (
                  <Panel key={s._id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-accent" />
                        <Mono className="text-[13px] text-offwhite">{s.filename}</Mono>
                      </div>
                      <Badge tone="ok">v{s.version}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-faint">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> <Mono>{fmtDate(s.createdAt)}</Mono>
                      </span>
                      <span>brain v{s.brainVersion}</span>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <SectionTitle index="—" title="Receipts Hermes (provider / model)" />
            <ReceiptTable receipts={receipts} loading={!ready} />
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle index="—" title="Decision log complet" right={<Mono className="text-[11px] text-faint">{decisions?.length ?? 0} entrées</Mono>} />
          <div className="mt-3">
            <DecisionLog decisions={decisions} loading={!ready} />
          </div>
        </div>
      </main>
    </div>
    </AuthGate>
  );
}

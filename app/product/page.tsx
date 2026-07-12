"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Play,
  Sparkles,
  Mic,
  Volume2,
  RotateCcw,
  Brain as BrainIcon,
  Radio,
  Zap,
  Check,
  X,
  VolumeX,
  Upload,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import {
  Button,
  Panel,
  Badge,
  Mono,
  LiveDot,
  StatTile,
  SectionTitle,
  Kbd,
} from "@/components/ui/primitives";
import { PowerupRail, type PowerupRow } from "@/components/PowerupRail";
import { AgentGraph } from "@/components/AgentGraph";
import { DecisionLog, type Decision } from "@/components/DecisionLog";
import { BrainDiff, type Brain } from "@/components/BrainDiff";
import { getSessionId, newSessionId } from "@/lib/session";
import { useAgent } from "@/lib/useAgent";
import { useLive } from "@/lib/useLive";
import { AuthGate } from "@/components/AuthGate";
import { useLang } from "@/lib/i18n";
import { parseLeads } from "@/lib/parseLeads";
import type { SeedLead } from "@/data/seed";
import { EXAMPLE_LEADS, type ExampleLead } from "@/data/examples";
import { fmtMs, fmtUsd, cn } from "@/lib/utils";

type QualifyResult = {
  lead: { company: string; industry: string; sizeBand: string; region: string };
  enrichment: { employees: string; fundingStage: string; buyingSignal: string; founderNote: string; sources: string[] };
  live: boolean;
  verdict: string;
  score: number;
  ruleCited: string;
  rationale: string;
  confidence?: number;
  engine?: string;
};

export default function ProductPage() {
  const { lang } = useLang();
  const [sessionId, setSessionId] = useState<string>("");
  const [fallback, setFallback] = useState(false);
  useEffect(() => setSessionId(getSessionId()), []);

  // Hidden fallback toggle: Shift+F (network-cut rehearsal).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "F" || e.key === "f")) {
        setFallback((v) => {
          toast.message(!v ? "Mode fallback ON (offline)" : "Mode fallback OFF");
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { call, busy } = useAgent(sessionId, fallback);
  const live = useLive(sessionId);
  const brains = live.brains as (Brain & { markdown: string })[];
  const decisions = live.decisions as Decision[];
  const powerups = live.powerups as PowerupRow[];
  const leads = live.leads;

  const v1 = brains?.find((b) => b.version === 1);
  const v2 = brains?.find((b) => b.version === 2);
  const brainMax = brains?.reduce((m, b) => Math.max(m, b.version), 0) ?? 0;

  const [qualify, setQualify] = useState<QualifyResult | null>(null);
  const [correctV1, setCorrectV1] = useState<QualifyResult | null>(null);
  const [correctV2, setCorrectV2] = useState<QualifyResult | null>(null);
  const [correction, setCorrection] = useState("");
  const [memo, setMemo] = useState<{ text: string; audio: string | null; live: boolean } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Uploaded leads (CSV/Excel) — used by ingest instead of the seed set.
  const [uploaded, setUploaded] = useState<SeedLead[] | null>(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const leads = await parseLeads(f);
      if (!leads.length) {
        toast.error("Aucun lead trouvé", {
          description: "Vérifie qu'une colonne company / entreprise existe.",
        });
        return;
      }
      setUploaded(leads);
      setFileName(f.name);
      toast.success(`${leads.length} leads importés`, { description: f.name });
    } catch (err) {
      toast.error("Import échoué", { description: String(err) });
    } finally {
      e.target.value = "";
    }
  }

  // Live ElevenLabs narrator — speaks a plain-language line as each step runs.
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  function playVoice(key: string) {
    if (!voiceOn || typeof window === "undefined") return;
    try {
      voiceRef.current?.pause();
      const a = new Audio(`/narration/${lang}/${key}.mp3`);
      voiceRef.current = a;
      a.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }

  // A short "learned" chime (Web Audio, no asset) when the skill/fix lands.
  function playChime() {
    if (typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const t0 = ctx.currentTime;
      [
        [587.33, t0], // D5
        [880.0, t0 + 0.11], // A5
        [1174.66, t0 + 0.22], // D6
      ].forEach(([f, t]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f as number;
        const tt = t as number;
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(0.16, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.4);
        o.connect(g).connect(ctx.destination);
        o.start(tt);
        o.stop(tt + 0.45);
      });
    } catch {
      /* ignore */
    }
  }

  const totals = useMemo(() => {
    const d = decisions ?? [];
    return {
      cost: d.reduce((s, x) => s + (x.costUsd || 0), 0),
      latency: d.reduce((s, x) => s + (x.latencyMs || 0), 0),
      count: d.length,
      qualified: d.filter((x) => x.verdict === "qualified").length,
    };
  }, [decisions]);

  // --- pipeline actions ---
  const DICTATION =
    "Atelier Nord est un vrai lead : fondateur ex-VP Revenue, budget déclaré. Ne rejette plus les cabinets conseil qui ont un signal d'achat et un fondateur senior.";

  async function runIngest() {
    playVoice("ingest");
    await call("ingest", uploaded ? { leads: uploaded } : {});
    toast.success("Ingest terminé", {
      description: uploaded
        ? `company-brain v1 inféré depuis ${uploaded.length} leads importés`
        : "company-brain v1 inféré",
    });
  }
  async function runQualify() {
    playVoice("qualify");
    const r = await call("qualify", { extId: "L-002", brainVersion: v2 ? 2 : 1 });
    setQualify(r);
    toast.success(`Lead ${r.verdict}`, { description: `${r.lead.company} · règle ${r.ruleCited}` });
  }
  // Qualify a real company from a one-click chip (no CSV) — Linkup resolves the
  // SIREN live, the agent qualifies it against the current brain rules.
  async function runExample(ex: ExampleLead) {
    const lead = {
      extId: `EX-${ex.siren}`,
      company: ex.name,
      domain: ex.domain,
      industry: ex.industry,
      sizeBand: "?",
      region: ex.region,
      signal: `SIREN ${ex.siren}`,
    };
    const r = await call("qualify", { lead, brainVersion: v2 ? 2 : 1 });
    setQualify(r);
    toast[r.verdict === "qualified" ? "success" : "message"](
      `${ex.name} → ${r.verdict}`,
      { description: `règle ${r.ruleCited} · confiance ${r.confidence ?? "?"}%` }
    );
  }
  async function runCorrectV1() {
    playVoice("correct-v1");
    const r = await call("correct", { action: "run-v1" });
    setCorrectV1(r);
    toast.message("v1 : lead raté", { description: `${r.lead.company} → ${r.verdict} (${r.ruleCited})` });
  }
  function dictate() {
    setCorrection(DICTATION);
    toast.message("Dictée Wispr transcrite", { description: "Champ correction rempli" });
  }
  async function applyCorrection(text?: string) {
    playVoice("correct-apply");
    const t = (text ?? correction).trim() || DICTATION;
    if (!correction.trim()) setCorrection(t);
    const r = await call("correct", { action: "apply", correctionText: t });
    toast.success("Correction appliquée", { description: `brain v2 + skill ${r.skill.filename}` });
  }
  async function runCorrectV2() {
    playVoice("correct-v2");
    const r = await call("correct", { action: "run-v2" });
    setCorrectV2(r);
    if (r.verdict === "qualified") playChime();
    toast.success("v2 : lead récupéré", { description: `${r.lead.company} → ${r.verdict} (${r.ruleCited})` });
  }
  async function runMemo() {
    const r = await call("memo");
    setMemo({ text: r.memoText, audio: r.audioBase64, live: r.live });
    setTimeout(() => audioRef.current?.play().catch(() => {}), 200);
  }
  async function runMemory() {
    playVoice("memory");
    const r = await call("memory");
    toast[r.persisted ? "success" : "message"](
      r.persisted ? "Mémoire persistée" : "Mémoire non persistée",
      { description: `${r.lead.company} → ${r.verdict} (reload ${r.reloadedFrom})` }
    );
  }
  async function resetAll() {
    await call("reset");
    setQualify(null); setCorrectV1(null); setCorrectV2(null); setMemo(null); setCorrection("");
    setUploaded(null); setFileName("");
    setSessionId(newSessionId());
    toast.message("Session réinitialisée");
  }

  // ---- guided onboarding ----
  const [auto, setAuto] = useState(false);
  const autoRef = useRef(false);
  const [coach, setCoach] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined")
      setCoach(!window.localStorage.getItem("cerbo:onboarded"));
  }, []);
  function dismissCoach() {
    setCoach(false);
    if (typeof window !== "undefined")
      window.localStorage.setItem("cerbo:onboarded", "1");
  }

  const doneSteps = new Set((decisions ?? []).map((d) => d.step));
  const STEPS: { key: string; label: string; run: () => Promise<void>; done: boolean }[] = [
    { key: "ingest", label: "Ingest", run: runIngest, done: doneSteps.has("ingest") },
    { key: "qualify", label: "Qualify", run: runQualify, done: doneSteps.has("qualify") },
    { key: "run-v1", label: "Run v1", run: runCorrectV1, done: doneSteps.has("correct-v1") },
    { key: "apply", label: "Correct", run: () => applyCorrection(DICTATION), done: doneSteps.has("correct-apply") || !!v2 },
    { key: "run-v2", label: "Re-run v2", run: runCorrectV2, done: doneSteps.has("correct-v2") },
    { key: "memo", label: "Memo", run: runMemo, done: doneSteps.has("memo") },
    { key: "memory", label: "Memory", run: runMemory, done: doneSteps.has("memory") },
  ];
  const nextIdx = STEPS.findIndex((s) => !s.done);
  const nextStep = nextIdx >= 0 ? STEPS[nextIdx] : null;
  const doneCount = STEPS.filter((s) => s.done).length;

  // Plain-language narrator — the single line that makes the live demo clear.
  const NEXT_DESC: Record<string, string> = {
    ingest: "Commence ici — CERBO lit tes 20 leads et écrit son rulebook (company-brain v1).",
    qualify: "Qualifie un lead standard, enrichi en live par Linkup, règle citée.",
    "run-v1": "Le piège : lance « Atelier Nord », un excellent lead que la v1 va rejeter à tort.",
    apply: "Dicte le correctif (Wispr) puis Applique — le brain se réécrit en v2 + nouveau skill.",
    "run-v2": "Re-run le MÊME lead — il passe qualifié. C'est le moment fort de la démo.",
    memo: "Laisse CERBO énoncer la valeur business — ElevenLabs le lit à voix haute.",
    memory: "Prouve la mémoire : une nouvelle session recharge le correctif depuis D1.",
  };
  const story: { tone: "run" | "next" | "done"; text: string } = busy
    ? busy === "ingest"
      ? { tone: "run", text: "Lecture de 20 leads → CERBO infère ses règles de qualification (brain v1)…" }
      : busy === "qualify"
        ? { tone: "run", text: "Enrichissement Linkup en live, puis qualification avec la règle décisive…" }
        : busy === "correct" && !correctV1
          ? { tone: "run", text: "Atelier Nord passe dans la v1 — regarde-le se faire rejeter à tort (règle R3)…" }
          : busy === "correct" && !v2
            ? { tone: "run", text: "Application de ta correction vocale — le brain se réécrit en v2…" }
            : busy === "correct"
              ? { tone: "run", text: "Re-run du MÊME lead en v2 — il est maintenant qualifié. Correctif permanent…" }
              : busy === "memo"
                ? { tone: "run", text: "OpenAI rédige un memo de valeur business ; ElevenLabs le joue dans le produit…" }
                : busy === "memory"
                  ? { tone: "run", text: "Nouvelle session : le brain se recharge depuis D1 et applique v2 sans ré-apprentissage…" }
                  : { tone: "run", text: "En cours…" }
    : nextStep
      ? { tone: "next", text: NEXT_DESC[nextStep.key] ?? "" }
      : { tone: "done", text: "Terminé — CERBO a rattrapé le lead qu'il ratait. Ouvre l'onglet Proof pour les receipts." };

  async function autoPlay() {
    if (autoRef.current) {
      autoRef.current = false;
      setAuto(false);
      return;
    }
    autoRef.current = true;
    setAuto(true);
    try {
      const runners = [runIngest, runQualify, runCorrectV1, () => applyCorrection(DICTATION), runCorrectV2, runMemo, runMemory];
      const start = Math.max(0, nextIdx < 0 ? runners.length : nextIdx);
      for (let i = start; i < runners.length; i++) {
        if (!autoRef.current) break;
        const fn = runners[i];
        if (fn) await fn();
        await new Promise((r) => setTimeout(r, 700));
      }
    } catch {
      /* toast already shown */
    }
    autoRef.current = false;
    setAuto(false);
  }

  const convexReady = live.ready;

  return (
    <AuthGate>
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-faint">
              <span className="num">05 / INSTRUMENT</span>
              {fallback && <Badge tone="warn">fallback</Badge>}
              {!convexReady && <Badge tone="bad">D1 hors-ligne</Badge>}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-offwhite">
              CERBO — poste de qualification
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Pas un chatbot. Un instrument : chaque étape logue une décision
              sourcée — règle citée, latence, coût, arbre des tool calls.
              <span className="ml-2 text-faint">Session <Mono>{sessionId || "…"}</Mono></span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              variant={uploaded ? "default" : "default"}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!busy}
              className={uploaded ? "border-accent-line text-accent" : ""}
            >
              <Upload className="h-3.5 w-3.5" />
              {uploaded ? `${uploaded.length} leads · ${fileName.slice(0, 16)}` : "Importer leads (CSV/Excel)"}
            </Button>
            <a
              href="/cerbo-leads-template.xlsx"
              download
              className="text-[11px] text-faint underline-offset-2 hover:text-muted hover:underline"
              title="Télécharger le modèle (colonnes attendues)"
            >
              Modèle
            </a>
            <Button variant="ghost" size="sm" onClick={resetAll} disabled={!!busy}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* onboarding coach (first visit) */}
        {coach && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent-line/40 bg-accent-dim px-4 py-3 animate-fade-in">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="flex-1 text-[13px] text-offwhite">
              <span className="font-medium">Nouveau ici&nbsp;?</span>{" "}
              <span className="text-muted">
                Clique <b className="font-medium text-offwhite">Auto-play</b> pour voir
                CERBO qualifier tes leads, en rater un à forte valeur, puis se corriger
                <b className="font-medium text-offwhite"> à la voix</b> — tout seul. Ou avance
                pas à pas avec <b className="font-medium text-offwhite">Run</b>. Active le son 🔊
                pour la narration.
              </span>
            </div>
            <button onClick={dismissCoach} className="text-faint hover:text-offwhite" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* guided run bar (sticky) — always shows the single next action */}
        <div className="sticky top-14 z-30 mb-6 rounded-xl border border-border bg-surface/95 px-4 py-2.5 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <span
                    className={cn(
                      "flex h-6 items-center gap-1.5 rounded-md border px-1.5 text-[11px] transition-colors",
                      s.done
                        ? "border-ok/40 text-ok"
                        : i === nextIdx
                          ? "border-accent-line bg-accent-dim text-accent"
                          : "border-border text-faint"
                    )}
                  >
                    {s.done ? <Check className="h-3 w-3" /> : <span className="num">{i + 1}</span>}
                    <span className="hidden md:inline">{s.label}</span>
                  </span>
                  {i < STEPS.length - 1 && <span className="mx-1 h-px w-2.5 bg-white/10" />}
                </div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Mono className="text-[11px] text-faint">{doneCount}/{STEPS.length}</Mono>
              {nextStep ? (
                <Button variant="primary" size="sm" onClick={() => nextStep.run()} disabled={!!busy || auto}>
                  {busy ? <><LiveDot /> en cours…</> : <><Play className="h-3.5 w-3.5" /> Run&nbsp;: {nextStep.label}</>}
                </Button>
              ) : (
                <Badge tone="ok"><Check className="h-3 w-3" /> Démo complète</Badge>
              )}
              <button
                onClick={() => setVoiceOn((v) => !v)}
                title="Narrateur ElevenLabs à voix haute"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  voiceOn ? "border-accent-line text-accent" : "border-border text-faint hover:text-offwhite"
                )}
              >
                {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <Button variant={auto ? "danger" : "default"} size="sm" onClick={autoPlay} disabled={!!busy && !auto}>
                <Zap className="h-3.5 w-3.5" /> {auto ? "Stop" : "Auto-play"}
              </Button>
            </div>
          </div>
          {/* narrator — plain-language what's happening / what to do next */}
          <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5 text-[13px]">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                story.tone === "run"
                  ? "bg-accent animate-pulse-dot"
                  : story.tone === "done"
                    ? "bg-ok"
                    : "bg-accent"
              )}
            />
            <span className={story.tone === "done" ? "text-ok" : "text-offwhite"}>
              {story.text}
            </span>
          </div>
        </div>

        {/* zero-CSV: qualify a real company in one click */}
        <div className="mb-6">
          <SectionTitle
            index="—"
            title="Sans CSV ? Qualifie une entreprise en 1 clic"
            right={<span className="flex items-center gap-1.5 text-[11px] text-faint"><LiveDot />Linkup live</span>}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_LEADS.map((ex) => (
              <button
                key={ex.siren}
                onClick={() => runExample(ex)}
                disabled={!!busy}
                className="group flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-offwhite transition-colors hover:border-accent-line disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Building2 className="h-3.5 w-3.5 text-accent" /> {ex.name}
                <span className="num text-[10px] text-faint">{ex.siren}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-faint">
            Linkup résout le SIREN en direct → l'agent qualifie avec les règles de{" "}
            <b className="text-muted">ton Company Brain</b>. C'est à ça qu'il sert ensuite :
            juger <b className="text-muted">n'importe quelle entreprise</b> avec tes règles, en citant la décisive.
          </p>
        </div>

        {/* stat row */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Décisions" value={<Mono>{totals.count}</Mono>} />
          <StatTile label="Qualifiés" value={<Mono>{totals.qualified}</Mono>} tone="accent" />
          <StatTile label="Coût cumulé" value={<Mono>{fmtUsd(totals.cost)}</Mono>} sub="usage × tarif réel" />
          <StatTile label="Latence cumulée" value={<Mono>{fmtMs(totals.latency)}</Mono>} />
        </div>

        {/* agent graph — live */}
        <div className="mb-6">
          <SectionTitle index="—" title="Agent graph — live" right={<span className="flex items-center gap-1.5 text-[11px] text-faint"><LiveDot />{busy ? busy : "idle"}</span>} />
          <div className="mt-3">
            <AgentGraph
              powerups={powerups}
              busyStep={busy}
              brainMax={brainMax}
              hasReceipts={(live.receipts?.length ?? 0) > 0}
              leadCount={leads?.length ?? 0}
            />
          </div>
        </div>

        {/* power-ups */}
        <div className="mb-6">
          <SectionTitle index="—" title="Power-ups (witnessables)" right={<span className="flex items-center gap-1.5 text-[11px] text-faint"><LiveDot />live</span>} />
          <div className="mt-3">
            <PowerupRail rows={powerups} loading={!convexReady} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* control column */}
          <div className="space-y-3">
            <SectionTitle index="—" title="Pipeline" />
            <Panel className="space-y-2 p-4">
              <StepButton n="1" icon={<Radio className="h-4 w-4" />} label="Ingest → brain v1" hint="20 leads → 4 règles inférées" onClick={runIngest} loading={busy === "ingest"} disabled={!!busy} highlight={nextStep?.key === "ingest"} />
              <StepButton n="2" icon={<Sparkles className="h-4 w-4" />} label="Qualify + Linkup" hint="lead standard, enrichissement live" onClick={runQualify} loading={busy === "qualify"} disabled={!!busy || !v1} highlight={nextStep?.key === "qualify"} />
            </Panel>

            {/* THE PEAK */}
            <Panel className="space-y-3 border-accent-line/40 p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-offwhite">Correction vocale — le pic</span>
              </div>
              <StepButton n="3" icon={<Play className="h-4 w-4" />} label="Run v1 : Atelier Nord" hint="lead raté volontaire → rejeté (R3)" onClick={runCorrectV1} loading={busy === "correct" && !correctV1} disabled={!!busy || !v1} tone={correctV1?.verdict === "rejected" ? "bad" : undefined} highlight={nextStep?.key === "run-v1"} />
              <div className="space-y-2 rounded-lg border border-border p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-faint">Dictée correction</span>
                  <Button size="sm" variant="ghost" onClick={dictate} disabled={!!busy}>
                    <Mic className="h-3.5 w-3.5" /> Dicter (Wispr)
                  </Button>
                </div>
                <textarea
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                  placeholder="Dicte la correction… (Wispr Flow remplit ce champ)"
                  className="h-20 w-full resize-none rounded-md border border-border bg-canvas px-3 py-2 text-[13px] text-offwhite outline-none focus:border-accent-line"
                />
                <Button variant="primary" size="sm" className={cn("w-full", nextStep?.key === "apply" && correction.trim() && "ring-1 ring-accent-line")} onClick={() => applyCorrection()} disabled={!!busy || !correction.trim() || !v1}>
                  Appliquer → brain v2 + skill
                </Button>
              </div>
              <StepButton n="4" icon={<Play className="h-4 w-4" />} label="Re-run v2 : Atelier Nord" hint="même lead → qualifié (R3 v2)" onClick={runCorrectV2} loading={busy === "correct" && !correctV2} disabled={!!busy || !v2} tone={correctV2?.verdict === "qualified" ? "ok" : undefined} highlight={nextStep?.key === "run-v2"} />
            </Panel>

            <Panel className="space-y-2 p-4">
              <StepButton n="5" icon={<Volume2 className="h-4 w-4" />} label="Memo ElevenLabs" hint="business-value, 2 phrases, joué ici" onClick={runMemo} loading={busy === "memo"} disabled={!!busy} highlight={nextStep?.key === "memo"} />
              <StepButton n="6" icon={<BrainIcon className="h-4 w-4" />} label="Memory : reload au boot" hint="nouvelle session applique v2" onClick={runMemory} loading={busy === "memory"} disabled={!!busy} highlight={nextStep?.key === "memory"} />
              {memo && (
                <div className="rounded-lg border border-border p-2.5">
                  <p className="text-[12px] text-muted">{memo.text}</p>
                  {memo.audio ? (
                    <audio ref={audioRef} controls className="mt-2 w-full" src={`data:audio/mpeg;base64,${memo.audio}`} />
                  ) : (
                    <Badge tone="warn" className="mt-2">audio offline — texte seul</Badge>
                  )}
                </div>
              )}
            </Panel>

            <p className="px-1 text-[11px] text-faint">
              Astuce démo : <Kbd>⇧F</Kbd> bascule le mode fallback (réseau coupé).
            </p>
          </div>

          {/* instrument column */}
          <div className="space-y-6">
            {correctV1 && correctV2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="glow relative overflow-hidden rounded-2xl border border-ok/40 bg-ok/[0.06] p-5"
              >
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 text-center sm:gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] uppercase tracking-wide text-faint">v1</span>
                    <span className="num text-3xl font-semibold text-bad">rejeté · {correctV1.score}</span>
                  </div>
                  <motion.span
                    animate={{ x: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className="text-accent"
                  >
                    <ArrowRight className="h-7 w-7" />
                  </motion.span>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] uppercase tracking-wide text-faint">v2</span>
                    <span className="num text-3xl font-semibold text-ok">qualifié · {correctV2.score}</span>
                  </div>
                </div>
                <p className="relative z-10 mt-3 text-center text-[13px] text-muted">
                  <b className="font-medium text-offwhite">Atelier Nord</b> récupéré après{" "}
                  <b className="font-medium text-offwhite">une seule</b> correction vocale — corrigé une fois, jamais deux.
                </p>
              </motion.div>
            )}
            <div>
              <SectionTitle index="—" title="company-brain — diff v1 | v2" />
              <div className="mt-3">
                <BrainDiff v1={v1} v2={v2} />
              </div>
            </div>

            {(correctV1 || correctV2 || qualify) && (
              <div>
                <SectionTitle index="—" title="Enrichissement Linkup (dernier lead)" />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {correctV1 && <EnrichCard title="v1" r={correctV1} />}
                  {correctV2 && <EnrichCard title="v2" r={correctV2} />}
                  {qualify && !correctV1 && <EnrichCard title="qualify" r={qualify} />}
                </div>
              </div>
            )}

            <div>
              <SectionTitle index="—" title="Decision log" right={<Mono className="text-[11px] text-faint">{totals.count} entrées</Mono>} />
              <div className="mt-3">
                <DecisionLog decisions={decisions} loading={!convexReady} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </AuthGate>
  );
}

function StepButton({
  n, icon, label, hint, onClick, loading, disabled, tone, highlight,
}: {
  n: string; icon: React.ReactNode; label: string; hint: string;
  onClick: () => void; loading?: boolean; disabled?: boolean;
  tone?: "ok" | "bad"; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40",
        tone === "ok"
          ? "border-ok/40 bg-ok/5"
          : tone === "bad"
            ? "border-bad/40 bg-bad/5"
            : "border-border bg-surface-2 hover:border-border-strong hover:bg-[#1c1c21]",
        highlight && !disabled && "ring-1 ring-accent-line shadow-[0_0_20px_-6px_rgba(94,230,208,0.5)]"
      )}
    >
      <span className={cn("num flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs", highlight && !disabled ? "border-accent-line text-accent" : "border-border text-faint")}>
        {loading ? <LiveDot /> : n}
      </span>
      <span className="text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-offwhite">{label}</span>
        <span className="block truncate text-[11px] text-faint">{hint}</span>
      </span>
    </button>
  );
}

function EnrichCard({ title, r }: { title: string; r: QualifyResult }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Panel className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{title}</Badge>
            <span className="text-sm font-medium text-offwhite">{r.lead.company}</span>
          </div>
          <div className="flex items-center gap-2">
            {typeof r.confidence === "number" && (
              <span className="num text-[11px] text-faint">conf {r.confidence}%</span>
            )}
            <Badge tone={r.verdict === "qualified" ? "ok" : "bad"}>{r.verdict} · {r.score}</Badge>
          </div>
        </div>
        <div className="mt-3 space-y-1.5 text-[12px]">
          <Row k="Effectif" v={r.enrichment.employees} />
          <Row k="Funding" v={r.enrichment.fundingStage} />
          <Row k="Signal" v={r.enrichment.buyingSignal} />
          {r.enrichment.founderNote && <Row k="Fondateur" v={r.enrichment.founderNote} />}
          <Row k="Règle" v={r.ruleCited} accent />
          {r.rationale && <Row k="Raison" v={r.rationale} />}
          <div className="flex items-center gap-2 pt-1">
            {r.engine && (
              <Badge tone={r.engine === "llm" ? "accent" : "neutral"}>
                {r.engine === "llm" ? "décidé par IA" : "fallback"}
              </Badge>
            )}
            <Badge tone={r.live ? "ok" : "warn"}>{r.live ? "Linkup LIVE" : "Linkup cache"}</Badge>
            {r.enrichment.sources?.slice(0, 2).map((s, i) => (
              <span key={i} className="num truncate text-[10px] text-faint">{s}</span>
            ))}
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-faint">{k}</span>
      <span className={accent ? "text-accent" : "text-muted"}>{v}</span>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { X, Presentation, Volume2, Square } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button, Badge, LiveDot } from "@/components/ui/primitives";

const C = {
  fr: {
    open: "Elevator pitch",
    title: "CERBO — Elevator pitch",
    listen: "Écouter le pitch",
    stop: "Arrêter",
    problemT: "Problème",
    problem:
      "Le logiciel était le système d'exploitation de l'entreprise. Désormais, ce sont les agents. Mais un agent ne peut pas piloter ce qu'il ne sait pas lire — et aujourd'hui, votre entreprise est illisible pour l'IA : vos règles métier vivent dans la tête de vos équipes, éparpillées dans quinze outils qui ne se parlent pas. Résultat : les agents génériques font du travail générique, ratent les leads qui comptent, et oublient chaque correction à la fin de la session. Vous ré-expliquez la même chose, pour toujours — ou vous payez un Forward Deployed Engineer humain que le mid-market ne peut pas s'offrir.",
    solutionT: "Solution",
    solution:
      "Cerbo rend votre entreprise lisible par les machines. Il ingère vos vrais leads, infère vos règles implicites dans un Company Brain gouverné et versionné, et déploie un AI Forward Deployed Engineer qui fait le travail : il qualifie chaque prospect en citant la règle exacte derrière la décision. Quand il se trompe, il escalade vers vous — et vous le corrigez d'une phrase, à l'oral. Cette correction devient une compétence permanente, horodatée, et un test de non-régression. On le corrige une fois, jamais deux. Chaque décision laisse un receipt — modèle, coût, latence, règle citée. C'est un employé IA qui rend des comptes. Company Brain → AI FDE → Operating System : le service devient un logiciel qui s'améliore tout seul.",
    bizT: "Business model",
    biz:
      "On ne vend pas des sièges, on vend le travail fait. Trois étages : un audit Company Brain payant à l'entrée — votre savoir tacite devient un actif. Puis un abonnement à l'outcome, par workflow — l'agent qualifie, vous payez au résultat, à une fraction du coût du travail humain équivalent. Et à mesure que les corrections s'accumulent, le Brain devient le système d'exploitation sur lequel vos agents tournent — un moat qui se renforce à l'usage et ne se copie pas. Le prix : 4 600 milliards de dollars de services en train de devenir du logiciel. On attaque par le mid-market européen, où la souveraineté n'est pas un slogan — c'est une exigence d'achat.",
    bizNote:
      "Ordres de grandeur : audit 5–10 k€ one-shot · 1 500–3 000 €/mois par workflow (vs ~4–5 k€/mois pour un SDR chargé) · expansion multi-workflows 30–60 k€ ACV.",
    flowT: "Le workflow — ce qui se passe",
    flowLead:
      "OpenAI raisonne · Linkup contextualise · Wispr corrige · ElevenLabs répond · Hermes orchestre et garde les preuves · le Company Brain versionne · Cloudflare exécute et prouve.",
    flow: [
      ["Ingest → Brain v1", "Import de vos vrais leads (CSV/Excel). Hermes → OpenAI infère 4 règles implicites, écrit company-brain.md v1, versionné dans Cloudflare D1. Receipt logué."],
      ["Qualify + Linkup (MCP)", "Tool call vers le serveur MCP Linkup : enrichissement firmographique live (effectifs, funding, signal d'achat). Verdict + score + citation de règle."],
      ["Le piège", "Atelier Nord — lead à forte valeur — rejeté à tort par la règle R3 v1. Le point de douleur incarné : l'IA générique rate le lead qui compte."],
      ["Correction vocale → skill", "Vous dictez la correction avec Wispr Flow, Appliquer : brain v2 (diff R3 rouge → vert) + skill horodaté écrit dans /skills + D1."],
      ["Re-run v2 — LE PIC", "Le même lead repasse → Qualified, citant R3 v2. « Corrigé une fois, jamais deux », démontré en direct."],
      ["Memo ElevenLabs", "OpenAI rédige un memo business-value de 2 phrases, ElevenLabs le joue dans le produit (FR/EN)."],
      ["Memory", "Nouvelle session : brain rechargé depuis D1 au boot (persisted: true), applique la v2 sans ré-apprentissage. Le contexte survit aux sessions."],
      ["/proof", "Dashboard live (D1) : receipts Hermes, skills horodatés, decision log complet, power-ups witnessed. Aucun chiffre codé en dur. Observabilité totale."],
    ] as [string, string][],
    hermesT: "C'est quoi Hermes ?",
    hermes:
      "Un LLM nu ne fait que produire du texte. Un agent, c'est un LLM plus un harnais — l'échafaudage qui agit. Hermes (Nous Research) fournit cinq choses : la boucle d'agent (lire → choisir un outil/skill/MCP → exécuter → observer → recommencer), la mémoire persistante, les skills horodatés, les session receipts (trace auditable), et les connexions MCP. Chez Cerbo, en local, chaque inférence transite littéralement par le harnais (hermes -z), receipts provider: hermes. Hermes est le corps de l'agent, OpenAI son cerveau.",
    mcpT: "C'est quoi MCP / Linkup ?",
    mcp:
      "MCP — Model Context Protocol — le standard ouvert qui branche un agent sur des capacités externes, comme un port USB-C universel pour les outils. Linkup est un serveur MCP de recherche web : pendant la qualification, l'agent l'appelle dans sa boucle, récupère effectifs, funding et signaux d'achat en direct, et cite cet enrichissement dans sa décision. Le tool call apparaît dans le receipt.",
  },
  en: {
    open: "Elevator pitch",
    title: "CERBO — Elevator pitch",
    listen: "Listen to the pitch",
    stop: "Stop",
    problemT: "Problem",
    problem:
      "Software used to be the operating system a company ran on. Now agents are. But an agent can't run what it can't read — and today, every company is illegible to AI: your business rules live in your people's heads, scattered across fifteen tools that don't talk to each other. So generic agents do generic work, keep missing the leads that matter, and forget every correction when the session ends. You re-teach the same thing forever — or you hire a human Forward Deployed Engineer the mid-market can't afford.",
    solutionT: "Solution",
    solution:
      "Cerbo makes your company machine-readable. It ingests your real leads, infers your implicit rules into a governed, versioned Company Brain, and deploys an AI Forward Deployed Engineer that does the work: it qualifies every lead citing the exact rule behind the decision. When it's wrong, it escalates to you — and you correct it with one spoken sentence. That correction becomes a permanent, timestamped skill — and a regression test. Correct it once, never twice. Every decision leaves a receipt: model, cost, latency, rule cited. It's an AI employee that's accountable. Company Brain → AI FDE → Operating System: the service becomes software that improves itself.",
    bizT: "Business model",
    biz:
      "We don't sell seats — we sell the work itself. Three layers: a paid Company Brain audit to enter — tribal knowledge becomes an asset. Then an outcome-based subscription per workflow — the agent does the work, you pay for results, at a fraction of the equivalent human cost. And as corrections compound, the Brain becomes the operating system your agents run on — a moat that deepens with use and can't be copied. The prize: $4.6 trillion of services turning into software. We enter through the European mid-market, where sovereignty isn't optional — it's a buying requirement.",
    bizNote:
      "Ballpark: audit €5–10k one-shot · €1,500–3,000/mo per workflow (vs ~€4–5k/mo for a loaded SDR) · multi-workflow expansion €30–60k ACV.",
    flowT: "The workflow — what happens",
    flowLead:
      "OpenAI reasons · Linkup contextualizes · Wispr corrects · ElevenLabs answers · Hermes orchestrates and keeps the proof · the Company Brain versions · Cloudflare runs and proves.",
    flow: [
      ["Ingest → Brain v1", "Import your real leads (CSV/Excel). Hermes → OpenAI infers 4 implicit rules, writes company-brain.md v1, versioned in Cloudflare D1. Receipt logged."],
      ["Qualify + Linkup (MCP)", "Tool call to the Linkup MCP server: live firmographic enrichment (headcount, funding, buying signal). Verdict + score + rule cited."],
      ["The trap", "Atelier Nord — a high-value lead — wrongly rejected by rule R3 v1. The pain, embodied: generic AI misses the lead that matters."],
      ["Voice correction → skill", "You dictate the fix with Wispr Flow, Apply: brain v2 (R3 red → green diff) + timestamped skill written to /skills + D1."],
      ["Re-run v2 — THE PEAK", "The same lead runs again → Qualified, citing R3 v2. 'Correct it once, never twice', live."],
      ["ElevenLabs memo", "OpenAI writes a 2-sentence business-value memo, ElevenLabs plays it in-product (FR/EN)."],
      ["Memory", "New session: brain reloaded from D1 at boot (persisted: true), applies v2 with no re-teaching. Context survives sessions."],
      ["/proof", "Live dashboard (D1): Hermes receipts, timestamped skills, full decision log, witnessed power-ups. No hardcoded numbers. Full observability."],
    ] as [string, string][],
    hermesT: "What is Hermes?",
    hermes:
      "A bare LLM only produces text. An agent is an LLM plus a harness — the scaffolding that acts. Hermes (Nous Research) provides five things: the agent loop (read → pick a tool/skill/MCP → execute → observe → repeat), persistent memory, timestamped skills, session receipts (auditable trace), and MCP connections. In Cerbo, locally, every inference literally routes through the harness (hermes -z), receipts read provider: hermes. Hermes is the agent's body, OpenAI its brain.",
    mcpT: "What is MCP / Linkup?",
    mcp:
      "MCP — Model Context Protocol — the open standard that plugs an agent into external capabilities, like a universal USB-C port for tools. Linkup is a web-search MCP server: during qualification the agent calls it in its loop, pulls headcount, funding and buying signals live, and cites that enrichment in its decision. The tool call shows up in the receipt.",
  },
};

export function PitchModal() {
  const { lang } = useLang();
  const t = C[lang];
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    audio.current?.pause();
    setPlaying(false);
    setOpen(false);
  }
  function togglePlay() {
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    const a = new Audio(`/narration/${lang}/overview.mp3`);
    audio.current = a;
    a.onended = () => setPlaying(false);
    a.play().then(() => setPlaying(true)).catch(() => {});
  }

  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)}>
        <Presentation className="h-4 w-4" /> {t.open}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
          onClick={close}
        >
          <div
            className="panel glow relative my-4 w-full max-w-3xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 text-faint hover:text-offwhite"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="accent"><LiveDot /> {t.title}</Badge>
                <button
                  onClick={togglePlay}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[12px] text-muted hover:border-border-strong hover:text-offwhite"
                >
                  {playing ? <Square className="h-3 w-3 text-accent" /> : <Volume2 className="h-3 w-3 text-accent" />}
                  {playing ? t.stop : t.listen}
                </button>
              </div>

              <Section title={t.problemT} tone="bad">{t.problem}</Section>
              <Section title={t.solutionT} tone="accent">{t.solution}</Section>
              <Section title={t.bizT} tone="ok">
                {t.biz}
                <p className="mt-2 text-[12px] italic text-faint">{t.bizNote}</p>
              </Section>

              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted">{t.flowT}</h3>
                <p className="num mt-2 text-[12px] leading-relaxed text-accent">{t.flowLead}</p>
                <ol className="mt-3 space-y-2">
                  {t.flow.map(([h, d], i) => (
                    <li key={i} className="flex gap-3 text-[13px]">
                      <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border text-[11px] text-faint">{i + 1}</span>
                      <span><b className="font-medium text-offwhite">{h}.</b> <span className="text-muted">{d}</span></span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                <MiniCard title={t.hermesT}>{t.hermes}</MiniCard>
                <MiniCard title={t.mcpT}>{t.mcp}</MiniCard>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, tone, children }: { title: string; tone: "bad" | "accent" | "ok"; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <span className={"h-2 w-2 rounded-full " + (tone === "bad" ? "bg-bad" : tone === "ok" ? "bg-ok" : "bg-accent")} />
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted">{title}</h3>
      </div>
      <div className="mt-2 text-[14px] leading-relaxed text-offwhite/90">{children}</div>
    </div>
  );
}

function MiniCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-canvas/50 p-4">
      <h4 className="text-[13px] font-medium text-offwhite">{title}</h4>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

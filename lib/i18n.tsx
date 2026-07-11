"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "fr";

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const s = window.localStorage.getItem("cerbo:lang");
    if (s === "fr" || s === "en") setLangState(s);
  }, []);
  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem("cerbo:lang", l);
    } catch {
      /* ignore */
    }
  }
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

/** All user-facing landing + nav copy. EN is the site's primary voice. */
export const T = {
  en: {
    nav: { home: "Home", console: "Console", proof: "Proof", signin: "Sign in", signout: "Sign out" },
    hero: {
      eyebrow: "REVENUE OS",
      eyebrowSub: "runs on Hermes · AI-as-Agency",
      headPre: "The revenue agent that ",
      headAccent: "learns on the job.",
      subtitle:
        "Your best rules live in your team's heads — so your AI keeps missing the leads that matter. CERBO learns those rules, qualifies with a cited reason, and turns one spoken correction into a permanent skill. Teach it once, never twice. The service becomes software that improves itself.",
      microproof:
        "No FDE. No redeploy. Full agent governance — every decision traces to a receipt.",
      ctaPrimary: "Join the waitlist",
      ctaSecondary: "or explore the live console",
      explain: "Listen: what is CERBO?",
      explainStop: "Stop narration",
      previewCaption:
        "Live replay of the correction moment — the same flow runs in the console.",
    },
    video: {
      badge: "Live run",
      title: "Watch the agent work — unedited.",
      subtitle:
        "CERBO ingests leads, misses a high-value one, gets corrected by a single spoken sentence, and re-qualifies it. The agent graph lights up in real time — every step sourced, nothing staged.",
    },
    integrations: "One operating system, wired end to end",
    diff: {
      badge: "Why it's different",
      title: "Most AI tools plateau. CERBO compounds.",
      subtitle:
        "Prompt-based assistants forget every correction the moment the chat ends. CERBO writes each fix to a versioned brain and a timestamped skill — so the agent you demo on day one is the weakest it will ever be.",
      colA: "Chatbots & copilots",
      colAItems: [
        "Corrections die with the conversation",
        "No cited rule, no audit trail",
        "Needs an engineer to change behaviour",
        "Same mistakes, every session",
      ],
      colB: "CERBO",
      colBItems: [
        "Every fix persists as a skill",
        "Every decision cites its rule",
        "Corrected by voice, in seconds",
        "Smarter with every session",
      ],
    },
    how: {
      badge: "How it works",
      title: "Prove value. Correct by voice. Compound.",
      steps: [
        { t: "Prove value", d: "Point CERBO at your leads. It infers your qualification rules and cites the deciding rule on every call — in minutes, not a quarter." },
        { t: "Correct by voice", d: "When it misses a high-value lead, say one sentence. The correction rewrites the company brain to v2 — no FDE, no redeploy." },
        { t: "Compound", d: "The fix is saved as a timestamped skill. Every new session applies it automatically, and the proof is sourced live." },
      ],
    },
    platform: {
      badge: "Platform",
      title: "An instrument, not a chatbot.",
      subtitle:
        "Three inspectable components. Every latency, cost and score on screen comes from a real run — nothing is hardcoded.",
      cards: [
        { t: "Agent Pipeline", d: "Ingest → qualify → correct → memo → memory. Each step logs a decision: input, rule cited, latency, cost, tool-call tree." },
        { t: "Company Brain", d: "A versioned rulebook. v1 is inferred; a voice correction writes v2. Watch the diff, side by side, as it happens." },
        { t: "Proof Ledger", d: "Hermes receipts, timestamped skills, live agent status — read from Cloudflare D1 in real time. Every claim traces to a receipt." },
      ],
    },
    gov: {
      badge: "Governed by proof",
      title: "Every decision cited. Every correction kept.",
      subtitle:
        "Enterprise-grade by design: rules are explicit, corrections are auditable skills, and every claim traces back to a receipt in the proof ledger.",
      cta: "Explore the console",
    },
    waitlist: {
      eyebrow: "EARLY ACCESS",
      title: "Send us 20 real leads. Get your Company Brain back.",
      subtitle:
        "Drop your work email and we'll run CERBO on your pipeline live — watch it qualify, miss a high-value lead, and self-correct from a single sentence. You keep the governed company-brain.md it infers.",
      placeholder: "you@company.com",
      button: "Join",
      reassurance:
        "Built live at the GrowthX Hermes Buildathon · stored on Cloudflare D1 · your data stays yours.",
      invalid: "Enter a valid email",
      joined: "You're on the waitlist",
      failed: "Could not join",
    },
    footer: ["runs on a Hermes harness", "Cloudflare Pages + D1", "no hardcoded numbers"],
  },
  fr: {
    nav: { home: "Accueil", console: "Console", proof: "Preuve", signin: "Se connecter", signout: "Déconnexion" },
    hero: {
      eyebrow: "REVENUE OS",
      eyebrowSub: "tourne sur Hermes · AI-as-Agency",
      headPre: "L'agent revenue qui ",
      headAccent: "apprend en travaillant.",
      subtitle:
        "Vos meilleures règles vivent dans la tête de vos équipes — alors votre IA rate les leads qui comptent. CERBO apprend ces règles, qualifie en citant sa raison, et transforme une correction dictée en compétence permanente. On corrige une fois, jamais deux. Le service devient un logiciel qui s'améliore tout seul.",
      microproof:
        "Pas de FDE. Pas de redéploiement. Chaque décision remonte à une preuve.",
      ctaPrimary: "Rejoindre la waitlist",
      ctaSecondary: "ou explorer la console live",
      explain: "Écouter : c'est quoi CERBO ?",
      explainStop: "Arrêter la narration",
      previewCaption:
        "Rejeu live du moment de correction — le même flux tourne dans la console.",
    },
    video: {
      badge: "Run live",
      title: "Regarde l'agent travailler — sans montage.",
      subtitle:
        "CERBO ingère des leads, en rate un à forte valeur, se fait corriger d'une seule phrase dictée, et le re-qualifie. Le graphe d'agent s'illumine en temps réel — chaque étape sourcée, rien de mis en scène.",
    },
    integrations: "Un seul operating system, câblé de bout en bout",
    diff: {
      badge: "Ce qui change",
      title: "La plupart des IA plafonnent. CERBO compose.",
      subtitle:
        "Les assistants à prompt oublient chaque correction dès que la conversation se termine. CERBO écrit chaque correctif dans un cerveau versionné et un skill horodaté — l'agent que tu montres au jour un est le plus faible qu'il sera jamais.",
      colA: "Chatbots & copilotes",
      colAItems: [
        "Les corrections meurent avec la conversation",
        "Aucune règle citée, aucune traçabilité",
        "Il faut un ingénieur pour changer le comportement",
        "Les mêmes erreurs, à chaque session",
      ],
      colB: "CERBO",
      colBItems: [
        "Chaque correctif persiste comme un skill",
        "Chaque décision cite sa règle",
        "Corrigé à la voix, en secondes",
        "Plus intelligent à chaque session",
      ],
    },
    how: {
      badge: "Comment ça marche",
      title: "Prouver la valeur. Corriger à la voix. Composer.",
      steps: [
        { t: "Prouver la valeur", d: "Pointe CERBO sur tes leads. Il infère tes règles de qualification et cite la règle décisive à chaque décision — en minutes, pas en trimestre." },
        { t: "Corriger à la voix", d: "Quand il rate un lead à forte valeur, dis une phrase. La correction réécrit le company-brain en v2 — sans FDE, sans redéploiement." },
        { t: "Composer", d: "Le correctif est sauvé comme skill horodaté. Chaque nouvelle session l'applique, et la preuve est sourcée en direct." },
      ],
    },
    platform: {
      badge: "Plateforme",
      title: "Un instrument, pas un chatbot.",
      subtitle:
        "Trois composants inspectables. Chaque latence, coût et score à l'écran vient d'un vrai run — rien n'est codé en dur.",
      cards: [
        { t: "Pipeline agent", d: "Ingest → qualify → correct → memo → memory. Chaque étape logue une décision : input, règle citée, latence, coût, arbre des tool calls." },
        { t: "Company Brain", d: "Un rulebook versionné. La v1 est inférée ; une correction vocale écrit la v2. Regarde le diff, côte à côte, en direct." },
        { t: "Proof Ledger", d: "Receipts Hermes, skills horodatés, statut agent live — lus depuis Cloudflare D1 en temps réel. Chaque claim remonte à une preuve." },
      ],
    },
    gov: {
      badge: "Gouverné par la preuve",
      title: "Chaque décision citée. Chaque correction gardée.",
      subtitle:
        "Enterprise-grade par design : les règles sont explicites, les corrections sont des skills auditables, et chaque claim remonte à une preuve dans le ledger.",
      cta: "Explorer la console",
    },
    waitlist: {
      eyebrow: "EARLY ACCESS",
      title: "Envoyez 20 vrais leads. Repartez avec le cerveau de votre boîte.",
      subtitle:
        "Laissez votre email pro : on lance CERBO sur votre pipeline en live — il qualifie, rate un lead à forte valeur, et se corrige d'une seule phrase. Vous gardez le company-brain.md gouverné qu'il a inféré.",
      placeholder: "vous@entreprise.com",
      button: "Rejoindre",
      reassurance:
        "Construit en live au GrowthX Hermes Buildathon · stocké sur Cloudflare D1 · vos données restent les vôtres.",
      invalid: "Entrez un email valide",
      joined: "Vous êtes sur la waitlist",
      failed: "Échec de l'inscription",
    },
    footer: ["tourne sur un harnais Hermes", "Cloudflare Pages + D1", "aucun chiffre codé en dur"],
  },
} as const;

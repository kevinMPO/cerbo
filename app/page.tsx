"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Boxes,
  Brain,
  ScrollText,
  TrendingDown,
  TrendingUp,
  Mic,
  Radio,
  GitBranch,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Button, Badge, Mono, LiveDot } from "@/components/ui/primitives";
import { POWERUPS } from "@/components/PowerupRail";
import { Waitlist } from "@/components/Waitlist";
import { ConsolePreview } from "@/components/marketing/ConsolePreview";
import { DemoVideo } from "@/components/marketing/DemoVideo";
import { ExplainButton } from "@/components/marketing/ExplainButton";
import { PitchModal } from "@/components/marketing/PitchModal";
import { TalkToCerbo } from "@/components/marketing/TalkToCerbo";
import { useLang, T } from "@/lib/i18n";

const HOW_ICONS = [<Radio key="a" className="h-4 w-4" />, <Mic key="b" className="h-4 w-4" />, <GitBranch key="c" className="h-4 w-4" />];
const PLATFORM_ICONS = [<Boxes key="a" className="h-4 w-4" />, <Brain key="b" className="h-4 w-4" />, <ScrollText key="c" className="h-4 w-4" />];

export default function Landing() {
  const { lang } = useLang();
  const c = T[lang];

  return (
    <div className="min-h-screen">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-faint" />
        <div className="relative z-10 mx-auto grid max-w-[1200px] items-center gap-12 px-6 pt-24 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent"><LiveDot /> {c.hero.eyebrow}</Badge>
              <span className="text-[12px] text-faint">{c.hero.eyebrowSub}</span>
            </div>

            <h1 className="mt-6 text-[46px] font-semibold leading-[1.02] tracking-tight text-offwhite sm:text-[54px]">
              {c.hero.headPre}
              <span className="text-accent">{c.hero.headAccent}</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
              {c.hero.subtitle}
            </p>

            <p className="mt-5 flex items-start gap-2 text-[13px] text-faint">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
              {c.hero.microproof}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#waitlist">
                <Button variant="primary">
                  {c.hero.ctaPrimary} <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <TalkToCerbo />
              <PitchModal />
              <ExplainButton />
              <Link href="/login" className="text-[13px] text-muted underline-offset-4 hover:text-offwhite hover:underline">
                {c.hero.ctaSecondary}
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <ConsolePreview />
            <p className="mt-4 text-center text-[12px] text-faint">{c.hero.previewCaption}</p>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-6">
        {/* LIVE RUN VIDEO */}
        <section className="border-t border-border py-14">
          <div className="mb-5">
            <Badge tone="accent"><LiveDot /> {c.video.badge}</Badge>
            <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-offwhite">{c.video.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{c.video.subtitle}</p>
          </div>
          <DemoVideo />
        </section>

        {/* INTEGRATIONS */}
        <section className="border-t border-border py-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <span className="text-[11px] uppercase tracking-widest text-faint">{c.integrations}</span>
            <div className="flex flex-wrap gap-2">
              {POWERUPS.map((p) => (
                <div key={p.key} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
                  <LiveDot tone="muted" />
                  <span className="text-[13px] text-offwhite">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIFFERENTIATOR */}
        <section className="border-t border-border py-16">
          <div className="max-w-2xl">
            <Badge tone="neutral">{c.diff.badge}</Badge>
            <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-offwhite">{c.diff.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{c.diff.subtitle}</p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="panel p-6">
              <div className="flex items-center gap-2 text-muted">
                <TrendingDown className="h-4 w-4 text-bad" />
                <span className="text-sm font-medium">{c.diff.colA}</span>
              </div>
              <ul className="mt-4 space-y-2 text-[13px] text-faint">
                {c.diff.colAItems.map((x) => <li key={x}>— {x}</li>)}
              </ul>
            </div>
            <div className="panel glow relative overflow-hidden p-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-offwhite">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{c.diff.colB}</span>
                </div>
                <ul className="mt-4 space-y-2 text-[13px] text-muted">
                  {c.diff.colBItems.map((x, i) => <li key={x} className={i === 0 ? "text-offwhite" : ""}>— {x}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-t border-border py-16">
          <div className="max-w-2xl">
            <Badge tone="neutral">{c.how.badge}</Badge>
            <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-offwhite">{c.how.title}</h2>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {c.how.steps.map((b, i) => (
              <motion.div key={b.t} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} className="panel p-6">
                <div className="flex items-center justify-between">
                  <span className="text-accent">{HOW_ICONS[i]}</span>
                  <Mono className="text-[11px] text-faint">0{i + 1}</Mono>
                </div>
                <h3 className="mt-4 text-base font-medium text-offwhite">{b.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{b.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PLATFORM */}
        <section className="border-t border-border py-16">
          <div className="max-w-2xl">
            <Badge tone="neutral">{c.platform.badge}</Badge>
            <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-offwhite">{c.platform.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{c.platform.subtitle}</p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {c.platform.cards.map((card, i) => (
              <div key={card.t} className="panel p-6">
                <span className="text-accent">{PLATFORM_ICONS[i]}</span>
                <h3 className="mt-4 text-sm font-medium text-offwhite">{card.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{card.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GOVERNANCE */}
        <section className="border-t border-border py-16">
          <div className="panel glow relative overflow-hidden p-8 sm:p-10">
            <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <Badge tone="accent"><ShieldCheck className="h-3 w-3" /> {c.gov.badge}</Badge>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-offwhite">{c.gov.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.gov.subtitle}</p>
              </div>
              <Link href="/login" className="shrink-0">
                <Button variant="primary">{c.gov.cta} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </section>

        {/* WAITLIST */}
        <section id="waitlist" className="border-t border-border py-20">
          <div className="flex flex-col items-start gap-2">
            <Badge tone="accent"><LiveDot /> {c.waitlist.eyebrow}</Badge>
            <h2 className="mt-2 max-w-2xl text-[28px] font-semibold leading-tight tracking-tight text-offwhite">{c.waitlist.title}</h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted">{c.waitlist.subtitle}</p>
          </div>
          <div className="mt-6">
            <Waitlist />
          </div>
        </section>

        <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border py-8 text-[12px] text-faint">
          <Mono>CERBO</Mono>
          {c.footer.map((f) => <span key={f}>· {f}</span>)}
        </footer>
      </main>
    </div>
  );
}

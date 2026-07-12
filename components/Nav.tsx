"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LiveDot, Button } from "@/components/ui/primitives";
import { currentUser, signOut } from "@/lib/auth";
import { useLang, T } from "@/lib/i18n";

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = T[lang].nav;
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => setUser(currentUser()), [path]);

  const authed = !!user;

  // Credit balance (freemium). "unlimited" for the demo account.
  const [credits, setCredits] = useState<number | "unlimited" | null>(null);
  useEffect(() => {
    if (!authed) {
      setCredits(null);
      return;
    }
    fetch("/api/account")
      .then((r) => r.json())
      .then((d: any) => {
        if (d.ok) setCredits(d.unlimited ? "unlimited" : d.credits);
      })
      .catch(() => {});
    const onEvt = (e: any) => setCredits(e.detail);
    window.addEventListener("cerbo:credits", onEvt as any);
    return () => window.removeEventListener("cerbo:credits", onEvt as any);
  }, [authed, path]);
  const links = [
    { href: "/", label: t.home },
    ...(authed
      ? [
          { href: "/product", label: t.console },
          { href: "/proof", label: t.proof },
        ]
      : []),
  ];

  function out() {
    signOut();
    setUser(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="num text-sm font-semibold tracking-tight text-offwhite">
            CERBO
          </span>
          <span className="text-[11px] uppercase tracking-widest text-faint">
            revenue os
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  active ? "bg-white/5 text-offwhite" : "text-muted hover:text-offwhite"
                )}
              >
                {l.label}
              </Link>
            );
          })}

          {/* language toggle */}
          <div className="mx-2 flex items-center rounded-md border border-border p-0.5 text-[11px]">
            {(["en", "fr"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "num rounded px-1.5 py-0.5 uppercase transition-colors",
                  lang === l ? "bg-white/10 text-offwhite" : "text-faint hover:text-muted"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {authed && credits !== null && (
            <span
              className={cn(
                "num mr-1 rounded-md border px-2 py-0.5 text-[11px]",
                credits === "unlimited"
                  ? "border-border text-faint"
                  : credits <= 3
                    ? "border-bad/40 text-bad"
                    : "border-accent-line text-accent"
              )}
              title="Crédits — 1 par lead qualifié"
            >
              {credits === "unlimited" ? "démo · ∞" : `${credits} crédits`}
            </span>
          )}
          <span className="mr-2 flex items-center gap-1.5 text-[11px] text-faint">
            <LiveDot tone="accent" /> Hermes
          </span>
          {authed ? (
            <Button variant="ghost" size="sm" onClick={out}>
              {t.signout}
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                {t.signin}
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

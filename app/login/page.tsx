"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button, Panel, Mono, LiveDot, Badge } from "@/components/ui/primitives";
import { signIn, DEMO_EMAIL } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

const L = {
  fr: {
    title: "Connexion à la console",
    sub: "Entre ton email — on t'envoie un code. 20 crédits offerts à l'inscription.",
    email: "Email pro",
    getCode: "Recevoir un code",
    sending: "Envoi…",
    codeSentTo: "Code envoyé à",
    code: "Code à 6 chiffres",
    signin: "Se connecter",
    verifying: "Vérification…",
    changeEmail: "changer d'email",
    resend: "renvoyer",
    demo: "Accès démo (illimité)",
    or: "ou",
    invalidEmail: "Entre un email valide",
    granted: "Bienvenue",
    freeCredits: "20 crédits offerts",
    badCode: "Code invalide ou expiré",
    notDelivered: "Email non délivré à cette adresse pour l'instant — utilise l'accès démo ci-dessous.",
  },
  en: {
    title: "Sign in to the console",
    sub: "Enter your email — we'll send a code. 20 free credits on signup.",
    email: "Work email",
    getCode: "Send me a code",
    sending: "Sending…",
    codeSentTo: "Code sent to",
    code: "6-digit code",
    signin: "Sign in",
    verifying: "Verifying…",
    changeEmail: "change email",
    resend: "resend",
    demo: "Demo access (unlimited)",
    or: "or",
    invalidEmail: "Enter a valid email",
    granted: "Welcome",
    freeCredits: "20 free credits",
    badCode: "Invalid or expired code",
    notDelivered: "Email not delivered to this address yet — use demo access below.",
  },
};

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { lang } = useLang();
  const t = L[lang];
  const from = params.get("from") || "/product";
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error(t.invalidEmail);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d: any = await res.json();
      if (!d.ok) throw new Error(d.error || "failed");
      setStep("code");
      if (d.sent) toast.success(`${t.codeSentTo} ${email}`);
      else toast.message(t.notDelivered);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (code.trim().length < 4) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const d: any = await res.json();
      if (!d.ok) throw new Error(d.error || t.badCode);
      signIn(d.email || email);
      toast.success(t.granted, { description: d.isNew ? t.freeCredits : `${d.credits} crédits` });
      setTimeout(() => router.push(from), 250);
    } catch (err) {
      toast.error(t.badCode);
    } finally {
      setBusy(false);
    }
  }

  function demo() {
    signIn(DEMO_EMAIL);
    toast.success(t.granted, { description: "démo" });
    setTimeout(() => router.push(from), 200);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 grid-faint" />
      <div className="glow relative w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative z-10">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <span className="num text-lg font-semibold tracking-tight text-offwhite">CERBO</span>
            <span className="text-[11px] uppercase tracking-widest text-faint">console</span>
          </Link>

          <Panel className="p-6">
            <Badge tone="accent"><LiveDot /> {t.freeCredits}</Badge>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-offwhite">{t.title}</h1>
            <p className="mt-1 text-[13px] text-muted">{t.sub}</p>

            {step === "email" ? (
              <form onSubmit={requestCode} className="mt-5 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 focus-within:border-accent-line">
                  <Mail className="h-4 w-4 text-faint" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoFocus
                    className="w-full bg-transparent py-2.5 text-sm text-offwhite outline-none placeholder:text-faint"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full" disabled={busy}>
                  {busy ? t.sending : t.getCode} <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={verify} className="mt-5 space-y-3">
                <div className="text-[12px] text-faint">
                  {t.codeSentTo} <span className="text-offwhite">{email}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 focus-within:border-accent-line">
                  <KeyRound className="h-4 w-4 text-faint" />
                  <input
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    autoFocus
                    className="num w-full bg-transparent py-2.5 text-lg tracking-[0.4em] text-offwhite outline-none placeholder:text-faint"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full" disabled={busy || code.length < 4}>
                  {busy ? t.verifying : t.signin} <ArrowRight className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 text-[11px] text-faint">
                  <button type="button" onClick={() => setStep("email")} className="hover:text-muted">{t.changeEmail}</button>
                  <span>·</span>
                  <button type="button" onClick={() => requestCode()} className="hover:text-muted">{t.resend}</button>
                </div>
              </form>
            )}

            <div className="my-4 flex items-center gap-3 text-[11px] text-faint">
              <div className="h-px flex-1 bg-border" /> {t.or} <div className="h-px flex-1 bg-border" />
            </div>
            <Button variant="default" className="w-full" onClick={demo}>
              {t.demo}
            </Button>
          </Panel>

          <p className="mt-4 text-center text-[12px] text-faint">
            <Link href="/" className="hover:text-muted">← retour</Link>
            <span className="mx-2">·</span>
            <span className="inline-flex items-center gap-1.5"><LiveDot tone="accent" /> running on Hermes</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, Panel, Mono, LiveDot } from "@/components/ui/primitives";
import { isValidCode, signIn } from "@/lib/auth";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/product";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid work email");
      return;
    }
    if (!isValidCode(code)) {
      toast.error("Invalid access code", { description: "Try the demo code below." });
      return;
    }
    setBusy(true);
    signIn(email);
    toast.success("Access granted");
    setTimeout(() => router.push(from), 250);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 grid-faint" />
      <div className="glow relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <span className="num text-lg font-semibold tracking-tight text-offwhite">
              CERBO
            </span>
            <span className="text-[11px] uppercase tracking-widest text-faint">
              console
            </span>
          </Link>

          <Panel className="p-6">
            <div className="flex items-center gap-2 text-xs text-faint">
              <Lock className="h-3.5 w-3.5" />
              <span>Sign in to the revenue console</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-offwhite">
              Enter the operating system
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              The console runs the live agent pipeline and the Cloudflare
              D1-sourced proof ledger.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-faint">
                  Work email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-offwhite outline-none focus:border-accent-line"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-faint">
                  Access code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="access code"
                  className="num w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-offwhite outline-none focus:border-accent-line"
                />
              </div>
              <Button variant="primary" type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Enter console"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-faint">
                <ShieldCheck className="h-3.5 w-3.5" /> Full agent governance
              </span>
              <span className="text-faint">
                Demo access code: <Mono className="text-accent">demo</Mono>
              </span>
            </div>
          </Panel>

          <p className="mt-4 text-center text-[12px] text-faint">
            <Link href="/" className="hover:text-muted">
              ← Back to homepage
            </Link>
            <span className="mx-2">·</span>
            <span className="inline-flex items-center gap-1.5">
              <LiveDot tone="accent" /> running on Hermes
            </span>
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

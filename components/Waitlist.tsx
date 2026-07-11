"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { useLang, T } from "@/lib/i18n";

export function Waitlist() {
  const { lang } = useLang();
  const t = T[lang].waitlist;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error(t.invalid);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: any = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "failed");
      toast.success(t.joined);
      setEmail("");
    } catch (err) {
      toast.error(t.failed, { description: String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={join} className="w-full max-w-md">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-offwhite outline-none placeholder:text-faint"
        />
        <Button variant="primary" type="submit" disabled={busy}>
          {t.button} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      {/* Reassurance line — signals exclusive early access instead of a low counter. */}
      <p className="mt-3 text-[12px] leading-relaxed text-faint">{t.reassurance}</p>
    </form>
  );
}

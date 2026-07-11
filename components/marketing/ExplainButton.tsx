"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { useLang, T } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Plays an ElevenLabs-narrated overview of CERBO in the current language.
 * Gives the visitor a spoken "what is this" in EN or FR.
 */
export function ExplainButton() {
  const { lang } = useLang();
  const t = T[lang].hero;
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // Stop audio if the language changes mid-play.
  useEffect(() => {
    return () => ref.current?.pause();
  }, [lang]);

  function toggle() {
    if (playing) {
      ref.current?.pause();
      setPlaying(false);
      return;
    }
    ref.current?.pause();
    const a = new Audio(`/narration/${lang}/overview.mp3`);
    ref.current = a;
    a.onended = () => setPlaying(false);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors",
        playing
          ? "border-accent-line bg-accent-dim text-accent"
          : "border-border text-muted hover:border-border-strong hover:text-offwhite"
      )}
    >
      {playing ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-accent" />}
      {playing ? t.explainStop : t.explain}
    </button>
  );
}

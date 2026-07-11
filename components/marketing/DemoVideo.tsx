"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Landing demo video. Autoplays muted (browsers require muted autoplay) for
 * ambient motion; a button unmutes and restarts from 0 so the ElevenLabs
 * narration plays on demand.
 */
export function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (sound) {
      v.muted = true;
      setSound(false);
    } else {
      v.muted = false;
      v.currentTime = 0;
      v.play().catch(() => {});
      setSound(true);
    }
  }

  return (
    <div className="glow relative overflow-hidden rounded-2xl border border-border bg-surface">
      <video
        ref={ref}
        className="relative z-10 w-full"
        src="/cerbo-demo-vo.mp4"
        poster="/cerbo-demo-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <button
        onClick={toggle}
        className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-lg border border-border bg-canvas/80 px-3 py-1.5 text-[12px] font-medium text-offwhite backdrop-blur transition-colors hover:border-border-strong"
      >
        {sound ? (
          <>
            <Volume2 className="h-3.5 w-3.5 text-accent" /> Sound on
          </>
        ) : (
          <>
            <VolumeX className="h-3.5 w-3.5" /> Play with narration
          </>
        )}
      </button>
    </div>
  );
}

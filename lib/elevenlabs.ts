/**
 * ElevenLabs TTS for the in-product business-value memo. Returns base64 MP3 the
 * client plays inline. On failure it returns ok:false and the UI shows a
 * labelled "audio unavailable (offline)" state rather than faking playback.
 */

/** Edge-safe base64 (no Node Buffer). Chunked to avoid call-stack limits. */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export type TtsResult = {
  audioBase64: string | null;
  contentType: string;
  live: boolean;
  latencyMs: number;
  text: string;
};

import type { Env } from "./env";

export async function synthMemo(
  env: Env,
  text: string,
  forceFallback = false
): Promise<TtsResult> {
  const start = Date.now();
  const key = env.ELEVENLABS_API_KEY;
  const voiceId = env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";

  if (!forceFallback && key) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": key,
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: { stability: 0.4, similarity_boost: 0.75 },
          }),
        }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const audioBase64 = arrayBufferToBase64(await res.arrayBuffer());
      return {
        audioBase64,
        contentType: "audio/mpeg",
        live: true,
        latencyMs: Date.now() - start,
        text,
      };
    } catch (e) {
      console.warn("[elevenlabs] tts failed:", String(e));
    }
  }

  return {
    audioBase64: null,
    contentType: "audio/mpeg",
    live: false,
    latencyMs: Date.now() - start,
    text,
  };
}

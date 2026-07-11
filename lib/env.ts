/// <reference types="@cloudflare/workers-types" />

/** Cloudflare bindings + secrets available to Pages Functions via context.env. */
export interface Env {
  DB: D1Database;
  // Local-only: when set, LLM inference routes through the Hermes bridge
  // (hermes -z) so it literally runs on the Hermes harness. Absent in cloud.
  HERMES_BASE_URL?: string;
  HERMES_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  LINKUP_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
}

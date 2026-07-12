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
  // Waitlist email notifications + magic-code auth (Resend).
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  MAIL_FROM?: string; // e.g. "CERBO <noreply@getcerbo.com>" once the domain is verified
  FREE_CREDITS?: string; // free credits on signup (default 20)
  // Apollo.io — company search (find companies when the user has no CSV).
  APOLLO_API_KEY?: string;
}

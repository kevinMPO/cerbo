import { costUsd } from "./pricing";
import type { Env } from "./env";

/**
 * LLM abstraction. OpenAI is the primary provider; OpenRouter is the fallback.
 * Both speak the OpenAI Chat Completions shape, so one code path covers both.
 * The result carries the honest provider/model actually used plus measured
 * tokens, cost and latency for the decision log and Hermes receipts.
 */

export type LlmResult = {
  text: string;
  provider: "hermes" | "openai" | "openrouter" | "fallback-cache";
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  ok: boolean;
};

export type LlmOptions = {
  system?: string;
  user: string;
  json?: boolean;
  temperature?: number;
  /** Forces the cached path (network-cut rehearsal). */
  forceFallback?: boolean;
  /** Deterministic cached completion used when live + fallback env are absent. */
  cached?: string;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenAiCompatible(
  url: string,
  key: string,
  model: string,
  opts: LlmOptions
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  const body = {
    model,
    temperature: opts.temperature ?? 0.2,
    messages: [
      ...(opts.system ? [{ role: "system", content: opts.system }] : []),
      { role: "user", content: opts.user },
    ],
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "CERBO",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const tokensIn: number = data?.usage?.prompt_tokens ?? 0;
  const tokensOut: number = data?.usage?.completion_tokens ?? 0;
  return { text, tokensIn, tokensOut };
}

export async function llm(env: Env, opts: LlmOptions): Promise<LlmResult> {
  const start = Date.now();
  const openaiKey = env.OPENAI_API_KEY;
  const openrouterKey = env.OPENROUTER_API_KEY;
  const openaiModel = env.OPENAI_MODEL || "gpt-4o";
  const openrouterModel = env.OPENROUTER_MODEL || "openai/gpt-4o";

  // Forced cache path (rehearsal / offline).
  if (opts.forceFallback && opts.cached !== undefined) {
    return {
      text: opts.cached,
      provider: "fallback-cache",
      model: "cache",
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      latencyMs: Date.now() - start,
      ok: true,
    };
  }

  // Preferred (local only): route through the Hermes harness via the bridge.
  // On any failure we fall through to OpenAI so the demo never breaks.
  if (env.HERMES_BASE_URL) {
    try {
      const hermesModel = env.HERMES_MODEL || "gpt-5.6-sol";
      const r = await callOpenAiCompatible(
        `${env.HERMES_BASE_URL.replace(/\/$/, "")}/chat/completions`,
        "hermes-local",
        hermesModel,
        opts
      );
      if (r.text) {
        return {
          text: r.text,
          provider: "hermes",
          model: `${hermesModel} (via Hermes)`,
          tokensIn: r.tokensIn,
          tokensOut: r.tokensOut,
          costUsd: costUsd(hermesModel, r.tokensIn, r.tokensOut),
          latencyMs: Date.now() - start,
          ok: true,
        };
      }
    } catch (e) {
      console.warn("[llm] Hermes bridge failed, falling back to OpenAI:", String(e));
    }
  }

  // Primary: OpenAI.
  if (openaiKey) {
    try {
      const r = await callOpenAiCompatible(
        OPENAI_URL,
        openaiKey,
        openaiModel,
        opts
      );
      return {
        text: r.text,
        provider: "openai",
        model: openaiModel,
        tokensIn: r.tokensIn,
        tokensOut: r.tokensOut,
        costUsd: costUsd(openaiModel, r.tokensIn, r.tokensOut),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (e) {
      // fall through to OpenRouter
      console.warn("[llm] OpenAI failed, trying OpenRouter:", String(e));
    }
  }

  // Fallback provider: OpenRouter.
  if (openrouterKey) {
    try {
      const r = await callOpenAiCompatible(
        OPENROUTER_URL,
        openrouterKey,
        openrouterModel,
        opts
      );
      return {
        text: r.text,
        provider: "openrouter",
        model: openrouterModel,
        tokensIn: r.tokensIn,
        tokensOut: r.tokensOut,
        costUsd: costUsd(openrouterModel, r.tokensIn, r.tokensOut),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (e) {
      console.warn("[llm] OpenRouter failed:", String(e));
    }
  }

  // Last resort: cached deterministic completion (keeps the demo alive).
  if (opts.cached !== undefined) {
    return {
      text: opts.cached,
      provider: "fallback-cache",
      model: "cache",
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      latencyMs: Date.now() - start,
      ok: true,
    };
  }

  return {
    text: "",
    provider: "fallback-cache",
    model: "cache",
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    latencyMs: Date.now() - start,
    ok: false,
  };
}

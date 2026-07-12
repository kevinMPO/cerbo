/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../lib/env";
import { json } from "../../lib/http";
import { llm } from "../../lib/llm";
import { synthMemo } from "../../lib/elevenlabs";

/**
 * Talk to CERBO — a lightweight voice chat. The client does speech-to-text
 * (Web Speech API) and sends the text here; OpenAI answers in CERBO's persona
 * and ElevenLabs speaks the reply. Returns the text + base64 audio.
 */

const PERSONA =
  "Tu es CERBO, un agent revenue IA — le Forward Deployed Engineer que les entreprises n'ont pas à recruter. " +
  "Tu qualifies des leads B2B en apprenant les règles d'une boîte dans un Company Brain versionné, tu cites la règle exacte derrière chaque décision, " +
  "et quand tu te trompes l'utilisateur te corrige d'une phrase à l'oral qui devient une compétence permanente (corrigé une fois, jamais deux). " +
  "Tu tournes sur un harnais Hermes et Cloudflare, avec Linkup (enrichissement live), Wispr (correction vocale), ElevenLabs (voix), OpenAI (raisonnement). " +
  "Sois chaleureux, vif et CONCIS (1-3 phrases max). Réponds dans la langue de l'utilisateur (français ou anglais). " +
  "Invite l'utilisateur à ouvrir la console : chercher une entreprise, te regarder la qualifier en citant une règle, puis te corriger à la voix.";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as {
      message?: string;
      history?: { role: string; content: string }[];
      voice?: boolean;
    };
    const message = (body.message || "").trim();
    if (!message) return json({ ok: false, error: "message required" }, 400);

    const hist = (body.history || [])
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Utilisateur" : "CERBO"}: ${m.content}`)
      .join("\n");
    const user = (hist ? `Conversation:\n${hist}\n\n` : "") + `Utilisateur: ${message}\n\nRéponds brièvement (1-3 phrases).`;

    const reply = await llm(ctx.env, {
      system: PERSONA,
      user,
      cached:
        "Je qualifie tes leads en citant la règle derrière chaque décision, et tu me corriges d'une phrase à l'oral. Ouvre la console et cherche une entreprise — je te montre.",
      temperature: 0.5,
    });
    const text = reply.text?.trim() || "";

    let audioBase64: string | null = null;
    if (body.voice !== false && text) {
      const tts = await synthMemo(ctx.env, text);
      audioBase64 = tts.audioBase64;
    }

    return json({ ok: true, reply: text, audioBase64 });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
};

#!/usr/bin/env node
/**
 * Hermes bridge — exposes the local Hermes agent (`hermes -z`) as a minimal
 * OpenAI-compatible endpoint so CERBO's inference can literally run THROUGH the
 * Hermes harness (session + receipts + gpt-5.6-sol), not just the OpenAI API.
 *
 * CERBO points at this only in LOCAL mode (HERMES_BASE_URL in .dev.vars). The
 * Cloudflare deployment can't reach localhost, so it stays on OpenAI directly.
 * If this bridge is down/slow, CERBO's llm() auto-falls back to OpenAI — the
 * demo never breaks.
 *
 * Run: npm run hermes:bridge   (default port 8790)
 */
import http from "node:http";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";

const PORT = Number(process.env.HERMES_BRIDGE_PORT || 8790);
const HERMES = path.join(os.homedir(), ".local", "bin", "hermes");
const MODEL = process.env.HERMES_MODEL || "gpt-5.6-sol";

const ANSI = /\x1b\[[0-9;]*[a-zA-Z]/g;
// Lines that are Hermes TUI chrome / noise, not the answer.
const NOISE =
  /^(\s*$|✦|⚕|┌|└|├|│|─|▌|❯|Tip:|Warning:|Shutting down|Goodbye|⚠|Note:| *\[)/;

function clean(stdout) {
  return stdout
    .replace(ANSI, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\r/g, "").trimEnd())
    .filter((l) => !NOISE.test(l))
    .join("\n")
    .trim();
}

function runHermes(prompt) {
  return new Promise((resolve, reject) => {
    execFile(
      HERMES,
      ["-z", prompt],
      { timeout: 90_000, maxBuffer: 16 * 1024 * 1024, env: process.env },
      (err, stdout, stderr) => {
        const text = clean(stdout || "");
        if (text) return resolve(text); // got an answer even if exit was noisy
        if (err) return reject(new Error(stderr?.slice(0, 300) || String(err)));
        resolve(text);
      }
    );
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, harness: "hermes", model: MODEL }));
  }
  if (req.method !== "POST" || !req.url.includes("/chat/completions")) {
    res.writeHead(404);
    return res.end("not found");
  }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const messages = payload.messages || [];
      const sys = messages.find((m) => m.role === "system")?.content || "";
      const user = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n\n");
      const prompt = (sys ? sys + "\n\n" : "") + user;

      const answer = await runHermes(prompt);
      // Token estimate (Hermes -z doesn't surface usage): ~4 chars/token.
      const tokensIn = Math.ceil(prompt.length / 4);
      const tokensOut = Math.ceil(answer.length / 4);

      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "hermes-" + Date.now(),
          object: "chat.completion",
          model: MODEL,
          choices: [{ index: 0, message: { role: "assistant", content: answer }, finish_reason: "stop" }],
          usage: { prompt_tokens: tokensIn, completion_tokens: tokensOut, total_tokens: tokensIn + tokensOut },
        })
      );
    } catch (e) {
      res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: String(e) }));
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[hermes-bridge] OpenAI-compatible endpoint on http://127.0.0.1:${PORT}/v1/chat/completions`);
  console.log(`[hermes-bridge] forwarding to: ${HERMES} -z  (model ${MODEL})`);
});

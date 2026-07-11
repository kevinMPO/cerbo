# CERBO — the revenue agent that learns on the job

**Live:** [cerbo.pages.dev](https://cerbo.pages.dev) · Built at the **GrowthX Hermes Buildathon** · Track: **AI-as-Agency**

CERBO qualifies your leads, cites the rule behind every decision, and turns **one
spoken correction** into a **permanent skill** every future session applies.
Teach it once, never twice. The service becomes software that improves itself.

> Your best rules live in your team's heads — so your AI keeps missing the leads
> that matter. CERBO learns those rules, qualifies with a cited reason, and
> remembers the fix forever. No FDE. No redeploy. Every decision traces to a receipt.

---

## The moment (why it's different)

Most AI assistants forget every correction when the chat ends. CERBO writes each
fix to a **versioned company-brain** and a **timestamped skill** — so the agent you
demo on day one is the weakest it will ever be.

```
Ingest ─▶ Qualify ─▶ Run v1 (a great lead is wrongly REJECTED)
                         │
                    voice correction  ──▶  brain v1 → v2  +  new skill
                         │
                     Re-run v2 (the SAME lead is now QUALIFIED)  ◀── the peak
                         │
                     Memo (spoken) ─▶ Memory (a new session applies v2, no re-teaching)
```

Every step logs a decision — `input · rule cited · verdict · latency · cost · tool-calls`
— read live on the **Proof** page.

## The 5 witnessable power-ups

| Power-up | Role |
|---|---|
| **OpenAI** | Infers the qualification rulebook |
| **Linkup** | Live firmographic enrichment during qualification |
| **Wispr Flow** | Voice dictation of the correction |
| **ElevenLabs** | Speaks the business-value memo — and narrates the console (EN/FR) |
| **Cloudflare D1** | Stores all state; `/proof` reads it live |

Runs on a **Hermes** harness (Nous Research). In local mode, inference literally
routes through the Hermes agent (`hermes -z`, gpt-5.6-sol) via a small bridge —
receipts show `provider: hermes`.

## Highlights

- **Live agent graph** (React Flow) — nodes light up and edges animate as the pipeline runs.
- **Guided onboarding** — a sticky run bar with a single obvious next action, a progress stepper, and **Auto-play**.
- **Bilingual ElevenLabs narrator** (EN/FR) — the console explains itself out loud, step by step.
- **Bring your own leads** — import a `.csv` / `.xlsx` and CERBO infers *your* company-brain.
- **No hardcoded numbers** — every score, latency and cost comes from a real run.

---

## Stack

- **Next.js 14** (App Router, static export) · TypeScript strict · Tailwind
- **Cloudflare Pages** (front) · **Pages Functions / Workers** (the agent) · **D1** (SQLite state)
- Framer Motion · React Flow · Sonner · SheetJS
- Live `/proof` via 1s polling of `/api/state`

```
app/            landing (i18n EN/FR), login, product (console), proof
functions/api/  agent endpoints (ingest, qualify, correct, memo, memory, reset) + state + waitlist
lib/            db (D1), agent/steps + rules, llm (OpenAI + OpenRouter fallback), linkup, elevenlabs, i18n
db/schema.sql   D1 schema
hermes-bridge/  local OpenAI-compatible bridge to the Hermes harness
```

## Run locally

```bash
npm install
npm run db:local          # create the local D1 database (once)
npm run hermes:bridge     # optional — route inference through the Hermes harness
npm run cf:dev            # http://localhost:8788
```

Secrets live in `.dev.vars` (gitignored). See `.env.example` for the variable names.
Sign in to the console with access code **`demo`**.

## Deploy (Cloudflare)

```bash
npx wrangler d1 create cerbo          # paste the id into wrangler.toml
npm run db:remote                     # apply the schema
npx wrangler pages secret put OPENAI_API_KEY   # + LINKUP_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
npm run cf:deploy                     # → *.pages.dev
```

## Security

Keys are never committed — `.gitignore` covers `.env*` and `.dev.vars`; only
`.env.example` (names, no values) is tracked. Rotate all keys after the event.

---

_Built with a Hermes harness. See `CLAUDE.md` for the judge demo checklist and `PRD.md` for the spec._

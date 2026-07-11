# CERBO

Agent revenue **AI-as-Agency** : qualifie des leads, se trompe sur un cas piégé,
se fait corriger **à la voix**, et transforme la correction en **skill persistant**
que chaque session suivante applique. Preuve **sourcée Cloudflare D1, en direct**.

Construit sur un harness **Hermes**. **100% Cloudflare** : front sur **Pages**,
agent sur **Pages Functions (Workers)**, état sur **D1**. Le live de `/proof` est
un **polling 1 s** sur `/api/state`. **Aucun nombre codé en dur** : chaque score,
latence et coût vient d'un run réel.

---

## ⚡ JUDGE DEMO CHECKLIST

**Avant les juges (2 min) :**
1. `npm run cf:dev` tourne (build + `wrangler pages dev` → http://localhost:8788).
2. Ouvre `http://localhost:8788/` (landing) → **Enter the console** → `/login`.
   Email + code d'accès **`demo`** → tu arrives sur `/product`.
   (`/product` et `/proof` sont gatés côté client : sans login → `/login`.)
3. Mets `/product` sur un écran, `/proof` sur un second onglet.
4. Clique **Reset** → session propre. Le brain à l'écran est en **v1** (R3 piégée).
5. Vérifie le son (le memo ElevenLabs se joue dans le produit).

**Ordre de démo (≈4 min) — où cliquer, quel power-up nommer :**

| # | Action sur `/product` | Ce qui se passe | Power-up |
|---|---|---|---|
| 1 | **Ingest → brain v1** | 20 leads → 4 règles inférées | **OpenAI** (receipt provider `openai`) |
| 2 | **Qualify + Linkup** | Lead standard qualifié, enrichissement live cité | **Linkup** (badge « LIVE ») |
| 3 | **Run v1 : Atelier Nord** | Lead à forte valeur **rejeté** (R3) — le piège | (decision log : `rejected` / `R3`) |
| 4 | **Dicter (Wispr)** puis **Appliquer** | Réécrit **brain v2** + **skill horodaté** (D1) | **Wispr Flow** + diff v1\|v2 animé |
| 5 | **Re-run v2 : Atelier Nord** | **Même lead → qualifié** (R3 v2) — **LE PIC** | (diff : R3 rouge → vert) |
| 6 | **Memo ElevenLabs** | Memo audio 2 phrases **joué dans le produit** | **ElevenLabs** |
| 7 | **Memory : reload au boot** | Nouvelle session, brain **rechargé depuis D1**, applique v2 | **Cloudflare D1** (`persisted: true`) |
| 8 | Bascule sur **`/proof`** | Receipts Hermes, skill **horodaté**, power-ups **witnessed**, decision log — lus **live depuis D1** (poll 1 s) | **Cloudflare** (Pages + D1) |

**Pic à protéger : étapes 3 → 5.** Si le temps manque, coupe landing + memo AVANT le pic et `/proof`.

**Filet réseau :** `⇧F` sur `/product` = **mode fallback** (dataset + réponses MCP cachées).
Rien n'est fabriqué : receipts `provider: fallback-cache`, Linkup affiche `cache`.

---

## Lancer en local

```bash
# 1) créer la base D1 locale (une fois)
npm run db:local          # applique db/schema.sql à la D1 locale (miniflare)

# 2) (option puissante) faire tourner l'inférence SUR le harnais Hermes
npm run hermes:bridge     # bridge OpenAI-compatible → hermes -z (port 8790)

# 3) build + serveur Cloudflare local (Pages + Functions + D1 + .dev.vars)
npm run cf:dev            # http://localhost:8788
```

Secrets locaux dans **`.dev.vars`** (gitignored). En prod, ce sont des secrets Pages.

### Mode Hermes littéral (local uniquement)
`.dev.vars` contient `HERMES_BASE_URL=http://127.0.0.1:8790/v1`. Quand le bridge
tourne, **chaque inférence transite réellement par le harnais Hermes** (`hermes -z`
→ gpt-5.6-sol) : les receipts sur `/proof` affichent `provider: hermes`. Si le
bridge est absent/lent, `lib/llm` **retombe automatiquement sur OpenAI** — la démo
ne casse jamais. Le **cloud** (`cerbo.pages.dev`) ne peut pas joindre localhost,
donc il reste sur OpenAI direct. Pour désactiver le mode Hermes en local :
commenter `HERMES_BASE_URL` dans `.dev.vars`.

> Après avoir changé `database_id` dans `wrangler.toml`, relance `npm run db:local`
> (Miniflare indexe la D1 locale par id).

## Déployer sur Cloudflare (compte requis)

```bash
npx wrangler login                       # OAuth navigateur
npx wrangler d1 create cerbo             # copie le database_id renvoyé…
#   …colle-le dans wrangler.toml → [[d1_databases]] database_id = "..."
npm run db:remote                        # applique le schéma à la D1 distante
# secrets de prod (une fois chacun) :
npx wrangler pages secret put OPENAI_API_KEY
npx wrangler pages secret put OPENAI_MODEL
npx wrangler pages secret put LINKUP_API_KEY
npx wrangler pages secret put ELEVENLABS_API_KEY
npx wrangler pages secret put ELEVENLABS_VOICE_ID
# (OPENROUTER_API_KEY / OPENROUTER_MODEL optionnels — fallback LLM)
npm run cf:deploy                        # build + wrangler pages deploy out
```

Le premier `cf:deploy` crée le projet Pages `cerbo` et te donne l'URL `*.pages.dev`.

---

## Architecture (100% Cloudflare)

```
app/
  page.tsx            landing unframe-style (EN) + waitlist (D1)
  login/page.tsx      access wall (cookie) → gate /product & /proof
  product/page.tsx    l'instrument : pipeline, diff v1|v2, decision log, tool calls
  proof/page.tsx      preuve live (polling /api/state sur D1)
functions/api/        Pages Functions (Workers) — l'agent
  agent/{ingest,qualify,correct,memo,memory,reset}.ts
  waitlist.ts · state.ts
lib/
  db.ts               data layer D1 (remplace Convex)
  agent/steps.ts      logique des étapes (pure, sur env + D1)
  agent/rules.ts      moteur de règles déterministe
  llm.ts              OpenAI primary + fallback OpenRouter (env-injecté)
  linkup.ts · elevenlabs.ts   enrichissement + TTS (edge-safe, base64 Web)
  useLive.ts          hook de polling (remplace les live queries)
  auth.ts + components/AuthGate.tsx   gate client (remplace le middleware)
db/schema.sql         schéma D1 (leads, brains, skills, decisions, receipts, powerups, waitlist)
data/seed.ts          20 leads + Atelier Nord (piégé) + règles v1 / R3 corrigée
```

## Honnêteté des claims
- **OpenAI** infère les règles à l'ingest (receipt provider/model/tokens/coût réels).
- **Linkup** enrichit en live ; échec/offline → cache, badge `cache` (jamais faussé).
- **Wispr Flow** : la dictée remplit le champ réellement utilisé pour écrire la v2.
- **ElevenLabs** synthétise le memo joué dans le produit ; offline → texte, étiqueté.
- **Cloudflare D1** stocke tout ; `/proof` lit en direct (poll 1 s) ; le reload au boot prouve la persistance.
- Score/latence/coût **calculés au runtime**. Seul « dur » : le rate-card token (usage × tarif).
```

# PRD — CERBO

## 1. Une phrase
Un agent revenue qui apprend **en direct, à la voix** : il qualifie des leads, se
trompe sur un cas piégé, se fait corriger par une phrase dictée, et transforme
cette correction en **skill persistant** appliqué par toutes les sessions suivantes.

## 2. Track
**AI-as-Agency** — l'agent agit, décide, et s'améliore de façon witnessable.

## 3. Contexte
Buildathon Hermes (GrowthX), jugé en LIVE. Build local, 4h, aucun déploiement.
Harness Hermes conservant les session receipts. Aucun nombre codé en dur.

## 4. Priorité absolue
1. **Le pic** : correction vocale → skill persistant (rejeté → qualifié, en direct).
2. **Le `/proof`** : dashboard de preuve sourcé Convex, live.
3. **5 power-ups** load-bearing et démontrables à un mentor.

## 5. Les 5 power-ups (tous load-bearing)
| Power-up | Rôle load-bearing | Preuve witnessable |
|---|---|---|
| **Linkup** (MCP) | Enrichissement firmographique LIVE d'un lead pendant la qualif, cité dans la décision | badge `LIVE`, employees/funding/signal dans la carte + tool call |
| **ElevenLabs** | Memo audio de business-value **joué dans le produit** | le son sort ; receipt `elevenlabs:tts` |
| **Wispr Flow** | Dictée vocale de la correction (champ réellement utilisé) | la dictée remplit le champ → écrit la v2 |
| **OpenAI** | Sub-task d'inférence des règles | receipt `provider: openai`, tokens/coût réels |
| **Convex** | Stocke tout l'état ; `/proof` lit en live ; reload au boot | `persisted: true`, 5/5 `witnessed` |

## 6. Stack
Next.js 14 App Router · TS strict · Tailwind + shadcn-style · Framer Motion ·
Lucide · Sonner · Convex (dev local anonyme). Agent sur harness Hermes.

## 7. Style visuel (unframe.ai)
Canvas near-black `#08080A`, surfaces `#111114`, bordures `rgba(255,255,255,0.08)`,
texte off-white, **un** accent froid (`#5EE6D0`), **mono sur tous les
chiffres/versions/timestamps**, whitespace généreux, aucun gradient déco.

## 8. Données
- `data/seed.ts` : 20 leads anonymisés + **Atelier Nord** (lead piégé, fondateur
  ex-VP Revenue + budget déclaré) + règles v1 (R3 défaillante) + R3 corrigée.
- `cerbo-leads.csv` : miroir CSV des leads (parité / import).
- `brain/company-brain.md` : v1 affiché à l'écran, R3 piégée intacte.

## 9. Pipeline agent (chaque étape logue une décision)
`decision = {input, règle citée, output, verdict, score, latence, coût, tokens, tool calls}`
1. **ingest** — lit 20 leads, OpenAI infère les règles, écrit brain v1.
2. **qualify** — nouveau lead → enrichissement **Linkup live** → Qualifié/Non + score + citation règle.
3. **correct (LE PIC)** — `run-v1` (Atelier Nord rejeté R3) → dictée **Wispr** →
   `apply` (réécrit brain v2 + skill horodaté dans `/skills` + Convex) → `run-v2` (qualifié).
4. **memo** — OpenAI rédige 2 phrases, **ElevenLabs** les joue.
5. **memory** — brain **rechargé depuis Convex** au boot d'une nouvelle session ;
   prouve que la règle v2 s'applique sans ré-apprentissage.

## 10. Pages
- **`/`** landing unframe courte + 1 champ waitlist local (Convex) — bonus cross-track.
- **`/product`** l'instrument : logs, versions, diffs v1|v2, arbre des tool calls,
  tokens/coût/latence par étape. Pas un chatbot.
- **`/proof`** lecture Convex live : receipts Hermes, skills v1/v2 horodatés,
  statut live des 5 power-ups, decision log, compteur waitlist.

## 11. Robustesse démo
- **Mode fallback caché** (`⇧F`) : dataset + réponses MCP cachées ; survit à une
  coupure réseau **sans fabriquer de chiffres** (receipts `fallback-cache`, badge `cache`).
- Skeleton loaders sur chaque appel agent/MCP · toasts Sonner · error boundary.
- Happy-path **et** edge-case jouables sans faille.

## 12. Critères de succès
- Le pic se voit : un lead passe **rejeté → qualifié** après une phrase dictée, en direct.
- `/proof` montre le skill **horodaté** et 5/5 power-ups **witnessed**, lus depuis Convex.
- Aucun chiffre codé en dur ; chaque claim est honnête et traçable à un receipt.
- L'app démarre et joue la démo complète sans intervention.

## 13. Sécurité
Clés dans `.env.local` uniquement. `.gitignore` créé **avant** tout (`.env*`,
`.convex`, `node_modules`). `.env.example` = noms seulement. Jamais de clé commitée.

## 14. Ordre de build strict (incrémental, ne pas bloquer)
1. gitignore + env
2. schema Convex
3. pipeline ingest + brain v1
4. qualify + Linkup
5. **correction Wispr + skill v2 (le pic)**
6. `/proof`
7. memo ElevenLabs
8. memory
9. landing

> Si le temps manque : couper **landing** et **memo** AVANT de toucher au **pic**
> et au **`/proof`**.

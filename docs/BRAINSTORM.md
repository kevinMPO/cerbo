# CERBO — BRAINSTORM (démo gagnante → produit payé par un mid-market)

> Session brainstorm. FOCUS = all. **Aucun code écrit tant que le fondateur n'a pas donné le GO avec les numéros choisis.**

---

## Phase 1 — Audit (10 lignes)

1. **Fort** : le *pic* (`run v1 → correction vocale Wispr → run v2`) est une démo de produit réelle, pas un slide — [lib/agent/steps.ts](../lib/agent/steps.ts) `runCorrect`.
2. **Fort** : l'honnêteté « chaque décision = un receipt » lu live sur [/proof](../app/proof/page.tsx) via polling D1 — vrai différenciateur anti-démo-gonflée.
3. **Fort** : 100% Cloudflare (Pages/Functions/D1) + routage littéral Hermes en local (`provider: hermes`) — [hermes-bridge/server.mjs](../hermes-bridge/server.mjs).
4. **Fort** : graphe d'agent live + narration bilingue ElevenLabs + import CSV/Excel — surface de démo dense.
5. **Théâtre** : la qualification n'est **pas** de l'IA — c'est du **regex déterministe** sur `advisory/conseil` et `sizeBand` dans [lib/agent/rules.ts](../lib/agent/rules.ts). OpenAI n'écrit que le markdown + la narration.
6. **Théâtre** : les règles stockées sont `SEED_RULES_V1` **codées en dur** ([data/seed.ts](../data/seed.ts)) — l'inférence OpenAI de l'ingest est **jetée** (seul le markdown est gardé). Le claim « il infère vos règles » est à moitié faux.
7. **Théâtre** : le trap « Atelier Nord » est un **constant** (`MISSED_LEAD`) ; la correction fixe toujours R3. Sur un vrai CSV client, il n'y a **pas** de pic scénarisé.
8. **Fragile** : les endpoints `/api/*` sont **publics** (l'auth est un cookie client-only, [middleware supprimé](../components/AuthGate.tsx)) → conso des crédits ouverte.
9. **Fragile** : pas d'evals, pas de seuil de confiance/escalade, pipeline **fixe**, mémoire = simple reload du dernier brain (1 couche sur 3), pas de trace-tree ni coût par nœud.
10. **Fragile produit** : `qualify` ne traite qu'**un** lead ; les leads importés ne sont pas qualifiés en masse ([functions/api/agent/qualify.ts](../functions/api/agent/qualify.ts)).

**Verdict :** la coquille (surfaces, preuves, pic) est excellente ; le **cœur « intelligent » est du théâtre déterministe**. Le saut vers un produit payé = rendre la qualification réellement pilotée par le brain + transformer la correction one-shot en boucle récurrente + evals.

---

## Tableau ICE — toutes les idées

*ICE = Impact (1-10) × Confiance (1-10) / Effort (S=2, M=5, L=10). Trié par ICE décroissant.*

| # | Axe | Idée | Impact | Conf. | Effort | ICE |
|---|---|---|---|---|---|---|
| 1 | Visuel | **Pic 10x** : takeover plein écran du diff v1→v2 + « chime » à l'écriture du skill + diff épinglé en permanence | 8 | 8 | S | **32** |
| 2 | Visuel | **Labels métier** sur le graphe (« Apprend vos règles » vs `rule inference`) — lisible non-tech | 7 | 8 | S | **28** |
| 3 | Harnais | **Reframe OpenAI** (pas un power-up) → 4 power-ups scorés propres (Linkup/Wispr/ElevenLabs/Cloudflare) | 7 | 9 | S | **31.5** |
| 4 | Visuel | **/proof « money first »** : leads qualifiés / pipeline récupéré en tête, receipts en second | 7 | 7 | S | **24.5** |
| 5 | Visuel | **Empty states + skeletons** audit par page (`/`, `/product`, `/proof`) | 5 | 8 | S | **20** |
| 6 | Harnais | **Eval suite nommée** (`data/evals.json`, Atelier Nord = cas #1) rejouée à chaque changement de brain → chaque correction devient un test, affiché sur /proof | 9 | 7 | M | **12.6** |
| 7 | Product | **Qualification LLM réelle** : le verdict passe par OpenAI qui applique les règles du brain (fin du regex théâtre) | 9 | 7 | M | **12.6** |
| 8 | Product | **Batch qualify** : qualifier TOUS les leads importés → table scorée triée | 8 | 7 | M | **11.2** |
| 9 | Harnais | **Trace-tree sur /proof** : arbre des tool calls dépliable + tokens/coût par nœud (données déjà loggées) | 7 | 8 | M | **11.2** |
| 10 | Product | **Time-to-aha < 3 min** : détection auto d'un lead « raté » dans le CSV de l'inconnu (ou dataset de secours) → pic sans narration | 8 | 6 | M | **9.6** |
| 11 | Product | **Audit Company Brain payant** : livrable « Get your Company Brain » (brain.md + rapport) + checkout **Dodo** | 8 | 6 | M | **9.6** |
| 12 | Harnais | **Stocker les règles inférées par OpenAI** (pas `SEED_RULES_V1`) — ferme le plus gros trou d'honnêteté | 8 | 6 | M | **9.6** |
| 13 | Harnais | **Confiance + escalade par exception** : score de confiance, auto sous seuil, « escaladé » au-dessus | 8 | 6 | M | **9.6** |
| 14 | Product | **Digest hebdo de valeur** (ElevenLabs + email Resend déjà câblé) : « cette semaine : N qualifiés, M règles apprises » calculé depuis D1 | 6 | 7 | M | **8.4** |
| 15 | Visuel | **Sound design** du pic (sting « appris ») — mémorabilité | 5 | 7 | S | **17.5** |
| 16 | Product | **Inbox d'exceptions** : /product devient une file de leads incertains ; l'humain tranche → le brain apprend (boucle récurrente vs one-shot) | 9 | 6 | L | **5.4** |
| 17 | Harnais | **Mémoire 3 couches** : tâche courante / historique client / règles métier (aujourd'hui : 1 couche) | 7 | 6 | L | **4.2** |
| 18 | Harnais | **Agent manager/planner** : un agent chef qui planifie et délègue à des spécialistes (org dynamique) | 8 | 5 | L | **4.0** |

---

## Détail par axe

### Axe 1 · Product design
- **#7 Qualification LLM réelle** — *Problème* : le verdict est du regex ([rules.ts](../lib/agent/rules.ts)), pas de l'IA. *Proposition* : `qualify` construit un prompt (règles du brain + lead + enrichissement Linkup) → OpenAI renvoie `{verdict, score, ruleCited, confidence}` en JSON ; le moteur déterministe devient le **fallback** honnête. *Pourquoi* : rend vrai le claim central, ouvre la confiance/escalade. *Challenge* : casse l'illusion « déterministe = fiable » — mais c'est le produit. Effort M.
- **#8 Batch qualify** — *Problème* : `qualify` ne traite qu'un lead ; l'import CSV n'aboutit pas à une qualification de masse. *Proposition* : après ingest, bouton « Qualifier les N leads » → table scorée. *Pourquoi* : transforme « joli import » en valeur livrée. Effort M.
- **#10 Time-to-aha < 3 min** — *Problème* : le pic dépend d'un trap scénarisé (`MISSED_LEAD`), invisible sur un vrai CSV. *Proposition* : détecter dans le CSV importé un lead « à forte valeur mais rejeté » (conflit règle/signal) et le proposer comme cas de correction. *Pourquoi* : l'aha survient sur **leurs** données, sans narration. Effort M.
- **#11 Audit Company Brain payant** — *Problème* : aucune monétisation in-product. *Proposition* : livrable téléchargeable `company-brain.md` + rapport de règles, débloqué par un checkout **Dodo Payments** (« Get your Company Brain — €X »). *Pourquoi* : matérialise le business model + **+25 pts** rubric (checkout live). Effort M.
- **#14 Digest hebdo** — *Problème* : le memo ElevenLabs est one-shot. *Proposition* : agrégation D1 → memo/email hebdo « N qualifiés, M règles apprises ». *Pourquoi* : rétention + valeur récurrente (Resend déjà branché). Effort M.
- **#16 Inbox d'exceptions** — *Problème* : la correction est un one-shot démo. *Proposition* : file de leads incertains que l'agent escalade ; l'humain tranche d'une phrase → skill. *Pourquoi* : c'est **le** produit au-delà de la démo (l'agent qui bosse et escalade par exception). Effort L.

### Axe 2 · Visuel / UI
- **#1 Pic 10x** — *Problème* : le diff v1→v2 défile et disparaît. *Proposition* : au moment de la correction, takeover animé plein cadre `REJETÉ 12 → QUALIFIÉ 97`, un « chime » à l'écriture du skill, puis diff **épinglé** en haut de /product. *Pourquoi* : c'est LA signature — la rendre inoubliable et permanente. *Challenge* : le [BrainDiff](../components/BrainDiff.tsx) actuel est discret. Effort S. **Renforce le pic.**
- **#2 Labels métier** — *Problème* : le [graphe](../components/AgentGraph.tsx) parle `rule inference`, `state + receipts` — jargon. *Proposition* : libellés orientés résultat (« Apprend vos règles », « Enrichit le prospect », « Garde les preuves »). *Pourquoi* : un mentor/juge non-tech comprend en 2 s. Effort S.
- **#4 /proof money-first** — *Problème* : /proof ouvre sur des receipts techniques. *Proposition* : bandeau haut « leads qualifiés · règles apprises · pipeline récupéré » (calculés D1), receipts en dessous. *Pourquoi* : parle business avant technique. Effort S.
- **#5 Empty states + skeletons** — *Problème* : états vides pauvres. *Proposition* : audit `/`, `/product`, `/proof` — messages d'amorçage + skeletons cohérents (le [skeleton](../app/globals.css) existe, sous-utilisé). Effort S.
- **#15 Sound design** — sting discret « appris » à la v2. Effort S.

### Axe 3 · Orchestrateur / Harnais Hermes
- **#3 Reframe OpenAI** — *Problème* : le rail [PowerupRail](../components/PowerupRail.tsx) présente OpenAI comme power-up ; le handbook dit que le provider n'est **pas** scoré. *Proposition* : OpenAI = « moteur de raisonnement » (hors rail) → 4 power-ups scorés nets. *Pourquoi* : crédibilité jury. Effort S.
- **#6 Eval suite nommée** — *Problème* : aucune non-régression ; Atelier Nord est un cas unique perdu. *Proposition* : `data/evals.json` (leads + verdicts attendus), endpoint `/api/agent/eval` rejoué à chaque changement de brain, résultat sur /proof. *Pourquoi* : **chaque correction devient un test** — argument produit ET rubric (observabilité, mémoire qui survit). Effort M.
- **#9 Trace-tree /proof** — *Problème* : le decision log est plat. *Proposition* : arbre dépliable des tool calls + tokens/coût par nœud (déjà dans `toolCalls`), filtrable par étape. *Pourquoi* : observabilité réelle = argument enterprise. Effort M.
- **#12 Règles réellement inférées** — stocker la sortie OpenAI de l'ingest au lieu de `SEED_RULES_V1`. Ferme le plus gros trou d'honnêteté. Effort M.
- **#13 Confiance + escalade** — le verdict porte une confiance ; sous seuil → auto, au-dessus → escaladé (nourrit #16). Effort M.
- **#17 Mémoire 3 couches** / **#18 Agent manager** — paris structurants (voir plus bas).

---

## TOP 3 quick wins (< 2h chacun) — prêts à coder

1. **#1 — Pic 10x (takeover + chime + diff épinglé)** — [components/BrainDiff.tsx](../components/BrainDiff.tsx) + [app/product/page.tsx](../app/product/page.tsx). **Renforce directement le pic** (jamais le fragilise) : c'est le moment que le jury retient.
2. **#3 — Reframe OpenAI en « moteur »** — [components/PowerupRail.tsx](../components/PowerupRail.tsx) (+ libellés). Corrige une erreur qui **décrédibilise** devant un mentor. 15 min.
3. **#2 + #4 — Lisibilité non-tech** : labels métier du graphe + /proof money-first — [AgentGraph.tsx](../components/AgentGraph.tsx), [app/proof/page.tsx](../app/proof/page.tsx). Rend la démo compréhensible sans toi.

*(Runners-up <2h : #5 empty states, #15 sound.)*

## TOP 3 paris structurants (2-4 semaines)

1. **Qualification réelle + Eval suite (#7 + #6 + #12)** — le brain pilote vraiment le verdict (LLM), et chaque correction s'ajoute à une suite d'evals rejouée. *Transforme le théâtre en produit + non-régression.* Roadmap : (s1) qualify LLM + fallback déterministe ; (s2) evals.json + endpoint + /proof ; (s3) stocker règles inférées.
2. **Inbox d'exceptions + escalade par confiance (#16 + #13)** — l'agent bosse en autonomie sous seuil, escalade au-dessus, l'humain tranche → skill. *Le produit au-delà de la démo.* Roadmap : score de confiance → état « escaladé » → file → apprentissage.
3. **Monétisation : audit Company Brain payant + Dodo (#11)** — livrable payant in-product. *Le business model incarné + +25 pts rubric.* Roadmap : livrable brain+rapport → checkout Dodo → gate téléchargement.

## 3 questions ouvertes (j'ai besoin de ton arbitrage)

1. **Moteur de qualification** : on garde le **déterministe** (rapide, explicable, mais théâtre) comme socle et on ajoute une **couche LLM** par-dessus (hybride, mon choix), OU on passe **full-LLM** (vrai produit, mais latence ~2-7s/lead, coût, non-déterminisme qui peut fragiliser le pic en live) ?
2. **Hackathon vs produit** : on optimise le **pic scénarisé** (garder `Atelier Nord`/`MISSED_LEAD` pour un run infaillible devant le jury) OU le **cas réel** (détecter le trap dans le CSV du client, plus risqué) — ou les deux surfaces cohabitent (démo = scénarisé, prod = réel) ?
3. **Argent maintenant ou après** : on câble **Dodo (checkout audit)** dès maintenant pour les **+25 pts** et le bonus Revenue, OU on reste waitlist et on monétise post-hackathon ?

> STOP — En attente du GO avec les numéros choisis avant tout code.

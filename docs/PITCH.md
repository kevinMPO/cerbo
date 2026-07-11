# CERBO — Pitch & Architecture (FR / EN)

---

## 1. Elevator pitch

### 🇫🇷 Version courte (15 s)
> **CERBO rend votre entreprise lisible par l'IA.** C'est un Forward Deployed Engineer agent : il apprend vos règles métier dans un *Company Brain* gouverné, qualifie vos prospects en citant la règle exacte de chaque décision, et quand il se trompe, vous le corrigez d'une simple phrase à l'oral. Cette correction devient une compétence permanente. On le corrige une fois, jamais deux.

### 🇫🇷 Version narrative (60-90 s)
> Pendant vingt ans, nous avons vendu des outils — des licences « seats » en espérant que les gens les utilisent. Cette époque est révolue : aujourd'hui, nous vendons le travail accompli.
>
> Mais un agent IA n'a de valeur que s'il comprend réellement votre entreprise. Or aujourd'hui, chaque entreprise est **illisible pour l'IA** : les règles métier vivent dans la tête des collaborateurs, dispersées entre une quinzaine d'outils qui ne se parlent pas.
>
> **CERBO rend votre entreprise compréhensible par les machines.** C'est le premier *Forward Deployed Engineer* que vous n'avez pas à recruter : il apprend vos règles dans un **Company Brain gouverné**, qualifie vos prospects en citant précisément la règle qui a motivé chaque décision, et lorsqu'il se trompe, il suffit de le corriger **d'une phrase à l'oral**. Cette correction devient une **compétence permanente**. Vous le corrigez une fois, jamais deux.
>
> **Company Brain → Forward Deployed Engineer IA → Operating System.** Le service devient un logiciel qui s'améliore en permanence.

### 🇬🇧 Short version (15 s)
> **CERBO makes your company legible to AI.** It's a Forward Deployed Engineer agent: it learns your business rules into a governed *Company Brain*, qualifies your leads while citing the exact rule behind every decision, and when it's wrong, you correct it with a single spoken sentence. That correction becomes a permanent skill. Correct it once, never twice.

### 🇬🇧 Narrative version (60-90 s)
> For twenty years we sold tools — user "seats" we billed hoping people would use them. That era is over: today, we sell the work itself.
>
> But an AI agent is only valuable if it truly understands your company. And today, every company is **illegible to AI**: the business rules live in your people's heads, scattered across a dozen-plus tools that don't talk to each other.
>
> **CERBO makes your company machine-readable.** It's the first *Forward Deployed Engineer* you don't have to hire: it learns your rules into a **governed Company Brain**, qualifies your leads while citing the precise rule behind each decision, and when it's wrong, you simply correct it **with one spoken sentence**. That correction becomes a **permanent skill**. Correct it once, never twice.
>
> **Company Brain → AI Forward Deployed Engineer → Operating System.** The service becomes software that improves itself, continuously.

---

## 2. L'agent CERBO & le harnais Hermes / The CERBO agent & the Hermes harness

### 🇫🇷 Qu'est-ce qu'un agent, et que fait le « harnais » ?

Un **modèle de langage (LLM)** seul ne fait que produire du texte. Pour en faire un **agent** — quelque chose qui *agit*, se souvient et s'améliore — il faut un **harnais** : l'échafaudage logiciel autour du modèle. CERBO tourne sur le harnais **Hermes** (agent open-source de Nous Research, la plateforme du buildathon).

Le harnais Hermes fournit cinq choses qu'un LLM nu n'a pas :

1. **La boucle d'agent** : lit la demande → choisit un outil (ou une compétence, ou un serveur MCP) → l'exécute → observe le résultat → recommence jusqu'à la réponse. C'est ce qui transforme « générer du texte » en « accomplir une tâche ».
2. **La mémoire persistante** : `SOUL.md` (comment l'agent se comporte) et `MEMORY.md` (les faits durables). L'agent ne repart pas de zéro à chaque session.
3. **Les compétences (skills)** : des capacités réutilisables. Une correction apprise devient un **fichier skill horodaté** que toutes les sessions suivantes appliquent.
4. **Les session receipts** : la **trace vérifiable** de chaque action de l'agent — quel modèle, quels tokens, quel coût, quelle latence, quelle règle citée. C'est la gouvernance.
5. **Les outils / serveurs MCP** : des connexions standardisées vers des capacités externes (recherche, enrichissement, voix…). Le Hermes de CERBO en compte huit : Linkup, Qonto, cinq serveurs Cloudflare, et ElevenLabs.

**Comment CERBO utilise concrètement Hermes :** en local, chaque inférence de CERBO transite *littéralement* par le harnais Hermes (`hermes -z`, modèle gpt-5.6-sol via un pont OpenAI-compatible). Les receipts affichent alors `provider: hermes` — l'agent qui décide *est* le harnais, pas juste une API. C'est ce qui rend le mot « agent » vrai, et pas cosmétique.

**En une phrase :** le harnais Hermes est le **corps** de l'agent (la boucle, la mémoire, les compétences, les preuves), là où OpenAI est son **cerveau** (le raisonnement).

### 🇬🇧 What is an agent, and what does the "harness" do?

A **language model (LLM)** on its own only produces text. To turn it into an **agent** — something that *acts*, remembers, and improves — you need a **harness**: the software scaffolding around the model. CERBO runs on the **Hermes** harness (Nous Research's open-source agent, the buildathon platform).

The Hermes harness provides five things a bare LLM lacks:

1. **The agent loop**: read the request → choose a tool (or skill, or MCP server) → execute it → observe the result → repeat until done. This is what turns "generate text" into "accomplish a task."
2. **Persistent memory**: `SOUL.md` (how the agent behaves) and `MEMORY.md` (durable facts). The agent doesn't start from scratch each session.
3. **Skills**: reusable capabilities. A learned correction becomes a **timestamped skill file** that every future session applies.
4. **Session receipts**: the **auditable trace** of every action — which model, how many tokens, what cost, what latency, which rule cited. This is governance.
5. **Tools / MCP servers**: standardized connections to external capabilities (search, enrichment, voice…). CERBO's Hermes has eight: Linkup, Qonto, five Cloudflare servers, and ElevenLabs.

**How CERBO actually uses Hermes:** locally, every CERBO inference literally routes *through* the Hermes harness (`hermes -z`, gpt-5.6-sol via an OpenAI-compatible bridge). Receipts then read `provider: hermes` — the agent that decides *is* the harness, not just an API call. That's what makes the word "agent" true rather than cosmetic.

**In one line:** the Hermes harness is the agent's **body** (loop, memory, skills, proof); OpenAI is its **brain** (reasoning).

---

## 3. Les briques / The building blocks

### 🇫🇷 À quoi sert chaque composant

| Brique | Rôle | Pourquoi elle est indispensable |
|---|---|---|
| **Leads** (import CSV/Excel) | La matière première : votre pipeline réel devient l'input de l'agent. | Sans vos données, l'agent n'a aucune règle à apprendre. C'est le « votre entreprise ». |
| **OpenAI** | Le cerveau qui raisonne : infère les règles depuis les leads, rédige, décide. | L'intelligence brute derrière l'inférence et la qualification. |
| **Company Brain + versioning** | La mémoire gouvernée des règles métier (v1 inférée → v2 corrigée). | **Le cœur, votre IP.** Le versioning = la gouvernance : chaque règle a une origine, chaque correction est auditable. C'est ce qui rend l'entreprise « lisible ». |
| **Linkup** | Enrichissement firmographique **live** d'un prospect (effectif, funding, signal d'achat), cité dans la décision. | Rend le prospect *compréhensible* — le contexte externe qui manque à vos données internes. |
| **Wispr Flow** | Dictée vocale de la correction : vous parlez, la phrase devient l'input du correctif. | Le canal humain-dans-la-boucle. C'est le « corrigez-le à l'oral ». |
| **ElevenLabs** | La voix de l'agent : joue le memo de valeur business *dans* le produit, et narre la console (FR/EN). | Rend le « done-for-you » tangible — l'agent vous *répond* et *explique*. |
| **Skills horodatés** | La correction devenue compétence permanente (fichier daté, dans `/skills` + base). | Matérialise le « une fois, jamais deux ». Le savoir devient durable et réutilisable. |
| **Harnais Hermes** | Le corps de l'agent : boucle d'action, mémoire, compétences, session receipts, outils MCP. | Transforme un LLM en *Forward Deployed Engineer* qui agit et se souvient. |
| **Cloudflare (Pages + Functions + D1)** | Le substrat de l'OS : Pages sert le produit, Functions font tourner l'agent, D1 stocke tout l'état et alimente `/proof` en direct. | C'est l'« Operating System » sous le capot — compute + mémoire + preuve. |
| **Proof ledger / receipts** | Chaque décision → un receipt (provider, modèle, coût, latence, règle citée). | La gouvernance rendue tangible et vérifiable. L'argument enterprise. |

### 🇬🇧 What each component is for

| Component | Role | Why it's load-bearing |
|---|---|---|
| **Leads** (CSV/Excel import) | The raw material: your real pipeline becomes the agent's input. | Without your data, the agent has no rules to learn. This is the "your company." |
| **OpenAI** | The reasoning brain: infers rules from the leads, writes, decides. | The raw intelligence behind inference and qualification. |
| **Company Brain + versioning** | The governed memory of business rules (v1 inferred → v2 corrected). | **The core, your IP.** Versioning = governance: every rule has an origin, every correction is auditable. This is what makes the company "legible." |
| **Linkup** | **Live** firmographic enrichment of a prospect (headcount, funding, buying signal), cited in the decision. | Makes the prospect *understandable* — the external context your internal data lacks. |
| **Wispr Flow** | Voice dictation of the correction: you speak, the sentence becomes the fix's input. | The human-in-the-loop channel. This is the "correct it out loud." |
| **ElevenLabs** | The agent's voice: plays the business-value memo *inside* the product, and narrates the console (FR/EN). | Makes "done-for-you" tangible — the agent *answers* and *explains*. |
| **Timestamped skills** | The correction turned into a permanent capability (dated file, in `/skills` + DB). | Materializes "once, never twice." Knowledge becomes durable and reusable. |
| **Hermes harness** | The agent's body: action loop, memory, skills, session receipts, MCP tools. | Turns an LLM into a *Forward Deployed Engineer* that acts and remembers. |
| **Cloudflare (Pages + Functions + D1)** | The OS substrate: Pages serves the product, Functions run the agent, D1 stores all state and feeds `/proof` live. | This is the "Operating System" under the hood — compute + memory + proof. |
| **Proof ledger / receipts** | Every decision → a receipt (provider, model, cost, latency, rule cited). | Governance made tangible and verifiable. The enterprise argument. |

---

### 🇫🇷 L'architecture en une phrase
**OpenAI** raisonne · **Linkup** contextualise · **Wispr** vous fait corriger · **ElevenLabs** vous répond · **Hermes** orchestre et garde les preuves · **Company Brain** versionne le savoir · **Cloudflare** fait tourner et prouve le tout, en direct.

### 🇬🇧 The architecture in one line
**OpenAI** reasons · **Linkup** contextualizes · **Wispr** lets you correct · **ElevenLabs** answers you · **Hermes** orchestrates and keeps the proof · **Company Brain** versions the knowledge · **Cloudflare** runs and proves it all, live.

---

_CERBO — built at the GrowthX Hermes Buildathon · [cerbo.pages.dev](https://cerbo.pages.dev)_

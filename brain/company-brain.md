# company-brain.md — v1

> État de départ montré à l'écran. **Ne pas corriger la Règle 3 avant la démo** —
> c'est l'exception piégée qui déclenche le pic v1 → v2. Cliquer « Ingest » dans
> l'instrument régénère cette v1 depuis les 20 leads ; la correction vocale
> écrit la v2 par-dessus.

## ICP (Ideal Customer Profile)
CERBO qualifie des comptes B2B pour une équipe revenue senior. Profil de départ :

- Éditeurs SaaS B2B et plateformes data/infra.
- Effectif indicatif 50–500.
- Régions EU / UK / US.
- Un signal d'intention récent (embauche, levée, refonte, migration).

## Règles inférées (v1)

### R1 — Signal d'expansion
Qualifier en priorité les comptes montrant un signal d'expansion récent
(recrutement commercial, levée de fonds, ouverture de marché).

### R2 — Bande d'effectif
Qualifier quand l'effectif est dans la bande 50–500 et la région EU/UK/US.

### R3 — Filtre conseil / fondateur  ⚠️ EXCEPTION PIÉGÉE
Rejeter automatiquement les cabinets de **conseil / advisory** et les
structures **fondateur-unique (< 10 personnes)** : considérés hors-ICP par
défaut, quel que soit le signal.

> Défaut connu : cette règle est trop large. Elle rejette « Atelier Nord »
> — cabinet de conseil fondé par un ex-VP Revenue, budget élevé et signal
> d'achat explicite — alors que c'est un lead à forte valeur. La correction en
> démo restreint R3 aux structures conseil **sans** signal d'achat **et sans**
> fondateur décisionnaire senior.

### R4 — Fraîcheur du signal
Exiger un signal d'intention daté de moins de 30 jours.

## Compétences dérivées
- `qualify-lead` — applique R1–R4, cite la règle décisive, renvoie un score calculé.

_(v1 générée à l'ingest. La v2 sera écrite par la correction vocale.)_

import type { SeedRule } from "../../data/seed";

/** Renders company-brain.md markdown from a rule set. */
export function buildBrainMarkdown(
  version: number,
  rules: SeedRule[],
  note: string
): string {
  const rulesMd = rules
    .map(
      (r) =>
        `### ${r.id}\n${r.text}\n\n_origine: ${r.origin}_`
    )
    .join("\n\n");
  return `# company-brain.md — v${version}

> Mémoire de qualification de CERBO. ${note}

## Règles (v${version})

${rulesMd}

## Compétences dérivées
- \`qualify-lead\` — applique les règles ci-dessus, cite la règle décisive, renvoie un score calculé.
`;
}

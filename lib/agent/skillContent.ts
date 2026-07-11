/**
 * Edge-safe skill builder. Produces a timestamped filename + markdown content.
 * On Cloudflare there is no filesystem, so the skill is persisted in D1 and
 * shown on /proof from there. (The former Node version also wrote to disk.)
 */
export type SkillContent = {
  name: string;
  version: number;
  filename: string;
  content: string;
  createdAt: number;
};

export function buildSkill(args: {
  name: string;
  version: number;
  brainVersion: number;
  rationale: string;
  ruleText: string;
}): SkillContent {
  const createdAt = Date.now();
  const stamp = new Date(createdAt)
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const filename = `${args.name}-v${args.version}-${stamp}.md`;
  const content = `# Skill: ${args.name} (v${args.version})

- Generated: ${new Date(createdAt).toISOString()}
- Brain version: v${args.brainVersion}
- Origin: voice correction (Wispr Flow dictation)

## Rule applied
${args.ruleText}

## Why this skill exists
${args.rationale}

## Behaviour
When qualifying an advisory / founder-led lead, do NOT auto-reject. Check for an
explicit buying signal (stated budget, booked scoping call, active evaluation)
AND a senior decision-maker founder. If both hold, qualify and cite R3 (v2).
`;
  return { name: args.name, version: args.version, filename, content, createdAt };
}

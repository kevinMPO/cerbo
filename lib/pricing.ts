/**
 * Per-token rate cards (USD per 1M tokens). Cost shown in the UI is always
 * usage * rate, computed from the real token counts the API returns — never a
 * hardcoded dollar figure.
 */
export const RATES: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "openai/gpt-4o": { in: 2.5, out: 10 },
  "openai/gpt-4o-mini": { in: 0.15, out: 0.6 },
};

export function costUsd(model: string, tokensIn: number, tokensOut: number) {
  const rate = RATES[model] ?? RATES["gpt-4o"]!;
  return (tokensIn * rate.in + tokensOut * rate.out) / 1_000_000;
}

/**
 * USD per million tokens. First-party Claude API rates, cached 2026-10.
 * Claude Code writes exact cost into the transcript (cost-state); this table is the fallback
 * for transcripts without it, and for people who want to re-price with their own numbers
 * via ~/.claude-trail/settings.json { "pricing": { "<model-prefix>": {...} } }.
 */
export interface Price { input: number; output: number; cacheRead: number; cacheWrite: number }

export const PRICES: Record<string, Price> = {
  "claude-fable-5-1": { input: 10, output: 50, cacheRead: 0.25, cacheWrite: 12.5 },
  "claude-fable-5": { input: 10, output: 50, cacheRead: 1.0, cacheWrite: 12.5 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-opus-4": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-sonnet-4": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  "claude-haiku-4": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

export function priceFor(model: string, overrides: Record<string, Price> = {}): Price | null {
  const table = { ...PRICES, ...overrides };
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  for (const k of keys) if (model.startsWith(k)) return table[k];
  return null;
}

export interface Usage { input: number; output: number; cacheRead: number; cacheWrite: number }

export function usd(model: string, u: Usage, overrides?: Record<string, Price>): number {
  const p = priceFor(model, overrides);
  if (!p) return 0;
  return (u.input * p.input + u.output * p.output + u.cacheRead * p.cacheRead + u.cacheWrite * p.cacheWrite) / 1e6;
}

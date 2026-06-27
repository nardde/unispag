/** Deterministic gradient pair for a username (same input → same colors). */
const PALETTE: [string, string][] = [
  ['#0071e3', '#46a3ff'],
  ['#7c3aed', '#a78bfa'],
  ['#047857', '#34d399'],
  ['#be123c', '#fb7185'],
  ['#c2410c', '#fb923c'],
  ['#155e75', '#22d3ee'],
  ['#9d174d', '#f472b6'],
  ['#1d4ed8', '#60a5fa'],
  ['#065f46', '#10b981'],
  ['#6d28d9', '#c084fc'],
];

export function avatarGradient(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

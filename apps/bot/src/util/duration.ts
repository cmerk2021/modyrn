const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Parses a human duration like `10m`, `1h30m`, `2d` into milliseconds.
 * Returns `undefined` for empty or unparseable input.
 */
export function parseDuration(input: string): number | undefined {
  const matches = input.trim().toLowerCase().matchAll(/(\d+)\s*([smhdw])/g);
  let total = 0;
  let matched = false;
  for (const match of matches) {
    matched = true;
    total += Number(match[1]) * (UNIT_MS[match[2]!] ?? 0);
  }
  return matched ? total : undefined;
}

/** Generador mulberry32: reproducible para una misma semilla. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Variación determinista en [-amplitude, +amplitude] para un paso concreto. */
export function jitterFor(seed: number, step: number, salt: number, amplitude: number) {
  if (!amplitude) return 0;
  const random = seededRandom((seed ^ Math.imul(step + 1, 2654435761) ^ Math.imul(salt + 1, 40503)) >>> 0);
  return (random() * 2 - 1) * amplitude;
}

export function isValidSeed(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 0xffffffff;
}

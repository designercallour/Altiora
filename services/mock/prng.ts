/**
 * Deterministic pseudo-random generator (mulberry32).
 *
 * Seeded so the mock dataset — and therefore every chart — is identical on
 * every reload. No `Math.random()` anywhere in seed generation.
 */
export class Prng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number, decimals = 1): number {
    const v = this.next() * (max - min) + min;
    const f = 10 ** decimals;
    return Math.round(v * f) / f;
  }

  bool(probabilityTrue = 0.5): boolean {
    return this.next() < probabilityTrue;
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)]!;
  }

  /** Weighted pick. `weights` aligns index-for-index with `items`. */
  pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }

  shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }

  /** A stable UUID-v4-shaped string. */
  uuid(): string {
    const hex = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) out += "-";
      else if (i === 14) out += "4";
      else if (i === 19) out += hex[(this.int(0, 15) & 0x3) | 0x8];
      else out += hex[this.int(0, 15)];
    }
    return out;
  }
}

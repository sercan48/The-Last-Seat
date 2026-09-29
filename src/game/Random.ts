// ============================================================
// Random.ts — Seeded PRNG for deterministic level generation
// ============================================================

export class SeededRandom {
  private state: number;
  public readonly seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? this.generateSeed();
    this.state = this.seed;
  }

  private generateSeed(): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0];
    }
    return Math.floor(Math.random() * 2147483647);
  }

  // Mulberry32 PRNG — fast, good distribution
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  weightedPick<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}

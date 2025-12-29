import type { Example } from "./types.js";

export class CandidatePool<I, O> {
  private rng: () => number;

  constructor(private trainset: Example<I, O>[], seed?: number) {
    this.rng = seed !== undefined ? this.seededRandom(seed) : Math.random;
  }

  generateFewShotCandidates(
    count: number,
    examplesPerCandidate: number
  ): Array<Example<I, O>[]> {
    const candidates: Array<Example<I, O>[]> = [];

    for (let i = 0; i < count; i++) {
      const shuffled = [...this.trainset].sort(() => this.rng() - 0.5);
      candidates.push(
        shuffled.slice(0, Math.min(examplesPerCandidate, shuffled.length))
      );
    }

    return candidates;
  }

  getValidationSet(splitRatio: number = 0.3): Example<I, O>[] {
    const count = Math.max(1, Math.floor(this.trainset.length * splitRatio));
    const shuffled = [...this.trainset].sort(() => this.rng() - 0.5);
    return shuffled.slice(0, count);
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }
}

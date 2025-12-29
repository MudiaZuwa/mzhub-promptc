import { describe, it, expect } from "vitest";
import { CandidatePool } from "../src/compiler/CandidatePool.js";

describe("CandidatePool", () => {
  const trainset = [
    { input: { text: "A" }, output: { name: "Alice" } },
    { input: { text: "B" }, output: { name: "Bob" } },
    { input: { text: "C" }, output: { name: "Charlie" } },
    { input: { text: "D" }, output: { name: "Diana" } },
    { input: { text: "E" }, output: { name: "Eve" } },
  ];

  it("should generate candidates with correct count", () => {
    const pool = new CandidatePool(trainset);
    const candidates = pool.generateFewShotCandidates(3, 2);

    expect(candidates.length).toBe(3);
    candidates.forEach((c) => expect(c.length).toBe(2));
  });

  it("should be deterministic with seed", () => {
    const pool1 = new CandidatePool(trainset, 42);
    const pool2 = new CandidatePool(trainset, 42);

    const candidates1 = pool1.generateFewShotCandidates(5, 3);
    const candidates2 = pool2.generateFewShotCandidates(5, 3);

    expect(candidates1).toEqual(candidates2);
  });

  it("should generate different candidates without seed", () => {
    const pool = new CandidatePool(trainset);
    const c1 = pool.generateFewShotCandidates(10, 2);
    const c2 = pool.generateFewShotCandidates(10, 2);

    const same = c1.every((_, i) => c1[i].every((ex, j) => ex === c2[i][j]));
    expect(same).toBe(false);
  });

  it("should get validation set with correct ratio", () => {
    const pool = new CandidatePool(trainset);
    const validationSet = pool.getValidationSet(0.4);

    expect(validationSet.length).toBe(2);
  });
});

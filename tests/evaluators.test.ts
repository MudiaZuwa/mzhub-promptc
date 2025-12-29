import { describe, it, expect } from "vitest";
import {
  exactMatch,
  partialMatch,
  arrayOverlap,
} from "../src/eval/exactMatch.js";

describe("exactMatch", () => {
  const evaluator = exactMatch<{ name: string }>();

  it("should return 1.0 for identical objects", () => {
    const score = evaluator({ name: "Alice" }, { name: "Alice" });
    expect(score).toBe(1.0);
  });

  it("should return 0.0 for different objects", () => {
    const score = evaluator({ name: "Alice" }, { name: "Bob" });
    expect(score).toBe(0.0);
  });

  it("should handle arrays", () => {
    const arrEval = exactMatch<string[]>();
    expect(arrEval(["a", "b"], ["a", "b"])).toBe(1.0);
    expect(arrEval(["a", "b"], ["a", "c"])).toBe(0.0);
  });
});

describe("partialMatch", () => {
  const evaluator = partialMatch<{ a: number; b: number; c: number }>();

  it("should return 1.0 when all fields match", () => {
    const score = evaluator({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 });
    expect(score).toBe(1.0);
  });

  it("should return fraction for partial matches", () => {
    const score = evaluator({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 4 });
    expect(score).toBeCloseTo(2 / 3);
  });

  it("should return 0.0 for no matches", () => {
    const score = evaluator({ a: 9, b: 9, c: 9 }, { a: 1, b: 2, c: 3 });
    expect(score).toBe(0.0);
  });
});

describe("arrayOverlap", () => {
  const evaluator = arrayOverlap<string>();

  it("should return 1.0 for identical arrays", () => {
    const score = evaluator(["a", "b", "c"], ["a", "b", "c"]);
    expect(score).toBe(1.0);
  });

  it("should return Jaccard similarity", () => {
    const score = evaluator(["a", "b"], ["b", "c"]);
    expect(score).toBeCloseTo(1 / 3);
  });

  it("should return 0.0 for no overlap", () => {
    const score = evaluator(["a", "b"], ["c", "d"]);
    expect(score).toBe(0.0);
  });

  it("should handle empty arrays", () => {
    expect(evaluator([], [])).toBe(1.0);
    expect(evaluator(["a"], [])).toBe(0.0);
  });
});

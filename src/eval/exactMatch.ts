import type { Evaluator } from "./types.js";

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

export function exactMatch<O>(): Evaluator<O> {
  return (prediction: O, groundTruth: O): number => {
    return deepEqual(prediction, groundTruth) ? 1.0 : 0.0;
  };
}

export function partialMatch<
  O extends Record<string, unknown>
>(): Evaluator<O> {
  return (prediction: O, groundTruth: O): number => {
    const keys = Object.keys(groundTruth);
    if (keys.length === 0) return 1.0;

    let matchCount = 0;
    for (const key of keys) {
      if (deepEqual(prediction[key], groundTruth[key])) {
        matchCount++;
      }
    }

    return matchCount / keys.length;
  };
}

export function arrayOverlap<T>(): Evaluator<T[]> {
  return (prediction: T[], groundTruth: T[]): number => {
    if (groundTruth.length === 0) return prediction.length === 0 ? 1.0 : 0.0;

    const predSet = new Set(prediction.map((x) => JSON.stringify(x)));
    const truthSet = new Set(groundTruth.map((x) => JSON.stringify(x)));

    let intersection = 0;
    for (const item of predSet) {
      if (truthSet.has(item)) intersection++;
    }

    const union = new Set([...predSet, ...truthSet]).size;
    return union > 0 ? intersection / union : 0;
  };
}

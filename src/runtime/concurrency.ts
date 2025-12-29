import pLimit from "p-limit";

export interface ConcurrencyManager {
  run<T>(fn: () => Promise<T>): Promise<T>;
  get pending(): number;
  get active(): number;
}

export function createConcurrencyManager(limit: number): ConcurrencyManager {
  const limiter = pLimit(limit);

  return {
    run: <T>(fn: () => Promise<T>) => limiter(fn),
    get pending() {
      return limiter.pendingCount;
    },
    get active() {
      return limiter.activeCount;
    },
  };
}

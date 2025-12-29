import { describe, it, expect } from "vitest";
import { withRetry } from "../src/runtime/retry.js";
import { PromptCache } from "../src/runtime/cache.js";
import { CostTracker } from "../src/runtime/costTracker.js";

describe("withRetry", () => {
  it("should succeed on first try", async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      return "success";
    });

    expect(result).toBe("success");
    expect(attempts).toBe(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("rate limit");
        }
        return "success";
      },
      { maxRetries: 3, initialDelayMs: 10 }
    );

    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should throw after max retries", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new Error("rate limit");
        },
        { maxRetries: 2, initialDelayMs: 10 }
      )
    ).rejects.toThrow("rate limit");

    expect(attempts).toBe(3);
  });
});

describe("PromptCache", () => {
  it("should cache and retrieve values", () => {
    const cache = new PromptCache<string>();
    cache.set("prompt1", { key: "value" }, "result1");

    expect(cache.get("prompt1", { key: "value" })).toBe("result1");
    expect(cache.get("prompt1", { key: "other" })).toBeUndefined();
  });

  it("should respect maxSize", () => {
    const cache = new PromptCache<string>({ maxSize: 2 });
    cache.set("p1", {}, "r1");
    cache.set("p2", {}, "r2");
    cache.set("p3", {}, "r3");

    expect(cache.size).toBe(2);
  });

  it("should check has correctly", () => {
    const cache = new PromptCache<number>();
    cache.set("p", {}, 42);

    expect(cache.has("p", {})).toBe(true);
    expect(cache.has("other", {})).toBe(false);
  });
});

describe("CostTracker", () => {
  it("should track token usage", () => {
    const tracker = new CostTracker();
    tracker.record({ inputTokens: 100, outputTokens: 50 });
    tracker.record({ inputTokens: 200, outputTokens: 100 });

    const total = tracker.total;
    expect(total.inputTokens).toBe(300);
    expect(total.outputTokens).toBe(150);
    expect(total.totalTokens).toBe(450);
    expect(total.calls).toBe(2);
  });

  it("should check budget", () => {
    const tracker = new CostTracker();
    tracker.record({ inputTokens: 400, outputTokens: 100 });

    expect(tracker.exceedsBudget(1000)).toBe(false);
    expect(tracker.exceedsBudget(400)).toBe(true);
  });

  it("should reset", () => {
    const tracker = new CostTracker();
    tracker.record({ inputTokens: 100, outputTokens: 50 });
    tracker.reset();

    expect(tracker.total.totalTokens).toBe(0);
  });
});

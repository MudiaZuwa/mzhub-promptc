export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryOn?: (error: Error) => boolean;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryOn: (error: Error) => {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("503") ||
      message.includes("timeout")
    );
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxRetries || !opts.retryOn(lastError)) {
        throw lastError;
      }

      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

export function createRetryWrapper(
  options: RetryOptions = {}
): <T>(fn: () => Promise<T>) => Promise<T> {
  return <T>(fn: () => Promise<T>) => withRetry(fn, options);
}

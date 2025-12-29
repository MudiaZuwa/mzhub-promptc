export interface CacheOptions {
  maxSize?: number;
  ttlMs?: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class PromptCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttlMs: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttlMs = options.ttlMs ?? 0;
  }

  private makeKey(prompt: string, input: unknown): string {
    return `${prompt}::${JSON.stringify(input)}`;
  }

  get(prompt: string, input: unknown): T | undefined {
    const key = this.makeKey(prompt, input);
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    if (this.ttlMs > 0 && Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(prompt: string, input: unknown, value: T): void {
    const key = this.makeKey(prompt, input);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  has(prompt: string, input: unknown): boolean {
    return this.get(prompt, input) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export function createCache<T>(options: CacheOptions = {}): PromptCache<T> {
  return new PromptCache<T>(options);
}

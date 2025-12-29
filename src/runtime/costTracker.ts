export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCalls: number;
}

export class CostTracker {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private callCount = 0;

  record(usage: TokenUsage): void {
    this.totalInputTokens += usage.inputTokens;
    this.totalOutputTokens += usage.outputTokens;
    this.callCount++;
  }

  get total(): TokenUsage & { totalTokens: number; calls: number } {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
      calls: this.callCount,
    };
  }

  exceedsBudget(maxTokens: number): boolean {
    return this.totalInputTokens + this.totalOutputTokens > maxTokens;
  }

  reset(): void {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.callCount = 0;
  }
}

export function estimateCost(
  candidateCount: number,
  testCaseCount: number,
  avgTokensPerCall: number = 500
): CostEstimate {
  const estimatedCalls = candidateCount * testCaseCount;
  const totalTokens = estimatedCalls * avgTokensPerCall;

  return {
    inputTokens: Math.round(totalTokens * 0.7),
    outputTokens: Math.round(totalTokens * 0.3),
    totalTokens,
    estimatedCalls,
  };
}

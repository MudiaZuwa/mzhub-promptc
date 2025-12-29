export type Evaluator<O> = (
  prediction: O,
  groundTruth: O
) => number | Promise<number>;

export interface Example<I, O> {
  input: I;
  output: O;
}

export interface CompilationResult<I, O> {
  meta: {
    score: number;
    compiledAt: string;
    strategy: string;
    tokenUsage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      calls: number;
    };
  };
  config: {
    instructions: string;
    fewShotExamples: Array<Example<I, O>>;
  };
}

export interface CompileOptions {
  candidates?: number;
  concurrency?: number;
  examplesPerCandidate?: number;
  validationSplit?: number;
  seed?: number;
  earlyStopThreshold?: number;
  budget?: {
    maxTokens?: number;
    onBudgetWarning?: (used: number, max: number) => void;
  };
  onProgress?: (progress: {
    candidatesEvaluated: number;
    totalCandidates: number;
    currentBestScore: number;
    tokensUsed: number;
  }) => void;
}

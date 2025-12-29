import { ZodRawShape } from "zod";
import { Program } from "../program/Program.js";
import { createConcurrencyManager } from "../runtime/concurrency.js";
import { CostTracker } from "../runtime/costTracker.js";
import { CandidatePool } from "./CandidatePool.js";
import type {
  Evaluator,
  Example,
  CompilationResult,
  CompileOptions,
} from "./types.js";

export class BootstrapFewShot<O> {
  constructor(private evaluator: Evaluator<O>) {}

  async compile<I extends ZodRawShape, OShape extends ZodRawShape>(
    program: Program<I, OShape>,
    trainset: Example<unknown, O>[],
    options: CompileOptions = {}
  ): Promise<CompilationResult<unknown, O>> {
    const {
      candidates: candidateCount = 10,
      concurrency = 5,
      examplesPerCandidate = 3,
      validationSplit = 0.3,
      seed,
      earlyStopThreshold = 0,
      budget,
      onProgress,
    } = options;

    const pool = new CandidatePool(trainset, seed);
    const candidates = pool.generateFewShotCandidates(
      candidateCount,
      examplesPerCandidate
    );
    const validationSet = pool.getValidationSet(validationSplit);
    const limiter = createConcurrencyManager(concurrency);
    const costTracker = new CostTracker();

    const results: Array<{ score: number; examples: Example<unknown, O>[] }> =
      [];

    const evaluationPromises = candidates.map((fewShotSet) =>
      limiter.run(async () => {
        if (budget?.maxTokens && costTracker.exceedsBudget(budget.maxTokens)) {
          budget.onBudgetWarning?.(
            costTracker.total.totalTokens,
            budget.maxTokens
          );
          return { score: -1, examples: fewShotSet };
        }

        let totalScore = 0;
        let validCount = 0;

        for (const testCase of validationSet) {
          try {
            const prediction = await program.run(testCase.input as any, {
              fewShotExamples: fewShotSet.map((ex) => ({
                input: ex.input as Record<string, unknown>,
                output: ex.output as Record<string, unknown>,
              })),
            });

            costTracker.record(prediction.trace.usage);
            const score = await this.evaluator(
              prediction.result as O,
              testCase.output
            );
            totalScore += score;
            validCount++;

            if (earlyStopThreshold > 0 && validCount >= 2) {
              const avgSoFar = totalScore / validCount;
              if (avgSoFar < earlyStopThreshold) {
                break;
              }
            }
          } catch {
            continue;
          }
        }

        return {
          score: validCount > 0 ? totalScore / validCount : 0,
          examples: fewShotSet,
        };
      })
    );

    const candidateResults = await Promise.all(evaluationPromises);

    let currentBestScore = -1;
    for (const result of candidateResults) {
      if (result.score >= 0) {
        results.push(result);
        if (result.score > currentBestScore) {
          currentBestScore = result.score;
        }
        onProgress?.({
          candidatesEvaluated: results.length,
          totalCandidates: candidateCount,
          currentBestScore,
          tokensUsed: costTracker.total.totalTokens,
        });
      }
    }

    const winner = results.reduce(
      (best, current) => (current.score > best.score ? current : best),
      { score: -1, examples: [] as Example<unknown, O>[] }
    );

    return {
      meta: {
        score: winner.score,
        compiledAt: new Date().toISOString(),
        strategy: "BootstrapFewShot",
        tokenUsage: costTracker.total,
      },
      config: {
        instructions: program["schema"].description,
        fewShotExamples: winner.examples,
      },
    };
  }

  estimateCost(
    trainsetSize: number,
    options: CompileOptions = {}
  ): {
    estimatedCalls: number;
    estimatedTokens: number;
  } {
    const { candidates = 10, validationSplit = 0.3 } = options;
    const validationSize = Math.max(
      1,
      Math.floor(trainsetSize * validationSplit)
    );
    const estimatedCalls = candidates * validationSize;
    const avgTokensPerCall = 500;

    return {
      estimatedCalls,
      estimatedTokens: estimatedCalls * avgTokensPerCall,
    };
  }
}

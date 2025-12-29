import { ZodRawShape } from "zod";
import { Program } from "../program/Program.js";
import { createConcurrencyManager } from "../runtime/concurrency.js";
import { CostTracker } from "../runtime/costTracker.js";
import { CandidatePool } from "./CandidatePool.js";
import type { LLMProvider } from "../providers/types.js";
import type {
  Evaluator,
  Example,
  CompilationResult,
  CompileOptions,
} from "./types.js";

export interface InstructionRewriteOptions extends CompileOptions {
  instructionVariations?: number;
  provider: LLMProvider;
}

export class InstructionRewrite<O> {
  constructor(private evaluator: Evaluator<O>) {}

  async compile<I extends ZodRawShape, OShape extends ZodRawShape>(
    program: Program<I, OShape>,
    trainset: Example<unknown, O>[],
    options: InstructionRewriteOptions
  ): Promise<CompilationResult<unknown, O>> {
    const {
      candidates: candidateCount = 5,
      instructionVariations = 5,
      concurrency = 5,
      examplesPerCandidate = 3,
      validationSplit = 0.3,
      seed,
      budget,
      provider,
    } = options;

    const baseDescription = program["schema"].description;
    const pool = new CandidatePool(trainset, seed);
    const validationSet = pool.getValidationSet(validationSplit);
    const limiter = createConcurrencyManager(concurrency);
    const costTracker = new CostTracker();

    const instructionVariants = await this.generateInstructionVariants(
      provider,
      baseDescription,
      instructionVariations
    );

    const fewShotCandidates = pool.generateFewShotCandidates(
      candidateCount,
      examplesPerCandidate
    );

    const allCandidates: Array<{
      instructions: string;
      examples: Example<unknown, O>[];
    }> = [];
    for (const instruction of instructionVariants) {
      for (const examples of fewShotCandidates) {
        allCandidates.push({ instructions: instruction, examples });
      }
    }

    const results: Array<{
      score: number;
      instructions: string;
      examples: Example<unknown, O>[];
    }> = [];

    const evaluationPromises = allCandidates.map((candidate) =>
      limiter.run(async () => {
        if (budget?.maxTokens && costTracker.exceedsBudget(budget.maxTokens)) {
          budget.onBudgetWarning?.(
            costTracker.total.totalTokens,
            budget.maxTokens
          );
          return { score: -1, ...candidate };
        }

        let totalScore = 0;
        let validCount = 0;

        for (const testCase of validationSet) {
          try {
            const prediction = await program.run(testCase.input as any, {
              instructions: candidate.instructions,
              fewShotExamples: candidate.examples.map((ex) => ({
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
          } catch {
            continue;
          }
        }

        return {
          score: validCount > 0 ? totalScore / validCount : 0,
          ...candidate,
        };
      })
    );

    const candidateResults = await Promise.all(evaluationPromises);
    results.push(...candidateResults.filter((r) => r.score >= 0));

    const winner = results.reduce(
      (best, current) => (current.score > best.score ? current : best),
      {
        score: -1,
        instructions: baseDescription,
        examples: [] as Example<unknown, O>[],
      }
    );

    return {
      meta: {
        score: winner.score,
        compiledAt: new Date().toISOString(),
        strategy: "InstructionRewrite",
        tokenUsage: costTracker.total,
      },
      config: {
        instructions: winner.instructions,
        fewShotExamples: winner.examples,
      },
    };
  }

  private async generateInstructionVariants(
    provider: LLMProvider,
    baseInstruction: string,
    count: number
  ): Promise<string[]> {
    const prompt = `You are an expert prompt engineer. Given a base instruction for an LLM task, generate ${count} different variations that might perform better.

Base instruction: "${baseInstruction}"

Requirements:
- Each variation should convey the same task but with different wording, tone, or structure
- Try variations like: more specific, more concise, role-based ("You are an expert..."), step-by-step, formal, casual
- Output as a JSON array of strings

Respond with ONLY a JSON array, no additional text:
["variation 1", "variation 2", ...]`;

    const response = await provider.complete({
      prompt,
      temperature: 0.8,
      maxTokens: 1024,
      responseFormat: "json",
    });

    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [baseInstruction];
      }
      const variations = JSON.parse(jsonMatch[0]) as string[];
      return [baseInstruction, ...variations.slice(0, count)];
    } catch {
      return [baseInstruction];
    }
  }

  estimateCost(
    trainsetSize: number,
    options: Partial<InstructionRewriteOptions> = {}
  ): {
    estimatedCalls: number;
    estimatedTokens: number;
  } {
    const {
      candidates = 5,
      instructionVariations = 5,
      validationSplit = 0.3,
    } = options;
    const validationSize = Math.max(
      1,
      Math.floor(trainsetSize * validationSplit)
    );
    const totalCandidates = candidates * instructionVariations;
    const estimatedCalls = totalCandidates * validationSize + 1;
    const avgTokensPerCall = 500;

    return {
      estimatedCalls,
      estimatedTokens: estimatedCalls * avgTokensPerCall,
    };
  }
}

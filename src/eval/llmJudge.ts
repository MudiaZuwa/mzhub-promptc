import type { LLMProvider } from "../providers/types.js";
import type { Evaluator } from "./types.js";

export interface LLMJudgeConfig {
  provider: LLMProvider;
  criteria?: string;
  model?: string;
}

export function llmJudge<O>(config: LLMJudgeConfig): Evaluator<O> {
  const { provider, criteria = "accuracy and completeness", model } = config;

  return async (prediction: O, groundTruth: O): Promise<number> => {
    const prompt = `You are evaluating the quality of an AI response.

EXPECTED OUTPUT:
${JSON.stringify(groundTruth, null, 2)}

ACTUAL OUTPUT:
${JSON.stringify(prediction, null, 2)}

EVALUATION CRITERIA: ${criteria}

Rate the actual output on a scale from 0.0 to 1.0, where:
- 1.0 = Perfect match or equivalent
- 0.5 = Partially correct
- 0.0 = Completely wrong

Respond with ONLY a number between 0.0 and 1.0, nothing else.`;

    const response = await provider.complete({
      prompt,
      model,
      temperature: 0,
      maxTokens: 10,
    });

    const score = parseFloat(response.content.trim());
    if (isNaN(score) || score < 0 || score > 1) {
      return 0;
    }

    return score;
  };
}

import { z, ZodRawShape, ZodObject } from "zod";
import { Program, ProgramConfig, ProgramOutput } from "./Program.js";

export class ChainOfThought<
  I extends ZodRawShape,
  O extends ZodRawShape
> extends Program<I, O> {
  async run(
    input: z.infer<ZodObject<I>>,
    config: ProgramConfig = {}
  ): Promise<ProgramOutput<z.infer<ZodObject<O>>>> {
    const startTime = Date.now();
    const validatedInput = this.schema.validateInput(input);

    const instructions = config.instructions || this.schema.description;
    const fewShotSection = this.buildFewShotString(config.fewShotExamples);
    const outputKeys = this.schema.getOutputKeys();
    const outputFormat = outputKeys
      .map((k) => `"${k}": <value>`)
      .join(",\n    ");

    const prompt = `${instructions}

${
  fewShotSection ? `Here are some examples:\n\n${fewShotSection}\n\n` : ""
}Think through this step-by-step before providing your answer.

Input: ${JSON.stringify(validatedInput)}

Respond with valid JSON in this exact format:
{
  "reasoning": "Your step-by-step thinking process...",
  ${outputFormat}
}

Respond ONLY with valid JSON, no additional text.`;

    const response = await this.provider.complete({
      prompt,
      responseFormat: "json",
    });

    const parsed = this.parseJsonResponse(response.content);
    const reasoning = parsed.reasoning as string | undefined;
    delete parsed.reasoning;

    const result = this.schema.validateOutput(parsed);

    return {
      result,
      trace: {
        promptUsed: prompt,
        reasoning,
        usage: response.usage,
        latencyMs: Date.now() - startTime,
      },
    };
  }
}

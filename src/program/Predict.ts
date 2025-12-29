import { z, ZodRawShape, ZodObject } from "zod";
import { Program, ProgramConfig, ProgramOutput } from "./Program.js";

export class Predict<
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
    const outputFormat = this.buildOutputFormat();

    const prompt = `${instructions}

${
  fewShotSection ? `Here are some examples:\n\n${fewShotSection}\n\n` : ""
}Now process this input and respond with valid JSON matching this format:
${outputFormat}

Input: ${JSON.stringify(validatedInput)}

Respond ONLY with valid JSON, no additional text.`;

    const response = await this.provider.complete({
      prompt,
      responseFormat: "json",
    });

    const parsed = this.parseJsonResponse(response.content);
    const result = this.schema.validateOutput(parsed);

    return {
      result,
      trace: {
        promptUsed: prompt,
        usage: response.usage,
        latencyMs: Date.now() - startTime,
      },
    };
  }
}

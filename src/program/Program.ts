import { z, ZodRawShape, ZodObject } from "zod";
import { Schema } from "../schema/defineSchema.js";
import type { LLMProvider } from "../providers/types.js";

export interface ProgramConfig {
  instructions?: string;
  fewShotExamples?: Array<{
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  }>;
}

export interface ProgramTrace {
  promptUsed: string;
  reasoning?: string;
  usage: { inputTokens: number; outputTokens: number };
  latencyMs: number;
}

export interface ProgramOutput<O> {
  result: O;
  trace: ProgramTrace;
}

export abstract class Program<I extends ZodRawShape, O extends ZodRawShape> {
  constructor(
    protected schema: Schema<I, O>,
    protected provider: LLMProvider
  ) {}

  abstract run(
    input: z.infer<ZodObject<I>>,
    config?: ProgramConfig
  ): Promise<ProgramOutput<z.infer<ZodObject<O>>>>;

  protected buildFewShotString(
    examples: ProgramConfig["fewShotExamples"]
  ): string {
    if (!examples || examples.length === 0) return "";

    return examples
      .map(
        (ex, i) =>
          `Example ${i + 1}:\nInput: ${JSON.stringify(
            ex.input
          )}\nOutput: ${JSON.stringify(ex.output)}`
      )
      .join("\n\n");
  }

  protected buildOutputFormat(): string {
    const keys = this.schema.getOutputKeys();
    const format = keys.map((k) => `"${k}": <value>`).join(",\n  ");
    return `{\n  ${format}\n}`;
  }

  protected parseJsonResponse(content: string): Record<string, unknown> {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]);
  }
}

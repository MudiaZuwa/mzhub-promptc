import { ZodRawShape, ZodObject } from "zod";
import type { ProgramConfig, ProgramOutput } from "../program/Program.js";
import type { Example } from "./types.js";

export interface CompiledProgramMeta {
  score: number;
  compiledAt: string;
  strategy: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    calls: number;
  };
}

export interface CompiledProgram<I, O> {
  run(input: I, overrides?: Partial<ProgramConfig>): Promise<ProgramOutput<O>>;
  meta: CompiledProgramMeta;
  config: {
    instructions: string;
    fewShotExamples: Array<Example<unknown, unknown>>;
  };
  toJSON(): string;
}

export function createCompiledProgram<
  I extends ZodRawShape,
  O extends ZodRawShape,
  InputType = unknown,
  OutputType = unknown
>(
  originalProgram: {
    run(
      input: InputType,
      config?: ProgramConfig
    ): Promise<ProgramOutput<OutputType>>;
  },
  compilationResult: {
    meta: CompiledProgramMeta;
    config: {
      instructions: string;
      fewShotExamples: Array<Example<unknown, unknown>>;
    };
  }
): CompiledProgram<InputType, OutputType> {
  return {
    async run(
      input: InputType,
      overrides?: Partial<ProgramConfig>
    ): Promise<ProgramOutput<OutputType>> {
      return originalProgram.run(input, {
        instructions:
          overrides?.instructions ?? compilationResult.config.instructions,
        fewShotExamples:
          overrides?.fewShotExamples ??
          compilationResult.config.fewShotExamples.map((ex) => ({
            input: ex.input as Record<string, unknown>,
            output: ex.output as Record<string, unknown>,
          })),
      });
    },
    meta: compilationResult.meta,
    config: compilationResult.config,
    toJSON(): string {
      return JSON.stringify(
        {
          meta: compilationResult.meta,
          config: compilationResult.config,
        },
        null,
        2
      );
    },
  };
}

export interface SerializedCompiledProgram {
  meta: CompiledProgramMeta;
  config: {
    instructions: string;
    fewShotExamples: Array<Example<unknown, unknown>>;
  };
}

export function loadCompiledProgram<InputType = unknown, OutputType = unknown>(
  jsonOrPath: string | SerializedCompiledProgram,
  program: {
    run(
      input: InputType,
      config?: ProgramConfig
    ): Promise<ProgramOutput<OutputType>>;
  }
): CompiledProgram<InputType, OutputType> {
  let data: SerializedCompiledProgram;

  if (typeof jsonOrPath === "string") {
    try {
      data = JSON.parse(jsonOrPath);
    } catch {
      throw new Error("Invalid JSON string provided to loadCompiledProgram");
    }
  } else {
    data = jsonOrPath;
  }

  if (!data.meta || !data.config) {
    throw new Error("Invalid compiled program format: missing meta or config");
  }

  return createCompiledProgram(program, data);
}

import { z, ZodObject, ZodRawShape } from "zod";

export interface SchemaDefinition<
  I extends ZodRawShape,
  O extends ZodRawShape
> {
  description: string;
  inputs: I;
  outputs: O;
}

export class Schema<I extends ZodRawShape, O extends ZodRawShape> {
  public readonly inputSchema: ZodObject<I>;
  public readonly outputSchema: ZodObject<O>;
  public readonly description: string;

  constructor(definition: SchemaDefinition<I, O>) {
    this.description = definition.description;
    this.inputSchema = z.object(definition.inputs);
    this.outputSchema = z.object(definition.outputs);
  }

  validateInput(input: unknown): z.infer<ZodObject<I>> {
    return this.inputSchema.parse(input);
  }

  validateOutput(output: unknown): z.infer<ZodObject<O>> {
    return this.outputSchema.parse(output);
  }

  getInputKeys(): string[] {
    return Object.keys(this.inputSchema.shape);
  }

  getOutputKeys(): string[] {
    return Object.keys(this.outputSchema.shape);
  }
}

export function defineSchema<I extends ZodRawShape, O extends ZodRawShape>(
  definition: SchemaDefinition<I, O>
): Schema<I, O> {
  return new Schema(definition);
}

import { describe, it, expect } from "vitest";
import { defineSchema } from "../src/schema/defineSchema.js";
import { z } from "zod";

describe("defineSchema", () => {
  it("should create a schema with description, inputs, and outputs", () => {
    const schema = defineSchema({
      description: "Extract names from text",
      inputs: { text: z.string() },
      outputs: { names: z.array(z.string()) },
    });

    expect(schema.description).toBe("Extract names from text");
    expect(schema.getInputKeys()).toEqual(["text"]);
    expect(schema.getOutputKeys()).toEqual(["names"]);
  });

  it("should validate correct input", () => {
    const schema = defineSchema({
      description: "Test",
      inputs: { text: z.string() },
      outputs: { result: z.number() },
    });

    const result = schema.validateInput({ text: "hello" });
    expect(result.text).toBe("hello");
  });

  it("should throw on invalid input", () => {
    const schema = defineSchema({
      description: "Test",
      inputs: { text: z.string() },
      outputs: { result: z.number() },
    });

    expect(() => schema.validateInput({ text: 123 })).toThrow();
  });

  it("should validate correct output", () => {
    const schema = defineSchema({
      description: "Test",
      inputs: { text: z.string() },
      outputs: { names: z.array(z.string()) },
    });

    const result = schema.validateOutput({ names: ["Alice", "Bob"] });
    expect(result.names).toEqual(["Alice", "Bob"]);
  });

  it("should throw on invalid output", () => {
    const schema = defineSchema({
      description: "Test",
      inputs: { text: z.string() },
      outputs: { names: z.array(z.string()) },
    });

    expect(() => schema.validateOutput({ names: "not an array" })).toThrow();
  });
});

/**
 * Load Compiled Program Example
 *
 * Shows how to load a previously compiled program from JSON
 */

import { readFileSync } from "fs";
import {
  defineSchema,
  ChainOfThought,
  loadCompiledProgram,
  createProvider,
  z,
} from "@mzhub/promptc";

// Must match the schema used during compilation
const NameExtractor = defineSchema({
  description: "Extract proper names of people from text",
  inputs: { text: z.string() },
  outputs: { names: z.array(z.string()) },
});

async function main() {
  // 1. Load the saved config
  const savedJson = readFileSync("name-extractor.json", "utf-8");

  // 2. Create the same program (schema + provider)
  const provider = createProvider("openai", {
    apiKey: process.env.OPENAI_API_KEY,
  });
  const program = new ChainOfThought(NameExtractor, provider);

  // 3. Load the compiled program
  const compiled = loadCompiledProgram(savedJson, program);

  console.log("Loaded compiled program:");
  console.log(`  Strategy: ${compiled.meta.strategy}`);
  console.log(`  Score: ${(compiled.meta.score * 100).toFixed(1)}%`);
  console.log(`  Examples: ${compiled.config.fewShotExamples.length}`);

  // 4. Use it in production
  const testCases = [
    "Warren Buffett is a legendary investor.",
    "The meeting with Sarah and John went well.",
    "No specific people were mentioned.",
  ];

  console.log("\nRunning inference:");
  for (const text of testCases) {
    const result = await compiled.run({ text });
    console.log(`\n  Input: "${text}"`);
    console.log(
      `  Names: ${
        result.result.names.length > 0
          ? result.result.names.join(", ")
          : "(none)"
      }`
    );
  }
}

main().catch(console.error);

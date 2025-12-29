/**
 * Name Extractor Example
 *
 * This example shows how to:
 * 1. Define a schema
 * 2. Create a program
 * 3. Compile with BootstrapFewShot
 * 4. Save and use the compiled program
 */

import { writeFileSync } from "fs";
import {
  defineSchema,
  ChainOfThought,
  BootstrapFewShot,
  exactMatch,
  createProvider,
  createCompiledProgram,
  z,
} from "@mzhub/promptc";

// 1. Define the schema
const NameExtractor = defineSchema({
  description: "Extract proper names of people from text",
  inputs: { text: z.string() },
  outputs: { names: z.array(z.string()) },
});

// 2. Create a provider (uses OPENAI_API_KEY env var)
const provider = createProvider("openai", {
  apiKey: process.env.OPENAI_API_KEY,
});

// 3. Create the program
const program = new ChainOfThought(NameExtractor, provider);

// 4. Training data
const trainset = [
  {
    input: { text: "Bill Gates founded Microsoft with Paul Allen." },
    output: { names: ["Bill Gates", "Paul Allen"] },
  },
  {
    input: { text: "Elon Musk runs Tesla and SpaceX." },
    output: { names: ["Elon Musk"] },
  },
  {
    input: { text: "Jeff Bezos started Amazon in his garage." },
    output: { names: ["Jeff Bezos"] },
  },
  {
    input: { text: "Satya Nadella is the CEO of Microsoft." },
    output: { names: ["Satya Nadella"] },
  },
  {
    input: { text: "Tim Cook leads Apple after Steve Jobs." },
    output: { names: ["Tim Cook", "Steve Jobs"] },
  },
  {
    input: { text: "Mark Zuckerberg created Facebook." },
    output: { names: ["Mark Zuckerberg"] },
  },
  {
    input: { text: "Sundar Pichai runs Google and Alphabet." },
    output: { names: ["Sundar Pichai"] },
  },
];

async function main() {
  console.log("Starting compilation...\n");

  // 5. Create compiler with evaluator
  const compiler = new BootstrapFewShot(exactMatch<{ names: string[] }>());

  // 6. Compile with progress tracking
  const result = await compiler.compile(program, trainset, {
    candidates: 10,
    concurrency: 3,
    onProgress: ({
      candidatesEvaluated,
      totalCandidates,
      currentBestScore,
    }) => {
      console.log(
        `Progress: ${candidatesEvaluated}/${totalCandidates} | Best: ${(
          currentBestScore * 100
        ).toFixed(1)}%`
      );
    },
  });

  console.log("\nCompilation complete!");
  console.log(`Best score: ${(result.meta.score * 100).toFixed(1)}%`);
  console.log(`Tokens used: ${result.meta.tokenUsage.totalTokens}`);
  console.log(`API calls: ${result.meta.tokenUsage.calls}`);

  // 7. Save the compiled config
  writeFileSync("name-extractor.json", JSON.stringify(result, null, 2));
  console.log("\nSaved to name-extractor.json");

  // 8. Create a production-ready compiled program
  const compiled = createCompiledProgram(program, result);

  // 9. Test it
  console.log("\nTesting compiled program:");
  const testResult = await compiled.run({
    text: "Jensen Huang founded NVIDIA.",
  });
  console.log("Input: 'Jensen Huang founded NVIDIA.'");
  console.log("Output:", testResult.result.names);
}

main().catch(console.error);

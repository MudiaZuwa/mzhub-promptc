#!/usr/bin/env node

import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    config: { type: "string", short: "c" },
    output: { type: "string", short: "o", default: "compiled-prompt.json" },
    candidates: { type: "string", default: "10" },
    concurrency: { type: "string", default: "5" },
    provider: { type: "string", short: "p", default: "openai" },
    model: { type: "string", short: "m" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: true,
});

function printHelp() {
  console.log(`
promptc - Type-safe LLM program compiler

Usage:
  promptc compile <trainset.json> [options]
  promptc validate <compiled.json>

Commands:
  compile     Compile a program using a training set
  validate    Validate a compiled prompt JSON file

Options:
  -c, --config <file>      Path to config file
  -o, --output <file>      Output file (default: compiled-prompt.json)
  -p, --provider <name>    LLM provider: openai, anthropic, google, groq, cerebras, ollama
  -m, --model <name>       Model to use (overrides provider default)
  --candidates <n>         Number of candidates to try (default: 10)
  --concurrency <n>        Parallel evaluations (default: 5)
  -h, --help               Show this help

Examples:
  promptc compile trainset.json -p openai -o prompt.json
  promptc validate prompt.json
`);
}

async function validateCommand(filePath: string) {
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (!data.meta || !data.config) {
      console.error("Invalid format: missing 'meta' or 'config' fields");
      process.exit(1);
    }

    console.log("✓ Valid compiled prompt file");
    console.log(`  Score: ${data.meta.score}`);
    console.log(`  Strategy: ${data.meta.strategy}`);
    console.log(`  Compiled: ${data.meta.compiledAt}`);
    console.log(`  Examples: ${data.config.fewShotExamples?.length || 0}`);
    console.log(`  Tokens used: ${data.meta.tokenUsage?.totalTokens || "N/A"}`);
  } catch (error) {
    console.error("Invalid JSON file");
    process.exit(1);
  }
}

async function main() {
  if (values.help || positionals.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = positionals[0];

  switch (command) {
    case "validate":
      if (!positionals[1]) {
        console.error("Error: Please provide a file to validate");
        process.exit(1);
      }
      await validateCommand(resolve(positionals[1]));
      break;

    case "compile":
      console.log(`
Note: The 'compile' command requires a custom config file that defines:
- Your schema (using defineSchema)
- Your program (Predict or ChainOfThought)
- Your evaluator

Example config file (promptc.config.ts):

  import { defineSchema, ChainOfThought, createProvider, exactMatch, z } from '@mzhub/promptc';
  
  export const schema = defineSchema({...});
  export const provider = createProvider('openai', { apiKey: process.env.OPENAI_API_KEY });
  export const program = new ChainOfThought(schema, provider);
  export const evaluator = exactMatch();

Run with: promptc compile trainset.json -c promptc.config.ts
`);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});

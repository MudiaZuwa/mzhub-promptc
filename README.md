# promptc

Type-safe LLM program compiler for JavaScript/TypeScript.

**promptc** brings DSPy-style prompt compilation to the JavaScript ecosystem. Define schemas, write programs, and let the compiler optimize your prompts automatically using evaluation data.

## Installation

```bash
npm install @mzhub/promptc
```

Install your preferred LLM provider (optional peer dependencies):

```bash
# Pick one or more
npm install openai                      # OpenAI
npm install @anthropic-ai/sdk           # Anthropic (Claude)
npm install @google/generative-ai       # Google (Gemini)
npm install groq-sdk                    # Groq (fast inference)
npm install @cerebras/cerebras_cloud_sdk # Cerebras (fast inference)
npm install ollama                      # Ollama (local)
```

## Quick Start

```typescript
import {
  defineSchema,
  ChainOfThought,
  BootstrapFewShot,
  exactMatch,
  createProvider,
  z,
} from "@mzhub/promptc";

// 1. Define your schema
const NameExtractor = defineSchema({
  description: "Extract proper names from text",
  inputs: { text: z.string() },
  outputs: { names: z.array(z.string()) },
});

// 2. Create a provider
const provider = createProvider("openai", {
  apiKey: process.env.OPENAI_API_KEY,
});

// 3. Create a program
const pipeline = new ChainOfThought(NameExtractor, provider);

// 4. Prepare training data
const trainset = [
  {
    input: { text: "Bill Gates founded Microsoft." },
    output: { names: ["Bill Gates"] },
  },
  {
    input: { text: "Elon runs Tesla and SpaceX." },
    output: { names: ["Elon"] },
  },
  {
    input: { text: "Jeff Bezos started Amazon." },
    output: { names: ["Jeff Bezos"] },
  },
  {
    input: { text: "Satya Nadella is the CEO." },
    output: { names: ["Satya Nadella"] },
  },
  { input: { text: "Tim Cook leads Apple." }, output: { names: ["Tim Cook"] } },
];

// 5. Compile (finds optimal few-shot examples)
const compiler = new BootstrapFewShot(exactMatch());
const compiled = await compiler.compile(pipeline, trainset, {
  candidates: 10,
  concurrency: 5,
});

console.log("Best score:", compiled.meta.score);
console.log("Token usage:", compiled.meta.tokenUsage);

// 6. Save compiled config
import fs from "fs";
fs.writeFileSync("prompt.json", JSON.stringify(compiled, null, 2));
```

## Core Concepts

### Schema

Type-safe input/output contracts using Zod:

```typescript
const QASchema = defineSchema({
  description: "Answer questions based on context",
  inputs: {
    question: z.string(),
    context: z.string(),
  },
  outputs: {
    answer: z.string(),
    confidence: z.number().min(0).max(1),
  },
});
```

### Programs

Execution strategies for LLM calls:

- **Predict** - Simple input → output
- **ChainOfThought** - Forces step-by-step reasoning before answering

```typescript
const simple = new Predict(schema, provider);
const reasoning = new ChainOfThought(schema, provider);
```

### Providers

Swap LLM backends with a single line:

```typescript
createProvider("openai", { apiKey: "..." });
createProvider("anthropic", { apiKey: "..." });
createProvider("google", { apiKey: "..." });
createProvider("groq", { apiKey: "..." });
createProvider("cerebras", { apiKey: "..." });
createProvider("ollama");
```

### Evaluators

Score predictions against ground truth:

```typescript
exactMatch(); // 1.0 if equal, 0.0 otherwise
partialMatch(); // Fraction of matching fields
arrayOverlap(); // Jaccard similarity for arrays
llmJudge({ provider }); // Use LLM to score
```

### Compilers

#### BootstrapFewShot

Finds optimal few-shot examples:

```typescript
const compiler = new BootstrapFewShot(exactMatch());
const result = await compiler.compile(program, trainset, {
  candidates: 20,
  concurrency: 5,
  earlyStopThreshold: 0.3, // Skip bad candidates early
});
```

#### InstructionRewrite

Uses LLM to generate and test instruction variations:

```typescript
const compiler = new InstructionRewrite(exactMatch());
const result = await compiler.compile(program, trainset, {
  provider,
  instructionVariations: 5,
  candidates: 5,
});
```

### CompiledProgram

Get a production-ready program with `.run()`:

````typescript
import { createCompiledProgram } from "@mzhub/promptc";

const compiled = createCompiledProgram(pipeline, result);

// Use in production
const output = await compiled.run({ text: "Some input" });

// Serialize to JSON
fs.writeFileSync("prompt.json", compiled.toJSON());

## Cost Management

```typescript
// Estimate before running
const estimate = compiler.estimateCost(trainset.length, { candidates: 20 });
console.log("Estimated calls:", estimate.estimatedCalls);
console.log("Estimated tokens:", estimate.estimatedTokens);

// Track during compilation
compiled.meta.tokenUsage.totalTokens;
compiled.meta.tokenUsage.calls;
````

## Compiled Output

The compiler returns a serializable artifact:

```json
{
  "meta": {
    "score": 0.87,
    "compiledAt": "2024-12-29T12:00:00.000Z",
    "strategy": "BootstrapFewShot",
    "tokenUsage": {
      "inputTokens": 45000,
      "outputTokens": 12000,
      "totalTokens": 57000,
      "calls": 150
    }
  },
  "config": {
    "instructions": "Extract proper names from text",
    "fewShotExamples": [...]
  }
}
```

## License

MIT

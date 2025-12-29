/**
 * QA System with Chain of Thought
 *
 * Shows how to build a question-answering system
 * that shows its reasoning before answering
 */

import {
  defineSchema,
  ChainOfThought,
  BootstrapFewShot,
  partialMatch,
  createProvider,
  z,
} from "@mzhub/promptc";

const QASchema = defineSchema({
  description:
    "Answer questions based on provided context. Think step by step.",
  inputs: {
    context: z.string().describe("The text containing information"),
    question: z.string().describe("The question to answer"),
  },
  outputs: {
    answer: z.string().describe("The answer extracted from context"),
    confidence: z.number().min(0).max(1).describe("Confidence in the answer"),
  },
});

const provider = createProvider("openai", {
  apiKey: process.env.OPENAI_API_KEY,
});

const qaProgram = new ChainOfThought(QASchema, provider);

const trainset = [
  {
    input: {
      context:
        "The Eiffel Tower was completed in 1889. It stands 330 meters tall and is located in Paris, France.",
      question: "When was the Eiffel Tower completed?",
    },
    output: { answer: "1889", confidence: 0.95 },
  },
  {
    input: {
      context:
        "Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976.",
      question: "Who founded Apple?",
    },
    output: {
      answer: "Steve Jobs, Steve Wozniak, and Ronald Wayne",
      confidence: 0.95,
    },
  },
  {
    input: {
      context:
        "The speed of light is approximately 299,792 kilometers per second in a vacuum.",
      question: "What is the speed of light?",
    },
    output: {
      answer: "approximately 299,792 kilometers per second",
      confidence: 0.9,
    },
  },
];

async function main() {
  console.log("Building QA System with Chain of Thought...\n");

  // Single inference to see the reasoning
  const result = await qaProgram.run({
    context:
      "Python was created by Guido van Rossum and first released in 1991. It emphasizes code readability.",
    question: "Who created Python?",
  });

  console.log("Question: Who created Python?");
  console.log("\nReasoning:", result.trace.reasoning);
  console.log("Answer:", result.result.answer);
  console.log("Confidence:", `${(result.result.confidence * 100).toFixed(0)}%`);

  // Optional: Compile for better accuracy
  console.log("\n--- Compiling for better accuracy ---\n");

  const compiler = new BootstrapFewShot(
    partialMatch<{ answer: string; confidence: number }>()
  );
  const compiled = await compiler.compile(qaProgram, trainset, {
    candidates: 5,
    concurrency: 2,
  });

  console.log(`Compilation score: ${(compiled.meta.score * 100).toFixed(1)}%`);
}

main().catch(console.error);

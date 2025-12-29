/**
 * Multi-Provider Example
 *
 * Shows how to use different LLM providers with the same program
 */

import { defineSchema, Predict, createProvider, z } from "@mzhub/promptc";

const SentimentAnalyzer = defineSchema({
  description:
    "Analyze the sentiment of text as positive, negative, or neutral",
  inputs: { text: z.string() },
  outputs: {
    sentiment: z.enum(["positive", "negative", "neutral"]),
    confidence: z.number(),
  },
});

async function testProvider(providerName: string, apiKeyEnv: string) {
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) {
    console.log(`⏭️ Skipping ${providerName} (no ${apiKeyEnv})`);
    return;
  }

  try {
    const provider = createProvider(providerName as any, { apiKey });
    const program = new Predict(SentimentAnalyzer, provider);

    const start = Date.now();
    const result = await program.run({
      text: "I absolutely love this product!",
    });
    const latency = Date.now() - start;

    console.log(`\n✅ ${providerName}`);
    console.log(`   Sentiment: ${result.result.sentiment}`);
    console.log(
      `   Confidence: ${(result.result.confidence * 100).toFixed(0)}%`
    );
    console.log(`   Latency: ${latency}ms`);
    console.log(
      `   Tokens: ${
        result.trace.usage.inputTokens + result.trace.usage.outputTokens
      }`
    );
  } catch (error: any) {
    console.log(`\n❌ ${providerName}: ${error.message}`);
  }
}

async function main() {
  console.log("Testing sentiment analysis across providers...");

  await testProvider("openai", "OPENAI_API_KEY");
  await testProvider("anthropic", "ANTHROPIC_API_KEY");
  await testProvider("google", "GOOGLE_API_KEY");
  await testProvider("groq", "GROQ_API_KEY");
  await testProvider("cerebras", "CEREBRAS_API_KEY");

  // Ollama (local, no API key)
  try {
    const provider = createProvider("ollama");
    const program = new Predict(SentimentAnalyzer, provider);
    const start = Date.now();
    const result = await program.run({
      text: "I absolutely love this product!",
    });
    console.log(`\n✅ ollama (local)`);
    console.log(`   Sentiment: ${result.result.sentiment}`);
    console.log(`   Latency: ${Date.now() - start}ms`);
  } catch {
    console.log(`\n⏭️ Skipping ollama (not running locally)`);
  }
}

main().catch(console.error);

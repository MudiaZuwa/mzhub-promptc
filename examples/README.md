# Examples

These examples show how to use promptc for various tasks.

## Prerequisites

```bash
# Install dependencies
npm install @mzhub/promptc openai

# Set your API key
export OPENAI_API_KEY="sk-..."
```

## Running Examples

```bash
# Run with tsx (recommended)
npx tsx examples/name-extractor.ts

# Or compile first
npx tsc examples/name-extractor.ts
node examples/name-extractor.js
```

## Examples

### 1. Name Extractor (`name-extractor.ts`)

Complete workflow: define schema → compile → save → use

### 2. QA System (`qa-system.ts`)

Chain of Thought reasoning for question answering

### 3. Multi-Provider (`multi-provider.ts`)

Test the same program across different LLM providers

### 4. Load Compiled (`load-compiled.ts`)

Load a previously compiled program from JSON

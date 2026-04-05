import { query } from "@anthropic-ai/claude-code";

const prompt = "Ask me a question and I will answer it.";

for await (const message of query({
  prompt,
})) {
  console.log(JSON.stringify(message, null, 2));
}
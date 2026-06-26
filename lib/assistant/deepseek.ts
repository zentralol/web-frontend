import { createOpenAI } from "@ai-sdk/openai";

export function getDeepSeekModel() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }

  const normalizedBaseURL = baseURL.endsWith("/v1")
    ? baseURL
    : `${baseURL.replace(/\/$/, "")}/v1`;

  const openai = createOpenAI({
    apiKey,
    baseURL: normalizedBaseURL,
  });

  return openai.chat(model);
}

import type { PostInput } from "@ceb/shared";
import type { AIProviderInterface } from "../providers/index.js";
import { buildTelegramPrompt } from "../prompts/telegram.js";

export async function generateTelegramPost(
  provider: AIProviderInterface,
  input: PostInput
): Promise<string> {
  const prompt = buildTelegramPrompt(input);
  const response = await provider.generate(prompt);
  return response.trim();
}

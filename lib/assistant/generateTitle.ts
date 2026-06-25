import { generateText, type UIMessage } from "ai";
import { getDeepSeekModel } from "./deepseek";
import { extractMessageText, titleFromUserMessage } from "./mappers";

export async function generateConversationTitle(
  messages: UIMessage[],
): Promise<string> {
  const firstUser = messages.find(
    (message) => message.role === "user" && extractMessageText(message).length > 0,
  );

  if (!firstUser) {
    throw new Error("No user message");
  }

  const userText = extractMessageText(firstUser);
  const firstAssistant = messages.find((message) => message.role === "assistant");
  const assistantText = firstAssistant
    ? extractMessageText(firstAssistant)
    : "";

  try {
    const { text } = await generateText({
      model: getDeepSeekModel(),
      system: `Generate a short chat title (max 6 words, max 50 characters).
Use the same language as the user's message.
Return only the title, no quotes or punctuation at the end.`,
      prompt: assistantText
        ? `User: ${userText}\nAssistant: ${assistantText}`
        : userText,
    });

    const cleaned = text.trim().replace(/^["']|["']$/g, "").slice(0, 50);
    return cleaned || titleFromUserMessage(userText);
  } catch {
    return titleFromUserMessage(userText);
  }
}

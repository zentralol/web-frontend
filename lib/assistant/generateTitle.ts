import { generateText, type UIMessage } from "ai";
import { getDeepSeekModel } from "./deepseek";
import { extractMessageText } from "./mappers";
import {
  limitWordCount,
  titleFromUserMessage,
  truncateToLastCompleteWord,
  TITLE_MAX_LENGTH,
  TITLE_MAX_WORDS,
} from "./titleUtils";

export async function generateConversationTitle(
  messages: UIMessage[],
): Promise<string> {
  const firstUser = messages.find(
    (message) =>
      message.role === "user" && extractMessageText(message).length > 0,
  );

  if (!firstUser) {
    throw new Error("No user message");
  }

  const userText = extractMessageText(firstUser);
  const firstAssistant = messages.find(
    (message) => message.role === "assistant",
  );
  const assistantText = firstAssistant ? extractMessageText(firstAssistant) : "";

  try {
    const { text } = await generateText({
      model: getDeepSeekModel(),
      system: `Generate a short chat title (max ${TITLE_MAX_WORDS} words, max ${TITLE_MAX_LENGTH} characters).
Use the same language as the user's message.
Return only the title, no quotes or punctuation at the end.`,
      prompt: assistantText
        ? `User: ${userText}\nAssistant: ${assistantText}`
        : userText,
    });

    const cleaned = text
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, " ");
    const wordLimited = limitWordCount(cleaned, TITLE_MAX_WORDS);
    const finalTitle =
      wordLimited.length <= TITLE_MAX_LENGTH
        ? wordLimited
        : truncateToLastCompleteWord(wordLimited, TITLE_MAX_LENGTH);

    return finalTitle || titleFromUserMessage(userText);
  } catch {
    return titleFromUserMessage(userText);
  }
}

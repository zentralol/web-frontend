import type { UIMessage } from "ai";
import type {
  ConversationRow,
  ConversationSummary,
  InsertMessageOptions,
  MessageMetadata,
  MessageRow,
} from "./types";

export function extractMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function rowToUIMessage(row: MessageRow): UIMessage {
  const uiMessageId = row.metadata?.ui_message_id ?? row.id;

  return {
    id: uiMessageId,
    role: row.role === "system" ? "assistant" : row.role,
    parts: [{ type: "text", text: row.content }],
  };
}

export function uiMessageToRow(
  conversationId: string,
  message: UIMessage,
  options: InsertMessageOptions = {},
): Omit<MessageRow, "id" | "created_at" | "deleted_at"> {
  const metadata: MessageMetadata = { ui_message_id: message.id };

  return {
    conversation_id: conversationId,
    role: message.role as "user" | "assistant" | "system",
    content: extractMessageText(message),
    model: options.model ?? null,
    prompt_tokens: options.promptTokens ?? null,
    completion_tokens: options.completionTokens ?? null,
    metadata,
  };
}

export function rowToConversationSummary(
  row: ConversationRow,
): ConversationSummary {
  return {
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

export function isPersistableMessage(message: UIMessage): boolean {
  return (
    (message.role === "user" || message.role === "assistant") &&
    message.id !== "welcome" &&
    extractMessageText(message).length > 0
  );
}

export function titleFromUserMessage(text: string, maxLength = 50): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

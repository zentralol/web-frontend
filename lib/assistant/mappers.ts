import type { UIMessage } from "ai";
import {
  PLACE_CARDS_DATA_TYPE,
  parsePersistedPlaceCards,
} from "./agentStreamAdapter";
import type {
  ConversationRow,
  ConversationSummary,
  InsertMessageOptions,
  MessageMetadata,
  StoredMessagePart,
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
  const parts: UIMessage["parts"] = [
    { type: "text", text: row.content },
  ];

  for (const part of row.parts ?? []) {
    const cards = parsePersistedPlaceCards(part);
    if (cards) {
      parts.push(
        {
          type: PLACE_CARDS_DATA_TYPE,
          data: cards,
        } as unknown as UIMessage["parts"][number],
      );
    }
  }

  return {
    id: uiMessageId,
    role: row.role === "system" ? "assistant" : row.role,
    parts,
  };
}

export function uiMessageToRow(
  conversationId: string,
  message: UIMessage,
  options: InsertMessageOptions = {},
): Omit<MessageRow, "id" | "created_at" | "deleted_at"> {
  const metadata: MessageMetadata = { ui_message_id: message.id };
  const parts: StoredMessagePart[] = message.parts
    .filter((part) => part.type === PLACE_CARDS_DATA_TYPE)
    .map((part) => {
      const data = (part as { data?: unknown }).data;
      return {
        type: PLACE_CARDS_DATA_TYPE,
        data: (data ?? {}) as Record<string, unknown>,
      };
    });

  return {
    conversation_id: conversationId,
    role: message.role as "user" | "assistant" | "system",
    content: extractMessageText(message),
    model: options.model ?? null,
    prompt_tokens: options.promptTokens ?? null,
    completion_tokens: options.completionTokens ?? null,
    metadata,
    parts,
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

export { titleFromUserMessage } from "./titleUtils";

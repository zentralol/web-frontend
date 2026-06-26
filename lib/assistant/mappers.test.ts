import { describe, expect, it } from "vitest";
import {
  extractMessageText,
  isPersistableMessage,
  rowToConversationSummary,
  rowToUIMessage,
  uiMessageToRow,
} from "./mappers";
import type { ConversationRow, MessageRow } from "./types";

describe("extractMessageText", () => {
  it("joins all text parts", () => {
    const message = {
      id: "1",
      role: "user" as const,
      parts: [
        { type: "text" as const, text: "Hello " },
        { type: "text" as const, text: "world" },
      ],
    };
    expect(extractMessageText(message)).toBe("Hello world");
  });

  it("ignores non-text parts", () => {
    const message = {
      id: "1",
      role: "user" as const,
      parts: [
        { type: "text" as const, text: "Hello" },
        { type: "image" as const, image: "data" },
      ],
    };
    expect(extractMessageText(message)).toBe("Hello");
  });
});

describe("rowToUIMessage", () => {
  it("maps a database row to a UI message", () => {
    const row: MessageRow = {
      id: "row-1",
      conversation_id: "conv-1",
      role: "user",
      content: "Hello",
      model: null,
      prompt_tokens: null,
      completion_tokens: null,
      metadata: { ui_message_id: "ui-1" },
      created_at: "2026-01-01T00:00:00Z",
      deleted_at: null,
    };

    const message = rowToUIMessage(row);

    expect(message.id).toBe("ui-1");
    expect(message.role).toBe("user");
    expect(extractMessageText(message)).toBe("Hello");
  });

  it("falls back to row id when ui_message_id is missing", () => {
    const row: MessageRow = {
      id: "row-1",
      conversation_id: "conv-1",
      role: "assistant",
      content: "Hi",
      model: null,
      prompt_tokens: null,
      completion_tokens: null,
      metadata: null,
      created_at: "2026-01-01T00:00:00Z",
      deleted_at: null,
    };

    const message = rowToUIMessage(row);

    expect(message.id).toBe("row-1");
    expect(message.role).toBe("assistant");
  });

  it("maps system role to assistant", () => {
    const row: MessageRow = {
      id: "row-1",
      conversation_id: "conv-1",
      role: "system",
      content: "System prompt",
      model: null,
      prompt_tokens: null,
      completion_tokens: null,
      metadata: null,
      created_at: "2026-01-01T00:00:00Z",
      deleted_at: null,
    };

    const message = rowToUIMessage(row);

    expect(message.role).toBe("assistant");
  });
});

describe("uiMessageToRow", () => {
  it("maps a UI message to a database row", () => {
    const message = {
      id: "ui-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    };

    const row = uiMessageToRow("conv-1", message);

    expect(row.conversation_id).toBe("conv-1");
    expect(row.role).toBe("user");
    expect(row.content).toBe("Hello");
    expect(row.metadata).toEqual({ ui_message_id: "ui-1" });
  });

  it("includes optional model and token usage", () => {
    const message = {
      id: "ui-1",
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "Hi" }],
    };

    const row = uiMessageToRow("conv-1", message, {
      model: "deepseek-v4-flash",
      promptTokens: 10,
      completionTokens: 5,
    });

    expect(row.model).toBe("deepseek-v4-flash");
    expect(row.prompt_tokens).toBe(10);
    expect(row.completion_tokens).toBe(5);
  });
});

describe("rowToConversationSummary", () => {
  it("maps a conversation row to a summary", () => {
    const row: ConversationRow = {
      id: "conv-1",
      user_id: "user-1",
      title: "Trip plan",
      model: "deepseek-v4-flash",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      deleted_at: null,
    };

    const summary = rowToConversationSummary(row);

    expect(summary).toEqual({
      id: "conv-1",
      title: "Trip plan",
      updatedAt: "2026-01-02T00:00:00Z",
    });
  });
});

describe("isPersistableMessage", () => {
  it("returns true for non-welcome user messages with content", () => {
    const message = {
      id: "ui-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    };
    expect(isPersistableMessage(message)).toBe(true);
  });

  it("returns false for welcome messages", () => {
    const message = {
      id: "welcome",
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    };
    expect(isPersistableMessage(message)).toBe(false);
  });

  it("returns false for empty messages", () => {
    const message = {
      id: "ui-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "" }],
    };
    expect(isPersistableMessage(message)).toBe(false);
  });

  it("returns false for system messages", () => {
    const message = {
      id: "ui-1",
      role: "system" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    };
    expect(isPersistableMessage(message)).toBe(false);
  });
});

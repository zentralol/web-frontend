/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { DEMO_CONVERSATION_ID } from "@/lib/demo/mode";
import {
  createDemoConversation,
  deleteDemoConversation,
  ensureDemoConversations,
  getDemoMessages,
  isDemoConversationId,
  listDemoConversations,
  saveDemoMessages,
} from "@/lib/demo/conversationStore";

const STORAGE_KEY = "zentra_demo_assistant_v1";

function userMessage(text: string): UIMessage {
  return {
    id: `user-${text}`,
    role: "user",
    parts: [{ type: "text", text }],
  };
}

describe("conversationStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("recognizes demo conversation ids", () => {
    expect(isDemoConversationId(DEMO_CONVERSATION_ID)).toBe(true);
    expect(isDemoConversationId("demo-conversation-abc")).toBe(true);
    expect(isDemoConversationId("real-uuid")).toBe(false);
  });

  it("seeds a stable default conversation when empty", () => {
    const list = ensureDemoConversations();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(DEMO_CONVERSATION_ID);
    expect(listDemoConversations()).toEqual(list);
  });

  it("creates additional conversations without dropping the first", () => {
    ensureDemoConversations();
    const created = createDemoConversation();
    const list = listDemoConversations();

    expect(created.id).not.toBe(DEMO_CONVERSATION_ID);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(created.id);
  });

  it("persists and restores messages with a title from the first user turn", () => {
    ensureDemoConversations();
    const messages = [
      userMessage("Best coffee near Washington Square?"),
      {
        id: "assistant-1",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "Try Joe's Coffee." }],
      },
    ];

    saveDemoMessages(DEMO_CONVERSATION_ID, messages);

    expect(getDemoMessages(DEMO_CONVERSATION_ID)).toEqual(messages);
    expect(listDemoConversations()[0].title).toBe(
      "Best coffee near Washington Square?",
    );
    expect(localStorage.getItem(STORAGE_KEY)).toContain(DEMO_CONVERSATION_ID);
  });

  it("keeps other chats when deleting one and recreates when empty", () => {
    ensureDemoConversations();
    const second = createDemoConversation();
    saveDemoMessages(second.id, [userMessage("hello")]);

    const nextId = deleteDemoConversation(second.id);
    expect(nextId).toBe(DEMO_CONVERSATION_ID);
    expect(listDemoConversations()).toHaveLength(1);
    expect(getDemoMessages(second.id)).toEqual([]);

    const afterLast = deleteDemoConversation(DEMO_CONVERSATION_ID);
    expect(isDemoConversationId(afterLast)).toBe(true);
    expect(listDemoConversations()).toHaveLength(1);
    expect(listDemoConversations()[0].id).toBe(afterLast);
  });
});

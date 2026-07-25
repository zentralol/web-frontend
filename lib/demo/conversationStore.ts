import type { UIMessage } from "ai";
import type { ConversationSummary } from "@/lib/assistant/types";
import { isConversationEmpty } from "@/lib/assistant/conversationState";
import { DEMO_CONVERSATION_ID } from "@/lib/demo/mode";

const STORAGE_KEY = "zentra_demo_assistant_v1";
export const DEMO_CONVERSATION_ID_PREFIX = "demo-conversation-";

type DemoAssistantStore = {
  conversations: ConversationSummary[];
  messagesById: Record<string, UIMessage[]>;
};

function emptyStore(): DemoAssistantStore {
  return { conversations: [], messagesById: {} };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readStore(): DemoAssistantStore {
  if (!canUseStorage()) {
    return emptyStore();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }
    const parsed = JSON.parse(raw) as DemoAssistantStore;
    if (!parsed || !Array.isArray(parsed.conversations)) {
      return emptyStore();
    }
    return {
      conversations: parsed.conversations,
      messagesById: parsed.messagesById ?? {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: DemoAssistantStore): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function isDemoConversationId(conversationId: string): boolean {
  return conversationId.startsWith(DEMO_CONVERSATION_ID_PREFIX);
}

function newConversationId(): string {
  return `${DEMO_CONVERSATION_ID_PREFIX}${crypto.randomUUID()}`;
}

/** Ensure at least one conversation exists; returns the full list. */
export function ensureDemoConversations(): ConversationSummary[] {
  const store = readStore();
  if (store.conversations.length > 0) {
    return store.conversations;
  }

  // Seed with the stable server demo id so /assistant → redirect matches.
  const conversation: ConversationSummary = {
    id: DEMO_CONVERSATION_ID,
    title: null,
    updatedAt: new Date().toISOString(),
  };
  store.conversations = [conversation];
  store.messagesById[conversation.id] = [];
  writeStore(store);
  return store.conversations;
}

export function listDemoConversations(): ConversationSummary[] {
  return ensureDemoConversations();
}

export function createDemoConversation(): ConversationSummary {
  const store = readStore();
  const conversation: ConversationSummary = {
    id: newConversationId(),
    title: null,
    updatedAt: new Date().toISOString(),
  };
  store.conversations = [conversation, ...store.conversations];
  store.messagesById[conversation.id] = [];
  writeStore(store);
  return conversation;
}

export function getDemoMessages(conversationId: string): UIMessage[] {
  const store = readStore();
  return store.messagesById[conversationId] ?? [];
}

export function saveDemoMessages(
  conversationId: string,
  messages: UIMessage[],
): void {
  const store = readStore();
  if (!store.conversations.some((item) => item.id === conversationId)) {
    store.conversations = [
      {
        id: conversationId,
        title: null,
        updatedAt: new Date().toISOString(),
      },
      ...store.conversations,
    ];
  }

  const persisted = isConversationEmpty(messages) ? [] : messages;
  store.messagesById[conversationId] = persisted;

  const firstUser = messages.find((message) => message.role === "user");
  let title: string | null = null;
  if (firstUser) {
    const textPart = firstUser.parts.find((part) => part.type === "text");
    if (textPart && "text" in textPart && typeof textPart.text === "string") {
      title = textPart.text.trim().slice(0, 60) || null;
    }
  }

  store.conversations = store.conversations.map((item) =>
    item.id === conversationId
      ? {
          ...item,
          title: title ?? item.title,
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  // Most recently updated first.
  store.conversations.sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0,
  );

  writeStore(store);
}

/**
 * Deletes a demo conversation. Returns the next conversation id to open,
 * creating a fresh empty one when the list would otherwise be empty.
 */
export function deleteDemoConversation(conversationId: string): string {
  const store = readStore();
  const remaining = store.conversations.filter(
    (item) => item.id !== conversationId,
  );
  delete store.messagesById[conversationId];

  if (remaining.length === 0) {
    const conversation: ConversationSummary = {
      id: newConversationId(),
      title: null,
      updatedAt: new Date().toISOString(),
    };
    store.conversations = [conversation];
    store.messagesById[conversation.id] = [];
    writeStore(store);
    return conversation.id;
  }

  store.conversations = remaining;
  writeStore(store);
  return remaining[0].id;
}

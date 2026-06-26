import type { SupabaseClient } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import {
  isPersistableMessage,
  rowToConversationSummary,
  rowToUIMessage,
  uiMessageToRow,
} from "./mappers";
import { generateConversationTitle } from "./generateTitle";
import type {
  ConversationRow,
  ConversationSummary,
  InsertMessageOptions,
  MessageRow,
} from "./types";

const DEFAULT_MODEL =
  process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

export async function listConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as ConversationRow[]).map(rowToConversationSummary);
}

export async function getConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
): Promise<ConversationRow | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ConversationRow | null;
}

export async function createConversation(
  supabase: SupabaseClient,
  userId: string,
  model: string = DEFAULT_MODEL,
): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      model,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ConversationRow;
}

export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as MessageRow[]).map(rowToUIMessage);
}

async function getExistingUiMessageIds(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("messages")
    .select("metadata")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const metadata = row.metadata as { ui_message_id?: string } | null;
    if (metadata?.ui_message_id) {
      ids.add(metadata.ui_message_id);
    }
  }
  return ids;
}

export async function insertMessages(
  supabase: SupabaseClient,
  conversationId: string,
  messages: UIMessage[],
  options: {
    model?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
    };
  } = {},
): Promise<void> {
  const existingIds = await getExistingUiMessageIds(supabase, conversationId);
  const persistable = messages.filter(isPersistableMessage);
  const newMessages = persistable.filter((message) => !existingIds.has(message.id));

  if (newMessages.length === 0) {
    return;
  }

  const lastAssistantIndex = [...newMessages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "assistant")?.index;

  const rows = newMessages.map((message, index) => {
    const insertOptions: InsertMessageOptions = {};

    if (message.role === "assistant" && index === lastAssistantIndex) {
      insertOptions.model = options.model;
      insertOptions.promptTokens = options.usage?.promptTokens;
      insertOptions.completionTokens = options.usage?.completionTokens;
    }

    return uiMessageToRow(conversationId, message, insertOptions);
  });

  const { error } = await supabase.from("messages").insert(rows);

  if (error) {
    throw error;
  }
}

export async function updateConversationTitle(
  supabase: SupabaseClient,
  conversationId: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }
}

export async function maybeGenerateConversationTitle(
  supabase: SupabaseClient,
  conversation: ConversationRow,
  messages: UIMessage[],
): Promise<void> {
  if (conversation.title) {
    return;
  }

  const firstUserMessage = messages.find(
    (message) => message.role === "user" && isPersistableMessage(message),
  );

  if (!firstUserMessage) {
    return;
  }

  const title = await generateConversationTitle(messages);
  await updateConversationTitle(supabase, conversation.id, title);
}

export async function softDeleteConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
): Promise<void> {
  const conversation = await getConversation(supabase, userId, conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const now = new Date().toISOString();

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({ deleted_at: now })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (conversationError) {
    throw conversationError;
  }

  const { error: messagesError } = await supabase
    .from("messages")
    .update({ deleted_at: now })
    .eq("conversation_id", conversationId);

  if (messagesError) {
    throw messagesError;
  }
}

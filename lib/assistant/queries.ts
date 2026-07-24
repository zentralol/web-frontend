import type { SupabaseClient } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import { rowToConversationSummary, rowToUIMessage } from "./mappers";
import type {
  ConversationRow,
  ConversationSummary,
  MessageRow,
} from "./types";
import {
  DEMO_CONVERSATION_SUMMARY,
  demoConversationRow,
} from "@/lib/demo/fixtures/activity";
import { isDemoConversationId } from "@/lib/demo/conversationStore";
import { isDemoMode } from "@/lib/demo/mode";

const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

export async function listConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<ConversationSummary[]> {
  if (await isDemoMode()) {
    return [DEMO_CONVERSATION_SUMMARY];
  }

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
  if (await isDemoMode()) {
    // Client-created demo ids are demo-conversation-<uuid>; accept any of them.
    if (!isDemoConversationId(conversationId)) {
      return null;
    }
    return {
      ...demoConversationRow(userId),
      id: conversationId,
    };
  }

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
  if (await isDemoMode()) {
    // Placeholder only — AssistantShell creates real demo ids in localStorage.
    return {
      ...demoConversationRow(userId),
      id: `demo-conversation-${crypto.randomUUID()}`,
    };
  }

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
  if (await isDemoMode()) {
    return [];
  }

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

export async function softDeleteConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
): Promise<void> {
  if (await isDemoMode()) {
    return;
  }

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

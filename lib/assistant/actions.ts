"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createConversation,
  getMessages,
  listConversations,
  softDeleteConversation,
} from "./queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function createConversationAction(): Promise<string> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const conversation = await createConversation(supabase, userId);

  revalidatePath("/assistant");
  return conversation.id;
}

export async function deleteConversationAction(
  conversationId: string,
): Promise<string | null> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const conversations = await listConversations(supabase, userId);

  if (conversations.length <= 1) {
    const messages = await getMessages(supabase, conversationId);
    if (messages.length === 0) {
      throw new Error("Cannot delete an empty conversation");
    }
  }

  await softDeleteConversation(supabase, userId, conversationId);

  const remaining = await listConversations(supabase, userId);
  revalidatePath("/assistant");

  if (remaining.length === 0) {
    const conversation = await createConversation(supabase, userId);
    return conversation.id;
  }

  return remaining[0]?.id ?? null;
}

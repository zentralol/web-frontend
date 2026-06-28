import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { getConversation, getMessages } from "@/lib/assistant/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AssistantConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function AssistantConversationPage({
  params,
}: AssistantConversationPageProps) {
  const { conversationId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseClient();
  const conversation = await getConversation(supabase, userId, conversationId);

  if (!conversation) {
    notFound();
  }

  const initialMessages = await getMessages(supabase, conversationId);

  return (
    <AssistantChat
      key={conversationId}
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  );
}

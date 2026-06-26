import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { AssistantWorkspace } from "@/components/assistant/AssistantWorkspace";
import {
  getConversation,
  getMessages,
  listConversations,
} from "@/lib/assistant/queries";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
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
  const preferences = await getOnboardingPreferences(supabase, userId);

  if (!preferences?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const conversation = await getConversation(
    supabase,
    userId,
    conversationId,
  );

  if (!conversation) {
    notFound();
  }

  const [conversations, initialMessages] = await Promise.all([
    listConversations(supabase, userId),
    getMessages(supabase, conversationId),
  ]);

  return (
    <AssistantWorkspace
      conversations={conversations}
      activeConversationId={conversationId}
      initialMessages={initialMessages}
    />
  );
}

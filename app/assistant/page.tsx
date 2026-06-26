import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  createConversation,
  listConversations,
} from "@/lib/assistant/queries";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AssistantPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseClient();
  const preferences = await getOnboardingPreferences(supabase, userId);

  if (!preferences?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const conversations = await listConversations(supabase, userId);

  if (conversations.length > 0) {
    redirect(`/assistant/${conversations[0].id}`);
  }

  const conversation = await createConversation(supabase, userId);
  redirect(`/assistant/${conversation.id}`);
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AssistantShell } from "@/components/assistant/AssistantShell";
import { listConversations } from "@/lib/assistant/queries";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AssistantLayoutProps = {
  children: ReactNode;
};

export default async function AssistantLayout({
  children,
}: AssistantLayoutProps) {
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

  return <AssistantShell conversations={conversations}>{children}</AssistantShell>;
}

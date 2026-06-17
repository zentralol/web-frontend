import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/lib/onboarding/queries";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseClient();
  const completed = await hasCompletedOnboarding(supabase, userId);

  if (completed) {
    redirect("/welcome-back");
  }

  return <OnboardingWizard />;
}

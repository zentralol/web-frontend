import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/onboarding/SettingsForm";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { spaceGrotesk } from "@/app/ui/fonts";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseClient();
  const preferences = await getOnboardingPreferences(supabase, userId);

  if (!preferences?.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Settings
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-3 text-2xl font-light tracking-tight text-white sm:text-3xl`}
        >
          Travel preferences
        </h1>
        <p className="mt-3 text-base text-white/55">
          Update what matters to you. Changes sync across web and mobile.
        </p>
      </div>
      <SettingsForm initialValues={preferences} />
    </div>
  );
}

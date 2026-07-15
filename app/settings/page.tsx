import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/onboarding/SettingsForm";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { spaceGrotesk } from "@/app/ui/fonts";
import { SavedPlacesSection } from "@/components/settings/SavedPlacesSection";
import { listFavoritePlaces } from "@/lib/favorites/queries";

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

  const favoritePlaces = await listFavoritePlaces(supabase, userId).catch(
    () => [] as Awaited<ReturnType<typeof listFavoritePlaces>>,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Settings
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-3 text-2xl font-light tracking-tight text-white sm:text-3xl`}
        >
          Your settings
        </h1>
        <p className="mt-3 text-base text-white/55">
          Manage your saved places and update what matters to you.
        </p>
      </div>
      <div className="space-y-12">
        <SavedPlacesSection initialPlaces={favoritePlaces} />
        <section
          aria-labelledby="travel-preferences-heading"
          className="border-t border-white/10 pt-10"
        >
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
              Preferences
            </p>
            <h2
              id="travel-preferences-heading"
              className={`${spaceGrotesk.className} mt-2 text-xl font-light text-white`}
            >
              Travel preferences
            </h2>
          </div>
          <SettingsForm initialValues={preferences} />
        </section>
      </div>
    </div>
  );
}

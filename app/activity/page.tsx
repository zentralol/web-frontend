import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { spaceGrotesk } from "@/app/ui/fonts";
import { ActivityInsights } from "@/components/activity/ActivityInsights";
import { SavedTrips } from "@/components/activity/SavedTrips";
import { listAttractions, listRecentAttractionPredictions } from "@/lib/attractions/queries";
import type { AttractionPredictionRow } from "@/lib/attractions/types";
import { listSavedItinerariesAction } from "@/lib/itineraries/actions";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ActivityPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseClient();
  const preferences = await getOnboardingPreferences(supabase, userId);

  if (!preferences?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const [attractions, predictions, itineraries] = await Promise.all([
    listAttractions(supabase).catch(() => [] as Awaited<ReturnType<typeof listAttractions>>),
    listRecentAttractionPredictions(supabase).catch(() => [] as AttractionPredictionRow[]),
    listSavedItinerariesAction().catch(() => [] as Awaited<ReturnType<typeof listSavedItinerariesAction>>),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Activity
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-3 text-3xl font-light tracking-tight text-white`}
        >
          Your journey
        </h1>
        <p className="mt-4 max-w-xl text-sm text-white/55">
          Live crowd analytics for Manhattan plus trips you saved from the
          assistant.
        </p>
      </div>

      <ActivityInsights attractions={attractions} predictions={predictions} />

      <div>
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Saved trips
        </p>
        <SavedTrips initialItineraries={itineraries} />
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MapWorkspace from "@/components/map/MapWorkspace";
import { listAttractions } from "@/lib/attractions/queries";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MapPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseClient();
  const preferences = await getOnboardingPreferences(supabase, userId);

  if (!preferences?.onboardingCompleted) {
    redirect("/onboarding");
  }

  let initialAttractions: Awaited<ReturnType<typeof listAttractions>> = [];
  let initialLoadState: "ready" | "empty" | "error" = "empty";

  try {
    initialAttractions = await listAttractions(supabase);
    initialLoadState = initialAttractions.length > 0 ? "ready" : "empty";
  } catch {
    initialAttractions = [];
    initialLoadState = "error";
  }

  return (
    <Suspense>
      <MapWorkspace
        userInterests={preferences.interests}
        initialAttractions={initialAttractions}
        initialLoadState={initialLoadState}
      />
    </Suspense>
  );
}

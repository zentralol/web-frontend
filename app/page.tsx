import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import HomeExploreSection from "@/components/home/HomeExploreSection";
import { pickRecommendedAttractions } from "@/lib/attractions/filterAttractions";
import { listAttractions } from "@/lib/attractions/queries";
import {
  getOnboardingPreferences,
  hasCompletedOnboarding,
} from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { spaceGrotesk } from "@/app/ui/fonts";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--viewport-top))] max-w-4xl flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Travel planning, personalized
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-4 text-4xl font-light tracking-tight text-white md:text-5xl`}
        >
          Plan trips that feel like you
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-white/55">
          Set your travel preferences and get routes tailored to your pace,
          interests, accessibility needs, and crowd tolerance.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/assistant"
            className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-surface transition-opacity hover:opacity-90"
          >
            Start planning
          </Link>
          <Link
            href="/map"
            className="rounded-full border border-white/15 px-8 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            Explore Manhattan
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const completed = await hasCompletedOnboarding(supabase, userId);

  if (!completed) {
    redirect("/onboarding");
  }

  const user = await currentUser();
  const firstName = user?.firstName ?? "Traveler";
  const preferences = await getOnboardingPreferences(supabase, userId);

  let recommendedAttractions: Awaited<ReturnType<typeof listAttractions>> = [];

  try {
    const attractions = await listAttractions(supabase);
    recommendedAttractions = pickRecommendedAttractions(
      attractions,
      preferences?.interests ?? [],
      3,
    );
  } catch {
    recommendedAttractions = [];
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--viewport-top))] max-w-4xl flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
        Welcome back
      </p>
      <h1
        className={`${spaceGrotesk.className} mt-4 text-4xl font-light tracking-tight text-white md:text-5xl`}
      >
        Ready for your next trip, {firstName}?
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-white/55">
        Your preferences are synced. Search attractions, explore the map, or
        update your settings anytime.
      </p>
      <HomeExploreSection recommendedAttractions={recommendedAttractions} />
    </div>
  );
}

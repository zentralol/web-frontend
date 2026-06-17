import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { INTEREST_OPTIONS, TRAVEL_PACE_OPTIONS } from "@/lib/onboarding/constants";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { spaceGrotesk } from "@/app/ui/fonts";

export default async function WelcomeBackPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseClient();
  const preferences = await getOnboardingPreferences(supabase, userId);

  if (!preferences?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const user = await currentUser();
  const firstName = user?.firstName ?? "Traveler";
  const topInterests = preferences.interests
    .slice(0, 3)
    .map(
      (interest) =>
        INTEREST_OPTIONS.find((option) => option.value === interest)?.label,
    )
    .filter(Boolean)
    .join(", ");
  const paceLabel =
    TRAVEL_PACE_OPTIONS.find((option) => option.value === preferences.travelPace)
      ?.label ?? preferences.travelPace;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
        Welcome back
      </p>
      <h1
        className={`${spaceGrotesk.className} mt-4 text-4xl font-light tracking-tight text-white md:text-5xl`}
      >
        Good to see you, {firstName}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-white/55">
        Your preferences are saved. We&apos;ll keep tailoring routes around a{" "}
        {paceLabel.toLowerCase()} pace
        {topInterests ? `, with a focus on ${topInterests.toLowerCase()}` : ""}.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <QuickLink
          href="/map"
          title="Explore the map"
          description="Discover places matched to your style"
        />
        <QuickLink
          href="/routes"
          title="Plan a route"
          description="Build a day around your interests"
        />
        <QuickLink
          href="/settings"
          title="Update preferences"
          description="Change pace, interests, or needs anytime"
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:border-accent/40 hover:bg-accent/5"
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-white/50">{description}</p>
    </Link>
  );
}

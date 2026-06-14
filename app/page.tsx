import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/lib/onboarding/queries";
import { spaceGrotesk } from "@/app/ui/fonts";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] max-w-4xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Travel planning, personalized
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-4 text-4xl font-light tracking-tight text-white md:text-5xl`}
        >
          Plan trips that feel like you
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-white/55">
          Sign in to set your travel preferences and get routes tailored to your
          pace, interests, and needs.
        </p>
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
        Welcome back
      </p>
      <h1
        className={`${spaceGrotesk.className} mt-4 text-4xl font-light tracking-tight text-white md:text-5xl`}
      >
        Ready for your next trip, {firstName}?
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-white/55">
        Your preferences are synced. Jump into the map, plan a route, or update
        your settings anytime.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/map"
          className="rounded-full bg-accent px-8 py-3 text-sm font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90"
        >
          Open map
        </Link>
        <Link
          href="/settings"
          className="rounded-full border border-white/15 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          Preferences
        </Link>
      </div>
    </div>
  );
}

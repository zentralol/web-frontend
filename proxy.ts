import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

async function hasCompletedOnboarding(
  userId: string,
): Promise<boolean | null> {
  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from("onboarding_preferences")
      .select("onboarding_completed")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data?.onboarding_completed === true;
  } catch {
    return null;
  }
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }

  const { userId } = await auth();

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const completed = await hasCompletedOnboarding(userId);
  const pathname = req.nextUrl.pathname;

  if (completed === true && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/welcome-back", req.url));
  }

  if (completed === false) {
    if (
      pathname !== "/onboarding" &&
      !pathname.startsWith("/sign-in") &&
      !pathname.startsWith("/sign-up")
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  if (completed === true && pathname === "/welcome-back") {
    return;
  }

  if (completed === false && pathname === "/welcome-back") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

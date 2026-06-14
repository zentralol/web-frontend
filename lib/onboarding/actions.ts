"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getOnboardingPreferences,
  saveOnboardingPreferences,
} from "./queries";
import type { PreferenceFormValues, UserPreferences } from "./types";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function fetchPreferencesAction(): Promise<UserPreferences | null> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  return getOnboardingPreferences(supabase, userId);
}

export async function completeOnboardingAction(
  values: PreferenceFormValues,
): Promise<UserPreferences> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const result = await saveOnboardingPreferences(
    supabase,
    userId,
    values,
    true,
  );
  revalidatePath("/");
  revalidatePath("/onboarding");
  revalidatePath("/settings");
  revalidatePath("/welcome-back");
  return result;
}

export async function updatePreferencesAction(
  values: PreferenceFormValues,
): Promise<UserPreferences> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const existing = await getOnboardingPreferences(supabase, userId);

  if (!existing?.onboardingCompleted) {
    throw new Error("Complete onboarding before updating preferences");
  }

  const result = await saveOnboardingPreferences(
    supabase,
    userId,
    values,
    true,
  );
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/welcome-back");
  return result;
}

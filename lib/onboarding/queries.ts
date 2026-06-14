import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToPreferences, preferencesToRow } from "./mappers";
import type {
  OnboardingPreferencesRow,
  PreferenceFormValues,
  UserPreferences,
} from "./types";

export async function getOnboardingPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("onboarding_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return rowToPreferences(data as OnboardingPreferencesRow);
}

export async function saveOnboardingPreferences(
  supabase: SupabaseClient,
  userId: string,
  values: PreferenceFormValues,
  onboardingCompleted: boolean,
): Promise<UserPreferences> {
  const payload = preferencesToRow(userId, values, onboardingCompleted);

  const { data, error } = await supabase
    .from("onboarding_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return rowToPreferences(data as OnboardingPreferencesRow);
}

export async function hasCompletedOnboarding(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("onboarding_preferences")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.onboarding_completed === true;
}

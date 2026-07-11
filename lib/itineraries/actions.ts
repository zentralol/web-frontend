"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createSavedItinerary,
  listSavedItineraries,
  softDeleteSavedItinerary,
} from "./queries";
import { deriveItineraryTitle, parseSaveItineraryInput } from "./validation";
import type { SavedItinerary } from "./types";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function saveItineraryAction(
  input: unknown,
): Promise<SavedItinerary> {
  const userId = await requireUserId();
  const parsed = parseSaveItineraryInput(input);
  const title = parsed.title ?? deriveItineraryTitle(parsed.items);

  const supabase = await createServerSupabaseClient();
  const saved = await createSavedItinerary(supabase, userId, {
    ...parsed,
    title,
  });

  revalidatePath("/activity");
  return saved;
}

export async function listSavedItinerariesAction(): Promise<SavedItinerary[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  return listSavedItineraries(supabase, userId);
}

export async function deleteSavedItineraryAction(
  itineraryId: string,
): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  await softDeleteSavedItinerary(supabase, userId, itineraryId);
  revalidatePath("/activity");
}

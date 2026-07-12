"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createSavedItinerary,
  listSavedItineraries,
  softDeleteSavedItinerary,
  updateSavedItineraryNote,
  updateSavedItineraryTargetTime,
  updateSavedItineraryTitle,
} from "./queries";
import {
  deriveItineraryTitle,
  parseNoteInput,
  parseSaveItineraryInput,
  parseTargetTimeInput,
  parseTitleInput,
} from "./validation";
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

export async function updateItineraryNoteAction(
  itineraryId: string,
  note: unknown,
): Promise<void> {
  const userId = await requireUserId();
  const parsedNote = parseNoteInput(note);
  const supabase = await createServerSupabaseClient();
  await updateSavedItineraryNote(supabase, userId, itineraryId, parsedNote);
}

export async function updateItineraryTargetTimeAction(
  itineraryId: string,
  targetTime: unknown,
): Promise<void> {
  const userId = await requireUserId();
  const parsed = parseTargetTimeInput(targetTime);
  const supabase = await createServerSupabaseClient();
  await updateSavedItineraryTargetTime(supabase, userId, itineraryId, parsed);
}

export async function updateItineraryTitleAction(
  itineraryId: string,
  title: unknown,
): Promise<void> {
  const userId = await requireUserId();
  const parsedTitle = parseTitleInput(title);
  const supabase = await createServerSupabaseClient();
  await updateSavedItineraryTitle(supabase, userId, itineraryId, parsedTitle);
  revalidatePath("/activity");
}

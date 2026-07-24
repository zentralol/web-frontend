import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToSavedItinerary } from "./mappers";
import type {
  ParsedSaveItinerary,
} from "./validation";
import type { SavedItinerary, SavedItineraryRow } from "./types";
import { DEMO_ITINERARIES } from "@/lib/demo/fixtures/activity";
import { isDemoMode } from "@/lib/demo/mode";

const TABLE = "saved_itineraries";

export async function listSavedItineraries(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedItinerary[]> {
  if (await isDemoMode()) {
    return DEMO_ITINERARIES;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as SavedItineraryRow[]).map(rowToSavedItinerary);
}

export async function createSavedItinerary(
  supabase: SupabaseClient,
  userId: string,
  payload: ParsedSaveItinerary & { title: string },
): Promise<SavedItinerary> {
  if (await isDemoMode()) {
    return {
      id: `demo-itinerary-${Date.now()}`,
      title: payload.title,
      source: payload.source,
      items: payload.items,
      description: payload.description ?? null,
      note: null,
      targetTime: payload.targetTime ?? null,
      conversationId: payload.conversationId,
      createdAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      conversation_id: payload.conversationId,
      title: payload.title,
      source: payload.source,
      items: payload.items,
      description: payload.description ?? null,
      target_time: payload.targetTime ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return rowToSavedItinerary(data as SavedItineraryRow);
}

export async function softDeleteSavedItinerary(
  supabase: SupabaseClient,
  userId: string,
  itineraryId: string,
): Promise<void> {
  if (await isDemoMode()) {
    return;
  }

  await assertOwnedItinerary(supabase, userId, itineraryId);

  const { error } = await supabase
    .from(TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itineraryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function updateSavedItineraryNote(
  supabase: SupabaseClient,
  userId: string,
  itineraryId: string,
  note: string,
): Promise<void> {
  if (await isDemoMode()) {
    return;
  }

  await assertOwnedItinerary(supabase, userId, itineraryId);

  const { error } = await supabase
    .from(TABLE)
    .update({ note: note.length > 0 ? note : null })
    .eq("id", itineraryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function updateSavedItineraryTitle(
  supabase: SupabaseClient,
  userId: string,
  itineraryId: string,
  title: string,
): Promise<void> {
  if (await isDemoMode()) {
    return;
  }

  await assertOwnedItinerary(supabase, userId, itineraryId);

  const { error } = await supabase
    .from(TABLE)
    .update({ title })
    .eq("id", itineraryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

/** Ensure the itinerary exists and belongs to the user, or throw. */
async function assertOwnedItinerary(
  supabase: SupabaseClient,
  userId: string,
  itineraryId: string,
): Promise<void> {
  const { data: existing, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", itineraryId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!existing) {
    throw new Error("Itinerary not found");
  }
}

export async function updateSavedItineraryTargetTime(
  supabase: SupabaseClient,
  userId: string,
  itineraryId: string,
  targetTime: string | null,
): Promise<void> {
  if (await isDemoMode()) {
    return;
  }

  await assertOwnedItinerary(supabase, userId, itineraryId);

  const { error } = await supabase
    .from(TABLE)
    .update({ target_time: targetTime })
    .eq("id", itineraryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

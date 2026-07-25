import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToFavoritePlace } from "./mappers";
import type {
  FavoritePlace,
  FavoritePlaceRow,
  ParsedFavoritePlaceInput,
} from "./types";
import { DEMO_FAVORITES } from "@/lib/demo/fixtures/activity";
import { isDemoMode } from "@/lib/demo/mode";

const TABLE = "favorite_places";

export async function listFavoritePlaces(
  supabase: SupabaseClient,
  userId: string,
): Promise<FavoritePlace[]> {
  if (await isDemoMode()) {
    return DEMO_FAVORITES;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as FavoritePlaceRow[] | null) ?? []).map(rowToFavoritePlace);
}

export async function listFavoritePlaceKeys(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  if (await isDemoMode()) {
    return DEMO_FAVORITES.map((place) => place.placeKey);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("place_key")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data as { place_key: string }[] | null) ?? []).map(
    (row) => row.place_key,
  );
}

export async function upsertFavoritePlace(
  supabase: SupabaseClient,
  userId: string,
  place: ParsedFavoritePlaceInput,
): Promise<FavoritePlace> {
  if (await isDemoMode()) {
    return {
      id: `demo-fav-${place.placeKey}`,
      placeKey: place.placeKey,
      source: place.source,
      sourcePlaceId: place.sourcePlaceId,
      name: place.name,
      address: place.address ?? null,
      lat: place.lat,
      lng: place.lng,
      category: place.category ?? null,
      neighborhood: place.neighborhood ?? null,
      note: null,
      createdAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        place_key: place.placeKey,
        source: place.source,
        source_place_id: place.sourcePlaceId,
        name: place.name,
        address: place.address ?? null,
        latitude: place.lat,
        longitude: place.lng,
        category: place.category ?? null,
        neighborhood: place.neighborhood ?? null,
      },
      { onConflict: "user_id,place_key" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return rowToFavoritePlace(data as FavoritePlaceRow);
}

export async function deleteFavoritePlace(
  supabase: SupabaseClient,
  userId: string,
  placeKey: string,
): Promise<void> {
  if (await isDemoMode()) {
    return;
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("place_key", placeKey);

  if (error) {
    throw error;
  }
}

export async function updateFavoritePlaceNote(
  supabase: SupabaseClient,
  userId: string,
  placeKey: string,
  note: string,
): Promise<void> {
  if (await isDemoMode()) {
    return;
  }

  const { error } = await supabase
    .from(TABLE)
    .update({ note: note.length > 0 ? note : null })
    .eq("user_id", userId)
    .eq("place_key", placeKey);

  if (error) {
    throw error;
  }
}

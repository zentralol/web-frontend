"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  deleteFavoritePlace,
  listFavoritePlaces,
  upsertFavoritePlace,
} from "./queries";
import type { FavoritePlace } from "./types";
import { parseFavoritePlaceInput, parsePlaceKey } from "./validation";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function listFavoritePlacesAction(): Promise<FavoritePlace[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  return listFavoritePlaces(supabase, userId);
}

export async function addFavoritePlaceAction(
  input: unknown,
): Promise<FavoritePlace> {
  const userId = await requireUserId();
  const place = parseFavoritePlaceInput(input);
  const supabase = await createServerSupabaseClient();
  const favorite = await upsertFavoritePlace(supabase, userId, place);

  revalidatePath("/map");
  revalidatePath("/settings");
  return favorite;
}

export async function removeFavoritePlaceAction(
  input: unknown,
): Promise<void> {
  const userId = await requireUserId();
  const placeKey = parsePlaceKey(input);
  const supabase = await createServerSupabaseClient();
  await deleteFavoritePlace(supabase, userId, placeKey);

  revalidatePath("/map");
  revalidatePath("/settings");
}

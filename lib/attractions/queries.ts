import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToAttraction } from "./mappers";
import type { Attraction, AttractionRow } from "./types";

export async function listAttractions(
  supabase: SupabaseClient,
): Promise<Attraction[]> {
  const { data, error } = await supabase
    .from("attractions")
    .select("id, Name, Category, Neighborhood, Description, lat, lon")
    .order("Name");

  if (error) {
    throw error;
  }

  return (data as AttractionRow[]).map(rowToAttraction);
}

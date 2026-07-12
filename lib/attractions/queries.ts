import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToAttraction } from "./mappers";
import type {
  Attraction,
  AttractionPredictionRow,
  AttractionRow,
} from "./types";

// The prediction job writes one row per attraction per hour; a two-hour
// window always covers the newest row while keeping the result set small.
const PREDICTION_WINDOW_MS = 2 * 60 * 60 * 1000;

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

  return ((data as AttractionRow[] | null) ?? []).map(rowToAttraction);
}

/**
 * Recent crowd predictions, newest first, so the first row per attraction is
 * the latest one. Written by the backend crowd-prediction job.
 */
export async function listRecentAttractionPredictions(
  supabase: SupabaseClient,
): Promise<AttractionPredictionRow[]> {
  const windowStart = new Date(Date.now() - PREDICTION_WINDOW_MS).toISOString();

  const { data, error } = await supabase
    .from("attraction_predictions")
    .select("attraction_id, crowd_score, crowd_level, predicted_for")
    .gte("predicted_for", windowStart)
    .order("predicted_for", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as AttractionPredictionRow[] | null) ?? [];
}

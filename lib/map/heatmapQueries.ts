import type { SupabaseClient } from "@supabase/supabase-js";
import type { HeatmapPredictionRow } from "./heatmapTypes";

export async function listHeatmapPredictions(
  supabase: SupabaseClient,
  targetTime: string,
  limit = 524,
): Promise<HeatmapPredictionRow[]> {
  const { data, error } = await supabase
    .from("heatmap_predictions")
    .select(
      "h3_cell, lat, lon, period, target_time, crowd_score, crowd_level, pedestrians_pred, crowd_category, source",
    )
    .eq("target_time", targetTime)
    .order("crowd_score", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as HeatmapPredictionRow[] | null) ?? [];
}

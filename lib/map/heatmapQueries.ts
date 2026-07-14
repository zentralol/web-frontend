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

export async function listDistinctHeatmapTargetTimes(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("heatmap_predictions")
    .select("target_time");

  if (error) {
    throw error;
  }

  const rows = (data as Array<{ target_time: string }> | null) ?? [];
  return [...new Set(rows.map((row) => row.target_time))].sort();
}

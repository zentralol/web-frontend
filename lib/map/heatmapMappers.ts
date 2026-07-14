import type { HeatmapPoint } from "./fetchHeatmap";
import type { HeatmapPredictionRow } from "./heatmapTypes";

export function rowToHeatmapPoint(row: HeatmapPredictionRow): HeatmapPoint {
  return {
    h3Cell: row.h3_cell,
    coordinates: {
      lat: row.lat,
      lng: row.lon,
    },
    period: row.period ?? "",
    queryTimestamp: row.target_time,
    crowdScore: row.crowd_score,
    crowdLevel: row.crowd_level,
    pedestriansPredicted: row.pedestrians_pred ?? 0,
    crowdCategory: row.crowd_category ?? undefined,
    source: row.source,
  };
}

export function rowsToHeatmapPoints(rows: HeatmapPredictionRow[]): HeatmapPoint[] {
  return rows.map(rowToHeatmapPoint);
}

import { describe, expect, test } from "vitest";
import { rowToHeatmapPoint } from "./heatmapMappers";
import type { HeatmapPredictionRow } from "./heatmapTypes";

describe("rowToHeatmapPoint", () => {
  test("maps Supabase column names to HeatmapPoint shape", () => {
    const row: HeatmapPredictionRow = {
      h3_cell: "892a1008803ffff",
      lat: 40.7978,
      lon: -73.9748,
      period: "PM",
      target_time: "2026-07-14T10:30:00",
      crowd_score: 72,
      crowd_level: "busy",
      pedestrians_pred: 4200,
      crowd_category: "Busy",
      source: "ml_fastapi",
    };

    expect(rowToHeatmapPoint(row)).toEqual({
      h3Cell: "892a1008803ffff",
      coordinates: { lat: 40.7978, lng: -73.9748 },
      period: "PM",
      queryTimestamp: "2026-07-14T10:30:00",
      crowdScore: 72,
      crowdLevel: "busy",
      pedestriansPredicted: 4200,
      crowdCategory: "Busy",
      source: "ml_fastapi",
    });
  });

  test("fills defaults for nullable columns", () => {
    const row: HeatmapPredictionRow = {
      h3_cell: "892a1008807ffff",
      lat: 40.7952,
      lon: -73.9725,
      period: null,
      target_time: "2026-07-14T11:30:00",
      crowd_score: 40,
      crowd_level: "moderate",
      pedestrians_pred: null,
      crowd_category: null,
      source: "ml_fastapi",
    };

    expect(rowToHeatmapPoint(row)).toEqual({
      h3Cell: "892a1008807ffff",
      coordinates: { lat: 40.7952, lng: -73.9725 },
      period: "",
      queryTimestamp: "2026-07-14T11:30:00",
      crowdScore: 40,
      crowdLevel: "moderate",
      pedestriansPredicted: 0,
      source: "ml_fastapi",
    });
  });
});

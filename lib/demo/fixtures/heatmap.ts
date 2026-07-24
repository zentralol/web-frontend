import type { HeatmapPoint } from "@/lib/map/fetchHeatmap";

const CELLS: Array<{
  h3Cell: string;
  lat: number;
  lng: number;
  score: number;
  level: string;
}> = [
  { h3Cell: "892a1008803ffff", lat: 40.758, lng: -73.9855, score: 0.82, level: "very_busy" },
  { h3Cell: "892a1008807ffff", lat: 40.7527, lng: -73.9772, score: 0.71, level: "busy" },
  { h3Cell: "892a100d2c3ffff", lat: 40.7484, lng: -73.9857, score: 0.68, level: "busy" },
  { h3Cell: "892a100d6d3ffff", lat: 40.7308, lng: -73.9973, score: 0.44, level: "moderate" },
  { h3Cell: "892a100d2c7ffff", lat: 40.7411, lng: -74.0048, score: 0.55, level: "moderate" },
  { h3Cell: "892a1072c27ffff", lat: 40.7829, lng: -73.9654, score: 0.61, level: "busy" },
  { h3Cell: "892a1072c23ffff", lat: 40.7794, lng: -73.9632, score: 0.48, level: "moderate" },
  { h3Cell: "892a100d657ffff", lat: 40.7265, lng: -74.002, score: 0.36, level: "quiet" },
  { h3Cell: "892a100d64bffff", lat: 40.7359, lng: -74.0027, score: 0.33, level: "quiet" },
  { h3Cell: "892a1072893ffff", lat: 40.7614, lng: -73.9776, score: 0.77, level: "busy" },
  { h3Cell: "892a1008c17ffff", lat: 40.7061, lng: -73.9969, score: 0.64, level: "busy" },
  { h3Cell: "892a1072cdbffff", lat: 40.7813, lng: -73.974, score: 0.42, level: "moderate" },
];

export function buildDemoHeatmapPoints(targetTime: string): HeatmapPoint[] {
  return CELLS.map((cell) => ({
    h3Cell: cell.h3Cell,
    coordinates: { lat: cell.lat, lng: cell.lng },
    period: "hour",
    queryTimestamp: targetTime,
    crowdScore: cell.score,
    crowdLevel: cell.level,
    pedestriansPredicted: Math.round(cell.score * 400),
    crowdCategory: cell.level,
    source: "demo",
  }));
}

export function demoHeatmapResponse(targetTime: string) {
  return {
    targetTime,
    resolvedTargetTime: targetTime,
    source: "demo",
    points: buildDemoHeatmapPoints(targetTime),
  };
}

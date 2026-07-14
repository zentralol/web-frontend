export const HEATMAP_LIMIT = 524;

export type HeatmapPoint = {
  h3Cell: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  period: string;
  queryTimestamp: string;
  crowdScore: number;
  crowdLevel: string;
  pedestriansPredicted: number;
  poiTotal?: number;
  crowdCategory?: string;
  source: string;
};

type HeatmapResponse = {
  targetTime?: string;
  source?: string;
  points?: HeatmapPoint[];
  error?: string;
};

export type HeatmapData = {
  targetTime: string;
  source: string;
  points: HeatmapPoint[];
};

export async function fetchHeatmap(targetTime: string): Promise<HeatmapData> {
  const params = new URLSearchParams({
    limit: String(HEATMAP_LIMIT),
    targetTime,
  });
  const response = await fetch(`/api/map/heatmap?${params.toString()}`);

  const payload = (await response.json()) as HeatmapResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load crowd heatmap.");
  }

  if (!Array.isArray(payload.points)) {
    throw new Error(payload.error ?? "Could not load crowd heatmap.");
  }

  return {
    targetTime: payload.targetTime ?? targetTime,
    source: payload.source ?? "heatmap_predictions",
    points: payload.points,
  };
}

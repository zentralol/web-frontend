import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import {
  backendBaseUrl,
  buildApiUrl,
  normalizeBaseUrl,
  parseApiError,
} from "@/lib/activity/predictionApi";

export const HEATMAP_LIMIT = 524;
export const HEATMAP_SOURCE = "auto";

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

type HeatmapPayload = {
  success?: boolean;
  data?: {
    targetTime?: string;
    source?: string;
    points?: HeatmapPoint[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

export type HeatmapData = {
  targetTime: string;
  source: string;
  points: HeatmapPoint[];
};

export async function fetchHeatmap(
  targetTime: string,
  backendFetch: FetchLike,
  baseUrl: string = backendBaseUrl,
): Promise<HeatmapData> {
  const params = new URLSearchParams({
    limit: String(HEATMAP_LIMIT),
    source: HEATMAP_SOURCE,
    targetTime,
  });
  const url = buildApiUrl(
    normalizeBaseUrl(baseUrl),
    `/map/heatmap?${params.toString()}`,
  );

  const response = await backendFetch(url);
  const payload = (await response.json()) as HeatmapPayload;

  if (!response.ok || !payload.success) {
    throw new Error(
      parseApiError(payload, "Could not load crowd heatmap."),
    );
  }

  return {
    targetTime: payload.data?.targetTime ?? targetTime,
    source: payload.data?.source ?? HEATMAP_SOURCE,
    points: payload.data?.points ?? [],
  };
}

import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import { toForecastTimeLabel } from "@/lib/map/fetchPredictions";
import {
  addHoursInNewYork,
  formatInNewYork,
} from "@/lib/time/manhattanTime";
import {
  backendBaseUrl,
  buildApiUrl,
  normalizeBaseUrl,
} from "./predictionApi";

export const FORECAST_HOURS = 8;
export const FORECAST_LIMIT = 8;

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: string; message?: string };
};

type PredictionPayload = {
  success?: boolean;
  data?: {
    prediction?: {
      targetTime?: string;
      busynessScore?: number;
      busynessLevel?: string;
      period?: string;
      confidence?: number;
    };
  };
};

export type ForecastPoint = {
  timestamp: string;
  rawTimestamp: string;
  score: number;
  level: string;
};

export type CrowdForecastResult = {
  current?: {
    score: number;
    level: string;
    period?: string;
    confidence?: number;
  };
  forecast: ForecastPoint[];
  error?: string;
};

/** Hourly Manhattan target times from `start` for `pointCount` slots (0 … pointCount-1 hours). */
export function buildHourlyForecastTargetTimes(
  start: Date,
  pointCount: number,
): string[] {
  return Array.from({ length: pointCount }, (_, index) =>
    formatInNewYork(addHoursInNewYork(start, index)),
  );
}

async function fetchPredictionAtTime(
  lat: number,
  lng: number,
  targetTime: string,
  backendFetch: FetchLike,
  baseUrl: string,
): Promise<{
  targetTime: string;
  score: number;
  level: string;
  period?: string;
  confidence?: number;
} | null> {
  const response = await backendFetch(buildApiUrl(baseUrl, "/predictions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat,
      lng,
      targetTime,
      durationMinutes: 60,
    }),
  });

  const payload = (await response.json()) as PredictionPayload | ApiErrorPayload;

  if (!response.ok) {
    return null;
  }

  const prediction = (payload as PredictionPayload).data?.prediction;
  if (
    prediction?.busynessScore == null ||
    !prediction.busynessLevel
  ) {
    return null;
  }

  return {
    targetTime: prediction.targetTime ?? targetTime,
    score: prediction.busynessScore,
    level: prediction.busynessLevel,
    period: prediction.period,
    confidence: prediction.confidence,
  };
}

export async function fetchCrowdForecast(
  lat: number,
  lng: number,
  backendFetch: FetchLike,
): Promise<CrowdForecastResult> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const now = new Date();
    const targetTimes = buildHourlyForecastTargetTimes(now, FORECAST_LIMIT);

    const results = await Promise.all(
      targetTimes.map((targetTime) =>
        fetchPredictionAtTime(lat, lng, targetTime, backendFetch, baseUrl),
      ),
    );

    const successful = results.filter(
      (item): item is NonNullable<typeof item> => item != null,
    );

    if (successful.length === 0) {
      return {
        forecast: [],
        error: "Could not load crowd forecast.",
      };
    }

    const forecast: ForecastPoint[] = successful.map((item) => ({
      rawTimestamp: item.targetTime,
      timestamp: toForecastTimeLabel(item.targetTime),
      score: item.score,
      level: item.level,
    }));

    const first = successful[0];

    return {
      current: {
        score: first.score,
        level: first.level,
        period: first.period,
        confidence: first.confidence,
      },
      forecast,
      error:
        successful.length < FORECAST_LIMIT
          ? "Some forecast windows could not be loaded."
          : undefined,
    };
  } catch {
    return {
      forecast: [],
      error: "Could not load crowd forecast.",
    };
  }
}

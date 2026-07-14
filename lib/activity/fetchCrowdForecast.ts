import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import {
  fetchCurrentBusyness,
  fetchForecastSeries,
  toForecastTimeLabel,
  type ForecastPoint,
} from "@/lib/map/fetchPredictions";
import { formatInNewYork } from "@/lib/time/manhattanTime";
import { parseApiError } from "./predictionApi";

const CROWD_FORECAST_FALLBACK_ERROR = "Could not load crowd forecast.";
const CROWD_FORECAST_MANHATTAN_ERROR =
  "Crowd forecast is only available in Manhattan.";

export const FORECAST_HOURS = 8;
export const FORECAST_LIMIT = 8;

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: string; message?: string };
};

export type { ForecastPoint };

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

function crowdForecastErrorFromPayload(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    (payload as ApiErrorPayload).error?.code === "LOCATION_OUT_OF_COVERAGE"
  ) {
    return CROWD_FORECAST_MANHATTAN_ERROR;
  }
  return parseApiError(payload, CROWD_FORECAST_FALLBACK_ERROR);
}

export async function fetchCrowdForecast(
  lat: number,
  lng: number,
  backendFetch: FetchLike,
): Promise<CrowdForecastResult> {
  try {
    const currentResult = await fetchCurrentBusyness(lat, lng, backendFetch);

    if (!currentResult.ok) {
      if (
        crowdForecastErrorFromPayload(currentResult.errorPayload) ===
        CROWD_FORECAST_MANHATTAN_ERROR
      ) {
        return {
          forecast: [],
          error: CROWD_FORECAST_MANHATTAN_ERROR,
        };
      }

      const forecastOnly = await fetchForecastSeries(
        lat,
        lng,
        FORECAST_LIMIT,
        backendFetch,
      );

      if (!forecastOnly.ok) {
        return {
          forecast: [],
          error: crowdForecastErrorFromPayload(currentResult.errorPayload),
        };
      }

      const forecast = forecastOnly.forecast ?? [];
      return {
        forecast,
        error:
          forecast.length < FORECAST_LIMIT
            ? "Some forecast windows could not be loaded."
            : undefined,
      };
    }

    const forecastResult = await fetchForecastSeries(
      lat,
      lng,
      FORECAST_LIMIT - 1,
      backendFetch,
    );

    const nowRaw = formatInNewYork(new Date());
    const nowPoint: ForecastPoint = {
      rawTimestamp: nowRaw,
      timestamp: toForecastTimeLabel(nowRaw),
      score: currentResult.busyness!.score,
      level: currentResult.busyness!.level,
    };

    const futurePoints = forecastResult.forecast ?? [];
    const forecast = [nowPoint, ...futurePoints].slice(0, FORECAST_LIMIT);

    return {
      current: currentResult.busyness,
      forecast,
      error: !forecastResult.ok
        ? parseApiError(
            forecastResult.errorPayload,
            "Some forecast windows could not be loaded.",
          )
        : forecast.length < FORECAST_LIMIT
          ? "Some forecast windows could not be loaded."
          : undefined,
    };
  } catch {
    return {
      forecast: [],
      error: CROWD_FORECAST_FALLBACK_ERROR,
    };
  }
}

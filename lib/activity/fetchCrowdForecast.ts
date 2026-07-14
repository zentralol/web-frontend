import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import {
  fetchCurrentBusyness,
  fetchForecastSeries,
  type ForecastPoint,
} from "@/lib/map/fetchPredictions";
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
    const [currentResult, forecastResult] = await Promise.all([
      fetchCurrentBusyness(lat, lng, backendFetch),
      fetchForecastSeries(lat, lng, FORECAST_LIMIT, backendFetch),
    ]);

    if (!currentResult.ok && !forecastResult.ok) {
      return {
        forecast: [],
        error: crowdForecastErrorFromPayload(currentResult.errorPayload),
      };
    }

    const forecast = forecastResult.forecast ?? [];

    return {
      current: currentResult.ok ? currentResult.busyness : undefined,
      forecast,
      error:
        !currentResult.ok
          ? crowdForecastErrorFromPayload(currentResult.errorPayload)
          : !forecastResult.ok
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

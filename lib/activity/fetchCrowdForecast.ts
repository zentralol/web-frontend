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
  parseApiError,
} from "./predictionApi";

export const FORECAST_HOURS = 8;
export const FORECAST_LIMIT = 8;

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: string; message?: string };
};

type CurrentPredictionPayload = {
  success?: boolean;
  data?: {
    prediction?: {
      busynessScore?: number;
      busynessLevel?: string;
      period?: string;
      confidence?: number;
    };
  };
};

type ForecastPayload = {
  success?: boolean;
  data?: {
    forecast?: Array<{
      timestamp?: string;
      busynessScore?: number;
      busynessLevel?: string;
    }>;
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

export async function fetchCrowdForecast(
  lat: number,
  lng: number,
  backendFetch: FetchLike,
): Promise<CrowdForecastResult> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const now = new Date();
    const end = addHoursInNewYork(now, FORECAST_HOURS);

    const targetTime = formatInNewYork(now);
    const startTime = targetTime;
    const endTime = formatInNewYork(end);

    const currentPromise = backendFetch(buildApiUrl(baseUrl, "/predictions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat,
        lng,
        targetTime,
        durationMinutes: 60,
      }),
    });

    const forecastUrl = new URL(buildApiUrl(baseUrl, "/predictions/forecast"));
    forecastUrl.searchParams.set("lat", String(lat));
    forecastUrl.searchParams.set("lng", String(lng));
    forecastUrl.searchParams.set("startTime", startTime);
    forecastUrl.searchParams.set("endTime", endTime);
    forecastUrl.searchParams.set("limit", String(FORECAST_LIMIT));

    const forecastPromise = backendFetch(forecastUrl.toString());

    const [currentResponse, forecastResponse] = await Promise.all([
      currentPromise,
      forecastPromise,
    ]);

    const currentPayload = (await currentResponse.json()) as
      | CurrentPredictionPayload
      | ApiErrorPayload;
    const forecastPayload = (await forecastResponse.json()) as
      | ForecastPayload
      | ApiErrorPayload;

    const hasCurrent =
      currentResponse.ok &&
      (currentPayload as CurrentPredictionPayload).data?.prediction
        ?.busynessScore != null &&
      (currentPayload as CurrentPredictionPayload).data?.prediction
        ?.busynessLevel != null;

    const hasForecast =
      forecastResponse.ok &&
      Array.isArray((forecastPayload as ForecastPayload).data?.forecast);

    if (!hasCurrent && !hasForecast) {
      return {
        forecast: [],
        error: parseApiError(
          currentPayload,
          parseApiError(forecastPayload, "Could not load crowd forecast."),
        ),
      };
    }

    const current = (currentPayload as CurrentPredictionPayload).data?.prediction;
    const forecastItems =
      (forecastPayload as ForecastPayload).data?.forecast ?? [];

    return {
      current:
        hasCurrent && current?.busynessScore != null && current.busynessLevel
          ? {
              score: current.busynessScore,
              level: current.busynessLevel,
              period: current.period,
              confidence: current.confidence,
            }
          : undefined,
      forecast: hasForecast
        ? forecastItems
            .filter(
              (item) =>
                item.timestamp != null &&
                item.busynessScore != null &&
                item.busynessLevel != null,
            )
            .map((item) => ({
              rawTimestamp: item.timestamp as string,
              timestamp: toForecastTimeLabel(item.timestamp as string),
              score: item.busynessScore as number,
              level: item.busynessLevel as string,
            }))
        : [],
      error:
        !hasCurrent || !hasForecast
          ? !currentResponse.ok
            ? parseApiError(currentPayload, "Could not load current busyness.")
            : parseApiError(forecastPayload, "Could not load forecast data.")
          : undefined,
    };
  } catch {
    return {
      forecast: [],
      error: "Could not load crowd forecast.",
    };
  }
}

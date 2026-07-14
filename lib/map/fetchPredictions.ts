import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import {
  backendBaseUrl,
  buildApiUrl,
  normalizeBaseUrl,
  parseApiError,
} from "@/lib/activity/predictionApi";
import { formatInNewYork } from "@/lib/time/manhattanTime";

type ApiErrorPayload = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
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
  rawTimestamp: string;
  timestamp: string;
  score: number;
  level: string;
};

export type BusynessData = {
  busyness?: {
    score: number;
    level: string;
    period?: string;
    confidence?: number;
  };
  forecast?: ForecastPoint[];
  busynessError?: string;
};

const NAIVE_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/;

export const MAP_MAX_FUTURE_HOURS = 8;
export const MAP_FORECAST_HOURS = 6;

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export type FutureHourOption = {
  hoursAhead: number;
  targetTime: string;
  label: string;
};

export function buildFutureHourOptions(now: Date = new Date()): FutureHourOption[] {
  return Array.from({ length: MAP_MAX_FUTURE_HOURS }, (_, index) => {
    const hoursAhead = index + 1;
    const targetTime = formatInNewYork(addHours(now, hoursAhead));
    const timeLabel = toForecastTimeLabel(targetTime);
    return {
      hoursAhead,
      targetTime,
      label: `In ${hoursAhead} hour${hoursAhead === 1 ? "" : "s"} · ${timeLabel}`,
    };
  });
}

export function toForecastTimeLabel(isoLikeValue: string): string {
  // API convention: date-time digits are Manhattan wall-clock time; a trailing
  // "Z" is a serialization artifact. Parsing with `new Date()` would reinterpret
  // the digits in the viewer's local timezone, so read them directly instead.
  const match = isoLikeValue.match(NAIVE_DATE_TIME_PATTERN);
  if (!match) {
    return isoLikeValue;
  }
  const hour = Number(match[1]);
  const minute = match[2];
  if (hour > 23) {
    return isoLikeValue;
  }
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${suffix}`;
}

function mapForecastItems(
  items: NonNullable<ForecastPayload["data"]>["forecast"],
): ForecastPoint[] {
  return (items ?? [])
    .filter(
      (item) =>
        item.timestamp != null &&
        item.busynessScore != null &&
        item.busynessLevel != null,
    )
    .map((item) => {
      const rawTimestamp = item.timestamp as string;
      return {
        rawTimestamp,
        timestamp: toForecastTimeLabel(rawTimestamp),
        score: item.busynessScore as number,
        level: item.busynessLevel as string,
      };
    });
}

export async function fetchCurrentBusyness(
  lat: number,
  lng: number,
  backendFetch: FetchLike,
): Promise<{
  busyness?: BusynessData["busyness"];
  errorPayload?: unknown;
  ok: boolean;
}> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const targetTime = formatInNewYork(new Date());

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

    const payload = (await response.json()) as
      | CurrentPredictionPayload
      | ApiErrorPayload;

    const prediction = (payload as CurrentPredictionPayload).data?.prediction;
    const hasPrediction =
      response.ok &&
      prediction?.busynessScore != null &&
      prediction.busynessLevel != null;

    if (!hasPrediction) {
      return { ok: false, errorPayload: payload };
    }

    return {
      ok: true,
      busyness: {
        score: prediction.busynessScore as number,
        level: prediction.busynessLevel as string,
        period: prediction.period,
        confidence: prediction.confidence,
      },
    };
  } catch {
    return { ok: false };
  }
}

export async function fetchForecastSeries(
  lat: number,
  lng: number,
  hours: number,
  backendFetch: FetchLike,
): Promise<{ forecast?: ForecastPoint[]; errorPayload?: unknown; ok: boolean }> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const now = new Date();
    const end = addHours(now, hours);
    const startTime = formatInNewYork(now);
    const endTime = formatInNewYork(end);

    const forecastUrl = new URL(buildApiUrl(baseUrl, "/predictions/forecast"));
    forecastUrl.searchParams.set("lat", String(lat));
    forecastUrl.searchParams.set("lng", String(lng));
    forecastUrl.searchParams.set("startTime", startTime);
    forecastUrl.searchParams.set("endTime", endTime);
    forecastUrl.searchParams.set("limit", String(hours));

    const response = await backendFetch(forecastUrl.toString());
    const payload = (await response.json()) as ForecastPayload | ApiErrorPayload;

    const hasForecast =
      response.ok &&
      Array.isArray((payload as ForecastPayload).data?.forecast);

    if (!hasForecast) {
      return { ok: false, errorPayload: payload };
    }

    return {
      ok: true,
      forecast: mapForecastItems(
        (payload as ForecastPayload).data?.forecast,
      ),
    };
  } catch {
    return { ok: false };
  }
}

export async function fetchBusynessData(
  lat: number,
  lng: number,
  backendFetch: FetchLike,
): Promise<BusynessData> {
  try {
    const [currentResult, forecastResult] = await Promise.all([
      fetchCurrentBusyness(lat, lng, backendFetch),
      fetchForecastSeries(lat, lng, MAP_FORECAST_HOURS, backendFetch),
    ]);

    if (!currentResult.ok && !forecastResult.ok) {
      return {
        busynessError: parseApiError(
          currentResult.errorPayload,
          parseApiError(
            forecastResult.errorPayload,
            "Could not load busyness predictions.",
          ),
        ),
      };
    }

    return {
      busyness: currentResult.ok ? currentResult.busyness : undefined,
      forecast: forecastResult.ok ? forecastResult.forecast : undefined,
      busynessError:
        !currentResult.ok || !forecastResult.ok
          ? !currentResult.ok
            ? parseApiError(
                currentResult.errorPayload,
                "Could not load current busyness.",
              )
            : parseApiError(
                forecastResult.errorPayload,
                "Could not load forecast data.",
              )
          : undefined,
    };
  } catch {
    return { busynessError: "Could not load busyness predictions." };
  }
}

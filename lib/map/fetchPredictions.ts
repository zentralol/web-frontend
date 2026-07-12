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

export type BusynessData = {
  busyness?: {
    score: number;
    level: string;
    period?: string;
    confidence?: number;
  };
  forecast?: Array<{
    timestamp: string;
    score: number;
    level: string;
  }>;
  busynessError?: string;
};

const NAIVE_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/;

export const MAP_MAX_FUTURE_HOURS = 8;

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

export async function fetchBusynessAtTime(
  lat: number,
  lng: number,
  hoursAhead: number,
  backendFetch: FetchLike,
): Promise<BusynessData> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const targetTime = formatInNewYork(addHours(new Date(), hoursAhead));

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
      return {
        busynessError: parseApiError(
          payload,
          "Could not load busyness prediction.",
        ),
      };
    }

    return {
      busyness: {
        score: prediction.busynessScore as number,
        level: prediction.busynessLevel as string,
        period: prediction.period,
        confidence: prediction.confidence,
      },
    };
  } catch {
    return { busynessError: "Could not load busyness prediction." };
  }
}

export async function fetchBusynessData(
  lat: number,
  lng: number,
  backendFetch: FetchLike,
): Promise<BusynessData> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const now = new Date();
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const targetTime = formatInNewYork(now);
    const startTime = targetTime;
    const endTime = formatInNewYork(sixHoursLater);

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
    forecastUrl.searchParams.set("limit", "6");

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

    const hasCurrentPrediction =
      currentResponse.ok &&
      (currentPayload as CurrentPredictionPayload).data?.prediction
        ?.busynessScore != null &&
      (currentPayload as CurrentPredictionPayload).data?.prediction
        ?.busynessLevel != null;

    const hasForecast =
      forecastResponse.ok &&
      Array.isArray((forecastPayload as ForecastPayload).data?.forecast);

    if (!hasCurrentPrediction && !hasForecast) {
      return {
        busynessError: parseApiError(
          currentPayload,
          parseApiError(forecastPayload, "Could not load busyness predictions."),
        ),
      };
    }

    const current = (currentPayload as CurrentPredictionPayload).data?.prediction;
    const forecastItems = (forecastPayload as ForecastPayload).data?.forecast ?? [];

    return {
      busyness:
        hasCurrentPrediction &&
        current?.busynessScore != null &&
        current.busynessLevel
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
              timestamp: toForecastTimeLabel(item.timestamp as string),
              score: item.busynessScore as number,
              level: item.busynessLevel as string,
            }))
        : undefined,
      busynessError:
        !hasCurrentPrediction || !hasForecast
          ? !currentResponse.ok
            ? parseApiError(currentPayload, "Could not load current busyness.")
            : parseApiError(forecastPayload, "Could not load forecast data.")
          : undefined,
    };
  } catch {
    return { busynessError: "Could not load busyness predictions." };
  }
}

const DEFAULT_BACKEND_BASE_URL = "http://localhost:3000";
const API_PREFIX = "/api/v1";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? DEFAULT_BACKEND_BASE_URL;

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

function formatInNewYork(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  const second = parts.find((part) => part.type === "second")?.value;

  if (!year || !month || !day || !hour || !minute || !second) {
    throw new Error("Failed to format time in America/New_York");
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function parseApiError(payload: unknown, fallbackMessage: string): string {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }
  const maybeError = (payload as ApiErrorPayload).error;
  if (!maybeError) {
    return fallbackMessage;
  }
  if (maybeError.code === "LOCATION_OUT_OF_COVERAGE") {
    return "Predictions are currently available for Manhattan only.";
  }
  return maybeError.message ?? fallbackMessage;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function buildApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${API_PREFIX}${path}`;
}

function toForecastTimeLabel(isoLikeValue: string): string {
  const timestamp = new Date(isoLikeValue);
  if (Number.isNaN(timestamp.getTime())) {
    return isoLikeValue;
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return formatter.format(timestamp);
}

export async function fetchBusynessData(
  lat: number,
  lng: number,
): Promise<BusynessData> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const now = new Date();
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const targetTime = formatInNewYork(now);
    const startTime = targetTime;
    const endTime = formatInNewYork(sixHoursLater);

    const currentPromise = fetch(buildApiUrl(baseUrl, "/predictions"), {
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

    const forecastPromise = fetch(forecastUrl.toString());

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
